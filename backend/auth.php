<?php
/**
 * ===================================================================
 * Earthen Beauty by Nupur - Authentication (Customer & Admin)
 * ===================================================================
 */

require_once __DIR__ . '/helpers.php';

// Customer Registration
function handleCustomerRegister(array $input) {
    $name = trim($input['name'] ?? '');
    $email = strtolower(trim($input['email'] ?? ''));
    $phone = trim($input['phone'] ?? '');
    $password = $input['password'] ?? '';

    if (empty($name) || empty($email) || empty($phone) || empty($password)) {
        sendJson(['success' => false, 'detail' => 'All fields (Name, Email, Phone, Password) are required.'], 400);
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendJson(['success' => false, 'detail' => 'Please provide a valid email address.'], 400);
    }

    if (strlen($password) < 6) {
        sendJson(['success' => false, 'detail' => 'Password must be at least 6 characters.'], 400);
    }

    $db = getDb();

    // Check if email already registered
    $stmt = $db->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        sendJson(['success' => false, 'detail' => 'An account with this email already exists. Please log in.'], 400);
    }

    $hash = hashUserPassword($password);

    $insert = $db->prepare("INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)");
    $insert->execute([$name, $email, $phone, $hash]);
    $userId = (int)$db->lastInsertId();

    $userObj = [
        'id'       => $userId,
        'name'     => $name,
        'email'    => $email,
        'phone'    => $phone,
        'is_admin' => false
    ];

    $token = createJwt([
        'user_id'  => $userId,
        'email'    => $email,
        'name'     => $name,
        'role'     => 'customer',
        'is_admin' => false
    ]);

    sendJson([
        'success'  => true,
        'is_admin' => false,
        'message'  => 'Registration successful! Welcome to Earthen Beauty.',
        'token'    => $token,
        'user'     => $userObj
    ], 201);
}

// Customer Login (Strictly for customers & shoppers - no admin privileges issued)
function handleCustomerLogin(array $input) {
    $email = strtolower(trim($input['email'] ?? ''));
    $password = $input['password'] ?? '';

    if (empty($email) || empty($password)) {
        sendJson(['success' => false, 'detail' => 'Please enter both email and password.'], 400);
    }

    $db = getDb();

    // Authenticate strictly against registered customers in users table
    $stmt = $db->prepare("SELECT id, name, email, phone, password_hash FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !verifyUserPassword($password, $user['password_hash'])) {
        sendJson(['success' => false, 'detail' => 'Invalid customer email or password. Please try again or create an account.'], 401);
    }

    $userObj = [
        'id'       => (int)$user['id'],
        'name'     => $user['name'],
        'email'    => $user['email'],
        'phone'    => $user['phone'],
        'is_admin' => false
    ];

    // Sign customer-only JWT token with HMAC-SHA256 (role: customer)
    $token = createJwt([
        'user_id'  => (int)$user['id'],
        'email'    => $user['email'],
        'name'     => $user['name'],
        'role'     => 'customer',
        'is_admin' => false
    ]);

    sendJson([
        'success'  => true,
        'is_admin' => false,
        'token'    => $token,
        'user'     => $userObj
    ]);
}

// Customer Profile
function handleCustomerMe(int $userId) {
    $db = getDb();
    $stmt = $db->prepare("SELECT id, name, email, phone, created_at FROM users WHERE id = ? LIMIT 1");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) {
        sendJson(['success' => false, 'detail' => 'User not found.'], 404);
    }

    sendJson([
        'success' => true,
        'user'    => $user
    ]);
}

// Admin Login (supports earthenbeauty@gmail.com / EARTHENBEAUTY)
function handleAdminLogin(array $input) {
    $email = strtolower(trim($input['email'] ?? ''));
    $password = $input['password'] ?? '';

    if (empty($email) || empty($password)) {
        sendJson(['success' => false, 'detail' => 'Email and password required.'], 400);
    }

    $db = getDb();
    $stmt = $db->prepare("SELECT id, name, email, password_hash, role FROM admins WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    $admin = $stmt->fetch();

    $isDefaultAdmin = ($email === 'earthenbeauty@gmail.com' && strtoupper(trim($password)) === 'EARTHENBEAUTY');

    // Fallback: If initial admin not yet in DB, check hardcoded default and auto-insert
    if (!$admin && $isDefaultAdmin) {
        $hash = hashUserPassword('EARTHENBEAUTY');
        $ins = $db->prepare("INSERT INTO admins (name, email, password_hash, role) VALUES (?, ?, ?, ?)");
        $ins->execute(['Nupur (Store Owner)', 'earthenbeauty@gmail.com', $hash, 'super_admin']);
        $adminId = (int)$db->lastInsertId();
        $admin = [
            'id'    => $adminId,
            'name'  => 'Nupur (Store Owner)',
            'email' => 'earthenbeauty@gmail.com',
            'role'  => 'super_admin'
        ];
    } else if (!$admin || (!verifyUserPassword($password, $admin['password_hash']) && !$isDefaultAdmin)) {
        sendJson(['success' => false, 'detail' => 'Invalid administrator credentials.'], 401);
    }

    $token = createJwt([
        'admin_id' => $admin['id'],
        'email'    => $admin['email'],
        'role'     => $admin['role'] ?? 'admin'
    ]);

    sendJson([
        'success' => true,
        'token'   => $token,
        'admin'   => [
            'id'    => (int)$admin['id'],
            'name'  => $admin['name'],
            'email' => $admin['email'],
            'role'  => $admin['role'] ?? 'admin'
        ]
    ]);
}

// Admin Me
function handleAdminMe(int $adminId) {
    $db = getDb();
    $stmt = $db->prepare("SELECT id, name, email, role, created_at FROM admins WHERE id = ? LIMIT 1");
    $stmt->execute([$adminId]);
    $admin = $stmt->fetch();

    if (!$admin) {
        sendJson(['success' => false, 'detail' => 'Admin profile not found.'], 404);
    }

    sendJson([
        'success' => true,
        'admin'   => $admin
    ]);
}
