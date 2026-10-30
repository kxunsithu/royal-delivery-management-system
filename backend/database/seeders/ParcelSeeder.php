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
            // ပါဆယ်ပို့ပြီးသောပစ္စည်း
            [
                'tracking_number' => 'RMD-20241025-00001',
                'sender_name'     => 'မဲဆောက် ဆိုင် A',
                'sender_phone'    => '+66-55-000-001',
                'recipient_name'  => 'မောင်အောင်ကျော်',
                'recipient_phone' => '+95-9-500-000-001',
                'delivery_address'=> 'အမှတ် ၁၂၊ ကမ်းနားလမ်း၊ မြဝတီမြို့',
                'delivery_area_id'=> $areas[0] ?? null,
                'description'     => 'အီလက်ထရောနစ် - စမတ်ဖုန်း',
                'quantity'        => 1,
                'delivery_fee'    => 5000,
                'cod_amount'      => 0,
                'is_cod'          => false,
                'status'          => 'DELIVERED',
                'priority'        => 'NORMAL',
                'received_at'     => now()->subDays(3),
                'received_by_id'  => $manager->id,
                'staff'           => $staff1,
                'delivered'       => true,
            ],
            // ပို့ဆောင်နေဆဲ
            [
                'tracking_number' => 'RMD-20241026-00001',
                'sender_name'     => 'မဲဆောက် ဖက်ရှင်ဆိုင်',
                'sender_phone'    => '+66-55-000-002',
                'recipient_name'  => 'မသန်းဒါး',
                'recipient_phone' => '+95-9-500-000-002',
                'delivery_address'=> 'အမှတ် ၄၅၊ မြို့နယ်လမ်း၊ ဇုန် ၂',
                'delivery_area_id'=> $areas[1] ?? null,
                'description'     => 'အဝတ်အထည် - ၃ ခု',
                'quantity'        => 3,
                'delivery_fee'    => 3000,
                'cod_amount'      => 45000,
                'is_cod'          => true,
                'status'          => 'OUT_FOR_DELIVERY',
                'priority'        => 'NORMAL',
                'received_at'     => now()->subDays(2),
                'received_by_id'  => $manager->id,
                'staff'           => $staff2,
                'delivered'       => false,
            ],
            // ပို့ဆောင်ရန် အဆင်သင့်
            [
                'tracking_number' => 'RMD-20241027-00001',
                'sender_name'     => null,
                'sender_phone'    => null,
                'recipient_name'  => 'ကိုဇင်ဖြိုး',
                'recipient_phone' => '+95-9-500-000-003',
                'delivery_address'=> 'အမှတ် ၇၊ ဈေးလမ်း၊ မြဝတီမြို့',
                'delivery_area_id'=> $areas[2] ?? null,
                'description'     => 'ဆေးဝါး',
                'quantity'        => 2,
                'delivery_fee'    => 4000,
                'cod_amount'      => 0,
                'is_cod'          => false,
                'status'          => 'READY_FOR_DELIVERY',
                'priority'        => 'HIGH',
                'received_at'     => now()->subDay(),
                'received_by_id'  => $manager->id,
                'staff'           => null,
                'delivered'       => false,
            ],
            // ယနေ့ လက်ခံရရှိသော
            [
                'tracking_number' => 'RMD-20241028-00001',
                'sender_name'     => 'မဲဆောက် အီလက်ထရောနစ်ဆိုင်',
                'sender_phone'    => '+66-55-000-003',
                'recipient_name'  => 'ဦးကျော်ဝင်း',
                'recipient_phone' => '+95-9-500-000-004',
                'delivery_address'=> 'အမှတ် ၂၂၊ စက်မှုဇုန်',
                'delivery_area_id'=> $areas[4] ?? null,
                'description'     => 'ကွန်ပျူတာ အပိုပစ္စည်းများ',
                'quantity'        => 1,
                'delivery_fee'    => 8000,
                'cod_amount'      => 150000,
                'is_cod'          => true,
                'status'          => 'RECEIVED_AT_MYAWADDY',
                'priority'        => 'URGENT',
                'received_at'     => now(),
                'received_by_id'  => $manager->id,
                'staff'           => null,
                'delivered'       => false,
            ],
            // ပို့ဆောင်မပြည့်မြောက်သော
            [
                'tracking_number' => 'RMD-20241025-00002',
                'sender_name'     => 'မဲဆောက် ဆေးဆိုင်',
                'sender_phone'    => '+66-55-000-004',
                'recipient_name'  => 'ဒေါ်စုစု',
                'recipient_phone' => '+95-9-500-000-005',
                'delivery_address'=> 'အမှတ် ၈၈၊ ပြင်ပလမ်း၊ မြဝတီမြို့',
                'delivery_area_id'=> $areas[6] ?? null,
                'description'     => 'ဗိုက်တာမင်များ',
                'quantity'        => 1,
                'delivery_fee'    => 3500,
                'cod_amount'      => 0,
                'is_cod'          => false,
                'status'          => 'DELIVERY_FAILED',
                'priority'        => 'NORMAL',
                'received_at'     => now()->subDays(4),
                'received_by_id'  => $manager->id,
                'staff'           => $staff3,
                'delivered'       => false,
            ],
            // သတ်မှတ်ပေးပြီးသော
            [
                'tracking_number' => 'RMD-20241027-00002',
                'sender_name'     => 'မဲဆောက် ကုန်ဆိုင်',
                'sender_phone'    => '+66-55-000-005',
                'recipient_name'  => 'ကိုထွန်းလွင်',
                'recipient_phone' => '+95-9-500-000-006',
                'delivery_address'=> 'အမှတ် ၁၅၊ ဇုန် ၁၊ မြဝတီမြို့',
                'delivery_area_id'=> $areas[1] ?? null,
                'description'     => 'စားသောက်ကုန်ပစ္စည်းများ',
                'quantity'        => 5,
                'delivery_fee'    => 2500,
                'cod_amount'      => 30000,
                'is_cod'          => true,
                'status'          => 'ASSIGNED',
                'priority'        => 'NORMAL',
                'received_at'     => now()->subDays(1),
                'received_by_id'  => $manager->id,
                'staff'           => $staff1,
                'delivered'       => false,
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
                        'reason' => 'မြဝတီရုံးတွင် ပါဆယ်လက်ခံရရှိသည်',
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
                            'reason' => "{$staff->name} သို့ သတ်မှတ်ပေးသည်",
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
                                'recipient_confirmation' => 'ကောင်းမွန်သောအခြေအနေဖြင့် လက်ခံရရှိသည်',
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
                                'reason' => 'အောင်မြင်စွာ ပို့ဆောင်ပြီးသည်',
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
                                'notes' => 'ဖုန်းမကောက်ပါ၊ အိမ်တွင် မရှိပါ',
                            ]);

                            ParcelStatusHistory::create([
                                'parcel_id' => $parcel->id,
                                'from_status' => 'OUT_FOR_DELIVERY',
                                'to_status' => 'DELIVERY_FAILED',
                                'changed_by_id' => $staff->id,
                                'reason' => 'လက်ခံသူ မရှိသောကြောင့်',
                            ]);
                        }
                    }
                }
            });
        }

        $this->command->info('Sample parcels seeded.');
    }
}
