<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ApprovalWorkflow;
use App\Models\Department;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Validation\Rule;

class ApprovalWorkflowController extends Controller
{
    /**
     * Display a listing of approval workflows
     */
    public function index(Request $request)
    {
        $query = ApprovalWorkflow::with(['department']);

        // Filter by department if provided
        if ($request->has('department_id') && $request->department_id) {
            $query->where('department_id', $request->department_id);
        }

        // Filter by status if provided
        if ($request->has('is_active') && $request->is_active !== '') {
            $query->where('is_active', $request->is_active);
        }

        // Search by name
        if ($request->has('search') && $request->search) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $workflows = $query->orderBy('name')->paginate(15);

        $departments = Department::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Admin/ApprovalWorkflow/Index', [
            'workflows' => $workflows,
            'departments' => $departments,
            'filters' => $request->only(['department_id', 'is_active', 'search'])
        ]);
    }

    /**
     * Show the form for creating a new workflow
     */
    public function create()
    {
        $departments = Department::orderBy('name')->get(['id', 'name']);
        $users = User::with('department')->orderBy('first_name')->get();
        $roles = Role::where('is_active', true)->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Admin/ApprovalWorkflow/Create', [
            'departments' => $departments,
            'users' => $users,
            'roles' => $roles
        ]);
    }

    /**
     * Store a newly created workflow
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:approval_workflows,name',
            'description' => 'nullable|string|max:1000',
            'department_id' => 'nullable|exists:departments,id',
            'is_active' => 'boolean',
            'steps' => 'required|array|min:1',
            'steps.*.name' => 'required|string|max:255',
            'steps.*.type' => 'required|in:user,role,department,manager',
            'steps.*.approver_id' => 'nullable|exists:users,id',
            'steps.*.role_id' => 'nullable|exists:roles,id',
            'steps.*.department_id' => 'nullable|exists:departments,id',
            'steps.*.conditions' => 'nullable|array',
            'steps.*.conditions.*.field' => 'nullable|string',
            'steps.*.conditions.*.operator' => 'nullable|string',
            'steps.*.conditions.*.value' => 'nullable',
            'steps.*.order' => 'required|integer|min:1',
            'steps.*.required' => 'boolean'
        ]);

        $validated['created_by'] = Auth::id();

        // Sort steps by order
        $validated['steps'] = collect($validated['steps'])->sortBy('order')->values()->toArray();

        $workflow = ApprovalWorkflow::create($validated);

        return redirect()->route('admin.approval-workflows.index')
            ->with('success', 'Onay iş akışı başarıyla oluşturuldu.');
    }

    /**
     * Display the specified workflow
     */
    public function show(ApprovalWorkflow $approvalWorkflow)
    {
        $workflow = $approvalWorkflow->load(['department', 'workRequests' => function($query) {
            $query->with(['requester', 'assignee'])->latest()->limit(10);
        }]);

        return Inertia::render('Admin/ApprovalWorkflow/Show', [
            'workflow' => $workflow
        ]);
    }

    /**
     * Show the form for editing the specified workflow
     */
    public function edit(ApprovalWorkflow $approvalWorkflow)
    {
        $departments = Department::orderBy('name')->get(['id', 'name']);
        $users = User::with('department')->orderBy('first_name')->get();
        $roles = Role::where('is_active', true)->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Admin/ApprovalWorkflow/Edit', [
            'workflow' => $approvalWorkflow,
            'departments' => $departments,
            'users' => $users,
            'roles' => $roles
        ]);
    }

    /**
     * Update the specified workflow
     */
    public function update(Request $request, ApprovalWorkflow $approvalWorkflow)
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('approval_workflows')->ignore($approvalWorkflow->id)
            ],
            'description' => 'nullable|string|max:1000',
            'department_id' => 'nullable|exists:departments,id',
            'is_active' => 'boolean',
            'steps' => 'required|array|min:1',
            'steps.*.name' => 'required|string|max:255',
            'steps.*.type' => 'required|in:user,role,department,manager',
            'steps.*.approver_id' => 'nullable|exists:users,id',
            'steps.*.role_id' => 'nullable|exists:roles,id',
            'steps.*.department_id' => 'nullable|exists:departments,id',
            'steps.*.conditions' => 'nullable|array',
            'steps.*.conditions.*.field' => 'nullable|string',
            'steps.*.conditions.*.operator' => 'nullable|string',
            'steps.*.conditions.*.value' => 'nullable',
            'steps.*.order' => 'required|integer|min:1',
            'steps.*.required' => 'boolean'
        ]);

        // Sort steps by order
        $validated['steps'] = collect($validated['steps'])->sortBy('order')->values()->toArray();

        $approvalWorkflow->update($validated);

        return redirect()->route('admin.approval-workflows.index')
            ->with('success', 'Onay iş akışı başarıyla güncellendi.');
    }

    /**
     * Remove the specified workflow from storage
     */
    public function destroy(ApprovalWorkflow $approvalWorkflow)
    {
        // Check if workflow is being used
        if ($approvalWorkflow->workRequests()->exists()) {
            return back()->with('error', 'Bu iş akışı kullanımda olduğu için silinemez.');
        }

        $approvalWorkflow->delete();

        return redirect()->route('admin.approval-workflows.index')
            ->with('success', 'Onay iş akışı başarıyla silindi.');
    }

    /**
     * Toggle workflow active status
     */
    public function toggleStatus(ApprovalWorkflow $approvalWorkflow)
    {
        $approvalWorkflow->update([
            'is_active' => !$approvalWorkflow->is_active
        ]);

        $status = $approvalWorkflow->is_active ? 'aktif' : 'pasif';

        return back()->with('success', "İş akışı {$status} duruma getirildi.");
    }

    /**
     * Duplicate an existing workflow
     */
    public function duplicate(ApprovalWorkflow $approvalWorkflow)
    {
        $newWorkflow = $approvalWorkflow->replicate();
        $newWorkflow->name = $approvalWorkflow->name . ' (Kopya)';
        $newWorkflow->is_active = false;
        $newWorkflow->save();

        return redirect()->route('admin.approval-workflows.edit', $newWorkflow)
            ->with('success', 'İş akışı kopyalandı. Düzenleyip aktif hale getirebilirsiniz.');
    }
}
