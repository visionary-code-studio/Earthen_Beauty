<?php
/**
 * ===================================================================
 * Earthen Beauty by Nupur - Local PHP Built-in Server Router
 * ===================================================================
 * Usage: php -S 127.0.0.1:8000 router.php
 */

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$file = __DIR__ . $uri;

// If static file exists, serve it directly
if ($uri !== '/' && file_exists($file) && !is_dir($file)) {
    // Correct mime types for CSS and JS
    $ext = pathinfo($file, PATHINFO_EXTENSION);
    if ($ext === 'css') {
        header('Content-Type: text/css');
    } elseif ($ext === 'js') {
        header('Content-Type: application/javascript');
    } elseif (in_array($ext, ['jpg', 'jpeg'])) {
        header('Content-Type: image/jpeg');
    } elseif ($ext === 'png') {
        header('Content-Type: image/png');
    } elseif ($ext === 'webp') {
        header('Content-Type: image/webp');
    }
    return false;
}

// Route API requests to api/index.php
if (strpos($uri, '/api') === 0) {
    require __DIR__ . '/api/index.php';
    exit;
}

// Default index.html
if ($uri === '/' || $uri === '') {
    require __DIR__ . '/index.html';
    exit;
}

// If requesting an html page without .html extension
if (file_exists($file . '.html')) {
    require $file . '.html';
    exit;
}

return false;
