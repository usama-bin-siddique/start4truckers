<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Client;
use App\Models\Payment;
use App\Models\Setting;
use App\Services\ActivityService;
use App\Services\NotificationService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class PaymentController extends Controller
{
    public function __construct(
        private ActivityService $activity,
        private NotificationService $notification
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Payment::class);

        $user = Auth::user();
        $filters = $this->filterValues($request);

        $base = Payment::query()->visibleTo($user);
        $this->applyFilters($base, $filters);

        $payments = $base->clone()
            ->with(['client.lead', 'client.assignedUser', 'client.clientServices.service', 'createdBy'])
            ->latest()
            ->paginate(25)
            ->withQueryString();

        $totals = $base->clone()->selectRaw('
            SUM(invoice_amount) as total_invoiced,
            SUM(amount_received) as total_received,
            SUM(invoice_amount - amount_received) as total_balance
        ')->first();

        $clients = Client::query()
            ->with('lead')
            ->visibleTo($user)
            ->orderBy('name')
            ->get(['id', 'client_number', 'name', 'company', 'lead_id']);

        $companies = $clients
            ->map(fn (Client $c) => $c->company ?: $c->lead?->company)
            ->filter()
            ->unique()
            ->sort()
            ->values()
            ->all();

        return Inertia::render('Payments/Index', [
            'payments' => $payments->through(fn ($p) => [
                'id'                    => $p->id,
                'invoice_number'        => $p->invoice_number,
                'client_id'             => $p->client_id,
                'client_number'         => $p->client?->client_number,
                'customer_name'         => $p->client?->display_name ?? 'Unknown client',
                'company_name'          => $p->client?->company ?: $p->client?->lead?->company,
                'invoice_amount'        => (float) $p->invoice_amount,
                'amount_received'       => (float) $p->amount_received,
                'balance_due'           => $p->balance_due,
                'payment_method'        => $p->payment_method,
                'status'                => $p->payment_status,
                'services'              => ($p->client?->clientServices ?? collect())
                    ->map(fn ($s) => $s->service?->name)
                    ->filter()
                    ->values()
                    ->all(),
                'assigned_user'         => $p->client?->assignedUser?->name,
                'transaction_reference' => $p->transaction_reference,
                'notes'                 => $p->notes,
                'paid_at'               => $p->paid_at?->toDateString(),
                'created_by'            => $p->createdBy?->name,
                'has_receipt'           => ! empty($p->receipt_path),
                'created_at'            => $p->created_at->toDateString(),
            ]),
            'clients' => $clients->map(fn (Client $c) => [
                'id'            => $c->id,
                'client_number' => $c->client_number,
                'name'          => $c->display_name,
                'company'       => $c->company ?: $c->lead?->company,
            ]),
            'companies' => $companies,
            'can_create' => $user->can('create', Payment::class),
            'totals'   => [
                'invoiced'  => (float) ($totals->total_invoiced ?? 0),
                'received'  => (float) ($totals->total_received ?? 0),
                'balance'   => (float) ($totals->total_balance ?? 0),
            ],
            'filters'  => $filters,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Payment::class);

        $data = $request->validate([
            'client_id'             => ['required', 'exists:clients,id'],
            'invoice_amount'        => ['required', 'numeric', 'min:0'],
            'amount_received'       => ['nullable', 'numeric', 'min:0'],
            'payment_method'        => ['nullable', 'string', 'max:50'],
            'transaction_reference' => ['nullable', 'string', 'max:255'],
            'notes'                 => ['nullable', 'string'],
            'paid_at'               => ['nullable', 'date'],
            'receipt'               => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'return_to'             => ['nullable', 'in:payments'],
        ]);

        $receipt = $request->file('receipt');
        $returnTo = $data['return_to'] ?? null;
        unset($data['receipt'], $data['return_to']);

        $client = Client::findOrFail($data['client_id']);
        $this->authorize('view', $client);

        $data['created_by']      = Auth::id();
        $data['amount_received'] = $data['amount_received'] ?? 0;

        $payment = Payment::create($data);

        if ($receipt) {
            $payment->update([
                'receipt_path' => $receipt->store("clients/{$payment->client_id}/receipts", 'private'),
            ]);
        }

        $proofNote = $receipt ? ' with payment proof' : '';
        $this->activity->log($client, Activity::ACTION_PAYMENT_CREATED,
            "Payment of \${$payment->invoice_amount} created (received: \${$payment->amount_received}){$proofNote}"
        );

        if ((float) $payment->amount_received > 0) {
            $this->notification->notifyClientStakeholders($client, NotificationService::TYPE_PAYMENT_RECEIVED, [
                'payment_id'    => $payment->id,
                'client_id'     => $client->id,
                'client_name'   => $client->display_name,
                'client_number' => $client->client_number,
                'amount'        => $payment->amount_received,
            ]);
        }

        if ($returnTo === 'payments') {
            return redirect()->route('payments.index')->with('success', 'Payment recorded.');
        }

        return redirect()->route('clients.show', $client)
            ->with('success', 'Payment recorded.');
    }

    public function update(Request $request, Payment $payment): RedirectResponse
    {
        $this->authorize('update', $payment);

        $request->merge(
            collect($request->except('receipt'))->map(fn ($value) => $value === '' ? null : $value)->all()
        );

        $data = $request->validate([
            'client_id'             => ['sometimes', 'exists:clients,id'],
            'invoice_amount'        => ['required', 'numeric', 'min:0'],
            'amount_received'       => ['nullable', 'numeric', 'min:0'],
            'payment_method'        => ['nullable', 'string', 'max:50'],
            'transaction_reference' => ['nullable', 'string', 'max:255'],
            'notes'                 => ['nullable', 'string'],
            'paid_at'               => ['nullable', 'date'],
            'receipt'               => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ]);

        $receipt = $request->file('receipt');
        unset($data['receipt']);

        if (array_key_exists('client_id', $data) && (int) $data['client_id'] !== (int) $payment->client_id) {
            $this->authorize('view', Client::findOrFail($data['client_id']));
        }

        $data['amount_received'] = $data['amount_received'] ?? 0;
        $payment->update($data);

        if ($receipt) {
            if ($payment->receipt_path) {
                Storage::disk('private')->delete($payment->receipt_path);
            }

            $payment->update([
                'receipt_path' => $receipt->store("clients/{$payment->client_id}/receipts", 'private'),
            ]);
        }

        $payment->loadMissing('client');
        if ($payment->client) {
            $this->activity->log(
                $payment->client,
                Activity::ACTION_PAYMENT_UPDATED,
                "Payment updated: \${$payment->invoice_amount} invoiced, \${$payment->amount_received} received"
            );
        }

        return back()->with('success', 'Payment updated.');
    }

    public function uploadReceipt(Request $request, Payment $payment): RedirectResponse
    {
        $this->authorize('update', $payment);

        $request->validate([
            'receipt' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ]);

        if ($payment->receipt_path) {
            Storage::disk('private')->delete($payment->receipt_path);
        }

        $path = $request->file('receipt')->store(
            "clients/{$payment->client_id}/receipts", 'private'
        );

        $payment->update(['receipt_path' => $path]);

        return back()->with('success', 'Receipt uploaded.');
    }

    public function downloadReceipt(Payment $payment)
    {
        $this->authorize('view', $payment);

        if (!$payment->receipt_path || !Storage::disk('private')->exists($payment->receipt_path)) {
            abort(404, 'Receipt not found.');
        }

        return Storage::disk('private')->download($payment->receipt_path);
    }

    public function invoice(Payment $payment): HttpResponse
    {
        $payment->load(['client.lead', 'createdBy']);
        $this->authorize('view', $payment->client);

        $methods = [
            'cash'          => 'Cash',
            'check'         => 'Check',
            'zelle'         => 'Zelle',
            'venmo'         => 'Venmo',
            'bank_transfer' => 'Bank Transfer',
            'stripe'        => 'Stripe',
            'other'         => 'Other',
        ];

        return response()->view('payments.invoice', [
            'payment' => $payment,
            'client'  => $payment->client,
            'company' => [
                'name'  => Setting::get('company_name', config('app.name', 'Start4Truckers')),
                'email' => Setting::get('company_email'),
                'phone' => Setting::get('company_phone'),
            ],
            'method_label' => $methods[$payment->payment_method] ?? $payment->payment_method,
        ]);
    }

    public function destroy(Payment $payment): RedirectResponse
    {
        $this->authorize('delete', $payment);

        $payment->loadMissing('client');
        if ($payment->client) {
            $this->activity->log(
                $payment->client,
                Activity::ACTION_PAYMENT_DELETED,
                "Payment of \${$payment->invoice_amount} deleted (received: \${$payment->amount_received})"
            );
        }

        $payment->delete();

        return back()->with('success', 'Payment deleted.');
    }

    /**
     * @return array{search:?string,payment_method:?string,date_from:?string,date_to:?string,client_id:?string,company:?string,status:?string}
     */
    private function filterValues(Request $request): array
    {
        $blank = function (?string $value): ?string {
            $value = trim((string) $value);

            return $value === '' || $value === '__all__' ? null : $value;
        };

        return [
            'search'         => $blank($request->input('search')),
            'payment_method' => $blank($request->input('payment_method') ?: $request->query('method')),
            'date_from'      => $blank($request->input('date_from')),
            'date_to'        => $blank($request->input('date_to')),
            'client_id'      => $blank($request->input('client_id')),
            'company'        => $blank($request->input('company')),
            'status'         => $blank($request->input('status')),
        ];
    }

    /**
     * @param  array{search:?string,payment_method:?string,date_from:?string,date_to:?string,client_id:?string,company:?string,status:?string}  $filters
     */
    private function applyFilters(Builder $query, array $filters): void
    {
        if ($filters['search']) {
            $term = $filters['search'];
            $like = '%'.$term.'%';
            $amount = preg_replace('/[$,\s]/', '', $term) ?? '';

            $query->where(function (Builder $q) use ($term, $like, $amount) {
                $q->where('transaction_reference', 'like', $like)
                    ->orWhere('notes', 'like', $like)
                    ->orWhere('payment_method', 'like', $like)
                    ->orWhereHas('client', function (Builder $q) use ($like) {
                        $q->where('client_number', 'like', $like)
                            ->orWhere('name', 'like', $like)
                            ->orWhere('company', 'like', $like);
                    })
                    ->orWhereHas('client.lead', function (Builder $q) use ($like) {
                        $q->where('name', 'like', $like)
                            ->orWhere('company', 'like', $like);
                    })
                    ->orWhereHas('client.assignedUser', fn (Builder $q) => $q->where('name', 'like', $like))
                    ->orWhereHas('createdBy', fn (Builder $q) => $q->where('name', 'like', $like));

                if (preg_match('/^(?:INV-)?0*(\d+)$/i', $term, $match)) {
                    $q->orWhere('id', (int) $match[1]);
                }

                if ($amount !== '' && is_numeric($amount)) {
                    $q->orWhere('invoice_amount', $amount)
                        ->orWhere('amount_received', $amount);
                }
            });
        }

        if ($filters['payment_method']) {
            $query->where('payment_method', $filters['payment_method']);
        }

        if ($filters['client_id']) {
            $query->where('client_id', $filters['client_id']);
        }

        if ($filters['company']) {
            $company = $filters['company'];
            $query->whereHas('client', function (Builder $q) use ($company) {
                $q->where('company', $company)
                    ->orWhereHas('lead', fn (Builder $q) => $q->where('company', $company));
            });
        }

        if ($filters['status']) {
            match ($filters['status']) {
                'paid' => $query->where('amount_received', '>', 0)->whereColumn('amount_received', '>=', 'invoice_amount'),
                'partial' => $query->where('amount_received', '>', 0)->whereColumn('amount_received', '<', 'invoice_amount'),
                'unpaid' => $query->where('amount_received', '<=', 0),
                default => null,
            };
        }

        $dateExpr = 'DATE(COALESCE(paid_at, created_at))';

        if ($filters['date_from']) {
            $query->whereRaw("{$dateExpr} >= ?", [$filters['date_from']]);
        }

        if ($filters['date_to']) {
            $query->whereRaw("{$dateExpr} <= ?", [$filters['date_to']]);
        }
    }
}
