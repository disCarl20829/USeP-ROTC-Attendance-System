<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Behind a tunnel / reverse proxy (e.g. VS Code port forwarding), trust its
        // X-Forwarded-* headers so URLs and redirects use the public https address.
        // Opt-in: TRUSTED_PROXIES=* (or a comma-separated list of proxy IPs).
        $proxies = env('TRUSTED_PROXIES');
        if (is_string($proxies) && $proxies !== '') {
            $middleware->trustProxies(at: $proxies === '*' ? '*' : array_map('trim', explode(',', $proxies)));
        }

        // Exempt logout from CSRF token verification
        $middleware->validateCsrfTokens(except: [
            '/logout',
        ]);

        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'supabase.auth'    => \App\Http\Middleware\SupabaseAuth::class,
            'supabase.guest'   => \App\Http\Middleware\RedirectIfSupabaseAuthenticated::class,
            'profile.complete' => \App\Http\Middleware\EnsureProfileComplete::class,
            'permission'       => \App\Http\Middleware\EnsurePermission::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();