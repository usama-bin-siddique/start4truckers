import React from 'react';
import {
    UserPlus, RefreshCw, StickyNote, DollarSign,
    UserCheck, Upload, CheckSquare, Settings, User, Zap, Clock, Phone,
    Trophy, Ban, Briefcase, Link2,
} from 'lucide-react';

interface Activity {
    id: number;
    action: string;
    description: string;
    causer: string;
    old_value?: Record<string, string> | null;
    new_value?: Record<string, string> | null;
    created_at: string;
}

const actionIcon: Record<string, React.ReactNode> = {
    lead_created:       <UserPlus size={13} />,
    lead_assigned:      <User size={13} />,
    status_changed:     <RefreshCw size={13} />,
    note_added:         <StickyNote size={13} />,
    payment_created:    <DollarSign size={13} />,
    payment_updated:    <DollarSign size={13} />,
    sla_started:        <Clock size={13} />,
    sla_met:            <CheckSquare size={13} />,
    sla_breached:       <Zap size={13} />,
    call_logged:        <Phone size={13} />,
    follow_up:          <RefreshCw size={13} />,
    invoice_created:    <DollarSign size={13} />,
    converted_to_client:<UserCheck size={13} />,
    document_uploaded:  <Upload size={13} />,
    task_created:       <CheckSquare size={13} />,
    service_updated:    <Settings size={13} />,
    service_assigned:   <Briefcase size={13} />,
    client_created:     <Zap size={13} />,
    lead_linked:        <Link2 size={13} />,
};

const actionColor: Record<string, string> = {
    lead_created:       'bg-blue-100 text-blue-600',
    lead_assigned:      'bg-indigo-100 text-indigo-600',
    status_changed:     'bg-amber-100 text-amber-600',
    note_added:         'bg-gray-100 text-gray-600',
    payment_created:    'bg-green-100 text-green-600',
    payment_updated:    'bg-green-100 text-green-600',
    sla_started:        'bg-amber-100 text-amber-700',
    sla_met:            'bg-emerald-100 text-emerald-700',
    sla_breached:       'bg-red-100 text-red-600',
    call_logged:        'bg-sky-100 text-sky-700',
    follow_up:          'bg-orange-100 text-orange-600',
    invoice_created:    'bg-green-100 text-green-700',
    converted_to_client:'bg-purple-100 text-purple-600',
    document_uploaded:  'bg-teal-100 text-teal-600',
    task_created:       'bg-orange-100 text-orange-600',
    service_updated:    'bg-sky-100 text-sky-600',
    service_assigned:   'bg-sky-100 text-sky-700',
    client_created:     'bg-violet-100 text-violet-600',
    lead_linked:        'bg-amber-100 text-amber-700',
};

function statusFromActivity(a: Activity): string | null {
    const fromValue = a.new_value?.status;
    if (fromValue) return fromValue;
    const match = a.description.match(/to ["']([^"']+)["']/i);
    return match?.[1] ?? null;
}

function iconFor(a: Activity): React.ReactNode {
    if (a.action === 'status_changed' || a.action === 'converted_to_client') {
        const status = statusFromActivity(a);
        if (status === 'won') return <Trophy size={13} />;
        if (status === 'lost') return <Ban size={13} />;
    }
    return actionIcon[a.action] ?? <Zap size={13} />;
}

function colorFor(a: Activity): string {
    if (a.action === 'status_changed' || a.action === 'converted_to_client') {
        const status = statusFromActivity(a);
        if (status === 'won') return 'bg-emerald-100 text-emerald-700';
        if (status === 'lost') return 'bg-red-100 text-red-600';
    }
    return actionColor[a.action] ?? 'bg-gray-100 text-gray-500';
}

export default function ActivityTimeline({ activities }: { activities: Activity[] }) {
    if (!activities.length) {
        return (
            <div className="flex items-center justify-center h-24 text-sm text-gray-400">
                No activity recorded yet
            </div>
        );
    }

    return (
        <ol className="relative border-l border-gray-200 ml-3 space-y-0">
            {activities.map((a, idx) => (
                <li key={a.id} className="mb-6 ml-5">
                    <span className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white ${colorFor(a)}`}>
                        {iconFor(a)}
                    </span>
                    <div className="rounded-md border border-gray-100 bg-white p-3 shadow-sm">
                        <p className="text-sm text-gray-800">{a.description}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs font-medium text-gray-500">{a.causer}</span>
                            <span className="text-gray-300">·</span>
                            <span className="text-xs text-gray-400">{a.created_at}</span>
                        </div>
                    </div>
                </li>
            ))}
        </ol>
    );
}
