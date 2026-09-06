-- ========================================================
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
(1, 'Cactus Candle', 'candles', 'wooden-base', 560.0, 'images/candles/wooden-base/Cactus  candle - 550.jpeg', 'Unique cactus shaped wooden base candle.', 1),
(2, 'Holi Special Rabdi Candle', 'candles', 'wooden-base', 180.0, 'images/candles/wooden-base/Holi Special Rabdi candle(1 piece)  - 180.jpeg', 'Festive rabdi shaped candle, 1 piece.', 1),
(4, 'Shalpa Bill Candle', 'candles', 'wooden-base', 450.0, 'images/candles/wooden-base/Shalpa Bill candle - 450.jpeg', 'Elegant shalpa bill wooden base candle.', 1),
(5, 'Water Lily Wooden Candle', 'candles', 'wooden-base', 550.0, 'images/candles/wooden-base/Water Lily  wooden candle - 550.jpeg', 'Graceful water lily on wooden base.', 1),
(6, 'Wooden Rose Candle', 'candles', 'wooden-base', 499.0, 'images/candles/wooden-base/Wooden rose candle - 499.jpeg', 'Classic rose candle on natural wooden base.', 1),
(7, 'Wooden Teddy Candle', 'candles', 'wooden-base', 280.0, 'images/candles/wooden-base/Wooden Teddy candle - 280.jpeg', 'Cute teddy bear candle on wooden base.', 1),
(8, 'Aqua Fresh Candle', 'candles', 'glass-jar', 249.0, 'images/candles/glass-jar/Aqua Fresh Cande - 249.jpeg', 'Refreshing aqua fragrance glass jar candle.', 1),
(9, 'British Tea Rose Candle', 'candles', 'glass-jar', 249.0, 'images/candles/glass-jar/British Tea Rose candle - 249.jpeg', 'Delicate British tea rose scented candle.', 1),
(10, 'Calm & Breathe Meditation (Diamond Jar)', 'candles', 'glass-jar', 399.0, 'images/candles/glass-jar/Calm & Breathe Meditation(Diamond jar) - 399.jpeg', 'Premium diamond jar candle for meditation.', 1),
(11, 'Crystal Jar - Plumeria', 'candles', 'glass-jar', 249.0, 'images/candles/glass-jar/Crystal jar (Plumeria) -249.jpeg', 'Crystal jar candle with plumeria fragrance.', 1),
(12, 'Crystal Jar - Beli', 'candles', 'glass-jar', 249.0, 'images/candles/glass-jar/Crystal jar( Beli) - 249.jpeg', 'Crystal jar candle with beli fragrance.', 1),
(13, 'Gardenia Fragrance Candle', 'candles', 'glass-jar', 249.0, 'images/candles/glass-jar/Garedenia Fragrance candle - 249.jpeg', 'Soothing gardenia scented glass jar candle.', 1),
(14, 'Kesar Chandan (Diamond Jar)', 'candles', 'glass-jar', 399.0, 'images/candles/glass-jar/Kesar Chandan (Diamond jar) - 399.jpeg', 'Premium kesar chandan fragrance in diamond jar.', 1),
(15, 'Lavender Fragrance Candle', 'candles', 'glass-jar', 249.0, 'images/candles/glass-jar/Lavender Fragrance candle - 249.jpeg', 'Classic lavender scented glass jar candle.', 1),
(16, 'Night Blooming Jasmine (Diamond Jar)', 'candles', 'glass-jar', 399.0, 'images/candles/glass-jar/Night Booming Jasmine ( Diamond jar) - 399.jpeg', 'Exotic night blooming jasmine in diamond jar.', 1),
(17, 'Sandalwood Fragrance Candle', 'candles', 'glass-jar', 249.0, 'images/candles/glass-jar/Sandawood Fragrance candle - 249.jpeg', 'Rich sandalwood scented glass jar candle.', 1),
(18, 'Tea and Parle G Candle', 'candles', 'glass-jar', 199.0, 'images/candles/glass-jar/Tea and Parle G candle - 199.jpeg', 'Fun chai and Parle G themed candle.', 1),
(19, 'Victoria Falls Candle', 'candles', 'glass-jar', 249.0, 'images/candles/glass-jar/Victoria Falls candle - 249.jpeg', 'Fresh Victoria Falls fragrance glass jar candle.', 1),
(20, 'Cherry Blossom Urli Candle', 'candles', 'urli', 399.0, 'images/candles/urli/Cherry Blossom Urli candle -399.jpeg', 'Beautiful cherry blossom metal urli candle.', 1),
(21, 'Lotus Urli Candle', 'candles', 'urli', 399.0, 'images/candles/urli/Lotus Urli candle - 399.jpeg', 'Elegant lotus design metal urli candle.', 1),
(22, 'Sunflower Urli Candle', 'candles', 'urli', 399.0, 'images/candles/urli/Sunflower Urli candle - 399.jpeg', 'Vibrant sunflower metal urli candle.', 1),
(23, 'Urli Candle (Small Size)', 'candles', 'urli', 220.0, 'images/candles/urli/Urli candle(Small size) - 220.jpeg', 'Compact small size metal urli candle.', 1),
(24, 'Baby Shower Tea Light (Set of 6)', 'candles', 'tea-light', 200.0, 'images/candles/tea-light/Baby Shower Tea Light candle(Set of 6) - 200.jpeg', 'Adorable baby shower themed tea lights, set of 6.', 1),
(25, 'Butterfly Tea Light (Set of 5)', 'candles', 'tea-light', 220.0, 'images/candles/tea-light/Butterfly Tea Light candle(Set of 5) - 220.jpeg', 'Delicate butterfly shaped tea lights, set of 5.', 1),
(27, 'Dolphin Tea Light Candle (Set of 1)', 'candles', 'tea-light', 110.0, 'images/candles/tea-light/Dolphin Tea ight Candle(Set of 3) - 100.jpeg', 'Cute dolphin shaped tea light candle, set of 1.', 1),
(28, 'Lemongrass Tea Light (Set of 8)', 'candles', 'tea-light', 200.0, 'images/candles/tea-light/Lemongrass Tea Light candle(Set of 8)-200.jpeg', 'Refreshing lemongrass scented tea lights, set of 8.', 1),
(29, 'Luxury Rose Tea Light (Set of 4)', 'candles', 'tea-light', 220.0, 'images/candles/tea-light/Luxury Rose Tea Light candle(Set of 4) - 220.jpeg', 'Premium rose shaped tea lights, set of 4.', 1),
(30, 'Shalpa Bill Tea Light (Set of 4)', 'candles', 'tea-light', 220.0, 'images/candles/tea-light/Shalpa Bill Tea Light candle(Set of 4) - 220.jpeg', 'Shalpa bill shaped tea lights, set of 4.', 1),
(31, 'Star Tea Light (Set of 5)', 'candles', 'tea-light', 220.0, 'images/candles/tea-light/Star Tea Light candle(Set of 5) - 220.jpeg', 'Sparkling star shaped tea lights, set of 5.', 1),
(32, 'Tea Light Candle (Set of 8)', 'candles', 'tea-light', 200.0, 'images/candles/tea-light/Tea light candle(Set of 8) - 200.jpeg', 'Classic tea light candles, set of 8.', 1),
(33, 'Baby Owl Candle', 'candles', 'decorative', 85.0, 'images/candles/decorative-and-statue/Baby Owl candle(1 piece) - 85.jpeg', 'Adorable baby owl shaped decorative candle.', 1),
(34, 'Blindfold Lady Candle', 'candles', 'decorative', 155.0, 'images/candles/decorative-and-statue/Bindfold Lady candle(1 piece) - 155.jpeg', 'Elegant blindfold lady statue candle.', 1),
(35, 'Couple Candle', 'candles', 'decorative', 249.0, 'images/candles/decorative-and-statue/Couple candle - 249.jpeg', 'Romantic couple themed decorative candle.', 1),
(36, 'Meditation Buddha Candle (Set of 5)', 'candles', 'decorative', 250.0, 'images/candles/decorative-and-statue/Meditation Budhdha candle (Set of 5)- 250.jpeg', 'Peaceful Buddha meditation candle set of 5.', 1),
(37, 'Panda Candle', 'candles', 'decorative', 180.0, 'images/candles/decorative-and-statue/Panda candle(1 piece) - 180.jpeg', 'Cute panda shaped decorative candle.', 1),
(38, 'Peony Aromatic Candle', 'candles', 'decorative', 150.0, 'images/candles/decorative-and-statue/Peony Aromatic candle(1 piece) - 150.jpeg', 'Fragrant peony aromatic decorative candle.', 1),
(39, 'Swan Candle', 'candles', 'decorative', 170.0, 'images/candles/decorative-and-statue/Swan candle(1 piece) -170.jpeg', 'Graceful swan shaped decorative candle.', 1),
(40, 'Teddy Bear Candle', 'candles', 'decorative', 200.0, 'images/candles/decorative-and-statue/Teddy Bear candle(1 piece) - 200.jpeg', 'Lovable teddy bear shaped candle.', 1),
(42, 'Heart Shaped Dessert Candle', 'candles', 'mithai', 299.0, 'images/candles/mithai-and-desserts/Heart Shaped Desert candle - 299.jpeg', 'Romantic heart shaped dessert candle.', 1),
(43, 'Holi Special Rabdi Candle', 'candles', 'mithai', 180.0, 'images/candles/mithai-and-desserts/Holi Special Rabdi candle(1 piece)  - 180.jpeg', 'Festive rabdi shaped sweet candle.', 1),
(44, 'Laddu Candle (Set of 6)', 'candles', 'mithai', 249.0, 'images/candles/mithai-and-desserts/Laddu candle (Set of 6) - 249.jpeg', 'Realistic laddu shaped candle set of 6.', 1),
(45, 'Tea and Parle G Candle', 'candles', 'mithai', 199.0, 'images/candles/mithai-and-desserts/Tea and Parle G candle(1piece) - 199.jpeg', 'Fun chai and Parle G biscuit themed candle.', 1),
(46, 'Ceramic Diffuser Full Set', 'diffusers', 'full-set', 499.0, 'images/diffusers/Full Set/ceramic-diffuser-full-set.jpeg', 'Complete set: Ceramic diffuser + Tea light candle + Wax melt.', 1),
(47, 'Butterfly Tea Light (Set of 5)', 'diffusers', 'single-item', 220.0, 'images/diffusers/Single item/Butterfly Tea Light candle(Set of 5) - 220.jpeg', 'Butterfly shaped tea light candles for diffuser.', 1),
(48, 'Luxury Rose Tea Light (Set of 4)', 'diffusers', 'single-item', 220.0, 'images/diffusers/Single item/Luxury Rose Tea Light candle(Set of 4) - 220.jpeg', 'Premium rose tea lights for diffuser.', 1),
(49, 'Shalpa Bill Tea Light (Set of 4)', 'diffusers', 'single-item', 220.0, 'images/diffusers/Single item/Shalpa Bill Tea Light candle(Set of 4) - 220.jpeg', 'Shalpa bill tea light candles for diffuser.', 1),
(51, 'Star Tea Light (Set of 5)', 'diffusers', 'single-item', 220.0, 'images/diffusers/Single item/Star Tea Light candle(Set of 5) - 220.jpeg', 'Star shaped tea lights for diffuser.', 1),
(52, 'Wax Melt Box (Set of 20 Unique)', 'diffusers', 'single-item', 300.0, 'images/diffusers/Single item/Wax melt Box(Set of 20 unique) -300.jpeg', 'Box of 20 unique wax melts for diffuser.', 1),
(53, 'Wax Melt (50 gm)', 'diffusers', 'single-item', 150.0, 'images/diffusers/Single item/Wax melt(50 gm) - 150.jpeg', 'Single wax melt refill, 50 grams.', 1),
(54, 'Dutch Lavender (100 ml)', 'mist-spray', 'linen-mist', 250.0, 'images/mist/Linen Mist/Dutch Lavender(100 ml) -250.jpeg', 'Calming Dutch lavender linen mist, 100 ml.', 1),
(55, 'Gardenia (100 ml)', 'mist-spray', 'linen-mist', 250.0, 'images/mist/Linen Mist/Gardenia(100 ml) -250.jpeg', 'Fresh gardenia room and linen mist, 100 ml.', 1),
(56, 'Voyage (100 ml)', 'mist-spray', 'linen-mist', 250.0, 'images/mist/Linen Mist/Voyage (100 ml) - 250.jpeg', 'Invigorating voyage fragrance linen mist, 100 ml.', 1),
(57, 'Car Freshener (1 Piece)', 'mist-spray', 'car-freshner', 200.0, 'images/mist/Car Freshner/Car Freshner(1 peice) - 200.jpeg', 'Premium car air freshener bottle.', 1),
(58, 'Baby Themed Wax Sachet', 'wax-sachet', 'wax-sachet', 180.0, 'images/wax-sachet/Baby themed (1 piece) - 180.jpeg', 'Cute baby themed scented wax sachet.', 1),
(59, 'Beli Flower Wax Sachet', 'wax-sachet', 'wax-sachet', 180.0, 'images/wax-sachet/Beli Flower(1 piece) - 180.jpeg', 'Fragrant beli flower wax sachet.', 1),
(60, 'Frangipane Wax Sachet', 'wax-sachet', 'wax-sachet', 180.0, 'images/wax-sachet/Fragipane (1 piece) - 180.jpeg', 'Exotic frangipane scented wax sachet.', 1),
(61, 'Jasmine Wax Sachet', 'wax-sachet', 'wax-sachet', 180.0, 'images/wax-sachet/Jasmine (1 piece) - 180.jpeg', 'Classic jasmine scented wax sachet.', 1),
(62, 'Kesar Chandan Wax Sachet', 'wax-sachet', 'wax-sachet', 180.0, 'images/wax-sachet/Kesar Chandan (1 piece) - 180.jpeg', 'Traditional kesar chandan wax sachet.', 1),
(63, 'Lavender Wax Sachet', 'wax-sachet', 'wax-sachet', 180.0, 'images/wax-sachet/Lavender(1 piece) - 180.jpeg', 'Soothing lavender scented wax sachet.', 1),
(64, 'Lemongrass Wax Sachet', 'wax-sachet', 'wax-sachet', 180.0, 'images/wax-sachet/Lemongrass(1 piece) - 180.jpeg', 'Fresh lemongrass scented wax sachet.', 1),
(65, 'Lord Ganesha Wax Sachet', 'wax-sachet', 'wax-sachet', 220.0, 'images/wax-sachet/Lord Ganesha (1 piece) - 180.jpeg', 'Devotional Lord Ganesha shaped wax sachet.', 1),
(66, 'Lotus Pond Wax Sachet', 'wax-sachet', 'wax-sachet', 180.0, 'images/wax-sachet/Lotuspond (1 piece) - 180.jpeg', 'Serene lotus pond scented wax sachet.', 1),
(67, 'Roasted Coffee Wax Sachet', 'wax-sachet', 'wax-sachet', 180.0, 'images/wax-sachet/Roasted Coffee(1 piece) - 180.jpeg', 'Rich roasted coffee scented wax sachet.', 1),
(68, 'Sandalwood Wax Sachet', 'wax-sachet', 'wax-sachet', 180.0, 'images/wax-sachet/Sandewood(1 piece) - 180.jpeg', 'Classic sandalwood scented wax sachet.', 1),
(69, 'Scented Sleeping Baby Wax Sachet', 'wax-sachet', 'wax-sachet', 180.0, 'images/wax-sachet/Scented Sleeping Baby(1 piece) - 180.jpeg', 'Adorable sleeping baby shaped scented sachet.', 1),
(70, 'Tulip Bouquet Wax Sachet', 'wax-sachet', 'wax-sachet', 180.0, 'images/wax-sachet/Tulip Bouquet(1 piece) - 180.jpeg', 'Beautiful tulip bouquet scented wax sachet.', 1),
(71, 'Water Lily Wax Sachet', 'wax-sachet', 'wax-sachet', 180.0, 'images/wax-sachet/Water Lily (1 piece) - 180.jpeg', 'Delicate water lily scented wax sachet.', 1),
(72, 'Blue Grape Soap Set', 'soaps', 'soaps', 250.0, 'images/soaps/Blue grape soap set - 250.jpeg', 'Handmade blue grape fragrance soap set.', 1),
(73, 'Green Grape Soap Set', 'soaps', 'soaps', 250.0, 'images/soaps/Green grape soap set - 250.jpeg', 'Handmade green grape fragrance soap set.', 1),
(74, 'Red Grape Soap Set', 'soaps', 'soaps', 250.0, 'images/soaps/Red grape soap set - 250.jpeg', 'Handmade red grape fragrance soap set.', 1),
(75, 'Bubble Tray', 'concrete-decor', 'concrete-decor', 180.0, 'images/concrete-decor/Bubble Tray - 180.jpeg', 'Handcrafted round bubble concrete decor tray for candles, jewelry, and vanity.', 1),
(76, 'Shankha Concrete Decor', 'concrete-decor', 'concrete-decor', 299.0, 'images/concrete-decor/Shankha - 299.jpeg', 'Exquisite conch shell (shankha) concrete sculpture and decor piece.', 1),
(77, 'Wavy Concrete Tray', 'concrete-decor', 'concrete-decor', 199.0, 'images/concrete-decor/Tray - 199.jpeg', 'Aesthetic wavy cloud edge concrete tray for candles and vanity accessories.', 1);
