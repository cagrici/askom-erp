<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword as BaseResetPasswordNotification;
use Illuminate\Notifications\Messages\MailMessage;

class CustomResetPasswordNotification extends BaseResetPasswordNotification
{
    /**
     * Build the mail representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        $url = url(route('password.reset', [
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ], false));

        // Debug log
        \Log::info('Password reset email being sent', [
            'email' => $notifiable->getEmailForPasswordReset(),
            'url' => $url,
            'token' => $this->token
        ]);

        return (new MailMessage)
            ->subject('Şifre Sıfırlama Talebi - ' . config('app.name'))
            ->view('emails.auth.reset-password', [
                'user' => $notifiable,
                'url' => $url,
                'token' => $this->token,
            ]);
    }
}
