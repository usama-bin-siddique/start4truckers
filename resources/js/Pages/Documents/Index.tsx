import React, { useEffect, useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Search, Filter, X, Upload, Download, Trash2, FileText, FolderOpen, Users, CalendarDays, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Doc {
    id: number; client_id: number; client_number: string; client_name: string;
    category: string; category_label: string; original_filename: string;
    file_size: string; uploaded_by: string | null; created_at: string;
}
interface Paginator<T> { data: T[]; total: number; last_page: number; links: { url: string | null; label: string; active: boolean }[] }
interface Filters { search?: string; category?: string }
interface Stats { total: number; this_month: number; clients: number; categories: number }

export default function DocumentsIndex({ documents, categories, filters, stats }: {
    documents: Paginator<Doc>;
    categories: Record<string, string>;
    filters: Filters;
    stats: Stats;
}) {
    const { auth } = usePage<{ auth: { user: { role: string } } }>().props;
    const [uploadOpen, setUploadOpen] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Doc | null>(null);
    const [search, setSearch] = useState(filters.search ?? '');
    const canManage = ['admin', 'processing'].includes(auth.user.role);
    const hasFilters = Object.values(filters).some(Boolean);

    const form = useForm<{ client_id: string; category: string; file: File | null }>({ client_id: '', category: '', file: null });

    useEffect(() => {
        const t = setTimeout(() => {
            if (search !== (filters.search ?? '')) applyFilter('search', search);
        }, 350);
        return () => clearTimeout(t);
    }, [search]);

    function applyFilter(key: string, value: string) {
        router.get('/documents', { ...filters, [key]: value || undefined }, { preserveState: true, replace: true });
    }

    function clearFilters() {
        setSearch('');
        router.get('/documents', {}, { preserveState: true, replace: true });
    }

    function submitUpload(e: React.FormEvent) {
        e.preventDefault();
        form.post('/documents', { forceFormData: true, onSuccess: () => { form.reset(); setUploadOpen(false); } });
    }

    function confirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/documents/${deleteTarget.id}`, { onSuccess: () => setDeleteTarget(null) });
    }

    const kpis = [
        { label: 'Total', value: stats.total, icon: <FileText className="h-4 w-4 text-sky-700" />, iconClass: 'bg-sky-100' },
        { label: 'This month', value: stats.this_month, icon: <CalendarDays className="h-4 w-4 text-amber-700" />, iconClass: 'bg-amber-100' },
        { label: 'Clients', value: stats.clients, icon: <Users className="h-4 w-4 text-emerald-700" />, iconClass: 'bg-emerald-100' },
        { label: 'Categories', value: stats.categories, icon: <Layers className="h-4 w-4 text-blue-700" />, iconClass: 'bg-blue-100' },
    ];

    return (
        <>
            <Head title="Documents" />
            <AppLayout title="Documents">
                <div className="space-y-6">

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold tracking-[0.12em] text-amber-600">
                                <FolderOpen className="h-3 w-3" />
                                WORK
                            </span>
                            <h2 className="mt-3 text-[32px] leading-none font-semibold tracking-tight text-gray-950">
                                Documents
                            </h2>
                            <p className="mt-2 text-sm text-gray-500">
                                Store, search, and share files across client accounts.
                            </p>
                        </div>
                        {canManage && (
                            <button
                                type="button"
                                onClick={() => setUploadOpen(true)}
                                className="inline-flex items-center gap-2 rounded-lg bg-[#12141D] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black"
                            >
                                <Upload className="h-4 w-4" />
                                Upload
                            </button>
                        )}
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
                                    placeholder="Search documents.."
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

                            <p className="ml-auto text-sm text-gray-400">{documents.total} documents</p>
                        </div>

                        {showFilters && (
                            <div className="flex flex-wrap gap-3 border-t border-gray-100 px-5 py-4">
                                <Select value={filters.category ?? ''} onValueChange={(v) => applyFilter('category', v)}>
                                    <SelectTrigger className="h-9 w-44 text-sm"><SelectValue placeholder="Category" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All categories</SelectItem>
                                        {Object.entries(categories).map(([k, v]) => (
                                            <SelectItem key={k} value={k}>{v}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="border-t border-gray-100">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="px-5 text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Client</TableHead>
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Category</TableHead>
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Filename</TableHead>
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Size</TableHead>
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Uploaded By</TableHead>
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Date</TableHead>
                                        <TableHead className="w-20" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {documents.data.length === 0 ? (
                                        <TableRow className="hover:bg-transparent">
                                            <TableCell colSpan={7} className="h-56 text-center text-sm text-gray-400">
                                                No documents found
                                            </TableCell>
                                        </TableRow>
                                    ) : documents.data.map((doc) => (
                                        <TableRow key={doc.id}>
                                            <TableCell className="px-5">
                                                <Link href={`/clients/${doc.client_id}`} className="hover:text-amber-700">
                                                    <p className="text-sm font-medium text-gray-900">{doc.client_name}</p>
                                                    <p className="font-mono text-xs text-amber-700">{doc.client_number}</p>
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="text-xs">{doc.category_label}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5">
                                                    <FileText size={13} className="shrink-0 text-gray-400" />
                                                    <span className="max-w-[200px] truncate text-sm text-gray-800">{doc.original_filename}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs text-gray-500">{doc.file_size}</TableCell>
                                            <TableCell className="text-xs text-gray-500">{doc.uploaded_by ?? '—'}</TableCell>
                                            <TableCell className="text-xs text-gray-400">{doc.created_at}</TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                                        <a href={`/documents/${doc.id}/download`} target="_blank" rel="noreferrer">
                                                            <Download size={13} />
                                                        </a>
                                                    </Button>
                                                    {canManage && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-red-400 hover:text-red-600"
                                                            onClick={() => setDeleteTarget(doc)}
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

                        {documents.last_page > 1 && (
                            <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 text-sm text-gray-500">
                                <span>Showing {documents.data.length} of {documents.total} documents</span>
                                <div className="flex gap-1">
                                    {documents.links.map((link, i) => (
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

                <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                    <DialogContent className="max-w-sm">
                        <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
                        <form onSubmit={submitUpload} className="space-y-3">
                            <div className="space-y-1">
                                <Label className="text-xs">Client ID *</Label>
                                <Input placeholder="Client ID number" value={form.data.client_id} onChange={(e) => form.setData('client_id', e.target.value)} />
                                {form.errors.client_id && <p className="text-xs text-red-500">{form.errors.client_id}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Category *</Label>
                                <Select value={form.data.category} onValueChange={(v) => form.setData('category', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(categories).map(([k, v]) => (
                                            <SelectItem key={k} value={k}>{v}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {form.errors.category && <p className="text-xs text-red-500">{form.errors.category}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">File *</Label>
                                <Input type="file" onChange={(e) => form.setData('file', e.target.files?.[0] ?? null)} />
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
