<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parcels', function (Blueprint $table) {
            $table->id();
            $table->string('tracking_number', 50)->unique()->index();
            $table->string('sender_name')->nullable();
            $table->string('sender_phone', 30)->nullable();
            $table->string('recipient_name');
            $table->string('recipient_phone', 30);
            $table->text('delivery_address');
            $table->foreignId('delivery_area_id')->nullable()->constrained('delivery_areas')->nullOnDelete();
            $table->string('description')->nullable();
            $table->integer('quantity')->default(1);
            $table->decimal('weight', 8, 3)->nullable()->comment('Weight in kilograms');
            $table->text('notes')->nullable();
            $table->decimal('delivery_fee', 15, 2)->default(0);
            $table->decimal('cod_amount', 15, 2)->default(0);
            $table->boolean('is_cod')->default(false);
            $table->string('status', 50)->default('RECEIVED')->index();
            $table->string('condition', 50)->default('GOOD')->comment('GOOD, DAMAGED, DAMAGED');
            $table->string('priority', 20)->default('NORMAL')->comment('NORMAL, HIGH, URGENT');
            $table->timestamp('received_at')->useCurrent();
            $table->foreignId('received_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('damage_description')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['status', 'received_at']);
            $table->index(['delivery_area_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parcels');
    }
};
