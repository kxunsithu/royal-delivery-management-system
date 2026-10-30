<?php

namespace Database\Seeders;

use App\Models\DeliveryArea;
use Illuminate\Database\Seeder;

class DeliveryAreaSeeder extends Seeder
{
    public function run(): void
    {
        $areas = [
            ['name' => 'Myawaddy Town',          'name_mm' => 'မြဝတီမြို့',         'description' => 'Myawaddy town center area'],
            ['name' => 'Myawaddy Zone 1',         'name_mm' => 'မြဝတီ ဇုန် ၁',       'description' => 'Zone 1 residential area'],
            ['name' => 'Myawaddy Zone 2',         'name_mm' => 'မြဝတီ ဇုန် ၂',       'description' => 'Zone 2 residential area'],
            ['name' => 'Myawaddy Zone 3',         'name_mm' => 'မြဝတီ ဇုန် ၃',       'description' => 'Zone 3 residential area'],
            ['name' => 'Industrial Zone',         'name_mm' => 'စက်မှုဇုန်',          'description' => 'Industrial and business zone'],
            ['name' => 'Market Area',             'name_mm' => 'ဈေးဝန်းကျင်',        'description' => 'Around the main market'],
            ['name' => 'Suburb Area',             'name_mm' => 'ပြင်ပဒေသ',           'description' => 'Outskirts and surrounding villages'],
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
