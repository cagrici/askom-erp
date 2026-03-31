<?php

namespace App\Http\Controllers;

use App\Models\Visitor;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Validator;

class VisitorController extends Controller
{
    /**
     * Display a listing of the visitors.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        $visitors = Visitor::orderBy('created_at', 'desc')->paginate(10);
        
        return Inertia::render('Visitors/Index', [
            'visitors' => $visitors,
        ]);
    }

    /**
     * Show the form for creating a new visitor.
     *
     * @return \Inertia\Response
     */
    public function create()
    {
        return Inertia::render('Visitors/Create');
    }

    /**
     * Store a newly created visitor in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'company' => 'nullable|string|max:255',
            'id_number' => 'nullable|string|max:30',
            'notes' => 'nullable|string',
        ]);

        Visitor::create($validated);

        return redirect()->route('visitors.index')
            ->with('success', __('Visitor created successfully'));
    }

    /**
     * Display the specified visitor.
     *
     * @param  \App\Models\Visitor  $visitor
     * @return \Inertia\Response
     */
    public function show(Visitor $visitor)
    {
        $visitor->load(['appointments', 'visits']);
        
        return Inertia::render('Visitors/Show', [
            'visitor' => $visitor,
        ]);
    }

    /**
     * Show the form for editing the specified visitor.
     *
     * @param  \App\Models\Visitor  $visitor
     * @return \Inertia\Response
     */
    public function edit(Visitor $visitor)
    {
        return Inertia::render('Visitors/Edit', [
            'visitor' => $visitor,
        ]);
    }

    /**
     * Update the specified visitor in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Visitor  $visitor
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request, Visitor $visitor)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'company' => 'nullable|string|max:255',
            'id_number' => 'nullable|string|max:30',
            'notes' => 'nullable|string',
        ]);

        $visitor->update($validated);

        return redirect()->route('visitors.index')
            ->with('success', __('Visitor updated successfully'));
    }

    /**
     * Remove the specified visitor from storage.
     *
     * @param  \App\Models\Visitor  $visitor
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy(Visitor $visitor)
    {
        $visitor->delete();

        return redirect()->route('visitors.index')
            ->with('success', __('Visitor deleted successfully'));
    }
}