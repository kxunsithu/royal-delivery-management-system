<?php

namespace Database\Seeders;

use App\Models\DeliveryArea;
use Illuminate\Database\Seeder;

class DeliveryAreaSeeder extends Seeder
{
    public function run(): void
    {
        $areas = [
            [
                'name'        => 'Myawaddy Town',
                'name_mm'     => 'မြဝတီမြို့',
                'description' => 'မြဝတီမြို့ အလယ်ဗဟိုဒေသ',
            ],
            [
                'name'        => 'Myawaddy Zone 1',
                'name_mm'     => 'မြဝတီ ဇုန် ၁',
                'description' => 'ဇုန် ၁ နေထိုင်ရေးဒေသ',
            ],
            [
                'name'        => 'Myawaddy Zone 2',
                'name_mm'     => 'မြဝတီ ဇုန် ၂',
                'description' => 'ဇုန် ၂ နေထိုင်ရေးဒေသ',
            ],
            [
                'name'        => 'Myawaddy Zone 3',
                'name_mm'     => 'မြဝတီ ဇုန် ၃',
                'description' => 'ဇုန် ၃ နေထိုင်ရေးဒေသ',
            ],
            [
                'name'        => 'Industrial Zone',
                'name_mm'     => 'စက်မှုဇုန်',
                'description' => 'စက်မှုနှင့် စီးပွားရေးဇုန်',
            ],
            [
                'name'        => 'Market Area',
                'name_mm'     => 'ဈေးဝန်းကျင်',
                'description' => 'ဗဟိုဈေးအနီးဝန်းကျင်ဒေသ',
            ],
            [
                'name'        => 'Suburb Area',
                'name_mm'     => 'ပြင်ပဒေသ',
                'description' => 'မြို့ပြင်နှင့် ပတ်ဝန်းကျင်ရွာများ',
            ],
        ];

        foreach ($areas as $area) {
            DeliveryArea::firstOrCreate(
                ['name' => $area['name']],
                [...$area, 'is_active' => true]
            );
        }

        $this->command->info('Delivery areas seeded.');
    }
}
