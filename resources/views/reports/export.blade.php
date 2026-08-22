<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>CRM Reports — {{ $filters['dateFrom'] }} to {{ $filters['dateTo'] }}</title>
    <style>
        * { box-sizing: border-box; }
        body {
            margin: 0;
            color: #12141D;
            font-family: DejaVu Sans, sans-serif;
            font-size: 11px;
        }
        h1 { margin: 0 0 4px; font-size: 20px; }
        h2 {
            margin: 18px 0 8px;
            font-size: 13px;
            color: #C4A035;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 4px;
        }
        .muted { color: #6b7280; font-size: 10px; line-height: 1.5; }
        .kpis { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
        .kpis td {
            width: 25%;
            background: #FAFAF8;
            border: 1px solid #e5e7eb;
            padding: 8px 10px;
        }
        .kpis .label { color: #6b7280; font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; }
        .kpis .value { font-size: 14px; font-weight: 700; margin-top: 3px; }
        table.data { width: 100%; border-collapse: collapse; }
        table.data th {
            background: #12141D;
            color: #fff;
            text-align: left;
            padding: 6px 8px;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
        }
        table.data td {
            border-bottom: 1px solid #e5e7eb;
            padding: 6px 8px;
        }
        table.data tr:nth-child(even) td { background: #fafafa; }
        .right { text-align: right; }
        .red { color: #dc2626; font-weight: 700; }
        .green { color: #059669; }
        .header { margin-bottom: 14px; }
        .gold { color: #C4A035; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; font-weight: 700; }
    </style>
</head>
<body>
    <div class="header">
        <div class="gold">{{ $company['name'] ?? 'Start4Truckers' }}</div>
        <h1>CRM Reports</h1>
        <div class="muted">
            Period: {{ $filters['dateFrom'] }} to {{ $filters['dateTo'] }}
            @if (!empty($filters['employeeName']))
                · Employee: {{ $filters['employeeName'] }}
            @endif
            <br>
            Generated {{ $generated_at }}
        </div>
    </div>

    <h2>Revenue</h2>
    <table class="kpis">
        <tr>
            <td><div class="label">Invoiced</div><div class="value">${{ number_format($revenue['total_invoiced'], 2) }}</div></td>
            <td><div class="label">Received</div><div class="value">${{ number_format($revenue['total_received'], 2) }}</div></td>
            <td><div class="label">Outstanding</div><div class="value">${{ number_format($revenue['total_balance'], 2) }}</div></td>
            <td><div class="label">Payments</div><div class="value">{{ $revenue['payment_count'] }}</div></td>
        </tr>
    </table>
    @if (count($revenue['daily']) > 0)
        <table class="data">
            <thead><tr><th>Date</th><th class="right">Revenue</th></tr></thead>
            <tbody>
                @foreach ($revenue['daily'] as $row)
                    <tr>
                        <td>{{ $row['date'] }}</td>
                        <td class="right">${{ number_format($row['revenue'], 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    <h2>Sales by Service</h2>
    <table class="data">
        <thead><tr><th>Service</th><th class="right">Completed</th></tr></thead>
        <tbody>
            @forelse ($sales_by_service as $row)
                <tr>
                    <td>{{ $row['service'] }}</td>
                    <td class="right">{{ $row['count'] }}</td>
                </tr>
            @empty
                <tr><td colspan="2">No completed services in this period</td></tr>
            @endforelse
        </tbody>
    </table>

    <h2>Lead Conversion</h2>
    <table class="kpis">
        <tr>
            <td><div class="label">Total leads</div><div class="value">{{ $lead_conversion['total'] }}</div></td>
            <td><div class="label">Won</div><div class="value">{{ $lead_conversion['won'] }}</div></td>
            <td><div class="label">Lost</div><div class="value">{{ $lead_conversion['lost'] }}</div></td>
            <td><div class="label">Conversion</div><div class="value">{{ $lead_conversion['rate'] }}%</div></td>
        </tr>
    </table>
    <table class="data">
        <thead><tr><th>Stage</th><th class="right">Count</th></tr></thead>
        <tbody>
            @foreach ($lead_conversion['funnel'] as $row)
                <tr>
                    <td>{{ $row['stage'] }}</td>
                    <td class="right">{{ $row['count'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
    <br>
    <table class="data">
        <thead><tr><th>Source</th><th class="right">Count</th></tr></thead>
        <tbody>
            @forelse ($lead_conversion['by_source'] as $row)
                <tr>
                    <td>{{ $row['source'] }}</td>
                    <td class="right">{{ $row['count'] }}</td>
                </tr>
            @empty
                <tr><td colspan="2">No source data</td></tr>
            @endforelse
        </tbody>
    </table>

    <h2>Outstanding Balances</h2>
    <table class="kpis">
        <tr>
            <td><div class="label">Total outstanding</div><div class="value">${{ number_format($outstanding['total_balance'], 2) }}</div></td>
            <td><div class="label">Clients with balance</div><div class="value">{{ $outstanding['client_count'] }}</div></td>
            <td></td><td></td>
        </tr>
    </table>
    <table class="data">
        <thead>
            <tr>
                <th>Client #</th>
                <th>Name</th>
                <th>Assigned</th>
                <th class="right">Invoiced</th>
                <th class="right">Received</th>
                <th class="right">Balance Due</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($outstanding['clients'] as $row)
                <tr>
                    <td>{{ $row['client_number'] }}</td>
                    <td>{{ $row['client_name'] }}</td>
                    <td>{{ $row['assigned_to'] }}</td>
                    <td class="right">${{ number_format($row['total_invoiced'], 2) }}</td>
                    <td class="right green">${{ number_format($row['total_received'], 2) }}</td>
                    <td class="right red">${{ number_format($row['balance_due'], 2) }}</td>
                </tr>
            @empty
                <tr><td colspan="6">No outstanding balances</td></tr>
            @endforelse
        </tbody>
    </table>

    <h2>Employee Performance</h2>
    <table class="data">
        <thead>
            <tr>
                <th>Employee</th>
                <th>Role</th>
                <th class="right">Leads</th>
                <th class="right">Won</th>
                <th class="right">Rate</th>
                <th class="right">Clients</th>
                <th class="right">Revenue</th>
                <th class="right">Tasks</th>
                <th class="right">Services</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($employee_perf as $row)
                <tr>
                    <td>{{ $row['name'] }}</td>
                    <td>{{ $row['role'] }}</td>
                    <td class="right">{{ $row['leads_assigned'] }}</td>
                    <td class="right">{{ $row['leads_won'] }}</td>
                    <td class="right">{{ $row['conversion_rate'] }}%</td>
                    <td class="right">{{ $row['clients_managed'] }}</td>
                    <td class="right">${{ number_format($row['revenue_generated'], 2) }}</td>
                    <td class="right">{{ $row['tasks_completed'] }}</td>
                    <td class="right">{{ $row['services_completed'] }}</td>
                </tr>
            @empty
                <tr><td colspan="9">No data</td></tr>
            @endforelse
        </tbody>
    </table>

    <h2>Monthly Trends</h2>
    <table class="data">
        <thead>
            <tr>
                <th>Month</th>
                <th class="right">Revenue</th>
                <th class="right">Leads</th>
                <th class="right">New Clients</th>
                <th class="right">Services</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($monthly_trends as $row)
                <tr>
                    <td>{{ $row['month'] }}</td>
                    <td class="right">${{ number_format($row['revenue'], 2) }}</td>
                    <td class="right">{{ $row['leads'] }}</td>
                    <td class="right">{{ $row['clients'] }}</td>
                    <td class="right">{{ $row['services'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <h2>Compliance</h2>
    <table class="kpis">
        <tr>
            <td><div class="label">One-Time</div><div class="value">{{ $compliance['one_time'] }}</div></td>
            <td><div class="label">Monthly</div><div class="value">{{ $compliance['monthly'] }}</div></td>
            <td><div class="label">Not set</div><div class="value">{{ $compliance['unset'] }}</div></td>
            <td><div class="label">Due in 7 days</div><div class="value">{{ $compliance['due_soon'] }}</div></td>
        </tr>
    </table>
</body>
</html>
