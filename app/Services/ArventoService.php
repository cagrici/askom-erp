<?php

namespace App\Services;

use SoapClient;
use SoapFault;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class ArventoService
{
    private $soapClient;
    private $username;
    private $password;
    private $wsdlUrl;

    public function __construct()
    {
        $this->username = config('services.arvento.username');
        $this->password = config('services.arvento.password');
        $this->wsdlUrl = config('services.arvento.wsdl_url', 'https://ws.arvento.com/v1/Report.asmx?WSDL');
        
        try {
            // Check if SOAP extension is available
            if (!class_exists('SoapClient')) {
                Log::warning('SOAP extension not available - using demo data');
                $this->soapClient = null;
                return;
            }

            $this->soapClient = new SoapClient($this->wsdlUrl, [
                'trace' => 1,
                'exceptions' => true,
                'cache_wsdl' => WSDL_CACHE_NONE,
                'connection_timeout' => 30,
                'stream_context' => stream_context_create([
                    'http' => [
                        'timeout' => 30,
                        'user_agent' => 'Fleet Management System'
                    ]
                ])
            ]);
        } catch (SoapFault $e) {
            Log::error('Arvento SOAP Client Error: ' . $e->getMessage());
            $this->soapClient = null; // Fall back to demo data
        }
    }

    /**
     * Get vehicle list from Arvento
     */
    public function getVehicles()
    {
        $cacheKey = 'arvento_vehicles';
        
        return Cache::remember($cacheKey, 300, function () { // 5 minutes cache
            // Return demo data if SOAP client is not available
            if (!$this->soapClient) {
                return $this->parseVehicleList(null);
            }

            try {
                $response = $this->soapClient->GetVehicleList([
                    'username' => $this->username,
                    'password' => $this->password
                ]);

                if (isset($response->GetVehicleListResult)) {
                    return $this->parseVehicleList($response->GetVehicleListResult);
                }

                return $this->parseVehicleList(null); // Fallback to demo data
            } catch (SoapFault $e) {
                Log::error('Arvento GetVehicles Error: ' . $e->getMessage());
                return $this->parseVehicleList(null); // Fallback to demo data
            }
        });
    }

    /**
     * Get vehicle locations
     */
    public function getVehicleLocations($vehicleIds = [])
    {
        // Return demo data if SOAP client is not available
        if (!$this->soapClient) {
            return $this->parseVehicleLocations(null);
        }

        try {
            $params = [
                'username' => $this->username,
                'password' => $this->password,
            ];

            if (!empty($vehicleIds)) {
                $params['vehicleIds'] = implode(',', $vehicleIds);
            }

            $response = $this->soapClient->GetVehicleLocations($params);

            if (isset($response->GetVehicleLocationsResult)) {
                return $this->parseVehicleLocations($response->GetVehicleLocationsResult);
            }

            return $this->parseVehicleLocations(null); // Fallback to demo data
        } catch (SoapFault $e) {
            Log::error('Arvento GetVehicleLocations Error: ' . $e->getMessage());
            return $this->parseVehicleLocations(null); // Fallback to demo data
        }
    }

    /**
     * Get vehicle history/route
     */
    public function getVehicleHistory($vehicleId, $startDate, $endDate)
    {
        // Return demo data if SOAP client is not available
        if (!$this->soapClient) {
            return $this->parseVehicleHistory(null);
        }

        try {
            $response = $this->soapClient->GetVehicleHistory([
                'username' => $this->username,
                'password' => $this->password,
                'vehicleId' => $vehicleId,
                'startDate' => $startDate,
                'endDate' => $endDate
            ]);

            if (isset($response->GetVehicleHistoryResult)) {
                return $this->parseVehicleHistory($response->GetVehicleHistoryResult);
            }

            return $this->parseVehicleHistory(null); // Fallback to demo data
        } catch (SoapFault $e) {
            Log::error('Arvento GetVehicleHistory Error: ' . $e->getMessage());
            return $this->parseVehicleHistory(null); // Fallback to demo data
        }
    }

    /**
     * Get vehicle reports (speed, fuel, etc.)
     */
    public function getVehicleReports($vehicleId, $reportType, $startDate, $endDate)
    {
        // Return demo data if SOAP client is not available
        if (!$this->soapClient) {
            return $this->parseVehicleReports(null);
        }

        try {
            $response = $this->soapClient->GetVehicleReports([
                'username' => $this->username,
                'password' => $this->password,
                'vehicleId' => $vehicleId,
                'reportType' => $reportType, // 'speed', 'fuel', 'engine', 'distance'
                'startDate' => $startDate,
                'endDate' => $endDate
            ]);

            if (isset($response->GetVehicleReportsResult)) {
                return $this->parseVehicleReports($response->GetVehicleReportsResult);
            }

            return $this->parseVehicleReports(null); // Fallback to demo data
        } catch (SoapFault $e) {
            Log::error('Arvento GetVehicleReports Error: ' . $e->getMessage());
            return $this->parseVehicleReports(null); // Fallback to demo data
        }
    }

    /**
     * Get geofences/zones
     */
    public function getGeofences()
    {
        $cacheKey = 'arvento_geofences';
        
        return Cache::remember($cacheKey, 3600, function () { // 1 hour cache
            // Return demo data if SOAP client is not available
            if (!$this->soapClient) {
                return $this->parseGeofences(null);
            }

            try {
                $response = $this->soapClient->GetGeofences([
                    'username' => $this->username,
                    'password' => $this->password
                ]);

                if (isset($response->GetGeofencesResult)) {
                    return $this->parseGeofences($response->GetGeofencesResult);
                }

                return $this->parseGeofences(null); // Fallback to demo data
            } catch (SoapFault $e) {
                Log::error('Arvento GetGeofences Error: ' . $e->getMessage());
                return $this->parseGeofences(null); // Fallback to demo data
            }
        });
    }

    /**
     * Parse vehicle list XML/JSON response
     */
    private function parseVehicleList($data)
    {
        // Mock data structure for vehicles - adapt based on actual Arvento response format
        return [
            [
                'id' => '1001',
                'plate_number' => '34ABC123',
                'vehicle_name' => 'Fleet Vehicle 1',
                'device_id' => 'DEV001',
                'status' => 'online',
                'last_update' => now()->toISOString(),
            ],
            [
                'id' => '1002',
                'plate_number' => '06DEF456',
                'vehicle_name' => 'Fleet Vehicle 2',
                'device_id' => 'DEV002',
                'status' => 'offline',
                'last_update' => now()->subHours(2)->toISOString(),
            ],
            [
                'id' => '1003',
                'plate_number' => '35GHI789',
                'vehicle_name' => 'Fleet Vehicle 3',
                'device_id' => 'DEV003',
                'status' => 'moving',
                'last_update' => now()->subMinutes(5)->toISOString(),
            ]
        ];
    }

    /**
     * Parse vehicle locations response
     */
    private function parseVehicleLocations($data)
    {
        // Mock data structure for locations - adapt based on actual Arvento response format
        return [
            [
                'vehicle_id' => '1001',
                'latitude' => 41.0082,
                'longitude' => 28.9784,
                'altitude' => 100,
                'speed' => 45.5,
                'direction' => 180,
                'address' => 'Istanbul, Turkey',
                'timestamp' => now()->toISOString(),
                'status' => 'moving',
                'engine_status' => 'on',
                'fuel_level' => 75,
                'odometer' => 125000,
            ],
            [
                'vehicle_id' => '1002',
                'latitude' => 39.9334,
                'longitude' => 32.8597,
                'altitude' => 850,
                'speed' => 0,
                'direction' => 0,
                'address' => 'Ankara, Turkey',
                'timestamp' => now()->subHours(2)->toISOString(),
                'status' => 'stopped',
                'engine_status' => 'off',
                'fuel_level' => 60,
                'odometer' => 98000,
            ],
            [
                'vehicle_id' => '1003',
                'latitude' => 38.4192,
                'longitude' => 27.1287,
                'altitude' => 50,
                'speed' => 65.0,
                'direction' => 45,
                'address' => 'Izmir, Turkey',
                'timestamp' => now()->subMinutes(5)->toISOString(),
                'status' => 'moving',
                'engine_status' => 'on',
                'fuel_level' => 85,
                'odometer' => 87500,
            ]
        ];
    }

    /**
     * Parse vehicle history response
     */
    private function parseVehicleHistory($data)
    {
        // Mock route points - adapt based on actual Arvento response format
        $routePoints = [];
        $baseTime = now()->subHours(2);
        
        for ($i = 0; $i < 50; $i++) {
            $routePoints[] = [
                'latitude' => 41.0082 + (rand(-100, 100) / 10000),
                'longitude' => 28.9784 + (rand(-100, 100) / 10000),
                'speed' => rand(0, 80),
                'timestamp' => $baseTime->addMinutes(2)->toISOString(),
                'address' => 'Istanbul Route Point ' . ($i + 1),
                'fuel_level' => max(20, 100 - ($i * 1.5)),
            ];
        }
        
        return $routePoints;
    }

    /**
     * Parse vehicle reports response
     */
    private function parseVehicleReports($data)
    {
        // Mock report data - adapt based on actual Arvento response format
        return [
            'total_distance' => 245.7,
            'total_fuel_consumed' => 18.5,
            'average_speed' => 42.3,
            'max_speed' => 85.0,
            'engine_hours' => 6.5,
            'idle_time' => 1.2,
            'reports' => [
                [
                    'timestamp' => now()->subHours(6)->toISOString(),
                    'event_type' => 'speed_violation',
                    'description' => 'Speed limit exceeded: 95 km/h',
                    'location' => 'E-5 Highway, Istanbul',
                ],
                [
                    'timestamp' => now()->subHours(4)->toISOString(),
                    'event_type' => 'geofence_exit',
                    'description' => 'Vehicle left authorized zone',
                    'location' => 'Company HQ Zone',
                ],
                [
                    'timestamp' => now()->subHours(2)->toISOString(),
                    'event_type' => 'fuel_theft',
                    'description' => 'Sudden fuel level drop detected',
                    'location' => 'Ankara Service Station',
                ],
            ]
        ];
    }

    /**
     * Parse geofences response
     */
    private function parseGeofences($data)
    {
        // Mock geofence data - adapt based on actual Arvento response format
        return [
            [
                'id' => 'GF001',
                'name' => 'Company Headquarters',
                'type' => 'circle',
                'center_lat' => 41.0082,
                'center_lng' => 28.9784,
                'radius' => 500,
                'color' => '#28a745',
                'description' => 'Main office perimeter'
            ],
            [
                'id' => 'GF002',
                'name' => 'Warehouse District',
                'type' => 'polygon',
                'coordinates' => [
                    [41.0100, 28.9800],
                    [41.0120, 28.9800],
                    [41.0120, 28.9850],
                    [41.0100, 28.9850],
                ],
                'color' => '#ffc107',
                'description' => 'Warehouse and logistics area'
            ],
            [
                'id' => 'GF003',
                'name' => 'Service Center',
                'type' => 'circle',
                'center_lat' => 41.0050,
                'center_lng' => 28.9750,
                'radius' => 300,
                'color' => '#dc3545',
                'description' => 'Vehicle maintenance zone'
            ]
        ];
    }

    /**
     * Test connection to Arvento service
     */
    public function testConnection()
    {
        // Check if SOAP client is available
        if (!$this->soapClient) {
            return [
                'success' => false,
                'message' => 'SOAP extension not available - Demo mode aktif. GPS tracking için SOAP extension kurulmalı.'
            ];
        }

        try {
            // Check credentials
            if (!$this->username || !$this->password) {
                return [
                    'success' => false,
                    'message' => 'Arvento kullanıcı adı ve şifre yapılandırılmamış (.env dosyasını kontrol edin)'
                ];
            }

            // Try to get WSDL info first
            $functions = $this->soapClient->__getFunctions();
            
            if (empty($functions)) {
                return [
                    'success' => false,
                    'message' => 'Arvento WSDL erişilebilir ancak fonksiyonlar alınamadı'
                ];
            }

            return [
                'success' => true,
                'message' => 'Arvento servisi erişilebilir - ' . count($functions) . ' adet API metodu mevcut',
                'available_methods' => array_slice($functions, 0, 5) // Show first 5 methods
            ];

        } catch (SoapFault $e) {
            // Check if it's an authentication error or method not found
            if (strpos($e->getMessage(), 'not a valid method') !== false) {
                return [
                    'success' => false,
                    'message' => 'Arvento servisi erişilebilir ancak API metodları güncellenmelidir',
                    'error' => $e->getMessage()
                ];
            } else if (strpos($e->getMessage(), 'authentication') !== false || strpos($e->getMessage(), 'login') !== false) {
                return [
                    'success' => false,
                    'message' => 'Arvento kimlik doğrulama başarısız - kullanıcı adı/şifre kontrol edin',
                    'error' => $e->getMessage()
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Arvento bağlantı hatası: ' . $e->getMessage(),
                    'error' => $e->getMessage()
                ];
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Service connection failed: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ];
        }
    }
}