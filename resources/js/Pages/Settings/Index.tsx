import React, { useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface User { id: number; name: string; email: string; role: string; is_active: boolean }
interface ServiceItem { id: number; name: string; slug: string; description: string | null; is_active: boolean; order: number; pricing: { amount: string } | null }
interface Template { id: number; name: string; slug: string; subject: string; body: string }
interface Props {
    users: User[];
    services: ServiceItem[];
    templates: Template[];
    settings: Record<string, string>;
}

const ROLES = [
    { value: 'admin',      label: 'Admin',      color: 'bg-red-100 text-red-800' },
    { value: 'sales',      label: 'Sales',      color: 'bg-blue-100 text-blue-800' },
    { value: 'processing', label: 'Processing', color: 'bg-green-100 text-green-800' },
];

function RoleBadge({ role }: { role: string }) {
    const r = ROLES.find(x => x.value === role);
    return <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize', r?.color ?? 'bg-gray-100 text-gray-800')}>{r?.label ?? role}</span>;
}

export default function SettingsIndex({ users, services, templates, settings }: Props) {
    return (
        <>
            <Head title="Settings" />
            <AppLayout title="Settings">
                <Tabs defaultValue="users">
                    <TabsList className="flex-wrap h-auto gap-1 mb-5">
                        <TabsTrigger value="users">Users</TabsTrigger>
                        <TabsTrigger value="services">Services & Pricing</TabsTrigger>
                        <TabsTrigger value="templates">Email Templates</TabsTrigger>
                        <TabsTrigger value="api">API Settings</TabsTrigger>
                        <TabsTrigger value="general">General</TabsTrigger>
                    </TabsList>

                    <TabsContent value="users">
                        <UsersTab users={users} />
                    </TabsContent>
                    <TabsContent value="services">
                        <ServicesTab services={services} />
                    </TabsContent>
                    <TabsContent value="templates">
                        <TemplatesTab templates={templates} />
                    </TabsContent>
                    <TabsContent value="api">
                        <ApiTab settings={settings} />
                    </TabsContent>
                    <TabsContent value="general">
                        <GeneralTab settings={settings} />
                    </TabsContent>
                </Tabs>
            </AppLayout>
        </>
    );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────
function UsersTab({ users }: { users: User[] }) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<User | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

    const createForm = useForm({ name: '', email: '', password: '', role: 'sales' });
    const editForm   = useForm({ name: '', email: '', role: 'sales', is_active: true as boolean, password: '' });

    function submitCreate(e: React.FormEvent) {
        e.preventDefault();
        createForm.post('/settings/users', { onSuccess: () => { createForm.reset(); setCreateOpen(false); } });
    }
    function openEdit(u: User) {
        editForm.setData({ name: u.name, email: u.email, role: u.role, is_active: u.is_active, password: '' });
        setEditTarget(u);
    }
    function submitEdit(e: React.FormEvent) {
        e.preventDefault();
        editForm.put(`/settings/users/${editTarget!.id}`, { onSuccess: () => setEditTarget(null) });
    }
    function confirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/settings/users/${deleteTarget.id}`, { onSuccess: () => setDeleteTarget(null) });
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-gray-900">Users</h3>
                    <p className="text-sm text-gray-500">Manage CRM user accounts and roles</p>
                </div>
                <Button size="sm" onClick={() => setCreateOpen(true)}><Plus size={13} /> Add User</Button>
            </div>
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-20" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map(u => (
                                <TableRow key={u.id}>
                                    <TableCell className="font-medium text-sm">{u.name}</TableCell>
                                    <TableCell className="text-sm text-gray-600">{u.email}</TableCell>
                                    <TableCell><RoleBadge role={u.role} /></TableCell>
                                    <TableCell>
                                        {u.is_active
                                            ? <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle size={12} /> Active</span>
                                            : <span className="flex items-center gap-1 text-xs text-gray-400"><XCircle size={12} /> Inactive</span>}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(u)}><Edit size={13} /></Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => setDeleteTarget(u)}><Trash2 size={13} /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Create */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Add User</DialogTitle></DialogHeader>
                    <form onSubmit={submitCreate} className="space-y-3">
                        <Field label="Full Name *" error={createForm.errors.name}>
                            <Input value={createForm.data.name} onChange={e => createForm.setData('name', e.target.value)} />
                        </Field>
                        <Field label="Email *" error={createForm.errors.email}>
                            <Input type="email" value={createForm.data.email} onChange={e => createForm.setData('email', e.target.value)} />
                        </Field>
                        <Field label="Password *" error={createForm.errors.password}>
                            <Input type="password" value={createForm.data.password} onChange={e => createForm.setData('password', e.target.value)} />
                        </Field>
                        <Field label="Role *" error={createForm.errors.role}>
                            <Select value={createForm.data.role} onValueChange={v => createForm.setData('role', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </Field>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={createForm.processing}>Create User</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit */}
            <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
                    <form onSubmit={submitEdit} className="space-y-3">
                        <Field label="Full Name *" error={editForm.errors.name}>
                            <Input value={editForm.data.name} onChange={e => editForm.setData('name', e.target.value)} />
                        </Field>
                        <Field label="Email *" error={editForm.errors.email}>
                            <Input type="email" value={editForm.data.email} onChange={e => editForm.setData('email', e.target.value)} />
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Role" error={editForm.errors.role}>
                                <Select value={editForm.data.role} onValueChange={v => editForm.setData('role', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </Field>
                            <Field label="Status">
                                <Select value={editForm.data.is_active ? 'true' : 'false'} onValueChange={v => editForm.setData('is_active', v === 'true')}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="true">Active</SelectItem>
                                        <SelectItem value="false">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </Field>
                        </div>
                        <Field label="New Password (leave blank to keep)" error={editForm.errors.password}>
                            <Input type="password" placeholder="••••••••" value={editForm.data.password} onChange={e => editForm.setData('password', e.target.value)} />
                        </Field>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
                            <Button type="submit" disabled={editForm.processing}>Save Changes</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={confirmDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// ─── Services & Pricing Tab ───────────────────────────────────────────────────
function ServicesTab({ services }: { services: ServiceItem[] }) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<ServiceItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ServiceItem | null>(null);

    const createForm = useForm({ name: '', slug: '', description: '', price: '', is_active: true as boolean, order: '99' });
    const editForm   = useForm({ name: '', description: '', price: '', is_active: true as boolean, order: '' });

    function slugify(v: string) { return v.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''); }

    function submitCreate(e: React.FormEvent) {
        e.preventDefault();
        createForm.post('/settings/services', { onSuccess: () => { createForm.reset(); setCreateOpen(false); } });
    }
    function openEdit(s: ServiceItem) {
        editForm.setData({ name: s.name, description: s.description ?? '', price: s.pricing?.amount ?? '', is_active: s.is_active, order: String(s.order) });
        setEditTarget(s);
    }
    function submitEdit(e: React.FormEvent) {
        e.preventDefault();
        editForm.put(`/settings/services/${editTarget!.id}`, { onSuccess: () => setEditTarget(null) });
    }
    function confirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/settings/services/${deleteTarget.id}`, { onSuccess: () => setDeleteTarget(null) });
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-gray-900">Services & Pricing</h3>
                    <p className="text-sm text-gray-500">Configure available services and their default prices</p>
                </div>
                <Button size="sm" onClick={() => setCreateOpen(true)}><Plus size={13} /> Add Service</Button>
            </div>
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Slug</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-20" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {services.map(s => (
                                <TableRow key={s.id}>
                                    <TableCell className="text-gray-400 text-sm">{s.order}</TableCell>
                                    <TableCell className="font-medium text-sm">{s.name}</TableCell>
                                    <TableCell className="font-mono text-xs text-gray-500">{s.slug}</TableCell>
                                    <TableCell className="text-sm">{s.pricing ? `$${parseFloat(s.pricing.amount).toFixed(2)}` : <span className="text-gray-300">—</span>}</TableCell>
                                    <TableCell>
                                        {s.is_active
                                            ? <Badge variant="success" className="text-xs">Active</Badge>
                                            : <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}><Edit size={13} /></Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => setDeleteTarget(s)}><Trash2 size={13} /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Add Service</DialogTitle></DialogHeader>
                    <form onSubmit={submitCreate} className="space-y-3">
                        <Field label="Name *" error={createForm.errors.name}>
                            <Input value={createForm.data.name} onChange={e => { createForm.setData('name', e.target.value); createForm.setData('slug', slugify(e.target.value)); }} />
                        </Field>
                        <Field label="Slug *" error={createForm.errors.slug}>
                            <Input value={createForm.data.slug} onChange={e => createForm.setData('slug', e.target.value)} className="font-mono text-sm" />
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Default Price" error={createForm.errors.price}>
                                <Input type="number" step="0.01" placeholder="0.00" value={createForm.data.price} onChange={e => createForm.setData('price', e.target.value)} />
                            </Field>
                            <Field label="Order" error={createForm.errors.order}>
                                <Input type="number" value={createForm.data.order} onChange={e => createForm.setData('order', e.target.value)} />
                            </Field>
                        </div>
                        <Field label="Status">
                            <Select value={createForm.data.is_active ? 'true' : 'false'} onValueChange={v => createForm.setData('is_active', v === 'true')}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="true">Active</SelectItem>
                                    <SelectItem value="false">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </Field>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={createForm.processing}>Create</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Edit — {editTarget?.name}</DialogTitle></DialogHeader>
                    <form onSubmit={submitEdit} className="space-y-3">
                        <Field label="Name *" error={editForm.errors.name}>
                            <Input value={editForm.data.name} onChange={e => editForm.setData('name', e.target.value)} />
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Default Price" error={editForm.errors.price}>
                                <Input type="number" step="0.01" placeholder="0.00" value={editForm.data.price} onChange={e => editForm.setData('price', e.target.value)} />
                            </Field>
                            <Field label="Order">
                                <Input type="number" value={editForm.data.order} onChange={e => editForm.setData('order', e.target.value)} />
                            </Field>
                        </div>
                        <Field label="Status">
                            <Select value={editForm.data.is_active ? 'true' : 'false'} onValueChange={v => editForm.setData('is_active', v === 'true')}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="true">Active</SelectItem>
                                    <SelectItem value="false">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label="Description">
                            <Textarea rows={2} value={editForm.data.description} onChange={e => editForm.setData('description', e.target.value)} />
                        </Field>
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
                        <AlertDialogTitle>Delete Service</AlertDialogTitle>
                        <AlertDialogDescription>Delete <strong>{deleteTarget?.name}</strong>? This will remove it from the service catalog.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={confirmDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// ─── Email Templates Tab ──────────────────────────────────────────────────────
function TemplatesTab({ templates }: { templates: Template[] }) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Template | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Template | null>(null);
    const [previewTarget, setPreviewTarget] = useState<Template | null>(null);

    const createForm = useForm({ name: '', slug: '', subject: '', body: '' });
    const editForm   = useForm({ name: '', subject: '', body: '' });

    function slugify(v: string) { return v.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''); }

    function submitCreate(e: React.FormEvent) {
        e.preventDefault();
        createForm.post('/settings/templates', { onSuccess: () => { createForm.reset(); setCreateOpen(false); } });
    }
    function openEdit(t: Template) {
        editForm.setData({ name: t.name, subject: t.subject, body: t.body });
        setEditTarget(t);
    }
    function submitEdit(e: React.FormEvent) {
        e.preventDefault();
        editForm.put(`/settings/templates/${editTarget!.id}`, { onSuccess: () => setEditTarget(null) });
    }
    function confirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/settings/templates/${deleteTarget.id}`, { onSuccess: () => setDeleteTarget(null) });
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-gray-900">Email Templates</h3>
                    <p className="text-sm text-gray-500">Use {'{{variable}}'} placeholders in subject and body</p>
                </div>
                <Button size="sm" onClick={() => setCreateOpen(true)}><Plus size={13} /> Add Template</Button>
            </div>
            <div className="space-y-3">
                {templates.map(t => (
                    <Card key={t.id}>
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="font-medium text-sm text-gray-900">{t.name}</p>
                                    <p className="font-mono text-xs text-gray-400 mt-0.5">{t.slug}</p>
                                    <p className="text-xs text-gray-600 mt-1"><span className="text-gray-400">Subject:</span> {t.subject}</p>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPreviewTarget(t)}><Eye size={13} /></Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(t)}><Edit size={13} /></Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => setDeleteTarget(t)}><Trash2 size={13} /></Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle>New Email Template</DialogTitle></DialogHeader>
                    <form onSubmit={submitCreate} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Template Name *" error={createForm.errors.name}>
                                <Input value={createForm.data.name} onChange={e => { createForm.setData('name', e.target.value); createForm.setData('slug', slugify(e.target.value)); }} />
                            </Field>
                            <Field label="Slug *" error={createForm.errors.slug}>
                                <Input value={createForm.data.slug} onChange={e => createForm.setData('slug', e.target.value)} className="font-mono text-sm" />
                            </Field>
                        </div>
                        <Field label="Subject *" error={createForm.errors.subject}>
                            <Input value={createForm.data.subject} onChange={e => createForm.setData('subject', e.target.value)} placeholder="Use {{variable}} for dynamic content" />
                        </Field>
                        <Field label="Body *" error={createForm.errors.body}>
                            <Textarea rows={8} value={createForm.data.body} onChange={e => createForm.setData('body', e.target.value)} placeholder="Email body text..." className="font-mono text-sm" />
                        </Field>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={createForm.processing}>Create Template</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle>Edit — {editTarget?.name}</DialogTitle></DialogHeader>
                    <form onSubmit={submitEdit} className="space-y-3">
                        <Field label="Template Name *" error={editForm.errors.name}>
                            <Input value={editForm.data.name} onChange={e => editForm.setData('name', e.target.value)} />
                        </Field>
                        <Field label="Subject *" error={editForm.errors.subject}>
                            <Input value={editForm.data.subject} onChange={e => editForm.setData('subject', e.target.value)} />
                        </Field>
                        <Field label="Body *" error={editForm.errors.body}>
                            <Textarea rows={8} value={editForm.data.body} onChange={e => editForm.setData('body', e.target.value)} className="font-mono text-sm" />
                        </Field>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
                            <Button type="submit" disabled={editForm.processing}>Save</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!previewTarget} onOpenChange={() => setPreviewTarget(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>Preview — {previewTarget?.name}</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <div className="rounded-md bg-gray-50 border border-gray-200 p-3">
                            <p className="text-xs text-gray-400 mb-1">Subject</p>
                            <p className="text-sm font-medium">{previewTarget?.subject}</p>
                        </div>
                        <div className="rounded-md bg-gray-50 border border-gray-200 p-3">
                            <p className="text-xs text-gray-400 mb-1">Body</p>
                            <pre className="text-sm whitespace-pre-wrap font-sans">{previewTarget?.body}</pre>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Template</AlertDialogTitle>
                        <AlertDialogDescription>Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={confirmDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// ─── API Settings Tab ─────────────────────────────────────────────────────────
function ApiTab({ settings }: { settings: Record<string, string> }) {
    const [showSecrets, setShowSecrets] = useState(false);
    const form = useForm({
        web3forms_key:    settings.web3forms_key    ?? '',
        web3forms_secret: settings.web3forms_secret ?? '',
        stripe_key:       settings.stripe_key       ?? '',
        stripe_secret:    settings.stripe_secret    ?? '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/settings/general');
    }

    return (
        <div className="space-y-4 max-w-2xl">
            <div>
                <h3 className="font-semibold text-gray-900">API Settings</h3>
                <p className="text-sm text-gray-500">Integration keys for Web3Forms and Stripe</p>
            </div>

            <form onSubmit={submit} className="space-y-5">
                {/* Web3Forms */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Web3Forms Integration</CardTitle>
                        <CardDescription className="text-xs">Used for automatic lead creation from your website form</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Field label="Web3Forms Access Key">
                            <div className="relative">
                                <Input type={showSecrets ? 'text' : 'password'} value={form.data.web3forms_key} onChange={e => form.setData('web3forms_key', e.target.value)} placeholder="Your Web3Forms access key" />
                            </div>
                        </Field>
                        <Field label="Webhook Secret (validates incoming submissions)">
                            <Input type={showSecrets ? 'text' : 'password'} value={form.data.web3forms_secret} onChange={e => form.setData('web3forms_secret', e.target.value)} placeholder="Optional secret for webhook validation" />
                        </Field>
                        <div className="text-xs text-gray-400 bg-blue-50 border border-blue-100 rounded-md p-3">
                            Webhook URL: <code className="font-mono text-blue-700">{window.location.origin}/api/webhook/web3forms</code>
                        </div>
                    </CardContent>
                </Card>

                {/* Stripe */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Stripe Integration</CardTitle>
                        <CardDescription className="text-xs">Future payment integration — keys stored for when ready</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Field label="Stripe Publishable Key">
                            <Input type={showSecrets ? 'text' : 'password'} value={form.data.stripe_key} onChange={e => form.setData('stripe_key', e.target.value)} placeholder="pk_live_..." />
                        </Field>
                        <Field label="Stripe Secret Key">
                            <Input type={showSecrets ? 'text' : 'password'} value={form.data.stripe_secret} onChange={e => form.setData('stripe_secret', e.target.value)} placeholder="sk_live_..." />
                        </Field>
                        <Badge variant="secondary" className="text-xs">Stripe integration coming in a future update</Badge>
                    </CardContent>
                </Card>

                <div className="flex items-center gap-3">
                    <Button type="submit" disabled={form.processing}>Save API Settings</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowSecrets(!showSecrets)} className="text-gray-400">
                        {showSecrets ? <><EyeOff size={13} /> Hide keys</> : <><Eye size={13} /> Show keys</>}
                    </Button>
                </div>
            </form>
        </div>
    );
}

// ─── General Settings Tab ─────────────────────────────────────────────────────
function GeneralTab({ settings }: { settings: Record<string, string> }) {
    const form = useForm({
        company_name:  settings.company_name  ?? '',
        company_email: settings.company_email ?? '',
        company_phone: settings.company_phone ?? '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/settings/general');
    }

    return (
        <div className="space-y-4 max-w-lg">
            <div>
                <h3 className="font-semibold text-gray-900">General Settings</h3>
                <p className="text-sm text-gray-500">Company information used across the CRM</p>
            </div>
            <Card>
                <CardContent className="pt-5">
                    <form onSubmit={submit} className="space-y-4">
                        <Field label="Company Name" error={form.errors.company_name}>
                            <Input value={form.data.company_name} onChange={e => form.setData('company_name', e.target.value)} />
                        </Field>
                        <Field label="Company Email" error={form.errors.company_email}>
                            <Input type="email" value={form.data.company_email} onChange={e => form.setData('company_email', e.target.value)} />
                        </Field>
                        <Field label="Company Phone" error={form.errors.company_phone}>
                            <Input value={form.data.company_phone} onChange={e => form.setData('company_phone', e.target.value)} />
                        </Field>
                        <Button type="submit" disabled={form.processing}>Save Settings</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <Label className="text-xs text-gray-600">{label}</Label>
            {children}
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}
