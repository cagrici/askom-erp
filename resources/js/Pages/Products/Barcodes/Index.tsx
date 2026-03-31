import React, { useState } from 'react';
import Layout from '@/Layouts';
import { Head, Link, router } from '@inertiajs/react';
import { Card, Table, Button, Form, Row, Col, InputGroup, Badge, Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface Category {
    id: number;
    name: string;
}

interface Brand {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    code: string;
    sku: string;
    barcode?: string;
    sale_price?: number;
    category?: Category;
    brand?: Brand;
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
        only_with_barcode?: boolean;
        only_without_barcode?: boolean;
    };
    categories: Category[];
    brands: Brand[];
}

export default function BarcodeIndex({ products, filters, categories, brands }: Props) {
    const { t } = useTranslation();
    const [localFilters, setLocalFilters] = useState(filters);
    const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [generateSettings, setGenerateSettings] = useState({
        barcode_type: 'CODE128',
        prefix: '',
    });
    const [printSettings, setPrintSettings] = useState({
        barcode_type: 'CODE128',
        label_size: '40x30',
        columns: 3,
        show_product_name: true,
        show_price: true,
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('product-barcodes.index'), localFilters, { preserveState: true });
    };

    const handleFilterChange = (key: string, value: any) => {
        const newFilters = { ...localFilters, [key]: value };
        setLocalFilters(newFilters);
        router.get(route('product-barcodes.index'), newFilters, { preserveState: true });
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

    const handleBulkGenerate = () => {
        if (selectedProducts.length === 0) {
            alert('Lütfen en az bir ürün seçin.');
            return;
        }
        setShowGenerateModal(true);
    };

    const submitBulkGenerate = () => {
        router.post(route('product-barcodes.bulk-generate'), {
            product_ids: selectedProducts,
            ...generateSettings,
        });
        setShowGenerateModal(false);
        setSelectedProducts([]);
    };

    const handlePrint = () => {
        if (selectedProducts.length === 0) {
            alert('Lütfen en az bir ürün seçin.');
            return;
        }
        setShowPrintModal(true);
    };

    const submitPrint = () => {
        router.post(route('product-barcodes.print'), {
            product_ids: selectedProducts,
            ...printSettings,
        });
        setShowPrintModal(false);
    };

    const handleDownload = (format: 'pdf' | 'png') => {
        if (selectedProducts.length === 0) {
            alert('Lütfen en az bir ürün seçin.');
            return;
        }

        router.post(route('product-barcodes.download'), {
            product_ids: selectedProducts,
            barcode_type: 'CODE128',
            format: format,
            size: 'medium',
        });
    };

    const formatPrice = (price?: number) => {
        return price ? `₺${price.toLocaleString()}` : '-';
    };

    return (
        <>
            <Head title="Barkod Yönetimi" />
            <Layout>
                <div className="page-content">
                <div className="container-fluid">
                    <Row className="mb-3">
                        <Col>
                            <div className="page-title-box d-flex align-items-center justify-content-between">
                                <h4 className="mb-0">Barkod Yönetimi</h4>
                                <div className="d-flex gap-2">
                                    <Button 
                                        variant="success" 
                                        onClick={handleBulkGenerate}
                                        disabled={selectedProducts.length === 0}
                                    >
                                        <i className="ri-qr-code-line me-1"></i>
                                        Toplu Barkod Oluştur
                                    </Button>
                                    <Button 
                                        variant="primary" 
                                        onClick={handlePrint}
                                        disabled={selectedProducts.length === 0}
                                    >
                                        <i className="ri-printer-line me-1"></i>
                                        Yazdır
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
                                                placeholder="Ürün adı, kodu, SKU veya barkod ara..."
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
                                        value={localFilters.only_with_barcode ? 'with' : localFilters.only_without_barcode ? 'without' : ''}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            handleFilterChange('only_with_barcode', value === 'with');
                                            handleFilterChange('only_without_barcode', value === 'without');
                                        }}
                                    >
                                        <option value="">Tüm Ürünler</option>
                                        <option value="with">Barkodu Olanlar</option>
                                        <option value="without">Barkodu Olmayanlar</option>
                                    </Form.Select>
                                </Col>
                                <Col lg={2}>
                                    <div className="d-flex gap-2">
                                        <Button 
                                            variant="outline-info" 
                                            size="sm"
                                            onClick={() => handleDownload('pdf')}
                                            disabled={selectedProducts.length === 0}
                                        >
                                            <i className="ri-file-pdf-line me-1"></i>
                                            PDF
                                        </Button>
                                        <Button 
                                            variant="outline-secondary" 
                                            size="sm"
                                            onClick={() => handleDownload('png')}
                                            disabled={selectedProducts.length === 0}
                                        >
                                            <i className="ri-image-line me-1"></i>
                                            PNG
                                        </Button>
                                    </div>
                                </Col>
                            </Row>

                            {selectedProducts.length > 0 && (
                                <div className="alert alert-info mb-3">
                                    <i className="ri-information-line me-1"></i>
                                    {selectedProducts.length} ürün seçildi
                                </div>
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
                                            <th>Ürün Bilgileri</th>
                                            <th>Kategori/Marka</th>
                                            <th className="text-center">Barkod</th>
                                            <th className="text-center">Fiyat</th>
                                            <th className="text-center">Durum</th>
                                            <th className="text-center" style={{ width: '120px' }}>İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.data.map(product => (
                                            <tr key={product.id}>
                                                <td>
                                                    <Form.Check
                                                        type="checkbox"
                                                        checked={selectedProducts.includes(product.id)}
                                                        onChange={(e) => handleSelectProduct(product.id, e.target.checked)}
                                                    />
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
                                                    {product.barcode ? (
                                                        <div>
                                                            <code className="bg-light px-2 py-1 rounded">
                                                                {product.barcode}
                                                            </code>
                                                            <div className="mt-1">
                                                                <Badge bg="success" className="small">Var</Badge>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <Badge bg="warning">Barkod Yok</Badge>
                                                    )}
                                                </td>
                                                <td className="text-center">
                                                    {formatPrice(product.sale_price)}
                                                </td>
                                                <td className="text-center">
                                                    <Badge bg={product.is_active ? 'success' : 'danger'}>
                                                        {product.is_active ? 'Aktif' : 'Pasif'}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <div className="d-flex justify-content-center gap-1">
                                                        <OverlayTrigger
                                                            placement="top"
                                                            overlay={<Tooltip>Ürünü Görüntüle</Tooltip>}
                                                        >
                                                            <Link 
                                                                href={route('products.show', product.id)}
                                                                className="btn btn-sm btn-light"
                                                            >
                                                                <i className="ri-eye-line"></i>
                                                            </Link>
                                                        </OverlayTrigger>
                                                        
                                                        <OverlayTrigger
                                                            placement="top"
                                                            overlay={<Tooltip>Barkod Oluştur/Düzenle</Tooltip>}
                                                        >
                                                            <Button
                                                                size="sm"
                                                                variant="primary"
                                                                onClick={() => {
                                                                    // Open individual barcode modal
                                                                }}
                                                            >
                                                                <i className="ri-qr-code-line"></i>
                                                            </Button>
                                                        </OverlayTrigger>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>

                            {products.data.length === 0 && (
                                <div className="text-center py-5">
                                    <i className="ri-qr-code-line fs-1 text-muted"></i>
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

            {/* Toplu Barkod Oluşturma Modal */}
            <Modal show={showGenerateModal} onHide={() => setShowGenerateModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Toplu Barkod Oluştur</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Barkod Tipi</Form.Label>
                        <Form.Select
                            value={generateSettings.barcode_type}
                            onChange={(e) => setGenerateSettings({...generateSettings, barcode_type: e.target.value})}
                        >
                            <option value="CODE128">CODE128</option>
                            <option value="EAN13">EAN13</option>
                            <option value="CODE39">CODE39</option>
                            <option value="UPCA">UPC-A</option>
                        </Form.Select>
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                        <Form.Label>Ön Ek (İsteğe Bağlı)</Form.Label>
                        <Form.Control
                            type="text"
                            value={generateSettings.prefix}
                            onChange={(e) => setGenerateSettings({...generateSettings, prefix: e.target.value})}
                            placeholder="Örn: PRD"
                            maxLength={10}
                        />
                        <Form.Text className="text-muted">
                            Barkodların başına eklenecek sabit metin
                        </Form.Text>
                    </Form.Group>

                    <div className="alert alert-info">
                        <i className="ri-information-line me-1"></i>
                        {selectedProducts.length} ürün için barkod oluşturulacak. Sadece barkodu olmayan ürünler için yeni barkod oluşturulur.
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowGenerateModal(false)}>
                        İptal
                    </Button>
                    <Button variant="primary" onClick={submitBulkGenerate}>
                        <i className="ri-qr-code-line me-1"></i>
                        Barkod Oluştur
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Yazdırma Modal */}
            <Modal show={showPrintModal} onHide={() => setShowPrintModal(false)} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Barkod Yazdırma Ayarları</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Barkod Tipi</Form.Label>
                                <Form.Select
                                    value={printSettings.barcode_type}
                                    onChange={(e) => setPrintSettings({...printSettings, barcode_type: e.target.value})}
                                >
                                    <option value="CODE128">CODE128</option>
                                    <option value="EAN13">EAN13</option>
                                    <option value="CODE39">CODE39</option>
                                    <option value="UPCA">UPC-A</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Etiket Boyutu (mm)</Form.Label>
                                <Form.Select
                                    value={printSettings.label_size}
                                    onChange={(e) => setPrintSettings({...printSettings, label_size: e.target.value})}
                                >
                                    <option value="30x20">30x20 mm</option>
                                    <option value="40x30">40x30 mm</option>
                                    <option value="50x25">50x25 mm</option>
                                    <option value="70x35">70x35 mm</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Sütun Sayısı</Form.Label>
                                <Form.Select
                                    value={printSettings.columns}
                                    onChange={(e) => setPrintSettings({...printSettings, columns: parseInt(e.target.value)})}
                                >
                                    <option value={1}>1 Sütun</option>
                                    <option value={2}>2 Sütun</option>
                                    <option value={3}>3 Sütun</option>
                                    <option value={4}>4 Sütun</option>
                                    <option value={5}>5 Sütun</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Ek Bilgiler</Form.Label>
                                <div className="d-flex flex-column gap-2">
                                    <Form.Check
                                        type="checkbox"
                                        id="show_product_name"
                                        label="Ürün Adını Göster"
                                        checked={printSettings.show_product_name}
                                        onChange={(e) => setPrintSettings({...printSettings, show_product_name: e.target.checked})}
                                    />
                                    <Form.Check
                                        type="checkbox"
                                        id="show_price"
                                        label="Fiyatı Göster"
                                        checked={printSettings.show_price}
                                        onChange={(e) => setPrintSettings({...printSettings, show_price: e.target.checked})}
                                    />
                                </div>
                            </Form.Group>
                        </Col>
                    </Row>

                    <div className="alert alert-info">
                        <i className="ri-information-line me-1"></i>
                        {selectedProducts.length} ürünün barkodu yazdırılacak.
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowPrintModal(false)}>
                        İptal
                    </Button>
                    <Button variant="primary" onClick={submitPrint}>
                        <i className="ri-printer-line me-1"></i>
                        Yazdırma Önizleme
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}