<?php

namespace App\Notifications;

use App\Models\MessageGroup;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TaskStatusChanged extends Notification
{
    use Queueable;

    protected $messageGroup;
    protected $changedBy;
    protected $oldStatus;
    protected $newStatus;
    protected $completionNote;

    public function __construct(MessageGroup $messageGroup, User $changedBy, string $oldStatus, string $newStatus, ?string $completionNote = null)
    {
        $this->messageGroup = $messageGroup;
        $this->changedBy = $changedBy;
        $this->oldStatus = $oldStatus;
        $this->newStatus = $newStatus;
        $this->completionNote = $completionNote;
    }

    public function via($notifiable)
    {
        return ['mail', 'database'];
    }

    public function toMail($notifiable)
    {
        $url = url('/dashboard?group=' . $this->messageGroup->id);
        $statusText = $this->getStatusText($this->newStatus);
        
        $message = (new MailMessage)
            ->subject('İş Durumu Güncellendi: ' . $this->messageGroup->name)
            ->greeting('Merhaba ' . $notifiable->name . ',')
            ->line($this->changedBy->name . ' tarafından bir işin durumu güncellendi.')
            ->line('**İş Başlığı:** ' . $this->messageGroup->name)
            ->line('**Eski Durum:** ' . $this->getStatusText($this->oldStatus))
            ->line('**Yeni Durum:** ' . $statusText);

        if ($this->newStatus === 'completed' && $this->completionNote) {
            $message->line('**Tamamlanma Notu:** ' . $this->completionNote);
        }

        if ($this->newStatus === 'completed') {
            $message->line('🎉 Tebrikler! İş başarıyla tamamlandı.');
        } elseif ($this->newStatus === 'cancelled') {
            $message->line('⚠️ İş iptal edildi.');
        }

        return $message
            ->action('İşi Görüntüle', $url)
            ->line('Detayları görmek için yukarıdaki bağlantıya tıklayın.')
            ->salutation('İyi çalışmalar!');
    }

    public function toDatabase($notifiable)
    {
        return [
            'type' => 'task_status_changed',
            'message_group_id' => $this->messageGroup->id,
            'title' => 'İş Durumu Güncellendi',
            'message' => '"' . $this->messageGroup->name . '" işinin durumu "' . $this->getStatusText($this->oldStatus) . '" → "' . $this->getStatusText($this->newStatus) . '" olarak değiştirildi.',
            'changed_by' => $this->changedBy->id,
            'old_status' => $this->oldStatus,
            'new_status' => $this->newStatus,
            'completion_note' => $this->completionNote,
            'url' => '/dashboard?group=' . $this->messageGroup->id,
        ];
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