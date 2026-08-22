import React, { FormEvent, useEffect, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Search, Filter, X, Download, Trash2, FileText, FolderOpen, Users, CalendarDays, Layers, Eye, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Doc {
    id: number;
    client_id: number | null;
    lead_id: number | null;
    client_number: string | null;
    client_name: string;
    category: string;
    category_label: string;
    original_filename: string;
    mime_type: string | null;
    file_size: string;
    uploaded_by: string | null;
    created_at: string;
    view_url: string;
    download_url: string;
}
interface Paginator<T> { data: T[]; total: number; last_page: number; links: { url: string | null; label: string; active: boolean }[] }
interface Filters { search?: string; category?: string; client_id?: string | number }
interface FocusedClient { id: number; name: string; client_number: string | null; profile_url: string }
interface Stats { total: number; this_month: number; clients: number; categories: number }

export default function DocumentsIndex({ documents, categories, filters, focused_client, stats }: {
    documents: Paginator<Doc>;
    categories: Record<string, string>;
    filters: Filters;
    focused_client: FocusedClient | null;
    stats: Stats;
}) {
    const { auth } = usePage<{ auth: { user: { role: string } } }>().props;
    const [showFilters, setShowFilters] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Doc | null>(null);
    const [search, setSearch] = useState(filters.search ?? '');
    const canManage = ['admin', 'processing'].includes(auth.user.role);
    const hasFilters = Object.values(filters).some(Boolean);

    useEffect(() => {
        setSearch(filters.search ?? '');
    }, [filters.search]);

    useEffect(() => {
        const t = setTimeout(() => {
            if (search !== (filters.search ?? '')) submitSearch(search);
        }, 250);
        return () => clearTimeout(t);
    }, [search]);

    function submitSearch(value: string, extra: Record<string, string | number | undefined> = {}) {
        router.get('/documents', {
            category: filters.category || undefined,
            search: value || undefined,
            ...extra,
        }, { preserveState: true, replace: true });
    }

    function applyFilter(key: string, value: string) {
        router.get('/documents', {
            ...filters,
            search: search || undefined,
            [key]: value || undefined,
        }, { preserveState: true, replace: true });
    }

    function showClientDocuments(clientId: number) {
        setSearch('');
        router.get('/documents', { client_id: clientId }, { preserveState: true, replace: true });
    }

    function clearFilters() {
        setSearch('');
        router.get('/documents', {}, { preserveState: true, replace: true });
    }

    function onSearchSubmit(e: FormEvent) {
        e.preventDefault();
        submitSearch(search);
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
                                Search by client ID or name to open every file on that account.
                            </p>
                        </div>
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
                        <form onSubmit={onSearchSubmit} className="flex flex-wrap items-center gap-3 px-5 py-4">
                            <div className="relative min-w-[260px] flex-1 max-w-xl">
                                <Search size={15} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-gray-400" />
                                <Input
                                    type="search"
                                    placeholder="Search by client ID or name…"
                                    className="h-10 rounded-full border-gray-200 bg-[#F7F7F5] pl-10 text-sm shadow-none"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    aria-label="Search documents by client ID or name"
                                />
                            </div>

                            <Button
                                type="button"
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
                                <Button type="button" variant="ghost" size="sm" onClick={clearFilters} className="h-10 text-gray-400">
                                    <X size={13} /> Clear
                                </Button>
                            )}

                            <p className="ml-auto text-sm text-gray-400">{documents.total} documents</p>
                        </form>

                        {focused_client && (
                            <div className="flex flex-wrap items-center gap-3 border-t border-amber-100 bg-amber-50/70 px-5 py-3">
                                <p className="text-sm text-gray-800">
                                    Showing all documents for{' '}
                                    <span className="font-semibold">{focused_client.name}</span>
                                    <span className="ml-2 font-mono text-xs text-amber-700">
                                        ID {focused_client.id}
                                        {focused_client.client_number ? ` · ${focused_client.client_number}` : ''}
                                    </span>
                                </p>
                                <Link href={focused_client.profile_url} className="inline-flex items-center gap-1 text-sm font-medium text-amber-800 hover:underline">
                                    <ExternalLink size={13} />
                                    Client documents
                                </Link>
                            </div>
                        )}

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
                                        <TableHead className="w-28" />
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
                                                {doc.client_id ? (
                                                    <div>
                                                        <Link href={`/clients/${doc.client_id}`} className="hover:text-amber-700">
                                                            <p className="text-sm font-medium text-gray-900">{doc.client_name}</p>
                                                            <p className="font-mono text-xs text-amber-700">
                                                                Client ID {doc.client_id}
                                                                {doc.client_number ? ` · ${doc.client_number}` : ''}
                                                            </p>
                                                        </Link>
                                                        {focused_client?.id !== doc.client_id && (
                                                            <button
                                                                type="button"
                                                                onClick={() => showClientDocuments(doc.client_id!)}
                                                                className="mt-1 text-xs font-medium text-gray-500 hover:text-amber-700 hover:underline"
                                                            >
                                                                All documents
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : doc.lead_id ? (
                                                    <Link href={`/leads/${doc.lead_id}`} className="hover:text-amber-700">
                                                        <p className="text-sm font-medium text-gray-900">{doc.client_name}</p>
                                                        <p className="text-xs text-gray-400">Lead ID {doc.lead_id}</p>
                                                    </Link>
                                                ) : (
                                                    <p className="text-sm font-medium text-gray-900">{doc.client_name}</p>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="text-xs">{doc.category_label}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <a
                                                    href={doc.view_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex max-w-[260px] items-center gap-1.5 text-sm text-gray-800 hover:text-amber-700 hover:underline"
                                                    title={`View ${doc.original_filename}`}
                                                >
                                                    <FileText size={13} className="shrink-0 text-gray-400" />
                                                    <span className="truncate">{doc.original_filename}</span>
                                                </a>
                                            </TableCell>
                                            <TableCell className="text-xs text-gray-500">{doc.file_size}</TableCell>
                                            <TableCell className="text-xs text-gray-500">{doc.uploaded_by ?? '—'}</TableCell>
                                            <TableCell className="text-xs text-gray-400">{doc.created_at}</TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                                        <a href={doc.view_url} target="_blank" rel="noreferrer" title="View document">
                                                            <Eye size={13} />
                                                        </a>
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                                        <a href={doc.download_url} target="_blank" rel="noreferrer" title="Download">
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
