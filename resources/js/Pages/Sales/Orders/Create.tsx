import React, { useState, useEffect } from 'react';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import { Card, Form, Button, Row, Col, Table, InputGroup, Badge, Alert, Modal } from 'react-bootstrap';
import Layout from '@/Layouts';
import SearchableSelect from '@/Components/SearchableSelect';
import ProductSearchableSelect from '@/Components/ProductSearchableSelect';
import BulkDiscountPanel from '@/Components/BulkDiscountPanel';
import axios from 'axios';

interface Customer {
    id: number;
    title: string;
    account_code: string;
    payment_term_days?: number;
    currency?: string;
}

interface DeliveryAddress {
    id: number;
    current_account_id: number;
    name: string;
    contact_person?: string;
    contact_phone?: string;
    address: string;
    city_id?: number;
    district_id?: number;
    country_id?: number;
    postal_code?: string;
    type?: string;
    is_default: boolean;
    is_active: boolean;
    delivery_notes?: string;
    delivery_hours?: string;
    full_address?: string;
}

interface Salesperson {
    id: number;
    name: string;
}

interface Tax {
    id: number;
    name: string;
    rate: number;
    type: string;
    code: string;
    is_default: boolean;
}

interface Product {
    id: number;
    code: string;
    name: string;
    sale_price: number;
    sale_price_try?: number;
    currency?: string;
    tax_rate: number;
    stock_quantity: number;
    category?: {
        id: number;
        name: string;
    };
    brand?: {
        id: number;
        name: string;
    };
    supplier?: {
        id: number;
        title: string;
        account_code: string;
    };
    baseUnit?: {
        id: number;
        name: string;
        symbol: string;
    };
    tax?: Tax;
    primary_image_url?: string;
    // Logo fiyat bilgileri
    logo_price?: number;
    logo_sale_price?: number;
    logo_purchase_price?: number;
    logo_currency?: string;
    has_logo_price?: boolean;
    // Product units
    active_units?: ProductUnit[];
}

interface OrderItem {
    id?: string;
    product_id: number | null;
    product?: Product;
    unit_id?: number | null;
    quantity: number;
    unit_price: number;
    discount_rate1: number;
    discount_rate2: number;
    discount_rate3: number;
    discount_amount: number;
    tax_rate: number;
    tax_amount: number;
    line_total: number;
    requested_delivery_date: string;
    notes: string;
    special_instructions: string;
    original_unit_price?: number;
    original_currency?: string;
    original_price_in_currency?: number;
    bulk_discount_applied?: boolean;
    discount_source?: 'manual' | 'bulk_category' | 'bulk_brand' | 'bulk_supplier';
    // Logo fiyat bilgileri
    logo_price?: number;
    has_logo_price?: boolean;
}

interface ExchangeRates {
    [key: string]: {
        code: string;
        name: string;
        rate: number;
        date: string;
    };
}

interface Unit {
    id: number;
    name: string;
    symbol: string;
    type: string;
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

interface Props {
    customers: Customer[];
    salespeople: Salesperson[];
    statuses: Record<string, string>;
    priorities: Record<string, string>;
    paymentMethods: Record<string, string>;
    currencies: Array<{
        value: string;
        label: string;
    }>;
    taxes: Tax[];
    units: Unit[];
}

export default function Create({
    customers,
    salespeople,
    statuses,
    priorities,
    paymentMethods,
    currencies,
    taxes,
    units
}: Props) {
    const auth = usePage().props.auth as any;
    const userRoles = auth?.user?.roles?.map((r: any) => r.name) || [];
    const canEditPrice = userRoles.some((r: string) => ['admin', 'Super Admin', 'sales_manager', 'sales-manager'].includes(r));

    // Get default tax rate
    const defaultTaxRate = taxes.find(tax => tax.is_default)?.rate || taxes[0]?.rate || 18;

    // Bulk discount state
    const [showBulkDiscount, setShowBulkDiscount] = useState(false);

    // Bulk add items modal state
    const [showBulkAddModal, setShowBulkAddModal] = useState(false);
    const [bulkItemsText, setBulkItemsText] = useState('');
    const [bulkAddProcessing, setBulkAddProcessing] = useState(false);

    // Delivery address state
    const [deliveryAddresses, setDeliveryAddresses] = useState<DeliveryAddress[]>([]);
    const [selectedDeliveryAddress, setSelectedDeliveryAddress] = useState<number | null>(null);
    const [showAddAddressModal, setShowAddAddressModal] = useState(false);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>(''); // Local state for customer_id
    const [isSubmitting, setIsSubmitting] = useState(false); // Local processing state for router.post

    // Geographic data states
    const [countries, setCountries] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);
    const [districts, setDistricts] = useState<any[]>([]);

    const [newAddressForm, setNewAddressForm] = useState({
        name: '',
        contact_person: '',
        contact_phone: '',
        contact_email: '',
        responsible_name: '',
        authorized_name: '',
        address: '',
        country_id: '1', // Turkey default
        city_id: '',
        district_id: '',
        postal_code: '',
        type: 'shipping',
        delivery_notes: '',
        delivery_hours: '',
        is_default: false,
        is_active: true
    });

    // Order discount state
    const [orderDiscountType, setOrderDiscountType] = useState<'percentage' | 'amount'>('percentage');
    const [orderDiscountValue, setOrderDiscountValue] = useState<number>(0);

    // Exchange rates state for currency conversion
    const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({});
    const [loadingRates, setLoadingRates] = useState(false);

    // Get currency symbol helper
    const getCurrencySymbol = (currency: string) => {
        switch (currency) {
            case 'TRY': return '₺';
            case 'USD': return '$';
            case 'EUR': return '€';
            case 'GBP': return '£';
            default: return currency + ' ';
        }
    };

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

    /**
     * Convert price from one currency to another using exchange rates
     */
    const convertPrice = (amount: number, fromCurrency: string, toCurrency: string): number => {
        if (fromCurrency === toCurrency) return amount;
        if (!amount) return 0;

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

    const [editingPrices, setEditingPrices] = useState<{[key: number]: string}>({});

    const [items, setItems] = useState<OrderItem[]>([{
        id: Math.random().toString(),
        product_id: null,
        unit_id: null,
        quantity: 1,
        unit_price: 0,
        discount_rate1: 0,
        discount_rate2: 0,
        discount_rate3: 0,
        discount_amount: 0,
        tax_rate: defaultTaxRate,
        tax_amount: 0,
        line_total: 0,
        requested_delivery_date: '',
        notes: '',
        special_instructions: ''
    }]);

    const { data, setData, errors } = useForm({
        customer_id: '',
        salesperson_id: '',
        order_date: new Date().toISOString().split('T')[0],
        delivery_date: '',
        requested_delivery_date: '',
        priority: 'normal',
        payment_term_days: 30,
        payment_method: 'bank_transfer',
        currency: 'TRY',
        exchange_rate: 1,
        shipping_cost: 0,
        discount_amount: 0,
        billing_address: {},
        shipping_address: {},
        notes: '',
        internal_notes: '',
        terms_and_conditions: '',
        reference_number: '',
        external_order_number: '',
        items: []
    });

    // Order currency symbol for display
    const orderCurrencySymbol = getCurrencySymbol(data.currency);

    // Calculate totals first (subtotal = KDV hariç net toplam)
    const totalTax = items.reduce((sum, item) => sum + (item.tax_amount || 0), 0);
    const subtotal = items.reduce((sum, item) => sum + ((item.line_total || 0) - (item.tax_amount || 0)), 0);

    // Calculate order discount - net tutar (KDV hariç) üzerinden
    const calculateOrderDiscount = () => {
        if (orderDiscountType === 'percentage') {
            const baseAmount = subtotal || 0;
            const discountPercent = (parseFloat(orderDiscountValue) || 0) / 100;
            return baseAmount * discountPercent;
        }
        return parseFloat(orderDiscountValue) || 0;
    };

    const orderDiscountAmount = calculateOrderDiscount();
    const totalAmount = (() => {
        const sub = subtotal || 0;
        const tax = totalTax || 0;
        const shipping = parseFloat(data.shipping_cost) || 0;
        const discount = parseFloat(orderDiscountAmount) || 0;
        const adjustedTax = (sub > 0 && discount > 0) ? tax * (1 - discount / sub) : tax;
        return (sub - discount) + adjustedTax + shipping;
    })();

    // Calculate discount information
    const bulkDiscountItems = items.filter(item => item.bulk_discount_applied);
    const manualDiscountAmount = items.reduce((sum, item) => {
        return sum + (item.discount_source === 'manual' || !item.discount_source ? item.discount_amount || 0 : 0);
    }, 0);
    const bulkDiscountAmount = items.reduce((sum, item) => {
        return sum + (item.bulk_discount_applied ? item.discount_amount || 0 : 0);
    }, 0);
    const totalItemDiscount = manualDiscountAmount + bulkDiscountAmount;

    // Load geographic data
    const loadCountries = async () => {
        try {
            const response = await fetch('/api/geographic/countries');
            if (response.ok) {
                const data = await response.json();
                console.log('📍 Loaded countries:', data);
                setCountries(data);
            }
        } catch (error) {
            console.error('Error loading countries:', error);
        }
    };

    const loadCities = async (countryId: string) => {
        try {
            const response = await fetch(`/api/geographic/cities/${countryId}`);
            if (response.ok) {
                const data = await response.json();
                console.log('🏙️ Loaded cities for country', countryId, ':', data);
                setCities(data);
            }
        } catch (error) {
            console.error('Error loading cities:', error);
        }
    };

    const loadDistricts = async (cityId: string) => {
        try {
            const response = await fetch(`/api/geographic/districts/${cityId}`);
            if (response.ok) {
                const data = await response.json();
                console.log('🏘️ Loaded districts for city', cityId, ':', data);
                setDistricts(data);
            }
        } catch (error) {
            console.error('Error loading districts:', error);
        }
    };

    // Load initial data
    useEffect(() => {
        loadCountries();
        // Load Turkey cities by default
        loadCities('1');
    }, []);

    // Fetch delivery addresses for customer
    const fetchDeliveryAddresses = async (customerId: number) => {
        try {
            const response = await fetch(`/sales/orders/delivery-addresses?customer_id=${customerId}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                }
            });

            console.log('📡 Delivery address API response status:', response.status);

            if (response.ok) {
                const addresses = await response.json();
                console.log('📍 Received delivery addresses:', addresses);
                console.log('📊 Number of addresses:', addresses.length);

                setDeliveryAddresses(addresses);

                // Auto-select default address if available
                const defaultAddress = addresses.find((addr: DeliveryAddress) => addr.is_default);
                if (defaultAddress) {
                    console.log('🏠 Auto-selecting default address:', defaultAddress);
                    setSelectedDeliveryAddress(defaultAddress.id);
                    setData('shipping_address', {
                        id: defaultAddress.id,
                        name: defaultAddress.name,
                        address: defaultAddress.address,
                        postal_code: defaultAddress.postal_code,
                        contact_person: defaultAddress.contact_person,
                        contact_phone: defaultAddress.contact_phone,
                        delivery_notes: defaultAddress.delivery_notes,
                    });
                } else {
                    console.log('❌ No default address found');
                }
            }
        } catch (error) {
            console.error('Error fetching delivery addresses:', error);
        }
    };

    // Handle delivery address selection
    const handleDeliveryAddressChange = (addressId: number | null) => {
        setSelectedDeliveryAddress(addressId);

        if (addressId) {
            const address = deliveryAddresses.find(addr => addr.id === addressId);
            if (address) {
                setData('shipping_address', {
                    id: address.id,
                    name: address.name,
                    address: address.address,
                    postal_code: address.postal_code,
                    contact_person: address.contact_person,
                    contact_phone: address.contact_phone,
                    delivery_notes: address.delivery_notes,
                });
            }
        } else {
            setData('shipping_address', {});
        }
    };

    // Handle adding new delivery address
    const handleAddNewAddress = async () => {
        if (!selectedCustomerId || selectedCustomerId === '') {
            alert('Lütfen önce bir müşteri seçiniz.');
            return;
        }

        if (!newAddressForm.name.trim() || !newAddressForm.address.trim()) {
            alert('Lütfen adres adı ve adres bilgilerini giriniz.');
            return;
        }

        try {
            const response = await fetch('/sales/orders/delivery-addresses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({
                    ...newAddressForm,
                    current_account_id: parseInt(selectedCustomerId)
                })
            });

            if (response.ok) {
                const newAddress = await response.json();
                setDeliveryAddresses(prev => [...prev, newAddress]);

                // Auto-select the newly added address
                setSelectedDeliveryAddress(newAddress.id);
                setData('shipping_address', {
                    id: newAddress.id,
                    name: newAddress.name,
                    address: newAddress.address,
                    postal_code: newAddress.postal_code,
                    contact_person: newAddress.contact_person,
                    contact_phone: newAddress.contact_phone,
                    delivery_notes: newAddress.delivery_notes,
                });

                // Reset form and close modal
                setNewAddressForm({
                    name: '',
                    contact_person: '',
                    contact_phone: '',
                    address: '',
                    city_id: '',
                    district_id: '',
                    postal_code: '',
                    type: 'branch',
                    delivery_notes: '',
                    delivery_hours: '',
                    is_default: false,
                    is_active: true
                });
                setShowAddAddressModal(false);
            } else {
                const errorData = await response.json();
                alert('Adres eklenirken hata oluştu: ' + (errorData.message || 'Bilinmeyen hata'));
            }
        } catch (error) {
            console.error('Error adding address:', error);
            alert('Adres eklenirken hata oluştu.');
        }
    };

    // Update customer data when customer changes
    const handleCustomerChange = (customerId: number | null) => {
        console.log('🔄 handleCustomerChange called with:', customerId);

        const customerIdString = customerId?.toString() || '';

        // Update both form data and local state
        setData('customer_id', customerIdString);
        setSelectedCustomerId(customerIdString);

        console.log('🔄 Updated selectedCustomerId to:', customerIdString);

        if (customerId) {
            const customer = customers.find(c => c.id === customerId);
            console.log('🔍 Found customer:', customer);

            if (customer) {
                if (customer.payment_term_days) {
                    setData('payment_term_days', customer.payment_term_days);
                }
                if (customer.currency) {
                    setData('currency', customer.currency);
                }
            }

            // Fetch delivery addresses for this customer
            console.log('📍 Fetching delivery addresses for customer:', customerId);
            fetchDeliveryAddresses(customerId);
        } else {
            // Clear delivery addresses when no customer selected
            console.log('🧹 Clearing delivery addresses');
            setDeliveryAddresses([]);
            setSelectedDeliveryAddress(null);
            setData('shipping_address', {});
        }
    };

    // Add new item
    const addItem = () => {
        setItems([...items, {
            id: Math.random().toString(),
            product_id: null,
            unit_id: null,
            quantity: 1,
            unit_price: 0,
            discount_rate1: 0,
            discount_rate2: 0,
            discount_rate3: 0,
            discount_amount: 0,
            tax_rate: defaultTaxRate,
            tax_amount: 0,
            line_total: 0,
            requested_delivery_date: '',
            notes: '',
            special_instructions: ''
        }]);
    };

    // Remove item
    const removeItem = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
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
            const newItems = [...items];
            const item = { ...newItems[index] };
            item.unit_price = evaluated;

            // Recalculate totals
            calculateItemTotals(item, true);
            newItems[index] = item;
            setItems(newItems);
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

    // Update item
    const updateItem = (index: number, field: keyof OrderItem, value: any) => {
        console.log('updateItem called:', { index, field, value });
        const newItems = [...items];
        const item = newItems[index];

        // Update the field
        newItems[index] = { ...item, [field]: value };

        // If discount rate is manually changed and item had bulk discount
        if ((field === 'discount_rate1' || field === 'discount_rate2' || field === 'discount_rate3') && item.bulk_discount_applied) {
            newItems[index] = {
                ...newItems[index],
                bulk_discount_applied: false,
                discount_source: 'manual',
                original_unit_price: undefined
            };
            console.log('Bulk discount converted to manual for item:', index);
        }

        // If discount amount is manually changed and item had bulk discount
        if (field === 'discount_amount' && item.bulk_discount_applied) {
            newItems[index] = {
                ...newItems[index],
                bulk_discount_applied: false,
                discount_source: 'manual',
                original_unit_price: undefined
            };
            console.log('Bulk discount converted to manual for item:', index);
        }

        // Recalculate totals for this item
        const shouldRecalculateDiscount = field === 'discount_rate1' || field === 'discount_rate2' || field === 'discount_rate3' || field === 'quantity' || field === 'unit_price';
        calculateItemTotals(newItems[index], shouldRecalculateDiscount);

        setItems(newItems);
        console.log('Items after update:', newItems.map(item => ({ id: item.id, product_id: item.product_id, product_name: item.product?.name, bulk_applied: item.bulk_discount_applied })));
    };

    // Handle product selection
    const handleProductSelect = (index: number, product: Product | null) => {
        console.log('handleProductSelect called:', { index, product, productId: product?.id });
        if (product) {
            console.log('About to call updateItem with product_id:', product.id);

            // Get base unit from product units or fall back to baseUnit
            const baseUnit = product.active_units?.find(u => u.is_base_unit);
            const defaultUnitId = baseUnit?.unit_id || product.baseUnit?.id || null;
            const originalPrice = baseUnit?.sale_price || product.sale_price;

            // Determine product currency (from currency field, logo_currency, or default TRY)
            const productCurrency = product.currency || product.logo_currency || 'TRY';

            // Convert price to order currency
            const convertedPrice = convertPrice(originalPrice, productCurrency, data.currency);
            const finalPrice = Math.round(convertedPrice * 100) / 100; // Round to 2 decimals

            console.log('Currency conversion:', {
                originalPrice,
                productCurrency,
                orderCurrency: data.currency,
                convertedPrice: finalPrice
            });

            // Direct state update as fallback
            const newItems = [...items];
            newItems[index] = {
                ...newItems[index],
                product_id: product.id,
                product: product,
                unit_id: defaultUnitId,
                unit_price: finalPrice,
                original_unit_price: finalPrice,
                original_currency: productCurrency,
                original_price_in_currency: originalPrice,
                tax_rate: product.tax_rate || product.tax?.rate || defaultTaxRate,
                // Logo fiyat bilgilerini sakla
                logo_price: product.logo_price || product.logo_sale_price,
                has_logo_price: product.has_logo_price || !!product.logo_sale_price
            };

            // Recalculate totals for this item
            calculateItemTotals(newItems[index]);

            // Auto-add new item if this is the last item in the list
            if (index === items.length - 1) {
                newItems.push({
                    id: Math.random().toString(),
                    product_id: null,
                    unit_id: null,
                    quantity: 1,
                    unit_price: 0,
                    discount_rate1: 0,
                    discount_rate2: 0,
                    discount_rate3: 0,
                    discount_amount: 0,
                    tax_rate: defaultTaxRate,
                    tax_amount: 0,
                    line_total: 0,
                    requested_delivery_date: '',
                    notes: '',
                    special_instructions: ''
                });
            }

            setItems(newItems);

            console.log('Product selected, directly updated items:', newItems[index]);
        } else {
            updateItem(index, 'product_id', null);
            updateItem(index, 'product', undefined);
            updateItem(index, 'unit_id', null);
            updateItem(index, 'unit_price', 0);
            updateItem(index, 'tax_rate', defaultTaxRate);
            console.log('Product cleared');
        }
    };

    // Handle unit selection change
    const handleUnitChange = (index: number, unitId: number | null) => {
        const item = items[index];
        if (!item.product) return;

        // Get product currency
        const productCurrency = item.original_currency || item.product.currency || item.product.logo_currency || 'TRY';

        const newItems = [...items];
        newItems[index] = { ...newItems[index], unit_id: unitId };

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

                // Convert price to order currency
                if (unitPrice > 0) {
                    const convertedPrice = convertPrice(unitPrice, productCurrency, data.currency);
                    newItems[index].unit_price = Math.round(convertedPrice * 100) / 100;
                    newItems[index].original_price_in_currency = unitPrice;
                }
            }
        } else if (!unitId) {
            // Reset to base price when no unit selected
            const basePrice = item.product.sale_price || item.product.logo_sale_price || 0;
            const convertedPrice = convertPrice(basePrice, productCurrency, data.currency);
            newItems[index].unit_price = Math.round(convertedPrice * 100) / 100;
            newItems[index].original_price_in_currency = basePrice;
        }

        // Recalculate totals
        calculateItemTotals(newItems[index]);
        setItems(newItems);
    };

    // Calculate item totals
    const calculateItemTotals = (item: OrderItem, recalculateDiscountAmount = false) => {
        const quantity = item.quantity || 0;
        const unitPrice = item.unit_price || 0;
        const d1 = Number(item.discount_rate1) || 0;
        const d2 = Number(item.discount_rate2) || 0;
        const d3 = Number(item.discount_rate3) || 0;
        const taxRate = item.tax_rate || 0;

        // 3 kademeli kaskad iskonto
        const subtotal = quantity * unitPrice;
        const afterD1 = subtotal * (1 - d1 / 100);
        const afterD2 = afterD1 * (1 - d2 / 100);
        const afterD3 = afterD2 * (1 - d3 / 100);

        item.discount_amount = subtotal - afterD3;
        item.tax_amount = afterD3 * (taxRate / 100);
        item.line_total = afterD3 + item.tax_amount;
    };

    // Format currency
    const formatCurrency = (amount: number, currency: string = data.currency) => {
        // Handle NaN and invalid values
        if (isNaN(amount) || amount === null || amount === undefined) {
            amount = 0;
        }

        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
        }).format(amount);
    };

    // Handle bulk discount application
    const handleBulkDiscountApply = (updatedItems: OrderItem[]) => {
        setItems(updatedItems);
    };

    // Handle bulk add items
    const handleBulkAddItems = async () => {
        setBulkAddProcessing(true);

        try {
            const lines = bulkItemsText.split('\n').filter(line => line.trim());
            const productCodes: string[] = [];
            const quantities: { [key: string]: number } = {};

            // Parse input lines
            for (const line of lines) {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 1) {
                    const productCode = parts[0].toUpperCase();
                    let quantity = 1; // Default quantity

                    if (parts.length >= 2) {
                        const parsedQuantity = parseFloat(parts[1]);
                        if (!isNaN(parsedQuantity) && parsedQuantity > 0) {
                            quantity = parsedQuantity;
                        }
                    }

                    productCodes.push(productCode);
                    quantities[productCode] = quantity;
                }
            }

            if (productCodes.length === 0) {
                alert('Geçerli stok kodu bulunamadı. Her satıra en az bir stok kodu yazın.');
                return;
            }

            // Fetch products by codes
            const response = await fetch('/sales/orders/products/bulk-search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    product_codes: productCodes,
                    customer_id: data.customer_id ? parseInt(data.customer_id) : null
                })
            });

            if (!response.ok) {
                throw new Error('Ürün arama başarısız');
            }

            const products: Product[] = await response.json();
            const foundCodes = products.map(p => p.code?.toUpperCase());
            const notFoundCodes = productCodes.filter(code => !foundCodes.includes(code));

            // Show warning for not found products
            if (notFoundCodes.length > 0) {
                const proceed = confirm(
                    `Şu stok kodları bulunamadı: ${notFoundCodes.join(', ')}\n\n` +
                    `Bulunan ${products.length} ürün eklensin mi?`
                );
                if (!proceed) {
                    return;
                }
            }

            // Remove empty items (items without product_id)
            const currentItemsWithProducts = items.filter(item => item.product_id);

            // Add new items
            const newItems: OrderItem[] = [];

            products.forEach(product => {
                const productCode = product.code?.toUpperCase();
                if (productCode && quantities[productCode]) {
                    const quantity = quantities[productCode];

                    // Check if product already exists in current items
                    const existingItemIndex = currentItemsWithProducts.findIndex(
                        item => item.product_id === product.id
                    );

                    if (existingItemIndex >= 0) {
                        // Update existing item quantity
                        currentItemsWithProducts[existingItemIndex] = {
                            ...currentItemsWithProducts[existingItemIndex],
                            quantity: currentItemsWithProducts[existingItemIndex].quantity + quantity
                        };

                        // Recalculate totals
                        calculateItemTotals(currentItemsWithProducts[existingItemIndex]);
                    } else {
                        // Get base unit from product units or fall back to baseUnit
                        const baseUnit = product.active_units?.find(u => u.is_base_unit);
                        const defaultUnitId = baseUnit?.unit_id || product.baseUnit?.id || null;
                        const defaultUnitPrice = baseUnit?.sale_price || product.sale_price;

                        // Create new item
                        const newItem: OrderItem = {
                            id: Math.random().toString(),
                            product_id: product.id,
                            product: product,
                            unit_id: defaultUnitId,
                            quantity: quantity,
                            unit_price: defaultUnitPrice,
                            discount_rate1: 0,
                            discount_rate2: 0,
                            discount_rate3: 0,
                            discount_amount: 0,
                            tax_rate: product.tax_rate || product.tax?.rate || defaultTaxRate,
                            tax_amount: 0,
                            line_total: 0,
                            requested_delivery_date: '',
                            notes: '',
                            special_instructions: ''
                        };

                        // Calculate totals for new item
                        calculateItemTotals(newItem);
                        newItems.push(newItem);
                    }
                }
            });

            // Update items state
            const finalItems = [...currentItemsWithProducts, ...newItems];

            // Add empty item at the end if needed
            if (finalItems.length === 0 || finalItems[finalItems.length - 1].product_id) {
                finalItems.push({
                    id: Math.random().toString(),
                    product_id: null,
                    unit_id: null,
                    quantity: 1,
                    unit_price: 0,
                    discount_rate1: 0,
                    discount_rate2: 0,
                    discount_rate3: 0,
                    discount_amount: 0,
                    tax_rate: defaultTaxRate,
                    tax_amount: 0,
                    line_total: 0,
                    requested_delivery_date: '',
                    notes: '',
                    special_instructions: ''
                });
            }

            setItems(finalItems);

            // Clear form and close modal
            setBulkItemsText('');
            setShowBulkAddModal(false);

        } catch (error) {
            console.error('Bulk add error:', error);
            alert('Bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setBulkAddProcessing(false);
        }
    };

    // Debug: Check items with products
    const itemsWithProducts = items.filter(item => item.product_id);
    const hasItemsWithProducts = items.some(item => item.product_id);
    console.log('Items:', items.length, 'With products:', itemsWithProducts.length, 'Has products:', hasItemsWithProducts);

    // Submit form
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate customer selection
        if (!selectedCustomerId) {
            alert('Lütfen bir müşteri seçiniz.');
            return;
        }

        // Prepare items data
        const itemsData = items.map(item => ({
            product_id: item.product_id,
            unit_id: item.unit_id || null,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_rate1: item.discount_rate1,
            discount_rate2: item.discount_rate2,
            discount_rate3: item.discount_rate3,
            discount_amount: item.discount_amount,
            tax_rate: item.tax_rate,
            requested_delivery_date: item.requested_delivery_date || null,
            notes: item.notes,
            special_instructions: item.special_instructions,
        })).filter(item => item.product_id); // Only include items with products

        const submitData = {
            ...data,
            customer_id: selectedCustomerId, // Use local state instead of form data
            discount_amount: parseFloat(orderDiscountAmount) || 0,
            items: itemsData
        };

        console.log('Submitting Create Form:', {
            orderDiscountAmount,
            discount_amount: submitData.discount_amount,
            customer_id: selectedCustomerId,
            submitData
        });

        setIsSubmitting(true);
        router.post(route('sales.orders.store'), submitData, {
            preserveScroll: true,
            onSuccess: () => {
                console.log('Order created successfully');
            },
            onError: (errors) => {
                console.error('Form errors:', errors);
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    // Update form data when items change
    useEffect(() => {
        setData('items', items);
    }, [items]);

    return (
        <Layout>
            <Head title="Yeni Satış Siparişi" />
            <div className="page-content">
                <div className="container-fluid">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h3 mb-0">
                    <i className="ri-shopping-cart-line me-2"></i>
                    Yeni Satış Siparişi
                </h1>

                <Link href={route('sales.orders.index')}>
                    <Button variant="outline-secondary">
                        <i className="ri-arrow-left-line me-1"></i>
                        Geri
                    </Button>
                </Link>
            </div>


            <Form onSubmit={handleSubmit}>
                {/* Row 1: Sipariş Bilgileri + Ödeme Bilgileri */}
                <Row>
                    <Col lg={8}>
                        <Card className="mb-4">
                            <Card.Header>
                                <h5 className="mb-0">Sipariş Bilgileri</h5>
                            </Card.Header>
                            <Card.Body>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <Form.Label>Müşteri *</Form.Label>
                                        <SearchableSelect
                                            value={data.customer_id ? parseInt(data.customer_id) : null}
                                            onChange={handleCustomerChange}
                                            searchUrl={route('accounting.current-accounts.suggestions')}
                                            searchParams={{ type: 'customer' }}
                                            placeholder="Müşteri ara..."
                                            isInvalid={!!errors.customer_id}
                                            displayFormat={(option) => `${option.title} (${option.account_code})`}
                                        />
                                        {errors.customer_id && (
                                            <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                                                {errors.customer_id}
                                            </Form.Control.Feedback>
                                        )}
                                    </Col>
                                    <Col md={6}>
                                        <Form.Label>Sevk Adresi</Form.Label>
                                        <InputGroup>
                                            <Form.Select
                                                value={selectedDeliveryAddress || ''}
                                                onChange={(e) => handleDeliveryAddressChange(e.target.value ? parseInt(e.target.value) : null)}
                                                disabled={!selectedCustomerId || selectedCustomerId === ''}
                                            >
                                                <option value="">
                                                    {!selectedCustomerId || selectedCustomerId === '' ? 'Önce müşteri seçiniz' : 'Adres seçiniz'}
                                                </option>
                                                {deliveryAddresses.map(address => (
                                                    <option key={address.id} value={address.id}>
                                                        {address.name} - {address.address}
                                                        {address.is_default && ' (Varsayılan)'}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                            <Button
                                                type="button"
                                                variant="outline-primary"
                                                disabled={!selectedCustomerId || selectedCustomerId === ''}
                                                title={!selectedCustomerId || selectedCustomerId === '' ? "Önce müşteri seçiniz" : "Yeni adres ekle"}
                                                onClick={() => setShowAddAddressModal(true)}
                                            >
                                                <i className="ri-add-line"></i>
                                            </Button>
                                        </InputGroup>
                                        {selectedDeliveryAddress && (
                                            <small className="text-muted mt-1 d-block">
                                                {(() => {
                                                    const addr = deliveryAddresses.find(a => a.id === selectedDeliveryAddress);
                                                    return addr ? (
                                                        <>
                                                            {addr.contact_person && `${addr.contact_person} - `}
                                                            {addr.contact_phone && addr.contact_phone}
                                                            {addr.delivery_notes && ` • ${addr.delivery_notes}`}
                                                        </>
                                                    ) : null;
                                                })()}
                                            </small>
                                        )}
                                    </Col>
                                    <Col md={4}>
                                        <Form.Label>Satış Temsilcisi</Form.Label>
                                        <SearchableSelect
                                            value={data.salesperson_id ? parseInt(data.salesperson_id) : null}
                                            onChange={(id) => setData('salesperson_id', id?.toString() || '')}
                                            searchUrl={route('sales.orders.salespeople.search')}
                                            placeholder="Temsilci ara..."
                                            isInvalid={!!errors.salesperson_id}
                                            displayFormat={(option) => option.name}
                                            minSearchLength={0}
                                        />
                                        {errors.salesperson_id && (
                                            <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                                                {errors.salesperson_id}
                                            </Form.Control.Feedback>
                                        )}
                                    </Col>
                                    <Col md={4}>
                                        <Form.Label>Sipariş Tarihi *</Form.Label>
                                        <Form.Control
                                            type="date"
                                            value={data.order_date}
                                            onChange={(e) => setData('order_date', e.target.value)}
                                            isInvalid={!!errors.order_date}
                                        />
                                        {errors.order_date && (
                                            <Form.Control.Feedback type="invalid">
                                                {errors.order_date}
                                            </Form.Control.Feedback>
                                        )}
                                    </Col>
                                    <Col md={4}>
                                        <Form.Label>Teslimat Tarihi</Form.Label>
                                        <Form.Control
                                            type="date"
                                            value={data.delivery_date}
                                            onChange={(e) => setData('delivery_date', e.target.value)}
                                            isInvalid={!!errors.delivery_date}
                                        />
                                        {errors.delivery_date && (
                                            <Form.Control.Feedback type="invalid">
                                                {errors.delivery_date}
                                            </Form.Control.Feedback>
                                        )}
                                    </Col>
                                    <Col md={6}>
                                        <Form.Label>Referans Numarası</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={data.reference_number}
                                            onChange={(e) => setData('reference_number', e.target.value)}
                                            placeholder="Referans numarası"
                                            isInvalid={!!errors.reference_number}
                                        />
                                        {errors.reference_number && (
                                            <Form.Control.Feedback type="invalid">
                                                {errors.reference_number}
                                            </Form.Control.Feedback>
                                        )}
                                    </Col>
                                    <Col md={6}>
                                        <Form.Label>Dış Sipariş Numarası</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={data.external_order_number}
                                            onChange={(e) => setData('external_order_number', e.target.value)}
                                            placeholder="Müşteri sipariş numarası"
                                            isInvalid={!!errors.external_order_number}
                                        />
                                        {errors.external_order_number && (
                                            <Form.Control.Feedback type="invalid">
                                                {errors.external_order_number}
                                            </Form.Control.Feedback>
                                        )}
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col lg={4}>
                        <Card className="mb-4">
                            <Card.Header>
                                <h5 className="mb-0">Ödeme Bilgileri</h5>
                            </Card.Header>
                            <Card.Body>
                                <Row className="g-3">
                                    <Col xs={12}>
                                        <Form.Label>Ödeme Vade (Gün) *</Form.Label>
                                        <Form.Control
                                            type="number"
                                            min="0"
                                            max="365"
                                            value={data.payment_term_days}
                                            onChange={(e) => setData('payment_term_days', parseInt(e.target.value) || 0)}
                                            isInvalid={!!errors.payment_term_days}
                                        />
                                        {errors.payment_term_days && (
                                            <Form.Control.Feedback type="invalid">
                                                {errors.payment_term_days}
                                            </Form.Control.Feedback>
                                        )}
                                    </Col>
                                    <Col xs={12}>
                                        <Form.Label>Ödeme Yöntemi *</Form.Label>
                                        <Form.Select
                                            value={data.payment_method}
                                            onChange={(e) => setData('payment_method', e.target.value)}
                                            isInvalid={!!errors.payment_method}
                                        >
                                            {Object.entries(paymentMethods).map(([key, label]) => (
                                                <option key={key} value={key}>{label}</option>
                                            ))}
                                        </Form.Select>
                                        {errors.payment_method && (
                                            <Form.Control.Feedback type="invalid">
                                                {errors.payment_method}
                                            </Form.Control.Feedback>
                                        )}
                                    </Col>
                                    <Col md={6}>
                                        <Form.Label>Para Birimi *</Form.Label>
                                        <Form.Select
                                            value={data.currency}
                                            onChange={(e) => setData('currency', e.target.value)}
                                            isInvalid={!!errors.currency}
                                        >
                                            {currencies.map(currency => (
                                                <option key={currency.value} value={currency.value}>
                                                    {currency.label}
                                                </option>
                                            ))}
                                        </Form.Select>
                                        {errors.currency && (
                                            <Form.Control.Feedback type="invalid">
                                                {errors.currency}
                                            </Form.Control.Feedback>
                                        )}
                                    </Col>
                                    <Col md={6}>
                                        <Form.Label>Kur *</Form.Label>
                                        <Form.Control
                                            type="number"
                                            min="0.01"
                                            step="0.0001"
                                            value={data.exchange_rate}
                                            onChange={(e) => setData('exchange_rate', parseFloat(e.target.value) || 1)}
                                            isInvalid={!!errors.exchange_rate}
                                        />
                                        {errors.exchange_rate && (
                                            <Form.Control.Feedback type="invalid">
                                                {errors.exchange_rate}
                                            </Form.Control.Feedback>
                                        )}
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Row 2: Sipariş Kalemleri - full width */}
                <Row>
                    <Col xs={12}>

                        {/* Bulk Discount Panel */}
                        <BulkDiscountPanel
                            items={items}
                            onApplyDiscount={handleBulkDiscountApply}
                            onClose={() => setShowBulkDiscount(false)}
                            isOpen={showBulkDiscount}
                        />

                        {/* Order Items */}
                        <Card className="mb-4">
                            <Card.Header className="d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">Sipariş Kalemleri</h5>
                                <div className="d-flex gap-2">
                                    <Button
                                        variant="outline-success"
                                        size="sm"
                                        onClick={() => setShowBulkDiscount(true)}
                                        disabled={!hasItemsWithProducts}
                                        title={!hasItemsWithProducts ? "Önce ürün seçin" : "Toplu indirim uygula"}
                                    >
                                        <i className="ri-price-tag-3-line me-1"></i>
                                        Toplu İndirim {hasItemsWithProducts ? '✓' : '✗'}
                                    </Button>
                                    <Button
                                        variant="outline-info"
                                        size="sm"
                                        onClick={() => setShowBulkAddModal(true)}
                                    >
                                        <i className="ri-file-add-line me-1"></i>
                                        Toplu Kalem Ekle
                                    </Button>
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={addItem}
                                    >
                                        <i className="ri-add-line me-1"></i>
                                        Kalem Ekle
                                    </Button>
                                </div>
                            </Card.Header>
                            <Card.Body className="p-0">
                                <div className="table-responsive">
                                    <Table className="mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th style={{ minWidth: '250px', width: '250px' }}>Ürün</th>
                                                <th style={{ minWidth: '120px', width: '120px' }}>Açıklama</th>
                                                <th width="120">Marka/Tedarikçi</th>
                                                <th style={{ minWidth: '130px', width: '130px' }}>Birim</th>
                                                <th width="80">Miktar</th>
                                                <th width="140">Birim Fiyat</th>
                                                <th width="55">İsk1%</th>
                                                <th width="55">İsk2%</th>
                                                <th width="55">İsk3%</th>
                                                <th width="80">KDV (%)</th>
                                                <th width="140">Toplam</th>
                                                <th width="50">İşlem</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((item, index) => (
                                                <tr key={item.id}>
                                                    <td>
                                                        <div className="d-flex align-items-start gap-3">
                                                            {/* Product Image */}
                                                            <img
                                                                src={item.product?.primary_image_url || '/images/no-image.png'}
                                                                alt={item.product?.name || 'Product'}
                                                                className="rounded"
                                                                style={{
                                                                    width: '50px',
                                                                    height: '50px',
                                                                    objectFit: 'cover',
                                                                    flexShrink: 0
                                                                }}
                                                                onError={(e) => {
                                                                    e.currentTarget.src = '/images/no-image.png';
                                                                }}
                                                            />

                                                            {/* Product Selection and Info */}
                                                            <div className="flex-grow-1">
                                                                <ProductSearchableSelect
                                                                    value={item.product_id}
                                                                    onChange={(product) => handleProductSelect(index, product)}
                                                                    searchUrl={route('sales.orders.products.search')}
                                                                    placeholder="Ürün ara..."
                                                                    isInvalid={!!errors[`items.${index}.product_id`]}
                                                                    customerId={data.customer_id ? parseInt(data.customer_id) : null}
                                                                    quantity={item.quantity || 1}
                                                                />
                                                                {item.product && (
                                                                    <div className="mt-1">
                                                                        <small className="text-muted">
                                                                            Stok: {item.product.stock_quantity} {item.product.baseUnit?.symbol}
                                                                        </small>
                                                                        {item.product.code && (
                                                                            <small className="text-muted ms-2">
                                                                                Kod: {item.product.code}
                                                                            </small>
                                                                        )}
                                                                        {/* Show currency conversion info if product has different currency */}
                                                                        {item.original_currency && item.original_currency !== data.currency && item.original_price_in_currency && (
                                                                            <small className="text-info ms-2">
                                                                                <i className="ri-exchange-line me-1"></i>
                                                                                {getCurrencySymbol(item.original_currency)}{new Intl.NumberFormat('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(Number(item.original_price_in_currency))}
                                                                                {' → '}
                                                                                {orderCurrencySymbol}{new Intl.NumberFormat('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(Number(item.unit_price))}
                                                                            </small>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <Form.Control
                                                            size="sm"
                                                            type="text"
                                                            placeholder="Renk, boyut..."
                                                            value={item.notes || ''}
                                                            onChange={(e) => {
                                                                const newItems = [...items];
                                                                newItems[index] = { ...newItems[index], notes: e.target.value };
                                                                setItems(newItems);
                                                            }}
                                                            style={{ minWidth: '100px' }}
                                                        />
                                                    </td>
                                                    <td>
                                                        {item.product && (
                                                            <div>
                                                                {item.product.brand && (
                                                                    <div className="small fw-medium text-primary">
                                                                        <i className="ri-award-line me-1"></i>
                                                                        {item.product.brand.name}
                                                                    </div>
                                                                )}
                                                                {item.product.supplier && (
                                                                    <div className="small text-muted">
                                                                        <i className="ri-truck-line me-1"></i>
                                                                        {item.product.supplier.title}
                                                                    </div>
                                                                )}
                                                                {!item.product.brand && !item.product.supplier && (
                                                                    <small className="text-muted">-</small>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {item.product ? (
                                                            <Form.Select
                                                                size="sm"
                                                                value={item.unit_id || ''}
                                                                onChange={(e) => handleUnitChange(index, e.target.value ? parseInt(e.target.value) : null)}
                                                            >
                                                                {/* Product'a özel birimler */}
                                                                {item.product.active_units && item.product.active_units.length > 0 ? (
                                                                    item.product.active_units.map((pu) => (
                                                                        <option key={pu.unit_id} value={pu.unit_id}>
                                                                            {pu.unit?.name || pu.unit_name} ({pu.unit?.symbol || pu.unit_code})
                                                                            {pu.sale_price > 0 && ` - ${formatCurrency(pu.sale_price)}`}
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
                                                        <Form.Control
                                                            type="number"
                                                            min="0.01"
                                                            step="0.01"
                                                            value={item.quantity}
                                                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                            onBlur={(e) => { e.target.value = String(parseFloat(e.target.value) || 0); }}
                                                            isInvalid={!!errors[`items.${index}.quantity`]}
                                                        />
                                                    </td>
                                                    <td>
                                                        <Form.Control
                                                            type="text"
                                                            style={{ minWidth: '120px' }}
                                                            value={editingPrices[index] !== undefined ? editingPrices[index] : item.unit_price}
                                                            onFocus={() => canEditPrice && setEditingPrices(prev => ({ ...prev, [index]: String(item.unit_price) }))}
                                                            onChange={e => canEditPrice && setEditingPrices(prev => ({ ...prev, [index]: e.target.value }))}
                                                            onBlur={() => canEditPrice && handlePriceBlur(index)}
                                                            onKeyDown={e => canEditPrice && handlePriceKeyDown(e, index)}
                                                            readOnly={!canEditPrice}
                                                            className={!canEditPrice ? 'bg-light' : ''}
                                                            isInvalid={!!errors[`items.${index}.unit_price`]}
                                                        />
                                                        {item.original_unit_price && item.unit_price !== item.original_unit_price && (
                                                            <small className="text-muted d-block mt-1">
                                                                <s>{formatCurrency(item.original_unit_price)}</s>
                                                            </small>
                                                        )}
                                                        {item.has_logo_price && item.logo_price && (
                                                            <small className="text-info d-block mt-1">
                                                                <i className="ri-database-2-line me-1"></i>
                                                                Logo: {formatCurrency(item.logo_price)}
                                                            </small>
                                                        )}
                                                        {(() => {
                                                            const d1 = Number(item.discount_rate1) || 0;
                                                            const d2 = Number(item.discount_rate2) || 0;
                                                            const d3 = Number(item.discount_rate3) || 0;
                                                            if (d1 > 0 || d2 > 0 || d3 > 0) {
                                                                const net = Number(item.unit_price) * (1 - d1/100) * (1 - d2/100) * (1 - d3/100);
                                                                return (
                                                                    <small className="text-success d-block mt-1">
                                                                        <i className="ri-arrow-right-line me-1"></i>
                                                                        Net: {formatCurrency(net)}
                                                                    </small>
                                                                );
                                                            }
                                                            return null;
                                                        })()}
                                                    </td>
                                                    <td>
                                                        <Form.Control
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            step="0.01"
                                                            value={item.discount_rate1}
                                                            onChange={(e) => updateItem(index, 'discount_rate1', parseFloat(e.target.value) || 0)}
                                                            style={{ width: '55px' }}
                                                            size="sm"
                                                        />
                                                    </td>
                                                    <td>
                                                        <Form.Control
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            step="0.01"
                                                            value={item.discount_rate2}
                                                            onChange={(e) => updateItem(index, 'discount_rate2', parseFloat(e.target.value) || 0)}
                                                            style={{ width: '55px' }}
                                                            size="sm"
                                                        />
                                                    </td>
                                                    <td>
                                                        <Form.Control
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            step="0.01"
                                                            value={item.discount_rate3}
                                                            onChange={(e) => updateItem(index, 'discount_rate3', parseFloat(e.target.value) || 0)}
                                                            style={{ width: '55px' }}
                                                            size="sm"
                                                        />
                                                    </td>
                                                    <td>
                                                        <Form.Select
                                                            value={String(parseFloat(String(item.tax_rate)) || 0)}
                                                            onChange={(e) => updateItem(index, 'tax_rate', parseFloat(e.target.value) || 0)}
                                                            isInvalid={!!errors[`items.${index}.tax_rate`]}
                                                        >
                                                            {taxes.map((tax) => (
                                                                <option key={tax.id} value={String(parseFloat(String(tax.rate)) || 0)}>
                                                                    %{tax.rate % 1 === 0 ? Math.floor(tax.rate) : tax.rate} ({tax.name})
                                                                </option>
                                                            ))}
                                                        </Form.Select>
                                                    </td>
                                                    <td>
                                                        <div className="fw-medium">
                                                            {formatCurrency(item.line_total)}
                                                        </div>
                                                        {item.tax_amount > 0 && (
                                                            <small className="text-muted">
                                                                KDV: {formatCurrency(item.tax_amount)}
                                                            </small>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={() => removeItem(index)}
                                                            disabled={items.length === 1}
                                                        >
                                                            <i className="ri-delete-bin-line"></i>
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            </Card.Body>
                        </Card>


                    </Col>
                </Row>

                {/* Row 3: Notlar + Sipariş Özeti + Submit */}
                <Row>
                    <Col lg={8}>
                        <Card className="mb-4">
                            <Card.Header>
                                <h5 className="mb-0">Notlar</h5>
                            </Card.Header>
                            <Card.Body>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <Form.Label>Müşteri Notları</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={4}
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            placeholder="Müşteri ile paylaşılacak notlar"
                                        />
                                    </Col>
                                    <Col md={6}>
                                        <Form.Label>İç Notlar</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={4}
                                            value={data.internal_notes}
                                            onChange={(e) => setData('internal_notes', e.target.value)}
                                            placeholder="Dahili kullanım için notlar"
                                        />
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col lg={4}>
                        {/* Order Summary */}
                        <Card className="mb-4">
                            <Card.Header>
                                <h5 className="mb-0">Sipariş Özeti</h5>
                            </Card.Header>
                            <Card.Body>
                                <div className="d-flex justify-content-between mb-2">
                                    <span>Ara Toplam:</span>
                                    <span>{formatCurrency(subtotal)}</span>
                                </div>

                                {/* Discount Information */}
                                {totalItemDiscount > 0 && (
                                    <>
                                        <div className="discount-details mb-2">
                                            <div className="d-flex justify-content-between text-success">
                                                <span>
                                                    <i className="ri-price-tag-line me-1"></i>
                                                    Toplam İndirim:
                                                </span>
                                                <span className="fw-medium">-{formatCurrency(totalItemDiscount)}</span>
                                            </div>

                                            {bulkDiscountAmount > 0 && (
                                                <div className="d-flex justify-content-between ms-3">
                                                    <small className="text-muted">
                                                        <i className="ri-price-tag-3-line me-1"></i>
                                                        Toplu İndirim ({bulkDiscountItems.length} kalem):
                                                    </small>
                                                    <small className="text-success">-{formatCurrency(bulkDiscountAmount)}</small>
                                                </div>
                                            )}

                                            {manualDiscountAmount > 0 && (
                                                <div className="d-flex justify-content-between ms-3">
                                                    <small className="text-muted">
                                                        <i className="ri-edit-line me-1"></i>
                                                        Manuel İndirim:
                                                    </small>
                                                    <small className="text-success">-{formatCurrency(manualDiscountAmount)}</small>
                                                </div>
                                            )}
                                        </div>
                                        <hr className="my-2" />
                                    </>
                                )}

                                <div className="d-flex justify-content-between mb-2">
                                    <span>KDV:</span>
                                    <span>{formatCurrency(totalTax)}</span>
                                </div>

                                <div className="mb-3">
                                    <Form.Label>Kargo Ücreti</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={data.shipping_cost}
                                        onChange={(e) => setData('shipping_cost', parseFloat(e.target.value) || 0)}
                                    />
                                </div>

                                <div className="mb-3">
                                    <Form.Label>Sipariş İndirimi</Form.Label>
                                    <div className="d-flex">
                                        <Form.Select
                                            value={orderDiscountType}
                                            onChange={(e) => {
                                                setOrderDiscountType(e.target.value as 'percentage' | 'amount');
                                                setOrderDiscountValue(0);
                                            }}
                                            style={{ maxWidth: '80px' }}
                                        >
                                            <option value="percentage">%</option>
                                            <option value="amount">₺</option>
                                        </Form.Select>
                                        <Form.Control
                                            type="number"
                                            value={orderDiscountValue || ''}
                                            onChange={(e) => setOrderDiscountValue(Number(e.target.value) || 0)}
                                            placeholder="0"
                                            min="0"
                                            max={orderDiscountType === 'percentage' ? '100' : undefined}
                                            step={orderDiscountType === 'percentage' ? '0.1' : '0.01'}
                                            className="ms-2"
                                        />
                                    </div>
                                    {orderDiscountAmount > 0 && (
                                        <small className="text-success mt-1 d-block">
                                            <i className="ri-arrow-down-line me-1"></i>
                                            -{formatCurrency(orderDiscountAmount)} indirim uygulanacak
                                        </small>
                                    )}
                                </div>

                                <hr />
                                <div className="d-flex justify-content-between fw-bold fs-5">
                                    <span>Genel Toplam:</span>
                                    <span className="text-primary">{formatCurrency(totalAmount)}</span>
                                </div>

                                {/* Submit Buttons */}
                                <div className="d-grid gap-2 mt-3">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="lg"
                                        disabled={isSubmitting || !hasItemsWithProducts}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <i className="ri-loader-line me-1"></i>
                                                Kaydediliyor...
                                            </>
                                        ) : (
                                            <>
                                                <i className="ri-save-line me-1"></i>
                                                Siparişi Kaydet
                                            </>
                                        )}
                                    </Button>
                                    <Link href={route('sales.orders.index')}>
                                        <Button variant="outline-secondary" className="w-100">
                                            İptal
                                        </Button>
                                    </Link>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Form>
            </div>
            </div>
            {/* Bulk Add Items Modal */}
            <Modal show={showBulkAddModal} onHide={() => setShowBulkAddModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Toplu Kalem Ekleme</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="mb-3">
                        <p className="text-muted">
                            Her satıra bir stok kodu yazın. Format: <strong>STOK_KODU</strong> veya <strong>STOK_KODU MIKTAR</strong>
                        </p>
                        <div className="bg-light p-2 rounded mb-2">
                            <small className="text-muted d-block">Örnek:</small>
                            <code>
                                PRD001 5<br/>
                                PRD002 10<br/>
                                PRD003<br/>
                                PRD004 2.5
                            </code>
                        </div>
                        <small className="text-info">
                            <i className="ri-information-line me-1"></i>
                            Miktar belirtilmezse otomatik olarak 1 adet kabul edilir.
                        </small>
                    </div>
                    <Form.Group>
                        <Form.Label>Stok Kodları ve Miktarları</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={10}
                            value={bulkItemsText}
                            onChange={(e) => setBulkItemsText(e.target.value)}
                            placeholder="PRD001 5&#10;PRD002 10&#10;PRD003&#10;PRD004 2.5"
                        />
                        <Form.Text className="text-muted">
                            Her satıra stok kodu yazın. Miktar belirtilmezse 1 adet kabul edilir.
                        </Form.Text>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowBulkAddModal(false)}>
                        İptal
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleBulkAddItems}
                        disabled={bulkAddProcessing || !bulkItemsText.trim()}
                    >
                        {bulkAddProcessing ? (
                            <>
                                <i className="ri-loader-line me-1"></i>
                                İşleniyor...
                            </>
                        ) : (
                            <>
                                <i className="ri-add-line me-1"></i>
                                Kalemleri Ekle
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Add Delivery Address Modal */}
            <Modal show={showAddAddressModal} onHide={() => setShowAddAddressModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Yeni Sevk Adresi Ekle</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Label>Adres Adı *</Form.Label>
                            <Form.Control
                                type="text"
                                value={newAddressForm.name}
                                onChange={(e) => setNewAddressForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Örn: Merkez Ofis, Fabrika, Şube 1"
                                required
                            />
                        </Col>
                        <Col md={6}>
                            <Form.Label>Adres Tipi</Form.Label>
                            <Form.Select
                                value={newAddressForm.type}
                                onChange={(e) => setNewAddressForm(prev => ({ ...prev, type: e.target.value }))}
                            >
                                <option value="shipping">Sevk Adresi</option>
                                <option value="billing">Fatura Adresi</option>
                                <option value="both">Her İkisi</option>
                            </Form.Select>
                        </Col>
                        <Col md={6}>
                            <Form.Label>Ülke</Form.Label>
                            <Form.Select
                                value={newAddressForm.country_id}
                                onChange={(e) => {
                                    const countryId = e.target.value;
                                    setNewAddressForm(prev => ({ ...prev, country_id: countryId, city_id: '', district_id: '' }));
                                    if (countryId) {
                                        loadCities(countryId);
                                        setDistricts([]);
                                    }
                                }}
                                required
                            >
                                <option value="">Ülke seçiniz</option>
                                {countries.map(country => (
                                    <option key={country.id} value={country.id}>
                                        {country.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col md={6}>
                            <Form.Label>Şehir</Form.Label>
                            <Form.Select
                                value={newAddressForm.city_id}
                                onChange={(e) => {
                                    const cityId = e.target.value;
                                    setNewAddressForm(prev => ({ ...prev, city_id: cityId, district_id: '' }));
                                    if (cityId) {
                                        loadDistricts(cityId);
                                    } else {
                                        setDistricts([]);
                                    }
                                }}
                                disabled={!newAddressForm.country_id}
                                required
                            >
                                <option value="">Şehir seçiniz</option>
                                {cities.map(city => (
                                    <option key={city.id} value={city.id}>
                                        {city.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col md={6}>
                            <Form.Label>İlçe</Form.Label>
                            <Form.Select
                                value={newAddressForm.district_id}
                                onChange={(e) => setNewAddressForm(prev => ({ ...prev, district_id: e.target.value }))}
                                disabled={!newAddressForm.city_id}
                            >
                                <option value="">İlçe seçiniz</option>
                                {districts.map(district => (
                                    <option key={district.id} value={district.id}>
                                        {district.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col md={6}>
                            <Form.Label>İletişim Kişisi</Form.Label>
                            <Form.Control
                                type="text"
                                value={newAddressForm.contact_person}
                                onChange={(e) => setNewAddressForm(prev => ({ ...prev, contact_person: e.target.value }))}
                                placeholder="Ad Soyad"
                            />
                        </Col>
                        <Col md={6}>
                            <Form.Label>İletişim Telefonu</Form.Label>
                            <Form.Control
                                type="tel"
                                value={newAddressForm.contact_phone}
                                onChange={(e) => setNewAddressForm(prev => ({ ...prev, contact_phone: e.target.value }))}
                                placeholder="0542 123 45 67"
                            />
                        </Col>
                        <Col md={6}>
                            <Form.Label>İletişim Email</Form.Label>
                            <Form.Control
                                type="email"
                                value={newAddressForm.contact_email}
                                onChange={(e) => setNewAddressForm(prev => ({ ...prev, contact_email: e.target.value }))}
                                placeholder="ornek@email.com"
                            />
                        </Col>
                        <Col md={6}>
                            <Form.Label>Sorumlu Adı Soyadı</Form.Label>
                            <Form.Control
                                type="text"
                                value={newAddressForm.responsible_name}
                                onChange={(e) => setNewAddressForm(prev => ({ ...prev, responsible_name: e.target.value }))}
                                placeholder="Sorumlu kişi adı soyadı"
                            />
                        </Col>
                        <Col md={6}>
                            <Form.Label>Yetkili Adı Soyadı</Form.Label>
                            <Form.Control
                                type="text"
                                value={newAddressForm.authorized_name}
                                onChange={(e) => setNewAddressForm(prev => ({ ...prev, authorized_name: e.target.value }))}
                                placeholder="Yetkili kişi adı soyadı"
                            />
                        </Col>
                        <Col xs={12}>
                            <Form.Label>Adres *</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={newAddressForm.address}
                                onChange={(e) => setNewAddressForm(prev => ({ ...prev, address: e.target.value }))}
                                placeholder="Sokak, mahalle, bina no, daire no..."
                                required
                            />
                        </Col>
                        <Col md={6}>
                            <Form.Label>Posta Kodu</Form.Label>
                            <Form.Control
                                type="text"
                                value={newAddressForm.postal_code}
                                onChange={(e) => setNewAddressForm(prev => ({ ...prev, postal_code: e.target.value }))}
                                placeholder="34000"
                            />
                        </Col>
                        <Col md={6}>
                            <Form.Label>Teslimat Saatleri</Form.Label>
                            <Form.Control
                                type="text"
                                value={newAddressForm.delivery_hours}
                                onChange={(e) => setNewAddressForm(prev => ({ ...prev, delivery_hours: e.target.value }))}
                                placeholder="09:00-17:00"
                            />
                        </Col>
                        <Col xs={12}>
                            <Form.Label>Teslimat Notları</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                value={newAddressForm.delivery_notes}
                                onChange={(e) => setNewAddressForm(prev => ({ ...prev, delivery_notes: e.target.value }))}
                                placeholder="Özel teslimat talimatları..."
                            />
                        </Col>
                        <Col xs={12}>
                            <Form.Check
                                type="checkbox"
                                label="Bu adresi varsayılan yap"
                                checked={newAddressForm.is_default}
                                onChange={(e) => setNewAddressForm(prev => ({ ...prev, is_default: e.target.checked }))}
                            />
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAddAddressModal(false)}>
                        İptal
                    </Button>
                    <Button variant="primary" onClick={handleAddNewAddress}>
                        Adres Ekle
                    </Button>
                </Modal.Footer>
            </Modal>
        </Layout>
    );
}
