<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

class LogoCariEkstreService
{
    protected string $connection = 'logo';

    /**
     * Logo Tiger TRCODE -> Fiş Türü eşleştirmesi
     */
    protected array $trCodeLabels = [
        1  => 'Nakit Tahsilat',
        2  => 'Nakit Ödeme',
        3  => 'Borç Virmanı',
        4  => 'Alacak Virmanı',
        5  => 'Cari Hesap Açılış Fişi',
        14 => 'Virman / Devir',
        20 => 'Gelen Havale/EFT',
        21 => 'Gönderilen Havale/EFT',
        31 => 'Alış Faturası',
        33 => 'Toptan Satış İade Faturası',
        34 => 'Perakende Satış İade Faturası',
        36 => 'Alış İade Faturası',
        38 => 'Toptan Satış Faturası',
        61 => 'Borç Dekontu',
        63 => 'Alacak Dekontu',
        70 => 'Borç Dekontu',
        72 => 'Alacak Dekontu',
    ];

    /**
     * Cari hesap hareketlerini Logo Tiger'dan çek
     */
    public function getTransactions(int $logoId, ?string $startDate = null, ?string $endDate = null): array
    {
        $firmNo = (int) config('services.logo.firm_no', 12);
        $clflineTable = $this->findTable($firmNo, ['LG_%03d_01_CLFLINE', 'LG_%03d_CLFLINE']);

        if (!$clflineTable) {
            return ['success' => false, 'error' => "CLFLINE tablosu bulunamadı (Firm: {$firmNo})", 'transactions' => []];
        }

        try {
            $query = "
                SELECT
                    cl.LOGICALREF,
                    CONVERT(VARCHAR, cl.DATE_, 23) as transaction_date,
                    cl.TRCODE,
                    cl.MODULENR,
                    cl.SIGN,
                    cl.AMOUNT,
                    cl.TRANNO,
                    cl.DOCODE,
                    cl.LINEEXP
                FROM [{$clflineTable}] cl
                WHERE cl.CLIENTREF = ? AND cl.CANCELLED = 0
            ";

            $bindings = [$logoId];

            if ($startDate) {
                $query .= " AND cl.DATE_ >= ?";
                $bindings[] = $startDate;
            }
            if ($endDate) {
                $query .= " AND cl.DATE_ <= ?";
                $bindings[] = $endDate . ' 23:59:59';
            }

            $query .= " ORDER BY cl.DATE_ ASC, cl.LOGICALREF ASC";

            $rows = DB::connection($this->connection)->select($query, $bindings);

            // Transform to transaction format
            $transactions = [];
            $runningBalance = 0;
            $totalDebit = 0;
            $totalCredit = 0;

            foreach ($rows as $row) {
                $isDebit = $row->SIGN == 0; // SIGN=0 means Borç (debit)
                $amount = round($row->AMOUNT, 2);

                if ($isDebit) {
                    $totalDebit += $amount;
                    $runningBalance += $amount;
                } else {
                    $totalCredit += $amount;
                    $runningBalance -= $amount;
                }

                $transactions[] = (object) [
                    'id' => $row->LOGICALREF,
                    'transaction_date' => $row->transaction_date,
                    'transaction_type' => $isDebit ? 'debit' : 'credit',
                    'amount' => $amount,
                    'document_type' => $this->getTrCodeLabel($row->TRCODE),
                    'document_id' => trim($row->TRANNO ?? ''),
                    'description' => trim($row->LINEEXP ?? ''),
                    'running_balance' => round($runningBalance, 2),
                    'trcode' => $row->TRCODE,
                    'modulenr' => $row->MODULENR,
                ];
            }

            return [
                'success' => true,
                'transactions' => $transactions,
                'totalDebit' => round($totalDebit, 2),
                'totalCredit' => round($totalCredit, 2),
                'closingBalance' => round($runningBalance, 2),
            ];

        } catch (Exception $e) {
            Log::error("Logo cari ekstre error: " . $e->getMessage(), [
                'logo_id' => $logoId,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ]);
            return ['success' => false, 'error' => $e->getMessage(), 'transactions' => []];
        }
    }

    protected function getTrCodeLabel(int $trCode): string
    {
        return $this->trCodeLabels[$trCode] ?? "İşlem ({$trCode})";
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
