<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    
    <title>500 - Sunucu Hatası | {{ config('app.name', 'Portal') }}</title>
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css?family=Poppins:300,400,500,600,700&display=swap" rel="stylesheet">
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <style>
        * {
            font-family: 'Poppins', sans-serif;
        }
        
        body {
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            min-height: 100vh;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .error-container {
            text-align: center;
            color: white;
            max-width: 600px;
            padding: 2rem;
        }
        
        .error-code {
            font-size: 8rem;
            font-weight: 700;
            background: linear-gradient(45deg, #e74c3c, #c0392b);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 1rem;
            text-shadow: 0 0 30px rgba(231, 76, 60, 0.3);
        }
        
        .error-title {
            font-size: 2.5rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: #ecf0f1;
        }
        
        .error-description {
            font-size: 1.2rem;
            color: #bdc3c7;
            margin-bottom: 2rem;
            line-height: 1.6;
        }
        
        .error-icon {
            font-size: 4rem;
            color: #e74c3c;
            margin-bottom: 2rem;
            animation: pulse 2s infinite;
        }
        
        .btn-home {
            background: linear-gradient(45deg, #3498db, #2980b9);
            border: none;
            padding: 12px 30px;
            font-size: 1.1rem;
            font-weight: 500;
            border-radius: 50px;
            color: white;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
        }
        
        .btn-home:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
            color: white;
            text-decoration: none;
        }
        
        .btn-refresh {
            background: transparent;
            border: 2px solid #27ae60;
            padding: 12px 30px;
            font-size: 1.1rem;
            font-weight: 500;
            border-radius: 50px;
            color: #27ae60;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s ease;
            margin-left: 1rem;
        }
        
        .btn-refresh:hover {
            background: #27ae60;
            color: white;
            text-decoration: none;
        }
        
        .logo-container {
            margin-bottom: 2rem;
        }
        
        .logo {
            background: #000;
            padding: 1rem 2rem;
            border-radius: 10px;
            display: inline-block;
            margin-bottom: 2rem;
        }
        
        @keyframes pulse {
            0% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.1);
            }
            100% {
                transform: scale(1);
            }
        }
        
        @media (max-width: 768px) {
            .error-code {
                font-size: 6rem;
            }
            
            .error-title {
                font-size: 2rem;
            }
            
            .error-description {
                font-size: 1rem;
            }
            
            .btn-home, .btn-refresh {
                display: block;
                margin: 0.5rem auto;
                width: 200px;
            }
        }
    </style>
</head>
<body>
    <div class="error-container">
        <div class="logo-container">
            <div class="logo">
                @if(file_exists(public_path('images/logo-light.png')))
                    <img src="{{ asset('images/logo-light.png') }}" alt="Logo" style="max-height: 40px;">
                @else
                    <h3 style="margin: 0; color: white;">{{ config('app.name', 'Portal') }}</h3>
                @endif
            </div>
        </div>
        
        <div class="error-icon">
            <i class="fas fa-exclamation-triangle"></i>
        </div>
        
        <div class="error-code">500</div>
        
        <h1 class="error-title">Sunucu Hatası</h1>
        
        <p class="error-description">
            Üzgünüz, beklenmeyen bir hata oluştu. Sunucumuzda bir sorun yaşanıyor ve ekibimiz bu sorunu çözmek için çalışıyor.
            Lütfen birkaç dakika sonra tekrar deneyin.
        </p>
        
        <div class="mt-4">
            <a href="{{ url('/') }}" class="btn-home">
                <i class="fas fa-home me-2"></i>
                Ana Sayfaya Dön
            </a>
            
            <a href="javascript:location.reload()" class="btn-refresh">
                <i class="fas fa-sync-alt me-2"></i>
                Sayfayı Yenile
            </a>
        </div>
    </div>
    
    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>