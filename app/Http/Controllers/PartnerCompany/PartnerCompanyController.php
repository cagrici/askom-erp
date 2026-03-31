<?php

namespace App\Http\Controllers\PartnerCompany;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class PartnerCompanyController extends Controller
{
    public function index()
    {
        // Partner company listing logic
    }

    public function create()
    {
        // Show create form
    }

    public function store(Request $request)
    {
        // Partner company creation logic
    }

    public function show($id)
    {
        // Show partner company
    }

    public function edit($id)
    {
        // Show edit form
    }

    public function update(Request $request, $id)
    {
        // Partner company update logic
    }

    public function destroy($id)
    {
        // Partner company deletion logic
    }

    public function publicIndex()
    {
        // Public employee discounts listing
    }

    public function recordUsage(Request $request, $partnerCompany)
    {
        // Record usage of discount
    }
}
