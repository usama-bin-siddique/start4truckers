import React, { useEffect, useRef, useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Filter, X, DollarSign, TrendingUp, AlertCircle, Download, Receipt, GitBranch, Plus, FileText, Upload } from 'lucide-react';
import PrintInvoiceLink from '@/components/PrintInvoiceLink';
import { cn } from '@/lib/utils';

interface Payment {
    id: number;
    invoice_number: string;
    client_id: number;
    client_number: string;
    customer_name: string;
    company_name: string | null;
    invoice_amount: number;
    amount_received: number;
    balance_due: number;
    payment_method: string | null;
    status: 'paid' | 'partial' | 'unpaid';
    services: string[];
    assigned_user: string | null;
    transaction_reference: string | null;
    notes: string | null;
    paid_at: string | null;
    created_by: string | null;
    has_receipt: boolean;
    created_at: string;
}
interface Paginator<T> { data: T[]; total: number; last_page: number; links: { url: string | null; label: string; active: boolean }[] }
interface Totals { invoiced: number; received: number; balance: number }
interface Filters { search?: string; method?: string; date_from?: string; date_to?: string }
interface PaymentClient { id: number; client_number: string | null; name: string; company: string | null }

const METHOD_LABELS: Record<string, string> = {
    cash: 'Cash', check: 'Check', zelle: 'Zelle', venmo: 'Venmo',
    bank_transfer: 'Bank Transfer', stripe: 'Stripe', other: 'Other',
};

const STATUS_LABELS: Record<Payment['status'], string> = {
    paid: 'Paid',
    partial: 'Partial',
    unpaid: 'Unpaid',
};

function fmt(n: number): string {
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(value: string | null): string {
    if (!value) return '—';
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function StatusBadge({ status }: { status: Payment['status'] }) {
    const variant = status === 'paid' ? 'success' : status === 'partial' ? 'warning' : 'secondary';
    return <Badge variant={variant}>{STATUS_LABELS[status]}</Badge>;
}

function PaymentDetail({
    payment,
    onClose,
}: {
    payment: Payment | null;
    onClose: () => void;
}) {
    return (
        <Dialog open={payment !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Payment {payment ? `#${payment.id}` : ''}</DialogTitle>
                </DialogHeader>
                {payment && (
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                        <DetailField label="Payment ID" value={`#${payment.id}`} />
                        <DetailField label="Invoice #" value={payment.invoice_number} />
                        <div>
                            <p className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Client ID</p>
                            <Link href={`/clients/${payment.client_id}`} className="mt-0.5 inline-block font-mono text-sm font-medium text-amber-700 hover:text-amber-800 hover:underline">
                                {payment.client_number}
                            </Link>
                        </div>
                        <DetailField label="Payment Date" value={formatDate(payment.paid_at ?? payment.created_at)} />
                        <DetailField label="Customer Name" value={payment.customer_name} />
                        <DetailField label="Company Name" value={payment.company_name || '—'} />
                        <DetailField label="Payment Amount" value={fmt(payment.amount_received)} />
                        <DetailField label="Invoice Amount" value={fmt(payment.invoice_amount)} />
                        <DetailField label="Balance Due" value={fmt(payment.balance_due)} />
                        <div>
                            <p className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Payment Status</p>
                            <div className="mt-1"><StatusBadge status={payment.status} /></div>
                        </div>
                        <DetailField label="Payment Method" value={METHOD_LABELS[payment.payment_method ?? ''] ?? payment.payment_method ?? '—'} />
                        <DetailField label="Assigned User" value={payment.assigned_user || '—'} />
                        <div className="col-span-2">
                            <DetailField label="Service / Package" value={payment.services.length ? payment.services.join(', ') : '—'} />
                        </div>
                        <DetailField label="Reference" value={payment.transaction_reference || '—'} />
                        <DetailField label="Recorded by" value={payment.created_by || '—'} />
                        {payment.notes && (
                            <div className="col-span-2">
                                <DetailField label="Notes" value={payment.notes} />
                            </div>
                        )}
                    </div>
                )}
                {payment && (
                    <DialogFooter className="gap-2 sm:justify-between">
                        <div className="flex items-center gap-3">
                            <PrintInvoiceLink paymentId={payment.id} />
                            {payment.has_receipt && (
                                <a href={`/payments/${payment.id}/receipt`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800">
                                    <Download size={13} /> Receipt
                                </a>
                            )}
                        </div>
                        <Button type="button" variant="outline" onClick={onClose}>Close</Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}

function DetailField({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">{label}</p>
            <p className="mt-0.5 text-sm text-gray-900">{value}</p>
        </div>
    );
}

export default function PaymentsIndex({
    payments,
    totals,
    filters,
    clients = [],
    can_create = false,
}: {
    payments: Paginator<Payment>;
    totals: Totals;
    filters: Filters;
    clients?: PaymentClient[];
    can_create?: boolean;
}) {
    const [showFilters, setShowFilters] = useState(false);
    const [search, setSearch] = useState(filters.search ?? '');
    const [selected, setSelected] = useState<Payment | null>(null);
    const [addOpen, setAddOpen] = useState(false);
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

    const columns = 12;

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
                        {can_create && (
                            <button
                                type="button"
                                onClick={() => setAddOpen(true)}
                                className="inline-flex items-center gap-2 rounded-lg bg-[#12141D] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black"
                            >
                                <Plus className="h-4 w-4" /> Add payment
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
                                        <TableHead className="px-5 whitespace-nowrap text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Payment ID</TableHead>
                                        <TableHead className="whitespace-nowrap text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Client ID</TableHead>
                                        <TableHead className="whitespace-nowrap text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Invoice #</TableHead>
                                        <TableHead className="whitespace-nowrap text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Payment Date</TableHead>
                                        <TableHead className="whitespace-nowrap text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Customer Name</TableHead>
                                        <TableHead className="whitespace-nowrap text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Company Name</TableHead>
                                        <TableHead className="whitespace-nowrap text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Payment Amount</TableHead>
                                        <TableHead className="whitespace-nowrap text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Payment Method</TableHead>
                                        <TableHead className="whitespace-nowrap text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Payment Status</TableHead>
                                        <TableHead className="whitespace-nowrap text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Service / Package</TableHead>
                                        <TableHead className="whitespace-nowrap text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Assigned User</TableHead>
                                        <TableHead className="whitespace-nowrap text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments.data.length === 0 ? (
                                        <TableRow className="hover:bg-transparent">
                                            <TableCell colSpan={columns} className="h-56 text-center text-sm text-gray-400">
                                                No payments found
                                            </TableCell>
                                        </TableRow>
                                    ) : payments.data.map((p) => (
                                        <TableRow
                                            key={p.id}
                                            className="cursor-pointer"
                                            onClick={() => setSelected(p)}
                                        >
                                            <TableCell className="px-5 whitespace-nowrap font-mono text-sm font-medium text-gray-900">#{p.id}</TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                <Link
                                                    href={`/clients/${p.client_id}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="font-mono text-sm font-medium text-amber-700 hover:text-amber-800 hover:underline"
                                                >
                                                    {p.client_number}
                                                </Link>
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap font-mono text-xs text-gray-700">{p.invoice_number}</TableCell>
                                            <TableCell className="whitespace-nowrap text-xs text-gray-500">{formatDate(p.paid_at ?? p.created_at)}</TableCell>
                                            <TableCell className="whitespace-nowrap text-sm font-medium text-gray-900">{p.customer_name}</TableCell>
                                            <TableCell className="whitespace-nowrap text-sm text-gray-600">{p.company_name || '—'}</TableCell>
                                            <TableCell className="whitespace-nowrap font-medium text-emerald-600">{fmt(p.amount_received)}</TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                {p.payment_method
                                                    ? <Badge variant="secondary" className="text-xs capitalize">{METHOD_LABELS[p.payment_method] ?? p.payment_method}</Badge>
                                                    : <span className="text-gray-300">—</span>}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap"><StatusBadge status={p.status} /></TableCell>
                                            <TableCell className="max-w-[180px] truncate text-sm text-gray-600" title={p.services.join(', ')}>
                                                {p.services.length ? p.services.join(', ') : '—'}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap text-sm text-gray-600">{p.assigned_user || '—'}</TableCell>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
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

            <PaymentDetail payment={selected} onClose={() => setSelected(null)} />
            {can_create && (
                <AddPaymentDialog
                    open={addOpen}
                    clients={clients}
                    onClose={() => setAddOpen(false)}
                />
            )}
        </>
    );
}

function AddPaymentDialog({
    open,
    clients,
    onClose,
}: {
    open: boolean;
    clients: PaymentClient[];
    onClose: () => void;
}) {
    const [clientQuery, setClientQuery] = useState('');
    const form = useForm({
        client_id: '',
        invoice_amount: '',
        amount_received: '',
        payment_method: '',
        transaction_reference: '',
        notes: '',
        paid_at: '',
        receipt: null as File | null,
        return_to: 'payments',
    });

    const filteredClients = clients.filter((c) => {
        const q = clientQuery.trim().toLowerCase();
        if (!q) return true;
        return [c.name, c.company, c.client_number].some((v) => (v ?? '').toLowerCase().includes(q));
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/payments', {
            forceFormData: true,
            onSuccess: () => {
                form.reset();
                setClientQuery('');
                onClose();
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={(next) => { if (!next) { form.reset(); setClientQuery(''); onClose(); } }}>
            <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add payment</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-3">
                    <Field label="Client *" error={form.errors.client_id}>
                        {clients.length > 8 && (
                            <Input
                                type="search"
                                placeholder="Search client name or ID…"
                                className="mb-2 h-9"
                                value={clientQuery}
                                onChange={(e) => setClientQuery(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                            />
                        )}
                        <Select value={form.data.client_id || undefined} onValueChange={(v) => form.setData('client_id', v)}>
                            <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                            <SelectContent>
                                {filteredClients.length === 0 ? (
                                    <div className="px-3 py-2 text-sm text-gray-400">No matching clients</div>
                                ) : filteredClients.map((c) => (
                                    <SelectItem key={c.id} value={String(c.id)}>
                                        {c.name}{c.client_number ? ` · ${c.client_number}` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Invoice amount *" error={form.errors.invoice_amount}>
                            <Input type="number" step="0.01" min="0" placeholder="0.00" value={form.data.invoice_amount} onChange={(e) => form.setData('invoice_amount', e.target.value)} />
                        </Field>
                        <Field label="Amount received" error={form.errors.amount_received}>
                            <Input type="number" step="0.01" min="0" placeholder="0.00" value={form.data.amount_received} onChange={(e) => form.setData('amount_received', e.target.value)} />
                        </Field>
                    </div>
                    <Field label="Payment method" error={form.errors.payment_method}>
                        <Select value={form.data.payment_method || undefined} onValueChange={(v) => form.setData('payment_method', v)}>
                            <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                            <SelectContent>
                                {Object.entries(METHOD_LABELS).map(([k, v]) => (
                                    <SelectItem key={k} value={k}>{v}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                    <Field label="Transaction reference" error={form.errors.transaction_reference}>
                        <Input placeholder="TX-12345" value={form.data.transaction_reference} onChange={(e) => form.setData('transaction_reference', e.target.value)} />
                    </Field>
                    <Field label="Payment date" error={form.errors.paid_at}>
                        <Input type="date" value={form.data.paid_at} onChange={(e) => form.setData('paid_at', e.target.value)} />
                    </Field>
                    <Field label="Notes" error={form.errors.notes}>
                        <Textarea rows={2} value={form.data.notes} onChange={(e) => form.setData('notes', e.target.value)} />
                    </Field>
                    <PaymentProofField
                        file={form.data.receipt}
                        error={form.errors.receipt}
                        onChange={(file) => form.setData('receipt', file)}
                    />
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={form.processing || clients.length === 0}>Save payment</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-gray-600">{label}</Label>
            {children}
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}

const PROOF_ACCEPT = '.jpg,.jpeg,.png,.pdf';
const PROOF_EXT = ['jpg', 'jpeg', 'png', 'pdf'];
const PROOF_MAX_BYTES = 5 * 1024 * 1024;

function PaymentProofField({
    file,
    onChange,
    error,
}: {
    file: File | null;
    onChange: (file: File | null) => void;
    error?: string;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [over, setOver] = useState(false);

    function take(incoming?: File) {
        if (!incoming) return;
        const ext = incoming.name.split('.').pop()?.toLowerCase() ?? '';
        if (!PROOF_EXT.includes(ext) || incoming.size > PROOF_MAX_BYTES) return;
        onChange(incoming);
    }

    function formatSize(bytes: number) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    return (
        <Field label="Payment proof" error={error}>
            {file ? (
                <div className="flex items-center gap-2 rounded-xl border border-gray-200/80 bg-[#FAFAF8] px-3 py-2">
                    <FileText className="h-4 w-4 shrink-0 text-amber-700" />
                    <span className="min-w-0 flex-1 truncate text-xs text-gray-800">{file.name}</span>
                    <span className="shrink-0 text-[10px] text-gray-400">{formatSize(file.size)}</span>
                    <button
                        type="button"
                        onClick={() => onChange(null)}
                        className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-red-50 hover:text-red-600"
                        aria-label="Remove payment proof"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setOver(true); }}
                    onDragLeave={() => setOver(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setOver(false);
                        take(e.dataTransfer.files[0]);
                    }}
                    className={cn(
                        'flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-3 py-5 text-center transition-colors',
                        over
                            ? 'border-[#C4A035] bg-amber-50'
                            : 'border-gray-200 bg-[#FAFAF8] hover:border-[#C4A035]/60 hover:bg-amber-50/40',
                    )}
                >
                    <Upload className={cn('mb-1.5 h-4 w-4', over ? 'text-amber-700' : 'text-gray-400')} />
                    <span className="text-xs font-medium text-gray-600">Drop screenshot or PDF, or click to browse</span>
                    <span className="mt-0.5 text-[11px] text-gray-400">JPG, PNG, or PDF · max 5 MB · optional</span>
                </button>
            )}
            <input
                ref={inputRef}
                type="file"
                accept={PROOF_ACCEPT}
                className="hidden"
                onChange={(e) => {
                    take(e.target.files?.[0]);
                    e.target.value = '';
                }}
            />
        </Field>
    );
}
