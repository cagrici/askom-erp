<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\CalendarEvent;
use App\Models\Document;
use App\Models\User;
use App\Models\WorkRequest;
use App\Models\MessageGroup;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Display the dashboard.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        
        // Get upcoming calendar events
        $upcomingEvents = CalendarEvent::where('start_time', '>=', now())
            ->orderBy('start_time')
            ->take(5)
            ->get();
            
        // Get latest announcements
        $announcements = Announcement::with('category')
            ->where('is_active', true)
            ->orderBy('is_featured', 'desc')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();
            
        // Get pending work requests from chat system (message_groups) - only where user is participant
        $pendingRequests = MessageGroup::with(['creator', 'assignedUser'])
            ->whereIn('status', ['open', 'in_progress'])
            ->whereHas('participants', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->orderBy('priority', 'desc')
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get()
            ->map(function ($group) {
                return [
                    'id' => $group->id,
                    'title' => $group->name,
                    'status' => $group->status,
                    'priority' => $group->priority,
                    'due_date' => $group->due_date,
                    'requester' => [
                        'id' => $group->creator->id,
                        'first_name' => $group->creator->first_name,
                        'last_name' => $group->creator->last_name,
                    ],
                    'assignee' => $group->assignedUser ? [
                        'id' => $group->assignedUser->id,
                        'first_name' => $group->assignedUser->first_name,
                        'last_name' => $group->assignedUser->last_name,
                    ] : null,
                ];
            });
            
        // Get recent documents
        $recentDocuments = Document::with('user')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();
            
        // Get birthday people (today and next 7 days)
        $birthdayPeople = User::whereNotNull('birth_date')
            ->whereRaw('DAYOFYEAR(birth_date) BETWEEN DAYOFYEAR(CURDATE()) AND DAYOFYEAR(DATE_ADD(CURDATE(), INTERVAL 7 DAY))')
            ->get();
            
        return Inertia::render('Dashboard/UserDashboard', [
            'upcomingEvents' => $upcomingEvents,
            'announcements' => $announcements,
            'pendingRequests' => $pendingRequests,
            'recentDocuments' => $recentDocuments,
            'birthdayPeople' => $birthdayPeople,
            'userWidgets' => [],
            'recentActivity' => [],
        ]);
    }

    /**
     * Update user dashboard layout
     */
    public function updateLayout(Request $request)
    {
        // Implement dashboard layout customization logic
        // This would save user widget preferences

        return response()->json(['success' => true]);
    }
}
