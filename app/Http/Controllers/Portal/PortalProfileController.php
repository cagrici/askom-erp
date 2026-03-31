<?php

namespace App\Http\Controllers\Portal;

use App\Models\CurrentAccount;
use App\Models\CurrentAccountDeliveryAddress;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class PortalProfileController extends BasePortalController
{
    public function index()
    {
        $customerId = $this->getSelectedAccountId();
        $customer = CurrentAccount::with(['deliveryAddresses'])->findOrFail($customerId);

        return Inertia::render('Portal/Profile/Index', [
            'customer' => $customer,
            'user' => Auth::user(),
        ]);
    }

    public function updateProfile(Request $request)
    {
        $customerId = $this->getSelectedAccountId();
        $customer = CurrentAccount::findOrFail($customerId);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'tax_number' => 'nullable|string|max:50',
            'tax_office' => 'nullable|string|max:255',
        ]);

        $customer->update($validated);

        return back()->with('success', 'Profil bilgileri güncellendi.');
    }

    public function updatePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = Auth::user();

        if (!Hash::check($validated['current_password'], $user->password)) {
            return back()->withErrors(['current_password' => 'Mevcut şifre yanlış.']);
        }

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return back()->with('success', 'Şifre başarıyla güncellendi.');
    }

    public function storeDeliveryAddress(Request $request)
    {
        $customerId = $this->getSelectedAccountId();

        $validated = $request->validate([
            'address_name' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'required|string',
            'city' => 'nullable|string|max:100',
            'district' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'is_default' => 'boolean',
        ]);

        if ($validated['is_default'] ?? false) {
            CurrentAccountDeliveryAddress::where('current_account_id', $customerId)
                ->update(['is_default' => false]);
        }

        CurrentAccountDeliveryAddress::create([
            'current_account_id' => $customerId,
            ...$validated
        ]);

        return back()->with('success', 'Teslimat adresi eklendi.');
    }

    public function updateDeliveryAddress(Request $request, $id)
    {
        $customerId = $this->getSelectedAccountId();

        $address = CurrentAccountDeliveryAddress::where('current_account_id', $customerId)
            ->findOrFail($id);

        $validated = $request->validate([
            'address_name' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'required|string',
            'city' => 'nullable|string|max:100',
            'district' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'is_default' => 'boolean',
        ]);

        if ($validated['is_default'] ?? false) {
            CurrentAccountDeliveryAddress::where('current_account_id', $customerId)
                ->where('id', '!=', $id)
                ->update(['is_default' => false]);
        }

        $address->update($validated);

        return back()->with('success', 'Teslimat adresi güncellendi.');
    }

    public function deleteDeliveryAddress($id)
    {
        $customerId = $this->getSelectedAccountId();

        $address = CurrentAccountDeliveryAddress::where('current_account_id', $customerId)
            ->findOrFail($id);

        $address->delete();

        return back()->with('success', 'Teslimat adresi silindi.');
    }
}
