import React from 'react';
import Layout from '@/Layouts';
import { Head, Link, useForm } from '@inertiajs/react';
import { Card, Form, Button, Row, Col } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface Props {
    unitTypes: Array<{
        value: string;
        label: string;
    }>;
}

export default function UnitCreate({ unitTypes }: Props) {
    const { t } = useTranslation();

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        symbol: '',
        type: 'piece',
        conversion_factor: '',
        base_unit_id: '',
        is_active: true,
        description: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('product-units.store'));
    };

    return (
        <Layout>
            <Head title="Yeni Birim Ekle" />

            <div className="page-content">
                <div className="container-fluid">
                    <Row className="mb-3">
                        <Col>
                            <div className="page-title-box d-flex align-items-center justify-content-between">
                                <h4 className="mb-0">Yeni Birim Ekle</h4>
                                <div className="d-flex gap-2">
                                    <Link href={route('product-units.index')} className="btn btn-secondary">
                                        <i className="ri-arrow-left-line me-1"></i>
                                        Geri Dön
                                    </Link>
                                </div>
                            </div>
                        </Col>
                    </Row>

                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col xl={8}>
                                <Card>
                                    <Card.Header>
                                        <h5 className="card-title mb-0">Birim Bilgileri</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Birim Adı <span className="text-danger">*</span></Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={data.name}
                                                        onChange={(e) => setData('name', e.target.value)}
                                                        isInvalid={!!errors.name}
                                                        placeholder="Örn: Kilogram, Metre, Adet"
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.name}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Sembol <span className="text-danger">*</span></Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={data.symbol}
                                                        onChange={(e) => setData('symbol', e.target.value)}
                                                        isInvalid={!!errors.symbol}
                                                        placeholder="Örn: kg, m, adet"
                                                        maxLength={10}
                                                    />
                                                    <Form.Text className="text-muted">
                                                        Kısa sembol (maksimum 10 karakter)
                                                    </Form.Text>
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.symbol}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Birim Tipi <span className="text-danger">*</span></Form.Label>
                                                    <Form.Select
                                                        value={data.type}
                                                        onChange={(e) => setData('type', e.target.value)}
                                                        isInvalid={!!errors.type}
                                                    >
                                                        {unitTypes.map(type => (
                                                            <option key={type.value} value={type.value}>
                                                                {type.label}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.type}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Durum</Form.Label>
                                                    <div className="d-flex gap-3 align-items-center">
                                                        <Form.Check
                                                            type="checkbox"
                                                            id="is_active"
                                                            label="Aktif"
                                                            checked={data.is_active}
                                                            onChange={(e) => setData('is_active', e.target.checked)}
                                                        />
                                                    </div>
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Açıklama</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={3}
                                                value={data.description}
                                                onChange={(e) => setData('description', e.target.value)}
                                                placeholder="Birim hakkında açıklama"
                                            />
                                        </Form.Group>
                                    </Card.Body>
                                </Card>
                            </Col>

                            <Col xl={4}>
                                <Card>
                                    <Card.Header>
                                        <h5 className="card-title mb-0">Çevrim Bilgileri</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <div className="alert alert-info">
                                            <i className="ri-information-line me-1"></i>
                                            <strong>Çevrim Faktörü:</strong> Bu birimden temel birime çevrim için kullanılan sayı.
                                            <br />
                                            <small>Örn: 1 kg = 1000 g ise çevrim faktörü 1000'dir.</small>
                                        </div>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Çevrim Faktörü</Form.Label>
                                            <Form.Control
                                                type="number"
                                                min="0"
                                                step="0.0001"
                                                value={data.conversion_factor}
                                                onChange={(e) => setData('conversion_factor', e.target.value)}
                                                placeholder="1.0"
                                            />
                                            <Form.Text className="text-muted">
                                                Temel birime çevrim faktörü
                                            </Form.Text>
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Temel Birim</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={data.base_unit_id}
                                                onChange={(e) => setData('base_unit_id', e.target.value)}
                                                placeholder="Temel birim ID'si"
                                                disabled
                                            />
                                            <Form.Text className="text-muted">
                                                Düzenleme sırasında seçilebilir
                                            </Form.Text>
                                        </Form.Group>
                                    </Card.Body>
                                </Card>

                                <Card>
                                    <Card.Header>
                                        <h5 className="card-title mb-0">Örnek Birimler</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <div className="small">
                                            <strong>Uzunluk:</strong> m, cm, mm, km<br />
                                            <strong>Ağırlık:</strong> kg, g, ton<br />  
                                            <strong>Hacim:</strong> lt, ml, m³<br />
                                            <strong>Alan:</strong> m², cm², km²<br />
                                            <strong>Adet:</strong> adet, çift, düzine<br />
                                            <strong>Zaman:</strong> saat, gün, ay
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>

                        <Row>
                            <Col>
                                <div className="text-end">
                                    <Link href={route('product-units.index')} className="btn btn-secondary me-2">
                                        İptal
                                    </Link>
                                    <Button type="submit" variant="primary" disabled={processing}>
                                        {processing ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Kaydediliyor...
                                            </>
                                        ) : (
                                            <>
                                                <i className="ri-save-line me-1"></i>
                                                Birimi Kaydet
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </Col>
                        </Row>
                    </Form>
                </div>
            </div>
        </Layout>
    );
}