<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('product_line_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('machine_id')->constrained('machines')->cascadeOnDelete();
            $table->decimal('std_cost', 12, 4);
            $table->decimal('labor_rate', 12, 4)->nullable();
            $table->decimal('machine_rate', 12, 4)->nullable();
            $table->decimal('throughput_packs_per_min', 8, 3)->nullable();
            $table->decimal('yield_cut_override', 5, 4)->nullable();
            $table->timestamps();

            $table->unique(['product_id', 'machine_id']);
            $table->index('product_id');
            $table->index('machine_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_line_settings');
    }
};
