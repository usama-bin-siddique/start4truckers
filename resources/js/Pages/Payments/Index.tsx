import React, { useEffect, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, X, DollarSign, TrendingUp, AlertCircle, Download, Receipt, GitBranch } from 'lucide-react';
import PrintInvoiceLink from '@/components/PrintInvoiceLink';
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

function fmt(n: number): string {
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function PaymentsIndex({ payments, totals, filters }: { payments: Paginator<Payment>; totals: Totals; filters: Filters }) {
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
        router.get('/payments', { ...filters, [key]: value || undefined }, { preserveState: true, replace: true });
    }

    function clearFilters() {
        setSearch('');
        router.get('/payments', {}, { preserveState: true, replace: true });
    }

    const kpis = [
        { label: 'Invoiced', value: fmt(totals.invoiced), icon: <DollarSign className="h-4 w-4 text-sky-700" />, iconClass: 'bg-sky-100' },
        { label: 'Received', value: fmt(totals.received), icon: <TrendingUp className="h-4 w-4 text-emerald-700" />, iconClass: 'bg-emerald-100' },
        { label: 'Outstanding', value: fmt(totals.balance), icon: <AlertCircle className="h-4 w-4 text-red-600" />, iconClass: 'bg-red-100' },
        { label: 'Payments', value: payments.total, icon: <Receipt className="h-4 w-4 text-amber-700" />, iconClass: 'bg-amber-100' },
    ];

    return (
        <>
            <Head title="Payments" />
            <AppLayout title="Payments">
                <div className="space-y-6">

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold tracking-[0.12em] text-amber-600">
                                <GitBranch className="h-3 w-3" />
                                PIPELINE
                            </span>
                            <h2 className="mt-3 text-[32px] leading-none font-semibold tracking-tight text-gray-950">
                                Payments
                            </h2>
                            <p className="mt-2 text-sm text-gray-500">
                                Track invoices, receipts, and outstanding balances.
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
                                <p className="mt-4 text-[28px] leading-none font-semibold tracking-tight text-gray-950">{k.value}</p>
                            </div>
                        ))}
                    </div>

                    <section className="rounded-2xl border border-gray-200/80 bg-white shadow-sm">
                        <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                            <div className="relative min-w-[220px] flex-1 max-w-md">
                                <Search size={15} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-gray-400" />
                                <Input
                                    placeholder="Search payments.."
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

                            <p className="ml-auto text-sm text-gray-400">{payments.total} payments</p>
                        </div>

                        {showFilters && (
                            <div className="flex flex-wrap gap-3 border-t border-gray-100 px-5 py-4">
                                <Select value={filters.method ?? ''} onValueChange={(v) => applyFilter('method', v)}>
                                    <SelectTrigger className="h-9 w-40 text-sm"><SelectValue placeholder="Payment method" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All methods</SelectItem>
                                        {Object.entries(METHOD_LABELS).map(([k, v]) => (
                                            <SelectItem key={k} value={k}>{v}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input type="date" className="h-9 w-36 text-sm" value={filters.date_from ?? ''} onChange={(e) => applyFilter('date_from', e.target.value)} />
                                <Input type="date" className="h-9 w-36 text-sm" value={filters.date_to ?? ''} onChange={(e) => applyFilter('date_to', e.target.value)} />
                            </div>
                        )}

                        <div className="border-t border-gray-100">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="px-5 text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Client</TableHead>
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Invoice</TableHead>
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Received</TableHead>
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Balance</TableHead>
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Method</TableHead>
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Reference</TableHead>
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Date</TableHead>
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">By</TableHead>
                                        <TableHead className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments.data.length === 0 ? (
                                        <TableRow className="hover:bg-transparent">
                                            <TableCell colSpan={9} className="h-56 text-center text-sm text-gray-400">
                                                No payments found
                                            </TableCell>
                                        </TableRow>
                                    ) : payments.data.map((p) => (
                                        <TableRow key={p.id}>
                                            <TableCell className="px-5">
                                                <Link href={`/clients/${p.client_id}`} className="hover:text-amber-700">
                                                    <p className="text-sm font-medium text-gray-900">{p.client_name}</p>
                                                    <p className="font-mono text-xs text-amber-700">{p.client_number}</p>
                                                </Link>
                                            </TableCell>
                                            <TableCell className="font-medium">{fmt(p.invoice_amount)}</TableCell>
                                            <TableCell className="text-emerald-600">{fmt(p.amount_received)}</TableCell>
                                            <TableCell>
                                                <span className={cn('text-sm font-medium', p.balance_due > 0 ? 'text-red-600' : 'text-emerald-600')}>
                                                    {fmt(p.balance_due)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {p.payment_method
                                                    ? <Badge variant="secondary" className="text-xs capitalize">{METHOD_LABELS[p.payment_method] ?? p.payment_method}</Badge>
                                                    : <span className="text-gray-300">—</span>}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-gray-500">{p.transaction_reference ?? '—'}</TableCell>
                                            <TableCell className="text-xs text-gray-400">{p.paid_at ?? p.created_at}</TableCell>
                                            <TableCell className="text-xs text-gray-500">{p.created_by ?? '—'}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <PrintInvoiceLink paymentId={p.id} />
                                                    {p.has_receipt && (
                                                        <a href={`/payments/${p.id}/receipt`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800" title="View receipt">
                                                            <Download size={13} /> Receipt
                                                        </a>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {payments.last_page > 1 && (
                            <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 text-sm text-gray-500">
                                <span>Showing {payments.data.length} of {payments.total} payments</span>
                                <div className="flex gap-1">
                                    {payments.links.map((link, i) => (
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
