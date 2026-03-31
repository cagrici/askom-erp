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

interface Product {
    id: number;
    name: string;
    code: string;
}

interface StockAdjustmentItem {
    id: number;
    product: Product;
    current_quantity: number;
    adjusted_quantity: number;
    difference_quantity: number;
    unit_cost: number;
    total_cost: number;
}

interface StockAdjustment {
    id: number;
    adjustment_number: string;
    title: string;
    description?: string;
    adjustment_type: string;
    adjustment_type_text: string;
    status: string;
    status_text: string;
    status_color: string;
    total_items: number;
    total_value: number;
    reason_code?: string;
    notes?: string;
    created_at: string;
    approved_at?: string;
    creator?: User;
    approver?: User;
    items?: StockAdjustmentItem[];
    can_be_approved: boolean;
    can_be_rejected: boolean;
    can_be_completed: boolean;
    can_be_edited: boolean;
    can_be_deleted: boolean;
}

interface AdjustmentStats {
    total_adjustments: number;
    pending_adjustments: number;
    approved_adjustments: number;
    completed_adjustments: number;
    rejected_adjustments: number;
    total_adjustment_value: number;
}

interface Props {
    adjustments: {
        data: StockAdjustment[];
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
        adjustment_type?: string;
        user_id?: number;
        date_from?: string;
        date_to?: string;
        sort_field?: string;
        sort_direction?: string;
    };
    users: User[];
    adjustmentStats: AdjustmentStats;
}

export default function StockAdjustments({ adjustments, filters, users, adjustmentStats }: Props) {
    const { t } = useTranslation();
    const [localFilters, setLocalFilters] = useState(filters);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [adjustmentToDelete, setAdjustmentToDelete] = useState<StockAdjustment | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('stock.adjustments'), { ...filters, ...localFilters }, { preserveState: true });
    };

    const handleFilterChange = (key: string, value: any) => {
        const newFilters = { ...filters };
        
        if (value === null || value === undefined || value === '') {
            delete newFilters[key];
        } else {
            newFilters[key] = value;
        }
        
        setLocalFilters(newFilters);
        router.get(route('stock.adjustments'), newFilters, { preserveState: true });
    };

    const handleSort = (field: string) => {
        const currentSortDirection = filters.sort_field === field && filters.sort_direction === 'asc' ? 'desc' : 'asc';
        
        router.get(route('stock.adjustments'), {
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

    const formatCurrency = (amount: number) => {
        return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
    };

    const handleApprove = async (adjustment: StockAdjustment) => {
        if (confirm(`${adjustment.adjustment_number} numaralı düzeltmeyi onaylamak istediğinizden emin misiniz?`)) {
            try {
                await router.post(route('stock.adjustments.approve', adjustment.id));
            } catch (error) {
                console.error('Approval error:', error);
            }
        }
    };

    const handleReject = async (adjustment: StockAdjustment) => {
        if (confirm(`${adjustment.adjustment_number} numaralı düzeltmeyi reddetmek istediğinizden emin misiniz?`)) {
            try {
                await router.post(route('stock.adjustments.reject', adjustment.id));
            } catch (error) {
                console.error('Rejection error:', error);
            }
        }
    };

    const handleComplete = async (adjustment: StockAdjustment) => {
        if (confirm(`${adjustment.adjustment_number} numaralı düzeltmeyi tamamlamak ve stok hareketlerini uygulamak istediğinizden emin misiniz?`)) {
            try {
                await router.post(route('stock.adjustments.complete', adjustment.id));
            } catch (error) {
                console.error('Completion error:', error);
            }
        }
    };

    const handleDelete = async () => {
        if (!adjustmentToDelete) return;

        try {
            await router.delete(route('stock.adjustments.destroy', adjustmentToDelete.id));
            setShowDeleteModal(false);
            setAdjustmentToDelete(null);
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const clearFilters = () => {
        setLocalFilters({});
        router.get(route('stock.adjustments'), {}, { preserveState: true });
    };

    const getAdjustmentTypeIcon = (type: string) => {
        switch (type) {
            case 'increase':
                return <i className="ri-arrow-up-line text-success"></i>;
            case 'decrease':
                return <i className="ri-arrow-down-line text-danger"></i>;
            case 'count_adjustment':
                return <i className="ri-calculator-line text-info"></i>;
            case 'damage':
                return <i className="ri-shield-cross-line text-warning"></i>;
            case 'expiry':
                return <i className="ri-time-line text-secondary"></i>;
            case 'transfer_correction':
                return <i className="ri-exchange-line text-primary"></i>;
            default:
                return <i className="ri-more-line text-muted"></i>;
        }
    };

    return (
        <Layout>
            <Head title="Stok Düzeltmeleri" />

            <div className="page-content">
                <div className="container-fluid">
                    <Row className="mb-3">
                        <Col>
                            <div className="page-title-box d-flex align-items-center justify-content-between">
                                <div>
                                    <h4 className="mb-0">Stok Düzeltmeleri</h4>
                                    <div className="page-title-right">
                                        <ol className="breadcrumb m-0">
                                            <li className="breadcrumb-item">
                                                <Link href={route('stock.index')}>Stok Yönetimi</Link>
                                            </li>
                                            <li className="breadcrumb-item active">Stok Düzeltmeleri</li>
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
                                        href={route('stock.adjustments.create')} 
                                        className="btn btn-primary"
                                    >
                                        <i className="ri-add-line me-1"></i>
                                        Yeni Düzeltme
                                    </Link>
                                </div>
                            </div>
                        </Col>
                    </Row>

                    {/* Adjustment Statistics Cards */}
                    <Row className="mb-4">
                        <Col xl={2} md={4}>
                            <Card className="card-height-100">
                                <Card.Body>
                                    <div className="d-flex align-items-center">
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-primary-subtle text-primary rounded-circle fs-3">
                                                <i className="ri-file-edit-line"></i>
                                            </span>
                                        </div>
                                        <div className="flex-grow-1 ms-3">
                                            <p className="text-uppercase fw-semibold fs-12 text-muted mb-1">Toplam</p>
                                            <h4 className="mb-0">{adjustmentStats.total_adjustments}</h4>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xl={2} md={4}>
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
                                            <h4 className="mb-0 text-warning">{adjustmentStats.pending_adjustments}</h4>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xl={2} md={4}>
                            <Card className="card-height-100">
                                <Card.Body>
                                    <div className="d-flex align-items-center">
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-info-subtle text-info rounded-circle fs-3">
                                                <i className="ri-check-line"></i>
                                            </span>
                                        </div>
                                        <div className="flex-grow-1 ms-3">
                                            <p className="text-uppercase fw-semibold fs-12 text-muted mb-1">Onaylı</p>
                                            <h4 className="mb-0 text-info">{adjustmentStats.approved_adjustments}</h4>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xl={2} md={4}>
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
                                            <h4 className="mb-0 text-success">{adjustmentStats.completed_adjustments}</h4>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xl={2} md={4}>
                            <Card className="card-height-100">
                                <Card.Body>
                                    <div className="d-flex align-items-center">
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-danger-subtle text-danger rounded-circle fs-3">
                                                <i className="ri-close-line"></i>
                                            </span>
                                        </div>
                                        <div className="flex-grow-1 ms-3">
                                            <p className="text-uppercase fw-semibold fs-12 text-muted mb-1">Reddedildi</p>
                                            <h4 className="mb-0 text-danger">{adjustmentStats.rejected_adjustments}</h4>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xl={2} md={4}>
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
                                            <h4 className="mb-0">{formatCurrency(adjustmentStats.total_adjustment_value)}</h4>
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
                                                placeholder="Düzeltme no, başlık ara..."
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
                                        <option value="rejected">Reddedildi</option>
                                        <option value="completed">Tamamlandı</option>
                                        <option value="cancelled">İptal Edildi</option>
                                    </Form.Select>
                                </Col>
                                <Col lg={2}>
                                    <Form.Select
                                        value={localFilters.adjustment_type || ''}
                                        onChange={(e) => handleFilterChange('adjustment_type', e.target.value)}
                                    >
                                        <option value="">Tüm Türler</option>
                                        <option value="increase">Stok Artırma</option>
                                        <option value="decrease">Stok Azaltma</option>
                                        <option value="count_adjustment">Sayım Düzeltmesi</option>
                                        <option value="damage">Hasar/Zayi</option>
                                        <option value="expiry">Son Kullanma Tarihi</option>
                                        <option value="transfer_correction">Transfer Düzeltmesi</option>
                                        <option value="other">Diğer</option>
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
                                        <Button 
                                            variant="outline-secondary" 
                                            onClick={clearFilters}
                                            title="Filtreleri Temizle"
                                        >
                                            <i className="ri-refresh-line"></i>
                                        </Button>
                                    </div>
                                </Col>
                            </Row>

                            <div className="table-responsive">
                                <Table hover className="table-centered align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th style={{ width: '50px' }}>Tip</th>
                                            <th 
                                                className="cursor-pointer"
                                                onClick={() => handleSort('adjustment_number')}
                                            >
                                                Düzeltme No
                                                {getSortIcon('adjustment_number')}
                                            </th>
                                            <th 
                                                className="cursor-pointer"
                                                onClick={() => handleSort('title')}
                                            >
                                                Başlık
                                                {getSortIcon('title')}
                                            </th>
                                            <th>Düzeltme Türü</th>
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
                                            <th>Oluşturan</th>
                                            <th 
                                                className="cursor-pointer"
                                                onClick={() => handleSort('created_at')}
                                            >
                                                Tarih
                                                {getSortIcon('created_at')}
                                            </th>
                                            <th className="text-center">İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {adjustments.data.map(adjustment => (
                                            <tr key={adjustment.id}>
                                                <td className="text-center">
                                                    {getAdjustmentTypeIcon(adjustment.adjustment_type)}
                                                </td>
                                                <td className="fw-medium">
                                                    <Link 
                                                        href={route('stock.adjustments.show', adjustment.id)}
                                                        className="text-decoration-none"
                                                    >
                                                        {adjustment.adjustment_number}
                                                    </Link>
                                                </td>
                                                <td>
                                                    <div>
                                                        <div className="fw-medium">{adjustment.title}</div>
                                                        {adjustment.description && (
                                                            <small className="text-muted">{adjustment.description}</small>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>{adjustment.adjustment_type_text}</td>
                                                <td className="text-center">
                                                    <Badge bg={adjustment.status_color}>
                                                        {adjustment.status_text}
                                                    </Badge>
                                                </td>
                                                <td className="text-center">
                                                    <Badge bg="secondary" className="fs-6">
                                                        {adjustment.total_items}
                                                    </Badge>
                                                </td>
                                                <td className="text-end fw-medium">
                                                    {formatCurrency(adjustment.total_value)}
                                                </td>
                                                <td>
                                                    {adjustment.creator ? (
                                                        <div>
                                                            <div className="fw-medium">{adjustment.creator.name}</div>
                                                            <small className="text-muted">{adjustment.creator.email}</small>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted">-</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <small className="text-muted">
                                                        {formatDate(adjustment.created_at)}
                                                    </small>
                                                </td>
                                                <td>
                                                    <div className="d-flex justify-content-center gap-1">
                                                        <OverlayTrigger
                                                            placement="top"
                                                            overlay={<Tooltip>Detayları Görüntüle</Tooltip>}
                                                        >
                                                            <Link 
                                                                href={route('stock.adjustments.show', adjustment.id)}
                                                                className="btn btn-sm btn-light"
                                                            >
                                                                <i className="ri-eye-line"></i>
                                                            </Link>
                                                        </OverlayTrigger>

                                                        {adjustment.can_be_approved && (
                                                            <OverlayTrigger
                                                                placement="top"
                                                                overlay={<Tooltip>Onayla</Tooltip>}
                                                            >
                                                                <Button 
                                                                    size="sm" 
                                                                    variant="success"
                                                                    onClick={() => handleApprove(adjustment)}
                                                                >
                                                                    <i className="ri-check-line"></i>
                                                                </Button>
                                                            </OverlayTrigger>
                                                        )}

                                                        {adjustment.can_be_rejected && (
                                                            <OverlayTrigger
                                                                placement="top"
                                                                overlay={<Tooltip>Reddet</Tooltip>}
                                                            >
                                                                <Button 
                                                                    size="sm" 
                                                                    variant="danger"
                                                                    onClick={() => handleReject(adjustment)}
                                                                >
                                                                    <i className="ri-close-line"></i>
                                                                </Button>
                                                            </OverlayTrigger>
                                                        )}

                                                        {adjustment.can_be_completed && (
                                                            <OverlayTrigger
                                                                placement="top"
                                                                overlay={<Tooltip>Tamamla</Tooltip>}
                                                            >
                                                                <Button 
                                                                    size="sm" 
                                                                    variant="primary"
                                                                    onClick={() => handleComplete(adjustment)}
                                                                >
                                                                    <i className="ri-check-double-line"></i>
                                                                </Button>
                                                            </OverlayTrigger>
                                                        )}

                                                        {adjustment.can_be_deleted && (
                                                            <OverlayTrigger
                                                                placement="top"
                                                                overlay={<Tooltip>Sil</Tooltip>}
                                                            >
                                                                <Button 
                                                                    size="sm" 
                                                                    variant="outline-danger"
                                                                    onClick={() => {
                                                                        setAdjustmentToDelete(adjustment);
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

                            {adjustments.data.length === 0 && (
                                <div className="text-center py-5">
                                    <i className="ri-file-edit-line fs-1 text-muted"></i>
                                    <p className="text-muted mt-3">Henüz stok düzeltmesi bulunmuyor.</p>
                                    <Link 
                                        href={route('stock.adjustments.create')} 
                                        className="btn btn-primary"
                                    >
                                        <i className="ri-add-line me-1"></i>
                                        İlk Düzeltmeyi Oluştur
                                    </Link>
                                </div>
                            )}

                            {/* Pagination */}
                            {adjustments.last_page && adjustments.last_page > 1 && (
                                <div className="d-flex justify-content-between align-items-center mt-4">
                                    <div>
                                        Toplam {adjustments.total || 0} düzeltmeden {adjustments.from || 0}-{adjustments.to || 0} arası gösteriliyor
                                    </div>
                                    <nav>
                                        <ul className="pagination mb-0">
                                            {adjustments.links && adjustments.links.map((link: any, index: number) => (
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
                    <Modal.Title>Düzeltmeyi Sil</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>
                        <strong>{adjustmentToDelete?.adjustment_number}</strong> numaralı stok düzeltmesini silmek istediğinizden emin misiniz?
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