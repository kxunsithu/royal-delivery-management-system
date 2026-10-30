<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delivery_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assignment_id')->constrained('delivery_assignments');
            $table->foreignId('parcel_id')->constrained('parcels');
            $table->foreignId('staff_id')->constrained('users');
            $table->timestamp('attempted_at')->useCurrent();
            $table->string('result', 50)->comment('DELIVERED, FAILED');
            $table->string('failure_reason', 100)->nullable()
                ->comment('RECIPIENT_UNAVAILABLE, PHONE_UNREACHABLE, WRONG_ADDRESS, REFUSED, RESCHEDULED, OTHER');
            $table->string('recipient_name')->nullable()->comment('Name of person who received the parcel');
            $table->text('recipient_confirmation')->nullable();
            $table->decimal('delivery_fee_collected', 15, 2)->default(0);
            $table->decimal('cod_collected', 15, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['parcel_id', 'attempted_at']);
            $table->index(['staff_id', 'attempted_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_attempts');
    }
};
