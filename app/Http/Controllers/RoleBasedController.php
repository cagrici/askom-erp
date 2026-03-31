<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class RoleBasedController extends Controller
{
    /**
     * Satıcı dashboard
     */
    public function satici()
    {
        $user = auth()->user();

        // Satıcıya özel veriler
        $data = [
            'title' => 'Satıcı Dashboard',
            'welcomeMessage' => 'Hoş geldiniz, ' . $user->name,
            'stats' => [
                'total_sales' => 0, // Bu verileri gerçek verilerle değiştirin
                'monthly_target' => 0,
                'pending_orders' => 0,
                'active_customers' => 0,
            ],
            'recentOrders' => [], // Son siparişler
            'topProducts' => [], // En çok satan ürünler
        ];

        return Inertia::render('RoleBased/Satici', $data);
    }

    /**
     * Sales Manager dashboard
     */
    public function salesManager()
    {
        $user = auth()->user();

        $data = [
            'title' => 'Sales Manager Dashboard',
            'welcomeMessage' => 'Merhaba, ' . $user->name,
            'stats' => [
                'team_performance' => 0,
                'total_revenue' => 0,
                'monthly_target' => 0,
                'active_deals' => 0,
            ],
            'teamMembers' => [], // Takım üyeleri
            'salesReports' => [], // Satış raporları
        ];

        return Inertia::render('RoleBased/SalesManager', $data);
    }

    /**
     * Sales Representative dashboard
     */
    public function salesRepresentative()
    {
        $user = auth()->user();

        $data = [
            'title' => 'Sales Representative Dashboard',
            'welcomeMessage' => 'Merhaba, ' . $user->name,
            'stats' => [
                'personal_sales' => 0,
                'monthly_target' => 0,
                'pending_followups' => 0,
                'new_leads' => 0,
            ],
            'myCustomers' => [], // Müşteriler
            'upcomingTasks' => [], // Yaklaşan görevler
        ];

        return Inertia::render('RoleBased/SalesRepresentative', $data);
    }

    /**
     * Dealer dashboard
     */
    public function dealer()
    {
        $user = auth()->user();

        $data = [
            'title' => 'Dealer Dashboard',
            'welcomeMessage' => 'Merhaba, ' . $user->name,
            'stats' => [
                'available_products' => 0,
                'pending_orders' => 0,
                'completed_orders' => 0,
                'account_balance' => 0,
            ],
            'availableProducts' => [], // Mevcut ürünler
            'orderHistory' => [], // Sipariş geçmişi
        ];

        return Inertia::render('RoleBased/Dealer', $data);
    }

    /**
     * Muhasebe dashboard
     */
    public function muhasebe()
    {
        $user = auth()->user();

        $data = [
            'title' => 'Muhasebe Dashboard',
            'welcomeMessage' => 'Hoş geldiniz, ' . $user->name,
            'stats' => [
                'pending_invoices' => 0,
                'monthly_revenue' => 0,
                'outstanding_payments' => 0,
                'expense_total' => 0,
            ],
            'recentTransactions' => [], // Son işlemler
            'pendingApprovals' => [], // Onay bekleyen işlemler
        ];

        return Inertia::render('RoleBased/Muhasebe', $data);
    }

    /**
     * İnsan Kaynakları dashboard
     */
    public function insanKaynaklari()
    {
        $user = auth()->user();

        $data = [
            'title' => 'İnsan Kaynakları Dashboard',
            'welcomeMessage' => 'Hoş geldiniz, ' . $user->name,
            'stats' => [
                'total_employees' => 0,
                'pending_requests' => 0,
                'upcoming_birthdays' => 0,
                'leave_requests' => 0,
            ],
            'employeeRequests' => [], // Çalışan talepleri
            'upcomingEvents' => [], // Yaklaşan etkinlikler
        ];

        return Inertia::render('RoleBased/InsanKaynaklari', $data);
    }
}
