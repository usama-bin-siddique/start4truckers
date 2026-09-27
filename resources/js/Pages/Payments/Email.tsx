import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import EmailComposer, { EmailOption, EmailTemplate } from '@/components/EmailComposer';

interface Payment {
    id: number; invoice_number: string; customer_name: string; email: string | null;
    invoice_amount: number; amount_received: number; balance_due: number; has_receipt: boolean;
}

interface Props {
    payment: Payment;
    templates: EmailTemplate[];
    auth: { user: { name: string } };
}

const money = (n: number) => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PaymentEmail({ payment, templates }: Props) {
    const { auth } = usePage<Props>().props;

    const options: EmailOption[] = [
        { name: 'attach_invoice', label: `Attach invoice ${payment.invoice_number} (PDF)` },
        ...(payment.has_receipt ? [{ name: 'attach_receipt', label: 'Attach payment receipt' }] : []),
    ];

    return (
        <>
            <Head title={`Email ${payment.customer_name}`} />
            <AppLayout title="Send Email">
                <EmailComposer
                    title={`Email ${payment.customer_name}`}
                    recipient={payment.email}
                    postUrl={`/payments/${payment.id}/email`}
                    backHref="/payments"
                    backLabel="Back to payments"
                    templates={templates}
                    defaultTemplate="payment_received"
                    options={options}
                    placeholders={{
                        client_name: payment.customer_name,
                        invoice_number: payment.invoice_number,
                        invoice_amount: money(payment.invoice_amount),
                        amount_received: money(payment.amount_received),
                        balance_due: money(payment.balance_due),
                        user_name: auth.user.name,
                    }}
                    missingRecipientMessage="This client has no email address. Add one on the client profile before sending."
                />
            </AppLayout>
        </>
    );
}
