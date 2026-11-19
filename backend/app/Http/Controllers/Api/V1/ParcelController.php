<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Parcel;
use App\Models\ParcelImage;
use App\Models\ParcelStatusHistory;
use App\Models\DeliveryAssignment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ParcelController extends Controller
{
    /**
     * Search unique sender / recipient contacts from past parcels.
     * GET /parcels/contacts?search=...&type=sender|recipient|both&limit=8
     */
    public function contacts(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Parcel::class);

        $search = trim($request->input('search', ''));
        $type   = $request->input('type', 'both'); // sender | recipient | both
        $limit  = min((int) $request->input('limit', 8), 20);
        $term   = '%' . mb_strtolower($search) . '%';

        $results = collect();

        if ($type === 'sender' || $type === 'both') {
            $senders = Parcel::select('sender_name', 'sender_phone')
                ->whereNotNull('sender_name')
                ->whereNotNull('sender_phone')
                ->where(function ($q) use ($term) {
                    $q->whereRaw('LOWER(sender_name) LIKE ?', [$term])
                      ->orWhereRaw('LOWER(sender_phone) LIKE ?', [$term]);
                })
                ->groupBy('sender_name', 'sender_phone')
                ->orderByRaw('MAX(created_at) DESC')
                ->limit($limit)
                ->get()
                ->map(fn($p) => [
                    'type'  => 'sender',
                    'name'  => $p->sender_name,
                    'phone' => $p->sender_phone,
                ]);
            $results = $results->merge($senders);
        }

        if ($type === 'recipient' || $type === 'both') {
            $recipients = Parcel::select('recipient_name', 'recipient_phone', 'delivery_address')
                ->where(function ($q) use ($term) {
                    $q->whereRaw('LOWER(recipient_name) LIKE ?', [$term])
                      ->orWhereRaw('LOWER(recipient_phone) LIKE ?', [$term]);
                })
                ->groupBy('recipient_name', 'recipient_phone', 'delivery_address')
                ->orderByRaw('MAX(created_at) DESC')
                ->limit($limit)
                ->get()
                ->map(fn($p) => [
                    'type'             => 'recipient',
                    'name'             => $p->recipient_name,
                    'phone'            => $p->recipient_phone,
                    'delivery_address' => $p->delivery_address,
                ]);
            $results = $results->merge($recipients);
        }

        return response()->json(['data' => $results->take($limit)->values()]);
    }

    /**
     * Customer list: unique senders or recipients with parcel count.
     * GET /parcels/customers?type=recipient&search=&page=1&per_page=20
     */
    public function customers(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Parcel::class);

        $user = $request->user();
        if ($user?->isDeliveryStaff()) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        $type    = $request->input('type', 'recipient'); // sender | recipient
        $search  = trim($request->input('search', ''));
        $perPage = min((int) $request->input('per_page', 20), 100);
        $page    = max((int) $request->input('page', 1), 1);
        $term    = '%' . mb_strtolower($search) . '%';

        if ($type === 'sender') {
            $query = Parcel::select(
                    DB::raw('sender_name as name'),
                    DB::raw('sender_phone as phone'),
                    DB::raw('COUNT(*) as parcel_count'),
                    DB::raw('MAX(received_at) as last_parcel_at'),
                    DB::raw("SUM(CASE WHEN status = 'RECEIVED' THEN 1 ELSE 0 END) as received_count"),
                    DB::raw("SUM(CASE WHEN status = 'VERIFIED' THEN 1 ELSE 0 END) as verified_count"),
                    DB::raw("SUM(CASE WHEN status = 'IN_TRANSIT' THEN 1 ELSE 0 END) as in_transit_count"),
                    DB::raw("SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) as delivered_count"),
                    DB::raw("SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed_count"),
                    DB::raw("SUM(CASE WHEN status = 'DAMAGED' THEN 1 ELSE 0 END) as damaged_count")
                )
                ->whereNotNull('sender_name')
                ->whereNotNull('sender_phone')
                ->when($search, fn($q) => $q->where(function ($sq) use ($term) {
                    $sq->whereRaw('LOWER(sender_name) LIKE ?', [$term])
                       ->orWhereRaw('LOWER(sender_phone) LIKE ?', [$term]);
                }))
                ->groupBy('sender_name', 'sender_phone')
                ->orderByDesc('last_parcel_at');
        } else {
            $query = Parcel::select(
                    DB::raw('recipient_name as name'),
                    DB::raw('recipient_phone as phone'),
                    DB::raw('COUNT(*) as parcel_count'),
                    DB::raw('MAX(received_at) as last_parcel_at'),
                    DB::raw("SUM(CASE WHEN status = 'RECEIVED' THEN 1 ELSE 0 END) as received_count"),
                    DB::raw("SUM(CASE WHEN status = 'VERIFIED' THEN 1 ELSE 0 END) as verified_count"),
                    DB::raw("SUM(CASE WHEN status = 'IN_TRANSIT' THEN 1 ELSE 0 END) as in_transit_count"),
                    DB::raw("SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) as delivered_count"),
                    DB::raw("SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed_count"),
                    DB::raw("SUM(CASE WHEN status = 'DAMAGED' THEN 1 ELSE 0 END) as damaged_count")
                )
                ->when($search, fn($q) => $q->where(function ($sq) use ($term) {
                    $sq->whereRaw('LOWER(recipient_name) LIKE ?', [$term])
                       ->orWhereRaw('LOWER(recipient_phone) LIKE ?', [$term]);
                }))
                ->groupBy('recipient_name', 'recipient_phone')
                ->orderByDesc('last_parcel_at');
        }

        $allRows  = $query->get();
        $total    = $allRows->count();
        $lastPage = max(1, (int) ceil($total / $perPage));
        $rows     = $allRows->slice(($page - 1) * $perPage, $perPage);

        return response()->json([
            'data' => $rows->map(fn($r) => [
                'name'           => $r->name,
                'phone'          => $r->phone,
                'parcel_count'   => (int) $r->parcel_count,
                'received_count' => (int) $r->received_count,
                'verified_count' => (int) $r->verified_count,
                'in_transit_count' => (int) $r->in_transit_count,
                'delivered_count' => (int) $r->delivered_count,
                'failed_count'   => (int) $r->failed_count,
                'damaged_count'  => (int) $r->damaged_count,
                'last_parcel_at' => $r->last_parcel_at,
                'type'           => $type,
            ])->values(),
            'meta' => [
                'current_page' => $page,
                'last_page'    => $lastPage,
                'per_page'     => $perPage,
                'total'        => $total,
            ],
        ]);
    }

    /**
     * Daily summary: parcels grouped by received date.
     * GET /parcels/daily-summary?date_from=&date_to=
     * Accessible by admin, manager, accountant (viewAny policy).
     */
    public function dailySummary(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Parcel::class);

        // Reject delivery staff from this endpoint
        $user = $request->user();
        if ($user?->isDeliveryStaff()) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        $query = Parcel::query()
            ->select([
                DB::raw('DATE(received_at) as date'),
                DB::raw('COUNT(*) as parcel_count'),
                DB::raw('COUNT(DISTINCT sender_phone) as sender_count'),
                DB::raw('COUNT(DISTINCT recipient_phone) as recipient_count'),
                DB::raw("SUM(CASE WHEN status = 'RECEIVED' THEN 1 ELSE 0 END) as received_count"),
                DB::raw("SUM(CASE WHEN status = 'VERIFIED' THEN 1 ELSE 0 END) as verified_count"),
                DB::raw("SUM(CASE WHEN status = 'IN_TRANSIT' THEN 1 ELSE 0 END) as in_transit_count"),
                DB::raw("SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) as delivered_count"),
                DB::raw("SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed_count"),
                DB::raw("SUM(CASE WHEN status = 'DAMAGED' THEN 1 ELSE 0 END) as damaged_count"),
                DB::raw("SUM(CASE WHEN currency = 'MMK' THEN delivery_fee ELSE 0 END) as fee_mmk"),
                DB::raw("SUM(CASE WHEN currency = 'THB' THEN delivery_fee ELSE 0 END) as fee_thb"),
                DB::raw("SUM(CASE WHEN currency = 'MMK' AND is_cod = 1 THEN cod_amount ELSE 0 END) as cod_mmk"),
                DB::raw("SUM(CASE WHEN currency = 'THB' AND is_cod = 1 THEN cod_amount ELSE 0 END) as cod_thb"),
            ])
            ->whereNotNull('received_at')
            ->when($request->date_from, fn($q) => $q->whereRaw('DATE(received_at) >= ?', [$request->date_from]))
            ->when($request->date_to,   fn($q) => $q->whereRaw('DATE(received_at) <= ?', [$request->date_to]))
            ->groupBy(DB::raw('DATE(received_at)'))
            ->orderBy('date', 'desc');

        $rows = $query->get()->map(fn($row) => [
            'date'             => $row->date,
            'parcel_count'     => (int) $row->parcel_count,
            'sender_count'     => (int) $row->sender_count,
            'recipient_count'  => (int) $row->recipient_count,
            'received_count'   => (int) $row->received_count,
            'verified_count'   => (int) $row->verified_count,
            'in_transit_count' => (int) $row->in_transit_count,
            'delivered_count'  => (int) $row->delivered_count,
            'failed_count'     => (int) $row->failed_count,
            'damaged_count'    => (int) $row->damaged_count,
            'fee_mmk'          => (float) $row->fee_mmk,
            'fee_thb'          => (float) $row->fee_thb,
            'cod_mmk'          => (float) $row->cod_mmk,
            'cod_thb'          => (float) $row->cod_thb,
        ]);

        return response()->json(['data' => $rows]);
    }

    /**
     * Monthly summary: parcels grouped by received month.
     * GET /parcels/monthly-summary?date_from=&date_to=
     */
    public function monthlySummary(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Parcel::class);

        $user = $request->user();
        if ($user?->isDeliveryStaff()) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        $query = Parcel::query()
            ->select([
                DB::raw("strftime('%Y-%m', received_at) as month"),
                DB::raw('COUNT(*) as parcel_count'),
                DB::raw('COUNT(DISTINCT sender_phone) as sender_count'),
                DB::raw('COUNT(DISTINCT recipient_phone) as recipient_count'),
                DB::raw("SUM(CASE WHEN status = 'RECEIVED' THEN 1 ELSE 0 END) as received_count"),
                DB::raw("SUM(CASE WHEN status = 'VERIFIED' THEN 1 ELSE 0 END) as verified_count"),
                DB::raw("SUM(CASE WHEN status = 'IN_TRANSIT' THEN 1 ELSE 0 END) as in_transit_count"),
                DB::raw("SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) as delivered_count"),
                DB::raw("SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed_count"),
                DB::raw("SUM(CASE WHEN status = 'DAMAGED' THEN 1 ELSE 0 END) as damaged_count"),
                DB::raw("SUM(CASE WHEN currency = 'MMK' THEN delivery_fee ELSE 0 END) as fee_mmk"),
                DB::raw("SUM(CASE WHEN currency = 'THB' THEN delivery_fee ELSE 0 END) as fee_thb"),
                DB::raw("SUM(CASE WHEN currency = 'MMK' AND is_cod = 1 THEN cod_amount ELSE 0 END) as cod_mmk"),
                DB::raw("SUM(CASE WHEN currency = 'THB' AND is_cod = 1 THEN cod_amount ELSE 0 END) as cod_thb"),
                DB::raw('COUNT(DISTINCT DATE(received_at)) as day_count'),
            ])
            ->whereNotNull('received_at')
            ->when($request->date_from, fn($q) => $q->whereRaw('DATE(received_at) >= ?', [$request->date_from]))
            ->when($request->date_to,   fn($q) => $q->whereRaw('DATE(received_at) <= ?', [$request->date_to]))
            ->groupBy(DB::raw("strftime('%Y-%m', received_at)"))
            ->orderBy('month', 'desc');

        $rows = $query->get()->map(fn($row) => [
            'month'            => $row->month,
            'parcel_count'     => (int) $row->parcel_count,
            'sender_count'     => (int) $row->sender_count,
            'recipient_count'  => (int) $row->recipient_count,
            'received_count'   => (int) $row->received_count,
            'verified_count'   => (int) $row->verified_count,
            'in_transit_count' => (int) $row->in_transit_count,
            'delivered_count'  => (int) $row->delivered_count,
            'failed_count'     => (int) $row->failed_count,
            'damaged_count'    => (int) $row->damaged_count,
            'fee_mmk'          => (float) $row->fee_mmk,
            'fee_thb'          => (float) $row->fee_thb,
            'cod_mmk'          => (float) $row->cod_mmk,
            'cod_thb'          => (float) $row->cod_thb,
            'day_count'        => (int) $row->day_count,
        ]);

        return response()->json(['data' => $rows]);
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Parcel::class);

        $user = $request->user();

        $query = Parcel::with(['receivedBy', 'activeAssignment.staff', 'activeAssignment.assignedBy', 'images' => function ($q) {
            $q->orderBy('sort_order')->limit(1);
        }])
            ->when($request->search, fn($q) => $q->where(function ($sq) use ($request) {
                $term = '%' . strtolower($request->search) . '%';
                $sq->whereRaw('LOWER(tracking_number) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(sender_name) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(sender_phone) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(recipient_name) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(recipient_phone) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(delivery_address) LIKE ?', [$term]);
            }))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->priority, fn($q) => $q->where('priority', $request->priority))
            ->when($request->date_from, fn($q) => $q->whereRaw('DATE(received_at) >= ?', [$request->date_from]))
            ->when($request->date_to, fn($q) => $q->whereRaw('DATE(received_at) <= ?', [$request->date_to]))
            ->when($request->assigned_to, fn($q) => $q->whereHas('activeAssignment', fn($aq) => $aq->where('staff_id', $request->assigned_to)))
            ->when($request->assigned_by_id, fn($q) => $q->whereHas('activeAssignment', fn($aq) => $aq->where('assigned_by_id', $request->assigned_by_id)))
            ->orderBy($request->sort_by ?? 'received_at', $request->sort_dir ?? 'desc');

        // Delivery staff can only see their own assigned parcels
        if ($user->isDeliveryStaff()) {
            $query->whereHas('deliveryAssignments', fn($q) =>
                $q->where('staff_id', $user->id)
            )->distinct();
        }

        $parcels = $query->paginate($request->per_page ?? 20);

        return response()->json([
            'data' => $parcels->map(fn($p) => $this->formatParcel($p)),
            'meta' => [
                'current_page' => $parcels->currentPage(),
                'last_page' => $parcels->lastPage(),
                'per_page' => $parcels->perPage(),
                'total' => $parcels->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Parcel::class);

        $validated = $request->validate([
            'tracking_number' => ['nullable', 'string', 'max:50', 'unique:parcels,tracking_number'],
            'sender_name' => ['nullable', 'string', 'max:255'],
            'sender_phone' => ['nullable', 'string', 'max:30'],
            'recipient_name' => ['required', 'string', 'max:255'],
            'recipient_phone' => ['required', 'string', 'max:30'],
            'delivery_address' => ['required', 'string'],
            'description' => ['nullable', 'string'],
            'category' => ['nullable', 'string', 'max:255'],
            'weight' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'delivery_fee' => ['required', 'numeric', 'min:0'],
            'cod_amount' => ['numeric', 'min:0'],
            'is_cod' => ['boolean'],
            'currency' => ['required', 'string', Rule::in(['MMK', 'THB'])],
            'condition' => ['string', Rule::in(['GOOD', 'DAMAGED', 'MISSING'])],
            'priority' => ['string', Rule::in(['NORMAL', 'HIGH', 'URGENT'])],
            'received_at' => ['nullable', 'date'],
        ]);

        DB::beginTransaction();

        try {
            $parcel = Parcel::create([
                ...$validated,
                'tracking_number' => $validated['tracking_number'] ?? Parcel::generateTrackingNumber(),
                'status' => 'RECEIVED',
                'received_by_id' => $request->user()->id,
                'received_at' => $validated['received_at'] ?? now(),
                'delivery_fee' => $validated['delivery_fee'] ?? 0,
                'cod_amount' => $validated['cod_amount'] ?? 0,
                'is_cod' => $validated['is_cod'] ?? false,
                'currency' => $validated['currency'] ?? 'MMK',
                'condition' => $validated['condition'] ?? 'GOOD',
                'priority' => $validated['priority'] ?? 'NORMAL',
            ]);

            ParcelStatusHistory::create([
                'parcel_id' => $parcel->id,
                'from_status' => null,
                'to_status' => 'RECEIVED',
                'changed_by_id' => $request->user()->id,
                'reason' => 'Parcel registered at Mae Sot office',
            ]);

            ActivityLog::record('parcel.created', $parcel, [], $parcel->toArray());

            DB::commit();

            return response()->json([
                'data' => $this->formatParcel($parcel->load(['receivedBy'])),
                'message' => 'Parcel registered successfully',
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function show(Parcel $parcel): JsonResponse
    {
        $this->authorize('view', $parcel);

        $parcel->load([
            'receivedBy',
            'statusHistories.changedBy',
            'deliveryAssignments.staff',
            'deliveryAssignments.assignedBy',
            'deliveryAttempts.staff',
            'deliveryAttempts.proofOfDeliveries',
            'proofOfDeliveries.deliveryAttempt',
            'activeAssignment.staff',
            'images',
        ]);

        return response()->json([
            'data' => $this->formatParcelDetail($parcel),
        ]);
    }

    public function update(Request $request, Parcel $parcel): JsonResponse
    {
        $this->authorize('update', $parcel);

        if ($parcel->isTerminal()) {
            return response()->json(['message' => 'Cannot edit a parcel in a terminal status.'], 422);
        }

        $validated = $request->validate([
            'sender_name' => ['nullable', 'string', 'max:255'],
            'sender_phone' => ['nullable', 'string', 'max:30'],
            'recipient_name' => ['sometimes', 'string', 'max:255'],
            'recipient_phone' => ['sometimes', 'string', 'max:30'],
            'delivery_address' => ['sometimes', 'string'],
            'description' => ['nullable', 'string'],
            'category' => ['nullable', 'string', 'max:255'],
            'weight' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'delivery_fee' => ['sometimes', 'numeric', 'min:0'],
            'cod_amount' => ['sometimes', 'numeric', 'min:0'],
            'is_cod' => ['sometimes', 'boolean'],
            'currency' => ['sometimes', 'string', Rule::in(['MMK', 'THB'])],
            'condition' => ['sometimes', 'string', Rule::in(['GOOD', 'DAMAGED', 'MISSING'])],
            'priority' => ['sometimes', 'string', Rule::in(['NORMAL', 'HIGH', 'URGENT'])],
            'damage_description' => ['nullable', 'string'],
        ]);

        $oldValues = $parcel->toArray();
        $parcel->update($validated);

        ActivityLog::record('parcel.updated', $parcel, $oldValues, $parcel->fresh()->toArray());

        return response()->json([
            'data' => $this->formatParcel($parcel->fresh(['receivedBy'])),
            'message' => 'Parcel updated successfully',
        ]);
    }

    public function destroy(Parcel $parcel): JsonResponse
    {
        $this->authorize('delete', $parcel);

        $parcel->delete();

        ActivityLog::record('parcel.deleted', $parcel, $parcel->toArray(), []);

        return response()->json(['message' => 'Parcel deleted successfully']);
    }

    public function tracking(Parcel $parcel): JsonResponse
    {
        $this->authorize('view', $parcel);

        $parcel->load([
            'statusHistories.changedBy',
            'deliveryAssignments.staff',
            'deliveryAssignments.assignedBy',
            'deliveryAttempts.staff',
            'deliveryAttempts.proofOfDeliveries',
        ]);

        return response()->json([
            'data' => [
                'parcel_id' => $parcel->id,
                'tracking_number' => $parcel->tracking_number,
                'current_status' => $parcel->status,
                'status_histories' => $parcel->statusHistories->map(fn($h) => [
                    'id' => $h->id,
                    'from_status' => $h->from_status,
                    'to_status' => $h->to_status,
                    'reason' => $h->reason,
                    'notes' => $h->notes,
                    'changed_by' => $h->changedBy ? ['id' => $h->changedBy->id, 'name' => $h->changedBy->name] : null,
                    'created_at' => $h->created_at->toISOString(),
                ]),
            ],
        ]);
    }

    public function statusTransition(Request $request, Parcel $parcel): JsonResponse
    {
        $this->authorize('updateStatus', $parcel);

        $validated = $request->validate([
            'status' => ['required', 'string'],
            'reason' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        // Only delivery staff can mark a parcel as in transit
        if ($validated['status'] === 'IN_TRANSIT' && !$request->user()->isDeliveryStaff()) {
            return response()->json(['message' => 'Only delivery staff can mark a parcel as in transit.'], 403);
        }

        if (!$parcel->canTransitionTo($validated['status'])) {
            return response()->json([
                'message' => "Cannot transition from {$parcel->status} to {$validated['status']}.",
                'current_status' => $parcel->status,
                'requested_status' => $validated['status'],
            ], 422);
        }

        DB::beginTransaction();

        try {
            $oldStatus = $parcel->status;

            $parcel->update(['status' => $validated['status']]);

            ParcelStatusHistory::create([
                'parcel_id' => $parcel->id,
                'from_status' => $oldStatus,
                'to_status' => $validated['status'],
                'changed_by_id' => $request->user()->id,
                'reason' => $validated['reason'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);

            ActivityLog::record('parcel.status_changed', $parcel, ['status' => $oldStatus], ['status' => $validated['status']]);

            DB::commit();

            return response()->json([
                'data' => ['status' => $parcel->status],
                'message' => "Parcel status updated to {$validated['status']}",
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function assign(Request $request, Parcel $parcel): JsonResponse
    {
        $this->authorize('assign', $parcel);

        $validated = $request->validate([
            'staff_id' => ['required', 'integer', 'exists:users,id'],
            'notes' => ['nullable', 'string'],
        ]);

        if (!in_array($parcel->status, ['RECEIVED', 'VERIFIED', 'IN_TRANSIT', 'FAILED'])) {
            return response()->json([
                'message' => 'Parcel cannot be assigned in its current status.',
            ], 422);
        }

        // Verify staff is a delivery_staff role
        $staff = \App\Models\User::find($validated['staff_id']);
        if (!$staff->isDeliveryStaff()) {
            return response()->json(['message' => 'The selected user is not a delivery staff member.'], 422);
        }

        DB::beginTransaction();

        try {
            // Cancel existing active assignment
            $parcel->deliveryAssignments()->whereNotIn('status', ['COMPLETED', 'FAILED', 'REASSIGNED'])->update([
                'status' => 'REASSIGNED',
                'completed_at' => now(),
            ]);

            // Create new assignment
            $assignment = DeliveryAssignment::create([
                'parcel_id' => $parcel->id,
                'staff_id' => $validated['staff_id'],
                'assigned_by_id' => $request->user()->id,
                'status' => 'ACTIVE',
                'notes' => $validated['notes'] ?? null,
                'assigned_at' => now(),
            ]);

            // Update parcel status
            $oldStatus = $parcel->status;
            $parcel->update(['status' => 'IN_TRANSIT']);

            ParcelStatusHistory::create([
                'parcel_id' => $parcel->id,
                'from_status' => $oldStatus,
                'to_status' => 'IN_TRANSIT',
                'changed_by_id' => $request->user()->id,
                'reason' => "Assigned to staff: {$staff->name}",
                'notes' => $validated['notes'] ?? null,
            ]);

            ActivityLog::record('parcel.assigned', $parcel, [], [
                'staff_id' => $validated['staff_id'],
                'staff_name' => $staff->name,
            ]);

            DB::commit();

            return response()->json([
                'data' => [
                    'assignment' => [
                        'id' => $assignment->id,
                        'staff' => ['id' => $staff->id, 'name' => $staff->name],
                        'assigned_at' => $assignment->assigned_at->toISOString(),
                    ],
                    'parcel_status' => $parcel->status,
                ],
                'message' => "Parcel assigned to {$staff->name}",
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Upload one or more images for a parcel (max 10 per request, max 5 MB each).
     */
    public function uploadImages(Request $request, Parcel $parcel): JsonResponse
    {
        $this->authorize('update', $parcel);

        $request->validate([
            'images'   => ['required', 'array', 'min:1', 'max:10'],
            'images.*' => ['image', 'mimes:jpeg,png,jpg,webp', 'max:5120'],
        ]);

        $nextOrder = $parcel->images()->max('sort_order') ?? -1;
        $uploaded  = [];

        foreach ($request->file('images') as $file) {
            $nextOrder++;
            $path = $file->store('parcel-images', 'public');

            $image = ParcelImage::create([
                'parcel_id'     => $parcel->id,
                'path'          => $path,
                'original_name' => $file->getClientOriginalName(),
                'size'          => $file->getSize(),
                'mime_type'     => $file->getMimeType(),
                'sort_order'    => $nextOrder,
            ]);

            $uploaded[] = $this->formatImage($image);
        }

        ActivityLog::record('parcel.images_uploaded', $parcel, [], ['count' => count($uploaded)]);

        return response()->json([
            'data'    => $uploaded,
            'message' => count($uploaded) . ' image(s) uploaded successfully',
        ], 201);
    }

    /**
     * Delete a single image by its ID.
     */
    public function deleteImage(Parcel $parcel, ParcelImage $image): JsonResponse
    {
        $this->authorize('update', $parcel);

        if ((int) $image->parcel_id !== (int) $parcel->id) {
            return response()->json(['message' => 'Image does not belong to this parcel.'], 403);
        }

        $image->delete(); // fires model boot -> deletes file from disk

        ActivityLog::record('parcel.image_deleted', $parcel, [], ['image_id' => $image->id]);

        return response()->json(['message' => 'Image deleted successfully']);
    }

    private function formatImage(ParcelImage $image): array
    {
        return [
            'id'            => $image->id,
            'url'           => $image->url,
            'original_name' => $image->original_name,
            'size'          => $image->size,
            'mime_type'     => $image->mime_type,
            'sort_order'    => $image->sort_order,
            'created_at'    => $image->created_at->toISOString(),
        ];
    }

    private function formatParcel(Parcel $parcel): array
    {
        return [
            'id' => $parcel->id,
            'tracking_number' => $parcel->tracking_number,
            'sender_name' => $parcel->sender_name,
            'sender_phone' => $parcel->sender_phone,
            'recipient_name' => $parcel->recipient_name,
            'recipient_phone' => $parcel->recipient_phone,
            'delivery_address' => $parcel->delivery_address,
            'description' => $parcel->description,
            'category' => $parcel->category,
            'weight' => $parcel->weight,
            'notes' => $parcel->notes,
            'delivery_fee' => $parcel->delivery_fee,
            'cod_amount' => $parcel->cod_amount,
            'is_cod' => $parcel->is_cod,
            'currency' => $parcel->currency ?? 'MMK',
            'status' => $parcel->status,
            'condition' => $parcel->condition,
            'priority' => $parcel->priority,
            'received_at' => $parcel->received_at?->toISOString(),
            'delivered_at' => $parcel->delivered_at?->toISOString(),
            'failed_at' => $parcel->failed_at?->toISOString(),
            'received_by' => $parcel->receivedBy ? [
                'id' => $parcel->receivedBy->id,
                'name' => $parcel->receivedBy->name,
            ] : null,
            'active_assignment' => $parcel->relationLoaded('activeAssignment') && $parcel->activeAssignment ? [
                'id' => $parcel->activeAssignment->id,
                'staff' => $parcel->activeAssignment->staff ? [
                    'id' => $parcel->activeAssignment->staff->id,
                    'name' => $parcel->activeAssignment->staff->name,
                ] : null,
                'assigned_by' => $parcel->activeAssignment->relationLoaded('assignedBy') && $parcel->activeAssignment->assignedBy ? [
                    'id' => $parcel->activeAssignment->assignedBy->id,
                    'name' => $parcel->activeAssignment->assignedBy->name,
                ] : null,
                'assigned_at' => $parcel->activeAssignment->assigned_at->toISOString(),
            ] : null,
            'created_at' => $parcel->created_at->toISOString(),
            'updated_at' => $parcel->updated_at->toISOString(),
            'images'     => $parcel->relationLoaded('images')
                ? $parcel->images->map(fn($img) => $this->formatImage($img))->values()->all()
                : [],
        ];
    }

    private function formatParcelDetail(Parcel $parcel): array
    {
        $base = $this->formatParcel($parcel);

        $base['status_histories'] = $parcel->statusHistories->map(fn($h) => [
            'id' => $h->id,
            'from_status' => $h->from_status,
            'to_status' => $h->to_status,
            'reason' => $h->reason,
            'notes' => $h->notes,
            'changed_by' => $h->changedBy ? ['id' => $h->changedBy->id, 'name' => $h->changedBy->name] : null,
            'created_at' => $h->created_at->toISOString(),
        ]);

        $base['delivery_assignments'] = $parcel->deliveryAssignments->map(fn($a) => [
            'id' => $a->id,
            'staff' => $a->staff ? ['id' => $a->staff->id, 'name' => $a->staff->name] : null,
            'assigned_by' => $a->assignedBy ? ['id' => $a->assignedBy->id, 'name' => $a->assignedBy->name] : null,
            'status' => $a->status,
            'notes' => $a->notes,
            'assigned_at' => $a->assigned_at->toISOString(),
            'completed_at' => $a->completed_at?->toISOString(),
        ]);

        $base['delivery_attempts'] = $parcel->deliveryAttempts->map(fn($da) => [
            'id' => $da->id,
            'staff' => $da->staff ? ['id' => $da->staff->id, 'name' => $da->staff->name] : null,
            'attempted_at' => $da->attempted_at->toISOString(),
            'result' => $da->result,
            'failure_reason' => $da->failure_reason,
            'recipient_name' => $da->recipient_name,
            'notes' => $da->notes,
            'proof_photos' => $da->relationLoaded('proofOfDeliveries')
                ? $da->proofOfDeliveries->map(fn($p) => [
                    'id'       => $p->id,
                    'type'     => $p->type,
                    'file_url' => $p->file_url,
                    'notes'    => $p->notes,
                ])->values()->all()
                : [],
        ]);

        $proofs = collect();
        if ($parcel->relationLoaded('proofOfDeliveries')) {
            $proofs = $proofs->merge($parcel->proofOfDeliveries);
        }
        foreach ($parcel->deliveryAttempts as $da) {
            if ($da->relationLoaded('proofOfDeliveries')) {
                $proofs = $proofs->merge($da->proofOfDeliveries);
            }
        }

        $base['proof_photos'] = $proofs->unique('id')
            ->filter(fn($p) => !empty($p->file_url))
            ->map(fn($p) => [
                'id'             => $p->id,
                'type'           => $p->type,
                'file_url'       => $p->file_url,
                'notes'          => $p->notes,
                'attempt_result' => $p->deliveryAttempt?->result,
                'recipient_name' => $p->deliveryAttempt?->recipient_name,
                'attempted_at'   => $p->deliveryAttempt?->attempted_at?->toISOString(),
            ])
            ->values()
            ->all();

        $base['damage_description'] = $parcel->damage_description;
        $base['images'] = $parcel->images->map(fn($img) => $this->formatImage($img))->values()->all();

        return $base;
    }
}
