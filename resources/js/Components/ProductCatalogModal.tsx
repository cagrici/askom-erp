import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, Table, Form, InputGroup, Button, Spinner, Badge, Pagination } from 'react-bootstrap';
import axios from 'axios';

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
    category?: { id: number; name: string };
    brand?: { id: number; name: string };
    baseUnit?: { id: number; name: string; symbol: string };
    [key: string]: any;
}

interface ProductCatalogModalProps {
    show: boolean;
    onHide: () => void;
    onSelect: (product: Product) => void;
    searchUrl: string;
    customerId?: number | null;
    quantity?: number;
}

export default function ProductCatalogModal({
    show,
    onHide,
    onSelect,
    searchUrl,
    customerId = null,
    quantity = 1,
}: ProductCatalogModalProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [perPage] = useState(50);
    const [sortField, setSortField] = useState<string>('code');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const tableRef = useRef<HTMLDivElement>(null);

    // Load products when modal opens or search/page/sort changes
    useEffect(() => {
        if (!show) return;

        const timer = setTimeout(() => {
            fetchProducts();
        }, search ? 300 : 0);

        return () => clearTimeout(timer);
    }, [show, search, currentPage, sortField, sortDir]);

    // Focus search input when modal opens
    useEffect(() => {
        if (show) {
            setTimeout(() => searchInputRef.current?.focus(), 200);
            setSelectedId(null);
        }
    }, [show]);

    // Reset page when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params: any = {
                page: currentPage,
                per_page: perPage,
                sort: sortField,
                sort_dir: sortDir,
            };
            if (search.length >= 1) {
                params.q = search;
            }
            if (customerId) {
                params.customer_id = customerId;
            }
            if (quantity > 1) {
                params.quantity = quantity;
            }

            const response = await axios.get(searchUrl, {
                params,
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            const data = response.data;
            const items = data.data || data || [];
            setProducts(items);
            setTotal(data.total || items.length);
            setTotalPages(data.last_page || Math.ceil((data.total || items.length) / perPage));
        } catch (error) {
            console.error('Product catalog fetch error:', error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('asc');
        }
        setCurrentPage(1);
    };

    const SortIcon = ({ field }: { field: string }) => {
        if (sortField !== field) return <i className="ri-arrow-up-down-line text-muted ms-1" style={{ fontSize: '11px' }}></i>;
        return sortDir === 'asc'
            ? <i className="ri-arrow-up-s-line text-primary ms-1"></i>
            : <i className="ri-arrow-down-s-line text-primary ms-1"></i>;
    };

    const getCurrencySymbol = (currency: string) => {
        switch (currency) {
            case 'TRY': return '₺';
            case 'USD': return '$';
            case 'EUR': return '€';
            case 'GBP': return '£';
            default: return currency + ' ';
        }
    };

    const getProductCurrency = (product: Product): string => {
        return product.currency || product.logo_currency || 'TRY';
    };

    const handleRowClick = (product: Product) => {
        setSelectedId(product.id);
    };

    const handleRowDoubleClick = (product: Product) => {
        onSelect(product);
    };

    const handleSelectButton = () => {
        const product = products.find(p => p.id === selectedId);
        if (product) {
            onSelect(product);
        }
    };

    // Keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (products.length === 0) return;

        const currentIndex = products.findIndex(p => p.id === selectedId);

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (currentIndex < products.length - 1) {
                    setSelectedId(products[currentIndex + 1].id);
                    scrollToRow(currentIndex + 1);
                } else if (currentIndex === -1) {
                    setSelectedId(products[0].id);
                    scrollToRow(0);
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (currentIndex > 0) {
                    setSelectedId(products[currentIndex - 1].id);
                    scrollToRow(currentIndex - 1);
                }
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedId) {
                    const product = products.find(p => p.id === selectedId);
                    if (product) onSelect(product);
                }
                break;
        }
    }, [products, selectedId, onSelect]);

    const scrollToRow = (index: number) => {
        const row = tableRef.current?.querySelector(`tr[data-index="${index}"]`);
        row?.scrollIntoView({ block: 'nearest' });
    };

    // Page range for pagination
    const getPageRange = () => {
        const range: number[] = [];
        const maxVisible = 7;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);
        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }
        for (let i = start; i <= end; i++) range.push(i);
        return range;
    };

    return (
        <Modal
            show={show}
            onHide={onHide}
            size="xl"
            dialogClassName="product-catalog-modal"
            centered
            onKeyDown={handleKeyDown}
        >
            <Modal.Header closeButton className="py-2">
                <Modal.Title className="fs-6">
                    <i className="ri-list-unordered me-2"></i>
                    Malzeme Katalogu
                    {total > 0 && <Badge bg="secondary" className="ms-2">{total} kayıt</Badge>}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body className="p-0">
                {/* Search bar */}
                <div className="px-3 py-2 border-bottom bg-light">
                    <InputGroup size="sm">
                        <InputGroup.Text><i className="ri-search-line"></i></InputGroup.Text>
                        <Form.Control
                            ref={searchInputRef}
                            placeholder="Kod, isim veya marka ile ara..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        {search && (
                            <Button variant="outline-secondary" onClick={() => setSearch('')}>
                                <i className="ri-close-line"></i>
                            </Button>
                        )}
                    </InputGroup>
                </div>

                {/* Table */}
                <div
                    ref={tableRef}
                    style={{ maxHeight: 'calc(80vh - 180px)', overflowY: 'auto' }}
                >
                    <Table hover size="sm" className="mb-0 table-bordered" style={{ fontSize: '13px' }}>
                        <thead className="table-light position-sticky top-0" style={{ zIndex: 1 }}>
                            <tr>
                                <th style={{ width: '14%', cursor: 'pointer' }} onClick={() => handleSort('code')}>
                                    Kodu <SortIcon field="code" />
                                </th>
                                <th style={{ width: '28%', cursor: 'pointer' }} onClick={() => handleSort('name')}>
                                    Aciklamasi <SortIcon field="name" />
                                </th>
                                <th style={{ width: '7%' }}>Ana Birim</th>
                                <th style={{ width: '9%', cursor: 'pointer' }} onClick={() => handleSort('stock_quantity')}>
                                    Stok <SortIcon field="stock_quantity" />
                                </th>
                                <th style={{ width: '10%', cursor: 'pointer' }} onClick={() => handleSort('sale_price')}>
                                    Son Satis Fiyati <SortIcon field="sale_price" />
                                </th>
                                <th style={{ width: '10%' }}>TL Karsiligi</th>
                                <th style={{ width: '8%' }}>KDV %</th>
                                <th style={{ width: '14%' }}>Marka</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-4">
                                        <Spinner animation="border" size="sm" className="me-2" />
                                        Yukleniyor...
                                    </td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-4 text-muted">
                                        <i className="ri-inbox-line me-2" style={{ fontSize: '20px' }}></i>
                                        {search ? 'Sonuc bulunamadi' : 'Urun bulunamadi'}
                                    </td>
                                </tr>
                            ) : (
                                products.map((product, index) => {
                                    const currency = getProductCurrency(product);
                                    const isSelected = product.id === selectedId;
                                    return (
                                        <tr
                                            key={product.id}
                                            data-index={index}
                                            onClick={() => handleRowClick(product)}
                                            onDoubleClick={() => handleRowDoubleClick(product)}
                                            className={isSelected ? 'table-primary' : ''}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <td className="text-nowrap">{product.code}</td>
                                            <td>{product.name}</td>
                                            <td className="text-center">{product.baseUnit?.symbol || 'ADET'}</td>
                                            <td className="text-end">
                                                {product.stock_quantity > 0 ? (
                                                    <span className="text-success">{product.stock_quantity}</span>
                                                ) : (
                                                    <span className="text-muted">0</span>
                                                )}
                                            </td>
                                            <td className="text-end text-nowrap">
                                                {product.sale_price > 0 ? (
                                                    <>{getCurrencySymbol(currency)}{Number(product.sale_price).toFixed(2)}</>
                                                ) : (
                                                    <span className="text-muted">-</span>
                                                )}
                                            </td>
                                            <td className="text-end text-nowrap">
                                                {currency !== 'TRY' && product.sale_price_try && product.sale_price_try > 0 ? (
                                                    <>₺{Number(product.sale_price_try).toFixed(2)}</>
                                                ) : currency === 'TRY' && product.sale_price > 0 ? (
                                                    <>₺{Number(product.sale_price).toFixed(2)}</>
                                                ) : (
                                                    <span className="text-muted">-</span>
                                                )}
                                            </td>
                                            <td className="text-center">%{product.tax_rate}</td>
                                            <td className="text-nowrap">{product.brand?.name || ''}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="d-flex justify-content-between align-items-center px-3 py-2 border-top bg-light">
                        <small className="text-muted">
                            Sayfa {currentPage} / {totalPages} ({total} kayit)
                        </small>
                        <Pagination size="sm" className="mb-0">
                            <Pagination.First
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(1)}
                            />
                            <Pagination.Prev
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                            />
                            {getPageRange().map(page => (
                                <Pagination.Item
                                    key={page}
                                    active={page === currentPage}
                                    onClick={() => setCurrentPage(page)}
                                >
                                    {page}
                                </Pagination.Item>
                            ))}
                            <Pagination.Next
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => p + 1)}
                            />
                            <Pagination.Last
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(totalPages)}
                            />
                        </Pagination>
                    </div>
                )}
            </Modal.Body>

            <Modal.Footer className="py-2">
                <Button variant="primary" size="sm" disabled={!selectedId} onClick={handleSelectButton}>
                    <i className="ri-check-line me-1"></i>Sec
                </Button>
                <Button variant="outline-secondary" size="sm" onClick={onHide}>
                    Kapat
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
