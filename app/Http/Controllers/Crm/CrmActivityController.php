<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\CrmActivity;
use App\Models\Lead;
use App\Models\CurrentAccount;
use App\Models\SalesOffer;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CrmActivityController extends Controller
{
    /**
     * Display a listing of activities
     */
    public function index(Request $request)
    {
        $query = CrmActivity::with(['subject', 'performer'])
            ->orderByDesc('activity_date');

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('performed_by')) {
            $query->where('performed_by', $request->performed_by);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('activity_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('activity_date', '<=', $request->date_to);
        }

        $activities = $query->paginate(30)->withQueryString();

        return Inertia::render('Crm/Activities/Index', [
            'activities' => $activities,
            'types' => CrmActivity::getTypes(),
            'users' => User::active()->orderBy('name')->get(['id', 'name']),
            'filters' => $request->only(['type', 'performed_by', 'date_from', 'date_to']),
        ]);
    }

    /**
     * Calendar view
     */
    public function calendar(Request $request)
    {
        $start = $request->get('start', now()->startOfMonth()->format('Y-m-d'));
        $end = $request->get('end', now()->endOfMonth()->format('Y-m-d'));

        $activities = CrmActivity::with(['subject', 'performer'])
            ->whereBetween('activity_date', [$start, $end])
            ->get()
            ->map(function ($activity) {
                return [
                    'id' => $activity->id,
                    'title' => $activity->title,
                    'start' => $activity->activity_date->toIso8601String(),
                    'end' => $activity->end_date?->toIso8601String(),
                    'type' => $activity->type,
                    'color' => $this->getTypeColor($activity->type),
                ];
            });

        return response()->json([
            'activities' => $activities,
        ]);
    }

    /**
     * Store a newly created activity
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'subject_type' => 'required|in:lead,account,offer',
            'subject_id' => 'required|integer',
            'type' => 'required|in:call,email,meeting,note,sms,visit,demo,other',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'activity_date' => 'required|date',
            'end_date' => 'nullable|date|after:activity_date',
            'duration_minutes' => 'nullable|integer|min:0',
            'direction' => 'nullable|in:inbound,outbound',
            'email_subject' => 'nullable|string|max:255',
            'email_body' => 'nullable|string',
            'outcome' => 'nullable|string|max:255',
            'outcome_notes' => 'nullable|string',
            'meeting_location' => 'nullable|string|max:255',
            'meeting_address' => 'nullable|string',
        ]);

        // Map subject type to model class
        $subjectTypeMap = [
            'lead' => Lead::class,
            'account' => CurrentAccount::class,
            'offer' => SalesOffer::class,
        ];

        $validated['subject_type'] = $subjectTypeMap[$validated['subject_type']];
        $validated['performed_by'] = Auth::id();
        $validated['created_by'] = Auth::id();

        $activity = CrmActivity::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Aktivite kaydedildi.',
            'activity' => $activity->load(['subject', 'performer']),
        ]);
    }

    /**
     * Display the specified activity
     */
    public function show(CrmActivity $activity)
    {
        $activity->load(['subject', 'performer', 'creator']);

        return response()->json([
            'activity' => $activity,
        ]);
    }

    /**
     * Update the specified activity
     */
    public function update(Request $request, CrmActivity $activity)
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
            'meeting_location' => 'nullable|string|max:255',
            'meeting_address' => 'nullable|string',
        ]);

        $activity->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Aktivite güncellendi.',
            'activity' => $activity->fresh(['subject', 'performer']),
        ]);
    }

    /**
     * Remove the specified activity
     */
    public function destroy(CrmActivity $activity)
    {
        $activity->delete();

        return response()->json([
            'success' => true,
            'message' => 'Aktivite silindi.',
        ]);
    }

    /**
     * Get upcoming activities
     */
    public function upcoming(Request $request)
    {
        $days = $request->get('days', 7);

        $activities = CrmActivity::with(['subject', 'performer'])
            ->upcoming()
            ->where('activity_date', '<=', now()->addDays($days))
            ->orderBy('activity_date')
            ->limit(20)
            ->get();

        return response()->json([
            'activities' => $activities,
        ]);
    }

    /**
     * Get recent activities
     */
    public function recent(Request $request)
    {
        $limit = $request->get('limit', 10);

        $activities = CrmActivity::with(['subject', 'performer'])
            ->orderByDesc('activity_date')
            ->limit($limit)
            ->get();

        return response()->json([
            'activities' => $activities,
        ]);
    }

    private function getTypeColor(string $type): string
    {
        $colors = [
            'call' => '#3b82f6',
            'email' => '#8b5cf6',
            'meeting' => '#10b981',
            'note' => '#6b7280',
            'sms' => '#f59e0b',
            'visit' => '#ef4444',
            'demo' => '#ec4899',
            'other' => '#64748b',
        ];
        return $colors[$type] ?? '#64748b';
    }
}
