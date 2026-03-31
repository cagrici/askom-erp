<?php

namespace App\Http\Controllers\Quality;

use App\Http\Controllers\Controller;
use App\Models\QualityRequest;
use App\Models\User;
use App\Models\Company;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Validation\Rule;

class QualityRequestController extends Controller
{
    /**
     * Display a listing of the requests.
     */
    public function index()
    {
        $requests = QualityRequest::with(['creator:id,name', 'client:id,name'])
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return Inertia::render('Quality/ListView/index', [
            'requests' => $requests
        ]);
    }

    /**
     * Show the form for creating a new request.
     */
    public function create()
    {
        $users = User::where('is_active', true)
            ->select('id', 'name', 'email', 'avatar')
            ->orderBy('name')
            ->get();

        $clients = Company::select('id', 'name')
            ->orderBy('name')
            ->get();

        $products = Product::select('id', 'name')
            ->orderBy('name')
            ->get();

        return Inertia::render('Quality/Create/index', [
            'users' => $users,
            'clients' => $clients,
            'products' => $products
        ]);
    }

    /**
     * Store a newly created request in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => ['required', Rule::in(['request', 'complaint'])],
            'status' => ['required', Rule::in(['New', 'Open', 'In Progress', 'Resolved', 'Closed'])],
            'priority' => ['required', Rule::in(['Low', 'Medium', 'High', 'Critical'])],
            'client_id' => 'nullable|exists:companies,id',
            'product_id' => 'nullable|exists:products,id',
            'due_date' => 'nullable|date',
            'assigned_users' => 'nullable|array',
            'assigned_users.*' => 'exists:users,id',
        ]);

        // Generate request number
        $lastRequest = QualityRequest::latest()->first();
        $requestNumber = 'QR' . ($lastRequest ? (int)substr($lastRequest->request_number, 2) + 1 : 1);

        $qualityRequest = QualityRequest::create([
            'request_number' => $requestNumber,
            'title' => $validated['title'],
            'description' => $validated['description'],
            'type' => $validated['type'],
            'status' => $validated['status'],
            'priority' => $validated['priority'],
            'client_id' => $validated['client_id'],
            'product_id' => $validated['product_id'],
            'created_by' => Auth::id(),
            'due_date' => $validated['due_date'],
            'last_activity_at' => now(),
        ]);

        // Assign users to the request
        if (!empty($validated['assigned_users'])) {
            $qualityRequest->assignedUsers()->attach($validated['assigned_users']);
        }

        return redirect()->route('quality-requests.show', $qualityRequest)
            ->with('success', 'Quality request created successfully.');
    }

    /**
     * Display the specified request.
     */
    public function show(QualityRequest $qualityRequest)
    {
        $qualityRequest->load([
            'creator:id,name,email,avatar',
            'assignedUsers:id,name,email,avatar',
            'client:id,name',
            'product:id,name'
        ]);

        return Inertia::render('Quality/DetailsView/index', [
            'request' => $qualityRequest
        ]);
    }

    /**
     * Show the form for editing the specified request.
     */
    public function edit(QualityRequest $qualityRequest)
    {
        $qualityRequest->load(['assignedUsers:id,name,email']);

        $users = User::where('is_active', true)
            ->select('id', 'name', 'email', 'avatar')
            ->orderBy('name')
            ->get();

        $clients = Company::select('id', 'name')
            ->orderBy('name')
            ->get();

        $products = Product::select('id', 'name')
            ->orderBy('name')
            ->get();

        return Inertia::render('Quality/Edit/index', [
            'request' => $qualityRequest,
            'users' => $users,
            'clients' => $clients,
            'products' => $products
        ]);
    }

    /**
     * Update the specified request in storage.
     */
    public function update(Request $request, QualityRequest $qualityRequest)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => ['required', Rule::in(['request', 'complaint'])],
            'status' => ['required', Rule::in(['New', 'Open', 'In Progress', 'Resolved', 'Closed'])],
            'priority' => ['required', Rule::in(['Low', 'Medium', 'High', 'Critical'])],
            'client_id' => 'nullable|exists:companies,id',
            'product_id' => 'nullable|exists:products,id',
            'due_date' => 'nullable|date',
            'assigned_users' => 'nullable|array',
            'assigned_users.*' => 'exists:users,id',
        ]);

        $qualityRequest->update([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'type' => $validated['type'],
            'status' => $validated['status'],
            'priority' => $validated['priority'],
            'client_id' => $validated['client_id'],
            'product_id' => $validated['product_id'],
            'due_date' => $validated['due_date'],
            'last_activity_at' => now(),
        ]);

        // Update assigned users
        if (isset($validated['assigned_users'])) {
            $qualityRequest->assignedUsers()->sync($validated['assigned_users']);
        }

        return redirect()->route('quality-requests.show', $qualityRequest)
            ->with('success', 'Quality request updated successfully.');
    }

    /**
     * Remove the specified request from storage.
     */
    public function destroy(QualityRequest $qualityRequest)
    {
        $qualityRequest->delete();

        return redirect()->route('quality-requests.index')
            ->with('success', 'Quality request deleted successfully.');
    }

    /**
     * Assign users to a request.
     */
    public function assignUsers(Request $request, QualityRequest $qualityRequest)
    {
        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        $qualityRequest->assignedUsers()->sync($validated['user_ids']);
        $qualityRequest->update(['last_activity_at' => now()]);

        return redirect()->back()->with('success', 'Users assigned successfully.');
    }
}
