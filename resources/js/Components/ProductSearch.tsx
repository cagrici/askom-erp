import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface Product {
    id: number;
    code: string;
    name: string;
    sku?: string;
    sale_price: number;
    currency: string;
    baseUnit?: {
        id: number;
        name: string;
        symbol: string;
    };
    activeUnits?: Array<{
        id: number;
        unit_id: number;
        conversion_factor: number;
        is_base_unit: boolean;
        unit?: {
            id: number;
            name: string;
            symbol: string;
        };
    }>;
    tax?: {
        id: number;
        name: string;
        type: 'percentage' | 'fixed';
        rate: number;
        fixed_amount?: number;
        code: string;
    };
    primary_image?: {
        id: number;
        image_path: string;
        thumbnail_path: string;
        image_url: string;
        thumbnail_url: string;
        is_primary: boolean;
        sort_order: number;
    };
}

interface ProductSearchProps {
    value?: Product | null;
    onChange: (product: Product | null) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export default function ProductSearch({
    value,
    onChange,
    placeholder = "Ürün ara...",
    className = "",
    disabled = false
}: ProductSearchProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    const searchRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (value) {
            const displayText = value.sku
                ? `${value.name} (${value.code} - ${value.sku})`
                : `${value.name} (${value.code})`;
            setSearchTerm(displayText);
        } else {
            setSearchTerm('');
        }
    }, [value]);

    useEffect(() => {
        const searchProducts = async () => {
            if (searchTerm.length < 2) {
                setResults([]);
                setIsOpen(false);
                return;
            }

            setIsLoading(true);
            try {
                console.log('🔍 Searching for:', searchTerm);
                const url = '/purchasing/requests/search-products';
                console.log('📡 Request URL:', url);

                const response = await axios.get(url, {
                    params: { q: searchTerm, limit: 20 }
                });

                console.log('✅ Response received:', response.data);
                setResults(response.data.products || []);
                setIsOpen(true);
                setSelectedIndex(-1);
            } catch (error) {
                console.error('Product search error:', error);
                if (error.response?.status === 404) {
                    console.error('Route not found - check if route exists:', '/purchasing/requests/search-products');
                } else if (error.response?.status === 401) {
                    console.error('Authentication required');
                } else if (error.response?.status === 403) {
                    console.error('Access forbidden');
                }
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        };

        const debounceTimer = setTimeout(searchProducts, 300);
        return () => clearTimeout(debounceTimer);
    }, [searchTerm]);

    const selectProduct = (product: Product) => {
        onChange(product);
        setIsOpen(false);
        setSelectedIndex(-1);
    };

    const clearSelection = () => {
        onChange(null);
        setSearchTerm('');
        setIsOpen(false);
        setSelectedIndex(-1);
        searchRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => prev < results.length - 1 ? prev + 1 : prev);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && results[selectedIndex]) {
                    selectProduct(results[selectedIndex]);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setSelectedIndex(-1);
                break;
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`position-relative ${className}`} ref={dropdownRef}>
            <div className="input-group">
                <input
                    ref={searchRef}
                    type="text"
                    className="form-control form-control-sm"
                    placeholder={placeholder}
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        if (value) {
                            const expectedText = value.sku
                                ? `${value.name} (${value.code} - ${value.sku})`
                                : `${value.name} (${value.code})`;
                            if (e.target.value !== expectedText) {
                                onChange(null);
                            }
                        }
                    }}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    autoComplete="off"
                />
                {value && (
                    <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={clearSelection}
                        title="Temizle"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                )}
                {isLoading && (
                    <span className="input-group-text">
                        <div className="spinner-border spinner-border-sm" role="status">
                            <span className="visually-hidden">Aranıyor...</span>
                        </div>
                    </span>
                )}
            </div>

            {/* Dropdown Results */}
            {isOpen && results.length > 0 && (
                <div className="position-absolute w-100 mt-1 bg-white border rounded shadow-lg" style={{ zIndex: 1050, maxHeight: '300px', overflowY: 'auto' }}>
                    <div className="list-group list-group-flush">
                        {results.map((product, index) => (
                            <button
                                key={product.id}
                                type="button"
                                className={`list-group-item list-group-item-action border-0 ${
                                    index === selectedIndex ? 'active' : ''
                                }`}
                                onClick={() => selectProduct(product)}
                                onMouseEnter={() => setSelectedIndex(index)}
                            >
                                <div className="d-flex align-items-start">
                                    {/* Product Image */}
                                    <div className="me-3 flex-shrink-0">
                                        {product.primary_image ? (
                                            <img
                                                src={product.primary_image.thumbnail_url}
                                                alt={product.name}
                                                className="rounded"
                                                style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <div
                                                className="bg-light rounded d-flex align-items-center justify-content-center"
                                                style={{ width: '40px', height: '40px' }}
                                            >
                                                <i className="ri-image-line text-muted"></i>
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Details */}
                                    <div className="d-flex justify-content-between align-items-start flex-grow-1">
                                        <div className="flex-grow-1">
                                            <h6 className="mb-1">{product.name}</h6>
                                            <div className="d-flex flex-wrap gap-2">
                                                <small className="text-muted">Kod: {product.code}</small>
                                                {product.sku && (
                                                    <small className="text-muted">SKU: {product.sku}</small>
                                                )}
                                                {product.unit_of_measure && (
                                                    <small className="text-muted">
                                                        Birim: {product.unit_of_measure}
                                                    </small>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-end">
                                            <small className="text-success fw-bold">
                                                {new Intl.NumberFormat('tr-TR', {
                                                    style: 'currency',
                                                    currency: product.currency || 'TRY'
                                                }).format(product.sale_price)}
                                            </small>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Add New Product Option */}
                    <div className="border-top">
                        <button
                            type="button"
                            className="list-group-item list-group-item-action border-0 text-primary"
                            onClick={() => {
                                onChange(null);
                                setIsOpen(false);
                                alert('Yeni ürün talebinizi açıklama alanında detaylı olarak belirtiniz.');
                            }}
                        >
                            <i className="fas fa-plus me-2"></i>
                            Yeni ürün talep et: "{searchTerm}"
                        </button>
                    </div>
                </div>
            )}

            {/* No Results */}
            {isOpen && !isLoading && results.length === 0 && searchTerm.length >= 2 && (
                <div className="position-absolute w-100 mt-1 bg-white border rounded shadow-lg" style={{ zIndex: 1050 }}>
                    <div className="p-3 text-center text-muted">
                        <i className="ri ri-search-line mb-2"></i>
                        <div>"{searchTerm}" için ürün bulunamadı</div>
                        <button
                            type="button"
                            className="btn btn-link btn-sm text-primary"
                            onClick={() => {
                                onChange(null);
                                setIsOpen(false);
                                alert('Yeni ürün talebinizi açıklama alanında detaylı olarak belirtiniz.');
                            }}
                        >
                            <i className="fas fa-plus me-1"></i>
                            Yeni ürün talep et
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
