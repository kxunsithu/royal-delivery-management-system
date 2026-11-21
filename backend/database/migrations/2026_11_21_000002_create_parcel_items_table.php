<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parcel_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parcel_id')->constrained('parcels')->cascadeOnDelete();
            $table->string('product_name');
            $table->integer('quantity')->default(1);
            $table->timestamps();
        });

        // Drop the now-unused `category` column.
        Schema::table('parcels', function (Blueprint $table) {
            $table->dropColumn('category');
        });
    }

    public function down(): void
    {
        Schema::table('parcels', function (Blueprint $table) {
            $table->string('category', 255)->nullable()->after('description');
        });

        Schema::dropIfExists('parcel_items');
    }
};
