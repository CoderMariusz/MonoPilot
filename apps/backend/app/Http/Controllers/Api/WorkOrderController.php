<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WorkOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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

    public function details(WorkOrder $workOrder)
    {
        $workOrder->load([
            'product.activeBom.bomItems.material',
            'machine'
        ]);

        $bomComponents = [];
        
        if ($workOrder->product && $workOrder->product->activeBom) {
            foreach ($workOrder->product->activeBom->bomItems as $bomItem) {
                $material = $bomItem->material;
                
                $stockOnHand = $this->calculateStockOnHand($material->id);
                
                $qtyCompleted = $this->calculateCompletedQuantity($workOrder->id, $material->id);
                
                $bomComponents[] = [
                    'material_id' => $material->id,
                    'part_number' => $material->part_number,
                    'description' => $material->description,
                    'uom' => $bomItem->uom,
                    'qty_per_unit' => (float) $bomItem->quantity,
                    'total_qty_needed' => (float) $bomItem->quantity * (float) $workOrder->quantity,
                    'stock_on_hand' => $stockOnHand,
                    'qty_completed' => $qtyCompleted,
                ];
            }
        }

        return response()->json([
            'work_order' => [
                'id' => $workOrder->id,
                'wo_number' => $workOrder->wo_number,
                'product_id' => $workOrder->product_id,
                'product_name' => $workOrder->product ? $workOrder->product->description : null,
                'product_part_number' => $workOrder->product ? $workOrder->product->part_number : null,
                'quantity' => (float) $workOrder->quantity,
                'uom' => $workOrder->product ? $workOrder->product->uom : null,
                'status' => $workOrder->status,
                'due_date' => $workOrder->due_date,
                'machine_id' => $workOrder->machine_id,
                'machine_name' => $workOrder->machine ? $workOrder->machine->name : null,
            ],
            'bom_components' => $bomComponents,
        ]);
    }

    private function calculateStockOnHand(int $productId): float
    {
        $produced = DB::table('stock_moves')
            ->where('product_id', $productId)
            ->whereIn('move_type', ['produce', 'transfer'])
            ->sum('quantity');
        
        $consumed = DB::table('stock_moves')
            ->where('product_id', $productId)
            ->where('move_type', 'consume')
            ->sum('quantity');
        
        return (float) ($produced - $consumed);
    }

    private function calculateCompletedQuantity(int $workOrderId, int $productId): float
    {
        $completed = DB::table('stock_moves')
            ->where('work_order_id', $workOrderId)
            ->where('product_id', $productId)
            ->where('move_type', 'consume')
            ->sum('quantity');
        
        return (float) $completed;
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
