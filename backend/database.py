import sqlite3
import os
import json
import hashlib
import binascii
import secrets

DB_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
os.makedirs(DB_DIR, exist_ok=True)
DB_PATH = os.path.join(DB_DIR, "earthen_beauty.db")


def hash_password(password: str) -> str:
    """Hash password securely using PBKDF2-HMAC-SHA256 with random salt."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
    return f"{salt}:{binascii.hexlify(key).decode('ascii')}"


def verify_password(stored_hash: str, provided_password: str) -> bool:
    """Verify password against stored salt:hash."""
    try:
        salt, key_hex = stored_hash.split(":")
        new_key = hashlib.pbkdf2_hmac("sha256", provided_password.encode("utf-8"), salt.encode("utf-8"), 100000)
        return secrets.compare_digest(binascii.hexlify(new_key).decode("ascii"), key_hex)
    except Exception:
        return False


def get_db():
    """Get SQLite database connection with row factory enabled."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db():
    """Initialize database schema and seed initial admin & catalog."""
    conn = get_db()
    cursor = conn.cursor()

    # 1. Users Table (Customers)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. Admins Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'super_admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 3. Products Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        subcategory TEXT DEFAULT '',
        price REAL NOT NULL,
        image TEXT NOT NULL,
        description TEXT DEFAULT '',
        in_stock INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 4. Orders Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT UNIQUE NOT NULL,
        user_id INTEGER,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        order_type TEXT DEFAULT 'standard_cart',
        items_json TEXT NOT NULL,
        subtotal REAL NOT NULL,
        shipping_fee REAL DEFAULT 90.0,
        total_amount REAL NOT NULL,
        shipping_address TEXT NOT NULL,
        payment_status TEXT DEFAULT 'pending',
        razorpay_order_id TEXT DEFAULT '',
        razorpay_payment_id TEXT DEFAULT '',
        shiprocket_order_id TEXT DEFAULT '',
        shipment_status TEXT DEFAULT 'pending',
        tracking_number TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    );
    """)

    conn.commit()

    # Seed Initial Admin: earthenbeauty@gmail.com / EARTHENBEAUTY
    cursor.execute("SELECT id FROM admins WHERE email = 'earthenbeauty@gmail.com'")
    if not cursor.fetchone():
        hashed = hash_password("EARTHENBEAUTY")
        cursor.execute("""
            INSERT INTO admins (name, email, password_hash, role)
            VALUES (?, ?, ?, ?)
        """, ("Nupur (Store Owner)", "earthenbeauty@gmail.com", hashed, "super_admin"))
        conn.commit()
        print("[DB] Initial Super Admin seeded: earthenbeauty@gmail.com")

    # Seed Catalog if products table is empty
    cursor.execute("SELECT COUNT(*) FROM products")
    count = cursor.fetchone()[0]
    if count == 0:
        seed_catalog_from_js(conn)

    conn.close()


def seed_catalog_from_js(conn):
    """Seed initial 77 products into SQLite from the existing catalog data."""
    cursor = conn.cursor()
    products_js_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "js", "products.js")
    if not os.path.exists(products_js_path):
        return

    try:
        with open(products_js_path, "r", encoding="utf-8") as f:
            content = f.read()

        import re
        pattern = re.compile(
            r'\{\s*id:\s*(\d+),\s*name:\s*"([^"]+)",\s*category:\s*"([^"]+)",\s*subcategory:\s*"([^"]*)",\s*price:\s*(\d+(?:\.\d+)?),\s*image:\s*"([^"]+)",\s*description:\s*"([^"]*)"\s*\}'
        )
        matches = pattern.findall(content)
        for m in matches:
            pid, name, cat, subcat, price, image, desc = m
            cursor.execute("""
                INSERT INTO products (id, name, category, subcategory, price, image, description, in_stock)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1)
            """, (int(pid), name, cat, subcat, float(price), image, desc))

        conn.commit()
        print(f"[DB] Initialized catalog with {len(matches)} products from products.js")
    except Exception as e:
        print(f"[DB] Catalog seed note: {e}")


if __name__ == "__main__":
    init_db()
    print("Database initialization complete.")
