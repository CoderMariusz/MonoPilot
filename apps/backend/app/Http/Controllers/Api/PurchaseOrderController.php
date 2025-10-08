<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use Illuminate\Http\Request;

class PurchaseOrderController extends Controller
{
    public function index()
    {
        $purchaseOrders = PurchaseOrder::with('purchaseOrderItems.product')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($purchaseOrders);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'po_number' => 'required|unique:purchase_orders',
            'supplier' => 'required|string',
            'status' => 'nullable|in:draft,submitted,confirmed,received,cancelled',
            'due_date' => 'nullable|date',
        ]);

        $purchaseOrder = PurchaseOrder::create($validated);
        $purchaseOrder->load('purchaseOrderItems.product');

        return response()->json($purchaseOrder, 201);
    }

    public function show(PurchaseOrder $purchaseOrder)
    {
        $purchaseOrder->load('purchaseOrderItems.product');
        return response()->json($purchaseOrder);
    }

    public function update(Request $request, PurchaseOrder $purchaseOrder)
    {
        $validated = $request->validate([
            'po_number' => 'sometimes|unique:purchase_orders,po_number,' . $purchaseOrder->id,
            'supplier' => 'sometimes|string',
            'status' => 'sometimes|in:draft,submitted,confirmed,received,cancelled',
            'due_date' => 'nullable|date',
        ]);

        $purchaseOrder->update($validated);
        $purchaseOrder->load('purchaseOrderItems.product');

        return response()->json($purchaseOrder);
    }

    public function destroy(PurchaseOrder $purchaseOrder)
    {
        $purchaseOrder->delete();
        return response()->json(null, 204);
    }
}
