<?php

namespace App\Console\Commands;

use App\Models\ExchangeRate;
use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class UpdateProductTryPrices extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'products:update-try-prices
                            {--date= : Döviz kuru tarihi (varsayılan: bugün)}
                            {--force : TRY ürünleri de güncelle}
                            {--dry-run : Değişiklikleri kaydetmeden göster}';

    /**
     * The console command description.
     */
    protected $description = 'Dövizli ürün fiyatlarını güncel kur ile TL\'ye dönüştürür';

    /**
     * Desteklenen para birimleri
     */
    protected array $supportedCurrencies = ['USD', 'EUR', 'GBP', 'CHF'];

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $date = $this->option('date') ?? now()->format('Y-m-d');
        $force = $this->option('force');
        $dryRun = $this->option('dry-run');

        $this->info("Ürün TL fiyatları güncelleniyor...");
        $this->info("Kur tarihi: {$date}");

        if ($dryRun) {
            $this->warn("DRY-RUN modu - değişiklikler kaydedilmeyecek");
        }

        // Güncel kurları al
        $rates = $this->getExchangeRates($date);

        if (empty($rates)) {
            $this->error("Belirtilen tarih için döviz kuru bulunamadı: {$date}");
            $this->info("Son kullanılabilir kurlar kontrol ediliyor...");

            $rates = $this->getLatestAvailableRates();

            if (empty($rates)) {
                $this->error("Hiç döviz kuru bulunamadı!");
                return Command::FAILURE;
            }

            $this->info("Bulunan kurlar kullanılacak.");
        }

        $this->displayRates($rates);

        // Dövizli ürünleri al
        $query = Product::whereNotNull('logo_currency')
            ->where('logo_currency', '!=', 'TRY')
            ->whereIn('logo_currency', $this->supportedCurrencies);

        if (!$force) {
            // Sadece bugün güncellenmemiş ürünler
            $query->where(function ($q) use ($date) {
                $q->whereNull('price_converted_at')
                    ->orWhere('price_converted_at', '<', $date);
            });
        }

        $totalProducts = $query->count();

        if ($totalProducts === 0) {
            $this->info("Güncellenecek ürün bulunamadı.");
            return Command::SUCCESS;
        }

        $this->info("Güncellenecek ürün sayısı: {$totalProducts}");

        $stats = [
            'updated' => 0,
            'skipped' => 0,
            'errors' => 0,
        ];

        $progressBar = $this->output->createProgressBar($totalProducts);
        $progressBar->start();

        // Batch işleme
        $query->chunk(500, function ($products) use ($rates, $date, $dryRun, &$stats, $progressBar) {
            foreach ($products as $product) {
                try {
                    $result = $this->updateProductTryPrice($product, $rates, $date, $dryRun);

                    if ($result) {
                        $stats['updated']++;
                    } else {
                        $stats['skipped']++;
                    }
                } catch (\Exception $e) {
                    $stats['errors']++;
                    Log::error("TRY fiyat güncelleme hatası - Ürün ID: {$product->id}", [
                        'error' => $e->getMessage(),
                    ]);
                }

                $progressBar->advance();
            }
        });

        $progressBar->finish();
        $this->newLine(2);

        // TRY para birimli ürünleri de güncelle (sale_price_try = sale_price)
        if ($force || !$dryRun) {
            $tryUpdated = $this->updateTryProducts($date, $dryRun);
            $this->info("TRY ürünleri güncellendi: {$tryUpdated}");
        }

        // Sonuçları göster
        $this->table(
            ['Metrik', 'Değer'],
            [
                ['Güncellenen', $stats['updated']],
                ['Atlanan', $stats['skipped']],
                ['Hata', $stats['errors']],
            ]
        );

        Log::info('Ürün TL fiyat güncellemesi tamamlandı', [
            'date' => $date,
            'stats' => $stats,
        ]);

        return Command::SUCCESS;
    }

    /**
     * Belirli tarih için döviz kurlarını al
     */
    protected function getExchangeRates(string $date): array
    {
        $rates = [];

        foreach ($this->supportedCurrencies as $currency) {
            $rate = ExchangeRate::getRate($currency, $date, 'A'); // Alış kuru

            if ($rate) {
                $rates[$currency] = [
                    'value' => $rate->value,
                    'date' => $rate->date->format('Y-m-d'),
                ];
            }
        }

        return $rates;
    }

    /**
     * Son kullanılabilir kurları al
     */
    protected function getLatestAvailableRates(): array
    {
        $rates = [];
        $latestRates = ExchangeRate::getLatestRates('A');

        foreach ($this->supportedCurrencies as $currency) {
            if (isset($latestRates[$currency])) {
                $rates[$currency] = [
                    'value' => $latestRates[$currency]->value,
                    'date' => $latestRates[$currency]->date->format('Y-m-d'),
                ];
            }
        }

        return $rates;
    }

    /**
     * Kurları göster
     */
    protected function displayRates(array $rates): void
    {
        $tableData = [];

        foreach ($rates as $currency => $data) {
            $tableData[] = [
                $currency,
                number_format($data['value'], 4, ',', '.') . ' TL',
                $data['date'],
            ];
        }

        $this->table(['Para Birimi', 'Kur', 'Tarih'], $tableData);
    }

    /**
     * Tek bir ürünün TL fiyatını güncelle
     */
    protected function updateProductTryPrice(Product $product, array $rates, string $date, bool $dryRun): bool
    {
        $currency = $product->logo_currency;

        if (!isset($rates[$currency])) {
            return false;
        }

        $rate = $rates[$currency]['value'];

        // Satış fiyatı TL dönüşümü
        $salePriceTry = null;
        if ($product->sale_price && $product->sale_price > 0) {
            $salePriceTry = round($product->sale_price * $rate, 4);
        }

        // Maliyet fiyatı TL dönüşümü
        $costPriceTry = null;
        if ($product->cost_price && $product->cost_price > 0) {
            $costPriceTry = round($product->cost_price * $rate, 4);
        }

        if ($dryRun) {
            $this->line(sprintf(
                "  [%s] %s: %s %s → %.2f TL",
                $product->code,
                $product->name,
                number_format($product->sale_price, 2),
                $currency,
                $salePriceTry ?? 0
            ));
            return true;
        }

        $product->update([
            'sale_price_try' => $salePriceTry,
            'cost_price_try' => $costPriceTry,
            'currency' => $currency,
            'price_converted_at' => $date,
        ]);

        return true;
    }

    /**
     * TRY para birimli ürünlerin sale_price_try alanını güncelle
     */
    protected function updateTryProducts(string $date, bool $dryRun): int
    {
        if ($dryRun) {
            return Product::where(function ($q) {
                $q->whereNull('logo_currency')
                    ->orWhere('logo_currency', 'TRY');
            })->count();
        }

        return Product::where(function ($q) {
            $q->whereNull('logo_currency')
                ->orWhere('logo_currency', 'TRY');
        })->update([
            'sale_price_try' => DB::raw('sale_price'),
            'cost_price_try' => DB::raw('cost_price'),
            'currency' => 'TRY',
            'price_converted_at' => $date,
        ]);
    }
}
