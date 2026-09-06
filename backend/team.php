<?php
/**
 * ===================================================================
 * Earthen Beauty by Nupur - Studio Admin Team Management
 * ===================================================================
 */

require_once __DIR__ . '/helpers.php';

// List administrators
function handleGetAdminTeam() {
    requireAdminAuth();

    $db = getDb();
    $stmt = $db->query("SELECT id, name, email, role, created_at FROM admins ORDER BY id ASC");
    $admins = $stmt->fetchAll();

    foreach ($admins as &$a) {
        $a['id'] = (int)$a['id'];
    }

    sendJson([
        'success' => true,
        'admins'  => $admins
    ]);
}

// Add administrator
function handleAddAdmin(array $input) {
    requireAdminAuth();

    $name = trim($input['name'] ?? '');
    $email = strtolower(trim($input['email'] ?? ''));
    $password = $input['password'] ?? '';
    $role = trim($input['role'] ?? 'admin');

    if (empty($name) || empty($email) || empty($password)) {
        sendJson(['success' => false, 'detail' => 'Name, email, and password are required.'], 400);
    }

    $db = getDb();

    // Check email uniqueness
    $stmt = $db->prepare("SELECT id FROM admins WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        sendJson(['success' => false, 'detail' => 'An administrator with this email already exists.'], 400);
    }

    $hash = hashUserPassword($password);
    $ins = $db->prepare("INSERT INTO admins (name, email, password_hash, role) VALUES (?, ?, ?, ?)");
    $ins->execute([$name, $email, $hash, $role]);

    sendJson([
        'success' => true,
        'message' => 'New administrator added successfully.'
    ], 201);
}

// Delete administrator
function handleDeleteAdmin(int $adminId) {
    $currentAdmin = requireAdminAuth();

    $db = getDb();

    // Ensure at least one admin remains
    $count = (int)$db->query("SELECT COUNT(*) FROM admins")->fetchColumn();
    if ($count <= 1) {
        sendJson(['success' => false, 'detail' => 'Cannot delete the only remaining administrator.'], 400);
    }

    if ((int)$currentAdmin['admin_id'] === $adminId) {
        sendJson(['success' => false, 'detail' => 'Cannot delete your own active administrator account.'], 400);
    }

    $stmt = $db->prepare("DELETE FROM admins WHERE id = ?");
    $stmt->execute([$adminId]);

    sendJson([
        'success' => true,
        'message' => 'Administrator removed successfully.'
    ]);
}
