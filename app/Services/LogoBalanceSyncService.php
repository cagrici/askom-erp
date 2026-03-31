<?php

namespace App\Services;

use App\Models\CurrentAccount;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

class LogoBalanceSyncService
{
    protected string $connection = 'logo';

    /**
     * LOGO'dan tüm cari bakiyeleri senkronize et
     */
    public function syncBalances(?int $firmNo = null, ?callable $progressCallback = null): array
    {
        $firmNo = $firmNo ?? (int) config('services.logo.firm_no', 12);

        $clflineTable = $this->findTable($firmNo, ['LG_%03d_01_CLFLINE', 'LG_%03d_CLFLINE']);
        if (!$clflineTable) {
            return ['success' => false, 'error' => "CLFLINE tablosu bulunamadı (Firm: {$firmNo})"];
        }

        try {
            // LOGO'dan tüm cari bakiyelerini çek
            $balances = DB::connection($this->connection)->select("
                SELECT
                    CLIENTREF as logo_id,
                    SUM(CASE WHEN SIGN = 0 THEN AMOUNT ELSE 0 END) as total_debit,
                    SUM(CASE WHEN SIGN = 1 THEN AMOUNT ELSE 0 END) as total_credit,
                    SUM(CASE WHEN SIGN = 0 THEN AMOUNT ELSE 0 END) - SUM(CASE WHEN SIGN = 1 THEN AMOUNT ELSE 0 END) as balance
                FROM [{$clflineTable}]
                WHERE CANCELLED = 0
                GROUP BY CLIENTREF
            ");

            $updated = 0;
            $skipped = 0;
            $total = count($balances);

            if ($progressCallback) {
                $progressCallback('total', $total);
            }

            foreach ($balances as $row) {
                $affected = CurrentAccount::where('logo_id', $row->logo_id)
                    ->update([
                        'current_balance' => round($row->balance, 2),
                        'total_receivables' => round($row->total_debit, 2),
                        'total_payables' => round($row->total_credit, 2),
                    ]);

                if ($affected > 0) {
                    $updated++;
                } else {
                    $skipped++;
                }

                if ($progressCallback && ($updated + $skipped) % 100 === 0) {
                    $progressCallback('progress', $updated + $skipped);
                }
            }

            // Bakiyesi olmayan (CLFLINE'da kaydı bulunmayan) carilerin bakiyesini sıfırla
            $zeroed = CurrentAccount::whereNotNull('logo_id')
                ->where('current_balance', '!=', 0)
                ->whereNotIn('logo_id', collect($balances)->pluck('logo_id')->toArray())
                ->update([
                    'current_balance' => 0,
                    'total_receivables' => 0,
                    'total_payables' => 0,
                ]);

            Log::info("Logo balance sync completed", [
                'total' => $total,
                'updated' => $updated,
                'skipped' => $skipped,
                'zeroed' => $zeroed,
            ]);

            return [
                'success' => true,
                'total' => $total,
                'updated' => $updated,
                'skipped' => $skipped,
                'zeroed' => $zeroed,
            ];

        } catch (Exception $e) {
            Log::error("Logo balance sync error: " . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    protected function findTable(int $firmNo, array $patterns): ?string
    {
        foreach ($patterns as $pattern) {
            $tableName = sprintf($pattern, $firmNo);
            try {
                $exists = DB::connection($this->connection)->selectOne(
                    "SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = ?",
                    [$tableName]
                );
                if ($exists && $exists->cnt > 0) {
                    return $tableName;
                }
            } catch (Exception $e) {
                continue;
            }
        }
        return null;
    }
}
