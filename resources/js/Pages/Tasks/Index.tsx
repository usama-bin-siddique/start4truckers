import React, { useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Search, Plus, CheckCircle2, Circle, Clock, AlertCircle, Trash2, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Task {
    id: number; title: string; description: string | null; priority: string; status: string;
    assigned_user: { id: number; name: string } | null; created_by: string | null;
    client_id: number | null; client_name: string | null; client_number: string | null;
    due_date: string | null; is_overdue: boolean; created_at: string;
}
interface Paginator<T> { data: T[]; total: number; last_page: number; links: { url: string | null; label: string; active: boolean }[] }
interface Stats { pending: number; in_progress: number; completed: number; overdue: number }
interface Filters { search?: string; status?: string; priority?: string; assigned_to?: string }

const priorityVariant: Record<string, 'secondary' | 'default' | 'warning' | 'destructive'> = {
    low: 'secondary', medium: 'default', high: 'warning', urgent: 'destructive',
};

const statusIcon: Record<string, React.ReactNode> = {
    pending:     <Circle size={14} className="text-gray-400" />,
    in_progress: <Clock size={14} className="text-amber-500" />,
    completed:   <CheckCircle2 size={14} className="text-green-500" />,
};

export default function TasksIndex({ tasks, users, filters, stats }: { tasks: Paginator<Task>; users: { id: number; name: string; role: string }[]; filters: Filters; stats: Stats }) {
    const { auth } = usePage<{ auth: { user: { role: string; id: number } } }>().props;
    const [createOpen, setCreateOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Task | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);

    const createForm = useForm({ client_id: '', title: '', description: '', assigned_to: '', priority: 'medium', due_date: '', reminder_at: '' });
    const editForm = useForm({ title: '', description: '', assigned_to: '', priority: 'medium', status: 'pending', due_date: '', reminder_at: '' });

    function applyFilter(key: string, value: string) {
        router.get('/tasks', { ...filters, [key]: value || undefined }, { preserveState: true, replace: true });
    }

    function submitCreate(e: React.FormEvent) {
        e.preventDefault();
        createForm.post('/tasks', { onSuccess: () => { createForm.reset(); setCreateOpen(false); } });
    }

    function openEdit(t: Task) {
        editForm.setData({ title: t.title, description: t.description ?? '', assigned_to: t.assigned_user ? String(t.assigned_user.id) : '', priority: t.priority, status: t.status, due_date: t.due_date ?? '', reminder_at: '' });
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

    const isAdmin = auth.user.role === 'admin';

    return (
        <>
            <Head title="Tasks" />
            <AppLayout title="Tasks">
                <div className="space-y-4">

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: 'Pending',     value: stats.pending,     color: 'text-gray-700' },
                            { label: 'In Progress', value: stats.in_progress, color: 'text-amber-600' },
                            { label: 'Completed',   value: stats.completed,   color: 'text-green-600' },
                            { label: 'Overdue',     value: stats.overdue,     color: 'text-red-600' },
                        ].map(s => (
                            <Card key={s.label} className="py-3 px-4">
                                <p className="text-xs text-gray-400 uppercase tracking-wide">{s.label}</p>
                                <p className={cn('text-xl font-bold mt-0.5', s.color)}>{s.value}</p>
                            </Card>
                        ))}
                    </div>

                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative flex-1 min-w-[200px] max-w-xs">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <Input placeholder="Search tasks…" className="pl-8 h-8 text-sm"
                                defaultValue={filters.search ?? ''}
                                onChange={e => applyFilter('search', e.target.value)} />
                        </div>
                        <Select value={filters.status ?? ''} onValueChange={v => applyFilter('status', v)}>
                            <SelectTrigger className="h-8 w-32 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={filters.priority ?? ''} onValueChange={v => applyFilter('priority', v)}>
                            <SelectTrigger className="h-8 w-32 text-sm"><SelectValue placeholder="Priority" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All</SelectItem>
                                {['low','medium','high','urgent'].map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Button size="sm" className="ml-auto" onClick={() => setCreateOpen(true)}>
                            <Plus size={13} /> New Task
                        </Button>
                    </div>

                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-8" />
                                        <TableHead>Title</TableHead>
                                        <TableHead>Client</TableHead>
                                        <TableHead>Priority</TableHead>
                                        <TableHead>Assigned</TableHead>
                                        <TableHead>Due</TableHead>
                                        <TableHead className="w-24" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tasks.data.length === 0 ? (
                                        <TableRow><TableCell colSpan={7} className="text-center py-12 text-gray-400">No tasks found</TableCell></TableRow>
                                    ) : tasks.data.map(t => (
                                        <TableRow key={t.id} className={cn(t.status === 'completed' && 'opacity-50', t.is_overdue && 'bg-red-50/50')}>
                                            <TableCell>
                                                <button onClick={() => t.status !== 'completed' && completeTask(t.id)} className="p-0.5">
                                                    {statusIcon[t.status]}
                                                </button>
                                            </TableCell>
                                            <TableCell>
                                                <p className={cn('text-sm font-medium text-gray-900', t.status === 'completed' && 'line-through text-gray-400')}>
                                                    {t.title}
                                                </p>
                                                {t.description && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{t.description}</p>}
                                            </TableCell>
                                            <TableCell>
                                                {t.client_id ? (
                                                    <Link href={`/clients/${t.client_id}`} className="hover:text-blue-600">
                                                        <p className="text-xs font-medium text-gray-700">{t.client_name}</p>
                                                        <p className="font-mono text-[10px] text-blue-400">{t.client_number}</p>
                                                    </Link>
                                                ) : <span className="text-gray-300 text-xs">—</span>}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={priorityVariant[t.priority]} className="capitalize text-[10px]">{t.priority}</Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-600">{t.assigned_user?.name ?? <span className="text-gray-300">—</span>}</TableCell>
                                            <TableCell>
                                                {t.due_date ? (
                                                    <span className={cn('text-xs', t.is_overdue ? 'text-red-600 font-medium' : 'text-gray-500')}>
                                                        {t.is_overdue && <AlertCircle size={11} className="inline mr-1" />}
                                                        {t.due_date}
                                                    </span>
                                                ) : <span className="text-gray-300 text-xs">—</span>}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(t)}>
                                                        <Edit size={13} />
                                                    </Button>
                                                    {(isAdmin || t.created_by === auth.user.role) && (
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600"
                                                            onClick={() => setDeleteTarget(t)}>
                                                            <Trash2 size={13} />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {tasks.last_page > 1 && (
                        <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>Showing {tasks.data.length} of {tasks.total} tasks</span>
                            <div className="flex gap-1">
                                {tasks.links.map((link, i) => (
                                    <Button key={i} variant={link.active ? 'default' : 'outline'} size="sm"
                                        disabled={!link.url} onClick={() => link.url && router.get(link.url)}
                                        className="h-7 min-w-[28px] px-2 text-xs"
                                        dangerouslySetInnerHTML={{ __html: link.label }} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Create Modal */}
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
                        <form onSubmit={submitCreate} className="space-y-3">
                            <div className="space-y-1">
                                <Label className="text-xs">Title *</Label>
                                <Input placeholder="Task title" value={createForm.data.title} onChange={e => createForm.setData('title', e.target.value)} />
                                {createForm.errors.title && <p className="text-xs text-red-500">{createForm.errors.title}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs">Assigned To</Label>
                                    <Select value={createForm.data.assigned_to} onValueChange={v => createForm.setData('assigned_to', v)}>
                                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                        <SelectContent>
                                            {users.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Priority</Label>
                                    <Select value={createForm.data.priority} onValueChange={v => createForm.setData('priority', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {['low','medium','high','urgent'].map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Due Date</Label>
                                    <Input type="date" value={createForm.data.due_date} onChange={e => createForm.setData('due_date', e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Client ID (optional)</Label>
                                    <Input placeholder="Client ID" value={createForm.data.client_id} onChange={e => createForm.setData('client_id', e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Description</Label>
                                <Textarea rows={2} value={createForm.data.description} onChange={e => createForm.setData('description', e.target.value)} />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={createForm.processing}>Create Task</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Edit Modal */}
                <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
                    <DialogContent className="max-w-md">
                        <DialogHeader><DialogTitle>Edit Task</DialogTitle></DialogHeader>
                        <form onSubmit={submitEdit} className="space-y-3">
                            <div className="space-y-1">
                                <Label className="text-xs">Title *</Label>
                                <Input value={editForm.data.title} onChange={e => editForm.setData('title', e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs">Status</Label>
                                    <Select value={editForm.data.status} onValueChange={v => editForm.setData('status', v)}>
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
                                    <Select value={editForm.data.priority} onValueChange={v => editForm.setData('priority', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {['low','medium','high','urgent'].map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Assigned To</Label>
                                    <Select value={editForm.data.assigned_to} onValueChange={v => editForm.setData('assigned_to', v)}>
                                        <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">Unassigned</SelectItem>
                                            {users.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Due Date</Label>
                                    <Input type="date" value={editForm.data.due_date} onChange={e => editForm.setData('due_date', e.target.value)} />
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
