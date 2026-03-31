<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Toplama Listesi - {{ $pickingTask->task_number }}</title>
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
            padding: 20px;
        }

        /* Header */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
        }

        .header-left {
            flex: 1;
        }

        .header-right {
            text-align: right;
        }

        .title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .task-number {
            font-size: 16px;
            color: #666;
        }

        .barcode-section {
            text-align: center;
            margin-top: 10px;
        }

        /* Info Boxes */
        .info-grid {
            display: table;
            width: 100%;
            margin-bottom: 20px;
        }

        .info-row {
            display: table-row;
        }

        .info-box {
            display: table-cell;
            width: 50%;
            padding: 10px;
            border: 1px solid #ddd;
            vertical-align: top;
        }

        .info-box h3 {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 8px;
            color: #666;
            text-transform: uppercase;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
        }

        .info-item {
            margin-bottom: 5px;
        }

        .info-label {
            font-weight: bold;
            display: inline-block;
            width: 100px;
        }

        /* Status Badge */
        .status-badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .status-assigned { background: #e3f2fd; color: #1565c0; }
        .status-in_progress { background: #fff3e0; color: #ef6c00; }
        .status-completed { background: #e8f5e9; color: #2e7d32; }

        .priority-badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .priority-urgent { background: #ffebee; color: #c62828; }
        .priority-high { background: #fff3e0; color: #ef6c00; }
        .priority-normal { background: #e3f2fd; color: #1565c0; }
        .priority-low { background: #f5f5f5; color: #757575; }

        /* Corridor Section */
        .corridor-section {
            margin-bottom: 20px;
            page-break-inside: avoid;
        }

        .corridor-header {
            background: #f5f5f5;
            padding: 8px 15px;
            font-size: 14px;
            font-weight: bold;
            border-left: 4px solid #1976d2;
            margin-bottom: 10px;
        }

        /* Items Table */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }

        .items-table th,
        .items-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }

        .items-table th {
            background: #f9f9f9;
            font-weight: bold;
            font-size: 10px;
            text-transform: uppercase;
        }

        .items-table tr:nth-child(even) {
            background: #fafafa;
        }

        .product-code {
            font-weight: bold;
            color: #1976d2;
        }

        .product-name {
            font-size: 10px;
            color: #666;
        }

        .quantity-cell {
            text-align: center;
            font-weight: bold;
            font-size: 14px;
        }

        .location-cell {
            font-family: monospace;
            font-size: 11px;
        }

        .checkbox-cell {
            width: 40px;
            text-align: center;
        }

        .checkbox {
            width: 20px;
            height: 20px;
            border: 2px solid #333;
            display: inline-block;
        }

        /* Footer */
        .footer {
            margin-top: 30px;
            border-top: 1px solid #ddd;
            padding-top: 15px;
        }

        .signature-section {
            display: table;
            width: 100%;
            margin-top: 20px;
        }

        .signature-box {
            display: table-cell;
            width: 33%;
            text-align: center;
            padding: 10px;
        }

        .signature-line {
            border-bottom: 1px solid #333;
            margin: 40px 20px 5px;
        }

        .signature-label {
            font-size: 10px;
            color: #666;
        }

        /* Summary */
        .summary {
            background: #f5f5f5;
            padding: 10px 15px;
            margin-top: 15px;
            border-radius: 4px;
        }

        .summary-item {
            display: inline-block;
            margin-right: 30px;
        }

        .summary-label {
            font-size: 10px;
            color: #666;
            text-transform: uppercase;
        }

        .summary-value {
            font-size: 16px;
            font-weight: bold;
        }

        /* Notes */
        .notes-section {
            margin-top: 15px;
            padding: 10px;
            background: #fffde7;
            border-left: 4px solid #fbc02d;
        }

        .notes-title {
            font-weight: bold;
            margin-bottom: 5px;
        }

        /* Print */
        @media print {
            .corridor-section {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <table style="width: 100%; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px;">
            <tr>
                <td style="width: 60%;">
                    <div class="title">TOPLAMA LISTESI</div>
                    <div class="task-number">{{ $pickingTask->task_number }}</div>
                </td>
                <td style="width: 40%; text-align: right;">
                    <div style="font-size: 12px; color: #666;">Olusturma: {{ $pickingTask->created_at->format('d.m.Y H:i') }}</div>
                    <div style="margin-top: 5px;">
                        <span class="status-badge status-{{ $pickingTask->status }}">{{ $pickingTask->status_label }}</span>
                    </div>
                </td>
            </tr>
        </table>

        <!-- Info Boxes -->
        <table class="info-grid">
            <tr class="info-row">
                <td class="info-box">
                    <h3>Sevkiyat Bilgileri</h3>
                    <div class="info-item">
                        <span class="info-label">Sevk No:</span>
                        {{ $pickingTask->shippingOrder->shipping_number }}
                    </div>
                    <div class="info-item">
                        <span class="info-label">Siparis No:</span>
                        {{ $pickingTask->shippingOrder->salesOrder->order_number }}
                    </div>
                    <div class="info-item">
                        <span class="info-label">Oncelik:</span>
                        <span class="priority-badge priority-{{ $pickingTask->shippingOrder->priority }}">
                            {{ $pickingTask->shippingOrder->priority_label }}
                        </span>
                    </div>
                    @if($pickingTask->shippingOrder->requested_ship_date)
                    <div class="info-item">
                        <span class="info-label">Istenen Tarih:</span>
                        {{ $pickingTask->shippingOrder->requested_ship_date->format('d.m.Y') }}
                    </div>
                    @endif
                </td>
                <td class="info-box">
                    <h3>Musteri Bilgileri</h3>
                    <div class="info-item">
                        <span class="info-label">Musteri:</span>
                        {{ $pickingTask->shippingOrder->salesOrder->customer->name ?? '-' }}
                    </div>
                    @if($pickingTask->shippingOrder->salesOrder->customer->phone ?? null)
                    <div class="info-item">
                        <span class="info-label">Telefon:</span>
                        {{ $pickingTask->shippingOrder->salesOrder->customer->phone }}
                    </div>
                    @endif
                    @if($pickingTask->shippingOrder->shipping_address)
                    <div class="info-item">
                        <span class="info-label">Adres:</span>
                        {{ is_array($pickingTask->shippingOrder->shipping_address)
                            ? implode(', ', array_filter($pickingTask->shippingOrder->shipping_address))
                            : $pickingTask->shippingOrder->shipping_address }}
                    </div>
                    @endif
                </td>
            </tr>
            <tr class="info-row">
                <td class="info-box">
                    <h3>Gorev Bilgileri</h3>
                    <div class="info-item">
                        <span class="info-label">Atanan:</span>
                        {{ $pickingTask->assignedTo->name ?? '-' }}
                    </div>
                    <div class="info-item">
                        <span class="info-label">Atayan:</span>
                        {{ $pickingTask->assignedBy->name ?? '-' }}
                    </div>
                    @if($pickingTask->started_at)
                    <div class="info-item">
                        <span class="info-label">Baslama:</span>
                        {{ $pickingTask->started_at->format('d.m.Y H:i') }}
                    </div>
                    @endif
                </td>
                <td class="info-box">
                    <h3>Ozet</h3>
                    <div class="info-item">
                        <span class="info-label">Toplam Kalem:</span>
                        <strong>{{ $pickingTask->total_items }}</strong>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Koridor Sayisi:</span>
                        <strong>{{ $itemsByCorridor->count() }}</strong>
                    </div>
                </td>
            </tr>
        </table>

        <!-- Items by Corridor -->
        @foreach($itemsByCorridor as $corridor => $items)
        <div class="corridor-section">
            <div class="corridor-header">
                <span style="font-size: 18px;">&#128197;</span>
                KORIDOR: {{ $corridor ?: 'Belirtilmemis' }}
                <span style="float: right; font-weight: normal; font-size: 12px;">
                    {{ $items->count() }} kalem
                </span>
            </div>

            <table class="items-table">
                <thead>
                    <tr>
                        <th style="width: 30px;">#</th>
                        <th style="width: 40px;">OK</th>
                        <th style="width: 100px;">KONUM</th>
                        <th>URUN</th>
                        <th style="width: 80px; text-align: center;">MIKTAR</th>
                        <th style="width: 80px; text-align: center;">TOPLANAN</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($items as $index => $item)
                    <tr>
                        <td style="text-align: center;">{{ $index + 1 }}</td>
                        <td class="checkbox-cell">
                            <div class="checkbox"></div>
                        </td>
                        <td class="location-cell">
                            @if($item->shelf)
                                {{ $item->shelf }}
                            @endif
                            @if($item->bin_location)
                                / {{ $item->bin_location }}
                            @endif
                            @if(!$item->shelf && !$item->bin_location)
                                -
                            @endif
                        </td>
                        <td>
                            <div class="product-code">{{ $item->product->code ?? '-' }}</div>
                            <div class="product-name">{{ $item->product->name ?? '-' }}</div>
                        </td>
                        <td class="quantity-cell">
                            {{ number_format($item->required_quantity, 0, ',', '.') }}
                        </td>
                        <td class="quantity-cell" style="border: 2px dashed #999;">
                            &nbsp;
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        @endforeach

        <!-- Notes -->
        @if($pickingTask->notes || $pickingTask->shippingOrder->notes)
        <div class="notes-section">
            <div class="notes-title">Notlar:</div>
            @if($pickingTask->notes)
                <div>{{ $pickingTask->notes }}</div>
            @endif
            @if($pickingTask->shippingOrder->notes)
                <div style="margin-top: 5px;">Sevkiyat Notu: {{ $pickingTask->shippingOrder->notes }}</div>
            @endif
        </div>
        @endif

        <!-- Summary -->
        <div class="summary">
            <span class="summary-item">
                <span class="summary-label">Toplam Kalem:</span>
                <span class="summary-value">{{ $pickingTask->items->count() }}</span>
            </span>
            <span class="summary-item">
                <span class="summary-label">Toplam Miktar:</span>
                <span class="summary-value">{{ number_format($pickingTask->items->sum('required_quantity'), 0, ',', '.') }}</span>
            </span>
            <span class="summary-item">
                <span class="summary-label">Koridor:</span>
                <span class="summary-value">{{ $itemsByCorridor->count() }}</span>
            </span>
        </div>

        <!-- Footer / Signatures -->
        <div class="footer">
            <table class="signature-section">
                <tr>
                    <td class="signature-box">
                        <div class="signature-line"></div>
                        <div class="signature-label">Toplayan</div>
                        <div style="font-size: 10px; margin-top: 5px;">{{ $pickingTask->assignedTo->name ?? '' }}</div>
                    </td>
                    <td class="signature-box">
                        <div class="signature-line"></div>
                        <div class="signature-label">Kontrol Eden</div>
                    </td>
                    <td class="signature-box">
                        <div class="signature-line"></div>
                        <div class="signature-label">Tarih / Saat</div>
                    </td>
                </tr>
            </table>
        </div>
    </div>
</body>
</html>
