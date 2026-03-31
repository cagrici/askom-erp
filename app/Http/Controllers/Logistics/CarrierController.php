<?php

namespace App\Http\Controllers\Logistics;

use App\Http\Controllers\Controller;
use App\Models\Carrier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CarrierController extends Controller
{
    /**
     * Display a listing of carriers
     */
    public function index(Request $request)
    {
        $query = Carrier::query();

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('carrier_code', 'like', "%{$search}%")
                  ->orWhere('company_name', 'like', "%{$search}%")
                  ->orWhere('trade_name', 'like', "%{$search}%")
                  ->orWhere('contact_person', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by carrier type
        if ($request->filled('carrier_type')) {
            $query->where('carrier_type', $request->carrier_type);
        }

        // Filter by contract type
        if ($request->filled('contract_type')) {
            $query->where('contract_type', $request->contract_type);
        }

        // Filter preferred carriers
        if ($request->filled('preferred') && $request->preferred === 'true') {
            $query->where('is_preferred', true);
        }

        // Filter verified carriers
        if ($request->filled('verified') && $request->verified === 'true') {
            $query->where('is_verified', true);
        }

        $carriers = $query->latest()->paginate(15)->withQueryString();

        // Get statistics
        $stats = $this->getStatistics();

        return Inertia::render('Logistics/Carriers/Index', [
            'carriers' => $carriers,
            'stats' => $stats,
            'filters' => [
                'search' => $request->search,
                'status' => $request->status,
                'carrier_type' => $request->carrier_type,
                'contract_type' => $request->contract_type,
                'preferred' => $request->preferred,
                'verified' => $request->verified,
            ]
        ]);
    }

    /**
     * Show the form for creating a new carrier
     */
    public function create()
    {
        return Inertia::render('Logistics/Carriers/Create');
    }

    /**
     * Store a newly created carrier
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'trade_name' => 'nullable|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'mobile' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|url|max:255',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'country' => 'nullable|string|max:2',
            'tax_office' => 'nullable|string|max:255',
            'tax_number' => 'nullable|string|max:50',
            'carrier_type' => 'required|in:road,air,sea,rail,multimodal',
            'fleet_size' => 'nullable|integer|min:0',
            'base_rate_per_km' => 'nullable|numeric|min:0',
            'min_charge' => 'nullable|numeric|min:0',
            'insurance_company' => 'nullable|string|max:255',
            'insurance_policy_number' => 'nullable|string|max:100',
            'insurance_expiry_date' => 'nullable|date',
            'contract_type' => 'required|in:permanent,temporary,spot',
            'contract_start_date' => 'nullable|date',
            'contract_end_date' => 'nullable|date|after:contract_start_date',
            'payment_terms_days' => 'nullable|integer|min:0',
            'payment_method' => 'nullable|in:bank_transfer,check,cash,credit_card',
            'bank_name' => 'nullable|string|max:255',
            'iban' => 'nullable|string|max:34',
            'status' => 'required|in:active,inactive,suspended,blacklisted',
            'is_preferred' => 'boolean',
            'is_verified' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $validated['created_by'] = auth()->id();
            $carrier = Carrier::create($validated);

            DB::commit();

            return redirect()
                ->route('logistics.carriers.index')
                ->with('success', 'Taşıyıcı başarıyla oluşturuldu.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()
                ->withInput()
                ->with('error', 'Taşıyıcı oluşturulurken bir hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified carrier
     */
    public function show(Carrier $carrier)
    {
        $carrier->load(['shipments', 'createdBy', 'updatedBy']);

        return Inertia::render('Logistics/Carriers/Show', [
            'carrier' => $carrier
        ]);
    }

    /**
     * Show the form for editing the carrier
     */
    public function edit(Carrier $carrier)
    {
        return Inertia::render('Logistics/Carriers/Edit', [
            'carrier' => $carrier
        ]);
    }

    /**
     * Update the specified carrier
     */
    public function update(Request $request, Carrier $carrier)
    {
        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'trade_name' => 'nullable|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'mobile' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|url|max:255',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'country' => 'nullable|string|max:2',
            'tax_office' => 'nullable|string|max:255',
            'tax_number' => 'nullable|string|max:50',
            'carrier_type' => 'required|in:road,air,sea,rail,multimodal',
            'fleet_size' => 'nullable|integer|min:0',
            'base_rate_per_km' => 'nullable|numeric|min:0',
            'min_charge' => 'nullable|numeric|min:0',
            'insurance_company' => 'nullable|string|max:255',
            'insurance_policy_number' => 'nullable|string|max:100',
            'insurance_expiry_date' => 'nullable|date',
            'contract_type' => 'required|in:permanent,temporary,spot',
            'contract_start_date' => 'nullable|date',
            'contract_end_date' => 'nullable|date|after:contract_start_date',
            'payment_terms_days' => 'nullable|integer|min:0',
            'payment_method' => 'nullable|in:bank_transfer,check,cash,credit_card',
            'bank_name' => 'nullable|string|max:255',
            'iban' => 'nullable|string|max:34',
            'status' => 'required|in:active,inactive,suspended,blacklisted',
            'is_preferred' => 'boolean',
            'is_verified' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $validated['updated_by'] = auth()->id();
            $carrier->update($validated);

            DB::commit();

            return redirect()
                ->route('logistics.carriers.index')
                ->with('success', 'Taşıyıcı başarıyla güncellendi.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()
                ->withInput()
                ->with('error', 'Taşıyıcı güncellenirken bir hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified carrier
     */
    public function destroy(Carrier $carrier)
    {
        try {
            $carrier->delete();

            return redirect()
                ->route('logistics.carriers.index')
                ->with('success', 'Taşıyıcı başarıyla silindi.');
        } catch (\Exception $e) {
            return back()->with('error', 'Taşıyıcı silinirken bir hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Toggle preferred status
     */
    public function togglePreferred(Carrier $carrier)
    {
        try {
            $carrier->update(['is_preferred' => !$carrier->is_preferred]);

            $message = $carrier->is_preferred ? 'Taşıyıcı tercih edilenlere eklendi.' : 'Taşıyıcı tercih edilenlerden çıkarıldı.';

            return back()->with('success', $message);
        } catch (\Exception $e) {
            return back()->with('error', 'İşlem sırasında bir hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Toggle verified status
     */
    public function toggleVerified(Carrier $carrier)
    {
        try {
            $carrier->update(['is_verified' => !$carrier->is_verified]);

            $message = $carrier->is_verified ? 'Taşıyıcı doğrulandı.' : 'Taşıyıcı doğrulaması kaldırıldı.';

            return back()->with('success', $message);
        } catch (\Exception $e) {
            return back()->with('error', 'İşlem sırasında bir hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Update carrier status
     */
    public function updateStatus(Request $request, Carrier $carrier)
    {
        $validated = $request->validate([
            'status' => 'required|in:active,inactive,suspended,blacklisted',
        ]);

        try {
            $carrier->update(['status' => $validated['status']]);

            return back()->with('success', 'Taşıyıcı durumu güncellendi.');
        } catch (\Exception $e) {
            return back()->with('error', 'Durum güncellenirken bir hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Get carrier statistics
     */
    private function getStatistics(): array
    {
        return [
            'total_carriers' => Carrier::count(),
            'active_carriers' => Carrier::where('status', 'active')->count(),
            'preferred_carriers' => Carrier::where('is_preferred', true)->count(),
            'verified_carriers' => Carrier::where('is_verified', true)->count(),
            'road_carriers' => Carrier::where('carrier_type', 'road')->count(),
            'air_carriers' => Carrier::where('carrier_type', 'air')->count(),
            'insurance_expiring' => Carrier::insuranceExpiringSoon()->count(),
            'contract_expiring' => Carrier::contractExpiringSoon()->count(),
            'avg_rating' => Carrier::where('status', 'active')->avg('rating') ?? 0,
            'avg_on_time' => Carrier::where('status', 'active')->avg('on_time_percentage') ?? 0,
        ];
    }
}
