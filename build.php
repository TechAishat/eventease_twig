<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "Starting build process...\n";

require_once 'vendor/autoload.php';

// Create output directory if it doesn't exist
if (!file_exists('public')) {
    echo "Creating public directory...\n";
    mkdir('public', 0777, true);
}

// Set up Twig with the correct paths
$loader = new \Twig\Loader\FilesystemLoader('templates');

$twig = new \Twig\Environment($loader, [
    'autoescape' => false, // We'll handle escaping in the templates
    'cache' => false,     // Disable cache for development
    'debug' => true       // Enable debug mode
]);

// Add debug extension
$twig->addExtension(new \Twig\Extension\DebugExtension());

// Add a global variable for the base URL
$twig->addGlobal('base_url', '');

// Add asset function
$assetFunction = new \Twig\TwigFunction('asset', function ($path) {
    // Remove leading slash if present
    $path = ltrim($path, '/');
    return "/$path";
}, ['is_safe' => ['html']]);

$twig->addFunction($assetFunction);

echo "Twig environment initialized successfully\n";

// Create necessary directories in public
$publicDirs = ['styles', 'scripts', 'images', 'assets'];
foreach ($publicDirs as $dir) {
    $path = "public/$dir";
    if (!is_dir($path)) {
        mkdir($path, 0777, true);
    }
}

// Create a simple CSS file if it doesn't exist
$cssFile = 'public/styles/main.css';
if (!file_exists($cssFile)) {
    $cssContent = <<<CSS
/* Basic styles */
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    line-height: 1.6;
    margin: 0;
    padding: 20px;
    color: #333;
}

/* Header styles */
.header {
    background: #f8f9fa;
    padding: 1rem;
    margin-bottom: 2rem;
    border-bottom: 1px solid #e9ecef;
}

/* Button styles */
.btn {
    display: inline-block;
    padding: 0.5rem 1rem;
    background: #007bff;
    color: white;
    text-decoration: none;
    border-radius: 4px;
    margin: 0.5rem 0;
}

.btn:hover {
    background: #0056b3;
}

/* Container */
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
}
CSS;
    file_put_contents($cssFile, $cssContent);
    echo "Created default stylesheet: $cssFile\n";
}

// Create a simple JavaScript file if it doesn't exist
$jsFile = 'public/scripts/main.js';
if (!file_exists($jsFile)) {
    $jsContent = <<<JS
// Simple JavaScript for basic interactivity
document.addEventListener('DOMContentLoaded', function() {
    console.log('EventEase application loaded');
    
    // Add any client-side functionality here
    const buttons = document.querySelectorAll('button, .btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            console.log('Button clicked:', e.target.textContent.trim());
        });
    });
});
JS;
    file_put_contents($jsFile, $jsContent);
    echo "Created default JavaScript: $jsFile\n";
}

// Function to get all template files
function getTemplateFiles($dir) {
    $files = [];
    $items = scandir($dir);
    
    foreach ($items as $item) {
        if ($item === '.' || $item === '..') continue;
        $path = $dir . DIRECTORY_SEPARATOR . $item;
        if (is_dir($path)) {
            $files = array_merge($files, getTemplateFiles($path));
        } elseif (pathinfo($path, PATHINFO_EXTENSION) === 'twig') {
            $files[] = $path;
        }
    }
    
    return $files;
}

// Process templates
echo "Processing templates...\n";
$templateDir = realpath('templates');
$templateFiles = getTemplateFiles($templateDir);
$processed = 0;

foreach ($templateFiles as $templateFile) {
    try {
        // Get relative path from templates directory
        $relativePath = substr($templateFile, strlen($templateDir) + 1);
        
        // Convert to output path (change .twig to .html)
        $outputPath = 'public/' . str_replace('.twig', '.html', $relativePath);
        $outputDir = dirname($outputPath);
        
        // Create output directory if it doesn't exist
        if (!is_dir($outputDir)) {
            mkdir($outputDir, 0777, true);
        }
        
        // Get the template name (relative to templates directory)
        $templateName = str_replace('\\', '/', $relativePath);
        
        // Render the template
        $output = $twig->render($templateName);
        
        // Save the output
        file_put_contents($outputPath, $output);
        echo "Generated: $outputPath\n";
        $processed++;
    } catch (Exception $e) {
        echo "Error processing $templateFile: " . $e->getMessage() . "\n";
        echo "Stack trace: " . $e->getTraceAsString() . "\n";
    }
}

// Create a simple index.html if it doesn't exist
if (!file_exists('public/index.html')) {
    file_put_contents('public/index.html', '<!DOCTYPE html><html><head><title>EventEase</title><meta http-equiv="refresh" content="0;url=landing.html"></head><body>Redirecting...</body></html>');
    echo "Created redirect index.html\n";
}

if ($processed === 0) {
    echo "Warning: No templates were processed. Check if the templates directory contains .twig files.\n";
    echo "Current working directory: " . getcwd() . "\n";
    echo "Templates directory contents:\n";
    system('dir /s /b templates');
} else {
    echo "\nBuild completed successfully! Processed $processed templates.\n";
    echo "You can now deploy the contents of the 'public' directory to your web server.\n";
}

// Function to copy directory recursively
function copyDirectory($src, $dst) {
    $dir = opendir($src);
    @mkdir($dst);
    while (false !== ($file = readdir($dir))) {
        if (($file != '.') && ($file != '..')) {
            if (is_dir($src . '/' . $file)) {
                copyDirectory($src . '/' . $file, $dst . '/' . $file);
            } else {
                copy($src . '/' . $file, $dst . '/' . $file);
            }
        }
    }
    closedir($dir);
}
