import React, { useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Search, Filter, X, Upload, Download, Trash2, FileText } from 'lucide-react';

interface Doc { id: number; client_id: number; client_number: string; client_name: string; category: string; category_label: string; original_filename: string; file_size: string; uploaded_by: string | null; created_at: string }
interface Paginator<T> { data: T[]; total: number; last_page: number; links: { url: string | null; label: string; active: boolean }[] }
interface Filters { search?: string; category?: string }

export default function DocumentsIndex({ documents, categories, filters }: { documents: Paginator<Doc>; categories: Record<string, string>; filters: Filters }) {
    const { auth } = usePage<{ auth: { user: { role: string } } }>().props;
    const [uploadOpen, setUploadOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Doc | null>(null);
    const canManage = ['admin', 'processing'].includes(auth.user.role);

    const form = useForm<{ client_id: string; category: string; file: File | null }>({ client_id: '', category: '', file: null });

    function applyFilter(key: string, value: string) {
        router.get('/documents', { ...filters, [key]: value || undefined }, { preserveState: true, replace: true });
    }
    function clearFilters() { router.get('/documents', {}, { preserveState: true, replace: true }); }

    function submitUpload(e: React.FormEvent) {
        e.preventDefault();
        form.post('/documents', { forceFormData: true, onSuccess: () => { form.reset(); setUploadOpen(false); } });
    }
    function confirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/documents/${deleteTarget.id}`, { onSuccess: () => setDeleteTarget(null) });
    }

    const hasFilters = Object.values(filters).some(Boolean);

    return (
        <>
            <Head title="Documents" />
            <AppLayout title="Documents">
                <div className="space-y-4">

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative flex-1 min-w-[200px] max-w-xs">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <Input placeholder="Search documents…" className="pl-8 h-8 text-sm"
                                defaultValue={filters.search ?? ''}
                                onChange={e => applyFilter('search', e.target.value)} />
                        </div>
                        <Select value={filters.category ?? ''} onValueChange={v => applyFilter('category', v)}>
                            <SelectTrigger className="h-8 w-40 text-sm"><SelectValue placeholder="Category" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All categories</SelectItem>
                                {Object.entries(categories).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-400"><X size={13} /> Clear</Button>}
                        {canManage && (
                            <Button size="sm" className="ml-auto" onClick={() => setUploadOpen(true)}>
                                <Upload size={13} /> Upload
                            </Button>
                        )}
                    </div>

                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Client</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Filename</TableHead>
                                        <TableHead>Size</TableHead>
                                        <TableHead>Uploaded By</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="w-20" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {documents.data.length === 0 ? (
                                        <TableRow><TableCell colSpan={7} className="text-center py-12 text-gray-400">No documents found</TableCell></TableRow>
                                    ) : documents.data.map(doc => (
                                        <TableRow key={doc.id}>
                                            <TableCell>
                                                <Link href={`/clients/${doc.client_id}`} className="hover:text-blue-600">
                                                    <p className="font-medium text-sm text-gray-900">{doc.client_name}</p>
                                                    <p className="font-mono text-xs text-blue-500">{doc.client_number}</p>
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="text-xs">{doc.category_label}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5">
                                                    <FileText size={13} className="text-gray-400 shrink-0" />
                                                    <span className="text-sm text-gray-800 truncate max-w-[200px]">{doc.original_filename}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs text-gray-500">{doc.file_size}</TableCell>
                                            <TableCell className="text-xs text-gray-500">{doc.uploaded_by ?? '—'}</TableCell>
                                            <TableCell className="text-xs text-gray-500">{doc.created_at}</TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                                        <a href={`/documents/${doc.id}/download`} target="_blank" rel="noreferrer">
                                                            <Download size={13} />
                                                        </a>
                                                    </Button>
                                                    {canManage && (
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600"
                                                            onClick={() => setDeleteTarget(doc)}>
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

                    {documents.last_page > 1 && (
                        <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>Showing {documents.data.length} of {documents.total} documents</span>
                            <div className="flex gap-1">
                                {documents.links.map((link, i) => (
                                    <Button key={i} variant={link.active ? 'default' : 'outline'} size="sm"
                                        disabled={!link.url} onClick={() => link.url && router.get(link.url)}
                                        className="h-7 min-w-[28px] px-2 text-xs"
                                        dangerouslySetInnerHTML={{ __html: link.label }} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Upload modal */}
                <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                    <DialogContent className="max-w-sm">
                        <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
                        <form onSubmit={submitUpload} className="space-y-3">
                            <div className="space-y-1">
                                <Label className="text-xs">Client ID *</Label>
                                <Input placeholder="Client ID number" value={form.data.client_id}
                                    onChange={e => form.setData('client_id', e.target.value)} />
                                {form.errors.client_id && <p className="text-xs text-red-500">{form.errors.client_id}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Category *</Label>
                                <Select value={form.data.category} onValueChange={v => form.setData('category', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(categories).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                {form.errors.category && <p className="text-xs text-red-500">{form.errors.category}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">File *</Label>
                                <Input type="file" onChange={e => form.setData('file', e.target.files?.[0] ?? null)} />
                                {form.errors.file && <p className="text-xs text-red-500">{form.errors.file}</p>}
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
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
                            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={confirmDelete}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </AppLayout>
        </>
    );
}
