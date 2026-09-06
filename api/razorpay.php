<?php
/**
 * Direct Endpoint: api/razorpay.php
 */
require_once __DIR__ . '/../backend/config.php';
require_once __DIR__ . '/../backend/helpers.php';
require_once __DIR__ . '/../backend/razorpay.php';

setCorsHeaders();

$action = $_GET['action'] ?? '';
$input = getJsonInput();

if ($action === 'create_order') {
    handleCreateRazorpayOrder($input);
} elseif ($action === 'verify_payment') {
    handleVerifyRazorpayPayment($input);
}

sendJson(['success' => false, 'detail' => 'Invalid razorpay action.'], 400);
