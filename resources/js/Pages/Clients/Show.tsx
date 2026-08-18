import React, { useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ActivityTimeline from '@/components/ActivityTimeline';
import LeadStatusBadge from '@/components/LeadStatusBadge';
import CategoryDropzones, { queuedFileCount } from '@/components/CategoryDropzones';
import {
    ChevronLeft, Phone, Mail, Building, MapPin, Briefcase, Globe, Edit,
    DollarSign, FileText, CheckSquare, Clock, AlertCircle, CheckCircle2, Circle, GitBranch,
    LayoutDashboard,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Lead { id: number; name: string; email: string | null; phone: string | null; state: string | null; company: string | null; service_required: string | null; source: string; status: string; created_at: string }
interface Payment { id: number; invoice_amount: number; amount_received: number; balance_due: number; payment_method: string | null; transaction_reference: string | null; notes: string | null; paid_at: string | null; created_by: string | null; has_receipt: boolean; created_at: string }
interface ClientService { id: number; service_id: number; service_name: string; status: string; assigned_to: number | null; assigned_user: { name: string } | null; completion_date: string | null; notes: string | null }
interface Document { id: number; category: string; category_label: string; original_filename: string; file_size: string; uploaded_by: string | null; created_at: string }
interface Task { id: number; title: string; priority: string; status: string; assigned_user: { name: string } | null; due_date: string | null; is_overdue: boolean }
interface Activity { id: number; action: string; description: string; causer: string; old_value: Record<string, string> | null; new_value: Record<string, string> | null; created_at: string }
interface Client {
    id: number; client_number: string; status: string; notes: string | null;
    assigned_to: number | null; assigned_user: { id: number; name: string } | null;
    created_at: string; total_invoiced: number; total_received: number; balance_due: number;
    lead: Lead | null; payments: Payment[]; client_services: ClientService[];
    documents: Document[]; tasks: Task[]; activities: Activity[];
}
interface Props {
    client: Client;
    users: { id: number; name: string; role: string }[];
    services: { id: number; name: string; slug: string }[];
    doc_categories: Record<string, string>;
    auth: { user: { role: string; id: number } };
}

const priorityVariant: Record<string, 'default' | 'warning' | 'destructive' | 'secondary'> = {
    low: 'secondary', medium: 'default', high: 'warning', urgent: 'destructive',
};

const serviceStatusIcon: Record<string, React.ReactNode> = {
    pending:     <Circle size={14} className="text-gray-400" />,
    in_progress: <Clock size={14} className="text-amber-500" />,
    completed:   <CheckCircle2 size={14} className="text-green-500" />,
};

function fmt(n: number) {
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function ClientTab({
    value,
    icon,
    label,
    badge,
    alert,
}: {
    value: string;
    icon: React.ReactNode;
    label: string;
    badge?: React.ReactNode;
    alert?: boolean;
}) {
    return (
        <TabsTrigger
            value={value}
            className={cn(
                'group flex h-auto w-full flex-col gap-2 rounded-xl border border-transparent px-2 py-3.5 text-[13px] font-medium text-gray-400 shadow-none',
                'hover:bg-gray-50 hover:text-gray-600',
                'data-[state=active]:border-[#C4A035]/40 data-[state=active]:bg-[#12141D] data-[state=active]:text-white data-[state=active]:shadow-md',
            )}
        >
            <span className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition-colors group-data-[state=active]:bg-[#C4A035]/20 group-data-[state=active]:text-[#E0B63C]">
                {icon}
                {alert && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white group-data-[state=active]:ring-[#12141D]" />
                )}
            </span>
            <span className="flex items-center gap-1.5 leading-none">
                {label}
                {badge != null && (
                    <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-gray-500 group-data-[state=active]:bg-white/10 group-data-[state=active]:text-white/70">
                        {badge}
                    </span>
                )}
            </span>
        </TabsTrigger>
    );
}

export default function ClientShow({ client, users, services, doc_categories }: Props) {
    const { auth } = usePage<Props>().props;
    const [editOpen, setEditOpen] = useState(false);
    const canEdit = ['admin', 'sales', 'processing'].includes(auth.user.role);

    const editForm = useForm({
        notes:       client.notes ?? '',
        assigned_to: client.assigned_to ? String(client.assigned_to) : '',
        status:      client.status,
    });

    function submitEdit(e: React.FormEvent) {
        e.preventDefault();
        editForm.put(`/clients/${client.id}`, { onSuccess: () => setEditOpen(false) });
    }

    const completedServices = client.client_services.filter((s) => s.status === 'completed').length;
    const totalServices = client.client_services.length;

    return (
        <>
            <Head title={`Client ${client.client_number}`} />
            <AppLayout title="Client Profile">
                <div className="space-y-6">

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <Link href="/clients" className="mb-3 inline-flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-gray-700">
                                <ChevronLeft size={14} /> Back to clients
                            </Link>
                            <div className="mt-3">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold tracking-[0.12em] text-amber-600">
                                    <GitBranch className="h-3 w-3" />
                                    PIPELINE
                                </span>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-3">
                                <h2 className="text-[32px] leading-none font-semibold tracking-tight text-gray-950">
                                    {client.lead?.name ?? 'Unknown client'}
                                </h2>
                                <span className="font-mono text-sm text-amber-700">{client.client_number}</span>
                                <ClientStatusBadge status={client.status} />
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                                {client.lead?.company && <span className="inline-flex items-center gap-1.5"><Building size={14} />{client.lead.company}</span>}
                                {client.lead?.phone && <span className="inline-flex items-center gap-1.5"><Phone size={14} />{client.lead.phone}</span>}
                                {client.lead?.email && <span className="inline-flex items-center gap-1.5"><Mail size={14} />{client.lead.email}</span>}
                                {client.lead?.state && <span className="inline-flex items-center gap-1.5"><MapPin size={14} />{client.lead.state}</span>}
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                            {client.lead && (
                                <Link
                                    href={`/leads/${client.lead.id}`}
                                    className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50"
                                >
                                    View lead
                                </Link>
                            )}
                            {canEdit && (
                                <button
                                    type="button"
                                    onClick={() => setEditOpen(true)}
                                    className="inline-flex items-center gap-2 rounded-lg bg-[#12141D] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black"
                                >
                                    <Edit className="h-4 w-4" /> Edit
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        <KpiCard label="Invoiced" value={fmt(client.total_invoiced)} icon={<DollarSign className="h-4 w-4 text-sky-700" />} iconClass="bg-sky-100" />
                        <KpiCard label="Received" value={fmt(client.total_received)} icon={<CheckCircle2 className="h-4 w-4 text-emerald-700" />} iconClass="bg-emerald-100" />
                        <KpiCard label="Balance due" value={fmt(client.balance_due)} icon={<AlertCircle className="h-4 w-4 text-red-600" />} iconClass="bg-red-100" />
                        <KpiCard label="Services" value={`${completedServices}/${totalServices}`} icon={<Briefcase className="h-4 w-4 text-amber-700" />} iconClass="bg-amber-100" />
                    </div>

                    <Tabs defaultValue="overview">
                        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-2xl border border-gray-200/80 bg-white p-1.5 text-gray-400 shadow-sm sm:grid-cols-3 lg:grid-cols-6">
                            <ClientTab value="overview" label="Overview" icon={<LayoutDashboard className="h-4 w-4" />} />
                            <ClientTab
                                value="payments"
                                label="Payments"
                                icon={<DollarSign className="h-4 w-4" />}
                                alert={client.balance_due > 0}
                            />
                            <ClientTab
                                value="operations"
                                label="Operations"
                                icon={<Briefcase className="h-4 w-4" />}
                                badge={totalServices > 0 ? `${completedServices}/${totalServices}` : undefined}
                            />
                            <ClientTab
                                value="documents"
                                label="Documents"
                                icon={<FileText className="h-4 w-4" />}
                                badge={client.documents.length || undefined}
                            />
                            <ClientTab
                                value="tasks"
                                label="Tasks"
                                icon={<CheckSquare className="h-4 w-4" />}
                                badge={client.tasks.length || undefined}
                            />
                            <ClientTab value="timeline" label="Timeline" icon={<Clock className="h-4 w-4" />} />
                        </TabsList>

                        <TabsContent value="overview" className="mt-5">
                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
                                    <h3 className="text-base font-semibold text-gray-950">Lead information</h3>
                                    <div className="mt-4 space-y-4">
                                        <InfoRow icon={<Briefcase size={14} />} label="Service required" value={client.lead?.service_required} />
                                        <InfoRow icon={<Globe size={14} />} label="Lead source" value={client.lead?.source} />
                                        <InfoRow icon={<MapPin size={14} />} label="State" value={client.lead?.state} />
                                        {client.lead && (
                                            <div className="flex items-start gap-2">
                                                <span className="mt-0.5 shrink-0 text-gray-400"><FileText size={14} /></span>
                                                <div>
                                                    <p className="text-xs text-gray-400">Lead status</p>
                                                    <LeadStatusBadge status={client.lead.status} />
                                                </div>
                                            </div>
                                        )}
                                        <p className="pt-1 text-xs text-gray-400">
                                            Lead created {client.lead?.created_at} · Client since {client.created_at.split('T')[0]}
                                        </p>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
                                    <h3 className="text-base font-semibold text-gray-950">Assignment & notes</h3>
                                    <div className="mt-4 space-y-4">
                                        <div>
                                            <p className="text-xs text-gray-400">Assigned to</p>
                                            <p className="mt-0.5 text-sm text-gray-800">
                                                {client.assigned_user?.name ?? <span className="italic text-gray-400">Unassigned</span>}
                                            </p>
                                        </div>
                                        {client.notes && (
                                            <div>
                                                <p className="text-xs text-gray-400">Notes</p>
                                                <p className="mt-0.5 whitespace-pre-wrap text-sm text-gray-700">{client.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {client.client_services.length > 0 && (
                                    <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm lg:col-span-2">
                                        <h3 className="text-base font-semibold text-gray-950">Services progress</h3>
                                        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                                            {client.client_services.map((cs) => (
                                                <div
                                                    key={cs.id}
                                                    className={cn(
                                                        'flex items-center gap-2 rounded-xl border p-3 text-xs',
                                                        cs.status === 'completed' ? 'border-emerald-200 bg-emerald-50' :
                                                        cs.status === 'in_progress' ? 'border-amber-200 bg-amber-50' :
                                                        'border-gray-200 bg-gray-50'
                                                    )}
                                                >
                                                    {serviceStatusIcon[cs.status]}
                                                    <span className="font-medium text-gray-700">{cs.service_name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="payments" className="mt-5">
                            <PaymentsTab clientId={client.id} payments={client.payments} canEdit={['admin', 'sales'].includes(auth.user.role)} />
                        </TabsContent>
                        <TabsContent value="operations" className="mt-5">
                            <OperationsTab clientId={client.id} services={client.client_services} users={users} canEdit={['admin', 'processing'].includes(auth.user.role)} />
                        </TabsContent>
                        <TabsContent value="documents" className="mt-5">
                            <DocumentsTab clientId={client.id} documents={client.documents} categories={doc_categories} canUpload={['admin', 'processing'].includes(auth.user.role)} />
                        </TabsContent>
                        <TabsContent value="tasks" className="mt-5">
                            <TasksTab clientId={client.id} tasks={client.tasks} users={users} />
                        </TabsContent>
                        <TabsContent value="timeline" className="mt-5">
                            <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
                                <ActivityTimeline activities={client.activities} />
                            </section>
                        </TabsContent>
                    </Tabs>
                </div>

                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader><DialogTitle>Edit Client</DialogTitle></DialogHeader>
                        <form onSubmit={submitEdit} className="space-y-4">
                            <div className="space-y-1">
                                <Label className="text-xs">Status</Label>
                                <Select value={editForm.data.status} onValueChange={(v) => editForm.setData('status', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
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
                                <Label className="text-xs">Internal Notes</Label>
                                <Textarea rows={3} value={editForm.data.notes} onChange={(e) => editForm.setData('notes', e.target.value)} />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={editForm.processing}>Save</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </AppLayout>
        </>
    );
}

function PaymentsTab({ clientId, payments, canEdit }: { clientId: number; payments: Payment[]; canEdit: boolean }) {
    const [open, setOpen] = useState(false);
    const form = useForm({ invoice_amount: '', amount_received: '', payment_method: '', transaction_reference: '', notes: '', paid_at: '', client_id: String(clientId) });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/payments', { onSuccess: () => { form.reset(); setOpen(false); } });
    }

    return (
        <div className="space-y-4">
            {canEdit && (
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => setOpen(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#12141D] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black"
                    >
                        <DollarSign className="h-4 w-4" /> Add payment
                    </button>
                </div>
            )}
            <section className="rounded-2xl border border-gray-200/80 bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="px-5 text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Invoice</TableHead>
                            <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Received</TableHead>
                            <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Balance</TableHead>
                            <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Method</TableHead>
                            <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Reference</TableHead>
                            <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Date</TableHead>
                            <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">By</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payments.length === 0 ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={7} className="h-48 text-center text-sm text-gray-400">No payments recorded</TableCell>
                            </TableRow>
                        ) : payments.map((p) => (
                            <TableRow key={p.id}>
                                <TableCell className="px-5 font-medium">{fmt(p.invoice_amount)}</TableCell>
                                <TableCell className="text-emerald-600">{fmt(p.amount_received)}</TableCell>
                                <TableCell className={p.balance_due > 0 ? 'font-medium text-red-600' : 'text-emerald-600'}>{fmt(p.balance_due)}</TableCell>
                                <TableCell className="text-xs capitalize">{p.payment_method ?? '—'}</TableCell>
                                <TableCell className="font-mono text-xs">{p.transaction_reference ?? '—'}</TableCell>
                                <TableCell className="text-xs text-gray-400">{p.paid_at ?? p.created_at}</TableCell>
                                <TableCell className="text-xs text-gray-500">{p.created_by ?? '—'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </section>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Add Payment</DialogTitle></DialogHeader>
                    <form onSubmit={submit} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Invoice Amount *" error={form.errors.invoice_amount}>
                                <Input type="number" step="0.01" placeholder="0.00" value={form.data.invoice_amount} onChange={(e) => form.setData('invoice_amount', e.target.value)} />
                            </Field>
                            <Field label="Amount Received" error={form.errors.amount_received}>
                                <Input type="number" step="0.01" placeholder="0.00" value={form.data.amount_received} onChange={(e) => form.setData('amount_received', e.target.value)} />
                            </Field>
                        </div>
                        <Field label="Payment Method" error={form.errors.payment_method}>
                            <Select value={form.data.payment_method} onValueChange={(v) => form.setData('payment_method', v)}>
                                <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                                <SelectContent>
                                    {['Cash', 'Check', 'Zelle', 'Venmo', 'Bank Transfer', 'Stripe', 'Other'].map((m) => (
                                        <SelectItem key={m} value={m.toLowerCase().replace(' ', '_')}>{m}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label="Transaction Reference" error={form.errors.transaction_reference}>
                            <Input placeholder="TX-12345" value={form.data.transaction_reference} onChange={(e) => form.setData('transaction_reference', e.target.value)} />
                        </Field>
                        <Field label="Payment Date" error={form.errors.paid_at}>
                            <Input type="date" value={form.data.paid_at} onChange={(e) => form.setData('paid_at', e.target.value)} />
                        </Field>
                        <Field label="Notes" error={form.errors.notes}>
                            <Textarea rows={2} value={form.data.notes} onChange={(e) => form.setData('notes', e.target.value)} />
                        </Field>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={form.processing}>Save Payment</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function OperationsTab({ services, users, canEdit }: { clientId: number; services: ClientService[]; users: { id: number; name: string; role: string }[]; canEdit: boolean }) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const form = useForm({ status: '', assigned_to: '', completion_date: '', notes: '' });

    function openEdit(cs: ClientService) {
        form.setData({ status: cs.status, assigned_to: cs.assigned_to ? String(cs.assigned_to) : '', completion_date: cs.completion_date ?? '', notes: cs.notes ?? '' });
        setEditingId(cs.id);
    }

    function submitEdit(e: React.FormEvent) {
        e.preventDefault();
        form.put(`/operations/${editingId}`, { onSuccess: () => setEditingId(null) });
    }

    return (
        <div className="space-y-3">
            {services.length === 0 ? (
                <section className="flex h-48 items-center justify-center rounded-2xl border border-gray-200/80 bg-white text-sm text-gray-400 shadow-sm">
                    No services assigned to this client.
                </section>
            ) : services.map((cs) => (
                <section key={cs.id} className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            {serviceStatusIcon[cs.status]}
                            <div>
                                <p className="font-medium text-gray-950">{cs.service_name}</p>
                                <p className="mt-0.5 text-xs text-gray-400">
                                    {cs.assigned_user ? `Assigned: ${cs.assigned_user.name}` : 'Unassigned'}
                                    {cs.completion_date ? ` · Completed: ${cs.completion_date}` : ''}
                                </p>
                                {cs.notes && <p className="mt-1 text-xs italic text-gray-500">{cs.notes}</p>}
                            </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                            <ServiceStatusBadge status={cs.status} />
                            {canEdit && (
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openEdit(cs)}>Update</Button>
                            )}
                        </div>
                    </div>
                </section>
            ))}

            <Dialog open={editingId !== null} onOpenChange={() => setEditingId(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Update Service</DialogTitle></DialogHeader>
                    <form onSubmit={submitEdit} className="space-y-3">
                        <Field label="Status">
                            <Select value={form.data.status} onValueChange={(v) => form.setData('status', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label="Assigned To">
                            <Select value={form.data.assigned_to} onValueChange={(v) => form.setData('assigned_to', v)}>
                                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Unassigned</SelectItem>
                                    {users.filter((u) => ['admin', 'processing'].includes(u.role)).map((u) => (
                                        <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label="Completion Date">
                            <Input type="date" value={form.data.completion_date} onChange={(e) => form.setData('completion_date', e.target.value)} />
                        </Field>
                        <Field label="Notes">
                            <Textarea rows={2} value={form.data.notes} onChange={(e) => form.setData('notes', e.target.value)} />
                        </Field>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                            <Button type="submit" disabled={form.processing}>Save</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function DocumentsTab({ clientId, documents, categories, canUpload }: { clientId: number; documents: Document[]; categories: Record<string, string>; canUpload: boolean }) {
    const [open, setOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
    const [files, setFiles] = useState<Record<string, File[]>>({});
    const [processing, setProcessing] = useState(false);
    const { errors } = usePage<{ errors: Record<string, string> }>().props;
    const queued = queuedFileCount(files);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        const fd = new FormData();
        fd.append('client_id', String(clientId));
        Object.entries(files).forEach(([category, list]) => {
            list.forEach((file) => fd.append(`files[${category}][]`, file));
        });
        setProcessing(true);
        router.post('/documents', fd, {
            onSuccess: () => { setFiles({}); setOpen(false); },
            onFinish: () => setProcessing(false),
        });
    }

    function deleteDoc() {
        if (!deleteTarget) return;
        router.delete(`/documents/${deleteTarget.id}`, { onSuccess: () => setDeleteTarget(null) });
    }

    return (
        <div className="space-y-4">
            {canUpload && (
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => setOpen(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#12141D] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black"
                    >
                        Upload documents
                    </button>
                </div>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {documents.length === 0 ? (
                    <section className="col-span-full flex h-48 items-center justify-center rounded-2xl border border-gray-200/80 bg-white text-sm text-gray-400 shadow-sm">
                        No documents uploaded yet
                    </section>
                ) : documents.map((doc) => (
                    <section key={doc.id} className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="text-[11px] font-semibold tracking-[0.12em] text-amber-700 uppercase">{doc.category_label}</p>
                                <p className="mt-1 truncate text-sm text-gray-800">{doc.original_filename}</p>
                                <p className="mt-1 text-xs text-gray-400">{doc.file_size} · {doc.created_at}</p>
                                <p className="text-xs text-gray-400">By {doc.uploaded_by ?? '—'}</p>
                            </div>
                            <div className="flex shrink-0 gap-1">
                                <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
                                    <a href={`/documents/${doc.id}/download`} target="_blank" rel="noreferrer">
                                        <FileText size={13} />
                                    </a>
                                </Button>
                                {canUpload && (
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => setDeleteTarget(doc)}>✕</Button>
                                )}
                            </div>
                        </div>
                    </section>
                ))}
            </div>

            <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) setFiles({}); }}>
                <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
                    <DialogHeader className="border-b border-gray-100 px-6 py-5">
                        <DialogTitle>Upload documents</DialogTitle>
                        <p className="text-sm text-gray-500">Drop files into every category you need. All selected files upload together.</p>
                    </DialogHeader>
                    <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
                        <div className="flex-1 overflow-y-auto px-6 py-5">
                            <CategoryDropzones
                                categories={categories}
                                files={files}
                                onChange={setFiles}
                                error={errors.files}
                            />
                        </div>
                        <DialogFooter className="border-t border-gray-100 px-6 py-4">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                            <button
                                type="submit"
                                disabled={processing || queued === 0}
                                className="inline-flex items-center rounded-lg bg-[#12141D] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-black disabled:opacity-50"
                            >
                                {processing ? 'Uploading…' : queued === 0 ? 'Upload' : `Upload ${queued} file${queued === 1 ? '' : 's'}`}
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Document</AlertDialogTitle>
                        <AlertDialogDescription>Delete <strong>{deleteTarget?.original_filename}</strong>? This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={deleteDoc}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function TasksTab({ clientId, tasks, users }: { clientId: number; tasks: Task[]; users: { id: number; name: string; role: string }[] }) {
    const [open, setOpen] = useState(false);
    const form = useForm({ client_id: clientId, title: '', description: '', assigned_to: '', priority: 'medium', due_date: '', reminder_at: '' });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/tasks', { onSuccess: () => { form.reset(); setOpen(false); } });
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#12141D] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black"
                >
                    <CheckSquare className="h-4 w-4" /> Add task
                </button>
            </div>
            <div className="space-y-2">
                {tasks.length === 0 ? (
                    <section className="flex h-48 items-center justify-center rounded-2xl border border-gray-200/80 bg-white text-sm text-gray-400 shadow-sm">
                        No tasks yet
                    </section>
                ) : tasks.map((t) => (
                    <section key={t.id} className={cn('rounded-2xl border bg-white p-5 shadow-sm', t.is_overdue ? 'border-red-200' : 'border-gray-200/80')}>
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                {t.status === 'completed' ? <CheckCircle2 size={15} className="text-emerald-500" /> : t.is_overdue ? <AlertCircle size={15} className="text-red-500" /> : <Circle size={15} className="text-gray-400" />}
                                <div>
                                    <p className={cn('text-sm font-medium', t.status === 'completed' && 'text-gray-400 line-through')}>{t.title}</p>
                                    <p className="mt-0.5 text-xs text-gray-400">
                                        {t.assigned_user?.name ?? 'Unassigned'}
                                        {t.due_date && ` · Due ${t.due_date}`}
                                        {t.is_overdue && <span className="ml-1 text-red-500">Overdue</span>}
                                    </p>
                                </div>
                            </div>
                            <Badge variant={priorityVariant[t.priority] ?? 'secondary'} className="text-[10px] capitalize">{t.priority}</Badge>
                        </div>
                    </section>
                ))}
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Add Task</DialogTitle></DialogHeader>
                    <form onSubmit={submit} className="space-y-3">
                        <Field label="Title *" error={form.errors.title}>
                            <Input placeholder="Task title" value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} />
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Assigned To" error={form.errors.assigned_to}>
                                <Select value={form.data.assigned_to} onValueChange={(v) => form.setData('assigned_to', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>
                                        {users.map((u) => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </Field>
                            <Field label="Priority" error={form.errors.priority}>
                                <Select value={form.data.priority} onValueChange={(v) => form.setData('priority', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {['low', 'medium', 'high', 'urgent'].map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </Field>
                            <Field label="Due Date" error={form.errors.due_date}>
                                <Input type="date" value={form.data.due_date} onChange={(e) => form.setData('due_date', e.target.value)} />
                            </Field>
                            <Field label="Reminder" error={form.errors.reminder_at}>
                                <Input type="datetime-local" value={form.data.reminder_at} onChange={(e) => form.setData('reminder_at', e.target.value)} />
                            </Field>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={form.processing}>Add Task</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function KpiCard({ label, value, icon, iconClass }: { label: string; value: string; icon: React.ReactNode; iconClass: string }) {
    return (
        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
                <p className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">{label}</p>
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-full', iconClass)}>{icon}</div>
            </div>
            <p className="mt-4 text-[28px] leading-none font-semibold tracking-tight text-gray-950">{value}</p>
        </div>
    );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null | undefined }) {
    if (!value) return null;
    return (
        <div className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0 text-gray-400">{icon}</span>
            <div>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm text-gray-800">{value}</p>
            </div>
        </div>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <Label className="text-xs">{label}</Label>
            {children}
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}

function ClientStatusBadge({ status }: { status: string }) {
    const map: Record<string, 'success' | 'secondary' | 'outline'> = { active: 'success', completed: 'secondary', inactive: 'outline' };
    return <Badge variant={map[status] ?? 'secondary'} className="capitalize">{status}</Badge>;
}

function ServiceStatusBadge({ status }: { status: string }) {
    const map: Record<string, 'default' | 'warning' | 'success'> = { pending: 'default', in_progress: 'warning', completed: 'success' };
    const label: Record<string, string> = { pending: 'Pending', in_progress: 'In Progress', completed: 'Completed' };
    return <Badge variant={map[status] ?? 'default'}>{label[status] ?? status}</Badge>;
}
