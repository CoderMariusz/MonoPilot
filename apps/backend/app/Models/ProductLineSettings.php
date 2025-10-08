<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductLineSettings extends Model
{
    use HasFactory;

    protected $table = 'product_line_settings';

    protected $fillable = [
        'product_id',
        'machine_id',
        'std_cost',
        'labor_rate',
        'machine_rate',
        'throughput_packs_per_min',
        'yield_cut_override',
    ];

    protected $casts = [
        'std_cost' => 'decimal:4',
        'labor_rate' => 'decimal:4',
        'machine_rate' => 'decimal:4',
        'throughput_packs_per_min' => 'decimal:3',
        'yield_cut_override' => 'decimal:4',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function machine(): BelongsTo
    {
        return $this->belongsTo(Machine::class);
    }
}
