<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Client;
use App\Models\Payment;
use App\Models\Setting;
use App\Services\ActivityService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class PaymentController extends Controller
{
    public function __construct(private ActivityService $activity) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Payment::class);

        $user = Auth::user();

        $query = Payment::with(['client.lead', 'client.assignedUser', 'client.clientServices.service', 'createdBy'])
            ->visibleTo($user)
            ->when($request->search, function ($q, $v) {
                $term = trim((string) $v);
                $idTerm = preg_replace('/^INV-/i', '', $term) ?? $term;

                $q->where(function ($q) use ($term, $idTerm) {
                    $q->where('id', $idTerm)
                        ->orWhere('transaction_reference', 'like', "%{$term}%")
                        ->orWhereHas('client', function ($q) use ($term) {
                            $q->where('client_number', 'like', "%{$term}%")
                                ->orWhere('name', 'like', "%{$term}%")
                                ->orWhere('company', 'like', "%{$term}%");
                        })
                        ->orWhereHas('client.lead', function ($q) use ($term) {
                            $q->where('name', 'like', "%{$term}%")
                                ->orWhere('company', 'like', "%{$term}%");
                        });
                });
            })
            ->when($request->method, fn ($q, $v) => $q->where('payment_method', $v))
            ->when($request->date_from, fn ($q, $v) => $q->whereDate('paid_at', '>=', $v))
            ->when($request->date_to, fn ($q, $v) => $q->whereDate('paid_at', '<=', $v));

        $payments = $query->latest()->paginate(25)->withQueryString();

        $totals = Payment::query()->visibleTo($user)->selectRaw('
            SUM(invoice_amount) as total_invoiced,
            SUM(amount_received) as total_received,
            SUM(invoice_amount - amount_received) as total_balance
        ')->first();

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
            'totals'   => [
                'invoiced'  => (float) ($totals->total_invoiced ?? 0),
                'received'  => (float) ($totals->total_received ?? 0),
                'balance'   => (float) ($totals->total_balance ?? 0),
            ],
            'filters'  => $request->only(['search', 'method', 'date_from', 'date_to']),
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
        ]);

        $receipt = $request->file('receipt');
        unset($data['receipt']);

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

        return redirect()->route('clients.show', $client)
            ->with('success', 'Payment recorded.');
    }

    public function update(Request $request, Payment $payment): RedirectResponse
    {
        $this->authorize('update', $payment);

        $data = $request->validate([
            'invoice_amount'        => ['required', 'numeric', 'min:0'],
            'amount_received'       => ['nullable', 'numeric', 'min:0'],
            'payment_method'        => ['nullable', 'string', 'max:50'],
            'transaction_reference' => ['nullable', 'string', 'max:255'],
            'notes'                 => ['nullable', 'string'],
            'paid_at'               => ['nullable', 'date'],
        ]);

        $payment->update($data);

        $this->activity->log($payment->client, Activity::ACTION_PAYMENT_UPDATED,
            "Payment updated: \${$payment->invoice_amount} invoiced, \${$payment->amount_received} received"
        );

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
        $payment->delete();
        return back()->with('success', 'Payment deleted.');
    }
}
