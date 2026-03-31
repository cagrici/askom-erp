<?php

namespace App\Notifications;

use App\Models\MessageGroup;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewTaskCreated extends Notification implements ShouldQueue
{
    use Queueable;

    protected $messageGroup;
    protected $createdBy;

    public function __construct(MessageGroup $messageGroup, User $createdBy)
    {
        $this->messageGroup = $messageGroup;
        $this->createdBy = $createdBy;
    }

    public function via($notifiable)
    {
        return ['mail', 'database'];
    }

    public function toMail($notifiable)
    {
        $url = url('/dashboard?group=' . $this->messageGroup->id);
        
        return (new MailMessage)
            ->subject('Yeni İş Talebi: ' . $this->messageGroup->name)
            ->greeting('Merhaba ' . $notifiable->name . ',')
            ->line($this->createdBy->name . ' tarafından yeni bir iş talebi oluşturuldu ve siz bu işin katılımcısı olarak eklendi.')
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
            ->line('İşle ilgili konuşmaya katılmak için yukarıdaki bağlantıya tıklayın.')
            ->salutation('İyi çalışmalar!');
    }

    public function toDatabase($notifiable)
    {
        return [
            'type' => 'new_task_created',
            'message_group_id' => $this->messageGroup->id,
            'title' => 'Yeni İş Talebi',
            'message' => $this->createdBy->name . ' tarafından "' . $this->messageGroup->name . '" adlı yeni bir iş talebi oluşturuldu.',
            'created_by' => $this->createdBy->id,
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