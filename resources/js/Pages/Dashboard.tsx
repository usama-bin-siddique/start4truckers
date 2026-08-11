import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Users, UserCheck, DollarSign, ClipboardList,
    TrendingUp, AlertCircle, Clock, Activity,
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface MonthlyRevenue { month: string; revenue: number }
interface LeadConversion  { name: string; value: number; color: string }
interface RecentActivity  { id: number; action: string; description: string; causer: string; subject_type: string; created_at: string }
interface TaskItem        { id: number; title: string; priority: string; client: string; due_date: string | null }

interface Stats {
    leads_today: number;
    leads_this_week: number;
    active_clients: number;
    revenue_today: number;
    revenue_month: number;
    revenue_year: number;
    pending_payments: number;
    tasks_due_today: number;
}

interface Props {
    stats: Stats;
    monthly_revenue: MonthlyRevenue[];
    lead_conversion: LeadConversion[];
    recent_activities: RecentActivity[];
    tasks_due_today: TaskItem[];
    auth: { user: { name: string; role: string } };
    [key: string]: unknown;
}

const priorityVariant: Record<string, 'default' | 'warning' | 'destructive' | 'secondary'> = {
    low: 'secondary', medium: 'default', high: 'warning', urgent: 'destructive',
};

const actionLabel: Record<string, string> = {
    lead_created:       'Lead created',
    lead_assigned:      'Lead assigned',
    status_changed:     'Status changed',
    note_added:         'Note added',
    payment_created:    'Payment created',
    payment_updated:    'Payment updated',
    converted_to_client:'Converted to client',
    document_uploaded:  'Document uploaded',
    task_created:       'Task created',
    service_updated:    'Service updated',
    client_created:     'Client created',
};

function fmt(n: number): string {
    if (n >= 1000) return '$' + (n / 1000).toFixed(1) + 'k';
    return '$' + n.toFixed(2);
}

function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
}

export default function Dashboard({ stats, monthly_revenue, lead_conversion, recent_activities, tasks_due_today }: Props) {
    const { auth } = usePage<Props>().props;

    const kpis = [
        { label: "Today's Leads",    value: stats.leads_today,            icon: <Users size={18} className="text-blue-500" />,    bg: 'bg-blue-50' },
        { label: 'This Week Leads',  value: stats.leads_this_week,        icon: <TrendingUp size={18} className="text-indigo-500" />, bg: 'bg-indigo-50' },
        { label: 'Active Clients',   value: stats.active_clients,         icon: <UserCheck size={18} className="text-green-500" />, bg: 'bg-green-50' },
        { label: 'Tasks Due Today',  value: stats.tasks_due_today,        icon: <ClipboardList size={18} className="text-purple-500" />, bg: 'bg-purple-50' },
        { label: 'Revenue Today',    value: fmt(stats.revenue_today),     icon: <DollarSign size={18} className="text-amber-500" />, bg: 'bg-amber-50' },
        { label: 'Revenue (Month)',  value: fmt(stats.revenue_month),     icon: <DollarSign size={18} className="text-orange-500" />, bg: 'bg-orange-50' },
        { label: 'Revenue (Year)',   value: fmt(stats.revenue_year),      icon: <DollarSign size={18} className="text-emerald-500" />, bg: 'bg-emerald-50' },
        { label: 'Pending Payments', value: fmt(stats.pending_payments),  icon: <AlertCircle size={18} className="text-red-500" />, bg: 'bg-red-50' },
    ];

    return (
        <>
            <Head title="Dashboard" />
            <AppLayout title="Dashboard">
                <div className="space-y-6">

                    {/* Greeting */}
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            Good {getGreeting()}, {auth?.user?.name?.split(' ')[0]}
                        </h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Here's your business overview for today.
                        </p>
                    </div>

                    {/* KPI Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {kpis.map((k) => (
                            <Card key={k.label} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide leading-tight">
                                            {k.label}
                                        </p>
                                        <div className={`p-1.5 rounded-md ${k.bg}`}>
                                            {k.icon}
                                        </div>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900">{k.value}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                        {/* Monthly Revenue — 2/3 width */}
                        <Card className="lg:col-span-2">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold text-gray-700">Monthly Revenue (Last 12 Months)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {monthly_revenue.some(m => m.revenue > 0) ? (
                                    <ResponsiveContainer width="100%" height={220}>
                                        <AreaChart data={monthly_revenue} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                                            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
                                                tickFormatter={v => v >= 1000 ? `$${v/1000}k` : `$${v}`} />
                                            <Tooltip formatter={(v: any) => [`$${Number(v).toFixed(2)}`, 'Revenue']} />
                                            <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2}
                                                fill="url(#revenueGrad)" dot={false} activeDot={{ r: 4 }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <EmptyChart label="No revenue data yet" />
                                )}
                            </CardContent>
                        </Card>

                        {/* Lead Conversion Pie — 1/3 width */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold text-gray-700">Lead Conversion (30 days)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {lead_conversion.some(l => l.value > 0) ? (
                                    <ResponsiveContainer width="100%" height={220}>
                                        <PieChart>
                                            <Pie data={lead_conversion} cx="50%" cy="45%" innerRadius={55}
                                                outerRadius={80} paddingAngle={3} dataKey="value">
                                                {lead_conversion.map((entry, i) => (
                                                    <Cell key={i} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(v: any, name: any) => [v, name]} />
                                            <Legend iconType="circle" iconSize={8}
                                                formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <EmptyChart label="No leads in last 30 days" />
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Bottom Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                        {/* Recent Activity */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <Activity size={15} className="text-gray-400" />
                                    Recent Activity
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {recent_activities.length > 0 ? (
                                    <ul className="divide-y divide-gray-50">
                                        {recent_activities.map((a) => (
                                            <li key={a.id} className="flex items-start gap-3 px-6 py-3">
                                                <div className="mt-0.5 h-2 w-2 rounded-full bg-blue-400 shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm text-gray-800 truncate">{a.description}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        {a.causer} · {a.created_at}
                                                    </p>
                                                </div>
                                                <Badge variant="secondary" className="text-[10px] shrink-0">
                                                    {a.subject_type}
                                                </Badge>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="flex items-center justify-center h-32 text-sm text-gray-400 px-6">
                                        No recent activity
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Tasks Due Today */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <Clock size={15} className="text-gray-400" />
                                    Tasks Due Today
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {tasks_due_today.length > 0 ? (
                                    <ul className="divide-y divide-gray-50">
                                        {tasks_due_today.map((t) => (
                                            <li key={t.id} className="flex items-center gap-3 px-6 py-3">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-800 truncate">{t.title}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5 truncate">{t.client}</p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {t.due_date && (
                                                        <span className="text-xs text-gray-400">{t.due_date}</span>
                                                    )}
                                                    <Badge variant={priorityVariant[t.priority] ?? 'secondary'} className="capitalize text-[10px]">
                                                        {t.priority}
                                                    </Badge>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="flex items-center justify-center h-32 text-sm text-gray-400 px-6">
                                        No tasks due today
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                    </div>
                </div>
            </AppLayout>
        </>
    );
}

function EmptyChart({ label }: { label: string }) {
    return (
        <div className="flex items-center justify-center h-[220px] text-sm text-gray-400">
            {label}
        </div>
    );
}
