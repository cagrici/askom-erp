import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Card, Row, Col, Form, Button, Table, InputGroup, Alert, Badge, Image } from 'react-bootstrap';
import Layout from '@/Layouts';
import axios from 'axios';
import BulkDiscountPanel from '@/Components/BulkDiscountPanel';

interface Customer {
    id: number;
    entity_name: string;
    entity_code: string;
    phone?: string;
    email?: string;
    address?: string;
    current_balance?: number;
    currency?: string;
}

interface Category {
    id: number;
    name: string;
}

interface Brand {
    id: number;
    name: string;
}

interface Supplier {
    id: number;
    title: string;
    account_code: string;
}

interface Product {
    id: number;
    name: string;
    code: string;
    sale_price: number;
    sale_price_try?: number;
    currency?: string;
    tax_rate?: number;
    stock_quantity: number;
    image_url?: string;
    category_id?: number;
    brand_id?: number;
    supplier_id?: number;
    category?: Category;
    brand?: Brand;
    supplier?: Supplier;
    active_units?: ProductUnit[];
    baseUnit?: Unit;
}

interface CurrencyOption {
    id: number;
    cur_code: string;
    symbol: string;
    description: string;
}

interface Unit {
    id: number;
    name: string;
    symbol: string;
    type?: string;
}

interface ProductUnit {
    id: number;
    unit_id: number;
    unit_name: string;
    unit_code: string;
    conversion_factor: number;
    sale_price: number;
    is_base_unit: boolean;
    unit?: Unit;
}

interface OfferItem {
    id?: string;
    product_id?: number;
    product_name: string;
    product_code?: string;
    description?: string;
    unit_id?: number | null;
    quantity: number;
    unit_price: number;
    // 3 kademeli iskonto
    discount_rate1: number;
    discount_rate2: number;
    discount_rate3: number;
    discount_amount: number;
    tax_rate: number;
    tax_amount: number;
    line_total: number;
    total: number;
    image_url?: string;
    original_unit_price?: number;
    original_currency?: string;
    original_price_in_currency?: number;
    bulk_discount_applied?: boolean;
    discount_source?: 'manual' | 'bulk_category' | 'bulk_brand' | 'bulk_supplier';
    // Bulk discount için gerekli alanlar (flat structure)
    category_id?: number;
    brand_id?: number;
    supplier_id?: number;
    category?: Category;
    brand?: Brand;
    supplier?: Supplier;
    // Product reference for unit selection
    product?: Product;
}

interface ExchangeRates {
    [key: string]: {
        code: string;
        name: string;
        rate: number;
        date: string;
    };
}

interface Props {
    units: any[];
    currencies: CurrencyOption[];
    locations: any[];
}

const fmt = (n: number) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

export default function Create({ units, currencies, locations }: Props) {
    const auth = usePage().props.auth as any;
    const userRoles = auth?.user?.roles?.map((r: any) => r.name) || [];
    const canEditPrice = userRoles.some((r: string) => ['admin', 'Super Admin', 'sales_manager', 'sales-manager'].includes(r));

    // Teklif tarihinden 3 iş günü sonrasını hesapla
    const addBusinessDays = (date: Date, days: number): Date => {
        const result = new Date(date);
        let added = 0;
        while (added < days) {
            result.setDate(result.getDate() + 1);
            const day = result.getDay();
            if (day !== 0 && day !== 6) added++; // Cumartesi ve Pazar hariç
        }
        return result;
    };

    const { data, setData, post, processing, errors } = useForm({
        offer_date: new Date().toISOString().split('T')[0],
        valid_until_date: addBusinessDays(new Date(), 3).toISOString().split('T')[0],
        entity_id: '',
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        customer_address: '',
        customer_type: 'temporary',
        discount_rate: 0,
        tax_rate: 20,
        currency_id: 114,
        location_id: '',
        notes: '',
        customer_notes: '',
        items: [] as OfferItem[]
    });

    const [productSearch, setProductSearch] = useState('');
    const [customerSearch, setCustomerSearch] = useState('');
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [productPage, setProductPage] = useState(1);
    const [hasMoreProducts, setHasMoreProducts] = useState(false);
    const [loadingMoreProducts, setLoadingMoreProducts] = useState(false);
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [showBulkDiscount, setShowBulkDiscount] = useState(false);
    const [editingPrices, setEditingPrices] = useState<{[key: number]: string}>({});
    const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());
    const productSearchRef = useRef<HTMLDivElement>(null);

    // Currency management
    const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({});
    const [currencyLocked, setCurrencyLocked] = useState(false);
    const [loadingRates, setLoadingRates] = useState(false);

    // Get selected currency info
    const selectedCurrency = currencies.find(c => c.id === data.currency_id);
    const offerCurrencyCode = selectedCurrency?.cur_code || 'TRY';
    const getCurrencySymbol = (currencyCode: string) =>
        currencies.find(c => c.cur_code === currencyCode)?.symbol
        || (currencyCode === 'TRY' ? '₺' : currencyCode === 'USD' ? '$' : currencyCode === 'EUR' ? '€' : currencyCode + ' ');
    const currencySymbol = selectedCurrency?.symbol || getCurrencySymbol(offerCurrencyCode);

    // Load exchange rates on mount
    useEffect(() => {
        setLoadingRates(true);
        axios.get(route('sales.offers.exchange-rates'))
            .then(response => {
                if (response.data.success) {
                    setExchangeRates(response.data.rates);
                }
            })
            .catch(console.error)
            .finally(() => setLoadingRates(false));
    }, []);

    // Döviz seçildiğinde KDV otomatik 0 yap (USD, EUR, GBP vb.)
    useEffect(() => {
        const foreignCurrencies = ['USD', 'EUR', 'GBP', 'CHF'];
        if (foreignCurrencies.includes(offerCurrencyCode)) {
            if (data.tax_rate !== 0) {
                setData('tax_rate', 0);
            }
        }
    }, [offerCurrencyCode]);

    // KDV oranı değiştiğinde tüm item'ların tax_rate'ini güncelle
    useEffect(() => {
        if (data.items.length === 0) return;

        const needsUpdate = data.items.some(item => Number(item.tax_rate) !== data.tax_rate);
        if (!needsUpdate) return;

        const updatedItems = data.items.map(item => {
            const qty = Number(item.quantity) || 0;
            const price = Number(item.unit_price) || 0;
            const d1 = Number(item.discount_rate1) || 0;
            const d2 = Number(item.discount_rate2) || 0;
            const d3 = Number(item.discount_rate3) || 0;
            const taxRate = data.tax_rate;

            const subtotal = qty * price;
            const afterD1 = subtotal * (1 - d1 / 100);
            const afterD2 = afterD1 * (1 - d2 / 100);
            const afterD3 = afterD2 * (1 - d3 / 100);
            const discountAmount = subtotal - afterD3;
            const taxAmount = afterD3 * (taxRate / 100);

            return {
                ...item,
                tax_rate: taxRate,
                discount_amount: discountAmount,
                tax_amount: taxAmount,
                line_total: afterD3 + taxAmount,
                total: afterD3 + taxAmount,
            };
        });

        setData('items', updatedItems);
    }, [data.tax_rate]);

    // AJAX Product search
    useEffect(() => {
        if (productSearch.length >= 2) {
            setLoadingProducts(true);
            setProductPage(1);
            const timer = setTimeout(() => {
                axios.get(route('sales.offers.search-products'), {
                    params: { q: productSearch, page: 1, per_page: 20 }
                })
                    .then(response => {
                        const products = response.data.data || response.data;
                        setFilteredProducts(products);
                        setHasMoreProducts(response.data.next_page_url ? true : (products.length >= 20));
                        setLoadingProducts(false);
                        setShowProductDropdown(true);
                    })
                    .catch(() => setLoadingProducts(false));
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setFilteredProducts([]);
            setShowProductDropdown(false);
        }
    }, [productSearch]);

    // Load more products on scroll
    const loadMoreProducts = () => {
        if (loadingMoreProducts || !hasMoreProducts) return;

        setLoadingMoreProducts(true);
        const nextPage = productPage + 1;

        axios.get(route('sales.offers.search-products'), {
            params: { q: productSearch, page: nextPage, per_page: 20 }
        })
            .then(response => {
                const products = response.data.data || response.data;
                setFilteredProducts(prev => [...prev, ...products]);
                setProductPage(nextPage);
                setHasMoreProducts(response.data.next_page_url ? true : (products.length >= 20));
                setLoadingMoreProducts(false);
            })
            .catch(() => setLoadingMoreProducts(false));
    };

    const handleProductScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 50) {
            loadMoreProducts();
        }
    };

    // Click outside to close product dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (productSearchRef.current && !productSearchRef.current.contains(event.target as Node)) {
                setShowProductDropdown(false);
            }
        };

        if (showProductDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showProductDropdown]);

    // AJAX Customer search
    useEffect(() => {
        if (customerSearch.length >= 2 && data.customer_type === 'entity') {
            setLoadingCustomers(true);
            const timer = setTimeout(() => {
                axios.get(route('sales.offers.search-customers'), {
                    params: { q: customerSearch }
                })
                    .then(response => {
                        setFilteredCustomers(response.data);
                        setLoadingCustomers(false);
                    })
                    .catch(() => setLoadingCustomers(false));
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setFilteredCustomers([]);
        }
    }, [customerSearch, data.customer_type]);

    const handleCustomerSelect = (customer: Customer) => {
        setSelectedCustomer(customer);
        setCustomerSearch(customer.entity_name);
        setData({
            ...data,
            entity_id: customer.id.toString(),
            customer_name: customer.entity_name,
            customer_phone: customer.phone || '',
            customer_email: customer.email || '',
            customer_address: customer.address || '',
        });
        setFilteredCustomers([]);
    };

    /**
     * Convert price from one currency to another using exchange rates
     */
    const convertPrice = (amount: number, fromCurrency: string, toCurrency: string): number => {
        if (fromCurrency === toCurrency) return amount;

        const fromRate = exchangeRates[fromCurrency]?.rate || 1;
        const toRate = exchangeRates[toCurrency]?.rate || 1;

        // All rates are relative to TRY
        // fromCurrency -> TRY -> toCurrency
        if (fromCurrency === 'TRY') {
            return amount / toRate;
        } else if (toCurrency === 'TRY') {
            return amount * fromRate;
        } else {
            const tryAmount = amount * fromRate;
            return tryAmount / toRate;
        }
    };

    const addProduct = (product: Product) => {
        // Lock currency when first item is added
        if (data.items.length === 0) {
            setCurrencyLocked(true);
        }

        // Aynı ürün zaten varsa miktarı artır
        const existingIndex = data.items.findIndex(item => item.product_id === product.id);

        if (existingIndex !== -1) {
            const updatedItems = [...data.items];
            const existingItem = updatedItems[existingIndex];
            existingItem.quantity = (Number(existingItem.quantity) || 0) + 1;

            // Toplamı yeniden hesapla (3 kademeli iskonto)
            const qty = Number(existingItem.quantity) || 0;
            const price = Number(existingItem.unit_price) || 0;
            const d1 = Number(existingItem.discount_rate1) || 0;
            const d2 = Number(existingItem.discount_rate2) || 0;
            const d3 = Number(existingItem.discount_rate3) || 0;
            const taxRate = Number(existingItem.tax_rate) || 0;

            const subtotal = qty * price;
            // Kademeli iskonto: önce %d1, sonra %d2, sonra %d3
            const afterD1 = subtotal * (1 - d1 / 100);
            const afterD2 = afterD1 * (1 - d2 / 100);
            const afterD3 = afterD2 * (1 - d3 / 100);
            const discountAmount = subtotal - afterD3;
            const taxAmount = afterD3 * (taxRate / 100);

            existingItem.discount_amount = discountAmount;
            existingItem.tax_amount = taxAmount;
            existingItem.line_total = afterD3 + taxAmount;
            existingItem.total = afterD3 + taxAmount;

            setData('items', updatedItems);
        } else {
            // Yeni ürün ekle
            const productCurrency = product.currency || 'TRY';
            const originalPrice = Number(product.sale_price) || 0;

            // Convert to offer currency if different
            const convertedPrice = convertPrice(originalPrice, productCurrency, offerCurrencyCode);
            const salePrice = Math.round(convertedPrice * 100) / 100; // Round to 2 decimals

            const taxRate = data.tax_rate;
            const taxAmount = salePrice * (taxRate / 100);
            const lineTotal = salePrice + taxAmount;

            // Get base unit from product units or fall back to baseUnit
            const baseUnit = product.active_units?.find(u => u.is_base_unit);
            const defaultUnitId = baseUnit?.unit_id || product.baseUnit?.id || null;

            const newItem: OfferItem = {
                id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                product_id: product.id,
                product_name: product.name,
                product_code: product.code,
                description: '',
                unit_id: defaultUnitId,
                quantity: 1,
                unit_price: salePrice,
                original_unit_price: salePrice,
                original_currency: productCurrency,
                original_price_in_currency: originalPrice,
                discount_rate1: 0,
                discount_rate2: 0,
                discount_rate3: 0,
                discount_amount: 0,
                tax_rate: taxRate,
                tax_amount: taxAmount,
                line_total: lineTotal,
                total: lineTotal,
                image_url: product.image_url,
                bulk_discount_applied: false,
                // Bulk discount için gerekli alanlar
                category_id: product.category_id,
                brand_id: product.brand_id,
                supplier_id: product.supplier_id,
                category: product.category,
                brand: product.brand,
                supplier: product.supplier,
                // Product reference for unit selection
                product: product,
            };

            setData('items', [...data.items, newItem]);
        }
        // Liste açık kalsın, birden fazla ürün eklenebilsin
    };

    const isProductAdded = (productId: number) => {
        return data.items.some(item => item.product_id === productId);
    };

    const getProductQuantity = (productId: number) => {
        const item = data.items.find(item => item.product_id === productId);
        return item?.quantity || 0;
    };

    const closeProductDropdown = () => {
        setShowProductDropdown(false);
        setFilteredProducts([]);
        setProductSearch('');
    };

    const updateItem = (index: number, field: keyof OfferItem, value: any) => {
        const updatedItems = [...data.items];
        updatedItems[index] = { ...updatedItems[index], [field]: value };

        const item = updatedItems[index];
        const quantity = Number(item.quantity) || 0;
        const unitPrice = Number(item.unit_price) || 0;
        const d1 = Number(item.discount_rate1) || 0;
        const d2 = Number(item.discount_rate2) || 0;
        const d3 = Number(item.discount_rate3) || 0;
        const taxRate = Number(item.tax_rate) || 0;

        const subtotal = quantity * unitPrice;
        // Kademeli iskonto: önce %d1, sonra %d2, sonra %d3
        const afterD1 = subtotal * (1 - d1 / 100);
        const afterD2 = afterD1 * (1 - d2 / 100);
        const afterD3 = afterD2 * (1 - d3 / 100);
        const discountAmount = subtotal - afterD3;
        const taxAmount = afterD3 * (taxRate / 100);

        item.discount_amount = discountAmount;
        item.tax_amount = taxAmount;
        item.line_total = afterD3 + taxAmount;
        item.total = afterD3 + taxAmount;

        setData('items', updatedItems);
    };

    const evaluateExpression = (expr: string): number | null => {
        try {
            const sanitized = expr.replace(/,/g, '.').trim();
            if (!/^[\d\s\+\-\*\/\.\(\)]+$/.test(sanitized)) return null;
            const result = new Function('return ' + sanitized)();
            if (typeof result === 'number' && isFinite(result)) {
                return Math.round(result * 100) / 100;
            }
            return null;
        } catch {
            return null;
        }
    };

    const handlePriceBlur = (index: number) => {
        const raw = editingPrices[index];
        if (raw === undefined) return;

        const evaluated = evaluateExpression(raw);
        if (evaluated !== null && evaluated >= 0) {
            const updatedItems = [...data.items];
            const item = { ...updatedItems[index] };
            item.unit_price = evaluated;

            // Auto-calculate discount from original price (first discount only)
            const originalPrice = Number(item.original_unit_price) || 0;
            if (originalPrice > 0 && evaluated !== originalPrice) {
                const discountRate = ((originalPrice - evaluated) / originalPrice) * 100;
                item.discount_rate1 = Math.round(discountRate * 100) / 100;
                item.discount_rate2 = 0;
                item.discount_rate3 = 0;
            } else if (evaluated === originalPrice) {
                item.discount_rate1 = 0;
                item.discount_rate2 = 0;
                item.discount_rate3 = 0;
            }

            // Recalculate totals (3 kademeli iskonto)
            const quantity = Number(item.quantity) || 0;
            const unitPrice = Number(item.unit_price) || 0;
            const d1 = Number(item.discount_rate1) || 0;
            const d2 = Number(item.discount_rate2) || 0;
            const d3 = Number(item.discount_rate3) || 0;
            const taxRate = Number(item.tax_rate) || 0;

            const subtotal = quantity * unitPrice;
            const afterD1 = subtotal * (1 - d1 / 100);
            const afterD2 = afterD1 * (1 - d2 / 100);
            const afterD3 = afterD2 * (1 - d3 / 100);
            const discountAmount = subtotal - afterD3;
            const taxAmount = afterD3 * (taxRate / 100);

            item.discount_amount = discountAmount;
            item.tax_amount = taxAmount;
            item.line_total = afterD3 + taxAmount;
            item.total = afterD3 + taxAmount;

            updatedItems[index] = item;
            setData('items', updatedItems);
        }

        setEditingPrices(prev => {
            const next = { ...prev };
            delete next[index];
            return next;
        });
    };

    const handlePriceKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handlePriceBlur(index);
            (e.target as HTMLInputElement).blur();
        }
    };

    const removeItem = (index: number) => {
        const newItems = data.items.filter((_, i) => i !== index);
        setData('items', newItems);

        // Unlock currency when all items are removed
        if (newItems.length === 0) {
            setCurrencyLocked(false);
        }
    };

    const toggleNote = (index: number) => {
        setExpandedNotes(prev => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

    // Handle unit selection change
    const handleUnitChange = (index: number, unitId: number | null) => {
        const item = data.items[index];
        if (!item.product) return;

        const updatedItems = [...data.items];
        updatedItems[index] = { ...updatedItems[index], unit_id: unitId };

        // Find the selected unit and calculate price
        if (unitId && item.product.active_units) {
            const selectedUnit = item.product.active_units.find(u => u.unit_id === unitId);
            if (selectedUnit) {
                let unitPrice = 0;
                // Use unit-specific price if available, otherwise calculate from base price * conversion_factor
                if (selectedUnit.sale_price > 0) {
                    unitPrice = selectedUnit.sale_price;
                } else if (selectedUnit.conversion_factor > 0) {
                    // Calculate price based on conversion factor
                    const basePrice = item.product.sale_price || item.product.logo_sale_price || 0;
                    unitPrice = basePrice * selectedUnit.conversion_factor;
                }
                // Convert price to offer currency if needed
                if (unitPrice > 0) {
                    const productCurrency = item.original_currency || 'TRY';
                    const convertedPrice = convertPrice(unitPrice, productCurrency, offerCurrencyCode);
                    const roundedPrice = Math.round(convertedPrice * 100) / 100;
                    updatedItems[index].unit_price = roundedPrice;
                    updatedItems[index].original_unit_price = roundedPrice;
                    updatedItems[index].original_price_in_currency = unitPrice;
                }
            }
        } else if (!unitId) {
            // Reset to base price when no unit selected
            const basePrice = item.product.sale_price || item.product.logo_sale_price || 0;
            const productCurrency = item.original_currency || 'TRY';
            const convertedPrice = convertPrice(basePrice, productCurrency, offerCurrencyCode);
            const roundedPrice = Math.round(convertedPrice * 100) / 100;
            updatedItems[index].unit_price = roundedPrice;
            updatedItems[index].original_unit_price = roundedPrice;
            updatedItems[index].original_price_in_currency = basePrice;
        }

        // Recalculate totals (3 kademeli iskonto)
        const itemToUpdate = updatedItems[index];
        const quantity = Number(itemToUpdate.quantity) || 0;
        const unitPrice = Number(itemToUpdate.unit_price) || 0;
        const d1 = Number(itemToUpdate.discount_rate1) || 0;
        const d2 = Number(itemToUpdate.discount_rate2) || 0;
        const d3 = Number(itemToUpdate.discount_rate3) || 0;
        const taxRate = Number(itemToUpdate.tax_rate) || 0;

        const subtotal = quantity * unitPrice;
        const afterD1 = subtotal * (1 - d1 / 100);
        const afterD2 = afterD1 * (1 - d2 / 100);
        const afterD3 = afterD2 * (1 - d3 / 100);
        const discountAmount = subtotal - afterD3;
        const taxAmount = afterD3 * (taxRate / 100);

        itemToUpdate.discount_amount = discountAmount;
        itemToUpdate.tax_amount = taxAmount;
        itemToUpdate.line_total = afterD3 + taxAmount;
        itemToUpdate.total = afterD3 + taxAmount;

        setData('items', updatedItems);
    };

    // Brüt toplam (item iskontoları hariç)
    const grossTotal = data.items.reduce((sum, item) => {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.unit_price) || 0;
        return sum + (qty * price);
    }, 0);

    // Item iskontolarının toplamı (3 kademeli)
    const itemDiscounts = data.items.reduce((sum, item) => {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.unit_price) || 0;
        const d1 = Number(item.discount_rate1) || 0;
        const d2 = Number(item.discount_rate2) || 0;
        const d3 = Number(item.discount_rate3) || 0;
        const itemSubtotal = qty * price;
        const afterD1 = itemSubtotal * (1 - d1 / 100);
        const afterD2 = afterD1 * (1 - d2 / 100);
        const afterD3 = afterD2 * (1 - d3 / 100);
        return sum + (itemSubtotal - afterD3);
    }, 0);

    // Ara toplam (item iskontolarından sonra)
    const subtotal = grossTotal - itemDiscounts;

    // Genel iskonto
    const generalDiscountRate = Number(data.discount_rate) || 0;
    const generalDiscountAmount = subtotal * (generalDiscountRate / 100);
    const afterDiscount = subtotal - generalDiscountAmount;

    // Toplam iskonto (item iskontolar + genel iskonto)
    const totalDiscountAmount = itemDiscounts + generalDiscountAmount;

    // KDV hesapla (her item'ın KDV'si ayrı ayrı, 3 kademeli iskontolardan sonra)
    const taxAmount = data.items.reduce((sum, item) => {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.unit_price) || 0;
        const d1 = Number(item.discount_rate1) || 0;
        const d2 = Number(item.discount_rate2) || 0;
        const d3 = Number(item.discount_rate3) || 0;
        const taxRate = Number(item.tax_rate) || 0;
        const itemSubtotal = qty * price;
        const afterD1 = itemSubtotal * (1 - d1 / 100);
        const afterD2 = afterD1 * (1 - d2 / 100);
        const afterD3 = afterD2 * (1 - d3 / 100);
        const itemTax = afterD3 * (taxRate / 100);
        return sum + itemTax;
    }, 0);

    const total = afterDiscount + taxAmount;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('sales.offers.store'));
    };

    return (
        <Layout>
            <Head title="Yeni Teklif" />

            <div className="page-content">
                <div className="container-fluid">
                    <Row className="mb-3">
                        <Col>
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Yeni Satış Teklifi</h4>
                                <Link href={route('sales.offers.index')}>
                                    <Button variant="secondary" size="sm">
                                        <i className="ri-arrow-left-line me-1"></i>
                                        Geri
                                    </Button>
                                </Link>
                            </div>
                        </Col>
                    </Row>

                    <Form onSubmit={handleSubmit}>
                        <Row style={{ overflow: 'visible' }}>
                            <Col xl={8} lg={7} style={{ overflow: 'visible' }}>
                                {/* Customer */}
                                <Card className="mb-3" style={{ overflow: 'visible', position: 'relative', zIndex: 10 }}>
                                    <Card.Header>
                                        <h5 className="card-title mb-0">
                                            <i className="ri-user-line me-2"></i>Müşteri
                                        </h5>
                                    </Card.Header>
                                    <Card.Body style={{ overflow: 'visible' }}>
                                        <Row className="mb-3">
                                            <Col xs={6}>
                                                <Form.Check
                                                    type="radio"
                                                    label="Kayıtlı Cari"
                                                    name="customerType"
                                                    checked={data.customer_type === 'entity'}
                                                    onChange={() => {
                                                        setData('customer_type', 'entity');
                                                        setSelectedCustomer(null);
                                                        setCustomerSearch('');
                                                    }}
                                                />
                                            </Col>
                                            <Col xs={6}>
                                                <Form.Check
                                                    type="radio"
                                                    label="Geçici Müşteri"
                                                    name="customerType"
                                                    checked={data.customer_type === 'temporary'}
                                                    onChange={() => setData('customer_type', 'temporary')}
                                                />
                                            </Col>
                                        </Row>

                                        {data.customer_type === 'entity' ? (
                                            <div className="position-relative">
                                                <Form.Label>Cari Ara</Form.Label>
                                                <InputGroup className="mb-2">
                                                    <InputGroup.Text><i className="ri-search-line"></i></InputGroup.Text>
                                                    <Form.Control
                                                        placeholder="Ad, kod veya vergi no..."
                                                        value={customerSearch}
                                                        onChange={e => setCustomerSearch(e.target.value)}
                                                        isInvalid={!!errors.entity_id}
                                                    />
                                                </InputGroup>
                                                {errors.entity_id && <div className="invalid-feedback d-block">{errors.entity_id}</div>}

                                                {loadingCustomers && <div className="text-center p-2"><span className="spinner-border spinner-border-sm"></span></div>}

                                                {filteredCustomers.length > 0 && (
                                                    <div className="border rounded position-absolute w-100 bg-white shadow" style={{ zIndex: 9999, maxHeight: '300px', overflowY: 'auto', top: '100%', left: 0, pointerEvents: 'auto' }}>
                                                        {filteredCustomers.map(c => (
                                                            <div key={c.id} className="p-2 border-bottom hover-bg d-flex justify-content-between align-items-center" onClick={() => handleCustomerSelect(c)} style={{ cursor: 'pointer', pointerEvents: 'auto' }}>
                                                                <div>
                                                                    <strong>{c.entity_name}</strong><br />
                                                                    <small className="text-muted">Kod: {c.entity_code} {c.phone && `| ${c.phone}`}</small>
                                                                </div>
                                                                {c.current_balance != null && c.current_balance !== 0 && (
                                                                    <small className={`fw-medium ${Number(c.current_balance) > 0 ? 'text-danger' : 'text-success'}`}>
                                                                        {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(Number(c.current_balance)))}
                                                                        {' '}{c.currency || '₺'}
                                                                        {' '}{Number(c.current_balance) > 0 ? '(B)' : '(A)'}
                                                                    </small>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {selectedCustomer && (
                                                    <Alert variant="info" className="mt-2 py-2">
                                                        <small><strong>Seçili:</strong> {selectedCustomer.entity_name}</small>
                                                    </Alert>
                                                )}
                                            </div>
                                        ) : (
                                            <Row>
                                                <Col md={6} className="mb-2">
                                                    <Form.Label>Ad Soyad *</Form.Label>
                                                    <Form.Control value={data.customer_name} onChange={e => setData('customer_name', e.target.value)} isInvalid={!!errors.customer_name} />
                                                    {errors.customer_name && <Form.Control.Feedback type="invalid">{errors.customer_name}</Form.Control.Feedback>}
                                                </Col>
                                                <Col md={6} className="mb-2">
                                                    <Form.Label>Telefon</Form.Label>
                                                    <Form.Control value={data.customer_phone} onChange={e => setData('customer_phone', e.target.value)} />
                                                </Col>
                                                <Col md={6} className="mb-2">
                                                    <Form.Label>Email</Form.Label>
                                                    <Form.Control type="email" value={data.customer_email} onChange={e => setData('customer_email', e.target.value)} />
                                                </Col>
                                                <Col md={6} className="mb-2">
                                                    <Form.Label>Adres</Form.Label>
                                                    <Form.Control value={data.customer_address} onChange={e => setData('customer_address', e.target.value)} />
                                                </Col>
                                            </Row>
                                        )}
                                    </Card.Body>
                                </Card>

                                {/* Bulk Discount Panel */}
                                {showBulkDiscount && (
                                    <BulkDiscountPanel
                                        items={data.items.map(item => ({
                                            id: item.id,
                                            product_id: item.product_id || null,
                                            product: {
                                                id: item.product_id || 0,
                                                name: item.product_name,
                                                code: item.product_code || '',
                                                category_id: item.category_id,
                                                brand_id: item.brand_id,
                                                supplier_id: item.supplier_id,
                                                category: item.category,
                                                brand: item.brand,
                                                supplier: item.supplier,
                                            },
                                            quantity: item.quantity,
                                            unit_price: item.unit_price,
                                            discount_percentage: item.discount_rate1,
                                            discount_amount: item.discount_amount || 0,
                                            tax_rate: item.tax_rate,
                                            line_total: item.line_total || item.total,
                                            original_unit_price: item.original_unit_price,
                                            bulk_discount_applied: item.bulk_discount_applied,
                                            discount_source: item.discount_source,
                                        }))}
                                        onApplyDiscount={(updatedItems) => {
                                            const newItems = data.items.map((item, index) => {
                                                const updated = updatedItems.find(u => u.id === item.id);
                                                if (updated) {
                                                    const subtotal = item.quantity * item.unit_price;
                                                    // Toplu iskonto sadece ilk iskontoya uygulanır
                                                    const d1 = updated.discount_percentage;
                                                    const d2 = item.discount_rate2;
                                                    const d3 = item.discount_rate3;
                                                    const afterD1 = subtotal * (1 - d1 / 100);
                                                    const afterD2 = afterD1 * (1 - d2 / 100);
                                                    const afterD3 = afterD2 * (1 - d3 / 100);
                                                    const discountAmount = subtotal - afterD3;
                                                    const taxAmount = afterD3 * item.tax_rate / 100;
                                                    return {
                                                        ...item,
                                                        discount_rate1: updated.discount_percentage,
                                                        discount_amount: discountAmount,
                                                        original_unit_price: updated.original_unit_price || item.unit_price,
                                                        bulk_discount_applied: updated.bulk_discount_applied,
                                                        discount_source: updated.discount_source,
                                                        tax_amount: taxAmount,
                                                        line_total: afterD3 + taxAmount,
                                                        total: afterD3 + taxAmount,
                                                    };
                                                }
                                                return item;
                                            });
                                            setData('items', newItems);
                                        }}
                                        onClose={() => setShowBulkDiscount(false)}
                                        isOpen={showBulkDiscount}
                                    />
                                )}

                                {/* Currency Selection */}
                                <Card className="mb-3">
                                    <Card.Header>
                                        <h5 className="card-title mb-0">
                                            <i className="ri-money-dollar-circle-line me-2"></i>Teklif Para Birimi
                                        </h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row className="align-items-center">
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Para Birimi *</Form.Label>
                                                    <Form.Select
                                                        value={data.currency_id}
                                                        onChange={e => setData('currency_id', Number(e.target.value))}
                                                        disabled={currencyLocked}
                                                        isInvalid={!!errors.currency_id}
                                                    >
                                                        {currencies.map(currency => (
                                                            <option key={currency.id} value={currency.id}>
                                                                {currency.cur_code} - {currency.description}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                    {errors.currency_id && (
                                                        <Form.Control.Feedback type="invalid">
                                                            {errors.currency_id}
                                                        </Form.Control.Feedback>
                                                    )}
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                {currencyLocked && (
                                                    <Alert variant="info" className="mb-0 py-2">
                                                        <small>
                                                            <i className="ri-lock-line me-1"></i>
                                                            Ürün eklendiğinde para birimi kilitlenir.
                                                            Değiştirmek için tüm ürünleri silin.
                                                        </small>
                                                    </Alert>
                                                )}
                                                {!currencyLocked && loadingRates && (
                                                    <div className="text-muted">
                                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                                        Döviz kurları yükleniyor...
                                                    </div>
                                                )}
                                                {!currencyLocked && !loadingRates && offerCurrencyCode !== 'TRY' && exchangeRates[offerCurrencyCode]?.rate && (
                                                    <Alert variant="warning" className="mb-0 py-2">
                                                        <small>
                                                            <i className="ri-exchange-line me-1"></i>
                                                            Güncel kur: 1 {offerCurrencyCode} = {Number(exchangeRates[offerCurrencyCode].rate).toFixed(4)} TL
                                                            <br />
                                                            <span className="text-muted">({exchangeRates[offerCurrencyCode]?.date || '-'})</span>
                                                        </small>
                                                    </Alert>
                                                )}
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>

                                {/* Products */}
                                <Card className="mb-3">
                                    <Card.Header className="d-flex justify-content-between align-items-center">
                                        <h5 className="card-title mb-0">
                                            <i className="ri-shopping-cart-line me-2"></i>Ürünler
                                        </h5>
                                        {data.items.length > 0 && (
                                            <Button
                                                variant={showBulkDiscount ? "success" : "outline-success"}
                                                size="sm"
                                                onClick={() => setShowBulkDiscount(!showBulkDiscount)}
                                            >
                                                <i className="ri-price-tag-3-line me-1"></i>
                                                Toplu İndirim
                                            </Button>
                                        )}
                                    </Card.Header>
                                    <Card.Body>
                                        <div className="position-relative mb-3" ref={productSearchRef}>
                                            <InputGroup>
                                                <InputGroup.Text><i className="ri-search-line"></i></InputGroup.Text>
                                                <Form.Control
                                                    placeholder="Ürün ara..."
                                                    value={productSearch}
                                                    onChange={e => setProductSearch(e.target.value)}
                                                    onFocus={() => filteredProducts.length > 0 && setShowProductDropdown(true)}
                                                />
                                                {showProductDropdown && (
                                                    <Button variant="outline-secondary" size="sm" onClick={closeProductDropdown}>
                                                        <i className="ri-close-line"></i>
                                                    </Button>
                                                )}
                                            </InputGroup>

                                            {loadingProducts && <div className="text-center p-2"><span className="spinner-border spinner-border-sm"></span></div>}

                                            {showProductDropdown && filteredProducts.length > 0 && (
                                                <div
                                                    className="border rounded position-absolute w-100 bg-white shadow"
                                                    style={{ zIndex: 1050, maxHeight: '400px', overflowY: 'auto' }}
                                                    onScroll={handleProductScroll}
                                                >
                                                    {filteredProducts.map(p => {
                                                        const quantity = getProductQuantity(p.id);
                                                        const productCurrency = p.currency || 'TRY';
                                                        const salePrice = Number(p.sale_price) || 0;
                                                        const needsConversion = productCurrency !== offerCurrencyCode;
                                                        const convertedPrice = needsConversion
                                                            ? convertPrice(salePrice, productCurrency, offerCurrencyCode)
                                                            : salePrice;

                                                        return (
                                                            <div
                                                                key={p.id}
                                                                className={`p-2 border-bottom hover-bg d-flex align-items-center gap-2 ${quantity > 0 ? 'bg-success bg-opacity-10' : ''}`}
                                                                onClick={() => addProduct(p)}
                                                                style={{ cursor: 'pointer' }}
                                                            >
                                                                {p.image_url ? (
                                                                    <Image src={p.image_url} rounded style={{ width: '50px', height: '50px', objectFit: 'cover' }} />
                                                                ) : (
                                                                    <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                                                                        <i className="ri-image-line text-muted"></i>
                                                                    </div>
                                                                )}
                                                                <div className="flex-grow-1">
                                                                    <strong>{p.name}</strong>
                                                                    {quantity > 0 && <Badge bg="success" className="ms-2">{quantity} adet</Badge>}
                                                                    <br />
                                                                    <small className="text-muted d-block mb-1">{p.code}</small>
                                                                    <small className="text-muted">
                                                                        {productCurrency === 'TRY' ? '₺' : productCurrency === 'USD' ? '$' : productCurrency === 'EUR' ? '€' : productCurrency + ' '}
                                                                        {fmt(salePrice)}
                                                                        {needsConversion && (
                                                                            <span className="ms-1 text-primary">
                                                                                → {currencySymbol}{fmt(convertedPrice)}
                                                                            </span>
                                                                        )}
                                                                        <Badge bg="info" className="ms-2">Stok: {p.stock_quantity} | {p.code}</Badge>
                                                                    </small>
                                                                </div>
                                                                <i className={`fs-4 ${quantity > 0 ? 'ri-add-box-fill text-success' : 'ri-add-circle-line text-primary'}`}></i>
                                                            </div>
                                                        );
                                                    })}
                                                    {loadingMoreProducts && (
                                                        <div className="text-center p-3">
                                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                                            Daha fazla yükleniyor...
                                                        </div>
                                                    )}
                                                    {!hasMoreProducts && filteredProducts.length > 0 && (
                                                        <div className="text-center p-2 text-muted small">
                                                            Tüm sonuçlar gösterildi
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {errors.items && <Alert variant="danger">{errors.items}</Alert>}

                                        {data.items.length === 0 ? (
                                            <div className="text-center text-muted py-4">
                                                <i className="ri-shopping-basket-line fs-1"></i>
                                                <p>Ürün eklenmedi</p>
                                            </div>
                                        ) : (
                                            <div className="table-responsive">
                                                <Table hover className="align-middle">
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th style={{ width: '50px' }}></th>
                                                            <th>Ürün</th>
                                                            <th style={{ width: '120px' }}>Açıklama</th>
                                                            <th style={{ width: '90px' }}>Birim</th>
                                                            <th style={{ width: '70px' }}>Miktar</th>
                                                            <th style={{ width: '100px' }}>Fiyat</th>
                                                            <th style={{ width: '55px' }}>İsk1%</th>
                                                            <th style={{ width: '55px' }}>İsk2%</th>
                                                            <th style={{ width: '55px' }}>İsk3%</th>
                                                            <th style={{ width: '100px' }} className="text-end">Toplam</th>
                                                            <th style={{ width: '40px' }}></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {data.items.map((item, i) => (
                                                            <tr key={i}>
                                                                <td>
                                                                    {item.image_url ? (
                                                                        <Image src={item.image_url} rounded style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                                                                    ) : (
                                                                        <div className="bg-light rounded" style={{ width: '40px', height: '40px' }}>
                                                                            <i className="ri-image-line"></i>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    <div className="fw-medium">{item.product_name}</div>
                                                                    {item.product_code && <small className="text-muted">{item.product_code}</small>}
                                                                </td>
                                                                <td>
                                                                    <Form.Control
                                                                        size="sm"
                                                                        type="text"
                                                                        placeholder="Renk, boyut..."
                                                                        value={item.description || ''}
                                                                        onChange={e => updateItem(i, 'description', e.target.value)}
                                                                        style={{ minWidth: '100px' }}
                                                                    />
                                                                </td>
                                                                <td>
                                                                    {item.product ? (
                                                                        <Form.Select
                                                                            size="sm"
                                                                            value={item.unit_id || ''}
                                                                            onChange={(e) => handleUnitChange(i, e.target.value ? parseInt(e.target.value) : null)}
                                                                        >
                                                                            {/* Product'a özel birimler */}
                                                                            {item.product.active_units && item.product.active_units.length > 0 ? (
                                                                                item.product.active_units.map((pu) => (
                                                                                    <option key={pu.unit_id} value={pu.unit_id}>
                                                                                        {pu.unit?.name || pu.unit_name} ({pu.unit?.symbol || pu.unit_code})
                                                                                    </option>
                                                                                ))
                                                                            ) : (
                                                                                /* Fallback: Tüm birimler listesi */
                                                                                <>
                                                                                    {item.product.baseUnit && (
                                                                                        <option value={item.product.baseUnit.id}>
                                                                                            {item.product.baseUnit.name} ({item.product.baseUnit.symbol})
                                                                                        </option>
                                                                                    )}
                                                                                    {units.filter(u => u.id !== item.product?.baseUnit?.id).map((unit) => (
                                                                                        <option key={unit.id} value={unit.id}>
                                                                                            {unit.name} ({unit.symbol})
                                                                                        </option>
                                                                                    ))}
                                                                                </>
                                                                            )}
                                                                        </Form.Select>
                                                                    ) : (
                                                                        <span className="text-muted">-</span>
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    <Form.Control type="number" step="0.01" min="0.01" value={item.quantity} onChange={e => updateItem(i, 'quantity', parseFloat(e.target.value) || 0)} onBlur={e => { e.target.value = String(parseFloat(e.target.value) || 0); }} size="sm" />
                                                                </td>
                                                                <td>
                                                                    <Form.Control
                                                                        type="text"
                                                                        style={{ minWidth: '110px' }}
                                                                        value={editingPrices[i] !== undefined ? editingPrices[i] : item.unit_price}
                                                                        onFocus={() => canEditPrice && setEditingPrices(prev => ({ ...prev, [i]: String(item.unit_price) }))}
                                                                        onChange={e => canEditPrice && setEditingPrices(prev => ({ ...prev, [i]: e.target.value }))}
                                                                        onBlur={() => canEditPrice && handlePriceBlur(i)}
                                                                        onKeyDown={e => canEditPrice && handlePriceKeyDown(e, i)}
                                                                        readOnly={!canEditPrice}
                                                                        className={!canEditPrice ? 'bg-light' : ''}
                                                                        size="sm"
                                                                    />
                                                                    {item.original_unit_price && item.unit_price !== item.original_unit_price && (
                                                                        <small className="text-muted d-block mt-1">
                                                                            <s>{currencySymbol}{fmt(Number(item.original_unit_price))}</s>
                                                                        </small>
                                                                    )}
                                                                    {item.original_currency && item.original_currency !== offerCurrencyCode && Number(item.original_price_in_currency) > 0 && (
                                                                        <small className="text-muted d-block">
                                                                            Orijinal: {getCurrencySymbol(item.original_currency)}{fmt(Number(item.original_price_in_currency))}
                                                                        </small>
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    <Form.Control type="number" step="0.01" min="0" max="100" value={item.discount_rate1} onChange={e => updateItem(i, 'discount_rate1', parseFloat(e.target.value) || 0)} size="sm" style={{ width: '55px' }} />
                                                                </td>
                                                                <td>
                                                                    <Form.Control type="number" step="0.01" min="0" max="100" value={item.discount_rate2} onChange={e => updateItem(i, 'discount_rate2', parseFloat(e.target.value) || 0)} size="sm" style={{ width: '55px' }} />
                                                                </td>
                                                                <td>
                                                                    <Form.Control type="number" step="0.01" min="0" max="100" value={item.discount_rate3} onChange={e => updateItem(i, 'discount_rate3', parseFloat(e.target.value) || 0)} size="sm" style={{ width: '55px' }} />
                                                                </td>
                                                                <td className="text-end fw-bold">{currencySymbol}{fmt(Number((item.total || 0) - (item.tax_amount || 0)))}</td>
                                                                <td>
                                                                    <Button variant="danger" size="sm" onClick={() => removeItem(i)}>
                                                                        <i className="ri-delete-bin-line"></i>
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </Table>
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Col>

                            <Col xl={4} lg={5}>
                                {/* Dates */}
                                <Card className="mb-3">
                                    <Card.Body>
                                        <Form.Group className="mb-2">
                                            <Form.Label>Teklif Tarihi *</Form.Label>
                                            <Form.Control type="date" value={data.offer_date} onChange={e => setData('offer_date', e.target.value)} isInvalid={!!errors.offer_date} />
                                            {errors.offer_date && <Form.Control.Feedback type="invalid">{errors.offer_date}</Form.Control.Feedback>}
                                        </Form.Group>
                                        <Form.Group className="mb-2">
                                            <Form.Label>Geçerlilik *</Form.Label>
                                            <Form.Control type="date" value={data.valid_until_date} onChange={e => setData('valid_until_date', e.target.value)} isInvalid={!!errors.valid_until_date} />
                                            {errors.valid_until_date && <Form.Control.Feedback type="invalid">{errors.valid_until_date}</Form.Control.Feedback>}
                                        </Form.Group>
                                        <Row>
                                            <Col xs={6}>
                                                <Form.Label>İskonto %</Form.Label>
                                                <Form.Control type="number" value={data.discount_rate} onChange={e => setData('discount_rate', parseFloat(e.target.value) || 0)} />
                                            </Col>
                                            <Col xs={6}>
                                                <Form.Label>KDV %</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    value={data.tax_rate}
                                                    onChange={e => setData('tax_rate', parseFloat(e.target.value) || 0)}
                                                    disabled={['USD', 'EUR', 'GBP', 'CHF'].includes(offerCurrencyCode)}
                                                />
                                                {['USD', 'EUR', 'GBP', 'CHF'].includes(offerCurrencyCode) && (
                                                    <Form.Text className="text-muted">Dövizli tekliflerde KDV uygulanmaz</Form.Text>
                                                )}
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>

                                {/* Summary */}
                                <Card className="mb-3 border-primary">
                                    <Card.Header className="bg-primary text-white">
                                        <h6 className="mb-0 text-white">Özet ({offerCurrencyCode})</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        <div className="d-flex justify-content-between mb-1">
                                            <span>Brüt Toplam:</span>
                                            <strong>{currencySymbol}{fmt(grossTotal)}</strong>
                                        </div>
                                        {itemDiscounts > 0 && (
                                            <div className="d-flex justify-content-between mb-1">
                                                <span className="text-muted small">Satır İskontolar:</span>
                                                <span className="text-danger small">-{currencySymbol}{fmt(itemDiscounts)}</span>
                                            </div>
                                        )}
                                        <div className="d-flex justify-content-between mb-1">
                                            <span>Ara Toplam:</span>
                                            <strong>{currencySymbol}{fmt(subtotal)}</strong>
                                        </div>
                                        {generalDiscountAmount > 0 && (
                                            <div className="d-flex justify-content-between mb-1">
                                                <span className="text-muted small">Genel İskonto:</span>
                                                <span className="text-danger small">-{currencySymbol}{fmt(generalDiscountAmount)}</span>
                                            </div>
                                        )}
                                        {totalDiscountAmount > 0 && (
                                            <div className="d-flex justify-content-between mb-1">
                                                <span>Toplam İskonto:</span>
                                                <strong className="text-danger">-{currencySymbol}{fmt(totalDiscountAmount)}</strong>
                                            </div>
                                        )}
                                        <div className="d-flex justify-content-between mb-2">
                                            <span>KDV:</span>
                                            <strong>{currencySymbol}{fmt(taxAmount)}</strong>
                                        </div>
                                        <hr />
                                        <div className="d-flex justify-content-between">
                                            <h5 className="mb-0">TOPLAM:</h5>
                                            <h5 className="mb-0 text-primary">{currencySymbol}{fmt(total)}</h5>
                                        </div>
                                    </Card.Body>
                                </Card>

                                <div className="d-grid gap-2">
                                    <Button variant="primary" type="submit" size="lg" disabled={processing || data.items.length === 0}>
                                        <i className="ri-save-line me-1"></i>Kaydet
                                    </Button>
                                    <Link href={route('sales.offers.index')}>
                                        <Button variant="outline-secondary" className="w-100">İptal</Button>
                                    </Link>
                                </div>
                            </Col>
                        </Row>
                    </Form>
                </div>
            </div>

            <style>{`
                .hover-bg:hover { background-color: #f8f9fa; }
                @media (max-width: 991px) {
                    .table-responsive { font-size: 0.875rem; }
                }
            `}</style>
        </Layout>
    );
}
