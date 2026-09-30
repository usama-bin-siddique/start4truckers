import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import EmailComposer, { EmailTemplate } from '@/components/EmailComposer';

interface Client { id: number; client_number: string; name: string; email: string | null; company: string | null }

interface Props {
    client: Client;
    templates: EmailTemplate[];
    auth: { user: { name: string } };
}

export default function ClientEmail({ client, templates }: Props) {
    const { auth } = usePage<Props>().props;

    return (
        <>
            <Head title={`Email ${client.name}`} />
            <AppLayout title="Send Email">
                <EmailComposer
                    title={`Email ${client.name}`}
                    recipient={client.email}
                    postUrl={`/clients/${client.id}/email`}
                    backHref="/clients"
                    backLabel="Back to clients"
                    templates={templates}
                    placeholders={{
                        client_name: client.name,
                        company: client.company ?? '',
                        user_name: auth.user.name,
                    }}
                    missingRecipientMessage="This client has no email address. Add one on the client profile before sending."
                />
            </AppLayout>
        </>
    );
}
