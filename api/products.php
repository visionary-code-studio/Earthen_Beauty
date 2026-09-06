<?php
/**
 * Direct Endpoint: api/products.php
 */
require_once __DIR__ . '/../backend/config.php';
require_once __DIR__ . '/../backend/helpers.php';
require_once __DIR__ . '/../backend/products.php';

setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$input = getJsonInput();

if ($method === 'GET') {
    if ($id > 0) {
        handleGetProductById($id);
    } else {
        $category = $_GET['category'] ?? null;
        $inStockOnly = isset($_GET['in_stock_only']) && ($_GET['in_stock_only'] === 'true' || $_GET['in_stock_only'] === '1');
        handleGetProducts($category, $inStockOnly);
    }
} elseif ($method === 'POST') {
    if ($action === 'add') {
        handleAddProduct($input);
    } elseif ($action === 'update' && $id > 0) {
        handleUpdateProduct($id, $input);
    } elseif ($action === 'delete' && $id > 0) {
        handleDeleteProduct($id);
    } elseif ($action === 'upload') {
        handleUploadProductImage();
    }
} elseif ($method === 'PUT' && $id > 0) {
    handleUpdateProduct($id, $input);
} elseif ($method === 'DELETE' && $id > 0) {
    handleDeleteProduct($id);
}

sendJson(['success' => false, 'detail' => 'Invalid product action.'], 400);
