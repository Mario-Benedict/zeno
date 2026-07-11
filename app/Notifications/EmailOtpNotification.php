<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EmailOtpNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly string $otp) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $name = trim((string) ($notifiable->name ?? ''));

        return (new MailMessage)
            ->subject('Your '.config('app.name').' verification code')
            ->greeting($name === '' ? 'Hi,' : "Hi {$name},")
            ->line('Enter this code to finish setting up your account:')
            ->line('**'.$this->otp.'**')
            ->line('It expires in 10 minutes.')
            ->line("If you didn't sign up for ".config('app.name').', you can ignore this email.');
    }
}
