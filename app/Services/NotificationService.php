<?php

namespace App\Services;

use App\Models\Client;
use App\Models\CrmNotification;
use App\Models\Task;
use App\Models\User;

class NotificationService
{
    const TYPE_NEW_LEAD             = 'new_lead';
    const TYPE_LEAD_ASSIGNED        = 'lead_assigned';
    const TYPE_TASK_DUE             = 'task_due';
    const TYPE_PAYMENT_RECEIVED     = 'payment_received';
    const TYPE_DOCUMENT_UPLOADED    = 'document_uploaded';
    const TYPE_SERVICE_COMPLETED    = 'service_completed';
    const TYPE_LEAD_CONVERTED       = 'lead_converted';
    const TYPE_SLA_BREACHED         = 'sla_breached';
    const TYPE_COMPLIANCE_DUE       = 'compliance_due';
    const TYPE_COMPLIANCE_STARTED   = 'compliance_started';
    const TYPE_CLIENT_REMINDER      = 'client_reminder';

    public function notify(int|User $user, string $type, array $data): CrmNotification
    {
        $userId = $user instanceof User ? $user->id : $user;

        if (empty($data['url'])) {
            $data['url'] = self::urlFor($type, $data);
        }

        return CrmNotification::create([
            'user_id' => $userId,
            'type'    => $type,
            'data'    => $data,
        ]);
    }

    public function notifyMultiple(array $userIds, string $type, array $data): void
    {
        foreach (array_unique(array_filter($userIds)) as $userId) {
            $this->notify((int) $userId, $type, $data);
        }
    }

    public function notifyClientStakeholders(Client $client, string $type, array $data): void
    {
        $this->notifyMultiple($this->stakeholderIds($client), $type, $data);
    }

    /**
     * @return list<int>
     */
    public function stakeholderIds(Client $client): array
    {
        $ids = User::query()
            ->where('is_active', true)
            ->where('role', 'admin')
            ->pluck('id')
            ->all();

        if ($client->assigned_to) {
            $ids[] = (int) $client->assigned_to;
        }

        return array_values(array_unique($ids));
    }

    public static function urlFor(string $type, array $data): ?string
    {
        $clientId = $data['client_id'] ?? null;
        $leadId   = $data['lead_id'] ?? null;
        $kind     = $data['kind'] ?? $data['task_kind'] ?? null;

        return match ($type) {
            self::TYPE_NEW_LEAD,
            self::TYPE_LEAD_ASSIGNED,
            self::TYPE_SLA_BREACHED => $leadId ? "/leads/{$leadId}" : '/leads',
            self::TYPE_LEAD_CONVERTED => $clientId
                ? "/clients/{$clientId}"
                : ($leadId ? "/leads/{$leadId}" : '/clients'),
            self::TYPE_PAYMENT_RECEIVED => $clientId
                ? "/clients/{$clientId}?tab=payments"
                : '/payments',
            self::TYPE_DOCUMENT_UPLOADED => $clientId
                ? "/clients/{$clientId}?tab=documents"
                : ($leadId ? "/leads/{$leadId}" : '/documents'),
            self::TYPE_SERVICE_COMPLETED => $clientId
                ? "/clients/{$clientId}?tab=operations"
                : '/operations',
            self::TYPE_COMPLIANCE_DUE,
            self::TYPE_COMPLIANCE_STARTED => $clientId
                ? "/clients/{$clientId}?tab=compliance"
                : '/clients',
            self::TYPE_CLIENT_REMINDER => $clientId
                ? "/clients/{$clientId}?tab=overview"
                : '/clients',
            self::TYPE_TASK_DUE => ($kind === Task::KIND_MONTHLY_COMPLIANCE && $clientId)
                ? "/clients/{$clientId}?tab=compliance"
                : ($clientId ? "/clients/{$clientId}?tab=tasks" : '/tasks'),
            default => $data['url'] ?? null,
        };
    }

    public function markAsRead(int $notificationId, ?int $userId = null): void
    {
        CrmNotification::query()
            ->where('id', $notificationId)
            ->when($userId, fn ($q) => $q->where('user_id', $userId))
            ->update(['read_at' => now()]);
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
            ->map(function ($n) {
                $data = $n->data ?? [];
                $url  = $data['url'] ?? self::urlFor($n->type, $data);

                return [
                    'id'         => $n->id,
                    'type'       => $n->type,
                    'data'       => array_merge($data, ['url' => $url]),
                    'url'        => $url,
                    'is_read'    => ! $n->isUnread(),
                    'created_at' => $n->created_at->diffForHumans(),
                ];
            })
            ->toArray();
    }
}
