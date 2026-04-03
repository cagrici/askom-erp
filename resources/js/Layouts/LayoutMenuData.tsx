import { Inertia } from "@inertiajs/inertia";
import React, { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import { usePage } from '@inertiajs/react';
import { getRoleBasedHomeUrl } from '../utils/roleUtils';

const Navdata = () => {
    const { props, url } = usePage<any>();
    const user = props.auth?.user;

    // URL'den aktif menüyü belirle
    const getActiveMenuFromUrl = (currentUrl: string) => {
        // Remove query parameters and fragments
        const cleanUrl = currentUrl.split('?')[0].split('#')[0];

        if (cleanUrl.startsWith('/products/')) return 'products';
        if (cleanUrl.startsWith('/stock/')) return 'stock-management';
        if (cleanUrl.startsWith('/sales/')) return 'sales';
        if (cleanUrl.startsWith('/purchasing/')) return 'purchasing';
        if (cleanUrl.startsWith('/inventory/')) return 'inventory';
        if (cleanUrl.startsWith('/warehouses/') || cleanUrl === '/warehouses') return 'warehouse';
        if (cleanUrl.startsWith('/crm/')) return 'crm';
        if (cleanUrl.startsWith('/accounting/')) return 'accounting';
        if (cleanUrl.startsWith('/expenses/')) return 'expenses';
        if (cleanUrl.startsWith('/logistics/')) return 'logistics';
        if (cleanUrl.startsWith('/warehouse/')) return 'logistics';
        if (cleanUrl.startsWith('/reports/')) return 'reports';
        if (cleanUrl.startsWith('/admin/')) return 'user-management';
        if (cleanUrl.startsWith('/settings/')) return 'settings';
        if (cleanUrl.startsWith('/b2b/')) return 'b2b-portal';

        return null;
    };

    const activeMenu = getActiveMenuFromUrl(url);

    // Alt menü öğesinin aktif olup olmadığını kontrol et
    const isSubMenuActive = (link: string) => {
        if (!link || link === '/#') return false;
        const cleanUrl = url.split('?')[0].split('#')[0];
        const cleanLink = link.split('?')[0].split('#')[0];

        // Exact match
        if (cleanUrl === cleanLink) return true;

        // Special cases for products
        if (cleanLink === '/products/list' && cleanUrl.startsWith('/products/') && !cleanUrl.includes('/categories') && !cleanUrl.includes('/brands') && !cleanUrl.includes('/units') && !cleanUrl.includes('/variants') && !cleanUrl.includes('/bundles') && !cleanUrl.includes('/barcodes') && !cleanUrl.includes('/images')) {
            return true;
        }

        return false;
    };

    // Super admin kontrolü
    const isSuperAdmin = () => {
        return hasRole('Super Admin');
    };

    // Permission kontrolü için helper fonksiyon
    const hasPermission = (permission: string) => {
        return isSuperAdmin() || user?.permissions?.some((p: any) => p.name === permission) || false;
    };

    // Role kontrolü için helper fonksiyon
    const hasRole = (role: string) => {
        return user?.roles?.some((r: any) => r.name === role) || false;
    };

    // Çoklu permission kontrolü (herhangi biri varsa true)
    const hasAnyPermission = (permissions: string[]) => {
        return isSuperAdmin() || permissions.some(permission => hasPermission(permission));
    };

    // Admin rolü kontrolü (admin veya super admin)
    const isAdmin = () => {
        if (isSuperAdmin()) return true;
        const adminRoles = ['admin', 'Admin', 'yonetim', 'Yönetim', 'Yonetim', 'company_manager'];
        return adminRoles.some(role => hasRole(role));
    };

    //state data
    const [isDashboard, setIsDashboard] = useState<boolean>(false);
    const [isApps, setIsApps] = useState<boolean>(false);
    const [isAuth, setIsAuth] = useState<boolean>(false);
    const [isPages, setIsPages] = useState<boolean>(false);
    const [isBaseUi, setIsBaseUi] = useState<boolean>(false);
    const [isUserManagement, setIsUserManagement] = useState<boolean>(false);
    const [isVisitorManagement, setIsVisitorManagement] = useState<boolean>(false);
    const [isDocumentManagement, setIsDocumentManagement] = useState<boolean>(false);
    const [isProduction, setIsProduction] = useState<boolean>(false);
    const [isFleetManagement, setIsFleetManagement] = useState<boolean>(false);
    const [isForms, setIsForms] = useState<boolean>(false);
    const [isTables, setIsTables] = useState<boolean>(false);
    const [isCharts, setIsCharts] = useState<boolean>(false);
    const [isIcons, setIsIcons] = useState<boolean>(false);
    const [isMaps, setIsMaps] = useState<boolean>(false);
    const [isMultiLevel, setIsMultiLevel] = useState<boolean>(false);
    const [isExpenses, setIsExpenses] = useState<boolean>(false);
    const [isReports, setIsReports] = useState<boolean>(false);
    const [isInfo, setIsInfo] = useState<boolean>(false);
    const [isMeetings, setIsMeetings] = useState<boolean>(false);
    const [isInventory, setIsInventory] = useState<boolean>(false);
    const [isWarehouse, setIsWarehouse] = useState<boolean>(false);


    const [iscurrentState, setIscurrentState] = useState('Dashboard');
    const { t } = useTranslation();

    function updateIconSidebar(e: any) {
        if (e && e.target && e.target.getAttribute("sub-items")) {
            const ul: any = document.getElementById("two-column-menu");
            const iconItems: any = ul.querySelectorAll(".nav-icon.active");
            let activeIconItems = [...iconItems];
            activeIconItems.forEach((item) => {
                item.classList.remove("active");
                var id = item.getAttribute("sub-items");
                const getID: any = document.getElementById(id) as HTMLElement;
                if (getID)
                    getID?.parentElement.classList.remove("show");
            });
        }
    }

    // URL değiştiğinde aktif menüyü ayarla
    useEffect(() => {
        // Tüm menüleri kapat
        setIsApps(false);
        setIsAuth(false);
        setIsPages(false);
        setIsBaseUi(false);
        setIsUserManagement(false);
        setIsVisitorManagement(false);
        setIsDocumentManagement(false);
        setIsProduction(false);
        setIsFleetManagement(false);
        setIsForms(false);
        setIsTables(false);
        setIsCharts(false);
        setIsIcons(false);
        setIsMaps(false);
        setIsMultiLevel(false);
        setIsExpenses(false);
        setIsReports(false);
        setIsInfo(false);
        setIsMeetings(false);
        setIsInventory(false);
        setIsWarehouse(false);

        // URL'e göre uygun menüyü aç
        switch (activeMenu) {
            case 'products':
                setIsIcons(true);
                setIscurrentState('Icons');
                break;
            case 'sales':
                setIsApps(true);
                setIscurrentState('Apps');
                break;
            case 'purchasing':
                setIsForms(true);
                setIscurrentState('Forms');
                break;
            case 'inventory':
                setIsInventory(true);
                setIscurrentState('Inventory');
                break;
            case 'warehouse':
                setIsWarehouse(true);
                setIscurrentState('Warehouse');
                break;
            case 'crm':
                setIsMaps(true);
                setIscurrentState('Maps');
                break;
            case 'accounting':
                setIsMultiLevel(true);
                setIscurrentState('MuliLevel');
                break;
            case 'expenses':
                setIsExpenses(true);
                setIscurrentState('Expenses');
                break;
            case 'logistics':
                setIsFleetManagement(true);
                setIscurrentState('FleetManagement');
                break;
            case 'reports':
                setIsReports(true);
                setIscurrentState('Reports');
                break;
            case 'user-management':
                setIsUserManagement(true);
                setIscurrentState('UserManagement');
                break;
            case 'settings':
                setIsAuth(true);
                setIscurrentState('Auth');
                break;
            case 'b2b-portal':
                setIsBaseUi(true);
                setIscurrentState('BaseUi');
                break;
            default:
                setIscurrentState('Dashboard');
                break;
        }

        document.body.classList.remove('twocolumn-panel');
    }, [url, activeMenu]);

    const menuItems: any = [
        {
            label: t("Menu"),
            isHeader: true,
        },

        {
            id: "home",
            label: t('Dashboard'),
            link: getRoleBasedHomeUrl(user),
            icon: "ri-dashboard-line",
            subItems: [

            ],
        },

        // SATIŞ YÖNETİMİ
        {
            label: t("Satış"),
            isHeader: true,
        },
        {
            id: "sales",
            label: "Satış Yönetimi",
            icon: "ri-shopping-cart-line",
            link: "/#",

            click: function (e: any) {
                e.preventDefault();
                setIsApps(!isApps);
                setIscurrentState('Apps');
                updateIconSidebar(e);
            },
            stateVariables: isApps,
            subItems: [
                {id: "sales-orders", label: "Siparişler", link: "/sales/orders", parentId: "sales", isActive: isSubMenuActive("/sales/orders")},
                {id: "sales-offers", label: "Teklifler", link: "/sales/offers", parentId: "sales", isActive: isSubMenuActive("/sales/offers")},
                {id: "sales-invoices", label: "Faturalar", link: "/sales/invoices", parentId: "sales", isActive: isSubMenuActive("/sales/invoices"), visible: !hasRole('sales_representative')},
                {id: "sales-returns", label: "İadeler", link: "/sales/returns", parentId: "sales", isActive: isSubMenuActive("/sales/returns")},
                {id: "sales-campaigns", label: "Kampanyalar", link: "/sales/campaigns", parentId: "sales", isActive: isSubMenuActive("/sales/campaigns")},
                {id: "sales-price-lists", label: "Fiyat Listeleri", link: "/sales/price-lists", parentId: "sales", isActive: isSubMenuActive("/sales/price-lists"), visible: !hasRole('sales_representative')},
                {id: "sales-discounts", label: "İskontolar", link: "/sales/discounts", parentId: "sales", isActive: isSubMenuActive("/sales/discounts"), visible: !hasRole('sales_representative')},
                {id: "sales-targets", label: "Satış Hedefleri", link: "/sales/targets", parentId: "sales", isActive: isSubMenuActive("/sales/targets"), visible: !hasRole('sales_representative')},
                {id: "sales-analytics", label: "Satış Analitiği", link: "/sales/analytics", parentId: "sales", isActive: isSubMenuActive("/sales/analytics"), visible: !hasRole('sales_representative')},
            ].filter(item => item.visible !== false),
        },


        // SATIN ALMA
        {
            label: t("Tedarik"),
            isHeader: true,
        },
        {
            id: "purchasing",
            label: "Satınalma",
            icon: "ri-shopping-bag-line",
            link: "/#",
            click: function (e: any) {
                e.preventDefault();
                setIsForms(!isForms);
                setIscurrentState('Forms');
                updateIconSidebar(e);
            },
            stateVariables: isForms,
            subItems: [
                {id: "purchase-orders", label: "Satınalma Siparişleri", link: "/purchasing/orders", parentId: "purchasing", isActive: isSubMenuActive("/purchasing/orders")},
                {id: "purchase-requests", label: "Satınalma Talepleri", link: "/purchasing/requests", parentId: "purchasing", isActive: isSubMenuActive("/purchasing/requests")},
                {id: "suppliers", label: "Tedarikçiler", link: "/purchasing/suppliers", parentId: "purchasing", isActive: isSubMenuActive("/purchasing/suppliers")},
                {id: "supplier-offers", label: "Tedarikçi Teklifleri", link: "/purchasing/offers", parentId: "purchasing", isActive: isSubMenuActive("/purchasing/offers")},
                {id: "purchase-contracts", label: "Sözleşmeler", link: "/purchasing/contracts", parentId: "purchasing", isActive: isSubMenuActive("/purchasing/contracts")},
                {id: "purchase-invoices", label: "Alış Faturaları", link: "/purchasing/invoices", parentId: "purchasing", isActive: isSubMenuActive("/purchasing/invoices")},
                {id: "supplier-performance", label: "Tedarikçi Performansı", link: "/purchasing/performance", parentId: "purchasing", isActive: isSubMenuActive("/purchasing/performance")},
            ],
        },

        // STOK & DEPO YÖNETİMİ
        {
            label: t("Stok & Depo"),
            isHeader: true,
        },
        {
            id: "stock-management",
            label: "Stok Yönetimi",
            icon: "ri-stack-line",
            link: "/#",
            visible: hasAnyPermission(['stock.view', 'stock.adjust', 'stock.transfer', 'stock.reports']),
            click: function (e: any) {
                e.preventDefault();
                setIsTables(!isTables);
                setIscurrentState('Tables');
                updateIconSidebar(e);
            },
            stateVariables: isTables,
            subItems: [
                {id: "stock-list", label: "Stok Listesi", link: "/stock", parentId: "stock-management", isActive: isSubMenuActive("/stock"), visible: hasPermission('stock.view')},
                {id: "stock-movements", label: "Stok Hareketleri", link: "/stock/movements", parentId: "stock-management", isActive: isSubMenuActive("/stock/movements"), visible: hasPermission('stock.movements')},
                {id: "stock-adjustments", label: "Stok Düzeltme", link: "/stock/adjustments", parentId: "stock-management", isActive: isSubMenuActive("/stock/adjustments"), visible: hasPermission('stock.adjust')},
                {id: "stock-transfers", label: "Stok Transferi", link: "/stock/transfers", parentId: "stock-management", isActive: isSubMenuActive("/stock/transfers"), visible: hasPermission('stock.transfer')},
                {id: "low-stock-alerts", label: "Düşük Stok Uyarıları", link: "/stock/low-stock-alerts", parentId: "stock-management", isActive: isSubMenuActive("/stock/low-stock-alerts"), visible: hasPermission('stock.view')},
                {id: "stock-reports", label: "Stok Raporları", link: "/stock/reports", parentId: "stock-management", isActive: isSubMenuActive("/stock/reports"), visible: hasPermission('stock.reports')},
            ].filter(item => item.visible !== false),
        },
        {
            id: "inventory",
            label: "Envanter Takip",
            icon: "ri-qr-code-line",
            link: "/#",
            visible: hasAnyPermission(['inventory.view', 'inventory.dashboard', 'inventory.items.view', 'inventory.stocks.view']),
            click: function (e: any) {
                e.preventDefault();
                setIsInventory(!isInventory);
                setIscurrentState('Inventory');
                updateIconSidebar(e);
            },
            stateVariables: isInventory,
            subItems: [
                {id: "inventory-dashboard", label: "Envanter Dashboard", link: "/inventory", parentId: "inventory", isActive: isSubMenuActive("/inventory"), visible: hasPermission('inventory.dashboard')},
                {id: "inventory-items", label: "Envanter Kalemleri", link: "/inventory/items", parentId: "inventory", isActive: isSubMenuActive("/inventory/items"), visible: hasPermission('inventory.items.view')},
                {id: "inventory-movements", label: "Envanter Hareketleri", link: "/inventory/movements", parentId: "inventory", isActive: isSubMenuActive("/inventory/movements"), visible: hasPermission('inventory.movements.view')},
                {id: "inventory-stocks", label: "Stok Seviyeleri", link: "/inventory/stocks", parentId: "inventory", isActive: isSubMenuActive("/inventory/stocks"), visible: hasPermission('inventory.stocks.view')},
                {id: "inventory-alerts", label: "Envanter Uyarıları", link: "/inventory/alerts", parentId: "inventory", isActive: isSubMenuActive("/inventory/alerts"), visible: hasPermission('inventory.alerts.view')},
                {id: "inventory-barcodes", label: "Barkod Yönetimi", link: "/inventory/barcodes", parentId: "inventory", isActive: isSubMenuActive("/inventory/barcodes"), visible: hasPermission('inventory.barcodes.view')},
                {id: "inventory-reports", label: "Envanter Raporları", link: "/inventory/reports", parentId: "inventory", isActive: isSubMenuActive("/inventory/reports"), visible: hasPermission('inventory.reports')},
            ].filter(item => item.visible !== false),
        },
        {
            id: "warehouse",
            label: "Depo Yönetimi",
            icon: "ri-building-line",
            link: "/#",
            visible: hasAnyPermission(['warehouse.view', 'warehouse.dashboard', 'warehouse.receiving.view', 'warehouse.picking.view', 'warehouse.shipping.view']),
            click: function (e: any) {
                e.preventDefault();
                setIsWarehouse(!isWarehouse);
                setIscurrentState('Warehouse');
                updateIconSidebar(e);
            },
            stateVariables: isWarehouse,
            subItems: [
                {id: "warehouse-dashboard", label: "Depo Dashboard", link: "/warehouses/dashboard", parentId: "warehouse", isActive: isSubMenuActive("/warehouses/dashboard"), visible: hasPermission('warehouse.dashboard')},
                {id: "warehouses", label: "Depolar", link: "/warehouses", parentId: "warehouse", isActive: isSubMenuActive("/warehouses"), visible: hasPermission('warehouse.view')},
                {id: "warehouse-zones", label: "Depo Bölgeleri", link: "/warehouses/zones", parentId: "warehouse", isActive: isSubMenuActive("/warehouses/zones"), visible: hasPermission('warehouse.zones.view')},
                {id: "warehouse-locations", label: "Depolama Lokasyonları", link: "/warehouses/locations", parentId: "warehouse", isActive: isSubMenuActive("/warehouses/locations"), visible: hasPermission('warehouse.locations.view')},
                {id: "warehouse-receiving", label: "Mal Kabul", link: "/warehouses/receiving", parentId: "warehouse", isActive: isSubMenuActive("/warehouses/receiving"), visible: hasPermission('warehouse.receiving.view')},
                {id: "warehouse-quality-control", label: "Kalite Kontrol", link: "/warehouses/quality-control", parentId: "warehouse", isActive: isSubMenuActive("/warehouses/quality-control"), visible: hasPermission('warehouse.qc.view')},
                {id: "warehouse-putaway", label: "Yerleştirme", link: "/warehouses/putaway", parentId: "warehouse", isActive: isSubMenuActive("/warehouses/putaway"), visible: hasPermission('warehouse.putaway.view')},
                {id: "warehouse-operations", label: "Depo Operasyonları", link: "/warehouses/operations", parentId: "warehouse", isActive: isSubMenuActive("/warehouses/operations"), visible: hasPermission('warehouse.operations.view')},
                {id: "warehouse-staff", label: "Depo Personeli", link: "/warehouses/staff", parentId: "warehouse", isActive: isSubMenuActive("/warehouses/staff"), visible: hasPermission('warehouse.staff.view')},
                {id: "warehouse-reports", label: "Depo Raporları", link: "/warehouses/reports", parentId: "warehouse", isActive: isSubMenuActive("/warehouses/reports"), visible: hasPermission('warehouse.reports')},
            ].filter(item => item.visible !== false),
        },

        // ÜRÜN YÖNETİMİ
        {
            label: t("Products"),
            isHeader: true,
        },
        {
            id: "products",
            label: "Ürün Yönetimi",
            icon: "ri-archive-line",
            link: "/#",
            click: function (e: any) {
                e.preventDefault();
                setIsIcons(!isIcons);
                setIscurrentState('Icons');
                updateIconSidebar(e);
            },
            stateVariables: isIcons,
            subItems: [
                {id: "product-list", label: "Ürünler", link: "/products/list", parentId: "products", isActive: isSubMenuActive("/products/list")},
                {id: "product-categories", label: "Kategoriler", link: "/products/categories", parentId: "products", isActive: isSubMenuActive("/products/categories")},
                {id: "product-brands", label: "Markalar", link: "/products/brands", parentId: "products", isActive: isSubMenuActive("/products/brands")},
                {id: "product-units", label: "Birimler", link: "/products/units", parentId: "products", isActive: isSubMenuActive("/products/units")},
                {id: "product-variants", label: "Varyantlar", link: "/products/variants", parentId: "products", isActive: isSubMenuActive("/products/variants")},
                {id: "product-bundles", label: "Ürün Setleri", link: "/products/bundles", parentId: "products", isActive: isSubMenuActive("/products/bundles")},
                {id: "product-barcodes", label: "Barkodlar", link: "/products/barcodes", parentId: "products", isActive: isSubMenuActive("/products/barcodes")},
                {id: "product-images", label: "Ürün Görselleri", link: "/products/images", parentId: "products", isActive: isSubMenuActive("/products/images")},
            ],
        },

        // CRM
        {
            label: t("Müşteri İlişkileri"),
            isHeader: true,
        },
        {
            id: "crm",
            label: "CRM",
            icon: "ri-customer-service-line",
            link: "/#",
            click: function (e: any) {
                e.preventDefault();
                setIsMaps(!isMaps);
                setIscurrentState('Maps');
                updateIconSidebar(e);
            },
            stateVariables: isMaps,
            subItems: [
                {id: "crm-dashboard", label: "CRM Dashboard", link: "/crm/dashboard", parentId: "crm", isActive: isSubMenuActive("/crm/dashboard")},
                {id: "crm-leads", label: "Potansiyel Müşteriler", link: "/crm/leads", parentId: "crm", isActive: isSubMenuActive("/crm/leads")},
                {id: "crm-leads-kanban", label: "Lead Kanban", link: "/crm/leads/kanban", parentId: "crm", isActive: isSubMenuActive("/crm/leads/kanban")},
                {id: "crm-pipeline", label: "Teklif Pipeline", link: "/crm/pipeline", parentId: "crm", isActive: isSubMenuActive("/crm/pipeline")},
                {id: "crm-activities", label: "Aktiviteler", link: "/crm/activities", parentId: "crm", isActive: isSubMenuActive("/crm/activities")},
                {id: "crm-tasks", label: "Görevler", link: "/crm/tasks", parentId: "crm", isActive: isSubMenuActive("/crm/tasks")},
                {id: "customers", label: "Müşteriler", link: "/accounting/current-accounts?type=customer", parentId: "crm", isActive: isSubMenuActive("/accounting/current-accounts")},
            ],
        },

        // MUHASEBE & FİNANS
        {
            label: t("Finans"),
            isHeader: true,
        },
        {
            id: "accounting",
            label: "Muhasebe",
            icon: "ri-calculator-line",
            link: "/#",
            click: function (e: any) {
                e.preventDefault();
                setIsMultiLevel(!isMultiLevel);
                setIscurrentState('MuliLevel');
                updateIconSidebar(e);
            },
            stateVariables: isMultiLevel,
            subItems: [
                {id: "account-cards", label: "Cari Kartlar", link: "/accounting/current-accounts", parentId: "accounting", isActive: isSubMenuActive("/accounting/current-accounts")},
                {id: "account-movements", label: "Cari Hareketler", link: "/accounting/movements", parentId: "accounting"},
                {id: "collections", label: "Tahsilatlar", link: "/accounting/collections", parentId: "accounting"},
                {id: "payments", label: "Ödemeler", link: "/accounting/payments", parentId: "accounting"},
                {id: "bank-accounts", label: "Banka Hesapları", link: "/accounting/bank-accounts", parentId: "accounting"},
                {id: "cash-accounts", label: "Kasa İşlemleri", link: "/accounting/cash", parentId: "accounting", visible: !hasRole('sales_representative')},
                {id: "expense-management", label: "Masraf Yönetimi", link: "/accounting/expenses", parentId: "accounting", visible: !hasRole('sales_representative')},
                {id: "cash-flow", label: "Nakit Akışı", link: "/accounting/cash-flow", parentId: "accounting", visible: hasPermission('reports.view_cash_flow')},
                {id: "aging-reports", label: "Vade Analizleri", link: "/accounting/aging", parentId: "accounting"},
            ].filter(item => item.visible !== false),
        },



        // LOJİSTİK
        {
            label: t("Lojistik"),
            isHeader: true,
        },
        {
            id: "logistics",
            label: "Lojistik Yönetimi",
            icon: "ri-truck-line",
            link: "/#",
            visible: hasAnyPermission(['warehouse.shipping.view', 'warehouse.picking.view', 'warehouse.vehicles.view', 'warehouse.drivers.view', 'logistics.view']),
            click: function (e: any) {
                e.preventDefault();
                setIsFleetManagement(!isFleetManagement);
                setIscurrentState('FleetManagement');
                updateIconSidebar(e);
            },
            stateVariables: isFleetManagement,
            subItems: [
                {id: "shipping-orders", label: "Sevk Emirleri", link: "/warehouse/shipping-orders", parentId: "logistics", isActive: isSubMenuActive("/warehouse/shipping-orders"), visible: hasPermission('warehouse.shipping.view')},
                {id: "picking-tasks", label: "Toplama Görevleri", link: "/warehouse/picking-tasks", parentId: "logistics", isActive: isSubMenuActive("/warehouse/picking-tasks"), visible: hasPermission('warehouse.picking.view')},
                {id: "fleet-vehicles", label: "Araçlar", link: "/logistics/vehicles", parentId: "logistics", isActive: isSubMenuActive("/logistics/vehicles"), visible: hasPermission('warehouse.vehicles.view')},
                {id: "fleet-drivers", label: "Şoförler", link: "/warehouse/drivers", parentId: "logistics", isActive: isSubMenuActive("/warehouse/drivers"), visible: hasPermission('warehouse.drivers.view')},
                {id: "delivery-planning", label: "Sevkiyat Planlama", link: "/logistics/planning", parentId: "logistics", isActive: isSubMenuActive("/logistics/planning"), visible: hasPermission('logistics.planning')},
                {id: "routes", label: "Rotalar", link: "/logistics/routes", parentId: "logistics", isActive: isSubMenuActive("/logistics/routes"), visible: hasPermission('logistics.routes')},
                {id: "delivery-tracking", label: "Teslimat Takibi", link: "/logistics/tracking", parentId: "logistics", isActive: isSubMenuActive("/logistics/tracking"), visible: hasPermission('logistics.tracking')},
                {id: "carriers", label: "Nakliye Firmaları", link: "/logistics/carriers", parentId: "logistics", isActive: isSubMenuActive("/logistics/carriers"), visible: hasPermission('logistics.view')},
                {id: "freight-costs", label: "Navlun Maliyetleri", link: "/logistics/costs", parentId: "logistics", isActive: isSubMenuActive("/logistics/costs"), visible: hasPermission('logistics.view')},
            ].filter(item => item.visible !== false),
        },

        // RAPORLAMA
        {
            label: t("Raporlar"),
            isHeader: true,
        },
        {
            id: "reports",
            label: "Raporlama",
            icon: "ri-bar-chart-line",
            link: "/#",
            visible: hasRole('yonetim') || isAdmin(),
            click: function (e: any) {
                e.preventDefault();
                setIsReports(!isReports);
                setIscurrentState('Reports');
                updateIconSidebar(e);
            },
            stateVariables: isReports,
            subItems: [
                {id: "sales-reports", label: "Satış Raporları", link: "/reports/sales", parentId: "reports", isActive: isSubMenuActive("/reports/sales")},
                {id: "stock-reports", label: "Stok Raporları", link: "/stock/reports", parentId: "reports", isActive: isSubMenuActive("/stock/reports")},
                {id: "financial-reports", label: "Mali Raporlar", link: "/reports/financial", parentId: "reports", isActive: isSubMenuActive("/reports/financial")},
                {id: "customer-reports", label: "Müşteri Raporları", link: "/reports/customers", parentId: "reports", isActive: isSubMenuActive("/reports/customers")},
                {id: "product-reports", label: "Ürün Analizleri", link: "/reports/products", parentId: "reports", isActive: isSubMenuActive("/reports/products")},
                {id: "performance-reports", label: "Performans Raporları", link: "/reports/performance", parentId: "reports", isActive: isSubMenuActive("/reports/performance")},
                {id: "custom-reports", label: "Özel Raporlar", link: "/reports/custom", parentId: "reports", isActive: isSubMenuActive("/reports/custom")},
            ],
        },

        // YÖNETİM - Sadece admin ve super admin görebilir
        {
            label: t("Yönetim"),
            isHeader: true,
            visible: isAdmin(),
        },

        // Kullanıcı Yönetimi - Sadece admin ve super admin görebilir
        {
            id: "user-management",
            label: "Kullanıcı Yönetimi",
            icon: "ri-user-settings-line",
            link: "/#",
            visible: isAdmin(),
            click: function (e: any) {
                e.preventDefault();
                setIsUserManagement(!isUserManagement);
                setIscurrentState('UserManagement');
                updateIconSidebar(e);
            },
            stateVariables: isUserManagement,
            subItems: [
                {id: "users", label: "Kullanıcılar", link: "/admin/users", parentId: "user-management", isActive: isSubMenuActive("/admin/users")},
                {id: "roles", label: "Roller", link: "/admin/roles", parentId: "user-management", isActive: isSubMenuActive("/admin/roles")},
                {id: "permissions", label: "Yetkiler", link: "/admin/permissions", parentId: "user-management", isActive: isSubMenuActive("/admin/permissions")},
                {id: "departments", label: "Departmanlar", link: "/admin/departments", parentId: "user-management", isActive: isSubMenuActive("/admin/departments")},
                {id: "positions", label: "Pozisyonlar", link: "/admin/positions", parentId: "user-management", isActive: isSubMenuActive("/admin/positions")},
            ],
        },

        // Sistem Ayarları - Sadece admin ve super admin görebilir
        {
            id: "settings",
            label: "Sistem Ayarları",
            icon: "ri-settings-3-line",
            link: "/#",
            visible: isAdmin(),
            click: function (e: any) {
                e.preventDefault();
                setIsAuth(!isAuth);
                setIscurrentState('Auth');
                updateIconSidebar(e);
            },
            stateVariables: isAuth,
            subItems: [
                {id: "general-settings", label: "Genel Ayarlar", link: "/settings/general", parentId: "settings"},
                {id: "company-info", label: "Firma Bilgileri", link: "/settings/company", parentId: "settings"},
                {id: "locations", label: "Lokasyonlar", link: "/settings/locations", parentId: "settings"},
                {id: "currencies", label: "Para Birimleri", link: "/settings/currencies", parentId: "settings"},
                {id: "tax-settings", label: "Vergi Ayarları", link: "/settings/tax", parentId: "settings"},
                {id: "email-settings", label: "E-posta Ayarları", link: "/settings/email", parentId: "settings"},
                {id: "integrations", label: "Entegrasyonlar", link: "/settings/integrations", parentId: "settings"},
                {id: "backup", label: "Yedekleme", link: "/settings/backup", parentId: "settings"},
            ],
        },

        // B2B MÜŞTERİ PORTALI
        {
            id: "b2b-portal",
            label: "B2B Portal",
            icon: "ri-user-star-line",
            link: "/portal",


        },
        // B2C MÜŞTERİ PORTALI
        {
            id: "b2c-portal",
            label: "B2C Portal",
            icon: "ri-shopping-bag-2-line",
            link: "https://www.askom.com/admin",
            target: "_blank",
        },

        // Dokümantasyon
        {
            id: "documentation",
            label: "Yardım & Eğitim",
            icon: "ri-book-2-line",
            link: "/documentation",
        },

    ];
    return <React.Fragment>{menuItems}</React.Fragment>;
};
export default Navdata;
