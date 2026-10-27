import React, { useEffect, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Search, AlarmClock, Filter, X, Clock, AlertCircle, Bell, CheckCircle2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Reminder {
    id: number;
    description: string;
    remind_at: string | null;
    notified_at: string | null;
    client_id: number | null;
    client_name: string | null;
    client_number: string | null;
    created_by: string | null;
}
interface Paginator<T> { data: T[]; total: number; last_page: number; links: { url: string | null; label: string; active: boolean }[] }
interface Stats { upcoming: number; overdue: number; reminded: number; total: number }
interface Filters { search?: string; status?: string; created_by?: string }

function formatDateTime(value: string | null): string {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function RemindersIndex({ reminders, users, filters, stats }: {
    reminders: Paginator<Reminder>;
    users: { id: number; name: string; role: string }[];
    filters: Filters;
    stats: Stats;
}) {
    const { auth } = usePage<{ auth: { user: { role: string } } }>().props;
    const [deleteTarget, setDeleteTarget] = useState<Reminder | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [search, setSearch] = useState(filters.search ?? '');

    const isAdmin = auth.user.role === 'admin';
    const hasFilters = Object.values(filters).some(Boolean);
    const isPast = (r: Reminder) => r.remind_at ? new Date(r.remind_at).getTime() < Date.now() : false;
    const isNotified = (r: Reminder) => !!r.notified_at;

    useEffect(() => {
        const t = setTimeout(() => {
            if (search !== (filters.search ?? '')) applyFilter('search', search);
        }, 350);
        return () => clearTimeout(t);
    }, [search]);

    function applyFilter(key: string, value: string) {
        router.get('/reminders', { ...filters, [key]: value || undefined }, { preserveState: true, replace: true });
    }

    function clearFilters() {
        setSearch('');
        router.get('/reminders', {}, { preserveState: true, replace: true });
    }

    function confirmDelete() {
        if (!deleteTarget?.client_id) return;
        router.delete(`/clients/${deleteTarget.client_id}/reminders/${deleteTarget.id}`, {
            onSuccess: () => setDeleteTarget(null),
        });
    }

    const kpis = [
        { label: 'Upcoming', value: stats.upcoming, icon: <Clock className="h-4 w-4 text-amber-700" />, iconClass: 'bg-amber-100' },
        { label: 'Overdue', value: stats.overdue, icon: <AlertCircle className="h-4 w-4 text-red-600" />, iconClass: 'bg-red-100' },
        { label: 'Notified', value: stats.reminded, icon: <CheckCircle2 className="h-4 w-4 text-emerald-700" />, iconClass: 'bg-emerald-100' },
        { label: 'Total', value: stats.total, icon: <AlarmClock className="h-4 w-4 text-gray-500" />, iconClass: 'bg-gray-100' },
    ];

    return (
        <>
            <Head title="Reminders" />
            <AppLayout title="Reminders">
                <div className="space-y-6">

                    <div>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold tracking-[0.12em] text-amber-600">
                            <AlarmClock className="h-3 w-3" />
                            WORK
                        </span>
                        <h2 className="mt-3 text-[32px] leading-none font-semibold tracking-tight text-gray-950">
                            Reminders
                        </h2>
                        <p className="mt-2 text-sm text-gray-500">
                            Every custom reminder you&rsquo;ve created across all clients.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
                        <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                            <div className="relative min-w-[220px] flex-1 max-w-md">
                                <Search size={15} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-gray-400" />
                                <Input
                                    placeholder="Search reminders or clients..."
                                    className="h-10 rounded-full border-gray-200 bg-[#F7F7F5] pl-10 text-sm shadow-none"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

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

                            <p className="ml-auto text-sm text-gray-400">{reminders.total} reminders</p>
                        </div>

                        {showFilters && (
                            <div className="flex flex-wrap gap-3 border-t border-gray-100 px-5 py-4">
                                <Select value={filters.status ?? ''} onValueChange={(v) => applyFilter('status', v)}>
                                    <SelectTrigger className="h-9 w-40 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All</SelectItem>
                                        <SelectItem value="upcoming">Upcoming</SelectItem>
                                        <SelectItem value="overdue">Overdue</SelectItem>
                                        <SelectItem value="reminded">Notified</SelectItem>
                                    </SelectContent>
                                </Select>
                                {isAdmin && users.length > 0 && (
                                    <Select value={filters.created_by ?? ''} onValueChange={(v) => applyFilter('created_by', v)}>
                                        <SelectTrigger className="h-9 w-44 text-sm"><SelectValue placeholder="Created by" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">Everyone</SelectItem>
                                            {users.map((u) => (
                                                <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        )}

                        <div className="border-t border-gray-100">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Reminder</TableHead>
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Client</TableHead>
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Remind at</TableHead>
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Status</TableHead>
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Created by</TableHead>
                                        <TableHead className="w-16" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reminders.data.length === 0 ? (
                                        <TableRow className="hover:bg-transparent">
                                            <TableCell colSpan={6} className="h-56 text-center text-sm text-gray-400">
                                                No reminders found
                                            </TableCell>
                                        </TableRow>
                                    ) : reminders.data.map((r) => (
                                        <TableRow key={r.id} className={cn(!isNotified(r) && isPast(r) && 'bg-red-50/50')}>
                                            <TableCell>
                                                <p className="max-w-[280px] truncate text-sm font-medium text-gray-900">{r.description}</p>
                                            </TableCell>
                                            <TableCell>
                                                {r.client_id ? (
                                                    <Link href={`/clients/${r.client_id}`} className="hover:text-amber-700">
                                                        <p className="text-xs font-medium text-gray-700">{r.client_name}</p>
                                                        <p className="font-mono text-[10px] text-amber-700">{r.client_number}</p>
                                                    </Link>
                                                ) : <span className="text-xs text-gray-300">—</span>}
                                            </TableCell>
                                            <TableCell>
                                                <span className={cn('text-xs', !isNotified(r) && isPast(r) ? 'font-medium text-red-600' : 'text-gray-500')}>
                                                    {!isNotified(r) && isPast(r) && <AlertCircle size={11} className="mr-1 inline" />}
                                                    {formatDateTime(r.remind_at)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {isNotified(r) ? (
                                                    <Badge variant="default" className="text-[10px]">Notified</Badge>
                                                ) : isPast(r) ? (
                                                    <Badge variant="destructive" className="text-[10px]">Overdue</Badge>
                                                ) : (
                                                    <Badge variant="warning" className="text-[10px]">Upcoming</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-600">{r.created_by ?? <span className="text-gray-300">—</span>}</TableCell>
                                            <TableCell>
                                                {!isNotified(r) && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-red-400 hover:text-red-600"
                                                        onClick={() => setDeleteTarget(r)}
                                                    >
                                                        <Trash2 size={13} />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {reminders.last_page > 1 && (
                            <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 text-sm text-gray-500">
                                <span>Showing {reminders.data.length} of {reminders.total} reminders</span>
                                <div className="flex gap-1">
                                    {reminders.links.map((link, i) => (
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

                <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Reminder</AlertDialogTitle>
                            <AlertDialogDescription>
                                Delete this reminder for <strong>{deleteTarget?.client_name}</strong>? This cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={confirmDelete}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </AppLayout>
        </>
    );
}
