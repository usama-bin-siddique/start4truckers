<?php

namespace App\Http\Controllers;

use App\Models\ClientReminder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ReminderController extends Controller
{
    public function index(Request $request): Response
    {
        $user  = Auth::user();
        $query = ClientReminder::with(['client', 'createdBy'])
            ->when($request->search, fn ($q, $v) =>
                $q->where('description', 'like', "%{$v}%")
                    ->orWhereHas('client', fn ($c) =>
                        $c->where('name', 'like', "%{$v}%")
                            ->orWhere('client_number', 'like', "%{$v}%")
                    )
            )
            // "status" filter refers to where the reminder sits on the clock
            ->when($request->status, function ($q, $v) {
                if ($v === 'upcoming') {
                    $q->whereNull('notified_at')->where('remind_at', '>=', now());
                } elseif ($v === 'reminded') {
                    $q->whereNotNull('notified_at');
                } elseif ($v === 'overdue') {
                    $q->whereNull('notified_at')->where('remind_at', '<', now());
                }
            })
            ->when($request->created_by, fn ($q, $v) => $q->where('created_by', $v));

        // Only admins see every reminder; everyone else sees what they created
        if ($user->role !== 'admin') {
            $query->where('created_by', $user->id);
        }

        $reminders = $query->orderByRaw(
            'notified_at IS NOT NULL, remind_at'
        )->paginate(25)->withQueryString();

        $counts = $this->baseCounts($user, $request->created_by)
            ->when($request->search, fn ($q, $v) => $q->where('description', 'like', "%{$v}%"));

        return Inertia::render('Reminders/Index', [
            'reminders' => $reminders->through(fn ($r) => [
                'id'            => $r->id,
                'description'   => $r->description,
                'remind_at'     => $r->remind_at?->format('Y-m-d\\TH:i'),
                'notified_at'   => $r->notified_at?->format('Y-m-d\\TH:i'),
                'client_id'     => $r->client?->id,
                'client_name'   => $r->client?->display_name,
                'client_number' => $r->client?->client_number,
                'created_by'    => $r->createdBy?->name,
            ]),
            'users'   => $user->role === 'admin'
                ? \App\Models\User::where('is_active', true)->select('id', 'name', 'role')->get()
                : [],
            'filters' => $request->only(['search', 'status', 'created_by']),
            'stats'   => [
                'upcoming'  => (clone $counts)->upcoming()->count(),
                'overdue'   => (clone $counts)->overdue()->count(),
                'reminded'  => (clone $counts)->whereNotNull('notified_at')->count(),
                'total'     => $counts->count(),
            ],
        ]);
    }

    private function baseCounts(\App\Models\User $user, ?string $createdBy)
    {
        $query = ClientReminder::query();

        if ($user->role !== 'admin') {
            $query->where('created_by', $user->id);
        } elseif ($createdBy) {
            $query->where('created_by', $createdBy);
        }

        return $query;
    }
}
