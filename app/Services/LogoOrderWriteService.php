<?php

namespace App\Services;

use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Models\Product;
use App\Models\CurrentAccount;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

class LogoOrderWriteService
{
    protected LogoService $logoService;
    protected string $connection = 'logo';

    // Logo siparis tipleri (TRCODE)
    const TRCODE_SALES_ORDER = 1;        // Satis siparisi
    const TRCODE_PURCHASE_ORDER = 2;     // Satin alma siparisi

    // Logo durum kodlari
    const STATUS_OPEN = 0;               // Acik
    const STATUS_CLOSED = 1;             // Kapali
    const STATUS_APPROVED = 2;           // Onaylandi

    // Logo para birimi kodlari
    protected array $currencyMap = [
        'TRY' => 0,
        'USD' => 1,
        'EUR' => 20,
        'GBP' => 4,
    ];

    public function __construct(LogoService $logoService)
    {
        $this->logoService = $logoService;
    }

    /**
     * Siparisi Logo'ya yaz veya guncelle
     */
    public function syncOrderToLogo(SalesOrder $order, ?int $firmNo = null): array
    {
        $firmNo = $firmNo ?? LogoService::getDefaultFirmNo();

        try {
            Log::info("Syncing order {$order->order_number} to Logo", [
                'order_id' => $order->id,
                'firm_no' => $firmNo,
            ]);

            // Musteri Logo ID kontrolu
            $customer = $order->customer;
            if (!$customer || !$customer->logo_id) {
                return [
                    'success' => false,
                    'error' => 'Musteri Logo ID bulunamadi. Once musteriyi Logo ile senkronize edin.',
                ];
            }

            // Siparis kalemlerini kontrol et (relationship cache'e de yukle)
            $items = $order->items()->with(['product.baseUnit', 'unit'])->get();
            $order->setRelation('items', $items);
            if ($items->isEmpty()) {
                return [
                    'success' => false,
                    'error' => 'Sipariste urun kalemi yok.',
                ];
            }

            // Tum urunlerin Logo ID'si var mi kontrol et
            foreach ($items as $item) {
                if (!$item->product || !$item->product->logo_id) {
                    return [
                        'success' => false,
                        'error' => "Urun '{$item->product_name}' Logo ID'si bulunamadi. Once urunleri Logo ile senkronize edin.",
                    ];
                }
            }

            // Tablo isimlerini bul
            $headerTable = $this->findOrderHeaderTable($firmNo);
            $lineTable = $this->findOrderLineTable($firmNo);

            Log::info("Logo table search result", [
                'firm_no' => $firmNo,
                'header_table' => $headerTable,
                'line_table' => $lineTable,
            ]);

            if (!$headerTable || !$lineTable) {
                return [
                    'success' => false,
                    'error' => "Logo siparis tablolari bulunamadi. Firm: {$firmNo}, Header: {$headerTable}, Line: {$lineTable}",
                ];
            }

            DB::connection($this->connection)->beginTransaction();

            try {
                // Mevcut siparis var mi kontrol et
                if ($order->logo_id) {
                    // Guncelleme
                    $result = $this->updateLogoOrder($order, $items, $headerTable, $lineTable, $firmNo);
                } else {
                    // Yeni siparis olustur
                    $result = $this->createLogoOrder($order, $items, $headerTable, $lineTable, $firmNo);
                }

                if (!$result['success']) {
                    DB::connection($this->connection)->rollBack();
                    return $result;
                }

                DB::connection($this->connection)->commit();

                // Yerel kaydi guncelle
                $order->update([
                    'logo_id' => $result['logo_id'],
                    'logo_firm_no' => $firmNo,
                    'logo_ficheno' => $result['ficheno'] ?? $order->logo_ficheno,
                    'logo_synced_at' => now(),
                ]);

                // Siparis kalemlerini guncelle
                foreach ($result['line_ids'] as $localItemId => $logoLineId) {
                    SalesOrderItem::where('id', $localItemId)->update([
                        'logo_id' => $logoLineId,
                        'logo_firm_no' => $firmNo,
                        'logo_order_ref' => $result['logo_id'],
                        'logo_synced_at' => now(),
                    ]);
                }

                Log::info("Order synced to Logo successfully", [
                    'order_id' => $order->id,
                    'logo_id' => $result['logo_id'],
                ]);

                return [
                    'success' => true,
                    'logo_id' => $result['logo_id'],
                    'message' => 'Siparis Logo\'ya basariyla aktarildi.',
                ];

            } catch (Exception $e) {
                DB::connection($this->connection)->rollBack();
                throw $e;
            }

        } catch (Exception $e) {
            Log::error("Error syncing order to Logo: " . $e->getMessage(), [
                'order_id' => $order->id,
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Yeni siparis olustur
     */
    protected function createLogoOrder(SalesOrder $order, $items, string $headerTable, string $lineTable, int $firmNo): array
    {
        Log::info("Creating Logo order", ['header_table' => $headerTable, 'line_table' => $lineTable, 'firm_no' => $firmNo]);

        // Siparis numarasi olustur
        $ficheno = $this->generateLogoOrderNumber($headerTable, $firmNo);

        // Yeni LOGICALREF al
        $newHeaderRef = $this->getNextLogicalRef($headerTable);

        // Header kaydi olustur
        $headerData = $this->mapOrderToLogoHeader($order, $newHeaderRef, $ficheno, $firmNo);

        // Insert with IDENTITY_INSERT in same batch
        $this->insertWithIdentity($headerTable, $headerData);

        // Satir kayitlari olustur
        $lineIds = [];
        $lineNo = 0;

        foreach ($items as $item) {
            $lineNo++;
            $newLineRef = $this->getNextLogicalRef($lineTable);

            $lineData = $this->mapItemToLogoLine($item, $newLineRef, $newHeaderRef, $lineNo, $firmNo, $order->customer->logo_id);

            $this->insertWithIdentity($lineTable, $lineData);

            $lineIds[$item->id] = $newLineRef;
        }

        return [
            'success' => true,
            'logo_id' => $newHeaderRef,
            'ficheno' => $ficheno,
            'line_ids' => $lineIds,
        ];
    }

    /**
     * Insert with IDENTITY_INSERT ON in same batch
     */
    protected function insertWithIdentity(string $table, array $data): void
    {
        $columns = array_keys($data);
        $columnsStr = '[' . implode('], [', $columns) . ']';

        $placeholders = [];
        $bindings = [];
        foreach ($data as $key => $value) {
            if ($value === null) {
                $placeholders[] = 'NULL';
            } else {
                $placeholders[] = '?';
                $bindings[] = $value;
            }
        }
        $valuesStr = implode(', ', $placeholders);

        $sql = "SET IDENTITY_INSERT [{$table}] ON; " .
               "INSERT INTO [{$table}] ({$columnsStr}) VALUES ({$valuesStr}); " .
               "SET IDENTITY_INSERT [{$table}] OFF;";

        DB::connection($this->connection)->statement($sql, $bindings);
    }

    /**
     * Mevcut siparisi guncelle
     */
    protected function updateLogoOrder(SalesOrder $order, $items, string $headerTable, string $lineTable, int $firmNo): array
    {
        $logoId = $order->logo_id;

        // Header guncelle
        $headerData = $this->mapOrderToLogoHeader($order, $logoId, null, $firmNo, true);
        unset($headerData['LOGICALREF']); // Primary key guncellenemez
        unset($headerData['FICHENO']);    // Fis numarasi degismez

        DB::connection($this->connection)
            ->table($headerTable)
            ->where('LOGICALREF', $logoId)
            ->update($headerData);

        // Mevcut satirlari sil ve yeniden olustur
        DB::connection($this->connection)
            ->table($lineTable)
            ->where('ORDFICHEREF', $logoId)
            ->delete();

        // Yeni satirlari ekle
        $lineIds = [];
        $lineNo = 0;

        foreach ($items as $item) {
            $lineNo++;
            $newLineRef = $this->getNextLogicalRef($lineTable);

            $lineData = $this->mapItemToLogoLine($item, $newLineRef, $logoId, $lineNo, $firmNo, $order->customer->logo_id);

            $this->insertWithIdentity($lineTable, $lineData);

            $lineIds[$item->id] = $newLineRef;
        }

        return [
            'success' => true,
            'logo_id' => $logoId,
            'line_ids' => $lineIds,
        ];
    }

    /**
     * Siparisi Logo header formatina donustur
     *
     * Logo ORFICHE alan aciklamalari (Logo native siparislerden dogrulanmistir):
     * - NETTOTAL: Net odenecek tutar = KDV DAHIL genel toplam (subtotal + VAT)
     * - TOTALDISCOUNTS: Toplam indirim tutari
     * - TOTALDISCOUNTED: Indirim sonrasi tutar, vergi oncesi (= GROSSTOTAL)
     * - TOTALVAT: Toplam KDV tutari
     * - GROSSTOTAL: Vergi oncesi brut tutar = KDV HARIC toplam (indirim sonrasi)
     * - REPORTNET: Rapor toplami = NETTOTAL (KDV dahil)
     * - TRNET: Islem toplami = NETTOTAL (KDV dahil)
     *
     * ERP'deki alanlar:
     * - subtotal: KDV haric toplam = GROSSTOTAL
     * - tax_amount: KDV tutari = TOTALVAT
     * - discount_amount: Indirim tutari = TOTALDISCOUNTS
     * - total_amount: KDV dahil toplam = NETTOTAL
     */
    protected function mapOrderToLogoHeader(SalesOrder $order, int $logicalRef, ?string $ficheno, int $firmNo, bool $isUpdate = false): array
    {
        $customer = $order->customer;
        $currencyCode = $this->currencyMap[$order->currency] ?? 0;

        // Kalem bazli tutar hesaplamalari (siparis header degerlerine guvenme)
        $order->loadMissing('items');
        $calcSubtotal = 0;  // Net toplam (KDV haric)
        $calcTaxAmount = 0; // KDV tutari
        $calcDiscountTotal = 0; // Toplam indirim

        foreach ($order->items as $item) {
            $qty = (float) ($item->quantity ?? 0);
            $price = (float) ($item->unit_price ?? 0);
            $discAmt = (float) ($item->discount_amount ?? 0);
            $taxRate = (float) ($item->tax_rate ?? 0);

            $lineGross = $qty * $price;
            $lineNet = $lineGross - $discAmt;       // Indirim sonrasi net tutar
            $lineTax = $lineNet * ($taxRate / 100);  // KDV tutari

            $calcSubtotal += $lineNet;
            $calcTaxAmount += $lineTax;
            $calcDiscountTotal += $discAmt;
        }

        $calcSubtotal = round($calcSubtotal, 2);
        $calcTaxAmount = round($calcTaxAmount, 2);
        $calcDiscountTotal = round($calcDiscountTotal, 2);

        $subtotal = $calcSubtotal;
        $discountAmount = $calcDiscountTotal;
        $taxAmount = $calcTaxAmount;
        $totalAmount = round($calcSubtotal + $calcTaxAmount, 2);

        Log::info('Logo header amounts calculated from items', [
            'order_id' => $order->id,
            'subtotal' => $subtotal,
            'discount' => $discountAmount,
            'tax' => $taxAmount,
            'total' => $totalAmount,
            'order_stored_total' => $order->total_amount,
        ]);

        // Satış temsilcisi referansı
        $salesmanRef = 0;
        if ($order->salesperson_id) {
            $salesmanRef = $order->salesperson_id;
        }

        // Musteri muhasebe hesap referansi (Logo EMUHACC baglantisi)
        $customerAccountRef = $this->getCustomerAccountRef($customer->logo_id, $firmNo);

        // CAPIBLOCK: Logo kullanıcı/tarih takip alanları
        $now = now();

        $data = [
            'LOGICALREF' => $logicalRef,
            'TRCODE' => self::TRCODE_SALES_ORDER,
            'FICHENO' => $ficheno ?? '',
            'DATE_' => $order->order_date->format('Y-m-d'),
            'TIME_' => (int) $now->format('His'),
            'CLIENTREF' => $customer->logo_id,
            'ACCOUNTREF' => $customerAccountRef,
            'RECVREF' => 0,
            'SOURCEINDEX' => 0,                  // Ambar (varsayilan)
            'SOURCECOSTGRP' => 0,
            'CENTERREF' => 0,
            'DOCODE' => '',                      // NULL degil bos string olmali (Siparis Cagirma filtresi)
            'SPECODE' => '',                     // NULL degil bos string olmali (Siparis Cagirma filtresi)
            'CYPHCODE' => '',                    // NULL degil bos string olmali
            'TRADINGGRP' => '',                  // NULL degil bos string olmali
            'BRANCH' => 0,                       // Sube
            'DEPARTMENT' => 0,                   // Bolum
            'GENEXP1' => mb_substr(trim(implode("\n", array_filter([
                $order->external_order_number ? 'Dış Sipariş No: ' . $order->external_order_number : '',
                $order->notes ?? '',
            ]))), 0, 50),
            'GENEXP2' => '',
            'GENEXP3' => '',
            'GENEXP4' => '',
            'GENEXP5' => '',
            'GENEXP6' => '',
            'NETTOTAL' => $totalAmount,          // KDV dahil genel toplam (Logo: net odenecek tutar)
            'TOTALDISCOUNTS' => 0,               // Iskonto birim fiyata yansitildi
            'TOTALDISCOUNTED' => $subtotal,      // KDV haric indirim sonrasi tutar (= GROSSTOTAL)
            'TOTALVAT' => $taxAmount,            // KDV tutari
            'GROSSTOTAL' => $subtotal,           // KDV haric brut tutar (Logo: vergi oncesi toplam)
            'REPORTNET' => $totalAmount,         // KDV dahil rapor toplami (= NETTOTAL)
            'REPORTRATE' => $order->exchange_rate ?? 1,
            'TRCURR' => $currencyCode,
            'TRRATE' => $currencyCode > 0 ? ($order->exchange_rate ?? 1) : 0.0,
            'STATUS' => 4,                       // 4 = Logo standart siparis durumu
            'CANCELLED' => $order->status === SalesOrder::STATUS_CANCELLED ? 1 : 0,
            'SALESMANREF' => $salesmanRef,
            'PAYDEFREF' => 0,
            'SHPTYPCOD' => '',
            'SHPAGNCOD' => '',
            'GENEXCTYP' => 2,                   // Logo varsayilan
            'LINEEXCTYP' => 0,
            'FACTORYNR' => 0,
            'RECSTATUS' => 1,                    // Aktif
            'ORGLOGICREF' => 0,
            'WFSTATUS' => 0,
            'WFLOWCRDREF' => 0,
            'ONLYONEPAYLINE' => 0,
            'APPROVE' => 0,                      // Logo standart: onaysiz
            'APPROVEDATE' => null,
            'CUSTORDNO' => $order->external_order_number ?? '',
            // NULL yerine 0 olmasi gereken alanlar
            'UPDCURR' => 0,
            'ADDDISCOUNTS' => 0.0,
            'ADDEXPENSES' => 0.0,
            'TOTALEXPENSES' => 0.0,
            'TOTALPROMOTIONS' => 0.0,
            'EXTENREF' => 0,
            'TEXTINC' => 0,
            'SITEID' => 0,
            'SHIPINFOREF' => 0,
            'SENDCNT' => 0,
            'DLVCLIENT' => 0,
            'OFFERREF' => 0,
            'OFFALTREF' => 0,
            'TYP' => 0,
            'ALTNR' => 0,
            'ADVANCEPAYM' => 0.0,
            'TRNET' => $totalAmount,             // Islem toplami (= NETTOTAL, KDV dahil)
            'PAYMENTTYPE' => 0,
            'OPSTAT' => 0,
            'WITHPAYTRANS' => 0,
            'PROJECTREF' => 0,
            'UPDTRCURR' => 0,
            'AFFECTCOLLATRL' => 0,
            'LASTREVISION' => 0,
            'CHECKAMOUNT' => 0,
            'SLSOPPRREF' => 0,
            'SLSACTREF' => 0,
            'SLSCUSTREF' => 0,
            'AFFECTRISK' => 1,
            'TOTALADDTAX' => 0.0,
            'TOTALEXADDTAX' => 0.0,
            'CHECKPRICE' => 0,
            'TRANSFERWITHPAY' => 0,
            'FCSTATUSREF' => 0,
            'CHECKTOTAL' => 0,
            'GUID' => strtoupper((string) \Illuminate\Support\Str::uuid()),
            'CANTCREDEDUCT' => 0,
            'DEDUCTIONPART1' => 2,
            'DEDUCTIONPART2' => 3,
            'DEFAULTFICHE' => 0,
            'LEASINGREF' => 0,
            'ADDEXPENSESVAT' => 0.0,
            'TOTALEXPENSESVAT' => 0.0,
            'DEVIR' => 0,
            'PRINTCNT' => 0,
            'PRINTDATE' => null,
            'EINVOICE' => 2,                    // 2 = e-İrsaliye (Sipariş Çağırma filtresi için gerekli)
            'EINVOICETYP' => 0,
            'PUBLICBNACCREF' => 0,
            'ACCEPTEINVPUBLIC' => 0,
            'INSTEADOFDESP' => 0,
            'TAXFREECHX' => 0,
            'ACTRENTING' => 0,
            'ADDDISCOUNTSVAT' => 0.0,
            'NOTIFYCRDREF' => 0,
            'PAYERTYPE' => 0,
            'PAYERMICRO' => 0,
            'CONTACTREF' => 0,
            'COMMITMENT' => 0,
            'CMBEGDATE' => null,
            'CMENDDATE' => null,
            'CMTYPE' => 0,
            'CMAMOUNT' => 0.0,
            'CMTOTAL' => 0.0,
            'CMSHIPPEDAMOUNT' => 0.0,
            'CMSHIPPEDTOTAL' => 0.0,
            'CMPAYMENTTOTAL' => 0.0,
            'CMPRICE' => 0.0,
            'CMPAIDTOTAL' => 0.0,
            'CMCANDEDUCT' => 0,
            'CMDEDUCTPART1' => 0,
            'CMDEDUCTPART2' => 0,
            'CMVAT' => 0.0,
            'CMDEVIRODEMEBAKIYE' => 0.0,
            // CAPIBLOCK: Oluşturma bilgileri
            'CAPIBLOCK_CREATEDBY' => 1,          // 1 = sistem kullanicisi
            'CAPIBLOCK_CREADEDDATE' => $now->format('Y-m-d H:i:s.v'),
            'CAPIBLOCK_CREATEDHOUR' => (int) $now->format('H'),
            'CAPIBLOCK_CREATEDMIN' => (int) $now->format('i'),
            'CAPIBLOCK_CREATEDSEC' => (int) $now->format('s'),
            'CAPIBLOCK_MODIFIEDBY' => 0,
            'CAPIBLOCK_MODIFIEDDATE' => null,
            'CAPIBLOCK_MODIFIEDHOUR' => 0,
            'CAPIBLOCK_MODIFIEDMIN' => 0,
            'CAPIBLOCK_MODIFIEDSEC' => 0,
        ];

        // Teslimat tarihi
        if ($order->delivery_date) {
            $data['POFFERBEGDT'] = $order->delivery_date->format('Y-m-d');
        }

        return $data;
    }

    /**
     * Siparis kalemini Logo line formatina donustur
     *
     * Logo ORFLINE alan aciklamalari:
     * - TOTAL: Brut tutar (miktar x birim fiyat, indirim oncesi)
     * - DISCPER: Indirim yuzdesi
     * - DISTDISC: Indirim tutari
     * - LINENET: Net tutar (indirim sonrasi, KDV HARIC)
     * - VAT: KDV orani (%)
     * - VATAMNT: KDV tutari
     * - VATMATRAH: KDV matrahi (LINENET ile ayni olmali)
     */
    protected function mapItemToLogoLine(SalesOrderItem $item, int $logicalRef, int $orderRef, int $lineNo, int $firmNo, int $clientRef = 0): array
    {
        $product = $item->product;

        // Hesaplamalar
        $quantity = (float) ($item->quantity ?? 0);
        $originalUnitPrice = (float) ($item->unit_price ?? 0);
        $discountAmount = (float) ($item->discount_amount ?? 0);
        $taxRate = (float) ($item->tax_rate ?? 0);

        // Iskontolu birim fiyat hesapla (3 kademeli iskonto sonrasi)
        $grossTotal = $quantity * $originalUnitPrice;
        $netTotal = $grossTotal - $discountAmount;               // Indirim sonrasi net tutar (KDV haric)

        // Iskontolu birim fiyat = net tutar / miktar
        $discountedUnitPrice = $quantity > 0 ? round($netTotal / $quantity, 6) : 0;
        $discountedTotal = round($quantity * $discountedUnitPrice, 2); // Yuvarlama tutarliligi icin

        // KDV hesapla
        $taxAmount = round($netTotal * ($taxRate / 100), 2);

        Log::info('Logo line item amounts', [
            'product_code' => $item->product_code,
            'original_price' => $originalUnitPrice,
            'discounted_price' => $discountedUnitPrice,
            'quantity' => $quantity,
            'net_total' => $netTotal,
            'tax_amount' => $taxAmount,
        ]);

        $dueDate = $item->requested_delivery_date
            ? date('Y-m-d', strtotime($item->requested_delivery_date))
            : now()->format('Y-m-d');

        // Birim referansini al - SalesOrderItem.unit_id -> Unit.logo_unit_ref
        $uomRef = 0;
        if ($item->unit_id && $item->unit) {
            $uomRef = $item->unit->logo_unit_ref ?? 0;
        } elseif ($product && $product->unit_id && $product->baseUnit) {
            // Fallback: Urun varsayilan birimi
            $uomRef = $product->baseUnit->logo_unit_ref ?? 0;
        }

        return [
            'LOGICALREF' => $logicalRef,
            'ORDFICHEREF' => $orderRef,
            'STOCKREF' => $product->logo_id,
            'LINENO_' => $lineNo,
            'TRCODE' => self::TRCODE_SALES_ORDER,
            'DATE_' => now()->format('Y-m-d'),
            'TIME_' => (int) now()->format('His'),
            'GUID' => strtoupper((string) \Illuminate\Support\Str::uuid()), // Siparis Cagirma icin zorunlu
            'GLOBTRANS' => 0,                    // Siparis Cagirma filtresi icin 0 olmali (NULL kabul edilmez)
            'CALCTYPE' => 0,
            'LINETYPE' => 0,                     // 0 = Normal satir
            'PREVLINEREF' => 0,
            'PREVLINENO' => 0,
            'DETLINE' => 0,
            'SOURCEINDEX' => 0,                  // Ambar
            'SOURCECOSTGRP' => 0,
            'AMOUNT' => $quantity,
            'PRICE' => $discountedUnitPrice,     // Iskontolu birim fiyat
            'TOTAL' => $discountedTotal,         // Miktar x iskontolu birim fiyat
            'DISCPER' => 0,                      // Iskonto fiyata yansitildi
            'DISTDISC' => 0,                     // Iskonto fiyata yansitildi
            'LINENET' => $discountedTotal,       // Net tutar (KDV haric) = TOTAL ile ayni
            'VAT' => $taxRate,
            'VATAMNT' => $taxAmount,
            'VATMATRAH' => $discountedTotal,     // KDV matrahi = Net tutar
            'LINEEXP' => $item->notes ?? '',
            'SPECODE' => '',                     // NULL degil bos string olmali (Siparis Cagirma filtresi)
            'DELVRYCODE' => '',                  // NULL degil bos string olmali
            'UOMREF' => $uomRef,                 // Birim referansi (UNITSETL.LOGICALREF)
            'CLIENTREF' => $clientRef,           // Musteri referansi (ORFICHE.CLIENTREF ile ayni)
            'ACCOUNTREF' => $this->getCustomerLineAccountRef($clientRef, $firmNo),
            'VATACCREF' => $this->getVatAccountRef($taxRate, $firmNo),
            'USREF' => 0,
            'STATUS' => 4,                       // 4 = Logo standart onaylı satır durumu
            'CLOSED' => 0,
            'CANCELLED' => 0,
            'DUEDATE' => $dueDate,
            'CPSTFLAG' => 0,
            'ORGLOGICREF' => 0,
            'BRANCH' => 0,
            'DEPARTMENT' => 0,
            'FACTORYNR' => 0,                    // Fabrika no (0 = varsayılan, firmNo değil)
            'RECSTATUS' => 1,
            'WFSTATUS' => 0,
            'SALESMANREF' => 0,
            // Sevk durumu için önemli alanlar
            'SHIPPEDAMOUNT' => 0.0,              // Sevk edilen miktar
            'DISTCOST' => 0.0,
            'DISTEXP' => 0.0,
            'DISTPROM' => 0.0,
            // Birim bilgileri
            'UINFO1' => 1.0,                     // Birim çevirimi
            'UINFO2' => 1.0,
            'UINFO3' => 0.0,
            'UINFO4' => 0.0,
            'UINFO5' => 0.0,
            'UINFO6' => 0.0,
            'UINFO7' => 0.0,
            'UINFO8' => 0.0,
            // Diğer zorunlu varsayılan değerler
            'VATINC' => 0,
            'DORESERVE' => 0,
            'INUSE' => 0,
            'PRCURR' => 0,
            'PRPRICE' => 0.0,
            'REPORTRATE' => 1.0,
            'BILLEDITEM' => 0,
            'PAYDEFREF' => 0,
            'EXTENREF' => 0,
            'DREF' => 0,
            'TRGFLAG' => 0,
            'SITEID' => 0,
            'NETDISCFLAG' => 0,
            'NETDISCPERC' => 0.0,
            'NETDISCAMNT' => 0.0,
            'CONDITIONREF' => 0,
            'DISTRESERVED' => 0.0,
            'ONVEHICLE' => 0.0,
            'AFFECTRISK' => 1,
            'ORGDUEDATE' => $dueDate,
            'ORGAMOUNT' => $quantity,
            'ORGPRICE' => $discountedUnitPrice,
            'SHIPPEDAMNTSUGG' => 0.0,
            'RESERVEAMOUNT' => 0.0,
            // Muhasebe merkezi ve promosyon referansları (NULL yerine 0 olmalı)
            'CENTERREF' => 0,
            'VATCENTERREF' => 0,
            'PRACCREF' => 0,
            'PRCENTERREF' => 0,
            'PRVATACCREF' => 0,
            'PRVATCENREF' => 0,
            'PROMREF' => 0,
            'TRCURR' => 0,
            'TRRATE' => 0.0,
            'PRCLISTREF' => 0,
            'ORGLOGOID' => '',
            'SPECODE2' => '',
            'GLOBALID' => '',
            'DEDUCTCODE' => '',
            'VATEXCEPTCODE' => '',
            'VATEXCEPTREASON' => '',
            'ATAXEXCEPTCODE' => '',
            'ATAXEXCEPTREASON' => '',
            'CPACODE' => '',
            'GTIPCODE' => '',
            'DRAFTSTOCKNAME' => '',
            'DRAFTSTOCKNAME2' => '',
            'DRAFTSTOCKNAME3' => '',
            'PURCHOFFCAPTION' => '',
            'CAMPAIGNREFS1' => 0,
            'CAMPAIGNREFS2' => 0,
            'CAMPAIGNREFS3' => 0,
            'CAMPAIGNREFS4' => 0,
            'CAMPAIGNREFS5' => 0,
            'POINTCAMPREF' => 0,
            'CAMPPOINT' => 0.0,
            'PROMCLASITEMREF' => 0,
            'REASONFORNOTSHP' => 0,
            'CMPGLINEREF' => 0,
            'PRRATE' => 0.0,
            'GROSSUINFO1' => 0.0,
            'GROSSUINFO2' => 0.0,
            'DEMPEGGEDAMNT' => 0.0,
            'TEXTINC' => 0,
            'OFFERREF' => 0,
            'ORDERPARAM' => 0,
            'ITEMASGREF' => 0,
            'EXIMAMOUNT' => 0.0,
            'OFFTRANSREF' => 0,
            'ORDEREDAMOUNT' => 0.0,
            'WITHPAYTRANS' => 0,
            'PROJECTREF' => 0,
            'POINTCAMPREFS1' => 0,
            'POINTCAMPREFS2' => 0,
            'POINTCAMPREFS3' => 0,
            'POINTCAMPREFS4' => 0,
            'CAMPPOINTS1' => 0.0,
            'CAMPPOINTS2' => 0.0,
            'CAMPPOINTS3' => 0.0,
            'CAMPPOINTS4' => 0.0,
            'CMPGLINEREFS1' => 0,
            'CMPGLINEREFS2' => 0,
            'CMPGLINEREFS3' => 0,
            'CMPGLINEREFS4' => 0,
            'AFFECTCOLLATRL' => 0,
            'FCTYP' => 0,
            'PURCHOFFNR' => 0,
            'DEMFICHEREF' => 0,
            'DEMTRANSREF' => 0,
            'ALTPROMFLAG' => 0,
            'VARIANTREF' => 0,
            'REFLVATACCREF' => 0,
            'REFLVATOTHACCREF' => 0,
            'PRIORITY' => 0,
            'BOMREF' => 0,
            'BOMREVREF' => 0,
            'ROUTINGREF' => 0,
            'OPERATIONREF' => 0,
            'WSREF' => 0,
            'ADDTAXRATE' => 0.0,
            'ADDTAXCONVFACT' => 0.0,
            'ADDTAXAMOUNT' => 0.0,
            'ADDTAXACCREF' => 0,
            'ADDTAXCENTERREF' => 0,
            'ADDTAXAMNTISUPD' => 0,
            'ADDTAXDISCAMOUNT' => 0.0,
            'EXADDTAXRATE' => 0.0,
            'EXADDTAXCONVF' => 0.0,
            'EXADDTAXAMNT' => 0.0,
            'EUVATSTATUS' => 0,
            'ADDTAXVATMATRAH' => 0.0,
            'CAMPPAYDEFREF' => 0,
            'RPRICE' => 0.0,
            'CANDEDUCT' => 0,
            'UNDERDEDUCTLIMIT' => 0,
            'DEDUCTIONPART1' => 0,
            'DEDUCTIONPART2' => 0,
            'PARENTLNREF' => 0,
            'DISTEXPVAT' => 0.0,
            'BOMTYPE' => 0,
            'DEVIR' => 0,
            'FAREGREF' => 0,
            'PUBLICCOUNTRYREF' => 0,
            'DISTDISCVAT' => 0.0,
            'ITMDISC' => 0,
            'ADDTAXREF' => 0,
            'ADDTAXEFFECTKDV' => 0,
            'ADDTAXINLINENET' => 0,
            'PARENTSTOCKREF' => 0,
        ];
    }

    /**
     * Musterinin Logo muhasebe hesap referansini (ACCOUNTREF) bul
     * ORFICHE.ACCOUNTREF icin: Ayni musterinin onceki siparislerinden ACCOUNTREF degerini al
     * Bulunamazsa ORFLINE.ACCOUNTREF'ten fallback uygula (Siparis Cagirma filtresi ACCOUNTREF>0 bekliyor)
     */
    protected function getCustomerAccountRef(int $clientRef, int $firmNo): int
    {
        try {
            $headerTable = $this->findOrderHeaderTable($firmNo);
            if (!$headerTable) return 0;

            $result = DB::connection($this->connection)->selectOne("
                SELECT TOP 1 ACCOUNTREF
                FROM [{$headerTable}]
                WHERE CLIENTREF = ? AND ACCOUNTREF > 0 AND TRCODE = 1
                ORDER BY LOGICALREF DESC
            ", [$clientRef]);

            if ($result) return (int) $result->ACCOUNTREF;

            // Fallback: ORFLINE.ACCOUNTREF'ten al (musterinin native siparisi olmayabilir)
            return $this->getCustomerLineAccountRef($clientRef, $firmNo);
        } catch (Exception $e) {
            Log::warning("Could not resolve customer ACCOUNTREF: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Musterinin Logo satir muhasebe hesap referansini (ORFLINE.ACCOUNTREF) bul
     * Musteri icin bulunamazsa, en cok kullanilan gelir hesabina (600.xx) fallback uygula
     */
    protected function getCustomerLineAccountRef(int $clientRef, int $firmNo): int
    {
        try {
            $headerTable = $this->findOrderHeaderTable($firmNo);
            $lineTable = $this->findOrderLineTable($firmNo);
            if (!$headerTable || !$lineTable) return 0;

            // Önce bu müşteriye özel önceki siparişlerden bul
            $result = DB::connection($this->connection)->selectOne("
                SELECT TOP 1 l.ACCOUNTREF
                FROM [{$lineTable}] l
                INNER JOIN [{$headerTable}] h ON l.ORDFICHEREF = h.LOGICALREF
                WHERE h.CLIENTREF = ? AND l.ACCOUNTREF > 0 AND h.TRCODE = 1
                ORDER BY h.LOGICALREF DESC
            ", [$clientRef]);

            if ($result) return (int) $result->ACCOUNTREF;

            // Fallback: Tüm satışlarda en çok kullanılan gelir hesabını al (600.xx Yurt İçi Satışlar)
            $fallback = DB::connection($this->connection)->selectOne("
                SELECT TOP 1 l.ACCOUNTREF, COUNT(*) as cnt
                FROM [{$lineTable}] l
                WHERE l.ACCOUNTREF > 0 AND l.TRCODE = 1
                GROUP BY l.ACCOUNTREF
                ORDER BY cnt DESC
            ");

            return $fallback ? (int) $fallback->ACCOUNTREF : 0;
        } catch (Exception $e) {
            Log::warning("Could not resolve customer line ACCOUNTREF: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * KDV oranina gore Logo muhasebe hesap referansini (VATACCREF) bul
     * Onceki siparislerden en sik kullanilan VATACCREF degerini al
     */
    protected function getVatAccountRef(float $vatRate, int $firmNo): int
    {
        try {
            $lineTable = $this->findOrderLineTable($firmNo);
            if (!$lineTable) return 0;

            $result = DB::connection($this->connection)->selectOne("
                SELECT TOP 1 VATACCREF, COUNT(*) as cnt
                FROM [{$lineTable}]
                WHERE VAT = ? AND VATACCREF > 0
                GROUP BY VATACCREF
                ORDER BY cnt DESC
            ", [$vatRate]);

            return $result ? (int) $result->VATACCREF : 0;
        } catch (Exception $e) {
            Log::warning("Could not resolve VATACCREF: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Siparisin Logo'da onayli olup olmayacagini belirle
     * Taslak disindaki tum durumlar onayli kabul edilir
     */
    protected function shouldBeApproved(string $status): bool
    {
        return $status !== SalesOrder::STATUS_DRAFT;
    }

    /**
     * ERP durumunu Logo durumuna cevir
     */
    protected function mapStatusToLogo(string $status): int
    {
        return match ($status) {
            SalesOrder::STATUS_DRAFT => self::STATUS_OPEN,
            SalesOrder::STATUS_CONFIRMED => self::STATUS_APPROVED,
            SalesOrder::STATUS_DELIVERED, SalesOrder::STATUS_CANCELLED => self::STATUS_CLOSED,
            default => self::STATUS_OPEN,
        };
    }

    /**
     * Sonraki LOGICALREF degerini al
     */
    protected function getNextLogicalRef(string $tableName): int
    {
        try {
            $max = DB::connection($this->connection)
                ->table($tableName)
                ->max('LOGICALREF');

            return ($max ?? 0) + 1;
        } catch (Exception $e) {
            Log::error("Error getting next LOGICALREF: " . $e->getMessage());
            return time(); // Fallback
        }
    }

    /**
     * Logo siparis numarasi olustur
     */
    protected function generateLogoOrderNumber(string $tableName, int $firmNo): string
    {
        try {
            $prefix = 'ERP';
            $year = date('y');

            // Mevcut en yuksek numarayi bul
            $lastOrder = DB::connection($this->connection)
                ->table($tableName)
                ->where('FICHENO', 'like', "{$prefix}{$year}%")
                ->orderBy('FICHENO', 'desc')
                ->first(['FICHENO']);

            if ($lastOrder && $lastOrder->FICHENO) {
                $lastNum = intval(substr($lastOrder->FICHENO, strlen($prefix) + 2));
                $newNum = $lastNum + 1;
            } else {
                $newNum = 1;
            }

            return $prefix . $year . str_pad($newNum, 6, '0', STR_PAD_LEFT);

        } catch (Exception $e) {
            Log::error("Error generating Logo order number: " . $e->getMessage());
            return 'ERP' . date('ymdHis');
        }
    }

    /**
     * Siparis header tablosunu bul
     */
    protected function findOrderHeaderTable(int $firmNo): ?string
    {
        $patterns = [
            'LG_%03d_ORFICHE',
            'LG_%03d_01_ORFICHE',
        ];

        foreach ($patterns as $pattern) {
            $tableName = sprintf($pattern, $firmNo);
            if ($this->tableExists($tableName)) {
                return $tableName;
            }
        }

        return null;
    }

    /**
     * Siparis line tablosunu bul
     */
    protected function findOrderLineTable(int $firmNo): ?string
    {
        $patterns = [
            'LG_%03d_ORFLINE',
            'LG_%03d_01_ORFLINE',
        ];

        foreach ($patterns as $pattern) {
            $tableName = sprintf($pattern, $firmNo);
            if ($this->tableExists($tableName)) {
                return $tableName;
            }
        }

        return null;
    }

    /**
     * Tablo var mi kontrol et
     */
    protected function tableExists(string $tableName): bool
    {
        try {
            $exists = DB::connection($this->connection)
                ->selectOne("
                    SELECT COUNT(*) as count
                    FROM INFORMATION_SCHEMA.TABLES
                    WHERE TABLE_NAME = ?
                ", [$tableName]);

            return $exists && $exists->count > 0;
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * Siparisi Logo'dan sil
     */
    public function deleteOrderFromLogo(SalesOrder $order, ?int $firmNo = null): array
    {
        $firmNo = $firmNo ?? LogoService::getDefaultFirmNo();

        try {
            if (!$order->logo_id) {
                return [
                    'success' => true,
                    'message' => 'Siparis zaten Logo\'da yok.',
                ];
            }

            $headerTable = $this->findOrderHeaderTable($firmNo);
            $lineTable = $this->findOrderLineTable($firmNo);

            if (!$headerTable || !$lineTable) {
                return [
                    'success' => false,
                    'error' => 'Logo siparis tablolari bulunamadi.',
                ];
            }

            DB::connection($this->connection)->beginTransaction();

            try {
                // Oncelikle satirlari sil
                DB::connection($this->connection)
                    ->table($lineTable)
                    ->where('ORDFICHEREF', $order->logo_id)
                    ->delete();

                // Sonra header'i sil
                DB::connection($this->connection)
                    ->table($headerTable)
                    ->where('LOGICALREF', $order->logo_id)
                    ->delete();

                DB::connection($this->connection)->commit();

                // Yerel kayitlari temizle
                $order->update([
                    'logo_id' => null,
                    'logo_synced_at' => null,
                ]);

                $order->items()->update([
                    'logo_id' => null,
                    'logo_order_ref' => null,
                    'logo_synced_at' => null,
                ]);

                return [
                    'success' => true,
                    'message' => 'Siparis Logo\'dan silindi.',
                ];

            } catch (Exception $e) {
                DB::connection($this->connection)->rollBack();
                throw $e;
            }

        } catch (Exception $e) {
            Log::error("Error deleting order from Logo: " . $e->getMessage());

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }
}
