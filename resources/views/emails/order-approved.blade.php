<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Sipariş Onaylandı</title>
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
            background-color: #4CAF50;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
        }
        .content {
            background-color: #f9f9f9;
            padding: 30px;
            border: 1px solid #ddd;
            border-radius: 0 0 5px 5px;
        }
        .info-box {
            background-color: white;
            padding: 15px;
            margin: 20px 0;
            border-left: 4px solid #4CAF50;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Sipariş Onaylandı</h1>
    </div>
    <div class="content">
        <p>Merhaba,</p>
        
        <p>Aşağıdaki sipariş başarıyla onaylanmıştır:</p>
        
        <div class="info-box">
            <h3>Sipariş Detayları</h3>
            <p><strong>Sipariş No:</strong> {{ $doc_no }}</p>
            <p><strong>Firma:</strong> {{ $entity_name }}</p>
            <p><strong>Tutar:</strong> {{ $amount }}</p>
            <p><strong>Onay Tarihi:</strong> {{ date('d.m.Y H:i') }}</p>
        </div>
        
        <p>Sipariş sürecine devam edebilirsiniz.</p>
        
        <div class="footer">
            <p>Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.</p>
        </div>
    </div>
</body>
</html>