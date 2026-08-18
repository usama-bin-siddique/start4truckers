import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, GitBranch } from 'lucide-react';

interface User { id: number; name: string; role: string }

const US_STATES = [
    'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
    'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
    'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
    'VA','WA','WV','WI','WY','DC',
];

const SERVICES = [
    'LLC', 'EIN', 'USDOT', 'MC Authority', 'BOC-3', 'UCR', 'IFTA', 'IRP', '2290', 'MCS-150',
];

export default function LeadCreate({ users }: { users: User[] }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '', phone: '', email: '', state: '',
        company: '', service_required: '', notes: '',
        source: 'manual', assigned_to: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/leads');
    }

    return (
        <>
            <Head title="New Lead" />
            <AppLayout title="New Lead">
                <form onSubmit={handleSubmit} className="space-y-6">

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <Link href="/leads" className="mb-3 inline-flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-gray-700">
                                <ChevronLeft size={14} /> Back to leads
                            </Link>
                            <div className="mt-3">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold tracking-[0.12em] text-amber-600">
                                    <GitBranch className="h-3 w-3" />
                                    PIPELINE
                                </span>
                            </div>
                            <h2 className="mt-3 text-[32px] leading-none font-semibold tracking-tight text-gray-950">
                                New lead
                            </h2>
                            <p className="mt-2 text-sm text-gray-500">
                                Capture inbound interest and assign it to the pipeline.
                            </p>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <Link
                                href="/leads"
                                className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center rounded-lg bg-[#12141D] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black disabled:opacity-70"
                            >
                                {processing ? 'Creating…' : 'Create lead'}
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
                        </div>
                    </section>

                    <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm sm:p-8">
                        <h3 className="text-base font-semibold text-gray-950">Business</h3>
                        <p className="mt-1 text-sm text-gray-400">Company details and the service they need.</p>
                        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                            <Field label="Company" error={errors.company} className="xl:col-span-2">
                                <Input placeholder="Trucking Co. LLC" value={data.company} onChange={(e) => setData('company', e.target.value)} />
                            </Field>
                            <Field label="State" error={errors.state}>
                                <Select value={data.state} onValueChange={(v) => setData('state', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                                    <SelectContent>
                                        {US_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </Field>
                            <Field label="Service required" error={errors.service_required}>
                                <Select value={data.service_required} onValueChange={(v) => setData('service_required', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                                    <SelectContent>
                                        {SERVICES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </Field>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm sm:p-8">
                        <h3 className="text-base font-semibold text-gray-950">Pipeline</h3>
                        <p className="mt-1 text-sm text-gray-400">Source, assignment, and extra context.</p>
                        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                            <Field label="Source" error={errors.source}>
                                <Select value={data.source} onValueChange={(v) => setData('source', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="manual">Manual Entry</SelectItem>
                                        <SelectItem value="website">Website</SelectItem>
                                        <SelectItem value="referral">Referral</SelectItem>
                                        <SelectItem value="phone">Phone Call</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </Field>
                            <Field label="Assign to" error={errors.assigned_to}>
                                <Select value={data.assigned_to} onValueChange={(v) => setData('assigned_to', v)}>
                                    <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">Unassigned</SelectItem>
                                        {users.filter((u) => ['admin', 'sales'].includes(u.role)).map((u) => (
                                            <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Field>
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

                    <div className="flex justify-end gap-2.5">
                        <Button type="button" variant="outline" className="h-10 rounded-lg" asChild>
                            <Link href="/leads">Cancel</Link>
                        </Button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex h-10 items-center rounded-lg bg-[#12141D] px-5 text-sm font-medium text-white transition-colors hover:bg-black disabled:opacity-70"
                        >
                            {processing ? 'Creating…' : 'Create lead'}
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
