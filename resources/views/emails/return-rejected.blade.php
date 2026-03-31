<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>İade Talebi Hakkında</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="margin: 0;">{{ config('app.name') }}</h1>
            <p style="margin: 5px 0 0;">İade Talebi</p>
        </div>

        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb;">
            <p>Sayın {{ $return->customer->title }},</p>

            <p>İade talebiniz incelenmiştir.</p>

            <div style="background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #dc3545;">
                <p style="margin: 10px 0;"><strong>İade No:</strong> {{ $return->return_no }}</p>
                <p style="margin: 10px 0;"><strong>Sipariş No:</strong> {{ $return->salesOrder->order_number }}</p>
                <p style="margin: 10px 0;"><strong>Durum:</strong> <span style="color: #dc3545;">Reddedildi</span></p>
                @if($return->rejection_reason)
                <p style="margin: 10px 0;"><strong>Red Nedeni:</strong><br>{{ $return->rejection_reason }}</p>
                @endif
            </div>

            <p>Sorularınız için bizimle iletişime geçebilirsiniz.</p>

            <p>Saygılarımızla,<br><strong>{{ config('app.name') }}</strong></p>
        </div>

        <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
            <p>© {{ date('Y') }} {{ config('app.name') }}</p>
        </div>
    </div>
</body>
</html>
