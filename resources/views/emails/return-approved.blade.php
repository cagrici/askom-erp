<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>İade Talebiniz Onaylandı</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="margin: 0;">{{ config('app.name') }}</h1>
            <p style="margin: 5px 0 0;">İade Onayı</p>
        </div>

        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb;">
            <p>Sayın {{ $return->customer->title }},</p>

            <div style="background: #d1fae5; border: 1px solid #28a745; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <strong>✓ İade talebiniz onaylanmıştır!</strong>
            </div>

            <div style="background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #28a745;">
                <p style="margin: 10px 0;"><strong>İade No:</strong> {{ $return->return_no }}</p>
                <p style="margin: 10px 0;"><strong>Sipariş No:</strong> {{ $return->salesOrder->order_number }}</p>
                <p style="margin: 10px 0;"><strong>İade Yöntemi:</strong> {{ $return->refund_method_label }}</p>
                <p style="margin: 10px 0;"><strong>Tutar:</strong> ₺{{ number_format($return->total_amount, 2) }}</p>
            </div>

            <p>Ürünlerinizi teslim almak için en kısa sürede sizinle iletişime geçilecektir.</p>

            <p>Saygılarımızla,<br><strong>{{ config('app.name') }}</strong></p>
        </div>

        <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
            <p>© {{ date('Y') }} {{ config('app.name') }}</p>
        </div>
    </div>
</body>
</html>
