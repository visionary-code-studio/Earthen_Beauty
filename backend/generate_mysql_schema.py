import sqlite3
import json

conn = sqlite3.connect('data/earthen_beauty.db')
cursor = conn.cursor()

# Get products
cursor.execute('SELECT id, name, category, subcategory, price, image, description, in_stock FROM products ORDER BY id ASC')
prods = cursor.fetchall()

sql = """-- ========================================================
-- Earthen Beauty by Nupur - MySQL Database Schema & Seed
-- Target Database: earthen_beauty
-- Compatible with: MySQL 5.7+, MySQL 8.0+, MariaDB 10.3+
-- ========================================================

CREATE DATABASE IF NOT EXISTS `earthen_beauty` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `earthen_beauty`;

-- --------------------------------------------------------
-- Table: users (Registered Customers)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `phone` VARCHAR(30) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table: admins (Studio Administrators)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `admins`;
CREATE TABLE `admins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) DEFAULT 'admin',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Default Super Admin: earthenbeauty@gmail.com / EARTHENBEAUTY
-- Password hash generated using password_hash('EARTHENBEAUTY', PASSWORD_BCRYPT)
INSERT INTO `admins` (`name`, `email`, `password_hash`, `role`)
VALUES ('Nupur (Store Owner)', 'earthenbeauty@gmail.com', '$2y$10$Y10P7qjQ4sYk2c1vFqWpfeXhL9b.4o0Zg8lY1U7R1X3wBq7u6vY6S', 'super_admin');

-- --------------------------------------------------------
-- Table: products (Store Catalog)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(200) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `subcategory` VARCHAR(100) DEFAULT '',
  `price` DECIMAL(10,2) NOT NULL,
  `image` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `in_stock` TINYINT(1) DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table: orders (Razorpay & Shiprocket Integrated)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_number` VARCHAR(50) NOT NULL UNIQUE,
  `user_id` INT DEFAULT NULL,
  `customer_name` VARCHAR(150) DEFAULT NULL,
  `customer_email` VARCHAR(191) DEFAULT NULL,
  `customer_phone` VARCHAR(50) DEFAULT NULL,
  `order_type` VARCHAR(50) DEFAULT 'standard_cart',
  `items_json` LONGTEXT NOT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `shipping_fee` DECIMAL(10,2) NOT NULL DEFAULT 90.00,
  `total_amount` DECIMAL(10,2) NOT NULL,
  `shipping_address` LONGTEXT NOT NULL,
  `payment_status` VARCHAR(50) DEFAULT 'pending',
  `razorpay_order_id` VARCHAR(100) DEFAULT NULL,
  `razorpay_payment_id` VARCHAR(100) DEFAULT NULL,
  `shiprocket_order_id` VARCHAR(100) DEFAULT NULL,
  `shipment_status` VARCHAR(100) DEFAULT 'Processing',
  `tracking_number` VARCHAR(100) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_order_number` (`order_number`),
  INDEX `idx_payment_status` (`payment_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Seeding All Catalog Products
-- --------------------------------------------------------
INSERT INTO `products` (`id`, `name`, `category`, `subcategory`, `price`, `image`, `description`, `in_stock`) VALUES
"""

vals = []
for p in prods:
    pid, name, cat, sub, price, img, desc, stock = p
    esc_name = name.replace("'", "''")
    esc_cat = cat.replace("'", "''")
    esc_sub = (sub or '').replace("'", "''")
    esc_img = img.replace("'", "''")
    esc_desc = (desc or '').replace("'", "''")
    vals.append(f"({pid}, '{esc_name}', '{esc_cat}', '{esc_sub}', {price}, '{esc_img}', '{esc_desc}', {stock})")

sql += ',\n'.join(vals) + ';\n'

with open('backend/schema.sql', 'w', encoding='utf-8') as f:
    f.write(sql)

print(f"Successfully generated backend/schema.sql with {len(prods)} products.")
