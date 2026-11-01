<?php

namespace Database\Seeders;

use App\Models\DeliveryArea;
use App\Models\Parcel;
use App\Models\ParcelImage;
use App\Models\User;
use Illuminate\Database\Seeder;

class ParcelSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@gmail.com')->firstOrFail();
        $areas = DeliveryArea::pluck('id')->toArray();

        $burmeseNames = [
            'မောင်အောင်ကျော်', 'မသန်းဒါး', 'ကိုဇင်ဖြိုး', 'ဦးကျော်ဝင်း', 'ဒေါ်စုစု',
            'ကိုထွန်းလွင်', 'မခင်မာ', 'ဦးမောင်မောင်', 'ဒေါ်မြင့်မြင့်', 'ကိုသန်းထွန်း',
        ];
        $englishNames = [
            'John Smith', 'Mary Johnson', 'Robert Lee', 'Sarah Davis', 'Michael Brown',
            'Emily Wilson', 'David Miller', 'Jessica Taylor', 'James Anderson', 'Linda Thomas',
        ];
        $burmeseAddresses = [
            'အမှတ် ၁၂၊ ကမ်းနားလမ်း၊ မြဝတီမြို့',
            'အမှတ် ၄၅၊ မြို့နယ်လမ်း၊ ဇုန် ၂',
            'အမှတ် ၇၊ ဈေးလမ်း၊ မြဝတီမြို့',
            'အမှတ် ၂၂၊ စက်မှုဇုန်',
            'အမှတ် ၈၈၊ ပြင်ပလမ်း၊ မြဝတီမြို့',
        ];
        $englishAddresses = [
            'No. 5, Main Road, Myawaddy',
            'No. 18, Market Street, Myawaddy',
            'No. 9, Township Road, Myawaddy',
            'No. 25, Industrial Zone, Myawaddy',
            'No. 30, Suburb Road, Myawaddy',
        ];
        $descriptions = [
            'အီလက်ထရောနစ် - စမတ်ဖုန်း',
            'အဝတ်အထည် - ၃ ခု',
            'ဆေးဝါး',
            'ကွန်ပျူတာ အပိုပစ္စည်းများ',
            'ဗိုက်တာမင်များ',
            'Laptop computer',
            'Clothing items - 5 pieces',
            'Medical supplies',
            'Food products',
            'Electronic accessories',
        ];
        $priorities = ['NORMAL', 'NORMAL', 'NORMAL', 'HIGH', 'URGENT'];
        $senders = [
            ['မဲဆောက် ဆိုင် A', '+66-55-000-001'],
            ['မဲဆောက် ဖက်ရှင်ဆိုင်', '+66-55-000-002'],
            ['Mae Sot Electronics Shop', '+66-55-000-010'],
            ['Mae Sot Fashion Store', '+66-55-000-011'],
            ['Mae Sot Pharmacy', '+66-55-000-013'],
        ];

        for ($i = 1; $i <= 30; $i++) {
            $useEnglish = ($i % 2 === 0);
            $namePool = $useEnglish ? $englishNames : $burmeseNames;
            $addressPool = $useEnglish ? $englishAddresses : $burmeseAddresses;
            $recipientName = $namePool[($i - 1) % count($namePool)];
            $deliveryAddress = $addressPool[($i - 1) % count($addressPool)];
            $sender = $senders[($i - 1) % count($senders)];
            $description = $descriptions[($i - 1) % count($descriptions)];
            $priority = $priorities[($i - 1) % count($priorities)];
            $areaId = $areas[($i - 1) % max(count($areas), 1)] ?? null;
            $isCod = ($i % 3 === 0);
            $quantity = ($i % 5) + 1;
            $deliveryFee = 2000 + (($i % 10) * 500);
            $codAmount = $isCod ? (10000 + (($i % 8) * 5000)) : 0;

            $parcel = [
                'tracking_number' => sprintf('RMD-202411%02d-%05d', ($i % 28) + 1, $i),
                'sender_name'     => $sender[0],
                'sender_phone'    => $sender[1],
                'recipient_name'  => $recipientName,
                'recipient_phone' => sprintf('+95-9-%03d-%06d', 500 + ($i % 200), 100000 + $i),
                'delivery_address'=> $deliveryAddress,
                'delivery_area_id'=> $areaId,
                'description'     => $description,
                'quantity'        => $quantity,
                'delivery_fee'    => $deliveryFee,
                'cod_amount'      => $codAmount,
                'is_cod'          => $isCod,
                'status'          => 'RECEIVED_AT_MAE_SOT',
                'priority'        => $priority,
                'received_at'     => now()->subMinutes($i * 30),
                'received_by_id'  => $admin->id,
            ];

            $seededParcel = Parcel::firstOrCreate(
                ['tracking_number' => $parcel['tracking_number']],
                $parcel
            );

            // Attach a sample parcel image from the parcel-images folder
            if (!$seededParcel->images()->exists()) {
                $imageFiles = ['p1.jpeg', 'p2.jpeg', 'p3.jpeg', 'p4.webp', 'p5.png'];
                $imageFile = $imageFiles[($i - 1) % count($imageFiles)];
                $imagePath = 'parcel-images/' . $imageFile;
                $fullPath = storage_path('app/public/' . $imagePath);

                ParcelImage::create([
                    'parcel_id'     => $seededParcel->id,
                    'path'          => $imagePath,
                    'original_name' => $imageFile,
                    'size'          => is_file($fullPath) ? filesize($fullPath) : null,
                    'mime_type'     => is_file($fullPath) ? (mime_content_type($fullPath) ?: null) : null,
                    'sort_order'    => 0,
                ]);
            }
        }

        $this->command->info('30 sample parcels seeded.');
    }
}