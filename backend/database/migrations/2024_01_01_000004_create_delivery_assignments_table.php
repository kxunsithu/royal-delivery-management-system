<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delivery_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parcel_id')->constrained('parcels')->cascadeOnDelete();
            $table->foreignId('staff_id')->constrained('users');
            $table->foreignId('assigned_by_id')->constrained('users');
            $table->string('status', 50)->default('ACTIVE')->comment('ACTIVE, COMPLETED, CANCELLED, REASSIGNED');
            $table->text('notes')->nullable();
            $table->timestamp('assigned_at')->useCurrent();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['parcel_id', 'status']);
            $table->index(['staff_id', 'status']);
            $table->index('assigned_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_assignments');
    }
};
