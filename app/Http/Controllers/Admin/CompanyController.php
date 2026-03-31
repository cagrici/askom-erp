<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\CompanyContact;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CompanyController extends Controller
{
    public function index(Request $request)
    {
        $query = Company::query()
            ->withCount(['locations', 'employees'])
            ->orderBy('name');

        if ($request->has('search') && $request->search) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', "%{$searchTerm}%")
                    ->orWhere('legal_name', 'like', "%{$searchTerm}%")
                    ->orWhere('tax_id', 'like', "%{$searchTerm}%")
                    ->orWhere('registration_number', 'like', "%{$searchTerm}%")
                    ->orWhere('email', 'like', "%{$searchTerm}%");
            });
        }

        if ($request->has('status') && $request->status !== '') {
            $query->where('status', $request->status);
        }

        if ($request->has('industry') && $request->industry) {
            $query->where('industry', 'like', "%{$request->industry}%");
        }

        $companies = $query->paginate(15)->withQueryString();

        return Inertia::render('Admin/Companies/Index', [
            'companies' => $companies,
            'filters' => $request->only(['search', 'status', 'industry']),
        ]);
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'legal_name' => 'nullable|string|max:255',
            'tax_id' => 'nullable|string|max:50|unique:companies,tax_id',
            'registration_number' => 'nullable|string|max:100|unique:companies,registration_number',
            'logo' => 'nullable|string|max:255',
            'website' => 'nullable|url|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'country' => 'nullable|string|max:100',
            'currency' => 'nullable|string|max:10',
            'fiscal_year_start' => 'nullable|date',
            'industry' => 'nullable|string|max:100',
            'description' => 'nullable|string|max:1000',
            'status' => 'boolean',
        ]);

        $company = Company::create($validatedData);

        return response()->json([
            'success' => true,
            'message' => 'Company created successfully',
            'company' => $company->fresh()->loadCount(['locations', 'employees'])
        ]);
    }

    public function update(Request $request, Company $company)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'legal_name' => 'nullable|string|max:255',
            'tax_id' => 'nullable|string|max:50|unique:companies,tax_id,' . $company->id,
            'registration_number' => 'nullable|string|max:100|unique:companies,registration_number,' . $company->id,
            'logo' => 'nullable|string|max:255',
            'website' => 'nullable|url|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'country' => 'nullable|string|max:100',
            'currency' => 'nullable|string|max:10',
            'fiscal_year_start' => 'nullable|date',
            'industry' => 'nullable|string|max:100',
            'description' => 'nullable|string|max:1000',
            'status' => 'boolean',
        ]);

        $company->update($validatedData);

        return response()->json([
            'success' => true,
            'message' => 'Company updated successfully',
            'company' => $company->fresh()->loadCount(['locations', 'employees'])
        ]);
    }

    public function destroy(Company $company)
    {
        $company->delete();

        return response()->json([
            'success' => true,
            'message' => 'Company deleted successfully'
        ]);
    }
}