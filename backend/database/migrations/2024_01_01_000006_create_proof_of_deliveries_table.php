<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('proof_of_deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('delivery_attempt_id')->constrained('delivery_attempts')->cascadeOnDelete();
            $table->foreignId('parcel_id')->constrained('parcels');
            $table->string('type', 50)->comment('PHOTO, SIGNATURE, RECIPIENT_NAME');
            $table->string('file_path', 500)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('proof_of_deliveries');
    }
};
