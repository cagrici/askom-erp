import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Card, Button, Row, Col, Form, Alert } from 'react-bootstrap';
import Layout from '@/Layouts';

interface Driver {
    id: number;
    name: string;
    phone?: string;
    license_number?: string;
    license_type?: string;
    license_expiry?: string;
    is_active_driver: boolean;
    driver_notes?: string;
}

interface Props {
    driver: Driver | null;
    isEdit: boolean;
}

export default function Edit({ driver, isEdit }: Props) {
    const { data, setData, post, put, processing, errors } = useForm({
        name: driver?.name || '',
        phone: driver?.phone || '',
        license_number: driver?.license_number || '',
        license_type: driver?.license_type || '',
        license_expiry: driver?.license_expiry || '',
        is_active_driver: driver?.is_active_driver ?? true,
        driver_notes: driver?.driver_notes || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEdit && driver) {
            put(route('warehouse.drivers.update', driver.id));
        } else {
            post(route('warehouse.drivers.store'));
        }
    };

    const licenseTypes = [
        { value: '', label: 'Secin...' },
        { value: 'B', label: 'B - Otomobil' },
        { value: 'C', label: 'C - Kamyon' },
        { value: 'D', label: 'D - Otobus' },
        { value: 'E', label: 'E - TIR/Cekici' },
        { value: 'A1', label: 'A1 - Motosiklet (Hafif)' },
        { value: 'A2', label: 'A2 - Motosiklet (Orta)' },
        { value: 'A', label: 'A - Motosiklet' },
    ];

    return (
        <Layout>
            <Head title={isEdit ? 'Sofor Duzenle' : 'Yeni Sofor'} />
            <div className="page-content">
            <div className="container-fluid py-4">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <Link
                            href={route('warehouse.drivers.index')}
                            className="text-muted text-decoration-none mb-2 d-inline-block"
                        >
                            <i className="ri-arrow-left-line me-1"></i>
                            Şoförlere Dön
                        </Link>
                        <h4 className="mb-0">{isEdit ? 'Sofor Duzenle' : 'Yeni Sofor'}</h4>
                    </div>
                </div>

                <Form onSubmit={handleSubmit}>
                    <Row>
                        <Col lg={8}>
                            {/* Basic Info */}
                            <Card className="border-0 shadow-sm mb-4">
                                <Card.Header className="bg-white">
                                    <h5 className="mb-0">
                                        <i className="ri-user-line me-2"></i>
                                        Kisisel Bilgiler
                                    </h5>
                                </Card.Header>
                                <Card.Body>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Ad Soyad *</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={data.name}
                                                    onChange={(e) => setData('name', e.target.value)}
                                                    isInvalid={!!errors.name}
                                                    placeholder="Ahmet Yilmaz"
                                                />
                                                {errors.name && (
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.name}
                                                    </Form.Control.Feedback>
                                                )}
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Telefon</Form.Label>
                                                <Form.Control
                                                    type="tel"
                                                    value={data.phone}
                                                    onChange={(e) => setData('phone', e.target.value)}
                                                    isInvalid={!!errors.phone}
                                                    placeholder="0532 123 45 67"
                                                />
                                                {errors.phone && (
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.phone}
                                                    </Form.Control.Feedback>
                                                )}
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            {/* License Info */}
                            <Card className="border-0 shadow-sm mb-4">
                                <Card.Header className="bg-white">
                                    <h5 className="mb-0">
                                        <i className="ri-id-card-line me-2"></i>
                                        Ehliyet Bilgileri
                                    </h5>
                                </Card.Header>
                                <Card.Body>
                                    <Row>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Ehliyet No</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={data.license_number}
                                                    onChange={(e) => setData('license_number', e.target.value)}
                                                    isInvalid={!!errors.license_number}
                                                    placeholder="AB123456"
                                                />
                                                {errors.license_number && (
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.license_number}
                                                    </Form.Control.Feedback>
                                                )}
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Ehliyet Sinifi</Form.Label>
                                                <Form.Select
                                                    value={data.license_type}
                                                    onChange={(e) => setData('license_type', e.target.value)}
                                                    isInvalid={!!errors.license_type}
                                                >
                                                    {licenseTypes.map((type) => (
                                                        <option key={type.value} value={type.value}>
                                                            {type.label}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                                {errors.license_type && (
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.license_type}
                                                    </Form.Control.Feedback>
                                                )}
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Ehliyet Bitis Tarihi</Form.Label>
                                                <Form.Control
                                                    type="date"
                                                    value={data.license_expiry}
                                                    onChange={(e) => setData('license_expiry', e.target.value)}
                                                    isInvalid={!!errors.license_expiry}
                                                />
                                                {errors.license_expiry && (
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.license_expiry}
                                                    </Form.Control.Feedback>
                                                )}
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            {/* Notes */}
                            <Card className="border-0 shadow-sm mb-4">
                                <Card.Header className="bg-white">
                                    <h5 className="mb-0">
                                        <i className="ri-file-text-line me-2"></i>
                                        Notlar
                                    </h5>
                                </Card.Header>
                                <Card.Body>
                                    <Form.Group>
                                        <Form.Control
                                            as="textarea"
                                            rows={4}
                                            value={data.driver_notes}
                                            onChange={(e) => setData('driver_notes', e.target.value)}
                                            isInvalid={!!errors.driver_notes}
                                            placeholder="Sofor hakkinda notlar..."
                                        />
                                        {errors.driver_notes && (
                                            <Form.Control.Feedback type="invalid">
                                                {errors.driver_notes}
                                            </Form.Control.Feedback>
                                        )}
                                    </Form.Group>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col lg={4}>
                            {/* Status */}
                            {isEdit && (
                                <Card className="border-0 shadow-sm mb-4">
                                    <Card.Header className="bg-white">
                                        <h5 className="mb-0">
                                            <i className="ri-settings-line me-2"></i>
                                            Durum
                                        </h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Form.Check
                                            type="switch"
                                            id="is_active_driver"
                                            label="Aktif Sofor"
                                            checked={data.is_active_driver}
                                            onChange={(e) => setData('is_active_driver', e.target.checked)}
                                        />
                                        <Form.Text className="text-muted">
                                            Pasif soforler sevk emirlerinde secilemez.
                                        </Form.Text>
                                    </Card.Body>
                                </Card>
                            )}

                            {/* Actions */}
                            <Card className="border-0 shadow-sm">
                                <Card.Body>
                                    <div className="d-grid gap-2">
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            size="lg"
                                            disabled={processing}
                                        >
                                            {processing ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                                    Kaydediliyor...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="ri-save-line me-2"></i>
                                                    {isEdit ? 'Guncelle' : 'Kaydet'}
                                                </>
                                            )}
                                        </Button>
                                        <Link
                                            href={route('warehouse.drivers.index')}
                                            className="btn btn-outline-secondary"
                                        >
                                            Iptal
                                        </Link>
                                    </div>

                                    {Object.keys(errors).length > 0 && (
                                        <Alert variant="danger" className="mt-3 mb-0">
                                            <small>Lutfen hatalari duzeltip tekrar deneyin.</small>
                                        </Alert>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Form>
            </div>
                </div>
        </Layout>
    );
}
