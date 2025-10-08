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
        Schema::create('ecns', function (Blueprint $table) {
            $table->id();
            $table->string('ecn_number')->unique();
            $table->foreignId('bom_id')->constrained('boms');
            $table->enum('status', ['draft', 'submitted', 'approved', 'implemented', 'rejected'])->default('draft');
            $table->text('description');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ecns');
    }
};
