<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RolesSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'name'     => 'Admin User',
                'email'    => 'admin@start4truckers.com',
                'password' => Hash::make('password'),
                'role'     => 'admin',
                'is_active'=> true,
            ],
            [
                'name'     => 'Manager User',
                'email'    => 'manager@start4truckers.com',
                'password' => Hash::make('password'),
                'role'     => 'manager',
                'is_active'=> true,
            ],
            [
                'name'     => 'Sales User',
                'email'    => 'sales@start4truckers.com',
                'password' => Hash::make('password'),
                'role'     => 'sales',
                'is_active'=> true,
            ],
            [
                'name'     => 'Processing User',
                'email'    => 'processing@start4truckers.com',
                'password' => Hash::make('password'),
                'role'     => 'processing',
                'is_active'=> true,
            ],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );
        }
    }
}
