<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class DocumentationController extends Controller
{
    /**
     * Display the documentation index/home page.
     */
    public function index()
    {
        return Inertia::render('Documentation/Index');
    }

    /**
     * Display Sales Management documentation.
     */
    public function salesManagement()
    {
        return Inertia::render('Documentation/SalesManagement');
    }

    /**
     * Display CRM documentation.
     */
    public function crm()
    {
        return Inertia::render('Documentation/CRM');
    }

    /**
     * Display Stock Management documentation.
     */
    public function stockManagement()
    {
        return Inertia::render('Documentation/StockManagement');
    }

    /**
     * Display Warehouse Management documentation.
     */
    public function warehouseManagement()
    {
        return Inertia::render('Documentation/WarehouseManagement');
    }

    /**
     * Display Shipping/Logistics documentation.
     */
    public function shipping()
    {
        return Inertia::render('Documentation/Shipping');
    }

    /**
     * Display Product Management documentation.
     */
    public function productManagement()
    {
        return Inertia::render('Documentation/ProductManagement');
    }

    /**
     * Display Current Accounts documentation.
     */
    public function currentAccounts()
    {
        return Inertia::render('Documentation/CurrentAccounts');
    }

    /**
     * Display Purchasing documentation.
     */
    public function purchasing()
    {
        return Inertia::render('Documentation/Purchasing');
    }

    /**
     * Display Accounting documentation.
     */
    public function accounting()
    {
        return Inertia::render('Documentation/Accounting');
    }

    /**
     * Display Reports documentation.
     */
    public function reports()
    {
        return Inertia::render('Documentation/Reports');
    }

    /**
     * Display User Management documentation.
     */
    public function userManagement()
    {
        return Inertia::render('Documentation/UserManagement');
    }

    /**
     * Display Settings documentation.
     */
    public function settings()
    {
        return Inertia::render('Documentation/Settings');
    }

    /**
     * Display Getting Started guide.
     */
    public function gettingStarted()
    {
        return Inertia::render('Documentation/GettingStarted');
    }

    /**
     * Display FAQ page.
     */
    public function faq()
    {
        return Inertia::render('Documentation/FAQ');
    }
}
