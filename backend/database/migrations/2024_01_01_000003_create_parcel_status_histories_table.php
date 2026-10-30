<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parcel_status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parcel_id')->constrained('parcels')->cascadeOnDelete();
            $table->string('from_status', 50)->nullable()->comment('Null on first entry');
            $table->string('to_status', 50);
            $table->foreignId('changed_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('reason')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['parcel_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parcel_status_histories');
    }
};
