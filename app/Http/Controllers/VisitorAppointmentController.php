<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Visitor;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\VisitorAppointment;

class VisitorAppointmentController extends Controller
{
    /**
     * Display a listing of the appointments.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        $appointments = VisitorAppointment::with(['visitor', 'employee'])
            ->orderBy('appointment_date', 'desc')
            ->orderBy('appointment_time', 'desc')
            ->paginate(10);

        return Inertia::render('Appointments/Index', [
            'appointments' => $appointments,
        ]);
    }

    /**
     * Show the form for creating a new appointment.
     *
     * @return \Inertia\Response
     */
    public function create()
    {
        $visitors = Visitor::select('id', 'first_name', 'last_name', 'company')->get();
        $employees = User::select('id', 'name')->get();

        return Inertia::render('Appointments/Create', [
            'visitors' => $visitors,
            'employees' => $employees,
        ]);
    }

    /**
     * Store a newly created appointment in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'visitor_id' => 'required|exists:visitors,id',
            'host_id' => 'required|exists:users,id',
            'appointment_date' => 'required|date',
            'appointment_time' => 'required|date_format:H:i',
            'purpose' => 'required|string',
            'status' => 'required|string|in:scheduled,confirmed,canceled,completed',
            'notes' => 'nullable|string',
        ]);

        VisitorAppointment::create($validated);

        return redirect()->route('appointments.index')
            ->with('success', __('Appointment created successfully'));
    }

    /**
     * Display the specified appointment.
     *
     * @param  \App\Models\VisitorAppointment  $appointment
     * @return \Inertia\Response
     */
    public function show(VisitorAppointment $appointment)
    {
        $appointment->load(['visitor', 'employee']);

        return Inertia::render('Appointments/Show', [
            'appointment' => $appointment,
        ]);
    }

    /**
     * Show the form for editing the specified appointment.
     *
     * @param  \App\Models\VisitorAppointment  $appointment
     * @return \Inertia\Response
     */
    public function edit(VisitorAppointment $appointment)
    {
        $visitors = Visitor::select('id', 'first_name', 'last_name', 'company')->get();
        $employees = User::select('id', 'name')->get();

        return Inertia::render('Appointments/Edit', [
            'appointment' => $appointment,
            'visitors' => $visitors,
            'employees' => $employees,
        ]);
    }

    /**
     * Update the specified appointment in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\VisitorAppointment  $appointment
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request, VisitorAppointment $appointment)
    {
        $validated = $request->validate([
            'visitor_id' => 'required|exists:visitors,id',
            'host_id' => 'required|exists:users,id',
            'appointment_date' => 'required|date',
            'appointment_time' => 'required|date_format:H:i',
            'purpose' => 'required|string',
            'status' => 'required|string|in:scheduled,confirmed,canceled,completed',
            'notes' => 'nullable|string',
        ]);

        $appointment->update($validated);

        return redirect()->route('appointments.index')
            ->with('success', __('Appointment updated successfully'));
    }

    /**
     * Remove the specified appointment from storage.
     *
     * @param  \App\Models\VisitorAppointment  $appointment
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy(VisitorAppointment $appointment)
    {
        $appointment->delete();

        return redirect()->route('appointments.index')
            ->with('success', __('Appointment deleted successfully'));
    }
}
