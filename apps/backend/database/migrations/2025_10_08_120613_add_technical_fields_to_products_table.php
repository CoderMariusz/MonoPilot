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
        Schema::table('products', function (Blueprint $table) {
            $table->enum('category', ['MEAT', 'DRYGOODS', 'FINISHED_GOODS', 'PROCESS'])
                ->nullable()
                ->after('type');
            
            $table->string('subtype', 50)
                ->nullable()
                ->after('category');
            
            $table->enum('expiry_policy', ['DAYS_STATIC', 'FROM_MFG_DATE', 'FROM_DELIVERY_DATE', 'FROM_CREATION_DATE'])
                ->nullable()
                ->after('subtype');
            
            $table->integer('shelf_life_days')
                ->nullable()
                ->after('expiry_policy');
            
            $table->decimal('std_price', 12, 4)
                ->default(0)
                ->after('shelf_life_days');
            
            $table->index('category');
            $table->index('expiry_policy');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['category']);
            $table->dropIndex(['expiry_policy']);
            
            $table->dropColumn([
                'category',
                'subtype',
                'expiry_policy',
                'shelf_life_days',
                'std_price'
            ]);
        });
    }
};
