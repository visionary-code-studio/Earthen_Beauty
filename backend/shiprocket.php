<?php
/**
 * ===================================================================
 * Earthen Beauty by Nupur - Shiprocket Logistics & Courier Integration
 * ===================================================================
 */

require_once __DIR__ . '/config.php';

// Authenticate and get Shiprocket Bearer Token
function getShiprocketToken(): ?string {
    if (empty(SHIPROCKET_EMAIL) || empty(SHIPROCKET_PASSWORD)) {
        return null; // Demo / unconfigured mode
    }

    $tokenFile = __DIR__ . '/../data/shiprocket_token.json';
    if (file_exists($tokenFile)) {
        $cached = json_decode(file_get_contents($tokenFile), true);
        if (isset($cached['token']) && isset($cached['expires_at']) && time() < $cached['expires_at']) {
            return $cached['token'];
        }
    }

    // Request new token
    $ch = curl_init('https://apiv2.shiprocket.in/v1/external/auth/login');
    $payload = json_encode([
        'email'    => SHIPROCKET_EMAIL,
        'password' => SHIPROCKET_PASSWORD
    ]);

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
        CURLOPT_TIMEOUT        => 10
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200) {
        $data = json_decode($response, true);
        if (isset($data['token'])) {
            $token = $data['token'];
            file_put_contents($tokenFile, json_encode([
                'token'      => $token,
                'expires_at' => time() + (60 * 60 * 24 * 8) // Valid for ~10 days
            ]));
            return $token;
        }
    }

    return null;
}

// Create Ad-hoc Shipment Order in Shiprocket
function dispatchShiprocketOrder(array $order): array {
    $token = getShiprocketToken();

    $shippingAddress = is_array($order['shipping_address']) 
        ? $order['shipping_address'] 
        : json_decode($order['shipping_address'] ?? '{}', true);

    $items = is_array($order['items_json'])
        ? $order['items_json']
        : json_decode($order['items_json'] ?? '[]', true);

    // Format items for Shiprocket
    $orderItems = [];
    foreach ($items as $item) {
        $orderItems[] = [
            'name'          => $item['name'] ?? 'Handcrafted Candle',
            'sku'           => 'EB-SKU-' . ($item['id'] ?? 'PROD'),
            'units'         => (int)($item['quantity'] ?? 1),
            'selling_price' => (float)($item['price'] ?? 100),
            'discount'      => 0,
            'tax'           => 0
        ];
    }

    // Call live Shiprocket API if token available
    if ($token) {
        $ch = curl_init('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc');
        $payload = json_encode([
            'order_id'              => $order['order_number'],
            'order_date'            => date('Y-m-d H:i'),
            'pickup_location'       => 'Earthen Beauty Studio',
            'billing_customer_name' => $order['customer_name'] ?: 'Customer',
            'billing_last_name'     => '',
            'billing_address'       => $shippingAddress['street'] ?? 'Local Delivery',
            'billing_city'          => $shippingAddress['city'] ?? 'Bengaluru',
            'billing_pincode'       => $shippingAddress['pincode'] ?? '560001',
            'billing_state'         => $shippingAddress['state'] ?? 'Karnataka',
            'billing_country'       => 'India',
            'billing_email'         => $order['customer_email'] ?: 'orders@earthenbeauty.com',
            'billing_phone'         => $order['customer_phone'] ?: '+91 8296891802',
            'shipping_is_billing'   => true,
            'order_items'           => $orderItems,
            'payment_method'        => 'Prepaid',
            'sub_total'             => (float)$order['total_amount'],
            'length'                => 15,
            'breadth'               => 15,
            'height'                => 12,
            'weight'                => 0.8
        ]);

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $payload,
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $token
            ],
            CURLOPT_TIMEOUT        => 12
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 200 || $httpCode === 201) {
            $result = json_decode($response, true);
            return [
                'shiprocket_order_id' => (string)($result['order_id'] ?? ('SR_' . $order['order_number'])),
                'shipment_status'     => (string)($result['status'] ?? 'Manifested'),
                'tracking_number'     => (string)($result['awb_code'] ?? ('AWB' . strtoupper(bin2hex(random_bytes(4)))))
            ];
        }
    }

    // Demo Simulation Fallback
    $demoShipId = 'SR_SHIP_' . strtoupper(bin2hex(random_bytes(6)));
    $demoTracking = 'EBTRK' . strtoupper(bin2hex(random_bytes(4)));

    return [
        'shiprocket_order_id' => $demoShipId,
        'shipment_status'     => 'Manifested (Demo Mode)',
        'tracking_number'     => $demoTracking
    ];
}
