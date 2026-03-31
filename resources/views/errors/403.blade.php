<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    
    <title>403 - Erişim Engellendi | {{ config('app.name', 'Portal') }}</title>
    
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
            background: linear-gradient(45deg, #e67e22, #d35400);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 1rem;
            text-shadow: 0 0 30px rgba(230, 126, 34, 0.3);
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
            color: #e67e22;
            margin-bottom: 2rem;
            animation: shake 2s infinite;
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
        
        .btn-back {
            background: transparent;
            border: 2px solid #95a5a6;
            padding: 12px 30px;
            font-size: 1.1rem;
            font-weight: 500;
            border-radius: 50px;
            color: #95a5a6;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s ease;
            margin-left: 1rem;
        }
        
        .btn-back:hover {
            background: #95a5a6;
            color: #2c3e50;
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
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
            20%, 40%, 60%, 80% { transform: translateX(2px); }
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
            
            .btn-home, .btn-back {
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
            <i class="fas fa-ban"></i>
        </div>
        
        <div class="error-code">403</div>
        
        <h1 class="error-title">Erişim Engellendi</h1>
        
        <p class="error-description">
            Bu sayfaya erişim yetkiniz bulunmamaktadır. Bu işlemi gerçekleştirmek için gerekli izinlere sahip değilsiniz.
            @if($exception->getMessage())
                <br><small>{{ $exception->getMessage() }}</small>
            @endif
        </p>
        
        <div class="mt-4">
            <a href="{{ url('/') }}" class="btn-home">
                <i class="fas fa-home me-2"></i>
                Ana Sayfaya Dön
            </a>
            
            <a href="javascript:history.back()" class="btn-back">
                <i class="fas fa-arrow-left me-2"></i>
                Geri Dön
            </a>
        </div>
    </div>
    
    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>