# Logo Tiger ERP Senkronizasyon Rehberi

Bu belge, Logo Tiger ERP entegrasyonu için yapılan geliştirmeleri ve kullanım kılavuzunu içerir.

## 📋 İçindekiler

1. [Yeni Özellikler](#yeni-özellikler)
2. [Kurulum](#kurulum)
3. [Artisan Komutları](#artisan-komutları)
4. [Zamanlanmış Görevler](#zamanlanmış-görevler)
5. [Artımlı Senkronizasyon](#artımlı-senkronizasyon)
6. [Logo Tablo Yapıları](#logo-tablo-yapıları)

---

## 🆕 Yeni Özellikler

### 1. Ürün Resim Senkronizasyonu

**Dosyalar:**
- `app/Services/LogoProductImageSyncService.php`
- `app/Console/Commands/SyncLogoImages.php`

**Özellikler:**
- Logo FIRMDOC tablosundan ürün resimlerini çeker
- Binary image data'yı `storage/products/` klasörüne kaydeder
- Product model'ine `logo_image_synced_at` alanı ekler
- Artımlı sync desteği (LAESSION alanı ile)

**Kullanım:**
```bash
# Tam senkronizasyon
php artisan logo:sync-images --firm=1

# Artımlı senkronizasyon (sadece değişenler)
php artisan logo:sync-images --firm=1 --incremental

# İstatistikleri göster
php artisan logo:sync-images --stats
```

---

### 2. Stok/Envanter Senkronizasyonu

**Dosyalar:**
- `app/Services/LogoInventorySyncService.php`
- `app/Console/Commands/SyncLogoInventory.php`

**Özellikler:**
- Logo STLINE tablosundan stok verilerini çeker
- Depo (warehouse) bazında stok miktarlarını senkronize eder
- `quantity_on_hand`, `quantity_reserved`, `quantity_on_order` verilerini alır
- Otomatik depo oluşturma (Logo depo numarasına göre)
- InventoryItem ve InventoryStock modellerini günceller

**Kullanım:**
```bash
# Tam senkronizasyon
php artisan logo:sync-inventory --firm=1

# Artımlı senkronizasyon
php artisan logo:sync-inventory --firm=1 --incremental

# Sayfa limiti ile
php artisan logo:sync-inventory --firm=1 --limit=1000

# İstatistikleri göster
php artisan logo:sync-inventory --stats
```

---

### 3. Artımlı Senkronizasyon (Incremental Sync)

Tüm sync servisleri artık **artımlı senkronizasyon** destekliyor.

**Destekleyen Servisler:**
- ✅ `LogoProductSyncService` - Ürünler
- ✅ `LogoProductImageSyncService` - Ürün resimleri
- ✅ `LogoInventorySyncService` - Stok/envanter
- ✅ `LogoPriceSyncService` - Fiyatlar (zaten vardı)
- ✅ `LogoCurrentAccountSyncService` - Müşteriler/Tedarikçiler
- ✅ `LogoOrderSyncService` - Siparişler

**Nasıl Çalışır:**
- Logo'nun `LAESSION` (Last Session) alanını kullanır
- Son senkronizasyon zamanından sonra değiştirilen kayıtları çeker
- Performans için çok daha hızlıdır

**Kullanım:**
```bash
# Herhangi bir komuta --incremental flag ekleyin
php artisan logo:sync-products --firm=1 --incremental
php artisan logo:sync-current-accounts --firm=1 --incremental
php artisan logo:sync-orders --firm=11 --incremental
php artisan logo:sync-prices --firm=1 --incremental
```

---

## 🛠️ Kurulum

### 1. Migration'ı Çalıştırın

```bash
php artisan migrate
```

Bu migration `products` tablosuna `logo_image_synced_at` alanını ekler.

### 2. Storage Link Oluşturun

Ürün resimleri için storage link gereklidir:

```bash
php artisan storage:link
```

### 3. .env Dosyasını Kontrol Edin

Logo database bağlantısının yapılandırıldığından emin olun:

```env
LOGO_DB_HOST=your_logo_server.com
LOGO_DB_PORT=1433
LOGO_DB_DATABASE=LogoTigerDB
LOGO_DB_USERNAME=sa
LOGO_DB_PASSWORD=your_password
LOGO_DB_ENCRYPT=no
LOGO_DB_TRUST_SERVER_CERTIFICATE=true
```

### 4. Bağlantıyı Test Edin

```bash
php artisan logo:test-connection --show-config
```

---

## 📝 Artisan Komutları

### Mevcut Komutlar

| Komut | Açıklama | Incremental |
|-------|----------|-------------|
| `logo:sync-current-accounts` | Müşteri/Tedarikçi sync | ✅ |
| `logo:sync-products` | Ürün sync | ✅ |
| `logo:sync-images` | Ürün resim sync | ✅ (YENİ) |
| `logo:sync-orders` | Sipariş sync | ✅ |
| `logo:sync-prices` | Fiyat ve fiyat listesi sync | ✅ |
| `logo:sync-inventory` | Stok/envanter sync | ✅ (YENİ) |

### Ortak Parametreler

```bash
--firm=1              # Logo firma numarası (varsayılan: 1)
--limit=1000          # Kayıt limiti
--table=LG_001_ITEMS  # Manuel tablo adı (otomatik tespit edilir)
--incremental         # Artımlı sync (sadece değişenler)
--stats               # Sadece istatistikleri göster
```

### Kullanım Örnekleri

```bash
# İlk kurulumda tam sync
php artisan logo:sync-current-accounts --firm=1
php artisan logo:sync-products --firm=1
php artisan logo:sync-prices --firm=1
php artisan logo:sync-inventory --firm=1
php artisan logo:sync-orders --firm=11
php artisan logo:sync-images --firm=1

# Günlük kullanımda artımlı sync
php artisan logo:sync-products --firm=1 --incremental
php artisan logo:sync-inventory --firm=1 --incremental

# İstatistik kontrolü
php artisan logo:sync-products --stats
php artisan logo:sync-inventory --stats
```

---

## ⏰ Zamanlanmış Görevler

Tüm Logo senkronizasyonları `app/Console/Kernel.php` dosyasında otomatik olarak zamanlanmıştır.

### Senkronizasyon Takvimi

| Görev | Sıklık | Mod | Saat |
|-------|--------|-----|------|
| **Stok Sync** | Her saat | Artımlı | - |
| **Fiyat Sync** | Her 4 saat | Artımlı | - |
| **Sipariş Sync** | Her 30 dakika | Artımlı | - |
| **Ürün Sync** | Günlük | Tam | 02:00 |
| **Müşteri Sync** | Günlük | Tam | 01:00 |
| **Resim Sync** | Haftalık (Pazar) | Tam | 03:00 |

### Cron Job Konfigürasyonu

Laravel scheduler'ı çalıştırmak için sunucunuza şu cron job'u ekleyin:

```bash
* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
```

### Manuel Olarak Çalıştırma

Scheduler'ı test etmek için:

```bash
php artisan schedule:list          # Zamanlanmış görevleri listele
php artisan schedule:run            # Şu an çalışması gereken görevleri çalıştır
php artisan schedule:work           # Scheduler'ı sürekli çalıştır (development)
```

---

## 🔄 Artımlı Senkronizasyon

### Nasıl Çalışır?

1. **Logo LAESSION Alanı**: Logo'daki her tablo değiştiğinde `LAESSION` (Last Session) alanı güncellenir
2. **Son Sync Takibi**: Her model `logo_synced_at` alanı ile son sync zamanını tutar
3. **Filtreleme**: Artımlı sync sırasında sadece `LAESSION > last_sync_session` kayıtlar çekilir

### Avantajları

- ⚡ **Hızlı**: Sadece değişen kayıtları işler
- 💾 **Az kaynak kullanımı**: Daha az veritabanı yükü
- 🔁 **Sık çalıştırılabilir**: Her saat veya her 30 dakika

### Önemli Notlar

⚠️ **Şu anda session tracking tam olarak implemente edilmemiştir.**

Logo'nun `CAESSION` ve `LAESSION` alanlarını veritabanına kaydetmek için ek geliştirme gerekebilir. Şimdilik incremental flag varsa ama son session bilgisi yoksa, tam sync yapılır.

**Gelecek Geliştirme:**
- Her model için `logo_session` alanı eklenebilir
- Bu alan her sync'te Logo'dan gelen `LAESSION` değeri ile güncellenebilir
- Böylece gerçek artımlı sync sağlanabilir

---

## 📊 Logo Tablo Yapıları

### FIRMDOC - Ürün Resimleri

| Alan | Tip | Açıklama |
|------|-----|----------|
| `LOGICALREF` | int | Primary key |
| `MODULENR` | int | Modül no (4 = Ürünler) |
| `INFOREF` | int | Ürün referansı (ITEMS.LOGICALREF) |
| `DOCNR` | varchar | Dosya adı |
| `DOCPATH` | varchar | Dosya yolu |
| `ATTACHMENT` | varbinary | Binary resim verisi |
| `CAPTION` | varchar | Resim başlığı |
| `CAESSION` | int | Oluşturma session |
| `LAESSION` | int | Son değişiklik session |

### STLINE - Stok/Envanter

| Alan | Tip | Açıklama |
|------|-----|----------|
| `LOGICALREF` | int | Primary key |
| `STOCKREF` | int | Ürün referansı (ITEMS.LOGICALREF) |
| `INVENNO` | int | Depo numarası |
| `ONHAND` | decimal | Eldeki miktar |
| `RESERVED` | decimal | Rezerve miktar |
| `ONORDER` | decimal | Siparişte miktar |
| `LINETYPE` | int | Satır tipi |
| `CAESSION` | int | Oluşturma session |
| `LAESSION` | int | Son değişiklik session |

### ITEMS - Ürünler (Güncellenmiş)

Artık `CAESSION` ve `LAESSION` alanları da çekiliyor:

```php
'CAESSION as created_session',
'LAESSION as modified_session',
```

---

## 🎯 Kullanım Senaryoları

### Senaryo 1: İlk Kurulum (Full Sync)

```bash
# 1. Müşterileri çek
php artisan logo:sync-current-accounts --firm=1

# 2. Ürünleri çek
php artisan logo:sync-products --firm=1

# 3. Fiyatları çek
php artisan logo:sync-prices --firm=1

# 4. Stokları çek
php artisan logo:sync-inventory --firm=1

# 5. Siparişleri çek
php artisan logo:sync-orders --firm=11

# 6. Resimleri çek (opsiyonel, uzun sürebilir)
php artisan logo:sync-images --firm=1 --limit=100
```

### Senaryo 2: Günlük Güncelleme (Incremental)

Cron job otomatik çalışır, ancak manuel çalıştırmak isterseniz:

```bash
# Stokları güncelle (en önemli)
php artisan logo:sync-inventory --firm=1 --incremental

# Siparişleri güncelle
php artisan logo:sync-orders --firm=11 --incremental

# Fiyatları güncelle
php artisan logo:sync-prices --firm=1 --incremental
```

### Senaryo 3: Sorun Giderme

```bash
# Bağlantıyı test et
php artisan logo:test-connection

# Tabloları listele
php artisan logo:list-tables --filter=ITEMS

# Bir tablonun yapısını incele
php artisan logo:inspect-logo-table LG_001_ITEMS

# İstatistikleri kontrol et
php artisan logo:sync-products --stats
php artisan logo:sync-inventory --stats
```

---

## 🔍 Depo (Warehouse) Yapılandırması

Logo'dan gelen stok verileri için otomatik depo oluşturulur:

### Depo Adlandırma

- **Kod**: `LOGO-{firm_no}-{warehouse_number}`
  - Örnek: `LOGO-1-1`, `LOGO-1-2`
- **Ad**: `Logo Depo {warehouse_number}`
  - Örnek: "Logo Depo 1", "Logo Depo 2"

### Varsayılan Depo

- Logo'daki depo numarası `1` olan depo varsayılan (`is_default = true`) olarak işaretlenir

### Manuel Depo Eşleştirme

Eğer Logo depolarınızı mevcut depolarınızla eşleştirmek isterseniz:

1. Depoları manuel oluşturun
2. Kod alanına `LOGO-{firm}-{number}` formatında değer verin
3. Sync komutu bu depoları bulup kullanacaktır

---

## 📈 Performans İpuçları

### 1. Sayfalama (Pagination)

Tüm servisler 500'lük sayfalama kullanır. Büyük veri setleri için:

```bash
# İlk 1000 kaydı test edin
php artisan logo:sync-products --firm=1 --limit=1000

# Sorun yoksa tam sync yapın
php artisan logo:sync-products --firm=1
```

### 2. Arka Plan İşleme

Zamanlanmış görevler `runInBackground()` ile çalışır. Manuel çalıştırmada da arka planda çalıştırmak için:

```bash
# Linux/Mac
php artisan logo:sync-products --firm=1 > /dev/null 2>&1 &

# Windows (PowerShell)
Start-Process php -ArgumentList "artisan logo:sync-products --firm=1" -WindowStyle Hidden
```

### 3. Log Takibi

Sync işlemleri loglanır:

```bash
# Log dosyasını takip edin
tail -f storage/logs/laravel.log | grep Logo

# Hataları filtreleyin
grep "Logo.*error" storage/logs/laravel.log
```

---

## 🐛 Sorun Giderme

### Bağlantı Sorunları

```bash
# SQL Server bağlantısını test et
php artisan logo:test-connection --show-config

# Tablo listesini kontrol et
php artisan logo:list-tables
```

### Tablo Bulunamadı Hataları

Eğer "Table not found" hatası alıyorsanız:

```bash
# Mevcut tabloları listeleyin
php artisan logo:list-tables --filter=ITEMS

# Manuel tablo adı belirtin
php artisan logo:sync-products --firm=1 --table=LG_001_01_ITEMS
```

### Ürün/Müşteri Eşleşme Sorunları

Stok sync sırasında "Product not found" hatası:

1. Önce ürün sync'i çalıştırın:
   ```bash
   php artisan logo:sync-products --firm=1
   ```

2. Sonra stok sync'i çalıştırın:
   ```bash
   php artisan logo:sync-inventory --firm=1
   ```

### Session Tracking Sorunları

Artımlı sync düzgün çalışmıyorsa:

- Şu anda session tracking tam olarak implemente edilmemiştir
- `--incremental` flag'i kaldırarak tam sync yapın
- Veya geliştirme yaparak `LAESSION` değerlerini veritabanına kaydedin

---

## 📝 Gelecek Geliştirmeler

### Öncelikli

1. **Session Tracking**: `LAESSION` değerlerini veritabanına kaydetme
2. **Resim Optimizasyonu**: Büyük resimleri otomatik küçültme
3. **Webhook Desteği**: Logo'dan gerçek zamanlı değişiklik bildirimleri
4. **Conflict Resolution**: Çift yönlü sync için çakışma çözümü

### Orta Vadeli

1. **Fatura Sync**: Tam fatura ve fatura kalemleri senkronizasyonu
2. **Satın Alma Siparişleri**: POFICHE/POLINE tablolarından çekme
3. **Birim Dönüşümleri**: UNITSETL tablosundan birim setlerini çekme
4. **Kategori Sync**: Logo kategori yapısını local'e aktarma

### Uzun Vadeli

1. **API Katmanı**: REST API ile sync kontrolü
2. **Dashboard**: Sync durumu görselleştirme
3. **Bildirimler**: Sync hataları için email/Slack bildirimleri
4. **Audit Log**: Tüm değişikliklerin detaylı kaydı

---

## 📞 Destek

Sorularınız için:
- 📧 Email: support@example.com
- 📚 Dokümantasyon: [Logo API Docs](https://www.logo.com.tr/tiger)
- 🐛 Bug Report: GitHub Issues

---

**Son Güncelleme**: 2026-01-06
**Versiyon**: 2.0.0
**Geliştirici**: AI Assistant (Claude)
