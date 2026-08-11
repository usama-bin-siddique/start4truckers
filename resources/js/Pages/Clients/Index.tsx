import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Eye, Filter, X, UserCheck, Users, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Lead { name: string; email: string | null; phone: string | null; company: string | null; service_required: string | null }
interface Client {
    id: number; client_number: string; status: string;
    assigned_user: { name: string } | null;
    lead: Lead | null; balance_due: number; created_at: string;
}
interface Paginator<T> {
    data: T[]; total: number; last_page: number;
    links: { url: string | null; label: string; active: boolean }[];
}
interface Stats { total: number; active: number; completed: number }
interface Filters { search?: string; status?: string; assigned_to?: string }

interface Props {
    clients: Paginator<Client>;
    users: { id: number; name: string; role: string }[];
    filters: Filters;
    stats: Stats;
}

const statusConfig: Record<string, { label: string; color: string; badge: 'success' | 'secondary' | 'outline' }> = {
    active:    { label: 'Active',    color: 'text-green-600', badge: 'success' },
    completed: { label: 'Completed', color: 'text-gray-500',  badge: 'secondary' },
    inactive:  { label: 'Inactive',  color: 'text-red-400',   badge: 'outline' },
};

export default function ClientsIndex({ clients, users, filters, stats }: Props) {
    const [showFilters, setShowFilters] = useState(false);

    function applyFilter(key: string, value: string) {
        router.get('/clients', { ...filters, [key]: value || undefined }, { preserveState: true, replace: true });
    }
    function clearFilters() {
        router.get('/clients', {}, { preserveState: true, replace: true });
    }

    const hasFilters = Object.values(filters).some(Boolean);

    return (
        <>
            <Head title="Clients" />
            <AppLayout title="Clients">
                <div className="space-y-4">

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: 'Total Clients', value: stats.total,     icon: <Users size={18} className="text-blue-500" />,   bg: 'bg-blue-50' },
                            { label: 'Active',        value: stats.active,    icon: <UserCheck size={18} className="text-green-500" />, bg: 'bg-green-50' },
                            { label: 'Completed',     value: stats.completed, icon: <CheckCircle size={18} className="text-gray-500" />, bg: 'bg-gray-50' },
                        ].map(s => (
                            <Card key={s.label} className="py-3 px-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase tracking-wide">{s.label}</p>
                                        <p className="text-xl font-bold text-gray-900 mt-0.5">{s.value}</p>
                                    </div>
                                    <div className={`p-2 rounded-md ${s.bg}`}>{s.icon}</div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative flex-1 min-w-[200px] max-w-xs">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <Input placeholder="Search clients…" className="pl-8 h-8 text-sm"
                                defaultValue={filters.search ?? ''}
                                onChange={e => applyFilter('search', e.target.value)} />
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}
                            className={hasFilters ? 'border-blue-400 text-blue-600' : ''}>
                            <Filter size={13} /> Filters
                        </Button>
                        {hasFilters && (
                            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-400">
                                <X size={13} /> Clear
                            </Button>
                        )}
                    </div>

                    {showFilters && (
                        <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <Select value={filters.status ?? ''} onValueChange={v => applyFilter('status', v)}>
                                <SelectTrigger className="h-8 w-36 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All statuses</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filters.assigned_to ?? ''} onValueChange={v => applyFilter('assigned_to', v)}>
                                <SelectTrigger className="h-8 w-40 text-sm"><SelectValue placeholder="Assigned to" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All employees</SelectItem>
                                    {users.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Client #</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>Service</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Balance Due</TableHead>
                                        <TableHead>Assigned</TableHead>
                                        <TableHead>Since</TableHead>
                                        <TableHead className="w-12" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {clients.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="text-center py-12 text-gray-400">
                                                No clients found
                                            </TableCell>
                                        </TableRow>
                                    ) : clients.data.map(client => {
                                        const sc = statusConfig[client.status] ?? statusConfig.active;
                                        return (
                                            <TableRow key={client.id}>
                                                <TableCell>
                                                    <Link href={`/clients/${client.id}`}
                                                        className="font-mono text-xs font-semibold text-blue-600 hover:underline">
                                                        {client.client_number}
                                                    </Link>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <Link href={`/clients/${client.id}`}
                                                            className="font-medium text-gray-900 hover:text-blue-600">
                                                            {client.lead?.name ?? '—'}
                                                        </Link>
                                                        {client.lead?.company && (
                                                            <p className="text-xs text-gray-400 mt-0.5">{client.lead.company}</p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-xs text-gray-600 space-y-0.5">
                                                        {client.lead?.phone && <p>{client.lead.phone}</p>}
                                                        {client.lead?.email && <p className="truncate max-w-[140px]">{client.lead.email}</p>}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm text-gray-700">{client.lead?.service_required ?? '—'}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={sc.badge}>{sc.label}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={cn('text-sm font-medium', client.balance_due > 0 ? 'text-red-600' : 'text-green-600')}>
                                                        ${client.balance_due.toFixed(2)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm text-gray-600">{client.assigned_user?.name ?? <span className="text-gray-300 italic">—</span>}</span>
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
                        </CardContent>
                    </Card>

                    {clients.last_page > 1 && (
                        <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>Showing {clients.data.length} of {clients.total} clients</span>
                            <div className="flex gap-1">
                                {clients.links.map((link, i) => (
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
            </AppLayout>
        </>
    );
}
