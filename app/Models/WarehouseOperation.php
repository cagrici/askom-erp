<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class WarehouseOperation extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'operation_number', 'warehouse_id', 'operation_type', 'priority', 'status',
        'reference_type', 'reference_id', 'reference_number',
        'assigned_to', 'assigned_at', 'started_at', 'completed_at',
        'description', 'instructions', 'requirements',
        'due_date', 'estimated_duration', 'actual_duration',
        'items_processed', 'items_total', 'accuracy_rate', 'error_count',
        'from_location_id', 'to_location_id', 'location_sequence',
        'equipment_used', 'consumables_used',
        'quality_check_required', 'quality_checked_by', 'quality_checked_at', 'quality_issues',
        'notes', 'completion_notes', 'issues_encountered',
        'created_by', 'updated_by'
    ];

    protected $casts = [
        'instructions' => 'array',
        'requirements' => 'array',
        'location_sequence' => 'array',
        'equipment_used' => 'array',
        'consumables_used' => 'array',
        'quality_issues' => 'array',
        'assigned_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'due_date' => 'datetime',
        'quality_checked_at' => 'datetime',
        'accuracy_rate' => 'decimal:2',
    ];

    /**
     * Get warehouse
     */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    /**
     * Get assigned user
     */
    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /**
     * Get assigned staff (through user_id)
     */
    public function assignedStaff(): BelongsTo
    {
        return $this->belongsTo(WarehouseStaff::class, 'assigned_to', 'user_id');
    }

    /**
     * Get from location
     */
    public function fromLocation(): BelongsTo
    {
        return $this->belongsTo(WarehouseLocation::class, 'from_location_id');
    }

    /**
     * Get to location
     */
    public function toLocation(): BelongsTo
    {
        return $this->belongsTo(WarehouseLocation::class, 'to_location_id');
    }

    /**
     * Get quality checker
     */
    public function qualityChecker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'quality_checked_by');
    }

    /**
     * Get operation items
     */
    public function items(): HasMany
    {
        return $this->hasMany(WarehouseOperationItem::class, 'operation_id');
    }

    /**
     * Get creator
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Scope for operations by type
     */
    public function scopeByType($query, $type)
    {
        return $query->where('operation_type', $type);
    }

    /**
     * Scope for operations by status
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope for assigned operations
     */
    public function scopeAssigned($query, $userId = null)
    {
        if ($userId) {
            return $query->where('assigned_to', $userId);
        }
        return $query->whereNotNull('assigned_to');
    }

    /**
     * Scope for overdue operations
     */
    public function scopeOverdue($query)
    {
        return $query->where('due_date', '<', Carbon::now())
                    ->whereNotIn('status', ['completed', 'cancelled']);
    }

    /**
     * Get operation type text
     */
    public function getOperationTypeTextAttribute()
    {
        $types = [
            'receiving' => 'Teslim Alma',
            'putaway' => 'Yerleştirme',
            'picking' => 'Toplama',
            'packing' => 'Paketleme',
            'shipping' => 'Sevkiyat',
            'cycle_count' => 'Sayım',
            'replenishment' => 'İkmal',
            'returns' => 'İade',
            'transfer' => 'Transfer',
            'adjustment' => 'Düzeltme'
        ];

        return $types[$this->operation_type] ?? $this->operation_type;
    }

    /**
     * Get priority text
     */
    public function getPriorityTextAttribute()
    {
        $priorities = [
            'low' => 'Düşük',
            'normal' => 'Normal',
            'high' => 'Yüksek',
            'urgent' => 'Acil'
        ];

        return $priorities[$this->priority] ?? $this->priority;
    }

    /**
     * Get priority color
     */
    public function getPriorityColorAttribute()
    {
        $colors = [
            'low' => 'secondary',
            'normal' => 'primary',
            'high' => 'warning',
            'urgent' => 'danger'
        ];

        return $colors[$this->priority] ?? 'primary';
    }

    /**
     * Get status text
     */
    public function getStatusTextAttribute()
    {
        $statuses = [
            'created' => 'Oluşturuldu',
            'assigned' => 'Atandı',
            'in_progress' => 'Devam Ediyor',
            'completed' => 'Tamamlandı',
            'cancelled' => 'İptal Edildi',
            'on_hold' => 'Beklemede',
            'failed' => 'Başarısız'
        ];

        return $statuses[$this->status] ?? $this->status;
    }

    /**
     * Get status color
     */
    public function getStatusColorAttribute()
    {
        $colors = [
            'created' => 'info',
            'assigned' => 'primary',
            'in_progress' => 'warning',
            'completed' => 'success',
            'cancelled' => 'secondary',
            'on_hold' => 'warning',
            'failed' => 'danger'
        ];

        return $colors[$this->status] ?? 'secondary';
    }

    /**
     * Check if operation is overdue
     */
    public function isOverdue()
    {
        return $this->due_date && 
               Carbon::parse($this->due_date)->isPast() && 
               !in_array($this->status, ['completed', 'cancelled']);
    }

    /**
     * Get completion percentage
     */
    public function getCompletionPercentageAttribute()
    {
        return $this->items_total > 0 ? ($this->items_processed / $this->items_total) * 100 : 0;
    }

    /**
     * Assign operation to user
     */
    public function assignTo($userId)
    {
        $this->update([
            'assigned_to' => $userId,
            'assigned_at' => Carbon::now(),
            'status' => 'assigned'
        ]);
    }

    /**
     * Start operation
     */
    public function start($userId = null)
    {
        $this->update([
            'status' => 'in_progress',
            'started_at' => Carbon::now(),
            'assigned_to' => $userId ?: $this->assigned_to
        ]);
    }

    /**
     * Complete operation
     */
    public function complete($notes = null)
    {
        $this->update([
            'status' => 'completed',
            'completed_at' => Carbon::now(),
            'completion_notes' => $notes,
            'actual_duration' => $this->started_at ? 
                Carbon::parse($this->started_at)->diffInMinutes(Carbon::now()) : null
        ]);
    }

    /**
     * Cancel operation
     */
    public function cancel($reason = null)
    {
        $this->update([
            'status' => 'cancelled',
            'completion_notes' => $reason
        ]);
    }

    /**
     * Put operation on hold
     */
    public function putOnHold($reason = null)
    {
        $this->update([
            'status' => 'on_hold',
            'notes' => $reason
        ]);
    }

    /**
     * Generate unique operation number
     */
    public static function generateOperationNumber($type)
    {
        $prefix = strtoupper(substr($type, 0, 3));
        $date = Carbon::now()->format('Ymd');
        
        $lastOperation = static::withTrashed()
            ->where('operation_number', 'like', $prefix . '-' . $date . '%')
            ->orderBy('operation_number', 'desc')
            ->first();

        if ($lastOperation) {
            $lastSequence = (int) substr($lastOperation->operation_number, -4);
            $newSequence = $lastSequence + 1;
        } else {
            $newSequence = 1;
        }

        return $prefix . '-' . $date . '-' . str_pad($newSequence, 4, '0', STR_PAD_LEFT);
    }
}