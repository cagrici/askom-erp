<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    
    <title>503 - Bakım Modu | {{ config('app.name', 'Portal') }}</title>
    
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
            background: linear-gradient(45deg, #9b59b6, #8e44ad);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 1rem;
            text-shadow: 0 0 30px rgba(155, 89, 182, 0.3);
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
            color: #9b59b6;
            margin-bottom: 2rem;
            animation: bounce 2s infinite;
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
        
        .maintenance-info {
            background: rgba(155, 89, 182, 0.1);
            border: 1px solid rgba(155, 89, 182, 0.3);
            border-radius: 10px;
            padding: 1.5rem;
            margin: 2rem 0;
            color: #ecf0f1;
        }
        
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {
                transform: translateY(0);
            }
            40% {
                transform: translateY(-10px);
            }
            60% {
                transform: translateY(-5px);
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
            
            .btn-home {
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
            <i class="fas fa-tools"></i>
        </div>
        
        <div class="error-code">503</div>
        
        <h1 class="error-title">Bakım Modu</h1>
        
        <p class="error-description">
            Sistemimiz şu anda bakım çalışmaları nedeniyle geçici olarak hizmet dışıdır. 
            Daha iyi bir deneyim sunmak için çalışmalarımız devam ediyor.
        </p>
        
        <div class="maintenance-info">
            <h5><i class="fas fa-info-circle me-2"></i>Bakım Bilgileri</h5>
            <p class="mb-1">• Sistem güncellemeleri yapılıyor</p>
            <p class="mb-1">• Performans iyileştirmeleri uygulanıyor</p>
            <p class="mb-0">• En kısa sürede tekrar hizmete açılacak</p>
        </div>
        
        <div class="mt-4">
            <a href="{{ url('/') }}" class="btn-home">
                <i class="fas fa-sync-alt me-2"></i>
                Tekrar Dene
            </a>
        </div>
        
        <p class="mt-3 text-muted">
            <small>Acil durumlar için sistem yöneticisi ile iletişime geçin.</small>
        </p>
    </div>
    
    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>