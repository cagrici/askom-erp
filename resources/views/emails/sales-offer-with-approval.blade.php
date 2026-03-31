<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Satis Teklifi</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .header p {
            margin: 10px 0 0;
            opacity: 0.9;
        }
        .content {
            padding: 30px;
        }
        .custom-message {
            background: #f0f9ff;
            border-left: 4px solid #3b82f6;
            padding: 15px;
            margin: 20px 0;
            font-style: italic;
        }
        .offer-details {
            background: #f9fafb;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            font-weight: bold;
            color: #4b5563;
        }
        .detail-value {
            color: #1f2937;
        }
        .total-row {
            background: #1d4ed8;
            color: white;
            padding: 15px;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
        }
        .total-row .label {
            font-weight: bold;
        }
        .total-row .amount {
            font-size: 24px;
            font-weight: bold;
        }
        .action-section {
            text-align: center;
            padding: 30px 20px;
            background: #f0fdf4;
            border-top: 1px solid #e5e7eb;
        }
        .action-section h3 {
            color: #166534;
            margin: 0 0 15px;
        }
        .action-section p {
            color: #4b5563;
            margin: 0 0 20px;
        }
        .approve-button {
            display: inline-block;
            padding: 15px 40px;
            background: linear-gradient(135deg, #22c55e, #16a34a);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
            margin: 10px 5px;
        }
        .approve-button:hover {
            background: linear-gradient(135deg, #16a34a, #15803d);
        }
        .pdf-button {
            display: inline-block;
            padding: 15px 40px;
            background: linear-gradient(135deg, #6366f1, #4f46e5);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
            margin: 10px 5px;
        }
        .validity-notice {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            color: #92400e;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 12px;
            background: #f9fafb;
        }
        .divider {
            height: 1px;
            background: #e5e7eb;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{ config('app.name') }}</h1>
            <p>Satis Teklifi</p>
        </div>

        <div class="content">
            <p>Sayin {{ $offer->entity ? $offer->entity->title : $offer->customer_name }},</p>

            @if($customMessage)
            <div class="custom-message">
                {!! nl2br(e($customMessage)) !!}
            </div>
            @else
            <p>Talebiniz dogrultusunda hazirlanan satis teklifimizi ekte bulabilirsiniz.</p>
            @endif

            <div class="offer-details">
                <div class="detail-row">
                    <span class="detail-label">Teklif No:</span>
                    <span class="detail-value">{{ $offer->offer_no }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Teklif Tarihi:</span>
                    <span class="detail-value">{{ \Carbon\Carbon::parse($offer->offer_date)->format('d.m.Y') }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Gecerlilik Tarihi:</span>
                    <span class="detail-value">{{ \Carbon\Carbon::parse($offer->valid_until_date)->format('d.m.Y') }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Ara Toplam:</span>
                    <span class="detail-value">{{ number_format($offer->subtotal, 2, ',', '.') }} {{ $offer->currency->cur_symbol ?? $offer->currency->cur_code ?? 'TL' }}</span>
                </div>
                @if($offer->discount_amount > 0)
                <div class="detail-row">
                    <span class="detail-label">Iskonto ({{ $offer->discount_rate }}%):</span>
                    <span class="detail-value" style="color: #dc2626;">-{{ number_format($offer->discount_amount, 2, ',', '.') }} {{ $offer->currency->cur_symbol ?? $offer->currency->cur_code ?? 'TL' }}</span>
                </div>
                @endif
                <div class="detail-row">
                    <span class="detail-label">KDV ({{ number_format($offer->tax_rate, 0) }}%):</span>
                    <span class="detail-value">{{ number_format($offer->tax_amount, 2, ',', '.') }} {{ $offer->currency->cur_symbol ?? $offer->currency->cur_code ?? 'TL' }}</span>
                </div>
            </div>

            <div class="total-row">
                <span class="label">TOPLAM TUTAR</span>
                <span class="amount">{{ number_format($offer->total_amount, 2, ',', '.') }} {{ $offer->currency->cur_symbol ?? $offer->currency->cur_code ?? 'TL' }}</span>
            </div>

            <div class="validity-notice">
                <strong>Onemli:</strong> Bu teklif {{ \Carbon\Carbon::parse($offer->valid_until_date)->format('d.m.Y') }} tarihine kadar gecerlidir.
            </div>
        </div>

        @if($approvalUrl)
        <div class="action-section">
            <h3>Teklifi Onaylayin</h3>
            <p>Teklifi onaylamak icin asagidaki butona tiklayin. Ayrintili bilgi icin PDF'i indirebilirsiniz.</p>
            <div>
                <a href="{{ $approvalUrl }}" class="approve-button">Teklifi Onayla</a>
            </div>
            <p style="margin-top: 15px; font-size: 12px; color: #6b7280;">
                Butona tikladiginizda teklif detaylarini gorebilir ve onaylayabilirsiniz.
            </p>
        </div>
        @endif

        <div class="footer">
            <p>Teklifimiz ile ilgili sorulariniz icin bizimle iletisime gecebilirsiniz.</p>
            <div class="divider"></div>
            <p>Bu email {{ \Carbon\Carbon::now()->format('d.m.Y H:i') }} tarihinde otomatik olarak gonderilmistir.</p>
            <p>&copy; {{ date('Y') }} {{ config('app.name') }}. Tum haklari saklidir.</p>
        </div>
    </div>
    @if(isset($trackingPixelUrl))
    <img src="{{ $trackingPixelUrl }}" width="1" height="1" alt="" style="display:none;" />
    @endif
</body>
</html>
