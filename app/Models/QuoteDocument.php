<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuoteDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'quote_id',
        'file_path',
        'file_name',
        'file_type',
        'file_size',
    ];

    public function quote(): BelongsTo
    {
        return $this->belongsTo(Quote::class);
    }
}