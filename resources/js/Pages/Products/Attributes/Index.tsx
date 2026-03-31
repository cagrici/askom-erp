import React, { useState } from 'react';
import Layout from '@/Layouts';
import { Head, Link, router } from '@inertiajs/react';
import { Card, Table, Button, Form, Row, Col, InputGroup, Badge, Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface Attribute {
    id: number;
    name: string;
    slug: string;
    type: string;
    description?: string;
    is_required: boolean;
    is_variant: boolean;
    is_filterable: boolean;
    is_active: boolean;
    sort_order: number;
    attribute_values_count: number;
    created_at: string;
}

interface Props {
    attributes: {
        data: Attribute[];
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
        type?: string;
        is_active?: boolean;
        is_variant?: boolean;
    };
    attributeTypes: Array<{
        value: string;
        label: string;
    }>;
}

export default function AttributeIndex({ attributes, filters, attributeTypes }: Props) {
    const { t } = useTranslation();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [attributeToDelete, setAttributeToDelete] = useState<Attribute | null>(null);
    const [localFilters, setLocalFilters] = useState(filters);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('product-attributes.index'), localFilters, { preserveState: true });
    };

    const handleFilterChange = (key: string, value: any) => {
        const newFilters = { ...localFilters, [key]: value };
        setLocalFilters(newFilters);
        router.get(route('product-attributes.index'), newFilters, { preserveState: true });
    };

    const handleDelete = async () => {
        if (!attributeToDelete) return;

        try {
            await router.delete(route('product-attributes.destroy', attributeToDelete.id));
            setShowDeleteModal(false);
            setAttributeToDelete(null);
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const getAttributeTypeLabel = (type: string) => {
        const typeObj = attributeTypes.find(t => t.value === type);
        return typeObj ? typeObj.label : type;
    };

    const getAttributeTypeBadgeColor = (type: string) => {
        const colors: Record<string, string> = {
            'text': 'primary',
            'number': 'success',
            'select': 'info',
            'multiselect': 'warning',
            'boolean': 'secondary',
            'color': 'danger',
            'image': 'dark'
        };
        return colors[type] || 'secondary';
    };

    return (
        <Layout>
            <Head title="Ürün Özellikleri" />

            <div className="page-content">
                <div className="container-fluid">
                    <Row className="mb-3">
                        <Col>
                            <div className="page-title-box d-flex align-items-center justify-content-between">
                                <h4 className="mb-0">Ürün Özellikleri</h4>
                                <div className="d-flex gap-2">
                                    <Link href={route('product-attributes.create')} className="btn btn-primary">
                                        <i className="ri-add-line me-1"></i>
                                        Yeni Özellik
                                    </Link>
                                </div>
                            </div>
                        </Col>
                    </Row>

                    <Card>
                        <Card.Body>
                            <Row className="mb-4">
                                <Col lg={4}>
                                    <Form onSubmit={handleSearch}>
                                        <InputGroup>
                                            <Form.Control
                                                type="text"
                                                placeholder="Özellik adı, slug veya tip ara..."
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
                                        value={localFilters.type || ''}
                                        onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
                                    >
                                        <option value="">Tüm Tipler</option>
                                        {attributeTypes.map(type => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
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
                                <Col lg={2}>
                                    <Form.Select
                                        value={localFilters.is_variant !== undefined && localFilters.is_variant !== null ? localFilters.is_variant.toString() : ''}
                                        onChange={(e) => handleFilterChange('is_variant', e.target.value === '' ? undefined : e.target.value === 'true')}
                                    >
                                        <option value="">Tüm Özellikler</option>
                                        <option value="true">Varyant Özelliği</option>
                                        <option value="false">Normal Özellik</option>
                                    </Form.Select>
                                </Col>
                            </Row>

                            <div className="table-responsive">
                                <Table hover className="table-centered align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Özellik Adı</th>
                                            <th>Tip</th>
                                            <th className="text-center">Değer Sayısı</th>
                                            <th className="text-center">Özellikler</th>
                                            <th className="text-center">Sıralama</th>
                                            <th className="text-center">Durum</th>
                                            <th className="text-center" style={{ width: '120px' }}>İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attributes.data.map(attribute => (
                                            <tr key={attribute.id}>
                                                <td>
                                                    <div>
                                                        <div className="fw-medium">{attribute.name}</div>
                                                        <small className="text-muted">{attribute.slug}</small>
                                                        {attribute.description && (
                                                            <div className="small text-muted">
                                                                {attribute.description.length > 50 
                                                                    ? attribute.description.substring(0, 50) + '...'
                                                                    : attribute.description
                                                                }
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <Badge bg={getAttributeTypeBadgeColor(attribute.type)}>
                                                        {getAttributeTypeLabel(attribute.type)}
                                                    </Badge>
                                                </td>
                                                <td className="text-center">
                                                    <Badge bg="info">{attribute.attribute_values_count}</Badge>
                                                </td>
                                                <td className="text-center">
                                                    <div className="d-flex justify-content-center gap-1">
                                                        {attribute.is_required && (
                                                            <Badge bg="danger" className="small">Zorunlu</Badge>
                                                        )}
                                                        {attribute.is_variant && (
                                                            <Badge bg="warning" className="small">Varyant</Badge>
                                                        )}
                                                        {attribute.is_filterable && (
                                                            <Badge bg="info" className="small">Filtrelenebilir</Badge>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="text-center">
                                                    {attribute.sort_order}
                                                </td>
                                                <td className="text-center">
                                                    <Badge bg={attribute.is_active ? 'success' : 'danger'}>
                                                        {attribute.is_active ? 'Aktif' : 'Pasif'}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <div className="d-flex justify-content-center gap-1">
                                                        <OverlayTrigger
                                                            placement="top"
                                                            overlay={<Tooltip>Görüntüle</Tooltip>}
                                                        >
                                                            <Link 
                                                                href={route('product-attributes.show', attribute.id)}
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
                                                                href={route('product-attributes.edit', attribute.id)}
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
                                                                    setAttributeToDelete(attribute);
                                                                    setShowDeleteModal(true);
                                                                }}
                                                            >
                                                                <i className="ri-delete-bin-line"></i>
                                                            </Button>
                                                        </OverlayTrigger>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>

                            {attributes.data.length === 0 && (
                                <div className="text-center py-5">
                                    <i className="ri-settings-2-line fs-1 text-muted"></i>
                                    <p className="text-muted mt-3">Henüz ürün özelliği bulunmuyor.</p>
                                </div>
                            )}

                            {/* Pagination */}
                            {attributes.last_page && attributes.last_page > 1 && (
                                <div className="d-flex justify-content-between align-items-center mt-4">
                                    <div>
                                        Toplam {attributes.total || 0} özellikten {attributes.from || 0}-{attributes.to || 0} arası gösteriliyor
                                    </div>
                                    <nav>
                                        <ul className="pagination mb-0">
                                            {attributes.links && attributes.links.map((link: any, index: number) => (
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
                    <Modal.Title>Özelliği Sil</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>
                        <strong>{attributeToDelete?.name}</strong> özelliğini silmek istediğinizden emin misiniz?
                    </p>
                    <p className="text-danger mb-0">
                        <i className="ri-alert-line me-1"></i>
                        Bu işlem geri alınamaz ve tüm ilgili değerler de silinecektir!
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