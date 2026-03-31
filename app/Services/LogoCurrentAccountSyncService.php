<?php

namespace App\Services;

use App\Models\CurrentAccount;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

class LogoCurrentAccountSyncService
{
    protected LogoService $logoService;
    protected string $connection = 'logo';

    // Possible table name patterns for current accounts
    protected array $possibleTablePatterns = [
        'LG_%03d_CLCARD',      // Standard format
        'LG_%03d_01_CLCARD',   // Alternative format
        'LG_%s_CLCARD',        // Without leading zeros
    ];

    public function __construct(LogoService $logoService)
    {
        $this->logoService = $logoService;
    }

    /**
     * Sync current accounts from Logo database
     */
    public function syncCurrentAccounts(?int $firmNo = null, ?int $limit = null, ?string $tableName = null, bool $continueOnError = true): array
    {
        $firmNo = $firmNo ?? LogoService::getDefaultFirmNo();

        try {
            Log::info("Starting Logo current account sync for firm {$firmNo}");

            // Get Logo current accounts
            $logoAccounts = $this->getLogoCurrentAccounts($firmNo, $limit, $tableName);

            if (!$logoAccounts['success']) {
                return [
                    'success' => false,
                    'error' => $logoAccounts['error'],
                ];
            }

            $accounts = $logoAccounts['data'];
            $stats = [
                'total' => count($accounts),
                'created' => 0,
                'updated' => 0,
                'skipped' => 0,
                'errors' => [],
            ];

            // Process in chunks to avoid memory issues
            $chunkSize = 500;
            $accountChunks = $accounts->chunk($chunkSize);

            foreach ($accountChunks as $chunk) {
                DB::beginTransaction();

                try {
                    foreach ($chunk as $logoAccount) {
                        $result = $this->syncSingleAccount($logoAccount, $firmNo);

                        if ($result['action'] === 'created') {
                            $stats['created']++;
                        } elseif ($result['action'] === 'updated') {
                            $stats['updated']++;
                        } elseif ($result['action'] === 'error') {
                            $stats['skipped']++;
                            if (isset($result['error'])) {
                                $errorMsg = "Logo ID {$logoAccount->logo_id} ({$logoAccount->code}): {$result['error']}";
                                $stats['errors'][] = $errorMsg;
                                // Only log first 10 errors to avoid flooding
                                if (count($stats['errors']) <= 10) {
                                    Log::warning($errorMsg);
                                }
                            }

                            // Stop on error if continueOnError is false
                            if (!$continueOnError) {
                                throw new Exception($result['error']);
                            }
                        } else {
                            $stats['skipped']++;
                        }
                    }

                    DB::commit();

                    // Log progress after each chunk
                    Log::info("Processed chunk: Created={$stats['created']}, Updated={$stats['updated']}, Skipped={$stats['skipped']}");

                } catch (Exception $e) {
                    DB::rollBack();

                    if (!$continueOnError) {
                        throw $e;
                    }

                    Log::error("Chunk processing error: " . $e->getMessage());
                }
            }

            Log::info('Logo current account sync completed', $stats);

            return [
                'success' => true,
                'stats' => $stats,
            ];

        } catch (Exception $e) {
            Log::error('Logo current account sync error: ' . $e->getMessage());

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Find the correct current account table name
     */
    protected function findCurrentAccountTable(int $firmNo): ?string
    {
        try {
            // Try each possible pattern
            foreach ($this->possibleTablePatterns as $pattern) {
                $tableName = sprintf($pattern, $firmNo);

                $exists = DB::connection($this->connection)
                    ->selectOne("
                        SELECT COUNT(*) as count
                        FROM INFORMATION_SCHEMA.TABLES
                        WHERE TABLE_NAME = ?
                    ", [$tableName]);

                if ($exists && $exists->count > 0) {
                    Log::info("Found current account table: {$tableName}");
                    return $tableName;
                }
            }

            // If not found with patterns, search for any table containing CLCARD
            $tables = DB::connection($this->connection)
                ->select("
                    SELECT TABLE_NAME
                    FROM INFORMATION_SCHEMA.TABLES
                    WHERE TABLE_NAME LIKE ?
                    AND TABLE_NAME NOT LIKE '%CLFICHE%'
                    AND TABLE_NAME NOT LIKE '%CLINE%'
                ", ["LG_{$firmNo}%CLCARD%"]);

            if (!empty($tables)) {
                $tableName = $tables[0]->TABLE_NAME;
                Log::info("Found current account table by search: {$tableName}");
                return $tableName;
            }

            return null;
        } catch (Exception $e) {
            Log::error("Error finding current account table: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Get current accounts from Logo database
     */
    protected function getLogoCurrentAccounts(int $firmNo, ?int $limit, ?string $tableName = null): array
    {
        try {
            // Use provided table name or auto-detect
            if (!$tableName) {
                $tableName = $this->findCurrentAccountTable($firmNo);

                if (!$tableName) {
                    return [
                        'success' => false,
                        'error' => "Current account table not found for firm {$firmNo}. Tried patterns: " .
                                   implode(', ', array_map(fn($p) => sprintf($p, $firmNo), $this->possibleTablePatterns)),
                        'data' => [],
                    ];
                }
            }

            Log::info("Using current account table: {$tableName}");

            $query = DB::connection($this->connection)
                ->table($tableName)
                ->select([
                    'LOGICALREF as logo_id',
                    'CODE as code',
                    'DEFINITION_ as title',
                    'ADDR1 as address_line_1',
                    'ADDR2 as address_line_2',
                    'CITY as city',
                    'TOWN as district',
                    'POSTCODE as postal_code',
                    'COUNTRY as country',
                    'TELNRS1 as phone_1',
                    'TELNRS2 as phone_2',
                    'FAXNR as fax',
                    'EMAILADDR as email',
                    'WEBADDR as website',
                    'TAXOFFICE as tax_office',
                    'TAXNR as tax_number',
                    'TCKNO as id_number',
                    'INCHARGE as contact_person',
                    'CARDTYPE as card_type', // 0=Customer, 1=Supplier, 2=Both
                    'ACTIVE as is_active', // 0=Active, 1=Inactive in Logo
                    'DISCRATE as discount_rate',
                    'CELLPHONE as mobile_phone',
                ])
                ->where('ACTIVE', 0); // 0 = Active

            if ($limit) {
                $query->limit($limit);
            }

            $accounts = $query->get();

            return [
                'success' => true,
                'data' => $accounts,
                'count' => $accounts->count(),
                'table' => $tableName,
            ];

        } catch (Exception $e) {
            Log::error('Get Logo current accounts error: ' . $e->getMessage());

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'data' => [],
            ];
        }
    }

    /**
     * Sync single account
     */
    protected function syncSingleAccount(object $logoAccount, int $firmNo): array
    {
        try {
            // Determine account type from Logo CARDTYPE
            // 0 = Customer, 1 = Supplier, 2 = Both
            $accountType = $this->determineAccountType($logoAccount->card_type);

            // Check if account already exists by logo_id or code
            $existingAccount = CurrentAccount::where('logo_id', $logoAccount->logo_id)
                ->orWhere('account_code', $logoAccount->code)
                ->first();

            $accountData = $this->mapLogoAccountToLocal($logoAccount, $accountType, $firmNo);

            if ($existingAccount) {
                // Update existing account
                $existingAccount->update($accountData);

                return [
                    'action' => 'updated',
                    'account' => $existingAccount,
                ];
            } else {
                // Create new account
                $newAccount = CurrentAccount::create($accountData);

                return [
                    'action' => 'created',
                    'account' => $newAccount,
                ];
            }

        } catch (Exception $e) {
            Log::error("Sync account error for Logo ID {$logoAccount->logo_id}: " . $e->getMessage());

            return [
                'action' => 'error',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Determine account type from Logo card type
     */
    protected function determineAccountType(int $cardType): string
    {
        return match ($cardType) {
            0 => 'customer',        // Only customer
            1 => 'supplier',        // Only supplier
            2 => 'both',            // Both customer and supplier
            default => 'customer',
        };
    }

    /**
     * Map Logo account data to local database structure
     */
    protected function mapLogoAccountToLocal(object $logoAccount, string $accountType, int $firmNo): array
    {
        // Combine address lines for the address field
        $fullAddress = trim(implode("\n", array_filter([
            $logoAccount->address_line_1,
            $logoAccount->address_line_2,
        ])));

        return [
            'logo_id' => $logoAccount->logo_id,
            'logo_firm_no' => $firmNo,
            'account_type' => $accountType,
            'account_code' => $logoAccount->code,
            'title' => $logoAccount->title,
            'address' => $fullAddress ?: null,
            'address_line_1' => $logoAccount->address_line_1,
            'address_line_2' => $logoAccount->address_line_2,
            'city' => $logoAccount->city,
            'district' => $logoAccount->district,
            'postal_code' => $logoAccount->postal_code,
            'country' => $logoAccount->country,
            'phone_1' => $logoAccount->phone_1,
            'phone_2' => $logoAccount->phone_2,
            'fax' => $logoAccount->fax,
            'email' => $logoAccount->email,
            'website' => $logoAccount->website,
            'tax_office' => $logoAccount->tax_office,
            'tax_number' => $logoAccount->tax_number,
            'contact_person' => $logoAccount->contact_person,
            'mobile' => $logoAccount->mobile_phone,
            'discount_rate' => $logoAccount->discount_rate ?? 0,
            'is_active' => $logoAccount->is_active == 0, // Logo: 0=Active, 1=Inactive
            'logo_synced_at' => now(),
        ];
    }

    /**
     * Get sync statistics
     */
    public function getSyncStats(): array
    {
        try {
            $total = CurrentAccount::whereNotNull('logo_id')->count();
            $customers = CurrentAccount::where('account_type', 'customer')
                ->whereNotNull('logo_id')
                ->count();
            $suppliers = CurrentAccount::where('account_type', 'supplier')
                ->whereNotNull('logo_id')
                ->count();
            $both = CurrentAccount::where('account_type', 'both')
                ->whereNotNull('logo_id')
                ->count();

            $lastSync = CurrentAccount::whereNotNull('logo_synced_at')
                ->orderBy('logo_synced_at', 'desc')
                ->first();

            return [
                'success' => true,
                'total_synced' => $total,
                'customers' => $customers,
                'suppliers' => $suppliers,
                'both' => $both,
                'last_sync' => $lastSync?->logo_synced_at?->format('Y-m-d H:i:s'),
            ];

        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }
}
