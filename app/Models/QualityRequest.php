<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class QualityRequest extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'request_number',
        'title',
        'description',
        'type', // 'request' or 'complaint'
        'status',
        'priority',
        'client_id',
        'product_id',
        'created_by',
        'due_date',
        'last_activity_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'due_date' => 'date',
        'last_activity_at' => 'datetime',
    ];

    /**
     * Get the creator of the request.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the users assigned to this request.
     */
    public function assignedUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'quality_request_user', 'quality_request_id', 'user_id')
            ->withTimestamps();
    }

    /**
     * Get the client associated with the request.
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'client_id');
    }

    /**
     * Get the product associated with the request.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
