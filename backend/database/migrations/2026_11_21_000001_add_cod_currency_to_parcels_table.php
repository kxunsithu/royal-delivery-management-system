<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('parcels', function (Blueprint $table) {
            // Currency for cod_amount only. delivery_fee keeps using `currency`.
            // Falls back to `currency` when null for backwards compatibility.
            $table->string('cod_currency', 3)->nullable()->after('currency')
                  ->comment('Currency for cod_amount: MMK or THB (falls back to currency)');
        });

        // Existing parcels used a single currency for both delivery fee and COD.
        DB::table('parcels')->update(['cod_currency' => DB::raw('currency')]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('parcels', function (Blueprint $table) {
            $table->dropColumn('cod_currency');
        });
    }
};
