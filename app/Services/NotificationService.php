<?php

namespace App\Services;

use App\Models\CrmNotification;
use App\Models\User;

class NotificationService
{
    // Notification types
    const TYPE_NEW_LEAD          = 'new_lead';
    const TYPE_LEAD_ASSIGNED     = 'lead_assigned';
    const TYPE_TASK_DUE          = 'task_due';
    const TYPE_PAYMENT_RECEIVED  = 'payment_received';
    const TYPE_DOCUMENT_UPLOADED = 'document_uploaded';
    const TYPE_SERVICE_COMPLETED = 'service_completed';
    const TYPE_LEAD_CONVERTED    = 'lead_converted';
    const TYPE_SLA_BREACHED      = 'sla_breached';

    public function notify(int|User $user, string $type, array $data): CrmNotification
    {
        $userId = $user instanceof User ? $user->id : $user;

        return CrmNotification::create([
            'user_id' => $userId,
            'type'    => $type,
            'data'    => $data,
        ]);
    }

    public function notifyMultiple(array $userIds, string $type, array $data): void
    {
        foreach ($userIds as $userId) {
            $this->notify($userId, $type, $data);
        }
    }

    public function markAsRead(int $notificationId): void
    {
        CrmNotification::where('id', $notificationId)->update(['read_at' => now()]);
    }

    public function markAllAsRead(int $userId): void
    {
        CrmNotification::where('user_id', $userId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }

    public function getUnreadCount(int $userId): int
    {
        return CrmNotification::where('user_id', $userId)
            ->whereNull('read_at')
            ->count();
    }

    public function getRecent(int $userId, int $limit = 10): array
    {
        return CrmNotification::where('user_id', $userId)
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn ($n) => [
                'id'         => $n->id,
                'type'       => $n->type,
                'data'       => $n->data,
                'is_read'    => !$n->isUnread(),
                'created_at' => $n->created_at->diffForHumans(),
            ])
            ->toArray();
    }
}
