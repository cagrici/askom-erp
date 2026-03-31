<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Carrier extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'carrier_code',
        'company_name',
        'trade_name',
        'contact_person',
        'phone',
        'mobile',
        'email',
        'website',
        'address',
        'city',
        'state',
        'postal_code',
        'country',
        'tax_office',
        'tax_number',
        'registration_number',
        'carrier_type',
        'service_areas',
        'vehicle_types',
        'fleet_size',
        'rating',
        'total_shipments',
        'on_time_deliveries',
        'on_time_percentage',
        'currency',
        'base_rate_per_km',
        'min_charge',
        'pricing_notes',
        'insurance_company',
        'insurance_policy_number',
        'insurance_expiry_date',
        'certifications',
        'contract_type',
        'contract_start_date',
        'contract_end_date',
        'contract_terms',
        'payment_terms_days',
        'payment_method',
        'bank_name',
        'bank_account_name',
        'bank_account_number',
        'iban',
        'swift_code',
        'status',
        'is_preferred',
        'is_verified',
        'priority_level',
        'notes',
        'special_requirements',
        'working_hours',
        'last_shipment_date',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'service_areas' => 'array',
        'vehicle_types' => 'array',
        'certifications' => 'array',
        'working_hours' => 'array',
        'rating' => 'decimal:2',
        'on_time_percentage' => 'decimal:2',
        'base_rate_per_km' => 'decimal:2',
        'min_charge' => 'decimal:2',
        'is_preferred' => 'boolean',
        'is_verified' => 'boolean',
        'insurance_expiry_date' => 'date',
        'contract_start_date' => 'date',
        'contract_end_date' => 'date',
        'last_shipment_date' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($carrier) {
            if (empty($carrier->carrier_code)) {
                $carrier->carrier_code = static::generateCarrierCode();
            }
        });
    }

    /**
     * Generate unique carrier code
     */
    public static function generateCarrierCode(): string
    {
        $prefix = 'CAR';
        $date = now()->format('y');

        $lastCarrier = static::whereRaw("carrier_code LIKE '{$prefix}-{$date}-%'")
            ->orderBy('carrier_code', 'desc')
            ->first();

        if ($lastCarrier) {
            $lastNumber = (int) substr($lastCarrier->carrier_code, -4);
            $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $newNumber = '0001';
        }

        return "{$prefix}-{$date}-{$newNumber}";
    }

    /**
     * Relationships
     */
    public function shipments(): HasMany
    {
        return $this->hasMany(Shipment::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Scopes
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopePreferred($query)
    {
        return $query->where('is_preferred', true);
    }

    public function scopeVerified($query)
    {
        return $query->where('is_verified', true);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('carrier_type', $type);
    }

    public function scopeInsuranceExpiringSoon($query, $days = 30)
    {
        return $query->whereNotNull('insurance_expiry_date')
            ->whereRaw('DATEDIFF(insurance_expiry_date, NOW()) BETWEEN 0 AND ?', [$days]);
    }

    public function scopeContractExpiringSoon($query, $days = 30)
    {
        return $query->whereNotNull('contract_end_date')
            ->whereRaw('DATEDIFF(contract_end_date, NOW()) BETWEEN 0 AND ?', [$days]);
    }

    /**
     * Accessors
     */
    public function getStatusTextAttribute(): string
    {
        return match($this->status) {
            'active' => 'Aktif',
            'inactive' => 'Pasif',
            'suspended' => 'Askıya Alınmış',
            'blacklisted' => 'Kara Liste',
            default => 'Bilinmiyor'
        };
    }

    public function getCarrierTypeTextAttribute(): string
    {
        return match($this->carrier_type) {
            'road' => 'Karayolu',
            'air' => 'Havayolu',
            'sea' => 'Denizyolu',
            'rail' => 'Demiryolu',
            'multimodal' => 'Çoklu Mod',
            default => 'Bilinmiyor'
        };
    }

    public function getContractTypeTextAttribute(): string
    {
        return match($this->contract_type) {
            'permanent' => 'Sürekli',
            'temporary' => 'Geçici',
            'spot' => 'Spot',
            default => 'Belirtilmemiş'
        };
    }

    public function getPaymentMethodTextAttribute(): string
    {
        return match($this->payment_method) {
            'bank_transfer' => 'Havale/EFT',
            'check' => 'Çek',
            'cash' => 'Nakit',
            'credit_card' => 'Kredi Kartı',
            default => 'Belirtilmemiş'
        };
    }

    /**
     * Check if insurance is expiring soon
     */
    public function isInsuranceExpiringSoon(int $days = 30): bool
    {
        if (!$this->insurance_expiry_date) {
            return false;
        }

        $daysUntilExpiry = now()->diffInDays($this->insurance_expiry_date, false);
        return $daysUntilExpiry >= 0 && $daysUntilExpiry <= $days;
    }

    /**
     * Check if contract is expiring soon
     */
    public function isContractExpiringSoon(int $days = 30): bool
    {
        if (!$this->contract_end_date) {
            return false;
        }

        $daysUntilExpiry = now()->diffInDays($this->contract_end_date, false);
        return $daysUntilExpiry >= 0 && $daysUntilExpiry <= $days;
    }

    /**
     * Calculate and update on-time percentage
     */
    public function updateOnTimePercentage(): void
    {
        if ($this->total_shipments > 0) {
            $this->on_time_percentage = ($this->on_time_deliveries / $this->total_shipments) * 100;
            $this->save();
        }
    }
}
