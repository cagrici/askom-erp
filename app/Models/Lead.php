<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Lead extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'lead_no',
        'company_name',
        'contact_name',
        'contact_title',
        'email',
        'phone',
        'mobile',
        'website',
        'address',
        'city',
        'district',
        'country',
        'postal_code',
        'industry',
        'company_size',
        'estimated_value',
        'currency',
        'lead_stage_id',
        'lead_source_id',
        'lead_score',
        'priority',
        'tags',
        'assigned_to',
        'sales_representative_id',
        'location_id',
        'expected_close_date',
        'last_contact_at',
        'next_follow_up_at',
        'converted_account_id',
        'converted_at',
        'converted_by',
        'notes',
        'requirements',
        'lost_reason',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'estimated_value' => 'decimal:2',
        'lead_score' => 'integer',
        'tags' => 'array',
        'expected_close_date' => 'date',
        'last_contact_at' => 'datetime',
        'next_follow_up_at' => 'datetime',
        'converted_at' => 'datetime',
    ];

    protected $appends = [
        'display_name',
        'priority_label',
        'is_converted',
    ];

    /**
     * Boot function for generating lead number
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($lead) {
            if (empty($lead->lead_no)) {
                $lead->lead_no = static::generateLeadNumber();
            }

            // Set default stage if not provided
            if (empty($lead->lead_stage_id)) {
                $defaultStage = LeadStage::getDefault();
                if ($defaultStage) {
                    $lead->lead_stage_id = $defaultStage->id;
                }
            }
        });
    }

    /**
     * Generate unique lead number: LEAD-2026-0001
     */
    public static function generateLeadNumber(): string
    {
        $year = now()->year;
        $prefix = "LEAD-{$year}-";

        $lastLead = static::where('lead_no', 'like', $prefix . '%')
            ->orderBy('lead_no', 'desc')
            ->first();

        if ($lastLead) {
            $lastNumber = (int) substr($lastLead->lead_no, -4);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return $prefix . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Relationships
     */
    public function stage(): BelongsTo
    {
        return $this->belongsTo(LeadStage::class, 'lead_stage_id');
    }

    public function source(): BelongsTo
    {
        return $this->belongsTo(LeadSource::class, 'lead_source_id');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function salesRepresentative(): BelongsTo
    {
        return $this->belongsTo(SalesRepresentative::class);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function convertedAccount(): BelongsTo
    {
        return $this->belongsTo(CurrentAccount::class, 'converted_account_id');
    }

    public function converter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'converted_by');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function stageHistory(): HasMany
    {
        return $this->hasMany(LeadStageHistory::class)->orderByDesc('created_at');
    }

    public function activities(): MorphMany
    {
        return $this->morphMany(CrmActivity::class, 'subject')->orderByDesc('activity_date');
    }

    public function tasks(): MorphMany
    {
        return $this->morphMany(CrmTask::class, 'subject')->orderBy('due_date');
    }

    public function offers(): HasMany
    {
        return $this->hasMany(SalesOffer::class);
    }

    /**
     * Scopes
     */
    public function scopeActive($query)
    {
        return $query->whereNull('converted_at')
            ->whereHas('stage', fn($q) => $q->where('is_lost', false));
    }

    public function scopeConverted($query)
    {
        return $query->whereNotNull('converted_at');
    }

    public function scopeLost($query)
    {
        return $query->whereHas('stage', fn($q) => $q->where('is_lost', true));
    }

    public function scopeUnassigned($query)
    {
        return $query->whereNull('assigned_to');
    }

    public function scopeAssignedTo($query, $userId)
    {
        return $query->where('assigned_to', $userId);
    }

    public function scopeByStage($query, $stageId)
    {
        return $query->where('lead_stage_id', $stageId);
    }

    public function scopeHot($query)
    {
        return $query->where('priority', 'urgent')
            ->orWhere('priority', 'high');
    }

    public function scopeOverdueFollowUp($query)
    {
        return $query->whereNotNull('next_follow_up_at')
            ->where('next_follow_up_at', '<', now());
    }

    /**
     * Accessors
     */
    public function getDisplayNameAttribute(): string
    {
        if ($this->company_name) {
            return $this->company_name . ' - ' . $this->contact_name;
        }
        return $this->contact_name;
    }

    public function getPriorityLabelAttribute(): string
    {
        $labels = [
            'low' => 'Düşük',
            'medium' => 'Orta',
            'high' => 'Yüksek',
            'urgent' => 'Acil',
        ];
        return $labels[$this->priority] ?? $this->priority;
    }

    public function getIsConvertedAttribute(): bool
    {
        return !is_null($this->converted_at);
    }

    /**
     * Update lead stage and log history
     */
    public function updateStage(LeadStage $newStage, ?string $notes = null, ?int $changedBy = null): void
    {
        $oldStageId = $this->lead_stage_id;

        // Create history record
        LeadStageHistory::create([
            'lead_id' => $this->id,
            'from_stage_id' => $oldStageId,
            'to_stage_id' => $newStage->id,
            'notes' => $notes,
            'changed_by' => $changedBy ?? auth()->id(),
        ]);

        // Update lead
        $this->update([
            'lead_stage_id' => $newStage->id,
            'updated_by' => $changedBy ?? auth()->id(),
        ]);
    }

    /**
     * Convert lead to current account
     */
    public function convertToCurrentAccount(array $additionalData = []): CurrentAccount
    {
        $accountData = array_merge([
            'title' => $this->company_name ?? $this->contact_name,
            'type' => 'customer',
            'person_type' => $this->company_name ? 'corporate' : 'individual',
            'phone' => $this->phone,
            'mobile' => $this->mobile,
            'email' => $this->email,
            'website' => $this->website,
            'address' => $this->address,
            'city' => $this->city,
            'district' => $this->district,
            'country' => $this->country,
            'postal_code' => $this->postal_code,
            'lead_source' => $this->source?->name,
            'sales_representative_id' => $this->sales_representative_id,
            'crm_notes' => $this->notes,
            'location_id' => $this->location_id,
            'created_by' => auth()->id(),
        ], $additionalData);

        $account = CurrentAccount::create($accountData);

        // Update lead
        $this->update([
            'converted_account_id' => $account->id,
            'converted_at' => now(),
            'converted_by' => auth()->id(),
        ]);

        return $account;
    }

    /**
     * Calculate lead score based on various factors
     */
    public function calculateScore(): int
    {
        $score = 0;

        // Has company name (+10)
        if ($this->company_name) $score += 10;

        // Has email (+15)
        if ($this->email) $score += 15;

        // Has phone (+10)
        if ($this->phone || $this->mobile) $score += 10;

        // Has estimated value (+20)
        if ($this->estimated_value > 0) $score += 20;

        // Has website (+5)
        if ($this->website) $score += 5;

        // Stage probability
        if ($this->stage) {
            $score += (int) $this->stage->win_probability;
        }

        // Recent activity (+10)
        if ($this->last_contact_at && $this->last_contact_at->diffInDays(now()) < 7) {
            $score += 10;
        }

        return min($score, 100);
    }

    /**
     * Update lead score
     */
    public function updateScore(): void
    {
        $this->update(['lead_score' => $this->calculateScore()]);
    }
}
