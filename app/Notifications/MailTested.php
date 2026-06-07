<?php

namespace Realm\Notifications;

use Realm\Models\User;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class MailTested extends Notification
{
    public function __construct(private User $user)
    {
    }

    public function via(): array
    {
        return ['mail'];
    }

    public function toMail(): MailMessage
    {
        return (new MailMessage())
            ->subject('Realm Test Message')
            ->greeting('Hello ' . $this->user->name . '!')
            ->line('This is a test of the Realm mail system. You\'re good to go!');
    }
}
