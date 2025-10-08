<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockMove extends Model
{
    protected $fillable = [
        'from_location_id',
        'to_location_id',
        'product_id',
        'quantity',
        'move_type',
        'work_order_id',
        'license_plate_id',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
    ];

    public function fromLocation(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'from_location_id');
    }

    public function toLocation(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'to_location_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function workOrder(): BelongsTo
    {
        return $this->belongsTo(WorkOrder::class);
    }

    public function licensePlate(): BelongsTo
    {
        return $this->belongsTo(LicensePlate::class);
    }
}
