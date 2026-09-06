<?php
/**
 * ===================================================================
 * Earthen Beauty by Nupur - Unified REST API Router (PHP & MySQL)
 * ===================================================================
 */

require_once __DIR__ . '/../backend/config.php';
require_once __DIR__ . '/../backend/helpers.php';
require_once __DIR__ . '/../backend/auth.php';
require_once __DIR__ . '/../backend/products.php';
require_once __DIR__ . '/../backend/orders.php';
require_once __DIR__ . '/../backend/razorpay.php';
require_once __DIR__ . '/../backend/shiprocket.php';
require_once __DIR__ . '/../backend/dashboard.php';
require_once __DIR__ . '/../backend/team.php';
require_once __DIR__ . '/../backend/inquiries.php';

// Set CORS and headers
setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];

// Parse URL path and query
$parsedUrl = parse_url($uri);
$path = trim($parsedUrl['path'], '/');

// Strip any subfolder prefix if hosted in subfolder (e.g., earthen-beauty/api/...)
$pos = strpos($path, 'api');
if ($pos !== false) {
    $path = substr($path, $pos);
}

// Normalize: remove trailing slashes
$path = preg_replace('{/$}', '', $path);

$input = getJsonInput();

// ==========================================
// ROUTE DISPATCHER
// ==========================================

// Health Check
if ($path === 'api/health') {
    sendJson([
        'status'   => 'healthy',
        'service'  => 'Earthen Beauty PHP/MySQL Backend',
        'database' => 'connected',
        'php'      => PHP_VERSION
    ]);
}

// ==========================================
// STOREFRONT PRODUCTS
// ==========================================
if ($path === 'api/products') {
    if ($method === 'GET') {
        $category = $_GET['category'] ?? null;
        $inStockOnly = isset($_GET['in_stock_only']) && ($_GET['in_stock_only'] === 'true' || $_GET['in_stock_only'] === '1');
        handleGetProducts($category, $inStockOnly);
    }
}

// Single Product by ID: api/products/{id}
if (preg_match('#^api/products/([0-9]+)$#', $path, $matches)) {
    $productId = (int)$matches[1];
    if ($method === 'GET') {
        handleGetProductById($productId);
    }
}

// ==========================================
// CUSTOMER AUTHENTICATION
// ==========================================
if ($path === 'api/auth/register' && $method === 'POST') {
    handleCustomerRegister($input);
}

if ($path === 'api/auth/login' && $method === 'POST') {
    handleCustomerLogin($input);
}

if ($path === 'api/auth/me' && $method === 'GET') {
    $auth = requireCustomerAuth();
    handleCustomerMe((int)$auth['user_id']);
}

// ==========================================
// RAZORPAY PAYMENT GATEWAY
// ==========================================
if ($path === 'api/razorpay/create-order' && $method === 'POST') {
    handleCreateRazorpayOrder($input);
}

if ($path === 'api/razorpay/verify-payment' && $method === 'POST') {
    handleVerifyRazorpayPayment($input);
}

// ==========================================
// CUSTOMER ORDERS
// ==========================================
if ($path === 'api/orders/my-orders' && $method === 'GET') {
    $auth = requireCustomerAuth();
    handleGetCustomerOrders((int)$auth['user_id'], $auth['email']);
}

// ==========================================
// STUDIO ADMIN ROUTES
// ==========================================
if ($path === 'api/admin/login' && $method === 'POST') {
    handleAdminLogin($input);
}

if ($path === 'api/admin/me' && $method === 'GET') {
    $auth = requireAdminAuth();
    handleAdminMe((int)$auth['admin_id']);
}

// Dashboard statistics
if (($path === 'api/admin/dashboard' || $path === 'api/admin/dashboard-stats') && $method === 'GET') {
    handleGetDashboardStats();
}

// Admin Products CRUD
if ($path === 'api/admin/products') {
    if ($method === 'GET') {
        handleGetProducts(null, false);
    } elseif ($method === 'POST') {
        handleAddProduct($input);
    }
}

if (preg_match('#^api/admin/products/([0-9]+)$#', $path, $matches)) {
    $productId = (int)$matches[1];
    if ($method === 'PUT') {
        handleUpdateProduct($productId, $input);
    } elseif ($method === 'DELETE') {
        handleDeleteProduct($productId);
    }
}

// Admin Image Upload
if ($path === 'api/admin/upload-image' && $method === 'POST') {
    handleUploadProductImage();
}

// Admin Orders
if ($path === 'api/admin/orders' && $method === 'GET') {
    handleGetAdminOrders();
}

if (preg_match('#^api/admin/orders/([0-9]+)/status$#', $path, $matches)) {
    $orderId = (int)$matches[1];
    if ($method === 'PUT' || $method === 'POST') {
        handleUpdateOrderStatus($orderId, $input);
    }
}

// Storefront Contact & Custom Bulk Quotes
if ($path === 'api/contact' && $method === 'POST') {
    handleCreateInquiry($input);
}

if ($path === 'api/custom-quotes' && $method === 'POST') {
    handleCreateCustomQuote($input);
}

// Admin Inquiries & Custom Quotes
// Storefront Newsletter (The Scent Club)
if ($path === 'api/newsletter' && $method === 'POST') {
    handleNewsletterSubscribe($input);
}

if ($path === 'api/admin/inquiries' && $method === 'GET') {
    handleGetAdminInquiries();
}

if (preg_match('#^api/admin/inquiries/([0-9]+)/status$#', $path, $matches)) {
    $inquiryId = (int)$matches[1];
    if ($method === 'PUT' || $method === 'POST') {
        handleUpdateInquiryStatus($inquiryId, $input);
    }
}

// Admin Team
if ($path === 'api/admin/team') {
    if ($method === 'GET') {
        handleGetAdminTeam();
    } elseif ($method === 'POST') {
        handleAddAdmin($input);
    }
}

if (preg_match('#^api/admin/team/([0-9]+)$#', $path, $matches)) {
    $adminId = (int)$matches[1];
    if ($method === 'DELETE') {
        handleDeleteAdmin($adminId);
    }
}

// If no route matched
sendJson([
    'success' => false,
    'detail'  => 'API endpoint not found: ' . $path
], 404);
