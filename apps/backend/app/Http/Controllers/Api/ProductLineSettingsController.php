<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductLineSettings;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductLineSettingsController extends Controller
{
    public function indexByProduct($productId)
    {
        $product = Product::findOrFail($productId);
        
        $settings = ProductLineSettings::with('machine')
            ->where('product_id', $productId)
            ->get();

        return response()->json($settings);
    }

    public function bulkUpsert(Request $request, $productId)
    {
        $product = Product::findOrFail($productId);

        if ($product->category !== 'FINISHED_GOODS') {
            return response()->json([
                'message' => 'Line settings can only be configured for FINISHED_GOODS products.'
            ], 422);
        }

        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.*.machine_id' => 'required|exists:machines,id',
            'settings.*.std_cost' => 'required|numeric|min:0',
            'settings.*.labor_rate' => 'nullable|numeric|min:0',
            'settings.*.machine_rate' => 'nullable|numeric|min:0',
            'settings.*.throughput_packs_per_min' => 'nullable|numeric|min:0',
            'settings.*.yield_cut_override' => 'nullable|numeric|between:0,1',
        ]);

        foreach ($validated['settings'] as $settingData) {
            ProductLineSettings::updateOrCreate(
                [
                    'product_id' => $productId,
                    'machine_id' => $settingData['machine_id'],
                ],
                [
                    'std_cost' => $settingData['std_cost'],
                    'labor_rate' => $settingData['labor_rate'] ?? null,
                    'machine_rate' => $settingData['machine_rate'] ?? null,
                    'throughput_packs_per_min' => $settingData['throughput_packs_per_min'] ?? null,
                    'yield_cut_override' => $settingData['yield_cut_override'] ?? null,
                ]
            );
        }

        $settings = ProductLineSettings::with('machine')
            ->where('product_id', $productId)
            ->get();

        return response()->json($settings, 200);
    }

    public function index(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
        ]);

        $settings = ProductLineSettings::with('machine')
            ->where('product_id', $request->product_id)
            ->get();

        return response()->json($settings);
    }

    public function update(Request $request, $id)
    {
        $setting = ProductLineSettings::findOrFail($id);

        $validated = $request->validate([
            'std_cost' => 'sometimes|required|numeric|min:0',
            'labor_rate' => 'nullable|numeric|min:0',
            'machine_rate' => 'nullable|numeric|min:0',
            'throughput_packs_per_min' => 'nullable|numeric|min:0',
            'yield_cut_override' => 'nullable|numeric|between:0,1',
        ]);

        $setting->update($validated);
        $setting->load('machine');

        return response()->json($setting);
    }

    public function destroy($id)
    {
        $setting = ProductLineSettings::findOrFail($id);
        $setting->delete();

        return response()->json(null, 204);
    }
}
