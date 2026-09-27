<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Invoice {{ $payment->invoice_number }}</title>
    <style>
        @page { margin: 36px 42px; }
        body { margin: 0; color: #12141D; font-family: DejaVu Sans, sans-serif; font-size: 12px; }
        .eyebrow { font-size: 9px; letter-spacing: 2px; font-weight: bold; color: #C4A035; text-transform: uppercase; }
        h1 { margin: 6px 0 0; font-size: 22px; }
        .muted { color: #6b7280; }
        .label { font-size: 9px; font-weight: bold; color: #6b7280; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px; }
        .layout { width: 100%; border-collapse: collapse; }
        .layout td { vertical-align: top; padding: 0; border: 0; }
        .header { border-bottom: 2px solid #12141D; padding-bottom: 18px; }
        .meta { text-align: right; line-height: 1.7; color: #6b7280; }
        .meta strong { color: #12141D; }
        .parties td { padding-top: 22px; padding-bottom: 22px; line-height: 1.55; width: 50%; }
        .items { width: 100%; border-collapse: collapse; }
        .items th { text-align: left; font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; color: #6b7280; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .items td { padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
        .num, .items th.num { text-align: right; }
        .totals { width: 260px; margin-left: auto; margin-top: 14px; border-collapse: collapse; }
        .totals td { padding: 5px 0; }
        .totals .grand td { font-weight: bold; font-size: 14px; padding-top: 10px; border-top: 2px solid #12141D; }
        .notes { margin-top: 24px; color: #6b7280; }
        .footer { margin-top: 36px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #6b7280; }
    </style>
</head>
<body>
    <table class="layout header">
        <tr>
            <td>
                <div class="eyebrow">Invoice</div>
                <h1>{{ $company['name'] ?: 'Start4Truckers' }}</h1>
                <div class="muted" style="margin-top:6px">
                    @if($company['email']) {{ $company['email'] }}<br> @endif
                    @if($company['phone']) {{ $company['phone'] }} @endif
                </div>
            </td>
            <td class="meta">
                <div><strong>Invoice #</strong> {{ $payment->invoice_number }}</div>
                <div><strong>Date</strong> {{ optional($payment->paid_at ?? $payment->created_at)->format('M j, Y') }}</div>
                <div><strong>Client #</strong> {{ $client->client_number }}</div>
            </td>
        </tr>
    </table>

    <table class="layout parties">
        <tr>
            <td>
                <div class="label">Bill to</div>
                <strong>{{ $client->display_name }}</strong><br>
                @if($client->company) {{ $client->company }}<br> @endif
                @if($client->email) {{ $client->email }}<br> @endif
                @if($client->phone) {{ $client->phone }}<br> @endif
                @if($client->state) {{ $client->state }} @endif
            </td>
            <td>
                <div class="label">Payment details</div>
                Method: {{ $method_label ?: '—' }}<br>
                Reference: {{ $payment->transaction_reference ?: '—' }}<br>
                Recorded by: {{ $payment->createdBy?->name ?: '—' }}
            </td>
        </tr>
    </table>

    <table class="items">
        <thead>
            <tr>
                <th>Description</th>
                <th class="num">Invoiced</th>
                <th class="num">Received</th>
                <th class="num">Balance</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Client services — {{ $client->client_number }}</td>
                <td class="num">${{ number_format((float) $payment->invoice_amount, 2) }}</td>
                <td class="num">${{ number_format((float) $payment->amount_received, 2) }}</td>
                <td class="num">${{ number_format((float) $payment->balance_due, 2) }}</td>
            </tr>
        </tbody>
    </table>

    <table class="totals">
        <tr>
            <td>Invoice amount</td>
            <td class="num">${{ number_format((float) $payment->invoice_amount, 2) }}</td>
        </tr>
        <tr>
            <td>Amount received</td>
            <td class="num">${{ number_format((float) $payment->amount_received, 2) }}</td>
        </tr>
        <tr class="grand">
            <td>Balance due</td>
            <td class="num">${{ number_format((float) $payment->balance_due, 2) }}</td>
        </tr>
    </table>

    @if($payment->notes)
        <div class="notes">
            <div class="label">Notes</div>
            {{ $payment->notes }}
        </div>
    @endif

    <div class="footer">
        Thank you for your business.
    </div>
</body>
</html>
