<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('expenses');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('cash_handovers');

        Schema::table('parcels', function (Blueprint $table) {
            $table->dropColumn(['delivery_fee', 'cod_amount', 'is_cod']);
        });

        Schema::table('delivery_attempts', function (Blueprint $table) {
            $table->dropColumn(['delivery_fee_collected', 'cod_collected']);
        });

        Schema::table('business_settings', function (Blueprint $table) {
            // Currency settings are no longer valid in a financial-feature-free system.
        });
    }

    public function down(): void
    {
        // Financial feature removal is intentionally not reversible.
    }
};
