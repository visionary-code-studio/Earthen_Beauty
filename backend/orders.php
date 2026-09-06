<?php
/**
 * ===================================================================
 * Earthen Beauty by Nupur - Order Retrieval & Management
 * ===================================================================
 */

require_once __DIR__ . '/helpers.php';

// Customer: Get personal order history
function handleGetCustomerOrders(int $userId, string $email) {
    $db = getDb();
    $stmt = $db->prepare("
        SELECT * FROM orders 
        WHERE user_id = ? OR customer_email = ?
        ORDER BY id DESC
    ");
    $stmt->execute([$userId, $email]);
    $orders = $stmt->fetchAll();

    foreach ($orders as &$o) {
        $o['id'] = (int)$o['id'];
        $o['subtotal'] = (float)$o['subtotal'];
        $o['shipping_fee'] = (float)$o['shipping_fee'];
        $o['total_amount'] = (float)$o['total_amount'];
        $o['items'] = json_decode($o['items_json'] ?: '[]', true);
        $o['shipping_address'] = json_decode($o['shipping_address'] ?: '{}', true);
    }

    sendJson([
        'success' => true,
        'count'   => count($orders),
        'orders'  => $orders
    ]);
}

// Admin: Get all orders across the studio
function handleGetAdminOrders() {
    requireAdminAuth();

    $db = getDb();
    $stmt = $db->query("SELECT * FROM orders ORDER BY id DESC");
    $orders = $stmt->fetchAll();

    foreach ($orders as &$o) {
        $o['id'] = (int)$o['id'];
        $o['subtotal'] = (float)$o['subtotal'];
        $o['shipping_fee'] = (float)$o['shipping_fee'];
        $o['total_amount'] = (float)$o['total_amount'];
        $o['items'] = json_decode($o['items_json'] ?: '[]', true);
        $o['shipping_address'] = json_decode($o['shipping_address'] ?: '{}', true);
    }

    sendJson([
        'success' => true,
        'count'   => count($orders),
        'orders'  => $orders
    ]);
}

// Admin: Update order payment or shipment status
function handleUpdateOrderStatus(int $orderId, array $input) {
    requireAdminAuth();

    $db = getDb();

    $paymentStatus = $input['payment_status'] ?? null;
    $shipmentStatus = $input['shipment_status'] ?? null;

    $fields = [];
    $params = [];

    if ($paymentStatus) {
        $fields[] = "payment_status = ?";
        $params[] = trim($paymentStatus);
    }

    if ($shipmentStatus) {
        $fields[] = "shipment_status = ?";
        $params[] = trim($shipmentStatus);
    }

    if (!empty($fields)) {
        $params[] = $orderId;
        $sql = "UPDATE orders SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
    }

    sendJson([
        'success' => true,
        'message' => 'Order status updated successfully.'
    ]);
}
