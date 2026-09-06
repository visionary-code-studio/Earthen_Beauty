<?php
/**
 * ===================================================================
 * Earthen Beauty by Nupur - Inquiries & Custom Quotes Controller
 * ===================================================================
 */

require_once __DIR__ . '/helpers.php';

// Helper to ensure tables exist in DB
function ensureInquiryTables(PDO $db) {
    static $checked = false;
    if ($checked) return;

    $isSqlite = ($db->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite');

    if ($isSqlite) {
        $db->exec("
            CREATE TABLE IF NOT EXISTS inquiries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT DEFAULT '',
                subject TEXT DEFAULT 'General Inquiry',
                message TEXT NOT NULL,
                status TEXT DEFAULT 'new',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS custom_quotes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT DEFAULT '',
                phone TEXT DEFAULT '',
                product_interest TEXT DEFAULT 'Bespoke Bulk Order',
                quantity INTEGER DEFAULT 50,
                occasion TEXT DEFAULT 'General Event',
                fragrance_theme TEXT DEFAULT '',
                custom_branding TEXT DEFAULT 'Yes',
                required_date TEXT DEFAULT '',
                notes TEXT DEFAULT '',
                status TEXT DEFAULT 'new',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS newsletter_subscribers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                club_tier TEXT DEFAULT 'Scent Club Member',
                discount_code TEXT DEFAULT 'SCENTCLUB10',
                status TEXT DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        ");
    } else {
        $db->exec("
            CREATE TABLE IF NOT EXISTS `inquiries` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `name` VARCHAR(150) NOT NULL,
                `email` VARCHAR(191) NOT NULL,
                `phone` VARCHAR(50) DEFAULT '',
                `subject` VARCHAR(150) DEFAULT 'General Inquiry',
                `message` TEXT NOT NULL,
                `status` VARCHAR(50) DEFAULT 'new',
                `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

            CREATE TABLE IF NOT EXISTS `custom_quotes` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `name` VARCHAR(150) NOT NULL,
                `email` VARCHAR(191) DEFAULT '',
                `phone` VARCHAR(50) DEFAULT '',
                `product_interest` VARCHAR(255) DEFAULT 'Bespoke Bulk Order',
                `quantity` INT DEFAULT 50,
                `occasion` VARCHAR(150) DEFAULT 'General Event',
                `fragrance_theme` VARCHAR(150) DEFAULT '',
                `custom_branding` VARCHAR(50) DEFAULT 'Yes',
                `required_date` VARCHAR(100) DEFAULT '',
                `notes` TEXT DEFAULT NULL,
                `status` VARCHAR(50) DEFAULT 'new',
                `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
    }

    $checked = true;
}

// Storefront: Submit Contact Inquiry
function handleCreateInquiry(array $input) {
    $name = trim($input['name'] ?? '');
    $email = strtolower(trim($input['email'] ?? ''));
    $phone = trim($input['phone'] ?? '');
    $subject = trim($input['subject'] ?? 'General Inquiry');
    $message = trim($input['message'] ?? '');

    if (empty($name) || empty($email) || empty($message)) {
        sendJson(['success' => false, 'detail' => 'Name, Email, and Message are required.'], 400);
    }

    $db = getDb();
    ensureInquiryTables($db);

    $stmt = $db->prepare("
        INSERT INTO inquiries (name, email, phone, subject, message, status)
        VALUES (?, ?, ?, ?, ?, 'new')
    ");
    $stmt->execute([$name, $email, $phone, $subject, $message]);
    $newId = (int)$db->lastInsertId();

    sendJson([
        'success' => true,
        'id'      => $newId,
        'message' => 'Thank you ' . $name . '! Your inquiry has been received by Nupur. We will get back to you shortly.'
    ], 201);
}

// Storefront: Submit Custom Quote / Bulk Order Request
function handleCreateCustomQuote(array $input) {
    $name = trim($input['name'] ?? 'Guest Customer');
    $email = strtolower(trim($input['email'] ?? ''));
    $phone = trim($input['phone'] ?? '');
    $productInterest = trim($input['product_interest'] ?? 'Custom Order');
    $quantity = (int)($input['quantity'] ?? 50);
    $occasion = trim($input['occasion'] ?? 'General Event');
    $fragranceTheme = trim($input['fragrance_theme'] ?? '');
    $customBranding = trim($input['custom_branding'] ?? 'Yes');
    $requiredDate = trim($input['required_date'] ?? '');
    $notes = trim($input['notes'] ?? '');

    $db = getDb();
    ensureInquiryTables($db);

    $stmt = $db->prepare("
        INSERT INTO custom_quotes (
            name, email, phone, product_interest, quantity, occasion,
            fragrance_theme, custom_branding, required_date, notes, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')
    ");
    $stmt->execute([
        $name, $email, $phone, $productInterest, $quantity, $occasion,
        $fragranceTheme, $customBranding, $requiredDate, $notes
    ]);
    $newId = (int)$db->lastInsertId();

    sendJson([
        'success' => true,
        'id'      => $newId,
        'message' => 'Custom quotation request received! Nupur will contact you with wholesale pricing.'
    ], 201);
}

// Admin: Get All Inquiries & Quotes
function handleGetAdminInquiries() {
    requireAdminAuth();

    $db = getDb();
    ensureInquiryTables($db);

    $contactStmt = $db->query("SELECT id, name, email, phone, subject, message, status, created_at, 'contact' AS type FROM inquiries ORDER BY id DESC");
    $contacts = $contactStmt->fetchAll();

    $quoteStmt = $db->query("SELECT id, name, email, phone, product_interest AS subject, occasion, quantity, fragrance_theme, custom_branding, required_date, notes AS message, status, created_at, 'custom_quote' AS type FROM custom_quotes ORDER BY id DESC");
    $quotes = $quoteStmt->fetchAll();

    $all = array_merge($contacts, $quotes);
    usort($all, function($a, $b) {
        return strtotime($b['created_at']) - strtotime($a['created_at']);
    });

    sendJson([
        'success'   => true,
        'count'     => count($all),
        'inquiries' => $all
    ]);
}

// Admin: Update Inquiry / Quote Status
function handleUpdateInquiryStatus(int $id, array $input) {
    requireAdminAuth();

    $type = $input['type'] ?? 'contact';
    $status = trim($input['status'] ?? 'contacted');

    $db = getDb();
    ensureInquiryTables($db);

    if ($type === 'custom_quote') {
        $stmt = $db->prepare("UPDATE custom_quotes SET status = ? WHERE id = ?");
    } else {
        $stmt = $db->prepare("UPDATE inquiries SET status = ? WHERE id = ?");
    }
    $stmt->execute([$status, $id]);

    sendJson([
        'success' => true,
        'message' => 'Status updated successfully.'
    ]);
}

// Storefront: Newsletter Subscription (The "Scent Club")
function handleNewsletterSubscribe(array $input) {
    $email = trim(strtolower($input['email'] ?? ''));

    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendJson(['success' => false, 'error' => 'Please provide a valid email address.'], 400);
    }

    $clubTier = trim($input['club_tier'] ?? 'Scent Club Member');
    $discountCode = 'SCENTCLUB10';

    $db = getDb();
    ensureInquiryTables($db);

    $isSqlite = ($db->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite');

    if ($isSqlite) {
        $stmt = $db->prepare("INSERT OR IGNORE INTO newsletter_subscribers (email, club_tier, discount_code, status) VALUES (?, ?, ?, 'active')");
    } else {
        $stmt = $db->prepare("INSERT INTO `newsletter_subscribers` (`email`, `club_tier`, `discount_code`, `status`) VALUES (?, ?, ?, 'active') ON DUPLICATE KEY UPDATE `status` = 'active'");
    }

    $stmt->execute([$email, $clubTier, $discountCode]);

    sendJson([
        'success'       => true,
        'message'       => 'Welcome to The Scent Club! Your exclusive artisanal membership is active.',
        'discount_code' => $discountCode,
        'perks'         => [
            '10% off first order with code: ' . $discountCode,
            'Private seasonal scent reveals',
            'Artisanal candle care guides'
        ]
    ]);
}
