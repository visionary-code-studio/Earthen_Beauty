<?php
/**
 * ===================================================================
 * Earthen Beauty by Nupur - Products & Catalog Operations
 * ===================================================================
 */

require_once __DIR__ . '/helpers.php';

// Public: Get all catalog products
function handleGetProducts(?string $category = null, bool $inStockOnly = false) {
    $db = getDb();

    $query = "SELECT * FROM products WHERE 1=1";
    $params = [];

    if ($inStockOnly) {
        $query .= " AND in_stock = 1";
    }

    if (!empty($category) && $category !== 'all') {
        $query .= " AND category = ?";
        $params[] = $category;
    }

    $query .= " ORDER BY id ASC";

    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $products = $stmt->fetchAll();

    // Format types for consistency
    foreach ($products as &$p) {
        $p['id'] = (int)$p['id'];
        $p['price'] = (float)$p['price'];
        $p['in_stock'] = (int)$p['in_stock'];
    }

    sendJson([
        'success'  => true,
        'count'    => count($products),
        'products' => $products
    ]);
}

// Public: Get single product by ID
function handleGetProductById(int $productId) {
    $db = getDb();
    $stmt = $db->prepare("SELECT * FROM products WHERE id = ? LIMIT 1");
    $stmt->execute([$productId]);
    $product = $stmt->fetch();

    if (!$product) {
        sendJson(['success' => false, 'detail' => 'Product not found.'], 404);
    }

    $product['id'] = (int)$product['id'];
    $product['price'] = (float)$product['price'];
    $product['in_stock'] = (int)$product['in_stock'];

    sendJson([
        'success' => true,
        'product' => $product
    ]);
}

// Admin: Add new product
function handleAddProduct(array $input) {
    requireAdminAuth();

    $name = trim($input['name'] ?? '');
    $category = trim($input['category'] ?? '');
    $subcategory = trim($input['subcategory'] ?? '');
    $price = (float)($input['price'] ?? 0);
    $image = trim($input['image'] ?? 'images/categories/Candle.jpeg');
    $description = trim($input['description'] ?? '');
    $inStock = isset($input['in_stock']) ? (int)$input['in_stock'] : 1;

    if (empty($name) || empty($category) || $price <= 0) {
        sendJson(['success' => false, 'detail' => 'Name, Category, and a valid Price are required.'], 400);
    }

    $db = getDb();
    $stmt = $db->prepare("
        INSERT INTO products (name, category, subcategory, price, image, description, in_stock)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$name, $category, $subcategory, $price, $image, $description, $inStock]);
    $newId = (int)$db->lastInsertId();

    sendJson([
        'success' => true,
        'id'      => $newId,
        'message' => 'Product added to catalog successfully.'
    ], 201);
}

// Admin: Update existing product (price, stock, details)
function handleUpdateProduct(int $productId, array $input) {
    requireAdminAuth();

    $db = getDb();

    // Verify existence
    $check = $db->prepare("SELECT id FROM products WHERE id = ? LIMIT 1");
    $check->execute([$productId]);
    if (!$check->fetch()) {
        sendJson(['success' => false, 'detail' => 'Product not found.'], 404);
    }

    $fields = [];
    $params = [];

    if (isset($input['name'])) {
        $fields[] = "name = ?";
        $params[] = trim($input['name']);
    }
    if (isset($input['category'])) {
        $fields[] = "category = ?";
        $params[] = trim($input['category']);
    }
    if (isset($input['subcategory'])) {
        $fields[] = "subcategory = ?";
        $params[] = trim($input['subcategory']);
    }
    if (isset($input['price'])) {
        $fields[] = "price = ?";
        $params[] = (float)$input['price'];
    }
    if (isset($input['image'])) {
        $fields[] = "image = ?";
        $params[] = trim($input['image']);
    }
    if (isset($input['description'])) {
        $fields[] = "description = ?";
        $params[] = trim($input['description']);
    }
    if (isset($input['in_stock'])) {
        $fields[] = "in_stock = ?";
        $params[] = (int)$input['in_stock'];
    }

    if (empty($fields)) {
        sendJson(['success' => true, 'message' => 'No fields to update.']);
    }

    $params[] = $productId;
    $sql = "UPDATE products SET " . implode(', ', $fields) . " WHERE id = ?";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    sendJson([
        'success' => true,
        'message' => 'Product updated successfully.'
    ]);
}

// Admin: Delete product
function handleDeleteProduct(int $productId) {
    requireAdminAuth();

    $db = getDb();
    $stmt = $db->prepare("DELETE FROM products WHERE id = ?");
    $stmt->execute([$productId]);

    sendJson([
        'success' => true,
        'message' => 'Product deleted from catalog.'
    ]);
}

// Admin: Upload image
function handleUploadProductImage() {
    requireAdminAuth();

    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        sendJson(['success' => false, 'detail' => 'Please choose a valid image file.'], 400);
    }

    $file = $_FILES['file'];
    $allowed = ['jpg', 'jpeg', 'png', 'webp'];
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

    if (!in_array($ext, $allowed)) {
        sendJson(['success' => false, 'detail' => 'Only JPG, PNG, and WEBP formats are supported.'], 400);
    }

    $filename = 'prod_' . bin2hex(random_bytes(6)) . '.' . $ext;
    $dest = UPLOAD_DIR . $filename;

    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        sendJson(['success' => false, 'detail' => 'Failed to save uploaded file.'], 500);
    }

    $relPath = 'images/uploads/' . $filename;

    sendJson([
        'success'   => true,
        'image_url' => $relPath
    ]);
}
