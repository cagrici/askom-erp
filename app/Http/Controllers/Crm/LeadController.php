<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\LeadStage;
use App\Models\LeadSource;
use App\Models\SalesRepresentative;
use App\Models\Location;
use App\Models\User;
use App\Models\CrmActivity;
use App\Models\CrmTask;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class LeadController extends Controller
{
    /**
     * Display a listing of leads
     */
    public function index(Request $request)
    {
        $query = Lead::with(['stage', 'source', 'assignee', 'salesRepresentative', 'location'])
            ->orderBy('created_at', 'desc');

        // Filters
        if ($request->filled('stage_id')) {
            $query->where('lead_stage_id', $request->stage_id);
        }

        if ($request->filled('source_id')) {
            $query->where('lead_source_id', $request->source_id);
        }

        if ($request->filled('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('lead_no', 'like', "%{$search}%")
                  ->orWhere('company_name', 'like', "%{$search}%")
                  ->orWhere('contact_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Show only active leads by default
        if (!$request->filled('show_all')) {
            $query->active();
        }

        $leads = $query->paginate(20)->withQueryString();

        return Inertia::render('Crm/Leads/Index', [
            'leads' => $leads,
            'stages' => LeadStage::active()->ordered()->get(),
            'sources' => LeadSource::active()->ordered()->get(),
            'users' => User::active()->orderBy('name')->get(['id', 'name']),
            'filters' => $request->only(['stage_id', 'source_id', 'assigned_to', 'priority', 'search', 'date_from', 'date_to', 'show_all']),
        ]);
    }

    /**
     * Display Kanban view
     */
    public function kanban(Request $request)
    {
        $stages = LeadStage::active()->ordered()->get();

        $leadsByStage = [];
        foreach ($stages as $stage) {
            $query = Lead::with(['source', 'assignee'])
                ->where('lead_stage_id', $stage->id)
                ->active();

            if ($request->filled('assigned_to')) {
                $query->where('assigned_to', $request->assigned_to);
            }

            if ($request->filled('priority')) {
                $query->where('priority', $request->priority);
            }

            $leadsByStage[$stage->id] = $query->orderBy('updated_at', 'desc')->get();
        }

        // Calculate summary
        $allLeads = Lead::active();
        $summary = [
            'total_leads' => $allLeads->count(),
            'total_value' => $allLeads->sum('estimated_value') ?? 0,
            'weighted_value' => Lead::active()
                ->whereHas('stage')
                ->get()
                ->sum(fn($lead) => ($lead->estimated_value ?? 0) * (($lead->stage->win_probability ?? 0) / 100)),
        ];

        return Inertia::render('Crm/Leads/Kanban', [
            'stages' => $stages,
            'leadsByStage' => $leadsByStage,
            'summary' => $summary,
            'users' => User::active()->orderBy('name')->get(['id', 'name']),
            'filters' => $request->only(['assigned_to', 'priority']),
        ]);
    }

    /**
     * Show the form for creating a new lead
     */
    public function create()
    {
        return Inertia::render('Crm/Leads/Create', [
            'stages' => LeadStage::active()->ordered()->get(),
            'sources' => LeadSource::active()->ordered()->get(),
            'salesRepresentatives' => SalesRepresentative::where('is_active', true)->orderBy('full_name')->get(),
            'locations' => Location::active()->orderBy('name')->get(),
            'users' => User::active()->orderBy('name')->get(['id', 'name']),
            'priorities' => [
                ['value' => 'low', 'label' => 'Düşük'],
                ['value' => 'medium', 'label' => 'Orta'],
                ['value' => 'high', 'label' => 'Yüksek'],
                ['value' => 'urgent', 'label' => 'Acil'],
            ],
        ]);
    }

    /**
     * Store a newly created lead
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'company_name' => 'nullable|string|max:255',
            'contact_name' => 'required|string|max:255',
            'contact_title' => 'nullable|string|max:100',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'mobile' => 'nullable|string|max:50',
            'website' => 'nullable|url|max:255',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'district' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'industry' => 'nullable|string|max:100',
            'company_size' => 'nullable|string|max:50',
            'estimated_value' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|max:3',
            'lead_stage_id' => 'nullable|exists:lead_stages,id',
            'lead_source_id' => 'nullable|exists:lead_sources,id',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'tags' => 'nullable|array',
            'assigned_to' => 'nullable|exists:users,id',
            'sales_representative_id' => 'nullable|exists:sales_representatives,id',
            'location_id' => 'nullable|exists:locations,id',
            'expected_close_date' => 'nullable|date',
            'next_follow_up_at' => 'nullable|date',
            'notes' => 'nullable|string',
            'requirements' => 'nullable|string',
        ]);

        $validated['created_by'] = Auth::id();

        // Set default stage if not provided
        if (empty($validated['lead_stage_id'])) {
            $defaultStage = LeadStage::getDefault();
            if ($defaultStage) {
                $validated['lead_stage_id'] = $defaultStage->id;
            }
        }

        $lead = Lead::create($validated);

        // Calculate initial score
        $lead->updateScore();

        return redirect()->route('crm.leads.show', $lead)
            ->with('success', 'Lead başarıyla oluşturuldu.');
    }

    /**
     * Display the specified lead
     */
    public function show(Lead $lead)
    {
        $lead->load([
            'stage',
            'source',
            'assignee',
            'salesRepresentative',
            'location',
            'creator',
            'convertedAccount',
            'stageHistory.fromStage',
            'stageHistory.toStage',
            'stageHistory.changedBy',
            'activities.performer',
            'tasks.assignee',
            'offers',
        ]);

        return Inertia::render('Crm/Leads/Show', [
            'lead' => $lead,
            'stages' => LeadStage::active()->ordered()->get(),
            'activityTypes' => CrmActivity::getTypes(),
            'taskTypes' => CrmTask::getTypes(),
        ]);
    }

    /**
     * Show the form for editing the specified lead
     */
    public function edit(Lead $lead)
    {
        $lead->load(['stage', 'source', 'assignee', 'salesRepresentative', 'location']);

        return Inertia::render('Crm/Leads/Edit', [
            'lead' => $lead,
            'stages' => LeadStage::active()->ordered()->get(),
            'sources' => LeadSource::active()->ordered()->get(),
            'salesRepresentatives' => SalesRepresentative::where('is_active', true)->orderBy('full_name')->get(),
            'locations' => Location::active()->orderBy('name')->get(),
            'users' => User::active()->orderBy('name')->get(['id', 'name']),
            'priorities' => [
                ['value' => 'low', 'label' => 'Düşük'],
                ['value' => 'medium', 'label' => 'Orta'],
                ['value' => 'high', 'label' => 'Yüksek'],
                ['value' => 'urgent', 'label' => 'Acil'],
            ],
        ]);
    }

    /**
     * Update the specified lead
     */
    public function update(Request $request, Lead $lead)
    {
        $validated = $request->validate([
            'company_name' => 'nullable|string|max:255',
            'contact_name' => 'required|string|max:255',
            'contact_title' => 'nullable|string|max:100',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'mobile' => 'nullable|string|max:50',
            'website' => 'nullable|url|max:255',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'district' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'industry' => 'nullable|string|max:100',
            'company_size' => 'nullable|string|max:50',
            'estimated_value' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|max:3',
            'lead_stage_id' => 'required|exists:lead_stages,id',
            'lead_source_id' => 'nullable|exists:lead_sources,id',
            'priority' => 'required|in:low,medium,high,urgent',
            'tags' => 'nullable|array',
            'assigned_to' => 'nullable|exists:users,id',
            'sales_representative_id' => 'nullable|exists:sales_representatives,id',
            'location_id' => 'nullable|exists:locations,id',
            'expected_close_date' => 'nullable|date',
            'next_follow_up_at' => 'nullable|date',
            'notes' => 'nullable|string',
            'requirements' => 'nullable|string',
            'lost_reason' => 'nullable|string',
        ]);

        $validated['updated_by'] = Auth::id();

        // Check if stage changed
        $stageChanged = $lead->lead_stage_id != $validated['lead_stage_id'];

        if ($stageChanged) {
            $newStage = LeadStage::find($validated['lead_stage_id']);
            $lead->updateStage($newStage);
            unset($validated['lead_stage_id']); // Already updated
        }

        $lead->update($validated);
        $lead->updateScore();

        return redirect()->route('crm.leads.show', $lead)
            ->with('success', 'Lead başarıyla güncellendi.');
    }

    /**
     * Remove the specified lead
     */
    public function destroy(Lead $lead)
    {
        $lead->delete();

        return redirect()->route('crm.leads.index')
            ->with('success', 'Lead başarıyla silindi.');
    }

    /**
     * Update lead stage (for Kanban drag-drop)
     */
    public function updateStage(Request $request, Lead $lead)
    {
        $validated = $request->validate([
            'stage_id' => 'required|exists:lead_stages,id',
            'notes' => 'nullable|string',
        ]);

        $newStage = LeadStage::find($validated['stage_id']);
        $lead->updateStage($newStage, $validated['notes'] ?? null);

        return response()->json([
            'success' => true,
            'message' => 'Lead aşaması güncellendi.',
            'lead' => $lead->fresh(['stage']),
        ]);
    }

    /**
     * Show lead conversion page
     */
    public function showConvert(Lead $lead)
    {
        if ($lead->is_converted) {
            return redirect()->route('crm.leads.show', $lead)
                ->with('error', 'Bu lead zaten dönüştürülmüş.');
        }

        $lead->load(['source', 'salesRepresentative', 'location']);

        return Inertia::render('Crm/Leads/Convert', [
            'lead' => $lead,
            'locations' => Location::active()->orderBy('name')->get(),
            'salesRepresentatives' => SalesRepresentative::where('is_active', true)->orderBy('full_name')->get(),
        ]);
    }

    /**
     * Convert lead to current account
     */
    public function convert(Request $request, Lead $lead)
    {
        if ($lead->is_converted) {
            return back()->with('error', 'Bu lead zaten dönüştürülmüş.');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|in:customer,supplier,both',
            'person_type' => 'required|in:individual,corporate',
            'tax_number' => 'nullable|string|max:50',
            'tax_office' => 'nullable|string|max:100',
            'payment_term_id' => 'nullable|exists:payment_terms,id',
            'credit_limit' => 'nullable|numeric|min:0',
            'discount_rate' => 'nullable|numeric|min:0|max:100',
            'location_id' => 'nullable|exists:locations,id',
            'sales_representative_id' => 'nullable|exists:sales_representatives,id',
        ]);

        try {
            DB::beginTransaction();

            $account = $lead->convertToCurrentAccount($validated);

            // Move to won stage
            $wonStage = LeadStage::where('is_won', true)->first();
            if ($wonStage) {
                $lead->updateStage($wonStage, 'Müşteriye dönüştürüldü');
            }

            DB::commit();

            return redirect()->route('crm.leads.show', $lead)
                ->with('success', 'Lead başarıyla müşteriye dönüştürüldü.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Dönüştürme sırasında hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Get lead timeline (activities + stage history)
     */
    public function timeline(Lead $lead)
    {
        $activities = $lead->activities()->with('performer')->get();
        $stageHistory = $lead->stageHistory()->with(['fromStage', 'toStage', 'changedBy'])->get();

        // Merge and sort by date
        $timeline = collect();

        foreach ($activities as $activity) {
            $timeline->push([
                'type' => 'activity',
                'date' => $activity->activity_date,
                'data' => $activity,
            ]);
        }

        foreach ($stageHistory as $history) {
            $timeline->push([
                'type' => 'stage_change',
                'date' => $history->created_at,
                'data' => $history,
            ]);
        }

        $timeline = $timeline->sortByDesc('date')->values();

        return response()->json([
            'timeline' => $timeline,
        ]);
    }

    /**
     * Get lead activities
     */
    public function activities(Lead $lead)
    {
        $activities = $lead->activities()
            ->with('performer')
            ->orderByDesc('activity_date')
            ->get();

        return response()->json([
            'activities' => $activities,
        ]);
    }

    /**
     * Store activity for lead
     */
    public function storeActivity(Request $request, Lead $lead)
    {
        $validated = $request->validate([
            'type' => 'required|in:call,email,meeting,note,sms,visit,demo,other',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'activity_date' => 'required|date',
            'end_date' => 'nullable|date|after:activity_date',
            'duration_minutes' => 'nullable|integer|min:0',
            'direction' => 'nullable|in:inbound,outbound',
            'outcome' => 'nullable|string|max:255',
            'outcome_notes' => 'nullable|string',
        ]);

        $validated['subject_type'] = Lead::class;
        $validated['subject_id'] = $lead->id;
        $validated['performed_by'] = Auth::id();
        $validated['created_by'] = Auth::id();

        $activity = CrmActivity::create($validated);

        // Update last contact date
        $lead->update([
            'last_contact_at' => $validated['activity_date'],
            'updated_by' => Auth::id(),
        ]);
        $lead->updateScore();

        return response()->json([
            'success' => true,
            'message' => 'Aktivite kaydedildi.',
            'activity' => $activity->load('performer'),
        ]);
    }

    /**
     * Get lead tasks
     */
    public function tasks(Lead $lead)
    {
        $tasks = $lead->tasks()
            ->with('assignee')
            ->orderBy('due_date')
            ->get();

        return response()->json([
            'tasks' => $tasks,
        ]);
    }

    /**
     * Store task for lead
     */
    public function storeTask(Request $request, Lead $lead)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:call,email,meeting,follow_up,proposal,demo,visit,other',
            'priority' => 'required|in:low,medium,high,urgent',
            'due_date' => 'required|date',
            'reminder_date' => 'nullable|date|before:due_date',
            'assigned_to' => 'required|exists:users,id',
        ]);

        $validated['subject_type'] = Lead::class;
        $validated['subject_id'] = $lead->id;
        $validated['status'] = 'pending';
        $validated['created_by'] = Auth::id();

        $task = CrmTask::create($validated);

        // Update next follow up date
        if (!$lead->next_follow_up_at || $validated['due_date'] < $lead->next_follow_up_at) {
            $lead->update([
                'next_follow_up_at' => $validated['due_date'],
                'updated_by' => Auth::id(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Görev oluşturuldu.',
            'task' => $task->load('assignee'),
        ]);
    }

    /**
     * Search leads (AJAX)
     */
    public function search(Request $request)
    {
        $search = $request->get('q', '');

        $leads = Lead::with(['stage', 'source'])
            ->where(function($q) use ($search) {
                $q->where('lead_no', 'like', "%{$search}%")
                  ->orWhere('company_name', 'like', "%{$search}%")
                  ->orWhere('contact_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            })
            ->active()
            ->limit(20)
            ->get();

        return response()->json([
            'leads' => $leads,
        ]);
    }

    /**
     * Get stages list
     */
    public function getStages()
    {
        return response()->json([
            'stages' => LeadStage::active()->ordered()->get(),
        ]);
    }

    /**
     * Get sources list
     */
    public function getSources()
    {
        return response()->json([
            'sources' => LeadSource::active()->ordered()->get(),
        ]);
    }
}
