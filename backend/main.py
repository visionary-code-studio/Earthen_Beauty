import os
import json
import secrets
import shutil
from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr

from backend.database import get_db, init_db, hash_password, verify_password
from backend.auth import create_token, get_current_user, get_current_admin
from backend.razorpay_client import create_razorpay_order, verify_razorpay_signature
from backend.shiprocket_client import create_shiprocket_order

# Initialize database schema and initial admin
init_db()

app = FastAPI(
    title="Earthen Beauty API",
    description="Backend API for Earthen Beauty by Nupur: Customer Auth, Storefront, Admin Panel, Razorpay & Shiprocket",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "images", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ==========================================
# PYDANTIC SCHEMAS
# ==========================================
class CustomerRegisterReq(BaseModel):
    name: str
    email: str
    phone: str
    password: str


class CustomerLoginReq(BaseModel):
    email: str
    password: str


class AdminLoginReq(BaseModel):
    email: str
    password: str


class CreateRazorpayOrderReq(BaseModel):
    items: list
    subtotal: float
    shipping_fee: float = 90.0
    total_amount: float
    order_type: str = "standard_cart"
    shipping_address: dict
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None


class VerifyPaymentReq(BaseModel):
    order_number: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class ProductCreateReq(BaseModel):
    name: str
    category: str
    subcategory: str = ""
    price: float
    image: str
    description: str = ""
    in_stock: int = 1


class ProductUpdateReq(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    price: Optional[float] = None
    image: Optional[str] = None
    description: Optional[str] = None
    in_stock: Optional[int] = None


class AdminAddReq(BaseModel):
    name: str
    email: str
    password: str
    role: str = "admin"


# ==========================================
# SYSTEM & HEALTH ENDPOINTS
# ==========================================
@app.get("/api/health")
def health():
    return {"status": "healthy", "service": "Earthen Beauty Backend", "database": "connected"}


# ==========================================
# PRODUCTS & CATALOG (PUBLIC STOREFRONT)
# ==========================================
@app.get("/api/products")
def get_products(category: Optional[str] = None, in_stock_only: bool = True):
    conn = get_db()
    cursor = conn.cursor()
    query = "SELECT * FROM products WHERE 1=1"
    params = []
    if in_stock_only:
        query += " AND in_stock = 1"
    if category and category != "all":
        query += " AND category = ?"
        params.append(category)

    query += " ORDER BY id ASC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    prods = [dict(r) for r in rows]
    return {"success": True, "count": len(prods), "products": prods}


@app.get("/api/products/{product_id}")
def get_product_by_id(product_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM products WHERE id = ?", (product_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Product not found")
    return dict(row)


# ==========================================
# CUSTOMER AUTHENTICATION
# ==========================================
@app.post("/api/auth/register")
def register_customer(req: CustomerRegisterReq):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM users WHERE email = ?", (req.email.lower().strip(),))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    hashed_pw = hash_password(req.password)
    cursor.execute("""
        INSERT INTO users (name, email, phone, password_hash)
        VALUES (?, ?, ?, ?)
    """, (req.name.strip(), req.email.lower().strip(), req.phone.strip(), hashed_pw))
    conn.commit()
    user_id = cursor.lastrowid
    conn.close()

    token = create_token({"user_id": user_id, "email": req.email.lower().strip(), "role": "customer"})
    return {
        "success": True,
        "token": token,
        "user": {
            "id": user_id,
            "name": req.name.strip(),
            "email": req.email.lower().strip(),
            "phone": req.phone.strip()
        }
    }


@app.post("/api/auth/login")
def login_customer(req: CustomerLoginReq):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (req.email.lower().strip(),))
    user = cursor.fetchone()
    conn.close()

    if not user or not verify_password(user["password_hash"], req.password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_token({"user_id": user["id"], "email": user["email"], "role": "customer"})
    return {
        "success": True,
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "phone": user["phone"]
        }
    }


@app.get("/api/auth/me")
def get_customer_profile(current_user: dict = Depends(get_current_user)):
    return {"success": True, "user": current_user}


# ==========================================
# PAYMENTS (RAZORPAY) & ORDERS
# ==========================================
@app.post("/api/razorpay/create-order")
def create_payment_order(req: CreateRazorpayOrderReq):
    conn = get_db()
    cursor = conn.cursor()

    # Generate Order Number: EB-YYYYMMDD-XXXX
    import datetime
    now_str = datetime.datetime.now().strftime("%Y%m%d")
    order_number = f"EB-{now_str}-{secrets.token_hex(2).upper()}"

    # Create Razorpay Order
    rzp_res = create_razorpay_order(
        amount_rupees=req.total_amount,
        receipt_id=order_number,
        notes={"order_number": order_number, "order_type": req.order_type}
    )

    # Save pending order to SQLite
    cursor.execute("""
        INSERT INTO orders (
            order_number, customer_name, customer_email, customer_phone,
            order_type, items_json, subtotal, shipping_fee, total_amount,
            shipping_address, payment_status, razorpay_order_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    """, (
        order_number,
        req.customer_name or "Guest Customer",
        req.customer_email or "guest@earthenbeauty.com",
        req.customer_phone or "",
        req.order_type,
        json.dumps(req.items),
        req.subtotal,
        req.shipping_fee,
        req.total_amount,
        json.dumps(req.shipping_address),
        rzp_res.get("id", "")
    ))
    conn.commit()
    conn.close()

    return {
        "success": True,
        "order_number": order_number,
        "razorpay_order_id": rzp_res.get("id"),
        "amount": rzp_res.get("amount"),
        "currency": rzp_res.get("currency", "INR"),
        "key_id": rzp_res.get("key_id"),
        "is_demo": rzp_res.get("is_demo", False)
    }


@app.post("/api/razorpay/verify-payment")
def verify_payment(req: VerifyPaymentReq):
    # Verify cryptographic signature
    is_valid = verify_razorpay_signature(
        req.razorpay_order_id,
        req.razorpay_payment_id,
        req.razorpay_signature
    )

    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid payment signature verification.")

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM orders WHERE order_number = ?", (req.order_number,))
    order = cursor.fetchone()
    if not order:
        conn.close()
        raise HTTPException(status_code=404, detail="Order not found.")

    # Call Shiprocket to automatically create dispatch order
    order_dict = dict(order)
    order_dict["items"] = json.loads(order_dict["items_json"])
    order_dict["shipping_address"] = json.loads(order_dict["shipping_address"])
    
    sr_res = create_shiprocket_order(order_dict)

    # Update database with payment and shipment info
    cursor.execute("""
        UPDATE orders
        SET payment_status = 'paid',
            razorpay_payment_id = ?,
            shiprocket_order_id = ?,
            shipment_status = ?,
            tracking_number = ?
        WHERE order_number = ?
    """, (
        req.razorpay_payment_id,
        sr_res.get("shiprocket_order_id", ""),
        sr_res.get("status", "Processing"),
        sr_res.get("tracking_number", ""),
        req.order_number
    ))
    conn.commit()
    conn.close()

    return {
        "success": True,
        "message": "Payment verified successfully and shipment initialized.",
        "order_number": req.order_number,
        "shipment": sr_res
    }


@app.get("/api/orders/my-orders")
def get_customer_orders(current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM orders
        WHERE customer_email = ? OR user_id = ?
        ORDER BY id DESC
    """, (current_user["email"], current_user["id"]))
    orders = cursor.fetchall()
    conn.close()

    res = []
    for o in orders:
        d = dict(o)
        d["items"] = json.loads(d["items_json"])
        d["shipping_address"] = json.loads(d["shipping_address"])
        res.append(d)
    return {"success": True, "orders": res}


# ==========================================
# ADMIN PORTAL ENDPOINTS
# ==========================================
@app.post("/api/admin/login")
def login_admin(req: AdminLoginReq):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM admins WHERE email = ?", (req.email.lower().strip(),))
    admin = cursor.fetchone()
    conn.close()

    if not admin or not verify_password(admin["password_hash"], req.password):
        raise HTTPException(status_code=401, detail="Invalid admin credentials.")

    token = create_token({"admin_id": admin["id"], "email": admin["email"], "role": "admin"})
    return {
        "success": True,
        "token": token,
        "admin": {
            "id": admin["id"],
            "name": admin["name"],
            "email": admin["email"],
            "role": admin["role"]
        }
    }


@app.get("/api/admin/me")
def get_admin_profile(admin: dict = Depends(get_current_admin)):
    return {"success": True, "admin": admin}


@app.get("/api/admin/dashboard")
@app.get("/api/admin/dashboard-stats")
def get_dashboard_stats(admin: dict = Depends(get_current_admin)):
    conn = get_db()
    cursor = conn.cursor()

    # Total revenue (paid orders)
    cursor.execute("SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE payment_status = 'paid'")
    total_revenue = cursor.fetchone()[0]

    # Total orders
    cursor.execute("SELECT COUNT(*) FROM orders")
    total_orders = cursor.fetchone()[0]

    # Paid orders
    cursor.execute("SELECT COUNT(*) FROM orders WHERE payment_status = 'paid'")
    paid_orders = cursor.fetchone()[0]

    # Total active products
    cursor.execute("SELECT COUNT(*) FROM products WHERE in_stock = 1")
    active_products = cursor.fetchone()[0]

    # Total registered customers
    cursor.execute("SELECT COUNT(*) FROM users")
    total_customers = cursor.fetchone()[0]

    # Recent 5 orders
    cursor.execute("SELECT * FROM orders ORDER BY id DESC LIMIT 5")
    recent_orders = [dict(r) for r in cursor.fetchall()]

    conn.close()

    return {
        "success": True,
        "stats": {
            "total_revenue": round(total_revenue, 2),
            "total_orders": total_orders,
            "paid_orders": paid_orders,
            "active_products": active_products,
            "total_customers": total_customers
        },
        "recent_orders": recent_orders
    }


@app.get("/api/admin/products")
def get_admin_products(admin: dict = Depends(get_current_admin)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM products ORDER BY id DESC")
    products = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return {"success": True, "products": products}


@app.post("/api/admin/products")
def add_admin_product(req: ProductCreateReq, admin: dict = Depends(get_current_admin)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO products (name, category, subcategory, price, image, description, in_stock)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (req.name, req.category, req.subcategory, req.price, req.image, req.description, req.in_stock))
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return {"success": True, "id": new_id, "message": "Product added successfully."}


@app.put("/api/admin/products/{product_id}")
def update_admin_product(product_id: int, req: ProductUpdateReq, admin: dict = Depends(get_current_admin)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM products WHERE id = ?", (product_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Product not found")

    fields = []
    params = []
    if req.name is not None:
        fields.append("name = ?")
        params.append(req.name)
    if req.category is not None:
        fields.append("category = ?")
        params.append(req.category)
    if req.subcategory is not None:
        fields.append("subcategory = ?")
        params.append(req.subcategory)
    if req.price is not None:
        fields.append("price = ?")
        params.append(req.price)
    if req.image is not None:
        fields.append("image = ?")
        params.append(req.image)
    if req.description is not None:
        fields.append("description = ?")
        params.append(req.description)
    if req.in_stock is not None:
        fields.append("in_stock = ?")
        params.append(req.in_stock)

    if fields:
        params.append(product_id)
        cursor.execute(f"UPDATE products SET {', '.join(fields)} WHERE id = ?", params)
        conn.commit()

    conn.close()
    return {"success": True, "message": "Product updated successfully."}


@app.delete("/api/admin/products/{product_id}")
def delete_admin_product(product_id: int, admin: dict = Depends(get_current_admin)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM products WHERE id = ?", (product_id,))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Product deleted successfully."}


@app.post("/api/admin/upload-image")
def upload_product_image(file: UploadFile = File(...), admin: dict = Depends(get_current_admin)):
    # Validate extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, or WEBP images are allowed.")

    filename = f"prod_{secrets.token_hex(6)}{ext}"
    dest = os.path.join(UPLOAD_DIR, filename)

    with open(dest, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    image_rel_path = f"images/uploads/{filename}"
    return {"success": True, "image_url": image_rel_path}


@app.get("/api/admin/orders")
def get_admin_orders(admin: dict = Depends(get_current_admin)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM orders ORDER BY id DESC")
    orders = cursor.fetchall()
    conn.close()

    res = []
    for o in orders:
        d = dict(o)
        try:
            d["items"] = json.loads(d["items_json"])
        except Exception:
            d["items"] = []
        try:
            d["shipping_address"] = json.loads(d["shipping_address"])
        except Exception:
            d["shipping_address"] = {}
        res.append(d)
    return {"success": True, "orders": res}


@app.put("/api/admin/orders/{order_id}/status")
def update_order_status(order_id: int, payload: dict, admin: dict = Depends(get_current_admin)):
    payment_status = payload.get("payment_status")
    shipment_status = payload.get("shipment_status")

    conn = get_db()
    cursor = conn.cursor()
    if payment_status:
        cursor.execute("UPDATE orders SET payment_status = ? WHERE id = ?", (payment_status, order_id))
    if shipment_status:
        cursor.execute("UPDATE orders SET shipment_status = ? WHERE id = ?", (shipment_status, order_id))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Order status updated."}


@app.get("/api/admin/team")
def get_admin_team(admin: dict = Depends(get_current_admin)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, email, role, created_at FROM admins ORDER BY id ASC")
    admins = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return {"success": True, "admins": admins}


@app.post("/api/admin/team")
def add_admin_member(req: AdminAddReq, admin: dict = Depends(get_current_admin)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM admins WHERE email = ?", (req.email.lower().strip(),))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Admin with this email already exists.")

    hashed = hash_password(req.password)
    cursor.execute("""
        INSERT INTO admins (name, email, password_hash, role)
        VALUES (?, ?, ?, ?)
    """, (req.name.strip(), req.email.lower().strip(), hashed, req.role))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Admin added successfully."}


@app.delete("/api/admin/team/{admin_id}")
def delete_admin_member(admin_id: int, current_admin: dict = Depends(get_current_admin)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM admins")
    count = cursor.fetchone()[0]
    if count <= 1:
        conn.close()
        raise HTTPException(status_code=400, detail="Cannot delete the only remaining admin.")

    cursor.execute("DELETE FROM admins WHERE id = ?", (admin_id,))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Admin removed successfully."}


# ==========================================
# STATIC FILES SERVING (STOREFRONT & ADMIN)
# ==========================================
# Mount folders
app.mount("/images", StaticFiles(directory=os.path.join(BASE_DIR, "images")), name="images")
app.mount("/css", StaticFiles(directory=os.path.join(BASE_DIR, "css")), name="css")
app.mount("/js", StaticFiles(directory=os.path.join(BASE_DIR, "js")), name="js")
app.mount("/", StaticFiles(directory=BASE_DIR, html=True), name="static")
