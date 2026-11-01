<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Development test accounts. DO NOT use in production.
     */
    public function run(): void
    {
        $users = [
            [
                'name'        => 'အက်ဒမင် အသုံးပြုသူ',
                'email'       => 'admin@gmail.com',
                'phone'       => '09944074981',
                'password'    => Hash::make('Admin@123456'),
                'employee_id' => 'EMP-001',
                'is_active'   => true,
                'role'        => 'admin',
            ],
            [
                'name'        => 'Mg Moe',
                'email'       => 'mgmoe@gmail.com',
                'phone'       => '09944074981',
                'password'    => Hash::make('Manager@123456'),
                'employee_id' => 'EMP-002',
                'is_active'   => true,
                'role'        => 'manager',
            ],
            [
                'name'        => 'Ma Khin',
                'email'       => 'makhin@gmail.com',
                'phone'       => '09944074981',
                'password'    => Hash::make('Accountant@123456'),
                'employee_id' => 'EMP-003',
                'is_active'   => true,
                'role'        => 'accountant',
            ],
            [
                'name'        => 'Ko Zaw',
                'email'       => 'kozaw@gmail.com',
                'phone'       => '09944074981',
                'password'    => Hash::make('Staff@123456'),
                'employee_id' => 'EMP-004',
                'is_active'   => true,
                'role'        => 'delivery_staff',
            ],
            [
                'name'        => 'Ko Aung',
                'email'       => 'koaung@gmail.com',
                'phone'       => '09944074981',
                'password'    => Hash::make('Staff@123456'),
                'employee_id' => 'EMP-005',
                'is_active'   => true,
                'role'        => 'delivery_staff',
            ],
            [
                'name'        => 'Ma Thida',
                'email'       => 'mathida@gmail.com',
                'phone'       => '09944074981',
                'password'    => Hash::make('Staff@123456'),
                'employee_id' => 'EMP-006',
                'is_active'   => true,
                'role'        => 'delivery_staff',
            ],
        ];

        foreach ($users as $userData) {
            $role = $userData['role'];
            unset($userData['role']);

            $user = User::firstOrCreate(
                ['email' => $userData['email']],
                $userData
            );

            if (!$user->hasRole($role)) {
                $user->assignRole($role);
            }
        }

        $this->command->info('Users seeded. Development accounts:');
        $this->command->table(
            ['Role', 'Email', 'Password'],
            [
                ['Admin', 'admin@gmail.com', 'Admin@123456'],
                ['Manager', 'mgmoe@gmail.com', 'Manager@123456'],
                ['Accountant', 'makhin@gmail.com', 'Accountant@123456'],
                ['Delivery Staff 1', 'kozaw@gmail.com', 'Staff@123456'],
                ['Delivery Staff 2', 'koaung@gmail.com', 'Staff@123456'],
                ['Delivery Staff 3', 'mathida@gmail.com', 'Staff@123456'],
            ]
        );
    }
}
