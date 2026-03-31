import React, { useState } from 'react';
import Layout from '@/Layouts';
import { Head, Link, router } from '@inertiajs/react';
import { Card, Table, Button, Form, Row, Col, InputGroup, Badge, Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface User {
    id: number;
    name: string;
    email: string;
}

interface Location {
    id: number;
    name: string;
    code: string;
    address?: string;
}

interface Product {
    id: number;
    name: string;
    code: string;
}

interface StockTransferItem {
    id: number;
    product: Product;
    quantity: number;
    transferred_quantity: number;
    received_quantity: number;
    unit_cost: number;
    total_cost: number;
}

interface StockTransfer {
    id: number;
    transfer_number: string;
    title: string;
    description?: string;
    from_location: Location;
    to_location: Location;
    transfer_type: string;
    transfer_type_text: string;
    status: string;
    status_text: string;
    status_color: string;
    priority: string;
    priority_text: string;
    priority_color: string;
    total_items: number;
    total_value: number;
    expected_date?: string;
    shipped_date?: string;
    received_date?: string;
    tracking_number?: string;
    carrier?: string;
    notes?: string;
    created_at: string;
    requester?: User;
    approver?: User;
    shipper?: User;
    receiver?: User;
    items?: StockTransferItem[];
    can_be_approved: boolean;
    can_be_shipped: boolean;
    can_be_received: boolean;
    can_be_cancelled: boolean;
    can_be_edited: boolean;
    can_be_deleted: boolean;
    is_completed: boolean;
    is_in_transit: boolean;
}

interface TransferStats {
    total_transfers: number;
    pending_transfers: number;
    approved_transfers: number;
    shipped_transfers: number;
    received_transfers: number;
    completed_transfers: number;
    cancelled_transfers: number;
    in_transit_transfers: number;
    total_transfer_value: number;
}

interface Props {
    transfers: {
        data: StockTransfer[];
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
        status?: string;
        transfer_type?: string;
        from_location_id?: number;
        to_location_id?: number;
        priority?: string;
        user_id?: number;
        date_from?: string;
        date_to?: string;
        sort_field?: string;
        sort_direction?: string;
    };
    locations: Location[];
    users: User[];
    transferStats: TransferStats;
}

export default function StockTransfers({ transfers, filters, locations, users, transferStats }: Props) {
    const { t } = useTranslation();
    const [localFilters, setLocalFilters] = useState(filters);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [transferToDelete, setTransferToDelete] = useState<StockTransfer | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('stock.transfers'), { ...filters, ...localFilters }, { preserveState: true });
    };

    const handleFilterChange = (key: string, value: any) => {
        const newFilters = { ...filters };
        
        if (value === null || value === undefined || value === '') {
            delete newFilters[key];
        } else {
            newFilters[key] = value;
        }
        
        setLocalFilters(newFilters);
        router.get(route('stock.transfers'), newFilters, { preserveState: true });
    };

    const handleSort = (field: string) => {
        const currentSortDirection = filters.sort_field === field && filters.sort_direction === 'asc' ? 'desc' : 'asc';
        
        router.get(route('stock.transfers'), {
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

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('tr-TR');
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('tr-TR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount: number) => {
        return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
    };

    const handleApprove = async (transfer: StockTransfer) => {
        if (confirm(`${transfer.transfer_number} numaralı transferi onaylamak istediğinizden emin misiniz?`)) {
            try {
                await router.post(route('stock.transfers.approve', transfer.id));
            } catch (error) {
                console.error('Approval error:', error);
            }
        }
    };

    const handleCancel = async (transfer: StockTransfer) => {
        const reason = prompt(`${transfer.transfer_number} numaralı transferi iptal etme sebebini girin:`);
        if (reason !== null) {
            try {
                await router.post(route('stock.transfers.cancel', transfer.id), { reason });
            } catch (error) {
                console.error('Cancellation error:', error);
            }
        }
    };

    const handleDelete = async () => {
        if (!transferToDelete) return;

        try {
            await router.delete(route('stock.transfers.destroy', transferToDelete.id));
            setShowDeleteModal(false);
            setTransferToDelete(null);
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const clearFilters = () => {
        setLocalFilters({});
        router.get(route('stock.transfers'), {}, { preserveState: true });
    };

    const getTransferTypeIcon = (type: string) => {
        switch (type) {
            case 'internal':
                return <i className="ri-shuffle-line text-primary"></i>;
            case 'external':
                return <i className="ri-external-link-line text-info"></i>;
            case 'warehouse_to_store':
                return <i className="ri-arrow-right-line text-success"></i>;
            case 'store_to_warehouse':
                return <i className="ri-arrow-left-line text-warning"></i>;
            case 'store_to_store':
                return <i className="ri-exchange-line text-secondary"></i>;
            case 'emergency':
                return <i className="ri-alarm-warning-line text-danger"></i>;
            case 'return':
                return <i className="ri-reply-line text-info"></i>;
            default:
                return <i className="ri-more-line text-muted"></i>;
        }
    };

    return (
        <Layout>
            <Head title="Stok Transferleri" />

            <div className="page-content">
                <div className="container-fluid">
                    <Row className="mb-3">
                        <Col>
                            <div className="page-title-box d-flex align-items-center justify-content-between">
                                <div>
                                    <h4 className="mb-0">Stok Transferleri</h4>
                                    <div className="page-title-right">
                                        <ol className="breadcrumb m-0">
                                            <li className="breadcrumb-item">
                                                <Link href={route('stock.index')}>Stok Yönetimi</Link>
                                            </li>
                                            <li className="breadcrumb-item active">Stok Transferleri</li>
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
                                    <Link 
                                        href={route('stock.transfers.create')} 
                                        className="btn btn-primary"
                                    >
                                        <i className="ri-add-line me-1"></i>
                                        Yeni Transfer
                                    </Link>
                                </div>
                            </div>
                        </Col>
                    </Row>

                    {/* Transfer Statistics Cards */}
                    <Row className="mb-4">
                        <Col xl={2} md={3}>
                            <Card className="card-height-100">
                                <Card.Body>
                                    <div className="d-flex align-items-center">
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-primary-subtle text-primary rounded-circle fs-3">
                                                <i className="ri-truck-line"></i>
                                            </span>
                                        </div>
                                        <div className="flex-grow-1 ms-3">
                                            <p className="text-uppercase fw-semibold fs-12 text-muted mb-1">Toplam</p>
                                            <h4 className="mb-0">{transferStats.total_transfers}</h4>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xl={2} md={3}>
                            <Card className="card-height-100">
                                <Card.Body>
                                    <div className="d-flex align-items-center">
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-warning-subtle text-warning rounded-circle fs-3">
                                                <i className="ri-time-line"></i>
                                            </span>
                                        </div>
                                        <div className="flex-grow-1 ms-3">
                                            <p className="text-uppercase fw-semibold fs-12 text-muted mb-1">Beklemede</p>
                                            <h4 className="mb-0 text-warning">{transferStats.pending_transfers}</h4>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xl={2} md={3}>
                            <Card className="card-height-100">
                                <Card.Body>
                                    <div className="d-flex align-items-center">
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-info-subtle text-info rounded-circle fs-3">
                                                <i className="ri-ship-line"></i>
                                            </span>
                                        </div>
                                        <div className="flex-grow-1 ms-3">
                                            <p className="text-uppercase fw-semibold fs-12 text-muted mb-1">Yolda</p>
                                            <h4 className="mb-0 text-info">{transferStats.in_transit_transfers}</h4>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xl={2} md={3}>
                            <Card className="card-height-100">
                                <Card.Body>
                                    <div className="d-flex align-items-center">
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-success-subtle text-success rounded-circle fs-3">
                                                <i className="ri-check-double-line"></i>
                                            </span>
                                        </div>
                                        <div className="flex-grow-1 ms-3">
                                            <p className="text-uppercase fw-semibold fs-12 text-muted mb-1">Tamamlandı</p>
                                            <h4 className="mb-0 text-success">{transferStats.completed_transfers}</h4>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xl={2} md={3}>
                            <Card className="card-height-100">
                                <Card.Body>
                                    <div className="d-flex align-items-center">
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-danger-subtle text-danger rounded-circle fs-3">
                                                <i className="ri-close-line"></i>
                                            </span>
                                        </div>
                                        <div className="flex-grow-1 ms-3">
                                            <p className="text-uppercase fw-semibold fs-12 text-muted mb-1">İptal</p>
                                            <h4 className="mb-0 text-danger">{transferStats.cancelled_transfers}</h4>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xl={2} md={3}>
                            <Card className="card-height-100">
                                <Card.Body>
                                    <div className="d-flex align-items-center">
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-secondary-subtle text-secondary rounded-circle fs-3">
                                                <i className="ri-money-dollar-circle-line"></i>
                                            </span>
                                        </div>
                                        <div className="flex-grow-1 ms-3">
                                            <p className="text-uppercase fw-semibold fs-12 text-muted mb-1">Toplam Değer</p>
                                            <h4 className="mb-0">{formatCurrency(transferStats.total_transfer_value)}</h4>
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
                                                placeholder="Transfer no, başlık, takip no ara..."
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
                                        value={localFilters.status || ''}
                                        onChange={(e) => handleFilterChange('status', e.target.value)}
                                    >
                                        <option value="">Tüm Durumlar</option>
                                        <option value="pending">Beklemede</option>
                                        <option value="approved">Onaylı</option>
                                        <option value="shipped">Gönderildi</option>
                                        <option value="received">Teslim Alındı</option>
                                        <option value="completed">Tamamlandı</option>
                                        <option value="cancelled">İptal Edildi</option>
                                    </Form.Select>
                                </Col>
                                <Col lg={2}>
                                    <Form.Select
                                        value={localFilters.transfer_type || ''}
                                        onChange={(e) => handleFilterChange('transfer_type', e.target.value)}
                                    >
                                        <option value="">Tüm Türler</option>
                                        <option value="internal">İç Transfer</option>
                                        <option value="external">Dış Transfer</option>
                                        <option value="warehouse_to_store">Depo → Mağaza</option>
                                        <option value="store_to_warehouse">Mağaza → Depo</option>
                                        <option value="store_to_store">Mağaza → Mağaza</option>
                                        <option value="emergency">Acil Transfer</option>
                                        <option value="return">İade Transfer</option>
                                    </Form.Select>
                                </Col>
                                <Col lg={2}>
                                    <Form.Select
                                        value={localFilters.priority || ''}
                                        onChange={(e) => handleFilterChange('priority', e.target.value)}
                                    >
                                        <option value="">Tüm Öncelikler</option>
                                        <option value="low">Düşük</option>
                                        <option value="normal">Normal</option>
                                        <option value="high">Yüksek</option>
                                        <option value="urgent">Acil</option>
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
                                        value={localFilters.from_location_id || ''}
                                        onChange={(e) => handleFilterChange('from_location_id', e.target.value)}
                                    >
                                        <option value="">Kaynak Lokasyon</option>
                                        {locations.map(location => (
                                            <option key={location.id} value={location.id}>
                                                {location.name} ({location.code})
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Col>
                                <Col lg={3}>
                                    <Form.Select
                                        value={localFilters.to_location_id || ''}
                                        onChange={(e) => handleFilterChange('to_location_id', e.target.value)}
                                    >
                                        <option value="">Hedef Lokasyon</option>
                                        {locations.map(location => (
                                            <option key={location.id} value={location.id}>
                                                {location.name} ({location.code})
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Col>
                                <Col lg={3}>
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
                                    <Button 
                                        variant="outline-secondary" 
                                        onClick={clearFilters}
                                        className="w-100"
                                    >
                                        <i className="ri-refresh-line me-1"></i>
                                        Filtreleri Temizle
                                    </Button>
                                </Col>
                            </Row>

                            <div className="table-responsive">
                                <Table hover className="table-centered align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th style={{ width: '50px' }}>Tip</th>
                                            <th 
                                                className="cursor-pointer"
                                                onClick={() => handleSort('transfer_number')}
                                            >
                                                Transfer No
                                                {getSortIcon('transfer_number')}
                                            </th>
                                            <th 
                                                className="cursor-pointer"
                                                onClick={() => handleSort('title')}
                                            >
                                                Başlık
                                                {getSortIcon('title')}
                                            </th>
                                            <th>Kaynak → Hedef</th>
                                            <th>Transfer Türü</th>
                                            <th className="text-center">Öncelik</th>
                                            <th 
                                                className="text-center cursor-pointer"
                                                onClick={() => handleSort('status')}
                                            >
                                                Durum
                                                {getSortIcon('status')}
                                            </th>
                                            <th className="text-center">Ürün Sayısı</th>
                                            <th 
                                                className="text-end cursor-pointer"
                                                onClick={() => handleSort('total_value')}
                                            >
                                                Toplam Değer
                                                {getSortIcon('total_value')}
                                            </th>
                                            <th 
                                                className="cursor-pointer"
                                                onClick={() => handleSort('expected_date')}
                                            >
                                                Beklenen Tarih
                                                {getSortIcon('expected_date')}
                                            </th>
                                            <th className="text-center">İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transfers.data.map(transfer => (
                                            <tr key={transfer.id}>
                                                <td className="text-center">
                                                    {getTransferTypeIcon(transfer.transfer_type)}
                                                </td>
                                                <td className="fw-medium">
                                                    <Link 
                                                        href={route('stock.transfers.show', transfer.id)}
                                                        className="text-decoration-none"
                                                    >
                                                        {transfer.transfer_number}
                                                    </Link>
                                                </td>
                                                <td>
                                                    <div>
                                                        <div className="fw-medium">{transfer.title}</div>
                                                        {transfer.description && (
                                                            <small className="text-muted">{transfer.description}</small>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div>
                                                        <div className="fw-medium text-success">
                                                            <i className="ri-map-pin-line me-1"></i>
                                                            {transfer.from_location.name}
                                                        </div>
                                                        <div className="text-center text-muted my-1">
                                                            <i className="ri-arrow-down-line"></i>
                                                        </div>
                                                        <div className="fw-medium text-primary">
                                                            <i className="ri-map-pin-line me-1"></i>
                                                            {transfer.to_location.name}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{transfer.transfer_type_text}</td>
                                                <td className="text-center">
                                                    <Badge bg={transfer.priority_color}>
                                                        {transfer.priority_text}
                                                    </Badge>
                                                </td>
                                                <td className="text-center">
                                                    <Badge bg={transfer.status_color}>
                                                        {transfer.status_text}
                                                    </Badge>
                                                </td>
                                                <td className="text-center">
                                                    <Badge bg="secondary" className="fs-6">
                                                        {transfer.total_items}
                                                    </Badge>
                                                </td>
                                                <td className="text-end fw-medium">
                                                    {formatCurrency(transfer.total_value)}
                                                </td>
                                                <td>
                                                    <div>
                                                        <small className="text-muted">
                                                            {formatDate(transfer.expected_date)}
                                                        </small>
                                                        {transfer.tracking_number && (
                                                            <div>
                                                                <Badge bg="info" className="fs-7">
                                                                    {transfer.tracking_number}
                                                                </Badge>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="d-flex justify-content-center gap-1">
                                                        <OverlayTrigger
                                                            placement="top"
                                                            overlay={<Tooltip>Detayları Görüntüle</Tooltip>}
                                                        >
                                                            <Link 
                                                                href={route('stock.transfers.show', transfer.id)}
                                                                className="btn btn-sm btn-light"
                                                            >
                                                                <i className="ri-eye-line"></i>
                                                            </Link>
                                                        </OverlayTrigger>

                                                        {transfer.can_be_approved && (
                                                            <OverlayTrigger
                                                                placement="top"
                                                                overlay={<Tooltip>Onayla</Tooltip>}
                                                            >
                                                                <Button 
                                                                    size="sm" 
                                                                    variant="success"
                                                                    onClick={() => handleApprove(transfer)}
                                                                >
                                                                    <i className="ri-check-line"></i>
                                                                </Button>
                                                            </OverlayTrigger>
                                                        )}

                                                        {transfer.can_be_cancelled && (
                                                            <OverlayTrigger
                                                                placement="top"
                                                                overlay={<Tooltip>İptal Et</Tooltip>}
                                                            >
                                                                <Button 
                                                                    size="sm" 
                                                                    variant="warning"
                                                                    onClick={() => handleCancel(transfer)}
                                                                >
                                                                    <i className="ri-close-line"></i>
                                                                </Button>
                                                            </OverlayTrigger>
                                                        )}

                                                        {transfer.can_be_deleted && (
                                                            <OverlayTrigger
                                                                placement="top"
                                                                overlay={<Tooltip>Sil</Tooltip>}
                                                            >
                                                                <Button 
                                                                    size="sm" 
                                                                    variant="outline-danger"
                                                                    onClick={() => {
                                                                        setTransferToDelete(transfer);
                                                                        setShowDeleteModal(true);
                                                                    }}
                                                                >
                                                                    <i className="ri-delete-bin-line"></i>
                                                                </Button>
                                                            </OverlayTrigger>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>

                            {transfers.data.length === 0 && (
                                <div className="text-center py-5">
                                    <i className="ri-truck-line fs-1 text-muted"></i>
                                    <p className="text-muted mt-3">Henüz stok transferi bulunmuyor.</p>
                                    <Link 
                                        href={route('stock.transfers.create')} 
                                        className="btn btn-primary"
                                    >
                                        <i className="ri-add-line me-1"></i>
                                        İlk Transferi Oluştur
                                    </Link>
                                </div>
                            )}

                            {/* Pagination */}
                            {transfers.last_page && transfers.last_page > 1 && (
                                <div className="d-flex justify-content-between align-items-center mt-4">
                                    <div>
                                        Toplam {transfers.total || 0} transferden {transfers.from || 0}-{transfers.to || 0} arası gösteriliyor
                                    </div>
                                    <nav>
                                        <ul className="pagination mb-0">
                                            {transfers.links && transfers.links.map((link: any, index: number) => (
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

            {/* Delete Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Transferi Sil</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>
                        <strong>{transferToDelete?.transfer_number}</strong> numaralı stok transferini silmek istediğinizden emin misiniz?
                    </p>
                    <p className="text-danger mb-0">
                        <i className="ri-alert-line me-1"></i>
                        Bu işlem geri alınamaz!
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                        İptal
                    </Button>
                    <Button variant="danger" onClick={handleDelete}>
                        Sil
                    </Button>
                </Modal.Footer>
            </Modal>
        </Layout>
    );
}