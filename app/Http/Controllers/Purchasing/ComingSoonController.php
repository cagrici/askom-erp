<?php

namespace App\Http\Controllers\Purchasing;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class ComingSoonController extends Controller
{
    /**
     * Display the contracts coming soon page.
     */
    public function contracts(): Response
    {
        return Inertia::render('Purchasing/ComingSoon', [
            'title' => __('Contracts'),
            'module' => 'contracts',
            'description' => __('Contract management system is under development.')
        ]);
    }

    /**
     * Display the invoices coming soon page.
     */
    public function invoices(): Response
    {
        return Inertia::render('Purchasing/ComingSoon', [
            'title' => __('Invoices'),
            'module' => 'invoices',
            'description' => __('Invoice management system is under development.')
        ]);
    }

    /**
     * Display the performance coming soon page.
     */
    public function performance(): Response
    {
        return Inertia::render('Purchasing/ComingSoon', [
            'title' => __('Performance'),
            'module' => 'performance',
            'description' => __('Performance tracking system is under development.')
        ]);
    }
}
