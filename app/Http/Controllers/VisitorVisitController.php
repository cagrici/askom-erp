<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Visitor;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\VisitorVisit;
use App\Models\VisitorAppointment;

class VisitorVisitController extends Controller
{
    /**
     * Display a listing of the visits.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        $visits = VisitorVisit::with(['visitor', 'hostEmployee'])
            ->orderBy('check_in_time', 'desc')
            ->paginate(10);
        
        return Inertia::render('Visits/Index', [
            'visits' => $visits,
        ]);
    }

    /**
     * Show the form for creating a new visit.
     *
     * @return \Inertia\Response
     */
    public function create()
    {
        $visitors = Visitor::select('id', 'first_name', 'last_name', 'company')->get();
        $appointments = VisitorAppointment::whereIn('status', ['scheduled', 'confirmed'])
            ->with('visitor')
            ->get();
        $employees = User::select('id', 'name')->get();
        
        return Inertia::render('Visits/Create', [
            'visitors' => $visitors,
            'appointments' => $appointments,
            'employees' => $employees,
        ]);
    }

    /**
     * Store a newly created visit in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'visitor_id' => 'required|exists:visitors,id',
            'check_in_time' => 'required|date',
            'check_out_time' => 'nullable|date|after:check_in_time',
            'host_id' => 'required|exists:users,id',
            'purpose' => 'required|string',
            'status' => 'required|string|in:active,completed,canceled',
            'notes' => 'nullable|string',
        ]);

        VisitorVisit::create($validated);

        // Artık appointment_id olmadığı için bu kısım kaldırıldı
        // Visitor_appointments tablosunda visit_id alanı olduğundan
        // randevu kaydı yapıldığında ziyareti ilişkilendirmek gerekebilir

        return redirect()->route('visits.index')
            ->with('success', __('Visit recorded successfully'));
    }

    /**
     * Display the specified visit.
     *
     * @param  \App\Models\VisitorVisit  $visit
     * @return \Inertia\Response
     */
    public function show(VisitorVisit $visit)
    {
        $visit->load(['visitor', 'appointment', 'hostEmployee']);
        
        return Inertia::render('Visits/Show', [
            'visit' => $visit,
        ]);
    }

    /**
     * Show the form for editing the specified visit.
     *
     * @param  \App\Models\VisitorVisit  $visit
     * @return \Inertia\Response
     */
    public function edit(VisitorVisit $visit)
    {
        $visitors = Visitor::select('id', 'first_name', 'last_name', 'company')->get();
        $appointments = VisitorAppointment::whereIn('status', ['scheduled', 'confirmed', 'completed'])
            ->with('visitor')
            ->get();
        $employees = User::select('id', 'name')->get();
        
        return Inertia::render('Visits/Edit', [
            'visit' => $visit,
            'visitors' => $visitors,
            'appointments' => $appointments,
            'employees' => $employees,
        ]);
    }

    /**
     * Update the specified visit in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\VisitorVisit  $visit
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request, VisitorVisit $visit)
    {
        $validated = $request->validate([
            'visitor_id' => 'required|exists:visitors,id',
            'check_in_time' => 'required|date',
            'check_out_time' => 'nullable|date|after:check_in_time',
            'host_id' => 'required|exists:users,id',
            'purpose' => 'required|string',
            'status' => 'required|string|in:active,completed,canceled',
            'notes' => 'nullable|string',
        ]);

        $visit->update($validated);

        return redirect()->route('visits.index')
            ->with('success', __('Visit updated successfully'));
    }

    /**
     * Remove the specified visit from storage.
     *
     * @param  \App\Models\VisitorVisit  $visit
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy(VisitorVisit $visit)
    {
        $visit->delete();

        return redirect()->route('visits.index')
            ->with('success', __('Visit deleted successfully'));
    }

    /**
     * Check out a visitor
     *
     * @param  \App\Models\VisitorVisit  $visit
     * @return \Illuminate\Http\RedirectResponse
     */
    public function checkout(VisitorVisit $visit)
    {
        $visit->check_out_time = now();
        $visit->status = 'completed';
        $visit->save();

        return redirect()->route('visits.index')
            ->with('success', __('Visitor checked out successfully'));
    }
}
