<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\WarehouseStaff;
use App\Models\User;

class SyncWarehouseStaffRoles extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'warehouse:sync-roles {--dry-run : Sadece nelerin degisecegini goster}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'WarehouseStaff rollerini Spatie Permission rollerine senkronize eder';

    /**
     * Role mapping: WarehouseStaff.role => Spatie role name
     */
    private array $roleMapping = [
        'warehouse_manager' => 'warehouse_manager',
        'supervisor' => 'warehouse_manager', // Supervisor tam yetkili
        'team_leader' => 'warehouse_manager', // Team leader tam yetkili
        'receiver' => 'warehouse_receiver',
        'picker' => 'warehouse_picker',
        'packer' => 'warehouse_picker', // Packer ve picker ayni yetkiler
        'shipper' => 'warehouse_shipper',
        'forklift_operator' => 'warehouse_picker',
        'quality_control' => 'warehouse_receiver', // QC mal kabul ile ayni
        'maintenance' => 'warehouse_picker',
        'inventory_controller' => 'warehouse_inventory',
        'returns_processor' => 'warehouse_receiver',
    ];

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $dryRun = $this->option('dry-run');

        if ($dryRun) {
            $this->info('DRY RUN: Hicbir degisiklik yapilmayacak.');
        }

        $this->info('WarehouseStaff rolleri senkronize ediliyor...');

        // Aktif warehouse staff kayitlarini al
        $staffMembers = WarehouseStaff::with('user')
            ->where('status', 'active')
            ->whereNotNull('role')
            ->get();

        $this->info("Toplam {$staffMembers->count()} aktif personel bulundu.");

        $synced = 0;
        $skipped = 0;
        $errors = 0;

        foreach ($staffMembers as $staff) {
            // User kontrolu
            if (!$staff->user) {
                $this->warn("Staff ID {$staff->id}: user_id {$staff->user_id} bulunamadi, atlaniyor.");
                $skipped++;
                continue;
            }

            // Role mapping kontrolu
            $spatieRole = $this->roleMapping[$staff->role] ?? null;

            if (!$spatieRole) {
                $this->warn("Staff ID {$staff->id}: Bilinmeyen rol '{$staff->role}', atlaniyor.");
                $skipped++;
                continue;
            }

            // Kullanicida zaten bu rol var mi?
            if ($staff->user->hasRole($spatieRole)) {
                $this->line("Staff ID {$staff->id}: {$staff->user->name} zaten '{$spatieRole}' rolune sahip.");
                $skipped++;
                continue;
            }

            // Dry run modunda degisiklik yapma
            if ($dryRun) {
                $this->info("YAPILACAK: {$staff->user->name} ({$staff->user->email}) => '{$spatieRole}' rolu atanacak");
                $synced++;
                continue;
            }

            // Rolu ata
            try {
                $staff->user->assignRole($spatieRole);
                $this->info("BASARILI: {$staff->user->name} => '{$spatieRole}' rolu atandi");
                $synced++;
            } catch (\Exception $e) {
                $this->error("HATA: {$staff->user->name} icin rol atanamadi: {$e->getMessage()}");
                $errors++;
            }
        }

        $this->newLine();
        $this->info('Senkronizasyon tamamlandi!');
        $this->table(
            ['Durum', 'Sayi'],
            [
                ['Senkronize edildi', $synced],
                ['Atlandi', $skipped],
                ['Hata', $errors],
            ]
        );

        if ($dryRun && $synced > 0) {
            $this->newLine();
            $this->warn("Not: Bu bir dry run'di. Degisiklikleri uygulamak icin --dry-run parametresini kaldirin.");
        }

        return Command::SUCCESS;
    }
}
