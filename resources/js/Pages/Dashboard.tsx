import React, { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Users, UserCheck, DollarSign, ClipboardList,
    TrendingUp, AlertCircle, Clock, Activity, ArrowUp, ArrowDown, X,
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
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

const priorityVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
    low: 'secondary', medium: 'default', high: 'destructive', urgent: 'destructive',
};

function fmt(n: number): string {
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
}

export default function Dashboard({ stats, monthly_revenue, lead_conversion, recent_activities, tasks_due_today }: Props) {
    const { auth } = usePage<Props>().props;
    const [showGreeting, setShowGreeting] = useState(true);

    // Auto-hide greeting after 10 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowGreeting(false);
        }, 10000);

        return () => clearTimeout(timer);
    }, []);

    const kpis = [
        { 
            label: "Today's Leads", 
            value: stats.leads_today, 
            icon: <Users className="h-5 w-5" />, 
            color: 'blue',
            bgColor: 'bg-blue-50',
            iconColor: 'text-blue-600',
            trend: '+12%',
            trendUp: true
        },
        { 
            label: 'This Week', 
            value: stats.leads_this_week, 
            icon: <TrendingUp className="h-5 w-5" />, 
            color: 'indigo',
            bgColor: 'bg-indigo-50',
            iconColor: 'text-indigo-600',
            trend: '+8%',
            trendUp: true
        },
        { 
            label: 'Active Clients', 
            value: stats.active_clients, 
            icon: <UserCheck className="h-5 w-5" />, 
            color: 'green',
            bgColor: 'bg-green-50',
            iconColor: 'text-green-600',
            trend: '+5%',
            trendUp: true
        },
        { 
            label: 'Tasks Due', 
            value: stats.tasks_due_today, 
            icon: <ClipboardList className="h-5 w-5" />, 
            color: 'purple',
            bgColor: 'bg-purple-50',
            iconColor: 'text-purple-600',
            trend: '-3%',
            trendUp: false
        },
        { 
            label: 'Revenue Today', 
            value: fmt(stats.revenue_today), 
            icon: <DollarSign className="h-5 w-5" />, 
            color: 'emerald',
            bgColor: 'bg-emerald-50',
            iconColor: 'text-emerald-600',
            trend: '+15%',
            trendUp: true
        },
        { 
            label: 'Revenue (Month)', 
            value: fmt(stats.revenue_month), 
            icon: <DollarSign className="h-5 w-5" />, 
            color: 'orange',
            bgColor: 'bg-orange-50',
            iconColor: 'text-orange-600',
            trend: '+22%',
            trendUp: true
        },
        { 
            label: 'Revenue (Year)', 
            value: fmt(stats.revenue_year), 
            icon: <DollarSign className="h-5 w-5" />, 
            color: 'cyan',
            bgColor: 'bg-cyan-50',
            iconColor: 'text-cyan-600',
            trend: '+18%',
            trendUp: true
        },
        { 
            label: 'Pending Payments', 
            value: fmt(stats.pending_payments), 
            icon: <AlertCircle className="h-5 w-5" />, 
            color: 'red',
            bgColor: 'bg-red-50',
            iconColor: 'text-red-600',
            trend: '-5%',
            trendUp: false
        },
    ];

    return (
        <>
            <Head title="Dashboard" />
            <AppLayout title="Dashboard">
                <div className="space-y-6">

                    {/* Greeting Section */}
                    {showGreeting && (
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-white shadow-lg relative animate-in fade-in slide-in-from-top-2 duration-300">
                            <button
                                onClick={() => setShowGreeting(false)}
                                className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                                aria-label="Close greeting"
                            >
                                <X className="h-5 w-5" />
                            </button>
                            <h2 className="text-2xl font-bold">
                                {getGreeting()}, {auth?.user?.name?.split(' ')[0]} 👋
                            </h2>
                            <p className="text-blue-100 mt-2">
                                Here's what's happening with your business today.
                            </p>
                        </div>
                    )}

                    {/* KPI Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {kpis.map((k) => (
                            <Card key={k.label} className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-200">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-600">{k.label}</p>
                                            <p className="text-2xl font-bold text-gray-900 mt-2">{typeof k.value === 'number' ? k.value : k.value}</p>
                                            <div className="flex items-center mt-2">
                                                <span className={cn(
                                                    "inline-flex items-center gap-1 text-xs font-medium",
                                                    k.trendUp ? "text-green-600" : "text-red-600"
                                                )}>
                                                    {k.trendUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                                    {k.trend}
                                                </span>
                                                <span className="text-xs text-gray-500 ml-2">vs last week</span>
                                            </div>
                                        </div>
                                        <div className={cn('p-3 rounded-xl', k.bgColor)}>
                                            <span className={k.iconColor}>{k.icon}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Monthly Revenue Chart - Takes 2/3 width */}
                        <Card className="lg:col-span-2 bg-white border-0 shadow-sm">
                            <div className="p-6 border-b border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-900">Revenue Overview</h3>
                                <p className="text-sm text-gray-500 mt-1">Last 12 months performance</p>
                            </div>
                            <div className="p-6">
                                {monthly_revenue.some(m => m.revenue > 0) ? (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <AreaChart data={monthly_revenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                            <XAxis 
                                                dataKey="month" 
                                                tick={{ fontSize: 12, fill: '#6b7280' }} 
                                                tickLine={false} 
                                                axisLine={false} 
                                            />
                                            <YAxis 
                                                tick={{ fontSize: 12, fill: '#6b7280' }} 
                                                tickLine={false} 
                                                axisLine={false}
                                                tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} 
                                            />
                                            <Tooltip 
                                                contentStyle={{ 
                                                    backgroundColor: 'white', 
                                                    border: '1px solid #e5e7eb', 
                                                    borderRadius: '8px',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                }}
                                                formatter={(v: any) => [`$${Number(v).toFixed(2)}`, 'Revenue']} 
                                            />
                                            <Area 
                                                type="monotone" 
                                                dataKey="revenue" 
                                                stroke="#3b82f6" 
                                                strokeWidth={3}
                                                fill="url(#revenueGradient)" 
                                                dot={false} 
                                                activeDot={{ r: 6, fill: '#3b82f6' }} 
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <EmptyChart label="No revenue data yet" />
                                )}
                            </div>
                        </Card>

                        {/* Lead Conversion Pie Chart */}
                        <Card className="bg-white border-0 shadow-sm">
                            <div className="p-6 border-b border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-900">Lead Conversion</h3>
                                <p className="text-sm text-gray-500 mt-1">Last 30 days</p>
                            </div>
                            <div className="p-6">
                                {lead_conversion.some(l => l.value > 0) ? (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <PieChart>
                                            <Pie 
                                                data={lead_conversion} 
                                                cx="50%" 
                                                cy="45%" 
                                                innerRadius={60}
                                                outerRadius={100} 
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
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                }}
                                            />
                                            <Legend 
                                                iconType="circle" 
                                                iconSize={10}
                                                wrapperStyle={{ fontSize: '13px', paddingTop: '20px' }}
                                                formatter={(v) => <span className="text-gray-700">{v}</span>} 
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <EmptyChart label="No leads in last 30 days" />
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Bottom Section - Activity & Tasks */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Recent Activity */}
                        <Card className="bg-white border-0 shadow-sm">
                            <div className="p-6 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-gray-500" />
                                    <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                                </div>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {recent_activities.length > 0 ? (
                                    recent_activities.slice(0, 5).map((a) => (
                                        <div key={a.id} className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors">
                                            <div className="mt-1 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm text-gray-900 font-medium truncate">{a.description}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-gray-500">{a.causer}</span>
                                                    <span className="text-xs text-gray-400">•</span>
                                                    <span className="text-xs text-gray-500">{a.created_at}</span>
                                                </div>
                                            </div>
                                            <Badge variant="secondary" className="text-[10px] shrink-0">
                                                {a.subject_type}
                                            </Badge>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex items-center justify-center h-48 text-sm text-gray-400">
                                        No recent activity
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Tasks Due Today */}
                        <Card className="bg-white border-0 shadow-sm">
                            <div className="p-6 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-gray-500" />
                                    <h3 className="text-lg font-semibold text-gray-900">Tasks Due Today</h3>
                                </div>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {tasks_due_today.length > 0 ? (
                                    tasks_due_today.map((t) => (
                                        <div key={t.id} className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{t.title}</p>
                                                <p className="text-xs text-gray-500 mt-0.5 truncate">{t.client}</p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {t.due_date && (
                                                    <span className="text-xs text-gray-500">{t.due_date}</span>
                                                )}
                                                <Badge variant={priorityVariant[t.priority] ?? 'secondary'} className="capitalize text-[10px]">
                                                    {t.priority}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex items-center justify-center h-48 text-sm text-gray-400">
                                        No tasks due today
                                    </div>
                                )}
                            </div>
                        </Card>

                    </div>
                </div>
            </AppLayout>
        </>
    );
}

function EmptyChart({ label }: { label: string }) {
    return (
        <div className="flex items-center justify-center h-[280px] text-sm text-gray-400">
            {label}
        </div>
    );
}
