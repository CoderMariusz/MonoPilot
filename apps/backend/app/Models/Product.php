<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $fillable = [
        'part_number',
        'description',
        'type',
        'uom',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function boms(): HasMany
    {
        return $this->hasMany(Bom::class);
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
}
