import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Card, Row, Col, Form, Button, Table, InputGroup, Alert, Badge, Image } from 'react-bootstrap';
import Layout from '@/Layouts';
import axios from 'axios';

interface Customer {
    id: number;
    entity_name: string;
    entity_code: string;
    phone?: string;
    email?: string;
    address?: string;
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
    active_units?: ProductUnit[];
    baseUnit?: Unit;
    logo_sale_price?: number;
    logo_currency?: string;
}

interface OfferItem {
    product_id?: number;
    product_name: string;
    product_code?: string;
    description?: string;
    unit_id?: number | null;
    quantity: number;
    unit_price: number;
    original_unit_price?: number;
    // 3 kademeli iskonto
    discount_rate1: number;
    discount_rate2: number;
    discount_rate3: number;
    discount_amount: number;
    tax_rate: number;
    tax_amount: number;
    total: number;
    image_url?: string;
    product?: Product;
    original_currency?: string;
    original_price_in_currency?: number;
}

interface Offer {
    id: number;
    offer_no: string;
    offer_date: string;
    valid_until_date: string;
    entity_id?: number;
    customer_name?: string;
    customer_phone?: string;
    customer_email?: string;
    customer_address?: string;
    customer_type: string;
    discount_rate: number;
    tax_rate: number;
    currency_id?: number;
    notes?: string;
    items: any[];
    entity?: {
        id: number;
        title: string;
        account_code: string;
        phone_1?: string;
        email?: string;
        address?: string;
    };
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
    offer: Offer;
    units: any[];
    currencies: any[];
    locations: any[];
}

const fmt = (n: number) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

export default function Edit({ offer, units, currencies, locations }: Props) {
    const auth = usePage().props.auth as any;
    const userRoles = auth?.user?.roles?.map((r: any) => r.name) || [];
    const canEditPrice = userRoles.some((r: string) => ['admin', 'Super Admin', 'sales_manager', 'sales-manager'].includes(r));

    const { data, setData, put, processing, errors } = useForm({
        offer_date: offer.offer_date.split('T')[0],
        valid_until_date: offer.valid_until_date.split('T')[0],
        entity_id: offer.entity_id || null,
        customer_name: offer.customer_name || null,
        customer_phone: offer.customer_phone || null,
        customer_email: offer.customer_email || null,
        customer_address: offer.customer_address || null,
        customer_type: offer.entity_id ? 'entity' : 'temporary',
        currency_id: offer.currency_id || currencies.find((c: any) => c.cur_code === 'TRY')?.id || currencies[0]?.id || 1,
        discount_rate: offer.discount_rate || 0,
        tax_rate: offer.tax_rate || 20,
        notes: offer.notes || null,
        items: offer.items.map((item: any) => {
            const qty = Number(item.quantity) || 0;
            const price = parseFloat(item.unit_price) || 0;
            const d1 = Number(item.discount_rate1) || Number(item.discount_rate) || 0;
            const d2 = Number(item.discount_rate2) || 0;
            const d3 = Number(item.discount_rate3) || 0;
            const taxRate = Number(item.tax_rate) || 20;
            const productCurrency = item.product?.currency || item.product?.logo_currency || 'TRY';
            const originalPriceInCurrency = Number(item.product?.sale_price) || price;
            const subtotal = qty * price;
            const afterD1 = subtotal * (1 - d1 / 100);
            const afterD2 = afterD1 * (1 - d2 / 100);
            const afterD3 = afterD2 * (1 - d3 / 100);
            const discountAmount = subtotal - afterD3;
            const taxAmount = afterD3 * (taxRate / 100);
            return {
                product_id: item.product_id,
                product_name: item.product_name,
                product_code: item.product_code,
                description: item.description || '',
                unit_id: item.unit_id || null,
                quantity: qty,
                unit_price: price,
                original_unit_price: price,
                discount_rate1: d1,
                discount_rate2: d2,
                discount_rate3: d3,
                discount_amount: discountAmount,
                tax_rate: taxRate,
                tax_amount: taxAmount,
                total: afterD3 + taxAmount,
                image_url: item.product?.images?.[0]?.image_url,
                product: item.product,
                original_currency: productCurrency,
                original_price_in_currency: originalPriceInCurrency,
            };
        })
    });

    const [customerSearch, setCustomerSearch] = useState('');
    const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
        offer.entity ? {
            id: offer.entity.id,
            entity_name: offer.entity.title,
            entity_code: offer.entity.account_code,
            phone: offer.entity.phone_1,
            email: offer.entity.email,
            address: offer.entity.address
        } : null
    );

    const [productSearch, setProductSearch] = useState('');
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [editingPrices, setEditingPrices] = useState<{[key: number]: string}>({});
    const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());
    const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({});
    const productSearchRef = useRef<HTMLDivElement>(null);

    // Get selected currency info
    const selectedCurrency = currencies.find((c: any) => c.id === data.currency_id);
    const offerCurrencyCode = selectedCurrency?.cur_code || 'TRY';
    const getCurrencySymbol = (currencyCode: string) =>
        currencies.find((c: any) => c.cur_code === currencyCode)?.symbol || `${currencyCode} `;
    const currencySymbol = selectedCurrency?.symbol || getCurrencySymbol(offerCurrencyCode);

    useEffect(() => {
        axios.get(route('sales.offers.exchange-rates'))
            .then(response => {
                if (response.data.success) {
                    setExchangeRates(response.data.rates);
                }
            })
            .catch(console.error);
    }, []);

    const convertPrice = (amount: number, fromCurrency: string, toCurrency: string): number => {
        if (fromCurrency === toCurrency) return amount;
        if (!amount) return 0;

        const fromRate = exchangeRates[fromCurrency]?.rate;
        const toRate = exchangeRates[toCurrency]?.rate;

        if (!fromRate || !toRate) {
            return amount;
        }

        if (fromCurrency === 'TRY') {
            return amount / toRate;
        }

        if (toCurrency === 'TRY') {
            return amount * fromRate;
        }

        const tryAmount = amount * fromRate;
        return tryAmount / toRate;
    };

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

        const needsUpdate = data.items.some((item: any) => Number(item.tax_rate) !== data.tax_rate);
        if (!needsUpdate) return;

        const updatedItems = data.items.map((item: any) => {
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

    // AJAX Customer search
    useEffect(() => {
        if (customerSearch.length >= 2) {
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
    }, [customerSearch]);

    // AJAX Product search
    useEffect(() => {
        if (productSearch.length >= 2) {
            setLoadingProducts(true);
            const timer = setTimeout(() => {
                axios.get(route('sales.offers.search-products'), {
                    params: { q: productSearch, per_page: 20 }
                })
                    .then(response => {
                        const products = response.data.data || response.data;
                        setFilteredProducts(products);
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

    const handleCustomerSelect = (customer: Customer) => {
        setSelectedCustomer(customer);
        setData({
            ...data,
            entity_id: customer.id,
            customer_name: null,
            customer_phone: null,
            customer_email: null,
            customer_address: null,
        });
        setCustomerSearch('');
        setFilteredCustomers([]);
    };

    const addProduct = (product: Product) => {
        // Get base unit from product units or fall back to baseUnit
        const baseUnit = product.active_units?.find(u => u.is_base_unit);
        const defaultUnitId = baseUnit?.unit_id || product.baseUnit?.id || null;

        const productCurrency = product.currency || product.logo_currency || 'TRY';
        const originalPrice = Number(product.sale_price) || 0;
        const convertedPrice = offerCurrencyCode === 'TRY'
            && productCurrency !== 'TRY'
            && Number(product.sale_price_try) > 0
            ? Number(product.sale_price_try)
            : convertPrice(originalPrice, productCurrency, offerCurrencyCode);
        const salePrice = Math.round(convertedPrice * 100) / 100;
        const taxRate = data.tax_rate;
        const taxAmount = salePrice * (taxRate / 100);

        const newItem: OfferItem = {
            product_id: product.id,
            product_name: product.name,
            product_code: product.code,
            unit_id: defaultUnitId,
            quantity: 1,
            unit_price: salePrice,
            original_unit_price: salePrice,
            discount_rate1: 0,
            discount_rate2: 0,
            discount_rate3: 0,
            discount_amount: 0,
            tax_rate: taxRate,
            tax_amount: taxAmount,
            total: salePrice + taxAmount,
            image_url: product.image_url,
            product: product,
            original_currency: productCurrency,
            original_price_in_currency: originalPrice
        };
        setData('items', [...data.items, newItem]);
        // Liste açık kalsın, birden fazla ürün eklenebilsin
    };

    const updateItem = (index: number, field: string, value: any) => {
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
        item.total = afterD3 + taxAmount;

        setData('items', updatedItems);
    };

    const handleUnitChange = (index: number, unitId: number | null) => {
        const item = data.items[index];
        if (!item.product) return;

        const updatedItems = [...data.items];
        updatedItems[index] = { ...updatedItems[index], unit_id: unitId };

        // Find the selected unit and calculate price
        if (unitId && item.product.active_units) {
            const selectedUnit = item.product.active_units.find(u => u.unit_id === unitId);
            if (selectedUnit) {
                const productCurrency = item.original_currency || item.product.currency || item.product.logo_currency || 'TRY';
                // Use unit-specific price if available, otherwise calculate from base price * conversion_factor
                if (selectedUnit.sale_price > 0) {
                    const convertedPrice = convertPrice(selectedUnit.sale_price, productCurrency, offerCurrencyCode);
                    updatedItems[index].unit_price = Math.round(convertedPrice * 100) / 100;
                } else if (selectedUnit.conversion_factor > 0) {
                    // Calculate price based on conversion factor
                    const basePrice = item.product.sale_price || item.product.logo_sale_price || 0;
                    const convertedPrice = convertPrice(basePrice * selectedUnit.conversion_factor, productCurrency, offerCurrencyCode);
                    updatedItems[index].unit_price = Math.round(convertedPrice * 100) / 100;
                }
            }
        } else if (!unitId) {
            // Reset to base price when no unit selected
            const basePrice = item.product.sale_price || item.product.logo_sale_price || 0;
            const productCurrency = item.original_currency || item.product.currency || item.product.logo_currency || 'TRY';
            const convertedPrice = offerCurrencyCode === 'TRY'
                && productCurrency !== 'TRY'
                && Number(item.product.sale_price_try) > 0
                ? Number(item.product.sale_price_try)
                : convertPrice(basePrice, productCurrency, offerCurrencyCode);
            updatedItems[index].unit_price = Math.round(convertedPrice * 100) / 100;
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
        itemToUpdate.total = afterD3 + taxAmount;

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
        setData('items', data.items.filter((_, i) => i !== index));
    };

    const toggleNote = (index: number) => {
        setExpandedNotes(prev => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
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
        console.log('Submitting form data:', data);
        put(route('sales.offers.update', offer.id), {
            onError: (errors) => {
                console.error('Validation errors:', errors);
                alert('Form hatası: ' + JSON.stringify(errors));
            },
            onSuccess: () => {
                console.log('Form submitted successfully');
            }
        });
    };

    return (
        <Layout>
            <Head title={`Teklif Düzenle - ${offer.offer_no}`} />

            <div className="page-content">
                <div className="container-fluid">
                    <Row className="mb-3">
                        <Col>
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Teklif Düzenle - {offer.offer_no}</h4>
                                <Link href={route('sales.offers.show', offer.id)}>
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
                                <Card className="mb-3" style={{ overflow: 'visible' }}>
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
                                                    }}
                                                />
                                            </Col>
                                            <Col xs={6}>
                                                <Form.Check
                                                    type="radio"
                                                    label="Geçici Müşteri"
                                                    name="customerType"
                                                    checked={data.customer_type === 'temporary'}
                                                    onChange={() => {
                                                        setData('customer_type', 'temporary');
                                                        setData('entity_id', '');
                                                        setSelectedCustomer(null);
                                                    }}
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
                                                            <div key={c.id} className="p-2 border-bottom hover-bg" onClick={() => handleCustomerSelect(c)} style={{ cursor: 'pointer', pointerEvents: 'auto' }}>
                                                                <strong>{c.entity_name}</strong><br />
                                                                <small className="text-muted">Kod: {c.entity_code} {c.phone && `| ${c.phone}`}</small>
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
                                                <Col md={6}>
                                                    <Form.Group className="mb-2">
                                                        <Form.Label>Müşteri Adı *</Form.Label>
                                                        <Form.Control value={data.customer_name} onChange={e => setData('customer_name', e.target.value)} isInvalid={!!errors.customer_name} />
                                                        {errors.customer_name && <Form.Control.Feedback type="invalid">{errors.customer_name}</Form.Control.Feedback>}
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group className="mb-2">
                                                        <Form.Label>Telefon *</Form.Label>
                                                        <Form.Control value={data.customer_phone} onChange={e => setData('customer_phone', e.target.value)} isInvalid={!!errors.customer_phone} />
                                                        {errors.customer_phone && <Form.Control.Feedback type="invalid">{errors.customer_phone}</Form.Control.Feedback>}
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group className="mb-2">
                                                        <Form.Label>Email</Form.Label>
                                                        <Form.Control type="email" value={data.customer_email} onChange={e => setData('customer_email', e.target.value)} isInvalid={!!errors.customer_email} />
                                                        {errors.customer_email && <Form.Control.Feedback type="invalid">{errors.customer_email}</Form.Control.Feedback>}
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group className="mb-2">
                                                        <Form.Label>Adres</Form.Label>
                                                        <Form.Control value={data.customer_address} onChange={e => setData('customer_address', e.target.value)} />
                                                    </Form.Group>
                                                </Col>
                                            </Row>
                                        )}
                                    </Card.Body>
                                </Card>

                                {/* Products */}
                                <Card className="mb-3">
                                    <Card.Header>
                                        <h5 className="card-title mb-0">
                                            <i className="ri-shopping-cart-line me-2"></i>Ürünler
                                        </h5>
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
                                                    <Button variant="outline-secondary" size="sm" onClick={() => { setShowProductDropdown(false); setProductSearch(''); }}>
                                                        <i className="ri-close-line"></i>
                                                    </Button>
                                                )}
                                            </InputGroup>

                                            {loadingProducts && <div className="text-center p-2"><span className="spinner-border spinner-border-sm"></span></div>}

                                            {showProductDropdown && filteredProducts.length > 0 && (
                                                <div className="border rounded position-absolute w-100 bg-white shadow" style={{ zIndex: 1050, maxHeight: '400px', overflowY: 'auto' }}>
                                                    {filteredProducts.map(p => {
                                                        const productCurrency = p.currency || p.logo_currency || 'TRY';
                                                        const originalPrice = Number(p.sale_price) || 0;
                                                        const convertedPrice = offerCurrencyCode === 'TRY'
                                                            && productCurrency !== 'TRY'
                                                            && Number(p.sale_price_try) > 0
                                                            ? Number(p.sale_price_try)
                                                            : convertPrice(originalPrice, productCurrency, offerCurrencyCode);

                                                        return (
                                                        <div key={p.id} className="p-2 border-bottom hover-bg d-flex align-items-center gap-2" onClick={() => addProduct(p)} style={{ cursor: 'pointer' }}>
                                                            {p.image_url ? (
                                                                <Image src={p.image_url} rounded style={{ width: '50px', height: '50px', objectFit: 'cover' }} />
                                                            ) : (
                                                                <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                                                                    <i className="ri-image-line text-muted"></i>
                                                                </div>
                                                            )}
                                                            <div className="flex-grow-1">
                                                                <strong>{p.name}</strong><br />
                                                                <small className="text-muted d-block mb-1">{p.code}</small>
                                                                <small className="text-muted">
                                                                    Fiyat: {getCurrencySymbol(productCurrency)}{fmt(originalPrice)}
                                                                    {productCurrency !== offerCurrencyCode && (
                                                                        <>{' -> '}{currencySymbol}{fmt(convertedPrice)}</>
                                                                    )}
                                                                    <Badge bg="info" className="ms-2">Stok: {p.stock_quantity} | {p.code}</Badge>
                                                                </small>
                                                            </div>
                                                        </div>
                                                    )})}
                                                </div>
                                            )}
                                        </div>

                                        {data.items.length > 0 && (
                                            <div className="table-responsive">
                                                <Table size="sm" className="table-bordered">
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th style={{ width: '4%' }}>#</th>
                                                            <th style={{ width: '16%' }}>Ürün</th>
                                                            <th style={{ width: '10%' }}>Açıklama</th>
                                                            <th style={{ width: '10%' }}>Birim</th>
                                                            <th style={{ width: '8%' }}>Miktar</th>
                                                            <th style={{ width: '12%' }}>Fiyat</th>
                                                            <th style={{ width: '7%' }}>İsk1%</th>
                                                            <th style={{ width: '7%' }}>İsk2%</th>
                                                            <th style={{ width: '7%' }}>İsk3%</th>
                                                            <th style={{ width: '12%' }}>Toplam</th>
                                                            <th style={{ width: '5%' }}></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {data.items.map((item, idx) => (
                                                            <tr key={idx}>
                                                                <td className="text-center">{idx + 1}</td>
                                                                <td>
                                                                    <div className="d-flex align-items-center gap-2">
                                                                        {item.image_url ? (
                                                                            <Image src={item.image_url} rounded style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                                                                        ) : (
                                                                            <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                                                <i className="ri-image-line text-muted" style={{ fontSize: '20px' }}></i>
                                                                            </div>
                                                                        )}
                                                                        <div className="flex-grow-1">
                                                                            <strong className="d-block">{item.product_name}</strong>
                                                                            {item.product_code && <small className="text-muted">Kod: {item.product_code}</small>}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <Form.Control
                                                                        size="sm"
                                                                        type="text"
                                                                        placeholder="Renk, boyut..."
                                                                        value={item.description || ''}
                                                                        onChange={e => updateItem(idx, 'description', e.target.value)}
                                                                        style={{ minWidth: '100px' }}
                                                                    />
                                                                </td>
                                                                <td>
                                                                    {item.product ? (
                                                                        <Form.Select
                                                                            size="sm"
                                                                            value={item.unit_id || ''}
                                                                            onChange={(e) => handleUnitChange(idx, e.target.value ? parseInt(e.target.value) : null)}
                                                                        >
                                                                            {item.product.active_units && item.product.active_units.length > 0 ? (
                                                                                item.product.active_units.map((pu) => (
                                                                                    <option key={pu.unit_id} value={pu.unit_id}>
                                                                                        {pu.unit?.name || pu.unit_name} ({pu.unit?.symbol || pu.unit_code})
                                                                                    </option>
                                                                                ))
                                                                            ) : (
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
                                                                    <Form.Control size="sm" type="number" min="0.01" step="0.01" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)} onBlur={e => { e.target.value = String(parseFloat(e.target.value) || 0); }} />
                                                                </td>
                                                                <td>
                                                                    <Form.Control
                                                                        size="sm"
                                                                        type="text"
                                                                        style={{ minWidth: '110px' }}
                                                                        value={editingPrices[idx] !== undefined ? editingPrices[idx] : item.unit_price}
                                                                        onFocus={() => canEditPrice && setEditingPrices(prev => ({ ...prev, [idx]: String(item.unit_price) }))}
                                                                        onChange={e => canEditPrice && setEditingPrices(prev => ({ ...prev, [idx]: e.target.value }))}
                                                                        onBlur={() => canEditPrice && handlePriceBlur(idx)}
                                                                        onKeyDown={e => canEditPrice && handlePriceKeyDown(e, idx)}
                                                                        readOnly={!canEditPrice}
                                                                        className={!canEditPrice ? 'bg-light' : ''}
                                                                    />
                                                                    {item.original_unit_price && item.unit_price !== item.original_unit_price && (
                                                                        <small className="text-muted d-block mt-1">
                                                                            <s>{currencySymbol}{fmt(Number(item.original_unit_price))}</s>
                                                                        </small>
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    <Form.Control size="sm" type="number" step="0.01" min="0" max="100" value={item.discount_rate1} onChange={e => updateItem(idx, 'discount_rate1', parseFloat(e.target.value) || 0)} style={{ width: '60px' }} />
                                                                </td>
                                                                <td>
                                                                    <Form.Control size="sm" type="number" step="0.01" min="0" max="100" value={item.discount_rate2} onChange={e => updateItem(idx, 'discount_rate2', parseFloat(e.target.value) || 0)} style={{ width: '60px' }} />
                                                                </td>
                                                                <td>
                                                                    <Form.Control size="sm" type="number" step="0.01" min="0" max="100" value={item.discount_rate3} onChange={e => updateItem(idx, 'discount_rate3', parseFloat(e.target.value) || 0)} style={{ width: '60px' }} />
                                                                </td>
                                                                <td className="text-end fw-bold">{currencySymbol}{fmt(Number((item.total || 0) - (item.tax_amount || 0)))}</td>
                                                                <td className="text-center">
                                                                    <Button variant="link" size="sm" className="text-danger p-0" onClick={() => removeItem(idx)}>
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

                                {/* Notes */}
                                <Card className="mb-3">
                                    <Card.Body>
                                        <Form.Group>
                                            <Form.Label>Notlar</Form.Label>
                                            <Form.Control as="textarea" rows={3} value={data.notes} onChange={e => setData('notes', e.target.value)} />
                                        </Form.Group>
                                    </Card.Body>
                                </Card>

                                {/* Summary */}
                                <Card className="mb-3 border-primary">
                                    <Card.Header className="bg-primary text-white">
                                        <h6 className="mb-0 text-white">Özet</h6>
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
                                        <i className="ri-save-line me-1"></i>Güncelle
                                    </Button>
                                    <Link href={route('sales.offers.show', offer.id)}>
                                        <Button variant="outline-secondary" className="w-100">İptal</Button>
                                    </Link>
                                </div>
                            </Col>
                        </Row>
                    </Form>
                </div>
            </div>

            <style>{`
                .hover-bg:hover {
                    background-color: #f8f9fa;
                }
            `}</style>
        </Layout>
    );
}
