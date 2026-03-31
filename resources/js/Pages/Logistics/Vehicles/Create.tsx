import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Card, Button, Row, Col, Form, Alert } from 'react-bootstrap';
import Layout from '@/Layouts';

interface Location {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
}

interface Props {
    locations: Location[];
    users: User[];
}

export default function Create({ locations, users }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        plate_number: '',
        make: '',
        model: '',
        year: '',
        color: '',
        vehicle_type: 'van',
        fuel_type: '',
        capacity: '',
        mileage: '',
        location_id: '',
        user_id: '',
        registration_number: '',
        license_serial_number: '',
        insurance_expiry_date: '',
        traffic_insurance_expiry: '',
        inspection_date: '',
        exhaust_inspection_date: '',
        hgs_label_number: '',
        have_winter_tires: false,
        have_summer_tires: false,
        tire_type: '',
        status: 'available',
        is_active: true,
        is_available: true,
        notes: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('logistics.vehicles.store'));
    };

    const vehicleTypes = [
        { value: 'car', label: 'Binek Otomobil' },
        { value: 'van', label: 'Hafif Ticari' },
        { value: 'truck', label: 'Kamyon' },
        { value: 'motorcycle', label: 'Motosiklet' },
        { value: 'bus', label: 'Otobus' },
        { value: 'trailer', label: 'Romork/Dorse' },
        { value: 'other', label: 'Diger' },
    ];

    const fuelTypes = [
        { value: '', label: 'Secin...' },
        { value: 'gasoline', label: 'Benzin' },
        { value: 'diesel', label: 'Dizel' },
        { value: 'lpg', label: 'LPG' },
        { value: 'cng', label: 'CNG' },
        { value: 'electric', label: 'Elektrik' },
        { value: 'hybrid', label: 'Hibrit' },
    ];

    const statusOptions = [
        { value: 'available', label: 'Musait' },
        { value: 'in_use', label: 'Kullanımda' },
        { value: 'maintenance', label: 'Bakımda' },
        { value: 'retired', label: 'Emekli' },
    ];

    return (
        <Layout>
            <Head title="Yeni Arac Ekle" />

            <div className="container-fluid py-4">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <Link
                            href={route('logistics.vehicles.index')}
                            className="text-muted text-decoration-none mb-2 d-inline-block"
                        >
                            <i className="ri-arrow-left-line me-1"></i>
                            Araclara Don
                        </Link>
                        <h4 className="mb-0">Yeni Arac Ekle</h4>
                    </div>
                </div>

                <Form onSubmit={handleSubmit}>
                    <Row>
                        <Col lg={8}>
                            {/* Basic Info */}
                            <Card className="border-0 shadow-sm mb-4">
                                <Card.Header className="bg-white">
                                    <h5 className="mb-0">
                                        <i className="ri-car-line me-2"></i>
                                        Arac Bilgileri
                                    </h5>
                                </Card.Header>
                                <Card.Body>
                                    <Row>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Plaka *</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={data.plate_number}
                                                    onChange={(e) => setData('plate_number', e.target.value.toUpperCase().replace(/\s+/g, ''))}
                                                    isInvalid={!!errors.plate_number}
                                                    placeholder="34ABC123"
                                                />
                                                {errors.plate_number && (
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.plate_number}
                                                    </Form.Control.Feedback>
                                                )}
                                                <Form.Text className="text-muted">
                                                    Bosluksuz giriniz.
                                                </Form.Text>
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Arac Adi</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={data.name}
                                                    onChange={(e) => setData('name', e.target.value)}
                                                    placeholder="Ornek: Sevkiyat 1"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Arac Tipi *</Form.Label>
                                                <Form.Select
                                                    value={data.vehicle_type}
                                                    onChange={(e) => setData('vehicle_type', e.target.value)}
                                                    isInvalid={!!errors.vehicle_type}
                                                >
                                                    {vehicleTypes.map((type) => (
                                                        <option key={type.value} value={type.value}>
                                                            {type.label}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={3}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Marka</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={data.make}
                                                    onChange={(e) => setData('make', e.target.value)}
                                                    placeholder="Ford"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Model</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={data.model}
                                                    onChange={(e) => setData('model', e.target.value)}
                                                    placeholder="Transit"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Yil</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    value={data.year}
                                                    onChange={(e) => setData('year', e.target.value)}
                                                    min="1990"
                                                    max="2030"
                                                    placeholder="2024"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Renk</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={data.color}
                                                    onChange={(e) => setData('color', e.target.value)}
                                                    placeholder="Beyaz"
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Yakit Tipi</Form.Label>
                                                <Form.Select
                                                    value={data.fuel_type}
                                                    onChange={(e) => setData('fuel_type', e.target.value)}
                                                >
                                                    {fuelTypes.map((type) => (
                                                        <option key={type.value} value={type.value}>
                                                            {type.label}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Kapasite (kg)</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    value={data.capacity}
                                                    onChange={(e) => setData('capacity', e.target.value)}
                                                    placeholder="1500"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Kilometre</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    value={data.mileage}
                                                    onChange={(e) => setData('mileage', e.target.value)}
                                                    placeholder="50000"
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            {/* Registration Info */}
                            <Card className="border-0 shadow-sm mb-4">
                                <Card.Header className="bg-white">
                                    <h5 className="mb-0">
                                        <i className="ri-file-text-line me-2"></i>
                                        Ruhsat ve Sigorta
                                    </h5>
                                </Card.Header>
                                <Card.Body>
                                    <Row>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Ruhsat Seri No</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={data.registration_number}
                                                    onChange={(e) => setData('registration_number', e.target.value)}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Tescil Belgesi Seri No</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={data.license_serial_number}
                                                    onChange={(e) => setData('license_serial_number', e.target.value)}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>HGS Etiketi</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={data.hgs_label_number}
                                                    onChange={(e) => setData('hgs_label_number', e.target.value)}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={3}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Kasko Bitis</Form.Label>
                                                <Form.Control
                                                    type="date"
                                                    value={data.insurance_expiry_date}
                                                    onChange={(e) => setData('insurance_expiry_date', e.target.value)}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Trafik Sigortasi Bitis</Form.Label>
                                                <Form.Control
                                                    type="date"
                                                    value={data.traffic_insurance_expiry}
                                                    onChange={(e) => setData('traffic_insurance_expiry', e.target.value)}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Muayene Tarihi</Form.Label>
                                                <Form.Control
                                                    type="date"
                                                    value={data.inspection_date}
                                                    onChange={(e) => setData('inspection_date', e.target.value)}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Egzoz Muayene</Form.Label>
                                                <Form.Control
                                                    type="date"
                                                    value={data.exhaust_inspection_date}
                                                    onChange={(e) => setData('exhaust_inspection_date', e.target.value)}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            {/* Tire Info */}
                            <Card className="border-0 shadow-sm mb-4">
                                <Card.Header className="bg-white">
                                    <h5 className="mb-0">
                                        <i className="ri-settings-3-line me-2"></i>
                                        Lastik Bilgileri
                                    </h5>
                                </Card.Header>
                                <Card.Body>
                                    <Row>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Lastik Tipi</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={data.tire_type}
                                                    onChange={(e) => setData('tire_type', e.target.value)}
                                                    placeholder="215/65 R16"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Check
                                                type="switch"
                                                id="have_winter_tires"
                                                label="Kis Lastigi Var"
                                                checked={data.have_winter_tires}
                                                onChange={(e) => setData('have_winter_tires', e.target.checked)}
                                                className="mt-4"
                                            />
                                        </Col>
                                        <Col md={4}>
                                            <Form.Check
                                                type="switch"
                                                id="have_summer_tires"
                                                label="Yaz Lastigi Var"
                                                checked={data.have_summer_tires}
                                                onChange={(e) => setData('have_summer_tires', e.target.checked)}
                                                className="mt-4"
                                            />
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            {/* Notes */}
                            <Card className="border-0 shadow-sm mb-4">
                                <Card.Header className="bg-white">
                                    <h5 className="mb-0">
                                        <i className="ri-sticky-note-line me-2"></i>
                                        Notlar
                                    </h5>
                                </Card.Header>
                                <Card.Body>
                                    <Form.Group>
                                        <Form.Control
                                            as="textarea"
                                            rows={4}
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            placeholder="Arac hakkinda notlar..."
                                        />
                                    </Form.Group>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col lg={4}>
                            {/* Status */}
                            <Card className="border-0 shadow-sm mb-4">
                                <Card.Header className="bg-white">
                                    <h5 className="mb-0">
                                        <i className="ri-checkbox-circle-line me-2"></i>
                                        Durum
                                    </h5>
                                </Card.Header>
                                <Card.Body>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Arac Durumu *</Form.Label>
                                        <Form.Select
                                            value={data.status}
                                            onChange={(e) => setData('status', e.target.value)}
                                            isInvalid={!!errors.status}
                                        >
                                            {statusOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>

                                    <Form.Check
                                        type="switch"
                                        id="is_active"
                                        label="Aktif Arac"
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                        className="mb-3"
                                    />

                                    <Form.Check
                                        type="switch"
                                        id="is_available"
                                        label="Musait (Atanabilir)"
                                        checked={data.is_available}
                                        onChange={(e) => setData('is_available', e.target.checked)}
                                    />
                                    <Form.Text className="text-muted">
                                        Sevk emirlerinde secilebilmesi icin musait olmalidir.
                                    </Form.Text>
                                </Card.Body>
                            </Card>

                            {/* Assignment */}
                            <Card className="border-0 shadow-sm mb-4">
                                <Card.Header className="bg-white">
                                    <h5 className="mb-0">
                                        <i className="ri-user-location-line me-2"></i>
                                        Atama
                                    </h5>
                                </Card.Header>
                                <Card.Body>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Lokasyon</Form.Label>
                                        <Form.Select
                                            value={data.location_id}
                                            onChange={(e) => setData('location_id', e.target.value)}
                                        >
                                            <option value="">Secin...</option>
                                            {locations.map((loc) => (
                                                <option key={loc.id} value={loc.id}>
                                                    {loc.name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Sorumlu Kullanici</Form.Label>
                                        <Form.Select
                                            value={data.user_id}
                                            onChange={(e) => setData('user_id', e.target.value)}
                                        >
                                            <option value="">Secin...</option>
                                            {users.map((user) => (
                                                <option key={user.id} value={user.id}>
                                                    {user.name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Card.Body>
                            </Card>

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
                                                    Kaydet
                                                </>
                                            )}
                                        </Button>
                                        <Link
                                            href={route('logistics.vehicles.index')}
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
        </Layout>
    );
}
