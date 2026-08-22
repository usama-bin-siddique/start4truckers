<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Lead;
use App\Models\Client;
use App\Models\Payment;
use App\Models\Task;
use App\Models\Document;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TestDataSeeder extends Seeder
{
    public function run(): void
    {
        // Create test users
        $admin = User::firstOrCreate(
            ['email' => 'admin@start4truckers.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password'),
                'role' => 'admin',
            ]
        );

        $manager = User::firstOrCreate(
            ['email' => 'manager@start4truckers.com'],
            [
                'name' => 'Manager User',
                'password' => Hash::make('password'),
                'role' => 'manager',
            ]
        );

        $sales = User::firstOrCreate(
            ['email' => 'sales@start4truckers.com'],
            [
                'name' => 'Sales Rep',
                'password' => Hash::make('password'),
                'role' => 'sales',
            ]
        );

        // Create test leads with various statuses
        $leadStatuses = ['new', 'contacted', 'follow-up', 'quote_sent', 'won', 'lost'];
        $leadData = [
            ['John Smith', 'john.smith@example.com', '+1-555-0101', 'ABC Trucking Co', 'TX', 'new'],
            ['Sarah Johnson', 'sarah.j@example.com', '+1-555-0102', 'Johnson Logistics', 'CA', 'contacted'],
            ['Mike Williams', 'mike.w@example.com', '+1-555-0103', 'Williams Transport', 'FL', 'follow-up'],
            ['Emily Davis', 'emily.d@example.com', '+1-555-0104', 'Davis Freight LLC', 'NY', 'quote_sent'],
            ['Robert Brown', 'robert.b@example.com', '+1-555-0105', 'Brown Hauling', 'IL', 'quote_sent'],
            ['Lisa Garcia', 'lisa.g@example.com', '+1-555-0106', 'Garcia Express', 'AZ', 'won'],
            ['David Martinez', 'david.m@example.com', '+1-555-0107', 'Martinez Shipping', 'GA', 'lost'],
            ['Jennifer Wilson', 'jennifer.w@example.com', '+1-555-0108', 'Wilson Carriers', 'OH', 'new'],
            ['James Anderson', 'james.a@example.com', '+1-555-0109', 'Anderson Trucking', 'NC', 'contacted'],
            ['Maria Thomas', 'maria.t@example.com', '+1-555-0110', 'Thomas Freight', 'TN', 'follow-up'],
        ];

        $leads = [];
        foreach ($leadData as $data) {
            $lead = Lead::create([
                'name' => $data[0],
                'email' => $data[1],
                'phone' => $data[2],
                'company' => $data[3],
                'state' => $data[4],
                'status' => $data[5],
                'source' => fake()->randomElement(['website', 'referral', 'manual']),
                'assigned_to' => fake()->randomElement([$sales->id, $manager->id]),
                'service_required' => fake()->randomElement(['DOT Registration', 'MC Authority', 'IFTA', 'UCR', 'ELD Setup']),
                'notes' => 'Initial contact: ' . fake()->sentence(),
                'created_at' => now()->subDays(rand(1, 30)),
            ]);
            $leads[] = $lead;
        }

        // Create test clients from "won" leads
        $wonLeads = Lead::where('status', 'won')->get();
        $clients = [];
        
        foreach ($wonLeads as $lead) {
            $client = Client::create([
                'client_number' => 'S4T-' . date('Y') . '-' . str_pad(count($clients) + 1, 5, '0', STR_PAD_LEFT),
                'lead_id' => $lead->id,
                'status' => 'onboarding',
                'assigned_to' => $lead->assigned_to,
                'notes' => 'Converted from lead on ' . now()->format('Y-m-d'),
                'created_at' => $lead->created_at->addDays(rand(1, 5)),
            ]);
            $clients[] = $client;

            // Update lead conversion info
            $lead->update([
                'converted_by' => $manager->id,
                'converted_at' => $client->created_at,
            ]);
        }

        // Create payments for clients
        foreach ($clients as $client) {
            for ($i = 0; $i < rand(2, 4); $i++) {
                $invoiceAmount = fake()->randomFloat(2, 1000, 8000);
                $amountReceived = rand(0, 1) ? $invoiceAmount : fake()->randomFloat(2, 0, $invoiceAmount);
                
                Payment::create([
                    'client_id' => $client->id,
                    'invoice_amount' => $invoiceAmount,
                    'amount_received' => $amountReceived,
                    'payment_method' => fake()->randomElement(['cash', 'check', 'zelle', 'venmo', 'stripe']),
                    'transaction_reference' => rand(0, 1) ? 'TXN-' . fake()->uuid() : null,
                    'notes' => rand(0, 1) ? fake()->sentence() : null,
                    'paid_at' => $amountReceived > 0 ? now()->subDays(rand(1, 15)) : null,
                    'created_by' => fake()->randomElement([$admin->id, $manager->id]),
                    'created_at' => now()->subDays(rand(1, 60)),
                ]);
            }
        }

        // Create tasks
        $taskPriorities = ['low', 'medium', 'high', 'urgent'];
        $taskStatuses = ['pending', 'in_progress', 'completed'];
        
        // Tasks for clients
        foreach ($clients as $client) {
            for ($i = 0; $i < rand(2, 4); $i++) {
                $status = fake()->randomElement($taskStatuses);
                Task::create([
                    'client_id' => $client->id,
                    'title' => fake()->randomElement([
                        'Complete DOT registration',
                        'Process MC authority',
                        'Setup ELD system',
                        'Review insurance documents',
                        'Update client information',
                        'Schedule follow-up call',
                    ]),
                    'description' => fake()->sentence(),
                    'priority' => fake()->randomElement($taskPriorities),
                    'status' => $status,
                    'due_date' => now()->addDays(rand(-5, 15)),
                    'assigned_to' => fake()->randomElement([$admin->id, $manager->id, $sales->id]),
                    'created_by' => $manager->id,
                    'completed_at' => $status === 'completed' ? now()->subDays(rand(1, 5)) : null,
                    'created_at' => now()->subDays(rand(1, 20)),
                ]);
            }
        }

        // Create documents for clients
        $documentCategories = ['driver_license', 'passport', 'llc_articles', 'ein_letter', 'utility_bill', 'insurance', 'truck_registration', 'other'];
        foreach ($clients as $client) {
            for ($i = 0; $i < rand(3, 6); $i++) {
                Document::create([
                    'client_id' => $client->id,
                    'category' => fake()->randomElement($documentCategories),
                    'original_filename' => fake()->randomElement([
                        'drivers_license.pdf',
                        'passport_copy.jpg',
                        'llc_articles.pdf',
                        'ein_letter.pdf',
                        'utility_bill.pdf',
                        'insurance_cert.pdf',
                        'truck_registration.pdf',
                    ]),
                    'stored_path' => 'documents/' . $client->id . '/' . fake()->uuid() . '.pdf',
                    'mime_type' => fake()->randomElement(['application/pdf', 'image/jpeg', 'image/png']),
                    'file_size' => rand(50000, 5000000),
                    'uploaded_by' => fake()->randomElement([$admin->id, $manager->id]),
                    'created_at' => now()->subDays(rand(1, 30)),
                ]);
            }
        }

        // Remove operations section since table doesn't exist

        $this->command->info('✅ Test data created successfully!');
        $this->command->info('📧 Admin: admin@start4truckers.com / password');
        $this->command->info('📧 Manager: manager@start4truckers.com / password');
        $this->command->info('📧 Sales: sales@start4truckers.com / password');
        $this->command->info('📊 Created: ' . count($leads) . ' leads, ' . count($clients) . ' clients');
    }
}
