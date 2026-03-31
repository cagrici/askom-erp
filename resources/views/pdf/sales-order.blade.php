<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Satış Siparişi - {{ $salesOrder->order_number }}</title>
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
            width: 90px;
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
            background: #10b981;
            color: white;
            border-radius: 3px;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .status-draft { background: #6b7280; }
        .status-confirmed { background: #3b82f6; }
        .status-in-production { background: #f59e0b; }
        .status-ready-to-ship { background: #06b6d4; }
        .status-shipped { background: #10b981; }
        .status-delivered { background: #059669; }
        .status-cancelled { background: #ef4444; }
        .status-returned { background: #dc2626; }

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

        .shipping-info {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            text-align: right;
            font-size: 9px;
        }

        .bank-info .title,
        .shipping-info .title {
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
                    <div class="row">
                        <span class="label">Cari Hesap Kodu:</span>
                        <span class="value">{{ $salesOrder->customer?->account_code ?? '-' }}</span>
                    </div>
                    <div class="row">
                        <span class="label">Satış Temsilcisi:</span>
                        <span class="value">{{ $salesOrder->salesperson?->name ?? '-' }}</span>
                    </div>
                    <div class="row">
                        <span class="label">Cari Hesap Ünvanı:</span>
                        <span class="value">{{ $salesOrder->customer?->title ?? '-' }}</span>
                    </div>
                    <div class="row">
                        <span class="label">Cari Hesap Adresi:</span>
                        <span class="value">{{ $salesOrder->customer?->address ?? '-' }}</span>
                    </div>
                    @if($salesOrder->customer?->email)
                    <div class="row">
                        <span class="label">Mail Adresi:</span>
                        <span class="value">{{ $salesOrder->customer->email }}</span>
                    </div>
                    @endif
                    @if($salesOrder->customer?->tax_office)
                    <div class="row">
                        <span class="label">Vergi Dairesi:</span>
                        <span class="value">{{ $salesOrder->customer->tax_office }}</span>
                    </div>
                    @endif
                    @if($salesOrder->customer?->tax_number)
                    <div class="row">
                        <span class="label">V. Numarası:</span>
                        <span class="value">{{ $salesOrder->customer->tax_number }}</span>
                    </div>
                    @endif
                    @if($salesOrder->customer?->phone)
                    <div class="row">
                        <span class="label">Telefon:</span>
                        <span class="value">{{ $salesOrder->customer->phone }}</span>
                    </div>
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
                        <span class="label">Fiş Tarihi:</span>
                        <span class="value">{{ $salesOrder->order_date->format('d.m.Y') }}</span>
                    </div>
                    <div class="row">
                        <span class="label">Fiş No:</span>
                        <span class="value">{{ $salesOrder->order_number }}</span>
                    </div>
                    <div class="row">
                        <span class="label">Fiş Belge No:</span>
                        <span class="value">{{ $salesOrder->logo_ficheno ?? $salesOrder->reference_number ?? '-' }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Items Table -->
        <table class="items-table">
            <thead>
                <tr>
                    <th width="4%">S.N</th>
                    <th width="7%">RESİM</th>
                    <th width="8%">MİKTAR</th>
                    <th width="7%">BİRİMİ</th>
                    <th width="12%">KODU</th>
                    <th width="35%">ÜRÜN TANIMI</th>
                    <th width="12%">B.FİYAT</th>
                    <th width="15%">TUTARI</th>
                </tr>
            </thead>
            <tbody>
                @foreach($salesOrder->items as $index => $item)
                    @php
                        // Kademeli iskonto uygulayarak net birim fiyat hesapla
                        $d1 = (float) ($item->discount_rate1 ?? 0);
                        $d2 = (float) ($item->discount_rate2 ?? 0);
                        $d3 = (float) ($item->discount_rate3 ?? 0);
                        $discountedUnitPrice = $item->unit_price * (1 - $d1 / 100) * (1 - $d2 / 100) * (1 - $d3 / 100);
                    @endphp
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
                                    <img src="{{ $imageBase64 }}" class="product-image" alt="{{ $item->product->name }}">
                                @else
                                    <div class="no-image">-</div>
                                @endif
                            @else
                                <div class="no-image">-</div>
                            @endif
                        </td>
                        <td class="text-center">{{ $item->quantity == intval($item->quantity) ? number_format($item->quantity, 0) : number_format($item->quantity, 2) }}</td>
                        <td class="text-center">{{ $item->product->baseUnit?->symbol ?? 'AD' }}</td>
                        <td class="product-code">{{ $item->product->code }}</td>
                        <td class="product-name">
                            {{ $item->product->name }}
                            @if($item->notes)
                                <br><small style="color: #666;">{{ $item->notes }}</small>
                            @endif
                        </td>
                        <td class="text-right">{{ number_format($discountedUnitPrice, 2) }}</td>
                        <td class="text-right">{{ number_format($item->quantity * $discountedUnitPrice, 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <!-- Totals Section -->
        <div class="totals-wrapper">
            <div class="notes-column">
                @if($salesOrder->notes)
                <div class="notes-box">
                    <div class="title">SİPARİŞ NOTLARI</div>
                    {{ $salesOrder->notes }}
                </div>
                @endif

                @if($salesOrder->terms_and_conditions)
                <div class="notes-box" style="margin-top: 10px; background: #f8f9fa; border-color: #dee2e6;">
                    <div class="title" style="color: #495057;">ŞARTLAR VE KOŞULLAR</div>
                    {!! nl2br(e($salesOrder->terms_and_conditions)) !!}
                </div>
                @endif
            </div>
            <div class="totals-column">
                @php
                    // Satır toplamlarından hesapla (3 kademeli iskonto uygulanmış, KDV hariç)
                    $discountedSubtotal = $salesOrder->items->sum(function($item) {
                        $qty = (float) $item->quantity;
                        $d1 = (float) ($item->discount_rate1 ?? 0);
                        $d2 = (float) ($item->discount_rate2 ?? 0);
                        $d3 = (float) ($item->discount_rate3 ?? 0);
                        $discountedUnitPrice = $item->unit_price * (1 - $d1 / 100) * (1 - $d2 / 100) * (1 - $d3 / 100);
                        return $qty * $discountedUnitPrice;
                    });

                    // Sipariş indirimi
                    $orderDiscount = (float) ($salesOrder->discount_amount ?? 0);
                    $afterOrderDiscount = $discountedSubtotal - $orderDiscount;

                    // KDV hesapla (her kalem için ayrı ayrı, sipariş indirimi oransal olarak düşülür)
                    $calculatedTax = $salesOrder->items->sum(function($item) use ($discountedSubtotal, $orderDiscount) {
                        $qty = (float) $item->quantity;
                        $d1 = (float) ($item->discount_rate1 ?? 0);
                        $d2 = (float) ($item->discount_rate2 ?? 0);
                        $d3 = (float) ($item->discount_rate3 ?? 0);
                        $taxRate = (float) ($item->tax_rate ?? 20);
                        $discountedUnitPrice = $item->unit_price * (1 - $d1 / 100) * (1 - $d2 / 100) * (1 - $d3 / 100);
                        $lineTotal = $qty * $discountedUnitPrice;

                        // Sipariş indirimi oransal olarak KDV matrahından düşülür
                        $discountRatio = ($discountedSubtotal > 0 && $orderDiscount > 0) ? (1 - $orderDiscount / $discountedSubtotal) : 1;
                        $afterDisc = $lineTotal * $discountRatio;

                        return $afterDisc * ($taxRate / 100);
                    });

                    // Genel toplam
                    $shippingCost = (float) ($salesOrder->shipping_cost ?? 0);
                    $calculatedTotal = $afterOrderDiscount + $calculatedTax + $shippingCost;
                @endphp
                <table class="totals-table">
                    <tr>
                        <td class="label-cell">ARA TOPLAM:</td>
                        <td class="value-cell">{{ number_format($discountedSubtotal, 2) }} {{ $salesOrder->currency }}</td>
                    </tr>

                    @if($orderDiscount > 0)
                    <tr class="discount-row">
                        <td class="label-cell">SİPARİŞ İNDİRİMİ:</td>
                        <td class="value-cell">-{{ number_format($orderDiscount, 2) }} {{ $salesOrder->currency }}</td>
                    </tr>
                    <tr>
                        <td class="label-cell">KDV'SİZ TOPLAM:</td>
                        <td class="value-cell">{{ number_format($afterOrderDiscount, 2) }} {{ $salesOrder->currency }}</td>
                    </tr>
                    @endif

                    <tr>
                        <td class="label-cell">KDV TOPLAMI:</td>
                        <td class="value-cell">{{ number_format($calculatedTax, 2) }} {{ $salesOrder->currency }}</td>
                    </tr>

                    @if($shippingCost > 0)
                    <tr>
                        <td class="label-cell">KARGO:</td>
                        <td class="value-cell">{{ number_format($shippingCost, 2) }} {{ $salesOrder->currency }}</td>
                    </tr>
                    @endif

                    <tr class="grand-total">
                        <td class="label-cell">GENEL TOPLAM:</td>
                        <td class="value-cell">{{ number_format($calculatedTotal, 2) }} {{ $salesOrder->currency }}</td>
                    </tr>
                </table>
            </div>
        </div>

        <!-- Amount in Words -->
        @php
            $totalAmount = $calculatedTotal;
            $lira = floor($totalAmount);
            $kurus = round(($totalAmount - $lira) * 100);
            $amountText = number_format($lira, 0, ',', '.') . ' ' . $salesOrder->currency;
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
                        <strong>Not:</strong> Havale/EFT açıklamasına sipariş numarasını yazınız.
                    </div>
                </div>
                <div class="shipping-info">
                    <div class="title">SEVK ADRESİ</div>
                    @if($salesOrder->shipping_address)
                        @php
                            $shippingAddr = is_string($salesOrder->shipping_address)
                                ? json_decode($salesOrder->shipping_address, true)
                                : $salesOrder->shipping_address;
                        @endphp
                        @if(is_array($shippingAddr))
                            @if(!empty($shippingAddr['name']))
                                <div><strong>{{ $shippingAddr['name'] }}</strong></div>
                            @endif
                            @if(!empty($shippingAddr['address']))
                                <div>{{ $shippingAddr['address'] }}</div>
                            @endif
                            @if(!empty($shippingAddr['district']) || !empty($shippingAddr['city']))
                                <div>
                                    {{ $shippingAddr['district'] ?? '' }}
                                    @if(!empty($shippingAddr['district']) && !empty($shippingAddr['city'])) / @endif
                                    {{ $shippingAddr['city'] ?? '' }}
                                </div>
                            @endif
                            @if(!empty($shippingAddr['contact_person']))
                                <div style="margin-top: 5px;"><strong>İlgili Kişi:</strong> {{ $shippingAddr['contact_person'] }}</div>
                            @endif
                            @if(!empty($shippingAddr['contact_phone']))
                                <div><strong>Tel:</strong> {{ $shippingAddr['contact_phone'] }}</div>
                            @endif
                        @else
                            <div>{{ $salesOrder->shipping_address }}</div>
                        @endif
                    @else
                        <div>{{ $salesOrder->customer?->address ?? '-' }}</div>
                        @if($salesOrder->customer?->phone)
                            <div><strong>Tel:</strong> {{ $salesOrder->customer->phone }}</div>
                        @endif
                    @endif
                    @if($salesOrder->notes)
                        <div style="margin-top: 5px;"><strong>Müşteri Notları:</strong> {{ $salesOrder->notes }}</div>
                    @endif
                    @if($salesOrder->delivery_date)
                        <div style="margin-top: 5px;"><strong>İstenen Sevk Tarihi:</strong> {{ $salesOrder->delivery_date->format('d.m.Y') }}</div>
                    @endif
                    @php
                        $shippingOrder = $salesOrder->shippingOrders()->latest()->first();
                    @endphp
                    @if($shippingOrder)
                        @if($shippingOrder->vehicle)
                            <div style="margin-top: 5px;"><strong>Araç:</strong> {{ $shippingOrder->vehicle->plate_number }} @if($shippingOrder->vehicle->make)({{ $shippingOrder->vehicle->make }} {{ $shippingOrder->vehicle->model }})@endif</div>
                        @endif
                        @if($shippingOrder->driver)
                            <div><strong>Şoför:</strong> {{ $shippingOrder->driver->name }}</div>
                        @endif
                    @endif
                </div>
            </div>

            <div class="footer-note">
                <p>Bu belge {{ \Carbon\Carbon::now()->format('d.m.Y H:i:s') }} tarihinde {{ config('app.name') }} ERP sistemi tarafından otomatik olarak oluşturulmuştur.</p>
                <p>{{ $salesOrder->order_number }} • Sayfa 1/1</p>
            </div>
        </div>
    </div>
</body>
</html>
