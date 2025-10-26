<?php
require_once 'vendor/autoload.php';

$loader = new \Twig\Loader\FilesystemLoader('templates');
$twig = new \Twig\Environment($loader);

// Create output directory if it doesn't exist
if (!file_exists('public')) {
    mkdir('public', 0777, true);
}

// Copy all assets
if (is_dir('assets')) {
    if (!is_dir('public/assets')) {
        mkdir('public/assets', 0777, true);
    }
    system('xcopy /E /I /Y assets public\assets');
}

// Render templates
$templates = new RecursiveIteratorIterator(new RecursiveDirectoryIterator('templates'));
foreach ($templates as $template) {
    if ($template->isFile() && $template->getExtension() === 'twig') {
        $outputPath = 'public' . str_replace(['templates', '.twig'], ['', '.html'], $template->getPathname());
        $outputDir = dirname($outputPath);
        
        if (!is_dir($outputDir)) {
            mkdir($outputDir, 0777, true);
        }
        
        file_put_contents($outputPath, $twig->render($template->getBasename()));
    }
}

echo "Build completed successfully!\n";
