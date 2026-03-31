<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\CompanyContact;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class CompanyContactController extends Controller
{
    /**
     * Display a listing of the company contacts.
     *
     * @param  \App\Models\Company  $company
     * @return \Inertia\Response
     */
    public function index(Company $company)
    {
        $company->load('contacts');
        
        return Inertia::render('Crm/Companies/Contacts/Index', [
            'company' => $company,
            'contacts' => $company->contacts,
        ]);
    }

    /**
     * Show the form for creating a new company contact.
     *
     * @param  \App\Models\Company  $company
     * @return \Inertia\Response
     */
    public function create(Company $company)
    {
        return Inertia::render('Crm/Companies/Contacts/Create', [
            'company' => $company,
        ]);
    }

    /**
     * Store a newly created company contact in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Company  $company
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request, Company $company)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'position' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'is_primary' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        // If this is a primary contact, update other contacts
        if ($request->is_primary) {
            $company->contacts()->update(['is_primary' => false]);
        }

        $company->contacts()->create([
            'name' => $request->name,
            'position' => $request->position,
            'phone' => $request->phone,
            'email' => $request->email,
            'is_primary' => $request->is_primary ?? false,
            'notes' => $request->notes,
        ]);

        return redirect()->route('companies.contacts.index', $company)->with('success', 'Kişi başarıyla oluşturuldu.');
    }

    /**
     * Display the specified company contact.
     *
     * @param  \App\Models\Company  $company
     * @param  \App\Models\CompanyContact  $contact
     * @return \Inertia\Response
     */
    public function show(Company $company, CompanyContact $contact)
    {
        return Inertia::render('Crm/Companies/Contacts/Show', [
            'company' => $company,
            'contact' => $contact,
        ]);
    }

    /**
     * Show the form for editing the specified company contact.
     *
     * @param  \App\Models\Company  $company
     * @param  \App\Models\CompanyContact  $contact
     * @return \Inertia\Response
     */
    public function edit(Company $company, CompanyContact $contact)
    {
        return Inertia::render('Crm/Companies/Contacts/Edit', [
            'company' => $company,
            'contact' => $contact,
        ]);
    }

    /**
     * Update the specified company contact in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Company  $company
     * @param  \App\Models\CompanyContact  $contact
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request, Company $company, CompanyContact $contact)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'position' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'is_primary' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        // If this is a primary contact, update other contacts
        if ($request->is_primary && !$contact->is_primary) {
            $company->contacts()->where('id', '!=', $contact->id)->update(['is_primary' => false]);
        }

        $contact->update([
            'name' => $request->name,
            'position' => $request->position,
            'phone' => $request->phone,
            'email' => $request->email,
            'is_primary' => $request->is_primary ?? false,
            'notes' => $request->notes,
        ]);

        return redirect()->route('companies.contacts.index', $company)->with('success', 'Kişi başarıyla güncellendi.');
    }

    /**
     * Remove the specified company contact from storage.
     *
     * @param  \App\Models\Company  $company
     * @param  \App\Models\CompanyContact  $contact
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy(Company $company, CompanyContact $contact)
    {
        $contact->delete();
        
        return redirect()->route('companies.contacts.index', $company)->with('success', 'Kişi başarıyla silindi.');
    }

    /**
     * Set the contact as primary.
     *
     * @param  \App\Models\Company  $company
     * @param  \App\Models\CompanyContact  $contact
     * @return \Illuminate\Http\RedirectResponse
     */
    public function setPrimary(Company $company, CompanyContact $contact)
    {
        $company->contacts()->where('id', '!=', $contact->id)->update(['is_primary' => false]);
        $contact->update(['is_primary' => true]);
        
        return redirect()->route('companies.contacts.index', $company)->with('success', 'Kişi birincil iletişim olarak ayarlandı.');
    }
}
