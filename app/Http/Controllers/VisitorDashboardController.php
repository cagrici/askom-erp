<?php

namespace App\Http\Controllers;

use App\Models\Visitor;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\VisitorVisit;
use App\Models\VisitorAppointment;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class VisitorDashboardController extends Controller
{
    /**
     * Display the visitor management dashboard.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        $today = Carbon::today()->toDateString();
        
        // Active visits (today's visits with active status)
        $todayVisits = VisitorVisit::with(['visitor', 'hostEmployee'])
            ->whereDate('check_in_time', $today)
            ->orderBy('check_in_time', 'desc')
            ->limit(10)
            ->get();
        
        // Expected visitors (today's appointments that are scheduled or confirmed)
        $expectedVisitors = VisitorAppointment::with(['visitor', 'employee'])
            ->whereDate('appointment_date', $today)
            ->whereIn('status', ['scheduled', 'confirmed'])
            ->orderBy('appointment_time', 'asc')
            ->get();
        
        // Recent visitors
        $recentVisitors = Visitor::withCount(['visits', 'appointments'])
            ->orderBy('created_at', 'desc')
            ->limit(8)
            ->get();
        
        // Visit statistics
        $visitsStats = [
            'total' => VisitorVisit::count(),
            'active' => VisitorVisit::where('status', 'active')->count(),
            'completed' => VisitorVisit::where('status', 'completed')->count(),
            'canceled' => VisitorVisit::where('status', 'canceled')->count(),
        ];
        
        // Appointment statistics
        $appointmentsStats = [
            'total' => VisitorAppointment::count(),
            'scheduled' => VisitorAppointment::where('status', 'scheduled')->count(),
            'confirmed' => VisitorAppointment::where('status', 'confirmed')->count(),
            'completed' => VisitorAppointment::where('status', 'completed')->count(),
            'canceled' => VisitorAppointment::where('status', 'canceled')->count(),
        ];
        
        return Inertia::render('Visitors/Dashboard', [
            'todayVisits' => $todayVisits,
            'expectedVisitors' => $expectedVisitors,
            'recentVisitors' => $recentVisitors,
            'visitsStats' => $visitsStats,
            'appointmentsStats' => $appointmentsStats,
        ]);
    }
}
