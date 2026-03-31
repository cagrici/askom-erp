import React, { useState, useEffect } from 'react';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { Card, Form, Button, Row, Col, Table, InputGroup, Badge, Alert } from 'react-bootstrap';
import Layout from '@/Layouts';
import SearchableSelect from '@/Components/SearchableSelect';
import ProductSearchableSelect from '@/Components/ProductSearchableSelect';
import BulkDiscountPanel from '@/Components/BulkDiscountPanel';
import BulkDiscountHistoryPanel from '@/Components/BulkDiscountHistoryPanel';

interface Customer {
    id: number;
    title: string;
    account_code: string;
    payment_term_days?: number;
    currency?: string;
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
    primaryImage?: {
        id: number;
        image_path: string;
        thumbnail_path: string;
        image_url: string;
        thumbnail_url: string;
        alt_text?: string;
        is_primary: boolean;
    };
    // Logo fiyat bilgileri
    logo_sale_price?: number;
    logo_currency?: string;
    active_units?: ProductUnit[];
}

interface ExistingOrderItem {
    id: number;
    product_id: number;
    product: Product;
    unit_id?: number | null;
    unit?: Unit;
    quantity: number;
    unit_price: number;
    discount_rate1: number;
    discount_rate2: number;
    discount_rate3: number;
    discount_percentage: number;
    discount_amount: number;
    tax_rate: number;
    tax_amount: number;
    line_total: number;
    requested_delivery_date: string;
    notes: string;
    special_instructions: string;
}

interface OrderItem {
    id?: number | string;
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
}

interface ExchangeRates {
    [key: string]: {
        code: string;
        name: string;
        rate: number;
        date: string;
    };
}

interface SalesOrder {
    id: number;
    order_number: string;
    customer_id: number;
    customer: Customer;
    salesperson_id?: number;
    salesperson?: Salesperson;
    order_date: string;
    delivery_date?: string;
    requested_delivery_date?: string;
    priority: string;
    payment_term_days: number;
    payment_method: string;
    currency: string;
    exchange_rate: number;
    shipping_cost: number;
    discount_amount: number;
    billing_address: any;
    shipping_address: any;
    notes: string;
    internal_notes: string;
    terms_and_conditions: string;
    reference_number: string;
    external_order_number: string;
    items: ExistingOrderItem[];
}

interface Props {
    salesOrder: SalesOrder;
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
    logoDispatch?: {
        has_dispatch: boolean;
        dispatch_no: string | null;
        dispatch_date: string | null;
    } | null;
}

export default function Edit({
    salesOrder,
    customers,
    salespeople,
    statuses,
    priorities,
    paymentMethods,
    currencies,
    taxes,
    units,
    logoDispatch
}: Props) {
    const auth = usePage().props.auth as any;
    const userRoles = auth?.user?.roles?.map((r: any) => r.name) || [];
    const canEditPrice = userRoles.some((r: string) => ['admin', 'Super Admin', 'sales_manager', 'sales-manager'].includes(r));

    // Get default tax rate
    const defaultTaxRate = taxes.find(tax => tax.is_default)?.rate || taxes[0]?.rate || 18;


    // Bulk discount state
    const [showBulkDiscount, setShowBulkDiscount] = useState(false);
    const [showBulkDiscountHistory, setShowBulkDiscountHistory] = useState(false);
    const [bulkDiscountHistoryData, setBulkDiscountHistoryData] = useState<any>(null);

    const [editingPrices, setEditingPrices] = useState<{[key: number]: string}>({});
    const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());

    // Order discount state - mevcut discount_amount varsa 'amount' olarak geri yükle
    const [orderDiscountType, setOrderDiscountType] = useState<'percentage' | 'amount'>(
        salesOrder.discount_amount && Number(salesOrder.discount_amount) > 0 ? 'amount' : 'percentage'
    );
    const [orderDiscountValue, setOrderDiscountValue] = useState<number>(
        salesOrder.discount_amount ? Number(salesOrder.discount_amount) : 0
    );

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

    const orderCurrencySymbol = getCurrencySymbol(salesOrder.currency);

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
        if (fromCurrency === 'TRY') {
            return amount / toRate;
        } else if (toCurrency === 'TRY') {
            return amount * fromRate;
        } else {
            const tryAmount = amount * fromRate;
            return tryAmount / toRate;
        }
    };

    // Calculate item totals (moved up for use in initialization)
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

    // Convert existing items to editable format (moved inside component to access taxes)
    const convertExistingItems = (existingItems: ExistingOrderItem[]): OrderItem[] => {

        return existingItems.map(item => {
            const converted = {
                id: item.id,
                product_id: item.product_id,
                product: item.product,
                unit_id: item.unit_id || null,
                quantity: parseFloat(item.quantity) || 0,
                unit_price: parseFloat(item.unit_price) || 0,
                original_unit_price: parseFloat(item.unit_price) || 0,
                discount_rate1: parseFloat(item.discount_rate1) || 0,
                discount_rate2: parseFloat(item.discount_rate2) || 0,
                discount_rate3: parseFloat(item.discount_rate3) || 0,
                discount_amount: parseFloat(item.discount_amount) || 0,
                tax_rate: parseFloat(item.tax_rate) || 0,
                tax_amount: parseFloat(item.tax_amount) || 0,
                line_total: parseFloat(item.line_total) || 0,
                requested_delivery_date: item.requested_delivery_date || '',
                notes: item.notes || '',
                special_instructions: item.special_instructions || ''
            };

            // Fix tax rate if it's 0 but there's tax amount (data inconsistency fix)
            if (converted.tax_rate === 0 && converted.tax_amount > 0) {
                const quantity = converted.quantity || 0;
                const unitPrice = converted.unit_price || 0;
                const discountAmount = converted.discount_amount || 0;
                const lineSubtotal = (quantity * unitPrice) - discountAmount;

                if (lineSubtotal > 0) {
                    // Calculate tax rate from tax amount: tax_rate = (tax_amount / line_subtotal) * 100
                    const calculatedTaxRate = (converted.tax_amount / lineSubtotal) * 100;

                    // Find the closest matching tax rate from available taxes
                    const availableTaxRates = taxes.map(t => t.rate);
                    const closestTaxRate = availableTaxRates.reduce((prev, curr) => {
                        return Math.abs(curr - calculatedTaxRate) < Math.abs(prev - calculatedTaxRate) ? curr : prev;
                    });

                    // Only use the closest rate if it's within 1% tolerance
                    if (Math.abs(closestTaxRate - calculatedTaxRate) <= 1) {
                        converted.tax_rate = parseFloat(closestTaxRate);
                    } else {
                        converted.tax_rate = Math.round(calculatedTaxRate * 100) / 100;
                    }

                }
            }

            return converted;
        });
    };

    const [items, setItems] = useState<OrderItem[]>(() => {
        const convertedItems = convertExistingItems(salesOrder.items);
        // Recalculate totals for existing items to ensure they're correct
        convertedItems.forEach(item => {
            if (item.product_id) {
                calculateItemTotals(item, true);
            }
        });
        return convertedItems;
    });

    // Format dates for HTML date inputs (YYYY-MM-DD)
    const formatDateForInput = (dateString?: string) => {
        if (!dateString) return '';
        // If it's already in YYYY-MM-DD format, return as is
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString;
        }
        // Convert to YYYY-MM-DD format
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    const { data, setData, put, processing, errors } = useForm({
        customer_id: salesOrder.customer_id.toString(),
        salesperson_id: salesOrder.salesperson_id?.toString() || '',
        order_date: formatDateForInput(salesOrder.order_date),
        delivery_date: formatDateForInput(salesOrder.delivery_date),
        requested_delivery_date: formatDateForInput(salesOrder.requested_delivery_date),
        priority: salesOrder.priority,
        payment_term_days: salesOrder.payment_term_days,
        payment_method: salesOrder.payment_method,
        currency: salesOrder.currency,
        exchange_rate: salesOrder.exchange_rate,
        shipping_cost: salesOrder.shipping_cost,
        discount_amount: salesOrder.discount_amount,
        billing_address: salesOrder.billing_address || {},
        shipping_address: salesOrder.shipping_address || {},
        notes: salesOrder.notes || '',
        internal_notes: salesOrder.internal_notes || '',
        terms_and_conditions: salesOrder.terms_and_conditions || '',
        reference_number: salesOrder.reference_number || '',
        external_order_number: salesOrder.external_order_number || '',
        items: []
    });

    // Calculate totals from raw values (subtotal = KDV hariç net toplam)
    // Ham değerlerden hesapla - line_total/tax_amount tutarsızlığından kaçınmak için
    const subtotal = items.reduce((sum, item) => {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.unit_price) || 0;
        const d1 = Number(item.discount_rate1) || 0;
        const d2 = Number(item.discount_rate2) || 0;
        const d3 = Number(item.discount_rate3) || 0;
        const itemSubtotal = qty * price;
        const afterD1 = itemSubtotal * (1 - d1 / 100);
        const afterD2 = afterD1 * (1 - d2 / 100);
        const afterD3 = afterD2 * (1 - d3 / 100);
        return sum + afterD3;
    }, 0);

    // Calculate order discount - net tutar (KDV hariç) üzerinden
    const calculateOrderDiscount = () => {
        if (orderDiscountType === 'percentage') {
            const baseAmount = subtotal || 0; // KDV hariç net toplam
            const discountPercent = (parseFloat(orderDiscountValue) || 0) / 100;
            const result = baseAmount * discountPercent;
            return isNaN(result) ? 0 : result;
        }
        const result = parseFloat(orderDiscountValue) || 0;
        return isNaN(result) ? 0 : result;
    };

    const orderDiscountAmount = calculateOrderDiscount();
    const discountedNet = subtotal - orderDiscountAmount;

    // KDV: iskontolu net tutar üzerinden her item'ın ağırlıklı KDV oranıyla hesapla
    const totalTax = (() => {
        if (subtotal <= 0) return 0;
        // Her item'ın KDV'sini oransal olarak hesapla
        return items.reduce((sum, item) => {
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
            // Sipariş iskontosu oranını her item'a uygula
            const itemDiscountedNet = afterD3 * (discountedNet / subtotal);
            return sum + (itemDiscountedNet * taxRate / 100);
        }, 0);
    })();

    const totalAmount = (() => {
        const shipping = parseFloat(data.shipping_cost) || 0;
        const result = discountedNet + totalTax + shipping;
        return isNaN(result) ? 0 : result;
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

    // Update customer data when customer changes
    const handleCustomerChange = (customerId: number | null) => {
        setData('customer_id', customerId?.toString() || '');

        if (customerId) {
            const customer = customers.find(c => c.id === customerId);
            if (customer) {
                if (customer.payment_term_days) {
                    setData('payment_term_days', customer.payment_term_days);
                }
                if (customer.currency) {
                    setData('currency', customer.currency);
                }
            }
        }
    };

    // Add new item
    const addItem = () => {
        setItems([...items, {
            id: `new-${Math.random().toString()}`,
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

    const toggleNote = (index: number) => {
        setExpandedNotes(prev => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
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
        }

        // If discount amount is manually changed and item had bulk discount
        if (field === 'discount_amount' && item.bulk_discount_applied) {
            newItems[index] = {
                ...newItems[index],
                bulk_discount_applied: false,
                discount_source: 'manual',
                original_unit_price: undefined
            };
        }

        // Recalculate totals for this item
        // Force discount amount recalculation if discount percentage was changed
        const shouldRecalculateDiscount = field === 'discount_rate1' || field === 'discount_rate2' || field === 'discount_rate3' || field === 'quantity' || field === 'unit_price';
        calculateItemTotals(newItems[index], shouldRecalculateDiscount);


        setItems(newItems);
    };

    // Handle product selection
    const handleProductSelect = (index: number, product: Product | null) => {
        if (product) {
            // Get base unit from product units or fall back to baseUnit
            const baseUnit = product.active_units?.find(u => u.is_base_unit);
            const defaultUnitId = baseUnit?.unit_id || product.baseUnit?.id || null;
            const originalPrice = baseUnit?.sale_price || product.sale_price;

            // Determine product currency (from currency field, logo_currency, or default TRY)
            const productCurrency = product.currency || product.logo_currency || 'TRY';

            // Convert price to order currency
            const convertedPrice = convertPrice(originalPrice, productCurrency, salesOrder.currency);
            const finalPrice = Math.round(convertedPrice * 100) / 100; // Round to 2 decimals

            // Direct state update
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
                tax_rate: product.tax_rate || product.tax?.rate || defaultTaxRate
            };

            // Recalculate totals for this item
            calculateItemTotals(newItems[index]);

            // Auto-add new item if this is the last item in the list
            if (index === items.length - 1) {
                newItems.push({
                    id: `new-${Math.random().toString()}`,
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
        } else {
            // Clear product
            const newItems = [...items];
            newItems[index] = {
                ...newItems[index],
                product_id: null,
                product: undefined,
                unit_id: null,
                unit_price: 0,
                tax_rate: defaultTaxRate
            };

            calculateItemTotals(newItems[index]);
            setItems(newItems);
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
                    const convertedPrice = convertPrice(unitPrice, productCurrency, salesOrder.currency);
                    newItems[index].unit_price = Math.round(convertedPrice * 100) / 100;
                    newItems[index].original_price_in_currency = unitPrice;
                }
            }
        } else if (!unitId) {
            // Reset to base price when no unit selected
            const basePrice = item.product.sale_price || item.product.logo_sale_price || 0;
            const convertedPrice = convertPrice(basePrice, productCurrency, salesOrder.currency);
            newItems[index].unit_price = Math.round(convertedPrice * 100) / 100;
            newItems[index].original_price_in_currency = basePrice;
        }

        // Recalculate totals
        calculateItemTotals(newItems[index]);
        setItems(newItems);
    };

    // Handle bulk discount application
    const handleBulkDiscountApply = (updatedItems: OrderItem[]) => {
        setItems(updatedItems);

        // Record the bulk discount history
        const discountedItems = updatedItems.filter(item => item.bulk_discount_applied);
        if (discountedItems.length > 0) {
            // Get discount info from the first discounted item
            const firstItem = discountedItems[0];
            const discountType = firstItem.discount_source?.replace('bulk_', '') || 'category';

            // Calculate total discount amount
            const totalDiscountAmount = discountedItems.reduce((total, item) => {
                return total + (item.discount_amount * item.quantity);
            }, 0);

            // Determine target based on discount type
            let discountTarget = '';
            let discountTargetName = '';

            if (discountType === 'category' && firstItem.product?.category) {
                discountTarget = firstItem.product.category.id.toString();
                discountTargetName = firstItem.product.category.name;
            } else if (discountType === 'brand' && firstItem.product?.brand) {
                discountTarget = firstItem.product.brand.id.toString();
                discountTargetName = firstItem.product.brand.name;
            } else if (discountType === 'supplier' && firstItem.product?.supplier) {
                discountTarget = firstItem.product.supplier.id.toString();
                discountTargetName = firstItem.product.supplier.title;
            }

            // Record the bulk discount
            recordBulkDiscountHistory({
                discount_type: discountType,
                discount_target: discountTarget,
                discount_target_name: discountTargetName,
                discount_percentage: firstItem.discount_rate1,
                affected_items: discountedItems,
                total_discount_amount: totalDiscountAmount
            });
        }
    };

    // Record bulk discount history
    const recordBulkDiscountHistory = async (discountData: any) => {
        try {
            await axios.post(`/sales/orders/${salesOrder.id}/bulk-discount-history`, discountData);
        } catch (error) {
            // console.error('Failed to record bulk discount history:', error);
        }
    };

    // Load bulk discount history
    const loadBulkDiscountHistory = async () => {
        try {
            const response = await axios.get(`/sales/orders/${salesOrder.id}/bulk-discount-history`);

            setBulkDiscountHistoryData({
                historyData: response.data.history || [],
                summaryData: response.data.summary || {
                    total_applications: 0,
                    total_savings: 0,
                    total_items_affected: 0,
                    type_breakdown: [],
                    last_applied: null
                }
            });
            setShowBulkDiscountHistory(true);
        } catch (error) {
            // console.error('Failed to load bulk discount history:', error);
            // Show empty state even if there's an error
            setBulkDiscountHistoryData({
                historyData: [],
                summaryData: {
                    total_applications: 0,
                    total_savings: 0,
                    total_items_affected: 0,
                    type_breakdown: [],
                    last_applied: null
                }
            });
            setShowBulkDiscountHistory(true);
        }
    };

    // Check items with products
    const itemsWithProducts = items.filter(item => item.product_id);
    const hasItemsWithProducts = items.some(item => item.product_id);

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

    // Get customer display text
    const getCustomerDisplayText = (customer: Customer): string => {
        return `${customer.title} (${customer.account_code})`;
    };

    // Submit form
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Prepare items data
        const itemsData = items.map(item => ({
            id: typeof item.id === 'number' ? item.id : undefined, // Only include numeric IDs (existing items)
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

        // Calculate the final discount amount based on type and value
        let finalDiscountAmount = 0;

        if (orderDiscountType === 'percentage') {
            // For percentage discount, calculate the actual amount from net subtotal
            const baseAmount = subtotal || 0;
            const discountPercent = (parseFloat(orderDiscountValue) || 0) / 100;
            finalDiscountAmount = baseAmount * discountPercent;
        } else {
            // For amount discount, use the value directly
            finalDiscountAmount = parseFloat(orderDiscountValue) || 0;
        }

        // Create submitData without spreading data object to avoid conflicts
        const submitData = {
            customer_id: data.customer_id,
            salesperson_id: data.salesperson_id,
            order_date: data.order_date,
            delivery_date: data.delivery_date,
            requested_delivery_date: data.requested_delivery_date,
            priority: data.priority,
            payment_term_days: data.payment_term_days,
            payment_method: data.payment_method,
            currency: data.currency,
            exchange_rate: data.exchange_rate,
            shipping_cost: data.shipping_cost,
            billing_address: data.billing_address,
            shipping_address: data.shipping_address,
            notes: data.notes,
            internal_notes: data.internal_notes,
            terms_and_conditions: data.terms_and_conditions,
            reference_number: data.reference_number,
            external_order_number: data.external_order_number,
            discount_amount: finalDiscountAmount,
            items: itemsData
        };


        // Use Inertia router directly instead of useForm put method
        router.put(route('sales.orders.update', salesOrder.id), submitData);
    };

    // Update form data when items change
    useEffect(() => {
        setData('items', items);
    }, [items]);

    return (
        <Layout>
            <Head title={`Satış Siparişi Düzenle - ${salesOrder.order_number}`} />
            <div className="page-content">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h3 mb-0">
                    <i className="ri-edit-line me-2"></i>
                    Satış Siparişi Düzenle
                    <Badge bg="secondary" className="ms-2">{salesOrder.order_number}</Badge>
                </h1>

                <Link href={route('sales.orders.index')}>
                    <Button variant="outline-secondary">
                        <i className="ri-arrow-left-line me-1"></i>
                        Geri
                    </Button>
                </Link>
            </div>

            <Form onSubmit={handleSubmit}>
                {logoDispatch?.has_dispatch && (
                    <Alert variant="warning" className="mb-3 d-flex align-items-center">
                        <i className="ri-error-warning-line fs-4 me-2"></i>
                        <div>
                            <strong>Bu sipariş için Logo'da irsaliye kesilmiş.</strong>
                            <div className="small">
                                İrsaliye No: {logoDispatch.dispatch_no} - Tarih: {logoDispatch.dispatch_date}.
                                Değişiklikleriniz kaydedilemez.
                            </div>
                        </div>
                    </Alert>
                )}
                <Row>
                    <Col lg={8}>
                        {/* Order Information */}
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
                                            initialDisplayText={getCustomerDisplayText(salesOrder.customer)}
                                        />
                                        {errors.customer_id && (
                                            <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                                                {errors.customer_id}
                                            </Form.Control.Feedback>
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
                                            initialDisplayText={salesOrder.salesperson?.name || ''}
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
                                        onClick={loadBulkDiscountHistory}
                                        title="İndirim geçmişini görüntüle"
                                    >
                                        <i className="ri-history-line me-1"></i>
                                        İndirim Geçmişi
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
                                                                    initialProduct={item.product}
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
                                                                        {item.original_currency && item.original_currency !== salesOrder.currency && item.original_price_in_currency && (
                                                                            <small className="text-info ms-2">
                                                                                <i className="ri-exchange-line me-1"></i>
                                                                                {getCurrencySymbol(item.original_currency)}{Number(item.original_price_in_currency).toFixed(2)}
                                                                                {' → '}
                                                                                {orderCurrencySymbol}{Number(item.unit_price).toFixed(2)}
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
                                                            onChange={e => setItems(items.map((it, i) => i === index ? { ...it, notes: e.target.value } : it))}
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
                                                            value={parseFloat(item.tax_rate).toString()}
                                                            onChange={(e) => updateItem(index, 'tax_rate', parseFloat(e.target.value) || 0)}
                                                            isInvalid={!!errors[`items.${index}.tax_rate`]}
                                                        >
                                                            {/* Add custom rate option if not in standard taxes list */}
                                                            {item.tax_rate !== 0 && !taxes.some(tax => Math.abs(parseFloat(tax.rate) - parseFloat(item.tax_rate)) < 0.01) && (
                                                                <option value={parseFloat(item.tax_rate).toString()}>
                                                                    %{item.tax_rate % 1 === 0 ? Math.floor(item.tax_rate) : parseFloat(item.tax_rate).toFixed(2)} (Hesaplanan)
                                                                </option>
                                                            )}
                                                            {/* Add 0% option if not in taxes list but item has 0 rate */}
                                                            {item.tax_rate === 0 && !taxes.some(tax => tax.rate === 0) && (
                                                                <option value="0">%0 (KDV'siz)</option>
                                                            )}
                                                            {taxes.map((tax) => (
                                                                <option key={tax.id} value={parseFloat(tax.rate).toString()}>
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


                        {/* Notes */}
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
                        {/* Payment Information */}
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

                                <div className="mb-3">
                                    <Form.Label>Sipariş İndirimi</Form.Label>
                                    <div className="d-flex">
                                        <Form.Select
                                            value={orderDiscountType}
                                            onChange={(e) => {
                                                const newType = e.target.value as 'percentage' | 'amount';
                                                setOrderDiscountType(newType);
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

                                {orderDiscountAmount > 0 && (
                                    <div className="d-flex justify-content-between mb-2">
                                        <span>İskontolu Net Tutar:</span>
                                        <span className="fw-medium">{formatCurrency(discountedNet)}</span>
                                    </div>
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

                                <hr />
                                <div className="d-flex justify-content-between fw-bold fs-5">
                                    <span>Genel Toplam:</span>
                                    <span className="text-primary">{formatCurrency(totalAmount)}</span>
                                </div>
                            </Card.Body>
                        </Card>

                        {/* Submit Buttons */}
                        <div className="d-grid gap-2">
                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                disabled={processing || !hasItemsWithProducts || logoDispatch?.has_dispatch}
                            >
                                {processing ? (
                                    <>
                                        <i className="ri-loader-line me-1"></i>
                                        Güncelleniyor...
                                    </>
                                ) : (
                                    <>
                                        <i className="ri-save-line me-1"></i>
                                        Siparişi Güncelle
                                    </>
                                )}
                            </Button>

                            <Link href={route('sales.orders.show', salesOrder.id)}>
                                <Button variant="outline-primary" className="w-100">
                                    <i className="ri-eye-line me-1"></i>
                                    Görüntüle
                                </Button>
                            </Link>

                            <Link href={route('sales.orders.index')}>
                                <Button variant="outline-secondary" className="w-100">
                                    İptal
                                </Button>
                            </Link>
                        </div>
                    </Col>
                </Row>
            </Form>

            {/* Bulk Discount History Panel */}
            <BulkDiscountHistoryPanel
                show={showBulkDiscountHistory}
                onHide={() => setShowBulkDiscountHistory(false)}
                historyData={bulkDiscountHistoryData?.historyData || []}
                summaryData={bulkDiscountHistoryData?.summaryData || {
                    total_applications: 0,
                    total_savings: 0,
                    total_items_affected: 0,
                    type_breakdown: [],
                    last_applied: null
                }}
            />
            </div>
        </Layout>
    );
}
