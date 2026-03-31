@extends('emails.layout')

@section('title', 'Geciken İş Bildirimi')
@section('header', '⚠️ Geciken İş Bildirimi')

@section('content')
<h2 style="color: #495057; margin-bottom: 20px;">Merhaba {{ $user->name }},</h2>

<div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h3 style="margin: 0 0 10px 0; color: #856404;">⚠️ Dikkat: Geciken İş</h3>
    <p style="margin: 0; color: #856404; font-size: 16px;">
        Size atanan bir işin bitiş tarihi geçmiştir. Acil müdahale gerekiyor!
    </p>
</div>

<div class="task-info">
    <h3>📝 İş Detayları</h3>
    
    <div class="task-detail">
        <strong>İş Başlığı:</strong>
        <span>{{ $messageGroup->name }}</span>
    </div>
    
    <div class="task-detail">
        <strong>Bitiş Tarihi:</strong>
        <span style="color: #dc3545; font-weight: bold;">
            📅 {{ $messageGroup->due_date->format('d.m.Y H:i')}}
        </span>
    </div>
    
    <div class="task-detail">
        <strong>Gecikme Süresi:</strong>
        <span style="color: #dc3545; font-weight: bold;">
            🕐 {{ now()->diffInDays($messageGroup->due_date) }} gün
        </span>
    </div>
    
    <div class="task-detail">
        <strong>Mevcut Durum:</strong>
        <span class="status-{{ $messageGroup->status }}">
            @switch($messageGroup->status)
                @case('open') 📂 Açık @break
                @case('in_progress') ⏳ Devam Ediyor @break
                @case('completed') ✅ Tamamlandı @break
                @case('cancelled') ❌ İptal @break
                @default {{ $messageGroup->status }}
            @endswitch
        </span>
    </div>
    
    <div class="task-detail">
        <strong>Öncelik:</strong>
        <span class="priority-{{ $messageGroup->priority }}">
            @switch($messageGroup->priority)
                @case('urgent') 🔥 Acil @break
                @case('high') ⚡ Yüksek @break
                @case('medium') ➖ Orta @break
                @case('low') 🔻 Düşük @break
                @default Belirtilmemiş
            @endswitch
        </span>
    </div>
    
    @if($messageGroup->category)
    <div class="task-detail">
        <strong>Kategori:</strong>
        <span>{{ $messageGroup->category->name }}</span>
    </div>
    @endif
</div>

<div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h4 style="margin: 0 0 10px 0; color: #721c24;">🚨 Acil Eylem Gerekli</h4>
    <ul style="margin: 0; padding-left: 20px; color: #721c24;">
        <li>İşin mevcut durumunu güncelleyin</li>
        <li>Gecikme sebebini belirtin</li>
        <li>Yeni bitiş tarihi belirleyin</li>
        <li>Ekibi bilgilendirin</li>
    </ul>
</div>

<div style="text-align: center; margin: 30px 0;">
    <a href="{{ url('/dashboard?group=' . $messageGroup->id) }}" class="action-button" style="background: linear-gradient(135deg, #dc3545, #c82333);">
        🔗 Acil Müdahale Et
    </a>
</div>

<p style="margin-top: 30px; font-size: 16px; color: #495057;">
    Bu iş için gecikme yaşanması ekip performansını etkileyebilir. Lütfen mümkün olan en kısa sürede gerekli aksiyonları alın.
</p>

<div style="background-color: #d1ecf1; padding: 15px; border-radius: 8px; margin-top: 20px;">
    <h4 style="margin: 0 0 10px 0; color: #0c5460;">💡 Hatırlatma:</h4>
    <p style="margin: 0; font-size: 14px; color: #0c5460;">
        Gelecekte benzer gecikmeleri önlemek için iş yükünüzü ve bitiş tarihlerini daha dikkatli planlayın.
    </p>
</div>
@endsection