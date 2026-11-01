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
            // Managers (2)
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
                'name'        => 'Mg Tun',
                'email'       => 'mgtun@gmail.com',
                'phone'       => '09944074981',
                'password'    => Hash::make('Manager@123456'),
                'employee_id' => 'EMP-003',
                'is_active'   => true,
                'role'        => 'manager',
            ],
            // Accountants (3)
            [
                'name'        => 'Ma Khin',
                'email'       => 'makhin@gmail.com',
                'phone'       => '09944074981',
                'password'    => Hash::make('Accountant@123456'),
                'employee_id' => 'EMP-004',
                'is_active'   => true,
                'role'        => 'accountant',
            ],
            [
                'name'        => 'Ma Su',
                'email'       => 'masu@gmail.com',
                'phone'       => '09944074981',
                'password'    => Hash::make('Accountant@123456'),
                'employee_id' => 'EMP-005',
                'is_active'   => true,
                'role'        => 'accountant',
            ],
            [
                'name'        => 'Ma Mya',
                'email'       => 'mamya@gmail.com',
                'phone'       => '09944074981',
                'password'    => Hash::make('Accountant@123456'),
                'employee_id' => 'EMP-006',
                'is_active'   => true,
                'role'        => 'accountant',
            ],
            // Delivery Staff (10)
            [
                'name'        => 'Ko Zaw',
                'email'       => 'kozaw@gmail.com',
                'phone'       => '09944074981',
                'password'    => Hash::make('Staff@123456'),
                'employee_id' => 'EMP-007',
                'is_active'   => true,
                'role'        => 'delivery_staff',
            ],
            [
                'name'        => 'Ko Aung',
                'email'       => 'koaung@gmail.com',
                'phone'       => '09944074981',
                'password'    => Hash::make('Staff@123456'),
                'employee_id' => 'EMP-008',
                'is_active'   => true,
                'role'        => 'delivery_staff',
            ],
            [
                'name'        => 'Ma Thida',
                'email'       => 'mathida@gmail.com',
                'phone'       => '09944074981',
                'password'    => Hash::make('Staff@123456'),
                'employee_id' => 'EMP-009',
                'is_active'   => true,
                'role'        => 'delivery_staff',
            ],
            [
                'name'        => 'Ko Min',
                'email'       => 'komin@gmail.com',
                'phone'       => '09944074981',
                'password'    => Hash::make('Staff@123456'),
                'employee_id' => 'EMP-010',
                'is_active'   => true,
                'role'        => 'delivery_staff',
            ],
            [
                'name'        => 'Ko Htet',
                'email'       => 'kohtet@gmail.com',
                'phone'       => '09944074981',
                'password'    => Hash::make('Staff@123456'),
                'employee_id' => 'EMP-011',
                'is_active'   => true,
                'role'        => 'delivery_staff',
            ],
            [
                'name'        => 'Ma Nandar',
                'email'       => 'manandar@gmail.com',
                'phone'       => '09944074981',
                'password'    => Hash::make('Staff@123456'),
                'employee_id' => 'EMP-012',
                'is_active'   => true,
                'role'        => 'delivery_staff',
            ],
            [
                'name'        => 'Ko Phyo',
                'email'       => 'kophyo@gmail.com',
                'phone'       => '09944074981',
                'password'    => Hash::make('Staff@123456'),
                'employee_id' => 'EMP-013',
                'is_active'   => true,
                'role'        => 'delivery_staff',
            ],
            [
                'name'        => 'Ma Ei',
                'email'       => 'maei@gmail.com',
                'phone'       => '09944074981',
                'password'    => Hash::make('Staff@123456'),
                'employee_id' => 'EMP-014',
                'is_active'   => true,
                'role'        => 'delivery_staff',
            ],
            [
                'name'        => 'Ko Naing',
                'email'       => 'konaing@gmail.com',
                'phone'       => '09944074981',
                'password'    => Hash::make('Staff@123456'),
                'employee_id' => 'EMP-015',
                'is_active'   => true,
                'role'        => 'delivery_staff',
            ],
            [
                'name'        => 'Ma Hla',
                'email'       => 'mahla@gmail.com',
                'phone'       => '09944074981',
                'password'    => Hash::make('Staff@123456'),
                'employee_id' => 'EMP-016',
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

        $this->command->info('Users seeded. Development accounts: ' . count($users) . ' users.');
    }
}
