import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Card, Table, Button, Row, Col, Badge, Dropdown, Form, InputGroup } from 'react-bootstrap';
import Layout from '@/Layouts';

interface ProductPrice {
    id: number;
    product_id: number;
    product_code: string;
    product_name: string;
    product_brand?: string;
    category_name?: string;
    min_quantity: number;
    max_quantity?: number;
    unit_price: number;
    discount_percent?: number;
    discount_amount?: number;
    final_price: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface PriceList {
    id: number;
    name: string;
    code: string;
    currency: string;
    type: string;
}

interface Props {
    priceList: PriceList;
    prices: {
        data: ProductPrice[];
        links: any[];
        meta: any;
    };
    filters: {
        search?: string;
        category?: string;
        brand?: string;
        sort?: string;
        direction?: string;
    };
    userPermissions: {
        canCreate: boolean;
        canEdit: boolean;
        canDelete: boolean;
    };
}

export default function Index({ priceList, prices, filters, userPermissions }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('sales.price-lists.prices.index', priceList.id), {
            ...filters,
            search: searchTerm
        });
    };

    const handleSort = (field: string) => {
        const direction = filters.sort === field && filters.direction === 'asc' ? 'desc' : 'asc';
        router.get(route('sales.price-lists.prices.index', priceList.id), {
            ...filters,
            sort: field,
            direction
        });
    };

    const getSortIcon = (field: string) => {
        if (filters.sort !== field) return 'ri-expand-up-down-line';
        return filters.direction === 'asc' ? 'ri-arrow-up-line' : 'ri-arrow-down-line';
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: priceList.currency,
            minimumFractionDigits: 2
        }).format(price);
    };

    const deletePrice = (price: ProductPrice) => {
        if (confirm(`"${price.product_name}" ürünü için fiyatı silmek istediğinizden emin misiniz?`)) {
            router.delete(route('sales.price-lists.prices.destroy', [priceList.id, price.id]));
        }
    };

    return (
        <Layout>
            <Head title={`${priceList.name} - Ürün Fiyatları`} />
            
            <div className="page-content">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="h3 mb-1">
                            <i className="ri-price-tag-line me-2"></i>
                            Ürün Fiyatları
                        </h1>
                        <p className="text-muted mb-0">
                            <Link 
                                href={route('sales.price-lists.show', priceList.id)} 
                                className="text-decoration-none"
                            >
                                {priceList.name}
                            </Link>
                            <span className="mx-2">•</span>
                            <code>{priceList.code}</code>
                            <span className="mx-2">•</span>
                            {prices.meta?.total || 0} ürün
                        </p>
                    </div>

                    <div className="d-flex gap-2">
                        {userPermissions.canCreate && (
                            <Link href={route('sales.price-lists.prices.create', priceList.id)}>
                                <Button variant="primary">
                                    <i className="ri-add-line me-1"></i>
                                    Fiyat Ekle
                                </Button>
                            </Link>
                        )}
                        
                        <Link href={route('sales.price-lists.show', priceList.id)}>
                            <Button variant="outline-secondary">
                                <i className="ri-arrow-left-line me-1"></i>
                                Fiyat Listesine Dön
                            </Button>
                        </Link>
                    </div>
                </div>

                <Card>
                    <Card.Header>
                        <Row className="g-3 align-items-center">
                            <Col md={4}>
                                <Form onSubmit={handleSearch}>
                                    <InputGroup>
                                        <Form.Control
                                            type="text"
                                            placeholder="Ürün ara..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                        <Button type="submit" variant="outline-secondary">
                                            <i className="ri-search-line"></i>
                                        </Button>
                                    </InputGroup>
                                </Form>
                            </Col>
                            
                            <Col md={8}>
                                <div className="d-flex gap-2 justify-content-end">
                                    <Button variant="outline-info" size="sm">
                                        <i className="ri-file-copy-line me-1"></i>
                                        Diğer Listeden Kopyala
                                    </Button>
                                    <Button variant="outline-success" size="sm">
                                        <i className="ri-upload-line me-1"></i>
                                        Toplu İçe Aktar
                                    </Button>
                                    <Button variant="outline-warning" size="sm">
                                        <i className="ri-download-line me-1"></i>
                                        Dışa Aktar
                                    </Button>
                                </div>
                            </Col>
                        </Row>
                    </Card.Header>
                    
                    <Card.Body className="p-0">
                        <div className="table-responsive">
                            <Table className="mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th 
                                            className="cursor-pointer"
                                            onClick={() => handleSort('product_name')}
                                        >
                                            Ürün
                                            <i className={`ms-1 ${getSortIcon('product_name')}`}></i>
                                        </th>
                                        <th>Kategori / Marka</th>
                                        <th 
                                            className="cursor-pointer"
                                            onClick={() => handleSort('min_quantity')}
                                        >
                                            Min. Miktar
                                            <i className={`ms-1 ${getSortIcon('min_quantity')}`}></i>
                                        </th>
                                        <th 
                                            className="cursor-pointer"
                                            onClick={() => handleSort('price')}
                                        >
                                            Birim Fiyat
                                            <i className={`ms-1 ${getSortIcon('price')}`}></i>
                                        </th>
                                        <th>İndirim</th>
                                        <th>Final Fiyat</th>
                                        <th width="120">İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {prices.data.map((price) => (
                                        <tr key={price.id}>
                                            <td>
                                                <div>
                                                    <div className="fw-medium">{price.product_name}</div>
                                                    <small className="text-muted">{price.product_code}</small>
                                                </div>
                                            </td>
                                            <td>
                                                <div>
                                                    {price.category_name && (
                                                        <small className="d-block text-muted">{price.category_name}</small>
                                                    )}
                                                    {price.product_brand && (
                                                        <small className="d-block text-info">{price.product_brand}</small>
                                                    )}
                                                </div>
                                            </td>
                                            <td>{price.min_quantity}</td>
                                            <td className="fw-medium">{formatPrice(price.unit_price)}</td>
                                            <td>
                                                {price.discount_percent ? (
                                                    <Badge bg="warning">%{price.discount_percent}</Badge>
                                                ) : price.discount_amount ? (
                                                    <Badge bg="warning">{formatPrice(price.discount_amount)}</Badge>
                                                ) : (
                                                    <span className="text-muted">-</span>
                                                )}
                                            </td>
                                            <td className="fw-bold text-success">{formatPrice(price.final_price)}</td>
                                            <td>
                                                <Dropdown>
                                                    <Dropdown.Toggle 
                                                        variant="outline-secondary" 
                                                        size="sm"
                                                        className="no-caret"
                                                    >
                                                        <i className="ri-more-2-line"></i>
                                                    </Dropdown.Toggle>
                                                    <Dropdown.Menu>
                                                        <Dropdown.Item 
                                                            as={Link} 
                                                            href={route('sales.price-lists.prices.show', [priceList.id, price.id])}
                                                        >
                                                            <i className="ri-eye-line me-2"></i>
                                                            Görüntüle
                                                        </Dropdown.Item>

                                                        {userPermissions.canEdit && (
                                                            <Dropdown.Item 
                                                                as={Link} 
                                                                href={route('sales.price-lists.prices.edit', [priceList.id, price.id])}
                                                            >
                                                                <i className="ri-edit-line me-2"></i>
                                                                Düzenle
                                                            </Dropdown.Item>
                                                        )}

                                                        {userPermissions.canDelete && (
                                                            <>
                                                                <Dropdown.Divider />
                                                                <Dropdown.Item 
                                                                    onClick={() => deletePrice(price)}
                                                                    className="text-danger"
                                                                >
                                                                    <i className="ri-delete-bin-line me-2"></i>
                                                                    Sil
                                                                </Dropdown.Item>
                                                            </>
                                                        )}
                                                    </Dropdown.Menu>
                                                </Dropdown>
                                            </td>
                                        </tr>
                                    ))}

                                    {prices.data.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="text-center py-5">
                                                <div className="text-muted">
                                                    <i className="ri-price-tag-line fs-1 d-block mb-3"></i>
                                                    Bu fiyat listesinde henüz ürün fiyatı bulunmuyor
                                                </div>
                                                {userPermissions.canCreate && (
                                                    <Link href={route('sales.price-lists.prices.create', priceList.id)}>
                                                        <Button variant="primary">
                                                            <i className="ri-add-line me-1"></i>
                                                            İlk Fiyatı Ekle
                                                        </Button>
                                                    </Link>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    </Card.Body>
                </Card>

                {/* Pagination */}
                {prices.meta && prices.meta.last_page && prices.meta.last_page > 1 && (
                    <div className="d-flex justify-content-center mt-4">
                        {/* Pagination component burada olacak */}
                    </div>
                )}
            </div>
        </Layout>
    );
}