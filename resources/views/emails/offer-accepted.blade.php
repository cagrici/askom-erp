<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Teklif Kabul Edildi</title>
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
            background-color: #28a745;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
        }
        .content {
            background-color: #f8f9fa;
            padding: 30px;
            border: 1px solid #dee2e6;
            border-top: none;
        }
        .info-box {
            background-color: white;
            padding: 15px;
            margin: 15px 0;
            border-left: 4px solid #28a745;
            border-radius: 4px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .label {
            font-weight: bold;
            color: #6c757d;
        }
        .value {
            color: #333;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background-color: #28a745;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 20px;
            text-align: center;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            text-align: center;
            color: #6c757d;
            font-size: 12px;
        }
        .alert {
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
            padding: 12px;
            border-radius: 4px;
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 style="margin: 0;">✓ Teklif Kabul Edildi</h1>
    </div>

    <div class="content">
        <p>Merhaba,</p>

        <div class="alert">
            <strong>Müşteri teklifinizi kabul etti!</strong><br>
            Teklif numarası <strong>{{ $offer->offer_no }}</strong> müşteri tarafından kabul edilmiş ve otomatik olarak siparişe dönüştürülmüştür.
        </div>

        <div class="info-box">
            <h3 style="margin-top: 0; color: #28a745;">Teklif Bilgileri</h3>
            <div class="info-row">
                <span class="label">Teklif No:</span>
                <span class="value">{{ $offer->offer_no }}</span>
            </div>
            <div class="info-row">
                <span class="label">Müşteri:</span>
                <span class="value">{{ $offer->customer_display_name }}</span>
            </div>
            <div class="info-row">
                <span class="label">Teklif Tarihi:</span>
                <span class="value">{{ \Carbon\Carbon::parse($offer->offer_date)->format('d.m.Y') }}</span>
            </div>
            <div class="info-row">
                <span class="label">Toplam Tutar:</span>
                <span class="value" style="font-weight: bold; font-size: 1.1em; color: #28a745;">
                    {{ $offer->currency->symbol }}{{ number_format($offer->total_amount, 2, ',', '.') }}
                </span>
            </div>
        </div>

        <div class="info-box">
            <h3 style="margin-top: 0; color: #007bff;">Sipariş Bilgileri</h3>
            <div class="info-row">
                <span class="label">Sipariş No:</span>
                <span class="value">{{ $order->order_number }}</span>
            </div>
            <div class="info-row">
                <span class="label">Sipariş Tarihi:</span>
                <span class="value">{{ \Carbon\Carbon::parse($order->order_date)->format('d.m.Y') }}</span>
            </div>
            <div class="info-row">
                <span class="label">Durum:</span>
                <span class="value">{{ $order->status_label ?? 'Beklemede' }}</span>
            </div>
        </div>

        @if($offer->notes)
        <div class="info-box">
            <h4 style="margin-top: 0;">Müşteri Notu:</h4>
            <p style="margin: 0;">{{ $offer->notes }}</p>
        </div>
        @endif

        <div style="text-align: center;">
            <a href="{{ route('sales.orders.show', $order->id) }}" class="btn">
                Sipariş Detaylarını Görüntüle
            </a>
        </div>

        <p style="margin-top: 30px;">Lütfen siparişi en kısa sürede işleme alınız.</p>
    </div>

    <div class="footer">
        <p>Bu otomatik bir bilgilendirme e-postasıdır.</p>
        <p>&copy; {{ date('Y') }} {{ config('app.name') }}. Tüm hakları saklıdır.</p>
    </div>
</body>
</html>
