<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Şifre Sıfırlama - {{ config('app.name') }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            padding: 0;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 300;
        }
        .content {
            padding: 40px 30px;
        }
        .content h2 {
            color: #333;
            margin-bottom: 20px;
            font-size: 20px;
        }
        .content p {
            margin-bottom: 15px;
            font-size: 16px;
            line-height: 1.5;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
        }
        .button:hover {
            background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
        }
        .info-box {
            background-color: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
        .small-text {
            font-size: 12px;
            color: #888;
            margin-top: 20px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">{{ config('app.name') }}</div>
            <p>Güvenli Portal Sistemi</p>
        </div>
        
        <div class="content">
            <h2>Şifre Sıfırlama Talebi</h2>
            
            <p>Merhaba,</p>
            
            <p>{{ config('app.name') }} hesabınız için şifre sıfırlama talebinde bulundunuz. Yeni şifrenizi oluşturmak için aşağıdaki butona tıklayın:</p>
            
            <div style="text-align: center;">
                <a href="{{ $url }}" class="button">Şifremi Sıfırla</a>
            </div>
            
            <div class="info-box">
                <strong>Önemli Bilgiler:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Bu link 60 dakika boyunca geçerlidir</li>
                    <li>Link sadece bir kez kullanılabilir</li>
                    <li>Güvenliğiniz için güçlü bir şifre seçin</li>
                </ul>
            </div>
            
            <p>Eğer şifre sıfırlama talebinde bulunmadıysanız, bu e-postayı görmezden gelebilirsiniz. Hesabınızda herhangi bir değişiklik yapılmayacaktır.</p>
            
            <p>Herhangi bir sorunuz olursa bizimle iletişime geçmekten çekinmeyin.</p>
            
            <p class="small-text">
                <strong>Buton çalışmıyorsa aşağıdaki linki tarayıcınıza kopyalayabilirsiniz:</strong><br>
                {{ $url }}
            </p>
        </div>
        
        <div class="footer">
            <p>Bu e-posta {{ config('app.name') }} tarafından otomatik olarak gönderilmiştir.</p>
            <p>&copy; {{ date('Y') }} {{ config('app.name') }}. Tüm hakları saklıdır.</p>
        </div>
    </div>
</body>
</html>
