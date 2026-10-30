<?php

namespace Database\Seeders;

use App\Models\BusinessSetting;
use Illuminate\Database\Seeder;

class BusinessSettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            [
                'key' => 'business_name',
                'value' => "Royal's Myawaddy Delivery",
                'type' => 'string',
                'description' => 'The official business name displayed across the system',
            ],
            [
                'key' => 'business_phone',
                'value' => '+95-9-xxx-xxx-xxx',
                'type' => 'string',
                'description' => 'Main business phone number',
            ],
            [
                'key' => 'business_address',
                'value' => 'Myawaddy, Kayin State, Myanmar',
                'type' => 'string',
                'description' => 'Business address',
            ],
            [
                'key' => 'currency',
                'value' => 'MMK',
                'type' => 'string',
                'description' => 'Operating currency code (e.g., MMK, THB)',
            ],
            [
                'key' => 'currency_symbol',
                'value' => 'K',
                'type' => 'string',
                'description' => 'Currency display symbol',
            ],
            [
                'key' => 'timezone',
                'value' => 'Asia/Yangon',
                'type' => 'string',
                'description' => 'Business timezone for date/time display',
            ],
            [
                'key' => 'tracking_number_prefix',
                'value' => 'RMD',
                'type' => 'string',
                'description' => 'Prefix for auto-generated tracking numbers',
            ],
            [
                'key' => 'max_delivery_attempts',
                'value' => '3',
                'type' => 'integer',
                'description' => 'Maximum delivery attempts before forcing return-to-sender',
            ],
            [
                'key' => 'require_proof_of_delivery',
                'value' => 'false',
                'type' => 'boolean',
                'description' => 'Whether proof of delivery is required to mark a delivery as completed',
            ],
        ];

        foreach ($settings as $setting) {
            BusinessSetting::firstOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }

        $this->command->info('Business settings seeded.');
    }
}
