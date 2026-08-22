<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Task;
use App\Services\ActivityService;
use App\Services\MonthlyComplianceService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class TaskController extends Controller
{
    public function __construct(
        private ActivityService $activity,
        private MonthlyComplianceService $monthlyCompliance
    ) {}

    public function index(Request $request): Response
    {
        $user  = Auth::user();
        $query = Task::with(['assignedUser', 'createdBy', 'client.lead'])
            ->when($request->search, fn ($q, $v) => $q->where('title', 'like', "%{$v}%"))
            ->when($request->status, fn ($q, $v) => $q->where('status', $v))
            ->when($request->priority, fn ($q, $v) => $q->where('priority', $v))
            ->when($request->assigned_to, fn ($q, $v) => $q->where('assigned_to', $v));

        // Non-admins only see their own tasks
        if ($user->role !== 'admin') {
            $query->where(fn ($q) =>
                $q->where('assigned_to', $user->id)->orWhere('created_by', $user->id)
            );
        }

        $tasks = $query->orderByRaw("CASE status WHEN 'pending' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END")
            ->orderBy('due_date')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('Tasks/Index', [
            'tasks'   => $tasks->through(fn ($t) => [
                'id'            => $t->id,
                'title'         => $t->title,
                'description'   => $t->description,
                'priority'      => $t->priority,
                'status'        => $t->status,
                'assigned_user' => $t->assignedUser ? ['id' => $t->assignedUser->id, 'name' => $t->assignedUser->name] : null,
                'created_by'    => $t->createdBy?->name,
                'client_id'     => $t->client_id,
                'client_name'   => $t->client?->display_name,
                'client_number' => $t->client?->client_number,
                'kind'          => $t->kind,
                'due_date'      => $t->due_date?->format('Y-m-d\\TH:i'),
                'reminder_at'   => $t->reminder_at?->format('Y-m-d\\TH:i'),
                'is_overdue'    => $t->isOverdue(),
                'created_at'    => $t->created_at->toDateString(),
            ]),
            'users'   => \App\Models\User::where('is_active', true)->select('id', 'name', 'role')->get(),
            'filters' => $request->only(['search', 'status', 'priority', 'assigned_to']),
            'stats'   => [
                'pending'     => Task::where('status', 'pending')->when($user->role !== 'admin', fn ($q) => $q->where('assigned_to', $user->id))->count(),
                'in_progress' => Task::where('status', 'in_progress')->when($user->role !== 'admin', fn ($q) => $q->where('assigned_to', $user->id))->count(),
                'completed'   => Task::where('status', 'completed')->when($user->role !== 'admin', fn ($q) => $q->where('assigned_to', $user->id))->count(),
                'overdue'     => Task::where('status', '!=', 'completed')->where('due_date', '<', now())->when($user->role !== 'admin', fn ($q) => $q->where('assigned_to', $user->id))->count(),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'client_id'   => ['nullable', 'exists:clients,id'],
            'title'       => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'priority'    => ['required', 'in:low,medium,high,urgent'],
            'due_date'    => ['nullable', 'date'],
            'reminder_at' => ['nullable', 'date'],
        ]);

        $data = $this->normalizeDates($data);
        $data['created_by'] = Auth::id();
        $task = Task::create($data);

        if ($task->client_id) {
            $this->activity->log($task->client, Activity::ACTION_TASK_CREATED,
                "Task created: \"{$task->title}\""
            );
        }

        return back()->with('success', 'Task created.');
    }

    public function update(Request $request, Task $task): RedirectResponse
    {
        $this->authorize('update', $task);

        $data = $request->validate([
            'title'       => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'priority'    => ['required', 'in:low,medium,high,urgent'],
            'status'      => ['required', 'in:pending,in_progress,completed'],
            'due_date'    => ['nullable', 'date'],
            'reminder_at' => ['nullable', 'date'],
        ]);

        $data = $this->normalizeDates($data);

        if ($data['status'] === 'completed' && $task->status !== 'completed') {
            $data['completed_at'] = now();
        }

        if (array_key_exists('reminder_at', $data) && $data['reminder_at'] && $data['reminder_at']->isFuture()) {
            $data['reminder_sent_at'] = null;
        }

        $wasOpen = $task->status !== Task::STATUS_COMPLETED;

        $task->update($data);

        if ($wasOpen && $task->fresh()->status === Task::STATUS_COMPLETED) {
            $this->advanceMonthlyCompliance($task);
        }

        return back()->with('success', 'Task updated.');
    }

    public function complete(Task $task): RedirectResponse
    {
        $this->authorize('update', $task);

        $wasOpen = $task->status !== Task::STATUS_COMPLETED;

        $task->update([
            'status'       => Task::STATUS_COMPLETED,
            'completed_at' => now(),
        ]);

        if ($wasOpen) {
            $this->advanceMonthlyCompliance($task);
        }

        return back()->with('success', 'Task marked as complete.');
    }

    public function destroy(Task $task): RedirectResponse
    {
        $this->authorize('delete', $task);
        $task->delete();
        return back()->with('success', 'Task deleted.');
    }

    private function normalizeDates(array $data): array
    {
        foreach (['due_date', 'reminder_at', 'assigned_to', 'client_id'] as $key) {
            if (($data[$key] ?? null) === '') {
                $data[$key] = null;
            }
        }

        if (empty($data['reminder_at']) && ! empty($data['due_date'])) {
            $data['reminder_at'] = $data['due_date'];
        }

        foreach (['due_date', 'reminder_at'] as $key) {
            if (! empty($data[$key]) && is_string($data[$key])) {
                $data[$key] = \Illuminate\Support\Carbon::parse($data[$key]);
            }
        }

        return $data;
    }

    private function advanceMonthlyCompliance(Task $task): void
    {
        if ($task->kind !== Task::KIND_MONTHLY_COMPLIANCE) {
            return;
        }

        $client = $task->client ?? $task->client()->first();
        if ($client) {
            $this->monthlyCompliance->completeCycle($client, $task);
        }
    }
}
