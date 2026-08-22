import React, { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Truck } from 'lucide-react';

export interface ProfileOptions {
    statuses: Record<string, string>;
    compliance_types?: Record<string, string>;
    contact_methods: Record<string, string>;
    citizenship_statuses: Record<string, string>;
    entity_types: Record<string, string>;
    authority_statuses: Record<string, string>;
    account_statuses: Record<string, string>;
    truck_types: Record<string, string>;
    eld_statuses: Record<string, string>;
    us_states: string[];
}

export interface Vehicle {
    id: number;
    truck_type: string | null;
    vin: string | null;
    year: number | null;
    make: string | null;
    model: string | null;
    gvwr: string | null;
    license_plate: string | null;
    plate_state: string | null;
    title_number: string | null;
    purchase_date: string | null;
    form_2290_status: string | null;
    eld_provider: string | null;
    eld_status: string | null;
    notes: string | null;
}

interface ProfileClient {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    state: string | null;
    address: string | null;
    ssn: string | null;
    ssn_masked: string | null;
    date_of_birth: string | null;
    citizenship_status: string | null;
    dl_number: string | null;
    dl_state: string | null;
    dl_expiration: string | null;
    preferred_contact_method: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    emergency_contact_relation: string | null;
    company: string | null;
    business_phone: string | null;
    business_email: string | null;
    company_address: string | null;
    entity_type: string | null;
    state_of_formation: string | null;
    llc_formed_at: string | null;
    registered_agent: string | null;
    mailing_address: string | null;
    ein: string | null;
    usdot_number: string | null;
    usdot_status: string | null;
    mc_number: string | null;
    mc_status: string | null;
    fmcsa_authority_type: string | null;
    ff_number: string | null;
    ucr_number: string | null;
    ucr_status: string | null;
    boc3_status: string | null;
    insurance_status: string | null;
    insurance_company: string | null;
    insurance_policy_number: string | null;
    insurance_expires_at: string | null;
    operating_authority_status: string | null;
    mcs150_status: string | null;
    mcs150_due_at: string | null;
    ucr_due_at: string | null;
    ifta_status: string | null;
    ifta_due_at: string | null;
    irp_status: string | null;
    irp_due_at: string | null;
    form_2290_status: string | null;
    form_2290_due_at: string | null;
    annual_updates_status: string | null;
    compliance_type?: 'project' | 'monthly' | null;
    monthly_compliance_started_at?: string | null;
    compliance_package: string | null;
    next_compliance_due_at: string | null;
    last_compliance_completed_at: string | null;
    overall_compliance_status: string | null;
    next_action: string | null;
    next_action_due_at: string | null;
    login_gov_email: string | null;
    motus_account_email: string | null;
    fmcsa_account_email: string | null;
    portal_username: string | null;
    account_status: string | null;
    account_last_verified_at: string | null;
    vehicles: Vehicle[];
}

function val(value: string | null | undefined): string {
    return value ?? '';
}

function optionLabel(map: Record<string, string>, key: string | null | undefined): string {
    if (!key) return '—';
    return map[key] ?? key;
}

export function Field({
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

export function OptionSelect({
    value,
    onChange,
    options,
    placeholder = 'Select',
    allowEmpty = true,
}: {
    value: string;
    onChange: (value: string) => void;
    options: Record<string, string> | string[];
    placeholder?: string;
    allowEmpty?: boolean;
}) {
    const entries = Array.isArray(options) ? options.map((v) => [v, v] as const) : Object.entries(options);

    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
            <SelectContent>
                {allowEmpty && <SelectItem value="">Not set</SelectItem>}
                {entries.map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

function Display({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div>
            <p className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">{label}</p>
            <p className="mt-0.5 whitespace-pre-wrap text-sm text-gray-900">{value || '—'}</p>
        </div>
    );
}

export function ProfileTab({
    client,
    options,
    canEdit,
}: {
    client: ProfileClient;
    options: ProfileOptions;
    canEdit: boolean;
}) {
    const [open, setOpen] = useState(false);
    const form = useForm({
        name: val(client.name),
        email: val(client.email),
        phone: val(client.phone),
        address: val(client.address),
        ssn: val(client.ssn),
        date_of_birth: val(client.date_of_birth),
        citizenship_status: val(client.citizenship_status),
        dl_number: val(client.dl_number),
        dl_state: val(client.dl_state),
        dl_expiration: val(client.dl_expiration),
        preferred_contact_method: val(client.preferred_contact_method),
        emergency_contact_name: val(client.emergency_contact_name),
        emergency_contact_phone: val(client.emergency_contact_phone),
        emergency_contact_relation: val(client.emergency_contact_relation),
        company: val(client.company),
        business_phone: val(client.business_phone),
        business_email: val(client.business_email),
        company_address: val(client.company_address),
        entity_type: val(client.entity_type),
        state_of_formation: val(client.state_of_formation),
        llc_formed_at: val(client.llc_formed_at),
        registered_agent: val(client.registered_agent),
        mailing_address: val(client.mailing_address),
        ein: val(client.ein),
        usdot_number: val(client.usdot_number),
        usdot_status: val(client.usdot_status),
        mc_number: val(client.mc_number),
        mc_status: val(client.mc_status),
        fmcsa_authority_type: val(client.fmcsa_authority_type),
        ff_number: val(client.ff_number),
        ucr_number: val(client.ucr_number),
        ucr_status: val(client.ucr_status),
        boc3_status: val(client.boc3_status),
        insurance_status: val(client.insurance_status),
        insurance_company: val(client.insurance_company),
        insurance_policy_number: val(client.insurance_policy_number),
        insurance_expires_at: val(client.insurance_expires_at),
        operating_authority_status: val(client.operating_authority_status),
        login_gov_email: val(client.login_gov_email),
        motus_account_email: val(client.motus_account_email),
        fmcsa_account_email: val(client.fmcsa_account_email),
        portal_username: val(client.portal_username),
        account_status: val(client.account_status),
        account_last_verified_at: val(client.account_last_verified_at),
        state: val(client.state),
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.put(`/clients/${client.id}`, { preserveScroll: true, onSuccess: () => setOpen(false) });
    }

    return (
        <div className="space-y-4">
            {canEdit && (
                <div className="flex justify-end">
                    <Button type="button" onClick={() => setOpen(true)} className="bg-[#12141D] hover:bg-black">Edit profile</Button>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
                    <h3 className="text-base font-semibold text-gray-950">Personal / Owner Information</h3>
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Display label="Full Name" value={client.name} />
                        <Display label="Email" value={client.email} />
                        <Display label="Phone" value={client.phone} />
                        <Display label="Address" value={client.address} />
                        <Display label="SSN #" value={client.ssn_masked} />
                        <Display label="Date of Birth" value={client.date_of_birth} />
                        <Display label="Citizenship / Residency Status" value={optionLabel(options.citizenship_statuses, client.citizenship_status)} />
                        <Display label="Driver License #" value={client.dl_number} />
                        <Display label="Driver License State" value={client.dl_state} />
                        <Display label="Driver License Expiration" value={client.dl_expiration} />
                        <Display label="Preferred Contact Method" value={optionLabel(options.contact_methods, client.preferred_contact_method)} />
                        <Display label="Emergency Contact" value={[client.emergency_contact_name, client.emergency_contact_phone, client.emergency_contact_relation].filter(Boolean).join(' · ')} />
                    </div>
                </section>

                <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
                    <h3 className="text-base font-semibold text-gray-950">Company Information</h3>
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Display label="Company Name" value={client.company} />
                        <Display label="Business Phone" value={client.business_phone} />
                        <Display label="Business Email" value={client.business_email} />
                        <Display label="Company Address" value={client.company_address} />
                        <Display label="LLC / Entity Type" value={optionLabel(options.entity_types, client.entity_type)} />
                        <Display label="State of Formation" value={client.state_of_formation} />
                        <Display label="Date LLC Formed" value={client.llc_formed_at} />
                        <Display label="Registered Agent" value={client.registered_agent} />
                        <Display label="Business Mailing Address" value={client.mailing_address} />
                        <Display label="EIN #" value={client.ein} />
                        <Display label="USDOT #" value={client.usdot_number} />
                        <Display label="USDOT Status" value={optionLabel(options.authority_statuses, client.usdot_status)} />
                        <Display label="MC #" value={client.mc_number} />
                        <Display label="MC Status" value={optionLabel(options.authority_statuses, client.mc_status)} />
                        <Display label="FMCSA Authority Type" value={client.fmcsa_authority_type} />
                        <Display label="FF # / Freight Forwarder #" value={client.ff_number} />
                        <Display label="UCR #" value={client.ucr_number} />
                        <Display label="UCR Status" value={optionLabel(options.authority_statuses, client.ucr_status)} />
                        <Display label="BOC-3 Status" value={optionLabel(options.authority_statuses, client.boc3_status)} />
                        <Display label="Insurance Status" value={optionLabel(options.authority_statuses, client.insurance_status)} />
                        <Display label="Insurance Company" value={client.insurance_company} />
                        <Display label="Insurance Policy #" value={client.insurance_policy_number} />
                        <Display label="Insurance Expiration" value={client.insurance_expires_at} />
                        <Display label="Operating Authority Status" value={optionLabel(options.authority_statuses, client.operating_authority_status)} />
                    </div>
                </section>

                <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm lg:col-span-2">
                    <h3 className="text-base font-semibold text-gray-950">Account / Login Information</h3>
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <Display label="Login.gov Email" value={client.login_gov_email} />
                        <Display label="Motus Account Email" value={client.motus_account_email} />
                        <Display label="FMCSA Account Email" value={client.fmcsa_account_email} />
                        <Display label="Portal Username" value={client.portal_username} />
                        <Display label="Account Status" value={optionLabel(options.account_statuses, client.account_status)} />
                        <Display label="Last Verified" value={client.account_last_verified_at} />
                    </div>
                </section>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
                    <DialogHeader><DialogTitle>Edit client profile</DialogTitle></DialogHeader>
                    <form onSubmit={submit} className="space-y-6">
                        <section>
                            <h4 className="mb-3 text-sm font-semibold text-gray-900">Personal / Owner</h4>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <Field label="Full Name" error={form.errors.name}><Input value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} /></Field>
                                <Field label="Email" error={form.errors.email}><Input type="email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} /></Field>
                                <Field label="Phone" error={form.errors.phone}><Input value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} /></Field>
                                <Field label="Preferred Contact" error={form.errors.preferred_contact_method}>
                                    <OptionSelect value={form.data.preferred_contact_method} onChange={(v) => form.setData('preferred_contact_method', v)} options={options.contact_methods} />
                                </Field>
                                <Field label="Address" error={form.errors.address} className="sm:col-span-2"><Textarea rows={2} value={form.data.address} onChange={(e) => form.setData('address', e.target.value)} /></Field>
                                <Field label="SSN #" error={form.errors.ssn}><Input value={form.data.ssn} onChange={(e) => form.setData('ssn', e.target.value)} placeholder={client.ssn_masked ?? ''} /></Field>
                                <Field label="Date of Birth" error={form.errors.date_of_birth}><Input type="date" value={form.data.date_of_birth} onChange={(e) => form.setData('date_of_birth', e.target.value)} /></Field>
                                <Field label="Citizenship / Residency" error={form.errors.citizenship_status}>
                                    <OptionSelect value={form.data.citizenship_status} onChange={(v) => form.setData('citizenship_status', v)} options={options.citizenship_statuses} />
                                </Field>
                                <Field label="Driver License #" error={form.errors.dl_number}><Input value={form.data.dl_number} onChange={(e) => form.setData('dl_number', e.target.value)} /></Field>
                                <Field label="DL State" error={form.errors.dl_state}>
                                    <OptionSelect value={form.data.dl_state} onChange={(v) => form.setData('dl_state', v)} options={options.us_states} />
                                </Field>
                                <Field label="DL Expiration" error={form.errors.dl_expiration}><Input type="date" value={form.data.dl_expiration} onChange={(e) => form.setData('dl_expiration', e.target.value)} /></Field>
                                <Field label="Emergency Contact Name" error={form.errors.emergency_contact_name}><Input value={form.data.emergency_contact_name} onChange={(e) => form.setData('emergency_contact_name', e.target.value)} /></Field>
                                <Field label="Emergency Phone" error={form.errors.emergency_contact_phone}><Input value={form.data.emergency_contact_phone} onChange={(e) => form.setData('emergency_contact_phone', e.target.value)} /></Field>
                                <Field label="Emergency Relation" error={form.errors.emergency_contact_relation}><Input value={form.data.emergency_contact_relation} onChange={(e) => form.setData('emergency_contact_relation', e.target.value)} /></Field>
                            </div>
                        </section>
                        <section>
                            <h4 className="mb-3 text-sm font-semibold text-gray-900">Company</h4>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <Field label="Company Name" error={form.errors.company}><Input value={form.data.company} onChange={(e) => form.setData('company', e.target.value)} /></Field>
                                <Field label="Entity Type" error={form.errors.entity_type}>
                                    <OptionSelect value={form.data.entity_type} onChange={(v) => form.setData('entity_type', v)} options={options.entity_types} />
                                </Field>
                                <Field label="Business Phone" error={form.errors.business_phone}><Input value={form.data.business_phone} onChange={(e) => form.setData('business_phone', e.target.value)} /></Field>
                                <Field label="Business Email" error={form.errors.business_email}><Input type="email" value={form.data.business_email} onChange={(e) => form.setData('business_email', e.target.value)} /></Field>
                                <Field label="Company Address" error={form.errors.company_address} className="sm:col-span-2"><Textarea rows={2} value={form.data.company_address} onChange={(e) => form.setData('company_address', e.target.value)} /></Field>
                                <Field label="State of Formation" error={form.errors.state_of_formation}>
                                    <OptionSelect value={form.data.state_of_formation} onChange={(v) => form.setData('state_of_formation', v)} options={options.us_states} />
                                </Field>
                                <Field label="Date LLC Formed" error={form.errors.llc_formed_at}><Input type="date" value={form.data.llc_formed_at} onChange={(e) => form.setData('llc_formed_at', e.target.value)} /></Field>
                                <Field label="Registered Agent" error={form.errors.registered_agent}><Input value={form.data.registered_agent} onChange={(e) => form.setData('registered_agent', e.target.value)} /></Field>
                                <Field label="Mailing Address" error={form.errors.mailing_address} className="sm:col-span-2"><Textarea rows={2} value={form.data.mailing_address} onChange={(e) => form.setData('mailing_address', e.target.value)} /></Field>
                                <Field label="EIN #" error={form.errors.ein}><Input value={form.data.ein} onChange={(e) => form.setData('ein', e.target.value)} /></Field>
                                <Field label="USDOT #" error={form.errors.usdot_number}><Input value={form.data.usdot_number} onChange={(e) => form.setData('usdot_number', e.target.value)} /></Field>
                                <Field label="USDOT Status" error={form.errors.usdot_status}>
                                    <OptionSelect value={form.data.usdot_status} onChange={(v) => form.setData('usdot_status', v)} options={options.authority_statuses} />
                                </Field>
                                <Field label="MC #" error={form.errors.mc_number}><Input value={form.data.mc_number} onChange={(e) => form.setData('mc_number', e.target.value)} /></Field>
                                <Field label="MC Status" error={form.errors.mc_status}>
                                    <OptionSelect value={form.data.mc_status} onChange={(v) => form.setData('mc_status', v)} options={options.authority_statuses} />
                                </Field>
                                <Field label="FMCSA Authority Type" error={form.errors.fmcsa_authority_type}><Input value={form.data.fmcsa_authority_type} onChange={(e) => form.setData('fmcsa_authority_type', e.target.value)} /></Field>
                                <Field label="FF #" error={form.errors.ff_number}><Input value={form.data.ff_number} onChange={(e) => form.setData('ff_number', e.target.value)} /></Field>
                                <Field label="UCR #" error={form.errors.ucr_number}><Input value={form.data.ucr_number} onChange={(e) => form.setData('ucr_number', e.target.value)} /></Field>
                                <Field label="UCR Status" error={form.errors.ucr_status}>
                                    <OptionSelect value={form.data.ucr_status} onChange={(v) => form.setData('ucr_status', v)} options={options.authority_statuses} />
                                </Field>
                                <Field label="BOC-3 Status" error={form.errors.boc3_status}>
                                    <OptionSelect value={form.data.boc3_status} onChange={(v) => form.setData('boc3_status', v)} options={options.authority_statuses} />
                                </Field>
                                <Field label="Insurance Status" error={form.errors.insurance_status}>
                                    <OptionSelect value={form.data.insurance_status} onChange={(v) => form.setData('insurance_status', v)} options={options.authority_statuses} />
                                </Field>
                                <Field label="Insurance Company" error={form.errors.insurance_company}><Input value={form.data.insurance_company} onChange={(e) => form.setData('insurance_company', e.target.value)} /></Field>
                                <Field label="Insurance Policy #" error={form.errors.insurance_policy_number}><Input value={form.data.insurance_policy_number} onChange={(e) => form.setData('insurance_policy_number', e.target.value)} /></Field>
                                <Field label="Insurance Expiration" error={form.errors.insurance_expires_at}><Input type="date" value={form.data.insurance_expires_at} onChange={(e) => form.setData('insurance_expires_at', e.target.value)} /></Field>
                                <Field label="Operating Authority Status" error={form.errors.operating_authority_status}>
                                    <OptionSelect value={form.data.operating_authority_status} onChange={(v) => form.setData('operating_authority_status', v)} options={options.authority_statuses} />
                                </Field>
                            </div>
                        </section>
                        <section>
                            <h4 className="mb-3 text-sm font-semibold text-gray-900">Account / Login</h4>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <Field label="Login.gov Email" error={form.errors.login_gov_email}><Input type="email" value={form.data.login_gov_email} onChange={(e) => form.setData('login_gov_email', e.target.value)} /></Field>
                                <Field label="Motus Account Email" error={form.errors.motus_account_email}><Input type="email" value={form.data.motus_account_email} onChange={(e) => form.setData('motus_account_email', e.target.value)} /></Field>
                                <Field label="FMCSA Account Email" error={form.errors.fmcsa_account_email}><Input type="email" value={form.data.fmcsa_account_email} onChange={(e) => form.setData('fmcsa_account_email', e.target.value)} /></Field>
                                <Field label="Portal Username" error={form.errors.portal_username}><Input value={form.data.portal_username} onChange={(e) => form.setData('portal_username', e.target.value)} /></Field>
                                <Field label="Account Status" error={form.errors.account_status}>
                                    <OptionSelect value={form.data.account_status} onChange={(v) => form.setData('account_status', v)} options={options.account_statuses} />
                                </Field>
                                <Field label="Last Verified" error={form.errors.account_last_verified_at}><Input type="date" value={form.data.account_last_verified_at} onChange={(e) => form.setData('account_last_verified_at', e.target.value)} /></Field>
                            </div>
                        </section>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={form.processing}>Save profile</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

const emptyVehicle = {
    truck_type: '', vin: '', year: '', make: '', model: '', gvwr: '',
    license_plate: '', plate_state: '', title_number: '', purchase_date: '',
    form_2290_status: '', eld_provider: '', eld_status: '', notes: '',
};

export function FleetTab({
    clientId,
    vehicles,
    options,
    canEdit,
}: {
    clientId: number;
    vehicles: Vehicle[];
    options: ProfileOptions;
    canEdit: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Vehicle | null>(null);
    const form = useForm(emptyVehicle);

    function openCreate() {
        form.reset();
        form.setData(emptyVehicle);
        setEditing(null);
        setOpen(true);
    }

    function openEdit(vehicle: Vehicle) {
        setEditing(vehicle);
        form.setData({
            truck_type: val(vehicle.truck_type),
            vin: val(vehicle.vin),
            year: vehicle.year ? String(vehicle.year) : '',
            make: val(vehicle.make),
            model: val(vehicle.model),
            gvwr: val(vehicle.gvwr),
            license_plate: val(vehicle.license_plate),
            plate_state: val(vehicle.plate_state),
            title_number: val(vehicle.title_number),
            purchase_date: val(vehicle.purchase_date),
            form_2290_status: val(vehicle.form_2290_status),
            eld_provider: val(vehicle.eld_provider),
            eld_status: val(vehicle.eld_status),
            notes: val(vehicle.notes),
        });
        setOpen(true);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        const url = editing
            ? `/clients/${clientId}/vehicles/${editing.id}`
            : `/clients/${clientId}/vehicles`;
        const visit = { preserveScroll: true as const, onSuccess: () => { setOpen(false); setEditing(null); form.reset(); } };
        if (editing) form.put(url, visit);
        else form.post(url, visit);
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{vehicles.length} truck{vehicles.length === 1 ? '' : 's'} on file</p>
                {canEdit && (
                    <Button type="button" onClick={openCreate} className="bg-[#12141D] hover:bg-black">
                        <Plus className="mr-1 h-4 w-4" /> Add vehicle
                    </Button>
                )}
            </div>
            <section className="rounded-2xl border border-gray-200/80 bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="px-5">Truck</TableHead>
                            <TableHead>VIN</TableHead>
                            <TableHead>Plate</TableHead>
                            <TableHead>GVWR</TableHead>
                            <TableHead>2290</TableHead>
                            <TableHead>ELD</TableHead>
                            {canEdit && <TableHead>Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {vehicles.length === 0 ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={canEdit ? 7 : 6} className="h-40 text-center text-sm text-gray-400">
                                    <Truck className="mx-auto mb-2 h-5 w-5 text-gray-300" />
                                    No trucks added yet
                                </TableCell>
                            </TableRow>
                        ) : vehicles.map((v) => (
                            <TableRow key={v.id}>
                                <TableCell className="px-5">
                                    <p className="font-medium text-gray-900">{[v.year, v.make, v.model].filter(Boolean).join(' ') || 'Vehicle'}</p>
                                    <p className="text-xs text-gray-400">{optionLabel(options.truck_types, v.truck_type)}</p>
                                </TableCell>
                                <TableCell className="font-mono text-xs">{v.vin || '—'}</TableCell>
                                <TableCell className="text-sm">{[v.license_plate, v.plate_state].filter(Boolean).join(' ') || '—'}</TableCell>
                                <TableCell className="text-sm">{v.gvwr || '—'}</TableCell>
                                <TableCell className="text-sm">{optionLabel(options.authority_statuses, v.form_2290_status)}</TableCell>
                                <TableCell className="text-sm">{v.eld_provider ? `${v.eld_provider} · ${optionLabel(options.eld_statuses, v.eld_status)}` : optionLabel(options.eld_statuses, v.eld_status)}</TableCell>
                                {canEdit && (
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <button type="button" className="text-xs font-medium text-amber-700" onClick={() => openEdit(v)}>Edit</button>
                                            <button type="button" className="text-xs font-medium text-red-600" onClick={() => router.delete(`/clients/${clientId}/vehicles/${v.id}`, { preserveScroll: true })}>Remove</button>
                                        </div>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </section>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>{editing ? 'Edit vehicle' : 'Add vehicle'}</DialogTitle></DialogHeader>
                    <form onSubmit={submit} className="grid grid-cols-2 gap-3">
                        <Field label="Truck Type" error={form.errors.truck_type} className="col-span-2">
                            <OptionSelect value={form.data.truck_type} onChange={(v) => form.setData('truck_type', v)} options={options.truck_types} />
                        </Field>
                        <Field label="Year" error={form.errors.year}><Input value={form.data.year} onChange={(e) => form.setData('year', e.target.value)} /></Field>
                        <Field label="Make" error={form.errors.make}><Input value={form.data.make} onChange={(e) => form.setData('make', e.target.value)} /></Field>
                        <Field label="Model" error={form.errors.model}><Input value={form.data.model} onChange={(e) => form.setData('model', e.target.value)} /></Field>
                        <Field label="VIN" error={form.errors.vin}><Input value={form.data.vin} onChange={(e) => form.setData('vin', e.target.value)} /></Field>
                        <Field label="GVWR" error={form.errors.gvwr}><Input value={form.data.gvwr} onChange={(e) => form.setData('gvwr', e.target.value)} /></Field>
                        <Field label="License Plate #" error={form.errors.license_plate}><Input value={form.data.license_plate} onChange={(e) => form.setData('license_plate', e.target.value)} /></Field>
                        <Field label="Plate State" error={form.errors.plate_state}>
                            <OptionSelect value={form.data.plate_state} onChange={(v) => form.setData('plate_state', v)} options={options.us_states} />
                        </Field>
                        <Field label="Truck Title #" error={form.errors.title_number}><Input value={form.data.title_number} onChange={(e) => form.setData('title_number', e.target.value)} /></Field>
                        <Field label="Purchase Date" error={form.errors.purchase_date}><Input type="date" value={form.data.purchase_date} onChange={(e) => form.setData('purchase_date', e.target.value)} /></Field>
                        <Field label="2290 Status" error={form.errors.form_2290_status}>
                            <OptionSelect value={form.data.form_2290_status} onChange={(v) => form.setData('form_2290_status', v)} options={options.authority_statuses} />
                        </Field>
                        <Field label="ELD Provider" error={form.errors.eld_provider}><Input value={form.data.eld_provider} onChange={(e) => form.setData('eld_provider', e.target.value)} /></Field>
                        <Field label="ELD Status" error={form.errors.eld_status}>
                            <OptionSelect value={form.data.eld_status} onChange={(v) => form.setData('eld_status', v)} options={options.eld_statuses} />
                        </Field>
                        <Field label="Notes" error={form.errors.notes} className="col-span-2"><Textarea rows={2} value={form.data.notes} onChange={(e) => form.setData('notes', e.target.value)} /></Field>
                        <DialogFooter className="col-span-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={form.processing}>{editing ? 'Save vehicle' : 'Add vehicle'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export function ComplianceTab({
    client,
    options,
    canEdit,
    tasks = [],
}: {
    client: ProfileClient;
    options: ProfileOptions;
    canEdit: boolean;
    tasks?: { id: number; title: string; description: string | null; status: string; kind: string | null; due_date: string | null; is_overdue: boolean }[];
}) {
    const [open, setOpen] = useState(false);
    const form = useForm({
        mcs150_status: val(client.mcs150_status),
        mcs150_due_at: val(client.mcs150_due_at),
        ucr_status: val(client.ucr_status),
        ucr_due_at: val(client.ucr_due_at),
        boc3_status: val(client.boc3_status),
        ifta_status: val(client.ifta_status),
        ifta_due_at: val(client.ifta_due_at),
        irp_status: val(client.irp_status),
        irp_due_at: val(client.irp_due_at),
        form_2290_status: val(client.form_2290_status),
        form_2290_due_at: val(client.form_2290_due_at),
        insurance_status: val(client.insurance_status),
        insurance_expires_at: val(client.insurance_expires_at),
        annual_updates_status: val(client.annual_updates_status),
        compliance_package: val(client.compliance_package),
        next_compliance_due_at: val(client.next_compliance_due_at),
        last_compliance_completed_at: val(client.last_compliance_completed_at),
        overall_compliance_status: val(client.overall_compliance_status),
        next_action: val(client.next_action),
        next_action_due_at: val(client.next_action_due_at),
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.put(`/clients/${client.id}`, { preserveScroll: true, onSuccess: () => setOpen(false) });
    }

    const typeLabel = options.compliance_types?.[client.compliance_type ?? '']
        ?? (client.compliance_type === 'monthly' ? 'Monthly' : client.compliance_type === 'project' ? 'One-Time' : 'Not set');
    const openMonthlyTasks = tasks.filter((t) => t.kind === 'monthly_compliance' && t.status !== 'completed');

    return (
        <div className="space-y-4">
            {canEdit && (
                <div className="flex justify-end">
                    <Button type="button" onClick={() => setOpen(true)} className="bg-[#12141D] hover:bg-black">Edit compliance</Button>
                </div>
            )}
            <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Display label="Compliance Type" value={typeLabel} />
                    <Display label="Monthly Compliance Started" value={client.monthly_compliance_started_at} />
                    <Display label="MCS-150 Status" value={optionLabel(options.authority_statuses, client.mcs150_status)} />
                    <Display label="MCS-150 Due Date" value={client.mcs150_due_at} />
                    <Display label="UCR Status" value={optionLabel(options.authority_statuses, client.ucr_status)} />
                    <Display label="UCR Due Date" value={client.ucr_due_at} />
                    <Display label="BOC-3 Status" value={optionLabel(options.authority_statuses, client.boc3_status)} />
                    <Display label="IFTA Status" value={optionLabel(options.authority_statuses, client.ifta_status)} />
                    <Display label="IFTA Due Date" value={client.ifta_due_at} />
                    <Display label="IRP Status" value={optionLabel(options.authority_statuses, client.irp_status)} />
                    <Display label="IRP Due Date" value={client.irp_due_at} />
                    <Display label="2290 Status" value={optionLabel(options.authority_statuses, client.form_2290_status)} />
                    <Display label="2290 Due Date" value={client.form_2290_due_at} />
                    <Display label="Insurance Status" value={optionLabel(options.authority_statuses, client.insurance_status)} />
                    <Display label="Insurance Expiration" value={client.insurance_expires_at} />
                    <Display label="Annual Updates Status" value={optionLabel(options.authority_statuses, client.annual_updates_status)} />
                    <Display label="Compliance Package" value={client.compliance_package} />
                    <Display label="Next Compliance Due Date" value={client.next_compliance_due_at} />
                    <Display label="Last Compliance Completed" value={client.last_compliance_completed_at} />
                    <Display label="Overall Compliance Status" value={optionLabel(options.authority_statuses, client.overall_compliance_status)} />
                    <Display label="Next Action" value={client.next_action} />
                    <Display label="Next Due Date" value={client.next_action_due_at} />
                </div>
            </section>

            {client.compliance_type === 'monthly' && (
                <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
                    <h3 className="text-base font-semibold text-gray-950">Monthly compliance cycle</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        The next reminder is created automatically when this task is completed. Assigned users and admins are notified.
                    </p>
                    {openMonthlyTasks.length === 0 ? (
                        <p className="mt-4 text-sm text-gray-400">No open monthly compliance task.</p>
                    ) : openMonthlyTasks.map((t) => (
                        <div key={t.id} className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3">
                            <div>
                                <p className="text-sm font-medium text-gray-900">{t.title}</p>
                                {t.due_date && (
                                    <p className={t.is_overdue ? 'mt-0.5 text-xs text-red-600' : 'mt-0.5 text-xs text-gray-500'}>
                                        Due {t.due_date.replace('T', ' ')}{t.is_overdue ? ' · Overdue' : ''}
                                    </p>
                                )}
                            </div>
                            <Button type="button" size="sm" className="bg-[#12141D] hover:bg-black" onClick={() => router.patch(`/tasks/${t.id}/complete`)}>
                                Mark complete
                            </Button>
                        </div>
                    ))}
                </section>
            )}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                    <DialogHeader><DialogTitle>Edit compliance</DialogTitle></DialogHeader>
                    <form onSubmit={submit} className="grid grid-cols-2 gap-3">
                        <Field label="MCS-150 Status"><OptionSelect value={form.data.mcs150_status} onChange={(v) => form.setData('mcs150_status', v)} options={options.authority_statuses} /></Field>
                        <Field label="MCS-150 Due Date"><Input type="date" value={form.data.mcs150_due_at} onChange={(e) => form.setData('mcs150_due_at', e.target.value)} /></Field>
                        <Field label="UCR Status"><OptionSelect value={form.data.ucr_status} onChange={(v) => form.setData('ucr_status', v)} options={options.authority_statuses} /></Field>
                        <Field label="UCR Due Date"><Input type="date" value={form.data.ucr_due_at} onChange={(e) => form.setData('ucr_due_at', e.target.value)} /></Field>
                        <Field label="BOC-3 Status"><OptionSelect value={form.data.boc3_status} onChange={(v) => form.setData('boc3_status', v)} options={options.authority_statuses} /></Field>
                        <Field label="IFTA Status"><OptionSelect value={form.data.ifta_status} onChange={(v) => form.setData('ifta_status', v)} options={options.authority_statuses} /></Field>
                        <Field label="IFTA Due Date"><Input type="date" value={form.data.ifta_due_at} onChange={(e) => form.setData('ifta_due_at', e.target.value)} /></Field>
                        <Field label="IRP Status"><OptionSelect value={form.data.irp_status} onChange={(v) => form.setData('irp_status', v)} options={options.authority_statuses} /></Field>
                        <Field label="IRP Due Date"><Input type="date" value={form.data.irp_due_at} onChange={(e) => form.setData('irp_due_at', e.target.value)} /></Field>
                        <Field label="2290 Status"><OptionSelect value={form.data.form_2290_status} onChange={(v) => form.setData('form_2290_status', v)} options={options.authority_statuses} /></Field>
                        <Field label="2290 Due Date"><Input type="date" value={form.data.form_2290_due_at} onChange={(e) => form.setData('form_2290_due_at', e.target.value)} /></Field>
                        <Field label="Insurance Status"><OptionSelect value={form.data.insurance_status} onChange={(v) => form.setData('insurance_status', v)} options={options.authority_statuses} /></Field>
                        <Field label="Insurance Expiration"><Input type="date" value={form.data.insurance_expires_at} onChange={(e) => form.setData('insurance_expires_at', e.target.value)} /></Field>
                        <Field label="Annual Updates"><OptionSelect value={form.data.annual_updates_status} onChange={(v) => form.setData('annual_updates_status', v)} options={options.authority_statuses} /></Field>
                        <Field label="Compliance Package"><Input value={form.data.compliance_package} onChange={(e) => form.setData('compliance_package', e.target.value)} /></Field>
                        <Field label="Next Compliance Due"><Input type="date" value={form.data.next_compliance_due_at} onChange={(e) => form.setData('next_compliance_due_at', e.target.value)} /></Field>
                        <Field label="Last Compliance Completed"><Input type="date" value={form.data.last_compliance_completed_at} onChange={(e) => form.setData('last_compliance_completed_at', e.target.value)} /></Field>
                        <Field label="Overall Compliance Status" className="col-span-2"><OptionSelect value={form.data.overall_compliance_status} onChange={(v) => form.setData('overall_compliance_status', v)} options={options.authority_statuses} /></Field>
                        <Field label="Next Action"><Input value={form.data.next_action} onChange={(e) => form.setData('next_action', e.target.value)} /></Field>
                        <Field label="Next Due Date"><Input type="date" value={form.data.next_action_due_at} onChange={(e) => form.setData('next_action_due_at', e.target.value)} /></Field>
                        <DialogFooter className="col-span-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={form.processing}>Save compliance</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
