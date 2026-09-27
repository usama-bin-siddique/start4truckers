import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import EmailComposer, { EmailTemplate } from '@/components/EmailComposer';

interface Lead {
    id: number; name: string; email: string | null; phone: string | null;
    company: string | null; service_required: string | null;
}

interface Props {
    lead: Lead;
    templates: EmailTemplate[];
    auth: { user: { name: string } };
}

export default function LeadEmail({ lead, templates }: Props) {
    const { auth } = usePage<Props>().props;

    return (
        <>
            <Head title={`Email ${lead.name}`} />
            <AppLayout title="Send Email">
                <EmailComposer
                    title={`Email ${lead.name}`}
                    recipient={lead.email}
                    postUrl={`/leads/${lead.id}/email`}
                    backHref={`/leads/${lead.id}`}
                    backLabel="Back to lead"
                    templates={templates}
                    placeholders={{
                        lead_name: lead.name,
                        client_name: lead.name,
                        lead_email: lead.email ?? '',
                        lead_phone: lead.phone ?? '',
                        company: lead.company ?? '',
                        service_required: lead.service_required ?? '',
                        user_name: auth.user.name,
                    }}
                    missingRecipientMessage="This lead has no email address. Add one on the lead page before sending."
                />
            </AppLayout>
        </>
    );
}
