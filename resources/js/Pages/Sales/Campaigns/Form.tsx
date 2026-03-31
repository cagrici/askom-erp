import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Card, Button, Row, Col, Form } from 'react-bootstrap';
import Layout from '@/Layouts';

interface Campaign {
    id?: number;
    name: string;
    code: string;
    description: string;
    type: string;
    target_type: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
    discount_value: number | null;
    min_purchase_amount: number | null;
    max_discount_amount: number | null;
    buy_quantity: number | null;
    get_quantity: number | null;
    usage_limit: number | null;
    usage_limit_per_customer: number | null;
    product_ids: number[] | null;
    category_ids: number[] | null;
    excluded_product_ids: number[] | null;
    excluded_category_ids: number[] | null;
    customer_ids: number[] | null;
    customer_group_ids: number[] | null;
    location_ids: number[] | null;
    gift_product_id: number | null;
    gift_quantity: number | null;
    priority: number;
    can_stack: boolean;
    requires_coupon: boolean;
    coupon_code: string | null;
    show_on_website: boolean;
    banner_image: string | null;
    terms_conditions: string | null;
    status: string;
    notes: string | null;
}

interface Product {
    id: number;
    name: string;
    code: string;
}

interface Customer {
    id: number;
    title: string;
    account_code: string;
}

interface Props {
    campaign: Campaign | null;
    products: Product[];
    customers: Customer[];
    types: Record<string, string>;
    targetTypes: Record<string, string>;
    statuses: Record<string, string>;
}

export default function CampaignForm({ campaign, products, customers, types, targetTypes, statuses }: Props) {
    const isEdit = !!campaign?.id;

    const { data, setData, post, put, processing, errors } = useForm<Campaign>({
        name: campaign?.name || '',
        code: campaign?.code || '',
        description: campaign?.description || '',
        type: campaign?.type || 'discount_percentage',
        target_type: campaign?.target_type || 'all',
        start_date: campaign?.start_date || '',
        end_date: campaign?.end_date || '',
        is_active: campaign?.is_active ?? true,
        discount_value: campaign?.discount_value || null,
        min_purchase_amount: campaign?.min_purchase_amount || null,
        max_discount_amount: campaign?.max_discount_amount || null,
        buy_quantity: campaign?.buy_quantity || null,
        get_quantity: campaign?.get_quantity || null,
        usage_limit: campaign?.usage_limit || null,
        usage_limit_per_customer: campaign?.usage_limit_per_customer || null,
        product_ids: campaign?.product_ids || null,
        category_ids: campaign?.category_ids || null,
        excluded_product_ids: campaign?.excluded_product_ids || null,
        excluded_category_ids: campaign?.excluded_category_ids || null,
        customer_ids: campaign?.customer_ids || null,
        customer_group_ids: campaign?.customer_group_ids || null,
        location_ids: campaign?.location_ids || null,
        gift_product_id: campaign?.gift_product_id || null,
        gift_quantity: campaign?.gift_quantity || null,
        priority: campaign?.priority || 0,
        can_stack: campaign?.can_stack ?? false,
        requires_coupon: campaign?.requires_coupon ?? false,
        coupon_code: campaign?.coupon_code || null,
        show_on_website: campaign?.show_on_website ?? true,
        banner_image: campaign?.banner_image || null,
        terms_conditions: campaign?.terms_conditions || null,
        status: campaign?.status || 'draft',
        notes: campaign?.notes || null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEdit && campaign?.id) {
            put(route('sales.campaigns.update', campaign.id));
        } else {
            post(route('sales.campaigns.store'));
        }
    };

    return (
        <Layout>
            <Head title={isEdit ? 'Kampanya Düzenle' : 'Yeni Kampanya'} />

            <div className="page-content">
                <div className="container-fluid">
                    <Row className="mb-3">
                        <Col>
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">
                                    {isEdit ? 'Kampanya Düzenle' : 'Yeni Kampanya'}
                                </h4>
                                <div className="page-title-right">
                                    <Link href={route('sales.campaigns.index')}>
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
                            <Col lg={8}>
                                {/* Basic Information */}
                                <Card className="mb-3">
                                    <Card.Header>
                                        <h5 className="card-title mb-0">Temel Bilgiler</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Kampanya Adı *</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={data.name}
                                                        onChange={(e) => setData('name', e.target.value)}
                                                        isInvalid={!!errors.name}
                                                        required
                                                    />
                                                    {errors.name && (
                                                        <div className="invalid-feedback d-block">
                                                            {errors.name}
                                                        </div>
                                                    )}
                                                </Form.Group>
                                            </Col>

                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Kampanya Kodu *</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={data.code}
                                                        onChange={(e) => setData('code', e.target.value)}
                                                        isInvalid={!!errors.code}
                                                        required
                                                    />
                                                    {errors.code && (
                                                        <div className="invalid-feedback d-block">
                                                            {errors.code}
                                                        </div>
                                                    )}
                                                </Form.Group>
                                            </Col>

                                            <Col md={12}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Açıklama</Form.Label>
                                                    <Form.Control
                                                        as="textarea"
                                                        rows={3}
                                                        value={data.description}
                                                        onChange={(e) => setData('description', e.target.value)}
                                                    />
                                                </Form.Group>
                                            </Col>

                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Kampanya Tipi *</Form.Label>
                                                    <Form.Select
                                                        value={data.type}
                                                        onChange={(e) => setData('type', e.target.value)}
                                                        isInvalid={!!errors.type}
                                                        required
                                                    >
                                                        {Object.entries(types).map(([key, label]) => (
                                                            <option key={key} value={key}>
                                                                {label}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                    {errors.type && (
                                                        <div className="invalid-feedback d-block">
                                                            {errors.type}
                                                        </div>
                                                    )}
                                                </Form.Group>
                                            </Col>

                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Hedef Kitle *</Form.Label>
                                                    <Form.Select
                                                        value={data.target_type}
                                                        onChange={(e) => setData('target_type', e.target.value)}
                                                        isInvalid={!!errors.target_type}
                                                        required
                                                    >
                                                        {Object.entries(targetTypes).map(([key, label]) => (
                                                            <option key={key} value={key}>
                                                                {label}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                    {errors.target_type && (
                                                        <div className="invalid-feedback d-block">
                                                            {errors.target_type}
                                                        </div>
                                                    )}
                                                </Form.Group>
                                            </Col>

                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Başlangıç Tarihi *</Form.Label>
                                                    <Form.Control
                                                        type="datetime-local"
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

                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Bitiş Tarihi *</Form.Label>
                                                    <Form.Control
                                                        type="datetime-local"
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
                                        </Row>
                                    </Card.Body>
                                </Card>

                                {/* Discount Configuration */}
                                <Card className="mb-3">
                                    <Card.Header>
                                        <h5 className="card-title mb-0">İndirim Konfigürasyonu</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row>
                                            {(data.type === 'discount_percentage' || data.type === 'discount_amount') && (
                                                <Col md={6}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>
                                                            İndirim Değeri{' '}
                                                            {data.type === 'discount_percentage' ? '(%)' : '(₺)'}
                                                        </Form.Label>
                                                        <Form.Control
                                                            type="number"
                                                            step="0.01"
                                                            value={data.discount_value || ''}
                                                            onChange={(e) =>
                                                                setData('discount_value', parseFloat(e.target.value) || null)
                                                            }
                                                        />
                                                    </Form.Group>
                                                </Col>
                                            )}

                                            {data.type === 'buy_x_get_y' && (
                                                <>
                                                    <Col md={6}>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label>Alınacak Miktar (X)</Form.Label>
                                                            <Form.Control
                                                                type="number"
                                                                value={data.buy_quantity || ''}
                                                                onChange={(e) =>
                                                                    setData('buy_quantity', parseInt(e.target.value) || null)
                                                                }
                                                            />
                                                        </Form.Group>
                                                    </Col>
                                                    <Col md={6}>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label>Ödenecek Miktar (Y)</Form.Label>
                                                            <Form.Control
                                                                type="number"
                                                                value={data.get_quantity || ''}
                                                                onChange={(e) =>
                                                                    setData('get_quantity', parseInt(e.target.value) || null)
                                                                }
                                                            />
                                                        </Form.Group>
                                                    </Col>
                                                </>
                                            )}

                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Minimum Alışveriş Tutarı (₺)</Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        step="0.01"
                                                        value={data.min_purchase_amount || ''}
                                                        onChange={(e) =>
                                                            setData('min_purchase_amount', parseFloat(e.target.value) || null)
                                                        }
                                                    />
                                                </Form.Group>
                                            </Col>

                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Maksimum İndirim Tutarı (₺)</Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        step="0.01"
                                                        value={data.max_discount_amount || ''}
                                                        onChange={(e) =>
                                                            setData('max_discount_amount', parseFloat(e.target.value) || null)
                                                        }
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>

                                {/* Usage Limits */}
                                <Card className="mb-3">
                                    <Card.Header>
                                        <h5 className="card-title mb-0">Kullanım Limitleri</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Toplam Kullanım Limiti</Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        value={data.usage_limit || ''}
                                                        onChange={(e) =>
                                                            setData('usage_limit', parseInt(e.target.value) || null)
                                                        }
                                                    />
                                                </Form.Group>
                                            </Col>

                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Müşteri Başına Limit</Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        value={data.usage_limit_per_customer || ''}
                                                        onChange={(e) =>
                                                            setData('usage_limit_per_customer', parseInt(e.target.value) || null)
                                                        }
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>

                                {/* Coupon Code */}
                                <Card className="mb-3">
                                    <Card.Header>
                                        <h5 className="card-title mb-0">Kupon Kodu</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row>
                                            <Col md={12}>
                                                <Form.Check
                                                    type="switch"
                                                    id="requires_coupon"
                                                    label="Kupon Kodu Gerektirir"
                                                    checked={data.requires_coupon}
                                                    onChange={(e) => setData('requires_coupon', e.target.checked)}
                                                    className="mb-3"
                                                />
                                            </Col>

                                            {data.requires_coupon && (
                                                <Col md={6}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Kupon Kodu</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            value={data.coupon_code || ''}
                                                            onChange={(e) => setData('coupon_code', e.target.value)}
                                                            isInvalid={!!errors.coupon_code}
                                                        />
                                                        {errors.coupon_code && (
                                                            <div className="invalid-feedback d-block">
                                                                {errors.coupon_code}
                                                            </div>
                                                        )}
                                                    </Form.Group>
                                                </Col>
                                            )}
                                        </Row>
                                    </Card.Body>
                                </Card>
                            </Col>

                            <Col lg={4}>
                                {/* Status */}
                                <Card className="mb-3">
                                    <Card.Header>
                                        <h5 className="card-title mb-0">Durum</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Kampanya Durumu *</Form.Label>
                                            <Form.Select
                                                value={data.status}
                                                onChange={(e) => setData('status', e.target.value)}
                                                isInvalid={!!errors.status}
                                                required
                                            >
                                                {Object.entries(statuses).map(([key, label]) => (
                                                    <option key={key} value={key}>
                                                        {label}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>

                                        <Form.Check
                                            type="switch"
                                            id="is_active"
                                            label="Aktif"
                                            checked={data.is_active}
                                            onChange={(e) => setData('is_active', e.target.checked)}
                                            className="mb-3"
                                        />

                                        <Form.Check
                                            type="switch"
                                            id="show_on_website"
                                            label="Web Sitesinde Göster"
                                            checked={data.show_on_website}
                                            onChange={(e) => setData('show_on_website', e.target.checked)}
                                            className="mb-3"
                                        />

                                        <Form.Check
                                            type="switch"
                                            id="can_stack"
                                            label="Diğer Kampanyalarla Kullanılabilir"
                                            checked={data.can_stack}
                                            onChange={(e) => setData('can_stack', e.target.checked)}
                                        />
                                    </Card.Body>
                                </Card>

                                {/* Priority */}
                                <Card className="mb-3">
                                    <Card.Header>
                                        <h5 className="card-title mb-0">Öncelik</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Form.Group>
                                            <Form.Label>Öncelik Değeri</Form.Label>
                                            <Form.Control
                                                type="number"
                                                value={data.priority}
                                                onChange={(e) => setData('priority', parseInt(e.target.value) || 0)}
                                            />
                                            <Form.Text>Yüksek değer önce uygulanır</Form.Text>
                                        </Form.Group>
                                    </Card.Body>
                                </Card>

                                {/* Notes */}
                                <Card className="mb-3">
                                    <Card.Header>
                                        <h5 className="card-title mb-0">Notlar</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Form.Group>
                                            <Form.Control
                                                as="textarea"
                                                rows={4}
                                                value={data.notes || ''}
                                                onChange={(e) => setData('notes', e.target.value)}
                                                placeholder="Kampanya hakkında notlar..."
                                            />
                                        </Form.Group>
                                    </Card.Body>
                                </Card>

                                {/* Submit Button */}
                                <Card>
                                    <Card.Body>
                                        <div className="d-grid gap-2">
                                            <Button
                                                type="submit"
                                                variant="primary"
                                                disabled={processing}
                                                size="lg"
                                            >
                                                {processing ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                                        Kaydediliyor...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="ri-save-line me-2"></i>
                                                        {isEdit ? 'Güncelle' : 'Kaydet'}
                                                    </>
                                                )}
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
