<?php

namespace Database\Seeders;

use App\Models\Parcel;
use App\Models\ParcelImage;
use App\Models\User;
use Illuminate\Database\Seeder;

class ParcelSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@gmail.com')->firstOrFail();

        // Ensure sample parcel images exist in storage/app/public/parcel-images
        $assetsDir = database_path('seeders/assets');
        $publicParcelImagesDir = storage_path('app/public/parcel-images');
        if (!is_dir($publicParcelImagesDir)) {
            mkdir($publicParcelImagesDir, 0775, true);
        }
        if (is_dir($assetsDir)) {
            foreach (glob($assetsDir . '/*') as $assetFile) {
                $dest = $publicParcelImagesDir . '/' . basename($assetFile);
                if (!is_file($dest) && is_file($assetFile)) {
                    copy($assetFile, $dest);
                }
            }
        }

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
        $currencies = ['MMK', 'MMK', 'MMK', 'THB', 'MMK']; // 80% MMK, 20% THB
        $deliveryFeesMmk = [3000, 5000, 7000, 10000, 15000, 8000, 6000, 12000, 4000, 9000];
        $deliveryFeesThb = [100, 150, 200, 250, 120, 180, 300, 80];
        $codAmountsMmk   = [15000, 25000, 50000, 80000, 100000, 35000, 60000, 45000, 20000, 75000];
        $codAmountsThb   = [500, 800, 1200, 2000, 1500, 600];
        $senders = [
            ['မဲဆောက် ဆိုင် A', '09944074992'],
            ['မဲဆောက် ဖက်ရှင်ဆိုင်', '09944074993'],
            ['Mae Sot Electronics Shop', '09944074994'],
            ['Mae Sot Fashion Store', '09944074995'],
            ['Mae Sot Pharmacy', '09944074996'],
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
            $quantity = ($i % 5) + 1;
            $categories = ['အဝတ်အစား', 'ဖုန်း', 'Laptop'];
            $category = $categories[($i - 1) % count($categories)];

            // Currency, fee, COD
            $currency = $currencies[($i - 1) % count($currencies)];
            $isCod    = ($i % 3 === 0); // every 3rd parcel is COD
            if ($currency === 'THB') {
                $deliveryFee = $deliveryFeesThb[($i - 1) % count($deliveryFeesThb)];
                $codAmount   = $isCod ? $codAmountsThb[($i - 1) % count($codAmountsThb)] : 0;
            } else {
                $deliveryFee = $deliveryFeesMmk[($i - 1) % count($deliveryFeesMmk)];
                $codAmount   = $isCod ? $codAmountsMmk[($i - 1) % count($codAmountsMmk)] : 0;
            }

            $parcel = [
                'tracking_number' => sprintf('RMD-202411%02d-%05d', ($i % 28) + 1, $i),
                'sender_name'     => $sender[0],
                'sender_phone'    => $sender[1],
                'recipient_name'  => $recipientName,
                'recipient_phone' => sprintf('09%09d', 944074981 + (($i - 1) % count($namePool)) + 1),
                'delivery_address'=> $deliveryAddress,
                'description'     => $description,
                'quantity'        => $quantity,
                'status'          => 'RECEIVED',
                'priority'        => $priority,
                'delivery_fee'    => $deliveryFee,
                'cod_amount'      => $codAmount,
                'is_cod'          => $isCod,
                'currency'        => $currency,
                'cod_currency'    => $currency,
                'condition'       => 'GOOD',
                'received_at'     => now()->subDays(($i - 1) % 30)->subHours($i % 24),
                'received_by_id'  => $admin->id,
            ];

            $seededParcel = Parcel::firstOrCreate(
                ['tracking_number' => $parcel['tracking_number']],
                $parcel
            );

            if (!$seededParcel->items()->exists()) {
                $seededParcel->items()->create([
                    'product_name' => $category,
                    'quantity' => $quantity,
                ]);
            }

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