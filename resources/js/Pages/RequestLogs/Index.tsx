import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    ScrollText, Filter, X, LogIn, LogOut, AlertCircle, Clock, Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogUser { id: number; name: string; email: string; role: string }
interface RequestLogRow {
    id: number; action: string; method: string; url: string; path: string; ip: string | null;
    user: LogUser | null; status_code: number | null; duration: number; total_queries: number | null;
    created_at: string;
}
interface Paginator<T> { data: T[]; total: number; last_page: number; links: { url: string | null; label: string; active: boolean }[] }
interface Filters { method?: string; status_code?: string; action?: string; url?: string; user_id?: string }
interface Stats { total: number; errors: number; logins: number; logouts: number; avg_duration: number }

const methodClass: Record<string, string> = {
    GET: 'bg-sky-100 text-sky-800',
    POST: 'bg-emerald-100 text-emerald-800',
    PUT: 'bg-amber-100 text-amber-800',
    PATCH: 'bg-amber-100 text-amber-800',
    DELETE: 'bg-red-100 text-red-800',
};

const actionLabel: Record<string, string> = {
    request: 'Request',
    login: 'Login',
    logout: 'Logout',
    failed_login: 'Failed login',
};

function statusClass(code: number | null): string {
    if (!code) return 'text-gray-400';
    if (code >= 500) return 'font-medium text-red-600';
    if (code >= 400) return 'font-medium text-amber-600';
    if (code >= 300) return 'text-sky-600';
    return 'text-emerald-600';
}

export default function RequestLogsIndex({ logs, users, filters, stats }: {
    logs: Paginator<RequestLogRow>;
    users: { id: number; name: string; email: string; role: string }[];
    filters: Filters;
    stats: Stats;
}) {
    const [showFilters, setShowFilters] = useState(Object.values(filters).some(Boolean));
    const [url, setUrl] = useState(filters.url ?? '');
    const hasFilters = Object.values(filters).some(Boolean);
    const successRate = stats.total > 0 ? (((stats.total - stats.errors) / stats.total) * 100).toFixed(1) : '0.0';

    function applyFilter(key: string, value: string) {
        router.get('/request-logs', { ...filters, [key]: value || undefined }, { preserveState: true, replace: true });
    }

    function submitUrl(e: React.FormEvent) {
        e.preventDefault();
        applyFilter('url', url);
    }

    function clearFilters() {
        setUrl('');
        router.get('/request-logs', {}, { preserveState: true, replace: true });
    }

    const kpis = [
        { label: 'Requests', value: stats.total, icon: <Globe className="h-4 w-4 text-sky-700" />, iconClass: 'bg-sky-100' },
        { label: 'Logins', value: stats.logins, icon: <LogIn className="h-4 w-4 text-emerald-700" />, iconClass: 'bg-emerald-100' },
        { label: 'Logouts', value: stats.logouts, icon: <LogOut className="h-4 w-4 text-gray-600" />, iconClass: 'bg-gray-100' },
        { label: 'Errors', value: stats.errors, icon: <AlertCircle className="h-4 w-4 text-red-600" />, iconClass: 'bg-red-100' },
        { label: 'Avg time', value: `${Math.round(stats.avg_duration * 1000)} ms`, icon: <Clock className="h-4 w-4 text-amber-700" />, iconClass: 'bg-amber-100' },
        { label: 'Success', value: `${successRate}%`, icon: <ScrollText className="h-4 w-4 text-emerald-700" />, iconClass: 'bg-emerald-100' },
    ];

    return (
        <>
            <Head title="Activity logs" />
            <AppLayout title="Activity logs">
                <div className="space-y-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold tracking-[0.12em] text-amber-600">
                                <ScrollText className="h-3 w-3" />
                                SYSTEM
                            </span>
                            <h2 className="mt-3 text-[32px] leading-none font-semibold tracking-tight text-gray-950">
                                Activity logs
                            </h2>
                            <p className="mt-2 text-sm text-gray-500">
                                Logins, logouts, and every request — who called what, and when.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                        {kpis.map((k) => (
                            <div key={k.label} className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
                                <div className="flex items-start justify-between">
                                    <p className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">{k.label}</p>
                                    <div className={cn('flex h-9 w-9 items-center justify-center rounded-full', k.iconClass)}>
                                        {k.icon}
                                    </div>
                                </div>
                                <p className="mt-4 text-[28px] leading-none font-semibold tracking-tight text-gray-950">{k.value}</p>
                            </div>
                        ))}
                    </div>

                    <section className="rounded-2xl border border-gray-200/80 bg-white shadow-sm">
                        <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                            <form onSubmit={submitUrl} className="relative min-w-[220px] flex-1 max-w-md">
                                <Input
                                    placeholder="Search URL or path…"
                                    className="h-10 rounded-full border-gray-200 bg-[#F7F7F5] text-sm shadow-none"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                />
                            </form>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowFilters(!showFilters)}
                                className={cn(
                                    'h-10 rounded-full px-4',
                                    hasFilters ? 'border-amber-400 text-amber-700' : 'border-gray-200 text-gray-600'
                                )}
                            >
                                <Filter size={14} />
                                Filters
                                {hasFilters && <Badge variant="warning" className="ml-1 h-4 px-1.5 text-[10px]">ON</Badge>}
                            </Button>
                            {hasFilters && (
                                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10 text-gray-400">
                                    <X size={13} /> Clear
                                </Button>
                            )}
                            <p className="ml-auto text-sm text-gray-400">{logs.total} logs</p>
                        </div>

                        {showFilters && (
                            <div className="flex flex-wrap gap-3 border-t border-gray-100 px-5 py-4">
                                <Select value={filters.action ?? ''} onValueChange={(v) => applyFilter('action', v)}>
                                    <SelectTrigger className="h-9 w-40 text-sm"><SelectValue placeholder="Action" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All actions</SelectItem>
                                        <SelectItem value="login">Login</SelectItem>
                                        <SelectItem value="logout">Logout</SelectItem>
                                        <SelectItem value="failed_login">Failed login</SelectItem>
                                        <SelectItem value="request">Request</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={filters.method ?? ''} onValueChange={(v) => applyFilter('method', v)}>
                                    <SelectTrigger className="h-9 w-32 text-sm"><SelectValue placeholder="Method" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All</SelectItem>
                                        {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
                                            <SelectItem key={m} value={m}>{m}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={filters.user_id ?? ''} onValueChange={(v) => applyFilter('user_id', v)}>
                                    <SelectTrigger className="h-9 w-48 text-sm"><SelectValue placeholder="User" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All users</SelectItem>
                                        {users.map((u) => (
                                            <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="border-t border-gray-100">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">When</TableHead>
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Action</TableHead>
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Request</TableHead>
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">User</TableHead>
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Status</TableHead>
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Time</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.data.length === 0 ? (
                                        <TableRow className="hover:bg-transparent">
                                            <TableCell colSpan={6} className="h-56 text-center text-sm text-gray-400">
                                                No activity logs yet
                                            </TableCell>
                                        </TableRow>
                                    ) : logs.data.map((log) => (
                                        <TableRow key={log.id} className="cursor-pointer" onClick={() => router.get(`/request-logs/${log.id}`)}>
                                            <TableCell className="whitespace-nowrap text-xs text-gray-500">{log.created_at}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="text-[10px] capitalize">
                                                    {actionLabel[log.action] ?? log.action}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-semibold', methodClass[log.method] ?? 'bg-gray-100 text-gray-700')}>
                                                        {log.method}
                                                    </span>
                                                    <span className="max-w-[320px] truncate font-mono text-xs text-gray-700">{log.path}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-600">
                                                {log.user ? (
                                                    <div>
                                                        <p className="text-sm text-gray-800">{log.user.name}</p>
                                                        <p className="text-[11px] text-gray-400">{log.ip}</p>
                                                    </div>
                                                ) : <span className="text-xs text-gray-300">Guest · {log.ip}</span>}
                                            </TableCell>
                                            <TableCell className={cn('text-sm', statusClass(log.status_code))}>{log.status_code ?? '—'}</TableCell>
                                            <TableCell className="text-xs text-gray-500">{Math.round(log.duration * 1000)} ms</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {logs.last_page > 1 && (
                            <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 text-sm text-gray-500">
                                <span>Showing {logs.data.length} of {logs.total} logs</span>
                                <div className="flex gap-1">
                                    {logs.links.map((link, i) => (
                                        <Button
                                            key={i}
                                            variant={link.active ? 'default' : 'outline'}
                                            size="sm"
                                            disabled={!link.url}
                                            onClick={() => link.url && router.get(link.url)}
                                            className="h-7 min-w-[28px] px-2 text-xs"
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </AppLayout>
        </>
    );
}
