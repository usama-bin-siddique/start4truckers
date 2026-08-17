import React, { useEffect, useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, Filter, X, Clock, CheckCircle2, Circle, Edit, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServiceItem {
    id: number; client_id: number; client_number: string; client_name: string;
    service_name: string; status: string;
    assigned_user: { name: string } | null; completion_date: string | null; notes: string | null;
}
interface Paginator<T> { data: T[]; total: number; last_page: number; links: { url: string | null; label: string; active: boolean }[] }
interface Stats { pending: number; in_progress: number; completed: number }
interface Filters { search?: string; status?: string; service_id?: string; assigned_to?: string }

const statusConfig: Record<string, { label: string; variant: 'default' | 'warning' | 'success'; icon: React.ReactNode }> = {
    pending:     { label: 'Pending',     variant: 'default',  icon: <Circle size={12} className="text-gray-400" /> },
    in_progress: { label: 'In Progress', variant: 'warning',  icon: <Clock size={12} className="text-amber-500" /> },
    completed:   { label: 'Completed',   variant: 'success',  icon: <CheckCircle2 size={12} className="text-green-500" /> },
};

export default function OperationsIndex({ services, all_services, users, filters, stats }: {
    services: Paginator<ServiceItem>;
    all_services: { id: number; name: string }[];
    users: { id: number; name: string; role: string }[];
    filters: Filters;
    stats: Stats;
}) {
    const [showFilters, setShowFilters] = useState(false);
    const [editTarget, setEditTarget] = useState<ServiceItem | null>(null);
    const [search, setSearch] = useState(filters.search ?? '');
    const form = useForm({ status: '', assigned_to: '', completion_date: '', notes: '' });
    const hasFilters = Object.values(filters).some(Boolean);

    useEffect(() => {
        const t = setTimeout(() => {
            if (search !== (filters.search ?? '')) applyFilter('search', search);
        }, 350);
        return () => clearTimeout(t);
    }, [search]);

    function applyFilter(key: string, value: string) {
        router.get('/operations', { ...filters, [key]: value || undefined }, { preserveState: true, replace: true });
    }

    function clearFilters() {
        setSearch('');
        router.get('/operations', {}, { preserveState: true, replace: true });
    }

    function openEdit(s: ServiceItem) {
        form.setData({ status: s.status, assigned_to: '', completion_date: s.completion_date ?? '', notes: s.notes ?? '' });
        setEditTarget(s);
    }

    function submitEdit(e: React.FormEvent) {
        e.preventDefault();
        form.put(`/operations/${editTarget!.id}`, { onSuccess: () => setEditTarget(null) });
    }

    const kpis = [
        { label: 'Pending', value: stats.pending, icon: <Circle className="h-4 w-4 text-gray-500" />, iconClass: 'bg-gray-100' },
        { label: 'In Progress', value: stats.in_progress, icon: <Clock className="h-4 w-4 text-amber-700" />, iconClass: 'bg-amber-100' },
        { label: 'Completed', value: stats.completed, icon: <CheckCircle2 className="h-4 w-4 text-emerald-700" />, iconClass: 'bg-emerald-100' },
        { label: 'Total', value: services.total, icon: <Briefcase className="h-4 w-4 text-sky-700" />, iconClass: 'bg-sky-100' },
    ];

    return (
        <>
            <Head title="Operations" />
            <AppLayout title="Operations">
                <div className="space-y-6">

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold tracking-[0.12em] text-amber-600">
                                <Briefcase className="h-3 w-3" />
                                WORK
                            </span>
                            <h2 className="mt-3 text-[32px] leading-none font-semibold tracking-tight text-gray-950">
                                Operations
                            </h2>
                            <p className="mt-2 text-sm text-gray-500">
                                Track service work from pending through completion.
                            </p>
                        </div>
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
                                    placeholder="Search operations.."
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

                            <p className="ml-auto text-sm text-gray-400">{services.total} services</p>
                        </div>

                        {showFilters && (
                            <div className="flex flex-wrap gap-3 border-t border-gray-100 px-5 py-4">
                                <Select value={filters.status ?? ''} onValueChange={(v) => applyFilter('status', v)}>
                                    <SelectTrigger className="h-9 w-36 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All statuses</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={filters.service_id ?? ''} onValueChange={(v) => applyFilter('service_id', v)}>
                                    <SelectTrigger className="h-9 w-40 text-sm"><SelectValue placeholder="Service" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All services</SelectItem>
                                        {all_services.map((s) => (
                                            <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={filters.assigned_to ?? ''} onValueChange={(v) => applyFilter('assigned_to', v)}>
                                    <SelectTrigger className="h-9 w-40 text-sm"><SelectValue placeholder="Assigned to" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All employees</SelectItem>
                                        {users.filter((u) => ['admin', 'processing'].includes(u.role)).map((u) => (
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
                                        <TableHead className="px-5 text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Client</TableHead>
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Service</TableHead>
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Status</TableHead>
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Assigned</TableHead>
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Completed</TableHead>
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Notes</TableHead>
                                        <TableHead className="w-20" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {services.data.length === 0 ? (
                                        <TableRow className="hover:bg-transparent">
                                            <TableCell colSpan={7} className="h-56 text-center text-sm text-gray-400">
                                                No services found
                                            </TableCell>
                                        </TableRow>
                                    ) : services.data.map((s) => {
                                        const sc = statusConfig[s.status];
                                        return (
                                            <TableRow key={s.id} className={s.status === 'completed' ? 'opacity-60' : ''}>
                                                <TableCell className="px-5">
                                                    <Link href={`/clients/${s.client_id}`} className="hover:text-amber-700">
                                                        <p className="text-sm font-medium text-gray-900">{s.client_name}</p>
                                                        <p className="font-mono text-xs text-amber-700">{s.client_number}</p>
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="text-sm font-medium">{s.service_name}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5">
                                                        {sc.icon}
                                                        <Badge variant={sc.variant} className="text-xs">{sc.label}</Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-600">
                                                    {s.assigned_user?.name ?? <span className="italic text-gray-300">—</span>}
                                                </TableCell>
                                                <TableCell className="text-xs text-gray-400">{s.completion_date ?? '—'}</TableCell>
                                                <TableCell className="max-w-[160px] truncate text-xs text-gray-500">{s.notes ?? '—'}</TableCell>
                                                <TableCell>
                                                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openEdit(s)}>
                                                        <Edit size={12} /> Update
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>

                        {services.last_page > 1 && (
                            <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 text-sm text-gray-500">
                                <span>Showing {services.data.length} of {services.total} services</span>
                                <div className="flex gap-1">
                                    {services.links.map((link, i) => (
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

                <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
                    <DialogContent className="max-w-sm">
                        <DialogHeader>
                            <DialogTitle>Update — {editTarget?.service_name}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={submitEdit} className="space-y-3">
                            <div className="space-y-1">
                                <Label className="text-xs">Status</Label>
                                <Select value={form.data.status} onValueChange={(v) => form.setData('status', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Assigned To</Label>
                                <Select value={form.data.assigned_to} onValueChange={(v) => form.setData('assigned_to', v)}>
                                    <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">Unassigned</SelectItem>
                                        {users.filter((u) => ['admin', 'processing'].includes(u.role)).map((u) => (
                                            <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Completion Date</Label>
                                <Input type="date" value={form.data.completion_date} onChange={(e) => form.setData('completion_date', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Notes</Label>
                                <Textarea rows={2} value={form.data.notes} onChange={(e) => form.setData('notes', e.target.value)} />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
                                <Button type="submit" disabled={form.processing}>Save</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </AppLayout>
        </>
    );
}
