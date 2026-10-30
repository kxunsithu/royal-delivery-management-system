<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['name' => 'admin',          'display_name' => 'Admin / CEO',      'guard_name' => 'web'],
            ['name' => 'manager',        'display_name' => 'Manager',          'guard_name' => 'web'],
            ['name' => 'accountant',     'display_name' => 'Accountant',       'guard_name' => 'web'],
            ['name' => 'delivery_staff', 'display_name' => 'Delivery Staff',   'guard_name' => 'web'],
        ];

        foreach ($roles as $roleData) {
            Role::firstOrCreate(
                ['name' => $roleData['name'], 'guard_name' => $roleData['guard_name']],
                ['display_name' => $roleData['display_name']]
            );
        }

        $this->command->info('Roles seeded successfully.');
    }
}
