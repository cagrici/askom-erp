<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\PermissionModule;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Spatie\Permission\PermissionRegistrar;

class AccountingCashFlowPermissionSeeder extends Seeder
{
    /**
     * Create the cash flow permission and attach it to relevant existing roles.
     */
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->createPermissionModule();
        $permission = $this->createPermission();
        $this->assignPermissionToExistingRoles($permission);

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->command?->info('Cash flow permission seeded successfully.');
    }

    private function createPermissionModule(): void
    {
        PermissionModule::firstOrCreate(
            ['slug' => 'accounting'],
            [
                'name' => 'Accounting',
                'slug' => 'accounting',
                'display_name' => 'Muhasebe',
                'icon' => 'ri-calculator-line',
                'description' => 'Muhasebe ve finans yonetimi',
                'order' => 14,
                'is_active' => true,
            ]
        );
    }

    private function createPermission(): Permission
    {
        return Permission::firstOrCreate(
            ['name' => 'View Cash Flow'],
            [
                'guard_name' => 'web',
                'slug' => Str::slug('View Cash Flow'),
                'description' => 'Nakit akisi ekranina erisim izni',
                'module' => 'accounting',
                'display_name' => 'Nakit Akisi Goruntuleme',
                'group' => 'reports',
                'order' => 10,
                'is_active' => true,
            ]
        );
    }

    private function assignPermissionToExistingRoles(Permission $permission): void
    {
        Role::query()
            ->whereIn('name', [
                'admin',
                'Admin',
                'yonetim',
                'Yonetim',
                'company_manager',
            ])
            ->get()
            ->each(function (Role $role) use ($permission): void {
                if (! $role->hasPermissionTo($permission)) {
                    $role->givePermissionTo($permission);
                }
            });
    }
}
