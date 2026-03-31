import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Card, Button, Row, Col, Form, Nav, Tab } from 'react-bootstrap';
import Layout from '@/Layouts';

interface SalesTarget {
    id?: number;
    name: string;
    code: string;
    description: string | null;
    period_type: string;
    assignment_type: string;
    start_date: string;
    end_date: string;
    status: string;
    is_active: boolean;

    // Target Metrics
    revenue_target: number;
    quantity_target: number;
    order_target: number;
    new_customer_target: number;

    // Weights
    revenue_weight: number;
    quantity_weight: number;
    order_weight: number;
    new_customer_weight: number;

    // Assignment
    user_id: number | null;
    department_id: number | null;
    location_id: number | null;

    // Bonus/Reward
    bonus_threshold: number;
    bonus_amount: number | null;
    bonus_type: string | null;

    notes: string | null;
}

interface User {
    id: number;
    name: string;
}

interface Department {
    id: number;
    name: string;
}

interface Location {
    id: number;
    name: string;
}

interface SelectOption {
    value: string;
    label: string;
}

interface Props {
    target: SalesTarget | null;
    users: User[];
    departments: Department[];
    locations: Location[];
    periodTypes: SelectOption[];
    assignmentTypes: SelectOption[];
    statuses: SelectOption[];
}

export default function TargetForm({
    target,
    users,
    departments,
    locations,
    periodTypes,
    assignmentTypes,
    statuses,
}: Props) {
    const isEdit = !!target?.id;
    const [activeTab, setActiveTab] = useState('basic');

    const { data, setData, post, put, processing, errors } = useForm<SalesTarget>({
        name: target?.name || '',
        code: target?.code || '',
        description: target?.description || null,
        period_type: target?.period_type || 'monthly',
        assignment_type: target?.assignment_type || 'salesperson',
        start_date: target?.start_date || '',
        end_date: target?.end_date || '',
        status: target?.status || 'active',
        is_active: target?.is_active ?? true,

        revenue_target: target?.revenue_target || 0,
        quantity_target: target?.quantity_target || 0,
        order_target: target?.order_target || 0,
        new_customer_target: target?.new_customer_target || 0,

        revenue_weight: target?.revenue_weight || 40,
        quantity_weight: target?.quantity_weight || 30,
        order_weight: target?.order_weight || 20,
        new_customer_weight: target?.new_customer_weight || 10,

        user_id: target?.user_id || null,
        department_id: target?.department_id || null,
        location_id: target?.location_id || null,

        bonus_threshold: target?.bonus_threshold || 100,
        bonus_amount: target?.bonus_amount || null,
        bonus_type: target?.bonus_type || 'fixed',

        notes: target?.notes || null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEdit && target?.id) {
            put(route('sales.targets.update', target.id));
        } else {
            post(route('sales.targets.store'));
        }
    };

    const totalWeight = data.revenue_weight + data.quantity_weight + data.order_weight + data.new_customer_weight;

    return (
        <Layout>
            <Head title={isEdit ? 'Hedef Düzenle' : 'Yeni Hedef'} />

            <div className="page-content">
                <div className="container-fluid">
                    <Row className="mb-3">
                        <Col>
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">{isEdit ? 'Satış Hedefi Düzenle' : 'Yeni Satış Hedefi'}</h4>
                                <div className="page-title-right">
                                    <Link href={route('sales.targets.index')}>
                                        <Button variant="secondary" size="sm">
                                            <i className="ri-arrow-left-line me-1"></i>
                                            Geri Dön
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </Col>
                    </Row>

                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col lg={12}>
                                <Card>
                                    <Card.Body>
                                        <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'basic')}>
                                            <Nav variant="tabs" className="nav-tabs-custom">
                                                <Nav.Item>
                                                    <Nav.Link eventKey="basic">
                                                        <i className="ri-information-line me-1"></i>
                                                        Temel Bilgiler
                                                    </Nav.Link>
                                                </Nav.Item>
                                                <Nav.Item>
                                                    <Nav.Link eventKey="targets">
                                                        <i className="ri-target-line me-1"></i>
                                                        Hedefler
                                                    </Nav.Link>
                                                </Nav.Item>
                                                <Nav.Item>
                                                    <Nav.Link eventKey="assignment">
                                                        <i className="ri-user-settings-line me-1"></i>
                                                        Atama
                                                    </Nav.Link>
                                                </Nav.Item>
                                                <Nav.Item>
                                                    <Nav.Link eventKey="bonus">
                                                        <i className="ri-gift-line me-1"></i>
                                                        Bonus
                                                    </Nav.Link>
                                                </Nav.Item>
                                                <Nav.Item>
                                                    <Nav.Link eventKey="notes">
                                                        <i className="ri-file-text-line me-1"></i>
                                                        Notlar
                                                    </Nav.Link>
                                                </Nav.Item>
                                            </Nav>

                                            <Tab.Content className="pt-3">
                                                {/* Basic Information */}
                                                <Tab.Pane eventKey="basic">
                                                    <Row>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Hedef Adı *</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    value={data.name}
                                                                    onChange={(e) => setData('name', e.target.value)}
                                                                    isInvalid={!!errors.name}
                                                                    required
                                                                />
                                                                {errors.name && (
                                                                    <div className="invalid-feedback d-block">{errors.name}</div>
                                                                )}
                                                            </Form.Group>
                                                        </Col>

                                                        <Col md={6}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Hedef Kodu *</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    value={data.code}
                                                                    onChange={(e) => setData('code', e.target.value)}
                                                                    isInvalid={!!errors.code}
                                                                    required
                                                                />
                                                                {errors.code && (
                                                                    <div className="invalid-feedback d-block">{errors.code}</div>
                                                                )}
                                                            </Form.Group>
                                                        </Col>

                                                        <Col md={12}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Açıklama</Form.Label>
                                                                <Form.Control
                                                                    as="textarea"
                                                                    rows={3}
                                                                    value={data.description || ''}
                                                                    onChange={(e) => setData('description', e.target.value)}
                                                                />
                                                            </Form.Group>
                                                        </Col>

                                                        <Col md={4}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Dönem Tipi *</Form.Label>
                                                                <Form.Select
                                                                    value={data.period_type}
                                                                    onChange={(e) => setData('period_type', e.target.value)}
                                                                    required
                                                                >
                                                                    {periodTypes.map((option) => (
                                                                        <option key={option.value} value={option.value}>
                                                                            {option.label}
                                                                        </option>
                                                                    ))}
                                                                </Form.Select>
                                                            </Form.Group>
                                                        </Col>

                                                        <Col md={4}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Başlangıç Tarihi *</Form.Label>
                                                                <Form.Control
                                                                    type="date"
                                                                    value={data.start_date}
                                                                    onChange={(e) => setData('start_date', e.target.value)}
                                                                    isInvalid={!!errors.start_date}
                                                                    required
                                                                />
                                                                {errors.start_date && (
                                                                    <div className="invalid-feedback d-block">
                                                                        {errors.start_date}
                                                                    </div>
                                                                )}
                                                            </Form.Group>
                                                        </Col>

                                                        <Col md={4}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Bitiş Tarihi *</Form.Label>
                                                                <Form.Control
                                                                    type="date"
                                                                    value={data.end_date}
                                                                    onChange={(e) => setData('end_date', e.target.value)}
                                                                    isInvalid={!!errors.end_date}
                                                                    required
                                                                />
                                                                {errors.end_date && (
                                                                    <div className="invalid-feedback d-block">
                                                                        {errors.end_date}
                                                                    </div>
                                                                )}
                                                            </Form.Group>
                                                        </Col>

                                                        <Col md={6}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Durum</Form.Label>
                                                                <Form.Select
                                                                    value={data.status}
                                                                    onChange={(e) => setData('status', e.target.value)}
                                                                >
                                                                    {statuses.map((option) => (
                                                                        <option key={option.value} value={option.value}>
                                                                            {option.label}
                                                                        </option>
                                                                    ))}
                                                                </Form.Select>
                                                            </Form.Group>
                                                        </Col>

                                                        <Col md={6}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>&nbsp;</Form.Label>
                                                                <Form.Check
                                                                    type="switch"
                                                                    id="is_active"
                                                                    label="Aktif"
                                                                    checked={data.is_active}
                                                                    onChange={(e) => setData('is_active', e.target.checked)}
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>
                                                </Tab.Pane>

                                                {/* Targets */}
                                                <Tab.Pane eventKey="targets">
                                                    <Row>
                                                        <Col md={6}>
                                                            <Card className="border mb-3">
                                                                <Card.Body>
                                                                    <h6 className="mb-3">
                                                                        <i className="ri-money-dollar-circle-line text-success me-1"></i>
                                                                        Ciro Hedefi
                                                                    </h6>
                                                                    <Form.Group className="mb-3">
                                                                        <Form.Label>Hedef Tutar (₺)</Form.Label>
                                                                        <Form.Control
                                                                            type="number"
                                                                            step="0.01"
                                                                            value={data.revenue_target}
                                                                            onChange={(e) =>
                                                                                setData('revenue_target', parseFloat(e.target.value) || 0)
                                                                            }
                                                                        />
                                                                    </Form.Group>
                                                                    <Form.Group>
                                                                        <Form.Label>Ağırlık (%)</Form.Label>
                                                                        <Form.Control
                                                                            type="number"
                                                                            min="0"
                                                                            max="100"
                                                                            value={data.revenue_weight}
                                                                            onChange={(e) =>
                                                                                setData('revenue_weight', parseInt(e.target.value) || 0)
                                                                            }
                                                                        />
                                                                    </Form.Group>
                                                                </Card.Body>
                                                            </Card>
                                                        </Col>

                                                        <Col md={6}>
                                                            <Card className="border mb-3">
                                                                <Card.Body>
                                                                    <h6 className="mb-3">
                                                                        <i className="ri-inbox-line text-info me-1"></i>
                                                                        Adet Hedefi
                                                                    </h6>
                                                                    <Form.Group className="mb-3">
                                                                        <Form.Label>Hedef Adet</Form.Label>
                                                                        <Form.Control
                                                                            type="number"
                                                                            value={data.quantity_target}
                                                                            onChange={(e) =>
                                                                                setData('quantity_target', parseInt(e.target.value) || 0)
                                                                            }
                                                                        />
                                                                    </Form.Group>
                                                                    <Form.Group>
                                                                        <Form.Label>Ağırlık (%)</Form.Label>
                                                                        <Form.Control
                                                                            type="number"
                                                                            min="0"
                                                                            max="100"
                                                                            value={data.quantity_weight}
                                                                            onChange={(e) =>
                                                                                setData('quantity_weight', parseInt(e.target.value) || 0)
                                                                            }
                                                                        />
                                                                    </Form.Group>
                                                                </Card.Body>
                                                            </Card>
                                                        </Col>

                                                        <Col md={6}>
                                                            <Card className="border mb-3">
                                                                <Card.Body>
                                                                    <h6 className="mb-3">
                                                                        <i className="ri-file-list-line text-primary me-1"></i>
                                                                        Sipariş Hedefi
                                                                    </h6>
                                                                    <Form.Group className="mb-3">
                                                                        <Form.Label>Hedef Sipariş Sayısı</Form.Label>
                                                                        <Form.Control
                                                                            type="number"
                                                                            value={data.order_target}
                                                                            onChange={(e) =>
                                                                                setData('order_target', parseInt(e.target.value) || 0)
                                                                            }
                                                                        />
                                                                    </Form.Group>
                                                                    <Form.Group>
                                                                        <Form.Label>Ağırlık (%)</Form.Label>
                                                                        <Form.Control
                                                                            type="number"
                                                                            min="0"
                                                                            max="100"
                                                                            value={data.order_weight}
                                                                            onChange={(e) =>
                                                                                setData('order_weight', parseInt(e.target.value) || 0)
                                                                            }
                                                                        />
                                                                    </Form.Group>
                                                                </Card.Body>
                                                            </Card>
                                                        </Col>

                                                        <Col md={6}>
                                                            <Card className="border mb-3">
                                                                <Card.Body>
                                                                    <h6 className="mb-3">
                                                                        <i className="ri-user-add-line text-warning me-1"></i>
                                                                        Yeni Müşteri Hedefi
                                                                    </h6>
                                                                    <Form.Group className="mb-3">
                                                                        <Form.Label>Hedef Yeni Müşteri</Form.Label>
                                                                        <Form.Control
                                                                            type="number"
                                                                            value={data.new_customer_target}
                                                                            onChange={(e) =>
                                                                                setData(
                                                                                    'new_customer_target',
                                                                                    parseInt(e.target.value) || 0
                                                                                )
                                                                            }
                                                                        />
                                                                    </Form.Group>
                                                                    <Form.Group>
                                                                        <Form.Label>Ağırlık (%)</Form.Label>
                                                                        <Form.Control
                                                                            type="number"
                                                                            min="0"
                                                                            max="100"
                                                                            value={data.new_customer_weight}
                                                                            onChange={(e) =>
                                                                                setData(
                                                                                    'new_customer_weight',
                                                                                    parseInt(e.target.value) || 0
                                                                                )
                                                                            }
                                                                        />
                                                                    </Form.Group>
                                                                </Card.Body>
                                                            </Card>
                                                        </Col>

                                                        <Col md={12}>
                                                            <div
                                                                className={`alert ${totalWeight === 100 ? 'alert-success' : 'alert-warning'}`}
                                                            >
                                                                <i className="ri-information-line me-1"></i>
                                                                Toplam Ağırlık: <strong>{totalWeight}%</strong>
                                                                {totalWeight !== 100 && ' (Toplam ağırlık 100% olmalıdır)'}
                                                            </div>
                                                        </Col>
                                                    </Row>
                                                </Tab.Pane>

                                                {/* Assignment */}
                                                <Tab.Pane eventKey="assignment">
                                                    <Row>
                                                        <Col md={12} className="mb-3">
                                                            <Form.Group>
                                                                <Form.Label>Atama Tipi *</Form.Label>
                                                                <Form.Select
                                                                    value={data.assignment_type}
                                                                    onChange={(e) => setData('assignment_type', e.target.value)}
                                                                    required
                                                                >
                                                                    {assignmentTypes.map((option) => (
                                                                        <option key={option.value} value={option.value}>
                                                                            {option.label}
                                                                        </option>
                                                                    ))}
                                                                </Form.Select>
                                                            </Form.Group>
                                                        </Col>

                                                        {data.assignment_type === 'salesperson' && (
                                                            <Col md={12}>
                                                                <Form.Group>
                                                                    <Form.Label>Satış Sorumlusu *</Form.Label>
                                                                    <Form.Select
                                                                        value={data.user_id || ''}
                                                                        onChange={(e) =>
                                                                            setData('user_id', parseInt(e.target.value) || null)
                                                                        }
                                                                        required
                                                                        isInvalid={!!errors.user_id}
                                                                    >
                                                                        <option value="">Seçiniz...</option>
                                                                        {users.map((user) => (
                                                                            <option key={user.id} value={user.id}>
                                                                                {user.name}
                                                                            </option>
                                                                        ))}
                                                                    </Form.Select>
                                                                    {errors.user_id && (
                                                                        <div className="invalid-feedback d-block">
                                                                            {errors.user_id}
                                                                        </div>
                                                                    )}
                                                                </Form.Group>
                                                            </Col>
                                                        )}

                                                        {data.assignment_type === 'department' && (
                                                            <Col md={12}>
                                                                <Form.Group>
                                                                    <Form.Label>Departman *</Form.Label>
                                                                    <Form.Select
                                                                        value={data.department_id || ''}
                                                                        onChange={(e) =>
                                                                            setData('department_id', parseInt(e.target.value) || null)
                                                                        }
                                                                        required
                                                                        isInvalid={!!errors.department_id}
                                                                    >
                                                                        <option value="">Seçiniz...</option>
                                                                        {departments.map((dept) => (
                                                                            <option key={dept.id} value={dept.id}>
                                                                                {dept.name}
                                                                            </option>
                                                                        ))}
                                                                    </Form.Select>
                                                                    {errors.department_id && (
                                                                        <div className="invalid-feedback d-block">
                                                                            {errors.department_id}
                                                                        </div>
                                                                    )}
                                                                </Form.Group>
                                                            </Col>
                                                        )}

                                                        {data.assignment_type === 'location' && (
                                                            <Col md={12}>
                                                                <Form.Group>
                                                                    <Form.Label>Lokasyon *</Form.Label>
                                                                    <Form.Select
                                                                        value={data.location_id || ''}
                                                                        onChange={(e) =>
                                                                            setData('location_id', parseInt(e.target.value) || null)
                                                                        }
                                                                        required
                                                                        isInvalid={!!errors.location_id}
                                                                    >
                                                                        <option value="">Seçiniz...</option>
                                                                        {locations.map((loc) => (
                                                                            <option key={loc.id} value={loc.id}>
                                                                                {loc.name}
                                                                            </option>
                                                                        ))}
                                                                    </Form.Select>
                                                                    {errors.location_id && (
                                                                        <div className="invalid-feedback d-block">
                                                                            {errors.location_id}
                                                                        </div>
                                                                    )}
                                                                </Form.Group>
                                                            </Col>
                                                        )}

                                                        {(data.assignment_type === 'team' ||
                                                            data.assignment_type === 'company') && (
                                                            <Col md={12}>
                                                                <div className="alert alert-info">
                                                                    <i className="ri-information-line me-1"></i>
                                                                    {data.assignment_type === 'team'
                                                                        ? 'Tüm ekip için geçerli olacaktır.'
                                                                        : 'Tüm şirket için geçerli olacaktır.'}
                                                                </div>
                                                            </Col>
                                                        )}
                                                    </Row>
                                                </Tab.Pane>

                                                {/* Bonus */}
                                                <Tab.Pane eventKey="bonus">
                                                    <Row>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Bonus Eşiği (%)</Form.Label>
                                                                <Form.Control
                                                                    type="number"
                                                                    min="0"
                                                                    max="200"
                                                                    value={data.bonus_threshold}
                                                                    onChange={(e) =>
                                                                        setData('bonus_threshold', parseFloat(e.target.value) || 0)
                                                                    }
                                                                />
                                                                <Form.Text>Bonus alabilmek için gereken minimum başarı yüzdesi</Form.Text>
                                                            </Form.Group>
                                                        </Col>

                                                        <Col md={6}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Bonus Tipi</Form.Label>
                                                                <Form.Select
                                                                    value={data.bonus_type || 'fixed'}
                                                                    onChange={(e) => setData('bonus_type', e.target.value)}
                                                                >
                                                                    <option value="fixed">Sabit Tutar</option>
                                                                    <option value="percentage">Yüzde</option>
                                                                </Form.Select>
                                                            </Form.Group>
                                                        </Col>

                                                        <Col md={12}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Bonus Tutarı (₺)</Form.Label>
                                                                <Form.Control
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={data.bonus_amount || ''}
                                                                    onChange={(e) =>
                                                                        setData('bonus_amount', parseFloat(e.target.value) || null)
                                                                    }
                                                                />
                                                                <Form.Text>
                                                                    {data.bonus_type === 'percentage'
                                                                        ? 'Hedefi aşan tutarın yüzdesi olarak hesaplanacak bonus'
                                                                        : 'Sabit bonus tutarı'}
                                                                </Form.Text>
                                                            </Form.Group>
                                                        </Col>

                                                        <Col md={12}>
                                                            <div className="alert alert-success">
                                                                <i className="ri-gift-line me-2"></i>
                                                                <strong>Bonus Hesaplama:</strong>
                                                                <br />
                                                                Genel başarı oranı <strong>{data.bonus_threshold}%</strong> ve üzerinde
                                                                olduğunda bonus uygulanacaktır.
                                                            </div>
                                                        </Col>
                                                    </Row>
                                                </Tab.Pane>

                                                {/* Notes */}
                                                <Tab.Pane eventKey="notes">
                                                    <Row>
                                                        <Col md={12}>
                                                            <Form.Group>
                                                                <Form.Label>Notlar</Form.Label>
                                                                <Form.Control
                                                                    as="textarea"
                                                                    rows={10}
                                                                    value={data.notes || ''}
                                                                    onChange={(e) => setData('notes', e.target.value)}
                                                                    placeholder="Hedef ile ilgili notlar, açıklamalar veya özel durumlar..."
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>
                                                </Tab.Pane>
                                            </Tab.Content>
                                        </Tab.Container>

                                        <hr />

                                        <div className="d-flex justify-content-end gap-2">
                                            <Link href={route('sales.targets.index')}>
                                                <Button variant="light">İptal</Button>
                                            </Link>
                                            <Button variant="primary" type="submit" disabled={processing || totalWeight !== 100}>
                                                <i className="ri-save-line me-1"></i>
                                                {processing ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Kaydet'}
                                            </Button>
                                        </div>
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
