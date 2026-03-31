<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class CurrentAccount extends Model
{
    use HasFactory, SoftDeletes;

    // Customer Groups/Segments
    const CUSTOMER_GROUPS = [
        'retail' => 'Perakende',
        'wholesale' => 'Toptan',
        'corporate' => 'Kurumsal',
        'premium' => 'Premium',
        'government' => 'Kamu',
        'export' => 'İhracat',
        'dealer' => 'Bayi',
        'distributor' => 'Distribütör'
    ];

    protected $fillable = [
        'id',  'account_code', 'title', 'account_type', 'person_type',
        'tax_number', 'tax_office', 'tax_office_id', 'mersys_no', 'trade_registry_no',
        'employee_count', 'annual_revenue', 'establishment_year',
        'address', 'district', 'district_id', 'city', 'city_id', 'postal_code', 'country', 'country_id',
        'phone_1', 'phone_2', 'mobile', 'fax', 'email', 'website',
        'contact_person', 'contact_title', 'contact_phone', 'contact_email', 'additional_contacts',
        'credit_limit', 'payment_term_id', 'payment_method_id', 'payment_term_days', 'discount_rate', 'currency', 'risk_limit',
        'e_invoice_enabled', 'e_invoice_address', 'e_archive_enabled', 'gib_alias',
        'customer_account_code', 'supplier_account_code', 'personnel_account_code',
        'bank_accounts', 'category', 'sector', 'region', 'sales_representative_id',
        'lead_source', 'customer_segment', 'preferred_language', 'communication_preferences', 'crm_notes',
        'is_active', 'is_blocked', 'block_reason', 'requires_approval',
        'notes', 'custom_fields', 'tags', 'external_code', 'external_system',
        'last_transaction_date', 'current_balance', 'total_receivables',
        'total_payables', 'overdue_amount', 'overdue_days', 'logo_id', 'logo_firm_no', 'logo_synced_at', 'address_line_1', 'address_line_2',
        'created_by', 'updated_by'
    ];

    protected $casts = [
        'bank_accounts' => 'array',
        'custom_fields' => 'array',
        'tags' => 'array',
        'additional_contacts' => 'array',
        'communication_preferences' => 'array',
        'credit_limit' => 'decimal:2',
        'discount_rate' => 'decimal:2',
        'risk_limit' => 'decimal:2',
        'annual_revenue' => 'decimal:2',
        'current_balance' => 'decimal:2',
        'total_receivables' => 'decimal:2',
        'total_payables' => 'decimal:2',
        'overdue_amount' => 'decimal:2',
        'employee_count' => 'integer',
        'establishment_year' => 'integer',
        'e_invoice_enabled' => 'boolean',
        'e_archive_enabled' => 'boolean',
        'is_active' => 'boolean',
        'is_blocked' => 'boolean',
        'requires_approval' => 'boolean',
        'last_transaction_date' => 'datetime',
    ];

    /**
     * Relationships
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function salesRepresentative(): BelongsTo
    {
        return $this->belongsTo(SalesRepresentative::class);
    }

    // İlgili fatura/belge ilişkileri eklenebilir
    // public function invoices(): HasMany
    // {
    //     return $this->hasMany(Invoice::class);
    // }

    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class, 'supplier_id');
    }

    public function purchaseRequests(): HasMany
    {
        return $this->hasMany(PurchaseRequestItem::class, 'preferred_supplier_id');
    }

    public function deliveryAddresses(): HasMany
    {
        return $this->hasMany(CurrentAccountDeliveryAddress::class);
    }

    public function activeDeliveryAddresses(): HasMany
    {
        return $this->hasMany(CurrentAccountDeliveryAddress::class)->active();
    }

    public function defaultDeliveryAddress()
    {
        return $this->hasOne(CurrentAccountDeliveryAddress::class)->where('is_default', true);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(CurrentAccountTransaction::class);
    }

    /**
     * Scopes
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeNotBlocked($query)
    {
        return $query->where('is_blocked', false);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('account_type', $type);
    }

    public function scopeCustomers($query)
    {
        return $query->whereIn('account_type', ['customer', 'both']);
    }

    public function scopeSuppliers($query)
    {
        return $query->whereIn('account_type', ['supplier', 'both']);
    }

    /**
     * Türkçe karakter duyarlı arama (ı↔I, i↔İ eşleşmesi)
     * Kullanım: CurrentAccount::turkishSearch(['title', 'account_code'], $search)
     */
    public function scopeTurkishSearch($query, array $columns, string $search)
    {
        $normalized = str_replace(['ı', 'İ'], ['i', 'i'], mb_strtolower($search, 'UTF-8'));

        return $query->where(function ($q) use ($columns, $normalized) {
            foreach ($columns as $column) {
                $q->orWhereRaw(
                    "LOWER(REPLACE(REPLACE({$column}, 'ı', 'i'), 'İ', 'i')) LIKE ?",
                    ["%{$normalized}%"]
                );
            }
        });
    }

    public function scopePersonnel($query)
    {
        return $query->where('account_type', 'personnel');
    }

    public function scopeCorporate($query)
    {
        return $query->where('person_type', 'corporate');
    }

    public function scopeIndividual($query)
    {
        return $query->where('person_type', 'individual');
    }

    public function scopeByCity($query, $city)
    {
        return $query->where('city', $city);
    }

    public function scopeWithBalance($query)
    {
        return $query->where('current_balance', '!=', 0);
    }

    public function scopeOverdue($query)
    {
        return $query->where('overdue_amount', '>', 0);
    }

    public function scopeEInvoiceEnabled($query)
    {
        return $query->where('e_invoice_enabled', true);
    }

    /**
     * Attribute Accessors
     */
    public function getAccountTypeTextAttribute()
    {
        $types = [
            'customer' => 'Müşteri',
            'supplier' => 'Tedarikçi',
            'both' => 'Müşteri/Tedarikçi',
            'personnel' => 'Personel',
            'shareholder' => 'Ortak',
            'other' => 'Diğer'
        ];

        return $types[$this->account_type] ?? $this->account_type;
    }

    public function getPersonTypeTextAttribute()
    {
        return $this->person_type === 'individual' ? 'Gerçek Kişi' : 'Tüzel Kişi';
    }

    public function getStatusTextAttribute()
    {
        if ($this->is_blocked) {
            return 'Blokeli';
        }

        return $this->is_active ? 'Aktif' : 'Pasif';
    }

    public function getStatusColorAttribute()
    {
        if ($this->is_blocked) {
            return 'danger';
        }

        return $this->is_active ? 'success' : 'secondary';
    }

    public function getBalanceColorAttribute()
    {
        if ($this->current_balance > 0) {
            return 'success'; // Alacak (yeşil)
        } elseif ($this->current_balance < 0) {
            return 'danger'; // Borç (kırmızı)
        }

        return 'secondary'; // Sıfır bakiye
    }

    public function getFormattedBalanceAttribute()
    {
        $balance = abs($this->current_balance);
        $formatted = number_format($balance, 2, ',', '.') . ' ' . $this->currency;

        if ($this->current_balance > 0) {
            return $formatted . ' A'; // Alacak
        } elseif ($this->current_balance < 0) {
            return $formatted . ' B'; // Borç
        }

        return $formatted;
    }

    public function getRiskStatusAttribute()
    {
        if ($this->risk_limit <= 0) {
            return 'no_limit';
        }

        $usage = ($this->total_receivables / $this->risk_limit) * 100;

        if ($usage >= 100) {
            return 'exceeded';
        } elseif ($usage >= 90) {
            return 'critical';
        } elseif ($usage >= 75) {
            return 'warning';
        }

        return 'safe';
    }

    public function getRiskStatusColorAttribute()
    {
        $colors = [
            'exceeded' => 'danger',
            'critical' => 'warning',
            'warning' => 'info',
            'safe' => 'success',
            'no_limit' => 'secondary'
        ];

        return $colors[$this->risk_status];
    }

    /**
     * Business Logic Methods
     */
    public function updateBalance()
    {
        // Bu method fatura/ödeme işlemlerinde bakiye güncelleme için kullanılacak
        // Şimdilik placeholder
        return $this;
    }

    public function isCustomer(): bool
    {
        return in_array($this->account_type, ['customer', 'both']);
    }

    public function isSupplier(): bool
    {
        return in_array($this->account_type, ['supplier', 'both']);
    }

    public function canCreateInvoice(): bool
    {
        return $this->is_active && !$this->is_blocked && $this->isCustomer();
    }

    public function canReceivePayment(): bool
    {
        return $this->is_active && !$this->is_blocked;
    }

    public function hasOverduePayments(): bool
    {
        return $this->overdue_amount > 0 && $this->overdue_days > 0;
    }

    public function isWithinCreditLimit(float $amount = 0): bool
    {
        if ($this->credit_limit <= 0) {
            return true; // Limit yok
        }

        return ($this->total_receivables + $amount) <= $this->credit_limit;
    }

    public function getAvailableCreditAttribute(): float
    {
        if ($this->credit_limit <= 0) {
            return 0;
        }

        return max(0, $this->credit_limit - $this->total_receivables);
    }

    /**
     * Auto-generate account code
     */
    public static function generateAccountCode(string $type, string $personType): string
    {
        $prefixes = [
            'customer' => '120',
            'supplier' => '320',
            'personnel' => '335',
            'shareholder' => '340',
            'other' => '360'
        ];

        $prefix = $prefixes[$type] ?? '120';

        // Son kullanılan kodu bul
        $lastAccount = static::where('account_code', 'like', $prefix . '.%')
            ->orderBy('account_code', 'desc')
            ->first();

        if ($lastAccount) {
            $lastNumber = (int) substr($lastAccount->account_code, -3);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return $prefix . '.' . str_pad($newNumber, 3, '0', STR_PAD_LEFT);
    }

    /**
     * Boot method
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($account) {
            if (empty($account->account_code)) {
                $account->account_code = self::generateAccountCode(
                    $account->account_type,
                    $account->person_type
                );
            }
        });
    }
}
