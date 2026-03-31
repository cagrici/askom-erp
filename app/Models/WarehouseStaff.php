<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WarehouseStaff extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id', 'employee_id', 'warehouse_id', 'employment_type', 'shift', 'role',
        'permissions', 'zone_access', 'operation_types',
        'skills', 'certifications', 'equipment_authorizations',
        'performance_rating', 'operations_completed', 'accuracy_rate', 'productivity_rate',
        'work_schedule', 'is_available', 'last_activity', 'current_status',
        'training_completed', 'training_required', 'last_training_date', 'next_review_date',
        'emergency_contact_name', 'emergency_contact_phone', 'medical_conditions', 'safety_notes',
        'hire_date', 'termination_date', 'status', 'supervisor_id',
        'created_by', 'updated_by'
    ];

    protected $casts = [
        'permissions' => 'array',
        'zone_access' => 'array',
        'operation_types' => 'array',
        'skills' => 'array',
        'certifications' => 'array',
        'equipment_authorizations' => 'array',
        'work_schedule' => 'array',
        'training_completed' => 'array',
        'training_required' => 'array',
        'performance_rating' => 'decimal:2',
        'accuracy_rate' => 'decimal:2',
        'productivity_rate' => 'decimal:2',
        'is_available' => 'boolean',
        'last_activity' => 'datetime',
        'last_training_date' => 'date',
        'next_review_date' => 'date',
        'hire_date' => 'date',
        'termination_date' => 'date',
    ];

    /**
     * Get user
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get employee
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Employee::class);
    }

    /**
     * Get warehouse
     */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    /**
     * Get supervisor
     */
    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    /**
     * Scope for active staff
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope for available staff
     */
    public function scopeAvailable($query)
    {
        return $query->where('status', 'active')
                    ->where('is_available', true)
                    ->where('current_status', 'available');
    }

    /**
     * Scope for staff by role
     */
    public function scopeByRole($query, $role)
    {
        return $query->where('role', $role);
    }

    /**
     * Scope for staff by shift
     */
    public function scopeByShift($query, $shift)
    {
        return $query->where('shift', $shift);
    }

    /**
     * Get role text
     */
    public function getRoleTextAttribute()
    {
        $roles = [
            'warehouse_manager' => 'Depo Müdürü',
            'supervisor' => 'Süpervizör',
            'team_leader' => 'Takım Lideri',
            'receiver' => 'Teslim Alma Memuru',
            'picker' => 'Toplayıcı',
            'packer' => 'Paketleyici',
            'shipper' => 'Sevkiyat Memuru',
            'forklift_operator' => 'Forklift Operatörü',
            'quality_control' => 'Kalite Kontrol',
            'maintenance' => 'Bakım Teknisyeni',
            'inventory_controller' => 'Envanter Kontrol',
            'returns_processor' => 'İade İşlemcisi'
        ];

        return $roles[$this->role] ?? $this->role;
    }

    /**
     * Get employment type text
     */
    public function getEmploymentTypeTextAttribute()
    {
        $types = [
            'full_time' => 'Tam Zamanlı',
            'part_time' => 'Yarı Zamanlı',
            'contractor' => 'Müteahhit',
            'seasonal' => 'Mevsimlik'
        ];

        return $types[$this->employment_type] ?? $this->employment_type;
    }

    /**
     * Get shift text
     */
    public function getShiftTextAttribute()
    {
        $shifts = [
            'day' => 'Gündüz',
            'evening' => 'Akşam',
            'night' => 'Gece',
            'rotating' => 'Değişken'
        ];

        return $shifts[$this->shift] ?? $this->shift;
    }

    /**
     * Get current status text
     */
    public function getCurrentStatusTextAttribute()
    {
        $statuses = [
            'available' => 'Müsait',
            'busy' => 'Meşgul',
            'break' => 'Molada',
            'offline' => 'Çevrimdışı'
        ];

        return $statuses[$this->current_status] ?? $this->current_status;
    }

    /**
     * Get status color
     */
    public function getStatusColorAttribute()
    {
        $colors = [
            'active' => 'success',
            'inactive' => 'secondary',
            'suspended' => 'warning',
            'terminated' => 'danger'
        ];

        return $colors[$this->status] ?? 'secondary';
    }

    /**
     * Get current status color
     */
    public function getCurrentStatusColorAttribute()
    {
        $colors = [
            'available' => 'success',
            'busy' => 'warning',
            'break' => 'info',
            'offline' => 'secondary'
        ];

        return $colors[$this->current_status] ?? 'secondary';
    }

    /**
     * Check if staff has permission
     */
    public function hasPermission($permission)
    {
        return in_array($permission, $this->permissions ?? []);
    }

    /**
     * Check if staff has access to zone
     */
    public function hasZoneAccess($zoneId)
    {
        return empty($this->zone_access) || in_array($zoneId, $this->zone_access);
    }

    /**
     * Check if staff can perform operation type
     */
    public function canPerformOperation($operationType)
    {
        return empty($this->operation_types) || in_array($operationType, $this->operation_types);
    }

    /**
     * Check if staff has skill
     */
    public function hasSkill($skill)
    {
        return in_array($skill, $this->skills ?? []);
    }

    /**
     * Check if staff is authorized for equipment
     */
    public function isAuthorizedForEquipment($equipment)
    {
        return in_array($equipment, $this->equipment_authorizations ?? []);
    }

    /**
     * Check if certification is valid
     */
    public function hasCertification($certification)
    {
        if (!isset($this->certifications[$certification])) {
            return false;
        }

        $expiryDate = $this->certifications[$certification]['expiry_date'] ?? null;
        if ($expiryDate && Carbon::parse($expiryDate)->isPast()) {
            return false;
        }

        return true;
    }

    /**
     * Update availability status
     */
    public function updateStatus($status, $reason = null)
    {
        $this->update([
            'current_status' => $status,
            'last_activity' => now(),
            'is_available' => $status === 'available'
        ]);
    }

    /**
     * Record completed operation
     */
    public function recordCompletedOperation($accuracyRate = null, $productivityRate = null)
    {
        $this->increment('operations_completed');

        if ($accuracyRate !== null) {
            // Calculate running average
            $totalOperations = $this->operations_completed;
            $currentTotal = ($this->accuracy_rate ?? 0) * ($totalOperations - 1);
            $newAverage = ($currentTotal + $accuracyRate) / $totalOperations;
            $this->accuracy_rate = $newAverage;
        }

        if ($productivityRate !== null) {
            // Calculate running average
            $totalOperations = $this->operations_completed;
            $currentTotal = ($this->productivity_rate ?? 0) * ($totalOperations - 1);
            $newAverage = ($currentTotal + $productivityRate) / $totalOperations;
            $this->productivity_rate = $newAverage;
        }

        $this->save();
    }
}
