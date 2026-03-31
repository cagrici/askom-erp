<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\CurrentAccount;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class InvoiceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Cari hesap ve ürün kontrolü
        $currentAccounts = CurrentAccount::where('is_active', true)->limit(5)->get();
        $products = Product::limit(10)->get();

        if ($currentAccounts->isEmpty()) {
            $this->command->warn('No current accounts found. Please seed current accounts first.');
            return;
        }

        if ($products->isEmpty()) {
            $this->command->warn('No products found. Please seed products first.');
            return;
        }

        $this->command->info('Creating sample invoices...');

        // 15 örnek fatura oluştur
        $invoiceCount = 15;
        $invoiceTypes = ['sales', 'sales_return', 'proforma'];
        $currencies = ['TRY', 'USD', 'EUR'];
        $statuses = ['synced', 'approved', 'sent', 'paid'];

        for ($i = 0; $i < $invoiceCount; $i++) {
            DB::transaction(function () use ($i, $currentAccounts, $products, $invoiceTypes, $currencies, $statuses) {
                $currentAccount = $currentAccounts->random();
                $invoiceType = $invoiceTypes[array_rand($invoiceTypes)];
                $currency = $currencies[array_rand($currencies)];
                $status = $statuses[array_rand($statuses)];
                $invoiceDate = Carbon::now()->subDays(rand(1, 90));

                // Para birimi ve kur
                $exchangeRate = match($currency) {
                    'USD' => 28.50 + (rand(-100, 100) / 100),
                    'EUR' => 31.20 + (rand(-100, 100) / 100),
                    default => 1.00,
                };

                // Logo verileri simülasyonu
                $logoLogicalRef = 'LOGO' . str_pad($i + 100000, 8, '0', STR_PAD_LEFT);
                $logoFicheno = 'FAT2024' . str_pad($i + 1, 6, '0', STR_PAD_LEFT);
                $logoTrcode = match($invoiceType) {
                    'sales' => 1,
                    'sales_return' => 2,
                    'proforma' => 7,
                    default => 1,
                };

                // Fatura oluştur
                $invoice = Invoice::create([
                    // Logo alanları
                    'logo_logicalref' => $logoLogicalRef,
                    'logo_ficheno' => $logoFicheno,
                    'logo_trcode' => $logoTrcode,
                    'logo_date' => (int)$invoiceDate->format('Ymd'),
                    'logo_time' => (int)$invoiceDate->format('His'),
                    'logo_trcurr' => match($currency) {
                        'USD' => 1,
                        'EUR' => 20,
                        default => 0,
                    },
                    'logo_cancelled' => false,
                    'logo_clientref' => rand(1000, 9999),
                    'logo_clientcode' => $currentAccount->account_code,
                    'logo_definition' => $currentAccount->title,
                    'logo_taxoffice' => $currentAccount->tax_office,
                    'logo_taxnr' => $currentAccount->tax_number,
                    'logo_genexp1' => $this->generateAddress(),
                    'logo_genexp2' => $this->generateAddress(),
                    'logo_salesmanref' => rand(1, 20),
                    'logo_docode' => 'IRS' . date('Y') . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT),
                    'logo_printcnt' => rand(0, 3),

                    // Normalize edilmiş alanlar
                    'invoice_series' => substr($logoFicheno, 0, 7),
                    'invoice_number' => substr($logoFicheno, 7),
                    'invoice_type' => $invoiceType,
                    'invoice_date' => $invoiceDate,
                    'invoice_time' => $invoiceDate->format('H:i:s'),
                    'currency_code' => $currency,
                    'exchange_rate' => $exchangeRate,

                    // Cari hesap
                    'current_account_id' => $currentAccount->id,
                    'customer_code' => $currentAccount->account_code,
                    'customer_name' => $currentAccount->title,
                    'tax_office' => $currentAccount->tax_office,
                    'tax_number' => $currentAccount->tax_number,

                    // Adresler
                    'billing_address' => $this->generateAddress(),
                    'shipping_address' => $this->generateAddress(),

                    // Durum
                    'status' => $status,
                    'waybill_number' => 'IRS' . date('Y') . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT),

                    // Ödeme bilgileri
                    'due_date' => $invoiceDate->copy()->addDays(rand(15, 90)),
                    'payment_date' => $status === 'paid' ? $invoiceDate->copy()->addDays(rand(1, 45)) : null,

                    // Senkronizasyon
                    'logo_synced_at' => now(),
                    'synced_by' => 'seeder',
                    'sync_status' => 'success',
                ]);

                // Fatura kalemleri oluştur (3-7 arası)
                $itemCount = rand(3, 7);
                $invoiceTotals = [
                    'net_total' => 0,
                    'discount_total' => 0,
                    'vat_total' => 0,
                    'gross_total' => 0,
                ];

                for ($j = 0; $j < $itemCount; $j++) {
                    $product = $products->random();
                    $quantity = rand(1, 20);
                    $unitPrice = rand(50, 5000) / 10; // 5.00 - 500.00 arası

                    // İskontolar
                    $discountRate1 = rand(0, 20);
                    $discountRate2 = $discountRate1 > 0 ? rand(0, 10) : 0;
                    $discountRate3 = $discountRate2 > 0 ? rand(0, 5) : 0;

                    // Toplam iskonto hesaplama
                    $totalDiscountRate = $discountRate1 +
                        ($discountRate2 * (100 - $discountRate1) / 100) +
                        ($discountRate3 * (100 - $discountRate1 - $discountRate2) / 100);

                    // Tutarlar
                    $lineSubtotal = $quantity * $unitPrice;
                    $discountAmount = $lineSubtotal * $totalDiscountRate / 100;
                    $lineTotal = $lineSubtotal - $discountAmount;
                    $vatRate = [1, 10, 20][array_rand([1, 10, 20])]; // %1, %10 veya %20 KDV
                    $vatAmount = $lineTotal * $vatRate / 100;
                    $lineTotalWithVat = $lineTotal + $vatAmount;

                    // Logo değerleri (çarpanlarla)
                    $logoAmount = $quantity * 1000000;
                    $logoPrice = $unitPrice * 1000000;
                    $logoTotal = $lineSubtotal * 1000000;
                    $logoDistdisc = $discountAmount * 1000000;
                    $logoVatamnt = $vatAmount * 1000000;
                    $logoLinenet = $lineTotal * 1000000;

                    InvoiceItem::create([
                        'invoice_id' => $invoice->id,

                        // Logo alanları
                        'logo_logicalref' => $logoLogicalRef . '-' . str_pad($j + 1, 3, '0', STR_PAD_LEFT),
                        'logo_invoiceref' => $i + 100000,
                        'logo_stockref' => rand(1000, 9999),
                        'logo_itemcode' => $product->product_code,
                        'logo_itemname' => $product->product_name,
                        'logo_linetype' => 0, // 0 = Stok kalemi
                        'logo_lineno' => $j + 1,
                        'logo_trcode' => $logoTrcode,
                        'logo_amount' => $logoAmount,
                        'logo_unitcode' => 'AD',
                        'logo_price' => $logoPrice,
                        'logo_total' => $logoTotal,
                        'logo_distdisc' => $logoDistdisc,
                        'logo_discper' => $discountRate1,
                        'logo_disc2per' => $discountRate2,
                        'logo_disc3per' => $discountRate3,
                        'logo_vatrate' => $vatRate,
                        'logo_vatamnt' => $logoVatamnt,
                        'logo_linenet' => $logoLinenet,
                        'logo_vatinc' => 0,

                        // Normalize alanlar
                        'product_id' => $product->id,
                        'product_code' => $product->product_code,
                        'product_name' => $product->product_name,
                        'line_type' => 'product',
                        'line_number' => $j + 1,
                        'quantity' => $quantity,
                        'unit' => 'AD',
                        'unit_conversion_factor' => 1,
                        'unit_price' => $unitPrice,
                        'discount_rate_1' => $discountRate1,
                        'discount_rate_2' => $discountRate2,
                        'discount_rate_3' => $discountRate3,
                        'total_discount_rate' => $totalDiscountRate,
                        'discount_amount' => $discountAmount,
                        'vat_rate' => $vatRate,
                        'vat_amount' => $vatAmount,
                        'line_subtotal' => $lineSubtotal,
                        'line_total' => $lineTotal,
                        'line_total_with_vat' => $lineTotalWithVat,
                        'currency_code' => $currency,
                        'exchange_rate' => $exchangeRate,
                        'logo_synced_at' => now(),
                    ]);

                    // Fatura toplamlarını güncelle
                    $invoiceTotals['net_total'] += $lineSubtotal;
                    $invoiceTotals['discount_total'] += $discountAmount;
                    $invoiceTotals['vat_total'] += $vatAmount;
                    $invoiceTotals['gross_total'] += $lineTotalWithVat;
                }

                // Fatura toplamlarını güncelle
                $invoice->update([
                    'net_total' => $invoiceTotals['net_total'],
                    'discount_total' => $invoiceTotals['discount_total'],
                    'vat_total' => $invoiceTotals['vat_total'],
                    'gross_total' => $invoiceTotals['gross_total'],
                    'paid_amount' => $status === 'paid' ? $invoiceTotals['gross_total'] : 0,
                    'remaining_amount' => $status === 'paid' ? 0 : $invoiceTotals['gross_total'],

                    // Logo toplamları (çarpanlarla)
                    'logo_nettotal' => (int)($invoiceTotals['net_total'] * 100),
                    'logo_grosstotal' => (int)($invoiceTotals['gross_total'] * 100),
                    'logo_totvatamnt' => (int)($invoiceTotals['vat_total'] * 100),
                    'logo_distdisc' => (int)($invoiceTotals['discount_total'] * 100),
                    'logo_reportrate' => (int)($exchangeRate * 10000),
                ]);

                $this->command->info("Created invoice {$logoFicheno} for {$currentAccount->title} - {$invoiceTotals['gross_total']} {$currency}");
            });
        }

        $this->command->info("✓ Created {$invoiceCount} sample invoices with items successfully!");
    }

    /**
     * Generate random address.
     */
    private function generateAddress(): string
    {
        $streets = ['Atatürk Cad.', 'Cumhuriyet Cad.', 'İnönü Cad.', 'Barbaros Bulvarı', 'Bağdat Cad.'];
        $districts = ['Kadıköy', 'Beşiktaş', 'Şişli', 'Beyoğlu', 'Bakırköy', 'Ataşehir', 'Maltepe'];
        $cities = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya'];

        return sprintf(
            "%s No:%d %s/%s %s",
            $streets[array_rand($streets)],
            rand(1, 200),
            $districts[array_rand($districts)],
            $cities[array_rand($cities)],
            str_pad(rand(10000, 99999), 5, '0', STR_PAD_LEFT)
        );
    }
}
