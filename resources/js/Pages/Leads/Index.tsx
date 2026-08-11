import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
    Eye, Edit, Trash2, UserPlus, ArrowRightCircle, Filter, X,
} from 'lucide-react';

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

    const isAdmin = auth.user.role === 'admin';

    function applyFilter(key: string, value: string) {
        router.get('/leads', { ...filters, [key]: value || undefined }, { preserveState: true, replace: true });
    }

    function clearFilters() {
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

    const hasFilters = Object.values(filters).some(Boolean);

    return (
        <>
            <Head title="Leads" />
            <AppLayout title="Leads">
                <div className="space-y-4">

                    {/* Stats bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {[
                            { label: 'Total',     value: stats.total,     color: 'text-gray-700' },
                            { label: 'New',       value: stats.new,       color: 'text-blue-600' },
                            { label: 'Contacted', value: stats.contacted, color: 'text-indigo-600' },
                            { label: 'Won',       value: stats.won,       color: 'text-green-600' },
                            { label: 'Lost',      value: stats.lost,      color: 'text-red-600' },
                        ].map(s => (
                            <Card key={s.label} className="py-3 px-4">
                                <p className="text-xs text-gray-400 uppercase tracking-wide">{s.label}</p>
                                <p className={`text-xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
                            </Card>
                        ))}
                    </div>

                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative flex-1 min-w-[200px] max-w-xs">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search leads…"
                                className="pl-8 h-8 text-sm"
                                defaultValue={filters.search ?? ''}
                                onChange={e => applyFilter('search', e.target.value)}
                            />
                        </div>

                        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}
                            className={hasFilters ? 'border-blue-400 text-blue-600' : ''}>
                            <Filter size={13} />
                            Filters
                            {hasFilters && <Badge variant="default" className="ml-1 h-4 px-1 text-[10px]">ON</Badge>}
                        </Button>

                        {hasFilters && (
                            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-400">
                                <X size={13} /> Clear
                            </Button>
                        )}

                        <div className="ml-auto">
                            <Button size="sm" asChild>
                                <Link href="/leads/create"><Plus size={14} /> New Lead</Link>
                            </Button>
                        </div>
                    </div>

                    {/* Filter panel */}
                    {showFilters && (
                        <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <Select value={filters.status ?? ''} onValueChange={v => applyFilter('status', v)}>
                                <SelectTrigger className="h-8 w-36 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All statuses</SelectItem>
                                    {Object.entries(statuses).map(([k, v]) => (
                                        <SelectItem key={k} value={k}>{v}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={filters.assigned_to ?? ''} onValueChange={v => applyFilter('assigned_to', v)}>
                                <SelectTrigger className="h-8 w-40 text-sm"><SelectValue placeholder="Assigned to" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All employees</SelectItem>
                                    {users.filter(u => u.role !== 'processing').map(u => (
                                        <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Input type="date" className="h-8 w-36 text-sm"
                                value={filters.date_from ?? ''}
                                onChange={e => applyFilter('date_from', e.target.value)} />
                            <Input type="date" className="h-8 w-36 text-sm"
                                value={filters.date_to ?? ''}
                                onChange={e => applyFilter('date_to', e.target.value)} />
                        </div>
                    )}

                    {/* Table */}
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>Service</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Assigned</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="w-12" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {leads.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                                                No leads found
                                            </TableCell>
                                        </TableRow>
                                    ) : leads.data.map(lead => (
                                        <TableRow key={lead.id}>
                                            <TableCell>
                                                <div>
                                                    <Link href={`/leads/${lead.id}`}
                                                        className="font-medium text-gray-900 hover:text-blue-600 transition-colors">
                                                        {lead.name}
                                                    </Link>
                                                    {lead.company && (
                                                        <p className="text-xs text-gray-400 mt-0.5">{lead.company}</p>
                                                    )}
                                                    {lead.state && (
                                                        <p className="text-xs text-gray-400">{lead.state}</p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-0.5">
                                                    {lead.phone && <span className="text-xs text-gray-600">{lead.phone}</span>}
                                                    {lead.email && <span className="text-xs text-gray-500 truncate max-w-[160px]">{lead.email}</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-gray-700">{lead.service_required ?? '—'}</span>
                                            </TableCell>
                                            <TableCell>
                                                <LeadStatusBadge status={lead.status} />
                                                {lead.converted_at && (
                                                    <p className="text-[10px] text-gray-400 mt-0.5">Converted</p>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-gray-600">
                                                    {lead.assigned_user?.name ?? <span className="text-gray-300 italic">Unassigned</span>}
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
                                                                    onClick={() => setDeleteTarget(lead)}>
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
                        </CardContent>
                    </Card>

                    {/* Pagination */}
                    {leads.last_page > 1 && (
                        <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>Showing {leads.data.length} of {leads.total} leads</span>
                            <div className="flex gap-1">
                                {leads.links.map((link, i) => (
                                    <Button key={i} variant={link.active ? 'default' : 'outline'} size="sm"
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url)}
                                        className="h-7 min-w-[28px] px-2 text-xs"
                                        dangerouslySetInnerHTML={{ __html: link.label }} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Delete confirmation */}
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
