<?php

namespace App\Http\Controllers;

use App\Models\Integration;
use App\Models\IntegrationLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class IntegrationController extends Controller
{
    /**
     * Display integrations page
     */
    public function index()
    {
        $integrations = Integration::with(['logs' => function ($query) {
                $query->orderBy('created_at', 'desc')->limit(10);
            }])
            ->orderBy('type')
            ->orderBy('name')
            ->get();

        $stats = $this->getIntegrationStats();

        return Inertia::render('Settings/Integrations/Index', [
            'integrations' => $integrations,
            'stats' => $stats,
        ]);
    }

    /**
     * Show specific integration configuration
     */
    public function show(Integration $integration)
    {
        $integration->load(['logs' => function ($query) {
            $query->orderBy('created_at', 'desc')->limit(50);
        }]);

        return Inertia::render('Settings/Integrations/Show', [
            'integration' => $integration,
        ]);
    }

    /**
     * Update integration configuration
     */
    public function update(Request $request, Integration $integration)
    {
        $validated = $request->validate([
            'is_active' => 'boolean',
            'config' => 'nullable|array',
            'sync_settings' => 'nullable|array',
        ]);

        DB::beginTransaction();
        try {
            $integration->update($validated);

            // Mark as configured if config is provided
            if (isset($validated['config']) && !empty($validated['config'])) {
                $integration->update(['is_configured' => true]);
            }

            DB::commit();

            return back()->with('success', 'Entegrasyon ayarları güncellendi.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Ayarlar güncellenirken hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Toggle integration status
     */
    public function toggleStatus(Integration $integration)
    {
        if (!$integration->is_configured && !$integration->is_active) {
            return back()->with('error', 'Entegrasyonu aktif etmeden önce yapılandırılması gerekmektedir.');
        }

        DB::beginTransaction();
        try {
            $integration->update([
                'is_active' => !$integration->is_active
            ]);

            DB::commit();

            $status = $integration->is_active ? 'aktif' : 'pasif';
            return back()->with('success', "Entegrasyon {$status} duruma getirildi.");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Durum güncellenirken hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Test integration connection
     */
    public function testConnection(Integration $integration)
    {
        $log = IntegrationLog::create([
            'integration_id' => $integration->id,
            'action' => 'test',
            'status' => 'in_progress',
            'started_at' => now(),
        ]);

        try {
            // This is a placeholder - actual implementation would depend on integration type
            $result = $this->performConnectionTest($integration);

            $log->update([
                'status' => $result['success'] ? 'success' : 'failed',
                'message' => $result['message'],
                'completed_at' => now(),
            ]);

            if ($result['success']) {
                return back()->with('success', 'Bağlantı testi başarılı: ' . $result['message']);
            } else {
                return back()->with('error', 'Bağlantı testi başarısız: ' . $result['message']);
            }
        } catch (\Exception $e) {
            $log->update([
                'status' => 'failed',
                'message' => $e->getMessage(),
                'completed_at' => now(),
            ]);

            return back()->with('error', 'Bağlantı testi sırasında hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Trigger manual sync
     */
    public function sync(Request $request, Integration $integration)
    {
        $validated = $request->validate([
            'entity_type' => 'nullable|string',
            'direction' => 'nullable|in:import,export,both',
        ]);

        if (!$integration->isReadyToSync()) {
            return back()->with('error', 'Entegrasyon senkronizasyon için hazır değil.');
        }

        $log = IntegrationLog::create([
            'integration_id' => $integration->id,
            'action' => 'sync',
            'entity_type' => $validated['entity_type'] ?? null,
            'status' => 'in_progress',
            'started_at' => now(),
        ]);

        try {
            // This is a placeholder - actual sync logic would be in service classes
            $result = $this->performSync($integration, $validated);

            $log->update([
                'status' => $result['status'],
                'records_processed' => $result['processed'] ?? 0,
                'records_success' => $result['success'] ?? 0,
                'records_failed' => $result['failed'] ?? 0,
                'message' => $result['message'] ?? null,
                'errors' => $result['errors'] ?? null,
                'completed_at' => now(),
            ]);

            $integration->update([
                'last_sync_at' => now(),
                'last_sync_status' => $result['status'],
                'last_sync_message' => $result['message'] ?? null,
                'sync_count' => $integration->sync_count + 1,
            ]);

            return back()->with('success', 'Senkronizasyon tamamlandı.');
        } catch (\Exception $e) {
            $log->update([
                'status' => 'failed',
                'message' => $e->getMessage(),
                'completed_at' => now(),
            ]);

            return back()->with('error', 'Senkronizasyon sırasında hata oluştu: ' . $e->getMessage());
        }
    }

    /**
     * Get integration logs
     */
    public function logs(Integration $integration)
    {
        $logs = $integration->logs()
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        return Inertia::render('Settings/Integrations/Logs', [
            'integration' => $integration,
            'logs' => $logs,
        ]);
    }

    /**
     * Get integration statistics
     */
    private function getIntegrationStats(): array
    {
        $totalIntegrations = Integration::count();
        $activeIntegrations = Integration::where('is_active', true)->count();
        $configuredIntegrations = Integration::where('is_configured', true)->count();

        $recentSyncs = IntegrationLog::where('action', 'sync')
            ->where('created_at', '>=', now()->subDays(7))
            ->count();

        $successfulSyncs = IntegrationLog::where('action', 'sync')
            ->where('status', 'success')
            ->where('created_at', '>=', now()->subDays(7))
            ->count();

        $failedSyncs = IntegrationLog::where('action', 'sync')
            ->where('status', 'failed')
            ->where('created_at', '>=', now()->subDays(7))
            ->count();

        return [
            'total_integrations' => $totalIntegrations,
            'active_integrations' => $activeIntegrations,
            'configured_integrations' => $configuredIntegrations,
            'recent_syncs' => $recentSyncs,
            'successful_syncs' => $successfulSyncs,
            'failed_syncs' => $failedSyncs,
            'success_rate' => $recentSyncs > 0 ? round(($successfulSyncs / $recentSyncs) * 100, 2) : 0,
        ];
    }

    /**
     * Perform connection test (placeholder)
     */
    private function performConnectionTest(Integration $integration): array
    {
        // This would be implemented in specific integration service classes
        return [
            'success' => true,
            'message' => 'Bağlantı testi henüz yapılandırılmamış.'
        ];
    }

    /**
     * Perform sync (placeholder)
     */
    private function performSync(Integration $integration, array $options): array
    {
        // This would be implemented in specific integration service classes
        return [
            'status' => 'success',
            'message' => 'Senkronizasyon henüz yapılandırılmamış.',
            'processed' => 0,
            'success' => 0,
            'failed' => 0,
        ];
    }
}
