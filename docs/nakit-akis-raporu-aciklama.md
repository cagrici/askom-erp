# Nakit Akis Raporu - Veri Kaynaklari ve Hesaplama Yontemleri

Bu belge, ASKOM ERP portalindaki **Nakit Akis Tablosu** sayfasinda gosterilen verilerin nereden geldigini ve nasil hesaplandigini aciklamaktadir.

---

## Genel Bakis

Nakit Akis Tablosu, Logo Tiger ERP veritabanindan canli olarak cekilmektedir. Veriler **10 dakikalik onbellek** ile saklanir; "Yenile" butonuna basildiginda guncel veri cekilir.

**Veri kaynagi:** Logo Tiger SQL Server veritabani (GO3DB)
**Firma numarasi:** 12
**Donem:** Cari muhasebe donemi (2026 yili, donem 01)

---

## 1. Banka Bakiyeleri

**Logo tablosu:** `LG_012_01_BNFLINE` (Banka hareket satirlari) + `LG_012_BNCARD` (Banka hesap kartlari)

**Nasil hesaplaniyor:**
- Logo'daki tum banka hareketleri okunur
- `SIGN = 0` olan satirlar **giris** (tahsilat, havale gelen vs.)
- `SIGN = 1` olan satirlar **cikis** (odeme, havale giden vs.)
- Her banka hesabi icin: **Bakiye = Toplam Giris - Toplam Cikis**
- Iptal edilmis islemler (`CANCELLED = 1`) hesaba katilmaz

**Tutarlar:**
- **Bakiye (TRY):** Tum tutarlar TRY (Turk Lirasi) cinsinden gosterilir. Doviz hesaplarindaki islemler, islem tarihindeki kurla TRY'ye cevrilmis haliyle Logo'da kayitlidir.
- **Doviz Bakiye:** Doviz hesaplari icin orijinal doviz cinsinden bakiye ayrica gosterilir (ornegin 955.183 USD, 742.130 EUR gibi).

**Not:** Logo'da EUR, "XEU" (European Currency Unit) olarak kayitlidir. Portalda bu otomatik olarak "EUR" seklinde duzeltilerek gosterilir.

---

## 2. Kasa Bakiyeleri

**Logo tablosu:** `LG_012_01_KSLINES` (Kasa hareket satirlari)

**Nasil hesaplaniyor:**
- Banka bakiyeleri ile ayni mantik: SIGN=0 giris, SIGN=1 cikis
- Doviz bazinda gruplanir (TRY, USD, EUR vb.)
- Bakiyesi sifir olan kasalar gosterilmez

---

## 3. Cari Alacaklar (Musteriler Bize Borclu)

**Logo tablolari:** `LG_012_01_CLFLINE` (Cari hareket satirlari) + `LG_012_CLCARD` (Cari hesap kartlari)

**Nasil hesaplaniyor:**
- Her cari hesap icin tum hareketler toplanir
- `SIGN = 0` = **Borc** (musterinin bize borcu, ornegin kestigimiz faturalar)
- `SIGN = 1` = **Alacak** (musteriden gelen odemeler, tahsilatlar)
- **Net Bakiye = Toplam Borc - Toplam Alacak**
- Net bakiyesi **pozitif** olan cariler = musteri bize borclu (alacagimiz var)
- **Devir kayitlari dahildir:** Donem basinda (01.01.2026) onceki yildan kalan bakiyeler Logo tarafindan otomatik olarak devir fisi ile aktarilmistir. Bu sayede bakiyeler yil basindaki acilis bakiyesini de icerir.

**Gosterim:**
- En yuksek bakiyeli 50 cari listelenir
- Toplam alacak TRY cinsinden gosterilir
- **Doviz kirilimi:** USD, EUR vb. doviz cinsinden alacak bakiyeleri ayrica gosterilir. Bu tutarlar islem tarihindeki kur uzerinden hesaplanmis TRY karsiliklaridir. Ayrica doviz cinsinden (ornegin 121.577 USD) bakiye de yer alir.

**Ornek:**
| Musteri | Borc (TRY) | Alacak (TRY) | Net Bakiye |
|---------|-----------|-------------|-----------|
| P127 - PORSER | 42.316.341 | 12.047.902 | 30.268.438 |

Bu demektir ki: P127'ye toplam 42,3M TL'lik fatura kesilmis, 12M TL tahsilat yapilmis, kalan 30,2M TL alacagimiz vardir.

---

## 4. Cari Borclar (Biz Borcluyuz)

Ayni tablo ve ayni hesaplama yontemi kullanilir. Tek fark: Net bakiyesi **negatif** olan cariler gosterilir. Negatif bakiye = biz borclu durumundayiz (ornegin tedarikci bize fatura kesmis, biz henuz odememisiz).

---

## 5. En Yuksek Bakiyeli Cariler (Top 30)

**Dikkat - "Hareketsiz" sutunu hakkinda:**

Bu bolumde yer alan **"Hareketsiz"** sutunu, ilgili cari hesapta **son islem tarihinden bu yana gecen gun sayisini** gosterir. Bu, gercek bir vade gecikme bilgisi **degildir**.

Ornegin:
- "4 gun" = bu carinin son islemi 4 gun once yapilmis (fatura, odeme vs.)
- "88 gun" = bu carinin 88 gundur hic islemi olmamis (muhtemelen sadece donem basi devir kaydi var)

Bu bilgi, hareketsiz carileri tespit etmek icin faydalidir, ancak vade gecikme analizi yerine gecmez.

---

## 6. Cek Portfoyu

**Logo tablosu:** `LG_012_01_CSCARD` (Cek/senet kartlari)

### Alinan Cekler (Portfoydeki)
- `CURRSTAT = 1` (Portfoyde) veya `CURRSTAT = 2` (Tahsile verildi) olan cekler
- Vade tarihine gore siralanir
- Vadeye kalan gun hesaplanir (negatif = vadesi gecmis)

### Verilen Cek/Senetler
- `CURRSTAT = 8` (Portfoyde) veya `CURRSTAT = 9` (Odemeye verildi) olan cek/senetler
- Ayni sekilde vade bilgisi gosterilir

---

## 7. Nakit Akis Zaman Cizelgesi

### Gecmis 6 Ay (Gerceklesen)
**Logo tablosu:** `LG_012_01_BNFLINE`

- Her ay icin banka giris ve cikis toplamlari
- Gercek banka hareketlerinden hesaplanir

### Cari Ay
- Ayin basindaki bu yana gerceklesen banka hareketleri

### Gelecek 6 Ay (Projeksiyon)
**Logo tablosu:** `LG_012_01_CSCARD`

- Portfoydeki ceklerin vade tarihlerine gore aylara dagilimi
- Alinan cekler = gelecek giris
- Verilen cek/senetler = gelecek cikis
- **Not:** Bu sadece cek/senete dayali bir projeksiyondur. Beklenen fatura tahsilatlari, maas odemeleri vb. dahil degildir.

---

## 8. Ozet Kartlar

| Kart | Hesaplama |
|------|----------|
| **Toplam Nakit** | Banka Bakiyesi + Kasa Bakiyesi (tum dovizler TRY'ye cevrilmis) |
| **Toplam Alacak** | Tum carilerin pozitif net bakiyelerinin toplami (TRY) |
| **Toplam Borc** | Tum carilerin negatif net bakiyelerinin mutlak deger toplami (TRY) |
| **Net Pozisyon** | Toplam Nakit + Toplam Alacak - Toplam Borc |
| **Alinan Cekler** | Portfoydeki alinan ceklerin toplam tutari |
| **Verilen Cek/Senet** | Portfoydeki verilen cek/senetlerin toplam tutari |

---

## 9. Doviz Bilgileri

Sistem asagidaki dovizleri destekler:
- **TRY** - Turk Lirasi (yerel para birimi)
- **USD** - Amerikan Dolari
- **EUR** - Euro (Logo'da "XEU" olarak kayitli, portalda "EUR" gosterilir)
- **KWD** - Kuveyt Dinari
- **NLG** - Hollanda Guldeni (eski donem kayitlari)

Tum ana tutarlar (bakiyeler, toplamlar) **TRY cinsinden** gosterilir. Doviz hesaplari ve dovizli cariler icin ayrica orijinal doviz cinsinden tutar gosterilir.

Doviz tutarlari, Logo'nun islem tarihinde kaydettigi kur uzerinden TRY'ye cevrilmistir. Guncel kurla degil, islem tarihindeki kurla hesaplanir.

---

## 10. Veri Guncelligi

- Veriler Logo Tiger'dan **canli** cekilir
- Sayfayi actiginizda en fazla 10 dakika onceki veri gosterilir
- "Yenile" butonuyla anlik veri cekilir
- Logo'da yapilan degisiklikler (yeni fatura, odeme vs.) bir sonraki sorguda yansir

---

## 11. Yetkilendirme

Bu sayfaya sadece asagidaki roller erisebilir:
- Yonetim
- Sirket Muduru (Company Manager)
- Super Admin

---

*Bu belge, ASKOM ERP gelistirme ekibi tarafindan muhasebe departmani icin hazirlanmistir.*
*Son guncelleme: 30 Mart 2026*
