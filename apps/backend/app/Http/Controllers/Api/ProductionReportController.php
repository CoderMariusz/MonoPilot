<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WorkOrder;
use App\Models\Bom;
use App\Models\BomItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductionReportController extends Controller
{
    public function yieldReport(Request $request)
    {
        $validated = $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
        ]);

        $dateFrom = $validated['date_from'] ?? now()->subDays(7)->startOfDay();
        $dateTo = $validated['date_to'] ?? now()->endOfDay();

        // Get work orders within date range
        $workOrders = WorkOrder::with(['product', 'machine'])
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->get();

        // Calculate metrics
        $totalOutput = 0;
        $totalTarget = 0;
        $yieldData = [];

        foreach ($workOrders as $wo) {
            $targetQty = (float) $wo->quantity;
            // For now, assume 100% yield if status is completed, 0% otherwise
            $actualOutput = $wo->status === 'completed' ? $targetQty : 0;
            $scrap = $targetQty - $actualOutput;
            $yieldPercentage = $targetQty > 0 ? ($actualOutput / $targetQty) * 100 : 0;

            $totalTarget += $targetQty;
            $totalOutput += $actualOutput;

            $yieldData[] = [
                'id' => $wo->id,
                'wo_number' => $wo->wo_number,
                'product' => $wo->product ? [
                    'id' => $wo->product->id,
                    'part_number' => $wo->product->part_number,
                    'description' => $wo->product->description,
                ] : null,
                'target_qty' => $targetQty,
                'actual_output' => $actualOutput,
                'scrap' => $scrap,
                'yield_percentage' => round($yieldPercentage, 2),
                'date' => $wo->created_at->format('Y-m-d'),
                'status' => $wo->status,
            ];
        }

        // Calculate overall metrics
        $overallYieldRate = $totalTarget > 0 ? ($totalOutput / $totalTarget) * 100 : 0;
        $scrapRate = $totalTarget > 0 ? (($totalTarget - $totalOutput) / $totalTarget) * 100 : 0;

        return response()->json([
            'summary' => [
                'total_output' => $totalOutput,
                'total_target' => $totalTarget,
                'yield_rate' => round($overallYieldRate, 2),
                'scrap_rate' => round($scrapRate, 2),
                'total_work_orders' => count($workOrders),
            ],
            'work_orders' => $yieldData,
            'date_range' => [
                'from' => $dateFrom,
                'to' => $dateTo,
            ],
        ]);
    }

    public function consumeReport(Request $request)
    {
        $validated = $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
        ]);

        $dateFrom = $validated['date_from'] ?? now()->subDays(7)->startOfDay();
        $dateTo = $validated['date_to'] ?? now()->endOfDay();

        // Get work orders within date range
        $workOrders = WorkOrder::with(['product', 'product.boms.bomItems.material'])
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->get();

        $consumptionData = [];
        $totalMaterialsConsumed = 0;
        $totalValue = 0;

        foreach ($workOrders as $wo) {
            // Get active BOM for this product
            $activeBom = $wo->product ? $wo->product->boms()->where('is_active', true)->first() : null;
            
            if (!$activeBom) {
                continue;
            }

            foreach ($activeBom->bomItems as $bomItem) {
                $standardQty = (float) $bomItem->quantity * (float) $wo->quantity;
                // For now, assume consumed = standard (100% consumption)
                $consumedQty = $wo->status === 'completed' ? $standardQty : 0;
                $variance = $consumedQty - $standardQty;
                $variancePercentage = $standardQty > 0 ? ($variance / $standardQty) * 100 : 0;

                $consumptionData[] = [
                    'wo_number' => $wo->wo_number,
                    'material' => $bomItem->material ? [
                        'id' => $bomItem->material->id,
                        'part_number' => $bomItem->material->part_number,
                        'description' => $bomItem->material->description,
                        'uom' => $bomItem->uom,
                    ] : null,
                    'standard_qty' => round($standardQty, 4),
                    'consumed_qty' => round($consumedQty, 4),
                    'variance' => round($variance, 4),
                    'variance_percentage' => round($variancePercentage, 2),
                    'date' => $wo->created_at->format('Y-m-d'),
                    'wo_status' => $wo->status,
                ];

                if ($consumedQty > 0) {
                    $totalMaterialsConsumed++;
                }
            }
        }

        // Group by material for summary
        $materialSummary = collect($consumptionData)
            ->groupBy('material.id')
            ->map(function ($items) {
                $material = $items->first()['material'];
                return [
                    'material' => $material,
                    'total_consumed' => $items->sum('consumed_qty'),
                    'total_standard' => $items->sum('standard_qty'),
                    'total_variance' => $items->sum('variance'),
                ];
            })
            ->values();

        return response()->json([
            'summary' => [
                'total_materials_consumed' => $totalMaterialsConsumed,
                'total_value' => $totalValue,
                'unique_materials' => count($materialSummary),
                'total_work_orders' => count($workOrders),
            ],
            'consumption_records' => $consumptionData,
            'material_summary' => $materialSummary,
            'date_range' => [
                'from' => $dateFrom,
                'to' => $dateTo,
            ],
        ]);
    }
}
