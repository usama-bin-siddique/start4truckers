import React, { useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ActivityTimeline from '@/components/ActivityTimeline';
import LeadStatusBadge from '@/components/LeadStatusBadge';
import { ChevronLeft, Phone, Mail, Building, MapPin, Briefcase, Globe, Edit, DollarSign, FileText, CheckSquare, Folder, Clock, AlertCircle, CheckCircle2, Circle } from 'lucide-react';
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

export default function ClientShow({ client, users, services, doc_categories }: Props) {
    const { auth } = usePage<Props>().props;
    const [editOpen, setEditOpen] = useState(false);
    const isAdmin = auth.user.role === 'admin';
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

    const completedServices = client.client_services.filter(s => s.status === 'completed').length;
    const totalServices = client.client_services.length;

    return (
        <>
            <Head title={`Client ${client.client_number}`} />
            <AppLayout title="Client Profile">
                <div className="max-w-6xl mx-auto space-y-4">

                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Link href="/clients" className="hover:text-blue-600 flex items-center gap-1">
                            <ChevronLeft size={14} /> Clients
                        </Link>
                        <span>/</span>
                        <span className="font-mono text-blue-600 font-semibold">{client.client_number}</span>
                    </div>

                    {/* Header */}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-xl font-bold text-gray-900">{client.lead?.name ?? 'Unknown Client'}</h2>
                                <span className="font-mono text-sm text-gray-400">{client.client_number}</span>
                                <ClientStatusBadge status={client.status} />
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 flex-wrap">
                                {client.lead?.company && <span className="flex items-center gap-1"><Building size={13} />{client.lead.company}</span>}
                                {client.lead?.phone  && <span className="flex items-center gap-1"><Phone size={13} />{client.lead.phone}</span>}
                                {client.lead?.email  && <span className="flex items-center gap-1"><Mail size={13} />{client.lead.email}</span>}
                                {client.lead?.state  && <span className="flex items-center gap-1"><MapPin size={13} />{client.lead.state}</span>}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {client.lead && (
                                <Button size="sm" variant="outline" asChild>
                                    <Link href={`/leads/${client.lead.id}`}>View Lead</Link>
                                </Button>
                            )}
                            {canEdit && (
                                <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                                    <Edit size={13} /> Edit
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Financial summary */}
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: 'Total Invoiced',  value: `$${client.total_invoiced.toFixed(2)}`,  color: 'text-gray-900' },
                            { label: 'Total Received',  value: `$${client.total_received.toFixed(2)}`,  color: 'text-green-600' },
                            { label: 'Balance Due',     value: `$${client.balance_due.toFixed(2)}`,     color: client.balance_due > 0 ? 'text-red-600' : 'text-green-600' },
                        ].map(s => (
                            <Card key={s.label} className="py-3 px-4">
                                <p className="text-xs text-gray-400 uppercase tracking-wide">{s.label}</p>
                                <p className={`text-xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
                            </Card>
                        ))}
                    </div>

                    {/* Tabs */}
                    <Tabs defaultValue="overview">
                        <TabsList className="flex-wrap h-auto gap-1">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="payments">
                                Payments
                                {client.balance_due > 0 && <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-red-500 inline-block" />}
                            </TabsTrigger>
                            <TabsTrigger value="operations">
                                Operations
                                {totalServices > 0 && (
                                    <span className="ml-1.5 text-[10px] text-gray-500">{completedServices}/{totalServices}</span>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="documents">Documents</TabsTrigger>
                            <TabsTrigger value="tasks">Tasks</TabsTrigger>
                            <TabsTrigger value="timeline">Timeline</TabsTrigger>
                        </TabsList>

                        {/* Overview */}
                        <TabsContent value="overview" className="mt-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <Card>
                                    <CardHeader className="pb-2"><CardTitle className="text-sm">Lead Information</CardTitle></CardHeader>
                                    <CardContent className="space-y-3">
                                        <InfoRow icon={<Briefcase size={14} />} label="Service Required" value={client.lead?.service_required} />
                                        <InfoRow icon={<Globe size={14} />}     label="Lead Source"       value={client.lead?.source} />
                                        <InfoRow icon={<MapPin size={14} />}    label="State"             value={client.lead?.state} />
                                        {client.lead && (
                                            <div className="flex items-start gap-2 pt-1">
                                                <span className="text-gray-400 mt-0.5 shrink-0"><FileText size={14} /></span>
                                                <div>
                                                    <p className="text-xs text-gray-400">Lead Status</p>
                                                    <LeadStatusBadge status={client.lead.status} />
                                                </div>
                                            </div>
                                        )}
                                        <div className="pt-1 text-xs text-gray-400">
                                            Lead created {client.lead?.created_at} · Client since {client.created_at.split('T')[0]}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2"><CardTitle className="text-sm">Assignment & Notes</CardTitle></CardHeader>
                                    <CardContent className="space-y-3">
                                        <div>
                                            <p className="text-xs text-gray-400">Assigned To</p>
                                            <p className="text-sm text-gray-800 mt-0.5">
                                                {client.assigned_user?.name ?? <span className="text-gray-400 italic">Unassigned</span>}
                                            </p>
                                        </div>
                                        {client.notes && (
                                            <div>
                                                <p className="text-xs text-gray-400">Notes</p>
                                                <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-wrap">{client.notes}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Service progress summary */}
                                {client.client_services.length > 0 && (
                                    <Card className="lg:col-span-2">
                                        <CardHeader className="pb-2"><CardTitle className="text-sm">Services Progress</CardTitle></CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                                                {client.client_services.map(cs => (
                                                    <div key={cs.id} className={cn(
                                                        'flex items-center gap-2 rounded-md border p-2.5 text-xs',
                                                        cs.status === 'completed' ? 'bg-green-50 border-green-200' :
                                                        cs.status === 'in_progress' ? 'bg-amber-50 border-amber-200' :
                                                        'bg-gray-50 border-gray-200'
                                                    )}>
                                                        {serviceStatusIcon[cs.status]}
                                                        <span className="font-medium text-gray-700">{cs.service_name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </TabsContent>

                        {/* Payments tab — rendered by sub-component */}
                        <TabsContent value="payments" className="mt-4">
                            <PaymentsTab clientId={client.id} payments={client.payments} canEdit={['admin','sales'].includes(auth.user.role)} />
                        </TabsContent>

                        {/* Operations */}
                        <TabsContent value="operations" className="mt-4">
                            <OperationsTab clientId={client.id} services={client.client_services} users={users} allServices={services} canEdit={['admin','processing'].includes(auth.user.role)} />
                        </TabsContent>

                        {/* Documents */}
                        <TabsContent value="documents" className="mt-4">
                            <DocumentsTab clientId={client.id} documents={client.documents} categories={doc_categories} canUpload={['admin','processing'].includes(auth.user.role)} />
                        </TabsContent>

                        {/* Tasks */}
                        <TabsContent value="tasks" className="mt-4">
                            <TasksTab clientId={client.id} tasks={client.tasks} users={users} />
                        </TabsContent>

                        {/* Timeline */}
                        <TabsContent value="timeline" className="mt-4">
                            <Card>
                                <CardContent className="pt-4">
                                    <ActivityTimeline activities={client.activities} />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Edit modal */}
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader><DialogTitle>Edit Client</DialogTitle></DialogHeader>
                        <form onSubmit={submitEdit} className="space-y-4">
                            <div className="space-y-1">
                                <Label className="text-xs">Status</Label>
                                <Select value={editForm.data.status} onValueChange={v => editForm.setData('status', v)}>
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
                                <Select value={editForm.data.assigned_to} onValueChange={v => editForm.setData('assigned_to', v)}>
                                    <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">Unassigned</SelectItem>
                                        {users.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Internal Notes</Label>
                                <Textarea rows={3} value={editForm.data.notes} onChange={e => editForm.setData('notes', e.target.value)} />
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

// ─── Payments Tab ────────────────────────────────────────────────────────────
function PaymentsTab({ clientId, payments, canEdit }: { clientId: number; payments: Payment[]; canEdit: boolean }) {
    const [open, setOpen] = useState(false);
    const form = useForm({ invoice_amount: '', amount_received: '', payment_method: '', transaction_reference: '', notes: '', paid_at: '' });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post(`/payments`, { data: { ...form.data, client_id: clientId }, onSuccess: () => { form.reset(); setOpen(false); } });
    }

    return (
        <div className="space-y-4">
            {canEdit && (
                <div className="flex justify-end">
                    <Button size="sm" onClick={() => setOpen(true)}><DollarSign size={13} /> Add Payment</Button>
                </div>
            )}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invoice</TableHead>
                                <TableHead>Received</TableHead>
                                <TableHead>Balance</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Reference</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>By</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payments.length === 0 ? (
                                <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-400">No payments recorded</TableCell></TableRow>
                            ) : payments.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-medium">${p.invoice_amount.toFixed(2)}</TableCell>
                                    <TableCell className="text-green-600">${p.amount_received.toFixed(2)}</TableCell>
                                    <TableCell className={p.balance_due > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>${p.balance_due.toFixed(2)}</TableCell>
                                    <TableCell className="text-xs capitalize">{p.payment_method ?? '—'}</TableCell>
                                    <TableCell className="text-xs font-mono">{p.transaction_reference ?? '—'}</TableCell>
                                    <TableCell className="text-xs text-gray-500">{p.paid_at ?? p.created_at}</TableCell>
                                    <TableCell className="text-xs text-gray-500">{p.created_by ?? '—'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Add Payment</DialogTitle></DialogHeader>
                    <form onSubmit={submit} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Invoice Amount *" error={form.errors.invoice_amount}>
                                <Input type="number" step="0.01" placeholder="0.00" value={form.data.invoice_amount} onChange={e => form.setData('invoice_amount', e.target.value)} />
                            </Field>
                            <Field label="Amount Received" error={form.errors.amount_received}>
                                <Input type="number" step="0.01" placeholder="0.00" value={form.data.amount_received} onChange={e => form.setData('amount_received', e.target.value)} />
                            </Field>
                        </div>
                        <Field label="Payment Method" error={form.errors.payment_method}>
                            <Select value={form.data.payment_method} onValueChange={v => form.setData('payment_method', v)}>
                                <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                                <SelectContent>
                                    {['Cash','Check','Zelle','Venmo','Bank Transfer','Stripe','Other'].map(m => (
                                        <SelectItem key={m} value={m.toLowerCase().replace(' ','_')}>{m}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label="Transaction Reference" error={form.errors.transaction_reference}>
                            <Input placeholder="TX-12345" value={form.data.transaction_reference} onChange={e => form.setData('transaction_reference', e.target.value)} />
                        </Field>
                        <Field label="Payment Date" error={form.errors.paid_at}>
                            <Input type="date" value={form.data.paid_at} onChange={e => form.setData('paid_at', e.target.value)} />
                        </Field>
                        <Field label="Notes" error={form.errors.notes}>
                            <Textarea rows={2} value={form.data.notes} onChange={e => form.setData('notes', e.target.value)} />
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

// ─── Operations Tab ──────────────────────────────────────────────────────────
function OperationsTab({ clientId, services, users, allServices, canEdit }: { clientId: number; services: ClientService[]; users: { id: number; name: string; role: string }[]; allServices: { id: number; name: string; slug: string }[]; canEdit: boolean }) {
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
                <Card><CardContent className="py-8 text-center text-sm text-gray-400">No services assigned to this client.</CardContent></Card>
            ) : services.map(cs => (
                <Card key={cs.id}>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                {serviceStatusIcon[cs.status]}
                                <div>
                                    <p className="font-medium text-gray-900">{cs.service_name}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {cs.assigned_user ? `Assigned: ${cs.assigned_user.name}` : 'Unassigned'}
                                        {cs.completion_date ? ` · Completed: ${cs.completion_date}` : ''}
                                    </p>
                                    {cs.notes && <p className="text-xs text-gray-500 mt-1 italic">{cs.notes}</p>}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <ServiceStatusBadge status={cs.status} />
                                {canEdit && (
                                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openEdit(cs)}>Update</Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}

            <Dialog open={editingId !== null} onOpenChange={() => setEditingId(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Update Service</DialogTitle></DialogHeader>
                    <form onSubmit={submitEdit} className="space-y-3">
                        <Field label="Status">
                            <Select value={form.data.status} onValueChange={v => form.setData('status', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label="Assigned To">
                            <Select value={form.data.assigned_to} onValueChange={v => form.setData('assigned_to', v)}>
                                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Unassigned</SelectItem>
                                    {users.filter(u => ['admin','processing'].includes(u.role)).map(u => (
                                        <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label="Completion Date">
                            <Input type="date" value={form.data.completion_date} onChange={e => form.setData('completion_date', e.target.value)} />
                        </Field>
                        <Field label="Notes">
                            <Textarea rows={2} value={form.data.notes} onChange={e => form.setData('notes', e.target.value)} />
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

// ─── Documents Tab ────────────────────────────────────────────────────────────
function DocumentsTab({ clientId, documents, categories, canUpload }: { clientId: number; documents: Document[]; categories: Record<string, string>; canUpload: boolean }) {
    const [open, setOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
    const form = useForm<{ client_id: number; category: string; file: File | null }>({ client_id: clientId, category: '', file: null });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/documents', { forceFormData: true, onSuccess: () => { form.reset(); setOpen(false); } });
    }

    function deleteDoc() {
        if (!deleteTarget) return;
        router.delete(`/documents/${deleteTarget.id}`, { onSuccess: () => setDeleteTarget(null) });
    }

    return (
        <div className="space-y-4">
            {canUpload && (
                <div className="flex justify-end">
                    <Button size="sm" onClick={() => setOpen(true)}>Upload Document</Button>
                </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {documents.length === 0 ? (
                    <Card className="col-span-full"><CardContent className="py-8 text-center text-sm text-gray-400">No documents uploaded yet</CardContent></Card>
                ) : documents.map(doc => (
                    <Card key={doc.id} className="group">
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">{doc.category_label}</p>
                                    <p className="text-sm text-gray-800 truncate mt-0.5">{doc.original_filename}</p>
                                    <p className="text-xs text-gray-400 mt-1">{doc.file_size} · {doc.created_at}</p>
                                    <p className="text-xs text-gray-400">By {doc.uploaded_by ?? '—'}</p>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                    <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
                                        <a href={`/documents/${doc.id}/download`} target="_blank" rel="noreferrer">
                                            <FileText size={13} />
                                        </a>
                                    </Button>
                                    {canUpload && (
                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-600"
                                            onClick={() => setDeleteTarget(doc)}>✕</Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
                    <form onSubmit={submit} className="space-y-3">
                        <Field label="Category *" error={form.errors.category}>
                            <Select value={form.data.category} onValueChange={v => form.setData('category', v)}>
                                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                                <SelectContent>
                                    {Object.entries(categories).map(([k, v]) => (
                                        <SelectItem key={k} value={k}>{v}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label="File *" error={form.errors.file}>
                            <Input type="file" onChange={e => form.setData('file', e.target.files?.[0] ?? null)} />
                        </Field>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={form.processing}>Upload</Button>
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

// ─── Tasks Tab ─────────────────────────────────────────────────────────────────
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
                <Button size="sm" onClick={() => setOpen(true)}><CheckSquare size={13} /> Add Task</Button>
            </div>
            <div className="space-y-2">
                {tasks.length === 0 ? (
                    <Card><CardContent className="py-8 text-center text-sm text-gray-400">No tasks yet</CardContent></Card>
                ) : tasks.map(t => (
                    <Card key={t.id} className={t.is_overdue ? 'border-red-200' : ''}>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    {t.status === 'completed' ? <CheckCircle2 size={15} className="text-green-500" /> : t.is_overdue ? <AlertCircle size={15} className="text-red-500" /> : <Circle size={15} className="text-gray-400" />}
                                    <div>
                                        <p className={cn('text-sm font-medium', t.status === 'completed' && 'line-through text-gray-400')}>{t.title}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {t.assigned_user?.name ?? 'Unassigned'}
                                            {t.due_date && ` · Due ${t.due_date}`}
                                            {t.is_overdue && <span className="text-red-500 ml-1">Overdue</span>}
                                        </p>
                                    </div>
                                </div>
                                <Badge variant={priorityVariant[t.priority] ?? 'secondary'} className="capitalize text-[10px]">{t.priority}</Badge>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Add Task</DialogTitle></DialogHeader>
                    <form onSubmit={submit} className="space-y-3">
                        <Field label="Title *" error={form.errors.title}>
                            <Input placeholder="Task title" value={form.data.title} onChange={e => form.setData('title', e.target.value)} />
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Assigned To" error={form.errors.assigned_to}>
                                <Select value={form.data.assigned_to} onValueChange={v => form.setData('assigned_to', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>
                                        {users.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </Field>
                            <Field label="Priority" error={form.errors.priority}>
                                <Select value={form.data.priority} onValueChange={v => form.setData('priority', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {['low','medium','high','urgent'].map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </Field>
                            <Field label="Due Date" error={form.errors.due_date}>
                                <Input type="date" value={form.data.due_date} onChange={e => form.setData('due_date', e.target.value)} />
                            </Field>
                            <Field label="Reminder" error={form.errors.reminder_at}>
                                <Input type="datetime-local" value={form.data.reminder_at} onChange={e => form.setData('reminder_at', e.target.value)} />
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null | undefined }) {
    if (!value) return null;
    return (
        <div className="flex items-start gap-2">
            <span className="text-gray-400 mt-0.5 shrink-0">{icon}</span>
            <div><p className="text-xs text-gray-400">{label}</p><p className="text-sm text-gray-800">{value}</p></div>
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
