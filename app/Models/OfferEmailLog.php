<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OfferEmailLog extends Model
{
    protected $table = 'sales_offer_email_logs';

    protected $fillable = [
        'sales_offer_id',
        'sent_to',
        'attachment_type',
        'custom_message',
        'status',
        'error_message',
        'tracking_hash',
        'opened_at',
        'open_count',
        'sent_by',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'opened_at' => 'datetime',
        'open_count' => 'integer',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($log) {
            if (empty($log->tracking_hash) && $log->status === 'sent') {
                $log->tracking_hash = bin2hex(random_bytes(32));
            }
        });
    }

    public function offer(): BelongsTo
    {
        return $this->belongsTo(SalesOffer::class, 'sales_offer_id');
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sent_by');
    }

    public function recordOpen(): void
    {
        $this->increment('open_count');
        if (!$this->opened_at) {
            $this->update(['opened_at' => now()]);
        }
    }

    public function getTrackingPixelUrl(): string
    {
        return route('email.tracking.pixel', ['hash' => $this->tracking_hash]);
    }
}
