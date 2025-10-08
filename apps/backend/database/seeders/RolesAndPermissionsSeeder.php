<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $roles = [
            'Admin',
            'Operator',
            'Planner',
            'Technical',
            'Purchasing',
            'Warehouse',
            'QC',
        ];

        foreach ($roles as $roleName) {
            Role::firstOrCreate(['name' => $roleName]);
        }

        $adminUser = User::firstOrCreate(
            ['email' => 'admin@forza.local'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password'),
            ]
        );

        $adminUser->assignRole('Admin');
    }
}
