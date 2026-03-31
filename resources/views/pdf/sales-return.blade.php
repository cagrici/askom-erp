<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>İade Formu - {{ $return->return_no }}</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 10pt;
            line-height: 1.4;
            color: #333;
        }
        .header {
            border-bottom: 3px solid #dc3545;
            margin-bottom: 20px;
            padding-bottom: 10px;
        }
        .company-name {
            font-size: 20pt;
            font-weight: bold;
            color: #dc3545;
        }
        .document-title {
            font-size: 16pt;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
            color: #dc3545;
        }
        .info-section {
            margin-bottom: 15px;
        }
        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .info-table td {
            padding: 8px;
            border: 1px solid #ddd;
        }
        .info-table td:first-child {
            font-weight: bold;
            background-color: #f8f9fa;
            width: 30%;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .items-table th {
            background-color: #dc3545;
            color: white;
            padding: 8px;
            text-align: left;
            font-weight: bold;
        }
        .items-table td {
            padding: 8px;
            border: 1px solid #ddd;
        }
        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
        }
        .total-section {
            width: 40%;
            margin-left: auto;
            margin-top: 20px;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
        }
        .total-row.grand-total {
            font-weight: bold;
            font-size: 12pt;
            border-top: 2px solid #333;
            padding-top: 10px;
            margin-top: 10px;
        }
        .signature-section {
            margin-top: 60px;
            display: flex;
            justify-content: space-between;
        }
        .signature-box {
            width: 45%;
            text-align: center;
        }
        .signature-line {
            border-top: 1px solid #333;
            margin-top: 60px;
            padding-top: 5px;
        }
        .notes-section {
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            padding: 10px;
            margin: 20px 0;
        }
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 8pt;
            color: #666;
            padding: 10px 0;
            border-top: 1px solid #ddd;
        }
        .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 9pt;
            font-weight: bold;
        }
        .badge-warning { background-color: #ffc107; color: #000; }
        .badge-danger { background-color: #dc3545; color: #fff; }
        .badge-success { background-color: #28a745; color: #fff; }
        .badge-info { background-color: #17a2b8; color: #fff; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">{{ config('app.name') }}</div>
        <div style="font-size: 9pt; margin-top: 5px;">İade Formu</div>
    </div>

    <div class="document-title">İADE FORMU</div>

    <!-- Return Information -->
    <table class="info-table">
        <tr>
            <td>İade No</td>
            <td><strong>{{ $return->return_no }}</strong></td>
            <td>İade Tarihi</td>
            <td>{{ \Carbon\Carbon::parse($return->return_date)->format('d.m.Y') }}</td>
        </tr>
        <tr>
            <td>Sipariş No</td>
            <td>{{ $return->salesOrder->order_number }}</td>
            <td>Durum</td>
            <td>
                <span class="badge badge-{{ $return->status === 'approved' ? 'success' : 'warning' }}">
                    {{ $return->status_label }}
                </span>
            </td>
        </tr>
        <tr>
            <td>Müşteri</td>
            <td colspan="3">
                {{ $return->customer->title }}<br>
                <small>Kod: {{ $return->customer->entity_code }}</small>
            </td>
        </tr>
        <tr>
            <td>İade Nedeni</td>
            <td colspan="3">
                <strong>{{ $return->reason_label }}</strong><br>
                <small>{{ $return->return_description }}</small>
            </td>
        </tr>
        @if($return->refund_method_label)
        <tr>
            <td>İade Yöntemi</td>
            <td colspan="3">{{ $return->refund_method_label }}</td>
        </tr>
        @endif
    </table>

    <!-- Return Items -->
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 5%;">#</th>
                <th style="width: 45%;">Ürün</th>
                <th style="width: 15%;" class="text-center">Miktar</th>
                <th style="width: 15%;" class="text-right">Birim Fiyat</th>
                <th style="width: 20%;" class="text-right">Toplam</th>
            </tr>
        </thead>
        <tbody>
            @foreach($return->items as $index => $item)
            <tr>
                <td class="text-center">{{ $index + 1 }}</td>
                <td>
                    <strong>{{ $item->product_name }}</strong><br>
                    @if($item->product_code)
                        <small>Kod: {{ $item->product_code }}</small>
                    @endif
                </td>
                <td class="text-center">{{ $item->quantity_returned }}</td>
                <td class="text-right">₺{{ number_format($item->unit_price, 2, ',', '.') }}</td>
                <td class="text-right">₺{{ number_format($item->line_total, 2, ',', '.') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <!-- Total -->
    <div class="total-section">
        <div class="total-row grand-total">
            <span>TOPLAM İADE TUTARI:</span>
            <span>₺{{ number_format($return->total_amount, 2, ',', '.') }}</span>
        </div>
    </div>

    <!-- Pickup Information -->
    @if($return->driver || $return->pickup_date)
    <div class="notes-section">
        <strong>Teslim Alma Bilgileri:</strong><br>
        @if($return->driver)
            Şoför: {{ $return->driver->name }}<br>
        @endif
        @if($return->pickup_date)
            Teslim Alma Tarihi: {{ \Carbon\Carbon::parse($return->pickup_date)->format('d.m.Y') }}<br>
        @endif
        @if($return->pickup_notes)
            Notlar: {{ $return->pickup_notes }}
        @endif
    </div>
    @endif

    <!-- Signatures -->
    <div class="signature-section">
        <div class="signature-box">
            <div class="signature-line">
                Müşteri İmzası
            </div>
        </div>
        <div class="signature-box">
            <div class="signature-line">
                Şoför / Yetkili İmzası
            </div>
        </div>
    </div>

    <div class="footer">
        Bu form {{ \Carbon\Carbon::now()->format('d.m.Y H:i:s') }} tarihinde otomatik olarak oluşturulmuştur.<br>
        © {{ date('Y') }} {{ config('app.name') }}
    </div>
</body>
</html>
