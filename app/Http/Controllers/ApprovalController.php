<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Order;
use App\Models\Offer;
use App\Models\Entity;

class ApprovalController extends Controller
{
    /**
     * Display the approval dashboard with approval boxes
     */
    public function index()
    {
        // Örnek veri - daha sonra veritabanından gelecek
        $approvalTypes = [
            [
                'id' => 'siparisler',
                'title' => 'Siparişler',
                'count' => 12,
                'color' => 'primary',
                'icon' => 'ri-shopping-cart-line',
                'description' => 'Onay bekleyen siparişler'
            ],
            [
                'id' => 'teklifler',
                'title' => 'Teklifler',
                'count' => 8,
                'color' => 'success',
                'icon' => 'ri-file-text-line',
                'description' => 'Onay bekleyen teklifler'
            ],
            [
                'id' => 'faturalar',
                'title' => 'Faturalar',
                'count' => 5,
                'color' => 'warning',
                'icon' => 'ri-receipt-line',
                'description' => 'Onay bekleyen faturalar'
            ],
            [
                'id' => 'masraf-talepleri',
                'title' => 'Masraf Talepleri',
                'count' => 15,
                'color' => 'danger',
                'icon' => 'ri-money-dollar-circle-line',
                'description' => 'Onay bekleyen masraf talepleri'
            ],
            [
                'id' => 'izin-talepleri',
                'title' => 'İzin Talepleri',
                'count' => 3,
                'color' => 'info',
                'icon' => 'ri-calendar-check-line',
                'description' => 'Onay bekleyen izin talepleri'
            ],
            [
                'id' => 'satinalma',
                'title' => 'Satın Alma',
                'count' => 7,
                'color' => 'secondary',
                'icon' => 'ri-shopping-bag-line',
                'description' => 'Onay bekleyen satın alma talepleri'
            ]
        ];

        return Inertia::render('Approval/Index', [
            'approvalTypes' => $approvalTypes
        ]);
    }

    /**
     * Display list of items pending approval for a specific type
     */
    public function list($type)
    {
        // Örnek liste verisi - daha sonra veritabanından gelecek
        $items = [];

        switch($type) {
            case 'siparisler':
                $items = [
                    ['id' => 1, 'orderNo' => 'SIP-2024-001', 'customer' => 'ABC Şirketi', 'amount' => '25.000 TL', 'date' => '15.01.2024', 'status' => 'Bekliyor'],
                    ['id' => 2, 'orderNo' => 'SIP-2024-002', 'customer' => 'XYZ Ltd.', 'amount' => '42.500 TL', 'date' => '16.01.2024', 'status' => 'Bekliyor'],
                    ['id' => 3, 'orderNo' => 'SIP-2024-003', 'customer' => 'DEF A.Ş.', 'amount' => '18.750 TL', 'date' => '17.01.2024', 'status' => 'Bekliyor'],
                ];
                break;

            case 'teklifler':
                $items = [
                    ['id' => 1, 'offerNo' => 'TEK-2024-101', 'customer' => 'MNO Holding', 'amount' => '125.000 TL', 'date' => '14.01.2024', 'status' => 'Bekliyor'],
                    ['id' => 2, 'offerNo' => 'TEK-2024-102', 'customer' => 'PQR Group', 'amount' => '87.500 TL', 'date' => '15.01.2024', 'status' => 'Bekliyor'],
                ];
                break;

            case 'masraf-talepleri':
                $items = [
                    ['id' => 1, 'requestNo' => 'MAS-2024-201', 'employee' => 'Ahmet Yılmaz', 'amount' => '3.250 TL', 'date' => '16.01.2024', 'type' => 'Yol Masrafı'],
                    ['id' => 2, 'requestNo' => 'MAS-2024-202', 'employee' => 'Ayşe Demir', 'amount' => '1.850 TL', 'date' => '17.01.2024', 'type' => 'Konaklama'],
                ];
                break;
        }

        $typeInfo = [
            'siparisler' => ['title' => 'Siparişler', 'icon' => 'ri-shopping-cart-line'],
            'teklifler' => ['title' => 'Teklifler', 'icon' => 'ri-file-text-line'],
            'faturalar' => ['title' => 'Faturalar', 'icon' => 'ri-receipt-line'],
            'masraf-talepleri' => ['title' => 'Masraf Talepleri', 'icon' => 'ri-money-dollar-circle-line'],
            'izin-talepleri' => ['title' => 'İzin Talepleri', 'icon' => 'ri-calendar-check-line'],
            'satinalma' => ['title' => 'Satın Alma', 'icon' => 'ri-shopping-bag-line']
        ];

        return Inertia::render('Approval/List', [
            'type' => $type,
            'typeInfo' => $typeInfo[$type] ?? ['title' => 'Onay Listesi', 'icon' => 'bi-list'],
            'items' => $items
        ]);
    }

    /**
     * Display detail of a specific item
     */
    public function detail($type, $id)
    {
        // Örnek detay verisi - daha sonra veritabanından gelecek
        $detail = null;

        if ($type === 'siparisler' && $id == 1) {
            $detail = [
                'orderNo' => 'SIP-2024-001',
                'customer' => 'ABC Şirketi',
                'date' => '15.01.2024',
                'deliveryDate' => '25.01.2024',
                'amount' => '25.000 TL',
                'status' => 'Onay Bekliyor',
                'items' => [
                    ['name' => 'Ürün A', 'quantity' => 100, 'price' => '150 TL', 'total' => '15.000 TL'],
                    ['name' => 'Ürün B', 'quantity' => 50, 'price' => '200 TL', 'total' => '10.000 TL'],
                ],
                'notes' => 'Müşteri acil teslimat talep ediyor.'
            ];
        }

        return Inertia::render('Approval/Detail', [
            'type' => $type,
            'detail' => $detail
        ]);
    }

    /**
     * Mobile-first approval dashboard (V2)
     */
    public function dashboard()
    {
        $approvalTypes = [
            [
                'id' => 'siparisler',
                'title' => 'Siparişler',
                'count' => 12,
                'color' => 'primary',
                'icon' => 'ri-shopping-cart-line',
                'description' => 'Onay bekleyen siparişler',
                'priority' => 'high'
            ],
            [
                'id' => 'teklifler',
                'title' => 'Teklifler',
                'count' => 8,
                'color' => 'success',
                'icon' => 'ri-file-text-line',
                'description' => 'Onay bekleyen teklifler',
                'priority' => 'medium'
            ],
            [
                'id' => 'faturalar',
                'title' => 'Faturalar',
                'count' => 5,
                'color' => 'warning',
                'icon' => 'ri-bank-card-line',
                'description' => 'Onay bekleyen faturalar',
                'priority' => 'medium'
            ],
            [
                'id' => 'masraf-talepleri',
                'title' => 'Masraf Talepleri',
                'count' => 15,
                'color' => 'danger',
                'icon' => 'ri-money-dollar-circle-line',
                'description' => 'Onay bekleyen masraf talepleri',
                'priority' => 'high'
            ],
            [
                'id' => 'izin-talepleri',
                'title' => 'İzin Talepleri',
                'count' => 3,
                'color' => 'info',
                'icon' => 'ri-calendar-line',
                'description' => 'Onay bekleyen izin talepleri',
                'priority' => 'low'
            ],
            [
                'id' => 'satinalma',
                'title' => 'Satın Alma',
                'count' => 7,
                'color' => 'secondary',
                'icon' => 'ri-package-line',
                'description' => 'Onay bekleyen satın alma talepleri',
                'priority' => 'medium'
            ]
        ];

        return Inertia::render('Approval/DashboardV2', [
            'approvalTypes' => $approvalTypes
        ]);
    }

    /**
     * Mobile-first approval list (V2)
     */
    public function listV2($type)
    {
        $items = $this->getSampleData($type);
        $typeInfo = $this->getTypeInfo($type);

        return Inertia::render('Approval/ListV2', [
            'type' => $type,
            'typeInfo' => $typeInfo,
            'items' => $items
        ]);
    }

    /**
     * Mobile-first approval detail (V2)
     */
    public function detailV2($type, $id)
    {
        $detail = $this->getSampleDetail($type, $id);
        $typeInfo = $this->getTypeInfo($type);

        return Inertia::render('Approval/DetailV2', [
            'type' => $type,
            'typeInfo' => $typeInfo,
            'detail' => $detail
        ]);
    }

    /**
     * Approve an item
     */
    public function approve($type, $id, Request $request)
    {
        // Onay işlemi - gerçek uygulamada veritabanı güncellenir
        return response()->json([
            'success' => true,
            'message' => 'Başarıyla onaylandı',
            'type' => $type,
            'id' => $id
        ]);
    }

    /**
     * Reject an item
     */
    public function reject($type, $id, Request $request)
    {
        $reason = $request->input('reason', 'Sebep belirtilmedi');

        // Red işlemi - gerçek uygulamada veritabanı güncellenir
        return response()->json([
            'success' => true,
            'message' => 'Başarıyla reddedildi',
            'type' => $type,
            'id' => $id,
            'reason' => $reason
        ]);
    }

    /**
     * Get sample data for testing
     */
    private function getSampleData($type)
    {
        switch($type) {
            case 'siparisler':
                return [
                    [
                        'id' => 1,
                        'orderNo' => 'SIP-2024-001',
                        'customer' => 'ABC Şirketi',
                        'amount' => 25000,
                        'formattedAmount' => '25.000 TL',
                        'date' => '2024-01-15',
                        'formattedDate' => '15 Ocak 2024',
                        'status' => 'pending',
                        'priority' => 'high',
                        'summary' => '100 adet Ürün A, 50 adet Ürün B'
                    ],
                    [
                        'id' => 2,
                        'orderNo' => 'SIP-2024-002',
                        'customer' => 'XYZ Ltd.',
                        'amount' => 42500,
                        'formattedAmount' => '42.500 TL',
                        'date' => '2024-01-16',
                        'formattedDate' => '16 Ocak 2024',
                        'status' => 'pending',
                        'priority' => 'medium',
                        'summary' => '200 adet Ürün C, 75 adet Ürün D'
                    ],
                    [
                        'id' => 3,
                        'orderNo' => 'SIP-2024-003',
                        'customer' => 'DEF A.Ş.',
                        'amount' => 18750,
                        'formattedAmount' => '18.750 TL',
                        'date' => '2024-01-17',
                        'formattedDate' => '17 Ocak 2024',
                        'status' => 'pending',
                        'priority' => 'low',
                        'summary' => '50 adet Ürün E'
                    ]
                ];

            case 'teklifler':
                return [
                    [
                        'id' => 1,
                        'offerNo' => 'TEK-2024-101',
                        'customer' => 'MNO Holding',
                        'amount' => 125000,
                        'formattedAmount' => '125.000 TL',
                        'date' => '2024-01-14',
                        'formattedDate' => '14 Ocak 2024',
                        'status' => 'pending',
                        'priority' => 'high',
                        'validUntil' => '2024-02-14',
                        'summary' => 'Büro mobilyası tedariki'
                    ],
                    [
                        'id' => 2,
                        'offerNo' => 'TEK-2024-102',
                        'customer' => 'PQR Group',
                        'amount' => 87500,
                        'formattedAmount' => '87.500 TL',
                        'date' => '2024-01-15',
                        'formattedDate' => '15 Ocak 2024',
                        'status' => 'pending',
                        'priority' => 'medium',
                        'validUntil' => '2024-02-15',
                        'summary' => 'IT altyapı kurulumu'
                    ]
                ];

            case 'masraf-talepleri':
                return [
                    [
                        'id' => 1,
                        'requestNo' => 'MAS-2024-201',
                        'employee' => 'Ahmet Yılmaz',
                        'department' => 'Satış',
                        'amount' => 3250,
                        'formattedAmount' => '3.250 TL',
                        'date' => '2024-01-16',
                        'formattedDate' => '16 Ocak 2024',
                        'status' => 'pending',
                        'priority' => 'medium',
                        'type' => 'Yol Masrafı',
                        'summary' => 'Ankara - İstanbul seyahat masrafları'
                    ],
                    [
                        'id' => 2,
                        'requestNo' => 'MAS-2024-202',
                        'employee' => 'Ayşe Demir',
                        'department' => 'Pazarlama',
                        'amount' => 1850,
                        'formattedAmount' => '1.850 TL',
                        'date' => '2024-01-17',
                        'formattedDate' => '17 Ocak 2024',
                        'status' => 'pending',
                        'priority' => 'low',
                        'type' => 'Konaklama',
                        'summary' => 'Fuar konaklama masrafları'
                    ]
                ];

            default:
                return [];
        }
    }

    /**
     * Get sample detail data
     */
    private function getSampleDetail($type, $id)
    {
        if ($type === 'siparisler' && $id == 1) {
            return [
                'id' => 1,
                'orderNo' => 'SIP-2024-001',
                'customer' => [
                    'name' => 'ABC Şirketi',
                    'contactPerson' => 'Mehmet Özkan',
                    'phone' => '+90 212 555 1234',
                    'email' => 'mehmet@abcsirketi.com',
                    'address' => 'Maslak Mah. Büyükdere Cad. No:123 Şişli/İstanbul'
                ],
                'date' => '2024-01-15',
                'formattedDate' => '15 Ocak 2024',
                'deliveryDate' => '2024-01-25',
                'formattedDeliveryDate' => '25 Ocak 2024',
                'amount' => 25000,
                'formattedAmount' => '25.000 TL',
                'status' => 'pending',
                'priority' => 'high',
                'items' => [
                    [
                        'name' => 'Ürün A',
                        'description' => 'Yüksek kaliteli ofis sandalyesi',
                        'quantity' => 100,
                        'price' => 150,
                        'formattedPrice' => '150 TL',
                        'total' => 15000,
                        'formattedTotal' => '15.000 TL'
                    ],
                    [
                        'name' => 'Ürün B',
                        'description' => 'Ergonomik çalışma masası',
                        'quantity' => 50,
                        'price' => 200,
                        'formattedPrice' => '200 TL',
                        'total' => 10000,
                        'formattedTotal' => '10.000 TL'
                    ]
                ],
                'notes' => 'Müşteri acil teslimat talep ediyor. Teslimat adresine dikkat edilmesi gerekiyor.',
                'requestedBy' => [
                    'name' => 'Fatma Kaya',
                    'title' => 'Satış Temsilcisi',
                    'department' => 'Satış',
                    'phone' => '+90 555 123 4567'
                ],
                'approvalLevel' => 1,
                'totalApprovalLevels' => 2,
                'previousApprovals' => []
            ];
        }

        if ($type === 'teklifler' && $id == 1) {
            return [
                'id' => 1,
                'offerNo' => 'TEK-2024-101',
                'customer' => [
                    'name' => 'MNO Holding',
                    'contactPerson' => 'Ali Veli',
                    'phone' => '+90 212 555 5678',
                    'email' => 'ali@mnoholding.com'
                ],
                'date' => '2024-01-14',
                'formattedDate' => '14 Ocak 2024',
                'validUntil' => '2024-02-14',
                'formattedValidUntil' => '14 Şubat 2024',
                'amount' => 125000,
                'formattedAmount' => '125.000 TL',
                'status' => 'pending',
                'priority' => 'high',
                'description' => 'Büro mobilyası tedariki projesi için hazırlanan teklif',
                'items' => [
                    [
                        'name' => 'Yönetici Masası',
                        'quantity' => 10,
                        'price' => 5000,
                        'formattedPrice' => '5.000 TL',
                        'total' => 50000,
                        'formattedTotal' => '50.000 TL'
                    ],
                    [
                        'name' => 'Toplantı Masası',
                        'quantity' => 5,
                        'price' => 15000,
                        'formattedPrice' => '15.000 TL',
                        'total' => 75000,
                        'formattedTotal' => '75.000 TL'
                    ]
                ],
                'terms' => [
                    'Ödeme: 30 gün vadeli',
                    'Teslimat: 15 iş günü',
                    'Garanti: 2 yıl',
                    'Kurulum dahil'
                ],
                'requestedBy' => [
                    'name' => 'Zeynep Akgün',
                    'title' => 'Satış Müdürü',
                    'department' => 'Satış'
                ]
            ];
        }

        return null;
    }

    /**
     * Get type information
     */
    private function getTypeInfo($type)
    {
        $typeMap = [
            'siparisler' => ['title' => 'Siparişler', 'icon' => 'ri-shopping-cart-line', 'color' => 'primary'],
            'teklifler' => ['title' => 'Teklifler', 'icon' => 'ri-file-text-line', 'color' => 'success'],
            'faturalar' => ['title' => 'Faturalar', 'icon' => 'ri-bank-card-line', 'color' => 'warning'],
            'masraf-talepleri' => ['title' => 'Masraf Talepleri', 'icon' => 'ri-money-dollar-circle-line', 'color' => 'danger'],
            'izin-talepleri' => ['title' => 'İzin Talepleri', 'icon' => 'ri-calendar-line', 'color' => 'info'],
            'satinalma' => ['title' => 'Satın Alma', 'icon' => 'ri-package-line', 'color' => 'secondary']
        ];

        return $typeMap[$type] ?? ['title' => 'Onay Listesi', 'icon' => 'ri-list-check', 'color' => 'primary'];
    }

    /**
     * Pending Orders and Offers Page with Infinite Scroll
     */
    public function pending()
    {
        return Inertia::render('Approval/Pending');
    }

    /**
     * API endpoint for pending orders and offers with infinite scroll
     */
    public function pendingApi(Request $request)
    {
        $page = $request->get('page', 1);
        $perPage = $request->get('per_page', 20);
        $type = $request->get('type', 'all'); // all, orders, offers

        $results = collect();

        // Orders with order_status = 1
        if ($type === 'all' || $type === 'orders') {
            $ordersQuery = Order::with('entity')
                ->where('order_status', 1)
                ->select('id', 'doc_no', 'entity_id', 'amt', 'doc_date', 'created_at')
                ->orderBy('doc_date', 'desc');
            
            
            $orders = $ordersQuery->get()
                ->map(function ($order) {
                    return [
                        'id' => $order->id,
                        'type' => 'order',
                        'doc_no' => $order->doc_no,
                        'entity_name' => $order->entity?->entity_name ?? 'N/A',
                        'amount' => number_format($order->amt, 2) . ' TL',
                        'date' => $order->doc_date?->format('d.m.Y') ?? 'N/A',
                        'sort_date' => $order->doc_date ?? now(),
                    ];
                });
            
            $results = $results->merge($orders);
        }

        // Offers with offer_status = 1
        if ($type === 'all' || $type === 'offers') {
            $offersQuery = Offer::with('entity')
                ->where('offer_status', 1)
                ->select('id', 'doc_no', 'entity_id', 'amt', 'doc_date')
                ->orderBy('doc_date', 'desc');
            
            
            $offers = $offersQuery->get()
                ->map(function ($offer) {
                    return [
                        'id' => $offer->id,
                        'type' => 'offer',
                        'doc_no' => $offer->doc_no,
                        'entity_name' => $offer->entity?->entity_name ?? 'N/A',
                        'amount' => number_format($offer->amt, 2) . ' TL',
                        'date' => $offer->doc_date?->format('d.m.Y') ?? 'N/A',
                        'sort_date' => $offer->doc_date ?? now(),
                    ];
                });
            
            $results = $results->merge($offers);
        }


        // Sort by sort_date desc
        $results = $results->sortByDesc('sort_date');

        // Paginate results
        $total = $results->count();
        $offset = ($page - 1) * $perPage;
        $items = $results->skip($offset)->take($perPage)->values();

        return response()->json([
            'data' => $items,
            'current_page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'last_page' => ceil($total / $perPage),
            'has_more' => $page < ceil($total / $perPage),
        ]);
    }
}
