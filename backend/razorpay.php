<?php
/**
 * ===================================================================
 * Earthen Beauty by Nupur - Razorpay Payment Gateway Integration
 * ===================================================================
 */

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/shiprocket.php';

// Create Razorpay Order & Save Pending DB Order
function handleCreateRazorpayOrder(array $input) {
    $items = $input['items'] ?? [];
    $subtotal = (float)($input['subtotal'] ?? 0);
    $shippingFee = isset($input['shipping_fee']) ? (float)$input['shipping_fee'] : 90.0;
    $totalAmount = (float)($input['total_amount'] ?? ($subtotal + $shippingFee));
    $orderType = $input['order_type'] ?? 'standard_cart';
    $shippingAddress = $input['shipping_address'] ?? [];
    $customerName = trim($input['customer_name'] ?? '');
    $customerPhone = trim($input['customer_phone'] ?? '');
    $customerEmail = trim($input['customer_email'] ?? '');

    // Optional logged-in user id
    $bearer = getBearerToken();
    $userId = null;
    if ($bearer) {
        $tokenData = verifyJwt($bearer);
        if ($tokenData && isset($tokenData['user_id'])) {
            $userId = (int)$tokenData['user_id'];
        }
    }

    if (empty($items) || $totalAmount <= 0) {
        sendJson(['success' => false, 'detail' => 'Cart items and a valid order amount are required.'], 400);
    }

    // Generate unique order number
    $orderNumber = 'EB-' . date('Ymd') . '-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 4));
    $amountInPaise = (int)round($totalAmount * 100);

    $razorpayOrderId = null;

    // Attempt live Razorpay API call if real credentials provided
    if (RAZORPAY_KEY_ID && strpos(RAZORPAY_KEY_ID, 'rzp_test_') === 0 && RAZORPAY_KEY_ID !== 'rzp_test_earthenbeauty2026') {
        $ch = curl_init('https://api.razorpay.com/v1/orders');
        $payload = json_encode([
            'amount'   => $amountInPaise,
            'currency' => 'INR',
            'receipt'  => $orderNumber,
            'notes'    => [
                'customer_name' => $customerName,
                'order_type'    => $orderType
            ]
        ]);

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $payload,
            CURLOPT_USERPWD        => RAZORPAY_KEY_ID . ':' . RAZORPAY_KEY_SECRET,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
            CURLOPT_TIMEOUT        => 10
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 200) {
            $data = json_decode($response, true);
            $razorpayOrderId = $data['id'] ?? null;
        }
    }

    // Fallback / Sandbox Demo Simulation Mode
    if (!$razorpayOrderId) {
        $razorpayOrderId = 'order_demo_' . bin2hex(random_bytes(8));
    }

    // Insert pending order in MySQL database
    $db = getDb();
    $stmt = $db->prepare("
        INSERT INTO orders (
            order_number, user_id, customer_name, customer_email, customer_phone,
            order_type, items_json, subtotal, shipping_fee, total_amount,
            shipping_address, payment_status, razorpay_order_id, shipment_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, 'Pending Payment')
    ");

    $stmt->execute([
        $orderNumber,
        $userId,
        $customerName,
        $customerEmail,
        $customerPhone,
        $orderType,
        json_encode($items, JSON_UNESCAPED_UNICODE),
        $subtotal,
        $shippingFee,
        $totalAmount,
        json_encode($shippingAddress, JSON_UNESCAPED_UNICODE),
        $razorpayOrderId
    ]);

    sendJson([
        'success'           => true,
        'order_number'      => $orderNumber,
        'razorpay_order_id' => $razorpayOrderId,
        'amount'            => $amountInPaise,
        'currency'          => 'INR',
        'key_id'            => RAZORPAY_KEY_ID,
        'customer'          => [
            'name'  => $customerName,
            'email' => $customerEmail,
            'phone' => $customerPhone
        ]
    ]);
}

// Verify Razorpay Payment Signature
function handleVerifyRazorpayPayment(array $input) {
    $orderNumber = trim($input['order_number'] ?? '');
    $razorpayOrderId = trim($input['razorpay_order_id'] ?? '');
    $razorpayPaymentId = trim($input['razorpay_payment_id'] ?? '');
    $signature = trim($input['razorpay_signature'] ?? '');

    if (empty($orderNumber) || empty($razorpayOrderId) || empty($razorpayPaymentId)) {
        sendJson(['success' => false, 'detail' => 'Order details and Payment ID are required.'], 400);
    }

    $db = getDb();
    $stmt = $db->prepare("SELECT * FROM orders WHERE order_number = ? LIMIT 1");
    $stmt->execute([$orderNumber]);
    $order = $stmt->fetch();

    if (!$order) {
        sendJson(['success' => false, 'detail' => 'Order not found in database.'], 404);
    }

    // Verify signature
    $isValid = false;
    if (strpos($razorpayOrderId, 'order_demo_') === 0) {
        $isValid = true; // Demo simulation mode
    } else {
        $expectedSignature = hash_hmac('sha256', $razorpayOrderId . '|' . $razorpayPaymentId, RAZORPAY_KEY_SECRET);
        $isValid = hash_equals($expectedSignature, $signature);
    }

    if (!$isValid) {
        sendJson(['success' => false, 'detail' => 'Payment verification failed: invalid signature.'], 400);
    }

    // Update order status to paid
    $upd = $db->prepare("
        UPDATE orders 
        SET payment_status = 'paid', razorpay_payment_id = ?
        WHERE order_number = ?
    ");
    $upd->execute([$razorpayPaymentId, $orderNumber]);

    // Dispatch via Shiprocket
    $shipmentResult = dispatchShiprocketOrder($order);

    // Update shipment tracking in database
    $updShip = $db->prepare("
        UPDATE orders 
        SET shiprocket_order_id = ?, shipment_status = ?, tracking_number = ?
        WHERE order_number = ?
    ");
    $updShip->execute([
        $shipmentResult['shiprocket_order_id'],
        $shipmentResult['shipment_status'],
        $shipmentResult['tracking_number'],
        $orderNumber
    ]);

    sendJson([
        'success'           => true,
        'message'           => 'Payment confirmed! Your order has been dispatched via Shiprocket.',
        'order_number'      => $orderNumber,
        'payment_status'    => 'paid',
        'shiprocket_status' => $shipmentResult['shipment_status'],
        'tracking_number'   => $shipmentResult['tracking_number']
    ]);
}
