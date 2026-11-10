<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Development test accounts.
     */
    public function run(): void
    {
        $users = [
            // Admin (1)
            [
                'name'        => 'အက်ဒမင် အသုံးပြုသူ',
                'email'       => 'admin@gmail.com',
                'phone'       => '09944074981',
                'password'    => Hash::make('Admin@123456'),
                'plain_pwd'   => 'Admin@123456',
                'employee_id' => 'EMP-001',
                'is_active'   => true,
                'role'        => 'admin',
            ],
            // Manager (1)
            [
                'name'        => 'Mg Moe',
                'email'       => 'mgmoe@gmail.com',
                'phone'       => '09944074982',
                'password'    => Hash::make('Manager@123456'),
                'plain_pwd'   => 'Manager@123456',
                'employee_id' => 'EMP-002',
                'is_active'   => true,
                'role'        => 'manager',
            ],
            // Accountants (3)
            [
                'name'        => 'Ma Khin',
                'email'       => 'makhin@gmail.com',
                'phone'       => '09944074984',
                'password'    => Hash::make('Accountant@123456'),
                'plain_pwd'   => 'Accountant@123456',
                'employee_id' => 'EMP-004',
                'is_active'   => true,
                'role'        => 'accountant',
            ],
            [
                'name'        => 'Ma Su',
                'email'       => 'masu@gmail.com',
                'phone'       => '09944074985',
                'password'    => Hash::make('Accountant@123456'),
                'plain_pwd'   => 'Accountant@123456',
                'employee_id' => 'EMP-005',
                'is_active'   => true,
                'role'        => 'accountant',
            ],
            [
                'name'        => 'Ma Mya',
                'email'       => 'mamya@gmail.com',
                'phone'       => '09944074986',
                'password'    => Hash::make('Accountant@123456'),
                'plain_pwd'   => 'Accountant@123456',
                'employee_id' => 'EMP-006',
                'is_active'   => true,
                'role'        => 'accountant',
            ],
            // Delivery Staff (5)
            [
                'name'        => 'Ko Zaw',
                'email'       => 'kozaw@gmail.com',
                'phone'       => '09944074987',
                'password'    => Hash::make('Staff@123456'),
                'plain_pwd'   => 'Staff@123456',
                'employee_id' => 'EMP-007',
                'is_active'   => true,
                'role'        => 'delivery_staff',
            ],
            [
                'name'        => 'Ko Aung',
                'email'       => 'koaung@gmail.com',
                'phone'       => '09944074988',
                'password'    => Hash::make('Staff@123456'),
                'plain_pwd'   => 'Staff@123456',
                'employee_id' => 'EMP-008',
                'is_active'   => true,
                'role'        => 'delivery_staff',
            ],
            [
                'name'        => 'Ma Thida',
                'email'       => 'mathida@gmail.com',
                'phone'       => '09944074989',
                'password'    => Hash::make('Staff@123456'),
                'plain_pwd'   => 'Staff@123456',
                'employee_id' => 'EMP-009',
                'is_active'   => true,
                'role'        => 'delivery_staff',
            ],
            [
                'name'        => 'Ko Min',
                'email'       => 'komin@gmail.com',
                'phone'       => '09944074990',
                'password'    => Hash::make('Staff@123456'),
                'plain_pwd'   => 'Staff@123456',
                'employee_id' => 'EMP-010',
                'is_active'   => true,
                'role'        => 'delivery_staff',
            ],
            [
                'name'        => 'Ko Htet',
                'email'       => 'kohtet@gmail.com',
                'phone'       => '09944074991',
                'password'    => Hash::make('Staff@123456'),
                'plain_pwd'   => 'Staff@123456',
                'employee_id' => 'EMP-011',
                'is_active'   => true,
                'role'        => 'delivery_staff',
            ],
        ];

        $tableData = [];

        foreach ($users as $userData) {
            $role = $userData['role'];
            $plainPwd = $userData['plain_pwd'];
            unset($userData['role'], $userData['plain_pwd']);

            $user = User::where('phone', $userData['phone'])
                ->orWhere('email', $userData['email'])
                ->first();

            if ($user) {
                $user->update($userData);
            } else {
                $user = User::create($userData);
            }

            if (!$user->hasRole($role)) {
                $user->assignRole($role);
            }

            $tableData[] = [$role, $user->name, $user->email, $user->phone, $plainPwd];
        }

        $this->command->info('Users seeded. Development accounts: ' . count($users) . ' users.');
        $this->command->table(
            ['Role', 'Name', 'Email', 'Phone', 'Password'],
            $tableData
        );
    }
}
