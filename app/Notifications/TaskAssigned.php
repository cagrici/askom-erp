<?php

namespace App\Notifications;

use App\Models\MessageGroup;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TaskAssigned extends Notification
{
    use Queueable;

    protected $messageGroup;
    protected $assignedBy;

    public function __construct(MessageGroup $messageGroup, User $assignedBy)
    {
        $this->messageGroup = $messageGroup;
        $this->assignedBy = $assignedBy;
    }

    public function via($notifiable)
    {
        return ['mail', 'database'];
    }

    public function toMail($notifiable)
    {
        $url = url('/dashboard?group=' . $this->messageGroup->id);
        
        return (new MailMessage)
            ->subject('Size Yeni Bir İş Atandı: ' . $this->messageGroup->name)
            ->greeting('Merhaba ' . $notifiable->name . ',')
            ->line($this->assignedBy->name . ' tarafından size yeni bir iş atandı.')
            ->line('**İş Başlığı:** ' . $this->messageGroup->name)
            ->line('**Kategori:** ' . ($this->messageGroup->category->name ?? 'Belirtilmemiş'))
            ->line('**Öncelik:** ' . $this->getPriorityText($this->messageGroup->priority))
            ->when($this->messageGroup->due_date, function ($message) {
                return $message->line('**Bitiş Tarihi:** ' . $this->messageGroup->due_date->format('d.m.Y H:i'));
            })
            ->when($this->messageGroup->description, function ($message) {
                return $message->line('**Açıklama:** ' . $this->messageGroup->description);
            })
            ->action('İşi Görüntüle', $url)
            ->line('Bu işle ilgili mesajlaşmak ve durumu güncellemek için yukarıdaki bağlantıya tıklayın.')
            ->salutation('İyi çalışmalar!');
    }

    public function toDatabase($notifiable)
    {
        return [
            'type' => 'task_assigned',
            'message_group_id' => $this->messageGroup->id,
            'title' => 'Yeni İş Atandı',
            'message' => $this->assignedBy->name . ' tarafından "' . $this->messageGroup->name . '" işi size atandı.',
            'assigned_by' => $this->assignedBy->id,
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
}