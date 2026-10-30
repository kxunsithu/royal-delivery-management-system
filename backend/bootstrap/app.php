<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // CORS headers for cross-origin requests (frontend on :5173, backend on :8000)
        $middleware->append(\Illuminate\Http\Middleware\HandleCors::class);
        // API-only app: do not redirect unauthenticated guests to a named 'login' route
        $middleware->redirectGuestsTo(fn () => null);

        // Ensure deactivated users cannot access the API even with an old token
        $middleware->appendToGroup('api', \App\Http\Middleware\EnsureActiveUser::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Return JSON for all API requests
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // Custom 401 response
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Unauthenticated. Please login.'], 401);
            }
        });

        // Custom 403 response
        $exceptions->render(function (\Illuminate\Auth\Access\AuthorizationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'You do not have permission to perform this action.'], 403);
            }
        });

        // Custom 404 response
        $exceptions->render(function (\Illuminate\Database\Eloquent\ModelNotFoundException $e, Request $request) {
            if ($request->is('api/*')) {
                $model = class_basename($e->getModel());
                return response()->json(['message' => "{$model} not found."], 404);
            }
        });

        // Custom validation error response
        $exceptions->render(function (\Illuminate\Validation\ValidationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'Validation failed.',
                    'errors' => $e->errors(),
                ], 422);
            }
        });
    })->create();
