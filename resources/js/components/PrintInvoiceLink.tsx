import React from 'react';
import { Printer } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PrintInvoiceLink({
    paymentId,
    compact = false,
    className,
}: {
    paymentId: number;
    compact?: boolean;
    className?: string;
}) {
    return (
        <a
            href={`/payments/${paymentId}/invoice`}
            target="_blank"
            rel="noreferrer"
            title="Print invoice"
            className={cn(
                'inline-flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-800',
                className,
            )}
        >
            <Printer className="h-3.5 w-3.5" />
            {compact ? null : 'Print invoice'}
        </a>
    );
}
