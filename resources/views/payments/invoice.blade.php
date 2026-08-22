<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Invoice {{ $payment->id }} — {{ $client->client_number }}</title>
    <link rel="icon" type="image/png" href="{{ asset('images/logo.png') }}">
    <style>
        :root {
            --ink: #12141D;
            --muted: #6b7280;
            --line: #e5e7eb;
            --gold: #C4A035;
        }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            color: var(--ink);
            font-family: Inter, ui-sans-serif, system-ui, sans-serif;
            background: #f3f4f6;
        }
        .toolbar {
            position: sticky;
            top: 0;
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            padding: 12px 16px;
            background: #fff;
            border-bottom: 1px solid var(--line);
        }
        .toolbar button, .toolbar a {
            appearance: none;
            border: 1px solid var(--line);
            background: #fff;
            color: var(--ink);
            border-radius: 8px;
            padding: 8px 14px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
        }
        .toolbar .print {
            background: var(--ink);
            color: #fff;
            border-color: var(--ink);
        }
        .sheet {
            width: 800px;
            max-width: calc(100% - 32px);
            margin: 24px auto 48px;
            background: #fff;
            padding: 40px 48px;
            border: 1px solid var(--line);
            box-shadow: 0 10px 30px rgba(18, 20, 29, 0.06);
        }
        .eyebrow {
            font-size: 11px;
            letter-spacing: 0.16em;
            font-weight: 700;
            color: var(--gold);
            text-transform: uppercase;
        }
        h1 {
            margin: 8px 0 0;
            font-size: 28px;
            letter-spacing: -0.03em;
        }
        .top {
            display: flex;
            justify-content: space-between;
            gap: 24px;
            padding-bottom: 24px;
            border-bottom: 2px solid var(--ink);
        }
        .meta { text-align: right; font-size: 13px; color: var(--muted); line-height: 1.6; }
        .meta strong { color: var(--ink); }
        .parties {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin: 28px 0;
        }
        .label { font-size: 11px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 8px; }
        .party { font-size: 14px; line-height: 1.55; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th {
            text-align: left;
            font-size: 11px;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: var(--muted);
            padding: 10px 0;
            border-bottom: 1px solid var(--line);
        }
        td { padding: 14px 0; border-bottom: 1px solid var(--line); font-size: 14px; }
        td.num, th.num { text-align: right; }
        .totals { width: 280px; margin-left: auto; margin-top: 16px; }
        .totals tr td { border: 0; padding: 6px 0; }
        .totals .grand td { font-weight: 700; font-size: 16px; padding-top: 12px; border-top: 2px solid var(--ink); }
        .notes { margin-top: 28px; font-size: 13px; color: var(--muted); }
        .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid var(--line); font-size: 12px; color: var(--muted); }
        @media print {
            body { background: #fff; }
            .toolbar { display: none; }
            .sheet { width: auto; max-width: none; margin: 0; border: 0; box-shadow: none; padding: 0; }
        }
    </style>
</head>
<body>
    <div class="toolbar">
        <a href="{{ url()->previous() }}">Back</a>
        <button class="print" type="button" onclick="window.print()">Print invoice</button>
    </div>

    <article class="sheet">
        <div class="top">
            <div>
                <img src="{{ asset('images/logo.png') }}" alt="{{ $company['name'] ?: 'Start4Truckers' }}" style="height:88px;width:auto;display:block;background:#12141D;border-radius:8px;">
                <div class="eyebrow" style="margin-top:14px">Invoice</div>
                <h1>{{ $company['name'] ?: 'Start4Truckers' }}</h1>
                <div class="party" style="margin-top:8px;color:var(--muted)">
                    @if($company['email']) {{ $company['email'] }}<br> @endif
                    @if($company['phone']) {{ $company['phone'] }} @endif
                </div>
            </div>
            <div class="meta">
                <div><strong>Invoice #</strong> INV-{{ str_pad((string) $payment->id, 5, '0', STR_PAD_LEFT) }}</div>
                <div><strong>Date</strong> {{ optional($payment->paid_at ?? $payment->created_at)->format('M j, Y') }}</div>
                <div><strong>Client #</strong> {{ $client->client_number }}</div>
            </div>
        </div>

        <div class="parties">
            <div>
                <div class="label">Bill to</div>
                <div class="party">
                    <strong>{{ $client->display_name }}</strong><br>
                    @if($client->company) {{ $client->company }}<br> @endif
                    @if($client->email) {{ $client->email }}<br> @endif
                    @if($client->phone) {{ $client->phone }}<br> @endif
                    @if($client->state) {{ $client->state }} @endif
                </div>
            </div>
            <div>
                <div class="label">Payment details</div>
                <div class="party">
                    Method: {{ $method_label ?: '—' }}<br>
                    Reference: {{ $payment->transaction_reference ?: '—' }}<br>
                    Recorded by: {{ $payment->createdBy?->name ?: '—' }}
                </div>
            </div>
        </div>

        <table>
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
            This invoice is generated from existing payment record #{{ $payment->id }}. Thank you for your business.
        </div>
    </article>
</body>
</html>
