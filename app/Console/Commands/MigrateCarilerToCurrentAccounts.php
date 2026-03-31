<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MigrateCarilerToCurrentAccounts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'migrate:cariler-to-current-accounts
                            {--dry-run : Run the migration without making changes}
                            {--limit= : Limit the number of records to migrate}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate data from cariler table to current_accounts table';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting migration from cariler to current_accounts...');

        $dryRun = $this->option('dry-run');
        $limit = $this->option('limit');

        if ($dryRun) {
            $this->warn('Running in DRY RUN mode - no changes will be made');
        }

        try {
            // Get cariler records
            $query = DB::table('cariler')
                ->whereNull('deleted_at');

            if ($limit) {
                $query->limit($limit);
            }

            $carilerRecords = $query->get();
            $totalRecords = $carilerRecords->count();

            $this->info("Found {$totalRecords} records to migrate");

            $progressBar = $this->output->createProgressBar($totalRecords);
            $progressBar->start();

            $successCount = 0;
            $errorCount = 0;

            foreach ($carilerRecords as $cariler) {
                try {
                    $mappedData = $this->mapCarilerToCurrentAccount($cariler);

                    if (!$dryRun) {
                        // Check if record already exists
                        $existingRecord = DB::table('current_accounts')
                            ->where('external_code', $cariler->contact_id)
                            ->where('external_system', 'cariler')
                            ->first();

                        if ($existingRecord) {
                            // Update existing record
                            DB::table('current_accounts')
                                ->where('id', $existingRecord->id)
                                ->update($mappedData);
                        } else {
                            // Insert new record
                            DB::table('current_accounts')->insert($mappedData);
                        }
                    }

                    $successCount++;
                } catch (\Exception $e) {
                    $errorCount++;
                    Log::error("Error migrating cariler record ID {$cariler->id}: " . $e->getMessage());
                    $this->error("Error migrating record ID {$cariler->id}: " . $e->getMessage());
                }

                $progressBar->advance();
            }

            $progressBar->finish();
            $this->newLine();

            $this->info("Migration completed!");
            $this->info("Successfully migrated: {$successCount} records");

            if ($errorCount > 0) {
                $this->error("Errors encountered: {$errorCount} records");
            }

        } catch (\Exception $e) {
            $this->error('Migration failed: ' . $e->getMessage());
            Log::error('Cariler migration failed: ' . $e->getMessage());
            return Command::FAILURE;
        }

        return Command::SUCCESS;
    }

    /**
     * Map cariler data to current_accounts structure
     */
    private function mapCarilerToCurrentAccount($cariler): array
    {
        return [
            'id' => $cariler->id,
            'account_code' => $cariler->contact_id,
            'title' => $cariler->supplier_business_name ?: $this->generateFullName($cariler),
            'account_type' => $this->mapAccountType($cariler->type),
            'person_type' => $this->mapPersonType($cariler),
            'tax_number' => $cariler->tax_number,
            'tax_office' => $cariler->tax_office,
            'address' => $this->combineAddress($cariler),
            'district' => null, // cariler tablosunda district bilgisi yok
            'city' => $cariler->city,
            'postal_code' => $cariler->zip_code,
            'country' => $cariler->country,
            'phone_1' => $cariler->landline,
            'phone_2' => $cariler->alternate_number,
            'mobile' => $cariler->mobile,
            'email' => $cariler->email,
            'contact_person' => $this->generateFullName($cariler),
            'credit_limit' => $cariler->credit_limit,
            'payment_term_days' => $cariler->pay_term_number,
            'is_active' => $cariler->contact_status === 'active',
            'notes' => $this->generateNotes($cariler),
            'external_code' => $cariler->contact_id,
            'external_system' => 'cariler',
            'current_balance' => $cariler->balance,
            'created_by' => $cariler->created_by,
            'created_at' => $cariler->created_at,
            'updated_at' => $cariler->updated_at,
        ];
    }

    /**
     * Map cariler type to current_accounts account_type
     */
    private function mapAccountType($type): string
    {
        return match ($type) {
            'customer' => 'customer',
            'supplier' => 'supplier',
            'both' => 'both',
            default => 'customer'
        };
    }

    /**
     * Determine person type based on cariler data
     */
    private function mapPersonType($cariler): string
    {
        // If has business name, likely a company
        if ($cariler->supplier_business_name) {
            return 'corporate';
        }

        // If has first/last name or name field, likely individual
        if ($cariler->first_name || $cariler->last_name || $cariler->name) {
            return 'individual';
        }

        return 'corporate'; // default
    }

    /**
     * Generate full name from cariler name fields
     */
    private function generateFullName($cariler): ?string
    {
        if ($cariler->supplier_business_name) {
            return $cariler->supplier_business_name;
        }

        $nameParts = array_filter([
            $cariler->prefix,
            $cariler->first_name,
            $cariler->middle_name,
            $cariler->last_name
        ]);

        if (!empty($nameParts)) {
            return implode(' ', $nameParts);
        }

        return $cariler->name;
    }

    /**
     * Combine address fields
     */
    private function combineAddress($cariler): ?string
    {
        $addressParts = array_filter([
            $cariler->address_line_1,
            $cariler->address_line_2,
            $cariler->street_name,
            $cariler->building_number,
            $cariler->additional_number,
            $cariler->land_mark
        ]);

        return !empty($addressParts) ? implode(' ', $addressParts) : null;
    }

    /**
     * Generate notes from various cariler fields
     */
    private function generateNotes($cariler): ?string
    {
        $notes = [];

        if ($cariler->position) {
            $notes[] = "Pozisyon: {$cariler->position}";
        }

        if ($cariler->dob) {
            $notes[] = "Doğum Tarihi: {$cariler->dob}";
        }

        if ($cariler->is_export) {
            $notes[] = "İhracat Müşterisi";
        }

        // Add custom fields if they exist
        $customFields = array_filter([
            $cariler->custom_field1,
            $cariler->custom_field2,
            $cariler->custom_field3,
            $cariler->custom_field4,
            $cariler->custom_field5
        ]);

        if (!empty($customFields)) {
            $notes[] = "Özel Alanlar: " . implode(', ', $customFields);
        }

        return !empty($notes) ? implode(' | ', $notes) : null;
    }
}
