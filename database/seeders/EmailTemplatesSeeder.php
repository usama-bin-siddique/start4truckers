<?php

namespace Database\Seeders;

use App\Models\EmailTemplate;
use Illuminate\Database\Seeder;

class EmailTemplatesSeeder extends Seeder
{
    public function run(): void
    {
        $templates = [
            [
                'name'    => 'New Lead Notification',
                'slug'    => 'new_lead',
                'subject' => 'New Lead: {{lead_name}}',
                'body'    => "Hello,\n\nA new lead has been submitted.\n\nName: {{lead_name}}\nPhone: {{lead_phone}}\nEmail: {{lead_email}}\nService: {{service_required}}\n\nPlease follow up as soon as possible.\n\nStart4Truckers CRM",
            ],
            [
                'name'    => 'Lead Assigned',
                'slug'    => 'lead_assigned',
                'subject' => 'Lead Assigned to You: {{lead_name}}',
                'body'    => "Hello {{user_name}},\n\nA lead has been assigned to you.\n\nLead: {{lead_name}}\nPhone: {{lead_phone}}\nEmail: {{lead_email}}\n\nPlease contact them at your earliest convenience.\n\nStart4Truckers CRM",
            ],
            [
                'name'    => 'Client Welcome',
                'slug'    => 'client_welcome',
                'subject' => 'Welcome to Start4Truckers — {{client_name}}',
                'body'    => "Dear {{client_name}},\n\nWelcome to Start4Truckers! Your client profile has been created.\n\nClient ID: {{client_number}}\n\nOur processing team will be in touch shortly to begin working on your services.\n\nThank you for choosing Start4Truckers.",
            ],
            [
                'name'    => 'Payment Received',
                'slug'    => 'payment_received',
                'subject' => 'Payment Received - {{client_name}}',
                'body'    => 'Dear {{client_name}},' . "\n\n" . 'We have received your payment of {{amount_received}}.' . "\n\n" . 'Invoice Total: {{invoice_amount}}' . "\n" . 'Amount Received: {{amount_received}}' . "\n" . 'Balance Due: {{balance_due}}' . "\n\n" . 'Thank you!' . "\n\n" . 'Start4Truckers',
            ],
        ];

        foreach ($templates as $template) {
            EmailTemplate::updateOrCreate(
                ['slug' => $template['slug']],
                $template
            );
        }
    }
}
