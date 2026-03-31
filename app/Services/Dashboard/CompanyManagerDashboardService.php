<?php

namespace App\Services\Dashboard;

use App\Models\BankAccount;
use App\Models\CashAccount;
use App\Models\Collection;
use App\Models\CurrentAccount;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Models\SalesRepresentative;
use App\Models\SalesTarget;
use App\Models\ShippingOrder;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CompanyManagerDashboardService
{
    private ?array $turnoverCache = null;

    public function getData(): array
    {
        $today = Carbon::today();

        $financialPanel = $this->safeCall(fn () => $this->getFinancialPanel($today), $this->emptyFinancialPanel());
        $salesPanel = $this->safeCall(fn () => $this->getSalesPanel($today), $this->emptySalesPanel());
        $riskPanel = $this->safeCall(fn () => $this->getRiskPanel($today), $this->emptyRiskPanel());
        $inventoryPanel = $this->safeCall(fn () => $this->getInventoryPanel($today), $this->emptyInventoryPanel());

        return [
            'generated_at' => now()->toDateTimeString(),
            'integration_status' => $this->safeCall(fn () => $this->getIntegrationStatus(), []),
            'kpi_cards' => $this->safeCall(fn () => $this->getKpiCards($today), []),
            'financial_panel' => $financialPanel,
            'sales_panel' => $salesPanel,
            'risk_panel' => $riskPanel,
            'inventory_panel' => $inventoryPanel,
            'urgent_items' => $this->safeCall(
                fn () => $this->getUrgentItems($riskPanel, $inventoryPanel, $financialPanel, $today),
                []
            ),
            'recent_actions' => $this->safeCall(fn () => $this->getRecentActions(), []),
            'logo_summary' => $this->safeCall(fn () => $this->getLogoSummary(), null),
            'logo_financial' => $this->safeCall(fn () => $this->getLogoFinancialData(), null),
        ];
    }

    private function safeCall(callable $callback, mixed $default): mixed
    {
        try {
            return $callback();
        } catch (\Throwable $e) {
            Log::error('CompanyManagerDashboard panel error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return $default;
        }
    }

    private function emptyFinancialPanel(): array
    {
        return [
            'liquidity' => [
                'bank_balances' => [],
                'cash_balances' => [],
                'bank_total_estimated' => 0,
                'cash_total' => 0,
            ],
            'pos_receivables' => ['total' => 0, 'blocked' => 0, 'releasing_7d' => 0, 'records' => 0],
            'cash_flow_forecast' => [],
            'cash_flow_chart' => [],
        ];
    }

    private function emptySalesPanel(): array
    {
        return [
            'order_funnel' => [
                'pending_orders_amount' => 0, 'pending_orders_count' => 0,
                'shipping_stage_amount' => 0, 'shipping_stage_count' => 0,
                'cancel_return_rate' => 0,
            ],
            'comparative_turnover' => [
                'today' => 0, 'yesterday' => 0, 'today_change_percent' => 0,
                'month_current' => 0, 'month_last_year' => 0, 'month_change_percent' => 0,
            ],
            'sales_trend' => [],
            'category_distribution' => [],
            'regional_heatmap' => [],
            'salesperson_progress' => [],
        ];
    }

    private function emptyRiskPanel(): array
    {
        return [
            'aging' => [
                'current' => 0, 'overdue_0_30' => 0, 'overdue_31_60' => 0,
                'overdue_60_plus' => 0, 'total_overdue' => 0,
            ],
            'top_debtors' => [],
            'risk_limit_alerts' => [],
            'unpaid_instruments' => [],
            'invoice_profitability' => ['invoice_count' => 0, 'average_profit' => 0, 'average_margin' => 0],
        ];
    }

    private function emptyInventoryPanel(): array
    {
        return [
            'critical_stock_alerts' => [],
            'dead_stock' => ['item_count' => 0, 'total_quantity' => 0, 'total_value' => 0, 'threshold_days' => 180],
            'shipment_performance' => [
                'on_time_rate' => 0, 'due_today_shipments' => 0,
                'delayed_shipments' => 0, 'completed_shipments' => 0,
            ],
        ];
    }

    private function getTurnoverData(Carbon $today): array
    {
        if ($this->turnoverCache !== null) {
            return $this->turnoverCache;
        }

        $yesterday = $today->copy()->subDay();
        $monthStart = $today->copy()->startOfMonth();
        $lastMonthStart = $today->copy()->subMonthNoOverflow()->startOfMonth();
        $lastMonthEnd = $today->copy()->subMonthNoOverflow()->endOfMonth();
        $lastYearMonthStart = $today->copy()->subYear()->startOfMonth();
        $lastYearMonthEnd = $today->copy()->subYear()->endOfMonth();

        $sumForPeriod = fn (Carbon $start, Carbon $end) => $this->toFloat(
            SalesOrder::query()
                ->whereBetween('order_date', [$start, $end])
                ->whereNotIn('status', ['cancelled', 'draft'])
                ->sum('total_amount')
        );

        $sumForDate = fn (Carbon $date) => $this->toFloat(
            SalesOrder::query()
                ->whereDate('order_date', $date)
                ->whereNotIn('status', ['cancelled', 'draft'])
                ->sum('total_amount')
        );

        $this->turnoverCache = [
            'today' => $sumForDate($today),
            'yesterday' => $sumForDate($yesterday),
            'this_month' => $sumForPeriod($monthStart, $today),
            'last_month' => $sumForPeriod($lastMonthStart, $lastMonthEnd),
            'last_year_month' => $sumForPeriod($lastYearMonthStart, $lastYearMonthEnd),
        ];

        return $this->turnoverCache;
    }

    private function getKpiCards(Carbon $today): array
    {
        $turnover = $this->getTurnoverData($today);

        $todayTurnover = $turnover['today'];
        $yesterdayTurnover = $turnover['yesterday'];
        $thisMonthTurnover = $turnover['this_month'];
        $lastMonthTurnover = $turnover['last_month'];

        $todayOrderCount = SalesOrder::query()
            ->whereDate('order_date', $today)
            ->whereNotIn('status', ['cancelled', 'draft'])
            ->count();

        $cashBalance = $this->toFloat(
            CashAccount::query()
                ->where('is_active', true)
                ->sum('current_balance')
        );

        $overdueReceivables = $this->sumOutstandingInvoices(function (Builder $query) use ($today) {
            $query->where(function (Builder $subQuery) use ($today) {
                $subQuery->whereDate('due_date', '<', $today)
                    ->orWhere(function (Builder $nullDueDateQuery) use ($today) {
                        $nullDueDateQuery->whereNull('due_date')
                            ->whereDate('invoice_date', '<', $today);
                    });
            });
        });

        $todayCashMovement = $this->toFloat(
            DB::table('cash_transactions')
                ->whereNull('deleted_at')
                ->whereDate('transaction_date', $today)
                ->selectRaw("SUM(CASE WHEN transaction_type IN ('income', 'transfer_in') THEN COALESCE(amount_in_base_currency, amount, 0) WHEN transaction_type IN ('expense', 'transfer_out') THEN -COALESCE(amount_in_base_currency, amount, 0) ELSE 0 END) as net")
                ->value('net')
        );

        $yesterdayCashMovement = $this->toFloat(
            DB::table('cash_transactions')
                ->whereNull('deleted_at')
                ->whereDate('transaction_date', $yesterday)
                ->selectRaw("SUM(CASE WHEN transaction_type IN ('income', 'transfer_in') THEN COALESCE(amount_in_base_currency, amount, 0) WHEN transaction_type IN ('expense', 'transfer_out') THEN -COALESCE(amount_in_base_currency, amount, 0) ELSE 0 END) as net")
                ->value('net')
        );

        $todayTurnoverChange = $this->calculateChange($todayTurnover, $yesterdayTurnover);
        $monthTurnoverChange = $this->calculateChange($thisMonthTurnover, $lastMonthTurnover);
        $cashMovementChange = $this->calculateChange($todayCashMovement, $yesterdayCashMovement);

        return [
            [
                'key' => 'daily_turnover',
                'title' => 'Gunluk Ciro',
                'value' => $todayTurnover,
                'currency' => 'TRY',
                'subtitle' => 'Bugun vs dun',
                'change_percent' => $todayTurnoverChange['percent'],
                'trend' => $todayTurnoverChange['trend'],
                'icon' => 'ri-line-chart-line',
                'color' => 'primary',
            ],
            [
                'key' => 'cash_balance',
                'title' => 'Kasadaki Nakit',
                'value' => $cashBalance,
                'currency' => 'TRY',
                'subtitle' => 'Tum kasalar toplami',
                'change_percent' => $cashMovementChange['percent'],
                'trend' => $cashMovementChange['trend'],
                'icon' => 'ri-bank-card-line',
                'color' => 'success',
            ],
            [
                'key' => 'today_orders',
                'title' => 'Bugunku Siparis',
                'value' => (float) $todayOrderCount,
                'currency' => null,
                'subtitle' => 'Adet',
                'change_percent' => null,
                'trend' => 'flat',
                'icon' => 'ri-shopping-bag-3-line',
                'color' => 'info',
            ],
            [
                'key' => 'overdue_receivables',
                'title' => 'Vadesi Gecmis Alacak',
                'value' => $overdueReceivables,
                'currency' => 'TRY',
                'subtitle' => 'Tahsilat riski',
                'change_percent' => $monthTurnoverChange['percent'],
                'trend' => $monthTurnoverChange['trend'],
                'icon' => 'ri-alert-line',
                'color' => 'danger',
            ],
        ];
    }

    private function getFinancialPanel(Carbon $today): array
    {
        $bankBalances = $this->getBankBalancesByCurrency();
        $cashBalances = $this->getCashBalancesByCurrency();
        $posReceivables = $this->getPosReceivables($today);
        $cashFlowForecast = $this->getCashFlowForecast($today, [7, 15, 30]);

        return [
            'liquidity' => [
                'bank_balances' => $bankBalances,
                'cash_balances' => $cashBalances,
                'bank_total_estimated' => array_sum(array_column($bankBalances, 'amount')),
                'cash_total' => array_sum(array_column($cashBalances, 'amount')),
            ],
            'pos_receivables' => $posReceivables,
            'cash_flow_forecast' => $cashFlowForecast,
            'cash_flow_chart' => array_map(function (array $row): array {
                return [
                    'label' => "{$row['period_days']} Gun",
                    'expected_in' => $row['expected_in'],
                    'expected_out' => $row['expected_out'],
                    'net' => $row['net'],
                ];
            }, $cashFlowForecast),
        ];
    }

    private function getBankBalancesByCurrency(): array
    {
        $inflows = Collection::query()
            ->whereNotNull('bank_account_id')
            ->whereIn('status', ['collected', 'partial'])
            ->selectRaw('currency, SUM(COALESCE(amount_in_base_currency, amount, 0)) as total')
            ->groupBy('currency')
            ->pluck('total', 'currency');

        $outflows = Payment::query()
            ->whereNotNull('bank_account_id')
            ->where('status', 'paid')
            ->selectRaw('currency, SUM(COALESCE(amount_in_base_currency, net_amount, amount, 0)) as total')
            ->groupBy('currency')
            ->pluck('total', 'currency');

        $accountCounts = BankAccount::query()
            ->where('is_active', true)
            ->selectRaw('currency, COUNT(*) as cnt')
            ->groupBy('currency')
            ->pluck('cnt', 'currency');

        $currencies = collect(['TRY', 'USD', 'EUR'])
            ->merge($accountCounts->keys())
            ->merge($inflows->keys())
            ->merge($outflows->keys())
            ->unique()
            ->values();

        return $currencies
            ->map(function (string $currency) use ($inflows, $outflows, $accountCounts): array {
                $inflow = $this->toFloat($inflows->get($currency));
                $outflow = $this->toFloat($outflows->get($currency));

                return [
                    'currency' => $currency,
                    'amount' => $inflow - $outflow,
                    'account_count' => (int) ($accountCounts->get($currency) ?? 0),
                    'is_estimated' => true,
                ];
            })
            ->all();
    }

    private function getCashBalancesByCurrency(): array
    {
        $rows = CashAccount::query()
            ->where('is_active', true)
            ->selectRaw('currency, SUM(current_balance) as total_balance, COUNT(*) as account_count')
            ->groupBy('currency')
            ->get();

        return $rows->map(function (CashAccount $row): array {
            return [
                'currency' => (string) $row->currency,
                'amount' => $this->toFloat($row->total_balance),
                'account_count' => (int) $row->account_count,
            ];
        })->all();
    }

    private function getPosReceivables(Carbon $today): array
    {
        $baseQuery = Collection::query()
            ->whereIn('status', ['pending', 'partial'])
            ->where(function (Builder $query) {
                $query->whereNotNull('pos_terminal_id')
                    ->orWhereNotNull('pos_batch_number')
                    ->orWhereNotNull('pos_approval_code')
                    ->orWhereNotNull('card_number_masked');
            });

        $dateExpression = 'COALESCE(maturity_date, due_date, collection_date)';
        $amountExpression = 'COALESCE(amount_in_base_currency, amount, 0)';

        $blocked = $this->toFloat(
            (clone $baseQuery)
                ->whereRaw("{$dateExpression} > ?", [$today->toDateString()])
                ->selectRaw("SUM({$amountExpression}) as total")
                ->value('total')
        );

        $releasingIn7Days = $this->toFloat(
            (clone $baseQuery)
                ->whereRaw("{$dateExpression} >= ? AND {$dateExpression} <= ?", [
                    $today->toDateString(),
                    $today->copy()->addDays(7)->toDateString(),
                ])
                ->selectRaw("SUM({$amountExpression}) as total")
                ->value('total')
        );

        $total = $this->toFloat(
            (clone $baseQuery)
                ->selectRaw("SUM({$amountExpression}) as total")
                ->value('total')
        );

        $records = (clone $baseQuery)->count();

        return [
            'total' => $total,
            'blocked' => $blocked,
            'releasing_7d' => $releasingIn7Days,
            'records' => $records,
        ];
    }

    private function getCashFlowForecast(Carbon $today, array $periods): array
    {
        $forecast = [];

        foreach ($periods as $days) {
            $endDate = $today->copy()->addDays((int) $days);

            $expectedIn = $this->sumOutstandingInvoices(function (Builder $query) use ($today, $endDate) {
                $query->where(function (Builder $subQuery) use ($today, $endDate) {
                    $subQuery->whereBetween('due_date', [$today, $endDate])
                        ->orWhere(function (Builder $nullDueDateQuery) use ($today, $endDate) {
                            $nullDueDateQuery->whereNull('due_date')
                                ->whereBetween('invoice_date', [$today, $endDate]);
                        });
                });
            });

            $expectedOut = $this->toFloat(
                Payment::query()
                    ->whereNotIn('status', ['paid', 'cancelled'])
                    ->where(function (Builder $query) use ($today, $endDate) {
                        $query->whereBetween('due_date', [$today, $endDate])
                            ->orWhere(function (Builder $nullDueDateQuery) use ($today, $endDate) {
                                $nullDueDateQuery->whereNull('due_date')
                                    ->whereBetween('payment_date', [$today, $endDate]);
                            });
                    })
                    ->selectRaw('SUM(COALESCE(amount_in_base_currency, net_amount, amount, 0)) as total')
                    ->value('total')
            );

            $forecast[] = [
                'period_days' => (int) $days,
                'expected_in' => $expectedIn,
                'expected_out' => $expectedOut,
                'net' => $expectedIn - $expectedOut,
            ];
        }

        return $forecast;
    }

    private function getSalesPanel(Carbon $today): array
    {
        return [
            'order_funnel' => $this->getOrderFunnel($today),
            'comparative_turnover' => $this->getComparativeTurnover($today),
            'sales_trend' => $this->getSalesTrend($today),
            'category_distribution' => $this->getCategoryDistribution($today),
            'regional_heatmap' => $this->getRegionalHeatmap($today),
            'salesperson_progress' => $this->getSalespersonProgress($today),
        ];
    }

    private function getOrderFunnel(Carbon $today): array
    {
        $pendingStatuses = ['confirmed', 'in_production'];
        $shippingStatuses = ['ready_to_ship', 'shipped'];
        $periodStart = $today->copy()->subDays(30);

        $pendingOrdersAmount = $this->toFloat(
            SalesOrder::query()
                ->whereIn('status', $pendingStatuses)
                ->sum('total_amount')
        );

        $pendingOrdersCount = SalesOrder::query()
            ->whereIn('status', $pendingStatuses)
            ->count();

        $shippingStageAmount = $this->toFloat(
            SalesOrder::query()
                ->whereIn('status', $shippingStatuses)
                ->sum('total_amount')
        );

        $shippingStageCount = SalesOrder::query()
            ->whereIn('status', $shippingStatuses)
            ->count();

        $totalPeriodAmount = $this->toFloat(
            SalesOrder::query()
                ->whereDate('order_date', '>=', $periodStart)
                ->whereNotIn('status', ['draft'])
                ->sum('total_amount')
        );

        $cancelReturnAmount = $this->toFloat(
            SalesOrder::query()
                ->whereDate('order_date', '>=', $periodStart)
                ->whereIn('status', ['cancelled', 'returned'])
                ->sum('total_amount')
        );

        $cancelReturnRate = $totalPeriodAmount > 0
            ? round(($cancelReturnAmount / $totalPeriodAmount) * 100, 2)
            : 0.0;

        return [
            'pending_orders_amount' => $pendingOrdersAmount,
            'pending_orders_count' => $pendingOrdersCount,
            'shipping_stage_amount' => $shippingStageAmount,
            'shipping_stage_count' => $shippingStageCount,
            'cancel_return_rate' => $cancelReturnRate,
        ];
    }

    private function getComparativeTurnover(Carbon $today): array
    {
        $turnover = $this->getTurnoverData($today);

        return [
            'today' => $turnover['today'],
            'yesterday' => $turnover['yesterday'],
            'today_change_percent' => $this->calculateChange($turnover['today'], $turnover['yesterday'])['percent'],
            'month_current' => $turnover['this_month'],
            'month_last_year' => $turnover['last_year_month'],
            'month_change_percent' => $this->calculateChange($turnover['this_month'], $turnover['last_year_month'])['percent'],
        ];
    }

    private function getSalesTrend(Carbon $today): array
    {
        $result = [];

        for ($monthOffset = 11; $monthOffset >= 0; $monthOffset--) {
            $date = $today->copy()->subMonths($monthOffset);
            $start = $date->copy()->startOfMonth();
            $end = $date->copy()->endOfMonth();

            $stats = SalesOrder::query()
                ->whereBetween('order_date', [$start, $end])
                ->whereNotIn('status', ['cancelled', 'draft'])
                ->selectRaw('SUM(total_amount) as total, COUNT(*) as count')
                ->first();

            $result[] = [
                'label' => $date->format('M Y'),
                'value' => $this->toFloat($stats?->total),
                'count' => (int) ($stats?->count ?? 0),
            ];
        }

        return $result;
    }

    private function getCategoryDistribution(Carbon $today): array
    {
        $monthStart = $today->copy()->startOfMonth();

        $rows = SalesOrderItem::query()
            ->join('sales_orders', 'sales_order_items.sales_order_id', '=', 'sales_orders.id')
            ->join('products', 'sales_order_items.product_id', '=', 'products.id')
            ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
            ->whereBetween('sales_orders.order_date', [$monthStart, $today])
            ->whereNotIn('sales_orders.status', ['cancelled', 'draft'])
            ->selectRaw('categories.name as category_name, SUM(sales_order_items.line_total) as total_value')
            ->groupBy('categories.name')
            ->orderByDesc('total_value')
            ->limit(8)
            ->get();

        return $rows->map(function ($row): array {
            return [
                'label' => $row->category_name ?: 'Kategorisiz',
                'value' => $this->toFloat($row->total_value),
            ];
        })->all();
    }

    private function getRegionalHeatmap(Carbon $today): array
    {
        $monthStart = $today->copy()->startOfMonth();
        $regionExpression = "COALESCE(NULLIF(current_accounts.region, ''), NULLIF(current_accounts.city, ''), 'Belirsiz')";

        $rows = SalesOrder::query()
            ->join('current_accounts', 'sales_orders.customer_id', '=', 'current_accounts.id')
            ->whereBetween('sales_orders.order_date', [$monthStart, $today])
            ->whereNotIn('sales_orders.status', ['cancelled', 'draft'])
            ->selectRaw("{$regionExpression} as region, COUNT(sales_orders.id) as order_count, SUM(sales_orders.total_amount) as total_amount")
            ->groupBy(DB::raw($regionExpression))
            ->orderByDesc('total_amount')
            ->limit(10)
            ->get();

        return $rows->map(function ($row): array {
            return [
                'region' => (string) $row->region,
                'order_count' => (int) $row->order_count,
                'amount' => $this->toFloat($row->total_amount),
            ];
        })->all();
    }

    private function getSalespersonProgress(Carbon $today): array
    {
        $monthStart = $today->copy()->startOfMonth();
        $monthEnd = $today->copy()->endOfMonth();

        $actuals = SalesOrder::query()
            ->whereNotNull('salesperson_id')
            ->whereBetween('order_date', [$monthStart, $monthEnd])
            ->whereNotIn('status', ['cancelled', 'draft'])
            ->selectRaw('salesperson_id, SUM(total_amount) as achieved_total')
            ->groupBy('salesperson_id')
            ->get();

        $targetByUser = SalesTarget::query()
            ->where('period_type', 'monthly')
            ->where('year', $today->year)
            ->where('month', $today->month)
            ->where('is_active', true)
            ->whereNotNull('user_id')
            ->selectRaw('user_id, SUM(revenue_target) as target_total')
            ->groupBy('user_id')
            ->pluck('target_total', 'user_id');

        $salespersonIds = $actuals->pluck('salesperson_id')
            ->merge($targetByUser->keys())
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        if ($salespersonIds->isEmpty()) {
            return [];
        }

        $userNames = User::query()
            ->whereIn('id', $salespersonIds)
            ->pluck('name', 'id');

        return $salespersonIds
            ->map(function (int $salespersonId) use ($actuals, $targetByUser, $userNames): array {
                $achieved = $this->toFloat(
                    optional($actuals->firstWhere('salesperson_id', $salespersonId))->achieved_total
                );
                $target = $this->toFloat($targetByUser->get($salespersonId));

                $percentage = $target > 0
                    ? round(($achieved / $target) * 100, 1)
                    : 0.0;

                return [
                    'id' => $salespersonId,
                    'name' => $userNames->get($salespersonId, "Kullanici #{$salespersonId}"),
                    'achieved' => $achieved,
                    'target' => $target,
                    'percentage' => min(250, $percentage),
                ];
            })
            ->sortByDesc('achieved')
            ->take(10)
            ->values()
            ->all();
    }

    private function getRiskPanel(Carbon $today): array
    {
        return [
            'aging' => $this->getAgingData($today),
            'top_debtors' => $this->getTopDebtors(),
            'risk_limit_alerts' => $this->getRiskLimitAlerts(),
            'unpaid_instruments' => $this->getUnpaidInstruments(),
            'invoice_profitability' => $this->getInvoiceProfitability($today),
        ];
    }

    private function getAgingData(Carbon $today): array
    {
        $openInvoices = Invoice::query()
            ->whereNotIn('status', ['paid', 'cancelled'])
            ->select(['id', 'invoice_date', 'due_date'])
            ->selectRaw($this->outstandingAmountExpression() . ' as outstanding_amount')
            ->get();

        $aging = [
            'current' => 0.0,
            'overdue_0_30' => 0.0,
            'overdue_31_60' => 0.0,
            'overdue_60_plus' => 0.0,
            'total_overdue' => 0.0,
        ];

        foreach ($openInvoices as $invoice) {
            $amount = $this->toFloat($invoice->outstanding_amount);
            if ($amount <= 0) {
                continue;
            }

            $dueDate = $invoice->due_date
                ? Carbon::parse($invoice->due_date)
                : Carbon::parse($invoice->invoice_date);

            if ($dueDate->gte($today)) {
                $aging['current'] += $amount;
                continue;
            }

            $daysOverdue = $dueDate->diffInDays($today);

            if ($daysOverdue <= 30) {
                $aging['overdue_0_30'] += $amount;
            } elseif ($daysOverdue <= 60) {
                $aging['overdue_31_60'] += $amount;
            } else {
                $aging['overdue_60_plus'] += $amount;
            }
        }

        $aging['total_overdue'] = $aging['overdue_0_30'] + $aging['overdue_31_60'] + $aging['overdue_60_plus'];

        return $aging;
    }

    private function getTopDebtors(): array
    {
        return CurrentAccount::query()
            ->customers()
            ->where('total_receivables', '>', 0)
            ->orderByDesc('total_receivables')
            ->limit(10)
            ->get(['id', 'title', 'account_code', 'total_receivables', 'overdue_amount'])
            ->map(function (CurrentAccount $account): array {
                return [
                    'id' => $account->id,
                    'title' => $account->title,
                    'account_code' => $account->account_code,
                    'receivable' => $this->toFloat($account->total_receivables),
                    'overdue_amount' => $this->toFloat($account->overdue_amount),
                ];
            })
            ->all();
    }

    private function getRiskLimitAlerts(): array
    {
        return CurrentAccount::query()
            ->customers()
            ->where('risk_limit', '>', 0)
            ->where('total_receivables', '>', 0)
            ->whereRaw('total_receivables > risk_limit')
            ->orderByRaw('(total_receivables / risk_limit) DESC')
            ->limit(20)
            ->get(['id', 'title', 'account_code', 'risk_limit', 'total_receivables'])
            ->map(function (CurrentAccount $account): array {
                $riskLimit = $this->toFloat($account->risk_limit);
                $receivable = $this->toFloat($account->total_receivables);

                return [
                    'id' => $account->id,
                    'title' => $account->title,
                    'account_code' => $account->account_code,
                    'risk_limit' => $riskLimit,
                    'receivable' => $receivable,
                    'utilization' => $riskLimit > 0 ? round(($receivable / $riskLimit) * 100, 1) : 0.0,
                ];
            })
            ->all();
    }

    private function getUnpaidInstruments(): array
    {
        return Collection::query()
            ->with(['currentAccount:id,title,account_code'])
            ->whereIn('status', ['pending', 'partial', 'bounced'])
            ->where(function (Builder $query) {
                $query->whereNotNull('check_number')
                    ->orWhereNotNull('promissory_note_number');
            })
            ->orderByRaw('COALESCE(maturity_date, due_date, collection_date) ASC')
            ->limit(20)
            ->get()
            ->map(function (Collection $item): array {
                $isCheck = !empty($item->check_number);
                $dueDate = $item->maturity_date ?? $item->due_date ?? $item->collection_date;

                return [
                    'id' => $item->id,
                    'document_type' => $isCheck ? 'check' : 'promissory_note',
                    'customer' => $item->currentAccount->title ?? 'Bilinmeyen',
                    'customer_code' => $item->currentAccount->account_code ?? '',
                    'number' => $isCheck
                        ? (string) $item->check_number
                        : (string) ($item->promissory_note_number ?? ''),
                    'due_date' => $dueDate ? Carbon::parse($dueDate)->toDateString() : null,
                    'amount' => $this->toFloat($item->amount_in_base_currency ?? $item->amount),
                    'status' => (string) $item->status,
                ];
            })
            ->all();
    }

    private function getInvoiceProfitability(Carbon $today): array
    {
        $periodStart = $today->copy()->subDays(30);

        $stats = InvoiceItem::query()
            ->join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
            ->whereDate('invoices.invoice_date', '>=', $periodStart)
            ->selectRaw('COUNT(DISTINCT invoice_items.invoice_id) as invoice_count, SUM(COALESCE(invoice_items.profit_amount, COALESCE(invoice_items.line_total, 0) - (COALESCE(invoice_items.cost_price, 0) * COALESCE(invoice_items.quantity, 0)), 0)) as total_profit, SUM(COALESCE(invoice_items.line_total, 0)) as total_revenue')
            ->first();

        $invoiceCount = (int) ($stats->invoice_count ?? 0);
        $totalProfit = $this->toFloat($stats->total_profit);
        $totalRevenue = $this->toFloat($stats->total_revenue);

        return [
            'invoice_count' => $invoiceCount,
            'average_profit' => $invoiceCount > 0 ? round($totalProfit / $invoiceCount, 2) : 0.0,
            'average_margin' => $totalRevenue > 0 ? round(($totalProfit / $totalRevenue) * 100, 2) : 0.0,
        ];
    }

    private function getInventoryPanel(Carbon $today): array
    {
        return [
            'critical_stock_alerts' => $this->getCriticalStockAlerts($today),
            'dead_stock' => $this->getDeadStockSummary($today),
            'shipment_performance' => $this->getShipmentPerformance($today),
        ];
    }

    private function getCriticalStockAlerts(Carbon $today): array
    {
        $topSellers = SalesOrderItem::query()
            ->join('sales_orders', 'sales_order_items.sales_order_id', '=', 'sales_orders.id')
            ->whereDate('sales_orders.order_date', '>=', $today->copy()->subDays(90))
            ->whereNotIn('sales_orders.status', ['cancelled', 'draft'])
            ->selectRaw('sales_order_items.product_id, SUM(sales_order_items.quantity) as sold_qty')
            ->groupBy('sales_order_items.product_id')
            ->orderByDesc('sold_qty')
            ->limit(20)
            ->get();

        if ($topSellers->isEmpty()) {
            return [];
        }

        $productIds = $topSellers->pluck('product_id')->all();
        $soldQtyByProduct = $topSellers->pluck('sold_qty', 'product_id');

        $stockRows = DB::table('inventory_items')
            ->join('products', 'inventory_items.product_id', '=', 'products.id')
            ->leftJoin('inventory_stocks', function ($join) {
                $join->on('inventory_items.id', '=', 'inventory_stocks.inventory_item_id')
                    ->whereNull('inventory_stocks.deleted_at')
                    ->where('inventory_stocks.status', '=', 'active');
            })
            ->whereIn('inventory_items.product_id', $productIds)
            ->whereNull('inventory_items.deleted_at')
            ->selectRaw('products.id as product_id, products.code as product_code, products.name as product_name, inventory_items.minimum_stock as minimum_stock, COALESCE(SUM(inventory_stocks.quantity_available), 0) as available_qty')
            ->groupBy('products.id', 'products.code', 'products.name', 'inventory_items.minimum_stock')
            ->get();

        return collect($stockRows)
            ->map(function ($row) use ($soldQtyByProduct): array {
                $availableQty = $this->toFloat($row->available_qty);
                $minimumStock = $this->toFloat($row->minimum_stock);
                $deficit = max(0, $minimumStock - $availableQty);

                return [
                    'product_id' => (int) $row->product_id,
                    'product_code' => (string) $row->product_code,
                    'product_name' => (string) $row->product_name,
                    'sold_qty' => $this->toFloat($soldQtyByProduct->get($row->product_id)),
                    'available_qty' => $availableQty,
                    'minimum_stock' => $minimumStock,
                    'deficit' => $deficit,
                ];
            })
            ->filter(function (array $row): bool {
                return $row['minimum_stock'] > 0 && $row['available_qty'] <= $row['minimum_stock'];
            })
            ->sort(function (array $left, array $right): int {
                if ($left['deficit'] === $right['deficit']) {
                    return $right['sold_qty'] <=> $left['sold_qty'];
                }
                return $right['deficit'] <=> $left['deficit'];
            })
            ->values()
            ->all();
    }

    private function getDeadStockSummary(Carbon $today): array
    {
        $threshold = $today->copy()->subMonths(6);

        $stats = DB::table('inventory_items')
            ->join('inventory_stocks', function ($join) {
                $join->on('inventory_items.id', '=', 'inventory_stocks.inventory_item_id')
                    ->whereNull('inventory_stocks.deleted_at')
                    ->where('inventory_stocks.status', '=', 'active')
                    ->where('inventory_stocks.quantity_on_hand', '>', 0);
            })
            ->leftJoin('inventory_movements', function ($join) use ($threshold) {
                $join->on('inventory_movements.inventory_item_id', '=', 'inventory_items.id')
                    ->whereNull('inventory_movements.deleted_at')
                    ->where('inventory_movements.movement_date', '>=', $threshold);
            })
            ->whereNull('inventory_items.deleted_at')
            ->whereNull('inventory_movements.id')
            ->selectRaw('COUNT(DISTINCT inventory_items.id) as item_count, SUM(inventory_stocks.quantity_on_hand) as total_quantity, SUM(inventory_stocks.quantity_on_hand * inventory_stocks.unit_cost) as total_value')
            ->first();

        return [
            'item_count' => (int) ($stats->item_count ?? 0),
            'total_quantity' => $this->toFloat($stats->total_quantity),
            'total_value' => $this->toFloat($stats->total_value),
            'threshold_days' => 180,
        ];
    }

    private function getShipmentPerformance(Carbon $today): array
    {
        $windowStart = $today->copy()->subDays(30);

        $shipments = ShippingOrder::query()
            ->whereDate('created_at', '>=', $windowStart)
            ->whereIn('status', [
                ShippingOrder::STATUS_PENDING,
                ShippingOrder::STATUS_PICKING_ASSIGNED,
                ShippingOrder::STATUS_PICKING,
                ShippingOrder::STATUS_READY_TO_SHIP,
                ShippingOrder::STATUS_SHIPPED,
                ShippingOrder::STATUS_DELIVERED,
            ])
            ->get(['id', 'status', 'requested_ship_date', 'shipped_at']);

        $completed = $shipments->filter(function (ShippingOrder $shipment): bool {
            return in_array($shipment->status, [
                ShippingOrder::STATUS_SHIPPED,
                ShippingOrder::STATUS_DELIVERED,
            ], true);
        });

        $onTimeCompleted = $completed->filter(function (ShippingOrder $shipment): bool {
            if (!$shipment->requested_ship_date || !$shipment->shipped_at) {
                return false;
            }

            $requested = Carbon::parse($shipment->requested_ship_date)->endOfDay();
            $shippedAt = Carbon::parse($shipment->shipped_at);

            return $shippedAt->lte($requested);
        })->count();

        $delayedShipments = $shipments->filter(function (ShippingOrder $shipment) use ($today): bool {
            if (!$shipment->requested_ship_date) {
                return false;
            }

            $requested = Carbon::parse($shipment->requested_ship_date)->endOfDay();

            if (in_array($shipment->status, [ShippingOrder::STATUS_SHIPPED, ShippingOrder::STATUS_DELIVERED], true) && $shipment->shipped_at) {
                return Carbon::parse($shipment->shipped_at)->gt($requested);
            }

            return !in_array($shipment->status, [ShippingOrder::STATUS_DELIVERED, ShippingOrder::STATUS_CANCELLED], true)
                && $today->gt($requested);
        })->count();

        $dueTodayShipments = ShippingOrder::query()
            ->whereDate('requested_ship_date', $today)
            ->whereNotIn('status', [ShippingOrder::STATUS_DELIVERED, ShippingOrder::STATUS_CANCELLED])
            ->count();

        $completedCount = $completed->count();
        $onTimeRate = $completedCount > 0
            ? round(($onTimeCompleted / $completedCount) * 100, 2)
            : 0.0;

        return [
            'on_time_rate' => $onTimeRate,
            'due_today_shipments' => $dueTodayShipments,
            'delayed_shipments' => $delayedShipments,
            'completed_shipments' => $completedCount,
        ];
    }

    private function getIntegrationStatus(): array
    {
        $now = now();

        $rows = [
            [
                'key' => 'current_accounts',
                'label' => 'Cari Kartlar',
                'last_sync' => CurrentAccount::query()->max('logo_synced_at'),
            ],
            [
                'key' => 'products',
                'label' => 'Urun Kartlari',
                'last_sync' => Product::query()->max('logo_synced_at'),
            ],
            [
                'key' => 'prices',
                'label' => 'Fiyatlar',
                'last_sync' => Product::query()->max('logo_price_synced_at'),
            ],
            [
                'key' => 'orders',
                'label' => 'Siparisler',
                'last_sync' => SalesOrder::query()->max('logo_synced_at'),
            ],
            [
                'key' => 'invoices',
                'label' => 'Faturalar',
                'last_sync' => Invoice::query()->max('logo_synced_at'),
            ],
            [
                'key' => 'salespeople',
                'label' => 'Plasiyerler',
                'last_sync' => SalesRepresentative::query()->max('logo_synced_at'),
            ],
        ];

        return collect($rows)->map(function (array $row) use ($now): array {
            if (empty($row['last_sync'])) {
                return [
                    'key' => $row['key'],
                    'label' => $row['label'],
                    'last_synced_at' => null,
                    'stale_hours' => null,
                    'status' => 'unknown',
                ];
            }

            $lastSync = Carbon::parse($row['last_sync']);
            $staleHours = $lastSync->diffInHours($now);

            $status = match (true) {
                $staleHours <= 4 => 'fresh',
                $staleHours <= 24 => 'warning',
                default => 'stale',
            };

            return [
                'key' => $row['key'],
                'label' => $row['label'],
                'last_synced_at' => $lastSync->toDateTimeString(),
                'stale_hours' => $staleHours,
                'status' => $status,
            ];
        })->all();
    }

    private function getUrgentItems(array $riskPanel, array $inventoryPanel, array $financialPanel, Carbon $today): array
    {
        $items = collect();

        foreach (array_slice($riskPanel['risk_limit_alerts'] ?? [], 0, 4) as $alert) {
            $utilization = (float) ($alert['utilization'] ?? 0);

            $items->push([
                'type' => 'risk_limit',
                'title' => 'Risk limiti asimi',
                'detail' => sprintf(
                    '%s (%s) - %.1f%%',
                    $alert['title'] ?? 'Musteri',
                    $alert['account_code'] ?? '-',
                    $utilization
                ),
                'level' => $utilization >= 120 ? 'high' : 'medium',
                'amount' => (float) ($alert['receivable'] ?? 0),
                'href' => '/current-accounts/' . ($alert['id'] ?? ''),
            ]);
        }

        foreach (array_slice($riskPanel['unpaid_instruments'] ?? [], 0, 4) as $instrument) {
            $dueDate = !empty($instrument['due_date']) ? Carbon::parse($instrument['due_date']) : null;
            $days = $dueDate ? $today->diffInDays($dueDate, false) : null;
            $level = $days !== null && $days <= 0 ? 'high' : 'medium';

            $items->push([
                'type' => 'instrument',
                'title' => 'Odenmemis cek/senet',
                'detail' => sprintf(
                    '%s - %s',
                    $instrument['customer'] ?? 'Musteri',
                    $instrument['number'] ?? '-'
                ),
                'level' => $level,
                'amount' => (float) ($instrument['amount'] ?? 0),
                'href' => '/collections',
            ]);
        }

        foreach (array_slice($inventoryPanel['critical_stock_alerts'] ?? [], 0, 4) as $stock) {
            $availableQty = (float) ($stock['available_qty'] ?? 0);
            $level = $availableQty <= 0 ? 'high' : 'medium';

            $items->push([
                'type' => 'critical_stock',
                'title' => 'Kritik stok',
                'detail' => sprintf(
                    '%s - %s (Kalan: %.2f)',
                    $stock['product_code'] ?? '-',
                    $stock['product_name'] ?? 'Urun',
                    $availableQty
                ),
                'level' => $level,
                'amount' => (float) ($stock['deficit'] ?? 0),
                'href' => '/inventory/items',
            ]);
        }

        $delayedShipments = (int) ($inventoryPanel['shipment_performance']['delayed_shipments'] ?? 0);
        if ($delayedShipments > 0) {
            $items->push([
                'type' => 'shipment_delay',
                'title' => 'Geciken sevkiyat',
                'detail' => "{$delayedShipments} sevkiyat gecikmis durumda",
                'level' => 'medium',
                'amount' => (float) $delayedShipments,
                'href' => '/warehouse/shipping',
            ]);
        }

        $blockedPos = (float) ($financialPanel['pos_receivables']['blocked'] ?? 0);
        if ($blockedPos > 0) {
            $items->push([
                'type' => 'pos_blocked',
                'title' => 'Blokeli POS alacagi',
                'detail' => 'Cozulmeyen POS alacaklari takip edilmeli',
                'level' => 'medium',
                'amount' => $blockedPos,
                'href' => '/collections',
            ]);
        }

        $priority = ['high' => 3, 'medium' => 2, 'low' => 1];

        return $items
            ->sort(function (array $left, array $right) use ($priority): int {
                $leftPriority = $priority[$left['level']] ?? 0;
                $rightPriority = $priority[$right['level']] ?? 0;

                if ($leftPriority === $rightPriority) {
                    return ($right['amount'] ?? 0) <=> ($left['amount'] ?? 0);
                }

                return $rightPriority <=> $leftPriority;
            })
            ->take(10)
            ->values()
            ->all();
    }

    private function getRecentActions(): array
    {
        $invoiceActions = Invoice::query()
            ->orderByDesc('invoice_date')
            ->limit(5)
            ->get(['id', 'invoice_number', 'customer_name', 'invoice_date', 'gross_total', 'status'])
            ->map(function (Invoice $invoice): array {
                return [
                    'id' => 'invoice-' . $invoice->id,
                    'type' => 'invoice',
                    'title' => trim(($invoice->invoice_number ?: 'Fatura') . ' - ' . ($invoice->customer_name ?: 'Musteri')),
                    'date' => $invoice->invoice_date ? Carbon::parse($invoice->invoice_date)->toDateString() : null,
                    'amount' => $this->toFloat($invoice->gross_total),
                    'status' => (string) $invoice->status,
                ];
            });

        $collectionActions = Collection::query()
            ->with(['currentAccount:id,title'])
            ->orderByDesc('collection_date')
            ->limit(5)
            ->get(['id', 'collection_number', 'current_account_id', 'collection_date', 'amount', 'amount_in_base_currency', 'status'])
            ->map(function (Collection $collection): array {
                return [
                    'id' => 'collection-' . $collection->id,
                    'type' => 'collection',
                    'title' => trim(($collection->collection_number ?: 'Tahsilat') . ' - ' . ($collection->currentAccount->title ?? 'Musteri')),
                    'date' => $collection->collection_date ? Carbon::parse($collection->collection_date)->toDateTimeString() : null,
                    'amount' => $this->toFloat($collection->amount_in_base_currency ?? $collection->amount),
                    'status' => (string) $collection->status,
                ];
            });

        $paymentActions = Payment::query()
            ->with(['currentAccount:id,title'])
            ->orderByDesc('payment_date')
            ->limit(5)
            ->get(['id', 'payment_number', 'current_account_id', 'payment_date', 'amount', 'amount_in_base_currency', 'status'])
            ->map(function (Payment $payment): array {
                return [
                    'id' => 'payment-' . $payment->id,
                    'type' => 'payment',
                    'title' => trim(($payment->payment_number ?: 'Odeme') . ' - ' . ($payment->currentAccount->title ?? 'Cari')),
                    'date' => $payment->payment_date ? Carbon::parse($payment->payment_date)->toDateString() : null,
                    'amount' => $this->toFloat($payment->amount_in_base_currency ?? $payment->amount),
                    'status' => (string) $payment->status,
                ];
            });

        return $invoiceActions
            ->merge($collectionActions)
            ->merge($paymentActions)
            ->sortByDesc(function (array $action) {
                return $action['date'] ?? '';
            })
            ->take(10)
            ->values()
            ->all();
    }

    private function sumOutstandingInvoices(callable $queryFilter): float
    {
        $query = Invoice::query()
            ->whereNotIn('status', ['paid', 'cancelled']);

        $queryFilter($query);

        return $this->toFloat(
            $query->selectRaw('SUM(' . $this->outstandingAmountExpression() . ') as total')
                ->value('total')
        );
    }

    private function outstandingAmountExpression(): string
    {
        return 'CASE WHEN COALESCE(remaining_amount, 0) > 0 THEN COALESCE(remaining_amount, 0) WHEN (COALESCE(gross_total, 0) - COALESCE(paid_amount, 0)) > 0 THEN (COALESCE(gross_total, 0) - COALESCE(paid_amount, 0)) ELSE 0 END';
    }

    // ==================== LOGO TIGER DOGRUDAN SORGULARI ====================

    private function getLogoSummary(): ?array
    {
        $firmNo = (int) config('services.logo.firm_no', 1);
        $connection = 'logo';

        try {
            DB::connection($connection)->getPdo();
        } catch (\Throwable $e) {
            Log::warning('Logo DB unreachable for dashboard summary: ' . $e->getMessage());

            return null;
        }

        return [
            'connected' => true,
            'cari_balance' => $this->getLogoCariSummary($connection, $firmNo),
            'stock' => $this->getLogoStockSummary($connection, $firmNo),
            'orders' => $this->getLogoOrderSummary($connection, $firmNo),
            'invoices' => $this->getLogoInvoiceSummary($connection, $firmNo),
        ];
    }

    private function getLogoCariSummary(string $connection, int $firmNo): ?array
    {
        try {
            $table = $this->findLogoTable($connection, $firmNo, ['LG_%03d_01_CLFLINE', 'LG_%03d_CLFLINE']);
            if (!$table) {
                return null;
            }

            $result = DB::connection($connection)->selectOne("
                SELECT
                    COUNT(DISTINCT CLIENTREF) as customer_count,
                    SUM(CASE WHEN SIGN = 0 THEN AMOUNT ELSE 0 END) as total_borc,
                    SUM(CASE WHEN SIGN = 1 THEN AMOUNT ELSE 0 END) as total_alacak
                FROM [{$table}]
                WHERE CANCELLED = 0
            ");

            return [
                'customer_count' => (int) ($result->customer_count ?? 0),
                'total_borc' => round((float) ($result->total_borc ?? 0), 2),
                'total_alacak' => round((float) ($result->total_alacak ?? 0), 2),
                'net_bakiye' => round((float) (($result->total_borc ?? 0) - ($result->total_alacak ?? 0)), 2),
            ];
        } catch (\Throwable $e) {
            Log::warning('Logo cari summary error: ' . $e->getMessage());

            return null;
        }
    }

    private function getLogoStockSummary(string $connection, int $firmNo): ?array
    {
        try {
            $table = $this->findLogoTable($connection, $firmNo, [
                'LV_%03d_01_STINVTOT', 'LG_%03d_01_STINVTOT',
                'LV_%03d_STINVTOT', 'LG_%03d_STINVTOT',
            ]);
            if (!$table) {
                return null;
            }

            $result = DB::connection($connection)->selectOne("
                SELECT
                    COUNT(DISTINCT STOCKREF) as product_count,
                    SUM(ONHAND) as total_quantity
                FROM [{$table}]
                WHERE INVENNO >= 0
            ");

            return [
                'product_count' => (int) ($result->product_count ?? 0),
                'total_quantity' => round((float) ($result->total_quantity ?? 0), 2),
            ];
        } catch (\Throwable $e) {
            Log::warning('Logo stock summary error: ' . $e->getMessage());

            return null;
        }
    }

    private function getLogoOrderSummary(string $connection, int $firmNo): ?array
    {
        try {
            $table = $this->findLogoTable($connection, $firmNo, ['LG_%03d_ORFICHE', 'LG_%03d_01_ORFICHE']);
            if (!$table) {
                return null;
            }

            $result = DB::connection($connection)->selectOne("
                SELECT
                    COUNT(*) as order_count,
                    ISNULL(SUM(NETTOTAL), 0) as total_net,
                    ISNULL(SUM(GROSSTOTAL), 0) as total_gross
                FROM [{$table}]
                WHERE DATE_ >= DATEADD(DAY, -30, GETDATE())
                  AND CANCELLED = 0
            ");

            return [
                'order_count' => (int) ($result->order_count ?? 0),
                'total_net' => round((float) ($result->total_net ?? 0), 2),
                'total_gross' => round((float) ($result->total_gross ?? 0), 2),
            ];
        } catch (\Throwable $e) {
            Log::warning('Logo order summary error: ' . $e->getMessage());

            return null;
        }
    }

    private function getLogoInvoiceSummary(string $connection, int $firmNo): ?array
    {
        try {
            $table = $this->findLogoTable($connection, $firmNo, ['LG_%03d_INVOICE', 'LG_%03d_01_INVOICE']);
            if (!$table) {
                return null;
            }

            $result = DB::connection($connection)->selectOne("
                SELECT
                    COUNT(*) as invoice_count,
                    ISNULL(SUM(NETTOTAL), 0) as total_net,
                    ISNULL(SUM(GROSSTOTAL), 0) as total_gross,
                    ISNULL(SUM(TOTALVAT), 0) as total_vat
                FROM [{$table}]
                WHERE DATE_ >= DATEADD(DAY, -30, GETDATE())
                  AND CANCELLED = 0
            ");

            return [
                'invoice_count' => (int) ($result->invoice_count ?? 0),
                'total_net' => round((float) ($result->total_net ?? 0), 2),
                'total_gross' => round((float) ($result->total_gross ?? 0), 2),
                'total_vat' => round((float) ($result->total_vat ?? 0), 2),
            ];
        } catch (\Throwable $e) {
            Log::warning('Logo invoice summary error: ' . $e->getMessage());

            return null;
        }
    }

    private function getLogoDataQuality(): ?array
    {
        $firmNo = (int) config('services.logo.firm_no', 1);
        $connection = 'logo';

        try {
            DB::connection($connection)->getPdo();
        } catch (\Throwable) {
            return null;
        }

        $erpCustomers = CurrentAccount::count();
        $erpProducts = Product::count();
        $erpOrders = SalesOrder::count();

        $logoCustomers = 0;
        $logoProducts = 0;
        $logoOrders = 0;

        try {
            $clTable = $this->findLogoTable($connection, $firmNo, ['LG_%03d_CLCARD', 'LG_%03d_01_CLCARD']);
            if ($clTable) {
                $logoCustomers = (int) DB::connection($connection)
                    ->selectOne("SELECT COUNT(*) as cnt FROM [{$clTable}] WHERE ACTIVE = 0")?->cnt;
            }
        } catch (\Throwable) {
        }

        try {
            $itemTable = $this->findLogoTable($connection, $firmNo, ['LG_%03d_ITEMS', 'LG_%03d_01_ITEMS']);
            if ($itemTable) {
                $logoProducts = (int) DB::connection($connection)
                    ->selectOne("SELECT COUNT(*) as cnt FROM [{$itemTable}] WHERE ACTIVE = 0")?->cnt;
            }
        } catch (\Throwable) {
        }

        try {
            $orfTable = $this->findLogoTable($connection, $firmNo, ['LG_%03d_ORFICHE', 'LG_%03d_01_ORFICHE']);
            if ($orfTable) {
                $logoOrders = (int) DB::connection($connection)
                    ->selectOne("SELECT COUNT(*) as cnt FROM [{$orfTable}] WHERE CANCELLED = 0")?->cnt;
            }
        } catch (\Throwable) {
        }

        return [
            ['entity' => 'Cariler', 'erp_count' => $erpCustomers, 'logo_count' => $logoCustomers],
            ['entity' => 'Urunler', 'erp_count' => $erpProducts, 'logo_count' => $logoProducts],
            ['entity' => 'Siparisler', 'erp_count' => $erpOrders, 'logo_count' => $logoOrders],
        ];
    }

    private function findLogoTable(string $connection, int $firmNo, array $patterns): ?string
    {
        try {
            foreach ($patterns as $pattern) {
                $tableName = sprintf($pattern, $firmNo);
                $isView = str_starts_with($pattern, 'LV_');

                $schema = $isView ? 'INFORMATION_SCHEMA.VIEWS' : 'INFORMATION_SCHEMA.TABLES';
                $exists = DB::connection($connection)->selectOne(
                    "SELECT COUNT(*) as cnt FROM {$schema} WHERE TABLE_NAME = ?",
                    [$tableName]
                );

                if ($exists && $exists->cnt > 0) {
                    return $tableName;
                }
            }

            return null;
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function getLogoFinancialData(): ?array
    {
        $firmNo = (int) config('services.logo.firm_no', 1);
        $connection = 'logo';

        try {
            DB::connection($connection)->getPdo();
        } catch (\Throwable $e) {
            Log::warning('Logo DB unreachable for financial data: ' . $e->getMessage());

            return null;
        }

        return [
            'connected' => true,
            'cari_net' => $this->safeCall(fn () => $this->getLogoCariNetBalance($connection, $firmNo), null),
            'top_debtors' => $this->safeCall(fn () => $this->getLogoTopDebtors($connection, $firmNo), []),
            'invoice_30d' => $this->safeCall(fn () => $this->getLogoInvoice30d($connection, $firmNo), null),
            'bank_balances' => $this->safeCall(fn () => $this->getLogoBankBalances($connection, $firmNo), []),
            'cash_balances' => $this->safeCall(fn () => $this->getLogoCashBalances($connection, $firmNo), []),
        ];
    }

    private function getLogoCariNetBalance(string $connection, int $firmNo): ?array
    {
        $table = $this->findLogoTable($connection, $firmNo, ['LG_%03d_01_CLFLINE', 'LG_%03d_CLFLINE']);
        if (!$table) {
            return null;
        }

        $result = DB::connection($connection)->selectOne("
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

        $borc = (float) ($result->toplam_borc ?? 0);
        $alacak = (float) ($result->toplam_alacak ?? 0);

        return [
            'toplam_borc' => round($borc, 2),
            'toplam_alacak' => round($alacak, 2),
            'net_alacak' => round($borc - $alacak, 2),
            'cari_sayisi' => (int) ($result->cari_sayisi ?? 0),
        ];
    }

    private function getLogoTopDebtors(string $connection, int $firmNo): array
    {
        $clfTable = $this->findLogoTable($connection, $firmNo, ['LG_%03d_01_CLFLINE', 'LG_%03d_CLFLINE']);
        $clCard = $this->findLogoTable($connection, $firmNo, ['LG_%03d_CLCARD', 'LG_%03d_01_CLCARD']);

        if (!$clfTable || !$clCard) {
            return [];
        }

        $rows = DB::connection($connection)->select("
            SELECT TOP 5
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

        return collect($rows)->map(fn ($row) => [
            'cari_adi' => (string) ($row->cari_adi ?? 'Bilinmeyen'),
            'cari_kodu' => (string) ($row->cari_kodu ?? ''),
            'net_bakiye' => round((float) ($row->net_bakiye ?? 0), 2),
        ])->all();
    }

    private function getLogoInvoice30d(string $connection, int $firmNo): ?array
    {
        $table = $this->findLogoTable($connection, $firmNo, ['LG_%03d_INVOICE', 'LG_%03d_01_INVOICE']);
        if (!$table) {
            return null;
        }

        $result = DB::connection($connection)->selectOne("
            SELECT
                COUNT(*) as fatura_sayisi,
                ISNULL(SUM(NETTOTAL), 0) as net_toplam,
                ISNULL(SUM(GROSSTOTAL), 0) as kdv_dahil_toplam,
                ISNULL(SUM(TOTALVAT), 0) as kdv_toplam
            FROM [{$table}]
            WHERE CANCELLED = 0
              AND TRCODE = 8
              AND DATE_ >= DATEADD(DAY, -30, GETDATE())
        ");

        if (!$result) {
            return null;
        }

        return [
            'fatura_sayisi' => (int) ($result->fatura_sayisi ?? 0),
            'net_toplam' => round((float) ($result->net_toplam ?? 0), 2),
            'kdv_dahil_toplam' => round((float) ($result->kdv_dahil_toplam ?? 0), 2),
            'kdv_toplam' => round((float) ($result->kdv_toplam ?? 0), 2),
        ];
    }

    private function getLogoBankBalances(string $connection, int $firmNo): array
    {
        // Logo Tiger'da banka hareketleri BNFLINE'da tutulur (BNTRANS değil)
        // LV_ view'ı TRCURR kolonuna sahip değil; base table kullan
        $transTable = $this->findLogoTable($connection, $firmNo, [
            'LG_%03d_01_BNFLINE', 'LG_%03d_BNFLINE',
        ]);
        if (!$transTable) {
            return [];
        }

        $cardTable = sprintf('LG_%03d_BNCARD', $firmNo);

        // Hesap bazlı detay sorgusu — BNCARD join ile banka adı ve şube alınır
        $detailRows = DB::connection($connection)->select("
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

        // Döviz bazında gruplama; her gruba hesap detayları eklenir
        return collect($detailRows)
            ->groupBy('currency')
            ->map(function ($group, $currency): array {
                $accounts = $group->map(fn ($r): array => [
                    'code'      => (string) ($r->account_code ?? ''),
                    'name'      => (string) ($r->account_name ?? ''),
                    'branch'    => (string) ($r->branch ?? ''),
                    'total_in'  => round((float) ($r->total_in ?? 0), 2),
                    'total_out' => round((float) ($r->total_out ?? 0), 2),
                    'amount'    => round((float) ($r->net_bakiye ?? 0), 2),
                ])->values()->all();

                $netTotal = array_sum(array_column($accounts, 'amount'));

                return [
                    'currency'      => $currency,
                    'amount'        => round($netTotal, 2),
                    'account_count' => count($accounts),
                    'accounts'      => $accounts,
                ];
            })
            ->filter(fn (array $row): bool => $row['amount'] != 0)
            ->sortByDesc('amount')
            ->values()
            ->all();
    }

    private function getLogoCashBalances(string $connection, int $firmNo): array
    {
        // Logo Tiger'da kasa hareketleri KSLINES'ta tutulur (CSTRANS kasa modülü değil)
        $transTable = $this->findLogoTable($connection, $firmNo, [
            'LG_%03d_01_KSLINES', 'LG_%03d_KSLINES',
        ]);
        if (!$transTable) {
            return [];
        }

        $rows = DB::connection($connection)->select("
            SELECT
                ksl.TRCURR as currency_code,
                ISNULL(cur.CURCODE, CASE WHEN ksl.TRCURR = 0 THEN 'TRY' ELSE CAST(ksl.TRCURR as VARCHAR) END) as currency,
                COUNT(DISTINCT ksl.CARDREF) as account_count,
                ISNULL(SUM(CASE WHEN ksl.SIGN = 0 THEN ksl.AMOUNT ELSE 0 END), 0) as total_in,
                ISNULL(SUM(CASE WHEN ksl.SIGN = 1 THEN ksl.AMOUNT ELSE 0 END), 0) as total_out,
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

    // ==================== YARDIMCI METOTLAR ====================

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
