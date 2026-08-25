import React, { useRef, useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DocumentUploadRows, {
    emptyDocumentRow,
    queuedDocumentCount,
    toDocumentPayload,
    type DocumentUploadRow,
} from '@/components/DocumentUploadRows';
import { ChevronLeft, DollarSign, FileText, GitBranch, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface User { id: number; name: string; role: string }

const US_STATES = [
    'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
    'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
    'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
    'VA','WA','WV','WI','WY','DC',
];

const PAYMENT_METHODS = ['Cash', 'Check', 'Zelle', 'Venmo', 'Bank Transfer', 'Stripe', 'Other'];

export default function ClientCreate({
    users,
    profile_options,
    doc_categories = {},
    can_upload_documents = false,
    can_add_payment = false,
}: {
    users: User[];
    profile_options: {
        statuses: Record<string, string>;
        us_states: string[];
        entity_types: Record<string, string>;
        contact_methods: Record<string, string>;
    };
    doc_categories?: Record<string, string>;
    can_upload_documents?: boolean;
    can_add_payment?: boolean;
}) {
    const { auth } = usePage<{ auth: { user: { id: number; role: string } } }>().props;
    const isSales = auth.user.role === 'sales';
    const { data, setData, post, processing, errors, transform } = useForm({
        name: '', phone: '', email: '', state: '', address: '',
        company: '', ein: '', usdot_number: '', mc_number: '',
        notes: '', compliance_type: '', status: 'onboarding',
        assigned_to: isSales ? String(auth.user.id) : '',
        documents: [emptyDocumentRow()] as DocumentUploadRow[],
        payment: {
            invoice_amount: '',
            amount_received: '',
            payment_method: '',
            transaction_reference: '',
            notes: '',
            paid_at: '',
            receipt: null as File | null,
        },
    });

    const queued = queuedDocumentCount(data.documents);
    const uploadErrors = errors as Record<string, string>;

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        transform((form) => ({
            ...form,
            documents: toDocumentPayload(form.documents),
        }));
        post('/clients', { forceFormData: true });
    }

    return (
        <>
            <Head title="New Client" />
            <AppLayout title="New Client">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <Link href="/clients" className="mb-3 inline-flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-gray-700">
                                <ChevronLeft size={14} /> Back to clients
                            </Link>
                            <div className="mt-3">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold tracking-[0.12em] text-amber-600">
                                    <GitBranch className="h-3 w-3" />
                                    PIPELINE
                                </span>
                            </div>
                            <h2 className="mt-3 text-[32px] leading-none font-semibold tracking-tight text-gray-950">
                                New client
                            </h2>
                            <p className="mt-2 text-sm text-gray-500">
                                Create a client profile directly. Documents and payment can be added now or later.
                            </p>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <Link
                                href="/clients"
                                className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center rounded-lg bg-[#12141D] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black disabled:opacity-70"
                            >
                                {processing ? 'Creating…' : 'Create client'}
                            </button>
                        </div>
                    </div>

                    <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm sm:p-8">
                        <h3 className="text-base font-semibold text-gray-950">Contact</h3>
                        <p className="mt-1 text-sm text-gray-400">Who they are and how to reach them.</p>
                        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                            <Field label="Full name *" error={errors.name} className="xl:col-span-2">
                                <Input placeholder="John Doe" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                            </Field>
                            <Field label="Phone" error={errors.phone}>
                                <Input placeholder="+1 (555) 000-0000" value={data.phone} onChange={(e) => setData('phone', e.target.value)} />
                            </Field>
                            <Field label="Email" error={errors.email}>
                                <Input type="email" placeholder="john@example.com" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                            </Field>
                            <Field label="Address" error={errors.address} className="md:col-span-2 xl:col-span-4">
                                <Input placeholder="Street, city, ZIP" value={data.address} onChange={(e) => setData('address', e.target.value)} />
                            </Field>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm sm:p-8">
                        <h3 className="text-base font-semibold text-gray-950">Business</h3>
                        <p className="mt-1 text-sm text-gray-400">Company details and how this account should be handled.</p>
                        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                            <Field label="Company" error={errors.company} className="xl:col-span-2">
                                <Input placeholder="Trucking Co. LLC" value={data.company} onChange={(e) => setData('company', e.target.value)} />
                            </Field>
                            <Field label="State" error={errors.state}>
                                <Select value={data.state} onValueChange={(v) => setData('state', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                                    <SelectContent>
                                        {(profile_options?.us_states ?? US_STATES).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </Field>
                            <Field label="EIN #" error={errors.ein}>
                                <Input placeholder="12-3456789" value={data.ein} onChange={(e) => setData('ein', e.target.value)} />
                            </Field>
                            <Field label="USDOT #" error={errors.usdot_number}>
                                <Input value={data.usdot_number} onChange={(e) => setData('usdot_number', e.target.value)} />
                            </Field>
                            <Field label="MC #" error={errors.mc_number}>
                                <Input value={data.mc_number} onChange={(e) => setData('mc_number', e.target.value)} />
                            </Field>
                            <Field label="Client status" error={errors.status}>
                                <Select value={data.status} onValueChange={(v) => setData('status', v)}>
                                    <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(profile_options?.statuses ?? { onboarding: 'Onboarding' }).map(([value, label]) => (
                                            <SelectItem key={value} value={value}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Field>
                            <Field label="Compliance" error={errors.compliance_type}>
                                <Select value={data.compliance_type} onValueChange={(v) => setData('compliance_type', v)}>
                                    <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="project">One-Time</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </Field>
                            {!isSales && (
                            <Field label="Assign to" error={errors.assigned_to}>
                                <Select value={data.assigned_to || undefined} onValueChange={(v) => setData('assigned_to', v)}>
                                    <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                                    <SelectContent>
                                        {users.filter((u) => ['admin', 'sales', 'manager'].includes(u.role)).map((u) => (
                                            <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Field>
                            )}
                            <Field label="Notes" error={errors.notes} className="md:col-span-2 xl:col-span-4">
                                <Textarea
                                    rows={5}
                                    placeholder="Any additional notes…"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                />
                            </Field>
                        </div>
                    </section>

                    {can_upload_documents && (
                        <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm sm:p-8">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-base font-semibold text-gray-950">Documents</h3>
                                    <p className="mt-1 text-sm text-gray-400">Optional. Add a file and document type for each row, or skip and upload later.</p>
                                </div>
                                {queued > 0 && (
                                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                                        {queued} file{queued === 1 ? '' : 's'} ready
                                    </span>
                                )}
                            </div>
                            <div className="mt-6">
                                <DocumentUploadRows
                                    categories={doc_categories}
                                    rows={data.documents}
                                    onChange={(documents) => setData('documents', documents)}
                                    errors={uploadErrors}
                                />
                            </div>
                        </section>
                    )}

                    {can_add_payment && (
                        <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm sm:p-8">
                            <h3 className="text-base font-semibold text-gray-950">Payment</h3>
                            <p className="mt-1 text-sm text-gray-400">Optional. Record an invoice or payment now, or add it from the client profile later.</p>
                            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                                <Field label="Invoice amount" error={errors['payment.invoice_amount']}>
                                    <div className="relative">
                                        <DollarSign className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                            className="pl-9"
                                            value={data.payment.invoice_amount}
                                            onChange={(e) => setData('payment', { ...data.payment, invoice_amount: e.target.value })}
                                        />
                                    </div>
                                </Field>
                                <Field label="Amount received" error={errors['payment.amount_received']}>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        value={data.payment.amount_received}
                                        onChange={(e) => setData('payment', { ...data.payment, amount_received: e.target.value })}
                                    />
                                </Field>
                                <Field label="Payment method" error={errors['payment.payment_method']}>
                                    <Select
                                        value={data.payment.payment_method}
                                        onValueChange={(v) => setData('payment', { ...data.payment, payment_method: v })}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                                        <SelectContent>
                                            {PAYMENT_METHODS.map((m) => (
                                                <SelectItem key={m} value={m.toLowerCase().replace(' ', '_')}>{m}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Field label="Transaction reference" error={errors['payment.transaction_reference']}>
                                    <Input
                                        placeholder="TX-12345"
                                        value={data.payment.transaction_reference}
                                        onChange={(e) => setData('payment', { ...data.payment, transaction_reference: e.target.value })}
                                    />
                                </Field>
                                <Field label="Payment date" error={errors['payment.paid_at']}>
                                    <Input
                                        type="date"
                                        value={data.payment.paid_at}
                                        onChange={(e) => setData('payment', { ...data.payment, paid_at: e.target.value })}
                                    />
                                </Field>
                                <Field label="Payment notes" error={errors['payment.notes']} className="md:col-span-2 xl:col-span-3">
                                    <Textarea
                                        rows={2}
                                        value={data.payment.notes}
                                        onChange={(e) => setData('payment', { ...data.payment, notes: e.target.value })}
                                    />
                                </Field>
                                <div className="md:col-span-2 xl:col-span-4">
                                    <PaymentProofField
                                        file={data.payment.receipt}
                                        error={errors['payment.receipt']}
                                        onChange={(receipt) => setData('payment', { ...data.payment, receipt })}
                                    />
                                </div>
                            </div>
                        </section>
                    )}

                    <div className="flex justify-end gap-2.5">
                        <Button type="button" variant="outline" className="h-10 rounded-lg" asChild>
                            <Link href="/clients">Cancel</Link>
                        </Button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex h-10 items-center rounded-lg bg-[#12141D] px-5 text-sm font-medium text-white transition-colors hover:bg-black disabled:opacity-70"
                        >
                            {processing ? 'Creating…' : 'Create client'}
                        </button>
                    </div>
                </form>
            </AppLayout>
        </>
    );
}

function Field({
    label,
    error,
    children,
    className,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={className ? `space-y-1.5 ${className}` : 'space-y-1.5'}>
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
