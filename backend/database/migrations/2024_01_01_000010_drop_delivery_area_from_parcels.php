<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('parcels', function (Blueprint $table) {
            if (Schema::hasColumn('parcels', 'delivery_area_id')) {
                $table->dropForeign(['delivery_area_id']);
                $table->dropIndex(['delivery_area_id', 'status']);
                $table->dropColumn('delivery_area_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('parcels', function (Blueprint $table) {
            $table->unsignedBigInteger('delivery_area_id')->nullable();
        });
    }
};
