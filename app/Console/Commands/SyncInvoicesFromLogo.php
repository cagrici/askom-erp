<?php

namespace App\Console\Commands;

use App\Models\Invoice;
use App\Models\InvoiceD;
use App\Models\CurrentAccount;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class SyncInvoicesFromLogo extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'logo:sync-invoices
                            {--date-from= : Start date for sync (YYYY-MM-DD)}
                            {--date-to= : End date for sync (YYYY-MM-DD)}
                            {--invoice-id= : Sync specific invoice by Logo LOGICALREF}
                            {--limit= : Limit number of invoices to sync}
                            {--dry-run : Run without saving to database}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync invoices from Logo ERP to local database';

    private int $created = 0;
    private int $updated = 0;
    private int $skipped = 0;
    private int $errors = 0;

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting Logo invoice synchronization...');

        $startTime = now();
        $isDryRun = $this->option('dry-run');

        if ($isDryRun) {
            $this->warn('DRY RUN MODE - No changes will be saved to database');
        }

        try {
            // Build query for Logo database
            $query = $this->buildLogoQuery();

            // Get invoices from Logo
            $logoInvoices = $query->get();

            $this->info("Found {$logoInvoices->count()} invoices in Logo ERP");

            // Process each invoice
            $this->output->progressStart($logoInvoices->count());

            foreach ($logoInvoices as $logoInvoice) {
                try {
                    $this->syncInvoice($logoInvoice, $isDryRun);
                    $this->output->progressAdvance();
                } catch (\Exception $e) {
                    $this->errors++;
                    Log::error("Error syncing invoice {$logoInvoice->LOGICALREF}: {$e->getMessage()}");
                    $this->error("Error processing invoice {$logoInvoice->LOGICALREF}: {$e->getMessage()}");
                }
            }

            $this->output->progressFinish();

            // Display summary
            $this->displaySummary($startTime);

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error("Fatal error during sync: {$e->getMessage()}");
            Log::error("Logo invoice sync failed: {$e->getMessage()}");
            return Command::FAILURE;
        }
    }

    /**
     * Build the Logo database query based on command options.
     */
    private function buildLogoQuery()
    {
        // Logo fatura tablosu: LG_012_01_STFICHE
        // TRCODE: 7=Perakende Satış İrsaliyesi, 8=Toptan Satış İrsaliyesi, 50=Satış Faturası
        $firmNo = (int) config('services.logo.firm_no', 12);
        $tableName = sprintf('LG_%03d_01_STFICHE', $firmNo);

        $this->info("Reading from Logo table: {$tableName}");

        // Cari tablosu için join
        $clcardTable = sprintf('LG_%03d_CLCARD', $firmNo);

        $query = DB::connection('logo')
            ->table($tableName . ' as sf')
            ->leftJoin($clcardTable . ' as cc', 'sf.CLIENTREF', '=', 'cc.LOGICALREF')
            ->select([
                'sf.LOGICALREF',
                'sf.FICHENO as INVOICE_NUMBER',
                'sf.DATE_ as INVOICE_DATE',
                'sf.FTIME as INVOICE_TIME',  // STFICHE uses FTIME not TIME_
                'sf.TRCODE as INVOICE_TYPE',
                'sf.CLIENTREF as CLIENT_REF',
                'cc.CODE as CUSTOMER_CODE',
                'cc.DEFINITION_ as CUSTOMER_NAME',
                'cc.TAXOFFICE as TAX_OFFICE',
                'cc.TAXNR as TAX_NUMBER',
                'sf.NETTOTAL as NET_TOTAL',
                'sf.TOTALDISCOUNTS as DISCOUNT_TOTAL',
                'sf.TOTALVAT as VAT_TOTAL',
                'sf.GROSSTOTAL as GROSS_TOTAL',
                'sf.REPORTRATE as EXCHANGE_RATE',
                'sf.TRCURR as CURRENCY_CODE',
                'sf.GENEXP1 as NOTES1',
                'sf.GENEXP2 as NOTES2',
                'sf.SALESMANREF as SALESMAN_REF',
                'sf.STATUS',
                'sf.CANCELLED',
                'sf.SOURCEINDEX as WAREHOUSE_INDEX',
                'sf.BRANCH',
                'sf.DEPARTMENT',
                'sf.DOCODE as WAYBILL_NUMBER',  // İrsaliye numarası
            ])
            ->whereIn('sf.TRCODE', [7, 8, 50, 51]) // Satış irsaliyeleri ve faturaları
            ->where('sf.CANCELLED', 0); // İptal edilmemiş

        // Apply filters
        if ($invoiceId = $this->option('invoice-id')) {
            $query->where('sf.LOGICALREF', $invoiceId);
        }

        if ($dateFrom = $this->option('date-from')) {
            $query->where('sf.DATE_', '>=', Carbon::parse($dateFrom)->format('Y-m-d'));
        }

        if ($dateTo = $this->option('date-to')) {
            $query->where('sf.DATE_', '<=', Carbon::parse($dateTo)->format('Y-m-d'));
        }

        if ($limit = $this->option('limit')) {
            $query->limit($limit);
        }

        $query->orderBy('sf.DATE_', 'desc')->orderBy('sf.LOGICALREF', 'desc');

        return $query;
    }

    /**
     * Sync a single invoice from Logo to local database.
     */
    private function syncInvoice($logoInvoice, bool $isDryRun = false)
    {
        // Find current account by logo_id (CLIENTREF)
        $currentAccount = CurrentAccount::where('logo_id', $logoInvoice->CLIENT_REF)->first();

        // Check if invoice already exists
        $invoice = Invoice::where('logo_logicalref', $logoInvoice->LOGICALREF)->first();

        // Logo FTIME değeri büyük integer - zaman olarak kullanılmıyor
        // CAPIBLOCK_CREATEDHOUR/MIN/SEC kullanılabilir ama şimdilik null bırakıyoruz
        $invoiceTime = null;

        // Para birimi çevirimi
        $currencyCode = $this->mapCurrencyCode($logoInvoice->CURRENCY_CODE);

        $invoiceData = [
            'logo_logicalref' => $logoInvoice->LOGICALREF,
            'logo_ficheno' => $logoInvoice->INVOICE_NUMBER,
            'logo_trcode' => $logoInvoice->INVOICE_TYPE,
            'logo_nettotal' => $logoInvoice->NET_TOTAL ?? 0,
            'logo_grosstotal' => $logoInvoice->GROSS_TOTAL ?? 0,
            'logo_totvatamnt' => $logoInvoice->VAT_TOTAL ?? 0,
            'logo_distdisc' => $logoInvoice->DISCOUNT_TOTAL ?? 0,
            'logo_reportrate' => $logoInvoice->EXCHANGE_RATE ?? 1,
            'logo_trcurr' => $logoInvoice->CURRENCY_CODE ?? 0,
            'logo_date' => Carbon::parse($logoInvoice->INVOICE_DATE)->format('Ymd'),
            'logo_time' => $logoInvoice->INVOICE_TIME ?? 0,
            'logo_cancelled' => $logoInvoice->CANCELLED ?? 0,
            'logo_clientref' => $logoInvoice->CLIENT_REF,
            'logo_clientcode' => $logoInvoice->CUSTOMER_CODE,
            'logo_definition' => $logoInvoice->CUSTOMER_NAME,
            'logo_taxoffice' => $logoInvoice->TAX_OFFICE,
            'logo_taxnr' => $logoInvoice->TAX_NUMBER,
            'logo_genexp1' => $logoInvoice->NOTES1,
            'logo_genexp2' => $logoInvoice->NOTES2,
            'logo_salesmanref' => $logoInvoice->SALESMAN_REF ?? 0,
            'invoice_type' => $this->mapInvoiceType($logoInvoice->INVOICE_TYPE),
            'invoice_series' => $this->extractSeries($logoInvoice->INVOICE_NUMBER),
            'invoice_number' => $this->extractNumber($logoInvoice->INVOICE_NUMBER),
            'invoice_date' => Carbon::parse($logoInvoice->INVOICE_DATE),
            'invoice_time' => $invoiceTime,
            'current_account_id' => $currentAccount?->id,
            'customer_code' => $logoInvoice->CUSTOMER_CODE,
            'customer_name' => $logoInvoice->CUSTOMER_NAME,
            'tax_office' => $logoInvoice->TAX_OFFICE,
            'tax_number' => $logoInvoice->TAX_NUMBER,
            'net_total' => $logoInvoice->NET_TOTAL ?? 0,
            'discount_total' => $logoInvoice->DISCOUNT_TOTAL ?? 0,
            'vat_total' => $logoInvoice->VAT_TOTAL ?? 0,
            'gross_total' => $logoInvoice->GROSS_TOTAL ?? 0,
            'currency_code' => $currencyCode,
            'exchange_rate' => $logoInvoice->EXCHANGE_RATE ?? 1,
            'notes' => trim(($logoInvoice->NOTES1 ?? '') . ' ' . ($logoInvoice->NOTES2 ?? '')),
            'waybill_number' => $logoInvoice->WAYBILL_NUMBER ?? null,
            'status' => 'synced',
            'sync_status' => 'success',
            'logo_synced_at' => now(),
            'synced_by' => 'system',
        ];

        if (!$isDryRun) {
            if ($invoice) {
                // Update existing invoice
                $invoice->update($invoiceData);
                $this->updated++;

                // Sync invoice items
                $this->syncInvoiceItems($invoice, $logoInvoice->LOGICALREF);
            } else {
                // Create new invoice
                $invoice = Invoice::create($invoiceData);
                $this->created++;

                // Sync invoice items
                $this->syncInvoiceItems($invoice, $logoInvoice->LOGICALREF);
            }
        } else {
            if ($invoice) {
                $this->info("Would update invoice: {$logoInvoice->INVOICE_NUMBER}");
                $this->updated++;
            } else {
                $this->info("Would create invoice: {$logoInvoice->INVOICE_NUMBER}");
                $this->created++;
            }
        }
    }

    /**
     * Sync invoice items/details from Logo.
     */
    private function syncInvoiceItems(Invoice $invoice, $logoInvoiceRef)
    {
        $firmNo = (int) config('services.logo.firm_no', 12);
        $lineTable = sprintf('LG_%03d_01_STLINE', $firmNo);
        $itemsTable = sprintf('LG_%03d_ITEMS', $firmNo);

        // STFICHEREF ile fatura satırlarını çek
        $logoItems = DB::connection('logo')
            ->table($lineTable . ' as sl')
            ->leftJoin($itemsTable . ' as it', 'sl.STOCKREF', '=', 'it.LOGICALREF')
            ->select([
                'sl.LOGICALREF',
                'sl.STFICHEREF',
                'sl.STOCKREF',
                'it.CODE as PRODUCT_CODE',
                'it.NAME as PRODUCT_NAME',
                'sl.AMOUNT',
                'sl.PRICE',
                'sl.TOTAL',
                'sl.LINENET',
                'sl.VAT',
                'sl.VATAMNT',
                'sl.DISTDISC',
                'sl.TRCODE',
                'sl.ORDFICHEREF',
            ])
            ->where('sl.STFICHEREF', $logoInvoiceRef)
            ->get();

        // Mevcut satırları temizle (soft delete değilse)
        // InvoiceItem::where('invoice_id', $invoice->id)->delete();

        foreach ($logoItems as $logoItem) {
            // InvoiceItem veya InvoiceD modeli ile kaydet
            // Şimdilik sadece log
            Log::debug("Invoice item synced", [
                'invoice_id' => $invoice->id,
                'logo_lineref' => $logoItem->LOGICALREF,
                'product_code' => $logoItem->PRODUCT_CODE,
                'amount' => $logoItem->AMOUNT,
                'price' => $logoItem->PRICE,
            ]);
        }
    }

    /**
     * Find current account by Logo CLIENTREF or account code.
     */
    private function findCurrentAccount($clientRef, $customerCode)
    {
        // Önce logo_id ile dene
        if ($clientRef) {
            $account = CurrentAccount::where('logo_id', $clientRef)->first();
            if ($account) {
                return $account;
            }
        }

        // Sonra account_code ile dene
        if ($customerCode) {
            return CurrentAccount::where('account_code', $customerCode)->first();
        }

        return null;
    }

    /**
     * Map Logo invoice type code to our invoice type.
     *
     * STFICHE TRCODE değerleri:
     * 1 = Mal Alım İrsaliyesi
     * 2 = Perakende Satış İade İrsaliyesi
     * 3 = Toptan Satış İade İrsaliyesi
     * 6 = Alım İade İrsaliyesi
     * 7 = Perakende Satış İrsaliyesi
     * 8 = Toptan Satış İrsaliyesi
     * 50 = Satış Faturası
     * 51 = Satış İade Faturası
     */
    private function mapInvoiceType($trcode): string
    {
        return match ((int)$trcode) {
            7, 8 => 'waybill',           // Satış İrsaliyesi
            50 => 'sales',               // Satış Faturası
            51 => 'sales_return',        // Satış İade Faturası
            2, 3 => 'waybill_return',    // Satış İade İrsaliyesi
            1 => 'purchase_waybill',     // Alım İrsaliyesi
            6 => 'purchase_return',      // Alım İade İrsaliyesi
            default => 'sales',
        };
    }

    /**
     * Map Logo currency code to ISO currency code.
     *
     * Logo TRCURR değerleri:
     * 0 = TRY (Türk Lirası)
     * 1 = USD (Amerikan Doları)
     * 20 = EUR (Euro)
     * 4 = GBP (İngiliz Sterlini)
     */
    private function mapCurrencyCode($trcurr): string
    {
        return match ((int)$trcurr) {
            0 => 'TRY',
            1 => 'USD',
            20 => 'EUR',
            4 => 'GBP',
            default => 'TRY',
        };
    }

    /**
     * Extract series from invoice number.
     * Logo formatı: "ASI2026000000173" veya "000000101"
     */
    private function extractSeries($invoiceNumber): string
    {
        if (empty($invoiceNumber)) {
            return 'INV';
        }

        // Logo formatı: "ASI2026000000173" - harflerle başlayan kısım seri
        if (preg_match('/^([A-Za-z]+)/', $invoiceNumber, $matches)) {
            return $matches[1];
        }

        // Tire ile ayrılmış format: "ABC-00001"
        if (str_contains($invoiceNumber, '-')) {
            return explode('-', $invoiceNumber)[0];
        }

        return 'INV'; // Varsayılan seri
    }

    /**
     * Extract number from invoice number.
     * Logo formatı: "ASI2026000000173" -> "000000173"
     */
    private function extractNumber($invoiceNumber): string
    {
        if (empty($invoiceNumber)) {
            return '000001';
        }

        // Logo formatı: "ASI2026000000173" - sayısal kısım
        if (preg_match('/(\d+)$/', $invoiceNumber, $matches)) {
            return $matches[1];
        }

        // Tire ile ayrılmış format: "ABC-00001"
        if (str_contains($invoiceNumber, '-')) {
            return explode('-', $invoiceNumber)[1];
        }

        return $invoiceNumber;
    }

    /**
     * Display sync summary.
     */
    private function displaySummary($startTime)
    {
        $duration = $startTime->diffInSeconds(now());

        $this->newLine();
        $this->info('=== Synchronization Summary ===');
        $this->info("Created: {$this->created}");
        $this->info("Updated: {$this->updated}");
        $this->info("Skipped: {$this->skipped}");

        if ($this->errors > 0) {
            $this->error("Errors: {$this->errors}");
        }

        $this->info("Duration: {$duration} seconds");
        $this->info('==============================');
    }
}
