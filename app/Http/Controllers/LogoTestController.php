<?php

namespace App\Http\Controllers;

use App\Services\LogoService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LogoTestController extends Controller
{
    protected LogoService $logoService;

    public function __construct(LogoService $logoService)
    {
        $this->logoService = $logoService;
    }

    /**
     * Show Logo connection test page
     */
    public function index()
    {
        return Inertia::render('Logo/Test', [
            'title' => 'Logo Database Connection Test'
        ]);
    }

    /**
     * Test Logo database connection
     */
    public function testConnection()
    {
        $result = $this->logoService->testConnection();

        return response()->json($result);
    }

    /**
     * Get all tables from Logo database
     */
    public function getTables()
    {
        $result = $this->logoService->getTables();

        return response()->json($result);
    }

    /**
     * Get table columns
     */
    public function getTableColumns(Request $request)
    {
        $validated = $request->validate([
            'table_name' => 'required|string',
            'schema' => 'nullable|string',
        ]);

        $result = $this->logoService->getTableColumns(
            $validated['table_name'],
            $validated['schema'] ?? 'dbo'
        );

        return response()->json($result);
    }

    /**
     * Get customers from Logo
     */
    public function getCustomers(Request $request)
    {
        $firmNo = $request->get('firm_no', 1);
        $limit = $request->get('limit', 100);

        $result = $this->logoService->getCustomers($firmNo, $limit);

        return response()->json($result);
    }

    /**
     * Get products from Logo
     */
    public function getProducts(Request $request)
    {
        $firmNo = $request->get('firm_no', 1);
        $limit = $request->get('limit', 100);

        $result = $this->logoService->getProducts($firmNo, $limit);

        return response()->json($result);
    }

    /**
     * Get invoices from Logo
     */
    public function getInvoices(Request $request)
    {
        $firmNo = $request->get('firm_no', 1);
        $dateFrom = $request->get('date_from');
        $dateTo = $request->get('date_to');
        $limit = $request->get('limit', 100);

        $result = $this->logoService->getInvoices($firmNo, $dateFrom, $dateTo, $limit);

        return response()->json($result);
    }

    /**
     * Execute custom query
     */
    public function query(Request $request)
    {
        $validated = $request->validate([
            'sql' => 'required|string',
            'bindings' => 'nullable|array',
        ]);

        $result = $this->logoService->query(
            $validated['sql'],
            $validated['bindings'] ?? []
        );

        return response()->json($result);
    }

    /**
     * Get data from custom table
     */
    public function getFromTable(Request $request)
    {
        $validated = $request->validate([
            'table_name' => 'required|string',
            'columns' => 'nullable|array',
            'where' => 'nullable|array',
            'limit' => 'nullable|integer|min:1|max:1000',
        ]);

        $result = $this->logoService->getFromTable(
            $validated['table_name'],
            $validated['columns'] ?? ['*'],
            $validated['where'] ?? null,
            $validated['limit'] ?? 100
        );

        return response()->json($result);
    }

    /**
     * Get table record count
     */
    public function getTableCount(Request $request)
    {
        $validated = $request->validate([
            'table_name' => 'required|string',
            'where' => 'nullable|array',
        ]);

        $result = $this->logoService->getTableCount(
            $validated['table_name'],
            $validated['where'] ?? null
        );

        return response()->json($result);
    }
}
