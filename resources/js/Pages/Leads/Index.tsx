import React, { useEffect, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import LeadStatusBadge from '@/components/LeadStatusBadge';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Plus, Search, MoreHorizontal, Phone, Mail, MessageCircle,
    Eye, Trash2, ArrowRightCircle, Filter, X, Users, Share2,
    Trophy, Ban, GitBranch,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface User   { id: number; name: string; role: string }
interface Lead   {
    id: number; name: string; phone: string | null; email: string | null;
    state: string | null; company: string | null; service_required: string | null;
    status: string; source: string; assigned_to: number | null;
    assigned_user: { id: number; name: string } | null;
    converted_at: string | null; created_at: string;
}
interface Paginator<T> {
    data: T[]; current_page: number; last_page: number;
    per_page: number; total: number; next_page_url: string | null; prev_page_url: string | null;
    links: { url: string | null; label: string; active: boolean }[];
}
interface Stats  { total: number; new: number; contacted: number; won: number; lost: number }
interface Filters { search?: string; status?: string; assigned_to?: string; service?: string; date_from?: string; date_to?: string }

interface Props {
    leads: Paginator<Lead>;
    users: User[];
    statuses: Record<string, string>;
    filters: Filters;
    stats: Stats;
    auth: { user: { role: string } };
}

export default function LeadsIndex({ leads, users, statuses, filters, stats }: Props) {
    const { auth } = usePage<Props>().props;
    const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [search, setSearch] = useState(filters.search ?? '');

    const isAdmin = auth.user.role === 'admin';
    const hasFilters = Object.values(filters).some(Boolean);

    useEffect(() => {
        const t = setTimeout(() => {
            if (search !== (filters.search ?? '')) applyFilter('search', search);
        }, 350);
        return () => clearTimeout(t);
    }, [search]);

    function applyFilter(key: string, value: string) {
        router.get('/leads', { ...filters, [key]: value || undefined }, { preserveState: true, replace: true });
    }

    function clearFilters() {
        setSearch('');
        router.get('/leads', {}, { preserveState: true, replace: true });
    }

    function deleteLead() {
        if (!deleteTarget) return;
        router.delete(`/leads/${deleteTarget.id}`, {
            onSuccess: () => setDeleteTarget(null),
        });
    }

    function callLead(phone: string | null) {
        if (phone) window.open(`tel:${phone}`);
    }
    function emailLead(email: string | null) {
        if (email) window.open(`mailto:${email}`);
    }
    function whatsappLead(phone: string | null) {
        if (phone) window.open(`https://wa.me/${phone.replace(/\D/g, '')}`);
    }

    const kpis = [
        { label: 'Total', value: stats.total, icon: <Users className="h-4 w-4 text-sky-700" />, iconClass: 'bg-sky-100' },
        { label: 'New', value: stats.new, icon: <Share2 className="h-4 w-4 text-blue-700" />, iconClass: 'bg-blue-100' },
        { label: 'Contacted', value: stats.contacted, icon: <Phone className="h-4 w-4 text-amber-700" />, iconClass: 'bg-amber-100' },
        { label: 'Won', value: stats.won, icon: <Trophy className="h-4 w-4 text-emerald-700" />, iconClass: 'bg-emerald-100' },
        { label: 'Lost', value: stats.lost, icon: <Ban className="h-4 w-4 text-red-600" />, iconClass: 'bg-red-100' },
    ];

    return (
        <>
            <Head title="Leads" />
            <AppLayout title="Leads">
                <div className="space-y-6">

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold tracking-[0.12em] text-amber-600">
                                <GitBranch className="h-3 w-3" />
                                PIPELINE
                            </span>
                            <h2 className="mt-3 text-[32px] leading-none font-semibold tracking-tight text-gray-950">
                                Leads
                            </h2>
                            <p className="mt-2 text-sm text-gray-500">
                                Track inbound interest and move deals toward conversion.
                            </p>
                        </div>
                        <Link
                            href="/leads/create"
                            className="inline-flex items-center gap-2 rounded-lg bg-[#12141D] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black"
                        >
                            <Plus className="h-4 w-4" />
                            New lead
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
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
                                    placeholder="Search leads.."
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

                            <p className="ml-auto text-sm text-gray-400">{leads.total} leads</p>
                        </div>

                        {showFilters && (
                            <div className="flex flex-wrap gap-3 border-t border-gray-100 px-5 py-4">
                                <Select value={filters.status ?? ''} onValueChange={(v) => applyFilter('status', v)}>
                                    <SelectTrigger className="h-9 w-36 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All statuses</SelectItem>
                                        {Object.entries(statuses).map(([k, v]) => (
                                            <SelectItem key={k} value={k}>{v}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={filters.assigned_to ?? ''} onValueChange={(v) => applyFilter('assigned_to', v)}>
                                    <SelectTrigger className="h-9 w-40 text-sm"><SelectValue placeholder="Assigned to" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All employees</SelectItem>
                                        {users.filter((u) => u.role !== 'processing').map((u) => (
                                            <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Input
                                    type="date"
                                    className="h-9 w-36 text-sm"
                                    value={filters.date_from ?? ''}
                                    onChange={(e) => applyFilter('date_from', e.target.value)}
                                />
                                <Input
                                    type="date"
                                    className="h-9 w-36 text-sm"
                                    value={filters.date_to ?? ''}
                                    onChange={(e) => applyFilter('date_to', e.target.value)}
                                />
                            </div>
                        )}

                        <div className="border-t border-gray-100">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="px-5 text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Name</TableHead>
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Contact</TableHead>
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Service</TableHead>
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Status</TableHead>
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Assigned</TableHead>
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Date</TableHead>
                                        <TableHead className="w-12" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {leads.data.length === 0 ? (
                                        <TableRow className="hover:bg-transparent">
                                            <TableCell colSpan={7} className="h-56 text-center text-sm text-gray-400">
                                                No leads found
                                            </TableCell>
                                        </TableRow>
                                    ) : leads.data.map((lead) => (
                                        <TableRow key={lead.id}>
                                            <TableCell className="px-5">
                                                <div>
                                                    <Link href={`/leads/${lead.id}`} className="font-medium text-gray-900 transition-colors hover:text-amber-700">
                                                        {lead.name}
                                                    </Link>
                                                    {lead.company && (
                                                        <p className="mt-0.5 text-xs text-gray-400">{lead.company}</p>
                                                    )}
                                                    {lead.state && (
                                                        <p className="text-xs text-gray-400">{lead.state}</p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-0.5">
                                                    {lead.phone && <span className="text-xs text-gray-600">{lead.phone}</span>}
                                                    {lead.email && <span className="max-w-[160px] truncate text-xs text-gray-500">{lead.email}</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-gray-700">{lead.service_required ?? '—'}</span>
                                            </TableCell>
                                            <TableCell>
                                                <LeadStatusBadge status={lead.status} />
                                                {lead.converted_at && (
                                                    <p className="mt-0.5 text-[10px] text-gray-400">Converted</p>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-gray-600">
                                                    {lead.assigned_user?.name ?? <span className="italic text-gray-300">Unassigned</span>}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-xs text-gray-400">
                                                    {new Date(lead.created_at).toLocaleDateString()}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7">
                                                            <MoreHorizontal size={15} />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/leads/${lead.id}`} className="cursor-pointer">
                                                                <Eye size={13} /> View
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => callLead(lead.phone)}>
                                                            <Phone size={13} /> Call
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => emailLead(lead.email)}>
                                                            <Mail size={13} /> Email
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => whatsappLead(lead.phone)}>
                                                            <MessageCircle size={13} /> WhatsApp
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        {!lead.converted_at && (
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/leads/${lead.id}`} className="cursor-pointer text-green-700">
                                                                    <ArrowRightCircle size={13} /> Convert to Client
                                                                </Link>
                                                            </DropdownMenuItem>
                                                        )}
                                                        {isAdmin && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-red-600"
                                                                    onClick={() => setDeleteTarget(lead)}
                                                                >
                                                                    <Trash2 size={13} /> Delete
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {leads.last_page > 1 && (
                            <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 text-sm text-gray-500">
                                <span>Showing {leads.data.length} of {leads.total} leads</span>
                                <div className="flex gap-1">
                                    {leads.links.map((link, i) => (
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
                            <AlertDialogTitle>Delete Lead</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
                                This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={deleteLead}>
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </AppLayout>
        </>
    );
}
