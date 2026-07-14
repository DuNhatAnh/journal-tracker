<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use App\Exceptions\AiServiceException;
use Illuminate\Database\QueryException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (\Throwable $e, Request $request) {
            // Only apply this JSON structure for API requests
            if ($request->is('api/*') || $request->expectsJson()) {
                
                $requestId = $request->header('X-Request-ID', (string) Str::uuid());

                $statusCode = 500;
                $errorCode = 'INTERNAL_SERVER_ERROR';
                $message = 'Đã có lỗi hệ thống xảy ra.';
                $details = [];

                if ($e instanceof ValidationException) {
                    $statusCode = 422;
                    $errorCode = 'VALIDATION_ERROR';
                    $message = 'Dữ liệu không hợp lệ.';
                    $details = $e->errors();
                    // No logging
                } elseif ($e instanceof \InvalidArgumentException) {
                    $statusCode = 400;
                    $errorCode = 'INVALID_ARGUMENT';
                    $message = $e->getMessage();
                    // No logging
                } elseif ($e instanceof ModelNotFoundException || $e instanceof NotFoundHttpException) {
                    $statusCode = 404;
                    $errorCode = 'NOT_FOUND';
                    $message = 'Không tìm thấy dữ liệu.';
                    // No logging
                } elseif ($e instanceof AiServiceException) {
                    $statusCode = 503;
                    $errorCode = 'AI_SERVICE_ERROR';
                    $message = 'Dịch vụ AI đang gián đoạn, vui lòng thử lại sau.';
                    Log::error("AiServiceException [{$requestId}]: " . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
                } elseif ($e instanceof QueryException || $e instanceof \PDOException) {
                    $statusCode = 500;
                    $errorCode = 'DATABASE_ERROR';
                    $message = 'Lỗi hệ thống cơ sở dữ liệu.';
                    Log::critical("DatabaseError [{$requestId}]: " . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
                } else {
                    Log::error("UnhandledException [{$requestId}]: " . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
                }

                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => $errorCode,
                        'message' => $message,
                        'requestId' => $requestId,
                        'details' => empty($details) ? new \stdClass() : $details,
                    ]
                ], $statusCode);
            }
        });
    })->create();
