<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Give unique phone numbers to any existing users that have duplicate or empty phones
        $users = DB::table('users')->orderBy('id')->get();
        $seen = [];
        foreach ($users as $user) {
            $phone = trim((string)$user->phone);
            if (empty($phone) || isset($seen[$phone])) {
                $phone = '09944074' . str_pad((string)$user->id, 3, '0', STR_PAD_LEFT);
                DB::table('users')->where('id', $user->id)->update(['phone' => $phone]);
            }
            $seen[$phone] = true;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->string('email')->nullable()->change();
            $table->string('phone', 30)->unique()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['phone']);
            $table->string('email')->nullable(false)->change();
            $table->string('phone', 30)->nullable()->change();
        });
    }
};

