import React, { useState } from 'react';
import Layout from '@/Layouts';
import { Head, Link, router } from '@inertiajs/react';
import { Card, Table, Button, Form, Row, Col, InputGroup, Badge, Modal, ProgressBar, Alert } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface Category {
    id: number;
    name: string;
}

interface Brand {
    id: number;
    name: string;
}

interface ProductImage {
    id: number;
    image_path: string;
    thumbnail_path?: string;
    image_url: string;
    thumbnail_url: string;
    is_primary: boolean;
    sort_order: number;
}

interface Product {
    id: number;
    name: string;
    code: string;
    sku: string;
    category?: Category;
    brand?: Brand;
    images: ProductImage[];
    images_count: number;
    is_active: boolean;
}

interface Props {
    products: {
        data: Product[];
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
        category_id?: number;
        brand_id?: number;
        image_status?: string;
    };
    categories: Category[];
    brands: Brand[];
}

export default function ProductImagesIndex({ products, filters, categories, brands }: Props) {
    const { t } = useTranslation();
    const [localFilters, setLocalFilters] = useState(filters);
    
    // Debug: console log to check data structure
    console.log('Products data:', products.data);
    console.log('First product images:', products.data[0]?.images);
    const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
    const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
    const [showOptimizeModal, setShowOptimizeModal] = useState(false);
    const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [optimizeSettings, setOptimizeSettings] = useState({
        quality: 85,
        max_width: 1200,
        max_height: 1200,
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('product-images.index'), localFilters, { preserveState: true });
    };

    const handleFilterChange = (key: string, value: any) => {
        const newFilters = { ...localFilters, [key]: value };
        setLocalFilters(newFilters);
        router.get(route('product-images.index'), newFilters, { preserveState: true });
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedProducts(products.data.map(p => p.id));
        } else {
            setSelectedProducts([]);
        }
    };

    const handleSelectProduct = (productId: number, checked: boolean) => {
        if (checked) {
            setSelectedProducts([...selectedProducts, productId]);
        } else {
            setSelectedProducts(selectedProducts.filter(id => id !== productId));
        }
    };

    const handleBulkUpload = () => {
        if (selectedProducts.length === 0) {
            alert('Lütfen en az bir ürün seçin.');
            return;
        }
        setShowBulkUploadModal(true);
    };

    const submitBulkUpload = () => {
        if (!uploadFiles || uploadFiles.length === 0) {
            alert('Lütfen yüklenecek dosyaları seçin.');
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        selectedProducts.forEach(id => formData.append('product_ids[]', id.toString()));
        Array.from(uploadFiles).forEach(file => formData.append('images[]', file));

        // Simulate progress for demo - in real implementation use XMLHttpRequest
        const interval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 90) {
                    clearInterval(interval);
                    return prev;
                }
                return prev + 10;
            });
        }, 200);

        router.post(route('product-images.bulk-upload'), formData, {
            onSuccess: () => {
                setUploadProgress(100);
                setTimeout(() => {
                    setShowBulkUploadModal(false);
                    setSelectedProducts([]);
                    setUploadFiles(null);
                    setIsUploading(false);
                    setUploadProgress(0);
                }, 1000);
            },
            onError: () => {
                clearInterval(interval);
                setIsUploading(false);
                setUploadProgress(0);
            }
        });
    };

    const handleOptimize = () => {
        if (selectedProducts.length === 0) {
            alert('Lütfen en az bir ürün seçin.');
            return;
        }
        setShowOptimizeModal(true);
    };

    const submitOptimize = () => {
        router.post(route('product-images.optimize'), {
            product_ids: selectedProducts,
            ...optimizeSettings,
        });
        setShowOptimizeModal(false);
        setSelectedProducts([]);
    };

    const getImageStatusBadge = (product: Product) => {
        if (product.images_count === 0) {
            return <Badge bg="danger">Görsel Yok</Badge>;
        } else if (!product.images.some(img => img.is_primary)) {
            return <Badge bg="warning">Ana Görsel Yok</Badge>;
        } else {
            return <Badge bg="success">{product.images_count} Görsel</Badge>;
        }
    };

    return (
        <>
            <Head title="Ürün Görselleri" />
            <Layout>
                <div className="page-content">
                <div className="container-fluid">
                    <Row className="mb-3">
                        <Col>
                            <div className="page-title-box d-flex align-items-center justify-content-between">
                                <h4 className="mb-0">Ürün Görselleri</h4>
                                <div className="d-flex gap-2">
                                    <Button 
                                        variant="success" 
                                        onClick={handleBulkUpload}
                                        disabled={selectedProducts.length === 0}
                                    >
                                        <i className="ri-upload-line me-1"></i>
                                        Toplu Yükleme
                                    </Button>
                                    <Button 
                                        variant="info" 
                                        onClick={handleOptimize}
                                        disabled={selectedProducts.length === 0}
                                    >
                                        <i className="ri-magic-line me-1"></i>
                                        Optimize Et
                                    </Button>
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
                                                placeholder="Ürün adı, kodu veya SKU ara..."
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
                                        value={localFilters.category_id || ''}
                                        onChange={(e) => handleFilterChange('category_id', e.target.value || undefined)}
                                    >
                                        <option value="">Tüm Kategoriler</option>
                                        {categories.map(category => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Col>
                                <Col lg={2}>
                                    <Form.Select
                                        value={localFilters.brand_id || ''}
                                        onChange={(e) => handleFilterChange('brand_id', e.target.value || undefined)}
                                    >
                                        <option value="">Tüm Markalar</option>
                                        {brands.map(brand => (
                                            <option key={brand.id} value={brand.id}>
                                                {brand.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Col>
                                <Col lg={2}>
                                    <Form.Select
                                        value={localFilters.image_status || ''}
                                        onChange={(e) => handleFilterChange('image_status', e.target.value || undefined)}
                                    >
                                        <option value="">Tüm Ürünler</option>
                                        <option value="with_images">Görseli Olanlar</option>
                                        <option value="without_images">Görseli Olmayanlar</option>
                                        <option value="without_primary">Ana Görseli Olmayanlar</option>
                                    </Form.Select>
                                </Col>
                            </Row>

                            {selectedProducts.length > 0 && (
                                <Alert variant="info" className="mb-3">
                                    <i className="ri-information-line me-1"></i>
                                    {selectedProducts.length} ürün seçildi
                                </Alert>
                            )}

                            <div className="table-responsive">
                                <Table hover className="table-centered align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th style={{ width: '50px' }}>
                                                <Form.Check
                                                    type="checkbox"
                                                    checked={selectedProducts.length === products.data.length && products.data.length > 0}
                                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                                />
                                            </th>
                                            <th style={{ width: '80px' }}>Görsel</th>
                                            <th>Ürün Bilgileri</th>
                                            <th>Kategori/Marka</th>
                                            <th className="text-center">Görsel Durumu</th>
                                            <th className="text-center">Durum</th>
                                            <th className="text-center" style={{ width: '120px' }}>İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.data.map(product => {
                                            const primaryImage = product.images.find(img => img.is_primary) || product.images[0];
                                            return (
                                                <tr key={product.id}>
                                                    <td>
                                                        <Form.Check
                                                            type="checkbox"
                                                            checked={selectedProducts.includes(product.id)}
                                                            onChange={(e) => handleSelectProduct(product.id, e.target.checked)}
                                                        />
                                                    </td>
                                                    <td>
                                                        {primaryImage ? (
                                                            <img
                                                                src={primaryImage.thumbnail_url || primaryImage.image_url}
                                                                alt={product.name}
                                                                className="rounded border"
                                                                style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                                                            />
                                                        ) : (
                                                            <div 
                                                                className="d-flex align-items-center justify-content-center bg-light rounded border"
                                                                style={{ width: '60px', height: '60px' }}
                                                            >
                                                                <i className="ri-image-line text-muted"></i>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div>
                                                            <div className="fw-medium">{product.name}</div>
                                                            <small className="text-muted">
                                                                Kod: {product.code} | SKU: {product.sku}
                                                            </small>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div>
                                                            <div className="small">{product.category?.name || '-'}</div>
                                                            <div className="small text-muted">{product.brand?.name || '-'}</div>
                                                        </div>
                                                    </td>
                                                    <td className="text-center">
                                                        {getImageStatusBadge(product)}
                                                    </td>
                                                    <td className="text-center">
                                                        <Badge bg={product.is_active ? 'success' : 'danger'}>
                                                            {product.is_active ? 'Aktif' : 'Pasif'}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex justify-content-center gap-1">
                                                            <Link 
                                                                href={route('product-images.show', product.id)}
                                                                className="btn btn-sm btn-primary"
                                                                title="Görselleri Yönet"
                                                            >
                                                                <i className="ri-gallery-line"></i>
                                                            </Link>
                                                            <Link 
                                                                href={route('products.show', product.id)}
                                                                className="btn btn-sm btn-light"
                                                                title="Ürünü Görüntüle"
                                                            >
                                                                <i className="ri-eye-line"></i>
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </Table>
                            </div>

                            {products.data.length === 0 && (
                                <div className="text-center py-5">
                                    <i className="ri-image-line fs-1 text-muted"></i>
                                    <p className="text-muted mt-3">Ürün bulunmuyor.</p>
                                </div>
                            )}

                            {/* Pagination */}
                            {products.last_page && products.last_page > 1 && (
                                <div className="d-flex justify-content-between align-items-center mt-4">
                                    <div>
                                        Toplam {products.total || 0} üründen {products.from || 0}-{products.to || 0} arası gösteriliyor
                                    </div>
                                    <nav>
                                        <ul className="pagination mb-0">
                                            {products.links && products.links.map((link: any, index: number) => (
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
            </Layout>

            {/* Toplu Yükleme Modal */}
            <Modal show={showBulkUploadModal} onHide={() => setShowBulkUploadModal(false)} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Toplu Görsel Yükleme</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Görsel Dosyaları Seçin</Form.Label>
                        <Form.Control
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => setUploadFiles((e.target as HTMLInputElement).files)}
                            disabled={isUploading}
                        />
                        <Form.Text className="text-muted">
                            JPEG, PNG, JPG, WEBP formatlarında, maksimum 5MB boyutunda dosyalar yükleyebilirsiniz.
                            Aynı anda maksimum 10 dosya seçebilirsiniz.
                        </Form.Text>
                    </Form.Group>

                    {isUploading && (
                        <div className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <span>Yükleniyor...</span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <ProgressBar now={uploadProgress} />
                        </div>
                    )}

                    <Alert variant="info">
                        <i className="ri-information-line me-1"></i>
                        {selectedProducts.length} ürün için görseller yüklenecek. 
                        Her ürüne seçilen tüm görseller eklenecektir.
                    </Alert>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowBulkUploadModal(false)} disabled={isUploading}>
                        İptal
                    </Button>
                    <Button variant="primary" onClick={submitBulkUpload} disabled={isUploading || !uploadFiles}>
                        <i className="ri-upload-line me-1"></i>
                        {isUploading ? 'Yükleniyor...' : 'Yükle'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Optimizasyon Modal */}
            <Modal show={showOptimizeModal} onHide={() => setShowOptimizeModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Görsel Optimizasyonu</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Kalite (%)</Form.Label>
                        <Form.Range
                            min={50}
                            max={100}
                            value={optimizeSettings.quality}
                            onChange={(e) => setOptimizeSettings({...optimizeSettings, quality: parseInt(e.target.value)})}
                        />
                        <div className="d-flex justify-content-between text-muted small">
                            <span>Düşük (50%)</span>
                            <span className="fw-bold">{optimizeSettings.quality}%</span>
                            <span>Yüksek (100%)</span>
                        </div>
                    </Form.Group>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Maksimum Genişlik (px)</Form.Label>
                                <Form.Control
                                    type="number"
                                    min={200}
                                    max={2000}
                                    value={optimizeSettings.max_width}
                                    onChange={(e) => setOptimizeSettings({...optimizeSettings, max_width: parseInt(e.target.value)})}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Maksimum Yükseklik (px)</Form.Label>
                                <Form.Control
                                    type="number"
                                    min={200}
                                    max={2000}
                                    value={optimizeSettings.max_height}
                                    onChange={(e) => setOptimizeSettings({...optimizeSettings, max_height: parseInt(e.target.value)})}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Alert variant="warning">
                        <i className="ri-warning-line me-1"></i>
                        Bu işlem seçilen ürünlerin tüm görsellerini optimize edecektir. 
                        İşlem geri alınamaz!
                    </Alert>

                    <Alert variant="info">
                        <i className="ri-information-line me-1"></i>
                        {selectedProducts.length} ürünün görselleri optimize edilecek.
                    </Alert>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowOptimizeModal(false)}>
                        İptal
                    </Button>
                    <Button variant="warning" onClick={submitOptimize}>
                        <i className="ri-magic-line me-1"></i>
                        Optimize Et
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}