<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\Lead;
use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WebsiteLeadApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_rejects_request_without_api_key(): void
    {
        Setting::set('website_api_key', 'test-secret-key', 'api');

        $this->postJson('/api/leads', [
            'name'  => 'Jane Doe',
            'email' => 'jane@example.com',
        ])->assertUnauthorized();
    }

    public function test_creates_a_website_lead(): void
    {
        Setting::set('website_api_key', 'test-secret-key', 'api');

        $this->postJson('/api/leads', [
            'name'             => 'Jane Doe',
            'email'            => 'jane@example.com',
            'phone'            => '555-0100',
            'state'            => 'TX',
            'service_required' => 'DOT Number',
            'notes'            => 'Need help getting started',
        ], [
            'X-API-Key' => 'test-secret-key',
        ])->assertCreated()
            ->assertJsonPath('data.status', 'new');

        $this->assertDatabaseHas('leads', [
            'name'   => 'Jane Doe',
            'email'  => 'jane@example.com',
            'source' => 'website',
            'status' => Lead::STATUS_NEW,
        ]);
    }

    public function test_leads_log_webhook_writes_an_activity_even_when_rejected(): void
    {
        $this->postJson('/api/leads/log', [])->assertUnprocessable();

        $this->assertDatabaseHas('activities', [
            'action'      => Activity::ACTION_WEBHOOK_RECEIVED,
            'description' => 'Website webhook /api/leads/log was called, but the payload was rejected.',
        ]);
    }

    public function test_leads_log_webhook_attaches_the_activity_to_the_lead(): void
    {
        $this->postJson('/api/leads/log', [
            'name'  => 'Webhook Driver',
            'email' => 'driver@example.com',
            'phone' => '555-0111',
        ])->assertCreated();

        $lead = Lead::where('email', 'driver@example.com')->first();

        $this->assertNotNull($lead);
        $this->assertDatabaseHas('activities', [
            'subject_type' => Lead::class,
            'subject_id'   => $lead->id,
            'action'       => Activity::ACTION_WEBHOOK_RECEIVED,
        ]);
    }

    public function test_starter_package_form_labels_are_saved_as_a_lead(): void
    {
        $this->postJson('/api/leads/log', [
            'subject' => 'New Starter Package Order — $999',
            'from_name' => 'Start4Truckers Website',
            'email' => 'myreli@mailinator.com',
            'Full Legal Name' => 'Katell Finch',
            'Phone' => '+1 (408) 911-5662',
            'Email' => 'myreli@mailinator.com',
            'Date of Birth' => '2015-10-16',
            'Street Address' => 'Ipsam aut autem beat',
            'City' => 'Cupidatat voluptatem',
            'State' => 'AR',
            'ZIP' => '33670',
            'Desired Business Name (1st choice)' => 'Aurora Haynes',
            'Alternative Name (2nd choice)' => 'Cairo Hendricks',
            'Alternative Name (3rd choice)' => 'Cain Jordan',
            'State of LLC Formation' => 'MO',
            'SSN or ITIN' => 'Dolorem error id nu',
            'Business Purpose / Activity' => 'Deserunt lorem aut e',
            'Truck Type' => 'Dump Truck',
            'Truck VIN' => 'Est nobis velit',
            'Operation Area (City/Region)' => 'Aut blanditiis exerc',
            'Operation Type' => 'Intrastate',
            'How did you hear about us?' => 'Other',
            'Additional Notes / Questions' => 'Similique est conse',
            'Reference ID' => 'S4T-MVWUSY1X',
        ])->assertCreated();

        $this->assertDatabaseHas('leads', [
            'name' => 'Katell Finch',
            'email' => 'myreli@mailinator.com',
            'phone' => '+1 (408) 911-5662',
            'state' => 'AR',
            'business_name_1' => 'Aurora Haynes',
            'state_of_formation' => 'MO',
            'truck_type' => 'Dump Truck',
            'reference_id' => 'S4T-MVWUSY1X',
            'service_required' => 'Starter Package',
            'source' => 'website',
        ]);
    }

    public function test_premium_package_form_saves_the_lead_and_keeps_extra_fields(): void
    {
        $this->postJson('/api/leads/log', [
            'subject' => 'New Premium Package Order — $1,499',
            'from_name' => 'Start4Truckers Website',
            'email' => 'luxa@mailinator.com',
            'replyto' => 'luxa@mailinator.com',
            'Full Legal Name' => 'Kenneth Dean',
            'Phone' => '+1 (226) 174-7733',
            'Email' => 'luxa@mailinator.com',
            'Date of Birth' => '1987-06-21',
            'Street Address' => 'Voluptas omnis velit',
            'City' => 'Quasi cillum impedit',
            'State' => 'AL',
            'ZIP' => '46701',
            'Desired Business Name (1st choice)' => 'Sacha Flowers',
            'Alternative Name (2nd choice)' => 'Caleb Brock',
            'Alternative Name (3rd choice)' => 'Noelle Clayton',
            'State of LLC Formation' => 'WA',
            'SSN or ITIN' => 'Cumque amet et accu',
            'Foreign Owner?' => 'no',
            'Ownership Structure (Names + % split)' => 'Temporibus sequi ips',
            'Truck Type' => 'Tow Truck',
            'Truck VIN' => 'Soluta dolores ut',
            'Gross Vehicle Weight Rating (GVWR)' => '84',
            'Cargo Type' => 'Hazmat',
            'Operation Classification' => 'for-hire',
            'States of Operation' => 'All 48 contiguous states',
            'Existing USDOT Number' => 'Minim ut dolores exe',
            'Existing MC Number' => 'Perspiciatis fugiat',
            'Expected Start Date' => '1971-07-25',
            'Insurance Provider (if known)' => 'Sit voluptates tene',
            'Reference ID' => 'S4T-MVWUUMZR',
        ])->assertCreated();

        $lead = Lead::where('email', 'luxa@mailinator.com')->first();

        $this->assertNotNull($lead);
        $this->assertSame('Kenneth Dean', $lead->name);
        $this->assertSame('Premium Package', $lead->service_required);
        $this->assertSame('S4T-MVWUUMZR', $lead->reference_id);
        $this->assertSame('no', $lead->meta['Foreign Owner?']);
        $this->assertSame('Minim ut dolores exe', $lead->meta['Existing USDOT Number']);
        $this->assertSame('Hazmat', $lead->meta['Cargo Type']);
    }

    public function test_pro_package_form_saves_a_full_state_name_and_llc_fields(): void
    {
        $this->postJson('/api/leads/log', [
            'subject' => 'New Pro Package Order — $1,999 + state fees',
            'full_name' => 'Kalia Pierce',
            'phone' => '+1 (951) 718-6951',
            'email' => 'higakiduc@mailinator.com',
            'heard_about_us' => 'Referred by a friend',
            'address_street' => 'Voluptate quia rem q',
            'address_city' => 'Sint quis vel dolor',
            'address_state' => 'FL',
            'address_zip' => '23467',
            'llc_name_1' => 'Baker Booker',
            'llc_name_2' => 'Chava Morton',
            'formation_state' => 'South Dakota',
            'business_purpose' => 'General Freight Trucking',
            'truck_type' => 'Car Hauler',
            'reference_id' => 'S4T-PRO-MVWUW4OH',
            'govportal_id' => 'jito@mailinator.com',
            'hazmat' => 'Yes',
        ])->assertCreated();

        $lead = Lead::where('reference_id', 'S4T-PRO-MVWUW4OH')->first();

        $this->assertNotNull($lead);
        $this->assertSame('Kalia Pierce', $lead->name);
        $this->assertSame('Baker Booker', $lead->business_name_1);
        $this->assertSame('Chava Morton', $lead->business_name_2);
        $this->assertSame('South Dakota', $lead->state_of_formation);
        $this->assertSame('FL', $lead->state);
        $this->assertSame('Referred by a friend', $lead->hear_about_us);
        $this->assertSame('Pro Package', $lead->service_required);
        $this->assertSame('Yes', $lead->meta['hazmat']);
    }

    public function test_monthly_compliance_form_maps_lead_fields_and_stores_the_rest_in_meta(): void
    {
        $this->postJson('/api/leads/log', [
            'subject' => 'New Monthly Compliance Subscription — $149/mo',
            'from_name' => 'Start4Truckers Website',
            'email' => 'hijy@mailinator.com',
            'Full Legal Name' => 'Allegra Dillon',
            'Phone' => '+1 (889) 367-5805',
            'Email' => 'hijy@mailinator.com',
            'Preferred Communication' => 'phone',
            'Business Legal Name' => 'Nelle Mccullough',
            'USDOT Number' => '862',
            'MC Number' => '107',
            'Business Physical Address' => 'Ullamco ex et volupt',
            'City' => 'Culpa sequi magna d',
            'State' => 'Missouri',
            'ZIP' => '28443',
            'How did you hear about us?' => 'Google search',
            'Current compliance issues or concerns' => 'Eligendi asperiores',
            'Reference ID' => 'S4T-MVWUXGBQ',
            'EIN' => 'Ex dolorem labore ea',
            'Base State' => 'Washington',
        ])->assertCreated();

        $lead = Lead::where('reference_id', 'S4T-MVWUXGBQ')->first();

        $this->assertNotNull($lead);
        $this->assertSame('Allegra Dillon', $lead->name);
        $this->assertSame('Nelle Mccullough', $lead->company);
        $this->assertSame('Missouri', $lead->state);
        $this->assertSame('Ullamco ex et volupt, Culpa sequi magna d, Missouri, 28443', $lead->address);
        $this->assertSame('Google search', $lead->hear_about_us);
        $this->assertSame('Eligendi asperiores', $lead->notes);
        $this->assertSame('Monthly Compliance Subscription', $lead->service_required);
        $this->assertSame('862', $lead->meta['USDOT Number']);
        $this->assertSame('Washington', $lead->meta['Base State']);
        $this->assertSame('phone', $lead->meta['Preferred Communication']);
        $this->assertArrayNotHasKey('Full Legal Name', $lead->meta);
        $this->assertArrayNotHasKey('Business Legal Name', $lead->meta);
    }

    public function test_saves_the_lead_when_the_email_is_not_a_perfect_address(): void
    {
        Setting::set('website_api_key', 'test-secret-key', 'api');

        $this->postJson('/api/leads', [
            'name'  => 'Jane Doe',
            'Email' => ' jane@gmail ',
            'phone' => '555-0100',
        ], [
            'X-API-Key' => 'test-secret-key',
        ])->assertCreated();

        $this->assertDatabaseHas('leads', [
            'name'  => 'Jane Doe',
            'email' => 'jane@gmail',
        ]);
    }

    public function test_web3forms_saves_an_email_sent_under_another_field_name(): void
    {
        $this->postJson('/api/webhook/web3forms', [
            'name'       => 'Form Driver',
            'your-email' => 'driver@example.com',
            'phone'      => '555-0199',
        ])->assertCreated();

        $this->assertDatabaseHas('leads', [
            'name'  => 'Form Driver',
            'email' => 'driver@example.com',
            'source'=> 'website',
        ]);
    }
}
