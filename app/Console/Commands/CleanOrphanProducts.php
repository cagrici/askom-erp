<?php

namespace App\Console\Commands;

use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CleanOrphanProducts extends Command
{
    protected $signature = 'products:clean-orphans
                            {--dry-run : Sadece sayıları göster, silme yapma}
                            {--hard-delete : Soft-delete yerine kalıcı sil}';

    protected $description = 'Logo Tiger\'da olmayan ürünleri soft-delete yapar';

    public function handle()
    {
        $dryRun = $this->option('dry-run');
        $hardDelete = $this->option('hard-delete');

        $this->info('Logo Tiger bağlantısı kontrol ediliyor...');

        try {
            $firmNo = (int) config('services.logo.firm_no', env('LOGO_FIRM_NO', 12));
            $table = sprintf('LG_%03d_ITEMS', $firmNo);

            // Logo'daki tüm LOGICALREF'leri çek
            $logoIds = DB::connection('logo')
                ->table($table)
                ->pluck('LOGICALREF')
                ->toArray();

            $this->info("Logo'da toplam kayıt: " . count($logoIds));
        } catch (\Exception $e) {
            $this->error('Logo bağlantısı başarısız: ' . $e->getMessage());
            return 1;
        }

        $logoIdSet = array_flip($logoIds);

        // Local'deki tüm logo_id'li ürünleri çek
        $localProducts = Product::whereNotNull('logo_id')
            ->select('id', 'logo_id', 'name', 'code')
            ->get();

        $this->info("Local toplam ürün: " . $localProducts->count());

        // Orphan'ları bul
        $orphanIds = [];
        foreach ($localProducts as $product) {
            if (!isset($logoIdSet[$product->logo_id])) {
                $orphanIds[] = $product->id;
            }
        }

        $this->info("Logo'da olmayan ürün sayısı: " . count($orphanIds));

        if (count($orphanIds) === 0) {
            $this->info('Silinecek ürün yok.');
            return 0;
        }

        // Bağımlılık kontrolü
        $this->info("\nBağımlılık kontrolü yapılıyor...");
        $chunks = array_chunk($orphanIds, 1000);

        $orderCount = 0;
        $offerCount = 0;
        $invoiceCount = 0;

        foreach ($chunks as $chunk) {
            $orderCount += DB::table('sales_order_items')->whereIn('product_id', $chunk)->count();
            $offerCount += DB::table('sales_offer_items')->whereIn('product_id', $chunk)->count();
            try {
                $invoiceCount += DB::table('invoice_items')->whereIn('product_id', $chunk)->count();
            } catch (\Exception $e) {
                // tablo yoksa geç
            }
        }

        $this->table(
            ['İlişki', 'Adet'],
            [
                ['Sipariş kalemleri', $orderCount],
                ['Teklif kalemleri', $offerCount],
                ['Fatura kalemleri', $invoiceCount],
            ]
        );

        if ($dryRun) {
            $this->warn('DRY-RUN modu - silme yapılmadı.');

            // İlk 20 örnek göster
            $samples = Product::whereIn('id', array_slice($orphanIds, 0, 20))->get(['id', 'code', 'name', 'logo_id']);
            $this->info("\nÖrnek ürünler (ilk 20):");
            $this->table(
                ['ID', 'Kod', 'Ad', 'Logo ID'],
                $samples->map(fn($p) => [$p->id, $p->code, mb_substr($p->name, 0, 50), $p->logo_id])->toArray()
            );

            return 0;
        }

        if (!$this->confirm(count($orphanIds) . ' ürün ' . ($hardDelete ? 'KALICI olarak silinecek' : 'soft-delete yapılacak') . '. Devam?')) {
            $this->info('İptal edildi.');
            return 0;
        }

        // Silme işlemi
        $deleted = 0;
        $bar = $this->output->createProgressBar(count($chunks));

        foreach ($chunks as $chunk) {
            if ($hardDelete) {
                Product::whereIn('id', $chunk)->forceDelete();
            } else {
                Product::whereIn('id', $chunk)->delete(); // soft-delete
            }
            $deleted += count($chunk);
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();

        $action = $hardDelete ? 'kalıcı silindi' : 'soft-delete yapıldı';
        $this->info("{$deleted} ürün {$action}.");

        Log::info("CleanOrphanProducts: {$deleted} ürün {$action}.");

        return 0;
    }
}
