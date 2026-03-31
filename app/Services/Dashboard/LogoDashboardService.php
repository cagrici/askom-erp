<?php

namespace App\Services\Dashboard;

use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LogoDashboardService
{
    private string $connection = 'logo';
    private int $firmNo;
    private const CACHE_KEY = 'logo_dashboard_data';
    private const CACHE_TTL = 900; // 15 minutes

    public function __construct()
    {
        $this->firmNo = (int) config('services.logo.firm_no', 1);
    }

    public function getData(bool $forceRefresh = false): array
    {
        if ($forceRefresh) {
            Cache::forget(self::CACHE_KEY);
        }

        return Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
            return $this->buildDashboardData();
        });
    }

    private function buildDashboardData(): array
    {
        try {
            DB::connection($this->connection)->getPdo();
        } catch (\Throwable $e) {
            Log::warning('Logo DB unreachable for dashboard: ' . $e->getMessage());

            return ['connected' => false, 'generated_at' => now()->toDateTimeString()];
        }

        return [
            'connected' => true,
            'generated_at' => now()->toDateTimeString(),
            'cache_ttl_minutes' => self::CACHE_TTL / 60,

            // KPI Cards
            'kpi' => $this->safeCall(fn () => $this->getKpiCards(), []),

            // Charts
            'monthly_revenue_trend' => $this->safeCall(fn () => $this->getMonthlyRevenueTrend(), []),
            'top_customers' => $this->safeCall(fn () => $this->getTopCustomersByRevenue(), []),
            'top_products' => $this->safeCall(fn () => $this->getTopProductsBySales(), []),
            'salesperson_performance' => $this->safeCall(fn () => $this->getSalespersonPerformance(), []),
            'customer_aging' => $this->safeCall(fn () => $this->getCustomerAgingAnalysis(), []),
            'invoice_vs_collection' => $this->safeCall(fn () => $this->getInvoiceVsCollectionTrend(), []),
            'stock_distribution' => $this->safeCall(fn () => $this->getStockValueDistribution(), []),
            'daily_sales_30d' => $this->safeCall(fn () => $this->getDailySalesLast30Days(), []),
            'bank_balance_trend' => $this->safeCall(fn () => $this->getBankBalanceTrend(), []),
            'order_status_funnel' => $this->safeCall(fn () => $this->getOrderStatusFunnel(), []),

            // Financial summaries
            'cari_net' => $this->safeCall(fn () => $this->getCariNetBalance(), null),
            'top_debtors' => $this->safeCall(fn () => $this->getTopDebtors(), []),
            'bank_balances' => $this->safeCall(fn () => $this->getBankBalances(), []),
            'cash_balances' => $this->safeCall(fn () => $this->getCashBalances(), []),
        ];
    }

    // ==================== KPI CARDS ====================

    private function getKpiCards(): array
    {
        $invoiceTable = $this->findTable(['LG_%03d_INVOICE', 'LG_%03d_01_INVOICE']);
        $clfTable = $this->findTable(['LG_%03d_01_CLFLINE', 'LG_%03d_CLFLINE']);
        $orfTable = $this->findTable(['LG_%03d_ORFICHE', 'LG_%03d_01_ORFICHE']);
        $bnfTable = $this->findTable(['LG_%03d_01_BNFLINE', 'LG_%03d_BNFLINE']);

        $cards = [];

        // 1. Aylik Ciro (from INVOICE)
        if ($invoiceTable) {
            $thisMonth = DB::connection($this->connection)->selectOne("
                SELECT ISNULL(SUM(NETTOTAL), 0) as toplam
                FROM [{$invoiceTable}]
                WHERE CANCELLED = 0 AND TRCODE = 8
                  AND YEAR(DATE_) = YEAR(GETDATE()) AND MONTH(DATE_) = MONTH(GETDATE())
            ");
            $lastMonth = DB::connection($this->connection)->selectOne("
                SELECT ISNULL(SUM(NETTOTAL), 0) as toplam
                FROM [{$invoiceTable}]
                WHERE CANCELLED = 0 AND TRCODE = 8
                  AND YEAR(DATE_) = YEAR(DATEADD(MONTH, -1, GETDATE()))
                  AND MONTH(DATE_) = MONTH(DATEADD(MONTH, -1, GETDATE()))
            ");

            $current = $this->toFloat($thisMonth->toplam ?? 0);
            $previous = $this->toFloat($lastMonth->toplam ?? 0);

            $cards[] = [
                'key' => 'monthly_revenue',
                'title' => 'Aylık Ciro (Fatura)',
                'value' => $current,
                'previous' => $previous,
                'change' => $this->calculateChange($current, $previous),
                'currency' => 'TRY',
                'icon' => 'ri-line-chart-line',
                'color' => 'primary',
            ];
        }

        // 2. Net Alacak (from CLFLINE)
        if ($clfTable) {
            $result = DB::connection($this->connection)->selectOne("
                SELECT
                    ISNULL(SUM(CASE WHEN SIGN = 0 THEN AMOUNT ELSE 0 END), 0) as toplam_borc,
                    ISNULL(SUM(CASE WHEN SIGN = 1 THEN AMOUNT ELSE 0 END), 0) as toplam_alacak
                FROM [{$clfTable}]
                WHERE CANCELLED = 0
            ");

            $netAlacak = $this->toFloat(($result->toplam_borc ?? 0) - ($result->toplam_alacak ?? 0));

            $cards[] = [
                'key' => 'net_receivable',
                'title' => 'Net Alacak',
                'value' => $netAlacak,
                'previous' => 0,
                'change' => ['percent' => 0, 'trend' => 'flat'],
                'currency' => 'TRY',
                'icon' => 'ri-wallet-3-line',
                'color' => $netAlacak >= 0 ? 'success' : 'danger',
            ];
        }

        // 3. Acik Siparis (from ORFICHE)
        if ($orfTable) {
            $result = DB::connection($this->connection)->selectOne("
                SELECT
                    COUNT(*) as siparis_sayisi,
                    ISNULL(SUM(NETTOTAL), 0) as toplam_tutar
                FROM [{$orfTable}]
                WHERE CANCELLED = 0 AND TRCODE = 1 AND CLOSED = 0
            ");

            $cards[] = [
                'key' => 'open_orders',
                'title' => 'Açık Sipariş',
                'value' => (float) ($result->siparis_sayisi ?? 0),
                'previous' => $this->toFloat($result->toplam_tutar ?? 0),
                'change' => ['percent' => 0, 'trend' => 'flat'],
                'currency' => null,
                'icon' => 'ri-shopping-bag-3-line',
                'color' => 'info',
                'subtitle_value' => $this->toFloat($result->toplam_tutar ?? 0),
            ];
        }

        // 4. Banka Toplam TRY (from BNFLINE)
        if ($bnfTable) {
            $result = DB::connection($this->connection)->selectOne("
                SELECT
                    ISNULL(SUM(CASE WHEN SIGN = 0 THEN AMOUNT ELSE -AMOUNT END), 0) as net_bakiye
                FROM [{$bnfTable}]
                WHERE CANCELLED = 0 AND TRCURR = 0
            ");

            $cards[] = [
                'key' => 'bank_total',
                'title' => 'Banka Bakiye (TRY)',
                'value' => $this->toFloat($result->net_bakiye ?? 0),
                'previous' => 0,
                'change' => ['percent' => 0, 'trend' => 'flat'],
                'currency' => 'TRY',
                'icon' => 'ri-bank-line',
                'color' => 'success',
            ];
        }

        return $cards;
    }

    // ==================== CHART QUERIES ====================

    /**
     * 1. Son 12 ay aylık ciro trendi (INVOICE tablosundan)
     */
    private function getMonthlyRevenueTrend(): array
    {
        $table = $this->findTable(['LG_%03d_INVOICE', 'LG_%03d_01_INVOICE']);
        if (!$table) {
            return [];
        }

        $rows = DB::connection($this->connection)->select("
            SELECT
                YEAR(DATE_) as yil,
                MONTH(DATE_) as ay,
                ISNULL(SUM(NETTOTAL), 0) as kdv_dahil,
                ISNULL(SUM(GROSSTOTAL), 0) as kdv_haric,
                ISNULL(SUM(TOTALVAT), 0) as kdv,
                COUNT(*) as fatura_sayisi
            FROM [{$table}]
            WHERE CANCELLED = 0 AND TRCODE = 8
              AND DATE_ >= DATEADD(MONTH, -12, CAST(DATEADD(DAY, 1-DAY(GETDATE()), GETDATE()) AS DATE))
            GROUP BY YEAR(DATE_), MONTH(DATE_)
            ORDER BY yil, ay
        ");

        $months = ['', 'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

        return collect($rows)->map(fn ($r) => [
            'label' => $months[(int) $r->ay] . ' ' . $r->yil,
            'nettotal' => $this->toFloat($r->kdv_dahil),
            'grosstotal' => $this->toFloat($r->kdv_haric),
            'vat' => $this->toFloat($r->kdv),
            'count' => (int) $r->fatura_sayisi,
        ])->all();
    }

    /**
     * 2. En çok ciro yapan 10 müşteri (son 12 ay)
     */
    private function getTopCustomersByRevenue(): array
    {
        $invTable = $this->findTable(['LG_%03d_INVOICE', 'LG_%03d_01_INVOICE']);
        $clTable = $this->findTable(['LG_%03d_CLCARD', 'LG_%03d_01_CLCARD']);
        if (!$invTable || !$clTable) {
            return [];
        }

        $rows = DB::connection($this->connection)->select("
            SELECT TOP 10
                cl.CODE as cari_kodu,
                cl.DEFINITION_ as cari_adi,
                ISNULL(SUM(inv.NETTOTAL), 0) as toplam_ciro,
                COUNT(*) as fatura_sayisi
            FROM [{$invTable}] inv
            LEFT JOIN [{$clTable}] cl ON inv.CLIENTREF = cl.LOGICALREF
            WHERE inv.CANCELLED = 0 AND inv.TRCODE = 8
              AND inv.DATE_ >= DATEADD(MONTH, -12, GETDATE())
            GROUP BY cl.CODE, cl.DEFINITION_, inv.CLIENTREF
            ORDER BY toplam_ciro DESC
        ");

        return collect($rows)->map(fn ($r) => [
            'cari_kodu' => (string) ($r->cari_kodu ?? ''),
            'cari_adi' => (string) ($r->cari_adi ?? 'Bilinmeyen'),
            'ciro' => $this->toFloat($r->toplam_ciro),
            'fatura_sayisi' => (int) $r->fatura_sayisi,
        ])->all();
    }

    /**
     * 3. En çok satan 10 ürün (son 12 ay, sipariş bazlı)
     */
    private function getTopProductsBySales(): array
    {
        $orfLineTable = $this->findTable(['LG_%03d_ORFLINE', 'LG_%03d_01_ORFLINE']);
        $orfTable = $this->findTable(['LG_%03d_ORFICHE', 'LG_%03d_01_ORFICHE']);
        $itemsTable = $this->findTable(['LG_%03d_ITEMS', 'LG_%03d_01_ITEMS']);
        if (!$orfLineTable || !$orfTable || !$itemsTable) {
            return [];
        }

        $rows = DB::connection($this->connection)->select("
            SELECT TOP 10
                it.CODE as urun_kodu,
                it.NAME as urun_adi,
                ISNULL(SUM(ol.AMOUNT), 0) as toplam_miktar,
                ISNULL(SUM(ol.LINENET), 0) as toplam_tutar
            FROM [{$orfLineTable}] ol
            JOIN [{$itemsTable}] it ON ol.STOCKREF = it.LOGICALREF
            JOIN [{$orfTable}] of_ ON ol.ORDFICHEREF = of_.LOGICALREF
            WHERE of_.CANCELLED = 0 AND of_.TRCODE = 1
              AND of_.DATE_ >= DATEADD(MONTH, -12, GETDATE())
              AND ol.LINETYPE = 0
            GROUP BY it.CODE, it.NAME, ol.STOCKREF
            ORDER BY toplam_tutar DESC
        ");

        return collect($rows)->map(fn ($r) => [
            'urun_kodu' => (string) ($r->urun_kodu ?? ''),
            'urun_adi' => (string) ($r->urun_adi ?? 'Bilinmeyen'),
            'miktar' => $this->toFloat($r->toplam_miktar),
            'tutar' => $this->toFloat($r->toplam_tutar),
        ])->all();
    }

    /**
     * 4. Plasiyer performansı (bu ay)
     */
    private function getSalespersonPerformance(): array
    {
        $orfTable = $this->findTable(['LG_%03d_ORFICHE', 'LG_%03d_01_ORFICHE']);
        if (!$orfTable) {
            return [];
        }

        $rows = DB::connection($this->connection)->select("
            SELECT TOP 10
                sm.CODE as plasiyer_kodu,
                sm.DEFINITION_ as plasiyer_adi,
                ISNULL(SUM(of_.NETTOTAL), 0) as toplam_ciro,
                COUNT(*) as siparis_sayisi
            FROM [{$orfTable}] of_
            LEFT JOIN LG_SLSMAN sm ON of_.SALESMANREF = sm.LOGICALREF AND sm.FIRMNR = ?
            WHERE of_.CANCELLED = 0 AND of_.TRCODE = 1
              AND YEAR(of_.DATE_) = YEAR(GETDATE()) AND MONTH(of_.DATE_) = MONTH(GETDATE())
            GROUP BY of_.SALESMANREF, sm.CODE, sm.DEFINITION_
            ORDER BY toplam_ciro DESC
        ", [$this->firmNo]);

        return collect($rows)->map(fn ($r) => [
            'plasiyer_kodu' => (string) ($r->plasiyer_kodu ?? ''),
            'plasiyer_adi' => (string) ($r->plasiyer_adi ?? 'Tanımsız'),
            'ciro' => $this->toFloat($r->toplam_ciro),
            'siparis_sayisi' => (int) $r->siparis_sayisi,
        ])->all();
    }

    /**
     * 5. Cari yaşlandırma analizi (vade grupları)
     */
    private function getCustomerAgingAnalysis(): array
    {
        $clfTable = $this->findTable(['LG_%03d_01_CLFLINE', 'LG_%03d_CLFLINE']);
        if (!$clfTable) {
            return [];
        }

        $rows = DB::connection($this->connection)->select("
            SELECT
                CASE
                    WHEN DATEDIFF(DAY, clf.DATE_, GETDATE()) <= 0 THEN 'guncel'
                    WHEN DATEDIFF(DAY, clf.DATE_, GETDATE()) BETWEEN 1 AND 30 THEN '0_30'
                    WHEN DATEDIFF(DAY, clf.DATE_, GETDATE()) BETWEEN 31 AND 60 THEN '31_60'
                    WHEN DATEDIFF(DAY, clf.DATE_, GETDATE()) BETWEEN 61 AND 90 THEN '61_90'
                    ELSE '90_plus'
                END as vade_grubu,
                ISNULL(SUM(CASE WHEN clf.SIGN = 0 THEN clf.AMOUNT ELSE -clf.AMOUNT END), 0) as net_tutar,
                COUNT(DISTINCT clf.CLIENTREF) as cari_sayisi
            FROM [{$clfTable}] clf
            WHERE clf.CANCELLED = 0
            GROUP BY
                CASE
                    WHEN DATEDIFF(DAY, clf.DATE_, GETDATE()) <= 0 THEN 'guncel'
                    WHEN DATEDIFF(DAY, clf.DATE_, GETDATE()) BETWEEN 1 AND 30 THEN '0_30'
                    WHEN DATEDIFF(DAY, clf.DATE_, GETDATE()) BETWEEN 31 AND 60 THEN '31_60'
                    WHEN DATEDIFF(DAY, clf.DATE_, GETDATE()) BETWEEN 61 AND 90 THEN '61_90'
                    ELSE '90_plus'
                END
        ");

        $labels = [
            'guncel' => 'Güncel',
            '0_30' => '0-30 Gün',
            '31_60' => '31-60 Gün',
            '61_90' => '61-90 Gün',
            '90_plus' => '90+ Gün',
        ];

        return collect($rows)->map(fn ($r) => [
            'vade_grubu' => (string) $r->vade_grubu,
            'label' => $labels[$r->vade_grubu] ?? $r->vade_grubu,
            'net_tutar' => $this->toFloat($r->net_tutar),
            'cari_sayisi' => (int) $r->cari_sayisi,
        ])->all();
    }

    /**
     * 6. Fatura vs Tahsilat trendi (son 12 ay)
     */
    private function getInvoiceVsCollectionTrend(): array
    {
        $invTable = $this->findTable(['LG_%03d_INVOICE', 'LG_%03d_01_INVOICE']);
        $clfTable = $this->findTable(['LG_%03d_01_CLFLINE', 'LG_%03d_CLFLINE']);
        if (!$invTable || !$clfTable) {
            return [];
        }

        // Aylık fatura toplamları (satış faturaları)
        $invoices = DB::connection($this->connection)->select("
            SELECT
                YEAR(DATE_) as yil, MONTH(DATE_) as ay,
                ISNULL(SUM(NETTOTAL), 0) as toplam
            FROM [{$invTable}]
            WHERE CANCELLED = 0 AND TRCODE = 8
              AND DATE_ >= DATEADD(MONTH, -12, CAST(DATEADD(DAY, 1-DAY(GETDATE()), GETDATE()) AS DATE))
            GROUP BY YEAR(DATE_), MONTH(DATE_)
        ");

        // Aylık tahsilat toplamları (SIGN=1 = alacak = müşteriden gelen ödeme)
        $collections = DB::connection($this->connection)->select("
            SELECT
                YEAR(DATE_) as yil, MONTH(DATE_) as ay,
                ISNULL(SUM(AMOUNT), 0) as toplam
            FROM [{$clfTable}]
            WHERE CANCELLED = 0 AND SIGN = 1
              AND DATE_ >= DATEADD(MONTH, -12, CAST(DATEADD(DAY, 1-DAY(GETDATE()), GETDATE()) AS DATE))
            GROUP BY YEAR(DATE_), MONTH(DATE_)
        ");

        $invoiceMap = collect($invoices)->keyBy(fn ($r) => $r->yil . '-' . str_pad($r->ay, 2, '0', STR_PAD_LEFT));
        $collectionMap = collect($collections)->keyBy(fn ($r) => $r->yil . '-' . str_pad($r->ay, 2, '0', STR_PAD_LEFT));

        $months = ['', 'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
        $result = [];

        for ($i = 11; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $key = $date->format('Y-m');
            $label = $months[(int) $date->format('m')] . ' ' . $date->format('Y');

            $result[] = [
                'label' => $label,
                'fatura' => $this->toFloat($invoiceMap->get($key)?->toplam ?? 0),
                'tahsilat' => $this->toFloat($collectionMap->get($key)?->toplam ?? 0),
            ];
        }

        return $result;
    }

    /**
     * 7. Stok dağılımı (marka bazlı)
     */
    private function getStockValueDistribution(): array
    {
        $stTable = $this->findTable([
            'LV_%03d_01_STINVTOT', 'LG_%03d_01_STINVTOT',
            'LV_%03d_STINVTOT', 'LG_%03d_STINVTOT',
        ]);
        $itemsTable = $this->findTable(['LG_%03d_ITEMS', 'LG_%03d_01_ITEMS']);
        $markTable = $this->findTable(['LG_%03d_MARK', 'LG_%03d_01_MARK']);

        if (!$stTable || !$itemsTable) {
            return [];
        }

        $markJoin = $markTable
            ? "LEFT JOIN [{$markTable}] mk ON it.MARKREF = mk.LOGICALREF"
            : '';
        $markSelect = $markTable
            ? "ISNULL(mk.CODE, 'Markasız')"
            : "ISNULL(it.SPECODE, 'Diğer')";

        $rows = DB::connection($this->connection)->select("
            SELECT TOP 15
                {$markSelect} as label,
                COUNT(DISTINCT st.STOCKREF) as urun_sayisi,
                ISNULL(SUM(st.ONHAND), 0) as toplam_miktar
            FROM [{$stTable}] st
            JOIN [{$itemsTable}] it ON st.STOCKREF = it.LOGICALREF
            {$markJoin}
            WHERE st.INVENNO >= 0 AND st.ONHAND > 0
            GROUP BY {$markSelect}
            ORDER BY toplam_miktar DESC
        ");

        return collect($rows)->map(fn ($r) => [
            'label' => (string) ($r->label ?? 'Diğer'),
            'urun_sayisi' => (int) $r->urun_sayisi,
            'miktar' => $this->toFloat($r->toplam_miktar),
        ])->all();
    }

    /**
     * 8. Son 30 gün günlük satışlar (ORFICHE)
     */
    private function getDailySalesLast30Days(): array
    {
        $table = $this->findTable(['LG_%03d_ORFICHE', 'LG_%03d_01_ORFICHE']);
        if (!$table) {
            return [];
        }

        $rows = DB::connection($this->connection)->select("
            SELECT
                CONVERT(DATE, DATE_) as gun,
                ISNULL(SUM(NETTOTAL), 0) as toplam,
                COUNT(*) as siparis_sayisi
            FROM [{$table}]
            WHERE CANCELLED = 0 AND TRCODE = 1
              AND DATE_ >= DATEADD(DAY, -30, GETDATE())
            GROUP BY CONVERT(DATE, DATE_)
            ORDER BY gun
        ");

        return collect($rows)->map(fn ($r) => [
            'gun' => Carbon::parse($r->gun)->format('d.m'),
            'toplam' => $this->toFloat($r->toplam),
            'siparis_sayisi' => (int) $r->siparis_sayisi,
        ])->all();
    }

    /**
     * 9. Banka bakiye trendi (son 12 ay, kümülatif)
     */
    private function getBankBalanceTrend(): array
    {
        $table = $this->findTable(['LG_%03d_01_BNFLINE', 'LG_%03d_BNFLINE']);
        if (!$table) {
            return [];
        }

        // 12 ay öncesine kadar olan açılış bakiyesi
        $openingResult = DB::connection($this->connection)->selectOne("
            SELECT ISNULL(SUM(CASE WHEN SIGN = 0 THEN AMOUNT ELSE -AMOUNT END), 0) as opening
            FROM [{$table}]
            WHERE CANCELLED = 0
              AND DATE_ < DATEADD(MONTH, -12, CAST(DATEADD(DAY, 1-DAY(GETDATE()), GETDATE()) AS DATE))
        ");
        $opening = $this->toFloat($openingResult->opening ?? 0);

        // Aylık hareketler
        $rows = DB::connection($this->connection)->select("
            SELECT
                YEAR(DATE_) as yil, MONTH(DATE_) as ay,
                ISNULL(SUM(CASE WHEN SIGN = 0 THEN AMOUNT ELSE -AMOUNT END), 0) as net_hareket
            FROM [{$table}]
            WHERE CANCELLED = 0
              AND DATE_ >= DATEADD(MONTH, -12, CAST(DATEADD(DAY, 1-DAY(GETDATE()), GETDATE()) AS DATE))
            GROUP BY YEAR(DATE_), MONTH(DATE_)
            ORDER BY yil, ay
        ");

        $monthMap = collect($rows)->keyBy(fn ($r) => $r->yil . '-' . str_pad($r->ay, 2, '0', STR_PAD_LEFT));
        $months = ['', 'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

        $result = [];
        $cumulative = $opening;

        for ($i = 11; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $key = $date->format('Y-m');
            $label = $months[(int) $date->format('m')] . ' ' . $date->format('Y');
            $hareket = $this->toFloat($monthMap->get($key)?->net_hareket ?? 0);
            $cumulative += $hareket;

            $result[] = [
                'label' => $label,
                'bakiye' => round($cumulative, 2),
                'hareket' => $hareket,
            ];
        }

        return $result;
    }

    /**
     * 10. Sipariş durum dağılımı (son 3 ay)
     */
    private function getOrderStatusFunnel(): array
    {
        $table = $this->findTable(['LG_%03d_ORFICHE', 'LG_%03d_01_ORFICHE']);
        if (!$table) {
            return [];
        }

        $rows = DB::connection($this->connection)->select("
            SELECT
                CASE
                    WHEN STATUS = 0 AND CLOSED = 0 THEN 'acik'
                    WHEN CLOSED = 1 THEN 'kapali'
                    WHEN STATUS = 1 THEN 'onayli'
                    ELSE 'diger'
                END as durum,
                COUNT(*) as siparis_sayisi,
                ISNULL(SUM(NETTOTAL), 0) as toplam_tutar
            FROM [{$table}]
            WHERE CANCELLED = 0 AND TRCODE = 1
              AND DATE_ >= DATEADD(MONTH, -3, GETDATE())
            GROUP BY
                CASE
                    WHEN STATUS = 0 AND CLOSED = 0 THEN 'acik'
                    WHEN CLOSED = 1 THEN 'kapali'
                    WHEN STATUS = 1 THEN 'onayli'
                    ELSE 'diger'
                END
            ORDER BY toplam_tutar DESC
        ");

        $labels = [
            'acik' => 'Açık',
            'kapali' => 'Kapalı / Tamamlanmış',
            'onayli' => 'Onaylı',
            'diger' => 'Diğer',
        ];

        return collect($rows)->map(fn ($r) => [
            'durum' => (string) $r->durum,
            'durum_label' => $labels[$r->durum] ?? $r->durum,
            'sayisi' => (int) $r->siparis_sayisi,
            'tutar' => $this->toFloat($r->toplam_tutar),
        ])->all();
    }

    // ==================== FINANCIAL SUMMARIES ====================

    private function getCariNetBalance(): ?array
    {
        $table = $this->findTable(['LG_%03d_01_CLFLINE', 'LG_%03d_CLFLINE']);
        if (!$table) {
            return null;
        }

        $result = DB::connection($this->connection)->selectOne("
            SELECT
                ISNULL(SUM(CASE WHEN SIGN = 0 THEN AMOUNT ELSE 0 END), 0) as toplam_borc,
                ISNULL(SUM(CASE WHEN SIGN = 1 THEN AMOUNT ELSE 0 END), 0) as toplam_alacak,
                COUNT(DISTINCT CLIENTREF) as cari_sayisi
            FROM [{$table}]
            WHERE CANCELLED = 0
        ");

        if (!$result) {
            return null;
        }

        $borc = $this->toFloat($result->toplam_borc);
        $alacak = $this->toFloat($result->toplam_alacak);

        return [
            'toplam_borc' => $borc,
            'toplam_alacak' => $alacak,
            'net_alacak' => round($borc - $alacak, 2),
            'cari_sayisi' => (int) ($result->cari_sayisi ?? 0),
        ];
    }

    private function getTopDebtors(): array
    {
        $clfTable = $this->findTable(['LG_%03d_01_CLFLINE', 'LG_%03d_CLFLINE']);
        $clCard = $this->findTable(['LG_%03d_CLCARD', 'LG_%03d_01_CLCARD']);
        if (!$clfTable || !$clCard) {
            return [];
        }

        $rows = DB::connection($this->connection)->select("
            SELECT TOP 10
                cl.DEFINITION_ as cari_adi,
                cl.CODE as cari_kodu,
                ISNULL(SUM(CASE WHEN clf.SIGN = 0 THEN clf.AMOUNT ELSE -clf.AMOUNT END), 0) as net_bakiye
            FROM [{$clfTable}] clf
            LEFT JOIN [{$clCard}] cl ON clf.CLIENTREF = cl.LOGICALREF
            WHERE clf.CANCELLED = 0
            GROUP BY clf.CLIENTREF, cl.DEFINITION_, cl.CODE
            HAVING ISNULL(SUM(CASE WHEN clf.SIGN = 0 THEN clf.AMOUNT ELSE -clf.AMOUNT END), 0) > 0
            ORDER BY net_bakiye DESC
        ");

        return collect($rows)->map(fn ($r) => [
            'cari_adi' => (string) ($r->cari_adi ?? 'Bilinmeyen'),
            'cari_kodu' => (string) ($r->cari_kodu ?? ''),
            'net_bakiye' => $this->toFloat($r->net_bakiye),
        ])->all();
    }

    private function getBankBalances(): array
    {
        $transTable = $this->findTable(['LG_%03d_01_BNFLINE', 'LG_%03d_BNFLINE']);
        if (!$transTable) {
            return [];
        }

        $cardTable = sprintf('LG_%03d_BNCARD', $this->firmNo);

        $detailRows = DB::connection($this->connection)->select("
            SELECT
                bfl.TRCURR as currency_code,
                ISNULL(cur.CURCODE, CASE WHEN bfl.TRCURR = 0 THEN 'TRY' ELSE CAST(bfl.TRCURR as VARCHAR) END) as currency,
                bfl.BANKREF as bank_ref,
                ISNULL(bc.CODE, '') as account_code,
                ISNULL(bc.DEFINITION_, '') as account_name,
                ISNULL(bc.BRANCH, '') as branch,
                ISNULL(SUM(CASE WHEN bfl.SIGN = 0 THEN bfl.AMOUNT ELSE 0 END), 0) as total_in,
                ISNULL(SUM(CASE WHEN bfl.SIGN = 1 THEN bfl.AMOUNT ELSE 0 END), 0) as total_out,
                ISNULL(SUM(CASE WHEN bfl.SIGN = 0 THEN bfl.AMOUNT ELSE -bfl.AMOUNT END), 0) as net_bakiye
            FROM [{$transTable}] bfl
            LEFT JOIN L_CURRENCYLIST cur ON bfl.TRCURR = cur.LOGICALREF
            LEFT JOIN [{$cardTable}] bc ON bfl.BANKREF = bc.LOGICALREF
            WHERE bfl.CANCELLED = 0
            GROUP BY bfl.TRCURR, cur.CURCODE, bfl.BANKREF, bc.CODE, bc.DEFINITION_, bc.BRANCH
            ORDER BY currency, net_bakiye DESC
        ");

        return collect($detailRows)
            ->groupBy('currency')
            ->map(function ($group, $currency): array {
                $accounts = $group->map(fn ($r): array => [
                    'code' => (string) ($r->account_code ?? ''),
                    'name' => (string) ($r->account_name ?? ''),
                    'branch' => (string) ($r->branch ?? ''),
                    'total_in' => round((float) ($r->total_in ?? 0), 2),
                    'total_out' => round((float) ($r->total_out ?? 0), 2),
                    'amount' => round((float) ($r->net_bakiye ?? 0), 2),
                ])->values()->all();

                $netTotal = array_sum(array_column($accounts, 'amount'));

                return [
                    'currency' => $currency,
                    'amount' => round($netTotal, 2),
                    'account_count' => count($accounts),
                    'accounts' => $accounts,
                ];
            })
            ->filter(fn (array $row): bool => $row['amount'] != 0)
            ->sortByDesc('amount')
            ->values()
            ->all();
    }

    private function getCashBalances(): array
    {
        $transTable = $this->findTable(['LG_%03d_01_KSLINES', 'LG_%03d_KSLINES']);
        if (!$transTable) {
            return [];
        }

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

        return collect($rows)
            ->map(fn ($row): array => [
                'currency' => (string) ($row->currency ?? 'TRY'),
                'amount' => round((float) ($row->net_bakiye ?? 0), 2),
                'account_count' => (int) ($row->account_count ?? 0),
            ])
            ->filter(fn (array $row): bool => $row['amount'] != 0)
            ->values()
            ->all();
    }

    // ==================== HELPERS ====================

    private function findTable(array $patterns): ?string
    {
        try {
            foreach ($patterns as $pattern) {
                $tableName = sprintf($pattern, $this->firmNo);
                $isView = str_starts_with($pattern, 'LV_');
                $schema = $isView ? 'INFORMATION_SCHEMA.VIEWS' : 'INFORMATION_SCHEMA.TABLES';

                $exists = DB::connection($this->connection)->selectOne(
                    "SELECT COUNT(*) as cnt FROM {$schema} WHERE TABLE_NAME = ?",
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

    private function safeCall(callable $callback, mixed $default): mixed
    {
        try {
            return $callback();
        } catch (\Throwable $e) {
            Log::error('LogoDashboard panel error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return $default;
        }
    }

    private function calculateChange(float $current, float $previous): array
    {
        if ($previous == 0.0) {
            if ($current == 0.0) {
                return ['percent' => 0.0, 'trend' => 'flat'];
            }

            return ['percent' => 100.0, 'trend' => $current > 0 ? 'up' : 'down'];
        }

        $percent = round((($current - $previous) / abs($previous)) * 100, 2);

        return [
            'percent' => $percent,
            'trend' => $percent > 0 ? 'up' : ($percent < 0 ? 'down' : 'flat'),
        ];
    }

    private function toFloat(mixed $value): float
    {
        return round((float) ($value ?? 0), 2);
    }
}
