import React, { useEffect, useRef, useState } from 'react';
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
import DocumentUploadRows, {
    emptyDocumentRow,
    queuedDocumentCount,
    toDocumentPayload,
    type DocumentUploadRow,
} from '@/components/DocumentUploadRows';
import {
    ChevronLeft, Phone, Mail, Building, MapPin, Briefcase, Globe, Edit,
    DollarSign, FileText, CheckSquare, Clock, AlertCircle, CheckCircle2, Circle, GitBranch,
    LayoutDashboard, Upload, X, Download, Truck, ShieldCheck, UserCheck, UserRound,
} from 'lucide-react';
import PrintInvoiceLink from '@/components/PrintInvoiceLink';
import { ProfileTab, FleetTab, ComplianceTab, type ProfileOptions } from '@/Pages/Clients/ClientProfileForms';
import { cn } from '@/lib/utils';

interface Lead { id: number; name: string; email: string | null; phone: string | null; state: string | null; company: string | null; service_required: string | null; source: string; status: string; created_at: string }
interface Payment { id: number; invoice_amount: number; amount_received: number; balance_due: number; payment_method: string | null; transaction_reference: string | null; notes: string | null; paid_at: string | null; created_by: string | null; has_receipt: boolean; created_at: string }
interface ClientService { id: number; service_id: number; service_name: string; status: string; assigned_to: number | null; assigned_user: { name: string } | null; completion_date: string | null; notes: string | null }
interface Document { id: number; category: string; category_label: string; original_filename: string; file_size: string; uploaded_by: string | null; created_at: string }
interface Task { id: number; title: string; description: string | null; priority: string; status: string; kind?: string | null; assigned_user: { name: string } | null; due_date: string | null; is_overdue: boolean }
interface Activity { id: number; action: string; description: string; causer: string; old_value: Record<string, string> | null; new_value: Record<string, string> | null; created_at: string }
interface RelatedLead {
    id: number; name: string; status: string; service_required: string | null;
    source: string; converted_at: string | null; assigned_user: { name: string } | null; created_at: string;
}
interface Client {
    id: number; client_number: string; name: string; phone: string | null; email: string | null;
    state: string | null; company: string | null;
    status: string; status_label?: string; compliance_type: 'project' | 'monthly' | null; notes: string | null;
    client_notes: string | null;
    monthly_compliance_started_at?: string | null;
    next_compliance_due_at?: string | null;
    assigned_to: number | null; assigned_user: { id: number; name: string } | null;
    created_at: string; customer_since: string; total_invoiced: number; total_received: number; balance_due: number;
    current_package: string; overall_service_status: string; computed_next_due_date: string | null;
    next_action: string | null; next_action_due_at: string | null; truck_count: number;
    ssn_masked: string | null;
    lead: Lead | null; leads: RelatedLead[]; payments: Payment[]; client_services: ClientService[];
    documents: Document[]; tasks: Task[]; activities: Activity[]; vehicles: import('./ClientProfileForms').Vehicle[];
    [key: string]: unknown;
}
interface Props {
    client: Client;
    users: { id: number; name: string; role: string }[];
    services: { id: number; name: string; slug: string }[];
    doc_categories: Record<string, string>;
    profile_options: ProfileOptions;
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

function complianceLabel(type: string | null): string {
    if (type === 'project') return 'One-Time';
    if (type === 'monthly') return 'Monthly';
    return 'Not set';
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
                'group flex h-auto min-w-[108px] flex-1 flex-col gap-2 rounded-xl border border-transparent px-2 py-3.5 text-[13px] font-medium text-gray-400 shadow-none',
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

export default function ClientShow({ client, users, services, doc_categories, profile_options }: Props) {
    const { auth } = usePage<Props>().props;
    const { url } = usePage();
    const addPayment = url.includes('add_payment=1');
    const requestedTab = new URLSearchParams(url.split('?')[1] ?? '').get('tab');
    const [tab, setTab] = useState(addPayment ? 'payments' : (requestedTab || 'overview'));
    const [forcePayment, setForcePayment] = useState(addPayment);
    const [editOpen, setEditOpen] = useState(false);
    const [complianceOpen, setComplianceOpen] = useState(false);
    const canEdit = ['admin', 'sales', 'processing', 'manager'].includes(auth.user.role);
    const canReassign = ['admin', 'manager'].includes(auth.user.role);
    const canCreateLead = ['admin', 'sales', 'manager'].includes(auth.user.role);

    const editForm = useForm({
        name:             client.name ?? '',
        phone:            client.phone ?? '',
        email:            client.email ?? '',
        state:            client.state ?? '',
        company:          client.company ?? '',
        notes:            client.notes ?? '',
        assigned_to:      client.assigned_to ? String(client.assigned_to) : '',
        status:           client.status,
        compliance_type:  client.compliance_type ?? '',
    });
    const complianceForm = useForm({
        compliance_type: client.compliance_type ?? 'project',
    });

    useEffect(() => {
        const nextTab = addPayment ? 'payments' : (requestedTab || null);
        if (nextTab) setTab(nextTab);
    }, [url]);

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
                                    {client.name || client.lead?.name || 'Unknown client'}
                                </h2>
                                <span className="font-mono text-sm text-amber-700">{client.client_number}</span>
                                <ClientStatusBadge status={client.status} label={client.status_label} />
                                <Badge variant={client.compliance_type === 'monthly' ? 'default' : client.compliance_type === 'project' ? 'warning' : 'secondary'}>
                                    {complianceLabel(client.compliance_type)}
                                </Badge>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                                {(client.company || client.lead?.company) && <span className="inline-flex items-center gap-1.5"><Building size={14} />{client.company || client.lead?.company}</span>}
                                {(client.phone || client.lead?.phone) && <span className="inline-flex items-center gap-1.5"><Phone size={14} />{client.phone || client.lead?.phone}</span>}
                                {(client.email || client.lead?.email) && <span className="inline-flex items-center gap-1.5"><Mail size={14} />{client.email || client.lead?.email}</span>}
                                {(client.state || client.lead?.state) && <span className="inline-flex items-center gap-1.5"><MapPin size={14} />{client.state || client.lead?.state}</span>}
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                            {canCreateLead && (
                                <Link
                                    href={`/leads/create?client_id=${client.id}`}
                                    className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50"
                                >
                                    Add lead
                                </Link>
                            )}
                            {client.lead && (
                                <Link
                                    href={`/leads/${client.lead.id}`}
                                    className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50"
                                >
                                    View originating lead
                                </Link>
                            )}
                            {canEdit && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        complianceForm.setData('compliance_type', client.compliance_type ?? 'project');
                                        setComplianceOpen(true);
                                    }}
                                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50"
                                >
                                    <ShieldCheck className="h-4 w-4" /> Change compliance
                                </button>
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

                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
                        <KpiCard label="Client Status" value={client.status_label ?? client.status} icon={<UserCheck className="h-4 w-4 text-amber-700" />} iconClass="bg-amber-100" />
                        <KpiCard label="Assigned Employee" value={client.assigned_user?.name ?? 'Unassigned'} icon={<UserRound className="h-4 w-4 text-sky-700" />} iconClass="bg-sky-100" />
                        <KpiCard label="Customer Since" value={client.customer_since ?? client.created_at?.slice(0, 10)} icon={<Clock className="h-4 w-4 text-gray-600" />} iconClass="bg-gray-100" />
                        <KpiCard label="Total Revenue" value={fmt(client.total_received)} icon={<CheckCircle2 className="h-4 w-4 text-emerald-700" />} iconClass="bg-emerald-100" />
                        <KpiCard label="Outstanding Balance" value={fmt(client.balance_due)} icon={<AlertCircle className="h-4 w-4 text-red-600" />} iconClass="bg-red-100" />
                        <KpiCard label="Current Package" value={client.current_package} icon={<Briefcase className="h-4 w-4 text-amber-700" />} iconClass="bg-amber-100" />
                        <KpiCard label="Overall Service Status" value={client.overall_service_status} icon={<CheckSquare className="h-4 w-4 text-blue-700" />} iconClass="bg-blue-100" />
                        <KpiCard label="Next Action" value={client.next_action || '—'} icon={<GitBranch className="h-4 w-4 text-gray-600" />} iconClass="bg-gray-100" />
                        <KpiCard label="Next Due Date" value={client.computed_next_due_date || client.next_action_due_at || '—'} icon={<Clock className="h-4 w-4 text-red-600" />} iconClass="bg-red-50" />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {['admin', 'processing'].includes(auth.user.role) && (
                            <Button type="button" variant="outline" size="sm" onClick={() => setTab('operations')}>Add Service</Button>
                        )}
                        {canEdit && <Button type="button" variant="outline" size="sm" onClick={() => setTab('fleet')}>Add Vehicle</Button>}
                        {['admin', 'processing'].includes(auth.user.role) && (
                            <Button type="button" variant="outline" size="sm" onClick={() => setTab('documents')}>Upload Document</Button>
                        )}
                        {['admin', 'sales'].includes(auth.user.role) && (
                            <Button type="button" variant="outline" size="sm" onClick={() => { setTab('payments'); setForcePayment(true); }}>Record Payment</Button>
                        )}
                        {canEdit && <Button type="button" variant="outline" size="sm" onClick={() => setEditOpen(true)}>Add Note</Button>}
                        <Button type="button" variant="outline" size="sm" onClick={() => setTab('tasks')}>Create Task</Button>
                    </div>

                    <Tabs value={tab} onValueChange={setTab}>
                        <TabsList className="flex h-auto w-full flex-wrap gap-1 rounded-2xl border border-gray-200/80 bg-white p-1.5 text-gray-400 shadow-sm">
                            <ClientTab value="overview" label="Overview" icon={<LayoutDashboard className="h-4 w-4" />} />
                            <ClientTab value="profile" label="Profile" icon={<UserRound className="h-4 w-4" />} />
                            <ClientTab value="fleet" label="Fleet" icon={<Truck className="h-4 w-4" />} badge={client.truck_count || undefined} />
                            <ClientTab value="compliance" label="Compliance" icon={<ShieldCheck className="h-4 w-4" />} />
                            <ClientTab
                                value="payments"
                                label="Payments"
                                icon={<DollarSign className="h-4 w-4" />}
                                alert={client.balance_due > 0}
                            />
                            <ClientTab
                                value="operations"
                                label="Services"
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
                                    <h3 className="text-base font-semibold text-gray-950">Related leads</h3>
                                    <div className="mt-4 space-y-3">
                                        {(client.leads ?? []).length === 0 ? (
                                            <p className="text-sm text-gray-400">
                                                No leads linked yet.{canCreateLead ? ' Add a lead to work this account through the pipeline.' : ''}
                                            </p>
                                        ) : (client.leads ?? []).map((l) => (
                                            <Link
                                                key={l.id}
                                                href={`/leads/${l.id}`}
                                                className="flex items-start justify-between gap-3 rounded-xl border border-gray-100 px-3 py-3 transition-colors hover:border-amber-200 hover:bg-amber-50/40"
                                            >
                                                <div>
                                                    <p className="font-medium text-gray-900">{l.name}</p>
                                                    <p className="mt-0.5 text-xs text-gray-400">
                                                        {l.service_required || 'No service'} · {l.source} · {l.created_at}
                                                        {l.assigned_user?.name ? ` · ${l.assigned_user.name}` : ''}
                                                    </p>
                                                </div>
                                                <LeadStatusBadge status={l.status} />
                                            </Link>
                                        ))}
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
                                    <h3 className="text-base font-semibold text-gray-950">Assignment & notes</h3>
                                    <div className="mt-4 space-y-4">
                                        <div>
                                            <p className="text-xs text-gray-400">Compliance</p>
                                            <p className="mt-0.5 text-sm text-gray-800">{complianceLabel(client.compliance_type)}</p>
                                            {client.compliance_type === 'monthly' && (
                                                <p className="mt-1 text-xs text-gray-400">
                                                    Started {client.monthly_compliance_started_at || '—'}
                                                    {client.next_compliance_due_at ? ` · Next due ${client.next_compliance_due_at}` : ''}
                                                </p>
                                            )}
                                        </div>
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
                                        {client.client_notes && (
                                            <div>
                                                <p className="text-xs text-gray-400">Client notes</p>
                                                <p className="mt-0.5 whitespace-pre-wrap text-sm text-gray-700">{client.client_notes}</p>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
                                    <h3 className="text-base font-semibold text-gray-950">Payments & invoices</h3>
                                    <p className="mt-3 text-sm text-gray-600">{client.payments.length} payment{client.payments.length === 1 ? '' : 's'} · Invoiced {fmt(client.total_invoiced)}</p>
                                    <button type="button" className="mt-3 text-sm font-medium text-amber-700" onClick={() => setTab('payments')}>View payments</button>
                                </section>
                                <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
                                    <h3 className="text-base font-semibold text-gray-950">Documents</h3>
                                    <p className="mt-3 text-sm text-gray-600">{client.documents.length} file{client.documents.length === 1 ? '' : 's'} on file</p>
                                    <button type="button" className="mt-3 text-sm font-medium text-amber-700" onClick={() => setTab('documents')}>View documents</button>
                                </section>
                                <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm lg:col-span-2">
                                    <h3 className="text-base font-semibold text-gray-950">Recent activity</h3>
                                    <div className="mt-3">
                                        <ActivityTimeline activities={client.activities.slice(0, 5)} />
                                    </div>
                                    <button type="button" className="mt-3 text-sm font-medium text-amber-700" onClick={() => setTab('timeline')}>Open timeline</button>
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

                        <TabsContent value="profile" className="mt-5">
                            <ProfileTab client={client as never} options={profile_options} canEdit={canEdit} />
                        </TabsContent>
                        <TabsContent value="fleet" className="mt-5">
                            <FleetTab clientId={client.id} vehicles={client.vehicles ?? []} options={profile_options} canEdit={canEdit} />
                        </TabsContent>
                        <TabsContent value="compliance" className="mt-5">
                            <ComplianceTab client={client as never} options={profile_options} canEdit={canEdit} tasks={client.tasks} />
                        </TabsContent>

                        <TabsContent value="payments" className="mt-5">
                            <PaymentsTab clientId={client.id} payments={client.payments} canEdit={['admin', 'sales'].includes(auth.user.role)} autoOpen={forcePayment} />
                        </TabsContent>
                        <TabsContent value="operations" className="mt-5">
                            <OperationsTab clientId={client.id} assigned={client.client_services} catalog={services} users={users} canEdit={['admin', 'processing'].includes(auth.user.role)} />
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
                                <Label className="text-xs">Name</Label>
                                <Input value={editForm.data.name} onChange={(e) => editForm.setData('name', e.target.value)} />
                                {editForm.errors.name && <p className="text-xs text-red-500">{editForm.errors.name}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs">Phone</Label>
                                    <Input value={editForm.data.phone} onChange={(e) => editForm.setData('phone', e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Email</Label>
                                    <Input type="email" value={editForm.data.email} onChange={(e) => editForm.setData('email', e.target.value)} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs">Company</Label>
                                    <Input value={editForm.data.company} onChange={(e) => editForm.setData('company', e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">State</Label>
                                    <Input value={editForm.data.state} onChange={(e) => editForm.setData('state', e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Status</Label>
                                <Select value={editForm.data.status} onValueChange={(v) => editForm.setData('status', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(profile_options.statuses).map(([value, label]) => (
                                            <SelectItem key={value} value={value}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {canReassign && (
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
                            )}
                            <div className="space-y-1">
                                <Label className="text-xs">Compliance</Label>
                                <Select value={editForm.data.compliance_type} onValueChange={(v) => editForm.setData('compliance_type', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="project">One-Time</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                    </SelectContent>
                                </Select>
                                {editForm.errors.compliance_type && <p className="text-xs text-red-500">{editForm.errors.compliance_type}</p>}
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

                <Dialog open={complianceOpen} onOpenChange={setComplianceOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Change compliance</DialogTitle>
                        </DialogHeader>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                complianceForm.post(`/clients/${client.id}/compliance`, {
                                    onSuccess: () => setComplianceOpen(false),
                                });
                            }}
                            className="space-y-4"
                        >
                            <p className="text-sm text-gray-500">
                                Convert this client from a regular account to Monthly, or switch back to One-Time.
                                Choosing Monthly records today&apos;s date, sets the next compliance date 30 days later,
                                and creates an automatic reminder for the assigned user and admins.
                            </p>
                            <div className="space-y-1">
                                <Label className="text-xs">Compliance type</Label>
                                <Select value={complianceForm.data.compliance_type} onValueChange={(v) => complianceForm.setData('compliance_type', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="project">One-Time</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                    </SelectContent>
                                </Select>
                                {complianceForm.errors.compliance_type && (
                                    <p className="text-xs text-red-500">{complianceForm.errors.compliance_type}</p>
                                )}
                            </div>
                            {complianceForm.data.compliance_type === 'monthly' && (
                                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                    Completing the monthly compliance task will automatically schedule the next 30-day reminder.
                                </p>
                            )}
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setComplianceOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={complianceForm.processing}>Save compliance</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </AppLayout>
        </>
    );
}

function PaymentsTab({ clientId, payments, canEdit, autoOpen = false }: { clientId: number; payments: Payment[]; canEdit: boolean; autoOpen?: boolean }) {
    const [open, setOpen] = useState(autoOpen && canEdit);
    const form = useForm<{
        invoice_amount: string;
        amount_received: string;
        payment_method: string;
        transaction_reference: string;
        notes: string;
        paid_at: string;
        client_id: string;
        receipt: File | null;
    }>({
        invoice_amount: '',
        amount_received: '',
        payment_method: '',
        transaction_reference: '',
        notes: '',
        paid_at: '',
        client_id: String(clientId),
        receipt: null,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/payments', {
            forceFormData: true,
            onSuccess: () => { form.reset(); setOpen(false); },
        });
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
                            <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Proof</TableHead>
                            <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Print</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payments.length === 0 ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={9} className="h-48 text-center text-sm text-gray-400">No payments recorded</TableCell>
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
                                <TableCell>
                                    {p.has_receipt ? (
                                        <a
                                            href={`/payments/${p.id}/receipt`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-800"
                                        >
                                            <Download className="h-3.5 w-3.5" /> View
                                        </a>
                                    ) : (
                                        <span className="text-xs text-gray-300">—</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <PrintInvoiceLink paymentId={p.id} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </section>

            <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) form.reset(); }}>
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
                        <PaymentProofField
                            file={form.data.receipt}
                            error={form.errors.receipt}
                            onChange={(file) => form.setData('receipt', file)}
                        />
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

function OperationsTab({
    clientId,
    assigned,
    catalog,
    users,
    canEdit,
}: {
    clientId: number;
    assigned: ClientService[];
    catalog: { id: number; name: string; slug: string }[];
    users: { id: number; name: string; role: string }[];
    canEdit: boolean;
}) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [addOpen, setAddOpen] = useState(false);
    const form = useForm({ status: '', assigned_to: '', completion_date: '', notes: '' });
    const addForm = useForm({ client_id: String(clientId), service_id: '', assigned_to: '', notes: '' });
    const available = catalog.filter((s) => !assigned.some((cs) => cs.service_id === s.id));

    function openEdit(cs: ClientService) {
        form.setData({ status: cs.status, assigned_to: cs.assigned_to ? String(cs.assigned_to) : '', completion_date: cs.completion_date ?? '', notes: cs.notes ?? '' });
        setEditingId(cs.id);
    }

    function submitEdit(e: React.FormEvent) {
        e.preventDefault();
        form.put(`/operations/${editingId}`, { onSuccess: () => setEditingId(null) });
    }

    function submitAdd(e: React.FormEvent) {
        e.preventDefault();
        addForm.post('/operations', {
            onSuccess: () => { addForm.reset(); setAddOpen(false); },
        });
    }

    return (
        <div className="space-y-4">
            {canEdit && (
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => setAddOpen(true)}
                        disabled={available.length === 0}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#12141D] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black disabled:opacity-50"
                    >
                        <Briefcase className="h-4 w-4" /> Assign service
                    </button>
                </div>
            )}
            {assigned.length === 0 ? (
                <section className="flex h-48 items-center justify-center rounded-2xl border border-gray-200/80 bg-white text-sm text-gray-400 shadow-sm">
                    No services assigned to this client.
                </section>
            ) : assigned.map((cs) => (
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

            <Dialog open={addOpen} onOpenChange={(next) => { setAddOpen(next); if (!next) addForm.reset(); }}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Assign service</DialogTitle></DialogHeader>
                    <form onSubmit={submitAdd} className="space-y-3">
                        <Field label="Service *" error={addForm.errors.service_id}>
                            <Select value={addForm.data.service_id} onValueChange={(v) => addForm.setData('service_id', v)}>
                                <SelectTrigger><SelectValue placeholder="Select a service" /></SelectTrigger>
                                <SelectContent>
                                    {available.map((s) => (
                                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label="Assign to" error={addForm.errors.assigned_to}>
                            <Select value={addForm.data.assigned_to} onValueChange={(v) => addForm.setData('assigned_to', v)}>
                                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                                <SelectContent>
                                    {users.filter((u) => ['admin', 'processing'].includes(u.role)).map((u) => (
                                        <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label="Notes" error={addForm.errors.notes}>
                            <Textarea rows={2} placeholder="Optional" value={addForm.data.notes} onChange={(e) => addForm.setData('notes', e.target.value)} />
                        </Field>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={addForm.processing || !addForm.data.service_id}>Assign</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

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
                        {form.data.status !== 'completed' && (
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
                        )}
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
    const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
    const [rows, setRows] = useState<DocumentUploadRow[]>([emptyDocumentRow()]);
    const [processing, setProcessing] = useState(false);
    const errors = usePage().props.errors as Record<string, string>;
    const queued = queuedDocumentCount(rows);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        setProcessing(true);
        router.post('/documents', { client_id: clientId, documents: toDocumentPayload(rows) }, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => setRows([emptyDocumentRow()]),
            onFinish: () => setProcessing(false),
        });
    }

    function deleteDoc() {
        if (!deleteTarget) return;
        router.delete(`/documents/${deleteTarget.id}`, { onSuccess: () => setDeleteTarget(null) });
    }

    return (
        <div className="space-y-4">
            {documents.length === 0 && !canUpload && (
                <section className="flex h-48 items-center justify-center rounded-2xl border border-gray-200/80 bg-white text-sm text-gray-400 shadow-sm">
                    No documents uploaded yet
                </section>
            )}
            {documents.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {documents.map((doc) => (
                    <section key={doc.id} className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="text-[11px] font-semibold tracking-[0.12em] text-amber-700 uppercase">{doc.category_label}</p>
                                <a href={`/documents/${doc.id}/view`} target="_blank" rel="noreferrer" className="mt-1 block truncate text-sm text-gray-800 hover:text-amber-700 hover:underline">
                                    {doc.original_filename}
                                </a>
                                <p className="mt-1 text-xs text-gray-400">{doc.file_size} · {doc.created_at}</p>
                                <p className="text-xs text-gray-400">By {doc.uploaded_by ?? '—'}</p>
                            </div>
                            <div className="flex shrink-0 gap-1">
                                <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
                                    <a href={`/documents/${doc.id}/view`} target="_blank" rel="noreferrer" title="View document">
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
            )}

            {canUpload && (
                <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm sm:p-8">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h3 className="text-base font-semibold text-gray-950">Add documents</h3>
                            <p className="mt-1 text-sm text-gray-400">Each file needs a document type. Use + to add another row.</p>
                        </div>
                        {queued > 0 && (
                            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                                {queued} file{queued === 1 ? '' : 's'} ready
                            </span>
                        )}
                    </div>
                    <form onSubmit={submit} className="mt-6 space-y-4">
                        <DocumentUploadRows
                            categories={categories}
                            rows={rows}
                            onChange={setRows}
                            errors={errors}
                        />
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={processing || queued === 0}
                                className="inline-flex items-center rounded-lg bg-[#12141D] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black disabled:opacity-50"
                            >
                                {processing ? 'Uploading…' : queued === 0 ? 'Upload' : `Upload ${queued} file${queued === 1 ? '' : 's'}`}
                            </button>
                        </div>
                    </form>
                </section>
            )}

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
                                    {t.description && (
                                        <p className={cn('mt-0.5 text-sm text-gray-500', t.status === 'completed' && 'text-gray-400')}>{t.description}</p>
                                    )}
                                    <p className="mt-0.5 text-xs text-gray-400">
                                        {t.assigned_user?.name ?? 'Unassigned'}
                                        {t.due_date && ` · Due ${new Date(t.due_date).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`}
                                        {t.is_overdue && <span className="ml-1 text-red-500">Overdue</span>}
                                    </p>
                                </div>
                            </div>
                            <Badge variant={priorityVariant[t.priority] ?? 'secondary'} className="text-[10px] capitalize">{t.priority}</Badge>
                        </div>
                        {t.status !== 'completed' && (
                            <div className="mt-3 flex justify-end">
                                <Button type="button" size="sm" variant="outline" onClick={() => router.patch(`/tasks/${t.id}/complete`)}>
                                    Mark complete
                                </Button>
                            </div>
                        )}
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
                        <Field label="Description" error={form.errors.description}>
                            <Textarea rows={3} placeholder="What needs to be done?" value={form.data.description} onChange={(e) => form.setData('description', e.target.value)} />
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
                            <Field label="Due Date & Time" error={form.errors.due_date}>
                                <Input type="datetime-local" value={form.data.due_date} onChange={(e) => form.setData('due_date', e.target.value)} />
                            </Field>
                            <Field label="Reminder" error={form.errors.reminder_at}>
                                <Input type="datetime-local" value={form.data.reminder_at} onChange={(e) => form.setData('reminder_at', e.target.value)} />
                                <p className="text-[11px] text-gray-400">Leave blank to remind at the due date & time.</p>
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
            <p className="mt-4 truncate text-[22px] leading-tight font-semibold tracking-tight text-gray-950" title={String(value)}>{value}</p>
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

const PROOF_ACCEPT = '.jpg,.jpeg,.png,.pdf';
const PROOF_EXT = ['jpg', 'jpeg', 'png', 'pdf'];
const PROOF_MAX_BYTES = 5 * 1024 * 1024;

function PaymentProofField({
    file,
    onChange,
    error,
}: {
    file: File | null;
    onChange: (file: File | null) => void;
    error?: string;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [over, setOver] = useState(false);

    function take(incoming?: File) {
        if (!incoming) return;
        const ext = incoming.name.split('.').pop()?.toLowerCase() ?? '';
        if (!PROOF_EXT.includes(ext) || incoming.size > PROOF_MAX_BYTES) return;
        onChange(incoming);
    }

    function formatSize(bytes: number) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    return (
        <Field label="Payment proof" error={error}>
            {file ? (
                <div className="flex items-center gap-2 rounded-xl border border-gray-200/80 bg-[#FAFAF8] px-3 py-2">
                    <FileText className="h-4 w-4 shrink-0 text-amber-700" />
                    <span className="min-w-0 flex-1 truncate text-xs text-gray-800">{file.name}</span>
                    <span className="shrink-0 text-[10px] text-gray-400">{formatSize(file.size)}</span>
                    <button
                        type="button"
                        onClick={() => onChange(null)}
                        className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-red-50 hover:text-red-600"
                        aria-label="Remove payment proof"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setOver(true); }}
                    onDragLeave={() => setOver(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setOver(false);
                        take(e.dataTransfer.files[0]);
                    }}
                    className={cn(
                        'flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-3 py-5 text-center transition-colors',
                        over
                            ? 'border-[#C4A035] bg-amber-50'
                            : 'border-gray-200 bg-[#FAFAF8] hover:border-[#C4A035]/60 hover:bg-amber-50/40',
                    )}
                >
                    <Upload className={cn('mb-1.5 h-4 w-4', over ? 'text-amber-700' : 'text-gray-400')} />
                    <span className="text-xs font-medium text-gray-600">Drop screenshot or PDF, or click to browse</span>
                    <span className="mt-0.5 text-[11px] text-gray-400">JPG, PNG, or PDF · max 5 MB</span>
                </button>
            )}
            <input
                ref={inputRef}
                type="file"
                accept={PROOF_ACCEPT}
                className="hidden"
                onChange={(e) => {
                    take(e.target.files?.[0]);
                    e.target.value = '';
                }}
            />
        </Field>
    );
}

function ClientStatusBadge({ status, label }: { status: string; label?: string }) {
    const map: Record<string, 'success' | 'secondary' | 'outline' | 'warning' | 'default'> = {
        lead: 'secondary',
        onboarding: 'info' as never,
        documents_pending: 'warning',
        payment_pending: 'warning',
        in_progress: 'success',
        government_review: 'default',
        completed: 'secondary',
        compliance: 'success',
        inactive: 'outline',
        active: 'success',
    };
    return <Badge variant={map[status] ?? 'secondary'}>{label ?? status.replaceAll('_', ' ')}</Badge>;
}

function ServiceStatusBadge({ status }: { status: string }) {
    const map: Record<string, 'default' | 'warning' | 'success'> = { pending: 'default', in_progress: 'warning', completed: 'success' };
    const label: Record<string, string> = { pending: 'Pending', in_progress: 'In Progress', completed: 'Completed' };
    return <Badge variant={map[status] ?? 'default'}>{label[status] ?? status}</Badge>;
}
