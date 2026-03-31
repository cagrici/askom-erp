<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Siparis Bilgisi</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: #0d6efd;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
        }
        .content {
            background: #f9fafb;
            padding: 30px;
            border: 1px solid #e5e7eb;
        }
        .order-details {
            background: white;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #0d6efd;
        }
        .detail-row {
            margin: 10px 0;
        }
        .detail-label {
            font-weight: bold;
            color: #4b5563;
        }
        .custom-message {
            background: #fff3cd;
            border: 1px solid #ffc107;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        .items-table th, .items-table td {
            border: 1px solid #e5e7eb;
            padding: 8px;
            text-align: left;
        }
        .items-table th {
            background: #f3f4f6;
        }
        .items-table .text-right {
            text-align: right;
        }
        .totals {
            background: #f3f4f6;
            padding: 15px;
            margin-top: 15px;
            border-radius: 5px;
        }
        .totals-row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
        }
        .totals-row.grand-total {
            font-weight: bold;
            font-size: 16px;
            border-top: 2px solid #333;
            padding-top: 10px;
            margin-top: 10px;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 12px;
            background: #f9fafb;
            border-radius: 0 0 5px 5px;
        }
        .attachment-note {
            background: #e8f4fd;
            border: 1px solid #0d6efd;
            padding: 10px;
            border-radius: 5px;
            margin: 15px 0;
            font-size: 13px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ config('app.name') }}</h1>
        <p>Siparis Bilgisi</p>
    </div>

    <div class="content">
        <p>Sayin {{ $salesOrder->customer ? $salesOrder->customer->title : 'Degerli Musterimiz' }},</p>

        @if($customMessage)
        <div class="custom-message">
            {!! nl2br(e($customMessage)) !!}
        </div>
        @endif

        <div class="order-details">
            <div class="detail-row">
                <span class="detail-label">Siparis No:</span> {{ $salesOrder->order_number }}
            </div>
            <div class="detail-row">
                <span class="detail-label">Siparis Tarihi:</span> {{ \Carbon\Carbon::parse($salesOrder->order_date)->format('d.m.Y') }}
            </div>
            @if($salesOrder->delivery_date)
            <div class="detail-row">
                <span class="detail-label">Teslim Tarihi:</span> {{ \Carbon\Carbon::parse($salesOrder->delivery_date)->format('d.m.Y') }}
            </div>
            @endif
            @if($salesOrder->reference_number)
            <div class="detail-row">
                <span class="detail-label">Referans No:</span> {{ $salesOrder->reference_number }}
            </div>
            @endif
            <div class="detail-row">
                <span class="detail-label">Durum:</span> {{ $salesOrder->status_label ?? $salesOrder->status }}
            </div>
        </div>

        @if($salesOrder->items && $salesOrder->items->count() > 0)
        <h3>Siparis Kalemleri</h3>
        <table class="items-table">
            <thead>
                <tr>
                    <th>Urun</th>
                    <th class="text-right">Miktar</th>
                    <th class="text-right">Birim Fiyat</th>
                    <th class="text-right">Toplam</th>
                </tr>
            </thead>
            <tbody>
                @foreach($salesOrder->items as $item)
                <tr>
                    <td>
                        {{ $item->product ? $item->product->name : ($item->product_name ?? '-') }}
                        @if($item->product && $item->product->code)
                        <br><small style="color: #6b7280;">{{ $item->product->code }}</small>
                        @endif
                    </td>
                    <td class="text-right">{{ number_format($item->quantity, 2) }} {{ $item->unit ?? 'Adet' }}</td>
                    <td class="text-right">{{ number_format($item->unit_price, 2) }} {{ $salesOrder->currency ?? 'TRY' }}</td>
                    <td class="text-right">{{ number_format($item->line_total ?? ($item->quantity * $item->unit_price), 2) }} {{ $salesOrder->currency ?? 'TRY' }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
        @endif

        <div class="totals">
            <div class="totals-row">
                <span>Ara Toplam:</span>
                <span>{{ number_format($salesOrder->subtotal ?? 0, 2) }} {{ $salesOrder->currency ?? 'TRY' }}</span>
            </div>
            @if($salesOrder->discount_amount > 0)
            <div class="totals-row">
                <span>Iskonto:</span>
                <span>-{{ number_format($salesOrder->discount_amount, 2) }} {{ $salesOrder->currency ?? 'TRY' }}</span>
            </div>
            @endif
            <div class="totals-row">
                <span>KDV:</span>
                <span>{{ number_format($salesOrder->tax_amount ?? 0, 2) }} {{ $salesOrder->currency ?? 'TRY' }}</span>
            </div>
            <div class="totals-row grand-total">
                <span>Genel Toplam:</span>
                <span>{{ number_format($salesOrder->total_amount ?? 0, 2) }} {{ $salesOrder->currency ?? 'TRY' }}</span>
            </div>
        </div>

        <div class="attachment-note">
            <strong>Not:</strong> Siparis detaylarini iceren PDF dosyasi bu emaile ektedir.
        </div>

        @if($salesOrder->notes)
        <p><strong>Siparis Notu:</strong><br>{{ $salesOrder->notes }}</p>
        @endif

        <p>Sorulariniz icin bizimle iletisime gecebilirsiniz.</p>

        <p>Saygilarimizla,<br>
        <strong>{{ config('app.name') }}</strong></p>
    </div>

    <div class="footer">
        <p>Bu email {{ \Carbon\Carbon::now()->format('d.m.Y H:i:s') }} tarihinde gonderilmistir.</p>
        <p>&copy; {{ date('Y') }} {{ config('app.name') }}. Tum haklari saklidir.</p>
    </div>
</body>
</html>
