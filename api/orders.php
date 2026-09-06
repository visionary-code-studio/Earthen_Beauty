<?php
/**
 * Direct Endpoint: api/orders.php
 */
require_once __DIR__ . '/../backend/config.php';
require_once __DIR__ . '/../backend/helpers.php';
require_once __DIR__ . '/../backend/orders.php';

setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$input = getJsonInput();

if ($action === 'my_orders') {
    $auth = requireCustomerAuth();
    handleGetCustomerOrders((int)$auth['user_id'], $auth['email']);
} elseif ($action === 'admin_orders') {
    handleGetAdminOrders();
} elseif ($action === 'update_status' && $id > 0) {
    handleUpdateOrderStatus($id, $input);
}

sendJson(['success' => false, 'detail' => 'Invalid orders action.'], 400);
