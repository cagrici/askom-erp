<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Satış Teklifi</title>
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
            background: #3b82f6;
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
        .offer-details {
            background: white;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #3b82f6;
        }
        .detail-row {
            margin: 10px 0;
        }
        .detail-label {
            font-weight: bold;
            color: #4b5563;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 12px;
            background: #f9fafb;
            border-radius: 0 0 5px 5px;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background: #3b82f6;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ config('app.name') }}</h1>
        <p>Satış Teklifi</p>
    </div>

    <div class="content">
        <p>Sayın {{ $offer->entity ? $offer->entity->title : $offer->customer_name }},</p>

        <p>Talebiniz doğrultusunda hazırladığımız satış teklifimizi ekte bulabilirsiniz.</p>

        <div class="offer-details">
            <div class="detail-row">
                <span class="detail-label">Teklif No:</span> {{ $offer->offer_no }}
            </div>
            <div class="detail-row">
                <span class="detail-label">Teklif Tarihi:</span> {{ \Carbon\Carbon::parse($offer->offer_date)->format('d.m.Y') }}
            </div>
            <div class="detail-row">
                <span class="detail-label">Geçerlilik Tarihi:</span> {{ \Carbon\Carbon::parse($offer->valid_until_date)->format('d.m.Y') }}
            </div>
            <div class="detail-row">
                <span class="detail-label">Toplam Tutar:</span> {{ number_format($offer->total_amount, 2) }} ₺
            </div>
        </div>

        <p>Teklifimiz ile ilgili sorularınız için bizimle iletişime geçebilirsiniz.</p>

        <p>Saygılarımızla,<br>
        <strong>{{ config('app.name') }}</strong></p>
    </div>

    <div class="footer">
        <p>Bu email {{ \Carbon\Carbon::now()->format('d.m.Y H:i:s') }} tarihinde otomatik olarak gönderilmiştir.</p>
        <p>© {{ date('Y') }} {{ config('app.name') }}. Tüm hakları saklıdır.</p>
    </div>
</body>
</html>
