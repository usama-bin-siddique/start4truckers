<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            // General
            ['key' => 'company_name',       'value' => 'Start4Truckers',           'group' => 'general'],
            ['key' => 'company_email',      'value' => 'info@start4truckers.com',   'group' => 'general'],
            ['key' => 'company_phone',      'value' => '',                          'group' => 'general'],
            // API
            ['key' => 'web3forms_key',      'value' => '',                          'group' => 'api'],
            ['key' => 'web3forms_secret',   'value' => '',                          'group' => 'api'],
            ['key' => 'stripe_key',         'value' => '',                          'group' => 'api'],
            ['key' => 'stripe_secret',      'value' => '',                          'group' => 'api'],
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }

        Setting::firstOrCreate(
            ['key' => 'website_api_key'],
            ['value' => Str::random(48), 'group' => 'api']
        );
    }
}
