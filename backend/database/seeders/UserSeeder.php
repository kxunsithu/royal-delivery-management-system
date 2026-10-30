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
                'email'       => 'admin@royal-myawaddy.local',
                'phone'       => '+95-9-111-000-001',
                'password'    => Hash::make('Admin@123456'),
                'employee_id' => 'EMP-001',
                'is_active'   => true,
                'role'        => 'admin',
            ],
            [
                'name'        => 'မောင်မိုး (မန်နေဂျာ)',
                'email'       => 'manager@royal-myawaddy.local',
                'phone'       => '+95-9-111-000-002',
                'password'    => Hash::make('Manager@123456'),
                'employee_id' => 'EMP-002',
                'is_active'   => true,
                'role'        => 'manager',
            ],
            [
                'name'        => 'မခင် (စာရင်းကိုင်)',
                'email'       => 'accountant@royal-myawaddy.local',
                'phone'       => '+95-9-111-000-003',
                'password'    => Hash::make('Accountant@123456'),
                'employee_id' => 'EMP-003',
                'is_active'   => true,
                'role'        => 'accountant',
            ],
            [
                'name'        => 'ကိုဇော် (ပို့ဆောင်ရေး ၁)',
                'email'       => 'staff1@royal-myawaddy.local',
                'phone'       => '+95-9-111-000-004',
                'password'    => Hash::make('Staff@123456'),
                'employee_id' => 'EMP-004',
                'is_active'   => true,
                'role'        => 'delivery_staff',
            ],
            [
                'name'        => 'ကိုအောင် (ပို့ဆောင်ရေး ၂)',
                'email'       => 'staff2@royal-myawaddy.local',
                'phone'       => '+95-9-111-000-005',
                'password'    => Hash::make('Staff@123456'),
                'employee_id' => 'EMP-005',
                'is_active'   => true,
                'role'        => 'delivery_staff',
            ],
            [
                'name'        => 'မသီတာ (ပို့ဆောင်ရေး ၃)',
                'email'       => 'staff3@royal-myawaddy.local',
                'phone'       => '+95-9-111-000-006',
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
                ['Admin',            'admin@royal-myawaddy.local',     'Admin@123456'],
                ['Manager',          'manager@royal-myawaddy.local',   'Manager@123456'],
                ['Accountant',       'accountant@royal-myawaddy.local','Accountant@123456'],
                ['Delivery Staff 1', 'staff1@royal-myawaddy.local',    'Staff@123456'],
                ['Delivery Staff 2', 'staff2@royal-myawaddy.local',    'Staff@123456'],
                ['Delivery Staff 3', 'staff3@royal-myawaddy.local',    'Staff@123456'],
            ]
        );
    }
}
