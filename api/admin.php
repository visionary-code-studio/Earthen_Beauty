<?php
/**
 * Direct Endpoint: api/admin.php
 */
require_once __DIR__ . '/../backend/config.php';
require_once __DIR__ . '/../backend/helpers.php';
require_once __DIR__ . '/../backend/auth.php';
require_once __DIR__ . '/../backend/dashboard.php';
require_once __DIR__ . '/../backend/team.php';

setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$input = getJsonInput();

if ($action === 'login') {
    handleAdminLogin($input);
} elseif ($action === 'me') {
    $auth = requireAdminAuth();
    handleAdminMe((int)$auth['admin_id']);
} elseif ($action === 'dashboard' || $action === 'dashboard-stats') {
    handleGetDashboardStats();
} elseif ($action === 'team') {
    if ($method === 'GET') {
        handleGetAdminTeam();
    } elseif ($method === 'POST') {
        handleAddAdmin($input);
    }
} elseif ($action === 'delete_admin' && $id > 0) {
    handleDeleteAdmin($id);
}

sendJson(['success' => false, 'detail' => 'Invalid admin action.'], 400);
