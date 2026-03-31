import React, { useState } from 'react';
import Layout from '@/Layouts';
import { Head, Link, router } from '@inertiajs/react';
import { Card, Table, Button, Form, Row, Col, InputGroup, Badge, Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface Product {
    id: number;
    name: string;
    code: string;
    sku: string;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface Unit {
    id: number;
    unit_name: string;
    unit_code: string;
}

interface InventoryMovement {
    id: number;
    product_id: number;
    movement_type: string;
    quantity: number;
    unit_cost?: number;
    total_cost?: number;
    reference_type?: string;
    reference_id?: number;
    notes?: string;
    created_at: string;
    movement_type_text: string;
    movement_type_color: string;
    formatted_quantity: string;
    product: Product;
    creator?: User;
    unit?: Unit;
}

interface MovementStats {
    total_movements: number;
    in_movements: number;
    out_movements: number;
    adjustment_movements: number;
    total_in_value: number;
    total_out_value: number;
    total_adjustment_value: number;
    net_movement_value: number;
}

interface Props {
    movements: {
        data: InventoryMovement[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from?: number;
        to?: number;
        links?: any[];
    };
    filters: {
        search?: string;
        product_id?: number;
        movement_type?: string;
        reference_type?: string;
        user_id?: number;
        date_from?: string;
        date_to?: string;
        quantity_min?: number;
        quantity_max?: number;
        sort_field?: string;
        sort_direction?: string;
    };
    products: Product[];
    users: User[];
    movementStats: MovementStats;
}

export default function StockMovements({ movements, filters, products, users, movementStats }: Props) {
    const { t } = useTranslation();
    const [localFilters, setLocalFilters] = useState(filters);
    const [showMovementModal, setShowMovementModal] = useState(false);
    const [selectedMovement, setSelectedMovement] = useState<InventoryMovement | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('stock.movements'), { ...filters, ...localFilters }, { preserveState: true });
    };

    const handleFilterChange = (key: string, value: any) => {
        const newFilters = { ...filters };
        
        if (value === null || value === undefined || value === '') {
            delete newFilters[key];
        } else {
            newFilters[key] = value;
        }
        
        setLocalFilters(newFilters);
        router.get(route('stock.movements'), newFilters, { preserveState: true });
    };

    const handleSort = (field: string) => {
        const currentSortDirection = filters.sort_field === field && filters.sort_direction === 'asc' ? 'desc' : 'asc';
        
        router.get(route('stock.movements'), {
            ...filters,
            sort_field: field,
            sort_direction: currentSortDirection
        }, { preserveState: true });
    };

    const getSortIcon = (field: string) => {
        if (filters.sort_field !== field) {
            return <i className="ri-sort-line ms-1 text-muted"></i>;
        }
        return filters.sort_direction === 'asc' ? 
            <i className="ri-sort-asc ms-1 text-primary"></i> : 
            <i className="ri-sort-desc ms-1 text-primary"></i>;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('tr-TR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount?: number) => {
        if (!amount) return '-';
        return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
    };

    const getMovementIcon = (type: string) => {
        switch (type) {
            case 'in':
                return <i className="ri-arrow-down-line text-success"></i>;
            case 'out':
                return <i className="ri-arrow-up-line text-danger"></i>;
            case 'adjustment':
                return <i className="ri-settings-line text-warning"></i>;
            default:
                return <i className="ri-more-line text-secondary"></i>;
        }
    };

    const getReferenceText = (movement: InventoryMovement) => {
        if (!movement.reference_type || !movement.reference_id) {
            return '-';
        }

        const referenceTypes: { [key: string]: string } = {
            'purchase_order': 'Satın Alma Siparişi',
            'sales_order': 'Satış Siparişi',
            'transfer': 'Transfer',
            'adjustment': 'Stok Düzeltme',
            'manual_adjustment': 'Manuel Düzeltme',
            'bulk_adjustment': 'Toplu Düzeltme'
        };

        const typeName = referenceTypes[movement.reference_type] || movement.reference_type;
        return `${typeName} #${movement.reference_id}`;
    };

    const clearFilters = () => {
        setLocalFilters({});
        router.get(route('stock.movements'), {}, { preserveState: true });
    };

    return (
        <Layout>
            <Head title="Stok Hareketleri" />

            <div className="page-content">
                <div className="container-fluid">
                    <Row className="mb-3">
                        <Col>
                            <div className="page-title-box d-flex align-items-center justify-content-between">
                                <div>
                                    <h4 className="mb-0">Stok Hareketleri</h4>
                                    <div className="page-title-right">
                                        <ol className="breadcrumb m-0">
                                            <li className="breadcrumb-item">
                                                <Link href={route('stock.index')}>Stok Yönetimi</Link>
                                            </li>
                                            <li className="breadcrumb-item active">Stok Hareketleri</li>
                                        </ol>
                                    </div>
                                </div>
                                <div className="d-flex gap-2">
                                    <Link 
                                        href={route('stock.index')} 
                                        className="btn btn-secondary"
                                    >
                                        <i className="ri-arrow-left-line me-1"></i>
                                        Stok Listesi
                                    </Link>
                                    <Button variant="outline-primary">
                                        <i className="ri-download-line me-1"></i>
                                        Export
                                    </Button>
                                </div>
                            </div>
                        </Col>
                    </Row>

                    {/* Movement Statistics Cards */}
                    <Row className="mb-4">
                        <Col xl={3} md={6}>
                            <Card className="card-height-100">
                                <Card.Body>
                                    <div className="d-flex align-items-center">
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-primary-subtle text-primary rounded-circle fs-3">
                                                <i className="ri-exchange-line"></i>
                                            </span>
                                        </div>
                                        <div className="flex-grow-1 ms-3">
                                            <p className="text-uppercase fw-semibold fs-12 text-muted mb-1">Toplam Hareket</p>
                                            <h4 className="mb-0">{movementStats.total_movements.toLocaleString()}</h4>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xl={3} md={6}>
                            <Card className="card-height-100">
                                <Card.Body>
                                    <div className="d-flex align-items-center">
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-success-subtle text-success rounded-circle fs-3">
                                                <i className="ri-arrow-down-line"></i>
                                            </span>
                                        </div>
                                        <div className="flex-grow-1 ms-3">
                                            <p className="text-uppercase fw-semibold fs-12 text-muted mb-1">Stok Giriş</p>
                                            <h4 className="mb-0 text-success">{movementStats.in_movements.toLocaleString()}</h4>
                                            <small className="text-muted">{formatCurrency(movementStats.total_in_value)}</small>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xl={3} md={6}>
                            <Card className="card-height-100">
                                <Card.Body>
                                    <div className="d-flex align-items-center">
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-danger-subtle text-danger rounded-circle fs-3">
                                                <i className="ri-arrow-up-line"></i>
                                            </span>
                                        </div>
                                        <div className="flex-grow-1 ms-3">
                                            <p className="text-uppercase fw-semibold fs-12 text-muted mb-1">Stok Çıkış</p>
                                            <h4 className="mb-0 text-danger">{movementStats.out_movements.toLocaleString()}</h4>
                                            <small className="text-muted">{formatCurrency(movementStats.total_out_value)}</small>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xl={3} md={6}>
                            <Card className="card-height-100">
                                <Card.Body>
                                    <div className="d-flex align-items-center">
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-info-subtle text-info rounded-circle fs-3">
                                                <i className="ri-funds-line"></i>
                                            </span>
                                        </div>
                                        <div className="flex-grow-1 ms-3">
                                            <p className="text-uppercase fw-semibold fs-12 text-muted mb-1">Net Hareket</p>
                                            <h4 className={`mb-0 ${movementStats.net_movement_value >= 0 ? 'text-success' : 'text-danger'}`}>
                                                {formatCurrency(Math.abs(movementStats.net_movement_value))}
                                            </h4>
                                            <small className="text-muted">
                                                {movementStats.net_movement_value >= 0 ? 'Pozitif' : 'Negatif'}
                                            </small>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    <Card>
                        <Card.Body>
                            {/* Filters */}
                            <Row className="mb-4">
                                <Col lg={3}>
                                    <Form onSubmit={handleSearch}>
                                        <InputGroup>
                                            <Form.Control
                                                type="text"
                                                placeholder="Ürün adı, kodu veya not ara..."
                                                value={localFilters.search || ''}
                                                onChange={(e) => setLocalFilters({ ...localFilters, search: e.target.value })}
                                            />
                                            <Button type="submit" variant="primary">
                                                <i className="ri-search-line"></i>
                                            </Button>
                                        </InputGroup>
                                    </Form>
                                </Col>
                                <Col lg={2}>
                                    <Form.Select
                                        value={localFilters.product_id || ''}
                                        onChange={(e) => handleFilterChange('product_id', e.target.value)}
                                    >
                                        <option value="">Tüm Ürünler</option>
                                        {products.map(product => (
                                            <option key={product.id} value={product.id}>
                                                {product.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Col>
                                <Col lg={2}>
                                    <Form.Select
                                        value={localFilters.movement_type || ''}
                                        onChange={(e) => handleFilterChange('movement_type', e.target.value)}
                                    >
                                        <option value="">Tüm Hareket Türleri</option>
                                        <option value="in">Stok Giriş</option>
                                        <option value="out">Stok Çıkış</option>
                                        <option value="adjustment">Stok Düzeltme</option>
                                    </Form.Select>
                                </Col>
                                <Col lg={2}>
                                    <Form.Select
                                        value={localFilters.user_id || ''}
                                        onChange={(e) => handleFilterChange('user_id', e.target.value)}
                                    >
                                        <option value="">Tüm Kullanıcılar</option>
                                        {users.map(user => (
                                            <option key={user.id} value={user.id}>
                                                {user.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Col>
                                <Col lg={3}>
                                    <div className="d-flex gap-2">
                                        <Form.Control
                                            type="date"
                                            value={localFilters.date_from || ''}
                                            onChange={(e) => handleFilterChange('date_from', e.target.value)}
                                        />
                                        <Form.Control
                                            type="date"
                                            value={localFilters.date_to || ''}
                                            onChange={(e) => handleFilterChange('date_to', e.target.value)}
                                        />
                                    </div>
                                </Col>
                            </Row>

                            <Row className="mb-4">
                                <Col lg={3}>
                                    <Form.Select
                                        value={localFilters.reference_type || ''}
                                        onChange={(e) => handleFilterChange('reference_type', e.target.value)}
                                    >
                                        <option value="">Tüm Referans Türleri</option>
                                        <option value="purchase_order">Satın Alma Siparişi</option>
                                        <option value="sales_order">Satış Siparişi</option>
                                        <option value="transfer">Transfer</option>
                                        <option value="adjustment">Stok Düzeltme</option>
                                        <option value="manual_adjustment">Manuel Düzeltme</option>
                                        <option value="bulk_adjustment">Toplu Düzeltme</option>
                                    </Form.Select>
                                </Col>
                                <Col lg={3}>
                                    <div className="d-flex gap-2">
                                        <Form.Control
                                            type="number"
                                            placeholder="Min. miktar"
                                            value={localFilters.quantity_min || ''}
                                            onChange={(e) => handleFilterChange('quantity_min', e.target.value)}
                                        />
                                        <Form.Control
                                            type="number"
                                            placeholder="Max. miktar"
                                            value={localFilters.quantity_max || ''}
                                            onChange={(e) => handleFilterChange('quantity_max', e.target.value)}
                                        />
                                    </div>
                                </Col>
                                <Col lg={6}>
                                    <div className="d-flex justify-content-end">
                                        <Button 
                                            variant="outline-secondary" 
                                            onClick={clearFilters}
                                            className="me-2"
                                        >
                                            <i className="ri-refresh-line me-1"></i>
                                            Filtreleri Temizle
                                        </Button>
                                    </div>
                                </Col>
                            </Row>

                            <div className="table-responsive">
                                <Table hover className="table-centered align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th style={{ width: '50px' }}>Tip</th>
                                            <th>Ürün</th>
                                            <th 
                                                className="cursor-pointer"
                                                onClick={() => handleSort('movement_type')}
                                            >
                                                Hareket Türü
                                                {getSortIcon('movement_type')}
                                            </th>
                                            <th 
                                                className="text-end cursor-pointer"
                                                onClick={() => handleSort('quantity')}
                                            >
                                                Miktar
                                                {getSortIcon('quantity')}
                                            </th>
                                            <th 
                                                className="text-end cursor-pointer"
                                                onClick={() => handleSort('unit_cost')}
                                            >
                                                Birim Fiyat
                                                {getSortIcon('unit_cost')}
                                            </th>
                                            <th 
                                                className="text-end cursor-pointer"
                                                onClick={() => handleSort('total_cost')}
                                            >
                                                Toplam Tutar
                                                {getSortIcon('total_cost')}
                                            </th>
                                            <th>Referans</th>
                                            <th>Kullanıcı</th>
                                            <th 
                                                className="cursor-pointer"
                                                onClick={() => handleSort('created_at')}
                                            >
                                                Tarih
                                                {getSortIcon('created_at')}
                                            </th>
                                            <th>İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {movements.data.map(movement => (
                                            <tr key={movement.id}>
                                                <td className="text-center">
                                                    {getMovementIcon(movement.movement_type)}
                                                </td>
                                                <td>
                                                    <div>
                                                        <div className="fw-medium">{movement.product.name}</div>
                                                        <small className="text-muted">
                                                            {movement.product.code} | SKU: {movement.product.sku}
                                                        </small>
                                                    </div>
                                                </td>
                                                <td>
                                                    <Badge bg={movement.movement_type_color}>
                                                        {movement.movement_type_text}
                                                    </Badge>
                                                </td>
                                                <td className="text-end fw-medium">
                                                    {movement.formatted_quantity}
                                                </td>
                                                <td className="text-end">
                                                    {formatCurrency(movement.unit_cost)}
                                                </td>
                                                <td className="text-end fw-medium">
                                                    {formatCurrency(movement.total_cost)}
                                                </td>
                                                <td>
                                                    <small className="text-muted">
                                                        {getReferenceText(movement)}
                                                    </small>
                                                </td>
                                                <td>
                                                    {movement.creator ? (
                                                        <div>
                                                            <div className="fw-medium">{movement.creator.name}</div>
                                                            <small className="text-muted">{movement.creator.email}</small>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted">-</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <small className="text-muted">
                                                        {formatDate(movement.created_at)}
                                                    </small>
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-1">
                                                        <OverlayTrigger
                                                            placement="top"
                                                            overlay={<Tooltip>Detayları Görüntüle</Tooltip>}
                                                        >
                                                            <Button 
                                                                size="sm" 
                                                                variant="light"
                                                                onClick={() => {
                                                                    setSelectedMovement(movement);
                                                                    setShowMovementModal(true);
                                                                }}
                                                            >
                                                                <i className="ri-eye-line"></i>
                                                            </Button>
                                                        </OverlayTrigger>
                                                        
                                                        <OverlayTrigger
                                                            placement="top"
                                                            overlay={<Tooltip>Ürün Detayı</Tooltip>}
                                                        >
                                                            <Link 
                                                                href={route('products.show', movement.product.id)}
                                                                className="btn btn-sm btn-primary"
                                                            >
                                                                <i className="ri-box-line"></i>
                                                            </Link>
                                                        </OverlayTrigger>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>

                            {movements.data.length === 0 && (
                                <div className="text-center py-5">
                                    <i className="ri-exchange-line fs-1 text-muted"></i>
                                    <p className="text-muted mt-3">Henüz stok hareketi bulunmuyor.</p>
                                </div>
                            )}

                            {/* Pagination */}
                            {movements.last_page && movements.last_page > 1 && (
                                <div className="d-flex justify-content-between align-items-center mt-4">
                                    <div>
                                        Toplam {movements.total || 0} hareketten {movements.from || 0}-{movements.to || 0} arası gösteriliyor
                                    </div>
                                    <nav>
                                        <ul className="pagination mb-0">
                                            {movements.links && movements.links.map((link: any, index: number) => (
                                                <li 
                                                    key={index} 
                                                    className={`page-item ${link.active ? 'active' : ''} ${!link.url ? 'disabled' : ''}`}
                                                >
                                                    {link.url ? (
                                                        <Link 
                                                            className="page-link" 
                                                            href={link.url}
                                                            dangerouslySetInnerHTML={{ __html: link.label || '' }}
                                                        />
                                                    ) : (
                                                        <span 
                                                            className="page-link"
                                                            dangerouslySetInnerHTML={{ __html: link.label || '' }}
                                                        />
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </nav>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </div>
            </div>

            {/* Movement Detail Modal */}
            <Modal show={showMovementModal} onHide={() => setShowMovementModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Stok Hareket Detayı</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedMovement && (
                        <div>
                            <Row className="mb-3">
                                <Col md={6}>
                                    <h6 className="text-muted mb-2">Hareket Bilgileri</h6>
                                    <div className="d-flex align-items-center mb-2">
                                        {getMovementIcon(selectedMovement.movement_type)}
                                        <Badge bg={selectedMovement.movement_type_color} className="ms-2">
                                            {selectedMovement.movement_type_text}
                                        </Badge>
                                    </div>
                                    <p><strong>Tarih:</strong> {formatDate(selectedMovement.created_at)}</p>
                                    <p><strong>Miktar:</strong> {selectedMovement.formatted_quantity}</p>
                                    <p><strong>Birim Fiyat:</strong> {formatCurrency(selectedMovement.unit_cost)}</p>
                                    <p><strong>Toplam Tutar:</strong> {formatCurrency(selectedMovement.total_cost)}</p>
                                </Col>
                                <Col md={6}>
                                    <h6 className="text-muted mb-2">Ürün Bilgileri</h6>
                                    <p><strong>Ürün Adı:</strong> {selectedMovement.product.name}</p>
                                    <p><strong>Ürün Kodu:</strong> {selectedMovement.product.code}</p>
                                    <p><strong>SKU:</strong> {selectedMovement.product.sku}</p>
                                    <p><strong>Referans:</strong> {getReferenceText(selectedMovement)}</p>
                                </Col>
                            </Row>
                            
                            {selectedMovement.creator && (
                                <Row className="mb-3">
                                    <Col>
                                        <h6 className="text-muted mb-2">Kullanıcı Bilgileri</h6>
                                        <p><strong>Kullanıcı:</strong> {selectedMovement.creator.name}</p>
                                        <p><strong>E-posta:</strong> {selectedMovement.creator.email}</p>
                                    </Col>
                                </Row>
                            )}
                            
                            {selectedMovement.notes && (
                                <Row>
                                    <Col>
                                        <h6 className="text-muted mb-2">Notlar</h6>
                                        <div className="bg-light p-3 rounded">
                                            {selectedMovement.notes}
                                        </div>
                                    </Col>
                                </Row>
                            )}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowMovementModal(false)}>
                        Kapat
                    </Button>
                    {selectedMovement && (
                        <Link 
                            href={route('products.show', selectedMovement.product.id)}
                            className="btn btn-primary"
                        >
                            <i className="ri-box-line me-1"></i>
                            Ürün Detayı
                        </Link>
                    )}
                </Modal.Footer>
            </Modal>
        </Layout>
    );
}