<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User;
use App\Models\MessageGroup;
use App\Models\WorkCategory;
use App\Models\Department;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    // Middleware is handled in routes/admin.php

    public function index()
    {
        // User statistics
        $userStats = [
            'total_users' => User::count(),
            'total_roles' => Role::count(),
            'total_permissions' => Permission::count(),
            'active_users' => User::whereNotNull('last_login_at')->count(),
        ];

        // Work statistics
        $workStats = [
            // Overall task status
            'task_status' => MessageGroup::selectRaw('status, count(*) as count')
                ->groupBy('status')
                ->pluck('count', 'status')
                ->toArray(),
            
            // Priority distribution
            'priority_distribution' => MessageGroup::whereIn('status', ['open', 'in_progress'])
                ->selectRaw('priority, count(*) as count')
                ->groupBy('priority')
                ->pluck('count', 'priority')
                ->toArray(),
            
            // Category statistics
            'category_stats' => MessageGroup::join('work_categories', 'message_groups.category_id', '=', 'work_categories.id')
                ->selectRaw('work_categories.name as category, 
                           count(*) as total,
                           sum(case when status = "completed" then 1 else 0 end) as completed,
                           sum(case when status in ("open", "in_progress") then 1 else 0 end) as active')
                ->groupBy('work_categories.id', 'work_categories.name')
                ->get()
                ->toArray(),
            
            // Department performance
            'department_performance' => MessageGroup::join('users', 'message_groups.assigned_to', '=', 'users.id')
                ->join('departments', 'users.department_id', '=', 'departments.id')
                ->selectRaw('departments.name as department,
                           count(*) as total_tasks,
                           sum(case when message_groups.status = "completed" then 1 else 0 end) as completed_tasks,
                           sum(case when message_groups.due_date < NOW() and message_groups.status != "completed" then 1 else 0 end) as overdue_tasks')
                ->groupBy('departments.id', 'departments.name')
                ->get()
                ->toArray(),
            
            // User performance (top 10)
            'top_performers' => MessageGroup::join('users', 'message_groups.assigned_to', '=', 'users.id')
                ->selectRaw('users.name as user_name,
                           count(*) as total_tasks,
                           sum(case when message_groups.status = "completed" then 1 else 0 end) as completed_tasks')
                ->where('message_groups.created_at', '>=', now()->subDays(30))
                ->groupBy('users.id', 'users.name')
                ->orderByDesc('completed_tasks')
                ->limit(10)
                ->get()
                ->toArray(),
            
            // Weekly trends (last 8 weeks)
            'weekly_trends' => MessageGroup::selectRaw('
                YEAR(created_at) as year,
                WEEK(created_at) as week,
                count(*) as created_tasks,
                sum(case when status = "completed" then 1 else 0 end) as completed_tasks
            ')
                ->where('created_at', '>=', now()->subWeeks(8))
                ->groupBy('year', 'week')
                ->orderBy('year')
                ->orderBy('week')
                ->get()
                ->toArray(),
            
            // Current totals
            'totals' => [
                'total_tasks' => MessageGroup::count(),
                'active_tasks' => MessageGroup::whereIn('status', ['open', 'in_progress'])->count(),
                'completed_tasks' => MessageGroup::where('status', 'completed')->count(),
                'overdue_tasks' => MessageGroup::where('due_date', '<', now())
                    ->whereNotIn('status', ['completed', 'cancelled'])
                    ->count(),
                'this_week_completed' => MessageGroup::where('status', 'completed')
                    ->where('completed_at', '>=', now()->startOfWeek())
                    ->count(),
            ]
        ];

        return Inertia::render('Admin/Dashboard', [
            'userStats' => $userStats,
            'workStats' => $workStats
        ]);
    }
}