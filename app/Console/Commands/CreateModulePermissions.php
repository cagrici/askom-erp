<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Spatie\Permission\Models\Permission;

class CreateModulePermissions extends Command
{
    protected $signature = 'permissions:create-modules';
    protected $description = 'Create permissions for all modules in the application';

    public function handle()
    {
        $modules = [
            'job_requests' => ['view_job_requests', 'create_job_requests', 'edit_job_requests', 'delete_job_requests'],
            'work_requests' => ['view_work_requests', 'create_work_requests', 'edit_work_requests', 'delete_work_requests'],
            'approvals' => ['view_approvals', 'manage_approvals'],
            'expenses' => ['view_expenses', 'create_expenses', 'edit_expenses', 'delete_expenses'],
            'todos' => ['view_todos', 'create_todos', 'edit_todos', 'delete_todos'],
            'meetings' => ['view_meetings', 'manage_meetings'],
            'visitors' => ['view_visitors', 'manage_visitors'],
            'documents' => ['view_documents', 'create_documents', 'edit_documents', 'delete_documents', 'manage_documents'],
            'fleet' => ['view_fleet', 'manage_fleet'],
            'production' => ['view_production', 'manage_production'],
            'announcements' => ['view_announcements', 'create_announcements', 'edit_announcements', 'delete_announcements'],
            'companies' => ['view_companies', 'manage_companies'],
            'organization_chart' => ['view_organization_chart'],
            'company_locations' => ['view_company_locations', 'manage_company_locations'],
            'reports' => ['view_reports', 'manage_reports'],
            'news' => ['view_news', 'create_news', 'edit_news', 'delete_news'],
            'ideas' => ['view_ideas', 'create_ideas', 'edit_ideas', 'delete_ideas'],
            'contracts' => ['view_contracts', 'manage_contracts'],
            'quality' => ['view_quality', 'manage_quality'],
            'packages' => ['view_packages', 'manage_packages'],
            'training' => ['view_training', 'manage_training'],
        ];

        $createdCount = 0;

        foreach ($modules as $module => $permissions) {
            $this->info("Creating permissions for module: {$module}");
            
            foreach ($permissions as $permission) {
                $existingPermission = Permission::where('name', $permission)->first();
                
                if (!$existingPermission) {
                    Permission::create([
                        'name' => $permission,
                        'guard_name' => 'web'
                    ]);
                    $this->line("  ✓ Created: {$permission}");
                    $createdCount++;
                } else {
                    $this->line("  - Exists: {$permission}");
                }
            }
        }

        $this->info("\nModule permissions created successfully!");
        $this->info("Total new permissions created: {$createdCount}");
        
        $this->info("\nUsage:");
        $this->info("1. Assign permissions to roles using: php artisan tinker");
        $this->info("2. Example: \$role = Role::find(1); \$role->givePermissionTo('view_documents');");
        $this->info("3. Or assign to user: \$user = User::find(1); \$user->givePermissionTo('view_documents');");
    }
}