<?php

namespace Database\Seeders;

use App\Models\DeliveryAssignment;
use App\Models\DeliveryAttempt;
use App\Models\Parcel;
use App\Models\ProofOfDelivery;
use App\Models\User;
use Illuminate\Database\Seeder;

class DeliveryAssignmentSeeder extends Seeder
{
    public function run(): void
    {
        $admin   = User::where('email', 'admin@gmail.com')->firstOrFail();
        $manager = User::where('email', 'mgmoe@gmail.com')->first() ?? $admin;

        // All delivery staff
        $staff = User::role('delivery_staff')->get();

        if ($staff->isEmpty()) {
            $this->command->warn('No delivery_staff users found. Skipping assignment seeder.');
            return;
        }

        // Get parcels — split into groups by status we want to seed
        $parcels = Parcel::orderBy('id')->get();

        if ($parcels->isEmpty()) {
            $this->command->warn('No parcels found. Run ParcelSeeder first.');
            return;
        }

        $total      = $parcels->count();
        $staffCount = $staff->count();
        $created    = 0;

        foreach ($parcels as $index => $parcel) {
            // Skip if already assigned
            if (DeliveryAssignment::where('parcel_id', $parcel->id)->exists()) {
                continue;
            }

            $assignedStaff = $staff[$index % $staffCount];
            $assignedBy    = ($index % 3 === 0) ? $manager : $admin;

            // Stagger assignment dates relative to parcel received_at
            $assignedAt = ($parcel->received_at ?? now())->copy()->addHours(rand(1, 6));

            // Decide scenario based on parcel index
            $scenario = $index % 5; // 0=DELIVERED, 1=FAILED, 2=IN_TRANSIT(attempted), 3=IN_TRANSIT(fresh), 4=PENDING

            if ($scenario === 4) {
                // ── Assignment (active) ───────────────
                DeliveryAssignment::create([
                    'parcel_id'      => $parcel->id,
                    'staff_id'       => $assignedStaff->id,
                    'assigned_by_id' => $assignedBy->id,
                    'status'         => 'ACTIVE',
                    'assigned_at'    => $assignedAt,
                    'notes'          => 'ပို့ဆောင်ရန် တာဝန်ပေးထားသည်',
                ]);

                $parcel->update(['status' => 'IN_TRANSIT']);
                $created++;
                continue;
            }

            if ($scenario === 3) {
                // ── IN_TRANSIT (fresh, no attempt yet) ───────────────────
                DeliveryAssignment::create([
                    'parcel_id'      => $parcel->id,
                    'staff_id'       => $assignedStaff->id,
                    'assigned_by_id' => $assignedBy->id,
                    'status'         => 'ACTIVE',
                    'assigned_at'    => $assignedAt,
                ]);

                $parcel->update(['status' => 'IN_TRANSIT']);
                $created++;
                continue;
            }

            if ($scenario === 2) {
                // ── IN_TRANSIT with one FAILED attempt, then re-assigned ─
                $assignment = DeliveryAssignment::create([
                    'parcel_id'      => $parcel->id,
                    'staff_id'       => $assignedStaff->id,
                    'assigned_by_id' => $assignedBy->id,
                    'status'         => 'ACTIVE',
                    'assigned_at'    => $assignedAt,
                ]);

                $failReasons = ['RECIPIENT_UNAVAILABLE', 'PHONE_UNREACHABLE', 'WRONG_ADDRESS', 'RESCHEDULED'];
                DeliveryAttempt::create([
                    'assignment_id'  => $assignment->id,
                    'parcel_id'      => $parcel->id,
                    'staff_id'       => $assignedStaff->id,
                    'attempted_at'   => $assignedAt->copy()->addHours(2),
                    'result'         => 'FAILED',
                    'failure_reason' => $failReasons[$index % count($failReasons)],
                    'notes'          => 'ပထမကြိမ် မအောင်မြင်ပါ၊ ထပ်မံကြိုးစားမည်',
                ]);

                $parcel->update(['status' => 'IN_TRANSIT']);
                $created++;
                continue;
            }

            if ($scenario === 1) {
                // ── FAILED delivery ───────────────────────────────────────
                $completedAt = $assignedAt->copy()->addHours(rand(2, 8));

                $assignment = DeliveryAssignment::create([
                    'parcel_id'      => $parcel->id,
                    'staff_id'       => $assignedStaff->id,
                    'assigned_by_id' => $assignedBy->id,
                    'status'         => 'FAILED',
                    'assigned_at'    => $assignedAt,
                    'completed_at'   => $completedAt,
                    'notes'          => 'ပို့ဆောင်မှု မအောင်မြင်ပါ',
                ]);

                DeliveryAttempt::create([
                    'assignment_id'  => $assignment->id,
                    'parcel_id'      => $parcel->id,
                    'staff_id'       => $assignedStaff->id,
                    'attempted_at'   => $completedAt,
                    'result'         => 'FAILED',
                    'failure_reason' => 'RECIPIENT_UNAVAILABLE',
                    'notes'          => 'လက်ခံသူ မရှိ၊ ဆက်သွယ်မရ',
                ]);

                $parcel->update(['status' => 'FAILED']);
                $created++;
                continue;
            }

            // ── scenario === 0: DELIVERED ─────────────────────────────────
            $completedAt = $assignedAt->copy()->addHours(rand(1, 5));

            $assignment = DeliveryAssignment::create([
                'parcel_id'      => $parcel->id,
                'staff_id'       => $assignedStaff->id,
                'assigned_by_id' => $assignedBy->id,
                'status'         => 'COMPLETED',
                'assigned_at'    => $assignedAt,
                'completed_at'   => $completedAt,
            ]);

            $attempt = DeliveryAttempt::create([
                'assignment_id'          => $assignment->id,
                'parcel_id'              => $parcel->id,
                'staff_id'              => $assignedStaff->id,
                'attempted_at'           => $completedAt,
                'result'                 => 'DELIVERED',
                'recipient_name'         => $parcel->recipient_name,
                'recipient_confirmation' => $parcel->recipient_name . ' မှ လက်ခံပြီးပါပြီ',
                'notes'                  => 'အောင်မြင်စွာ ပို့ဆောင်ပြီးပါပြီ',
            ]);

            // Seed proof of delivery photo for delivered parcel
            // Source: bundled asset in repo (always available, even on Render)
            $proofDir  = 'proof-of-delivery/' . $parcel->id;
            $proofPath = $proofDir . '/proof-sample.jpeg';
            $fullSource = database_path('seeders/assets/proof-sample.jpeg');
            $fullDest   = storage_path('app/public/' . $proofPath);

            if (is_file($fullSource)) {
                if (!is_dir(dirname($fullDest))) {
                    mkdir(dirname($fullDest), 0775, true);
                }
                copy($fullSource, $fullDest);
            }

            if (!ProofOfDelivery::where('delivery_attempt_id', $attempt->id)->exists()) {
                ProofOfDelivery::create([
                    'delivery_attempt_id' => $attempt->id,
                    'parcel_id'           => $parcel->id,
                    'type'                => 'PHOTO',
                    'file_path'           => $proofPath,
                    'notes'               => 'လက်ခံသူထံ ပို့ဆောင်ပြီးစီးကြောင်း သက်သေဓာတ်ပုံ',
                ]);
            }

            $parcel->update(['status' => 'DELIVERED']);
            $created++;
        }

        // Ensure all DELIVERED attempts have ProofOfDelivery and physical files exist on disk
        $sampleSource = database_path('seeders/assets/proof-sample.jpeg');
        $deliveredAttempts = DeliveryAttempt::where('result', 'DELIVERED')->get();
        foreach ($deliveredAttempts as $att) {
            $proof = ProofOfDelivery::firstOrCreate(
                ['delivery_attempt_id' => $att->id],
                [
                    'parcel_id' => $att->parcel_id,
                    'type'      => 'PHOTO',
                    'file_path' => 'proof-of-delivery/' . $att->parcel_id . '/proof-sample.jpeg',
                    'notes'     => 'လက်ခံသူထံ ပို့ဆောင်ပြီးစီးကြောင်း သက်သေဓာတ်ပုံ',
                ]
            );

            if (is_file($sampleSource)) {
                $fullDest = storage_path('app/public/' . $proof->file_path);
                if (!is_file($fullDest)) {
                    if (!is_dir(dirname($fullDest))) {
                        mkdir(dirname($fullDest), 0775, true);
                    }
                    copy($sampleSource, $fullDest);
                }
            }
        }

        // Also repair any ProofOfDelivery records whose physical files are missing on disk
        if (is_file($sampleSource)) {
            foreach (ProofOfDelivery::all() as $pod) {
                $dest = storage_path('app/public/' . $pod->file_path);
                if (!is_file($dest)) {
                    if (!is_dir(dirname($dest))) {
                        mkdir(dirname($dest), 0775, true);
                    }
                    copy($sampleSource, $dest);
                }
            }
        }

        $this->command->info("Delivery assignments seeded: {$created} assignments created.");
        $this->command->table(
            ['Staff', 'Role', 'Assigned Parcels'],
            $staff->map(fn($s) => [
                $s->name,
                'delivery_staff',
                DeliveryAssignment::where('staff_id', $s->id)->count(),
            ])->toArray()
        );
    }
}

