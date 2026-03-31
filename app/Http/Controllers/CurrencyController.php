<?php

namespace App\Http\Controllers;

use App\Models\Currency;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CurrencyController extends Controller
{
    /**
     * Display currency management page
     */
    public function index()
    {
        $currencies = Currency::orderBy('is_default', 'desc')
            ->orderBy('cur_code')
            ->get();

        return Inertia::render('Settings/Currencies', [
            'currencies' => $currencies,
        ]);
    }

    /**
     * Store a new currency
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'cur_code' => 'required|string|max:3|unique:currencies,cur_code',
            'name' => 'required|string|max:255',
            'cur_symbol' => 'required|string|max:10',
            'description' => 'nullable|string',
            'exchange_rate' => 'required|numeric|min:0',
            'decimal_places' => 'required|integer|min:0|max:4',
            'thousand_separator' => 'required|string|max:10',
            'decimal_separator' => 'required|string|max:10',
            'symbol_position' => 'required|in:before,after',
            'is_active' => 'boolean',
        ]);

        DB::beginTransaction();
        try {
            $validated['last_updated_at'] = now();
            Currency::create($validated);

            DB::commit();

            return back()->with('success', 'Para birimi başarıyla eklendi.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Para birimi eklenirken bir hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Update a currency
     */
    public function update(Request $request, Currency $currency)
    {
        $validated = $request->validate([
            'cur_code' => 'required|string|max:3|unique:currencies,cur_code,' . $currency->id,
            'name' => 'required|string|max:255',
            'cur_symbol' => 'required|string|max:10',
            'description' => 'nullable|string',
            'exchange_rate' => 'required|numeric|min:0',
            'decimal_places' => 'required|integer|min:0|max:4',
            'thousand_separator' => 'required|string|max:10',
            'decimal_separator' => 'required|string|max:10',
            'symbol_position' => 'required|in:before,after',
            'is_active' => 'boolean',
        ]);

        DB::beginTransaction();
        try {
            $validated['last_updated_at'] = now();
            $currency->update($validated);

            DB::commit();

            return back()->with('success', 'Para birimi başarıyla güncellendi.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Para birimi güncellenirken bir hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Delete a currency
     */
    public function destroy(Currency $currency)
    {
        if ($currency->is_default) {
            return back()->with('error', 'Varsayılan para birimi silinemez.');
        }

        DB::beginTransaction();
        try {
            $currency->delete();

            DB::commit();

            return back()->with('success', 'Para birimi başarıyla silindi.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Para birimi silinirken bir hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Set a currency as default
     */
    public function setDefault(Currency $currency)
    {
        DB::beginTransaction();
        try {
            // Remove default from all currencies
            Currency::where('is_default', true)->update(['is_default' => false]);

            // Set new default
            $currency->update(['is_default' => true]);

            DB::commit();

            return back()->with('success', 'Varsayılan para birimi güncellendi.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Varsayılan para birimi güncellenirken bir hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Toggle currency active status
     */
    public function toggleStatus(Currency $currency)
    {
        if ($currency->is_default && $currency->is_active) {
            return back()->with('error', 'Varsayılan para birimi devre dışı bırakılamaz.');
        }

        DB::beginTransaction();
        try {
            $currency->update([
                'is_active' => !$currency->is_active
            ]);

            DB::commit();

            $status = $currency->is_active ? 'aktif' : 'pasif';
            return back()->with('success', "Para birimi {$status} duruma getirildi.");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Para birimi durumu güncellenirken bir hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Update exchange rates from external API
     */
    public function updateExchangeRates(Request $request)
    {
        $validated = $request->validate([
            'base_currency' => 'required|string|max:3|exists:currencies,cur_code',
        ]);

        DB::beginTransaction();
        try {
            $baseCurrency = Currency::where('cur_code', $validated['base_currency'])->first();

            // Here you would integrate with an external API like:
            // - https://exchangerate-api.com
            // - https://fixer.io
            // - https://openexchangerates.org
            // - Central Bank APIs (TCMB for Turkey)

            // For now, this is a placeholder
            // You should implement actual API integration

            // Example structure:
            // $rates = $this->fetchExchangeRatesFromAPI($baseCurrency->cur_code);
            // foreach ($rates as $code => $rate) {
            //     Currency::where('cur_code', $code)->update([
            //         'exchange_rate' => $rate,
            //         'last_updated_at' => now()
            //     ]);
            // }

            DB::commit();

            return back()->with('info', 'Kur güncelleme fonksiyonu henüz yapılandırılmamış. Lütfen bir döviz kuru API servisi entegre edin.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Kurlar güncellenirken bir hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Format amount according to currency settings
     */
    public function formatAmount(Currency $currency, float $amount): string
    {
        $formatted = number_format(
            $amount,
            $currency->decimal_places,
            $currency->decimal_separator,
            $currency->thousand_separator
        );

        if ($currency->symbol_position === 'before') {
            return $currency->cur_symbol . $formatted;
        }

        return $formatted . $currency->cur_symbol;
    }
}
