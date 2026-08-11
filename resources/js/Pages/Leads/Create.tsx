import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft } from 'lucide-react';

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
                <div className="max-w-2xl mx-auto space-y-4">

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Link href="/leads" className="hover:text-blue-600 flex items-center gap-1">
                            <ChevronLeft size={14} /> Leads
                        </Link>
                        <span>/</span>
                        <span className="text-gray-700 font-medium">New Lead</span>
                    </div>

                    <Card>
                        <CardHeader><CardTitle>Lead Information</CardTitle></CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                                    <Field label="Full Name *" error={errors.name}>
                                        <Input placeholder="John Doe" value={data.name}
                                            onChange={e => setData('name', e.target.value)} />
                                    </Field>

                                    <Field label="Phone" error={errors.phone}>
                                        <Input placeholder="+1 (555) 000-0000" value={data.phone}
                                            onChange={e => setData('phone', e.target.value)} />
                                    </Field>

                                    <Field label="Email" error={errors.email}>
                                        <Input type="email" placeholder="john@example.com" value={data.email}
                                            onChange={e => setData('email', e.target.value)} />
                                    </Field>

                                    <Field label="State" error={errors.state}>
                                        <Select value={data.state} onValueChange={v => setData('state', v)}>
                                            <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                                            <SelectContent>
                                                {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </Field>

                                    <Field label="Company" error={errors.company}>
                                        <Input placeholder="Trucking Co. LLC" value={data.company}
                                            onChange={e => setData('company', e.target.value)} />
                                    </Field>

                                    <Field label="Service Required" error={errors.service_required}>
                                        <Select value={data.service_required} onValueChange={v => setData('service_required', v)}>
                                            <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                                            <SelectContent>
                                                {SERVICES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </Field>

                                    <Field label="Source" error={errors.source}>
                                        <Select value={data.source} onValueChange={v => setData('source', v)}>
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

                                    <Field label="Assign To" error={errors.assigned_to}>
                                        <Select value={data.assigned_to} onValueChange={v => setData('assigned_to', v)}>
                                            <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="">Unassigned</SelectItem>
                                                {users.filter(u => ['admin','sales'].includes(u.role)).map(u => (
                                                    <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </Field>

                                </div>

                                <Field label="Notes" error={errors.notes}>
                                    <Textarea rows={3} placeholder="Any additional notes…"
                                        value={data.notes}
                                        onChange={e => setData('notes', e.target.value)} />
                                </Field>

                                <div className="flex justify-end gap-2 pt-2">
                                    <Button type="button" variant="outline" asChild>
                                        <Link href="/leads">Cancel</Link>
                                    </Button>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Creating…' : 'Create Lead'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        </>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <Label className="text-sm">{label}</Label>
            {children}
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}
