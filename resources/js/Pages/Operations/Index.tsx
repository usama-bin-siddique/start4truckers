import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, Filter, X, Clock, CheckCircle2, Circle, Edit } from 'lucide-react';
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
    const form = useForm({ status: '', assigned_to: '', completion_date: '', notes: '' });

    function applyFilter(key: string, value: string) {
        router.get('/operations', { ...filters, [key]: value || undefined }, { preserveState: true, replace: true });
    }
    function clearFilters() { router.get('/operations', {}, { preserveState: true, replace: true }); }

    function openEdit(s: ServiceItem) {
        form.setData({ status: s.status, assigned_to: '', completion_date: s.completion_date ?? '', notes: s.notes ?? '' });
        setEditTarget(s);
    }
    function submitEdit(e: React.FormEvent) {
        e.preventDefault();
        form.put(`/operations/${editTarget!.id}`, { onSuccess: () => setEditTarget(null) });
    }

    const hasFilters = Object.values(filters).some(Boolean);

    return (
        <>
            <Head title="Operations" />
            <AppLayout title="Operations">
                <div className="space-y-4">

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: 'Pending',     value: stats.pending,     color: 'text-gray-700', bg: 'bg-gray-50' },
                            { label: 'In Progress', value: stats.in_progress, color: 'text-amber-600', bg: 'bg-amber-50' },
                            { label: 'Completed',   value: stats.completed,   color: 'text-green-600', bg: 'bg-green-50' },
                        ].map(s => (
                            <Card key={s.label} className={cn('py-3 px-4', s.bg)}>
                                <p className="text-xs text-gray-400 uppercase tracking-wide">{s.label}</p>
                                <p className={cn('text-xl font-bold mt-0.5', s.color)}>{s.value}</p>
                            </Card>
                        ))}
                    </div>

                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative flex-1 min-w-[200px] max-w-xs">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <Input placeholder="Search client…" className="pl-8 h-8 text-sm"
                                defaultValue={filters.search ?? ''}
                                onChange={e => applyFilter('search', e.target.value)} />
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}
                            className={hasFilters ? 'border-blue-400 text-blue-600' : ''}>
                            <Filter size={13} /> Filters
                        </Button>
                        {hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-400"><X size={13} /> Clear</Button>}
                    </div>

                    {showFilters && (
                        <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <Select value={filters.status ?? ''} onValueChange={v => applyFilter('status', v)}>
                                <SelectTrigger className="h-8 w-36 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All statuses</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filters.service_id ?? ''} onValueChange={v => applyFilter('service_id', v)}>
                                <SelectTrigger className="h-8 w-40 text-sm"><SelectValue placeholder="Service" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All services</SelectItem>
                                    {all_services.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={filters.assigned_to ?? ''} onValueChange={v => applyFilter('assigned_to', v)}>
                                <SelectTrigger className="h-8 w-40 text-sm"><SelectValue placeholder="Assigned to" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All employees</SelectItem>
                                    {users.filter(u => ['admin','processing'].includes(u.role)).map(u => (
                                        <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Client</TableHead>
                                        <TableHead>Service</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Assigned</TableHead>
                                        <TableHead>Completed</TableHead>
                                        <TableHead>Notes</TableHead>
                                        <TableHead className="w-20" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {services.data.length === 0 ? (
                                        <TableRow><TableCell colSpan={7} className="text-center py-12 text-gray-400">No services found</TableCell></TableRow>
                                    ) : services.data.map(s => {
                                        const sc = statusConfig[s.status];
                                        return (
                                            <TableRow key={s.id} className={s.status === 'completed' ? 'opacity-60' : ''}>
                                                <TableCell>
                                                    <Link href={`/clients/${s.client_id}`} className="hover:text-blue-600">
                                                        <p className="font-medium text-sm text-gray-900">{s.client_name}</p>
                                                        <p className="font-mono text-xs text-blue-500">{s.client_number}</p>
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="font-medium text-sm">{s.service_name}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5">
                                                        {sc.icon}
                                                        <Badge variant={sc.variant} className="text-xs">{sc.label}</Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-600">{s.assigned_user?.name ?? <span className="text-gray-300 italic">—</span>}</TableCell>
                                                <TableCell className="text-xs text-gray-500">{s.completion_date ?? '—'}</TableCell>
                                                <TableCell className="text-xs text-gray-500 max-w-[160px] truncate">{s.notes ?? '—'}</TableCell>
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
                        </CardContent>
                    </Card>

                    {services.last_page > 1 && (
                        <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>Showing {services.data.length} of {services.total} services</span>
                            <div className="flex gap-1">
                                {services.links.map((link, i) => (
                                    <Button key={i} variant={link.active ? 'default' : 'outline'} size="sm"
                                        disabled={!link.url} onClick={() => link.url && router.get(link.url)}
                                        className="h-7 min-w-[28px] px-2 text-xs"
                                        dangerouslySetInnerHTML={{ __html: link.label }} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Edit modal */}
                <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
                    <DialogContent className="max-w-sm">
                        <DialogHeader>
                            <DialogTitle>Update — {editTarget?.service_name}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={submitEdit} className="space-y-3">
                            <div className="space-y-1">
                                <Label className="text-xs">Status</Label>
                                <Select value={form.data.status} onValueChange={v => form.setData('status', v)}>
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
                                <Select value={form.data.assigned_to} onValueChange={v => form.setData('assigned_to', v)}>
                                    <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">Unassigned</SelectItem>
                                        {users.filter(u => ['admin','processing'].includes(u.role)).map(u => (
                                            <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Completion Date</Label>
                                <Input type="date" value={form.data.completion_date} onChange={e => form.setData('completion_date', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Notes</Label>
                                <Textarea rows={2} value={form.data.notes} onChange={e => form.setData('notes', e.target.value)} />
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
