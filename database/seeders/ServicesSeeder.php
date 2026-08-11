<?php

namespace Database\Seeders;

use App\Models\Pricing;
use App\Models\Service;
use Illuminate\Database\Seeder;

class ServicesSeeder extends Seeder
{
    public function run(): void
    {
        $services = [
            ['name' => 'LLC',           'slug' => 'llc',           'order' => 1,  'price' => 299.00],
            ['name' => 'EIN',           'slug' => 'ein',           'order' => 2,  'price' => 99.00],
            ['name' => 'USDOT',         'slug' => 'usdot',         'order' => 3,  'price' => 199.00],
            ['name' => 'MC Authority',  'slug' => 'mc_authority',  'order' => 4,  'price' => 299.00],
            ['name' => 'BOC-3',         'slug' => 'boc3',          'order' => 5,  'price' => 99.00],
            ['name' => 'UCR',           'slug' => 'ucr',           'order' => 6,  'price' => 99.00],
            ['name' => 'IFTA',          'slug' => 'ifta',          'order' => 7,  'price' => 149.00],
            ['name' => 'IRP',           'slug' => 'irp',           'order' => 8,  'price' => 199.00],
            ['name' => '2290',          'slug' => '2290',          'order' => 9,  'price' => 149.00],
            ['name' => 'MCS-150',       'slug' => 'mcs150',        'order' => 10, 'price' => 99.00],
        ];

        foreach ($services as $data) {
            $service = Service::updateOrCreate(
                ['slug' => $data['slug']],
                [
                    'name'      => $data['name'],
                    'slug'      => $data['slug'],
                    'is_active' => true,
                    'order'     => $data['order'],
                ]
            );

            Pricing::updateOrCreate(
                ['service_id' => $service->id],
                ['amount' => $data['price']]
            );
        }
    }
}
