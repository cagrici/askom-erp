<?php

namespace App\Http\Controllers\WorkRequest;

use App\Http\Controllers\Controller;
use App\Models\ApprovalWorkflow;
use App\Models\Category;
use App\Models\Department;
use App\Models\User;
use App\Models\WorkRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WorkRequestController extends Controller
{
    /**
     * Display a listing of work requests.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $query = WorkRequest::with(['requester', 'assignee', 'department']);

        // Filter by tab (default: all)
        $tab = $request->input('tab', 'all');

        switch ($tab) {
            case 'created':
                $query->where('requester_id', $user->id);
                break;

            case 'assigned':
                $query->where('assignee_id', $user->id);
                break;

            case 'pending_approval':
                // Requests that need user's approval (requires complex query with approval workflow)
                // This is simplified for now
                $query->whereHas('approvalRequests', function ($q) use ($user) {
                    $q->where('status', 'pending')
                        ->where('approver_id', $user->id);
                });
                break;

            case 'completed':
                $query->where(function ($q) use ($user) {
                    $q->where('requester_id', $user->id)
                        ->orWhere('assignee_id', $user->id);
                })->where('status', 'completed');
                break;

            default:
                // All requests visible to user
                $query->where(function ($q) use ($user) {
                    $q->where('requester_id', $user->id)
                        ->orWhere('assignee_id', $user->id)
                        ->orWhere('reviewer_id', $user->id)
                        ->orWhereHas('approvalRequests', function ($q) use ($user) {
                            $q->where('approver_id', $user->id);
                        });

                    // Department managers see all requests for their department
                    if ($user->department && $user->department->manager_id === $user->id) {
                        $q->orWhere('department_id', $user->department_id);
                    }

                    // Admins see all requests
                    if ($user->is_admin) {
                        $q->orWhereNotNull('id');
                    }
                });
                break;
        }

        // Apply filters
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        if ($request->has('priority') && $request->priority) {
            $query->where('priority', $request->priority);
        }

        if ($request->has('department_id') && $request->department_id) {
            $query->where('department_id', $request->department_id);
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Sort
        $sortField = $request->input('sort_field', 'created_at');
        $sortDirection = $request->input('sort_direction', 'desc');

        $allowedSortFields = ['title', 'status', 'priority', 'due_date', 'created_at'];

        if (in_array($sortField, $allowedSortFields)) {
            $query->orderBy($sortField, $sortDirection);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $workRequests = $query->paginate(15)
            ->withQueryString();

        // Get departments for filter dropdown
        $departments = Department::where('status', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        // Get status options for filter dropdown
        $statuses = [
            'pending' => 'Bekliyor',
            'in_progress' => 'İşlemde',
            'completed' => 'Tamamlandı',
            'cancelled' => 'İptal Edildi',
            'rejected' => 'Reddedildi',
            'approved' => 'Onaylandı',
        ];

        // Get priority options for filter dropdown
        $priorities = [
            'low' => 'Düşük',
            'medium' => 'Orta',
            'high' => 'Yüksek',
            'critical' => 'Kritik',
        ];

        return Inertia::render('WorkRequests/Index', [
            'workRequests' => $workRequests,
            'departments' => $departments,
            'statuses' => $statuses,
            'priorities' => $priorities,
            'filters' => $request->only(['status', 'priority', 'department_id', 'search']),
            'tab' => $tab,
            'sort' => [
                'field' => $sortField,
                'direction' => $sortDirection,
            ],
        ]);
    }

    /**
     * Show the form for creating a new work request.
     */
    public function create()
    {
        // Check permission
        $this->authorize('create', WorkRequest::class);

        $departments = Department::where('status', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        // Get potential assignees (users)
        $users = User::where('status', true)
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get(['id', 'first_name', 'last_name', 'department_id', 'position']);

        // Get available workflows for request
        $user = request()->user();
        $workflows = ApprovalWorkflow::where('is_active', true)
            ->where(function ($query) use ($user) {
                $query->whereNull('department_id') // Genel workflows
                      ->orWhere('department_id', $user->department_id); // Kullanıcının departmanına ait
            })
            ->orderBy('name')
            ->get(['id', 'name', 'description']);

        // Get category options for dropdown
        $categories = Category::where('is_active', true)
            ->where('type', 'work_request')
            ->with('children')
            ->orderBy('name')
            ->get();

        // Get priority options for dropdown
        $priorities = [
            'low' => 'Düşük',
            'medium' => 'Orta',
            'high' => 'Yüksek',
            'critical' => 'Kritik',
        ];

        return Inertia::render('WorkRequests/Create', [
            'departments' => $departments,
            'users' => $users,
            'workflows' => $workflows,
            'categories' => $categories,
            'priorities' => $priorities,
        ]);
    }

    /**
     * Store a newly created work request in storage.
     */
    public function store(Request $request)
    {
        // Check permission
        $this->authorize('create', WorkRequest::class);

        // Validate request
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'assignee_id' => 'nullable|exists:users,id',
            'priority' => 'required|in:low,medium,high,critical',
            'category_id' => 'required|integer',
            'department_id' => 'required|exists:departments,id',
            'due_date' => 'nullable|date|after:today',
            'workflow_id' => 'nullable|exists:approval_workflows,id',
        ]);

        // Create the work request
        $workRequest = WorkRequest::create([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'requester_id' => $request->user()->id,
            'assignee_id' => $validated['assignee_id'],
            'status' => 'pending',
            'priority' => $validated['priority'],
            'due_date' => $validated['due_date'],
            'category_id' => $validated['category_id'],
            'department_id' => $validated['department_id'],
            'workflow_id' => $validated['workflow_id'],
        ]);

        // Initialize approval workflow if needed
        if ($workRequest->workflow_id) {
            // This would be handled by an event listener or service class in a real app
            // For this example, we'll just log it
            // Workflow::initializeFor($workRequest);
        }

        return redirect()->route('work-requests.index')
            ->with('success', 'İş talebi başarıyla oluşturuldu.');
    }

    /**
     * Display the specified work request.
     */
    public function show(WorkRequest $workRequest)
    {
        // Check permission to view
        $this->authorize('view', $workRequest);

        // Load relationships
        $workRequest->load([
            'requester',
            'assignee',
            'department',
            'workflow',
            'approvalRequests' => function ($query) {
                $query->with(['approver', 'actions' => function ($q) {
                    $q->with('user')->orderBy('created_at', 'desc');
                }])
                ->orderBy('created_at', 'asc');
            }
        ]);

        // Check if user can approve this request
        $user = request()->user();
        $canApprove = false;
        $canReject = false;
        $canComplete = false;

        // User can approve if they are an approver for a pending approval request
        $pendingApproval = $workRequest->approvalRequests()
            ->where('status', 'pending')
            ->where('approver_id', $user->id)
            ->exists();

        if ($pendingApproval) {
            $canApprove = true;
            $canReject = true;
        }

        // User can complete if they are the assignee and status is in progress
        if ($workRequest->assignee_id === $user->id && $workRequest->status === 'in_progress') {
            $canComplete = true;
        }

        // Admin or department manager can approve regardless
        if ($user->is_admin ||
            ($workRequest->department && $workRequest->department->manager_id === $user->id)) {
            $canApprove = true;
            $canReject = true;
        }

        return Inertia::render('WorkRequests/Show', [
            'workRequest' => $workRequest,
            'canApprove' => $canApprove,
            'canReject' => $canReject,
            'canComplete' => $canComplete,
        ]);
    }

    /**
     * Show the form for editing the specified work request.
     */
    public function edit(WorkRequest $workRequest)
    {
        // Check permission
        $this->authorize('update', $workRequest);

        $departments = Department::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        // Get potential assignees (users)
        $users = User::where('status', 1)
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get(['id', 'first_name', 'last_name', 'department_id', 'position']);

        // Get available workflows for request
        $user = request()->user();
        $workflows = ApprovalWorkflow::where('is_active', true)
            ->where(function ($query) use ($user) {
                $query->whereNull('department_id') // Genel workflows
                      ->orWhere('department_id', $user->department_id); // Kullanıcının departmanına ait
            })
            ->orderBy('name')
            ->get(['id', 'name', 'description']);

        // Get category options for dropdown
        $categories = Category::where('is_active', true)
            ->where('type', 'work_request')
            ->with('children')
            ->orderBy('name')
            ->get();

        // Get priority options for dropdown
        $priorities = [
            'low' => 'Düşük',
            'medium' => 'Orta',
            'high' => 'Yüksek',
            'critical' => 'Kritik',
        ];

        return Inertia::render('WorkRequests/Edit', [
            'workRequest' => $workRequest,
            'departments' => $departments,
            'users' => $users,
            'workflows' => $workflows,
            'categories' => $categories,
            'priorities' => $priorities,
        ]);
    }

    /**
     * Update the specified work request in storage.
     */
    public function update(Request $request, WorkRequest $workRequest)
    {
        // Check permission
        $this->authorize('update', $workRequest);

        // Validate request
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'assignee_id' => 'nullable|exists:users,id',
            'status' => 'required|in:pending,in_progress,completed,cancelled',
            'priority' => 'required|in:low,medium,high,critical',
            'category' => 'required|string|max:100',
            'department_id' => 'required|exists:departments,id',
            'due_date' => 'nullable|date',
        ]);

        // Update the work request
        $workRequest->update($validated);

        return redirect()->route('work-requests.show', $workRequest)
            ->with('success', 'İş talebi başarıyla güncellendi.');
    }

    /**
     * Remove the specified work request from storage.
     */
    public function destroy(WorkRequest $workRequest)
    {
        // Check permission
        $this->authorize('delete', $workRequest);

        // Delete the work request (soft delete)
        $workRequest->delete();

        return redirect()->route('work-requests.index')
            ->with('success', 'İş talebi başarıyla silindi.');
    }

    /**
     * Approve a work request
     */
    public function approve(Request $request, WorkRequest $workRequest)
    {
        $user = $request->user();

        // Validate request
        $validated = $request->validate([
            'comments' => 'nullable|string',
        ]);

        // Check permission through policy
        $this->authorize('approve', $workRequest);

        // Approve the work request
        $workRequest->approve($user->id, $validated['comments'] ?? null);

        return redirect()->route('work-requests.show', $workRequest)
            ->with('success', 'İş talebi başarıyla onaylandı.');
    }

    /**
     * Reject a work request
     */
    public function reject(Request $request, WorkRequest $workRequest)
    {
        $user = $request->user();

        // Validate request
        $validated = $request->validate([
            'rejection_reason' => 'required|string',
        ]);

        // Check permission through policy
        $this->authorize('reject', $workRequest);

        // Reject the work request
        $workRequest->reject($user->id, $validated['rejection_reason']);

        return redirect()->route('work-requests.show', $workRequest)
            ->with('success', 'İş talebi reddedildi.');
    }

    /**
     * Complete a work request
     */
    public function complete(Request $request, WorkRequest $workRequest)
    {
        // Check permission through policy
        $this->authorize('complete', $workRequest);

        // Complete the work request
        $workRequest->complete();

        return redirect()->route('work-requests.show', $workRequest)
            ->with('success', 'İş talebi tamamlandı olarak işaretlendi.');
    }

    /**
     * Start progress on a work request
     */
    public function startProgress(WorkRequest $workRequest)
    {
        // Check permission through policy
        $this->authorize('update', $workRequest);

        // Update status to in progress
        $workRequest->update(['status' => 'in_progress']);

        return redirect()->route('work-requests.show', $workRequest)
            ->with('success', 'İş talebi işleme alındı.');
    }

    /**
     * Cancel a work request
     */
    public function cancel(WorkRequest $workRequest)
    {
        // Check permission through policy
        $this->authorize('update', $workRequest);

        // Update status to cancelled
        $workRequest->update(['status' => 'cancelled']);

        return redirect()->route('work-requests.show', $workRequest)
            ->with('success', 'İş talebi iptal edildi.');
    }
}
