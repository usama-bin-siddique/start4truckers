<?php

namespace App\Contracts;

interface SendsPushNotifications
{
    public function send(int $userId, string $title, string $body, ?string $url, int $notificationId): void;
}
