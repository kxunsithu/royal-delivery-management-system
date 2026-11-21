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
