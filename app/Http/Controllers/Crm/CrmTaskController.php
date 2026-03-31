<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\CrmTask;
use App\Models\Lead;
use App\Models\CurrentAccount;
use App\Models\SalesOffer;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CrmTaskController extends Controller
{
    /**
     * Display a listing of tasks
     */
    public function index(Request $request)
    {
        $query = CrmTask::with(['subject', 'assignee', 'creator'])
            ->orderBy('due_date');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        } else {
            $query->open(); // Show open tasks by default
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        if ($request->filled('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('due_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('due_date', '<=', $request->date_to);
        }

        $tasks = $query->paginate(30)->withQueryString();

        // Calculate stats
        $stats = [
            'pending' => CrmTask::pending()->count(),
            'in_progress' => CrmTask::inProgress()->count(),
            'completed' => CrmTask::completed()->count(),
            'overdue' => CrmTask::overdue()->count(),
        ];

        return Inertia::render('Crm/Tasks/Index', [
            'tasks' => $tasks,
            'types' => CrmTask::getTypes(),
            'priorities' => CrmTask::getPriorities(),
            'statuses' => CrmTask::getStatuses(),
            'users' => User::active()->orderBy('name')->get(['id', 'name']),
            'filters' => $request->only(['status', 'type', 'priority', 'assigned_to', 'date_from', 'date_to']),
            'stats' => $stats,
        ]);
    }

    /**
     * My tasks
     */
    public function myTasks(Request $request)
    {
        $query = CrmTask::with(['subject'])
            ->where('assigned_to', Auth::id())
            ->open()
            ->orderBy('due_date');

        $tasks = $query->paginate(30)->withQueryString();

        return Inertia::render('Crm/Tasks/MyTasks', [
            'tasks' => $tasks,
        ]);
    }

    /**
     * Overdue tasks
     */
    public function overdue()
    {
        $tasks = CrmTask::with(['subject', 'assignee'])
            ->overdue()
            ->orderBy('due_date')
            ->get();

        return response()->json([
            'tasks' => $tasks,
            'count' => $tasks->count(),
        ]);
    }

    /**
     * Tasks due today
     */
    public function dueToday()
    {
        $tasks = CrmTask::with(['subject', 'assignee'])
            ->dueToday()
            ->orderBy('due_date')
            ->get();

        return response()->json([
            'tasks' => $tasks,
            'count' => $tasks->count(),
        ]);
    }

    /**
     * Store a newly created task
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'subject_type' => 'required|in:lead,account,offer',
            'subject_id' => 'required|integer',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:call,email,meeting,follow_up,proposal,demo,visit,other',
            'priority' => 'required|in:low,medium,high,urgent',
            'due_date' => 'required|date',
            'reminder_date' => 'nullable|date|before:due_date',
            'assigned_to' => 'required|exists:users,id',
        ]);

        // Map subject type to model class
        $subjectTypeMap = [
            'lead' => Lead::class,
            'account' => CurrentAccount::class,
            'offer' => SalesOffer::class,
        ];

        $validated['subject_type'] = $subjectTypeMap[$validated['subject_type']];
        $validated['status'] = 'pending';
        $validated['created_by'] = Auth::id();

        $task = CrmTask::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Görev oluşturuldu.',
            'task' => $task->load(['subject', 'assignee']),
        ]);
    }

    /**
     * Display the specified task
     */
    public function show(CrmTask $task)
    {
        $task->load(['subject', 'assignee', 'creator', 'completer']);

        return response()->json([
            'task' => $task,
        ]);
    }

    /**
     * Update the specified task
     */
    public function update(Request $request, CrmTask $task)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:call,email,meeting,follow_up,proposal,demo,visit,other',
            'priority' => 'required|in:low,medium,high,urgent',
            'status' => 'required|in:pending,in_progress,completed,cancelled',
            'due_date' => 'required|date',
            'reminder_date' => 'nullable|date|before:due_date',
            'assigned_to' => 'required|exists:users,id',
        ]);

        // If completing, set completed_at and completed_by
        if ($validated['status'] === 'completed' && $task->status !== 'completed') {
            $validated['completed_at'] = now();
            $validated['completed_by'] = Auth::id();
        }

        $task->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Görev güncellendi.',
            'task' => $task->fresh(['subject', 'assignee']),
        ]);
    }

    /**
     * Remove the specified task
     */
    public function destroy(CrmTask $task)
    {
        $task->delete();

        return response()->json([
            'success' => true,
            'message' => 'Görev silindi.',
        ]);
    }

    /**
     * Mark task as complete
     */
    public function complete(Request $request, CrmTask $task)
    {
        $validated = $request->validate([
            'notes' => 'nullable|string',
        ]);

        $task->complete($validated['notes'] ?? null);

        return response()->json([
            'success' => true,
            'message' => 'Görev tamamlandı.',
            'task' => $task->fresh(['subject', 'assignee']),
        ]);
    }

    /**
     * Start working on task
     */
    public function start(CrmTask $task)
    {
        $task->start();

        return response()->json([
            'success' => true,
            'message' => 'Görev başlatıldı.',
            'task' => $task->fresh(['subject', 'assignee']),
        ]);
    }
}
