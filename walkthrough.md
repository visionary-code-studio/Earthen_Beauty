# Earthen Beauty by Nupur - Full-Stack PHP & MySQL Backend, Razorpay, Shiprocket & Admin Portal Walkthrough

## 1. Executive Summary

We have completed the comprehensive end-to-end integration between the **Storefront**, **Database (SQLite / MySQL)**, and **Admin Operations Portal**:
- **Wishlist Button**: Completely removed from all header navigation bars across all storefront pages (`index.html`, `shop.html`, `customizable.html`, `about.html`, `contact.html`, `product.html`, `search.html`).
- **Customer & Admin Isolation**:
  - Customer Sign Up and Login strictly creates/authenticates standard customer accounts (`role: 'customer'`, `is_admin: false`). Customers can never access or be redirected to the admin portal.
  - Server-to-server cryptographic role verification enforces that customer tokens attempting to access `/api/admin/*` endpoints receive an immediate `403 Forbidden`.
  - Removed all public links to `admin.html` from customer menus and footer Quick Links.
- **Admin Access & Delegation**:
  - Admin Portal is hosted at `admin.html` (e.g., `http://127.0.0.1:8000/admin.html` locally or `https://your-domain.com/admin.html` in production).
  - Super Admin credentials: `earthenbeauty@gmail.com` / `EARTHENBEAUTY`.
  - Built-in **Studio Team Management** tab allows the store owner to add/grant admin panel access to managers, team members, or clients with distinct roles (`admin` or `super_admin`), or revoke access anytime.
- **End-to-End Storefront, Admin & Database Integration**:
  - **Live Product Catalog**: Products are pulled dynamically from the database (`/api/products`). Edits made in the Admin Portal (price, stock, title, image) reflect across the entire storefront in real-time via `earthen:products-updated`.
  - **Orders & Payments**: Storefront cart and bespoke gift box checkouts generate Razorpay orders and store completed customer orders with shipping addresses directly into the database `orders` table. Admin manages and updates fulfillment status.
  - **Customer Inquiries & Custom Quotes**: Contact messages and bespoke/bulk quote requests from `contact.html` and `customizable.html` are persisted directly to the `inquiries` and `custom_quotes` database tables and appear instantly in the Admin Portal's **Inquiries** tab.
- **Redesigned Admin Portal UI/UX (Inspired by Reference Design)**:
  - **Left Sidebar Navigation**: Brand emblem with title, vertical navigation (Dashboard, Orders, Products, Inquiries, Team), active pill highlights, divider, Storefront ↗ link, and Sign Out action.
  - **Top Navigation Bar**: Rounded global search bar (`Q Search...`), live notifications indicator, and user profile chip with avatar and dropdown.
  - **Overview Dashboard Layout**:
    - **4 Pastel KPI Stat Cards**: Total Revenue (soft rose/pink icon), Total Orders (soft purple icon), Total Items / Active Catalog (soft orange icon), and Inquiries & Quotes (soft blue icon).
    - **Sales Analytic Card**: Interactive, smooth curved SVG spline chart with dual gradient area fills, month selector, and milestone peak badges ("Peak Revenue ₹28,450", "Bespoke Orders 18 Orders").
    - **Order Recently Card**: Clean item list with square rounded image thumbnails, order titles, category subtitles, emerald green prices (`₹399.00`), item counts, and "View All Orders" button.
    - **Top Selling Products Card**: Table with checkboxes, product thumbnails, titles, categories, `Live`/`Draft` status pills, sales counts, and earnings.
    - **Category Share Card**: Interactive SVG Donut ring chart displaying category proportions (Candles 48%, Diffusers 28%, Custom 24%) with center total ("73 Items").
  - **Catalog, Orders, Inquiries & Team Tabs**: Upgraded to match the modern, spacious, high-contrast, rounded card SaaS layout while preserving 100% of underlying API endpoints and database operations.

---

## 2. How to Access the Admin Portal & How to Give Access to Others

### A. How to Access the Admin Portal

1. **Direct URL**:
   - **Local Development**: Open [http://127.0.0.1:8000/admin.html](http://127.0.0.1:8000/admin.html) in your browser.
   - **Production Deployment**: Navigate directly to `https://your-domain.com/admin.html` (e.g. your Netlify, cPanel, or VPS domain).
2. **Default Super Admin Credentials**:
   - **Email**: `earthenbeauty@gmail.com`
   - **Password**: `EARTHENBEAUTY`
3. **Workspace Features**:
   - **Dashboard**: Real-time sales revenue, order volumes, active products, and low stock alerts.
   - **Products**: Search, filter, edit prices inline, toggle in-stock availability, upload new product photos, or add/delete items.
   - **Orders**: View customer addresses, phone numbers, items ordered, payment transaction IDs, and update fulfillment status (Processing, Shipped, Delivered).
   - **Inquiries**: Review all contact messages, custom design inquiries, and bulk wholesale quotes with one-click WhatsApp response buttons.
   - **Team**: View and manage authorized studio administrators.

---

### B. How to "Give" the Admin Panel (Granting Access to Clients, Managers, or Staff)

To grant someone else access to the Admin Portal without sharing your master Super Admin password:

1. **Log in to the Admin Portal** using the Super Admin credentials.
2. Click on the **Team** tab in the top navigation bar.
3. In the **Add New Administrator** form:
   - Enter their **Full Name** (e.g. "Studio Manager" or "Client Name").
   - Enter their **Email Address** (e.g. `manager@earthenbeauty.in`).
   - Create a **Temporary or Secure Password**.
   - Select their **Role**:
     - `Admin`: Full access to catalog, orders, and inquiries.
     - `Super Admin`: Full access including adding or deleting other administrators.
4. Click **Add Administrator**. The system hashes the password with bcrypt and records the account into the database `admins` table.
5. **Provide them with**:
   - The Admin Portal URL: `https://your-domain.com/admin.html`
   - Their registered email address and password.
6. **Revoking Access**: If a team member leaves or access needs to be rescinded, the Super Admin can click **Remove** next to their name in the Team tab, instantly revoking their login rights and token validity.

## 3. Directory Structure & Architecture

```
earthen-beauty/
├── admin.html                    # Luxury Studio Admin Portal Interface
├── css/
│   ├── admin.css                 # Admin Theme (Terracotta #b85c38 & Forest Green #1b382b)
│   ├── style.css                 # Storefront styles + Auth & Profile dropdown
│   └── responsive.css            # Mobile responsive styles
├── js/
│   ├── admin.js                  # Admin client controller (Auth, Dashboard, Catalog, Orders, Inquiries, Team)
│   ├── products.js               # Product catalog + Live Database Sync (syncProductsFromBackend)
│   ├── cart.js                   # Cart management + Razorpay & Shiprocket checkout pipeline
│   ├── main.js                   # Navbar profile icon injection, auth modal, address modal
│   └── motion-effects.js         # Smooth animations
├── backend/
│   ├── config.php                # MySQL & SQLite connection (PDO), Razorpay & Shiprocket keys
│   ├── helpers.php               # CORS, JSON formatting, password hashing, JWT tokens & RBAC
│   ├── auth.php                  # Customer & Admin authentication
│   ├── products.php              # Catalog CRUD & image upload
│   ├── orders.php                # Customer order history & admin order management
│   ├── inquiries.php             # Contact messages & custom quotes controller
│   ├── razorpay.php              # Razorpay order generation & HMAC-SHA256 signature verification
│   ├── shiprocket.php            # Shiprocket token authentication & ad-hoc shipment creation
│   ├── dashboard.php             # Admin sales revenue & analytics metrics
│   ├── team.php                  # Administrator team management
│   ├── schema.sql                # Complete MySQL database creation script with 73 seeded products
│   └── php/                      # Local portable PHP 8.2 runtime with PDO, SQLite, MySQL & cURL
├── api/
│   ├── index.php                 # Unified REST API router (/api/...)
├── router.php                    # Local PHP server router (php -S 127.0.0.1:8000 router.php)
└── .htaccess                     # Apache / XAMPP / cPanel clean URL rewrite rules
```

---

## 4. How to Set Up MySQL Database

### Using phpMyAdmin (XAMPP / WAMP / cPanel)
1. Open **phpMyAdmin** in your browser (`http://localhost/phpmyadmin`).
2. Click on the **Import** tab at the top.
3. Click **Choose File** and select:
   `C:\Users\user\Desktop\Earthen Beauty\backend\schema.sql`
4. Click **Go** / **Import**.
5. It will automatically:
   - Create the `earthen_beauty` database.
   - Create tables: `users`, `admins`, `products`, `orders`, `inquiries`, `custom_quotes`, `newsletter_subscribers`.
   - Seed the initial Super Admin (`earthenbeauty@gmail.com`).
   - Seed all catalog products.

### Using MySQL Command Line
```bash
mysql -u root -p < backend/schema.sql
```

---

## 5. How to Connect Live Razorpay & Shiprocket

Open [`backend/config.php`](file:///c:/Users/user/Desktop/Earthen%20Beauty/backend/config.php) or set environment variables in `.env`:

### A. Razorpay Setup
1. Log in to [dashboard.razorpay.com](https://dashboard.razorpay.com/).
2. Navigate to **Settings** → **API Keys** → **Generate Key**.
3. Copy your **Key Id** and **Key Secret**.
4. In `.env` or `backend/config.php`, set:
   ```env
   RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=your_razorpay_secret_key
   ```
   *(While testing, you can use your `rzp_test_...` key).*

### B. Shiprocket Setup
1. Log in to [app.shiprocket.in](https://app.shiprocket.in/).
2. Go to **Settings** → **API** → **Configure** / **Create User**.
3. In `.env` or `backend/config.php`, set:
   ```env
   SHIPROCKET_EMAIL=your_shiprocket_account_email@example.com
   SHIPROCKET_PASSWORD=your_shiprocket_password
   ```
4. When a customer completes payment via Razorpay, the backend automatically generates an ad-hoc pickup shipment order and saves the tracking code in the database.

---

## 6. How to Run the Website Locally

You can run the PHP server at any time with the built-in PHP binary:
```powershell
backend\php\php.exe -S 127.0.0.1:8000 router.php
```
Then open:
- Storefront: `http://127.0.0.1:8000/index.html`
- Shop: `http://127.0.0.1:8000/shop.html`
- Customization: `http://127.0.0.1:8000/customizable.html`
- Studio Admin: `http://127.0.0.1:8000/admin.html`

---

## 6. How to Run the Website Locally

You can run the PHP server at any time with the built-in PHP binary:
```powershell
backend\php\php.exe -S 127.0.0.1:8000 router.php
```
Then open:
- Storefront: `http://127.0.0.1:8000/index.html`
- Shop: `http://127.0.0.1:8000/shop.html`
- Customization: `http://127.0.0.1:8000/customizable.html`
- Studio Admin: `http://127.0.0.1:8000/admin.html`
