<?php

namespace App\Http\Controllers;

use App\Models\CompanyType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class CompanyTypeController extends Controller
{
    /**
     * Display a listing of the company types.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        $companyTypes = CompanyType::orderBy('name')->paginate(10);
        
        return Inertia::render('Crm/CompanyTypes/Index', [
            'companyTypes' => $companyTypes,
        ]);
    }

    /**
     * Show the form for creating a new company type.
     *
     * @return \Inertia\Response
     */
    public function create()
    {
        return Inertia::render('Crm/CompanyTypes/Create');
    }

    /**
     * Store a newly created company type in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:company_types',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        CompanyType::create([
            'name' => $request->name,
            'description' => $request->description,
        ]);

        return redirect()->route('company-types.index')->with('success', 'Şirket tipi başarıyla oluşturuldu.');
    }

    /**
     * Display the specified company type.
     *
     * @param  \App\Models\CompanyType  $companyType
     * @return \Inertia\Response
     */
    public function show(CompanyType $companyType)
    {
        return Inertia::render('Crm/CompanyTypes/Show', [
            'companyType' => $companyType,
        ]);
    }

    /**
     * Show the form for editing the specified company type.
     *
     * @param  \App\Models\CompanyType  $companyType
     * @return \Inertia\Response
     */
    public function edit(CompanyType $companyType)
    {
        return Inertia::render('Crm/CompanyTypes/Edit', [
            'companyType' => $companyType,
        ]);
    }

    /**
     * Update the specified company type in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\CompanyType  $companyType
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request, CompanyType $companyType)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:company_types,name,' . $companyType->id,
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $companyType->update([
            'name' => $request->name,
            'description' => $request->description,
        ]);

        return redirect()->route('company-types.index')->with('success', 'Şirket tipi başarıyla güncellendi.');
    }

    /**
     * Remove the specified company type from storage.
     *
     * @param  \App\Models\CompanyType  $companyType
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy(CompanyType $companyType)
    {
        $companyType->delete();
        
        return redirect()->route('company-types.index')->with('success', 'Şirket tipi başarıyla silindi.');
    }
}
