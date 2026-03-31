<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SettingsController extends Controller
{
    /**
     * Display general settings
     */
    public function general()
    {
        $settings = Setting::byGroup('general')->get()->keyBy('key');

        // Ensure default settings exist
        $this->ensureGeneralSettings();

        $settings = Setting::byGroup('general')->get()->keyBy('key');

        return Inertia::render('Settings/General', [
            'settings' => $settings
        ]);
    }

    /**
     * Update general settings
     */
    public function updateGeneral(Request $request)
    {
        $validated = $request->validate([
            'app_name' => 'required|string|max:255',
            'app_description' => 'nullable|string',
            'company_name' => 'nullable|string|max:255',
            'company_address' => 'nullable|string',
            'company_phone' => 'nullable|string|max:50',
            'company_email' => 'nullable|email|max:255',
            'company_website' => 'nullable|url|max:255',
            'tax_office' => 'nullable|string|max:255',
            'tax_number' => 'nullable|string|max:50',
            'default_currency' => 'nullable|string|max:3',
            'default_language' => 'nullable|string|max:5',
            'timezone' => 'nullable|string|max:50',
            'date_format' => 'nullable|string|max:50',
            'time_format' => 'nullable|string|max:50',
        ]);

        DB::beginTransaction();
        try {
            foreach ($validated as $key => $value) {
                Setting::set($key, $value, [
                    'group' => 'general',
                    'type' => 'text'
                ]);
            }

            DB::commit();

            return back()->with('success', 'Genel ayarlar başarıyla güncellendi.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Ayarlar güncellenirken bir hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Display system settings
     */
    public function system()
    {
        $this->ensureSystemSettings();

        $settings = Setting::byGroup('system')->get()->keyBy('key');

        return Inertia::render('Settings/System', [
            'settings' => $settings
        ]);
    }

    /**
     * Update system settings
     */
    public function updateSystem(Request $request)
    {
        $validated = $request->validate([
            'maintenance_mode' => 'boolean',
            'debug_mode' => 'boolean',
            'cache_enabled' => 'boolean',
            'pagination_per_page' => 'nullable|integer|min:5|max:100',
            'session_lifetime' => 'nullable|integer|min:5|max:1440',
            'max_upload_size' => 'nullable|integer|min:1|max:100',
        ]);

        DB::beginTransaction();
        try {
            foreach ($validated as $key => $value) {
                $type = is_bool($value) ? 'boolean' : (is_int($value) ? 'integer' : 'text');

                Setting::set($key, $value, [
                    'group' => 'system',
                    'type' => $type
                ]);
            }

            DB::commit();

            return back()->with('success', 'Sistem ayarları başarıyla güncellendi.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Ayarlar güncellenirken bir hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Display email settings
     */
    public function email()
    {
        $this->ensureEmailSettings();

        $settings = Setting::byGroup('email')->get()->keyBy('key');

        return Inertia::render('Settings/Email', [
            'settings' => $settings
        ]);
    }

    /**
     * Update email settings
     */
    public function updateEmail(Request $request)
    {
        $validated = $request->validate([
            'mail_driver' => 'required|in:smtp,sendmail,mailgun,ses,postmark',
            'mail_host' => 'nullable|string|max:255',
            'mail_port' => 'nullable|integer',
            'mail_username' => 'nullable|string|max:255',
            'mail_password' => 'nullable|string|max:255',
            'mail_encryption' => 'nullable|in:tls,ssl',
            'mail_from_address' => 'required|email',
            'mail_from_name' => 'required|string|max:255',
        ]);

        DB::beginTransaction();
        try {
            foreach ($validated as $key => $value) {
                Setting::set($key, $value, [
                    'group' => 'email',
                    'type' => in_array($key, ['mail_port']) ? 'integer' : 'text'
                ]);
            }

            DB::commit();

            return back()->with('success', 'E-posta ayarları başarıyla güncellendi.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Ayarlar güncellenirken bir hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Ensure general settings exist with defaults
     */
    private function ensureGeneralSettings()
    {
        $defaults = [
            'app_name' => ['value' => config('app.name', 'Askom'), 'type' => 'text', 'description' => 'Uygulama Adı'],
            'app_description' => ['value' => '', 'type' => 'textarea', 'description' => 'Uygulama Açıklaması'],
            'company_name' => ['value' => '', 'type' => 'text', 'description' => 'Firma Adı'],
            'company_address' => ['value' => '', 'type' => 'textarea', 'description' => 'Firma Adresi'],
            'company_phone' => ['value' => '', 'type' => 'text', 'description' => 'Firma Telefonu'],
            'company_email' => ['value' => '', 'type' => 'email', 'description' => 'Firma E-posta'],
            'company_website' => ['value' => '', 'type' => 'text', 'description' => 'Firma Web Sitesi'],
            'tax_office' => ['value' => '', 'type' => 'text', 'description' => 'Vergi Dairesi'],
            'tax_number' => ['value' => '', 'type' => 'text', 'description' => 'Vergi Numarası'],
            'default_currency' => ['value' => 'TRY', 'type' => 'text', 'description' => 'Varsayılan Para Birimi'],
            'default_language' => ['value' => 'tr', 'type' => 'text', 'description' => 'Varsayılan Dil'],
            'timezone' => ['value' => 'Europe/Istanbul', 'type' => 'text', 'description' => 'Saat Dilimi'],
            'date_format' => ['value' => 'd/m/Y', 'type' => 'text', 'description' => 'Tarih Formatı'],
            'time_format' => ['value' => 'H:i', 'type' => 'text', 'description' => 'Saat Formatı'],
        ];

        foreach ($defaults as $key => $data) {
            if (!Setting::where('key', $key)->exists()) {
                Setting::create([
                    'key' => $key,
                    'value' => $data['value'],
                    'type' => $data['type'],
                    'group' => 'general',
                    'description' => $data['description'],
                    'is_public' => true
                ]);
            }
        }
    }

    /**
     * Ensure system settings exist with defaults
     */
    private function ensureSystemSettings()
    {
        $defaults = [
            'maintenance_mode' => ['value' => '0', 'type' => 'boolean', 'description' => 'Bakım Modu'],
            'debug_mode' => ['value' => config('app.debug') ? '1' : '0', 'type' => 'boolean', 'description' => 'Hata Ayıklama Modu'],
            'cache_enabled' => ['value' => '1', 'type' => 'boolean', 'description' => 'Önbellek Etkin'],
            'pagination_per_page' => ['value' => '15', 'type' => 'integer', 'description' => 'Sayfa Başına Kayıt'],
            'session_lifetime' => ['value' => '120', 'type' => 'integer', 'description' => 'Oturum Süresi (dakika)'],
            'max_upload_size' => ['value' => '10', 'type' => 'integer', 'description' => 'Maksimum Yükleme Boyutu (MB)'],
        ];

        foreach ($defaults as $key => $data) {
            if (!Setting::where('key', $key)->exists()) {
                Setting::create([
                    'key' => $key,
                    'value' => $data['value'],
                    'type' => $data['type'],
                    'group' => 'system',
                    'description' => $data['description'],
                    'is_public' => false
                ]);
            }
        }
    }

    /**
     * Ensure email settings exist with defaults
     */
    private function ensureEmailSettings()
    {
        $defaults = [
            'mail_driver' => ['value' => config('mail.default', 'smtp'), 'type' => 'text', 'description' => 'E-posta Sürücüsü'],
            'mail_host' => ['value' => config('mail.mailers.smtp.host', 'smtp.gmail.com'), 'type' => 'text', 'description' => 'SMTP Sunucusu'],
            'mail_port' => ['value' => config('mail.mailers.smtp.port', 587), 'type' => 'integer', 'description' => 'SMTP Port'],
            'mail_username' => ['value' => config('mail.mailers.smtp.username', ''), 'type' => 'text', 'description' => 'SMTP Kullanıcı Adı'],
            'mail_password' => ['value' => '', 'type' => 'text', 'description' => 'SMTP Şifre'],
            'mail_encryption' => ['value' => config('mail.mailers.smtp.encryption', 'tls'), 'type' => 'text', 'description' => 'Şifreleme'],
            'mail_from_address' => ['value' => config('mail.from.address', 'noreply@askom.test'), 'type' => 'email', 'description' => 'Gönderen E-posta'],
            'mail_from_name' => ['value' => config('mail.from.name', 'Askom'), 'type' => 'text', 'description' => 'Gönderen Adı'],
        ];

        foreach ($defaults as $key => $data) {
            if (!Setting::where('key', $key)->exists()) {
                Setting::create([
                    'key' => $key,
                    'value' => $data['value'],
                    'type' => $data['type'],
                    'group' => 'email',
                    'description' => $data['description'],
                    'is_public' => false
                ]);
            }
        }
    }

    /**
     * Display company settings
     */
    public function company()
    {
        $this->ensureCompanySettings();

        $settings = Setting::byGroup('company')->get()->keyBy('key');

        return Inertia::render('Settings/Company', [
            'settings' => $settings
        ]);
    }

    /**
     * Update company settings
     */
    public function updateCompany(Request $request)
    {
        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'company_legal_name' => 'nullable|string|max:255',
            'company_address' => 'nullable|string',
            'company_city' => 'nullable|string|max:100',
            'company_state' => 'nullable|string|max:100',
            'company_postal_code' => 'nullable|string|max:20',
            'company_country' => 'nullable|string|max:100',
            'company_phone' => 'nullable|string|max:50',
            'company_fax' => 'nullable|string|max:50',
            'company_email' => 'nullable|email|max:255',
            'company_website' => 'nullable|url|max:255',
            'tax_office' => 'nullable|string|max:255',
            'tax_number' => 'nullable|string|max:50',
            'trade_registry_number' => 'nullable|string|max:50',
            'mersis_number' => 'nullable|string|max:50',
            'company_logo' => 'nullable|string|max:255',
            'company_favicon' => 'nullable|string|max:255',
            'bank_name' => 'nullable|string|max:255',
            'bank_branch' => 'nullable|string|max:255',
            'bank_account_name' => 'nullable|string|max:255',
            'bank_account_number' => 'nullable|string|max:50',
            'iban' => 'nullable|string|max:50',
            'swift_code' => 'nullable|string|max:20',
        ]);

        DB::beginTransaction();
        try {
            foreach ($validated as $key => $value) {
                Setting::set($key, $value, [
                    'group' => 'company',
                    'type' => 'text'
                ]);
            }

            DB::commit();

            return back()->with('success', 'Firma ayarları başarıyla güncellendi.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Ayarlar güncellenirken bir hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Ensure company settings exist with defaults
     */
    private function ensureCompanySettings()
    {
        $defaults = [
            'company_name' => ['value' => '', 'type' => 'text', 'description' => 'Firma Adı'],
            'company_legal_name' => ['value' => '', 'type' => 'text', 'description' => 'Yasal Firma Adı'],
            'company_address' => ['value' => '', 'type' => 'textarea', 'description' => 'Firma Adresi'],
            'company_city' => ['value' => '', 'type' => 'text', 'description' => 'Şehir'],
            'company_state' => ['value' => '', 'type' => 'text', 'description' => 'İlçe/Bölge'],
            'company_postal_code' => ['value' => '', 'type' => 'text', 'description' => 'Posta Kodu'],
            'company_country' => ['value' => 'Türkiye', 'type' => 'text', 'description' => 'Ülke'],
            'company_phone' => ['value' => '', 'type' => 'text', 'description' => 'Telefon'],
            'company_fax' => ['value' => '', 'type' => 'text', 'description' => 'Faks'],
            'company_email' => ['value' => '', 'type' => 'email', 'description' => 'E-posta'],
            'company_website' => ['value' => '', 'type' => 'text', 'description' => 'Web Sitesi'],
            'tax_office' => ['value' => '', 'type' => 'text', 'description' => 'Vergi Dairesi'],
            'tax_number' => ['value' => '', 'type' => 'text', 'description' => 'Vergi Numarası'],
            'trade_registry_number' => ['value' => '', 'type' => 'text', 'description' => 'Ticaret Sicil Numarası'],
            'mersis_number' => ['value' => '', 'type' => 'text', 'description' => 'MERSİS Numarası'],
            'company_logo' => ['value' => '', 'type' => 'text', 'description' => 'Firma Logosu'],
            'company_favicon' => ['value' => '', 'type' => 'text', 'description' => 'Favicon'],
            'bank_name' => ['value' => '', 'type' => 'text', 'description' => 'Banka Adı'],
            'bank_branch' => ['value' => '', 'type' => 'text', 'description' => 'Şube'],
            'bank_account_name' => ['value' => '', 'type' => 'text', 'description' => 'Hesap Adı'],
            'bank_account_number' => ['value' => '', 'type' => 'text', 'description' => 'Hesap Numarası'],
            'iban' => ['value' => '', 'type' => 'text', 'description' => 'IBAN'],
            'swift_code' => ['value' => '', 'type' => 'text', 'description' => 'SWIFT Kodu'],
        ];

        foreach ($defaults as $key => $data) {
            if (!Setting::where('key', $key)->exists()) {
                Setting::create([
                    'key' => $key,
                    'value' => $data['value'],
                    'type' => $data['type'],
                    'group' => 'company',
                    'description' => $data['description'],
                    'is_public' => true
                ]);
            }
        }
    }
}
