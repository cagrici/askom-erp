<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\LeadStage;
use App\Models\LeadSource;
use App\Models\SalesOffer;
use App\Models\PipelineStage;
use App\Models\CrmActivity;
use App\Models\CrmTask;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class CrmDashboardController extends Controller
{
    /**
     * Display CRM dashboard
     */
    public function index()
    {
        // Total counts
        $totalLeads = Lead::count();
        $convertedLeads = Lead::converted()->count();
        $lostLeads = Lead::lost()->count();

        // Stats for dashboard cards
        $stats = [
            'total_leads' => $totalLeads,
            'leads_this_month' => Lead::whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count(),
            'total_value' => Lead::active()->sum('estimated_value') ?? 0,
            'weighted_value' => Lead::active()
                ->whereHas('stage')
                ->get()
                ->sum(fn($lead) => ($lead->estimated_value ?? 0) * (($lead->stage->win_probability ?? 0) / 100)),
            'conversion_rate' => $totalLeads > 0 ? round(($convertedLeads / $totalLeads) * 100, 1) : 0,
            'avg_lead_score' => Lead::active()->avg('lead_score') ?? 0,
        ];

        // Leads by stage with counts and values
        $leadsByStage = LeadStage::active()
            ->ordered()
            ->get()
            ->map(function ($stage) {
                $stageLeads = Lead::where('lead_stage_id', $stage->id)->active();
                return [
                    'id' => $stage->id,
                    'name' => $stage->name,
                    'color' => $stage->color,
                    'count' => $stageLeads->count(),
                    'value' => $stageLeads->sum('estimated_value') ?? 0,
                ];
            });

        // Leads by source
        $leadsBySource = LeadSource::withCount('leads')
            ->active()
            ->ordered()
            ->get()
            ->map(fn($source) => [
                'name' => $source->name,
                'count' => $source->leads_count,
            ]);

        // Recent leads
        $recentLeads = Lead::with(['stage', 'source'])
            ->orderByDesc('created_at')
            ->limit(5)
            ->get();

        // Upcoming tasks
        $upcomingTasks = CrmTask::with(['subject', 'assignee'])
            ->open()
            ->where('due_date', '<=', now()->addDays(7))
            ->orderBy('due_date')
            ->limit(5)
            ->get()
            ->map(fn($task) => [
                'id' => $task->id,
                'title' => $task->title,
                'type' => $task->type,
                'due_date' => $task->due_date->toDateString(),
                'priority' => $task->priority,
                'subject_type' => $task->subject_type,
                'subject' => $task->subject,
            ]);

        // Recent activities
        $recentActivities = CrmActivity::with(['subject', 'performer'])
            ->orderByDesc('activity_date')
            ->limit(5)
            ->get()
            ->map(fn($activity) => [
                'id' => $activity->id,
                'type' => $activity->type,
                'title' => $activity->title,
                'activity_date' => $activity->activity_date->toDateTimeString(),
                'performed_by' => $activity->performer,
                'subject' => $activity->subject,
            ]);

        // Conversion trend (last 6 months)
        $conversionTrend = collect();
        for ($i = 5; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $monthLeads = Lead::whereMonth('created_at', $date->month)
                ->whereYear('created_at', $date->year);

            $conversionTrend->push([
                'month' => $date->format('M'),
                'converted' => (clone $monthLeads)->whereNotNull('converted_at')->count(),
                'lost' => (clone $monthLeads)->whereHas('stage', fn($q) => $q->where('is_lost', true))->count(),
            ]);
        }

        return Inertia::render('Crm/Dashboard/Index', [
            'stats' => $stats,
            'leadsByStage' => $leadsByStage,
            'leadsBySource' => $leadsBySource,
            'recentLeads' => $recentLeads,
            'upcomingTasks' => $upcomingTasks,
            'recentActivities' => $recentActivities,
            'conversionTrend' => $conversionTrend,
        ]);
    }

    /**
     * Get dashboard stats (AJAX)
     */
    public function stats()
    {
        $leadStats = [
            'total' => Lead::count(),
            'active' => Lead::active()->count(),
            'converted' => Lead::converted()->count(),
            'lost' => Lead::lost()->count(),
            'hot' => Lead::hot()->count(),
            'overdue_followup' => Lead::overdueFollowUp()->count(),
        ];

        $taskStats = [
            'pending' => CrmTask::pending()->count(),
            'in_progress' => CrmTask::inProgress()->count(),
            'overdue' => CrmTask::overdue()->count(),
            'due_today' => CrmTask::dueToday()->count(),
            'my_open' => CrmTask::assignedTo(Auth::id())->open()->count(),
        ];

        $pipelineStats = [
            'total_count' => SalesOffer::whereNotNull('pipeline_stage_id')
                ->whereNotIn('status', ['converted_to_order', 'expired'])
                ->count(),
            'total_value' => SalesOffer::whereNotNull('pipeline_stage_id')
                ->whereNotIn('status', ['converted_to_order', 'expired'])
                ->sum('total_amount'),
        ];

        return response()->json([
            'lead_stats' => $leadStats,
            'task_stats' => $taskStats,
            'pipeline_stats' => $pipelineStats,
        ]);
    }

    /**
     * Get funnel data (AJAX)
     */
    public function funnel()
    {
        $leadFunnel = LeadStage::active()
            ->ordered()
            ->get()
            ->map(function ($stage) {
                $leads = Lead::where('lead_stage_id', $stage->id)->active();
                return [
                    'id' => $stage->id,
                    'name' => $stage->name,
                    'slug' => $stage->slug,
                    'color' => $stage->color,
                    'count' => $leads->count(),
                    'value' => $leads->sum('estimated_value'),
                    'probability' => $stage->win_probability,
                ];
            });

        $pipelineFunnel = PipelineStage::active()
            ->ordered()
            ->get()
            ->map(function ($stage) {
                $offers = SalesOffer::where('pipeline_stage_id', $stage->id)
                    ->whereNotIn('status', ['converted_to_order', 'expired']);
                return [
                    'id' => $stage->id,
                    'name' => $stage->name,
                    'slug' => $stage->slug,
                    'color' => $stage->color,
                    'count' => $offers->count(),
                    'value' => $offers->sum('total_amount'),
                    'weighted_value' => $offers->sum('weighted_value'),
                    'probability' => $stage->win_probability,
                ];
            });

        return response()->json([
            'lead_funnel' => $leadFunnel,
            'pipeline_funnel' => $pipelineFunnel,
        ]);
    }
}
