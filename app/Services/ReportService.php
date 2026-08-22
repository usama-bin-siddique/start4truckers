<?php

namespace App\Services;

use App\Models\Client;
use App\Models\ClientService;
use App\Models\Lead;
use App\Models\Payment;
use App\Models\Setting;
use App\Models\Task;
use App\Models\User;
use App\Support\ClientProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportService
{
    /**
     * @return array{dateFrom: string, dateTo: string, userId: ?string, serviceId: ?string, employeeName: ?string}
     */
    public function filtersFromRequest(Request $request): array
    {
        $userId = $request->filled('user_id') ? (string) $request->input('user_id') : null;
        $serviceId = $request->filled('service_id') ? (string) $request->input('service_id') : null;

        return [
            'dateFrom'     => $request->input('date_from') ?: now()->startOfYear()->toDateString(),
            'dateTo'       => $request->input('date_to') ?: now()->toDateString(),
            'userId'       => $userId,
            'serviceId'    => $serviceId,
            'employeeName' => $userId ? User::find($userId)?->name : null,
        ];
    }

    /**
     * @param  array{dateFrom: string, dateTo: string, userId: ?string, serviceId: ?string, employeeName?: ?string}  $filters
     */
    public function compile(array $filters): array
    {
        $from = $filters['dateFrom'];
        $to = $filters['dateTo'];
        $userId = $filters['userId'] ?? null;
        $serviceId = $filters['serviceId'] ?? null;

        return [
            'company'          => [
                'name'  => Setting::get('company_name', config('app.name', 'Start4Truckers')),
                'email' => Setting::get('company_email'),
                'phone' => Setting::get('company_phone'),
            ],
            'filters'          => $filters,
            'generated_at'     => now()->timezone(config('app.timezone'))->format('M j, Y g:i A'),
            'revenue'          => $this->revenueReport($from, $to, $userId),
            'sales_by_service' => $this->salesByService($from, $to, $userId, $serviceId),
            'lead_conversion'  => $this->leadConversion($from, $to, $userId),
            'outstanding'      => $this->outstandingBalances($userId),
            'employee_perf'    => $this->employeePerformance($from, $to, $userId),
            'monthly_trends'   => $this->monthlyTrends($userId),
            'compliance'       => $this->complianceBreakdown($userId),
        ];
    }

    private function revenueReport(string $from, string $to, ?string $userId): array
    {
        $q = Payment::whereBetween('paid_at', [$from, $to])
            ->when($userId, fn ($q) => $q->whereHas('client', fn ($q) => $q->where('assigned_to', $userId)));

        $summary = (clone $q)->selectRaw('
            SUM(invoice_amount)  as total_invoiced,
            SUM(amount_received) as total_received,
            COUNT(*)             as payment_count
        ')->first();

        $daily = (clone $q)
            ->selectRaw('DATE(paid_at) as date, SUM(amount_received) as revenue')
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

    private function salesByService(string $from, string $to, ?string $userId, ?string $serviceId): array
    {
        return ClientService::with('service')
            ->where('status', 'completed')
            ->whereBetween('completion_date', [$from, $to])
            ->when($userId, fn ($q) => $q->where(fn ($q) =>
                $q->where('assigned_to', $userId)
                    ->orWhereHas('client', fn ($q) => $q->where('assigned_to', $userId))
            ))
            ->when($serviceId, fn ($q) => $q->where('service_id', $serviceId))
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

    private function leadConversion(string $from, string $to, ?string $userId): array
    {
        $q = Lead::whereBetween('created_at', [$from, $to])
            ->when($userId, fn ($q) => $q->where('assigned_to', $userId));

        $total = (clone $q)->count();
        $won = (clone $q)->where('status', 'won')->count();
        $lost = (clone $q)->where('status', 'lost')->count();
        $followUp = (clone $q)->where('status', 'follow-up')->count();
        $quoted = (clone $q)->where('status', 'quote_sent')->count();
        $open = $total - $won - $lost;
        $rate = $total > 0 ? round(($won / $total) * 100, 1) : 0;

        $bySource = (clone $q)
            ->select('source', DB::raw('COUNT(*) as count'))
            ->groupBy('source')
            ->get()
            ->map(fn ($r) => ['source' => ucfirst($r->source), 'count' => (int) $r->count])
            ->toArray();

        return [
            'total'     => $total,
            'won'       => $won,
            'lost'      => $lost,
            'follow_up' => $followUp,
            'quote_sent' => $quoted,
            'open'      => $open,
            'rate'      => $rate,
            'funnel'    => [
                ['stage' => 'Total Leads', 'count' => $total],
                ['stage' => 'Contacted', 'count' => (clone $q)->whereIn('status', ['contacted', 'follow-up', 'quote_sent', 'won', 'lost'])->count()],
                ['stage' => 'Quote Sent', 'count' => $quoted + $won + $lost],
                ['stage' => 'Won', 'count' => $won],
            ],
            'by_source' => $bySource,
        ];
    }

    private function outstandingBalances(?string $userId): array
    {
        $clients = Client::with(['lead', 'assignedUser'])
            ->whereIn('status', ClientProfile::OPEN_STATUSES)
            ->when($userId, fn ($q) => $q->where('assigned_to', $userId))
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

    private function employeePerformance(string $from, string $to, ?string $userId): array
    {
        $users = User::where('is_active', true)
            ->whereIn('role', ['admin', 'sales', 'processing'])
            ->when($userId, fn ($q) => $q->where('id', $userId))
            ->get();

        return $users->map(function ($user) use ($from, $to) {
            $leadsAssigned = Lead::where('assigned_to', $user->id)->whereBetween('created_at', [$from, $to])->count();
            $leadsWon = Lead::where('assigned_to', $user->id)->where('status', 'won')->whereBetween('created_at', [$from, $to])->count();
            $clientsManaged = Client::where('assigned_to', $user->id)->count();
            $revenueGenerated = Payment::whereHas('client', fn ($q) => $q->where('assigned_to', $user->id))
                ->whereBetween('paid_at', [$from, $to])
                ->sum('amount_received');
            $tasksCompleted = Task::where('assigned_to', $user->id)->where('status', 'completed')->whereBetween('completed_at', [$from, $to])->count();
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

    private function monthlyTrends(?string $userId): array
    {
        return collect(range(11, 0))->map(function ($i) use ($userId) {
            $date = now()->subMonths($i);
            $year = $date->year;
            $month = $date->month;

            return [
                'month'    => $date->format('M Y'),
                'revenue'  => (float) Payment::whereYear('paid_at', $year)->whereMonth('paid_at', $month)
                    ->when($userId, fn ($q) => $q->whereHas('client', fn ($q) => $q->where('assigned_to', $userId)))
                    ->sum('amount_received'),
                'leads'    => Lead::whereYear('created_at', $year)->whereMonth('created_at', $month)
                    ->when($userId, fn ($q) => $q->where('assigned_to', $userId))
                    ->count(),
                'clients'  => Client::whereYear('created_at', $year)->whereMonth('created_at', $month)
                    ->when($userId, fn ($q) => $q->where('assigned_to', $userId))
                    ->count(),
                'services' => ClientService::where('status', 'completed')
                    ->whereYear('completion_date', $year)
                    ->whereMonth('completion_date', $month)
                    ->when($userId, fn ($q) => $q->where('assigned_to', $userId))
                    ->count(),
            ];
        })->values()->toArray();
    }

    private function complianceBreakdown(?string $userId): array
    {
        $base = Client::query()->when($userId, fn ($q) => $q->where('assigned_to', $userId));

        return [
            'one_time' => (clone $base)->where('compliance_type', Client::COMPLIANCE_PROJECT)->count(),
            'monthly'  => (clone $base)->where('compliance_type', Client::COMPLIANCE_MONTHLY)->count(),
            'unset'    => (clone $base)->whereNull('compliance_type')->count(),
            'due_soon' => (clone $base)->where('compliance_type', Client::COMPLIANCE_MONTHLY)
                ->whereNotNull('next_compliance_due_at')
                ->whereDate('next_compliance_due_at', '<=', now()->addDays(7))
                ->count(),
        ];
    }

    private function serviceColor(int $id): string
    {
        $colors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#10b981', '#6366f1'];

        return $colors[$id % count($colors)];
    }
}
