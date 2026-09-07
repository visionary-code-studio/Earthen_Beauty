<?php
/**
 * ===================================================================
 * Earthen Beauty by Nupur - Core PHP & MySQL Configuration
 * ===================================================================
 */

// Error reporting for development (set to 0 in strict production)
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Timezone
date_default_timezone_set('Asia/Kolkata');

// ==========================================
// DATABASE CREDENTIALS (MySQL / MariaDB)
// ==========================================
// Default values work out-of-the-box with XAMPP, WAMP, MAMP, and standard cPanel
define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'earthen_beauty');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_CHARSET', 'utf8mb4');

// SQLite fallback path (used automatically if MySQL is not yet configured locally)
define('SQLITE_FALLBACK_FILE', __DIR__ . '/../data/earthen_beauty.db');

// ==========================================
// RAZORPAY CREDENTIALS
// ==========================================
// Live / Test Razorpay credentials (get from dashboard.razorpay.com)
define('RAZORPAY_KEY_ID', getenv('RAZORPAY_KEY_ID') ?: 'rzp_test_earthenbeauty2026');
define('RAZORPAY_KEY_SECRET', getenv('RAZORPAY_KEY_SECRET') ?: 'eb_secret_demo991802');

// ==========================================
// SHIPROCKET CREDENTIALS
// ==========================================
// Credentials from shiprocket.in/dashboard
define('SHIPROCKET_EMAIL', getenv('SHIPROCKET_EMAIL') ?: '');
define('SHIPROCKET_PASSWORD', getenv('SHIPROCKET_PASSWORD') ?: '');

// ==========================================
// SECURITY & AUTHENTICATION
// ==========================================
define('JWT_SECRET_KEY', getenv('JWT_SECRET') ?: 'earthen_beauty_artisan_jwt_secret_key_2026_nupur');
define('TOKEN_EXPIRY_SECONDS', 60 * 60 * 24 * 7); // 7 days

// Uploads directory
define('UPLOAD_DIR', __DIR__ . '/../images/uploads/');
if (!file_exists(UPLOAD_DIR)) {
    mkdir(UPLOAD_DIR, 0777, true);
}

// ==========================================
// DATABASE CONNECTION (PDO)
// ==========================================
function getDb(): PDO {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    // On Vercel / serverless environment, use writable /tmp SQLite copy
    if (getenv('VERCEL') || getenv('NOW_REGION')) {
        $tmpDb = '/tmp/earthen_beauty.db';
        if (!file_exists($tmpDb) && file_exists(SQLITE_FALLBACK_FILE)) {
            @copy(SQLITE_FALLBACK_FILE, $tmpDb);
        }
        if (file_exists($tmpDb)) {
            $pdo = new PDO("sqlite:" . $tmpDb, null, null, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
            return $pdo;
        }
    }

    // Attempt MySQL connection with 1-second timeout to prevent hanging on serverless
    try {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::ATTR_TIMEOUT            => 1, // Quick 1s timeout if MySQL host is unreachable
        ];
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;
    } catch (PDOException $e) {
        // If MySQL server is unavailable, fallback to SQLite
        if (file_exists(SQLITE_FALLBACK_FILE)) {
            $sqliteDsn = "sqlite:" . SQLITE_FALLBACK_FILE;
            $pdo = new PDO($sqliteDsn, null, null, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
            return $pdo;
        }

        // Return error if neither is reachable
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'message' => 'Database connection error. Please verify MySQL service is running.',
            'error'   => $e->getMessage()
        ]);
        exit;
    }
}
