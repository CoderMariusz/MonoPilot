<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\WorkOrderController;
use App\Http\Controllers\Api\PurchaseOrderController;
use App\Http\Controllers\Api\TransferOrderController;
use App\Http\Controllers\Api\ProductionReportController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProductLineSettingsController;

Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    return $request->user()->load('roles', 'permissions');
});

// TODO: Add auth:sanctum middleware when authentication system is implemented
Route::apiResource('work-orders', WorkOrderController::class);
Route::apiResource('purchase-orders', PurchaseOrderController::class);
Route::apiResource('transfer-orders', TransferOrderController::class);

Route::get('/products', [ProductController::class, 'index']);
Route::post('/products', [ProductController::class, 'store']);
Route::get('/products/{id}', [ProductController::class, 'show']);
Route::patch('/products/{id}', [ProductController::class, 'update']);
Route::delete('/products/{id}', [ProductController::class, 'destroy']);

// Product Line Settings
Route::get('/products/{productId}/line-settings', [ProductLineSettingsController::class, 'indexByProduct']);
Route::post('/products/{productId}/line-settings', [ProductLineSettingsController::class, 'bulkUpsert']);
Route::get('/line-settings', [ProductLineSettingsController::class, 'index']);
Route::patch('/line-settings/{id}', [ProductLineSettingsController::class, 'update']);
Route::delete('/line-settings/{id}', [ProductLineSettingsController::class, 'destroy']);

// Production Reports
Route::get('production/yield-report', [ProductionReportController::class, 'yieldReport']);
Route::get('production/consume-report', [ProductionReportController::class, 'consumeReport']);

