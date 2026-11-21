<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\DeliveryAssignment;
use App\Models\DeliveryAttempt;
use App\Models\Parcel;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        return match (true) {
            $user->isAdmin()         => $this->adminDashboard(),
            $user->isManager()       => $this->managerDashboard(),
            $user->isAccountant()    => $this->accountantDashboard(),
            $user->isDeliveryStaff() => $this->staffDashboard($user),
            default                  => $this->managerDashboard(),
        };
    }

    private function adminDashboard(): JsonResponse
    {
        $today = today();

        $parcelStats = Parcel::selectRaw("
            COUNT(*) as total,
            SUM(CASE WHEN DATE(received_at) = ? THEN 1 ELSE 0 END) as today,
            SUM(CASE WHEN status = 'RECEIVED' THEN 1 ELSE 0 END) as received,
            SUM(CASE WHEN status = 'VERIFIED' THEN 1 ELSE 0 END) as verified,
            SUM(CASE WHEN status = 'IN_TRANSIT' THEN 1 ELSE 0 END) as in_transit,
            SUM(CASE WHEN status IN ('RECEIVED','VERIFIED','IN_TRANSIT') THEN 1 ELSE 0 END) as in_progress,
            SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) as delivered,
            SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed,
            SUM(CASE WHEN status = 'DAMAGED' THEN 1 ELSE 0 END) as damaged
        ", [$today->toDateString()])->first();

        $deliveryRate = ($parcelStats->delivered + $parcelStats->failed) > 0
            ? round($parcelStats->delivered / ($parcelStats->delivered + $parcelStats->failed) * 100, 1)
            : 0;

        $totals = Parcel::selectRaw("
            COALESCE(SUM(CASE WHEN currency = 'MMK' THEN delivery_fee ELSE 0 END),0) as fee_mmk,
            COALESCE(SUM(CASE WHEN currency = 'THB' THEN delivery_fee ELSE 0 END),0) as fee_thb,
            COALESCE(SUM(CASE WHEN COALESCE(cod_currency, currency, 'MMK') = 'MMK' AND is_cod = 1 THEN cod_amount ELSE 0 END),0) as cod_mmk,
            COALESCE(SUM(CASE WHEN COALESCE(cod_currency, currency) = 'THB' AND is_cod = 1 THEN cod_amount ELSE 0 END),0) as cod_thb
        ")->first();

        $trends = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = today()->subDays($i);
            $trends[] = [
                'date'      => $date->toDateString(),
                'received'  => Parcel::whereDate('received_at', $date)->count(),
                'delivered' => Parcel::where('status', 'DELIVERED')->whereDate('updated_at', $date)->count(),
                'failed'    => Parcel::where('status', 'FAILED')->whereDate('updated_at', $date)->count(),
            ];
        }

        return response()->json([
            'data' => [
                'role' => 'admin',
                'parcel_stats' => [
                    'total'                => (int) $parcelStats->total,
                    'today'                => (int) $parcelStats->today,
                    'in_progress'          => (int) $parcelStats->in_progress,
                    'delivered'            => (int) $parcelStats->delivered,
                    'failed'               => (int) $parcelStats->failed,
                    'damaged'              => (int) $parcelStats->damaged,
                    'delivery_success_rate'=> $deliveryRate,
                ],
                'trends'             => $trends,
                'active_staff_count' => User::active()->deliveryStaff()->count(),
                'totals' => [
                    'fee_mmk' => (float) $totals->fee_mmk,
                    'fee_thb' => (float) $totals->fee_thb,
                    'cod_mmk' => (float) $totals->cod_mmk,
                    'cod_thb' => (float) $totals->cod_thb,
                ],
            ],
        ]);
    }

    private function managerDashboard(): JsonResponse
    {
        $today = today();

        $statuses = Parcel::selectRaw("
            COUNT(*) as total,
            SUM(CASE WHEN status = 'RECEIVED' THEN 1 ELSE 0 END) as received,
            SUM(CASE WHEN status = 'VERIFIED' THEN 1 ELSE 0 END) as verified,
            SUM(CASE WHEN status = 'IN_TRANSIT' THEN 1 ELSE 0 END) as out_for_delivery,
            SUM(CASE WHEN status = 'IN_TRANSIT' THEN 1 ELSE 0 END) as in_transit,
            SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) as delivered,
            SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed,
            SUM(CASE WHEN status = 'DAMAGED' THEN 1 ELSE 0 END) as damaged
        ")->first();

        $totals = Parcel::selectRaw("
            COALESCE(SUM(CASE WHEN currency = 'MMK' THEN delivery_fee ELSE 0 END),0) as fee_mmk,
            COALESCE(SUM(CASE WHEN currency = 'THB' THEN delivery_fee ELSE 0 END),0) as fee_thb,
            COALESCE(SUM(CASE WHEN COALESCE(cod_currency, currency, 'MMK') = 'MMK' AND is_cod = 1 THEN cod_amount ELSE 0 END),0) as cod_mmk,
            COALESCE(SUM(CASE WHEN COALESCE(cod_currency, currency) = 'THB' AND is_cod = 1 THEN cod_amount ELSE 0 END),0) as cod_thb
        ")->first();

        $staffWorkload = DeliveryAssignment::selectRaw("
            staff_id, COUNT(*) as active_count
        ")
            ->whereNotIn('status', ['COMPLETED', 'FAILED', 'REASSIGNED'])
            ->with('staff:id,name')
            ->groupBy('staff_id')
            ->orderByDesc('active_count')
            ->limit(10)
            ->get()
            ->map(fn($w) => [
                'staff_name'   => $w->staff?->name ?? 'Unknown',
                'active_count' => $w->active_count,
            ]);

        return response()->json([
            'data' => [
                'role' => 'manager',
                'parcel_stats' => [
                    'total'            => (int) $statuses->total,
                    'received'         => (int) $statuses->received,
                    'verified'         => (int) $statuses->verified,
                    'out_for_delivery' => (int) $statuses->out_for_delivery,
                    'in_transit'       => (int) $statuses->in_transit,
                    'delivered'        => (int) $statuses->delivered,
                    'failed'           => (int) $statuses->failed,
                    'damaged'          => (int) $statuses->damaged,
                ],
                'today_received' => Parcel::whereDate('received_at', $today)->count(),
                'staff_workload' => $staffWorkload,
                'totals' => [
                    'fee_mmk' => (float) $totals->fee_mmk,
                    'fee_thb' => (float) $totals->fee_thb,
                    'cod_mmk' => (float) $totals->cod_mmk,
                    'cod_thb' => (float) $totals->cod_thb,
                ],
            ],
        ]);
    }

    private function accountantDashboard(): JsonResponse
    {
        $today = today();

        $statuses = Parcel::selectRaw("
            COUNT(*) as total,
            SUM(CASE WHEN status = 'RECEIVED' THEN 1 ELSE 0 END) as received,
            SUM(CASE WHEN status = 'VERIFIED' THEN 1 ELSE 0 END) as verified,
            SUM(CASE WHEN status = 'IN_TRANSIT' THEN 1 ELSE 0 END) as out_for_delivery,
            SUM(CASE WHEN status = 'IN_TRANSIT' THEN 1 ELSE 0 END) as in_transit,
            SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) as delivered,
            SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed,
            SUM(CASE WHEN status = 'DAMAGED' THEN 1 ELSE 0 END) as damaged
        ")->first();

        $totals = Parcel::selectRaw("
            COALESCE(SUM(CASE WHEN currency = 'MMK' THEN delivery_fee ELSE 0 END),0) as fee_mmk,
            COALESCE(SUM(CASE WHEN currency = 'THB' THEN delivery_fee ELSE 0 END),0) as fee_thb,
            COALESCE(SUM(CASE WHEN COALESCE(cod_currency, currency, 'MMK') = 'MMK' AND is_cod = 1 THEN cod_amount ELSE 0 END),0) as cod_mmk,
            COALESCE(SUM(CASE WHEN COALESCE(cod_currency, currency) = 'THB' AND is_cod = 1 THEN cod_amount ELSE 0 END),0) as cod_thb
        ")->first();

        return response()->json([
            'data' => [
                'role' => 'accountant',
                'parcel_stats' => [
                    'total'            => (int) $statuses->total,
                    'received'         => (int) $statuses->received,
                    'verified'         => (int) $statuses->verified,
                    'out_for_delivery' => (int) $statuses->out_for_delivery,
                    'in_transit'       => (int) $statuses->in_transit,
                    'delivered'        => (int) $statuses->delivered,
                    'failed'           => (int) $statuses->failed,
                    'damaged'          => (int) $statuses->damaged,
                ],
                'today_received' => Parcel::whereDate('received_at', $today)->count(),
                'totals' => [
                    'fee_mmk' => (float) $totals->fee_mmk,
                    'fee_thb' => (float) $totals->fee_thb,
                    'cod_mmk' => (float) $totals->cod_mmk,
                    'cod_thb' => (float) $totals->cod_thb,
                ],
            ],
        ]);
    }

    private function staffDashboard(User $user): JsonResponse
    {
        $today = today();

        $myAssignments = DeliveryAssignment::where('staff_id', $user->id);

        $assignedParcelIds = (clone $myAssignments)->pluck('parcel_id');
        $totals = Parcel::whereIn('id', $assignedParcelIds)->selectRaw("
            COALESCE(SUM(CASE WHEN currency = 'MMK' THEN delivery_fee ELSE 0 END),0) as fee_mmk,
            COALESCE(SUM(CASE WHEN currency = 'THB' THEN delivery_fee ELSE 0 END),0) as fee_thb,
            COALESCE(SUM(CASE WHEN COALESCE(cod_currency, currency, 'MMK') = 'MMK' AND is_cod = 1 THEN cod_amount ELSE 0 END),0) as cod_mmk,
            COALESCE(SUM(CASE WHEN COALESCE(cod_currency, currency) = 'THB' AND is_cod = 1 THEN cod_amount ELSE 0 END),0) as cod_thb
        ")->first();

        return response()->json([
            'data' => [
                'role' => 'delivery_staff',
                'assignments' => [
                    'active' => (clone $myAssignments)->whereNotIn('status', ['COMPLETED', 'FAILED', 'REASSIGNED'])->count(),
                    'completed_today' => (clone $myAssignments)->where('status', 'COMPLETED')->whereDate('completed_at', $today)->count(),
                    'total_completed' => (clone $myAssignments)->where('status', 'COMPLETED')->count(),
                ],
                'attempts_today' => DeliveryAttempt::where('staff_id', $user->id)->whereDate('attempted_at', $today)->count(),
                'failed_today' => DeliveryAttempt::where('staff_id', $user->id)->whereDate('attempted_at', $today)->where('result', 'FAILED')->count(),
                'totals' => [
                    'fee_mmk' => (float) $totals->fee_mmk,
                    'fee_thb' => (float) $totals->fee_thb,
                    'cod_mmk' => (float) $totals->cod_mmk,
                    'cod_thb' => (float) $totals->cod_thb,
                ],
            ],
        ]);
    }
}
