<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recorded_by_id')->constrained('users');
            $table->string('category', 100);
            $table->text('description');
            $table->decimal('amount', 15, 2);
            $table->date('expense_date');
            $table->string('receipt_path', 500)->nullable();
            $table->boolean('is_voided')->default(false);
            $table->text('void_reason')->nullable();
            $table->foreignId('voided_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('voided_at')->nullable();
            $table->timestamps();

            $table->index('expense_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
