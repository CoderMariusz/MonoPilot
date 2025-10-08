<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\WorkOrderController;
use App\Http\Controllers\Api\PurchaseOrderController;
use App\Http\Controllers\Api\TransferOrderController;
use App\Http\Controllers\Api\ProductionReportController;

Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    return $request->user()->load('roles', 'permissions');
});

// TODO: Add auth:sanctum middleware when authentication system is implemented
Route::apiResource('work-orders', WorkOrderController::class);
Route::apiResource('purchase-orders', PurchaseOrderController::class);
Route::apiResource('transfer-orders', TransferOrderController::class);

// Production Reports
Route::get('production/yield-report', [ProductionReportController::class, 'yieldReport']);
Route::get('production/consume-report', [ProductionReportController::class, 'consumeReport']);

