<?php
/**
 * Direct Endpoint: api/auth.php
 */
require_once __DIR__ . '/../backend/config.php';
require_once __DIR__ . '/../backend/helpers.php';
require_once __DIR__ . '/../backend/auth.php';

setCorsHeaders();

$action = $_GET['action'] ?? '';
$input = getJsonInput();

if ($action === 'register') {
    handleCustomerRegister($input);
} elseif ($action === 'login') {
    handleCustomerLogin($input);
} elseif ($action === 'me') {
    $auth = requireCustomerAuth();
    handleCustomerMe((int)$auth['user_id']);
} elseif ($action === 'admin_login') {
    handleAdminLogin($input);
} elseif ($action === 'admin_me') {
    $auth = requireAdminAuth();
    handleAdminMe((int)$auth['admin_id']);
}

sendJson(['success' => false, 'detail' => 'Invalid auth action.'], 400);
