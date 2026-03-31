<?php

namespace App\Notifications;

use App\Models\MessageGroup;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TaskOverdue extends Notification implements ShouldQueue
{
    use Queueable;

    protected $messageGroup;

    public function __construct(MessageGroup $messageGroup)
    {
        $this->messageGroup = $messageGroup;
    }

    public function via($notifiable)
    {
        return ['mail', 'database'];
    }

    public function toMail($notifiable)
    {
        $url = url('/dashboard?group=' . $this->messageGroup->id);
        $daysPast = now()->diffInDays($this->messageGroup->due_date);
        
        return (new MailMessage)
            ->subject('⚠️ Geciken İş: ' . $this->messageGroup->name)
            ->greeting('Merhaba ' . $notifiable->name . ',')
            ->line('Size atanan bir işin bitiş tarihi geçmiştir.')
            ->line('**İş Başlığı:** ' . $this->messageGroup->name)
            ->line('**Bitiş Tarihi:** ' . $this->messageGroup->due_date->format('d.m.Y H:i'))
            ->line('**Gecikme:** ' . $daysPast . ' gün')
            ->line('**Öncelik:** ' . $this->getPriorityText($this->messageGroup->priority))
            ->line('**Mevcut Durum:** ' . $this->getStatusText($this->messageGroup->status))
            ->action('İşi Görüntüle', $url)
            ->line('Lütfen işin durumunu güncelleyin veya bitiş tarihini revize edin.')
            ->salutation('Acil müdahale gerekebilir!');
    }

    public function toDatabase($notifiable)
    {
        $daysPast = now()->diffInDays($this->messageGroup->due_date);
        
        return [
            'type' => 'task_overdue',
            'message_group_id' => $this->messageGroup->id,
            'title' => 'Geciken İş',
            'message' => '"' . $this->messageGroup->name . '" işi ' . $daysPast . ' gündür gecikmiş durumda.',
            'days_overdue' => $daysPast,
            'priority' => $this->messageGroup->priority,
            'due_date' => $this->messageGroup->due_date,
            'url' => '/dashboard?group=' . $this->messageGroup->id,
        ];
    }

    protected function getPriorityText($priority)
    {
        return match($priority) {
            'urgent' => '🔥 Acil',
            'high' => '⚡ Yüksek',
            'medium' => '➖ Orta',
            'low' => '🔻 Düşük',
            default => 'Belirtilmemiş'
        };
    }

    protected function getStatusText($status)
    {
        return match($status) {
            'open' => 'Açık',
            'in_progress' => 'Devam Ediyor',
            'completed' => 'Tamamlandı',
            'cancelled' => 'İptal',
            default => 'Belirtilmemiş'
        };
    }
}