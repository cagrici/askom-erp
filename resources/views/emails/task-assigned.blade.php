@extends('emails.layout')

@section('title', 'Yeni İş Atandı')
@section('header', '📋 Yeni İş Atandı')

@section('content')
<h2 style="color: #495057; margin-bottom: 20px;">Merhaba {{ $user->name }},</h2>

<p style="font-size: 16px; margin-bottom: 20px;">
    <strong>{{ $assignedBy->name }}</strong> tarafından size yeni bir iş atandı.
</p>

<div class="task-info">
    <h3>📝 İş Detayları</h3>
    
    <div class="task-detail">
        <strong>İş Başlığı:</strong>
        <span>{{ $messageGroup->name }}</span>
    </div>
    
    @if($messageGroup->category)
    <div class="task-detail">
        <strong>Kategori:</strong>
        <span>{{ $messageGroup->category->name }}</span>
    </div>
    @endif
    
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
    
    @if($messageGroup->due_date)
    <div class="task-detail">
        <strong>Bitiş Tarihi:</strong>
        <span style="color: {{ $messageGroup->isOverdue() ? '#dc3545' : '#495057' }};">
            📅 {{ $messageGroup->due_date->format('d.m.Y H:i') }}
            @if($messageGroup->isOverdue())
                <small style="color: #dc3545;">(GECİKMİŞ)</small>
            @endif
        </span>
    </div>
    @endif
    
    @if($messageGroup->description)
    <div class="task-detail">
        <strong>Açıklama:</strong>
        <span>{{ $messageGroup->description }}</span>
    </div>
    @endif
</div>

<p style="margin: 20px 0;">
    Bu işle ilgili mesajlaşmak ve durumu güncellemek için aşağıdaki butona tıklayın:
</p>

<div style="text-align: center;">
    <a href="{{ url('/dashboard?group=' . $messageGroup->id) }}" class="action-button">
        🔗 İşi Görüntüle ve Yanıtla
    </a>
</div>

<div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 30px;">
    <h4 style="margin: 0 0 10px 0; color: #1976d2;">💡 İpucu:</h4>
    <p style="margin: 0; font-size: 14px; color: #455a64;">
        İş durumunu "Devam Ediyor" olarak değiştirmeyi unutmayın ve ilerleme hakkında ekibi bilgilendirin.
    </p>
</div>

<p style="margin-top: 30px; font-size: 16px; color: #495057;">
    İyi çalışmalar! 🚀
</p>
@endsection