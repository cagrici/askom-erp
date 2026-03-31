<?php

namespace App\Http\Controllers\SupportTicket;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use App\Models\User;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Validation\Rule;

class SupportTicketController extends Controller
{
    /**
     * Display a listing of the tickets.
     */
    public function index()
    {
        $tickets = SupportTicket::with(['creator:id,name', 'client:id,name'])
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return Inertia::render('SupportTickets/ListView/index', [
            'tickets' => $tickets
        ]);
    }

    /**
     * Show the form for creating a new ticket.
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

        return Inertia::render('SupportTickets/Create/index', [
            'users' => $users,
            'clients' => $clients
        ]);
    }

    /**
     * Store a newly created ticket in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => ['required', Rule::in(['New', 'Open', 'In Progress', 'Resolved', 'Closed'])],
            'priority' => ['required', Rule::in(['Low', 'Medium', 'High', 'Critical'])],
            'client_id' => 'nullable|exists:companies,id',
            'project' => 'nullable|string|max:255',
            'due_date' => 'nullable|date',
            'assigned_users' => 'nullable|array',
            'assigned_users.*' => 'exists:users,id',
        ]);

        // Generate ticket number
        $lastTicket = SupportTicket::latest()->first();
        $ticketNumber = 'VLZ' . ($lastTicket ? (int)substr($lastTicket->ticket_number, 3) + 1 : 1);

        $ticket = SupportTicket::create([
            'ticket_number' => $ticketNumber,
            'title' => $validated['title'],
            'description' => $validated['description'],
            'status' => $validated['status'],
            'priority' => $validated['priority'],
            'client_id' => $validated['client_id'],
            'project' => $validated['project'],
            'created_by' => Auth::id(),
            'due_date' => $validated['due_date'],
            'last_activity_at' => now(),
        ]);

        // Assign users to the ticket
        if (!empty($validated['assigned_users'])) {
            $ticket->assignedUsers()->attach($validated['assigned_users']);
        }

        return redirect()->route('support-tickets.show', $ticket)
            ->with('success', 'Support ticket created successfully.');
    }

    /**
     * Display the specified ticket.
     */
    public function show(SupportTicket $ticket)
    {
        $ticket->load([
            'creator:id,name,email,avatar',
            'assignedUsers:id,name,email,avatar',
            'client:id,name'
        ]);

        return Inertia::render('SupportTickets/TicketsDetails/index', [
            'ticket' => $ticket
        ]);
    }

    /**
     * Show the form for editing the specified ticket.
     */
    public function edit(SupportTicket $ticket)
    {
        $ticket->load(['assignedUsers:id,name,email']);

        $users = User::where('is_active', true)
            ->select('id', 'name', 'email', 'avatar')
            ->orderBy('name')
            ->get();

        $clients = Company::select('id', 'name')
            ->orderBy('name')
            ->get();

        return Inertia::render('SupportTickets/Edit/index', [
            'ticket' => $ticket,
            'users' => $users,
            'clients' => $clients
        ]);
    }

    /**
     * Update the specified ticket in storage.
     */
    public function update(Request $request, SupportTicket $ticket)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => ['required', Rule::in(['New', 'Open', 'In Progress', 'Resolved', 'Closed'])],
            'priority' => ['required', Rule::in(['Low', 'Medium', 'High', 'Critical'])],
            'client_id' => 'nullable|exists:companies,id',
            'project' => 'nullable|string|max:255',
            'due_date' => 'nullable|date',
            'assigned_users' => 'nullable|array',
            'assigned_users.*' => 'exists:users,id',
        ]);

        $ticket->update([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'status' => $validated['status'],
            'priority' => $validated['priority'],
            'client_id' => $validated['client_id'],
            'project' => $validated['project'],
            'due_date' => $validated['due_date'],
            'last_activity_at' => now(),
        ]);

        // Update assigned users
        if (isset($validated['assigned_users'])) {
            $ticket->assignedUsers()->sync($validated['assigned_users']);
        }

        return redirect()->route('support-tickets.show', $ticket)
            ->with('success', 'Support ticket updated successfully.');
    }

    /**
     * Remove the specified ticket from storage.
     */
    public function destroy(SupportTicket $ticket)
    {
        $ticket->delete();

        return redirect()->route('support-tickets.index')
            ->with('success', 'Support ticket deleted successfully.');
    }

    /**
     * Assign users to a ticket.
     */
    public function assignUsers(Request $request, SupportTicket $ticket)
    {
        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        $ticket->assignedUsers()->sync($validated['user_ids']);
        $ticket->update(['last_activity_at' => now()]);

        return redirect()->back()->with('success', 'Users assigned successfully.');
    }
}
