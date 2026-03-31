<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Portal Bildirimi')</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8f9fa;
            margin: 0;
            padding: 0;
        }
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .email-header {
            background: linear-gradient(135deg, #007bff, #0056b3);
            color: white;
            padding: 20px;
            text-align: center;
        }
        .email-header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .company-logo {
            width: 40px;
            height: 40px;
            margin-bottom: 10px;
        }
        .email-body {
            padding: 30px;
        }
        .task-info {
            background-color: #f8f9fa;
            border-left: 4px solid #007bff;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .task-info h3 {
            margin: 0 0 10px 0;
            color: #495057;
            font-size: 18px;
        }
        .task-detail {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            padding: 5px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .task-detail:last-child {
            border-bottom: none;
        }
        .task-detail strong {
            color: #495057;
            min-width: 120px;
        }
        .priority-urgent { color: #dc3545; font-weight: bold; }
        .priority-high { color: #fd7e14; font-weight: bold; }
        .priority-medium { color: #6f42c1; }
        .priority-low { color: #6c757d; }
        .status-completed { color: #28a745; font-weight: bold; }
        .status-in-progress { color: #ffc107; font-weight: bold; }
        .status-open { color: #17a2b8; }
        .status-cancelled { color: #6c757d; }
        .action-button {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #007bff, #0056b3);
            color: white;
            text-decoration: none;
            border-radius: 25px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
            transition: all 0.3s ease;
        }
        .action-button:hover {
            background: linear-gradient(135deg, #0056b3, #004085);
            transform: translateY(-2px);
        }
        .email-footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e9ecef;
            color: #6c757d;
            font-size: 14px;
        }
        .separator {
            height: 2px;
            background: linear-gradient(90deg, #007bff, #28a745, #ffc107, #dc3545);
            margin: 20px 0;
        }
        @media (max-width: 600px) {
            .email-container {
                margin: 10px;
                border-radius: 0;
            }
            .email-body {
                padding: 20px;
            }
            .task-detail {
                flex-direction: column;
            }
            .task-detail strong {
                margin-bottom: 5px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <div class="company-logo">📋</div>
            <h1>@yield('header', 'Portal Bildirimi')</h1>
        </div>
        
        <div class="email-body">
            @yield('content')
        </div>
        
        <div class="email-footer">
            <p>Bu e-posta otomatik olarak gönderilmiştir.</p>
            <p>Portal sistemi tarafından oluşturulmuştur.</p>
            <div class="separator"></div>
            <p><small>© {{ date('Y') }} Şirket Adı. Tüm hakları saklıdır.</small></p>
        </div>
    </div>
</body>
</html>