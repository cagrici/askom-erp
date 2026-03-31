<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Satış Teklifi - {{ $offer->offer_no }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #333;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 15px;
        }

        /* Header Section */
        .header {
            display: table;
            width: 100%;
            margin-bottom: 15px;
            border-bottom: 2px solid #8B0000;
            padding-bottom: 10px;
        }

        .customer-section {
            display: table-cell;
            width: 55%;
            vertical-align: top;
        }

        .logo-section {
            display: table-cell;
            width: 45%;
            text-align: right;
            vertical-align: top;
        }

        .logo-text {
            font-size: 28px;
            font-weight: bold;
            color: #8B0000;
            margin-bottom: 3px;
            letter-spacing: 2px;
        }

        .logo-tagline {
            font-size: 9px;
            color: #666;
            font-style: italic;
            margin-bottom: 10px;
        }

        /* Customer Info Box */
        .customer-box {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-left: 4px solid #8B0000;
            padding: 10px;
            font-size: 10px;
        }

        .customer-box .row {
            margin-bottom: 4px;
        }

        .customer-box .label {
            display: inline-block;
            width: 110px;
            font-weight: bold;
            color: #495057;
        }

        .customer-box .value {
            color: #212529;
        }

        /* Document Info Box */
        .document-box {
            background: transparent;
            border: none;
            padding: 8px 12px;
            margin-top: 10px;
            font-size: 10px;
        }

        .document-box .row {
            margin-bottom: 3px;
        }

        .document-box .label {
            display: inline-block;
            width: 100px;
            font-weight: bold;
            color: #495057;
        }

        .document-box .value {
            color: #212529;
        }

        /* Status Badge */
        .status-badge {
            display: inline-block;
            padding: 3px 10px;
            background: #6b7280;
            color: white;
            border-radius: 3px;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .status-draft { background: #6b7280; }
        .status-sent { background: #3b82f6; }
        .status-approved { background: #10b981; }
        .status-rejected { background: #ef4444; }
        .status-expired { background: #f59e0b; }
        .status-converted_to_order { background: #059669; }

        /* Items Table */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            margin-top: 15px;
            background: white;
        }

        .items-table th,
        .items-table td {
            border: 1px solid #dee2e6;
            padding: 6px 5px;
            text-align: left;
        }

        .items-table th {
            background: #8B0000;
            color: white;
            font-weight: bold;
            font-size: 9px;
            text-transform: uppercase;
            text-align: center;
        }

        .items-table td {
            font-size: 9px;
            vertical-align: middle;
        }

        .items-table tbody tr:nth-child(even) {
            background: #f8f9fa;
        }

        .text-right {
            text-align: right !important;
        }

        .text-center {
            text-align: center !important;
        }

        .product-code {
            font-weight: bold;
            color: #495057;
        }

        .product-name {
            color: #212529;
        }

        .product-image {
            width: 40px;
            height: 40px;
            object-fit: cover;
            border-radius: 4px;
        }

        .no-image {
            width: 40px;
            height: 40px;
            background: #f0f0f0;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #999;
            font-size: 8px;
        }

        /* Totals Section */
        .totals-wrapper {
            display: table;
            width: 100%;
            margin-top: 10px;
        }

        .notes-column {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            padding-right: 15px;
        }

        .totals-column {
            display: table-cell;
            width: 50%;
            vertical-align: top;
        }

        .totals-table {
            width: 100%;
            border-collapse: collapse;
        }

        .totals-table tr td {
            padding: 5px 8px;
            border: 1px solid #dee2e6;
            font-size: 10px;
        }

        .totals-table .label-cell {
            background: #f8f9fa;
            font-weight: bold;
            color: #495057;
            width: 55%;
        }

        .totals-table .value-cell {
            text-align: right;
            font-weight: bold;
            color: #212529;
        }

        .totals-table tr.grand-total td {
            background: #8B0000;
            color: white;
            font-size: 12px;
            font-weight: bold;
        }

        .totals-table tr.discount-row .value-cell {
            color: #059669;
        }

        /* Notes Box */
        .notes-box {
            background: #fff3cd;
            border: 1px solid #ffc107;
            border-left: 4px solid #ffc107;
            padding: 10px;
            font-size: 10px;
        }

        .notes-box .title {
            font-weight: bold;
            color: #856404;
            margin-bottom: 5px;
        }

        /* Amount in Words */
        .amount-words {
            background: #e7f3ff;
            border: 1px solid #b8daff;
            padding: 8px 10px;
            margin: 15px 0;
            font-size: 10px;
        }

        .amount-words .label {
            font-weight: bold;
            color: #004085;
        }

        /* Validity Box */
        .validity-box {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            border-left: 4px solid #28a745;
            padding: 10px;
            margin: 15px 0;
            font-size: 10px;
        }

        .validity-box .title {
            font-weight: bold;
            color: #155724;
            margin-bottom: 5px;
        }

        /* Footer */
        .footer {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 2px solid #8B0000;
        }

        .footer-content {
            display: table;
            width: 100%;
        }

        .bank-info {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            font-size: 9px;
        }

        .contact-info {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            text-align: right;
            font-size: 9px;
        }

        .bank-info .title,
        .contact-info .title {
            font-weight: bold;
            color: #8B0000;
            margin-bottom: 5px;
            font-size: 10px;
        }

        .footer-note {
            text-align: center;
            margin-top: 15px;
            padding-top: 10px;
            border-top: 1px solid #dee2e6;
            color: #6b7280;
            font-size: 8px;
        }

        @media print {
            .container {
                max-width: none;
                margin: 0;
                padding: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="customer-section">
                <div class="customer-box">
                    @if($offer->entity)
                        <div class="row">
                            <span class="label">Cari Hesap Kodu:</span>
                            <span class="value">{{ $offer->entity->account_code ?? '-' }}</span>
                        </div>
                        <div class="row">
                            <span class="label">Cari Hesap Ünvanı:</span>
                            <span class="value">{{ $offer->entity->title ?? '-' }}</span>
                        </div>
                        <div class="row">
                            <span class="label">Cari Hesap Adresi:</span>
                            <span class="value">{{ $offer->entity->address ?? '-' }}</span>
                        </div>
                        @if($offer->entity->email)
                        <div class="row">
                            <span class="label">Mail Adresi:</span>
                            <span class="value">{{ $offer->entity->email }}</span>
                        </div>
                        @endif
                        @if($offer->entity->tax_office)
                        <div class="row">
                            <span class="label">Vergi Dairesi:</span>
                            <span class="value">{{ $offer->entity->tax_office }}</span>
                        </div>
                        @endif
                        @if($offer->entity->tax_number)
                        <div class="row">
                            <span class="label">V. Numarası:</span>
                            <span class="value">{{ $offer->entity->tax_number }}</span>
                        </div>
                        @endif
                        @if($offer->entity->phone_1)
                        <div class="row">
                            <span class="label">Telefon:</span>
                            <span class="value">{{ $offer->entity->phone_1 }}</span>
                        </div>
                        @endif
                    @else
                        <div class="row">
                            <span class="label">Müşteri Adı:</span>
                            <span class="value">{{ $offer->customer_name ?? '-' }}</span>
                        </div>
                        @if($offer->customer_phone)
                        <div class="row">
                            <span class="label">Telefon:</span>
                            <span class="value">{{ $offer->customer_phone }}</span>
                        </div>
                        @endif
                        @if($offer->customer_email)
                        <div class="row">
                            <span class="label">Email:</span>
                            <span class="value">{{ $offer->customer_email }}</span>
                        </div>
                        @endif
                        @if($offer->customer_address)
                        <div class="row">
                            <span class="label">Adres:</span>
                            <span class="value">{{ $offer->customer_address }}</span>
                        </div>
                        @endif
                    @endif
                </div>
            </div>
            <div class="logo-section">
                @php
                    $logoPath = public_path('images/logo-dark.png');
                    if (!file_exists($logoPath)) {
                        $logoPath = resource_path('images/logo-dark.png');
                    }
                    $logoBase64 = '';
                    if (file_exists($logoPath)) {
                        $logoBase64 = 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath));
                    }
                @endphp
                @if($logoBase64)
                    <img src="{{ $logoBase64 }}" alt="ASKOM Logo" style="max-width: 180px; max-height: 50px; margin-bottom: 8px;">
                @else
                    <div class="logo-text">ASKOM</div>
                    <div class="logo-tagline">OTEL - RESTAURANT CAFE EKİPMANLARI</div>
                @endif

                <div class="document-box">
                    <div class="row">
                        <span class="label">Teklif Tarihi:</span>
                        <span class="value">{{ \Carbon\Carbon::parse($offer->offer_date)->format('d.m.Y') }}</span>
                    </div>
                    <div class="row">
                        <span class="label">Teklif No:</span>
                        <span class="value">{{ $offer->offer_no }}</span>
                    </div>
                    @if($offer->convertedOrder?->logo_ficheno)
                    <div class="row">
                        <span class="label">Sipariş No:</span>
                        <span class="value">{{ $offer->convertedOrder->logo_ficheno }}</span>
                    </div>
                    @endif
                    <div class="row">
                        <span class="label">Geçerlilik:</span>
                        <span class="value">3 iş günü</span>
                    </div>
                    <div class="row">
                        <span class="label">Durum:</span>
                        <span class="status-badge status-{{ $offer->status }}">
                            @if($offer->status === 'draft') TASLAK
                            @elseif($offer->status === 'sent') GÖNDERİLDİ
                            @elseif($offer->status === 'approved') ONAYLANDI
                            @elseif($offer->status === 'rejected') REDDEDİLDİ
                            @elseif($offer->status === 'expired') SÜRESİ DOLDU
                            @elseif($offer->status === 'converted_to_order') SİPARİŞE ÇEVRİLDİ
                            @else {{ strtoupper($offer->status) }}
                            @endif
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Items Table -->
        <table class="items-table">
            <thead>
                <tr>
                    <th width="4%">S.N</th>
                    <th width="8%">RESİM</th>
                    <th width="12%">KODU</th>
                    <th width="42%">ÜRÜN TANIMI</th>
                    <th width="10%">MİKTAR</th>
                    <th width="12%">B.FİYAT</th>
                    <th width="12%">TUTARI</th>
                </tr>
            </thead>
            <tbody>
                @foreach($offer->items as $index => $item)
                    <tr>
                        <td class="text-center">{{ $index + 1 }}</td>
                        <td class="text-center">
                            @if($item->product && $item->product->images && $item->product->images->count() > 0)
                                @php
                                    $imagePath = public_path('storage/' . $item->product->images->first()->image_path);
                                    $imageBase64 = '';
                                    if (file_exists($imagePath)) {
                                        $imageBase64 = 'data:image/jpeg;base64,' . base64_encode(file_get_contents($imagePath));
                                    }
                                @endphp
                                @if($imageBase64)
                                    <img src="{{ $imageBase64 }}" class="product-image" alt="{{ $item->product_name }}">
                                @else
                                    <div class="no-image">-</div>
                                @endif
                            @else
                                <div class="no-image">-</div>
                            @endif
                        </td>
                        <td class="product-code">{{ $item->product->code ?? $item->product_code ?? '-' }}</td>
                        <td class="product-name">
                            {{ $item->product_name }}
                            @if($item->description)
                                <br><small style="color: #666;">{{ $item->description }}</small>
                            @endif
                        </td>
                        <td class="text-center">
                            {{ $item->quantity == intval($item->quantity) ? number_format($item->quantity, 0) : number_format($item->quantity, 2) }}
                            @if($item->unit)
                                <br><small>{{ $item->unit->symbol ?? $item->unit->name }}</small>
                            @endif
                        </td>
                        @php
                            // 3 kademeli iskonto hesabı
                            $qty = (float) $item->quantity;
                            $originalPrice = (float) $item->unit_price;
                            $d1 = (float) ($item->discount_rate1 ?? $item->discount_rate ?? 0);
                            $d2 = (float) ($item->discount_rate2 ?? 0);
                            $d3 = (float) ($item->discount_rate3 ?? 0);

                            // Kademeli iskonto uygula
                            $afterD1 = $originalPrice * (1 - $d1 / 100);
                            $afterD2 = $afterD1 * (1 - $d2 / 100);
                            $discountedUnitPrice = $afterD2 * (1 - $d3 / 100);

                            // Tutar = miktar × iskontolu birim fiyat (KDV hariç)
                            $lineTotal = $qty * $discountedUnitPrice;
                        @endphp
                        <td class="text-right">{{ number_format($discountedUnitPrice, 2) }}</td>
                        <td class="text-right">{{ number_format($lineTotal, 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <!-- Totals Section -->
        <div class="totals-wrapper">
            <div class="notes-column">
                @if($offer->notes)
                <div class="notes-box">
                    <div class="title">TEKLİF NOTLARI</div>
                    {{ $offer->notes }}
                </div>
                @endif

                <div class="validity-box" style="margin-top: 10px;">
                    <div class="title">GEÇERLİLİK SÜRESİ</div>
                    Bu teklif <strong>3 iş günü</strong> süresince geçerlidir.
                </div>
            </div>
            <div class="totals-column">
                @php
                    // Döviz kodunu bir kez hesapla
                    $currencySymbol = $offer->currency ? ($offer->currency->cur_symbol ?: $offer->currency->cur_code) : 'TL';

                    // Satır toplamlarından hesapla (3 kademeli iskonto uygulanmış)
                    $discountedSubtotal = $offer->items->sum(function($item) {
                        $qty = (float) $item->quantity;
                        $originalPrice = (float) $item->unit_price;
                        $d1 = (float) ($item->discount_rate1 ?? $item->discount_rate ?? 0);
                        $d2 = (float) ($item->discount_rate2 ?? 0);
                        $d3 = (float) ($item->discount_rate3 ?? 0);

                        $afterD1 = $originalPrice * (1 - $d1 / 100);
                        $afterD2 = $afterD1 * (1 - $d2 / 100);
                        $discountedUnitPrice = $afterD2 * (1 - $d3 / 100);

                        return $qty * $discountedUnitPrice;
                    });

                    // Genel iskonto
                    $generalDiscountRate = (float) ($offer->discount_rate ?? 0);
                    $generalDiscountAmount = $discountedSubtotal * ($generalDiscountRate / 100);
                    $afterGeneralDiscount = $discountedSubtotal - $generalDiscountAmount;

                    // KDV hesapla (her kalem için ayrı ayrı)
                    $calculatedTax = $offer->items->sum(function($item) use ($generalDiscountRate) {
                        $qty = (float) $item->quantity;
                        $originalPrice = (float) $item->unit_price;
                        $d1 = (float) ($item->discount_rate1 ?? $item->discount_rate ?? 0);
                        $d2 = (float) ($item->discount_rate2 ?? 0);
                        $d3 = (float) ($item->discount_rate3 ?? 0);
                        $taxRate = (float) ($item->tax_rate ?? 20);

                        $afterD1 = $originalPrice * (1 - $d1 / 100);
                        $afterD2 = $afterD1 * (1 - $d2 / 100);
                        $discountedUnitPrice = $afterD2 * (1 - $d3 / 100);
                        $lineTotal = $qty * $discountedUnitPrice;

                        // Genel iskonto da KDV matrahından düşülür
                        $afterGeneralDisc = $lineTotal * (1 - $generalDiscountRate / 100);

                        return $afterGeneralDisc * ($taxRate / 100);
                    });

                    // Genel toplam
                    $calculatedTotal = $afterGeneralDiscount + $calculatedTax;
                @endphp
                <table class="totals-table">
                    <tr>
                        <td class="label-cell">ARA TOPLAM:</td>
                        <td class="value-cell">{{ number_format($discountedSubtotal, 2) }} {{ $currencySymbol }}</td>
                    </tr>

                    @if($generalDiscountAmount > 0)
                    <tr class="discount-row">
                        <td class="label-cell">TEKLİF İNDİRİMİ ({{ number_format($generalDiscountRate, 1) }}%):</td>
                        <td class="value-cell">-{{ number_format($generalDiscountAmount, 2) }} {{ $currencySymbol }}</td>
                    </tr>
                    @endif

                    <tr>
                        <td class="label-cell">KDV'SİZ TOPLAM:</td>
                        <td class="value-cell">{{ number_format($afterGeneralDiscount, 2) }} {{ $currencySymbol }}</td>
                    </tr>

                    <tr>
                        <td class="label-cell">KDV TOPLAMI:</td>
                        <td class="value-cell">{{ number_format($calculatedTax, 2) }} {{ $currencySymbol }}</td>
                    </tr>

                    <tr class="grand-total">
                        <td class="label-cell">GENEL TOPLAM:</td>
                        <td class="value-cell">{{ number_format($calculatedTotal, 2) }} {{ $currencySymbol }}</td>
                    </tr>
                </table>
            </div>
        </div>

        <!-- Amount in Words -->
        @php
            $lira = floor($calculatedTotal);
            $kurus = round(($calculatedTotal - $lira) * 100);
            $amountText = number_format($lira, 0, ',', '.') . ' ' . $currencySymbol;
            if ($kurus > 0) {
                $amountText .= ' ' . $kurus . ' Kuruş';
            }
        @endphp
        <div class="amount-words">
            <span class="label">Yalnız:</span> {{ $amountText }}
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="footer-content">
                <div class="bank-info">
                    <div class="title">BANKA BİLGİLERİ</div>
                    <div><strong>FİRMA ÜNVANI:</strong> ASKOM OTEL RESTAURANT EKİPMANLARI SAN. TİC. LTD. ŞTİ.</div>
                    <div><strong>BANKA:</strong> GARANTİ BANKASI</div>
                    <div><strong>ŞUBE:</strong> BAKIRKÖY TİCARİ-1674</div>
                    <div><strong>IBAN:</strong> TR38 0006 2001 6740 0006 2978 31</div>
                    <div><strong>HESAP NO:</strong> 6297831</div>
                    <div style="margin-top: 5px;">
                        <strong>Not:</strong> Havale/EFT açıklamasına teklif numarasını yazınız.
                    </div>
                </div>
                <div class="contact-info">
                    <div class="title">İLETİŞİM BİLGİLERİ</div>
                    <div><strong>ASKOM OTEL RESTAURANT EKİPMANLARI</strong></div>
                    <div>SAN. TİC. LTD. ŞTİ.</div>
                    <div style="margin-top: 5px;">
                        <strong>Tel:</strong> {{ $offer->creator && $offer->creator->mobile_phone ? $offer->creator->mobile_phone : '+90 (212) 659 9233' }}
                    </div>
                    <div><strong>Email:</strong> {{ $offer->creator->email ?? 'info@askom.com.tr' }}</div>
                    <div><strong>Web:</strong> www.askom.com</div>
                    @if($offer->creator)
                    <div style="margin-top: 5px;">
                        <strong>Satış Temsilcisi:</strong> {{ $offer->creator->name }}
                    </div>
                    @endif
                </div>
            </div>

            <div class="footer-note">
                <p>Bu belge {{ \Carbon\Carbon::now()->format('d.m.Y H:i:s') }} tarihinde {{ config('app.name') }} ERP sistemi tarafından otomatik olarak oluşturulmuştur.</p>
                <p>Teklif No: {{ $offer->offer_no }}@if($offer->convertedOrder?->logo_ficheno) • Sipariş No: {{ $offer->convertedOrder->logo_ficheno }}@endif • Sayfa 1/1</p>
            </div>
        </div>
    </div>
</body>
</html>
