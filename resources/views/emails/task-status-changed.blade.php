@extends('emails.layout')

@section('title', 'İş Durumu Güncellendi')
@section('header', '🔄 İş Durumu Güncellendi')

@section('content')
<h2 style="color: #495057; margin-bottom: 20px;">Merhaba {{ $user->name }},</h2>

<p style="font-size: 16px; margin-bottom: 20px;">
    <strong>{{ $changedBy->name }}</strong> tarafından bir işin durumu güncellendi.
</p>

<div class="task-info">
    <h3>📝 İş Detayları</h3>
    
    <div class="task-detail">
        <strong>İş Başlığı:</strong>
        <span>{{ $messageGroup->name }}</span>
    </div>
    
    <div class="task-detail">
        <strong>Durum Değişikliği:</strong>
        <span>
            <span class="status-{{ $oldStatus }}">
                @switch($oldStatus)
                    @case('open') 📂 Açık @break
                    @case('in_progress') ⏳ Devam Ediyor @break
                    @case('completed') ✅ Tamamlandı @break
                    @case('cancelled') ❌ İptal @break
                    @default {{ $oldStatus }}
                @endswitch
            </span>
            →
            <span class="status-{{ $newStatus }}">
                @switch($newStatus)
                    @case('open') 📂 Açık @break
                    @case('in_progress') ⏳ Devam Ediyor @break
                    @case('completed') ✅ Tamamlandı @break
                    @case('cancelled') ❌ İptal @break
                    @default {{ $newStatus }}
                @endswitch
            </span>
        </span>
    </div>
    
    @if($messageGroup->assigned_to)
    <div class="task-detail">
        <strong>Atanan:</strong>
        <span>👤 {{ $messageGroup->assignedUser->name }}</span>
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
    
    @if($completionNote && $newStatus === 'completed')
    <div class="task-detail">
        <strong>Tamamlanma Notu:</strong>
        <span>{{ $completionNote }}</span>
    </div>
    @endif
</div>

@if($newStatus === 'completed')
<div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
    <h3 style="margin: 0 0 10px 0; color: #2e7d32;">🎉 Tebrikler!</h3>
    <p style="margin: 0; color: #388e3c; font-size: 16px;">
        İş başarıyla tamamlandı. Ekip çalışmasının güzel bir örneği!
    </p>
</div>
@elseif($newStatus === 'cancelled')
<div style="background-color: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
    <h3 style="margin: 0 0 10px 0; color: #f57c00;">⚠️ İş İptal Edildi</h3>
    <p style="margin: 0; color: #ef6c00; font-size: 16px;">
        Bu iş iptal edilmiştir. Detaylar için konuşmayı kontrol edin.
    </p>
</div>
@elseif($newStatus === 'in_progress')
<div style="background-color: #fff8e1; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
    <h3 style="margin: 0 0 10px 0; color: #f9a825;">🚀 İş Başladı</h3>
    <p style="margin: 0; color: #f57f17; font-size: 16px;">
        Artık bu iş üzerinde aktif olarak çalışılıyor.
    </p>
</div>
@endif

<div style="text-align: center; margin: 30px 0;">
    <a href="{{ url('/dashboard?group=' . $messageGroup->id) }}" class="action-button">
        📱 İşi Görüntüle
    </a>
</div>

<p style="margin-top: 30px; font-size: 16px; color: #495057;">
    Detaylı bilgi için konuşma geçmişini kontrol edebilirsiniz.
</p>
@endsection