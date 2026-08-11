import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend, FunnelChart, Funnel, LabelList,
} from 'recharts';
import { DollarSign, TrendingUp, Users, AlertCircle, Filter } from 'lucide-react';
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
interface Filters { dateFrom: string; dateTo: string; userId?: string; serviceId?: string }

interface Props {
    revenue:          RevenueReport;
    sales_by_service: ServiceStat[];
    lead_conversion:  LeadConversion;
    outstanding:      Outstanding;
    employee_perf:    EmployeePerf[];
    monthly_trends:   MonthlyTrend[];
    users:            { id: number; name: string; role: string }[];
    services:         { id: number; name: string }[];
    filters:          Filters;
}

function fmt(n: number) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

export default function ReportsIndex({ revenue, sales_by_service, lead_conversion, outstanding, employee_perf, monthly_trends, users, services, filters }: Props) {
    const [localFilters, setLocalFilters] = useState(filters);

    function applyFilters() {
        router.get('/reports', {
            date_from:  localFilters.dateFrom,
            date_to:    localFilters.dateTo,
            user_id:    localFilters.userId,
            service_id: localFilters.serviceId,
        }, { preserveState: true, replace: true });
    }

    return (
        <>
            <Head title="Reports" />
            <AppLayout title="Reports">
                <div className="space-y-5">

                    {/* Filter Bar */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex flex-wrap items-end gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs text-gray-500">From</Label>
                                    <Input type="date" className="h-8 w-36 text-sm"
                                        value={localFilters.dateFrom}
                                        onChange={e => setLocalFilters(f => ({ ...f, dateFrom: e.target.value }))} />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-gray-500">To</Label>
                                    <Input type="date" className="h-8 w-36 text-sm"
                                        value={localFilters.dateTo}
                                        onChange={e => setLocalFilters(f => ({ ...f, dateTo: e.target.value }))} />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-gray-500">Employee</Label>
                                    <Select value={localFilters.userId ?? ''} onValueChange={v => setLocalFilters(f => ({ ...f, userId: v || undefined }))}>
                                        <SelectTrigger className="h-8 w-40 text-sm"><SelectValue placeholder="All employees" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">All employees</SelectItem>
                                            {users.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button size="sm" onClick={applyFilters}>
                                    <Filter size={13} /> Apply
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => {
                                    const reset = { dateFrom: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], dateTo: new Date().toISOString().split('T')[0], userId: undefined, serviceId: undefined };
                                    setLocalFilters(reset);
                                    router.get('/reports', {}, { preserveState: true, replace: true });
                                }}>Reset</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Tabs defaultValue="revenue">
                        <TabsList className="flex-wrap h-auto gap-1">
                            <TabsTrigger value="revenue">Revenue</TabsTrigger>
                            <TabsTrigger value="services">Sales by Service</TabsTrigger>
                            <TabsTrigger value="leads">Lead Conversion</TabsTrigger>
                            <TabsTrigger value="outstanding">Outstanding Balances</TabsTrigger>
                            <TabsTrigger value="employees">Employee Performance</TabsTrigger>
                            <TabsTrigger value="trends">Monthly Trends</TabsTrigger>
                        </TabsList>

                        {/* ── Revenue ───────────────────────────────────── */}
                        <TabsContent value="revenue" className="mt-4 space-y-4">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                {[
                                    { label: 'Total Invoiced',  value: fmt(revenue.total_invoiced), color: 'text-blue-700',  bg: 'bg-blue-50',  icon: <DollarSign size={16} className="text-blue-500" /> },
                                    { label: 'Total Received',  value: fmt(revenue.total_received), color: 'text-green-700', bg: 'bg-green-50', icon: <TrendingUp size={16} className="text-green-500" /> },
                                    { label: 'Outstanding',     value: fmt(revenue.total_balance),  color: revenue.total_balance > 0 ? 'text-red-700' : 'text-green-700', bg: 'bg-red-50', icon: <AlertCircle size={16} className="text-red-500" /> },
                                    { label: 'Payment Records', value: String(revenue.payment_count), color: 'text-gray-700', bg: 'bg-gray-50', icon: <DollarSign size={16} className="text-gray-500" /> },
                                ].map(s => (
                                    <Card key={s.label}>
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</p>
                                                <div className={cn('p-1.5 rounded-md', s.bg)}>{s.icon}</div>
                                            </div>
                                            <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                            <Card>
                                <CardHeader className="pb-2"><CardTitle className="text-sm">Daily Revenue</CardTitle></CardHeader>
                                <CardContent>
                                    {revenue.daily.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={260}>
                                            <AreaChart data={revenue.daily}>
                                                <defs>
                                                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15} />
                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                                                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                                                <Tooltip formatter={(v: number) => [fmt(v), 'Revenue']} />
                                                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revGrad)" dot={false} activeDot={{ r: 4 }} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    ) : <EmptyChart label="No revenue data for this period" />}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* ── Sales by Service ──────────────────────────── */}
                        <TabsContent value="services" className="mt-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <Card>
                                    <CardHeader className="pb-2"><CardTitle className="text-sm">Completed Services by Type</CardTitle></CardHeader>
                                    <CardContent>
                                        {sales_by_service.length > 0 ? (
                                            <ResponsiveContainer width="100%" height={280}>
                                                <BarChart data={sales_by_service} layout="vertical" margin={{ left: 20 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                                                    <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                                                    <YAxis type="category" dataKey="service" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={80} />
                                                    <Tooltip formatter={(v: number) => [v, 'Completed']} />
                                                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                                        {sales_by_service.map((entry, i) => (
                                                            <Cell key={i} fill={entry.color} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : <EmptyChart label="No completed services in this period" />}
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2"><CardTitle className="text-sm">Distribution</CardTitle></CardHeader>
                                    <CardContent>
                                        {sales_by_service.length > 0 ? (
                                            <ResponsiveContainer width="100%" height={280}>
                                                <PieChart>
                                                    <Pie data={sales_by_service} dataKey="count" nameKey="service" cx="50%" cy="45%" outerRadius={100} paddingAngle={2}>
                                                        {sales_by_service.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                                    </Pie>
                                                    <Tooltip formatter={(v: number, name: string) => [v, name]} />
                                                    <Legend iconType="circle" iconSize={8} formatter={v => <span className="text-xs">{v}</span>} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        ) : <EmptyChart label="No data" />}
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* ── Lead Conversion ───────────────────────────── */}
                        <TabsContent value="leads" className="mt-4 space-y-4">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                {[
                                    { label: 'Total Leads',     value: lead_conversion.total,      color: 'text-gray-700' },
                                    { label: 'Won',             value: lead_conversion.won,        color: 'text-green-700' },
                                    { label: 'Lost',            value: lead_conversion.lost,       color: 'text-red-700' },
                                    { label: 'Conversion Rate', value: `${lead_conversion.rate}%`, color: 'text-blue-700' },
                                ].map(s => (
                                    <Card key={s.label}>
                                        <CardContent className="p-4">
                                            <p className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</p>
                                            <p className={cn('text-2xl font-bold mt-1', s.color)}>{s.value}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <Card>
                                    <CardHeader className="pb-2"><CardTitle className="text-sm">Lead Status Breakdown</CardTitle></CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={240}>
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'Won',       value: lead_conversion.won,        fill: '#22c55e' },
                                                        { name: 'Lost',      value: lead_conversion.lost,       fill: '#ef4444' },
                                                        { name: 'Open',      value: lead_conversion.open,       fill: '#3b82f6' },
                                                        { name: 'Follow-up', value: lead_conversion.follow_up,  fill: '#f59e0b' },
                                                        { name: 'Quote Sent',value: lead_conversion.quote_sent, fill: '#8b5cf6' },
                                                    ].filter(d => d.value > 0)}
                                                    dataKey="value" cx="50%" cy="45%" innerRadius={55} outerRadius={90} paddingAngle={3}
                                                >
                                                    {[0,1,2,3,4].map(i => <Cell key={i} fill={['#22c55e','#ef4444','#3b82f6','#f59e0b','#8b5cf6'][i]} />)}
                                                </Pie>
                                                <Tooltip />
                                                <Legend iconType="circle" iconSize={8} formatter={v => <span className="text-xs">{v}</span>} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2"><CardTitle className="text-sm">Leads by Source</CardTitle></CardHeader>
                                    <CardContent>
                                        {lead_conversion.by_source.length > 0 ? (
                                            <ResponsiveContainer width="100%" height={240}>
                                                <BarChart data={lead_conversion.by_source}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                    <XAxis dataKey="source" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                                                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                                                    <Tooltip />
                                                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : <EmptyChart label="No source data" />}
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* ── Outstanding Balances ──────────────────────── */}
                        <TabsContent value="outstanding" className="mt-4 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <Card>
                                    <CardContent className="p-4">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide">Total Outstanding</p>
                                        <p className="text-2xl font-bold text-red-600 mt-1">{fmt(outstanding.total_balance)}</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide">Clients with Balance</p>
                                        <p className="text-2xl font-bold text-gray-700 mt-1">{outstanding.client_count}</p>
                                    </CardContent>
                                </Card>
                            </div>
                            <Card>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Client #</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Assigned</TableHead>
                                                <TableHead>Invoiced</TableHead>
                                                <TableHead>Received</TableHead>
                                                <TableHead>Balance Due</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {outstanding.clients.length === 0 ? (
                                                <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">No outstanding balances</TableCell></TableRow>
                                            ) : outstanding.clients.map((c, i) => (
                                                <TableRow key={i}>
                                                    <TableCell className="font-mono text-xs text-blue-600">{c.client_number}</TableCell>
                                                    <TableCell className="font-medium text-sm">{c.client_name}</TableCell>
                                                    <TableCell className="text-sm text-gray-600">{c.assigned_to}</TableCell>
                                                    <TableCell>{fmt(c.total_invoiced)}</TableCell>
                                                    <TableCell className="text-green-600">{fmt(c.total_received)}</TableCell>
                                                    <TableCell>
                                                        <span className="font-semibold text-red-600">{fmt(c.balance_due)}</span>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* ── Employee Performance ──────────────────────── */}
                        <TabsContent value="employees" className="mt-4 space-y-4">
                            <Card>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Employee</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead>Leads</TableHead>
                                                <TableHead>Won</TableHead>
                                                <TableHead>Rate</TableHead>
                                                <TableHead>Clients</TableHead>
                                                <TableHead>Revenue</TableHead>
                                                <TableHead>Tasks Done</TableHead>
                                                <TableHead>Services Done</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {employee_perf.length === 0 ? (
                                                <TableRow><TableCell colSpan={9} className="text-center py-8 text-gray-400">No data</TableCell></TableRow>
                                            ) : employee_perf.map((e, i) => (
                                                <TableRow key={i}>
                                                    <TableCell className="font-medium text-sm">{e.name}</TableCell>
                                                    <TableCell><Badge variant="secondary" className="text-xs capitalize">{e.role}</Badge></TableCell>
                                                    <TableCell>{e.leads_assigned}</TableCell>
                                                    <TableCell className="text-green-600 font-medium">{e.leads_won}</TableCell>
                                                    <TableCell>
                                                        <span className={cn('font-semibold text-sm', e.conversion_rate >= 50 ? 'text-green-600' : e.conversion_rate >= 25 ? 'text-amber-600' : 'text-red-500')}>
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
                                </CardContent>
                            </Card>
                            {employee_perf.length > 0 && (
                                <Card>
                                    <CardHeader className="pb-2"><CardTitle className="text-sm">Revenue by Employee</CardTitle></CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={220}>
                                            <BarChart data={employee_perf}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                                                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                                                <Tooltip formatter={(v: number) => [fmt(v), 'Revenue']} />
                                                <Bar dataKey="revenue_generated" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Revenue" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        {/* ── Monthly Trends ────────────────────────────── */}
                        <TabsContent value="trends" className="mt-4 space-y-4">
                            <Card>
                                <CardHeader className="pb-2"><CardTitle className="text-sm">Revenue & Leads — Last 12 Months</CardTitle></CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={280}>
                                        <LineChart data={monthly_trends}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                            <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                                            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                                            <Tooltip />
                                            <Legend iconType="circle" iconSize={8} formatter={v => <span className="text-xs">{v}</span>} />
                                            <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={false} name="Revenue ($)" />
                                            <Line yAxisId="right" type="monotone" dataKey="leads" stroke="#22c55e" strokeWidth={2} dot={false} name="Leads" />
                                            <Line yAxisId="right" type="monotone" dataKey="clients" stroke="#f59e0b" strokeWidth={2} dot={false} name="New Clients" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2"><CardTitle className="text-sm">Services Completed Per Month</CardTitle></CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <BarChart data={monthly_trends}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                                            <Tooltip />
                                            <Bar dataKey="services" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Services Completed" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </AppLayout>
        </>
    );
}

function EmptyChart({ label }: { label: string }) {
    return <div className="flex items-center justify-center h-48 text-sm text-gray-400">{label}</div>;
}
