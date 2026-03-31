<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LoginRedirect;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LoginRedirectController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = LoginRedirect::query()
            ->with(['user', 'role'])
            ->orderBy('type')
            ->orderBy('priority', 'desc')
            ->orderBy('created_at', 'desc');

        // Apply filters
        if ($request->has('type') && $request->type) {
            $query->where('type', $request->type);
        }

        if ($request->has('is_active') && $request->is_active !== '') {
            $query->where('is_active', $request->is_active);
        }

        if ($request->has('search') && $request->search) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', "%{$searchTerm}%")
                    ->orWhere('redirect_to', 'like', "%{$searchTerm}%")
                    ->orWhere('description', 'like', "%{$searchTerm}%")
                    ->orWhereHas('user', function ($q) use ($searchTerm) {
                        $q->where('name', 'like', "%{$searchTerm}%")
                            ->orWhere('email', 'like', "%{$searchTerm}%");
                    })
                    ->orWhereHas('role', function ($q) use ($searchTerm) {
                        $q->where('name', 'like', "%{$searchTerm}%");
                    });
            });
        }

        $redirects = $query->paginate(10)->withQueryString();

        return Inertia::render('Admin/LoginRedirects/Index', [
            'redirects' => $redirects,
            'filters' => $request->only(['type', 'is_active', 'search']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $users = User::orderBy('name')->get(['id', 'name', 'email']);
        $roles = Role::orderBy('name')->get(['id', 'name']);

        // Örnek sayfalar listesi
        $samplePages = [
            ['value' => '/dashboard', 'label' => 'Ana Sayfa'],
            ['value' => '/announcements', 'label' => 'Duyurular'],
            ['value' => '/documents', 'label' => 'Belgeler'],
            ['value' => '/expenses', 'label' => 'Harcamalar'],
            ['value' => '/visitors', 'label' => 'Ziyaretçiler'],
            ['value' => '/filo-yonetimi', 'label' => 'Filo Yönetimi'],
            ['value' => '/work-requests', 'label' => 'İş Talepleri'],
            ['value' => '/quality-requests', 'label' => 'Kalite Talepleri'],
            ['value' => '/ideas', 'label' => 'Fikir Havuzu'],
            ['value' => '/meal-menu', 'label' => 'Yemek Menüsü'],
            ['value' => '/news', 'label' => 'Haberler'],
            ['value' => '/reports/comparative-sales', 'label' => 'Satış Raporları'],
            ['value' => '/onay-fatura-teklif', 'label' => 'Fatura ve Teklif Onayları'],
        ];

        return Inertia::render('Admin/LoginRedirects/Create', [
            'users' => $users,
            'roles' => $roles,
            'samplePages' => $samplePages,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'type' => 'required|in:user,role',
            'user_id' => 'required_if:type,user|nullable|exists:users,id',
            'role_id' => 'required_if:type,role|nullable|exists:roles,id',
            'redirect_to' => 'required|string|max:255',
            'name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'integer|min:0',
            'is_active' => 'boolean',
        ]);

        // Ensure only one ID is set based on type
        if ($validatedData['type'] === 'user') {
            $validatedData['role_id'] = null;
        } else {
            $validatedData['user_id'] = null;
        }

        LoginRedirect::create($validatedData);

        return redirect()->route('admin.login-redirects.index')
            ->with('message', 'Yönlendirme ayarı başarıyla oluşturuldu.');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(LoginRedirect $loginRedirect)
    {
        $users = User::orderBy('name')->get(['id', 'name', 'email']);
        $roles = Role::orderBy('name')->get(['id', 'name']);

        // Örnek sayfalar listesi
        $samplePages = [
            ['value' => '/dashboard', 'label' => 'Ana Sayfa'],
            ['value' => '/announcements', 'label' => 'Duyurular'],
            ['value' => '/documents', 'label' => 'Belgeler'],
            ['value' => '/expenses', 'label' => 'Harcamalar'],
            ['value' => '/visitors', 'label' => 'Ziyaretçiler'],
            ['value' => '/filo-yonetimi', 'label' => 'Filo Yönetimi'],
            ['value' => '/work-requests', 'label' => 'İş Talepleri'],
            ['value' => '/quality-requests', 'label' => 'Kalite Talepleri'],
            ['value' => '/ideas', 'label' => 'Fikir Havuzu'],
            ['value' => '/meal-menu', 'label' => 'Yemek Menüsü'],
            ['value' => '/news', 'label' => 'Haberler'],
            ['value' => '/reports/comparative-sales', 'label' => 'Satış Raporları'],
            ['value' => '/onay-fatura-teklif', 'label' => 'Fatura ve Teklif Onayları'],
        ];

        return Inertia::render('Admin/LoginRedirects/Edit', [
            'redirect' => $loginRedirect,
            'users' => $users,
            'roles' => $roles,
            'samplePages' => $samplePages,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, LoginRedirect $loginRedirect)
    {
        $validatedData = $request->validate([
            'type' => 'required|in:user,role',
            'user_id' => 'required_if:type,user|nullable|exists:users,id',
            'role_id' => 'required_if:type,role|nullable|exists:roles,id',
            'redirect_to' => 'required|string|max:255',
            'name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'integer|min:0',
            'is_active' => 'boolean',
        ]);

        // Ensure only one ID is set based on type
        if ($validatedData['type'] === 'user') {
            $validatedData['role_id'] = null;
        } else {
            $validatedData['user_id'] = null;
        }

        $loginRedirect->update($validatedData);

        return redirect()->route('admin.login-redirects.index')
            ->with('message', 'Yönlendirme ayarı başarıyla güncellendi.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(LoginRedirect $loginRedirect)
    {
        $loginRedirect->delete();

        return redirect()->route('admin.login-redirects.index')
            ->with('message', 'Yönlendirme ayarı başarıyla silindi.');
    }

    /**
     * Toggle the active status of the redirect.
     */
    public function toggleActive(LoginRedirect $loginRedirect)
    {
        $loginRedirect->update([
            'is_active' => !$loginRedirect->is_active,
        ]);

        return redirect()->back()
            ->with('message', 'Yönlendirme durumu güncellendi.');
    }
}