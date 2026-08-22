import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend,
} from 'recharts';
import { DollarSign, TrendingUp, AlertCircle, Filter, BarChart3, Receipt, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RevenueReport {
    total_invoiced: number; total_received: number; total_balance: number;
    payment_count: number;
    daily: { date: string; revenue: number }[];
}
interface ServiceStat  { service: string; count: number; color: string }
interface LeadConversion {
    total: number; won: number; lost: number; open: number; rate: number;
    follow_up: number; quote_sent: number;
    funnel: { stage: string; count: number }[];
    by_source: { source: string; count: number }[];
}
interface Outstanding {
    clients: { client_number: string; client_name: string; assigned_to: string; total_invoiced: number; total_received: number; balance_due: number }[];
    total_balance: number; client_count: number;
}
interface EmployeePerf {
    name: string; role: string; leads_assigned: number; leads_won: number;
    clients_managed: number; revenue_generated: number;
    tasks_completed: number; services_completed: number; conversion_rate: number;
}
interface MonthlyTrend  { month: string; revenue: number; leads: number; clients: number; services: number }
interface ComplianceBreakdown { one_time: number; monthly: number; unset: number; due_soon: number }
interface Filters { dateFrom: string; dateTo: string; userId?: string; serviceId?: string }

interface Props {
    revenue:          RevenueReport;
    sales_by_service: ServiceStat[];
    lead_conversion:  LeadConversion;
    outstanding:      Outstanding;
    employee_perf:    EmployeePerf[];
    monthly_trends:   MonthlyTrend[];
    compliance:       ComplianceBreakdown;
    users:            { id: number; name: string; role: string }[];
    services:         { id: number; name: string }[];
    filters:          Filters;
}

function fmt(n: number) {
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function KpiCard({ label, value, icon, iconClass }: { label: string; value: string | number; icon: React.ReactNode; iconClass: string }) {
    return (
        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
                <p className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">{label}</p>
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-full', iconClass)}>
                    {icon}
                </div>
            </div>
            <p className="mt-4 text-[28px] leading-none font-semibold tracking-tight text-gray-950">{value}</p>
        </div>
    );
}

function Panel({ title, children }: { title?: string; children: React.ReactNode }) {
    return (
        <section className="rounded-2xl border border-gray-200/80 bg-white shadow-sm">
            {title && (
                <div className="px-5 py-4">
                    <h3 className="text-base font-semibold text-gray-950">{title}</h3>
                </div>
            )}
            <div className={cn(title && 'border-t border-gray-100')}>{children}</div>
        </section>
    );
}

function EmptyChart({ label }: { label: string }) {
    return <div className="flex h-48 items-center justify-center text-sm text-gray-400">{label}</div>;
}

export default function ReportsIndex({
    revenue, sales_by_service, lead_conversion, outstanding, employee_perf, monthly_trends, compliance, users, filters,
}: Props) {
    const [localFilters, setLocalFilters] = useState(filters);

    function applyFilters() {
        router.get('/reports', {
            date_from:  localFilters.dateFrom,
            date_to:    localFilters.dateTo,
            user_id:    localFilters.userId,
            service_id: localFilters.serviceId,
        }, { preserveState: true, replace: true });
    }

    function resetFilters() {
        const reset = {
            dateFrom: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
            dateTo: new Date().toISOString().split('T')[0],
            userId: undefined,
            serviceId: undefined,
        };
        setLocalFilters(reset);
        router.get('/reports', {}, { preserveState: true, replace: true });
    }

    return (
        <>
            <Head title="Reports" />
            <AppLayout title="Reports">
                <div className="space-y-6">

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold tracking-[0.12em] text-amber-600">
                                <BarChart3 className="h-3 w-3" />
                                SYSTEM
                            </span>
                            <h2 className="mt-3 text-[32px] leading-none font-semibold tracking-tight text-gray-950">
                                Reports
                            </h2>
                            <p className="mt-2 text-sm text-gray-500">
                                Revenue, conversion, and team performance in one place.
                            </p>
                        </div>
                    </div>

                    <section className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-400">From</Label>
                                <Input
                                    type="date"
                                    className="h-10 w-36 rounded-lg text-sm"
                                    value={localFilters.dateFrom}
                                    onChange={(e) => setLocalFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-400">To</Label>
                                <Input
                                    type="date"
                                    className="h-10 w-36 rounded-lg text-sm"
                                    value={localFilters.dateTo}
                                    onChange={(e) => setLocalFilters((f) => ({ ...f, dateTo: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-400">Employee</Label>
                                <Select value={localFilters.userId ?? ''} onValueChange={(v) => setLocalFilters((f) => ({ ...f, userId: v || undefined }))}>
                                    <SelectTrigger className="h-10 w-40 text-sm"><SelectValue placeholder="All employees" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All employees</SelectItem>
                                        {users.map((u) => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button size="sm" className="h-10 rounded-lg bg-[#12141D] px-4 text-white hover:bg-black" onClick={applyFilters}>
                                <Filter size={13} /> Apply
                            </Button>
                            <Button size="sm" variant="outline" className="h-10 rounded-lg" onClick={resetFilters}>Reset</Button>
                        </div>
                    </section>

                    <Tabs defaultValue="revenue">
                        <TabsList className="h-auto flex-wrap gap-1 rounded-xl bg-white p-1 shadow-sm">
                            <TabsTrigger value="revenue">Revenue</TabsTrigger>
                            <TabsTrigger value="services">Sales by Service</TabsTrigger>
                            <TabsTrigger value="leads">Lead Conversion</TabsTrigger>
                            <TabsTrigger value="outstanding">Outstanding Balances</TabsTrigger>
                            <TabsTrigger value="employees">Employee Performance</TabsTrigger>
                            <TabsTrigger value="trends">Monthly Trends</TabsTrigger>
                            <TabsTrigger value="compliance">Compliance</TabsTrigger>
                        </TabsList>

                        <TabsContent value="revenue" className="mt-5 space-y-4">
                            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                                <KpiCard label="Invoiced" value={fmt(revenue.total_invoiced)} icon={<DollarSign className="h-4 w-4 text-sky-700" />} iconClass="bg-sky-100" />
                                <KpiCard label="Received" value={fmt(revenue.total_received)} icon={<TrendingUp className="h-4 w-4 text-emerald-700" />} iconClass="bg-emerald-100" />
                                <KpiCard label="Outstanding" value={fmt(revenue.total_balance)} icon={<AlertCircle className="h-4 w-4 text-red-600" />} iconClass="bg-red-100" />
                                <KpiCard label="Payments" value={revenue.payment_count} icon={<Receipt className="h-4 w-4 text-amber-700" />} iconClass="bg-amber-100" />
                            </div>
                            <Panel title="Daily revenue">
                                <div className="p-5">
                                    {revenue.daily.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={260}>
                                            <AreaChart data={revenue.daily}>
                                                <defs>
                                                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.22} />
                                                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                                                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                                                <Tooltip formatter={(v) => [fmt(Number(v)), 'Revenue']} />
                                                <Area type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={2} fill="url(#revGrad)" dot={false} activeDot={{ r: 4 }} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    ) : <EmptyChart label="No revenue data for this period" />}
                                </div>
                            </Panel>
                        </TabsContent>

                        <TabsContent value="services" className="mt-5">
                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                <Panel title="Completed services by type">
                                    <div className="p-5">
                                        {sales_by_service.length > 0 ? (
                                            <ResponsiveContainer width="100%" height={280}>
                                                <BarChart data={sales_by_service} layout="vertical" margin={{ left: 20 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                                                    <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                                                    <YAxis type="category" dataKey="service" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} width={80} />
                                                    <Tooltip formatter={(v) => [Number(v), 'Completed']} />
                                                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                                        {sales_by_service.map((entry, i) => (
                                                            <Cell key={i} fill={entry.color} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : <EmptyChart label="No completed services in this period" />}
                                    </div>
                                </Panel>
                                <Panel title="Distribution">
                                    <div className="p-5">
                                        {sales_by_service.length > 0 ? (
                                            <ResponsiveContainer width="100%" height={280}>
                                                <PieChart>
                                                    <Pie data={sales_by_service} dataKey="count" nameKey="service" cx="50%" cy="45%" outerRadius={100} paddingAngle={2}>
                                                        {sales_by_service.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                                    </Pie>
                                                    <Tooltip />
                                                    <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs">{v}</span>} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        ) : <EmptyChart label="No data" />}
                                    </div>
                                </Panel>
                            </div>
                        </TabsContent>

                        <TabsContent value="leads" className="mt-5 space-y-4">
                            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                                <KpiCard label="Total leads" value={lead_conversion.total} icon={<BarChart3 className="h-4 w-4 text-sky-700" />} iconClass="bg-sky-100" />
                                <KpiCard label="Won" value={lead_conversion.won} icon={<TrendingUp className="h-4 w-4 text-emerald-700" />} iconClass="bg-emerald-100" />
                                <KpiCard label="Lost" value={lead_conversion.lost} icon={<AlertCircle className="h-4 w-4 text-red-600" />} iconClass="bg-red-100" />
                                <KpiCard label="Conversion" value={`${lead_conversion.rate}%`} icon={<DollarSign className="h-4 w-4 text-amber-700" />} iconClass="bg-amber-100" />
                            </div>
                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                <Panel title="Lead status breakdown">
                                    <div className="p-5">
                                        <ResponsiveContainer width="100%" height={240}>
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'Won', value: lead_conversion.won, fill: '#22c55e' },
                                                        { name: 'Lost', value: lead_conversion.lost, fill: '#ef4444' },
                                                        { name: 'Open', value: lead_conversion.open, fill: '#F59E0B' },
                                                        { name: 'Follow-up', value: lead_conversion.follow_up, fill: '#f59e0b' },
                                                        { name: 'Quote Sent', value: lead_conversion.quote_sent, fill: '#8b5cf6' },
                                                    ].filter((d) => d.value > 0)}
                                                    dataKey="value"
                                                    cx="50%"
                                                    cy="45%"
                                                    innerRadius={55}
                                                    outerRadius={90}
                                                    paddingAngle={3}
                                                >
                                                    {['#22c55e', '#ef4444', '#F59E0B', '#f59e0b', '#8b5cf6'].map((c, i) => (
                                                        <Cell key={i} fill={c} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                                <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs">{v}</span>} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </Panel>
                                <Panel title="Leads by source">
                                    <div className="p-5">
                                        {lead_conversion.by_source.length > 0 ? (
                                            <ResponsiveContainer width="100%" height={240}>
                                                <BarChart data={lead_conversion.by_source}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                    <XAxis dataKey="source" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                                                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                                                    <Tooltip />
                                                    <Bar dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : <EmptyChart label="No source data" />}
                                    </div>
                                </Panel>
                            </div>
                        </TabsContent>

                        <TabsContent value="outstanding" className="mt-5 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <KpiCard label="Total outstanding" value={fmt(outstanding.total_balance)} icon={<AlertCircle className="h-4 w-4 text-red-600" />} iconClass="bg-red-100" />
                                <KpiCard label="Clients with balance" value={outstanding.client_count} icon={<DollarSign className="h-4 w-4 text-amber-700" />} iconClass="bg-amber-100" />
                            </div>
                            <Panel>
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="px-5 text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Client #</TableHead>
                                            <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Name</TableHead>
                                            <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Assigned</TableHead>
                                            <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Invoiced</TableHead>
                                            <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Received</TableHead>
                                            <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Balance Due</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {outstanding.clients.length === 0 ? (
                                            <TableRow className="hover:bg-transparent">
                                                <TableCell colSpan={6} className="h-48 text-center text-sm text-gray-400">No outstanding balances</TableCell>
                                            </TableRow>
                                        ) : outstanding.clients.map((c, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="px-5 font-mono text-xs text-amber-700">{c.client_number}</TableCell>
                                                <TableCell className="text-sm font-medium">{c.client_name}</TableCell>
                                                <TableCell className="text-sm text-gray-600">{c.assigned_to}</TableCell>
                                                <TableCell>{fmt(c.total_invoiced)}</TableCell>
                                                <TableCell className="text-emerald-600">{fmt(c.total_received)}</TableCell>
                                                <TableCell>
                                                    <span className="font-semibold text-red-600">{fmt(c.balance_due)}</span>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Panel>
                        </TabsContent>

                        <TabsContent value="employees" className="mt-5 space-y-4">
                            <Panel>
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="px-5 text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Employee</TableHead>
                                            <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Role</TableHead>
                                            <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Leads</TableHead>
                                            <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Won</TableHead>
                                            <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Rate</TableHead>
                                            <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Clients</TableHead>
                                            <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Revenue</TableHead>
                                            <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Tasks Done</TableHead>
                                            <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Services Done</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {employee_perf.length === 0 ? (
                                            <TableRow className="hover:bg-transparent">
                                                <TableCell colSpan={9} className="h-48 text-center text-sm text-gray-400">No data</TableCell>
                                            </TableRow>
                                        ) : employee_perf.map((e, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="px-5 text-sm font-medium">{e.name}</TableCell>
                                                <TableCell><Badge variant="secondary" className="text-xs capitalize">{e.role}</Badge></TableCell>
                                                <TableCell>{e.leads_assigned}</TableCell>
                                                <TableCell className="font-medium text-emerald-600">{e.leads_won}</TableCell>
                                                <TableCell>
                                                    <span className={cn('text-sm font-semibold', e.conversion_rate >= 50 ? 'text-emerald-600' : e.conversion_rate >= 25 ? 'text-amber-600' : 'text-red-500')}>
                                                        {e.conversion_rate}%
                                                    </span>
                                                </TableCell>
                                                <TableCell>{e.clients_managed}</TableCell>
                                                <TableCell className="font-medium">{fmt(e.revenue_generated)}</TableCell>
                                                <TableCell>{e.tasks_completed}</TableCell>
                                                <TableCell>{e.services_completed}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Panel>
                            {employee_perf.length > 0 && (
                                <Panel title="Revenue by employee">
                                    <div className="p-5">
                                        <ResponsiveContainer width="100%" height={220}>
                                            <BarChart data={employee_perf}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                                                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                                                <Tooltip formatter={(v) => [fmt(Number(v)), 'Revenue']} />
                                                <Bar dataKey="revenue_generated" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Revenue" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </Panel>
                            )}
                        </TabsContent>

                        <TabsContent value="trends" className="mt-5 space-y-4">
                            <Panel title="Revenue & leads — last 12 months">
                                <div className="p-5">
                                    <ResponsiveContainer width="100%" height={280}>
                                        <LineChart data={monthly_trends}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                                            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                                            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                                            <Tooltip />
                                            <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs">{v}</span>} />
                                            <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={2} dot={false} name="Revenue ($)" />
                                            <Line yAxisId="right" type="monotone" dataKey="leads" stroke="#22c55e" strokeWidth={2} dot={false} name="Leads" />
                                            <Line yAxisId="right" type="monotone" dataKey="clients" stroke="#38bdf8" strokeWidth={2} dot={false} name="New Clients" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </Panel>
                            <Panel title="Services completed per month">
                                <div className="p-5">
                                    <ResponsiveContainer width="100%" height={200}>
                                        <BarChart data={monthly_trends}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                                            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                                            <Tooltip />
                                            <Bar dataKey="services" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Services Completed" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Panel>
                        </TabsContent>

                        <TabsContent value="compliance" className="mt-5 space-y-4">
                            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                                <KpiCard label="One-Time" value={compliance?.one_time ?? 0} icon={<ShieldCheck className="h-4 w-4 text-amber-700" />} iconClass="bg-amber-100" />
                                <KpiCard label="Monthly" value={compliance?.monthly ?? 0} icon={<ShieldCheck className="h-4 w-4 text-indigo-700" />} iconClass="bg-indigo-100" />
                                <KpiCard label="Not set" value={compliance?.unset ?? 0} icon={<AlertCircle className="h-4 w-4 text-gray-600" />} iconClass="bg-gray-100" />
                                <KpiCard label="Due within 7 days" value={compliance?.due_soon ?? 0} icon={<AlertCircle className="h-4 w-4 text-red-600" />} iconClass="bg-red-50" />
                            </div>
                            <Panel title="Compliance mix">
                                <div className="p-5">
                                    <ResponsiveContainer width="100%" height={260}>
                                        <BarChart data={[
                                            { type: 'One-Time', count: compliance?.one_time ?? 0 },
                                            { type: 'Monthly', count: compliance?.monthly ?? 0 },
                                            { type: 'Not set', count: compliance?.unset ?? 0 },
                                        ]}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="type" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                                            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                                            <Tooltip />
                                            <Bar dataKey="count" fill="#C4A035" radius={[4, 4, 0, 0]} name="Clients" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Panel>
                        </TabsContent>
                    </Tabs>
                </div>
            </AppLayout>
        </>
    );
}
