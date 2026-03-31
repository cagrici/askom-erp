<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Services\Dashboard\LogoDashboardService;
use App\Services\Dashboard\RoleDashboardService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RoleDashboardController extends Controller
{
    protected RoleDashboardService $dashboardService;

    public function __construct(RoleDashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    /**
     * Rol bazli dashboard yonlendirmesi
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Rol kontrolu ve uygun dashboard'a yonlendirme
        if ($user->hasRole(['company_manager', 'Sirket Yonetimi'])) {
            return $this->companyManager();
        }

        if ($user->hasRole(['sales_manager', 'Satis Yoneticisi'])) {
            return $this->salesManager();
        }

        if ($user->hasRole(['warehouse_manager', 'Depo Yoneticisi'])) {
            return $this->warehouseManager();
        }

        // Varsayilan olarak ana dashboard'a yonlendir
        return redirect()->route('dashboard');
    }

    /**
     * Sirket Yonetimi Dashboard — Logo ERP odakli kokpit paneli
     */
    public function companyManager()
    {
        $logoData = app(LogoDashboardService::class)->getData();

        return Inertia::render('Dashboard/Roles/CompanyManagerDashboard', [
            'logo' => $logoData,
        ]);
    }

    /**
     * Sirket Yonetimi Dashboard — veri yenileme (cache temizle)
     */
    public function refreshCompanyDashboard()
    {
        $logoData = app(LogoDashboardService::class)->getData(forceRefresh: true);

        return response()->json([
            'success' => true,
            'generated_at' => $logoData['generated_at'] ?? now()->toDateTimeString(),
        ]);
    }

    /**
     * Satis Yoneticisi Dashboard
     */
    public function salesManager()
    {
        $data = $this->dashboardService->getSalesManagerDashboardData();

        return Inertia::render('Dashboard/Roles/SalesManagerDashboard', $data);
    }

    /**
     * Depo Yoneticisi Dashboard
     */
    public function warehouseManager()
    {
        $data = $this->dashboardService->getWarehouseManagerDashboardData();

        return Inertia::render('Dashboard/Roles/WarehouseManagerDashboard', $data);
    }
}
