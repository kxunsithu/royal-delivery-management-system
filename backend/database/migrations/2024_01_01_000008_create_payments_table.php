<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parcel_id')->constrained('parcels');
            $table->foreignId('delivery_attempt_id')->nullable()->constrained('delivery_attempts')->nullOnDelete();
            $table->foreignId('collected_by_id')->constrained('users');
            $table->foreignId('handover_id')->nullable()->constrained('cash_handovers')->nullOnDelete();
            $table->string('payment_type', 50)->comment('DELIVERY_FEE, COD');
            $table->decimal('amount', 15, 2);
            $table->timestamp('collected_at')->useCurrent();
            $table->string('status', 50)->default('COLLECTED')
                ->comment('COLLECTED, HANDED_OVER, RECONCILED');
            $table->text('notes')->nullable();
            $table->timestamps();

            // Prevent duplicate payment records for same parcel and type
            $table->unique(['parcel_id', 'payment_type'], 'unique_payment_per_parcel_type');
            $table->index(['collected_by_id', 'status']);
            $table->index(['handover_id']);
            $table->index('collected_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
