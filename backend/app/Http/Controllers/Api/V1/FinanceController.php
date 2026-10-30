<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\CashHandover;
use App\Models\Expense;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class FinanceController extends Controller
{
    // ---- PAYMENTS ----

    public function payments(Request $request): JsonResponse
    {
        $this->authorize('viewPayments', Payment::class);

        $user = $request->user();

        $query = Payment::with(['parcel:id,tracking_number,recipient_name', 'collectedBy:id,name'])
            ->when($request->payment_type, fn($q) => $q->where('payment_type', $request->payment_type))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->staff_id, fn($q) => $q->where('collected_by_id', $request->staff_id))
            ->when($request->date_from, fn($q) => $q->whereDate('collected_at', '>=', $request->date_from))
            ->when($request->date_to, fn($q) => $q->whereDate('collected_at', '<=', $request->date_to))
            ->orderBy('collected_at', 'desc');

        // Delivery staff can only see their own payments
        if ($user->isDeliveryStaff()) {
            $query->where('collected_by_id', $user->id);
        }

        $payments = $query->paginate($request->per_page ?? 20);

        return response()->json([
            'data' => $payments->map(fn($p) => $this->formatPayment($p)),
            'meta' => [
                'current_page' => $payments->currentPage(),
                'last_page' => $payments->lastPage(),
                'per_page' => $payments->perPage(),
                'total' => $payments->total(),
                'totals' => [
                    'delivery_fee' => $query->clone()->where('payment_type', 'DELIVERY_FEE')->sum('amount'),
                    'cod' => $query->clone()->where('payment_type', 'COD')->sum('amount'),
                ],
            ],
        ]);
    }

    // ---- EXPENSES ----

    public function expenses(Request $request): JsonResponse
    {
        $this->authorize('viewExpenses', Expense::class);

        $query = Expense::with('recordedBy:id,name')
            ->active()
            ->when($request->category, fn($q) => $q->where('category', $request->category))
            ->when($request->date_from, fn($q) => $q->where('expense_date', '>=', $request->date_from))
            ->when($request->date_to, fn($q) => $q->where('expense_date', '<=', $request->date_to))
            ->orderBy('expense_date', 'desc');

        $expenses = $query->paginate($request->per_page ?? 20);

        return response()->json([
            'data' => $expenses->map(fn($e) => $this->formatExpense($e)),
            'meta' => [
                'current_page' => $expenses->currentPage(),
                'last_page' => $expenses->lastPage(),
                'per_page' => $expenses->perPage(),
                'total' => $expenses->total(),
                'total_amount' => $query->sum('amount'),
            ],
        ]);
    }

    public function storeExpense(Request $request): JsonResponse
    {
        $this->authorize('createExpense', Expense::class);

        $validated = $request->validate([
            'category' => ['required', 'string', 'max:100'],
            'description' => ['required', 'string'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'expense_date' => ['required', 'date'],
            'receipt' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ]);

        $receiptPath = null;
        if ($request->hasFile('receipt')) {
            $receiptPath = $request->file('receipt')->store('expenses', 'local');
        }

        $expense = Expense::create([
            'recorded_by_id' => $request->user()->id,
            'category' => $validated['category'],
            'description' => $validated['description'],
            'amount' => $validated['amount'],
            'expense_date' => $validated['expense_date'],
            'receipt_path' => $receiptPath,
        ]);

        ActivityLog::record('expense.created', $expense, [], $expense->toArray());

        return response()->json([
            'data' => $this->formatExpense($expense->load('recordedBy')),
            'message' => 'Expense recorded successfully',
        ], 201);
    }

    public function voidExpense(Request $request, Expense $expense): JsonResponse
    {
        $this->authorize('voidExpense', $expense);

        if ($expense->is_voided) {
            return response()->json(['message' => 'Expense is already voided.'], 422);
        }

        $validated = $request->validate([
            'void_reason' => ['required', 'string', 'min:5'],
        ]);

        $expense->update([
            'is_voided' => true,
            'void_reason' => $validated['void_reason'],
            'voided_by_id' => $request->user()->id,
            'voided_at' => now(),
        ]);

        ActivityLog::record('expense.voided', $expense, [], ['void_reason' => $validated['void_reason']]);

        return response()->json([
            'data' => $this->formatExpense($expense->fresh()),
            'message' => 'Expense voided successfully',
        ]);
    }

    // ---- CASH HANDOVERS ----

    public function handovers(Request $request): JsonResponse
    {
        $this->authorize('viewHandovers', CashHandover::class);

        $user = $request->user();

        $query = CashHandover::with(['staff:id,name', 'verifiedBy:id,name'])
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->staff_id, fn($q) => $q->where('staff_id', $request->staff_id))
            ->when($request->date_from, fn($q) => $q->whereDate('submitted_at', '>=', $request->date_from))
            ->when($request->date_to, fn($q) => $q->whereDate('submitted_at', '<=', $request->date_to))
            ->orderBy('created_at', 'desc');

        if ($user->isDeliveryStaff()) {
            $query->where('staff_id', $user->id);
        }

        $handovers = $query->paginate($request->per_page ?? 20);

        return response()->json([
            'data' => $handovers->map(fn($h) => $this->formatHandover($h)),
            'meta' => [
                'current_page' => $handovers->currentPage(),
                'last_page' => $handovers->lastPage(),
                'per_page' => $handovers->perPage(),
                'total' => $handovers->total(),
            ],
        ]);
    }

    public function submitHandover(Request $request): JsonResponse
    {
        $this->authorize('submitHandover', CashHandover::class);

        $user = $request->user();

        $validated = $request->validate([
            'period_start' => ['required', 'date'],
            'period_end' => ['required', 'date', 'after_or_equal:period_start'],
            'submitted_amount' => ['required', 'numeric', 'min:0'],
            'submission_notes' => ['nullable', 'string'],
        ]);

        // Calculate expected amount from collected (not yet handed over) payments
        $expectedAmount = Payment::where('collected_by_id', $user->id)
            ->where('status', 'COLLECTED')
            ->whereBetween('collected_at', [$validated['period_start'], $validated['period_end']])
            ->sum('amount');

        DB::beginTransaction();

        try {
            $handover = CashHandover::create([
                'staff_id' => $user->id,
                'submitted_by_id' => $user->id,
                'expected_amount' => $expectedAmount,
                'submitted_amount' => $validated['submitted_amount'],
                'status' => 'SUBMITTED',
                'submission_notes' => $validated['submission_notes'] ?? null,
                'period_start' => $validated['period_start'],
                'period_end' => $validated['period_end'],
                'submitted_at' => now(),
            ]);

            // Mark payments as HANDED_OVER
            Payment::where('collected_by_id', $user->id)
                ->where('status', 'COLLECTED')
                ->whereBetween('collected_at', [$validated['period_start'], $validated['period_end']])
                ->update(['status' => 'HANDED_OVER', 'handover_id' => $handover->id]);

            ActivityLog::record('handover.submitted', $handover, [], $handover->toArray());

            DB::commit();

            return response()->json([
                'data' => $this->formatHandover($handover->load(['staff', 'verifiedBy'])),
                'message' => 'Cash handover submitted successfully',
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function verifyHandover(Request $request, CashHandover $handover): JsonResponse
    {
        $this->authorize('verifyHandover', $handover);

        if ($handover->status !== 'SUBMITTED') {
            return response()->json(['message' => 'Only submitted handovers can be verified.'], 422);
        }

        $validated = $request->validate([
            'verified_amount' => ['required', 'numeric', 'min:0'],
            'verification_notes' => ['nullable', 'string'],
            'status' => ['required', 'string', Rule::in(['VERIFIED', 'DISPUTED'])],
        ]);

        $discrepancy = $validated['verified_amount'] - $handover->expected_amount;

        DB::beginTransaction();

        try {
            $handover->update([
                'verified_by_id' => $request->user()->id,
                'verified_amount' => $validated['verified_amount'],
                'discrepancy' => $discrepancy,
                'status' => $validated['status'],
                'verification_notes' => $validated['verification_notes'] ?? null,
                'verified_at' => now(),
            ]);

            // If verified, mark payments as RECONCILED
            if ($validated['status'] === 'VERIFIED') {
                Payment::where('handover_id', $handover->id)->update(['status' => 'RECONCILED']);
            }

            ActivityLog::record('handover.verified', $handover, [], [
                'status' => $validated['status'],
                'discrepancy' => $discrepancy,
            ]);

            DB::commit();

            return response()->json([
                'data' => $this->formatHandover($handover->fresh(['staff', 'verifiedBy'])),
                'message' => "Handover {$validated['status']}",
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    // ---- REPORTS ----

    public function financialSummary(Request $request): JsonResponse
    {
        $this->authorize('viewFinancialReports', Payment::class);

        $dateFrom = $request->date_from ?? today()->startOfMonth()->toDateString();
        $dateTo = $request->date_to ?? today()->toDateString();

        $deliveryFees = Payment::where('payment_type', 'DELIVERY_FEE')
            ->whereBetween('collected_at', [$dateFrom, "{$dateTo} 23:59:59"])
            ->sum('amount');

        $codCollected = Payment::where('payment_type', 'COD')
            ->whereBetween('collected_at', [$dateFrom, "{$dateTo} 23:59:59"])
            ->sum('amount');

        $expenses = Expense::active()
            ->whereBetween('expense_date', [$dateFrom, $dateTo])
            ->sum('amount');

        $pendingHandovers = CashHandover::where('status', 'SUBMITTED')->count();
        $pendingPayments = Payment::where('status', 'COLLECTED')->sum('amount');

        return response()->json([
            'data' => [
                'period' => ['from' => $dateFrom, 'to' => $dateTo],
                'delivery_fees_collected' => (float) $deliveryFees,
                'cod_collected' => (float) $codCollected,
                'total_expenses' => (float) $expenses,
                'net_income' => (float) ($deliveryFees - $expenses),
                'pending_payments' => (float) $pendingPayments,
                'pending_handovers_count' => $pendingHandovers,
            ],
        ]);
    }

    private function formatPayment(Payment $p): array
    {
        return [
            'id' => $p->id,
            'parcel' => $p->parcel ? [
                'id' => $p->parcel->id,
                'tracking_number' => $p->parcel->tracking_number,
                'recipient_name' => $p->parcel->recipient_name,
            ] : null,
            'payment_type' => $p->payment_type,
            'amount' => $p->amount,
            'status' => $p->status,
            'collected_by' => $p->collectedBy ? ['id' => $p->collectedBy->id, 'name' => $p->collectedBy->name] : null,
            'collected_at' => $p->collected_at->toISOString(),
            'notes' => $p->notes,
        ];
    }

    private function formatExpense(Expense $e): array
    {
        return [
            'id' => $e->id,
            'category' => $e->category,
            'description' => $e->description,
            'amount' => $e->amount,
            'expense_date' => $e->expense_date->toDateString(),
            'is_voided' => $e->is_voided,
            'void_reason' => $e->void_reason,
            'recorded_by' => $e->recordedBy ? ['id' => $e->recordedBy->id, 'name' => $e->recordedBy->name] : null,
            'created_at' => $e->created_at->toISOString(),
        ];
    }

    private function formatHandover(CashHandover $h): array
    {
        return [
            'id' => $h->id,
            'staff' => $h->staff ? ['id' => $h->staff->id, 'name' => $h->staff->name] : null,
            'verified_by' => $h->verifiedBy ? ['id' => $h->verifiedBy->id, 'name' => $h->verifiedBy->name] : null,
            'expected_amount' => $h->expected_amount,
            'submitted_amount' => $h->submitted_amount,
            'verified_amount' => $h->verified_amount,
            'discrepancy' => $h->discrepancy,
            'status' => $h->status,
            'submission_notes' => $h->submission_notes,
            'verification_notes' => $h->verification_notes,
            'period_start' => $h->period_start?->toISOString(),
            'period_end' => $h->period_end?->toISOString(),
            'submitted_at' => $h->submitted_at?->toISOString(),
            'verified_at' => $h->verified_at?->toISOString(),
            'created_at' => $h->created_at->toISOString(),
        ];
    }
}
