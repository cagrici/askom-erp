<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\CompanyContact;
use App\Models\CompanyType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class CompanyController extends Controller
{
    /**
     * Display a listing of the companies.
     *
     * @return \Inertia\Response
     */
    public function index(Request $request)
    {
        $query = Company::with('primaryContact');

        // Filtering
        if ($request->has('type') && $request->type === 'customer') {
            $query->customers();
        } elseif ($request->has('type') && $request->type === 'supplier') {
            $query->suppliers();
        }

        if ($request->has('status') && in_array($request->status, ['active', 'inactive', 'pending'])) {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', "%{$searchTerm}%")
                    ->orWhere('owner', 'like', "%{$searchTerm}%")
                    ->orWhere('location', 'like', "%{$searchTerm}%")
                    ->orWhere('industry_type', 'like', "%{$searchTerm}%");
            });
        }

        // Sorting
        $sortField = $request->input('sort_field', 'name');
        $sortDirection = $request->input('sort_direction', 'asc');
        $allowedSortFields = ['name', 'owner', 'industry_type', 'rating', 'location', 'since'];

        if (in_array($sortField, $allowedSortFields)) {
            $query->orderBy($sortField, $sortDirection);
        }

        $companies = $query->paginate(10)->appends($request->query());
        $industryTypes = CompanyType::all();

        return Inertia::render('Crm/Companies/Index', [
            'companies' => $companies,
            'industryTypes' => $industryTypes,
            'filters' => $request->only(['type', 'status', 'search', 'sort_field', 'sort_direction']),
        ]);
    }

    /**
     * Show the form for creating a new company.
     *
     * @return \Inertia\Response
     */
    public function create()
    {
        $industryTypes = CompanyType::all();

        return Inertia::render('Crm/Companies/Create', [
            'industryTypes' => $industryTypes,
        ]);
    }

    /**
     * Store a newly created company in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'owner' => 'nullable|string|max:255',
            'industry_type' => 'nullable|string|max:255',
            'rating' => 'nullable|numeric|min:0|max:5',
            'location' => 'nullable|string|max:255',
            'employee' => 'nullable|string|max:50',
            'website' => 'nullable|string|max:255',
            'contact_email' => 'nullable|email|max:255',
            'since' => 'nullable|string|max:50',
            'picture' => 'nullable|string',
            'phone' => 'nullable|string|max:50',
            'fax' => 'nullable|string|max:50',
            'tax_number' => 'nullable|string|max:100',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'notes' => 'nullable|string',
            'is_customer' => 'boolean',
            'is_supplier' => 'boolean',
            'status' => 'required|in:active,inactive,pending',
            'contacts' => 'nullable|array',
            'contacts.*.name' => 'required|string|max:255',
            'contacts.*.position' => 'nullable|string|max:255',
            'contacts.*.phone' => 'nullable|string|max:50',
            'contacts.*.email' => 'nullable|email|max:255',
            'contacts.*.is_primary' => 'boolean',
            'contacts.*.notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        // Handle picture upload if it's a base64 image
        $picturePath = null;
        if ($request->has('picture') && strpos($request->picture, 'data:image') === 0) {
            $image = $request->picture;
            $image = str_replace('data:image/png;base64,', '', $image);
            $image = str_replace('data:image/jpeg;base64,', '', $image);
            $image = str_replace(' ', '+', $image);
            $imageName = 'company_' . time() . '.png';
            Storage::disk('public')->put('companies/' . $imageName, base64_decode($image));
            $picturePath = 'companies/' . $imageName;
        } else {
            $picturePath = $request->picture;
        }

        $company = Company::create([
            'name' => $request->name,
            'owner' => $request->owner,
            'industry_type' => $request->industry_type,
            'rating' => $request->rating,
            'location' => $request->location,
            'employee' => $request->employee,
            'website' => $request->website,
            'contact_email' => $request->contact_email,
            'since' => $request->since,
            'picture' => $picturePath,
            'phone' => $request->phone,
            'fax' => $request->fax,
            'tax_number' => $request->tax_number,
            'address' => $request->address,
            'city' => $request->city,
            'country' => $request->country,
            'postal_code' => $request->postal_code,
            'notes' => $request->notes,
            'is_customer' => $request->is_customer ?? false,
            'is_supplier' => $request->is_supplier ?? false,
            'status' => $request->status,
        ]);

        // Add contacts if provided
        if ($request->has('contacts') && is_array($request->contacts)) {
            foreach ($request->contacts as $contactData) {
                $company->contacts()->create([
                    'name' => $contactData['name'],
                    'position' => $contactData['position'] ?? null,
                    'phone' => $contactData['phone'] ?? null,
                    'email' => $contactData['email'] ?? null,
                    'is_primary' => $contactData['is_primary'] ?? false,
                    'notes' => $contactData['notes'] ?? null,
                ]);
            }
        }

        return redirect()->route('companies.index')->with('success', 'Şirket başarıyla oluşturuldu.');
    }

    /**
     * Display the specified company.
     *
     * @param  \App\Models\Company  $company
     * @return \Inertia\Response
     */
    public function show(Company $company)
    {
        $company->load('contacts');

        return Inertia::render('Crm/Companies/Show', [
            'company' => $company,
        ]);
    }

    /**
     * Show the form for editing the specified company.
     *
     * @param  \App\Models\Company  $company
     * @return \Inertia\Response
     */
    public function edit(Company $company)
    {
        $company->load('contacts');
        $industryTypes = CompanyType::all();

        return Inertia::render('Crm/Companies/Edit', [
            'company' => $company,
            'industryTypes' => $industryTypes,
        ]);
    }

    /**
     * Update the specified company in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Company  $company
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request, Company $company)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'owner' => 'nullable|string|max:255',
            'industry_type' => 'nullable|string|max:255',
            'rating' => 'nullable|numeric|min:0|max:5',
            'location' => 'nullable|string|max:255',
            'employee' => 'nullable|string|max:50',
            'website' => 'nullable|string|max:255',
            'contact_email' => 'nullable|email|max:255',
            'since' => 'nullable|string|max:50',
            'picture' => 'nullable|string',
            'phone' => 'nullable|string|max:50',
            'fax' => 'nullable|string|max:50',
            'tax_number' => 'nullable|string|max:100',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'notes' => 'nullable|string',
            'is_customer' => 'boolean',
            'is_supplier' => 'boolean',
            'status' => 'required|in:active,inactive,pending',
            'contacts' => 'nullable|array',
            'contacts.*.id' => 'nullable|exists:company_contacts,id',
            'contacts.*.name' => 'required|string|max:255',
            'contacts.*.position' => 'nullable|string|max:255',
            'contacts.*.phone' => 'nullable|string|max:50',
            'contacts.*.email' => 'nullable|email|max:255',
            'contacts.*.is_primary' => 'boolean',
            'contacts.*.notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        // Handle picture upload if it's a base64 image
        $picturePath = $company->picture;
        if ($request->has('picture') && strpos($request->picture, 'data:image') === 0) {
            // Delete old picture if exists
            if ($company->picture && Storage::disk('public')->exists($company->picture)) {
                Storage::disk('public')->delete($company->picture);
            }

            $image = $request->picture;
            $image = str_replace('data:image/png;base64,', '', $image);
            $image = str_replace('data:image/jpeg;base64,', '', $image);
            $image = str_replace(' ', '+', $image);
            $imageName = 'company_' . time() . '.png';
            Storage::disk('public')->put('companies/' . $imageName, base64_decode($image));
            $picturePath = 'companies/' . $imageName;
        }

        $company->update([
            'name' => $request->name,
            'owner' => $request->owner,
            'industry_type' => $request->industry_type,
            'rating' => $request->rating,
            'location' => $request->location,
            'employee' => $request->employee,
            'website' => $request->website,
            'contact_email' => $request->contact_email,
            'since' => $request->since,
            'picture' => $picturePath,
            'phone' => $request->phone,
            'fax' => $request->fax,
            'tax_number' => $request->tax_number,
            'address' => $request->address,
            'city' => $request->city,
            'country' => $request->country,
            'postal_code' => $request->postal_code,
            'notes' => $request->notes,
            'is_customer' => $request->is_customer ?? false,
            'is_supplier' => $request->is_supplier ?? false,
            'status' => $request->status,
        ]);

        // Update contacts
        if ($request->has('contacts') && is_array($request->contacts)) {
            // Get all existing contact IDs
            $existingContactIds = $company->contacts->pluck('id')->toArray();
            $updatedContactIds = [];

            foreach ($request->contacts as $contactData) {
                if (isset($contactData['id'])) {
                    // Update existing contact
                    $contact = CompanyContact::findOrFail($contactData['id']);
                    $contact->update([
                        'name' => $contactData['name'],
                        'position' => $contactData['position'] ?? null,
                        'phone' => $contactData['phone'] ?? null,
                        'email' => $contactData['email'] ?? null,
                        'is_primary' => $contactData['is_primary'] ?? false,
                        'notes' => $contactData['notes'] ?? null,
                    ]);
                    $updatedContactIds[] = $contact->id;
                } else {
                    // Create new contact
                    $contact = $company->contacts()->create([
                        'name' => $contactData['name'],
                        'position' => $contactData['position'] ?? null,
                        'phone' => $contactData['phone'] ?? null,
                        'email' => $contactData['email'] ?? null,
                        'is_primary' => $contactData['is_primary'] ?? false,
                        'notes' => $contactData['notes'] ?? null,
                    ]);
                    $updatedContactIds[] = $contact->id;
                }
            }

            // Delete contacts that are not in the update request
            $contactsToDelete = array_diff($existingContactIds, $updatedContactIds);
            if (!empty($contactsToDelete)) {
                CompanyContact::whereIn('id', $contactsToDelete)->delete();
            }
        } else {
            // If no contacts were provided, delete all existing contacts
            $company->contacts()->delete();
        }

        return redirect()->route('companies.index')->with('success', 'Şirket başarıyla güncellendi.');
    }

    /**
     * Remove the specified company from storage.
     *
     * @param  \App\Models\Company  $company
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy(Company $company)
    {
        // Delete company picture if exists
        if ($company->picture && Storage::disk('public')->exists($company->picture)) {
            Storage::disk('public')->delete($company->picture);
        }

        $company->delete();

        return redirect()->route('companies.index')->with('success', 'Şirket başarıyla silindi.');
    }

    /**
     * Display a listing of the customer companies.
     *
     * @return \Inertia\Response
     */
    public function customers(Request $request)
    {
        $request->merge(['type' => 'customer']);
        return $this->index($request);
    }

    /**
     * Display a listing of the supplier companies.
     *
     * @return \Inertia\Response
     */
    public function suppliers(Request $request)
    {
        $request->merge(['type' => 'supplier']);
        return $this->index($request);
    }
}
