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
        Schema::table('parcels', function (Blueprint $table) {
            // Currency for delivery_fee and cod_amount: 'MMK' = Kyat, 'THB' = Thai Baht
            $table->string('currency', 3)->default('MMK')->after('is_cod')
                  ->comment('Currency for delivery_fee and cod_amount: MMK or THB');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('parcels', function (Blueprint $table) {
            $table->dropColumn('currency');
        });
    }
};
