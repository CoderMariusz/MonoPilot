<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Location extends Model
{
    protected $fillable = [
        'code',
        'name',
        'zone',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function licensePlates(): HasMany
    {
        return $this->hasMany(LicensePlate::class);
    }

    public function stockMovesFrom(): HasMany
    {
        return $this->hasMany(StockMove::class, 'from_location_id');
    }

    public function stockMovesTo(): HasMany
    {
        return $this->hasMany(StockMove::class, 'to_location_id');
    }

    public function transferOrdersFrom(): HasMany
    {
        return $this->hasMany(TransferOrder::class, 'from_location_id');
    }

    public function transferOrdersTo(): HasMany
    {
        return $this->hasMany(TransferOrder::class, 'to_location_id');
    }
}
