<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WorkOrder;
use Illuminate\Http\Request;

class WorkOrderController extends Controller
{
    public function index()
    {
        $workOrders = WorkOrder::with(['product', 'machine'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($workOrders);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'wo_number' => 'required|unique:work_orders',
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|numeric|min:0',
            'status' => 'nullable|in:planned,released,in_progress,completed,cancelled',
            'due_date' => 'nullable|date',
            'machine_id' => 'nullable|exists:machines,id',
        ]);

        $workOrder = WorkOrder::create($validated);
        $workOrder->load(['product', 'machine']);

        return response()->json($workOrder, 201);
    }

    public function show(WorkOrder $workOrder)
    {
        $workOrder->load(['product', 'machine', 'stockMoves']);
        return response()->json($workOrder);
    }

    public function update(Request $request, WorkOrder $workOrder)
    {
        $validated = $request->validate([
            'wo_number' => 'sometimes|unique:work_orders,wo_number,' . $workOrder->id,
            'product_id' => 'sometimes|exists:products,id',
            'quantity' => 'sometimes|numeric|min:0',
            'status' => 'sometimes|in:planned,released,in_progress,completed,cancelled',
            'due_date' => 'nullable|date',
            'machine_id' => 'nullable|exists:machines,id',
        ]);

        $workOrder->update($validated);
        $workOrder->load(['product', 'machine']);

        return response()->json($workOrder);
    }

    public function destroy(WorkOrder $workOrder)
    {
        $workOrder->delete();
        return response()->json(null, 204);
    }
}
