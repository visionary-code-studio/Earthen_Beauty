<?php
/**
 * ===================================================================
 * Earthen Beauty by Nupur - Studio Admin Dashboard Statistics
 * ===================================================================
 */

require_once __DIR__ . '/helpers.php';

function handleGetDashboardStats() {
    requireAdminAuth();

    $db = getDb();

    // Total Revenue (paid orders)
    $revStmt = $db->query("SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE payment_status = 'paid'");
    $totalRevenue = (float)$revStmt->fetchColumn();

    // Total Orders
    $ordStmt = $db->query("SELECT COUNT(*) FROM orders");
    $totalOrders = (int)$ordStmt->fetchColumn();

    // Paid Orders
    $paidStmt = $db->query("SELECT COUNT(*) FROM orders WHERE payment_status = 'paid'");
    $paidOrders = (int)$paidStmt->fetchColumn();

    // Active Products in Catalog
    $prodStmt = $db->query("SELECT COUNT(*) FROM products WHERE in_stock = 1");
    $activeProducts = (int)$prodStmt->fetchColumn();

    // Total Registered Customers
    $custStmt = $db->query("SELECT COUNT(*) FROM users");
    $totalCustomers = (int)$custStmt->fetchColumn();

    // Recent 5 orders
    $recentStmt = $db->query("SELECT * FROM orders ORDER BY id DESC LIMIT 5");
    $recentOrders = $recentStmt->fetchAll();

    foreach ($recentOrders as &$o) {
        $o['id'] = (int)$o['id'];
        $o['total_amount'] = (float)$o['total_amount'];
        $o['items'] = json_decode($o['items_json'] ?: '[]', true);
        $o['shipping_address'] = json_decode($o['shipping_address'] ?: '{}', true);
    }

    sendJson([
        'success' => true,
        'stats'   => [
            'total_revenue'   => round($totalRevenue, 2),
            'total_orders'    => $totalOrders,
            'paid_orders'     => $paidOrders,
            'active_products' => $activeProducts,
            'total_customers' => $totalCustomers
        ],
        'recent_orders' => $recentOrders
    ]);
}
