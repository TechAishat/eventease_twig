<?php

require_once __DIR__ . '/../../../vendor/autoload.php';

// Get the original request path
$request_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$request_uri = rtrim($request_uri, '/') ?: '/';

// Check if it's a static file request
$static_extensions = ['css', 'js', 'png', 'jpg', 'jpeg', 'gif', 'ico', 'svg', 'woff', 'woff2', 'ttf', 'eot'];
$extension = pathinfo($request_uri, PATHINFO_EXTENSION);

// Handle static files
if (in_array($extension, $static_extensions)) {
    $file_path = __DIR__ . '/../../../public' . $request_uri;
    
    if (file_exists($file_path)) {
        $mime_types = [
            'css'  => 'text/css',
            'js'   => 'application/javascript',
            'png'  => 'image/png',
            'jpg'  => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'gif'  => 'image/gif',
            'ico'  => 'image/x-icon',
            'svg'  => 'image/svg+xml',
            'woff' => 'font/woff',
            'woff2'=> 'font/woff2',
            'ttf'  => 'font/ttf',
            'eot'  => 'application/vnd.ms-fontobject'
        ];
        
        header('Content-Type: ' . ($mime_types[$extension] ?? 'application/octet-stream'));
        readfile($file_path);
        exit;
    }
}

// Handle PHP/Twig requests
chdir(__DIR__ . '/../../..');
require_once 'public/index.php';
