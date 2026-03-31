import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Form, InputGroup, Button, ListGroup, Spinner } from 'react-bootstrap';
import axios from 'axios';
import ProductCatalogModal from './ProductCatalogModal';

interface Product {
    id: number;
    code: string;
    name: string;
    sale_price: number;
    sale_price_try?: number;
    currency?: string;
    logo_currency?: string;
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
    baseUnit?: {
        id: number;
        name: string;
        symbol: string;
    };
    tax?: {
        id: number;
        name: string;
        rate: number;
        type: string;
        code: string;
        is_default: boolean;
    };
}

interface ProductSearchableSelectProps {
    value: number | null;
    onChange: (product: Product | null) => void;
    searchUrl: string;
    placeholder?: string;
    isInvalid?: boolean;
    name?: string;
    disabled?: boolean;
    clearable?: boolean;
    className?: string;
    initialProduct?: Product | null;
    customerId?: number | null;
    quantity?: number;
    mode?: 'select' | 'add';
    showFrequent?: boolean;
}

export default function ProductSearchableSelect({
    value,
    onChange,
    searchUrl,
    placeholder = "Ürün ara...",
    isInvalid = false,
    name,
    disabled = false,
    clearable = true,
    className = "",
    initialProduct = null,
    customerId = null,
    quantity = 1,
    mode = 'select',
    showFrequent = true,
}: ProductSearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [frequentProducts, setFrequentProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(initialProduct);
    const [showCatalog, setShowCatalog] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ left: 0, top: 0, width: 400, flipped: false, maxHeight: 400 });
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    // Keyboard navigation state
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const itemRefs = useRef<(HTMLElement | null)[]>([]);

    // Format display text for a product
    const formatDisplayText = (product: Product): string => {
        return `${product.name} (${product.code})`;
    };

    // Initialize search term with selected product if any
    useEffect(() => {
        if (initialProduct && !searchTerm) {
            setSearchTerm(formatDisplayText(initialProduct));
            setSelectedProduct(initialProduct);
        }
    }, [initialProduct]);

    // Update selected product when value changes externally
    useEffect(() => {
        if (value && selectedProduct?.id !== value) {
            if (initialProduct && initialProduct.id === value) {
                setSelectedProduct(initialProduct);
                setSearchTerm(formatDisplayText(initialProduct));
            }
        } else if (!value && selectedProduct) {
            setSelectedProduct(null);
            setSearchTerm('');
        }
    }, [value, selectedProduct, initialProduct]);

    // Load frequent products when component mounts or customer changes
    useEffect(() => {
        if (showFrequent) {
            loadFrequentProducts();
        }
    }, [customerId, showFrequent]);

    // Unique ID for this dropdown instance
    const dropdownId = useRef(`product-dropdown-${Math.random().toString(36).substr(2, 9)}`).current;

    // Load frequent products
    const loadFrequentProducts = async () => {
        try {
            const params: any = { limit: 8 };
            if (customerId) {
                params.customer_id = customerId;
            }

            const response = await axios.get('/sales/orders/products/frequent', {
                params: params,
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                }
            });
            setFrequentProducts(response.data || []);
        } catch (error) {
            console.error('Frequent products load error:', error);
            setFrequentProducts([]);
        }
    };

    // Search for products (supports pagination)
    const searchProducts = async (query: string, page: number = 1) => {
        if (query.length < 2) {
            setProducts([]);
            setHasMore(false);
            return;
        }

        if (page === 1) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const params: any = { q: query, page, per_page: 20 };
            if (customerId) {
                params.customer_id = customerId;
            }
            if (quantity > 1) {
                params.quantity = quantity;
            }

            const response = await axios.get(searchUrl, {
                params: params,
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                }
            });

            const responseData = response.data;
            const newProducts: Product[] = responseData.data || responseData || [];
            const nextPageUrl = responseData.next_page_url ?? null;

            if (page === 1) {
                setProducts(newProducts);
            } else {
                setProducts(prev => [...prev, ...newProducts]);
            }
            setCurrentPage(page);
            setHasMore(!!nextPageUrl);
        } catch (error) {
            console.error('Product search error:', error);
            if (page === 1) {
                setProducts([]);
            }
            setHasMore(false);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    // Debounced search - resets to page 1
    useEffect(() => {
        if (!isOpen) return;

        setCurrentPage(1);
        setHasMore(false);
        setHighlightedIndex(-1);

        const timeoutId = setTimeout(() => {
            searchProducts(searchTerm, 1);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, isOpen, searchUrl]);

    // Load more on scroll
    const handleDropdownScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 80 && hasMore && !loadingMore) {
            searchProducts(searchTerm, currentPage + 1);
        }
    }, [hasMore, loadingMore, searchTerm, currentPage]);

    // Handle product selection
    const handleProductSelect = (product: Product) => {
        if (mode === 'add') {
            onChange(product);
            setSearchTerm('');
            setProducts([]);
            setHighlightedIndex(-1);
            inputRef.current?.focus();
        } else {
            setSelectedProduct(product);
            setSearchTerm(formatDisplayText(product));
            onChange(product);
            setIsOpen(false);
        }
    };

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setSearchTerm(newValue);

        if (!isOpen) {
            updateDropdownPosition();
            setIsOpen(true);
        }

        if (newValue === '' && clearable) {
            setSelectedProduct(null);
            onChange(null);
        }
    };

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                updateDropdownPosition();
                setIsOpen(true);
                e.preventDefault();
            }
            return;
        }

        const list = products.length > 0 ? products : (showFrequent ? frequentProducts : []);

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev => {
                    const next = Math.min(prev + 1, list.length - 1);
                    itemRefs.current[next]?.scrollIntoView({ block: 'nearest' });
                    return next;
                });
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => {
                    const next = Math.max(prev - 1, 0);
                    itemRefs.current[next]?.scrollIntoView({ block: 'nearest' });
                    return next;
                });
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && list[highlightedIndex]) {
                    handleProductSelect(list[highlightedIndex]);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setHighlightedIndex(-1);
                break;
        }
    };

    // Update dropdown position to stick to input field
    const updateDropdownPosition = () => {
        if (dropdownRef.current) {
            const rect = dropdownRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;
            const dropdownHeight = 400;

            let left = rect.left;
            let top = rect.bottom + 2;
            let width = Math.max(400, rect.width);
            let flipped = false;
            let maxHeight = dropdownHeight;

            if (left + width > viewportWidth) {
                left = viewportWidth - width - 10;
            }
            if (left < 10) {
                left = 10;
            }

            const spaceBelow = viewportHeight - rect.bottom - 10;
            const spaceAbove = rect.top - 10;

            if (spaceBelow < Math.min(dropdownHeight, 200) && spaceAbove > spaceBelow && spaceAbove > 150) {
                flipped = true;
                maxHeight = Math.min(dropdownHeight, spaceAbove);
                top = rect.top - maxHeight - 2;
            } else {
                maxHeight = Math.min(dropdownHeight, Math.max(150, spaceBelow));
                top = rect.bottom + 2;
            }

            setDropdownPosition({ left, top, width, flipped, maxHeight });
        }
    };

    // Handle input focus
    const handleInputFocus = () => {
        updateDropdownPosition();
        setIsOpen(true);
        if (searchTerm.length >= 2) {
            searchProducts(searchTerm, 1);
        }
    };

    // Handle clear selection
    const handleClear = () => {
        setSelectedProduct(null);
        setSearchTerm('');
        onChange(null);
        setIsOpen(false);
        inputRef.current?.focus();
    };

    // Close dropdown when clicking outside and handle position updates
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;

            if (dropdownRef.current && dropdownRef.current.contains(target)) {
                return;
            }

            const dropdownMenu = document.getElementById(dropdownId);
            if (dropdownMenu && dropdownMenu.contains(target)) {
                return;
            }

            setIsOpen(false);
            setHighlightedIndex(-1);
        };

        let positionUpdateTimeout: NodeJS.Timeout;
        const handleScrollOrResize = () => {
            if (isOpen) {
                clearTimeout(positionUpdateTimeout);
                positionUpdateTimeout = setTimeout(() => {
                    updateDropdownPosition();
                }, 10);
            }
        };

        const handleResize = () => {
            if (isOpen) {
                updateDropdownPosition();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);

            window.addEventListener('scroll', handleScrollOrResize, { passive: true, capture: true });
            window.addEventListener('resize', handleResize);
            document.addEventListener('scroll', handleScrollOrResize, { passive: true, capture: true });

            let element = dropdownRef.current?.parentElement;
            const scrollableElements: Element[] = [];

            while (element) {
                const style = window.getComputedStyle(element);
                if (style.overflowY === 'auto' || style.overflowY === 'scroll' ||
                    style.overflow === 'auto' || style.overflow === 'scroll') {
                    scrollableElements.push(element);
                    element.addEventListener('scroll', handleScrollOrResize, { passive: true });
                }
                element = element.parentElement;
            }

            (handleScrollOrResize as any).scrollableElements = scrollableElements;
            (handleScrollOrResize as any).timeout = positionUpdateTimeout;
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScrollOrResize, true);
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('scroll', handleScrollOrResize, true);

            const timeout = (handleScrollOrResize as any).timeout;
            if (timeout) {
                clearTimeout(timeout);
            }

            const scrollableElements = (handleScrollOrResize as any).scrollableElements || [];
            scrollableElements.forEach((element: Element) => {
                element.removeEventListener('scroll', handleScrollOrResize);
            });
        };
    }, [isOpen]);

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

    // Get product currency
    const getProductCurrency = (product: Product): string => {
        return product.currency || product.logo_currency || 'TRY';
    };

    // Get stock status badge
    const getStockStatus = (stock: number) => {
        if (stock <= 0) return { text: 'Stokta Yok', class: 'text-danger' };
        if (stock <= 10) return { text: 'Az Stok', class: 'text-warning' };
        return { text: 'Stokta', class: 'text-success' };
    };

    // Render a product item row
    const renderProductItem = (product: Product, index: number, isFrequent: boolean = false) => {
        const stockStatus = getStockStatus(product.stock_quantity);
        const isHighlighted = index === highlightedIndex;

        return (
            <ListGroup.Item
                key={product.id}
                ref={el => { itemRefs.current[index] = el; }}
                action
                active={isHighlighted}
                onClick={() => handleProductSelect(product)}
                className={isFrequent ? 'py-2' : 'py-3'}
                style={{ cursor: 'pointer' }}
            >
                {isFrequent ? (
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="flex-grow-1">
                            <div className="fw-medium small">{product.name}</div>
                            <div className="d-flex gap-2 mt-1">
                                <small className="text-muted">
                                    {product.code}
                                </small>
                                {(product as any).usage_frequency && (
                                    <small className="text-warning">
                                        <i className="ri-shopping-cart-line me-1"></i>
                                        {(product as any).usage_frequency} sipariş
                                    </small>
                                )}
                                <small className={stockStatus.class}>
                                    {product.stock_quantity} {product.baseUnit?.symbol}
                                </small>
                            </div>
                        </div>
                        <div className="text-end">
                            <div className="fw-medium text-primary small">
                                {getCurrencySymbol(getProductCurrency(product))}{Number(product.sale_price).toFixed(2)}
                            </div>
                            {(product as any).has_special_pricing && (
                                <small className="text-success">
                                    <i className="ri-price-tag-3-line"></i>
                                </small>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                            <div className="fw-medium">{product.name}</div>
                            <div className="d-flex gap-3 mt-1">
                                <small className={isHighlighted ? '' : 'text-muted'}>
                                    <strong>Kod:</strong> {product.code}
                                </small>
                                {product.category && (
                                    <small className={isHighlighted ? '' : 'text-muted'}>
                                        <strong>Kategori:</strong> {product.category.name}
                                    </small>
                                )}
                                {product.brand && (
                                    <small className={isHighlighted ? '' : 'text-muted'}>
                                        <strong>Marka:</strong> {product.brand.name}
                                    </small>
                                )}
                            </div>
                            <div className="d-flex gap-3 mt-1">
                                <small className={isHighlighted ? '' : stockStatus.class}>
                                    <strong>Stok:</strong> {product.stock_quantity} {product.baseUnit?.symbol} - {stockStatus.text}
                                </small>
                                <small className={isHighlighted ? '' : 'text-muted'}>
                                    <strong>KDV:</strong> %{product.tax_rate % 1 === 0 ? Math.floor(product.tax_rate) : product.tax_rate}
                                </small>
                            </div>
                        </div>
                        <div className="text-end">
                            <div className={`fw-medium ${isHighlighted ? '' : 'text-primary'}`}>
                                {getCurrencySymbol(getProductCurrency(product))}{Number(product.sale_price).toFixed(2)}
                            </div>
                            {(product as any).has_special_pricing && (
                                <small className={isHighlighted ? '' : 'text-success'}>
                                    <i className="ri-price-tag-3-line me-1"></i>
                                    Özel Fiyat
                                </small>
                            )}
                            {(product as any).original_price && (product as any).original_price !== product.sale_price && (
                                <small className={`${isHighlighted ? '' : 'text-muted'} text-decoration-line-through d-block`}>
                                    {getCurrencySymbol(getProductCurrency(product))}{Number((product as any).original_price).toFixed(2)}
                                </small>
                            )}
                            {product.baseUnit && (
                                <small className={isHighlighted ? '' : 'text-muted'}>
                                    /{product.baseUnit.symbol}
                                </small>
                            )}
                        </div>
                    </div>
                )}
            </ListGroup.Item>
        );
    };

    return (
        <div className={`position-relative ${className}`} ref={dropdownRef}>
            <InputGroup>
                <Form.Control
                    ref={inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    isInvalid={isInvalid}
                    disabled={disabled}
                    name={name}
                    autoComplete="off"
                    style={{ minWidth: '160px' }}
                />

                {selectedProduct && clearable && mode === 'select' && (
                    <Button
                        variant="outline-secondary"
                        onClick={handleClear}
                        disabled={disabled}
                        title="Temizle"
                    >
                        <i className="ri-close-line"></i>
                    </Button>
                )}
                <Button
                    variant="outline-primary"
                    onClick={() => { setIsOpen(false); setShowCatalog(true); }}
                    disabled={disabled}
                    title="Tum Urunler"
                    style={{ padding: '0.25rem 0.5rem' }}
                >
                    <i className="ri-list-unordered"></i>
                </Button>
            </InputGroup>

            {/* Product Catalog Modal */}
            <ProductCatalogModal
                show={showCatalog}
                onHide={() => setShowCatalog(false)}
                onSelect={(product) => {
                    handleProductSelect(product as Product);
                    setShowCatalog(false);
                }}
                searchUrl={searchUrl.replace('/search', '/catalog')}
                customerId={customerId}
                quantity={quantity}
            />

            {/* Dropdown menu rendered via Portal */}
            {isOpen && !disabled && createPortal(
                <div
                    id={dropdownId}
                    className={`position-fixed bg-white border rounded shadow-lg ${dropdownPosition.flipped ? 'border-primary' : ''}`}
                    style={{
                        zIndex: 10000,
                        maxHeight: `${dropdownPosition.maxHeight}px`,
                        overflowY: 'auto',
                        left: `${dropdownPosition.left}px`,
                        top: `${dropdownPosition.top}px`,
                        width: `${dropdownPosition.width}px`,
                        minWidth: '400px',
                        boxShadow: dropdownPosition.flipped
                            ? '0 -4px 12px rgba(0, 0, 0, 0.15)'
                            : '0 4px 12px rgba(0, 0, 0, 0.15)',
                        border: dropdownPosition.flipped
                            ? '1px solid #0d6efd'
                            : '1px solid #dee2e6'
                    }}
                    onScroll={handleDropdownScroll}
                >
                    {loading ? (
                        <div className="text-center p-3">
                            <Spinner animation="border" size="sm" className="me-2" />
                            Aranıyor...
                        </div>
                    ) : products.length > 0 ? (
                        <>
                            <ListGroup variant="flush">
                                {products.map((product, index) => renderProductItem(product, index))}
                            </ListGroup>
                            {loadingMore && (
                                <div className="text-center p-2 border-top">
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    <small className="text-muted">Daha fazla yükleniyor...</small>
                                </div>
                            )}
                            {hasMore && !loadingMore && (
                                <div className="text-center p-2 border-top">
                                    <small className="text-muted">
                                        <i className="ri-arrow-down-line me-1"></i>
                                        Daha fazla sonuç için aşağı kaydırın
                                    </small>
                                </div>
                            )}
                        </>
                    ) : searchTerm.length >= 2 ? (
                        <div className="text-center p-3 text-muted">
                            <i className="ri-search-line me-2"></i>
                            Sonuç bulunamadı
                        </div>
                    ) : showFrequent && frequentProducts.length > 0 ? (
                        <div>
                            <div className="px-3 py-2 border-bottom bg-light">
                                <small className="text-muted fw-medium">
                                    <i className="ri-fire-line me-1 text-warning"></i>
                                    Sık Kullanılan Ürünler
                                </small>
                            </div>
                            <ListGroup variant="flush">
                                {frequentProducts.map((product, index) => renderProductItem(product, index, true))}
                            </ListGroup>
                        </div>
                    ) : (
                        <div className="text-center p-3 text-muted">
                            <i className="ri-search-line me-2"></i>
                            Arama yapmak için en az 2 karakter girin
                        </div>
                    )}
                </div>,
                document.body
            )}
        </div>
    );
}
