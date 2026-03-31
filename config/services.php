<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
        'scheme' => 'https',
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'arvento' => [
        'username' => env('ARVENTO_USERNAME'),
        'password' => env('ARVENTO_PASSWORD'),
        'wsdl_url' => env('ARVENTO_WSDL_URL', 'https://ws.arvento.com/v1/Report.asmx?WSDL'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Logo Tiger ERP Integration
    |--------------------------------------------------------------------------
    |
    | Logo Tiger muhasebe yazilimi entegrasyonu icin ayarlar.
    | Siparis, urun, cari ve fiyat senkronizasyonu icin kullanilir.
    |
    */
    'logo' => [
        'firm_no' => env('LOGO_FIRM_NO', 1),
        'auto_sync_orders' => env('LOGO_AUTO_SYNC_ORDERS', false),
        'auto_sync_products' => env('LOGO_AUTO_SYNC_PRODUCTS', false),
        'sync_on_confirm' => env('LOGO_SYNC_ON_CONFIRM', true),
    ],

];
