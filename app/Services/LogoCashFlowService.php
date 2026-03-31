<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LogoCashFlowService
{
    private string $connection = 'logo';
    private int $firmNo;
    private const CACHE_KEY = 'logo_cash_flow_data';
    private const CACHE_TTL = 600; // 10 minutes

    // Logo'daki eski/yanlış döviz kodlarını düzelt
    private const CURRENCY_MAP = [
        'XEU' => 'EUR',  // Logo'da EUR, XEU (European Currency Unit) olarak kayıtlı
        'NLG' => 'NLG',  // Hollanda Guldeni (2002'den beri geçersiz, eski kayıtlar)
    ];

    public function __construct()
    {
        $this->firmNo = (int) config('services.logo.firm_no', 12);
    }

    /**
     * Logo'daki döviz kodunu düzelt (XEU → EUR vb.)
     */
    private function normalizeCurrency(string $code): string
    {
        return self::CURRENCY_MAP[$code] ?? $code;
    }

    /**
     * Cari hesap kodundan grup belirle
     * Harf+rakam = Ana Hesap, 01xx = Yurtiçi, 02xx = Yurtdışı
     */
    private function resolveAccountGroup(string $code): string
    {
        if (preg_match('/^01/', $code)) return 'Yurtiçi';
        if (preg_match('/^02/', $code)) return 'Yurtdışı';
        return 'Ana Hesap';
    }

    public function getData(string $period = 'monthly', bool $forceRefresh = false): array
    {
        $cacheKey = self::CACHE_KEY . '_' . $period;

        if ($forceRefresh) {
            Cache::forget($cacheKey);
        }

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($period) {
            return $this->buildCashFlowData($period);
        });
    }

    private function buildCashFlowData(string $period): array
    {
        try {
            DB::connection($this->connection)->getPdo();
        } catch (\Throwable $e) {
            Log::warning('Logo DB unreachable for cash flow: ' . $e->getMessage());
            return ['connected' => false, 'generated_at' => now()->toDateTimeString()];
        }

        $bankBalances = $this->safeCall(fn () => $this->getBankBalances(), []);
        $cashBalances = $this->safeCall(fn () => $this->getCashBalances(), []);
        $receivablesSummary = $this->safeCall(fn () => $this->getReceivablesSummary(), []);
        $payablesSummary = $this->safeCall(fn () => $this->getPayablesSummary(), []);
        $checksReceivable = $this->safeCall(fn () => $this->getChecksReceivable(), []);
        $checksPayable = $this->safeCall(fn () => $this->getChecksPayable(), []);
        $overdueReceivables = $this->safeCall(fn () => $this->getOverdueReceivables(), []);
        $overduePayables = $this->safeCall(fn () => $this->getOverduePayables(), []);
        $timeline = $this->safeCall(fn () => $this->getCashFlowTimeline($period), []);

        // Calculate totals
        $totalBank = collect($bankBalances)->sum('amount');
        $totalCash = collect($cashBalances)->sum('amount');
        $totalReceivables = $receivablesSummary['total'] ?? 0;
        $totalPayables = $payablesSummary['total'] ?? 0;
        $totalChecksIn = collect($checksReceivable)->sum('amount');
        $totalChecksOut = collect($checksPayable)->sum('amount');
        $overdueRecTotal = collect($overdueReceivables)->sum('amount');
        $overduePayTotal = collect($overduePayables)->sum('amount');

        return [
            'connected' => true,
            'generated_at' => now()->toDateTimeString(),

            'summary' => [
                'total_cash' => round($totalBank + $totalCash, 2),
                'total_bank' => round($totalBank, 2),
                'total_kasa' => round($totalCash, 2),
                'total_receivables' => round($totalReceivables, 2),
                'total_payables' => round($totalPayables, 2),
                'net_position' => round($totalBank + $totalCash + $totalReceivables - $totalPayables, 2),
                'total_checks_receivable' => round($totalChecksIn, 2),
                'total_checks_payable' => round($totalChecksOut, 2),
                'overdue_receivables' => round($overdueRecTotal, 2),
                'overdue_payables' => round($overduePayTotal, 2),
            ],

            'bank_balances' => $bankBalances,
            'cash_balances' => $cashBalances,
            'receivables' => $receivablesSummary,
            'payables' => $payablesSummary,
            'checks_receivable' => $checksReceivable,
            'checks_payable' => $checksPayable,
            'overdue_receivables' => $overdueReceivables,
            'overdue_payables' => $overduePayables,
            'timeline' => $timeline,

            'filters' => [
                'period' => $period,
            ],
        ];
    }

    // ==================== BANK & CASH BALANCES ====================

    private function getBankBalances(): array
    {
        $transTable = $this->findTable(['LG_%03d_01_BNFLINE', 'LG_%03d_BNFLINE']);
        if (!$transTable) return [];

        $cardTable = sprintf('LG_%03d_BNCARD', $this->firmNo);

        $rows = DB::connection($this->connection)->select("
            SELECT
                bfl.TRCURR as currency_code,
                ISNULL(cur.CURCODE, CASE WHEN bfl.TRCURR = 0 THEN 'TRY' ELSE CAST(bfl.TRCURR as VARCHAR) END) as currency,
                bfl.BANKREF as bank_ref,
                ISNULL(bc.CODE, '') as account_code,
                ISNULL(bc.DEFINITION_, '') as account_name,
                ISNULL(bc.BRANCH, '') as branch,
                ISNULL(SUM(CASE WHEN bfl.SIGN = 0 THEN bfl.AMOUNT ELSE 0 END), 0) as total_in,
                ISNULL(SUM(CASE WHEN bfl.SIGN = 1 THEN bfl.AMOUNT ELSE 0 END), 0) as total_out,
                ISNULL(SUM(CASE WHEN bfl.SIGN = 0 THEN bfl.AMOUNT ELSE -bfl.AMOUNT END), 0) as net_bakiye,
                ISNULL(SUM(CASE WHEN bfl.SIGN = 0 THEN bfl.TRNET ELSE 0 END), 0) as total_in_foreign,
                ISNULL(SUM(CASE WHEN bfl.SIGN = 1 THEN bfl.TRNET ELSE 0 END), 0) as total_out_foreign,
                ISNULL(SUM(CASE WHEN bfl.SIGN = 0 THEN bfl.TRNET ELSE -bfl.TRNET END), 0) as net_bakiye_foreign
            FROM [{$transTable}] bfl
            LEFT JOIN L_CURRENCYLIST cur ON bfl.TRCURR = cur.LOGICALREF
            LEFT JOIN [{$cardTable}] bc ON bfl.BANKREF = bc.LOGICALREF
            WHERE bfl.CANCELLED = 0
            GROUP BY bfl.TRCURR, cur.CURCODE, bfl.BANKREF, bc.CODE, bc.DEFINITION_, bc.BRANCH
            HAVING ISNULL(SUM(CASE WHEN bfl.SIGN = 0 THEN bfl.AMOUNT ELSE -bfl.AMOUNT END), 0) != 0
            ORDER BY currency, net_bakiye DESC
        ");

        return collect($rows)->map(fn ($r) => [
            'account_code' => (string) ($r->account_code ?? ''),
            'account_name' => (string) ($r->account_name ?? ''),
            'branch' => (string) ($r->branch ?? ''),
            'currency' => $this->normalizeCurrency((string) ($r->currency ?? 'TRY')),
            'total_in' => round((float) ($r->total_in ?? 0), 2),
            'total_out' => round((float) ($r->total_out ?? 0), 2),
            'amount' => round((float) ($r->net_bakiye ?? 0), 2),
            // Döviz hesapları için orijinal döviz cinsinden tutarlar
            'total_in_foreign' => ($r->currency_code ?? 0) != 0 ? round((float) ($r->total_in_foreign ?? 0), 2) : null,
            'total_out_foreign' => ($r->currency_code ?? 0) != 0 ? round((float) ($r->total_out_foreign ?? 0), 2) : null,
            'amount_foreign' => ($r->currency_code ?? 0) != 0 ? round((float) ($r->net_bakiye_foreign ?? 0), 2) : null,
        ])->values()->all();
    }

    private function getCashBalances(): array
    {
        $transTable = $this->findTable(['LG_%03d_01_KSLINES', 'LG_%03d_KSLINES']);
        if (!$transTable) return [];

        $rows = DB::connection($this->connection)->select("
            SELECT
                ksl.TRCURR as currency_code,
                ISNULL(cur.CURCODE, CASE WHEN ksl.TRCURR = 0 THEN 'TRY' ELSE CAST(ksl.TRCURR as VARCHAR) END) as currency,
                COUNT(DISTINCT ksl.CARDREF) as account_count,
                ISNULL(SUM(CASE WHEN ksl.SIGN = 0 THEN ksl.AMOUNT ELSE -ksl.AMOUNT END), 0) as net_bakiye
            FROM [{$transTable}] ksl
            LEFT JOIN L_CURRENCYLIST cur ON ksl.TRCURR = cur.LOGICALREF
            WHERE ksl.CANCELLED = 0
            GROUP BY ksl.TRCURR, cur.CURCODE
        ");

        return collect($rows)->map(fn ($r) => [
            'currency' => $this->normalizeCurrency((string) ($r->currency ?? 'TRY')),
            'amount' => round((float) ($r->net_bakiye ?? 0), 2),
            'account_count' => (int) ($r->account_count ?? 0),
        ])->filter(fn ($r) => $r['amount'] != 0)->values()->all();
    }

    // ==================== RECEIVABLES & PAYABLES ====================

    private function getReceivablesSummary(): array
    {
        return $this->getAccountSummary(0); // SIGN=0 = Borç (müşteri bize borçlu)
    }

    private function getPayablesSummary(): array
    {
        return $this->getAccountSummary(1); // SIGN=1 = Alacak (biz borçluyuz)
    }

    private function getAccountSummary(int $signFilter): array
    {
        $clfTable = $this->findTable(['LG_%03d_01_CLFLINE', 'LG_%03d_CLFLINE']);
        $clTable = $this->findTable(['LG_%03d_CLCARD', 'LG_%03d_01_CLCARD']);
        if (!$clfTable || !$clTable) return ['total' => 0, 'by_period' => [], 'by_customer' => [], 'by_currency' => []];

        // Net balances per customer
        $rows = DB::connection($this->connection)->select("
            SELECT
                cl.LOGICALREF as cari_ref,
                cl.CODE as cari_kodu,
                cl.DEFINITION_ as cari_adi,
                ISNULL(SUM(CASE WHEN clf.SIGN = 0 THEN clf.AMOUNT ELSE 0 END), 0) as borc,
                ISNULL(SUM(CASE WHEN clf.SIGN = 1 THEN clf.AMOUNT ELSE 0 END), 0) as alacak,
                ISNULL(SUM(CASE WHEN clf.SIGN = 0 THEN clf.AMOUNT ELSE -clf.AMOUNT END), 0) as net_bakiye
            FROM [{$clfTable}] clf
            JOIN [{$clTable}] cl ON clf.CLIENTREF = cl.LOGICALREF
            WHERE clf.CANCELLED = 0
            GROUP BY cl.LOGICALREF, cl.CODE, cl.DEFINITION_
            " . ($signFilter === 0
                ? "HAVING ISNULL(SUM(CASE WHEN clf.SIGN = 0 THEN clf.AMOUNT ELSE -clf.AMOUNT END), 0) > 0"
                : "HAVING ISNULL(SUM(CASE WHEN clf.SIGN = 0 THEN clf.AMOUNT ELSE -clf.AMOUNT END), 0) < 0"
            ) . "
            ORDER BY ABS(ISNULL(SUM(CASE WHEN clf.SIGN = 0 THEN clf.AMOUNT ELSE -clf.AMOUNT END), 0)) DESC
        ");

        $total = 0;
        $customers = [];
        foreach ($rows as $r) {
            $balance = abs(round((float) $r->net_bakiye, 2));
            $total += $balance;
            $cariKodu = (string) $r->cari_kodu;
            $customers[] = [
                'cari_ref' => (int) $r->cari_ref,
                'cari_kodu' => $cariKodu,
                'cari_adi' => (string) $r->cari_adi,
                'grup' => $this->resolveAccountGroup($cariKodu),
                'borc' => round((float) $r->borc, 2),
                'alacak' => round((float) $r->alacak, 2),
                'net_bakiye' => round((float) $r->net_bakiye, 2),
                'amount' => $balance,
            ];
        }

        // Döviz bazlı kırılım (TRNET = döviz cinsinden tutar)
        $byCurrency = [];
        $currencyRows = DB::connection($this->connection)->select("
            SELECT
                ISNULL(cur.CURCODE, CASE WHEN clf.TRCURR = 0 THEN 'TRY' ELSE CAST(clf.TRCURR as VARCHAR) END) as currency,
                ISNULL(SUM(CASE WHEN clf.SIGN = 0 THEN clf.TRNET ELSE 0 END), 0) as borc_doviz,
                ISNULL(SUM(CASE WHEN clf.SIGN = 1 THEN clf.TRNET ELSE 0 END), 0) as alacak_doviz,
                ISNULL(SUM(CASE WHEN clf.SIGN = 0 THEN clf.TRNET ELSE -clf.TRNET END), 0) as net_doviz,
                ISNULL(SUM(CASE WHEN clf.SIGN = 0 THEN clf.AMOUNT ELSE -clf.AMOUNT END), 0) as net_try,
                COUNT(DISTINCT clf.CLIENTREF) as cari_sayisi
            FROM [{$clfTable}] clf
            LEFT JOIN L_CURRENCYLIST cur ON clf.TRCURR = cur.LOGICALREF
            WHERE clf.CANCELLED = 0
            GROUP BY clf.TRCURR, cur.CURCODE
            " . ($signFilter === 0
                ? "HAVING ISNULL(SUM(CASE WHEN clf.SIGN = 0 THEN clf.AMOUNT ELSE -clf.AMOUNT END), 0) > 0"
                : "HAVING ISNULL(SUM(CASE WHEN clf.SIGN = 0 THEN clf.AMOUNT ELSE -clf.AMOUNT END), 0) < 0"
            ) . "
            ORDER BY ABS(ISNULL(SUM(CASE WHEN clf.SIGN = 0 THEN clf.AMOUNT ELSE -clf.AMOUNT END), 0)) DESC
        ");

        foreach ($currencyRows as $cr) {
            $currency = $this->normalizeCurrency((string) $cr->currency);
            $byCurrency[] = [
                'currency' => $currency,
                'net_doviz' => round((float) $cr->net_doviz, 2),
                'net_try' => round(abs((float) $cr->net_try), 2),
                'cari_sayisi' => (int) $cr->cari_sayisi,
            ];
        }

        return [
            'total' => round($total, 2),
            'count' => count($customers),
            'by_customer' => $customers, // Tümü gönder, frontend sayfalama yapar
            'by_currency' => $byCurrency,
        ];
    }

    // ==================== OVERDUE ====================

    private function getOverdueReceivables(): array
    {
        return $this->getOverdueAccounts('receivable');
    }

    private function getOverduePayables(): array
    {
        return $this->getOverdueAccounts('payable');
    }

    private function getOverdueAccounts(string $type): array
    {
        $clfTable = $this->findTable(['LG_%03d_01_CLFLINE', 'LG_%03d_CLFLINE']);
        $clTable = $this->findTable(['LG_%03d_CLCARD', 'LG_%03d_01_CLCARD']);
        if (!$clfTable || !$clTable) return [];

        // Aging analysis: net balance per customer, filtered by those with balance in the right direction
        // Then break down their transactions by age
        $havingCondition = $type === 'receivable'
            ? "HAVING ISNULL(SUM(CASE WHEN clf.SIGN = 0 THEN clf.AMOUNT ELSE -clf.AMOUNT END), 0) > 1"
            : "HAVING ISNULL(SUM(CASE WHEN clf.SIGN = 0 THEN clf.AMOUNT ELSE -clf.AMOUNT END), 0) < -1";

        $rows = DB::connection($this->connection)->select("
            SELECT TOP 30
                cl.CODE as cari_kodu,
                cl.DEFINITION_ as cari_adi,
                ISNULL(SUM(CASE WHEN clf.SIGN = 0 THEN clf.AMOUNT ELSE -clf.AMOUNT END), 0) as net_bakiye,
                MAX(clf.DATE_) as son_hareket,
                DATEDIFF(DAY, MAX(clf.DATE_), GETDATE()) as gecikme_gun
            FROM [{$clfTable}] clf
            JOIN [{$clTable}] cl ON clf.CLIENTREF = cl.LOGICALREF
            WHERE clf.CANCELLED = 0
            GROUP BY cl.CODE, cl.DEFINITION_
            {$havingCondition}
            ORDER BY ABS(ISNULL(SUM(CASE WHEN clf.SIGN = 0 THEN clf.AMOUNT ELSE -clf.AMOUNT END), 0)) DESC
        ");

        return collect($rows)->map(fn ($r) => [
            'cari_kodu' => (string) $r->cari_kodu,
            'cari_adi' => (string) $r->cari_adi,
            'net_bakiye' => round((float) $r->net_bakiye, 2),
            'amount' => abs(round((float) $r->net_bakiye, 2)),
            'son_hareket' => $r->son_hareket ? Carbon::parse($r->son_hareket)->format('Y-m-d') : null,
            'gecikme_gun' => (int) ($r->gecikme_gun ?? 0), // Aslında "son hareketten bu yana geçen gün"
            'hareketsiz_gun' => (int) ($r->gecikme_gun ?? 0),
        ])->all();
    }

    // ==================== CHECKS (ÇEK/SENET) ====================

    private function getChecksReceivable(): array
    {
        // DOC=1: Çek, CURRSTAT=1: Portföyde, CURRSTAT=2: Tahsile verildi
        return $this->getChecks([1, 2], 'Alınan Çekler');
    }

    private function getChecksPayable(): array
    {
        // DOC=3: Senet, CURRSTAT=8: Portföyde, CURRSTAT=9: Ödemeye verildi
        return $this->getChecks([8, 9], 'Verilen Çek/Senet');
    }

    private function getChecks(array $currStatuses, string $label): array
    {
        $csTable = $this->findTable(['LG_%03d_01_CSCARD', 'LG_%03d_CSCARD']);
        if (!$csTable) return [];

        $statusPlaceholders = implode(',', $currStatuses);

        $rows = DB::connection($this->connection)->select("
            SELECT
                cs.LOGICALREF,
                cs.DOC,
                cs.CURRSTAT,
                cs.PORTFOYNO,
                cs.SERINO,
                cs.BANKNAME,
                cs.OWING,
                CONVERT(VARCHAR, cs.DUEDATE, 23) as vade_tarihi,
                CONVERT(VARCHAR, cs.SETDATE, 23) as islem_tarihi,
                cs.AMOUNT,
                ISNULL(cur.CURCODE, CASE WHEN cs.TRCURR = 0 THEN 'TRY' ELSE CAST(cs.TRCURR as VARCHAR) END) as currency,
                cs.STATUS,
                DATEDIFF(DAY, GETDATE(), cs.DUEDATE) as vadeye_kalan_gun
            FROM [{$csTable}] cs
            LEFT JOIN L_CURRENCYLIST cur ON cs.TRCURR = cur.LOGICALREF
            WHERE cs.CANCELLED = 0 AND cs.CURRSTAT IN ({$statusPlaceholders})
            ORDER BY cs.DUEDATE ASC
        ");

        $statusLabels = [
            1 => 'Portföyde',
            2 => 'Tahsile Verildi',
            3 => 'Tahsil Edildi',
            4 => 'İade Edildi',
            5 => 'Karşılıksız',
            8 => 'Portföyde',
            9 => 'Ödemeye Verildi',
            10 => 'Ödendi',
        ];

        $docLabels = [1 => 'Çek', 2 => 'Senet', 3 => 'Senet'];

        return collect($rows)->map(fn ($r) => [
            'id' => (int) $r->LOGICALREF,
            'tip' => $docLabels[$r->DOC] ?? 'Diğer',
            'portfoy_no' => (string) ($r->PORTFOYNO ?? ''),
            'seri_no' => (string) ($r->SERINO ?? ''),
            'banka' => (string) ($r->BANKNAME ?? ''),
            'cari_adi' => (string) ($r->OWING ?? ''),
            'vade_tarihi' => (string) ($r->vade_tarihi ?? ''),
            'islem_tarihi' => (string) ($r->islem_tarihi ?? ''),
            'amount' => round((float) ($r->AMOUNT ?? 0), 2),
            'currency' => $this->normalizeCurrency((string) ($r->currency ?? 'TRY')),
            'durum' => $statusLabels[$r->CURRSTAT] ?? 'Bilinmiyor',
            'vadeye_kalan_gun' => (int) ($r->vadeye_kalan_gun ?? 0),
            'vadesi_gecmis' => ($r->vadeye_kalan_gun ?? 0) < 0,
        ])->all();
    }

    // ==================== TIMELINE ====================

    private function getCashFlowTimeline(string $period): array
    {
        $clfTable = $this->findTable(['LG_%03d_01_CLFLINE', 'LG_%03d_CLFLINE']);
        $bnfTable = $this->findTable(['LG_%03d_01_BNFLINE', 'LG_%03d_BNFLINE']);
        $ksTable = $this->findTable(['LG_%03d_01_KSLINES', 'LG_%03d_KSLINES']);
        $csTable = $this->findTable(['LG_%03d_01_CSCARD', 'LG_%03d_CSCARD']);

        $months = ['', 'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
        $result = [];

        if ($period === 'weekly') {
            // Last 8 weeks + next 8 weeks
            $result = $this->buildWeeklyTimeline($clfTable, $bnfTable, $ksTable, $csTable);
        } else {
            // Last 6 months + next 6 months
            $result = $this->buildMonthlyTimeline($clfTable, $bnfTable, $ksTable, $csTable, $months);
        }

        return $result;
    }

    private function buildMonthlyTimeline(?string $clfTable, ?string $bnfTable, ?string $ksTable, ?string $csTable, array $months): array
    {
        $result = [];

        // Past 6 months: actual data from bank + cash transactions
        if ($bnfTable) {
            $bankData = DB::connection($this->connection)->select("
                SELECT
                    YEAR(DATE_) as yil, MONTH(DATE_) as ay,
                    ISNULL(SUM(CASE WHEN SIGN = 0 THEN AMOUNT ELSE 0 END), 0) as giris,
                    ISNULL(SUM(CASE WHEN SIGN = 1 THEN AMOUNT ELSE 0 END), 0) as cikis
                FROM [{$bnfTable}]
                WHERE CANCELLED = 0
                  AND DATE_ >= DATEADD(MONTH, -6, CAST(DATEADD(DAY, 1-DAY(GETDATE()), GETDATE()) AS DATE))
                  AND DATE_ < CAST(DATEADD(DAY, 1-DAY(GETDATE()), GETDATE()) AS DATE)
                GROUP BY YEAR(DATE_), MONTH(DATE_)
            ");

            $bankMap = collect($bankData)->keyBy(fn ($r) => $r->yil . '-' . str_pad($r->ay, 2, '0', STR_PAD_LEFT));
        } else {
            $bankMap = collect();
        }

        // Past 6 months
        for ($i = 6; $i >= 1; $i--) {
            $date = Carbon::now()->subMonths($i);
            $key = $date->format('Y-m');
            $label = $months[(int) $date->format('m')] . ' ' . $date->format('Y');
            $bankRow = $bankMap->get($key);

            $result[] = [
                'label' => $label,
                'period_key' => $key,
                'type' => 'actual',
                'giris' => round((float) ($bankRow?->giris ?? 0), 2),
                'cikis' => round((float) ($bankRow?->cikis ?? 0), 2),
                'net' => round((float) (($bankRow?->giris ?? 0) - ($bankRow?->cikis ?? 0)), 2),
            ];
        }

        // Current month
        $currentKey = Carbon::now()->format('Y-m');
        $currentLabel = $months[(int) Carbon::now()->format('m')] . ' ' . Carbon::now()->format('Y');
        $currentBank = $bankMap->get($currentKey);

        if ($bnfTable) {
            $currentData = DB::connection($this->connection)->selectOne("
                SELECT
                    ISNULL(SUM(CASE WHEN SIGN = 0 THEN AMOUNT ELSE 0 END), 0) as giris,
                    ISNULL(SUM(CASE WHEN SIGN = 1 THEN AMOUNT ELSE 0 END), 0) as cikis
                FROM [{$bnfTable}]
                WHERE CANCELLED = 0
                  AND YEAR(DATE_) = YEAR(GETDATE()) AND MONTH(DATE_) = MONTH(GETDATE())
            ");
        }

        $result[] = [
            'label' => $currentLabel . ' *',
            'period_key' => $currentKey,
            'type' => 'current',
            'giris' => round((float) ($currentData->giris ?? 0), 2),
            'cikis' => round((float) ($currentData->cikis ?? 0), 2),
            'net' => round((float) (($currentData->giris ?? 0) - ($currentData->cikis ?? 0)), 2),
        ];

        // Future 6 months: projection from check due dates
        if ($csTable) {
            $futureChecks = DB::connection($this->connection)->select("
                SELECT
                    YEAR(DUEDATE) as yil, MONTH(DUEDATE) as ay,
                    ISNULL(SUM(CASE WHEN CURRSTAT IN (1,2) THEN AMOUNT ELSE 0 END), 0) as cek_giris,
                    ISNULL(SUM(CASE WHEN CURRSTAT IN (8,9) THEN AMOUNT ELSE 0 END), 0) as cek_cikis
                FROM [{$csTable}]
                WHERE CANCELLED = 0
                  AND DUEDATE >= CAST(DATEADD(DAY, 1-DAY(DATEADD(MONTH, 1, GETDATE())), DATEADD(MONTH, 1, GETDATE())) AS DATE)
                  AND DUEDATE < DATEADD(MONTH, 7, CAST(DATEADD(DAY, 1-DAY(GETDATE()), GETDATE()) AS DATE))
                  AND CURRSTAT IN (1, 2, 8, 9)
                GROUP BY YEAR(DUEDATE), MONTH(DUEDATE)
            ");
            $checkMap = collect($futureChecks)->keyBy(fn ($r) => $r->yil . '-' . str_pad($r->ay, 2, '0', STR_PAD_LEFT));
        } else {
            $checkMap = collect();
        }

        for ($i = 1; $i <= 6; $i++) {
            $date = Carbon::now()->addMonths($i);
            $key = $date->format('Y-m');
            $label = $months[(int) $date->format('m')] . ' ' . $date->format('Y');
            $checkRow = $checkMap->get($key);

            $result[] = [
                'label' => $label,
                'period_key' => $key,
                'type' => 'projection',
                'giris' => round((float) ($checkRow?->cek_giris ?? 0), 2),
                'cikis' => round((float) ($checkRow?->cek_cikis ?? 0), 2),
                'net' => round((float) (($checkRow?->cek_giris ?? 0) - ($checkRow?->cek_cikis ?? 0)), 2),
            ];
        }

        return $result;
    }

    private function buildWeeklyTimeline(?string $clfTable, ?string $bnfTable, ?string $ksTable, ?string $csTable): array
    {
        $result = [];

        // Past 8 weeks from bank
        if ($bnfTable) {
            $bankData = DB::connection($this->connection)->select("
                SELECT
                    DATEPART(ISO_WEEK, DATE_) as hafta,
                    YEAR(DATE_) as yil,
                    MIN(CONVERT(VARCHAR, DATE_, 23)) as hafta_basi,
                    ISNULL(SUM(CASE WHEN SIGN = 0 THEN AMOUNT ELSE 0 END), 0) as giris,
                    ISNULL(SUM(CASE WHEN SIGN = 1 THEN AMOUNT ELSE 0 END), 0) as cikis
                FROM [{$bnfTable}]
                WHERE CANCELLED = 0
                  AND DATE_ >= DATEADD(WEEK, -8, GETDATE())
                  AND DATE_ <= GETDATE()
                GROUP BY DATEPART(ISO_WEEK, DATE_), YEAR(DATE_)
                ORDER BY yil, hafta
            ");
        } else {
            $bankData = [];
        }

        foreach ($bankData as $r) {
            $weekStart = Carbon::parse($r->hafta_basi);
            $result[] = [
                'label' => $weekStart->format('d.m') . ' - ' . $weekStart->addDays(6)->format('d.m'),
                'period_key' => $r->yil . '-W' . str_pad($r->hafta, 2, '0', STR_PAD_LEFT),
                'type' => 'actual',
                'giris' => round((float) $r->giris, 2),
                'cikis' => round((float) $r->cikis, 2),
                'net' => round((float) ($r->giris - $r->cikis), 2),
            ];
        }

        // Future 8 weeks from checks
        if ($csTable) {
            for ($i = 0; $i < 8; $i++) {
                $weekStart = Carbon::now()->startOfWeek()->addWeeks($i);
                $weekEnd = $weekStart->copy()->endOfWeek();

                $checkData = DB::connection($this->connection)->selectOne("
                    SELECT
                        ISNULL(SUM(CASE WHEN CURRSTAT IN (1,2) THEN AMOUNT ELSE 0 END), 0) as cek_giris,
                        ISNULL(SUM(CASE WHEN CURRSTAT IN (8,9) THEN AMOUNT ELSE 0 END), 0) as cek_cikis
                    FROM [{$csTable}]
                    WHERE CANCELLED = 0
                      AND DUEDATE >= ? AND DUEDATE <= ?
                      AND CURRSTAT IN (1, 2, 8, 9)
                ", [$weekStart->format('Y-m-d'), $weekEnd->format('Y-m-d')]);

                $result[] = [
                    'label' => $weekStart->format('d.m') . ' - ' . $weekEnd->format('d.m'),
                    'period_key' => $weekStart->format('Y') . '-W' . $weekStart->format('W'),
                    'type' => $i === 0 ? 'current' : 'projection',
                    'giris' => round((float) ($checkData->cek_giris ?? 0), 2),
                    'cikis' => round((float) ($checkData->cek_cikis ?? 0), 2),
                    'net' => round((float) (($checkData->cek_giris ?? 0) - ($checkData->cek_cikis ?? 0)), 2),
                ];
            }
        }

        return $result;
    }

    // ==================== HELPERS ====================

    private function findTable(array $patterns): ?string
    {
        try {
            foreach ($patterns as $pattern) {
                $tableName = sprintf($pattern, $this->firmNo);
                $exists = DB::connection($this->connection)->selectOne(
                    "SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = ?",
                    [$tableName]
                );
                if ($exists && $exists->cnt > 0) {
                    return $tableName;
                }
            }
            return null;
        } catch (\Throwable) {
            return null;
        }
    }

    private function safeCall(callable $fn, mixed $default): mixed
    {
        try {
            return $fn();
        } catch (\Throwable $e) {
            Log::warning('CashFlow query failed: ' . $e->getMessage());
            return $default;
        }
    }
}
