<?php
require_once 'vendor/autoload.php';

// Set up Twig
$loader = new \Twig\Loader\FilesystemLoader('templates');
$twig = new \Twig\Environment($loader, [
    'cache' => false, // Disable cache for development
    'auto_reload' => true,
]);

// Create output directory if it doesn't exist
$outputDir = __DIR__ . '/dist';
if (!file_exists($outputDir)) {
    mkdir($outputDir, 0777, true);
}

// Get all .twig files in the templates directory
$templates = new RecursiveIteratorIterator(new RecursiveDirectoryIterator('templates'));
$twigFiles = new RegexIterator($templates, '/^.+\\.twig$/i', RecursiveRegexIterator::GET_MATCH);

// Compile each template
foreach ($twigFiles as $file) {
    $templatePath = $file[0];
    $relativePath = str_replace('templates/', '', $templatePath);
    $outputPath = $outputDir . '/' . str_replace('.twig', '.html', $relativePath);
    
    // Create subdirectories if they don't exist
    $outputSubdir = dirname($outputPath);
    if (!file_exists($outputSubdir)) {
        mkdir($outputSubdir, 0777, true);
    }
    
    try {
        // Render template
        $html = $twig->render(str_replace('templates/', '', $templatePath));
        
        // Save to output file
        file_put_contents($outputPath, $html);
        echo "Compiled: $templatePath -> $outputPath\n";
    } catch (Exception $e) {
        echo "Error compiling $templatePath: " . $e->getMessage() . "\n";
    }
}

echo "\nCompilation complete! Files saved to /dist directory.\n";
