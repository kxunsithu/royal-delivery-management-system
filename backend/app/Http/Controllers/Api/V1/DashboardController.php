<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\CashHandover;
use App\Models\DeliveryAssignment;
use App\Models\DeliveryAttempt;
use App\Models\Expense;
use App\Models\Parcel;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        return match (true) {
            $user->isAdmin()        => $this->adminDashboard(),
            $user->isManager()      => $this->managerDashboard(),
            $user->isAccountant()   => $this->accountantDashboard(),
            $user->isDeliveryStaff()=> $this->staffDashboard($user),
            default                 => response()->json(['message' => 'Unknown role'], 403),
        };
    }

    private function adminDashboard(): JsonResponse
    {
        $today = today();

        $parcelStats = Parcel::selectRaw("
            COUNT(*) as total,
            SUM(CASE WHEN DATE(received_at) = ? THEN 1 ELSE 0 END) as today,
            SUM(CASE WHEN status IN ('ASSIGNED','OUT_FOR_DELIVERY','READY_FOR_DELIVERY','RECEIVED_AT_MYAWADDY','RECEIVED_AT_MAE_SOT','VERIFIED') THEN 1 ELSE 0 END) as in_progress,
            SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) as delivered,
            SUM(CASE WHEN status = 'DELIVERY_FAILED' THEN 1 ELSE 0 END) as failed,
            SUM(CASE WHEN status IN ('RETURNED_TO_SENDER','RETURN_TO_OFFICE') THEN 1 ELSE 0 END) as returned
        ", [$today->toDateString()])->first();

        $deliveryRate = $parcelStats->delivered > 0 && ($parcelStats->delivered + $parcelStats->failed) > 0
            ? round($parcelStats->delivered / ($parcelStats->delivered + $parcelStats->failed) * 100, 1)
            : 0;

        $financialStats = [
            'total_delivery_fees' => (float) Payment::where('payment_type', 'DELIVERY_FEE')->sum('amount'),
            'today_delivery_fees' => (float) Payment::where('payment_type', 'DELIVERY_FEE')->whereDate('collected_at', $today)->sum('amount'),
            'outstanding_cod' => (float) Payment::where('payment_type', 'COD')->where('status', 'COLLECTED')->sum('amount'),
            'pending_handovers' => CashHandover::where('status', 'SUBMITTED')->count(),
        ];

        // Delivery trends for last 7 days
        $trends = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = today()->subDays($i);
            $trends[] = [
                'date' => $date->toDateString(),
                'received' => Parcel::whereDate('received_at', $date)->count(),
                'delivered' => Parcel::where('status', 'DELIVERED')->whereDate('updated_at', $date)->count(),
                'failed' => Parcel::where('status', 'DELIVERY_FAILED')->whereDate('updated_at', $date)->count(),
            ];
        }

        return response()->json([
            'data' => [
                'role' => 'admin',
                'parcel_stats' => [
                    'total' => (int) $parcelStats->total,
                    'today' => (int) $parcelStats->today,
                    'in_progress' => (int) $parcelStats->in_progress,
                    'delivered' => (int) $parcelStats->delivered,
                    'failed' => (int) $parcelStats->failed,
                    'returned' => (int) $parcelStats->returned,
                    'delivery_success_rate' => $deliveryRate,
                ],
                'financial_stats' => $financialStats,
                'trends' => $trends,
                'active_staff_count' => User::active()->deliveryStaff()->count(),
            ],
        ]);
    }

    private function managerDashboard(): JsonResponse
    {
        $today = today();

        $statuses = Parcel::selectRaw("
            SUM(CASE WHEN status = 'RECEIVED_AT_MYAWADDY' THEN 1 ELSE 0 END) as received,
            SUM(CASE WHEN status = 'VERIFIED' THEN 1 ELSE 0 END) as verified,
            SUM(CASE WHEN status = 'READY_FOR_DELIVERY' THEN 1 ELSE 0 END) as ready,
            SUM(CASE WHEN status = 'ASSIGNED' THEN 1 ELSE 0 END) as assigned,
            SUM(CASE WHEN status = 'OUT_FOR_DELIVERY' THEN 1 ELSE 0 END) as out_for_delivery,
            SUM(CASE WHEN status = 'DELIVERY_FAILED' THEN 1 ELSE 0 END) as failed,
            SUM(CASE WHEN status = 'RETURN_TO_OFFICE' THEN 1 ELSE 0 END) as return_to_office
        ")->first();

        $staffWorkload = DeliveryAssignment::selectRaw("
            staff_id, COUNT(*) as active_count
        ")
            ->where('status', 'ACTIVE')
            ->with('staff:id,name')
            ->groupBy('staff_id')
            ->orderByDesc('active_count')
            ->limit(10)
            ->get()
            ->map(fn($w) => [
                'staff_name' => $w->staff?->name ?? 'Unknown',
                'active_count' => $w->active_count,
            ]);

        return response()->json([
            'data' => [
                'role' => 'manager',
                'parcel_stats' => [
                    'received' => (int) $statuses->received,
                    'verified' => (int) $statuses->verified,
                    'ready_for_delivery' => (int) $statuses->ready,
                    'assigned' => (int) $statuses->assigned,
                    'out_for_delivery' => (int) $statuses->out_for_delivery,
                    'failed' => (int) $statuses->failed,
                    'return_to_office' => (int) $statuses->return_to_office,
                ],
                'today_received' => Parcel::whereDate('received_at', $today)->count(),
                'staff_workload' => $staffWorkload,
            ],
        ]);
    }

    private function accountantDashboard(): JsonResponse
    {
        $today = today();

        $todayPayments = Payment::whereDate('collected_at', $today);

        $todayDeliveryFees = (float) (clone $todayPayments)->where('payment_type', 'DELIVERY_FEE')->sum('amount');
        $todayCod = (float) (clone $todayPayments)->where('payment_type', 'COD')->sum('amount');

        $thisMonthStart = today()->startOfMonth();
        $monthlyExpenses = (float) Expense::active()->where('expense_date', '>=', $thisMonthStart)->sum('amount');
        $monthlyFees = (float) Payment::where('payment_type', 'DELIVERY_FEE')->where('collected_at', '>=', $thisMonthStart)->sum('amount');

        return response()->json([
            'data' => [
                'role' => 'accountant',
                'today' => [
                    'delivery_fees' => $todayDeliveryFees,
                    'cod_collected' => $todayCod,
                    'total_collected' => $todayDeliveryFees + $todayCod,
                ],
                'pending' => [
                    'unverified_handovers' => CashHandover::where('status', 'SUBMITTED')->count(),
                    'outstanding_payments' => (float) Payment::where('status', 'COLLECTED')->sum('amount'),
                ],
                'monthly' => [
                    'delivery_fees' => $monthlyFees,
                    'expenses' => $monthlyExpenses,
                    'net_income' => $monthlyFees - $monthlyExpenses,
                ],
                'recent_handovers' => CashHandover::with('staff:id,name')
                    ->orderByDesc('created_at')
                    ->limit(5)
                    ->get()
                    ->map(fn($h) => [
                        'id' => $h->id,
                        'staff_name' => $h->staff?->name,
                        'submitted_amount' => $h->submitted_amount,
                        'status' => $h->status,
                        'submitted_at' => $h->submitted_at?->toISOString(),
                    ]),
            ],
        ]);
    }

    private function staffDashboard(User $user): JsonResponse
    {
        $today = today();

        $myAssignments = DeliveryAssignment::where('staff_id', $user->id);
        $myPayments = Payment::where('collected_by_id', $user->id);

        return response()->json([
            'data' => [
                'role' => 'delivery_staff',
                'assignments' => [
                    'active' => (clone $myAssignments)->where('status', 'ACTIVE')->count(),
                    'completed_today' => (clone $myAssignments)->where('status', 'COMPLETED')->whereDate('completed_at', $today)->count(),
                    'total_completed' => (clone $myAssignments)->where('status', 'COMPLETED')->count(),
                ],
                'attempts_today' => DeliveryAttempt::where('staff_id', $user->id)->whereDate('attempted_at', $today)->count(),
                'failed_today' => DeliveryAttempt::where('staff_id', $user->id)->whereDate('attempted_at', $today)->where('result', 'FAILED')->count(),
                'cash' => [
                    'collected_today' => (float) (clone $myPayments)->whereDate('collected_at', $today)->sum('amount'),
                    'pending_handover' => (float) (clone $myPayments)->where('status', 'COLLECTED')->sum('amount'),
                ],
                'pending_handovers' => CashHandover::where('staff_id', $user->id)->where('status', 'SUBMITTED')->count(),
            ],
        ]);
    }
}
