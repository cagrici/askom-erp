<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Models\Location;

class JobRequestController extends Controller
{
    /**
     * Display the job requests chat page.
     */
    public function index()
    {
        $user = Auth::user();
        $locations = Location::select('id', 'name')->orderBy('name')->get();
        
        return Inertia::render('JobRequests/Index', [
            'canCreateGroups' => $user->can('create job groups'),
            'locations' => $locations
        ]);
    }
}