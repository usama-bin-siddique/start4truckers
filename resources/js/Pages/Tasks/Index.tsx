import React, { useEffect, useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
    Search, Plus, CheckCircle2, Circle, Clock, AlertCircle, Trash2, Edit,
    Filter, X, CheckSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Task {
    id: number; title: string; description: string | null; priority: string; status: string;
    assigned_user: { id: number; name: string } | null; created_by: string | null;
    client_id: number | null; client_name: string | null; client_number: string | null;
    due_date: string | null; reminder_at: string | null; is_overdue: boolean; created_at: string;
}
interface Paginator<T> { data: T[]; total: number; last_page: number; links: { url: string | null; label: string; active: boolean }[] }
interface Stats { pending: number; in_progress: number; completed: number; overdue: number }
interface Filters { search?: string; status?: string; priority?: string; assigned_to?: string }

const priorityVariant: Record<string, 'secondary' | 'default' | 'warning' | 'destructive'> = {
    low: 'secondary', medium: 'default', high: 'warning', urgent: 'destructive',
};

function formatDateTime(value: string | null): string {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

const statusIcon: Record<string, React.ReactNode> = {
    pending:     <Circle size={14} className="text-gray-400" />,
    in_progress: <Clock size={14} className="text-amber-500" />,
    completed:   <CheckCircle2 size={14} className="text-green-500" />,
};

export default function TasksIndex({ tasks, users, filters, stats }: {
    tasks: Paginator<Task>;
    users: { id: number; name: string; role: string }[];
    filters: Filters;
    stats: Stats;
}) {
    const { auth } = usePage<{ auth: { user: { role: string; id: number } } }>().props;
    const [createOpen, setCreateOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Task | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [search, setSearch] = useState(filters.search ?? '');

    const createForm = useForm({ client_id: '', title: '', description: '', assigned_to: '', priority: 'medium', due_date: '', reminder_at: '' });
    const editForm = useForm({ title: '', description: '', assigned_to: '', priority: 'medium', status: 'pending', due_date: '', reminder_at: '' });

    const isAdmin = auth.user.role === 'admin';
    const hasFilters = Object.values(filters).some(Boolean);

    useEffect(() => {
        const t = setTimeout(() => {
            if (search !== (filters.search ?? '')) applyFilter('search', search);
        }, 350);
        return () => clearTimeout(t);
    }, [search]);

    function applyFilter(key: string, value: string) {
        router.get('/tasks', { ...filters, [key]: value || undefined }, { preserveState: true, replace: true });
    }

    function clearFilters() {
        setSearch('');
        router.get('/tasks', {}, { preserveState: true, replace: true });
    }

    function submitCreate(e: React.FormEvent) {
        e.preventDefault();
        createForm.post('/tasks', { onSuccess: () => { createForm.reset(); setCreateOpen(false); } });
    }

    function openEdit(t: Task) {
        editForm.setData({
            title: t.title,
            description: t.description ?? '',
            assigned_to: t.assigned_user ? String(t.assigned_user.id) : '',
            priority: t.priority,
            status: t.status,
            due_date: t.due_date ?? '',
            reminder_at: t.reminder_at ?? '',
        });
        setEditTarget(t);
    }

    function submitEdit(e: React.FormEvent) {
        e.preventDefault();
        editForm.put(`/tasks/${editTarget!.id}`, { onSuccess: () => setEditTarget(null) });
    }

    function completeTask(id: number) {
        router.patch(`/tasks/${id}/complete`);
    }

    function confirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/tasks/${deleteTarget.id}`, { onSuccess: () => setDeleteTarget(null) });
    }

    const kpis = [
        { label: 'Pending', value: stats.pending, icon: <Circle className="h-4 w-4 text-gray-500" />, iconClass: 'bg-gray-100' },
        { label: 'In Progress', value: stats.in_progress, icon: <Clock className="h-4 w-4 text-amber-700" />, iconClass: 'bg-amber-100' },
        { label: 'Completed', value: stats.completed, icon: <CheckCircle2 className="h-4 w-4 text-emerald-700" />, iconClass: 'bg-emerald-100' },
        { label: 'Overdue', value: stats.overdue, icon: <AlertCircle className="h-4 w-4 text-red-600" />, iconClass: 'bg-red-100' },
    ];

    return (
        <>
            <Head title="Tasks" />
            <AppLayout title="Tasks">
                <div className="space-y-6">

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold tracking-[0.12em] text-amber-600">
                                <CheckSquare className="h-3 w-3" />
                                WORK
                            </span>
                            <h2 className="mt-3 text-[32px] leading-none font-semibold tracking-tight text-gray-950">
                                Tasks
                            </h2>
                            <p className="mt-2 text-sm text-gray-500">
                                Assign work, track due dates, and close the loop.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setCreateOpen(true)}
                            className="inline-flex items-center gap-2 rounded-lg bg-[#12141D] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black"
                        >
                            <Plus className="h-4 w-4" />
                            New task
                        </button>
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
                                    placeholder="Search tasks.."
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

                            <p className="ml-auto text-sm text-gray-400">{tasks.total} tasks</p>
                        </div>

                        {showFilters && (
                            <div className="flex flex-wrap gap-3 border-t border-gray-100 px-5 py-4">
                                <Select value={filters.status ?? ''} onValueChange={(v) => applyFilter('status', v)}>
                                    <SelectTrigger className="h-9 w-36 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={filters.priority ?? ''} onValueChange={(v) => applyFilter('priority', v)}>
                                    <SelectTrigger className="h-9 w-36 text-sm"><SelectValue placeholder="Priority" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All</SelectItem>
                                        {['low', 'medium', 'high', 'urgent'].map((p) => (
                                            <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="border-t border-gray-100">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-8 px-5" />
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Title</TableHead>
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Client</TableHead>
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Priority</TableHead>
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Assigned</TableHead>
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Due</TableHead>
                                        <TableHead className="w-24" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tasks.data.length === 0 ? (
                                        <TableRow className="hover:bg-transparent">
                                            <TableCell colSpan={7} className="h-56 text-center text-sm text-gray-400">
                                                No tasks found
                                            </TableCell>
                                        </TableRow>
                                    ) : tasks.data.map((t) => (
                                        <TableRow key={t.id} className={cn(t.status === 'completed' && 'opacity-50', t.is_overdue && 'bg-red-50/50')}>
                                            <TableCell className="px-5">
                                                <button type="button" onClick={() => t.status !== 'completed' && completeTask(t.id)} className="p-0.5">
                                                    {statusIcon[t.status]}
                                                </button>
                                            </TableCell>
                                            <TableCell>
                                                <p className={cn('text-sm font-medium text-gray-900', t.status === 'completed' && 'text-gray-400 line-through')}>
                                                    {t.title}
                                                </p>
                                                {t.description && <p className="mt-0.5 max-w-[200px] truncate text-xs text-gray-400">{t.description}</p>}
                                            </TableCell>
                                            <TableCell>
                                                {t.client_id ? (
                                                    <Link href={`/clients/${t.client_id}`} className="hover:text-amber-700">
                                                        <p className="text-xs font-medium text-gray-700">{t.client_name}</p>
                                                        <p className="font-mono text-[10px] text-amber-700">{t.client_number}</p>
                                                    </Link>
                                                ) : <span className="text-xs text-gray-300">—</span>}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={priorityVariant[t.priority]} className="text-[10px] capitalize">{t.priority}</Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-600">{t.assigned_user?.name ?? <span className="text-gray-300">—</span>}</TableCell>
                                            <TableCell>
                                                {t.due_date ? (
                                                    <span className={cn('text-xs', t.is_overdue ? 'font-medium text-red-600' : 'text-gray-500')}>
                                                        {t.is_overdue && <AlertCircle size={11} className="mr-1 inline" />}
                                                        {formatDateTime(t.due_date)}
                                                    </span>
                                                ) : <span className="text-xs text-gray-300">—</span>}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(t)}>
                                                        <Edit size={13} />
                                                    </Button>
                                                    {(isAdmin || t.created_by === auth.user.role) && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-red-400 hover:text-red-600"
                                                            onClick={() => setDeleteTarget(t)}
                                                        >
                                                            <Trash2 size={13} />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {tasks.last_page > 1 && (
                            <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 text-sm text-gray-500">
                                <span>Showing {tasks.data.length} of {tasks.total} tasks</span>
                                <div className="flex gap-1">
                                    {tasks.links.map((link, i) => (
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

                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
                        <form onSubmit={submitCreate} className="space-y-3">
                            <div className="space-y-1">
                                <Label className="text-xs">Title *</Label>
                                <Input placeholder="Task title" value={createForm.data.title} onChange={(e) => createForm.setData('title', e.target.value)} />
                                {createForm.errors.title && <p className="text-xs text-red-500">{createForm.errors.title}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs">Assigned To</Label>
                                    <Select value={createForm.data.assigned_to} onValueChange={(v) => createForm.setData('assigned_to', v)}>
                                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                        <SelectContent>
                                            {users.map((u) => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Priority</Label>
                                    <Select value={createForm.data.priority} onValueChange={(v) => createForm.setData('priority', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {['low', 'medium', 'high', 'urgent'].map((p) => (
                                                <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Due Date & Time</Label>
                                    <Input type="datetime-local" value={createForm.data.due_date} onChange={(e) => createForm.setData('due_date', e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Reminder</Label>
                                    <Input type="datetime-local" value={createForm.data.reminder_at} onChange={(e) => createForm.setData('reminder_at', e.target.value)} />
                                    <p className="text-[11px] text-gray-400">Leave blank to remind at the due date & time.</p>
                                </div>
                                <div className="space-y-1 col-span-2">
                                    <Label className="text-xs">Client ID (optional)</Label>
                                    <Input placeholder="Client ID" value={createForm.data.client_id} onChange={(e) => createForm.setData('client_id', e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Description</Label>
                                <Textarea rows={2} value={createForm.data.description} onChange={(e) => createForm.setData('description', e.target.value)} />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={createForm.processing}>Create Task</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
                    <DialogContent className="max-w-md">
                        <DialogHeader><DialogTitle>Edit Task</DialogTitle></DialogHeader>
                        <form onSubmit={submitEdit} className="space-y-3">
                            <div className="space-y-1">
                                <Label className="text-xs">Title *</Label>
                                <Input value={editForm.data.title} onChange={(e) => editForm.setData('title', e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs">Status</Label>
                                    <Select value={editForm.data.status} onValueChange={(v) => editForm.setData('status', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="in_progress">In Progress</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Priority</Label>
                                    <Select value={editForm.data.priority} onValueChange={(v) => editForm.setData('priority', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {['low', 'medium', 'high', 'urgent'].map((p) => (
                                                <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Assigned To</Label>
                                    <Select value={editForm.data.assigned_to} onValueChange={(v) => editForm.setData('assigned_to', v)}>
                                        <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">Unassigned</SelectItem>
                                            {users.map((u) => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Due Date & Time</Label>
                                    <Input type="datetime-local" value={editForm.data.due_date} onChange={(e) => editForm.setData('due_date', e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Reminder</Label>
                                    <Input type="datetime-local" value={editForm.data.reminder_at} onChange={(e) => editForm.setData('reminder_at', e.target.value)} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
                                <Button type="submit" disabled={editForm.processing}>Save</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Task</AlertDialogTitle>
                            <AlertDialogDescription>Delete <strong>{deleteTarget?.title}</strong>? This cannot be undone.</AlertDialogDescription>
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
