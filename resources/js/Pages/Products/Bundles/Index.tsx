import React, { useState } from 'react';
import Layout from '@/Layouts';
import { Head, Link, router } from '@inertiajs/react';
import { Card, Table, Button, Form, Row, Col, InputGroup, Badge, Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface BundleItem {
    id: number;
    quantity: number;
    price_override?: number;
    product: {
        id: number;
        name: string;
        sku: string;
        price?: number;
    };
}

interface Bundle {
    id: number;
    name: string;
    description?: string;
    bundle_price?: number;
    discount_type: string;
    discount_value?: number;
    is_active: boolean;
    product: {
        id: number;
        name: string;
        sku: string;
    };
    bundle_items: BundleItem[];
    created_at: string;
}

interface Product {
    id: number;
    name: string;
}

interface Props {
    bundles: {
        data: Bundle[];
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
        is_active?: boolean;
    };
    products: Product[];
}

export default function BundleIndex({ bundles, filters, products }: Props) {
    const { t } = useTranslation();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [bundleToDelete, setBundleToDelete] = useState<Bundle | null>(null);
    const [localFilters, setLocalFilters] = useState(filters);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('product-bundles.index'), localFilters, { preserveState: true });
    };

    const handleFilterChange = (key: string, value: any) => {
        const newFilters = { ...localFilters, [key]: value };
        setLocalFilters(newFilters);
        router.get(route('product-bundles.index'), newFilters, { preserveState: true });
    };

    const handleDelete = async () => {
        if (!bundleToDelete) return;

        try {
            await router.delete(route('product-bundles.destroy', bundleToDelete.id));
            setShowDeleteModal(false);
            setBundleToDelete(null);
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const formatPrice = (price?: number) => {
        return price ? `₺${price.toLocaleString()}` : '-';
    };

    const calculateTotalPrice = (bundle: Bundle) => {
        return bundle.bundle_items.reduce((total, item) => {
            const itemPrice = item.price_override ?? item.product.price ?? 0;
            return total + (itemPrice * item.quantity);
        }, 0);
    };

    const calculateSavings = (bundle: Bundle) => {
        const totalPrice = calculateTotalPrice(bundle);
        const bundlePrice = bundle.bundle_price ?? 0;
        return totalPrice - bundlePrice;
    };

    return (
        <Layout>
            <Head title="Ürün Setleri" />

            <div className="page-content">
                <div className="container-fluid">
                    <Row className="mb-3">
                        <Col>
                            <div className="page-title-box d-flex align-items-center justify-content-between">
                                <h4 className="mb-0">Ürün Setleri</h4>
                                <div className="d-flex gap-2">
                                    <Link href={route('product-bundles.create')} className="btn btn-primary">
                                        <i className="ri-add-line me-1"></i>
                                        Yeni Set
                                    </Link>
                                </div>
                            </div>
                        </Col>
                    </Row>

                    <Card>
                        <Card.Body>
                            <Row className="mb-4">
                                <Col lg={5}>
                                    <Form onSubmit={handleSearch}>
                                        <InputGroup>
                                            <Form.Control
                                                type="text"
                                                placeholder="Set adı veya ürün ara..."
                                                value={localFilters.search || ''}
                                                onChange={(e) => setLocalFilters({ ...localFilters, search: e.target.value })}
                                            />
                                            <Button type="submit" variant="primary">
                                                <i className="ri-search-line"></i>
                                            </Button>
                                        </InputGroup>
                                    </Form>
                                </Col>
                                <Col lg={3}>
                                    <Form.Select
                                        value={localFilters.product_id || ''}
                                        onChange={(e) => handleFilterChange('product_id', e.target.value || undefined)}
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
                                        value={localFilters.is_active !== undefined && localFilters.is_active !== null ? localFilters.is_active.toString() : ''}
                                        onChange={(e) => handleFilterChange('is_active', e.target.value === '' ? undefined : e.target.value === 'true')}
                                    >
                                        <option value="">Tüm Durumlar</option>
                                        <option value="true">Aktif</option>
                                        <option value="false">Pasif</option>
                                    </Form.Select>
                                </Col>
                            </Row>

                            <div className="table-responsive">
                                <Table hover className="table-centered align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Set Bilgileri</th>
                                            <th>Ana Ürün</th>
                                            <th>Ürün Sayısı</th>
                                            <th className="text-center">Toplam Fiyat</th>
                                            <th className="text-center">Set Fiyatı</th>
                                            <th className="text-center">Tasarruf</th>
                                            <th className="text-center">Durum</th>
                                            <th className="text-center" style={{ width: '120px' }}>İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bundles.data.map(bundle => {
                                            const totalPrice = calculateTotalPrice(bundle);
                                            const savings = calculateSavings(bundle);
                                            
                                            return (
                                                <tr key={bundle.id}>
                                                    <td>
                                                        <div>
                                                            <div className="fw-medium">{bundle.name}</div>
                                                            {bundle.description && (
                                                                <small className="text-muted">
                                                                    {bundle.description.length > 50 
                                                                        ? bundle.description.substring(0, 50) + '...'
                                                                        : bundle.description
                                                                    }
                                                                </small>
                                                            )}
                                                            <div className="small text-muted">
                                                                İndirim: {bundle.discount_type === 'fixed' ? '₺' : '%'}{bundle.discount_value || 0}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div>
                                                            <div className="fw-medium">{bundle.product.name}</div>
                                                            <small className="text-muted">{bundle.product.sku}</small>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <Badge bg="info">{bundle.bundle_items.length} ürün</Badge>
                                                    </td>
                                                    <td className="text-center">
                                                        <div className="fw-medium">{formatPrice(totalPrice)}</div>
                                                    </td>
                                                    <td className="text-center">
                                                        <div className="fw-medium text-primary">{formatPrice(bundle.bundle_price)}</div>
                                                    </td>
                                                    <td className="text-center">
                                                        {savings > 0 ? (
                                                            <div className="text-success fw-medium">
                                                                {formatPrice(savings)}
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted">-</span>
                                                        )}
                                                    </td>
                                                    <td className="text-center">
                                                        <Badge bg={bundle.is_active ? 'success' : 'danger'}>
                                                            {bundle.is_active ? 'Aktif' : 'Pasif'}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex justify-content-center gap-1">
                                                            <OverlayTrigger
                                                                placement="top"
                                                                overlay={<Tooltip>Görüntüle</Tooltip>}
                                                            >
                                                                <Link 
                                                                    href={route('product-bundles.show', bundle.id)}
                                                                    className="btn btn-sm btn-light"
                                                                >
                                                                    <i className="ri-eye-line"></i>
                                                                </Link>
                                                            </OverlayTrigger>
                                                            
                                                            <OverlayTrigger
                                                                placement="top"
                                                                overlay={<Tooltip>Düzenle</Tooltip>}
                                                            >
                                                                <Link 
                                                                    href={route('product-bundles.edit', bundle.id)}
                                                                    className="btn btn-sm btn-primary"
                                                                >
                                                                    <i className="ri-pencil-line"></i>
                                                                </Link>
                                                            </OverlayTrigger>

                                                            <OverlayTrigger
                                                                placement="top"
                                                                overlay={<Tooltip>Sil</Tooltip>}
                                                            >
                                                                <Button
                                                                    size="sm"
                                                                    variant="danger"
                                                                    onClick={() => {
                                                                        setBundleToDelete(bundle);
                                                                        setShowDeleteModal(true);
                                                                    }}
                                                                >
                                                                    <i className="ri-delete-bin-line"></i>
                                                                </Button>
                                                            </OverlayTrigger>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </Table>
                            </div>

                            {bundles.data.length === 0 && (
                                <div className="text-center py-5">
                                    <i className="ri-stack-line fs-1 text-muted"></i>
                                    <p className="text-muted mt-3">Henüz ürün seti bulunmuyor.</p>
                                </div>
                            )}

                            {/* Pagination */}
                            {bundles.last_page && bundles.last_page > 1 && (
                                <div className="d-flex justify-content-between align-items-center mt-4">
                                    <div>
                                        Toplam {bundles.total || 0} setten {bundles.from || 0}-{bundles.to || 0} arası gösteriliyor
                                    </div>
                                    <nav>
                                        <ul className="pagination mb-0">
                                            {bundles.links && bundles.links.map((link: any, index: number) => (
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
                    <Modal.Title>Seti Sil</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>
                        <strong>{bundleToDelete?.name}</strong> setini silmek istediğinizden emin misiniz?
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