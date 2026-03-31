import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Card, Form, Button, Row, Col, Alert, ProgressBar, Badge, ListGroup } from 'react-bootstrap';
import Layout from '@/Layouts';

interface PriceList {
    id: number;
    name: string;
    code: string;
    currency: string;
}

interface ImportDetails {
    success: number;
    errors: number;
    skipped: number;
    details: string[];
}

interface Props {
    priceList: PriceList;
    import_details?: ImportDetails;
}

export default function Import({ priceList, import_details }: Props) {
    const { data, setData, post, processing, errors, progress } = useForm({
        file: null as File | null,
        has_header: true,
        update_existing: false
    });

    const [dragActive, setDragActive] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('sales.price-lists.import', priceList.id));
    };

    const handleFileChange = (file: File | null) => {
        setData('file', file);
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.type === 'text/csv' || file.name.endsWith('.csv') || 
                file.type === 'application/vnd.ms-excel' || 
                file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                handleFileChange(file);
            }
        }
    };

    const getProgressVariant = () => {
        if (!import_details) return 'primary';
        if (import_details.errors > 0) return 'warning';
        return 'success';
    };

    return (
        <Layout>
            <Head title={`Fiyat Listesi Import - ${priceList.name}`} />
            
            <div className="page-content">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="h3 mb-1">
                            <i className="ri-upload-cloud-line me-2"></i>
                            Fiyat Listesi Import
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
                        </p>
                    </div>

                    <div className="d-flex gap-2">
                        <Button 
                            variant="outline-info"
                            onClick={() => window.open(route('sales.price-lists.template'), '_blank')}
                        >
                            <i className="ri-download-line me-1"></i>
                            Template İndir
                        </Button>
                        
                        <Link href={route('sales.price-lists.show', priceList.id)}>
                            <Button variant="outline-secondary">
                                <i className="ri-arrow-left-line me-1"></i>
                                Geri Dön
                            </Button>
                        </Link>
                    </div>
                </div>

                <Row>
                    <Col lg={8}>
                        {/* Import Results */}
                        {import_details && (
                            <Card className="mb-4">
                                <Card.Header>
                                    <h5 className="mb-0">
                                        <i className="ri-file-list-3-line me-2"></i>
                                        Import Sonuçları
                                    </h5>
                                </Card.Header>
                                <Card.Body>
                                    <Row className="g-3 mb-3">
                                        <Col md={4}>
                                            <div className="text-center p-3 bg-success-subtle rounded">
                                                <div className="display-6 text-success mb-2">
                                                    {import_details.success}
                                                </div>
                                                <div className="text-success fw-medium">Başarılı</div>
                                            </div>
                                        </Col>
                                        <Col md={4}>
                                            <div className="text-center p-3 bg-warning-subtle rounded">
                                                <div className="display-6 text-warning mb-2">
                                                    {import_details.skipped}
                                                </div>
                                                <div className="text-warning fw-medium">Atlandı</div>
                                            </div>
                                        </Col>
                                        <Col md={4}>
                                            <div className="text-center p-3 bg-danger-subtle rounded">
                                                <div className="display-6 text-danger mb-2">
                                                    {import_details.errors}
                                                </div>
                                                <div className="text-danger fw-medium">Hata</div>
                                            </div>
                                        </Col>
                                    </Row>

                                    {import_details.details.length > 0 && (
                                        <div>
                                            <h6 className="mb-3">Detaylar:</h6>
                                            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                                <ListGroup variant="flush">
                                                    {import_details.details.map((detail, index) => (
                                                        <ListGroup.Item key={index} className="px-0">
                                                            <small className="text-muted">{detail}</small>
                                                        </ListGroup.Item>
                                                    ))}
                                                </ListGroup>
                                            </div>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        )}

                        {/* Import Form */}
                        <Card className="mb-4">
                            <Card.Header>
                                <h5 className="mb-0">
                                    <i className="ri-file-upload-line me-2"></i>
                                    Dosya Yükleme
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                <Form onSubmit={handleSubmit}>
                                    {/* File Upload Area */}
                                    <div 
                                        className={`border-2 border-dashed rounded p-4 text-center mb-4 ${
                                            dragActive ? 'border-primary bg-primary-subtle' : 'border-secondary'
                                        } ${data.file ? 'border-success bg-success-subtle' : ''}`}
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                        style={{ minHeight: '200px', cursor: 'pointer' }}
                                    >
                                        <div className="d-flex flex-column align-items-center justify-content-center h-100">
                                            {data.file ? (
                                                <>
                                                    <i className="ri-file-text-line display-4 text-success mb-3"></i>
                                                    <h6 className="text-success mb-2">{data.file.name}</h6>
                                                    <p className="text-muted mb-3">
                                                        {(data.file.size / 1024).toFixed(1)} KB
                                                    </p>
                                                    <Button 
                                                        variant="outline-secondary" 
                                                        size="sm"
                                                        onClick={() => handleFileChange(null)}
                                                    >
                                                        Dosyayı Değiştir
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <i className="ri-upload-cloud-line display-4 text-muted mb-3"></i>
                                                    <h6 className="mb-2">Dosyayı buraya sürükleyin veya tıklayın</h6>
                                                    <p className="text-muted mb-3">
                                                        CSV, Excel (.xls, .xlsx) dosyaları desteklenir
                                                    </p>
                                                    <input
                                                        type="file"
                                                        className="d-none"
                                                        id="file-input"
                                                        accept=".csv,.xls,.xlsx"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0] || null;
                                                            handleFileChange(file);
                                                        }}
                                                    />
                                                    <label htmlFor="file-input">
                                                        <Button as="span" variant="outline-primary">
                                                            Dosya Seç
                                                        </Button>
                                                    </label>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {errors.file && (
                                        <Alert variant="danger" className="mb-3">
                                            {errors.file}
                                        </Alert>
                                    )}

                                    {/* Import Options */}
                                    <Row className="g-3 mb-4">
                                        <Col md={6}>
                                            <Form.Check
                                                type="checkbox"
                                                id="has-header"
                                                label="Dosyada başlık satırı var"
                                                checked={data.has_header}
                                                onChange={(e) => setData('has_header', e.target.checked)}
                                            />
                                        </Col>
                                        <Col md={6}>
                                            <Form.Check
                                                type="checkbox"
                                                id="update-existing"
                                                label="Mevcut fiyatları güncelle"
                                                checked={data.update_existing}
                                                onChange={(e) => setData('update_existing', e.target.checked)}
                                            />
                                        </Col>
                                    </Row>

                                    {/* Upload Progress */}
                                    {processing && progress && (
                                        <div className="mb-4">
                                            <div className="d-flex justify-content-between mb-2">
                                                <span>Yükleniyor...</span>
                                                <span>{Math.round(progress.percentage || 0)}%</span>
                                            </div>
                                            <ProgressBar 
                                                now={progress.percentage || 0} 
                                                variant={getProgressVariant()}
                                                animated
                                            />
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <div className="text-end">
                                        <Button 
                                            type="submit" 
                                            variant="primary" 
                                            disabled={!data.file || processing}
                                            size="lg"
                                        >
                                            {processing ? (
                                                <>
                                                    <i className="ri-loader-line me-2"></i>
                                                    Import Ediliyor...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="ri-upload-line me-2"></i>
                                                    Import Et
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </Form>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col lg={4}>
                        {/* Instructions */}
                        <Card className="mb-4">
                            <Card.Header>
                                <h5 className="mb-0">
                                    <i className="ri-information-line me-2"></i>
                                    Kullanım Kılavuzu
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                <div className="mb-3">
                                    <h6 className="text-primary">CSV Format Beklentisi:</h6>
                                    <ul className="list-unstyled mb-0">
                                        <li><small>• Ürün Kodu (zorunlu)</small></li>
                                        <li><small>• Minimum Miktar</small></li>
                                        <li><small>• Birim Fiyat (zorunlu)</small></li>
                                        <li><small>• İndirim % (opsiyonel)</small></li>
                                        <li><small>• İndirim Tutar (opsiyonel)</small></li>
                                    </ul>
                                </div>

                                <div className="mb-3">
                                    <h6 className="text-primary">Önemli Notlar:</h6>
                                    <ul className="list-unstyled mb-0">
                                        <li><small>• CSV dosyaları ';' ile ayrılmalı</small></li>
                                        <li><small>• Ürün kodları sistemde mevcut olmalı</small></li>
                                        <li><small>• Maksimum dosya boyutu: 10MB</small></li>
                                        <li><small>• UTF-8 encoding kullanın</small></li>
                                    </ul>
                                </div>

                                <Alert variant="info" className="mb-0">
                                    <small>
                                        <strong>İpucu:</strong> Örnek template dosyasını indirerek 
                                        doğru formatı görebilirsiniz.
                                    </small>
                                </Alert>
                            </Card.Body>
                        </Card>

                        {/* Price List Info */}
                        <Card>
                            <Card.Header>
                                <h5 className="mb-0">Fiyat Listesi Bilgileri</h5>
                            </Card.Header>
                            <Card.Body>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">Liste Adı:</span>
                                    <span className="fw-medium">{priceList.name}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">Liste Kodu:</span>
                                    <code>{priceList.code}</code>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span className="text-muted">Para Birimi:</span>
                                    <Badge bg="secondary">{priceList.currency}</Badge>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </div>
        </Layout>
    );
}