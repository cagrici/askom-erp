<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class SalesOffer extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'offer_no',
        'offer_date',
        'valid_until_date',
        'status',
        'approval_token',
        'approval_token_expires_at',
        'email_sent_at',
        'email_sent_to',
        'email_attachment_type',
        'email_sent_count',
        'customer_approved_at',
        'customer_approved_ip',
        'customer_approval_notes',
        'entity_id',
        'customer_name',
        'customer_phone',
        'customer_email',
        'customer_address',
        'customer_tax_no',
        'subtotal',
        'discount_rate',
        'discount_amount',
        'tax_rate',
        'tax_amount',
        'total_amount',
        'currency_id',
        'exchange_rate',
        'notes',
        'customer_notes',
        'terms_conditions',
        'created_by',
        'sales_person_id',
        'approved_by',
        'approved_at',
        'rejected_reason',
        'converted_order_id',
        'converted_at',
        'converted_by',
        'location_id',
        'pipeline_stage_id',
        'lead_id',
        'weighted_value',
        'stage_entered_at',
        'days_in_stage',
    ];

    protected $casts = [
        'offer_date' => 'date',
        'valid_until_date' => 'date',
        'approved_at' => 'datetime',
        'converted_at' => 'datetime',
        'approval_token_expires_at' => 'datetime',
        'email_sent_at' => 'datetime',
        'customer_approved_at' => 'datetime',
        'email_sent_count' => 'integer',
        'subtotal' => 'decimal:2',
        'discount_rate' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'exchange_rate' => 'decimal:4',
        'weighted_value' => 'decimal:2',
        'stage_entered_at' => 'datetime',
        'days_in_stage' => 'integer',
    ];

    protected $appends = [
        'customer_display_name',
        'status_label',
        'formatted_total',
    ];

    /**
     * Boot function for generating offer number
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($offer) {
            if (empty($offer->offer_no)) {
                $offer->offer_no = static::generateOfferNumber();
            }
        });
    }

    /**
     * Generate unique offer number: TKL-2025-0001
     * Includes soft-deleted records to prevent duplicate key errors
     */
    public static function generateOfferNumber(): string
    {
        $year = now()->year;
        $prefix = "TKL-{$year}-";

        // withTrashed() ile silinmiş kayıtları da dahil et
        // Bu sayede silinmiş bir kaydın numarası tekrar kullanılmaz
        $lastOffer = static::withTrashed()
            ->where('offer_no', 'like', $prefix . '%')
            ->orderByRaw("CAST(SUBSTRING(offer_no, -4) AS UNSIGNED) DESC")
            ->first();

        if ($lastOffer) {
            $lastNumber = (int) substr($lastOffer->offer_no, -4);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return $prefix . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }

    /**
     * İlişkiler
     */
    public function items(): HasMany
    {
        return $this->hasMany(SalesOfferItem::class)->orderBy('sort_order');
    }

    public function entity(): BelongsTo
    {
        return $this->belongsTo(CurrentAccount::class, 'entity_id');
    }

    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function salesPerson(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sales_person_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function converter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'converted_by');
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function convertedOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class, 'converted_order_id');
    }

    public function pipelineStage(): BelongsTo
    {
        return $this->belongsTo(PipelineStage::class);
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function stageHistory(): HasMany
    {
        return $this->hasMany(SalesOfferStageHistory::class)->orderByDesc('created_at');
    }

    public function emailLogs(): HasMany
    {
        return $this->hasMany(OfferEmailLog::class, 'sales_offer_id')->orderByDesc('created_at');
    }

    public function activities(): \Illuminate\Database\Eloquent\Relations\MorphMany
    {
        return $this->morphMany(CrmActivity::class, 'subject')->orderByDesc('activity_date');
    }

    public function tasks(): \Illuminate\Database\Eloquent\Relations\MorphMany
    {
        return $this->morphMany(CrmTask::class, 'subject')->orderBy('due_date');
    }

    /**
     * Scopes
     */
    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    public function scopeSent($query)
    {
        return $query->where('status', 'sent');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeConverted($query)
    {
        return $query->where('status', 'converted_to_order');
    }

    public function scopeExpired($query)
    {
        return $query->where('status', '!=', 'converted_to_order')
            ->where('valid_until_date', '<', now());
    }

    /**
     * Accessor for customer display name
     */
    public function getCustomerDisplayNameAttribute(): string
    {
        if ($this->entity_id && $this->entity) {
            return $this->entity->title ?? $this->customer_name ?? 'N/A';
        }
        return $this->customer_name ?? 'N/A';
    }

    /**
     * Get all available statuses
     */
    public static function getStatuses(): array
    {
        return [
            'draft' => 'Taslak',
            'sent' => 'Gönderildi',
            'accepted' => 'Kabul Edildi',
            'rejected' => 'Reddedildi',
            'approved' => 'Onaylandı',
            'converted_to_order' => 'Siparişe Dönüştürüldü',
            'expired' => 'Süresi Dolmuş',
        ];
    }

    /**
     * Get status label
     */
    public function getStatusLabelAttribute(): string
    {
        $statuses = self::getStatuses();
        return $statuses[$this->status] ?? $this->status;
    }

    /**
     * Accessor for formatted total
     */
    public function getFormattedTotalAttribute(): string
    {
        $symbol = $this->currency ? ($this->currency->cur_symbol ?: $this->currency->cur_code) : 'TL';
        return number_format($this->total_amount, 2) . ' ' . $symbol;
    }

    /**
     * Check if offer is expired
     */
    public function isExpired(): bool
    {
        return $this->status !== 'converted_to_order'
            && $this->valid_until_date < now();
    }

    /**
     * Check if offer can be converted to order
     */
    public function canConvertToOrder(): bool
    {
        return in_array($this->status, ['approved', 'sent'])
            && !$this->isExpired()
            && !$this->converted_order_id;
    }

    /**
     * Calculate totals from items
     */
    public function calculateTotals(): void
    {
        // Kalem bazlı net toplamlar (KDV hariç)
        $itemNetTotal = 0;
        $itemTaxTotal = 0;
        foreach ($this->items as $item) {
            $itemNetTotal += ($item->total_amount - $item->tax_amount);
            $itemTaxTotal += $item->tax_amount;
        }

        $this->subtotal = round($itemNetTotal, 2);

        if ($this->discount_rate > 0) {
            $this->discount_amount = round(($this->subtotal * $this->discount_rate) / 100, 2);
        }

        $subtotalAfterDiscount = $this->subtotal - ($this->discount_amount ?? 0);

        // Teklif genelinde indirim varsa KDV'yi yeniden hesapla
        if (($this->discount_amount ?? 0) > 0 && $this->subtotal > 0) {
            $this->tax_amount = round(($subtotalAfterDiscount * ($this->tax_rate ?? 20)) / 100, 2);
        } else {
            $this->tax_amount = round($itemTaxTotal, 2);
        }

        $this->total_amount = round($subtotalAfterDiscount + $this->tax_amount, 2);
    }

    /**
     * Update pipeline stage and log history
     */
    public function updatePipelineStage(PipelineStage $newStage, ?string $notes = null, ?int $changedBy = null): void
    {
        $oldStageId = $this->pipeline_stage_id;

        // Create history record
        SalesOfferStageHistory::create([
            'sales_offer_id' => $this->id,
            'from_stage_id' => $oldStageId,
            'to_stage_id' => $newStage->id,
            'notes' => $notes,
            'changed_by' => $changedBy ?? auth()->id(),
        ]);

        // Calculate weighted value
        $weightedValue = $this->total_amount * ($newStage->win_probability / 100);

        // Update offer
        $this->update([
            'pipeline_stage_id' => $newStage->id,
            'weighted_value' => $weightedValue,
            'stage_entered_at' => now(),
            'days_in_stage' => 0,
        ]);
    }

    /**
     * Calculate weighted value based on current stage probability
     */
    public function calculateWeightedValue(): float
    {
        if (!$this->pipelineStage) {
            return 0;
        }
        return $this->total_amount * ($this->pipelineStage->win_probability / 100);
    }

    /**
     * Generate a unique approval token for customer approval via link
     */
    public function generateApprovalToken(int $expiryDays = 30): string
    {
        $token = bin2hex(random_bytes(32));

        $this->update([
            'approval_token' => $token,
            'approval_token_expires_at' => now()->addDays($expiryDays),
        ]);

        return $token;
    }

    /**
     * Get the public approval URL
     */
    public function getApprovalUrl(): ?string
    {
        if (!$this->approval_token) {
            return null;
        }

        return route('offers.public.approve', ['token' => $this->approval_token]);
    }

    /**
     * Check if the approval token is valid
     */
    public function isApprovalTokenValid(): bool
    {
        if (!$this->approval_token) {
            return false;
        }

        if ($this->approval_token_expires_at && $this->approval_token_expires_at < now()) {
            return false;
        }

        // Can't approve if already approved, rejected, or converted
        if (in_array($this->status, ['approved', 'accepted', 'rejected', 'converted_to_order'])) {
            return false;
        }

        return true;
    }

    /**
     * Approve offer via customer link
     */
    public function approveByCustomer(?string $notes = null, ?string $ip = null): bool
    {
        if (!$this->isApprovalTokenValid()) {
            return false;
        }

        $this->update([
            'status' => 'accepted',
            'customer_approved_at' => now(),
            'customer_approved_ip' => $ip,
            'customer_approval_notes' => $notes,
        ]);

        return true;
    }

    /**
     * Get email to send offer to
     */
    public function getRecipientEmail(): ?string
    {
        return $this->customer_email ?? $this->entity?->email;
    }

    /**
     * Record email sent
     */
    public function recordEmailSent(string $email, string $attachmentType, ?string $customMessage = null, ?int $sentBy = null): OfferEmailLog
    {
        $log = OfferEmailLog::create([
            'sales_offer_id' => $this->id,
            'sent_to' => $email,
            'attachment_type' => $attachmentType,
            'custom_message' => $customMessage,
            'status' => 'sent',
            'sent_by' => $sentBy ?? auth()->id(),
        ]);

        $this->update([
            'email_sent_at' => now(),
            'email_sent_to' => $email,
            'email_attachment_type' => $attachmentType,
            'email_sent_count' => $this->email_sent_count + 1,
            'status' => $this->status === 'draft' ? 'sent' : $this->status,
        ]);

        return $log;
    }

    /**
     * Record failed email attempt
     */
    public function recordEmailFailed(string $email, string $attachmentType, string $errorMessage, ?string $customMessage = null): void
    {
        OfferEmailLog::create([
            'sales_offer_id' => $this->id,
            'sent_to' => $email,
            'attachment_type' => $attachmentType,
            'custom_message' => $customMessage,
            'status' => 'failed',
            'error_message' => $errorMessage,
            'sent_by' => auth()->id(),
        ]);
    }
}
