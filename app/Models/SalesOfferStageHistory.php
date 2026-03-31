<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalesOfferStageHistory extends Model
{
    protected $table = 'sales_offer_stage_history';

    protected $fillable = [
        'sales_offer_id',
        'from_stage_id',
        'to_stage_id',
        'notes',
        'changed_by',
    ];

    /**
     * Relationships
     */
    public function offer(): BelongsTo
    {
        return $this->belongsTo(SalesOffer::class, 'sales_offer_id');
    }

    public function fromStage(): BelongsTo
    {
        return $this->belongsTo(PipelineStage::class, 'from_stage_id');
    }

    public function toStage(): BelongsTo
    {
        return $this->belongsTo(PipelineStage::class, 'to_stage_id');
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
