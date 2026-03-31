<?php

namespace App\Console\Commands;

use App\Services\LogoService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class InspectLogoPriceTables extends Command
{
    protected $signature = 'logo:inspect-prices
                            {--firm= : Logo firma numarasi (default: env LOGO_FIRM_NO)}
                            {--table= : Belirli bir tabloyu incele}
                            {--sample=5 : Ornek kayit sayisi}';

    protected $description = 'Logo veritabanindaki fiyat tablolarini incele';

    protected LogoService $logoService;

    public function __construct(LogoService $logoService)
    {
        parent::__construct();
        $this->logoService = $logoService;
    }

    public function handle()
    {
        $firmNo = (int) ($this->option('firm') ?? config('services.logo.firm_no', 1));
        $specificTable = $this->option('table');
        $sampleCount = (int) $this->option('sample');

        $this->info("Logo Fiyat Tablolari Inceleniyor - Firma: {$firmNo}");
        $this->newLine();

        // Baglanti testi
        $conn = $this->logoService->testConnection();
        if (!$conn['success']) {
            $this->error('Logo veritabanina baglanilamadi: ' . ($conn['error'] ?? 'Bilinmeyen hata'));
            return Command::FAILURE;
        }

        $this->info('Baglanti basarili: ' . ($conn['database_name'] ?? 'N/A'));
        $this->newLine();

        // Fiyat ile ilgili tablolari bul
        $pricePatterns = [
            "LG_%03d_ITMUNITA",     // Urun birim fiyatlari
            "LG_%03d_01_ITMUNITA",  // Alternatif format
            "LG_%03d_PRCLIST",      // Fiyat listeleri
            "LG_%03d_01_PRCLIST",
            "LG_%03d_PRCCARD",      // Fiyat kartlari
            "LG_%03d_01_PRCCARD",
            "LG_%03d_ITEMS",        // Urunler (fiyat alanlari var)
            "LG_%03d_01_ITEMS",
        ];

        $foundTables = [];

        foreach ($pricePatterns as $pattern) {
            $tableName = sprintf($pattern, $firmNo);
            if ($this->tableExists($tableName)) {
                $foundTables[] = $tableName;
            }
        }

        // Ek olarak PRICE iceren tum tablolari ara
        $allPriceTables = $this->searchTables($firmNo, ['PRICE', 'PRC', 'ITMUN']);
        $foundTables = array_unique(array_merge($foundTables, $allPriceTables));

        if (empty($foundTables)) {
            $this->warn('Hicbir fiyat tablosu bulunamadi!');
            return Command::FAILURE;
        }

        $this->info('Bulunan fiyat tablolari:');
        foreach ($foundTables as $table) {
            $count = $this->getTableCount($table);
            $this->line("  - {$table} ({$count} kayit)");
        }
        $this->newLine();

        // Belirli tablo veya hepsini incele
        $tablesToInspect = $specificTable ? [$specificTable] : $foundTables;

        foreach ($tablesToInspect as $tableName) {
            $this->inspectTable($tableName, $sampleCount, $firmNo);
        }

        return Command::SUCCESS;
    }

    protected function inspectTable(string $tableName, int $sampleCount, int $firmNo): void
    {
        $this->newLine();
        $this->info("=== {$tableName} ===");

        // Kolon bilgilerini al
        $columns = $this->logoService->getTableColumns($tableName);

        if (!$columns['success'] || empty($columns['columns'])) {
            $this->warn("Tablo kolonlari alinamadi");
            return;
        }

        // Fiyat ile ilgili kolonlari filtrele
        $priceColumns = [];
        $allColumns = [];
        foreach ($columns['columns'] as $col) {
            $allColumns[] = $col->COLUMN_NAME;
            $colName = strtoupper($col->COLUMN_NAME);
            if (str_contains($colName, 'PRICE') ||
                str_contains($colName, 'COST') ||
                str_contains($colName, 'AMOUNT') ||
                str_contains($colName, 'CURR') ||
                $colName === 'LOGICALREF' ||
                $colName === 'ITEMREF' ||
                $colName === 'CARDREF' ||
                $colName === 'CODE' ||
                $colName === 'NAME' ||
                str_contains($colName, 'LIESSION') ||
                str_contains($colName, 'PTYPE')) {
                $priceColumns[] = $col->COLUMN_NAME;
            }
        }

        $this->line("Toplam kolon sayisi: " . count($allColumns));
        $this->line("Fiyat ile ilgili kolonlar: " . implode(', ', $priceColumns));
        $this->newLine();

        // Ornek veri cek
        if ($sampleCount > 0) {
            $this->line("Ornek veriler ({$sampleCount} kayit):");

            try {
                // ITEMS tablosu icin ozel sorgu
                if (str_contains($tableName, 'ITEMS')) {
                    $selectColumns = ['LOGICALREF', 'CODE', 'NAME'];
                    // Fiyat kolonlarini ekle
                    foreach ($allColumns as $col) {
                        if (str_contains(strtoupper($col), 'PRICE') || str_contains(strtoupper($col), 'COST')) {
                            $selectColumns[] = $col;
                        }
                    }
                    $selectColumns = array_unique($selectColumns);
                }
                // ITMUNITA tablosu icin
                elseif (str_contains($tableName, 'ITMUNITA')) {
                    $selectColumns = ['LOGICALREF', 'ITEMREF', 'UNITLINEREF', 'LIESSION', 'PRICE', 'CURRENCY'];
                    // Mevcut kolonlarla kesisim
                    $selectColumns = array_intersect($selectColumns, $allColumns);
                    if (empty($selectColumns)) {
                        $selectColumns = array_slice($allColumns, 0, 10);
                    }
                }
                // Diger tablolar
                else {
                    $selectColumns = !empty($priceColumns) ? $priceColumns : array_slice($allColumns, 0, 10);
                }

                $data = DB::connection('logo')
                    ->table($tableName)
                    ->select($selectColumns)
                    ->limit($sampleCount)
                    ->get();

                if ($data->isEmpty()) {
                    $this->warn("  Tablo bos");
                } else {
                    // Tablo olarak goster
                    $headers = $selectColumns;
                    $rows = $data->map(function ($row) use ($selectColumns) {
                        $rowData = [];
                        foreach ($selectColumns as $col) {
                            $value = $row->$col ?? '';
                            // Uzun degerleri kisalt
                            if (is_string($value) && strlen($value) > 30) {
                                $value = substr($value, 0, 27) . '...';
                            }
                            $rowData[] = $value;
                        }
                        return $rowData;
                    })->toArray();

                    $this->table($headers, $rows);
                }

                // ITMUNITA icin fiyat > 0 olan kayitlari kontrol et
                if (str_contains($tableName, 'ITMUNITA') && in_array('PRICE', $allColumns)) {
                    $priceCount = DB::connection('logo')
                        ->table($tableName)
                        ->where('PRICE', '>', 0)
                        ->count();
                    $this->info("  Fiyati > 0 olan kayit sayisi: {$priceCount}");
                }

            } catch (\Exception $e) {
                $this->error("  Veri cekilemedi: " . $e->getMessage());
            }
        }

        // Tum kolonlari listele
        $this->newLine();
        $this->line("Tum kolonlar:");
        $this->line("  " . implode(', ', $allColumns));
    }

    protected function tableExists(string $tableName): bool
    {
        try {
            $exists = DB::connection('logo')
                ->selectOne("
                    SELECT COUNT(*) as count
                    FROM INFORMATION_SCHEMA.TABLES
                    WHERE TABLE_NAME = ?
                ", [$tableName]);

            return $exists && $exists->count > 0;
        } catch (\Exception $e) {
            return false;
        }
    }

    protected function searchTables(int $firmNo, array $patterns): array
    {
        $tables = [];

        try {
            foreach ($patterns as $pattern) {
                $results = DB::connection('logo')
                    ->select("
                        SELECT TABLE_NAME
                        FROM INFORMATION_SCHEMA.TABLES
                        WHERE TABLE_TYPE = 'BASE TABLE'
                        AND TABLE_NAME LIKE ?
                    ", ["LG_{$firmNo}%{$pattern}%"]);

                foreach ($results as $row) {
                    $tables[] = $row->TABLE_NAME;
                }
            }
        } catch (\Exception $e) {
            // Ignore
        }

        return array_unique($tables);
    }

    protected function getTableCount(string $tableName): int
    {
        try {
            return DB::connection('logo')->table($tableName)->count();
        } catch (\Exception $e) {
            return 0;
        }
    }
}
