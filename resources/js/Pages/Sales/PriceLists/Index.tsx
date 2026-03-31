import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Card, Table, Button, Row, Col, Badge, Dropdown, Form, InputGroup } from 'react-bootstrap';
import Layout from '@/Layouts';
import LogoPriceSyncModal from '@/Components/LogoPriceSyncModal';

interface PriceList {
    id: number;
    name: string;
    code: string;
    description?: string;
    type: string;
    currency: string;
    valid_from?: string;
    valid_until?: string;
    is_active: boolean;
    is_default: boolean;
    customer_groups?: number[];
    prices_count: number;
    created_at: string;
    updated_at: string;
}

interface Props {
    priceLists: {
        data: PriceList[];
        links: any[];
        meta: any;
    };
    filters: {
        search?: string;
        type?: string;
        currency?: string;
        status?: string;
        sort?: string;
        direction?: string;
    };
    types: Record<string, string>;
    currencies: Record<string, string>;
    userPermissions: {
        canCreate: boolean;
        canEdit: boolean;
        canDelete: boolean;
    };
}

export default function Index({ priceLists, filters, types, currencies, userPermissions }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [showSyncModal, setShowSyncModal] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('sales.price-lists.index'), {
            ...filters,
            search: searchTerm
        });
    };

    const handleFilter = (key: string, value: string) => {
        router.get(route('sales.price-lists.index'), {
            ...filters,
            [key]: value === filters[key as keyof typeof filters] ? '' : value
        });
    };

    const handleSort = (field: string) => {
        const direction = filters.sort === field && filters.direction === 'asc' ? 'desc' : 'asc';
        router.get(route('sales.price-lists.index'), {
            ...filters,
            sort: field,
            direction
        });
    };

    const getSortIcon = (field: string) => {
        if (filters.sort !== field) return 'ri-expand-up-down-line';
        return filters.direction === 'asc' ? 'ri-arrow-up-line' : 'ri-arrow-down-line';
    };

    const getStatusBadge = (priceList: PriceList) => {
        if (!priceList.is_active) {
            return <Badge bg="secondary">Pasif</Badge>;
        }
        if (priceList.is_default) {
            return <Badge bg="primary">Varsayılan</Badge>;
        }
        return <Badge bg="success">Aktif</Badge>;
    };

    const getTypeBadge = (type: string) => {
        const variants: Record<string, string> = {
            sale: 'primary',
            purchase: 'info',
            special: 'warning'
        };
        return <Badge bg={variants[type] || 'secondary'}>{types[type]}</Badge>;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR');
    };

    const toggleStatus = (priceList: PriceList) => {
        router.patch(route('sales.price-lists.toggle-status', priceList.id));
    };

    const setAsDefault = (priceList: PriceList) => {
        router.patch(route('sales.price-lists.set-default', priceList.id));
    };

    const duplicatePriceList = (priceList: PriceList) => {
        router.post(route('sales.price-lists.duplicate', priceList.id));
    };

    const deletePriceList = (priceList: PriceList) => {
        if (confirm(`"${priceList.name}" fiyat listesini silmek istediğinizden emin misiniz?`)) {
            router.delete(route('sales.price-lists.destroy', priceList.id));
        }
    };

    return (
        <Layout>
            <Head title="Fiyat Listeleri" />
            
            <div className="page-content">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="h3 mb-1">
                            <i className="ri-price-tag-3-line me-2"></i>
                            Fiyat Listeleri
                        </h1>
                        <p className="text-muted mb-0">
                            Ürün fiyat listelerini yönetin ve müşteri gruplarına atayın
                        </p>
                    </div>

                    <div className="d-flex gap-2">
                        {userPermissions.canEdit && (
                            <Button variant="outline-primary" onClick={() => setShowSyncModal(true)}>
                                <i className="ri-refresh-line me-1"></i>
                                Logo Fiyat Senkronizasyonu
                            </Button>
                        )}
                        {userPermissions.canCreate && (
                            <Link href={route('sales.price-lists.create')}>
                                <Button variant="primary">
                                    <i className="ri-add-line me-1"></i>
                                    Yeni Fiyat Listesi
                                </Button>
                            </Link>
                        )}
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
                                            placeholder="Fiyat listesi ara..."
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
                                <div className="d-flex gap-2 flex-wrap">
                                    <Form.Select
                                        size="sm"
                                        value={filters.type || ''}
                                        onChange={(e) => handleFilter('type', e.target.value)}
                                        style={{ width: 'auto' }}
                                    >
                                        <option value="">Tüm Tipler</option>
                                        {Object.entries(types).map(([value, label]) => (
                                            <option key={value} value={value}>{label}</option>
                                        ))}
                                    </Form.Select>

                                    <Form.Select
                                        size="sm"
                                        value={filters.currency || ''}
                                        onChange={(e) => handleFilter('currency', e.target.value)}
                                        style={{ width: 'auto' }}
                                    >
                                        <option value="">Tüm Para Birimleri</option>
                                        {Object.entries(currencies).map(([value, label]) => (
                                            <option key={value} value={value}>{value}</option>
                                        ))}
                                    </Form.Select>

                                    <Form.Select
                                        size="sm"
                                        value={filters.status || ''}
                                        onChange={(e) => handleFilter('status', e.target.value)}
                                        style={{ width: 'auto' }}
                                    >
                                        <option value="">Tüm Durumlar</option>
                                        <option value="active">Aktif</option>
                                        <option value="inactive">Pasif</option>
                                    </Form.Select>
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
                                            onClick={() => handleSort('name')}
                                        >
                                            Fiyat Listesi Adı
                                            <i className={`ms-1 ${getSortIcon('name')}`}></i>
                                        </th>
                                        <th 
                                            className="cursor-pointer"
                                            onClick={() => handleSort('code')}
                                        >
                                            Kod
                                            <i className={`ms-1 ${getSortIcon('code')}`}></i>
                                        </th>
                                        <th 
                                            className="cursor-pointer"
                                            onClick={() => handleSort('type')}
                                        >
                                            Tip
                                            <i className={`ms-1 ${getSortIcon('type')}`}></i>
                                        </th>
                                        <th 
                                            className="cursor-pointer"
                                            onClick={() => handleSort('currency')}
                                        >
                                            Para Birimi
                                            <i className={`ms-1 ${getSortIcon('currency')}`}></i>
                                        </th>
                                        <th>Geçerlilik</th>
                                        <th>Ürün Sayısı</th>
                                        <th>Durum</th>
                                        <th width="120">İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {priceLists.data.map((priceList) => (
                                        <tr key={priceList.id}>
                                            <td>
                                                <div>
                                                    <div className="fw-medium">{priceList.name}</div>
                                                    {priceList.description && (
                                                        <small className="text-muted">{priceList.description}</small>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <code>{priceList.code}</code>
                                            </td>
                                            <td>
                                                {getTypeBadge(priceList.type)}
                                            </td>
                                            <td>
                                                <Badge bg="outline-secondary">{priceList.currency}</Badge>
                                            </td>
                                            <td>
                                                {priceList.valid_from || priceList.valid_until ? (
                                                    <div>
                                                        {priceList.valid_from && (
                                                            <small className="d-block">
                                                                Başlangıç: {formatDate(priceList.valid_from)}
                                                            </small>
                                                        )}
                                                        {priceList.valid_until && (
                                                            <small className="d-block">
                                                                Bitiş: {formatDate(priceList.valid_until)}
                                                            </small>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted">Süresiz</span>
                                                )}
                                            </td>
                                            <td>
                                                <Badge bg="info">{priceList.prices_count}</Badge>
                                            </td>
                                            <td>
                                                {getStatusBadge(priceList)}
                                            </td>
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
                                                            href={route('sales.price-lists.show', priceList.id)}
                                                        >
                                                            <i className="ri-eye-line me-2"></i>
                                                            Görüntüle
                                                        </Dropdown.Item>

                                                        {userPermissions.canEdit && (
                                                            <>
                                                                <Dropdown.Item 
                                                                    as={Link} 
                                                                    href={route('sales.price-lists.edit', priceList.id)}
                                                                >
                                                                    <i className="ri-edit-line me-2"></i>
                                                                    Düzenle
                                                                </Dropdown.Item>

                                                                <Dropdown.Item 
                                                                    onClick={() => toggleStatus(priceList)}
                                                                >
                                                                    <i className={`ri-${priceList.is_active ? 'pause' : 'play'}-line me-2`}></i>
                                                                    {priceList.is_active ? 'Pasifleştir' : 'Aktifleştir'}
                                                                </Dropdown.Item>

                                                                {!priceList.is_default && priceList.is_active && (
                                                                    <Dropdown.Item 
                                                                        onClick={() => setAsDefault(priceList)}
                                                                    >
                                                                        <i className="ri-star-line me-2"></i>
                                                                        Varsayılan Yap
                                                                    </Dropdown.Item>
                                                                )}

                                                                <Dropdown.Item 
                                                                    onClick={() => duplicatePriceList(priceList)}
                                                                >
                                                                    <i className="ri-file-copy-line me-2"></i>
                                                                    Kopyala
                                                                </Dropdown.Item>
                                                            </>
                                                        )}

                                                        {userPermissions.canDelete && !priceList.is_default && priceList.prices_count === 0 && (
                                                            <>
                                                                <Dropdown.Divider />
                                                                <Dropdown.Item 
                                                                    onClick={() => deletePriceList(priceList)}
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

                                    {priceLists.data.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="text-center py-5">
                                                <div className="text-muted">
                                                    <i className="ri-price-tag-3-line fs-1 d-block mb-3"></i>
                                                    Fiyat listesi bulunamadı
                                                </div>
                                                {userPermissions.canCreate && (
                                                    <Link href={route('sales.price-lists.create')}>
                                                        <Button variant="primary">
                                                            <i className="ri-add-line me-1"></i>
                                                            İlk Fiyat Listesini Oluştur
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
                {priceLists.meta && priceLists.meta.last_page > 1 && (
                    <div className="d-flex justify-content-center mt-4">
                        {/* Pagination component burada olacak */}
                    </div>
                )}
            </div>

            <LogoPriceSyncModal show={showSyncModal} onHide={() => setShowSyncModal(false)} />
        </Layout>
    );
}