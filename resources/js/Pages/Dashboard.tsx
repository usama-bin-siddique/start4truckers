import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Badge } from '@/components/ui/badge';
import {
    Users,
    User,
    DollarSign,
    ClipboardList,
    TrendingUp,
    AlertCircle,
    Activity,
    ArrowUpRight,
} from 'lucide-react';
import {
    AreaChart, Area, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

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

const priorityVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'warning'> = {
    low: 'secondary', medium: 'default', high: 'warning', urgent: 'destructive',
};

function fmt(n: number): string {
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtCompact(n: number): string {
    if (n === 0) return '$0';
    return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
}

export default function Dashboard({ stats, monthly_revenue, lead_conversion, recent_activities, tasks_due_today }: Props) {
    const { auth } = usePage<Props>().props;
    const firstName = auth?.user?.name?.split(' ')[0] ?? 'there';

    return (
        <>
            <Head title="Dashboard" />
            <AppLayout title="Dashboard">
                <div className="space-y-6">

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold tracking-[0.12em] text-amber-600">
                                # LIVE OVERVIEW
                            </span>
                            <h2 className="mt-3 text-[32px] leading-none font-semibold tracking-tight text-gray-950">
                                {getGreeting()}, {firstName}
                            </h2>
                            <p className="mt-2 text-sm text-gray-500">
                                Your pipeline, cash flow, and operations — focused in one view.
                            </p>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <Link
                                href="/leads"
                                className="inline-flex items-center gap-2 rounded-lg bg-[#12141D] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black"
                            >
                                View leads
                                <ArrowUpRight className="h-4 w-4" />
                            </Link>
                            <Link
                                href="/tasks"
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50"
                            >
                                Open tasks
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                        <div className="relative overflow-hidden rounded-2xl bg-[#161616] p-6 text-white xl:col-span-5">
                            <div className="pointer-events-none absolute -top-10 -right-8 h-44 w-44 rounded-full bg-amber-400/25 blur-3xl" />
                            <div className="relative">
                                <div className="flex items-start justify-between">
                                    <p className="text-[11px] font-medium tracking-[0.16em] text-white/55 uppercase">
                                        Revenue this month
                                    </p>
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-yellow-600 shadow-[0_0_16px_rgba(245,158,11,0.35)]">
                                        <DollarSign className="h-5 w-5 text-white" />
                                    </div>
                                </div>
                                <p className="mt-4 text-4xl font-semibold tracking-tight">
                                    {fmt(stats.revenue_month)}
                                </p>
                                <div className="mt-6 grid grid-cols-2 gap-3">
                                    <div className="rounded-xl bg-white/6 px-4 py-3 ring-1 ring-white/8">
                                        <p className="text-xs text-white/45">Today</p>
                                        <p className="mt-1 text-sm font-semibold">{fmt(stats.revenue_today)}</p>
                                    </div>
                                    <div className="rounded-xl bg-white/6 px-4 py-3 ring-1 ring-white/8">
                                        <p className="text-xs text-white/45">Year to date</p>
                                        <p className="mt-1 text-sm font-semibold">{fmt(stats.revenue_year)}</p>
                                    </div>
                                </div>
                                <div className="mt-5 flex items-center gap-2 text-[13px] text-amber-200/80">
                                    <TrendingUp className="h-4 w-4 text-amber-300" />
                                    <span>Month and year figures update as payments clear</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:col-span-7">
                            <StatCard
                                label="Today's leads"
                                value={stats.leads_today}
                                hint={`${stats.leads_this_week} this week`}
                                icon={<Users className="h-4 w-4 text-amber-700" />}
                                iconClass="bg-amber-100"
                            />
                            <StatCard
                                label="Active clients"
                                value={stats.active_clients}
                                hint="Across pipeline"
                                icon={<User className="h-4 w-4 text-sky-700" />}
                                iconClass="bg-sky-100"
                            />
                            <StatCard
                                label="Tasks due"
                                value={stats.tasks_due_today}
                                hint="Needs attention"
                                icon={<ClipboardList className="h-4 w-4 text-orange-700" />}
                                iconClass="bg-orange-100"
                            />
                            <StatCard
                                label="Pending pay"
                                value={fmtCompact(stats.pending_payments)}
                                hint="Outstanding"
                                icon={<AlertCircle className="h-4 w-4 text-red-600" />}
                                iconClass="bg-red-100"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
                            <h3 className="text-base font-semibold text-gray-950">Revenue overview</h3>
                            <p className="mt-0.5 text-sm text-gray-400">Last 12 months</p>
                            {monthly_revenue.some((m) => m.revenue > 0) ? (
                                <div className="mt-4">
                                    <ResponsiveContainer width="100%" height={260}>
                                        <AreaChart data={monthly_revenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.28} />
                                                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                            <XAxis
                                                dataKey="month"
                                                tick={{ fontSize: 12, fill: '#9ca3af' }}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <YAxis
                                                tick={{ fontSize: 12, fill: '#9ca3af' }}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'white',
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '8px',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                                }}
                                                formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Revenue']}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="revenue"
                                                stroke="#F59E0B"
                                                strokeWidth={2.5}
                                                fill="url(#revenueGradient)"
                                                dot={false}
                                                activeDot={{ r: 5, fill: '#F59E0B' }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <EmptyChart label="No revenue data yet" />
                            )}
                        </section>

                        <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
                            <h3 className="text-base font-semibold text-gray-950">Lead conversion</h3>
                            <p className="mt-0.5 text-sm text-gray-400">Last 30 days</p>
                            {lead_conversion.some((l) => l.value > 0) ? (
                                <div className="mt-4">
                                    <ResponsiveContainer width="100%" height={260}>
                                        <PieChart>
                                            <Pie
                                                data={lead_conversion}
                                                cx="50%"
                                                cy="45%"
                                                innerRadius={58}
                                                outerRadius={96}
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                {lead_conversion.map((entry, i) => (
                                                    <Cell key={i} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'white',
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '8px',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                                }}
                                            />
                                            <Legend
                                                iconType="circle"
                                                iconSize={10}
                                                wrapperStyle={{ fontSize: '13px', paddingTop: '12px' }}
                                                formatter={(v) => <span className="text-gray-700">{v}</span>}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <EmptyChart label="No leads in last 30 days" />
                            )}
                        </section>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <section className="rounded-2xl border border-gray-200/80 bg-white shadow-sm">
                            <div className="flex items-center gap-2 px-6 py-5">
                                <Activity className="h-4 w-4 text-gray-400" />
                                <h3 className="text-base font-semibold text-gray-950">Recent activity</h3>
                            </div>
                            <div className="divide-y divide-gray-100 border-t border-gray-100">
                                {recent_activities.length > 0 ? (
                                    recent_activities.slice(0, 5).map((a) => (
                                        <div key={a.id} className="flex items-start gap-3 px-6 py-4">
                                            <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium text-gray-900">{a.description}</p>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <span className="text-xs text-gray-500">{a.causer}</span>
                                                    <span className="text-xs text-gray-300">•</span>
                                                    <span className="text-xs text-gray-400">{a.created_at}</span>
                                                </div>
                                            </div>
                                            <Badge variant="secondary" className="shrink-0 text-[10px]">
                                                {a.subject_type}
                                            </Badge>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex h-44 items-center justify-center text-sm text-gray-400">
                                        No recent activity
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="rounded-2xl border border-gray-200/80 bg-white shadow-sm">
                            <div className="flex items-center justify-between px-6 py-5">
                                <h3 className="text-base font-semibold text-gray-950">Tasks due today</h3>
                                <Link href="/tasks" className="text-sm text-gray-400 transition-colors hover:text-gray-700">
                                    See all
                                </Link>
                            </div>
                            <div className="divide-y divide-gray-100 border-t border-gray-100">
                                {tasks_due_today.length > 0 ? (
                                    tasks_due_today.map((t) => (
                                        <div key={t.id} className="flex items-center gap-3 px-6 py-4">
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium text-gray-900">{t.title}</p>
                                                <p className="mt-0.5 truncate text-xs text-gray-400">{t.client}</p>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-2">
                                                {t.due_date && (
                                                    <span className="text-xs text-gray-400">{t.due_date}</span>
                                                )}
                                                <Badge variant={priorityVariant[t.priority] ?? 'secondary'} className="text-[10px] capitalize">
                                                    {t.priority}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex h-44 items-center justify-center text-sm text-gray-400">
                                        No tasks due today
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </AppLayout>
        </>
    );
}

function StatCard({
    label,
    value,
    hint,
    icon,
    iconClass,
}: {
    label: string;
    value: string | number;
    hint: string;
    icon: React.ReactNode;
    iconClass: string;
}) {
    return (
        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
                <p className="text-sm text-gray-500">{label}</p>
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-full', iconClass)}>
                    {icon}
                </div>
            </div>
            <p className="mt-3 text-[32px] leading-none font-semibold tracking-tight text-gray-950">{value}</p>
            <p className="mt-2 text-sm text-gray-400">{hint}</p>
        </div>
    );
}

function EmptyChart({ label }: { label: string }) {
    return (
        <div className="flex h-[260px] items-center justify-center text-sm text-gray-400">
            {label}
        </div>
    );
}
