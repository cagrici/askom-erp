<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>İade Teslim Alma Görevi</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #17a2b8; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="margin: 0;">{{ config('app.name') }}</h1>
            <p style="margin: 5px 0 0;">Teslim Alma Görevi</p>
        </div>

        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb;">
            <p>Merhaba {{ $return->driver->name }},</p>

            <p>Size bir iade teslim alma görevi atanmıştır:</p>

            <div style="background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #17a2b8;">
                <p style="margin: 10px 0;"><strong>İade No:</strong> {{ $return->return_no }}</p>
                <p style="margin: 10px 0;"><strong>Müşteri:</strong> {{ $return->customer->title }}</p>
                @if($return->pickup_date)
                <p style="margin: 10px 0;"><strong>Teslim Tarihi:</strong> {{ \Carbon\Carbon::parse($return->pickup_date)->format('d.m.Y') }}</p>
                @endif
                <p style="margin: 10px 0;"><strong>Adres:</strong> {{ $return->customer->address ?? 'Müşteri ile iletişime geçiniz' }}</p>
            </div>

            <p>İade formunu teslim alırken yanınızda bulundurunuz.</p>
        </div>

        <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
            <p>© {{ date('Y') }} {{ config('app.name') }}</p>
        </div>
    </div>
</body>
</html>
