# Logo Fatura Senkronizasyon Dökümanı

Bu döküman, Logo Muhasebe yazılımından fatura verilerinin aktarılması için hazırlanmıştır.

## Tablo Yapısı

### 1. invoices Tablosu
Ana fatura bilgilerini tutar. Logo'nun `LG_XXX_XX_INVOICE` tablosu ile eşleşir.

### 2. invoice_items Tablosu
Fatura kalemlerini tutar. Logo'nun `LG_XXX_XX_STLINE` tablosu ile eşleşir.

## Logo Alan Eşlemeleri

### Ana Fatura Alanları (invoices)

| Logo Alan | MySQL Alan | Açıklama | Dönüşüm |
|-----------|-----------|----------|---------|
| LOGICALREF | logo_logicalref | Benzersiz kayıt ID | Direkt |
| FICHENO | logo_ficheno | Fiş numarası | Direkt |
| TRCODE | logo_trcode | İşlem kodu | 1=Satış, 2=Satış İade, 3=Alış, 4=Alış İade |
| DATE_ | logo_date | Tarih | YYYYMMDD formatı |
| TIME_ | logo_time | Saat | HHMMSS formatı |
| NETTOTAL | logo_nettotal | Net tutar | Değer / 100 |
| GROSSTOTAL | logo_grosstotal | Brüt tutar | Değer / 100 |
| TOTVATAMNT | logo_totvatamnt | KDV tutarı | Değer / 100 |
| DISTDISC | logo_distdisc | İskonto tutarı | Değer / 100 |
| REPORTRATE | logo_reportrate | Döviz kuru | Değer / 10000 |
| TRCURR | logo_trcurr | Para birimi | 0=TRY, 1=USD, 20=EUR, 160=GBP |
| CLIENTREF | logo_clientref | Cari hesap ref | Direkt |
| CLIENTCODE | logo_clientcode | Cari hesap kodu | Direkt |
| DEFINITION_ | logo_definition | Cari unvan | Direkt |
| TAXOFFICE | logo_taxoffice | Vergi dairesi | Direkt |
| TAXNR | logo_taxnr | Vergi/TC no | Direkt |
| GENEXP1 | logo_genexp1 | Fatura adresi | Direkt |
| GENEXP2 | logo_genexp2 | Sevk adresi | Direkt |
| SALESMANREF | logo_salesmanref | Satış temsilcisi ref | Direkt |
| DOCODE | logo_docode | İrsaliye no | Direkt |
| CANCELLED | logo_cancelled | İptal durumu | 0=Aktif, 1=İptal |

### Fatura Satır Alanları (invoice_items)

| Logo Alan | MySQL Alan | Açıklama | Dönüşüm |
|-----------|-----------|----------|---------|
| LOGICALREF | logo_logicalref | Benzersiz satır ID | Direkt |
| INVOICEREF | logo_invoiceref | Ana fatura ref | Direkt |
| STOCKREF | logo_stockref | Stok kartı ref | Direkt |
| ITEMCODE | logo_itemcode | Ürün kodu | Direkt |
| ITEMNAME | logo_itemname | Ürün adı | Direkt |
| LINETYPE | logo_linetype | Satır tipi | 0=Stok, 1=Hizmet, 2=Depozito, 3=Promosyon, 4=Açıklama |
| LINENO_ | logo_lineno | Satır numarası | Direkt |
| AMOUNT | logo_amount | Miktar | Değer / 1000000 |
| UNITCODE | logo_unitcode | Birim kodu | Direkt |
| PRICE | logo_price | Birim fiyat | Değer / 1000000 |
| TOTAL | logo_total | Satır tutarı | Değer / 1000000 |
| VATRATE | logo_vatrate | KDV oranı | % cinsinden |
| VATAMNT | logo_vatamnt | KDV tutarı | Değer / 1000000 |
| DISCPER | logo_discper | İskonto % 1 | % cinsinden |
| DISC2PER | logo_disc2per | İskonto % 2 | % cinsinden |
| LINEEXP | logo_lineexp | Satır açıklaması | Direkt |

## Logo'dan Veri Çekme SQL Örnekleri

### 1. Ana Fatura Listesi

```sql
-- Logo veritabanından fatura listesi çekme
-- Firma numarasını (XXX) kendi firma numaranızla değiştirin
SELECT
    LOGICALREF,
    FICHENO,
    TRCODE,
    DATE_,
    TIME_,
    NETTOTAL,
    GROSSTOTAL,
    TOTVATAMNT,
    DISTDISC,
    REPORTRATE,
    TRCURR,
    CLIENTREF,
    CLIENTCODE,
    DEFINITION_,
    TAXOFFICE,
    TAXNR,
    GENEXP1,
    GENEXP2,
    GENEXP3,
    GENEXP4,
    SALESMANREF,
    DOCODE,
    SHIPINFOREF,
    PROJECTREF,
    CANCELLED,
    PRINTCNT
FROM LG_XXX_01_INVOICE
WHERE TRCODE IN (1, 2)  -- 1=Satış Faturası, 2=Satış İade Faturası
  AND CANCELLED = 0      -- İptal edilmemiş
  AND DATE_ >= 20240101  -- 2024 başından itibaren
ORDER BY DATE_ DESC, LOGICALREF DESC;
```

### 2. Fatura Satırları

```sql
-- Belirli bir faturanın satırlarını çekme
SELECT
    LOGICALREF,
    INVOICEREF,
    STOCKREF,
    ITEMCODE,
    ITEMNAME,
    LINETYPE,
    LINENO_,
    TRCODE,
    AMOUNT,
    UNITCONVFACT,
    UNITCODE,
    PRICE,
    TOTAL,
    DISTDISC,
    DISCPER,
    DISC2PER,
    DISC3PER,
    VATINC,
    VATRATE,
    VATAMNT,
    LINENET,
    LINEEXP,
    LINEEXP2,
    CANCELLED
FROM LG_XXX_01_STLINE
WHERE INVOICEREF = @INVOICE_LOGICALREF
  AND CANCELLED = 0
ORDER BY LINENO_;
```

### 3. Cari Hesap Bilgileri

```sql
-- Faturalardaki cari hesapların detaylı bilgileri
SELECT
    LOGICALREF,
    CODE,
    DEFINITION_,
    ADDR1,
    ADDR2,
    CITY,
    TOWN,
    COUNTRY,
    POSTCODE,
    TELNRS1,
    EMAILADDR,
    TAXOFFICE,
    TAXNR
FROM LG_XXX_CLCARD
WHERE LOGICALREF IN (
    SELECT DISTINCT CLIENTREF
    FROM LG_XXX_01_INVOICE
    WHERE TRCODE IN (1, 2) AND CANCELLED = 0
);
```

## Artisan Command Kullanımı

### Temel Senkronizasyon

```bash
# Tüm faturaları senkronize et
php artisan logo:sync-invoices

# Belirli tarih aralığını senkronize et
php artisan logo:sync-invoices --date-from=2024-01-01 --date-to=2024-12-31

# Belirli bir faturayı senkronize et
php artisan logo:sync-invoices --invoice-id=12345

# Sınırlı sayıda fatura senkronize et
php artisan logo:sync-invoices --limit=100

# Dry run (değişiklik yapmadan test et)
php artisan logo:sync-invoices --dry-run --date-from=2024-01-01
```

## Veri Dönüşüm Fonksiyonları

### Logo Tutarlarını Dönüştürme

Logo, parasal değerleri çarpanlarla saklar:
- NETTOTAL, GROSSTOTAL, TOTVATAMNT: **100** ile çarpılmış (örn: 12345 = 123.45 TL)
- AMOUNT, PRICE: **1000000** ile çarpılmış (örn: 5000000 = 5.00)
- REPORTRATE: **10000** ile çarpılmış (örn: 85000 = 8.50)

```php
// PHP dönüşüm örnekleri
$netTotal = $logoNettotal / 100;
$quantity = $logoAmount / 1000000;
$unitPrice = $logoPrice / 1000000;
$exchangeRate = $logoReportrate / 10000;
```

### Logo Tarih Dönüşümü

```php
// Logo DATE_ formatı: YYYYMMDD (integer)
// Örnek: 20240315 = 15 Mart 2024
$date = Carbon::createFromFormat('Ymd', (string)$logoDate);

// Logo TIME_ formatı: HHMMSS (integer)
// Örnek: 143000 = 14:30:00
$time = Carbon::createFromFormat('His', str_pad((string)$logoTime, 6, '0', STR_PAD_LEFT));
```

### Para Birimi Kodları

```php
$currencyMap = [
    0 => 'TRY',   // Türk Lirası
    1 => 'USD',   // ABD Doları
    2 => 'DEM',   // Alman Markı (eski)
    3 => 'CHF',   // İsviçre Frangı
    4 => 'FRF',   // Fransız Frangı (eski)
    5 => 'ITL',   // İtalyan Lireti (eski)
    6 => 'NLG',   // Hollanda Guldeni (eski)
    7 => 'BEF',   // Belçika Frangı (eski)
    8 => 'ATS',   // Avusturya Şilini (eski)
    9 => 'ESP',   // İspanyol Pezetası (eski)
    10 => 'GRD',  // Yunan Drahmisi (eski)
    11 => 'GBP',  // İngiliz Sterlini
    17 => 'JPY',  // Japon Yeni
    20 => 'EUR',  // Euro
    30 => 'RUB',  // Rus Rublesi
    160 => 'GBP', // İngiliz Sterlini (alternatif)
];
```

### İşlem Kodları (TRCODE)

```php
$transactionTypes = [
    // Satış İşlemleri
    1 => 'sales',              // Satış Faturası
    2 => 'sales_return',       // Satış İade Faturası
    3 => 'purchase',           // Alış Faturası
    4 => 'purchase_return',    // Alış İade Faturası
    6 => 'retail_sales',       // Perakende Satış Faturası
    7 => 'proforma',           // Proforma Fatura
    8 => 'retail_return',      // Perakende Satış İade Faturası
    9 => 'vat_statement',      // KDV İadesi Faturası
    10 => 'consignment_in',    // Konsinye Giriş Faturası
    11 => 'consignment_out',   // Konsinye Çıkış Faturası
];
```

### Satır Tipleri (LINETYPE)

```php
$lineTypes = [
    0 => 'product',     // Normal Stok Kalemi
    1 => 'service',     // Hizmet Kalemi
    2 => 'deposit',     // Depozito/Emtia
    3 => 'promotion',   // Promosyon/Hediye
    4 => 'description', // Açıklama Satırı
    5 => 'subtotal',    // Ara Toplam
    6 => 'discount',    // İndirim Satırı
    7 => 'increase',    // Artırım Satırı
];
```

## Model İlişkileri

```php
// Invoice Model
$invoice->currentAccount;    // CurrentAccount
$invoice->salesOrder;        // SalesOrder
$invoice->deliveryAddress;   // CurrentAccountDeliveryAddress
$invoice->items;             // InvoiceItem[] collection

// InvoiceItem Model
$invoiceItem->invoice;       // Invoice
$invoiceItem->product;       // Product
$invoiceItem->warehouse;     // Warehouse
```

## Senkronizasyon Stratejisi

### 1. İlk Kurulum (Toplu Aktarım)

```bash
# Son 1 yılın faturalarını aktar
php artisan logo:sync-invoices --date-from=2024-01-01

# Veya belirli dönemleri parçalı olarak aktar
php artisan logo:sync-invoices --date-from=2024-01-01 --date-to=2024-03-31
php artisan logo:sync-invoices --date-from=2024-04-01 --date-to=2024-06-30
php artisan logo:sync-invoices --date-from=2024-07-01 --date-to=2024-09-30
php artisan logo:sync-invoices --date-from=2024-10-01 --date-to=2024-12-31
```

### 2. Günlük Senkronizasyon

Cron job ekleyin (`app/Console/Kernel.php`):

```php
protected function schedule(Schedule $schedule)
{
    // Her gün gece yarısı son 7 günün faturalarını senkronize et
    $schedule->command('logo:sync-invoices --date-from=' . now()->subDays(7)->format('Y-m-d'))
        ->dailyAt('00:30')
        ->withoutOverlapping()
        ->onOneServer();
}
```

### 3. Anlık Senkronizasyon

Belirli bir faturayı anlık olarak çekmek için:

```bash
php artisan logo:sync-invoices --invoice-id=123456
```

## Hata Yönetimi

Senkronizasyon hataları `sync_errors` alanında JSON formatında saklanır:

```json
{
    "error_type": "missing_current_account",
    "message": "Current account not found for code: 120.01.001",
    "timestamp": "2024-10-06 18:30:00",
    "logo_data": {
        "CLIENTREF": 12345,
        "CLIENTCODE": "120.01.001"
    }
}
```

## Performans İpuçları

1. **Index Kullanımı**: Logo'da LOGICALREF, DATE_, CLIENTREF gibi alanlarda index olduğundan emin olun
2. **Batch Processing**: Büyük veri setleri için `chunk()` kullanın
3. **Transaction**: Her fatura ve kalemleri bir transaction içinde işleyin
4. **Logging**: Hataları mutlaka loglayın
5. **Memory**: Büyük senkronizasyonlarda memory limit'i artırın

```php
ini_set('memory_limit', '512M');
set_time_limit(300); // 5 dakika
```

## Önemli Notlar

⚠️ **DİKKAT EDİLMESİ GEREKENLER:**

1. Logo veritabanına **READ-ONLY** bağlantı kullanın
2. Logo'nun **firma numarasını** (XXX) doğru ayarlayın
3. **LOGICALREF** alanı Logo'da otomatik artan bir ID'dir ve benzersizdir
4. Logo **decimal değerleri integer** olarak saklar, dönüşüm yapmanız gerekir
5. **CANCELLED = 1** olan kayıtlar iptal edilmiştir, atlamayı unutmayın
6. **TRCODE** değerlerine göre fatura türünü belirleyin
7. Para birimi dönüşümleri için **REPORTRATE** kullanın
8. **Veritabanı bağlantısını** `config/database.php` dosyasında yapılandırın

## Örnek Logo Database Bağlantısı

`config/database.php`:

```php
'connections' => [
    'logo' => [
        'driver' => 'sqlsrv', // veya 'mysql' Logo'nun kurulu olduğu DB'ye göre
        'host' => env('LOGO_DB_HOST', 'localhost'),
        'port' => env('LOGO_DB_PORT', '1433'),
        'database' => env('LOGO_DB_DATABASE', 'TIGERDB'),
        'username' => env('LOGO_DB_USERNAME', 'sa'),
        'password' => env('LOGO_DB_PASSWORD', ''),
        'charset' => 'utf8',
        'prefix' => '',
        'options' => [
            PDO::ATTR_TIMEOUT => 30,
        ],
    ],
],
```

`.env`:

```env
LOGO_DB_HOST=192.168.1.100
LOGO_DB_PORT=1433
LOGO_DB_DATABASE=TIGERDB
LOGO_DB_USERNAME=logo_readonly
LOGO_DB_PASSWORD=SecurePassword123
LOGO_FIRM_NO=001
```

## Destek ve Yardım

Sorun yaşarsanız:
1. Logo veritabanı bağlantısını test edin
2. Tablo isimlerinin doğru olduğundan emin olun (firma numarası)
3. Log dosyalarını kontrol edin: `storage/logs/laravel.log`
4. Dry-run modu ile test edin: `--dry-run`

---

**Son Güncelleme:** 6 Ekim 2025
**Versiyon:** 1.0
