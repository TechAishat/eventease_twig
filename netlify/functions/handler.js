const { Builder } = require('@netlify/functions');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Path to the PHP binary in the Netlify environment
const PHP_BINARY = '/opt/buildhome/php8.1/bin/php';

const handler = async (event, context) => {
  try {
    // Get the path from the request
    const path = event.path.replace(/^\/+/, '');
    
    // If it's a static file, serve it directly
    if (path.match(/\.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': getContentType(path),
          'Cache-Control': 'public, max-age=31536000, immutable'
        },
        body: fs.readFileSync(`public/${path}`).toString('base64'),
        isBase64Encoded: true
      };
    }

    // For HTML requests, render the PHP template
    const output = execSync(`${PHP_BINARY} ${__dirname}/../../public/index.php ${path}`, {
      env: { ...process.env, PATH: process.env.PATH },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=0, must-revalidate'
      },
      body: output.toString()
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: 'Internal Server Error'
    };
  }
};

function getContentType(path) {
  const extension = path.split('.').pop().toLowerCase();
  const types = {
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf',
    'eot': 'application/vnd.ms-fontobject',
    'ico': 'image/x-icon'
  };
  return types[extension] || 'application/octet-stream';
}

exports.handler = Builder(handler);
