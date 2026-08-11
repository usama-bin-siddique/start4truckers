import React from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Check, CheckCheck, Users, DollarSign, ClipboardCheck, FileText, UserCheck, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notification {
    id: number;
    type: string;
    data: Record<string, any>;
    is_read: boolean;
    created_at: string;
}

interface Props {
    notifications: Notification[];
    unread_count: number;
}

const typeConfig: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
    new_lead:          { icon: <Users size={16} />,         label: 'New Lead',          color: 'text-blue-600',   bg: 'bg-blue-50' },
    lead_assigned:     { icon: <UserCheck size={16} />,     label: 'Lead Assigned',     color: 'text-indigo-600', bg: 'bg-indigo-50' },
    task_due:          { icon: <Bell size={16} />,          label: 'Task Due',          color: 'text-amber-600',  bg: 'bg-amber-50' },
    payment_received:  { icon: <DollarSign size={16} />,    label: 'Payment Received',  color: 'text-green-600',  bg: 'bg-green-50' },
    document_uploaded: { icon: <FileText size={16} />,      label: 'Document Uploaded', color: 'text-purple-600', bg: 'bg-purple-50' },
    service_completed: { icon: <ClipboardCheck size={16}/>, label: 'Service Completed', color: 'text-teal-600',   bg: 'bg-teal-50' },
    lead_converted:    { icon: <TrendingUp size={16} />,    label: 'Lead Converted',    color: 'text-emerald-600',bg: 'bg-emerald-50' },
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
        default:
            return data.message || 'New notification';
    }
}

export default function NotificationsIndex({ notifications, unread_count }: Props) {
    function markAsRead(id: number) {
        router.post(`/notifications/${id}/read`, {}, { preserveState: true });
    }

    function markAllAsRead() {
        router.post('/notifications/mark-all-read');
    }

    return (
        <>
            <Head title="Notifications" />
            <AppLayout title="Notifications">
                <div className="space-y-4">

                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Your Notifications</h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {unread_count > 0 ? `${unread_count} unread notification${unread_count > 1 ? 's' : ''}` : 'All caught up!'}
                            </p>
                        </div>
                        {unread_count > 0 && (
                            <Button size="sm" variant="outline" onClick={markAllAsRead}>
                                <CheckCheck size={14} /> Mark all read
                            </Button>
                        )}
                    </div>

                    {/* Notifications List */}
                    {notifications.length === 0 ? (
                        <Card>
                            <CardContent className="py-16 text-center">
                                <BellOff size={48} className="mx-auto text-gray-300 mb-3" />
                                <p className="text-gray-400">No notifications yet</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-2">
                            {notifications.map(notif => {
                                const config = typeConfig[notif.type] || typeConfig.new_lead;
                                return (
                                    <Card
                                        key={notif.id}
                                        className={cn(
                                            'transition-all cursor-pointer hover:shadow-md',
                                            !notif.is_read && 'border-l-4 border-l-blue-500 bg-blue-50/30'
                                        )}
                                        onClick={() => !notif.is_read && markAsRead(notif.id)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-3">
                                                <div className={cn('p-2 rounded-lg shrink-0', config.bg)}>
                                                    <span className={config.color}>{config.icon}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <Badge variant="secondary" className="text-[10px] mb-1">
                                                                {config.label}
                                                            </Badge>
                                                            <p className="text-sm text-gray-800">
                                                                {getNotificationMessage(notif)}
                                                            </p>
                                                            <p className="text-xs text-gray-400 mt-1">{notif.created_at}</p>
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
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </AppLayout>
        </>
    );
}
