<?php

namespace Database\Seeders;

use App\Models\CashHandover;
use App\Models\DeliveryArea;
use App\Models\DeliveryAssignment;
use App\Models\DeliveryAttempt;
use App\Models\Parcel;
use App\Models\ParcelStatusHistory;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ParcelSeeder extends Seeder
{
    public function run(): void
    {
        $manager  = User::where('email', 'manager@royal-myawaddy.local')->firstOrFail();
        $staff1   = User::where('email', 'staff1@royal-myawaddy.local')->firstOrFail();
        $staff2   = User::where('email', 'staff2@royal-myawaddy.local')->firstOrFail();
        $staff3   = User::where('email', 'staff3@royal-myawaddy.local')->firstOrFail();
        $areas    = DeliveryArea::pluck('id')->toArray();

        $parcelsData = [
            // Delivered parcel
            [
                'tracking_number' => 'RMD-20241025-00001',
                'sender_name' => 'Mae Sot Shop A',
                'sender_phone' => '+66-55-000-001',
                'recipient_name' => 'Mg Aung Kyaw',
                'recipient_phone' => '+95-9-500-000-001',
                'delivery_address' => 'No. 12, Strand Road, Myawaddy',
                'delivery_area_id' => $areas[0] ?? null,
                'description' => 'Electronics - Smartphone',
                'quantity' => 1,
                'delivery_fee' => 5000,
                'cod_amount' => 0,
                'is_cod' => false,
                'status' => 'DELIVERED',
                'priority' => 'NORMAL',
                'received_at' => now()->subDays(3),
                'received_by_id' => $manager->id,
                'staff' => $staff1,
                'delivered' => true,
            ],
            // Out for delivery
            [
                'tracking_number' => 'RMD-20241026-00001',
                'sender_name' => 'Mae Sot Fashion',
                'sender_phone' => '+66-55-000-002',
                'recipient_name' => 'Ma Thandar',
                'recipient_phone' => '+95-9-500-000-002',
                'delivery_address' => 'No. 45, Township Road, Zone 2',
                'delivery_area_id' => $areas[1] ?? null,
                'description' => 'Clothing - 3 items',
                'quantity' => 3,
                'delivery_fee' => 3000,
                'cod_amount' => 45000,
                'is_cod' => true,
                'status' => 'OUT_FOR_DELIVERY',
                'priority' => 'NORMAL',
                'received_at' => now()->subDays(2),
                'received_by_id' => $manager->id,
                'staff' => $staff2,
                'delivered' => false,
            ],
            // Ready for delivery
            [
                'tracking_number' => 'RMD-20241027-00001',
                'sender_name' => null,
                'sender_phone' => null,
                'recipient_name' => 'Ko Zin Phyo',
                'recipient_phone' => '+95-9-500-000-003',
                'delivery_address' => 'No. 7, Market Street, Myawaddy',
                'delivery_area_id' => $areas[2] ?? null,
                'description' => 'Medicine',
                'quantity' => 2,
                'delivery_fee' => 4000,
                'cod_amount' => 0,
                'is_cod' => false,
                'status' => 'READY_FOR_DELIVERY',
                'priority' => 'HIGH',
                'received_at' => now()->subDay(),
                'received_by_id' => $manager->id,
                'staff' => null,
                'delivered' => false,
            ],
            // Received today
            [
                'tracking_number' => 'RMD-20241028-00001',
                'sender_name' => 'Mae Sot Electronics',
                'sender_phone' => '+66-55-000-003',
                'recipient_name' => 'U Kyaw Win',
                'recipient_phone' => '+95-9-500-000-004',
                'delivery_address' => 'No. 22, Industrial Zone',
                'delivery_area_id' => $areas[4] ?? null,
                'description' => 'Computer parts',
                'quantity' => 1,
                'delivery_fee' => 8000,
                'cod_amount' => 150000,
                'is_cod' => true,
                'status' => 'RECEIVED_AT_MYAWADDY',
                'priority' => 'URGENT',
                'received_at' => now(),
                'received_by_id' => $manager->id,
                'staff' => null,
                'delivered' => false,
            ],
            // Failed delivery
            [
                'tracking_number' => 'RMD-20241025-00002',
                'sender_name' => 'Mae Sot Pharmacy',
                'sender_phone' => '+66-55-000-004',
                'recipient_name' => 'Daw Su Su',
                'recipient_phone' => '+95-9-500-000-005',
                'delivery_address' => 'No. 88, Suburb Road, Myawaddy',
                'delivery_area_id' => $areas[6] ?? null,
                'description' => 'Vitamins',
                'quantity' => 1,
                'delivery_fee' => 3500,
                'cod_amount' => 0,
                'is_cod' => false,
                'status' => 'DELIVERY_FAILED',
                'priority' => 'NORMAL',
                'received_at' => now()->subDays(4),
                'received_by_id' => $manager->id,
                'staff' => $staff3,
                'delivered' => false,
            ],
            // Assigned
            [
                'tracking_number' => 'RMD-20241027-00002',
                'sender_name' => 'Mae Sot Goods',
                'sender_phone' => '+66-55-000-005',
                'recipient_name' => 'Ko Htun Lwin',
                'recipient_phone' => '+95-9-500-000-006',
                'delivery_address' => 'No. 15, Zone 1, Myawaddy',
                'delivery_area_id' => $areas[1] ?? null,
                'description' => 'Food items',
                'quantity' => 5,
                'delivery_fee' => 2500,
                'cod_amount' => 30000,
                'is_cod' => true,
                'status' => 'ASSIGNED',
                'priority' => 'NORMAL',
                'received_at' => now()->subDays(1),
                'received_by_id' => $manager->id,
                'staff' => $staff1,
                'delivered' => false,
            ],
        ];

        foreach ($parcelsData as $data) {
            $staff = $data['staff'];
            $delivered = $data['delivered'];
            unset($data['staff'], $data['delivered']);

            DB::transaction(function () use ($data, $staff, $delivered, $manager, $staff1) {
                $parcel = Parcel::firstOrCreate(
                    ['tracking_number' => $data['tracking_number']],
                    $data
                );

                // Create initial status history
                if ($parcel->wasRecentlyCreated) {
                    ParcelStatusHistory::create([
                        'parcel_id' => $parcel->id,
                        'from_status' => null,
                        'to_status' => 'RECEIVED_AT_MYAWADDY',
                        'changed_by_id' => $manager->id,
                        'reason' => 'Parcel received at Myawaddy office',
                    ]);

                    // Create assignment if staff assigned
                    if ($staff && in_array($parcel->status, ['ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELIVERY_FAILED'])) {
                        $assignment = DeliveryAssignment::create([
                            'parcel_id' => $parcel->id,
                            'staff_id' => $staff->id,
                            'assigned_by_id' => $manager->id,
                            'status' => $delivered ? 'COMPLETED' : 'ACTIVE',
                            'assigned_at' => $parcel->received_at->addHours(2),
                            'completed_at' => $delivered ? $parcel->received_at->addHours(5) : null,
                        ]);

                        // Transition history: assigned
                        ParcelStatusHistory::create([
                            'parcel_id' => $parcel->id,
                            'from_status' => 'READY_FOR_DELIVERY',
                            'to_status' => 'ASSIGNED',
                            'changed_by_id' => $manager->id,
                            'reason' => "Assigned to {$staff->name}",
                        ]);

                        if ($delivered) {
                            // Delivery attempt
                            $attempt = DeliveryAttempt::create([
                                'assignment_id' => $assignment->id,
                                'parcel_id' => $parcel->id,
                                'staff_id' => $staff->id,
                                'attempted_at' => $parcel->received_at->addHours(5),
                                'result' => 'DELIVERED',
                                'recipient_name' => $parcel->recipient_name,
                                'recipient_confirmation' => 'Received in good condition',
                                'delivery_fee_collected' => $parcel->delivery_fee,
                                'cod_collected' => $parcel->cod_amount,
                            ]);

                            // Payment records
                            if ($parcel->delivery_fee > 0) {
                                Payment::create([
                                    'parcel_id' => $parcel->id,
                                    'delivery_attempt_id' => $attempt->id,
                                    'collected_by_id' => $staff->id,
                                    'payment_type' => 'DELIVERY_FEE',
                                    'amount' => $parcel->delivery_fee,
                                    'collected_at' => $attempt->attempted_at,
                                    'status' => 'RECONCILED',
                                ]);
                            }

                            ParcelStatusHistory::create([
                                'parcel_id' => $parcel->id,
                                'from_status' => 'OUT_FOR_DELIVERY',
                                'to_status' => 'DELIVERED',
                                'changed_by_id' => $staff->id,
                                'reason' => 'Delivered successfully',
                            ]);
                        }

                        if ($parcel->status === 'DELIVERY_FAILED') {
                            DeliveryAttempt::create([
                                'assignment_id' => $assignment->id,
                                'parcel_id' => $parcel->id,
                                'staff_id' => $staff->id,
                                'attempted_at' => $parcel->received_at->addHours(4),
                                'result' => 'FAILED',
                                'failure_reason' => 'RECIPIENT_UNAVAILABLE',
                                'delivery_fee_collected' => 0,
                                'cod_collected' => 0,
                                'notes' => 'Phone not reachable, no one home',
                            ]);

                            ParcelStatusHistory::create([
                                'parcel_id' => $parcel->id,
                                'from_status' => 'OUT_FOR_DELIVERY',
                                'to_status' => 'DELIVERY_FAILED',
                                'changed_by_id' => $staff->id,
                                'reason' => 'Recipient unavailable',
                            ]);
                        }
                    }
                }
            });
        }

        $this->command->info('Sample parcels seeded.');
    }
}
