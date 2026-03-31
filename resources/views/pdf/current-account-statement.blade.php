<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cari Hesap Ekstresi - {{ $account->account_code }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 9px;
            line-height: 1.3;
            color: #333;
        }

        .container {
            padding: 10px 15px;
        }

        /* Header */
        .header {
            display: table;
            width: 100%;
            border: 2px solid #333;
            margin-bottom: 10px;
        }

        .header-left {
            display: table-cell;
            width: 65%;
            vertical-align: top;
            padding: 8px 12px;
        }

        .header-right {
            display: table-cell;
            width: 35%;
            vertical-align: top;
            padding: 8px 12px;
            text-align: right;
        }

        .header-title {
            font-size: 14px;
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
        }

        .company-name {
            font-size: 16px;
            font-weight: bold;
            color: #8B0000;
            margin-bottom: 8px;
        }

        .header-info {
            display: table;
            width: 100%;
        }

        .header-info-row {
            display: table-row;
        }

        .header-info-label {
            display: table-cell;
            width: 80px;
            font-weight: bold;
            padding: 1px 0;
            font-size: 9px;
        }

        .header-info-value {
            display: table-cell;
            padding: 1px 5px;
            font-size: 9px;
        }

        .report-info {
            font-size: 9px;
        }

        .report-info p {
            margin-bottom: 2px;
        }

        /* Account Info Bar */
        .account-bar {
            background: #f0f0f0;
            border: 1px solid #333;
            padding: 6px 12px;
            margin-bottom: 8px;
            font-size: 11px;
            font-weight: bold;
        }

        .account-bar .code {
            display: inline-block;
            margin-right: 15px;
            padding: 2px 8px;
            border: 1px solid #333;
            background: #fff;
        }

        /* Table */
        table.ekstre {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }

        table.ekstre thead th {
            background: #e8e8e8;
            border: 1px solid #999;
            padding: 4px 6px;
            font-weight: bold;
            font-size: 9px;
            text-align: center;
        }

        table.ekstre tbody td {
            border: 1px solid #ccc;
            padding: 3px 5px;
            font-size: 8.5px;
        }

        table.ekstre tbody tr:nth-child(even) {
            background: #fafafa;
        }

        .text-right {
            text-align: right;
        }

        .text-center {
            text-align: center;
        }

        .text-left {
            text-align: left;
        }

        .amount {
            font-family: 'DejaVu Sans', monospace;
            white-space: nowrap;
        }

        /* Totals row */
        table.ekstre tfoot td {
            border: 1px solid #999;
            padding: 4px 6px;
            font-weight: bold;
            font-size: 9px;
            background: #e8e8e8;
        }

        /* Summary */
        .summary {
            display: table;
            width: 100%;
            margin-top: 10px;
        }

        .summary-right {
            display: table-cell;
            width: 40%;
            text-align: right;
            vertical-align: top;
        }

        .summary-left {
            display: table-cell;
            width: 60%;
            vertical-align: top;
        }

        .summary-table {
            width: 280px;
            float: right;
            border-collapse: collapse;
        }

        .summary-table td {
            padding: 3px 8px;
            border: 1px solid #ccc;
            font-size: 9px;
        }

        .summary-table .label {
            font-weight: bold;
            background: #f0f0f0;
            width: 150px;
        }

        .summary-table .value {
            text-align: right;
            font-family: 'DejaVu Sans', monospace;
        }

        .balance-indicator {
            font-weight: bold;
            font-size: 8px;
            padding-left: 3px;
        }

        .page-break {
            page-break-after: always;
        }

        .footer {
            position: fixed;
            bottom: 10px;
            left: 15px;
            right: 15px;
            font-size: 8px;
            color: #999;
            text-align: center;
            border-top: 1px solid #ddd;
            padding-top: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="header-left">
                <div class="header-title">Cari Hesap Ekstresi</div>
                <div class="company-name">ASKOM</div>
                <div class="header-info">
                    <div class="header-info-row">
                        <span class="header-info-label">Telefon 1 :</span>
                        <span class="header-info-value">0212</span>
                    </div>
                    <div class="header-info-row">
                        <span class="header-info-label">Telefon 2 :</span>
                        <span class="header-info-value">0216 486 29 43</span>
                    </div>
                    <div class="header-info-row">
                        <span class="header-info-label">Mail Adresi :</span>
                        <span class="header-info-value">{{ config('app.company_email', 'info@askom.com.tr') }}</span>
                    </div>
                </div>
            </div>
            <div class="header-right">
                <div class="report-info">
                    <p><strong>Rapor Tarihi :</strong> {{ now()->format('d.m.Y') }}</p>
                    <p>&nbsp;</p>
                    <p><strong>Tarih Aralığı:</strong></p>
                    <p>{{ \Carbon\Carbon::parse($startDate)->format('d.m.Y') }} - {{ \Carbon\Carbon::parse($endDate)->format('d.m.Y') }}</p>
                </div>
            </div>
        </div>

        <!-- Account Info Bar -->
        <div class="account-bar">
            <span class="code">{{ $account->account_code }}</span>
            -&nbsp;&nbsp;&nbsp;{{ $account->title }}
        </div>

        <!-- Transactions Table -->
        <table class="ekstre">
            <thead>
                <tr>
                    <th style="width: 70px;">Tarih</th>
                    <th style="width: 120px;">Fiş Türü</th>
                    <th style="width: 130px;">Fiş No.</th>
                    <th>Açıklama</th>
                    <th style="width: 100px;">Borç</th>
                    <th style="width: 100px;">Alacak</th>
                    <th style="width: 120px;">Bakiye</th>
                    <th style="width: 25px;">İD</th>
                </tr>
            </thead>
            <tbody>
                @forelse($transactions as $transaction)
                <tr>
                    <td class="text-center">{{ \Carbon\Carbon::parse($transaction->transaction_date)->format('d.m.y') }}</td>
                    <td class="text-left">{{ $transaction->document_type ?? '-' }}</td>
                    <td class="text-left">{{ $transaction->document_id ?? '-' }}</td>
                    <td class="text-left">{{ $transaction->description ?? '' }}</td>
                    <td class="text-right amount">
                        @if($transaction->transaction_type === 'debit')
                            {{ number_format($transaction->amount, 2, ',', '.') }}
                        @endif
                    </td>
                    <td class="text-right amount">
                        @if($transaction->transaction_type === 'credit')
                            {{ number_format($transaction->amount, 2, ',', '.') }}
                        @endif
                    </td>
                    <td class="text-right amount">
                        {{ number_format(abs($transaction->running_balance), 2, ',', '.') }}
                        <span class="balance-indicator">({{ $transaction->running_balance >= 0 ? 'B' : 'A' }})</span>
                    </td>
                    <td class="text-center">TL</td>
                </tr>
                @empty
                <tr>
                    <td colspan="8" class="text-center" style="padding: 20px;">
                        Bu tarih aralığında hareket bulunamadı.
                    </td>
                </tr>
                @endforelse
            </tbody>
            @if($transactions->count() > 0)
            <tfoot>
                <tr>
                    <td colspan="4" class="text-right"><strong>TOPLAM</strong></td>
                    <td class="text-right amount">{{ number_format($totalDebit, 2, ',', '.') }}</td>
                    <td class="text-right amount">{{ number_format($totalCredit, 2, ',', '.') }}</td>
                    <td class="text-right amount">
                        {{ number_format(abs($closingBalance), 2, ',', '.') }}
                        <span class="balance-indicator">({{ $closingBalance >= 0 ? 'B' : 'A' }})</span>
                    </td>
                    <td class="text-center">TL</td>
                </tr>
            </tfoot>
            @endif
        </table>

        @if($transactions->count() > 0)
        <!-- Summary -->
        <div class="summary">
            <div class="summary-left">
                <p style="font-size: 8px; color: #666;">
                    (B) = Borç Bakiyesi &nbsp;&nbsp; (A) = Alacak Bakiyesi
                </p>
            </div>
            <div class="summary-right">
                <table class="summary-table">
                    <tr>
                        <td class="label">Toplam Borç</td>
                        <td class="value">{{ number_format($totalDebit, 2, ',', '.') }} TL</td>
                    </tr>
                    <tr>
                        <td class="label">Toplam Alacak</td>
                        <td class="value">{{ number_format($totalCredit, 2, ',', '.') }} TL</td>
                    </tr>
                    <tr>
                        <td class="label"><strong>Kalan Bakiye</strong></td>
                        <td class="value">
                            <strong>{{ number_format(abs($closingBalance), 2, ',', '.') }} TL ({{ $closingBalance >= 0 ? 'B' : 'A' }})</strong>
                        </td>
                    </tr>
                </table>
            </div>
        </div>
        @endif
    </div>

    <div class="footer">
        ASKOM ERP - Cari Hesap Ekstresi | {{ $account->account_code }} - {{ $account->title }} | Rapor Tarihi: {{ now()->format('d.m.Y H:i') }}
    </div>
</body>
</html>
