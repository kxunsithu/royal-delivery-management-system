<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cash_handovers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('staff_id')->constrained('users');
            $table->foreignId('submitted_by_id')->constrained('users');
            $table->foreignId('verified_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('expected_amount', 15, 2)->default(0)
                ->comment('Calculated from collected payments');
            $table->decimal('submitted_amount', 15, 2)->default(0)
                ->comment('Amount submitted by staff');
            $table->decimal('verified_amount', 15, 2)->nullable()
                ->comment('Amount counted by accountant');
            $table->decimal('discrepancy', 15, 2)->nullable()
                ->comment('verified_amount - expected_amount');
            $table->string('status', 50)->default('PENDING')
                ->comment('PENDING, SUBMITTED, VERIFIED, DISPUTED');
            $table->text('submission_notes')->nullable();
            $table->text('verification_notes')->nullable();
            $table->timestamp('period_start')->nullable();
            $table->timestamp('period_end')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            $table->index(['staff_id', 'status']);
            $table->index('submitted_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_handovers');
    }
};
