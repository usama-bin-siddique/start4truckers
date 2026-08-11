import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, X, DollarSign, TrendingUp, AlertCircle, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Payment {
    id: number; client_id: number; client_number: string; client_name: string;
    invoice_amount: number; amount_received: number; balance_due: number;
    payment_method: string | null; transaction_reference: string | null;
    paid_at: string | null; created_by: string | null; has_receipt: boolean; created_at: string;
}
interface Paginator<T> { data: T[]; total: number; last_page: number; links: { url: string | null; label: string; active: boolean }[] }
interface Totals { invoiced: number; received: number; balance: number }
interface Filters { search?: string; method?: string; date_from?: string; date_to?: string }

const METHOD_LABELS: Record<string, string> = {
    cash: 'Cash', check: 'Check', zelle: 'Zelle', venmo: 'Venmo',
    bank_transfer: 'Bank Transfer', stripe: 'Stripe', other: 'Other',
};

export default function PaymentsIndex({ payments, totals, filters }: { payments: Paginator<Payment>; totals: Totals; filters: Filters }) {
    const [showFilters, setShowFilters] = useState(false);

    function applyFilter(key: string, value: string) {
        router.get('/payments', { ...filters, [key]: value || undefined }, { preserveState: true, replace: true });
    }
    function clearFilters() { router.get('/payments', {}, { preserveState: true, replace: true }); }
    const hasFilters = Object.values(filters).some(Boolean);

    return (
        <>
            <Head title="Payments" />
            <AppLayout title="Payments">
                <div className="space-y-4">

                    {/* Totals */}
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: 'Total Invoiced', value: `$${totals.invoiced.toFixed(2)}`, icon: <DollarSign size={18} className="text-blue-500" />, bg: 'bg-blue-50', color: 'text-blue-700' },
                            { label: 'Total Received', value: `$${totals.received.toFixed(2)}`, icon: <TrendingUp size={18} className="text-green-500" />, bg: 'bg-green-50', color: 'text-green-700' },
                            { label: 'Outstanding',    value: `$${totals.balance.toFixed(2)}`,  icon: <AlertCircle size={18} className="text-red-500" />,   bg: 'bg-red-50',   color: totals.balance > 0 ? 'text-red-700' : 'text-green-700' },
                        ].map(s => (
                            <Card key={s.label} className="py-3 px-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase tracking-wide">{s.label}</p>
                                        <p className={cn('text-xl font-bold mt-0.5', s.color)}>{s.value}</p>
                                    </div>
                                    <div className={cn('p-2 rounded-md', s.bg)}>{s.icon}</div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative flex-1 min-w-[200px] max-w-xs">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <Input placeholder="Search by client…" className="pl-8 h-8 text-sm"
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
                            <Select value={filters.method ?? ''} onValueChange={v => applyFilter('method', v)}>
                                <SelectTrigger className="h-8 w-40 text-sm"><SelectValue placeholder="Payment method" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All methods</SelectItem>
                                    {Object.entries(METHOD_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Input type="date" className="h-8 w-36 text-sm" value={filters.date_from ?? ''} onChange={e => applyFilter('date_from', e.target.value)} />
                            <Input type="date" className="h-8 w-36 text-sm" value={filters.date_to ?? ''} onChange={e => applyFilter('date_to', e.target.value)} />
                        </div>
                    )}

                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Client</TableHead>
                                        <TableHead>Invoice</TableHead>
                                        <TableHead>Received</TableHead>
                                        <TableHead>Balance</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead>Reference</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>By</TableHead>
                                        <TableHead className="w-12" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments.data.length === 0 ? (
                                        <TableRow><TableCell colSpan={9} className="text-center py-12 text-gray-400">No payments found</TableCell></TableRow>
                                    ) : payments.data.map(p => (
                                        <TableRow key={p.id}>
                                            <TableCell>
                                                <Link href={`/clients/${p.client_id}`} className="hover:text-blue-600">
                                                    <p className="font-medium text-gray-900 text-sm">{p.client_name}</p>
                                                    <p className="font-mono text-xs text-blue-500">{p.client_number}</p>
                                                </Link>
                                            </TableCell>
                                            <TableCell className="font-medium">${p.invoice_amount.toFixed(2)}</TableCell>
                                            <TableCell className="text-green-600">${p.amount_received.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <span className={cn('font-medium text-sm', p.balance_due > 0 ? 'text-red-600' : 'text-green-600')}>
                                                    ${p.balance_due.toFixed(2)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {p.payment_method
                                                    ? <Badge variant="secondary" className="capitalize text-xs">{METHOD_LABELS[p.payment_method] ?? p.payment_method}</Badge>
                                                    : <span className="text-gray-300">—</span>}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-gray-500">{p.transaction_reference ?? '—'}</TableCell>
                                            <TableCell className="text-xs text-gray-500">{p.paid_at ?? p.created_at}</TableCell>
                                            <TableCell className="text-xs text-gray-500">{p.created_by ?? '—'}</TableCell>
                                            <TableCell>
                                                {p.has_receipt && (
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                                        <a href={`/payments/${p.id}/receipt`} target="_blank" rel="noreferrer">
                                                            <Download size={13} />
                                                        </a>
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {payments.last_page > 1 && (
                        <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>Showing {payments.data.length} of {payments.total} payments</span>
                            <div className="flex gap-1">
                                {payments.links.map((link, i) => (
                                    <Button key={i} variant={link.active ? 'default' : 'outline'} size="sm"
                                        disabled={!link.url} onClick={() => link.url && router.get(link.url)}
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
