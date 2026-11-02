<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('parcels', function (Blueprint $table) {
            $table->decimal('delivery_fee', 15, 2)->default(0)->after('notes');
            $table->decimal('cod_amount', 15, 2)->default(0)->after('delivery_fee');
            $table->boolean('is_cod')->default(false)->after('cod_amount');
        });
    }

    public function down(): void
    {
        Schema::table('parcels', function (Blueprint $table) {
            $table->dropColumn(['delivery_fee', 'cod_amount', 'is_cod']);
        });
    }
};