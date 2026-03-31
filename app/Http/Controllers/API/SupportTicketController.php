<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SupportTicketController extends Controller
{
    /**
     * Get users assigned to a specific ticket.
     *
     * @param int $ticketId
     * @return JsonResponse
     */
    public function getAssignedUsers($ticketId): JsonResponse
    {
        try {
            // For testing purposes, let's return all active users
            // In a real application, you would fetch the ticket's assigned users
            $ticket = SupportTicket::find($ticketId);

            if (!$ticket) {
                // Until we have real ticket data, let's return all active users
                $users = User::where('is_active', true)
                    ->select('id', 'name', 'email', 'avatar')
                    ->limit(3)
                    ->get();
            } else {
                // Get users assigned to this specific ticket
                $users = $ticket->assignedUsers()
                    ->select('users.id', 'users.name', 'users.email', 'users.avatar')
                    ->get();
            }

            return response()->json($users);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to retrieve assigned users', 'message' => $e->getMessage()], 500);
        }
    }
}
