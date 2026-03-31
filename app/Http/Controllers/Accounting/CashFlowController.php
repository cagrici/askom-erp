<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Services\LogoCashFlowService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CashFlowController extends Controller
{
    public function index(Request $request)
    {
        $period = $request->get('period', 'monthly');
        $forceRefresh = $request->boolean('refresh', false);

        if (!in_array($period, ['weekly', 'monthly'])) {
            $period = 'monthly';
        }

        $service = new LogoCashFlowService();
        $data = $service->getData($period, $forceRefresh);

        return Inertia::render('Accounting/CashFlow/Index', $data);
    }
}
