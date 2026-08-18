import React from 'react';
import { Badge } from '@/components/ui/badge';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'destructive' | 'warning' | 'info' | 'outline' }> = {
    new:        { label: 'New',        variant: 'info' },
    reviewed:   { label: 'Lead Reviewed', variant: 'warning' },
    contacted:  { label: 'Contacted',  variant: 'default' },
    'follow-up':{ label: 'Follow-up',  variant: 'warning' },
    quote_sent: { label: 'Quote Sent', variant: 'secondary' },
    won:        { label: 'Won',        variant: 'success' },
    lost:       { label: 'Lost',       variant: 'destructive' },
};

export default function LeadStatusBadge({ status }: { status: string }) {
    const cfg = statusConfig[status] ?? { label: status, variant: 'secondary' as const };
    return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
