import React, { useEffect, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Eye, Filter, X, UserCheck, Users, CheckCircle, CircleOff, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Lead { name: string; email: string | null; phone: string | null; company: string | null; service_required: string | null }
interface Client {
    id: number; client_number: string; status: string; compliance_type: 'project' | 'monthly' | null;
    assigned_user: { name: string } | null;
    lead: Lead | null; balance_due: number; created_at: string;
}
interface Paginator<T> {
    data: T[]; total: number; last_page: number;
    links: { url: string | null; label: string; active: boolean }[];
}
interface Stats { total: number; active: number; completed: number; inactive?: number }
interface Filters { search?: string; status?: string; assigned_to?: string; compliance_type?: string }

interface Props {
    clients: Paginator<Client>;
    users: { id: number; name: string; role: string }[];
    filters: Filters;
    stats: Stats;
}

const complianceLabel: Record<string, string> = {
    project: 'Project based',
    monthly: 'Monthly',
};

const statusConfig: Record<string, { label: string; badge: 'success' | 'secondary' | 'outline' }> = {
    active:    { label: 'Active',    badge: 'success' },
    completed: { label: 'Completed', badge: 'secondary' },
    inactive:  { label: 'Inactive',  badge: 'outline' },
};

export default function ClientsIndex({ clients, users, filters, stats }: Props) {
    const { auth } = usePage<{ auth: { user: { role: string } } }>().props;
    const canReassign = auth.user.role !== 'sales';
    const [showFilters, setShowFilters] = useState(false);
    const [search, setSearch] = useState(filters.search ?? '');
    const hasFilters = Object.values(filters).some(Boolean);

    useEffect(() => {
        const t = setTimeout(() => {
            if (search !== (filters.search ?? '')) applyFilter('search', search);
        }, 350);
        return () => clearTimeout(t);
    }, [search]);

    function applyFilter(key: string, value: string) {
        router.get('/clients', { ...filters, [key]: value || undefined }, { preserveState: true, replace: true });
    }

    function clearFilters() {
        setSearch('');
        router.get('/clients', {}, { preserveState: true, replace: true });
    }

    const kpis = [
        { label: 'Total', value: stats.total, icon: <Users className="h-4 w-4 text-sky-700" />, iconClass: 'bg-sky-100' },
        { label: 'Active', value: stats.active, icon: <UserCheck className="h-4 w-4 text-emerald-700" />, iconClass: 'bg-emerald-100' },
        { label: 'Completed', value: stats.completed, icon: <CheckCircle className="h-4 w-4 text-blue-700" />, iconClass: 'bg-blue-100' },
        { label: 'Inactive', value: stats.inactive ?? 0, icon: <CircleOff className="h-4 w-4 text-gray-500" />, iconClass: 'bg-gray-100' },
    ];

    return (
        <>
            <Head title="Clients" />
            <AppLayout title="Clients">
                <div className="space-y-6">

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold tracking-[0.12em] text-amber-600">
                                <GitBranch className="h-3 w-3" />
                                PIPELINE
                            </span>
                            <h2 className="mt-3 text-[32px] leading-none font-semibold tracking-tight text-gray-950">
                                Clients
                            </h2>
                            <p className="mt-2 text-sm text-gray-500">
                                Manage converted accounts and keep work moving.
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
                        <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                            <div className="relative min-w-[220px] flex-1 max-w-md">
                                <Search size={15} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-gray-400" />
                                <Input
                                    placeholder="Search clients.."
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

                            <p className="ml-auto text-sm text-gray-400">{clients.total} clients</p>
                        </div>

                        {showFilters && (
                            <div className="flex flex-wrap gap-3 border-t border-gray-100 px-5 py-4">
                                <Select value={filters.status ?? ''} onValueChange={(v) => applyFilter('status', v)}>
                                    <SelectTrigger className="h-9 w-36 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All statuses</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                                {canReassign && (
                                <Select value={filters.assigned_to ?? ''} onValueChange={(v) => applyFilter('assigned_to', v)}>
                                    <SelectTrigger className="h-9 w-40 text-sm"><SelectValue placeholder="Assigned to" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All employees</SelectItem>
                                        {users.map((u) => (
                                            <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                )}
                                <Select value={filters.compliance_type ?? ''} onValueChange={(v) => applyFilter('compliance_type', v)}>
                                    <SelectTrigger className="h-9 w-40 text-sm"><SelectValue placeholder="Compliance" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All compliance</SelectItem>
                                        <SelectItem value="project">Project based</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="border-t border-gray-100">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="px-5 text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Client #</TableHead>
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Name</TableHead>
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Contact</TableHead>
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Service</TableHead>
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Compliance</TableHead>
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Status</TableHead>
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Balance Due</TableHead>
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Assigned</TableHead>
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Since</TableHead>
                                        <TableHead className="w-12" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {clients.data.length === 0 ? (
                                        <TableRow className="hover:bg-transparent">
                                            <TableCell colSpan={10} className="h-56 text-center text-sm text-gray-400">
                                                No clients found
                                            </TableCell>
                                        </TableRow>
                                    ) : clients.data.map((client) => {
                                        const sc = statusConfig[client.status] ?? statusConfig.active;
                                        return (
                                            <TableRow key={client.id}>
                                                <TableCell className="px-5">
                                                    <Link href={`/clients/${client.id}`} className="font-mono text-xs font-semibold text-amber-700 hover:underline">
                                                        {client.client_number}
                                                    </Link>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <Link href={`/clients/${client.id}`} className="font-medium text-gray-900 transition-colors hover:text-amber-700">
                                                            {client.lead?.name ?? '—'}
                                                        </Link>
                                                        {client.lead?.company && (
                                                            <p className="mt-0.5 text-xs text-gray-400">{client.lead.company}</p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-0.5 text-xs text-gray-600">
                                                        {client.lead?.phone && <p>{client.lead.phone}</p>}
                                                        {client.lead?.email && <p className="max-w-[140px] truncate">{client.lead.email}</p>}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm text-gray-700">{client.lead?.service_required ?? '—'}</span>
                                                </TableCell>
                                                <TableCell>
                                                    {client.compliance_type ? (
                                                        <Badge variant={client.compliance_type === 'monthly' ? 'default' : 'warning'}>
                                                            {complianceLabel[client.compliance_type]}
                                                        </Badge>
                                                    ) : <span className="text-xs text-gray-300">—</span>}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={sc.badge}>{sc.label}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={cn('text-sm font-medium', client.balance_due > 0 ? 'text-red-600' : 'text-emerald-600')}>
                                                        ${client.balance_due.toFixed(2)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm text-gray-600">
                                                        {client.assigned_user?.name ?? <span className="italic text-gray-300">—</span>}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-xs text-gray-400">{client.created_at}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                                        <Link href={`/clients/${client.id}`}><Eye size={14} /></Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>

                        {clients.last_page > 1 && (
                            <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 text-sm text-gray-500">
                                <span>Showing {clients.data.length} of {clients.total} clients</span>
                                <div className="flex gap-1">
                                    {clients.links.map((link, i) => (
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
            </AppLayout>
        </>
    );
}
