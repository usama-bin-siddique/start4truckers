import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import LeadStatusBadge from '@/components/LeadStatusBadge';
import ActivityTimeline from '@/components/ActivityTimeline';
import {
    Phone, Mail, MessageCircle, Edit, UserPlus, ArrowRightCircle,
    Trash2, Building, MapPin, Briefcase, Globe, ChevronLeft,
} from 'lucide-react';

interface Activity {
    id: number; action: string; description: string; causer: string;
    old_value: Record<string, string> | null; new_value: Record<string, string> | null;
    created_at: string;
}
interface Lead {
    id: number; name: string; phone: string | null; email: string | null;
    state: string | null; company: string | null; service_required: string | null;
    notes: string | null; source: string; status: string; assigned_to: number | null;
    assigned_user: { id: number; name: string } | null;
    converted_at: string | null; converted_by: string | null;
    client_id: number | null; client_number: string | null;
    created_at: string; updated_at: string; activities: Activity[];
}
interface User { id: number; name: string; role: string }

interface Props {
    lead: Lead;
    users: User[];
    statuses: Record<string, string>;
    auth: { user: { role: string; id: number } };
}

export default function LeadShow({ lead, users, statuses }: Props) {
    const [editOpen, setEditOpen] = useState(false);
    const [assignOpen, setAssignOpen] = useState(false);
    const [noteOpen, setNoteOpen] = useState(false);
    const [convertOpen, setConvertOpen] = useState(false);

    const editForm = useForm({
        name: lead.name, phone: lead.phone ?? '', email: lead.email ?? '',
        state: lead.state ?? '', company: lead.company ?? '',
        service_required: lead.service_required ?? '', notes: lead.notes ?? '',
        source: lead.source, status: lead.status,
        assigned_to: lead.assigned_to ? String(lead.assigned_to) : '',
    });

    const assignForm = useForm({ assigned_to: '' });
    const noteForm   = useForm({ note: '' });

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

    function submitConvert() {
        router.post(`/leads/${lead.id}/convert`);
    }

    const statusLocked = lead.status === 'won' || lead.status === 'lost';

    function updateStatus(status: string) {
        if (statusLocked) return;
        router.patch(`/leads/${lead.id}/status`, { status });
    }

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
                                <Button size="sm" variant="outline" onClick={() => window.open(`tel:${lead.phone}`)}>
                                    <Phone size={13} /> Call
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
                            <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                                <Edit size={13} /> Edit
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setAssignOpen(true)}>
                                <UserPlus size={13} /> Assign
                            </Button>
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
                                    {lead.converted_by && (
                                        <p className="text-xs text-gray-400 mt-1">Converted by {lead.converted_by}</p>
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
                                    <Input value={editForm.data.service_required} onChange={e => editForm.setData('service_required', e.target.value)} />
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
                            <FormField label="Assigned To" error={editForm.errors.assigned_to}>
                                <Select value={editForm.data.assigned_to} onValueChange={v => editForm.setData('assigned_to', v)}>
                                    <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">Unassigned</SelectItem>
                                        {users.filter(u => ['admin','sales'].includes(u.role)).map(u => (
                                            <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormField>
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
                                        {users.filter(u => ['admin','sales'].includes(u.role)).map(u => (
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

                {/* Convert confirmation */}
                <AlertDialog open={convertOpen} onOpenChange={setConvertOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Convert to Client</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will create a new client profile for <strong>{lead.name}</strong> and mark this lead as Won.
                                The complete lead history will be preserved.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={submitConvert} className="bg-green-600 hover:bg-green-700">
                                Convert to Client
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

            </AppLayout>
        </>
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
