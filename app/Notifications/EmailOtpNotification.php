<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EmailOtpNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly string $otp) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Your verification code — '.config('app.name'))
            ->greeting('Hello!')
            ->line('Use the code below to verify your email address.')
            ->line('**'.$this->otp.'**')
            ->line('This code expires in 10 minutes.')
            ->line('If you did not create an account, no further action is required.');
    }
}
