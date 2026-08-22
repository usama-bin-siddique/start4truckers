import React, { useEffect, useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import LeadStatusBadge from '@/components/LeadStatusBadge';
import ActivityTimeline from '@/components/ActivityTimeline';
import CategoryDropzones, { queuedFileCount } from '@/components/CategoryDropzones';
import {
    Phone, Mail, MessageCircle, Edit, UserPlus, ArrowRightCircle,
    Building, MapPin, Briefcase, Globe, ChevronLeft, Clock,
    FileText, DollarSign, PhoneCall,
} from 'lucide-react';

interface Activity {
    id: number; action: string; description: string; causer: string;
    old_value: Record<string, string> | null; new_value: Record<string, string> | null;
    created_at: string;
}
interface LeadDoc {
    id: number; category: string; category_label: string; original_filename: string;
    file_size: string; uploaded_by: string | null; created_at: string;
}
interface LeadInvoice {
    id: number; amount: number; notes: string | null; created_by: string | null; created_at: string;
}
interface Lead {
    id: number; name: string; phone: string | null; email: string | null;
    state: string | null; company: string | null; service_required: string | null;
    notes: string | null; source: string; status: string; assigned_to: number | null;
    assigned_user: { id: number; name: string } | null;
    converted_at: string | null; converted_by: string | null;
    client_id: number | null; client_number: string | null; client_name: string | null;
    client_compliance_type: 'project' | 'monthly' | null;
    reviewed_at: string | null; sla_started_at: string | null; sla_expires_at: string | null;
    sla_completed_at: string | null; sla_breached_at: string | null;
    created_at: string; updated_at: string; activities: Activity[];
    documents: LeadDoc[]; invoices: LeadInvoice[];
}
interface User { id: number; name: string; role: string }

interface Props {
    lead: Lead;
    users: User[];
    statuses: Record<string, string>;
    doc_categories: Record<string, string>;
    services?: { id: number; name: string; slug: string }[];
    auth: { user: { role: string; id: number } };
}

export default function LeadShow({ lead, users, statuses, doc_categories = {}, services = [] }: Props) {
    const { auth, errors } = usePage<Props>().props;
    const [editOpen, setEditOpen] = useState(false);
    const [assignOpen, setAssignOpen] = useState(false);
    const [noteOpen, setNoteOpen] = useState(false);
    const [convertOpen, setConvertOpen] = useState(false);
    const [followOpen, setFollowOpen] = useState(false);
    const [invoiceOpen, setInvoiceOpen] = useState(false);
    const [uploadOpen, setUploadOpen] = useState(false);
    const [files, setFiles] = useState<Record<string, File[]>>({});
    const [uploading, setUploading] = useState(false);
    const canUpload = ['admin', 'sales', 'manager', 'processing'].includes(auth.user.role);
    const canReassign = ['admin', 'manager'].includes(auth.user.role);
    const queued = queuedFileCount(files);
    const uploadError = firstUploadError((errors ?? {}) as Record<string, string>);

    const editForm = useForm({
        name: lead.name, phone: lead.phone ?? '', email: lead.email ?? '',
        state: lead.state ?? '', company: lead.company ?? '',
        service_required: lead.service_required ?? '', notes: lead.notes ?? '',
        source: lead.source, status: lead.status,
        assigned_to: lead.assigned_to ? String(lead.assigned_to) : '',
    });

    const assignForm = useForm({ assigned_to: '' });
    const noteForm   = useForm({ note: '' });
    const followForm = useForm({ notes: '' });
    const invoiceForm = useForm({ amount: '', notes: '' });
    const convertForm = useForm({ compliance_type: '' });

    function submitEdit(e: React.FormEvent) {
        e.preventDefault();
        editForm.put(`/leads/${lead.id}`, { onSuccess: () => setEditOpen(false) });
    }

    function submitAssign(e: React.FormEvent) {
        e.preventDefault();
        assignForm.post(`/leads/${lead.id}/assign`, { onSuccess: () => setAssignOpen(false) });
    }

    function submitNote(e: React.FormEvent) {
        e.preventDefault();
        noteForm.post(`/leads/${lead.id}/note`, {
            onSuccess: () => { noteForm.reset(); setNoteOpen(false); },
        });
    }

    function submitConvert(e: React.FormEvent) {
        e.preventDefault();
        convertForm.post(`/leads/${lead.id}/convert`, { onSuccess: () => setConvertOpen(false) });
    }

    const statusLocked = lead.status === 'won' || lead.status === 'lost';

    function updateStatus(status: string) {
        if (statusLocked) return;
        router.patch(`/leads/${lead.id}/status`, { status });
    }

    function logCall() {
        router.post(`/leads/${lead.id}/call`, {}, {
            onSuccess: () => {
                if (lead.phone) window.open(`tel:${lead.phone}`);
            },
        });
    }

    function submitFollow(e: React.FormEvent) {
        e.preventDefault();
        followForm.post(`/leads/${lead.id}/follow-up`, {
            onSuccess: () => { followForm.reset(); setFollowOpen(false); },
        });
    }

    function submitInvoice(e: React.FormEvent) {
        e.preventDefault();
        invoiceForm.post(`/leads/${lead.id}/invoices`, {
            onSuccess: () => { invoiceForm.reset(); setInvoiceOpen(false); },
        });
    }

    function submitUpload(e: React.FormEvent) {
        e.preventDefault();
        setUploading(true);
        router.post('/documents', { lead_id: lead.id, files }, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => { setFiles({}); setUploadOpen(false); },
            onFinish: () => setUploading(false),
        });
    }

    useEffect(() => {
        if (!lead.sla_expires_at || lead.sla_completed_at || lead.sla_breached_at) return;
        const ms = new Date(lead.sla_expires_at).getTime() - Date.now();
        const t = setTimeout(() => router.reload({ only: ['lead'] }), Math.max(ms + 800, 800));
        return () => clearTimeout(t);
    }, [lead.sla_expires_at, lead.sla_completed_at, lead.sla_breached_at]);

    return (
        <>
            <Head title={`Lead — ${lead.name}`} />
            <AppLayout title="Lead Detail">
                <div className="max-w-5xl mx-auto space-y-4">

                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Link href="/leads" className="hover:text-blue-600 flex items-center gap-1">
                            <ChevronLeft size={14} /> Leads
                        </Link>
                        <span>/</span>
                        <span className="text-gray-700 font-medium">{lead.name}</span>
                    </div>

                    {/* Header */}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{lead.name}</h2>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <LeadStatusBadge status={lead.status} />
                                {lead.converted_at && (
                                    <Badge variant="success">Converted to Client</Badge>
                                )}
                                <span className="text-xs text-gray-400">
                                    Created {new Date(lead.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {lead.phone && (
                                <Button size="sm" variant="outline" onClick={logCall}>
                                    <PhoneCall size={13} /> Call
                                </Button>
                            )}
                            {lead.email && (
                                <Button size="sm" variant="outline" onClick={() => window.open(`mailto:${lead.email}`)}>
                                    <Mail size={13} /> Email
                                </Button>
                            )}
                            {lead.phone && (
                                <Button size="sm" variant="outline"
                                    onClick={() => window.open(`https://wa.me/${lead.phone!.replace(/\D/g, '')}`)}>
                                    <MessageCircle size={13} /> WhatsApp
                                </Button>
                            )}
                            {!statusLocked && (
                                <>
                                    <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                                        <Edit size={13} /> Edit
                                    </Button>
                                    {canReassign && (
                                    <Button size="sm" variant="outline" onClick={() => setAssignOpen(true)}>
                                        <UserPlus size={13} /> Assign
                                    </Button>
                                    )}
                                </>
                            )}
                            {!lead.converted_at && (
                                <Button size="sm" variant="success" onClick={() => setConvertOpen(true)}>
                                    <ArrowRightCircle size={13} /> Convert to Client
                                </Button>
                            )}
                            {lead.client_id && (
                                <Button size="sm" asChild>
                                    <Link href={`/clients/${lead.client_id}`}>View Client #{lead.client_number}</Link>
                                </Button>
                            )}
                        </div>
                    </div>

                    <SlaBanner lead={lead} />

                    <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => setNoteOpen(true)}>Add note</Button>
                        <Button size="sm" variant="outline" onClick={() => setFollowOpen(true)}>Log follow-up</Button>
                        <Button size="sm" variant="outline" onClick={() => setInvoiceOpen(true)}>
                            <DollarSign size={13} /> Record invoice
                        </Button>
                        {canUpload && (
                            <Button size="sm" variant="outline" onClick={() => setUploadOpen(true)}>
                                <FileText size={13} /> Upload documents
                            </Button>
                        )}
                    </div>

                    {/* Status quick-change — locked once won or lost */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-gray-500">Status:</span>
                        {statusLocked ? (
                            <p className="text-sm text-gray-400">
                                This lead is {lead.status === 'won' ? 'won' : 'lost'} and its status cannot be changed.
                            </p>
                        ) : (
                            <Select value={lead.status} onValueChange={updateStatus}>
                                <SelectTrigger className="h-8 w-36 text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(statuses).map(([k, v]) => (
                                        <SelectItem key={k} value={k}>{v}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                        {/* Left: Info */}
                        <div className="lg:col-span-1 space-y-4">
                            <Card>
                                <CardHeader className="pb-2"><CardTitle className="text-sm">Contact Info</CardTitle></CardHeader>
                                <CardContent className="space-y-3">
                                    <InfoRow icon={<Phone size={14} />} label="Phone" value={lead.phone} />
                                    <InfoRow icon={<Mail size={14} />} label="Email" value={lead.email} />
                                    <InfoRow icon={<Building size={14} />} label="Company" value={lead.company} />
                                    <InfoRow icon={<MapPin size={14} />} label="State" value={lead.state} />
                                    <InfoRow icon={<Briefcase size={14} />} label="Service" value={lead.service_required} />
                                    <InfoRow icon={<Globe size={14} />} label="Source" value={lead.source} />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2"><CardTitle className="text-sm">Assignment</CardTitle></CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-700">
                                        {lead.assigned_user?.name ?? <span className="text-gray-400 italic">Unassigned</span>}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2"><CardTitle className="text-sm">Related client</CardTitle></CardHeader>
                                <CardContent>
                                    {lead.client_id ? (
                                        <div className="space-y-1">
                                            <Link href={`/clients/${lead.client_id}`} className="font-medium text-amber-700 hover:underline">
                                                {lead.client_number} {lead.client_name ? `· ${lead.client_name}` : ''}
                                            </Link>
                                            <p className="text-xs text-gray-400">
                                                {lead.converted_at ? 'Converted onto this client' : 'Linked to this client. Converting will not create a duplicate.'}
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400 italic">Not linked. Convert to create a new client.</p>
                                    )}
                                    {lead.converted_by && (
                                        <p className="text-xs text-gray-400 mt-2">Converted by {lead.converted_by}</p>
                                    )}
                                </CardContent>
                            </Card>

                            {lead.notes && (
                                <Card>
                                    <CardHeader className="pb-2"><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.notes}</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Right: Timeline + Add note */}
                        <div className="lg:col-span-2 space-y-4">
                            <Card>
                                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                    <CardTitle className="text-sm">Activity Timeline</CardTitle>
                                    <Button size="sm" variant="outline" onClick={() => setNoteOpen(true)}>
                                        + Add Note
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <ActivityTimeline activities={lead.activities} />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2"><CardTitle className="text-sm">Documents</CardTitle></CardHeader>
                                <CardContent className="space-y-2">
                                    {(lead.documents ?? []).length === 0 ? (
                                        <p className="text-sm text-gray-400">No documents uploaded yet</p>
                                    ) : lead.documents.map((doc) => (
                                        <div key={doc.id} className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2">
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-semibold tracking-wide text-amber-700 uppercase">{doc.category_label}</p>
                                                <a href={`/documents/${doc.id}/view`} target="_blank" rel="noreferrer" className="truncate text-sm text-gray-800 hover:text-amber-700 hover:underline">
                                                    {doc.original_filename}
                                                </a>
                                                <p className="text-xs text-gray-400">{doc.file_size} · {doc.created_at}</p>
                                            </div>
                                            <a href={`/documents/${doc.id}/view`} target="_blank" rel="noreferrer" className="text-xs text-amber-700 hover:underline">
                                                View
                                            </a>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            {(lead.invoices ?? []).length > 0 && (
                                <Card>
                                    <CardHeader className="pb-2"><CardTitle className="text-sm">Invoices</CardTitle></CardHeader>
                                    <CardContent className="space-y-2">
                                        {lead.invoices.map((inv) => (
                                            <div key={inv.id} className="flex items-center justify-between text-sm">
                                                <span className="text-gray-700">${inv.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                                <span className="text-xs text-gray-400">{inv.created_at}</span>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>

                {/* Edit Modal */}
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader><DialogTitle>Edit Lead</DialogTitle></DialogHeader>
                        <form onSubmit={submitEdit} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <FormField label="Name *" error={editForm.errors.name}>
                                    <Input value={editForm.data.name} onChange={e => editForm.setData('name', e.target.value)} />
                                </FormField>
                                <FormField label="Phone" error={editForm.errors.phone}>
                                    <Input value={editForm.data.phone} onChange={e => editForm.setData('phone', e.target.value)} />
                                </FormField>
                                <FormField label="Email" error={editForm.errors.email}>
                                    <Input type="email" value={editForm.data.email} onChange={e => editForm.setData('email', e.target.value)} />
                                </FormField>
                                <FormField label="State" error={editForm.errors.state}>
                                    <Input value={editForm.data.state} onChange={e => editForm.setData('state', e.target.value)} />
                                </FormField>
                                <FormField label="Company" error={editForm.errors.company}>
                                    <Input value={editForm.data.company} onChange={e => editForm.setData('company', e.target.value)} />
                                </FormField>
                                <FormField label="Service Required" error={editForm.errors.service_required}>
                                    {services.length > 0 ? (
                                        <Select value={editForm.data.service_required} onValueChange={v => editForm.setData('service_required', v)}>
                                            <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                                            <SelectContent>
                                                {services.map((s) => (
                                                    <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Input value={editForm.data.service_required} onChange={e => editForm.setData('service_required', e.target.value)} />
                                    )}
                                </FormField>
                            </div>
                            <FormField label="Status" error={editForm.errors.status}>
                                <Select
                                    value={editForm.data.status}
                                    onValueChange={v => editForm.setData('status', v)}
                                    disabled={statusLocked}
                                >
                                    <SelectTrigger disabled={statusLocked}><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(statuses).map(([k, v]) => (
                                            <SelectItem key={k} value={k}>{v}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {statusLocked && (
                                    <p className="mt-1 text-xs text-gray-400">Won and lost leads cannot change status.</p>
                                )}
                            </FormField>
                            {canReassign && (
                            <FormField label="Assigned To" error={editForm.errors.assigned_to}>
                                <Select value={editForm.data.assigned_to} onValueChange={v => editForm.setData('assigned_to', v)}>
                                    <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">Unassigned</SelectItem>
                                        {users.filter(u => ['admin','sales','manager'].includes(u.role)).map(u => (
                                            <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormField>
                            )}
                            <FormField label="Notes" error={editForm.errors.notes}>
                                <Textarea rows={3} value={editForm.data.notes} onChange={e => editForm.setData('notes', e.target.value)} />
                            </FormField>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={editForm.processing}>Save Changes</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Assign Modal */}
                <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
                    <DialogContent className="max-w-sm">
                        <DialogHeader><DialogTitle>Assign Lead</DialogTitle></DialogHeader>
                        <form onSubmit={submitAssign} className="space-y-4">
                            <FormField label="Assign to" error={assignForm.errors.assigned_to}>
                                <Select value={assignForm.data.assigned_to} onValueChange={v => assignForm.setData('assigned_to', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                                    <SelectContent>
                                        {users.filter(u => ['admin','sales','manager'].includes(u.role)).map(u => (
                                            <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormField>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={assignForm.processing}>Assign</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Add Note Modal */}
                <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
                    <DialogContent className="max-w-sm">
                        <DialogHeader><DialogTitle>Add Note</DialogTitle></DialogHeader>
                        <form onSubmit={submitNote} className="space-y-4">
                            <FormField label="Note" error={noteForm.errors.note}>
                                <Textarea rows={4} placeholder="Write your note here…"
                                    value={noteForm.data.note}
                                    onChange={e => noteForm.setData('note', e.target.value)} />
                            </FormField>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setNoteOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={noteForm.processing}>Add Note</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Follow-up */}
                <Dialog open={followOpen} onOpenChange={setFollowOpen}>
                    <DialogContent className="max-w-sm">
                        <DialogHeader><DialogTitle>Log follow-up</DialogTitle></DialogHeader>
                        <form onSubmit={submitFollow} className="space-y-4">
                            <FormField label="Notes" error={followForm.errors.notes}>
                                <Textarea rows={4} placeholder="What did you follow up on?"
                                    value={followForm.data.notes}
                                    onChange={e => followForm.setData('notes', e.target.value)} />
                            </FormField>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setFollowOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={followForm.processing}>Save follow-up</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
                    <DialogContent className="max-w-sm">
                        <DialogHeader><DialogTitle>Record invoice</DialogTitle></DialogHeader>
                        <form onSubmit={submitInvoice} className="space-y-4">
                            <FormField label="Amount *" error={invoiceForm.errors.amount}>
                                <Input type="number" step="0.01" placeholder="0.00"
                                    value={invoiceForm.data.amount}
                                    onChange={e => invoiceForm.setData('amount', e.target.value)} />
                            </FormField>
                            <FormField label="Notes" error={invoiceForm.errors.notes}>
                                <Textarea rows={3} value={invoiceForm.data.notes}
                                    onChange={e => invoiceForm.setData('notes', e.target.value)} />
                            </FormField>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setInvoiceOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={invoiceForm.processing}>Save invoice</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <Dialog open={uploadOpen} onOpenChange={(next) => { setUploadOpen(next); if (!next) setFiles({}); }}>
                    <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
                        <DialogHeader className="border-b border-gray-100 px-6 py-5">
                            <DialogTitle>Upload documents</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={submitUpload} className="flex min-h-0 flex-1 flex-col">
                            <div className="flex-1 overflow-y-auto px-6 py-5">
                                <CategoryDropzones categories={doc_categories ?? {}} files={files} onChange={setFiles} error={uploadError} />
                            </div>
                            <DialogFooter className="border-t border-gray-100 px-6 py-4">
                                <Button type="button" variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={uploading || queued === 0}>
                                    {uploading ? 'Uploading…' : queued === 0 ? 'Upload' : `Upload ${queued} file${queued === 1 ? '' : 's'}`}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Convert confirmation */}
                <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Convert to Client</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={submitConvert} className="space-y-4">
                            <p className="text-sm text-gray-500">
                                {lead.client_id
                                    ? <>This lead is already linked to <strong>{lead.client_number}</strong>{lead.client_name ? ` (${lead.client_name})` : ''}. Converting will mark it as Won and attach invoices, documents, and services to that client — a new client will not be created.</>
                                    : <>This will create a client profile for <strong>{lead.name}</strong> and mark this lead as Won.</>}
                            </p>
                            {(!lead.client_id || !lead.client_compliance_type) && (
                            <div className="space-y-1">
                                <Label className="text-xs">Compliance *</Label>
                                <Select value={convertForm.data.compliance_type} onValueChange={(v) => convertForm.setData('compliance_type', v)}>
                                    <SelectTrigger><SelectValue placeholder="One-Time or Monthly?" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="project">One-Time</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                    </SelectContent>
                                </Select>
                                {convertForm.errors.compliance_type && (
                                    <p className="text-xs text-red-500">{convertForm.errors.compliance_type}</p>
                                )}
                            </div>
                            )}
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setConvertOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={convertForm.processing} className="bg-green-600 hover:bg-green-700">
                                    Convert to Client
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

            </AppLayout>
        </>
    );
}

function SlaBanner({ lead }: { lead: Lead }) {
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        if (!lead.sla_expires_at || lead.sla_completed_at || lead.sla_breached_at) return;
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, [lead.sla_expires_at, lead.sla_completed_at, lead.sla_breached_at]);

    if (!lead.sla_started_at) return null;

    if (lead.sla_completed_at) {
        return (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                SLA met. An action was logged before the timer expired.
            </div>
        );
    }

    if (lead.sla_breached_at) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                SLA missed. Admin has been notified because no call, note, follow-up, status update, or invoice was logged in time.
            </div>
        );
    }

    const remaining = Math.max(0, new Date(lead.sla_expires_at!).getTime() - now);
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    const urgent = remaining <= 2 * 60 * 1000;

    return (
        <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${urgent ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-gray-200 bg-white text-gray-700'}`}>
            <Clock size={16} />
            First-open SLA: <span className="font-semibold tabular-nums">{minutes}:{String(seconds).padStart(2, '0')}</span> remaining
            <span className="text-gray-400">· log a call, note, follow-up, status change, or invoice</span>
        </div>
    );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null | undefined }) {
    if (!value) return null;
    return (
        <div className="flex items-start gap-2">
            <span className="text-gray-400 mt-0.5 shrink-0">{icon}</span>
            <div>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm text-gray-800">{value}</p>
            </div>
        </div>
    );
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <Label className="text-xs">{label}</Label>
            {children}
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}

function firstUploadError(errors: Record<string, string>): string | undefined {
    if (errors.files) return errors.files;
    if (errors.file) return errors.file;
    if (errors.category) return errors.category;
    return Object.entries(errors).find(([key]) => key.startsWith('files'))?.[1];
}
