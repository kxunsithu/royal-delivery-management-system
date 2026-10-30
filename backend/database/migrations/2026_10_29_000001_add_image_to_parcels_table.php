<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop the old single image_path column if it exists
        if (Schema::hasColumn('parcels', 'image_path')) {
            Schema::table('parcels', function (Blueprint $table) {
                $table->dropColumn('image_path');
            });
        }

        // Create the parcel_images table for multiple images
        Schema::create('parcel_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parcel_id')->constrained('parcels')->cascadeOnDelete();
            $table->string('path');              // storage path, e.g. parcel-images/xxx.jpg
            $table->string('original_name')->nullable();
            $table->unsignedBigInteger('size')->nullable()->comment('File size in bytes');
            $table->string('mime_type', 100)->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index('parcel_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parcel_images');

        if (!Schema::hasColumn('parcels', 'image_path')) {
            Schema::table('parcels', function (Blueprint $table) {
                $table->string('image_path')->nullable()->after('damage_description');
            });
        }
    }
};
