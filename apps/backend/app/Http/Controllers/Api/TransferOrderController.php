<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TransferOrder;
use Illuminate\Http\Request;

class TransferOrderController extends Controller
{
    public function index()
    {
        $transferOrders = TransferOrder::with([
            'fromLocation',
            'toLocation',
            'transferOrderItems.product'
        ])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($transferOrders);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'to_number' => 'required|unique:transfer_orders',
            'from_location_id' => 'required|exists:locations,id',
            'to_location_id' => 'required|exists:locations,id',
            'status' => 'nullable|in:draft,submitted,in_transit,received,cancelled',
        ]);

        $transferOrder = TransferOrder::create($validated);
        $transferOrder->load(['fromLocation', 'toLocation', 'transferOrderItems.product']);

        return response()->json($transferOrder, 201);
    }

    public function show(TransferOrder $transferOrder)
    {
        $transferOrder->load(['fromLocation', 'toLocation', 'transferOrderItems.product']);
        return response()->json($transferOrder);
    }

    public function update(Request $request, TransferOrder $transferOrder)
    {
        $validated = $request->validate([
            'to_number' => 'sometimes|unique:transfer_orders,to_number,' . $transferOrder->id,
            'from_location_id' => 'sometimes|exists:locations,id',
            'to_location_id' => 'sometimes|exists:locations,id',
            'status' => 'sometimes|in:draft,submitted,in_transit,received,cancelled',
        ]);

        $transferOrder->update($validated);
        $transferOrder->load(['fromLocation', 'toLocation', 'transferOrderItems.product']);

        return response()->json($transferOrder);
    }

    public function destroy(TransferOrder $transferOrder)
    {
        $transferOrder->delete();
        return response()->json(null, 204);
    }
}
