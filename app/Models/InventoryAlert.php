<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Carbon\Carbon;

class InventoryAlert extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'alert_type', 'severity', 'priority',
        'inventory_item_id', 'inventory_stock_id', 'warehouse_id', 'warehouse_location_id',
        'title', 'message', 'description', 'alert_data',
        'threshold_value', 'current_value', 'variance_amount', 'variance_percentage',
        'status', 'is_system_generated', 'auto_resolve', 'triggered_at', 'acknowledged_at', 'resolved_at', 'escalated_at',
        'assigned_to', 'acknowledged_by', 'resolved_by',
        'acknowledgment_notes', 'resolution_notes', 'actions_taken', 'resolution_type',
        'notification_channels', 'notification_recipients', 'notification_count', 'last_notification_sent', 'notifications_enabled',
        'escalation_level', 'max_escalation_level', 'escalation_interval_minutes', 'next_escalation_at', 'escalation_rules',
        'is_recurring', 'recurrence_pattern', 'occurrence_count', 'last_occurrence', 'next_check_at',
        'business_impact', 'financial_impact', 'impact_description',
        'source_system', 'source_reference', 'source_data',
        'trigger_conditions', 'rule_name', 'rule_description',
        'custom_attributes', 'metadata',
        'tags', 'category', 'subcategory',
        'created_by', 'updated_by'
    ];

    protected $casts = [
        'alert_data' => 'array',
        'actions_taken' => 'array',
        'notification_channels' => 'array',
        'notification_recipients' => 'array',
        'escalation_rules' => 'array',
        'source_data' => 'array',
        'trigger_conditions' => 'array',
        'custom_attributes' => 'array',
        'metadata' => 'array',
        'tags' => 'array',
        'is_system_generated' => 'boolean',
        'auto_resolve' => 'boolean',
        'is_recurring' => 'boolean',
        'notifications_enabled' => 'boolean',
        'threshold_value' => 'decimal:4',
        'current_value' => 'decimal:4',
        'variance_amount' => 'decimal:4',
        'variance_percentage' => 'decimal:2',
        'financial_impact' => 'decimal:2',
        'triggered_at' => 'datetime',
        'acknowledged_at' => 'datetime',
        'resolved_at' => 'datetime',
        'escalated_at' => 'datetime',
        'last_notification_sent' => 'datetime',
        'last_occurrence' => 'datetime',
        'next_escalation_at' => 'datetime',
        'next_check_at' => 'datetime',
    ];

    // Relationships
    public function inventoryItem()
    {
        return $this->belongsTo(InventoryItem::class);
    }

    public function inventoryStock()
    {
        return $this->belongsTo(InventoryStock::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function warehouseLocation()
    {
        return $this->belongsTo(WarehouseLocation::class);
    }

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function acknowledgedBy()
    {
        return $this->belongsTo(User::class, 'acknowledged_by');
    }

    public function resolvedBy()
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeByType($query, $type)
    {
        return $query->where('alert_type', $type);
    }

    public function scopeBySeverity($query, $severity)
    {
        return $query->where('severity', $severity);
    }

    public function scopeByPriority($query, $priority)
    {
        return $query->where('priority', $priority);
    }

    public function scopeUnresolved($query)
    {
        return $query->whereIn('status', ['active', 'acknowledged', 'escalated']);
    }

    public function scopeResolved($query)
    {
        return $query->where('status', 'resolved');
    }

    public function scopePendingEscalation($query)
    {
        return $query->where('next_escalation_at', '<=', now())
                    ->where('escalation_level', '<', DB::raw('max_escalation_level'));
    }

    public function scopeRecurringDue($query)
    {
        return $query->where('is_recurring', true)
                    ->where('next_check_at', '<=', now());
    }

    public function scopeForWarehouse($query, $warehouseId)
    {
        return $query->where('warehouse_id', $warehouseId);
    }

    public function scopeForItem($query, $itemId)
    {
        return $query->where('inventory_item_id', $itemId);
    }

    public function scopeCritical($query)
    {
        return $query->where('severity', 'critical')
                    ->orWhere('priority', 'urgent');
    }

    // Accessors
    public function getAlertTypeTextAttribute()
    {
        return match($this->alert_type) {
            'low_stock' => 'Düşük Stok',
            'out_of_stock' => 'Stok Tükendi',
            'overstock' => 'Fazla Stok',
            'expiry_warning' => 'Son Kullanma Tarihi Uyarısı',
            'expired_stock' => 'Vadesi Geçmiş Stok',
            'damaged_stock' => 'Hasarlı Stok',
            'quality_issue' => 'Kalite Sorunu',
            'temperature_breach' => 'Sıcaklık İhlali',
            'movement_anomaly' => 'Hareket Anomalisi',
            'cost_variance' => 'Maliyet Farkı',
            'cycle_count_due' => 'Sayım Gerekli',
            'reorder_point' => 'Yeniden Sipariş Noktası',
            default => ucfirst(str_replace('_', ' ', $this->alert_type))
        };
    }

    public function getSeverityTextAttribute()
    {
        return match($this->severity) {
            'low' => 'Düşük',
            'medium' => 'Orta',
            'high' => 'Yüksek',
            'critical' => 'Kritik',
            default => ucfirst($this->severity)
        };
    }

    public function getPriorityTextAttribute()
    {
        return match($this->priority) {
            'low' => 'Düşük',
            'normal' => 'Normal',
            'high' => 'Yüksek',
            'urgent' => 'Acil',
            default => ucfirst($this->priority)
        };
    }

    public function getStatusTextAttribute()
    {
        return match($this->status) {
            'active' => 'Aktif',
            'acknowledged' => 'Onaylandı',
            'resolved' => 'Çözüldü',
            'dismissed' => 'Reddedildi',
            'escalated' => 'Yükseltildi',
            default => ucfirst($this->status)
        };
    }

    public function getBusinessImpactTextAttribute()
    {
        return match($this->business_impact) {
            'none' => 'Yok',
            'low' => 'Düşük',
            'medium' => 'Orta',
            'high' => 'Yüksek',
            'critical' => 'Kritik',
            default => ucfirst($this->business_impact)
        };
    }

    public function getAgeInHoursAttribute()
    {
        return $this->triggered_at ? Carbon::now()->diffInHours($this->triggered_at) : 0;
    }

    public function getAgeInDaysAttribute()
    {
        return $this->triggered_at ? Carbon::now()->diffInDays($this->triggered_at) : 0;
    }

    public function getIsOverdueAttribute()
    {
        if (!$this->next_escalation_at) {
            return false;
        }
        
        return Carbon::now()->isAfter($this->next_escalation_at);
    }

    public function getTimeToEscalationAttribute()
    {
        if (!$this->next_escalation_at || $this->status === 'resolved') {
            return null;
        }
        
        return Carbon::now()->diffInMinutes($this->next_escalation_at, false);
    }

    public function getSeverityColorAttribute()
    {
        return match($this->severity) {
            'low' => 'success',
            'medium' => 'warning',
            'high' => 'danger',
            'critical' => 'dark',
            default => 'secondary'
        };
    }

    // Methods
    public function acknowledge($userId = null, $notes = null)
    {
        if ($this->status === 'resolved') {
            throw new \Exception('Çözülmüş uyarılar onaylanamaz.');
        }

        $this->update([
            'status' => 'acknowledged',
            'acknowledged_by' => $userId ?? auth()->id(),
            'acknowledged_at' => now(),
            'acknowledgment_notes' => $notes,
        ]);

        return $this;
    }

    public function resolve($userId = null, $notes = null, $resolutionType = 'fixed')
    {
        if ($this->status === 'resolved') {
            throw new \Exception('Bu uyarı zaten çözülmüş.');
        }

        $this->update([
            'status' => 'resolved',
            'resolved_by' => $userId ?? auth()->id(),
            'resolved_at' => now(),
            'resolution_notes' => $notes,
            'resolution_type' => $resolutionType,
        ]);

        return $this;
    }

    public function dismiss($userId = null, $notes = null)
    {
        if ($this->status === 'resolved') {
            throw new \Exception('Çözülmüş uyarılar reddedilemez.');
        }

        $this->update([
            'status' => 'dismissed',
            'resolved_by' => $userId ?? auth()->id(),
            'resolved_at' => now(),
            'resolution_notes' => $notes,
            'resolution_type' => 'dismissed',
        ]);

        return $this;
    }

    public function escalate($userId = null, $reason = null)
    {
        if ($this->escalation_level >= $this->max_escalation_level) {
            throw new \Exception('Maksimum yükseltme seviyesine ulaşıldı.');
        }

        $newLevel = $this->escalation_level + 1;
        $nextEscalationAt = $newLevel < $this->max_escalation_level 
            ? now()->addMinutes($this->escalation_interval_minutes)
            : null;

        $this->update([
            'status' => 'escalated',
            'escalation_level' => $newLevel,
            'escalated_at' => now(),
            'next_escalation_at' => $nextEscalationAt,
        ]);

        // Log escalation action
        $actions = $this->actions_taken ?? [];
        $actions[] = [
            'action' => 'escalated',
            'level' => $newLevel,
            'reason' => $reason,
            'user_id' => $userId ?? auth()->id(),
            'timestamp' => now()->toISOString(),
        ];
        
        $this->update(['actions_taken' => $actions]);

        return $this;
    }

    public function assign($userId, $assignedBy = null)
    {
        $this->update([
            'assigned_to' => $userId,
            'updated_by' => $assignedBy ?? auth()->id(),
        ]);

        // Log assignment action
        $actions = $this->actions_taken ?? [];
        $actions[] = [
            'action' => 'assigned',
            'assigned_to' => $userId,
            'assigned_by' => $assignedBy ?? auth()->id(),
            'timestamp' => now()->toISOString(),
        ];
        
        $this->update(['actions_taken' => $actions]);

        return $this;
    }

    public function sendNotification($channels = null, $recipients = null)
    {
        $channels = $channels ?? $this->notification_channels ?? ['email'];
        $recipients = $recipients ?? $this->notification_recipients ?? [];

        // Here you would integrate with your notification system
        // For now, just update the notification tracking
        $this->update([
            'notification_count' => $this->notification_count + 1,
            'last_notification_sent' => now(),
        ]);

        return $this;
    }

    public function snooze($minutes = 60, $userId = null)
    {
        $this->update([
            'next_escalation_at' => now()->addMinutes($minutes),
            'updated_by' => $userId ?? auth()->id(),
        ]);

        // Log snooze action
        $actions = $this->actions_taken ?? [];
        $actions[] = [
            'action' => 'snoozed',
            'duration_minutes' => $minutes,
            'user_id' => $userId ?? auth()->id(),
            'timestamp' => now()->toISOString(),
        ];
        
        $this->update(['actions_taken' => $actions]);

        return $this;
    }

    public function updateCurrentValue($value, $userId = null)
    {
        $oldValue = $this->current_value;
        $variance = $value - $this->threshold_value;
        $variancePercentage = $this->threshold_value > 0 
            ? (($value - $this->threshold_value) / $this->threshold_value) * 100 
            : 0;

        $this->update([
            'current_value' => $value,
            'variance_amount' => $variance,
            'variance_percentage' => $variancePercentage,
            'updated_by' => $userId ?? auth()->id(),
        ]);

        // Auto-resolve if condition is met
        if ($this->auto_resolve && $this->shouldAutoResolve($value)) {
            $this->resolve($userId, 'Auto-resolved: condition no longer met', 'auto_resolved');
        }

        return $this;
    }

    protected function shouldAutoResolve($currentValue)
    {
        switch ($this->alert_type) {
            case 'low_stock':
                return $currentValue > $this->threshold_value;
            case 'out_of_stock':
                return $currentValue > 0;
            case 'overstock':
                return $currentValue <= $this->threshold_value;
            default:
                return false;
        }
    }

    public function scheduleNextCheck($pattern = null)
    {
        if (!$this->is_recurring) {
            return $this;
        }

        $pattern = $pattern ?? $this->recurrence_pattern ?? 'daily';
        
        $nextCheck = match($pattern) {
            'hourly' => now()->addHour(),
            'daily' => now()->addDay(),
            'weekly' => now()->addWeek(),
            'monthly' => now()->addMonth(),
            default => now()->addDay()
        };

        $this->update([
            'next_check_at' => $nextCheck,
            'last_occurrence' => now(),
            'occurrence_count' => $this->occurrence_count + 1,
        ]);

        return $this;
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($alert) {
            if (!$alert->triggered_at) {
                $alert->triggered_at = now();
            }
            
            if (!$alert->escalation_level) {
                $alert->escalation_level = 0;
            }
            
            if (!$alert->max_escalation_level) {
                $alert->max_escalation_level = 3;
            }
            
            if (!$alert->escalation_interval_minutes) {
                $alert->escalation_interval_minutes = 60;
            }

            // Set next escalation time
            if ($alert->escalation_interval_minutes > 0) {
                $alert->next_escalation_at = now()->addMinutes($alert->escalation_interval_minutes);
            }
        });
    }
}