<?php

namespace App\Observers;

use App\Models\WarehouseStaff;
use App\Models\Role;
use Illuminate\Support\Facades\Log;

class WarehouseStaffObserver
{
    /**
     * Role mapping: WarehouseStaff.role => Spatie role name
     */
    private array $roleMapping = [
        'warehouse_manager' => 'warehouse_manager',
        'supervisor' => 'warehouse_manager',
        'team_leader' => 'warehouse_manager',
        'receiver' => 'warehouse_receiver',
        'picker' => 'warehouse_picker',
        'packer' => 'warehouse_picker',
        'shipper' => 'warehouse_shipper',
        'forklift_operator' => 'warehouse_picker',
        'quality_control' => 'warehouse_receiver',
        'maintenance' => 'warehouse_picker',
        'inventory_controller' => 'warehouse_inventory',
        'returns_processor' => 'warehouse_receiver',
    ];

    /**
     * Warehouse rolleri listesi
     */
    private array $warehouseRoles = [
        'warehouse_manager',
        'warehouse_receiver',
        'warehouse_picker',
        'warehouse_shipper',
        'warehouse_inventory',
    ];

    /**
     * Handle the WarehouseStaff "created" event.
     */
    public function created(WarehouseStaff $staff): void
    {
        $this->assignSpatieRole($staff);
    }

    /**
     * Handle the WarehouseStaff "updated" event.
     */
    public function updated(WarehouseStaff $staff): void
    {
        // Rol degistiyse guncelle
        if ($staff->isDirty('role')) {
            $oldRole = $staff->getOriginal('role');
            $this->removeSpatieRole($staff, $oldRole);
            $this->assignSpatieRole($staff);
        }

        // Status pasif olduysa rolleri kaldir
        if ($staff->isDirty('status') && $staff->status !== 'active') {
            $this->removeAllWarehouseRoles($staff);
        }
    }

    /**
     * Handle the WarehouseStaff "deleted" event.
     */
    public function deleted(WarehouseStaff $staff): void
    {
        // Soft delete icin rolleri kaldir
        $this->removeAllWarehouseRoles($staff);
    }

    /**
     * Handle the WarehouseStaff "restored" event.
     */
    public function restored(WarehouseStaff $staff): void
    {
        // Restore edilince rolleri geri yukle
        if ($staff->status === 'active') {
            $this->assignSpatieRole($staff);
        }
    }

    /**
     * Assign Spatie role to user
     */
    private function assignSpatieRole(WarehouseStaff $staff): void
    {
        if (!$staff->user || !$staff->role) {
            return;
        }

        $spatieRole = $this->roleMapping[$staff->role] ?? null;

        if (!$spatieRole) {
            Log::warning("WarehouseStaffObserver: Bilinmeyen rol '{$staff->role}' icin mapping bulunamadi", [
                'staff_id' => $staff->id,
                'user_id' => $staff->user_id,
            ]);
            return;
        }

        // Rol var mi kontrol et
        $roleExists = Role::where('name', $spatieRole)->exists();
        if (!$roleExists) {
            Log::warning("WarehouseStaffObserver: '{$spatieRole}' rolu henuz olusturulmamis", [
                'staff_id' => $staff->id,
            ]);
            return;
        }

        try {
            if (!$staff->user->hasRole($spatieRole)) {
                $staff->user->assignRole($spatieRole);
                Log::info("WarehouseStaffObserver: Rol atandi", [
                    'user_id' => $staff->user_id,
                    'user_name' => $staff->user->name,
                    'role' => $spatieRole,
                ]);
            }
        } catch (\Exception $e) {
            Log::error("WarehouseStaffObserver: Rol atama hatasi", [
                'staff_id' => $staff->id,
                'user_id' => $staff->user_id,
                'role' => $spatieRole,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Remove Spatie role from user
     */
    private function removeSpatieRole(WarehouseStaff $staff, ?string $oldRole): void
    {
        if (!$staff->user || !$oldRole) {
            return;
        }

        $spatieRole = $this->roleMapping[$oldRole] ?? null;

        if (!$spatieRole) {
            return;
        }

        try {
            // Baska bir WarehouseStaff kaydinda ayni rol var mi kontrol et
            $hasOtherStaffWithSameRole = WarehouseStaff::where('user_id', $staff->user_id)
                ->where('id', '!=', $staff->id)
                ->where('status', 'active')
                ->whereIn('role', array_keys(array_filter($this->roleMapping, fn($r) => $r === $spatieRole)))
                ->exists();

            // Baska kayit yoksa rolu kaldir
            if (!$hasOtherStaffWithSameRole) {
                $staff->user->removeRole($spatieRole);
                Log::info("WarehouseStaffObserver: Rol kaldirildi", [
                    'user_id' => $staff->user_id,
                    'role' => $spatieRole,
                ]);
            }
        } catch (\Exception $e) {
            Log::error("WarehouseStaffObserver: Rol kaldirma hatasi", [
                'staff_id' => $staff->id,
                'role' => $spatieRole,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Remove all warehouse roles from user
     */
    private function removeAllWarehouseRoles(WarehouseStaff $staff): void
    {
        if (!$staff->user) {
            return;
        }

        // Baska aktif WarehouseStaff kaydi var mi kontrol et
        $hasOtherActiveStaff = WarehouseStaff::where('user_id', $staff->user_id)
            ->where('id', '!=', $staff->id)
            ->where('status', 'active')
            ->exists();

        // Baska aktif kayit yoksa tum warehouse rollerini kaldir
        if (!$hasOtherActiveStaff) {
            try {
                foreach ($this->warehouseRoles as $role) {
                    if ($staff->user->hasRole($role)) {
                        $staff->user->removeRole($role);
                    }
                }
                Log::info("WarehouseStaffObserver: Tum warehouse rolleri kaldirildi", [
                    'user_id' => $staff->user_id,
                ]);
            } catch (\Exception $e) {
                Log::error("WarehouseStaffObserver: Rolleri kaldirma hatasi", [
                    'user_id' => $staff->user_id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }
}
