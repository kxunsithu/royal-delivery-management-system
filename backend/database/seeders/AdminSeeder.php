<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class AdminSeeder extends Seeder
{
    /**
     * Ensure the default admin account exists.
     *
     * This seeder is intentionally idempotent and does not reset the
     * password of an admin account that already exists.
     */
    public function run(): void
    {
        Role::firstOrCreate(
            ['name' => 'admin', 'guard_name' => 'web'],
            ['display_name' => 'Admin / CEO']
        );

        $admin = User::withTrashed()->where('email', 'admin@gmail.com')->first();

        if (!$admin) {
            $admin = User::create([
                'name'        => 'Admin (CEO)',
                'email'       => 'admin@gmail.com',
                'phone'       => '09944074981',
                'password'    => Hash::make('Admin@123456'),
                'employee_id' => 'EMP-001',
                'is_active'   => true,
            ]);
        } elseif ($admin->trashed()) {
            $admin->restore();
        }

        if (!$admin->hasRole('admin')) {
            $admin->assignRole('admin');
        }

        $this->command->info('Admin account is ready: admin@gmail.com');
    }
}
