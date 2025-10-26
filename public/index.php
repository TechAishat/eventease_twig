<?php

require_once __DIR__ . '/../vendor/autoload.php';

use Twig\Environment;
use Twig\Loader\FilesystemLoader;

$requestedPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';

if (PHP_SAPI === 'cli-server') {
    $localFile = __DIR__ . $requestedPath;
    if (is_file($localFile)) {
        return false;
    }
}

if (str_starts_with($requestedPath, '/assets/')) {
    $sharedFile = realpath(__DIR__ . '/../assets' . substr($requestedPath, strlen('/assets')));
    if ($sharedFile && str_starts_with($sharedFile, realpath(__DIR__ . '/../assets')) && is_file($sharedFile)) {
        $mime = mime_content_type($sharedFile) ?: 'application/octet-stream';
        header('Content-Type: ' . $mime);
        readfile($sharedFile);
        exit;
    }
}

$publicDirectories = [
    '/styles/' => __DIR__ . '/styles',
    '/scripts/' => __DIR__ . '/scripts',
];

foreach ($publicDirectories as $routePrefix => $baseDirectory) {
    if ($requestedPath === rtrim($routePrefix, '/')) {
        $requestedPath .= '/';
    }

    if (str_starts_with($requestedPath, $routePrefix)) {
        $relativePath = substr($requestedPath, strlen($routePrefix));
        $localFile = realpath($baseDirectory . '/' . ltrim($relativePath, '/'));
        if ($localFile && str_starts_with($localFile, realpath($baseDirectory)) && is_file($localFile)) {
            $mime = mime_content_type($localFile) ?: 'application/octet-stream';
            header('Content-Type: ' . $mime);
            readfile($localFile);
            exit;
        }
    }
}

$loader = new FilesystemLoader(__DIR__ . '/../templates');
$twig = new Environment($loader, [
    'cache' => false,
]);

$path = rtrim($requestedPath, '/') ?: '/';

$assetBase = '/assets';

$routes = [
    '/' => 'landing.html.twig',
    '/auth/login' => 'auth/login.html.twig',
    '/auth/signup' => 'auth/signup.html.twig',
    '/dashboard' => 'dashboard/index.html.twig',
    '/tickets' => 'tickets/index.html.twig',
];

if (!array_key_exists($path, $routes)) {
    http_response_code(302);
    header('Location: /');
    exit;
}

echo $twig->render($routes[$path], [
    'currentPath' => $path,
    'assetBase' => $assetBase,
]);
