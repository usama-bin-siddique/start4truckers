import React from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Bell, BellOff, Check, CheckCheck, Users, DollarSign, ClipboardCheck,
    FileText, UserCheck, TrendingUp, Inbox,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notification {
    id: number;
    type: string;
    data: Record<string, unknown>;
    is_read: boolean;
    created_at: string;
}

interface Props {
    notifications: Notification[];
    unread_count: number;
}

const typeConfig: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
    new_lead:          { icon: <Users size={16} />,          label: 'New Lead',          color: 'text-sky-700',     bg: 'bg-sky-100' },
    lead_assigned:     { icon: <UserCheck size={16} />,      label: 'Lead Assigned',     color: 'text-indigo-700',  bg: 'bg-indigo-100' },
    task_due:          { icon: <Bell size={16} />,           label: 'Task Due',          color: 'text-amber-700',   bg: 'bg-amber-100' },
    payment_received:  { icon: <DollarSign size={16} />,     label: 'Payment Received',  color: 'text-emerald-700', bg: 'bg-emerald-100' },
    document_uploaded: { icon: <FileText size={16} />,       label: 'Document Uploaded', color: 'text-violet-700',  bg: 'bg-violet-100' },
    service_completed: { icon: <ClipboardCheck size={16} />, label: 'Service Completed', color: 'text-teal-700',    bg: 'bg-teal-100' },
    lead_converted:    { icon: <TrendingUp size={16} />,     label: 'Lead Converted',    color: 'text-emerald-700', bg: 'bg-emerald-100' },
    sla_breached:      { icon: <Bell size={16} />,           label: 'SLA Missed',        color: 'text-red-700',     bg: 'bg-red-100' },
};

function getNotificationMessage(notification: Notification): string {
    const { type, data } = notification;

    switch (type) {
        case 'new_lead':
            return `New lead: ${data.lead_name || 'Unknown'}`;
        case 'lead_assigned':
            return `You've been assigned lead: ${data.lead_name || 'Unknown'}`;
        case 'task_due':
            return `Task due: ${data.task_title || 'Untitled'}`;
        case 'payment_received':
            return `Payment received: $${data.amount || '0'} from ${data.client_name || 'client'}`;
        case 'document_uploaded':
            return `Document uploaded for ${data.client_name || 'client'}: ${data.filename || 'document'}`;
        case 'service_completed':
            return `Service completed for ${data.client_name || 'client'}: ${data.service_name || 'service'}`;
        case 'lead_converted':
            return `Lead converted to client: ${data.client_name || 'Unknown'}`;
        case 'sla_breached':
            return `SLA missed for lead: ${data.lead_name || 'Unknown'}. No action was taken in time.`;
        default:
            return (data.message as string) || 'New notification';
    }
}

export default function NotificationsIndex({ notifications, unread_count }: Props) {
    const readCount = notifications.filter((n) => n.is_read).length;

    function markAsRead(id: number) {
        router.post(`/notifications/${id}/read`, {}, { preserveState: true });
    }

    function markAllAsRead() {
        router.post('/notifications/mark-all-read');
    }

    const kpis = [
        { label: 'Unread', value: unread_count, icon: <Bell className="h-4 w-4 text-amber-700" />, iconClass: 'bg-amber-100' },
        { label: 'Read', value: readCount, icon: <CheckCheck className="h-4 w-4 text-emerald-700" />, iconClass: 'bg-emerald-100' },
        { label: 'Total', value: notifications.length, icon: <Inbox className="h-4 w-4 text-sky-700" />, iconClass: 'bg-sky-100' },
    ];

    return (
        <>
            <Head title="Notifications" />
            <AppLayout title="Notifications">
                <div className="space-y-6">

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold tracking-[0.12em] text-amber-600">
                                <Bell className="h-3 w-3" />
                                SYSTEM
                            </span>
                            <h2 className="mt-3 text-[32px] leading-none font-semibold tracking-tight text-gray-950">
                                Notifications
                            </h2>
                            <p className="mt-2 text-sm text-gray-500">
                                {unread_count > 0
                                    ? `${unread_count} unread notification${unread_count > 1 ? 's' : ''}`
                                    : 'All caught up — nothing new to review.'}
                            </p>
                        </div>
                        {unread_count > 0 && (
                            <button
                                type="button"
                                onClick={markAllAsRead}
                                className="inline-flex items-center gap-2 rounded-lg bg-[#12141D] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black"
                            >
                                <CheckCheck className="h-4 w-4" />
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {kpis.map((k) => (
                            <div key={k.label} className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
                                <div className="flex items-start justify-between">
                                    <p className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">{k.label}</p>
                                    <div className={cn('flex h-9 w-9 items-center justify-center rounded-full', k.iconClass)}>
                                        {k.icon}
                                    </div>
                                </div>
                                <p className="mt-4 text-[32px] leading-none font-semibold tracking-tight text-gray-950">{k.value}</p>
                            </div>
                        ))}
                    </div>

                    <section className="rounded-2xl border border-gray-200/80 bg-white shadow-sm">
                        <div className="flex items-center justify-between px-5 py-4">
                            <p className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Recent</p>
                            <p className="text-sm text-gray-400">{notifications.length} notifications</p>
                        </div>

                        {notifications.length === 0 ? (
                            <div className="flex h-56 flex-col items-center justify-center border-t border-gray-100 text-sm text-gray-400">
                                <BellOff className="mb-3 h-10 w-10 text-gray-300" />
                                No notifications found
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 border-t border-gray-100">
                                {notifications.map((notif) => {
                                    const config = typeConfig[notif.type] || typeConfig.new_lead;
                                    return (
                                        <div
                                            key={notif.id}
                                            className={cn(
                                                'flex cursor-pointer items-start gap-3 px-5 py-4 transition-colors hover:bg-gray-50/80',
                                                !notif.is_read && 'border-l-[3px] border-l-[#C4A035] bg-amber-50/40'
                                            )}
                                            onClick={() => !notif.is_read && markAsRead(notif.id)}
                                        >
                                            <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', config.bg)}>
                                                <span className={config.color}>{config.icon}</span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <Badge variant="secondary" className="mb-1 text-[10px]">
                                                            {config.label}
                                                        </Badge>
                                                        <p className="text-sm text-gray-800">{getNotificationMessage(notif)}</p>
                                                        <p className="mt-1 text-xs text-gray-400">{notif.created_at}</p>
                                                    </div>
                                                    {!notif.is_read && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 shrink-0"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                markAsRead(notif.id);
                                                            }}
                                                        >
                                                            <Check size={14} />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </div>
            </AppLayout>
        </>
    );
}
