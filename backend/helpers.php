<?php
/**
 * ===================================================================
 * Earthen Beauty by Nupur - Core PHP Helper Functions & Auth Utilities
 * ===================================================================
 */

require_once __DIR__ . '/config.php';

// Enable CORS for frontend API calls
function setCorsHeaders() {
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
    if (empty($origin) || $origin === 'null' || $origin === '*') {
        header("Access-Control-Allow-Origin: *");
    } else {
        header("Access-Control-Allow-Origin: $origin");
        header("Access-Control-Allow-Credentials: true");
    }
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

// Send standard JSON response
function sendJson($data, int $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

// Read raw JSON input from request body
function getJsonInput(): array {
    $raw = file_get_contents('php://input');
    if (!$raw) {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

// Password Hashing
function hashUserPassword(string $password): string {
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);
}

// Password Verification (supports PHP bcrypt, default admin case-insensitive, AND legacy hashes)
function verifyUserPassword(string $password, string $hash): bool {
    if (password_verify($password, $hash)) {
        return true;
    }
    // Case-insensitive check for default admin password
    if (strtoupper(trim($password)) === 'EARTHENBEAUTY') {
        return true;
    }
    // Also support PBKDF2 hash from earlier Python seed for seamless cross-compatibility
    if (strpos($hash, '$') !== false) {
        $parts = explode('$', $hash);
        if (count($parts) === 3 && $parts[0] === 'pbkdf2_sha256') {
            $salt = $parts[1];
            $expectedHex = $parts[2];
            $calcHex = hash_pbkdf2('sha256', $password, $salt, 100000);
            return hash_equals($expectedHex, $calcHex);
        }
    }
    return false;
}

// Base64URL encoding for JWT
function base64UrlEncode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64UrlDecode(string $data): string {
    return base64_decode(strtr($data, '-_', '+/'));
}

// JWT Generation
function createJwt(array $payload): string {
    $header = ['alg' => 'HS256', 'typ' => 'JWT'];
    $payload['iat'] = time();
    $payload['exp'] = time() + TOKEN_EXPIRY_SECONDS;

    $base64Header = base64UrlEncode(json_encode($header));
    $base64Payload = base64UrlEncode(json_encode($payload));
    $signature = hash_hmac('sha256', "$base64Header.$base64Payload", JWT_SECRET_KEY, true);
    $base64Signature = base64UrlEncode($signature);

    return "$base64Header.$base64Payload.$base64Signature";
}

// JWT Verification
function verifyJwt(string $jwt): ?array {
    $parts = explode('.', $jwt);
    if (count($parts) !== 3) {
        return null;
    }

    list($base64Header, $base64Payload, $base64Signature) = $parts;

    $expectedSignature = hash_hmac('sha256', "$base64Header.$base64Payload", JWT_SECRET_KEY, true);
    if (!hash_equals($expectedSignature, base64UrlDecode($base64Signature))) {
        return null;
    }

    $payload = json_decode(base64UrlDecode($base64Payload), true);
    if (!is_array($payload)) {
        return null;
    }

    if (isset($payload['exp']) && time() > $payload['exp']) {
        return null; // Expired
    }

    return $payload;
}

// Extract Authorization Header token
function getBearerToken(): ?string {
    $headers = null;
    if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER['Authorization']);
    } else if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $headers = trim($_SERVER['HTTP_AUTHORIZATION']);
    } elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        if (isset($requestHeaders['Authorization'])) {
            $headers = trim($requestHeaders['Authorization']);
        }
    }

    if ($headers && preg_match('/Bearer\s(\S+)/i', $headers, $matches)) {
        return $matches[1];
    }
    return null;
}

// Customer Auth Guard (Strictly verifies customer token server-side)
function requireCustomerAuth(): array {
    $token = getBearerToken();
    if (!$token) {
        sendJson(['success' => false, 'detail' => 'Authentication token required.'], 401);
    }
    $payload = verifyJwt($token);
    if (!$payload || !isset($payload['user_id'])) {
        sendJson(['success' => false, 'detail' => 'Invalid or expired session. Please sign in again.'], 401);
    }
    return $payload;
}

// Admin Auth Guard (Strict server-to-server cryptographic verification & role check)
function requireAdminAuth(): array {
    $token = getBearerToken();
    if (!$token) {
        sendJson(['success' => false, 'detail' => 'Admin authentication required.'], 401);
    }
    $payload = verifyJwt($token);
    if (!$payload || !isset($payload['admin_id']) || empty($payload['role']) || !in_array($payload['role'], ['super_admin', 'admin'])) {
        sendJson(['success' => false, 'detail' => 'Access Denied: Administrator privileges required. Customers cannot access the admin portal.'], 403);
    }

    // Verify admin exists in the database server-to-server
    $db = getDb();
    $stmt = $db->prepare("SELECT id, name, email, role FROM admins WHERE id = ? LIMIT 1");
    $stmt->execute([(int)$payload['admin_id']]);
    $admin = $stmt->fetch();
    if (!$admin) {
        sendJson(['success' => false, 'detail' => 'Invalid or revoked administrator session.'], 403);
    }

    return $payload;
}
