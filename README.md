# EventEase – Twig implementation

This folder contains the Twig + PHP build that mirrors the React and Vue experiences. It renders the same landing, auth, dashboard, and ticket management flows while using PHP/Twig templates and localStorage-driven JavaScript for state.

## Requirements

- PHP ≥ 8.2 (CLI)
- Composer (global or `composer.phar` included in this folder)

## Getting started

```bash
php composer.phar install   # installs Twig dependencies
php -S localhost:8000 -t public
```

Visit <http://localhost:8000/> to browse the app. The router in `public/index.php` handles asset requests and page rendering.

## Deployment notes

- Deploy to any PHP host (Render, Railway, shared hosting, etc.).
- Set the web root to `public/` so routes resolve correctly.
- Install dependencies on the server with `composer install --no-dev --optimize-autoloader`.
- Ensure the shared `/assets` directory is accessible (the front controller rewrites `/assets/*` to the shared folder).

## Useful scripts

If you installed Composer globally, replace `php composer.phar` with `composer` in the commands above.
