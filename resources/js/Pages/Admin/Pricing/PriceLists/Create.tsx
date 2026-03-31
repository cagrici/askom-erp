import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import Layout from '@/Layouts';

interface CustomerGroup {
    id: number;
    name: string;
}

interface Props {
    types: Record<string, string>;
    currencies: Record<string, string>;
    customerGroups: CustomerGroup[];
}

export default function Create({ types, currencies, customerGroups }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        code: '',
        description: '',
        type: 'sale',
        currency: 'TRY',
        valid_from: '',
        valid_until: '',
        is_active: true,
        is_default: false,
        customer_groups: [] as number[]
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('sales.price-lists.store'), {
            onSuccess: () => reset()
        });
    };

    const handleCustomerGroupChange = (groupId: number, checked: boolean) => {
        if (checked) {
            setData('customer_groups', [...data.customer_groups, groupId]);
        } else {
            setData('customer_groups', data.customer_groups.filter(id => id !== groupId));
        }
    };

    return (
        <Layout>
            <Head title="Yeni Fiyat Listesi" />
            
            <div className="page-content">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="h3 mb-1">
                            <i className="ri-price-tag-3-line me-2"></i>
                            Yeni Fiyat Listesi
                        </h1>
                        <p className="text-muted mb-0">
                            Ürünler için yeni bir fiyat listesi oluşturun
                        </p>
                    </div>

                    <Link href={route('sales.price-lists.index')}>
                        <Button variant="outline-secondary">
                            <i className="ri-arrow-left-line me-1"></i>
                            Geri
                        </Button>
                    </Link>
                </div>

                <Form onSubmit={handleSubmit}>
                    <Row>
                        <Col lg={8}>
                            <Card className="mb-4">
                                <Card.Header>
                                    <h5 className="mb-0">Temel Bilgiler</h5>
                                </Card.Header>
                                <Card.Body>
                                    <Row className="g-3">
                                        <Col md={6}>
                                            <Form.Label>Fiyat Listesi Adı *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                isInvalid={!!errors.name}
                                                placeholder="Örn: Bayi Fiyat Listesi"
                                            />
                                            {errors.name && (
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.name}
                                                </Form.Control.Feedback>
                                            )}
                                        </Col>

                                        <Col md={6}>
                                            <Form.Label>Fiyat Listesi Kodu</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={data.code}
                                                onChange={(e) => setData('code', e.target.value)}
                                                isInvalid={!!errors.code}
                                                placeholder="Boş bırakılırsa otomatik oluşturulur"
                                            />
                                            {errors.code && (
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.code}
                                                </Form.Control.Feedback>
                                            )}
                                            <Form.Text className="text-muted">
                                                Boş bırakılırsa otomatik olarak oluşturulur
                                            </Form.Text>
                                        </Col>

                                        <Col md={6}>
                                            <Form.Label>Fiyat Listesi Tipi *</Form.Label>
                                            <Form.Select
                                                value={data.type}
                                                onChange={(e) => setData('type', e.target.value)}
                                                isInvalid={!!errors.type}
                                            >
                                                {Object.entries(types).map(([value, label]) => (
                                                    <option key={value} value={value}>{label}</option>
                                                ))}
                                            </Form.Select>
                                            {errors.type && (
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.type}
                                                </Form.Control.Feedback>
                                            )}
                                        </Col>

                                        <Col md={6}>
                                            <Form.Label>Para Birimi *</Form.Label>
                                            <Form.Select
                                                value={data.currency}
                                                onChange={(e) => setData('currency', e.target.value)}
                                                isInvalid={!!errors.currency}
                                            >
                                                {Object.entries(currencies).map(([value, label]) => (
                                                    <option key={value} value={value}>{value} - {label}</option>
                                                ))}
                                            </Form.Select>
                                            {errors.currency && (
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.currency}
                                                </Form.Control.Feedback>
                                            )}
                                        </Col>

                                        <Col xs={12}>
                                            <Form.Label>Açıklama</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={3}
                                                value={data.description}
                                                onChange={(e) => setData('description', e.target.value)}
                                                isInvalid={!!errors.description}
                                                placeholder="Fiyat listesi hakkında açıklama..."
                                            />
                                            {errors.description && (
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.description}
                                                </Form.Control.Feedback>
                                            )}
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            <Card className="mb-4">
                                <Card.Header>
                                    <h5 className="mb-0">Geçerlilik Tarihleri</h5>
                                </Card.Header>
                                <Card.Body>
                                    <Row className="g-3">
                                        <Col md={6}>
                                            <Form.Label>Geçerlilik Başlangıcı</Form.Label>
                                            <Form.Control
                                                type="date"
                                                value={data.valid_from}
                                                onChange={(e) => setData('valid_from', e.target.value)}
                                                isInvalid={!!errors.valid_from}
                                            />
                                            {errors.valid_from && (
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.valid_from}
                                                </Form.Control.Feedback>
                                            )}
                                            <Form.Text className="text-muted">
                                                Boş bırakılırsa hemen geçerli olur
                                            </Form.Text>
                                        </Col>

                                        <Col md={6}>
                                            <Form.Label>Geçerlilik Bitişi</Form.Label>
                                            <Form.Control
                                                type="date"
                                                value={data.valid_until}
                                                onChange={(e) => setData('valid_until', e.target.value)}
                                                isInvalid={!!errors.valid_until}
                                            />
                                            {errors.valid_until && (
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.valid_until}
                                                </Form.Control.Feedback>
                                            )}
                                            <Form.Text className="text-muted">
                                                Boş bırakılırsa süresiz geçerli olur
                                            </Form.Text>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            {customerGroups.length > 0 && (
                                <Card className="mb-4">
                                    <Card.Header>
                                        <h5 className="mb-0">Müşteri Grup Atamaları</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <p className="text-muted small mb-3">
                                            Bu fiyat listesinin hangi müşteri gruplarına uygulanacağını seçin. 
                                            Hiçbiri seçilmezse tüm müşterilere uygulanır.
                                        </p>
                                        <Row>
                                            {customerGroups.map((group) => (
                                                <Col md={6} key={group.id} className="mb-2">
                                                    <Form.Check
                                                        type="checkbox"
                                                        id={`group-${group.id}`}
                                                        label={group.name}
                                                        checked={data.customer_groups.includes(group.id)}
                                                        onChange={(e) => handleCustomerGroupChange(group.id, e.target.checked)}
                                                    />
                                                </Col>
                                            ))}
                                        </Row>
                                    </Card.Body>
                                </Card>
                            )}
                        </Col>

                        <Col lg={4}>
                            <Card className="mb-4">
                                <Card.Header>
                                    <h5 className="mb-0">Durum Ayarları</h5>
                                </Card.Header>
                                <Card.Body>
                                    <div className="mb-3">
                                        <Form.Check
                                            type="checkbox"
                                            id="is_active"
                                            label="Aktif"
                                            checked={data.is_active}
                                            onChange={(e) => setData('is_active', e.target.checked)}
                                        />
                                        <Form.Text className="text-muted">
                                            Pasif fiyat listeleri kullanılmaz
                                        </Form.Text>
                                    </div>

                                    <div className="mb-3">
                                        <Form.Check
                                            type="checkbox"
                                            id="is_default"
                                            label="Varsayılan"
                                            checked={data.is_default}
                                            onChange={(e) => setData('is_default', e.target.checked)}
                                        />
                                        <Form.Text className="text-muted">
                                            Bu tip ve para birimi için varsayılan liste
                                        </Form.Text>
                                    </div>

                                    {data.is_default && (
                                        <Alert variant="info" className="mb-0">
                                            <small>
                                                <i className="ri-information-line me-1"></i>
                                                Varsayılan olarak işaretlenen liste, aynı tip ve para birimindeki
                                                diğer varsayılan listelerin varsayılan durumunu kaldıracaktır.
                                            </small>
                                        </Alert>
                                    )}
                                </Card.Body>
                            </Card>

                            <Card>
                                <Card.Header>
                                    <h5 className="mb-0">İşlemler</h5>
                                </Card.Header>
                                <Card.Body>
                                    <div className="d-grid gap-2">
                                        <Button 
                                            type="submit" 
                                            variant="primary"
                                            disabled={processing}
                                        >
                                            {processing ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                                    Oluşturuluyor...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="ri-save-line me-1"></i>
                                                    Fiyat Listesini Oluştur
                                                </>
                                            )}
                                        </Button>

                                        <Link href={route('sales.price-lists.index')}>
                                            <Button variant="outline-secondary" className="w-100">
                                                <i className="ri-close-line me-1"></i>
                                                İptal
                                            </Button>
                                        </Link>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Form>
            </div>
        </Layout>
    );
}