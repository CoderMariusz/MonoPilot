<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Bom;
use App\Models\BomItem;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['boms', 'activeBom', 'lineSettings.machine']);

        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('expiry_policy')) {
            $query->where('expiry_policy', $request->expiry_policy);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('part_number', 'LIKE', "%{$search}%")
                  ->orWhere('description', 'LIKE', "%{$search}%");
            });
        }

        $products = $query->paginate(15);

        return response()->json($products);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'part_number' => 'required|string|unique:products,part_number',
            'description' => 'required|string',
            'uom' => 'required|string',
            'category' => ['required', Rule::in(['MEAT', 'DRYGOODS', 'FINISHED_GOODS', 'PROCESS'])],
            'subtype' => 'nullable|string',
            'std_price' => 'nullable|numeric|min:0',
            'expiry_policy' => ['nullable', Rule::in(['DAYS_STATIC', 'FROM_MFG_DATE', 'FROM_DELIVERY_DATE', 'FROM_CREATION_DATE'])],
            'shelf_life_days' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
            'bom_items' => 'nullable|array',
            'bom_items.*.material_id' => 'required_with:bom_items|exists:products,id',
            'bom_items.*.quantity' => 'required_with:bom_items|numeric|min:0',
            'bom_items.*.uom' => 'required_with:bom_items|string',
            'bom_items.*.sequence' => 'nullable|integer',
        ]);

        $this->validateCategorySpecificRules($validated);

        $type = $this->mapCategoryToType($validated['category']);

        $productData = array_merge($validated, ['type' => $type]);
        unset($productData['bom_items']);

        $product = Product::create($productData);

        if (($validated['category'] === 'FINISHED_GOODS' || $validated['category'] === 'PROCESS') && isset($validated['bom_items'])) {
            $bom = Bom::create([
                'product_id' => $product->id,
                'version' => '1.0',
                'is_active' => true,
            ]);

            foreach ($validated['bom_items'] as $index => $item) {
                BomItem::create([
                    'bom_id' => $bom->id,
                    'material_id' => $item['material_id'],
                    'quantity' => $item['quantity'],
                    'uom' => $item['uom'],
                    'sequence' => $item['sequence'] ?? $index + 1,
                ]);
            }
        }

        $product->load(['boms', 'activeBom', 'lineSettings.machine']);

        return response()->json($product, 201);
    }

    public function show($id)
    {
        $product = Product::with(['boms', 'activeBom', 'lineSettings.machine'])->findOrFail($id);

        return response()->json($product);
    }

    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'part_number' => 'sometimes|string|unique:products,part_number,' . $id,
            'description' => 'sometimes|string',
            'uom' => 'sometimes|string',
            'category' => ['sometimes', Rule::in(['MEAT', 'DRYGOODS', 'FINISHED_GOODS', 'PROCESS'])],
            'subtype' => 'nullable|string',
            'std_price' => 'nullable|numeric|min:0',
            'expiry_policy' => ['nullable', Rule::in(['DAYS_STATIC', 'FROM_MFG_DATE', 'FROM_DELIVERY_DATE', 'FROM_CREATION_DATE'])],
            'shelf_life_days' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        if (isset($validated['category'])) {
            $this->validateCategorySpecificRules($validated);
            $validated['type'] = $this->mapCategoryToType($validated['category']);
        }

        $product->update($validated);
        $product->load(['boms', 'activeBom', 'lineSettings.machine']);

        return response()->json($product);
    }

    public function destroy($id)
    {
        $product = Product::findOrFail($id);
        $product->delete();

        return response()->json(null, 204);
    }

    private function validateCategorySpecificRules(array $data)
    {
        $category = $data['category'];

        if (in_array($category, ['MEAT', 'DRYGOODS'])) {
            if (isset($data['expiry_policy']) && in_array($data['expiry_policy'], ['DAYS_STATIC', 'FROM_CREATION_DATE'])) {
                if (!isset($data['shelf_life_days']) || $data['shelf_life_days'] === null) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'shelf_life_days' => ['Shelf life days is required when expiry policy is DAYS_STATIC or FROM_CREATION_DATE.']
                    ]);
                }
            }

            if (!isset($data['std_price']) || $data['std_price'] === null) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'std_price' => ['Standard price is required for MEAT and DRYGOODS categories.']
                ]);
            }
        }

        if ($category === 'PROCESS') {
            if (!isset($data['expiry_policy']) || $data['expiry_policy'] !== 'FROM_CREATION_DATE') {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'expiry_policy' => ['Expiry policy must be FROM_CREATION_DATE for PROCESS category.']
                ]);
            }

            if (!isset($data['shelf_life_days']) || $data['shelf_life_days'] === null) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'shelf_life_days' => ['Shelf life days is required for PROCESS category.']
                ]);
            }
        }
    }

    private function mapCategoryToType(string $category): string
    {
        return match($category) {
            'MEAT' => 'RM',
            'DRYGOODS' => 'RM',
            'PROCESS' => 'PR',
            'FINISHED_GOODS' => 'FG',
            default => 'RM',
        };
    }
}
