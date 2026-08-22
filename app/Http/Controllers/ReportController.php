<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\ClientService;
use App\Models\Lead;
use App\Models\Payment;
use App\Models\Service;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless(auth()->user()->role === 'admin', 403, 'Unauthorized');

        $dateFrom  = $request->date_from ?? now()->startOfYear()->toDateString();
        $dateTo    = $request->date_to   ?? now()->toDateString();
        $userId    = $request->user_id;
        $serviceId = $request->service_id;

        return Inertia::render('Reports/Index', [
            'revenue'          => $this->revenueReport($dateFrom, $dateTo, $userId),
            'sales_by_service' => $this->salesByService($dateFrom, $dateTo),
            'lead_conversion'  => $this->leadConversion($dateFrom, $dateTo, $userId),
            'outstanding'      => $this->outstandingBalances(),
            'employee_perf'    => $this->employeePerformance($dateFrom, $dateTo),
            'monthly_trends'   => $this->monthlyTrends(),
            'users'            => User::where('is_active', true)->select('id', 'name', 'role')->get(),
            'services'         => Service::where('is_active', true)->orderBy('order')->get(['id', 'name']),
            'filters'          => compact('dateFrom', 'dateTo', 'userId', 'serviceId'),
        ]);
    }

    // ── Revenue over date range ────────────────────────────────────────────
    private function revenueReport(string $from, string $to, ?string $userId): array
    {
        $q = Payment::whereBetween('paid_at', [$from, $to]);
        if ($userId) {
            $q->whereHas('client', fn ($q) => $q->where('assigned_to', $userId));
        }

        $summary = $q->selectRaw('
            SUM(invoice_amount)  as total_invoiced,
            SUM(amount_received) as total_received,
            COUNT(*)             as payment_count
        ')->first();

        // Daily breakdown for chart
        $daily = Payment::whereBetween('paid_at', [$from, $to])
            ->when($userId, fn ($q) =>
                $q->whereHas('client', fn ($q) => $q->where('assigned_to', $userId))
            )
            ->selectRaw("DATE(paid_at) as date, SUM(amount_received) as revenue")
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn ($r) => ['date' => $r->date, 'revenue' => (float) $r->revenue])
            ->toArray();

        return [
            'total_invoiced'  => (float) ($summary->total_invoiced ?? 0),
            'total_received'  => (float) ($summary->total_received ?? 0),
            'total_balance'   => (float) (($summary->total_invoiced ?? 0) - ($summary->total_received ?? 0)),
            'payment_count'   => (int) ($summary->payment_count ?? 0),
            'daily'           => $daily,
        ];
    }

    // ── Sales by service ──────────────────────────────────────────────────
    private function salesByService(string $from, string $to): array
    {
        return ClientService::with('service')
            ->where('status', 'completed')
            ->whereBetween('completion_date', [$from, $to])
            ->select('service_id', DB::raw('COUNT(*) as count'))
            ->groupBy('service_id')
            ->get()
            ->map(fn ($r) => [
                'service' => $r->service->name ?? 'Unknown',
                'count'   => (int) $r->count,
                'color'   => $this->serviceColor($r->service_id),
            ])
            ->sortByDesc('count')
            ->values()
            ->toArray();
    }

    // ── Lead conversion funnel ────────────────────────────────────────────
    private function leadConversion(string $from, string $to, ?string $userId): array
    {
        $q = Lead::whereBetween('created_at', [$from, $to]);
        if ($userId) {
            $q->where('assigned_to', $userId);
        }

        $total    = (clone $q)->count();
        $won      = (clone $q)->where('status', 'won')->count();
        $lost     = (clone $q)->where('status', 'lost')->count();
        $followUp = (clone $q)->where('status', 'follow-up')->count();
        $quoted   = (clone $q)->where('status', 'quote_sent')->count();
        $open     = $total - $won - $lost;
        $rate     = $total > 0 ? round(($won / $total) * 100, 1) : 0;

        // By source
        $bySource = Lead::whereBetween('created_at', [$from, $to])
            ->when($userId, fn ($q) => $q->where('assigned_to', $userId))
            ->select('source', DB::raw('COUNT(*) as count'))
            ->groupBy('source')
            ->get()
            ->map(fn ($r) => ['source' => ucfirst($r->source), 'count' => (int) $r->count])
            ->toArray();

        return [
            'total'        => $total,
            'won'          => $won,
            'lost'         => $lost,
            'follow_up'    => $followUp,
            'quote_sent'   => $quoted,
            'open'         => $open,
            'rate'         => $rate,
            'funnel'       => [
                ['stage' => 'Total Leads',  'count' => $total],
                ['stage' => 'Contacted',    'count' => (clone $q)->whereIn('status', ['contacted','follow-up','quote_sent','won','lost'])->count()],
                ['stage' => 'Quote Sent',   'count' => $quoted + $won + $lost],
                ['stage' => 'Won',          'count' => $won],
            ],
            'by_source'    => $bySource,
        ];
    }

    // ── Outstanding balances ──────────────────────────────────────────────
    private function outstandingBalances(): array
    {
        $clients = Client::with(['lead', 'assignedUser'])
            ->where('status', 'active')
            ->get()
            ->map(fn ($c) => [
                'client_number'  => $c->client_number,
                'client_name'    => $c->display_name,
                'assigned_to'    => $c->assignedUser?->name ?? '—',
                'total_invoiced' => $c->total_invoiced,
                'total_received' => $c->total_received,
                'balance_due'    => $c->balance_due,
            ])
            ->filter(fn ($c) => $c['balance_due'] > 0)
            ->sortByDesc('balance_due')
            ->values()
            ->toArray();

        return [
            'clients'       => $clients,
            'total_balance' => array_sum(array_column($clients, 'balance_due')),
            'client_count'  => count($clients),
        ];
    }

    // ── Employee performance ──────────────────────────────────────────────
    private function employeePerformance(string $from, string $to): array
    {
        $users = User::where('is_active', true)
            ->whereIn('role', ['admin', 'sales', 'processing'])
            ->get();

        return $users->map(function ($user) use ($from, $to) {
            $leadsAssigned   = Lead::where('assigned_to', $user->id)->whereBetween('created_at', [$from, $to])->count();
            $leadsWon        = Lead::where('assigned_to', $user->id)->where('status', 'won')->whereBetween('created_at', [$from, $to])->count();
            $clientsManaged  = Client::where('assigned_to', $user->id)->count();
            $revenueGenerated = Payment::whereHas('client', fn ($q) => $q->where('assigned_to', $user->id))
                ->whereBetween('paid_at', [$from, $to])
                ->sum('amount_received');
            $tasksCompleted  = \App\Models\Task::where('assigned_to', $user->id)->where('status', 'completed')->whereBetween('completed_at', [$from, $to])->count();
            $servicesCompleted = ClientService::where('assigned_to', $user->id)->where('status', 'completed')->whereBetween('completion_date', [$from, $to])->count();

            return [
                'name'               => $user->name,
                'role'               => ucfirst($user->role),
                'leads_assigned'     => $leadsAssigned,
                'leads_won'          => $leadsWon,
                'clients_managed'    => $clientsManaged,
                'revenue_generated'  => (float) $revenueGenerated,
                'tasks_completed'    => $tasksCompleted,
                'services_completed' => $servicesCompleted,
                'conversion_rate'    => $leadsAssigned > 0 ? round(($leadsWon / $leadsAssigned) * 100, 1) : 0,
            ];
        })->sortByDesc('revenue_generated')->values()->toArray();
    }

    // ── Monthly trends (last 12 months) ──────────────────────────────────
    private function monthlyTrends(): array
    {
        return collect(range(11, 0))->map(function ($i) {
            $date  = now()->subMonths($i);
            $year  = $date->year;
            $month = $date->month;

            return [
                'month'    => $date->format('M Y'),
                'revenue'  => (float) Payment::whereYear('paid_at', $year)->whereMonth('paid_at', $month)->sum('amount_received'),
                'leads'    => Lead::whereYear('created_at', $year)->whereMonth('created_at', $month)->count(),
                'clients'  => Client::whereYear('created_at', $year)->whereMonth('created_at', $month)->count(),
                'services' => ClientService::where('status', 'completed')->whereYear('completion_date', $year)->whereMonth('completion_date', $month)->count(),
            ];
        })->values()->toArray();
    }

    private function serviceColor(int $id): string
    {
        $colors = ['#3b82f6','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899','#10b981','#6366f1'];
        return $colors[$id % count($colors)];
    }
}
