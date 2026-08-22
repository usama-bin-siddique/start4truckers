<?php

namespace App\Services;

use App\Models\Client;
use App\Models\Lead;
use App\Models\Payment;
use App\Models\Task;
use App\Models\Activity;
use Illuminate\Support\Facades\Auth;

class DashboardService
{
    public function getData(): array
    {
        $user = Auth::user();
        $today = now()->toDateString();
        $startOfWeek = now()->startOfWeek()->toDateString();
        $startOfMonth = now()->startOfMonth()->toDateString();
        $startOfYear = now()->startOfYear()->toDateString();

        return [
            'stats'            => $this->getStats($user, $today, $startOfWeek, $startOfMonth, $startOfYear),
            'monthly_revenue'  => $this->getMonthlyRevenue($user),
            'lead_conversion'  => $this->getLeadConversion($user),
            'recent_activities'=> $this->getRecentActivities($user),
            'tasks_due_today'  => $this->getTasksDueToday($user, $today),
        ];
    }

    private function getStats($user, $today, $startOfWeek, $startOfMonth, $startOfYear): array
    {
        $leadsQuery = Lead::query()->visibleTo($user);
        $paymentsQuery = Payment::query()->visibleTo($user);
        $clientsQuery = Client::query()->visibleTo($user);

        return [
            'leads_today'       => (clone $leadsQuery)->whereDate('created_at', $today)->count(),
            'leads_this_week'   => (clone $leadsQuery)->whereDate('created_at', '>=', $startOfWeek)->count(),
            'active_clients'    => (clone $clientsQuery)->whereIn('status', \App\Support\ClientProfile::OPEN_STATUSES)->count(),
            'revenue_today'     => (clone $paymentsQuery)->whereDate('paid_at', $today)->sum('amount_received'),
            'revenue_month'     => (clone $paymentsQuery)->whereDate('paid_at', '>=', $startOfMonth)->sum('amount_received'),
            'revenue_year'      => (clone $paymentsQuery)->whereDate('paid_at', '>=', $startOfYear)->sum('amount_received'),
            'pending_payments'  => (clone $clientsQuery)->withSum('payments', 'invoice_amount')
                                    ->withSum('payments', 'amount_received')
                                    ->get()
                                    ->sum(fn ($c) => max(0, $c->payments_sum_invoice_amount - $c->payments_sum_amount_received)),
            'tasks_due_today'   => Task::where('status', '!=', Task::STATUS_COMPLETED)
                                    ->whereDate('due_date', $today)
                                    ->when($user->role !== 'admin', fn ($q) => $q->where('assigned_to', $user->id))
                                    ->count(),
        ];
    }

    private function getMonthlyRevenue($user): array
    {
        $months = collect(range(11, 0))->map(function ($i) use ($user) {
            $date = now()->subMonths($i);
            $revenue = Payment::query()->visibleTo($user)
                ->whereYear('paid_at', $date->year)
                ->whereMonth('paid_at', $date->month)
                ->sum('amount_received');
            return [
                'month'   => $date->format('M Y'),
                'revenue' => (float) $revenue,
            ];
        });

        return $months->values()->toArray();
    }

    private function getLeadConversion($user): array
    {
        $base = Lead::query()->visibleTo($user)->whereDate('created_at', '>=', now()->subDays(30));
        $total = (clone $base)->count();
        $won   = (clone $base)->where('status', 'won')->count();
        $lost  = (clone $base)->where('status', 'lost')->count();
        $open  = $total - $won - $lost;

        return [
            ['name' => 'Won',  'value' => $won,  'color' => '#22c55e'],
            ['name' => 'Lost', 'value' => $lost, 'color' => '#ef4444'],
            ['name' => 'Open', 'value' => $open, 'color' => '#3b82f6'],
        ];
    }

    private function getRecentActivities($user): array
    {
        return Activity::with(['causer', 'subject'])
            ->when($user->isSalesRep(), function ($q) use ($user) {
                $q->where(function ($q) use ($user) {
                    $q->where(function ($q) use ($user) {
                        $q->where('subject_type', Lead::class)
                            ->whereIn('subject_id', Lead::query()->where('assigned_to', $user->id)->select('id'));
                    })->orWhere(function ($q) use ($user) {
                        $q->where('subject_type', Client::class)
                            ->whereIn('subject_id', Client::query()->where('assigned_to', $user->id)->select('id'));
                    });
                });
            })
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn ($a) => [
                'id'          => $a->id,
                'action'      => $a->action,
                'description' => $a->description,
                'causer'      => $a->causer?->name ?? 'System',
                'subject_type'=> class_basename($a->subject_type),
                'created_at'  => $a->created_at->diffForHumans(),
            ])
            ->toArray();
    }

    private function getTasksDueToday($user, $today): array
    {
        return Task::with(['assignedUser', 'client'])
            ->where('status', '!=', Task::STATUS_COMPLETED)
            ->whereDate('due_date', $today)
            ->when($user->role !== 'admin', fn ($q) => $q->where('assigned_to', $user->id))
            ->limit(5)
            ->get()
            ->map(fn ($t) => [
                'id'       => $t->id,
                'title'    => $t->title,
                'priority' => $t->priority,
                'client'   => $t->client?->display_name ?? '—',
                'due_date' => $t->due_date?->format('H:i'),
            ])
            ->toArray();
    }
}
