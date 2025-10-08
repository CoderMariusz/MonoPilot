<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Product extends Model
{
    protected $fillable = [
        'part_number',
        'description',
        'type',
        'uom',
        'is_active',
        'category',
        'subtype',
        'expiry_policy',
        'shelf_life_days',
        'std_price',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'std_price' => 'decimal:4',
        'shelf_life_days' => 'integer',
    ];

    public function boms(): HasMany
    {
        return $this->hasMany(Bom::class);
    }

    public function activeBom(): HasOne
    {
        return $this->hasOne(Bom::class)->where('is_active', true);
    }

    public function lineSettings(): HasMany
    {
        return $this->hasMany(ProductLineSettings::class);
    }

    public function workOrders(): HasMany
    {
        return $this->hasMany(WorkOrder::class);
    }

    public function licensePlates(): HasMany
    {
        return $this->hasMany(LicensePlate::class);
    }

    public function purchaseOrderItems(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    public function transferOrderItems(): HasMany
    {
        return $this->hasMany(TransferOrderItem::class);
    }

    public function stockMoves(): HasMany
    {
        return $this->hasMany(StockMove::class);
    }

    public function getCategoryNameAttribute()
    {
        return match($this->category) {
            'MEAT' => 'Meat',
            'DRYGOODS' => 'Dry Goods',
            'FINISHED_GOODS' => 'Finished Goods',
            'PROCESS' => 'Process',
            default => null,
        };
    }
}
