# 🕯️ Earthen Beauty by Nupur

> **Artisanal Handcrafted Candles, Diffusers & Home Fragrance Studio**  
> Luxury full-stack e-commerce web platform featuring real-time product catalog synchronization, bespoke candle customizer, Razorpay payment gateway integration, Shiprocket logistics automation, customer accounts, and an enterprise Studio Admin Operations Portal.

---

## 🌟 Overview & Key Features

* **Artisanal Storefront**:
  * Rich, responsive luxury aesthetics designed with pure Vanilla HTML5, CSS3, and JavaScript.
  * Live catalog synchronization across home, shop, product detail, and search pages.
  * Scent Club luxury newsletter subscription with instant discount rewards (`SCENTCLUB10`).
  * Seamless cart management with instant drawer and quick checkout.

* **Bespoke Customization & Bulk Orders**:
  * Interactive Custom Candle Builder (Base selection, custom notes, bespoke quote submission).
  * Personalized Name Candle and Special Request quote pipelines with dual-channel recording (Database + direct WhatsApp concierge).
  * Bulk & Corporate quotation request engine for weddings, corporate gifting, and celebrations.

* **Secure Authentication & RBAC**:
  * Customer Sign In / Registration modal with session persistence.
  * Server-to-server cryptographic HMAC-SHA256 JWT tokens.
  * Complete isolation between public shoppers and administrative operations (non-admin tokens strictly receive `403 Forbidden` on admin endpoints).

* **Payment & Logistics Pipelines**:
  * **Razorpay**: Order creation and HMAC-SHA256 signature verification.
  * **Shiprocket**: Automated token authentication and ad-hoc shipment creation.

* **Studio Admin Operations Portal (`admin.html`)**:
  * **Dashboard**: Real-time sales revenue, order volumes, active catalog counts, and low-stock alerts.
  * **Products**: Full CRUD management, inline price editing, in-stock toggles, and photo upload.
  * **Orders & Fulfillment**: Complete customer delivery addresses, order line items, transaction verification, and status tracking (Processing, Shipped, Delivered).
  * **Inquiries & Quotes**: Centralized hub for contact submissions and bespoke custom candle quotes.
  * **Studio Team**: Administrator user management and role-based delegation.

---

## 🏗️ Architecture & Technology Stack

```
Earthen Beauty Web Application
├── Storefront Layer:      HTML5, CSS3, Vanilla JavaScript (Zero runtime JS frameworks)
├── Backend REST API:       PHP 8.x REST API (/api/...)
├── Database Layer:         SQLite 3 (Local Out-of-the-Box) / MySQL / MariaDB (Production LAMP)
├── Payment Gateway:        Razorpay Standard Checkout SDK
└── Logistics & Shipping:   Shiprocket API
```

---

## 🚀 Quick Start (Local Setup)

### 1. Prerequisites
* **PHP 8.0+** with `pdo_sqlite` or `pdo_mysql`, `curl`, and `openssl` enabled.
* (Optional) **MySQL / MariaDB** (if deploying to standard LAMP/cPanel).

### 2. Clone Repository
```bash
git clone https://github.com/visionary-code-studio/Earthen_Beauty.git
cd Earthen_Beauty
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update your credentials in `.env`:
```env
PORT=8000
JWT_SECRET=your_super_secure_jwt_secret_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret_key
SHIPROCKET_EMAIL=your_shiprocket_email
SHIPROCKET_PASSWORD=your_shiprocket_password
```

### 4. Start Local Development Server
Run the built-in PHP development server:
```bash
php -S 127.0.0.1:8000 router.php
```
Or double-click `START_WEBSITE.bat` on Windows.

### 5. Access the Application
* **Storefront**: [http://127.0.0.1:8000/index.html](http://127.0.0.1:8000/index.html)
* **Shop Catalog**: [http://127.0.0.1:8000/shop.html](http://127.0.0.1:8000/shop.html)
* **Bespoke Customizer**: [http://127.0.0.1:8000/customizable.html](http://127.0.0.1:8000/customizable.html)
* **Studio Admin Portal**: [http://127.0.0.1:8000/admin.html](http://127.0.0.1:8000/admin.html)

---

## 🔒 Security & Data Confidentiality

* **Confidential Environment Files**: `.env` and local database binaries (`data/*.db`) are strictly excluded via `.gitignore` to prevent any exposure of sensitive API keys or customer records.
* **Database Migration Script**: Database schema and initial catalog seed data are documented in `backend/schema.sql`.

---

## 📄 License & Attribution

© Earthen Beauty by Nupur. Handcrafted with Love. All Rights Reserved.
