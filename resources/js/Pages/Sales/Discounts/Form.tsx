import { Head, Link, useForm } from '@inertiajs/react';
import Layout from '@/Layouts';
import { Card, Row, Col, Button, Form as BootstrapForm, Nav, Tab } from 'react-bootstrap';

interface Discount {
    id?: number;
    name: string;
    code: string;
    description: string;
    type: string;
    calculation_type: string;
    discount_value: string;
    min_purchase_amount: string;
    max_discount_amount: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
    quantity_tiers: Array<{ min_qty: number; max_qty: number; discount: number }>;
    customer_ids: number[];
    customer_group_ids: number[];
    product_ids: number[];
    category_ids: number[];
    excluded_product_ids: number[];
    excluded_category_ids: number[];
    priority: number;
    can_combine: boolean;
    applies_to_discounted_products: boolean;
    payment_method_ids: number[];
    requires_cash_payment: boolean;
    min_quantity: string;
    usage_limit: string;
    usage_limit_per_customer: string;
    show_on_invoice: boolean;
    show_on_website: boolean;
    auto_apply: boolean;
    status: string;
    notes: string;
}

interface Props {
    discount: Discount | null;
    products: Array<{ id: number; name: string; code: string }>;
    categories: Array<{ id: number; name: string }>;
    customers: Array<{ id: number; title: string; account_code: string }>;
    types: Array<{ value: string; label: string }>;
    calculationTypes: Array<{ value: string; label: string }>;
    statuses: Array<{ value: string; label: string }>;
}

export default function DiscountForm({
    discount,
    products,
    categories,
    customers,
    types,
    calculationTypes,
    statuses,
}: Props) {
    const isEdit = !!discount?.id;

    const { data, setData, post, put, processing, errors } = useForm<Discount>({
        name: discount?.name || '',
        code: discount?.code || '',
        description: discount?.description || '',
        type: discount?.type || 'general',
        calculation_type: discount?.calculation_type || 'percentage',
        discount_value: discount?.discount_value || '',
        min_purchase_amount: discount?.min_purchase_amount || '',
        max_discount_amount: discount?.max_discount_amount || '',
        start_date: discount?.start_date || '',
        end_date: discount?.end_date || '',
        is_active: discount?.is_active ?? true,
        quantity_tiers: discount?.quantity_tiers || [],
        customer_ids: discount?.customer_ids || [],
        customer_group_ids: discount?.customer_group_ids || [],
        product_ids: discount?.product_ids || [],
        category_ids: discount?.category_ids || [],
        excluded_product_ids: discount?.excluded_product_ids || [],
        excluded_category_ids: discount?.excluded_category_ids || [],
        priority: discount?.priority || 0,
        can_combine: discount?.can_combine ?? false,
        applies_to_discounted_products: discount?.applies_to_discounted_products ?? true,
        payment_method_ids: discount?.payment_method_ids || [],
        requires_cash_payment: discount?.requires_cash_payment ?? false,
        min_quantity: discount?.min_quantity || '',
        usage_limit: discount?.usage_limit || '',
        usage_limit_per_customer: discount?.usage_limit_per_customer || '',
        show_on_invoice: discount?.show_on_invoice ?? true,
        show_on_website: discount?.show_on_website ?? true,
        auto_apply: discount?.auto_apply ?? false,
        status: discount?.status || 'draft',
        notes: discount?.notes || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEdit && discount?.id) {
            put(route('sales.discounts.update', discount.id));
        } else {
            post(route('sales.discounts.store'));
        }
    };

    const addQuantityTier = () => {
        setData('quantity_tiers', [
            ...data.quantity_tiers,
            { min_qty: 0, max_qty: 0, discount: 0 },
        ]);
    };

    const removeQuantityTier = (index: number) => {
        const newTiers = [...data.quantity_tiers];
        newTiers.splice(index, 1);
        setData('quantity_tiers', newTiers);
    };

    const updateQuantityTier = (index: number, field: string, value: any) => {
        const newTiers = [...data.quantity_tiers];
        newTiers[index] = { ...newTiers[index], [field]: value };
        setData('quantity_tiers', newTiers);
    };

    return (
        <Layout>
            <Head title={isEdit ? 'İskonto Düzenle' : 'Yeni İskonto'} />

            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <Row className="mb-3">
                        <Col xs={12}>
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">{isEdit ? 'İskonto Düzenle' : 'Yeni İskonto'}</h4>
                                <div className="page-title-right">
                                    <Link href={route('sales.discounts.index')}>
                                        <Button variant="secondary" size="sm">
                                            <i className="ri-arrow-left-line align-bottom me-1"></i>
                                            Geri Dön
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </Col>
                    </Row>

                    <BootstrapForm onSubmit={handleSubmit}>
                        <Tab.Container defaultActiveKey="basic">
                            <Row>
                                <Col xs={12}>
                                    <Card>
                                        <Card.Header>
                                            <Nav variant="tabs" className="nav-tabs-custom card-header-tabs">
                                                <Nav.Item>
                                                    <Nav.Link eventKey="basic">Temel Bilgiler</Nav.Link>
                                                </Nav.Item>
                                                <Nav.Item>
                                                    <Nav.Link eventKey="conditions">Koşullar</Nav.Link>
                                                </Nav.Item>
                                                <Nav.Item>
                                                    <Nav.Link eventKey="targets">Hedefler</Nav.Link>
                                                </Nav.Item>
                                                <Nav.Item>
                                                    <Nav.Link eventKey="settings">Ayarlar</Nav.Link>
                                                </Nav.Item>
                                            </Nav>
                                        </Card.Header>
                                        <Card.Body>
                                            <Tab.Content>
                                                {/* Basic Information Tab */}
                                                <Tab.Pane eventKey="basic">
                                                    <Row>
                                                        <Col md={6}>
                                                            <BootstrapForm.Group className="mb-3">
                                                                <BootstrapForm.Label>
                                                                    İskonto Adı <span className="text-danger">*</span>
                                                                </BootstrapForm.Label>
                                                                <BootstrapForm.Control
                                                                    type="text"
                                                                    value={data.name}
                                                                    onChange={(e) => setData('name', e.target.value)}
                                                                    isInvalid={!!errors.name}
                                                                    required
                                                                />
                                                                {errors.name && (
                                                                    <div className="invalid-feedback d-block">{errors.name}</div>
                                                                )}
                                                            </BootstrapForm.Group>
                                                        </Col>

                                                        <Col md={6}>
                                                            <BootstrapForm.Group className="mb-3">
                                                                <BootstrapForm.Label>
                                                                    İskonto Kodu <span className="text-danger">*</span>
                                                                </BootstrapForm.Label>
                                                                <BootstrapForm.Control
                                                                    type="text"
                                                                    value={data.code}
                                                                    onChange={(e) => setData('code', e.target.value)}
                                                                    isInvalid={!!errors.code}
                                                                    required
                                                                />
                                                                {errors.code && (
                                                                    <div className="invalid-feedback d-block">{errors.code}</div>
                                                                )}
                                                            </BootstrapForm.Group>
                                                        </Col>

                                                        <Col md={12}>
                                                            <BootstrapForm.Group className="mb-3">
                                                                <BootstrapForm.Label>Açıklama</BootstrapForm.Label>
                                                                <BootstrapForm.Control
                                                                    as="textarea"
                                                                    rows={3}
                                                                    value={data.description}
                                                                    onChange={(e) => setData('description', e.target.value)}
                                                                />
                                                            </BootstrapForm.Group>
                                                        </Col>

                                                        <Col md={6}>
                                                            <BootstrapForm.Group className="mb-3">
                                                                <BootstrapForm.Label>
                                                                    İskonto Tipi <span className="text-danger">*</span>
                                                                </BootstrapForm.Label>
                                                                <BootstrapForm.Select
                                                                    value={data.type}
                                                                    onChange={(e) => setData('type', e.target.value)}
                                                                    isInvalid={!!errors.type}
                                                                    required
                                                                >
                                                                    {types.map((type) => (
                                                                        <option key={type.value} value={type.value}>
                                                                            {type.label}
                                                                        </option>
                                                                    ))}
                                                                </BootstrapForm.Select>
                                                                {errors.type && (
                                                                    <div className="invalid-feedback d-block">{errors.type}</div>
                                                                )}
                                                            </BootstrapForm.Group>
                                                        </Col>

                                                        <Col md={6}>
                                                            <BootstrapForm.Group className="mb-3">
                                                                <BootstrapForm.Label>
                                                                    Hesaplama Türü <span className="text-danger">*</span>
                                                                </BootstrapForm.Label>
                                                                <BootstrapForm.Select
                                                                    value={data.calculation_type}
                                                                    onChange={(e) => setData('calculation_type', e.target.value)}
                                                                    isInvalid={!!errors.calculation_type}
                                                                    required
                                                                >
                                                                    {calculationTypes.map((type) => (
                                                                        <option key={type.value} value={type.value}>
                                                                            {type.label}
                                                                        </option>
                                                                    ))}
                                                                </BootstrapForm.Select>
                                                                {errors.calculation_type && (
                                                                    <div className="invalid-feedback d-block">
                                                                        {errors.calculation_type}
                                                                    </div>
                                                                )}
                                                            </BootstrapForm.Group>
                                                        </Col>

                                                        <Col md={6}>
                                                            <BootstrapForm.Group className="mb-3">
                                                                <BootstrapForm.Label>
                                                                    İskonto Değeri <span className="text-danger">*</span>
                                                                </BootstrapForm.Label>
                                                                <BootstrapForm.Control
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={data.discount_value}
                                                                    onChange={(e) => setData('discount_value', e.target.value)}
                                                                    isInvalid={!!errors.discount_value}
                                                                    required
                                                                />
                                                                {errors.discount_value && (
                                                                    <div className="invalid-feedback d-block">
                                                                        {errors.discount_value}
                                                                    </div>
                                                                )}
                                                            </BootstrapForm.Group>
                                                        </Col>

                                                        <Col md={6}>
                                                            <BootstrapForm.Group className="mb-3">
                                                                <BootstrapForm.Label>Öncelik</BootstrapForm.Label>
                                                                <BootstrapForm.Control
                                                                    type="number"
                                                                    value={data.priority}
                                                                    onChange={(e) => setData('priority', parseInt(e.target.value))}
                                                                />
                                                                <BootstrapForm.Text className="text-muted">
                                                                    Yüksek öncelikli iskontolar önce uygulanır
                                                                </BootstrapForm.Text>
                                                            </BootstrapForm.Group>
                                                        </Col>

                                                        <Col md={6}>
                                                            <BootstrapForm.Group className="mb-3">
                                                                <BootstrapForm.Label>Durum <span className="text-danger">*</span></BootstrapForm.Label>
                                                                <BootstrapForm.Select
                                                                    value={data.status}
                                                                    onChange={(e) => setData('status', e.target.value)}
                                                                    required
                                                                >
                                                                    {statuses.map((status) => (
                                                                        <option key={status.value} value={status.value}>
                                                                            {status.label}
                                                                        </option>
                                                                    ))}
                                                                </BootstrapForm.Select>
                                                            </BootstrapForm.Group>
                                                        </Col>

                                                        <Col md={6}>
                                                            <BootstrapForm.Group className="mb-3">
                                                                <BootstrapForm.Check
                                                                    type="checkbox"
                                                                    label="Aktif"
                                                                    checked={data.is_active}
                                                                    onChange={(e) => setData('is_active', e.target.checked)}
                                                                />
                                                            </BootstrapForm.Group>
                                                        </Col>
                                                    </Row>
                                                </Tab.Pane>

                                                {/* Conditions Tab */}
                                                <Tab.Pane eventKey="conditions">
                                                    <Row>
                                                        <Col md={6}>
                                                            <BootstrapForm.Group className="mb-3">
                                                                <BootstrapForm.Label>Minimum Alışveriş Tutarı</BootstrapForm.Label>
                                                                <BootstrapForm.Control
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={data.min_purchase_amount}
                                                                    onChange={(e) =>
                                                                        setData('min_purchase_amount', e.target.value)
                                                                    }
                                                                />
                                                            </BootstrapForm.Group>
                                                        </Col>

                                                        <Col md={6}>
                                                            <BootstrapForm.Group className="mb-3">
                                                                <BootstrapForm.Label>Maksimum İskonto Tutarı</BootstrapForm.Label>
                                                                <BootstrapForm.Control
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={data.max_discount_amount}
                                                                    onChange={(e) =>
                                                                        setData('max_discount_amount', e.target.value)
                                                                    }
                                                                />
                                                            </BootstrapForm.Group>
                                                        </Col>

                                                        <Col md={6}>
                                                            <BootstrapForm.Group className="mb-3">
                                                                <BootstrapForm.Label>Başlangıç Tarihi</BootstrapForm.Label>
                                                                <BootstrapForm.Control
                                                                    type="datetime-local"
                                                                    value={data.start_date}
                                                                    onChange={(e) => setData('start_date', e.target.value)}
                                                                />
                                                            </BootstrapForm.Group>
                                                        </Col>

                                                        <Col md={6}>
                                                            <BootstrapForm.Group className="mb-3">
                                                                <BootstrapForm.Label>Bitiş Tarihi</BootstrapForm.Label>
                                                                <BootstrapForm.Control
                                                                    type="datetime-local"
                                                                    value={data.end_date}
                                                                    onChange={(e) => setData('end_date', e.target.value)}
                                                                />
                                                            </BootstrapForm.Group>
                                                        </Col>

                                                        <Col md={4}>
                                                            <BootstrapForm.Group className="mb-3">
                                                                <BootstrapForm.Label>Minimum Miktar</BootstrapForm.Label>
                                                                <BootstrapForm.Control
                                                                    type="number"
                                                                    value={data.min_quantity}
                                                                    onChange={(e) => setData('min_quantity', e.target.value)}
                                                                />
                                                            </BootstrapForm.Group>
                                                        </Col>

                                                        <Col md={4}>
                                                            <BootstrapForm.Group className="mb-3">
                                                                <BootstrapForm.Label>Toplam Kullanım Limiti</BootstrapForm.Label>
                                                                <BootstrapForm.Control
                                                                    type="number"
                                                                    value={data.usage_limit}
                                                                    onChange={(e) => setData('usage_limit', e.target.value)}
                                                                />
                                                            </BootstrapForm.Group>
                                                        </Col>

                                                        <Col md={4}>
                                                            <BootstrapForm.Group className="mb-3">
                                                                <BootstrapForm.Label>
                                                                    Müşteri Başına Kullanım Limiti
                                                                </BootstrapForm.Label>
                                                                <BootstrapForm.Control
                                                                    type="number"
                                                                    value={data.usage_limit_per_customer}
                                                                    onChange={(e) =>
                                                                        setData('usage_limit_per_customer', e.target.value)
                                                                    }
                                                                />
                                                            </BootstrapForm.Group>
                                                        </Col>

                                                        {data.type === 'quantity' && (
                                                            <Col md={12}>
                                                                <BootstrapForm.Label>Miktar Basamakları</BootstrapForm.Label>
                                                                {data.quantity_tiers.map((tier, index) => (
                                                                    <Row key={index} className="mb-2">
                                                                        <Col md={3}>
                                                                            <BootstrapForm.Control
                                                                                type="number"
                                                                                placeholder="Min. Miktar"
                                                                                value={tier.min_qty}
                                                                                onChange={(e) =>
                                                                                    updateQuantityTier(
                                                                                        index,
                                                                                        'min_qty',
                                                                                        parseInt(e.target.value)
                                                                                    )
                                                                                }
                                                                            />
                                                                        </Col>
                                                                        <Col md={3}>
                                                                            <BootstrapForm.Control
                                                                                type="number"
                                                                                placeholder="Maks. Miktar"
                                                                                value={tier.max_qty}
                                                                                onChange={(e) =>
                                                                                    updateQuantityTier(
                                                                                        index,
                                                                                        'max_qty',
                                                                                        parseInt(e.target.value)
                                                                                    )
                                                                                }
                                                                            />
                                                                        </Col>
                                                                        <Col md={4}>
                                                                            <BootstrapForm.Control
                                                                                type="number"
                                                                                step="0.01"
                                                                                placeholder="İskonto Değeri"
                                                                                value={tier.discount}
                                                                                onChange={(e) =>
                                                                                    updateQuantityTier(
                                                                                        index,
                                                                                        'discount',
                                                                                        parseFloat(e.target.value)
                                                                                    )
                                                                                }
                                                                            />
                                                                        </Col>
                                                                        <Col md={2}>
                                                                            <Button
                                                                                variant="danger"
                                                                                size="sm"
                                                                                onClick={() => removeQuantityTier(index)}
                                                                            >
                                                                                <i className="ri-delete-bin-line"></i>
                                                                            </Button>
                                                                        </Col>
                                                                    </Row>
                                                                ))}
                                                                <Button variant="secondary" size="sm" onClick={addQuantityTier}>
                                                                    <i className="ri-add-line me-1"></i>
                                                                    Basamak Ekle
                                                                </Button>
                                                            </Col>
                                                        )}
                                                    </Row>
                                                </Tab.Pane>

                                                {/* Targets Tab */}
                                                <Tab.Pane eventKey="targets">
                                                    <Row>
                                                        <Col md={12}>
                                                            <BootstrapForm.Group className="mb-3">
                                                                <BootstrapForm.Label>Müşteriler</BootstrapForm.Label>
                                                                <BootstrapForm.Select
                                                                    multiple
                                                                    size={8}
                                                                    value={data.customer_ids.map(String)}
                                                                    onChange={(e) => {
                                                                        const selected = Array.from(
                                                                            e.target.selectedOptions,
                                                                            (option) => parseInt(option.value)
                                                                        );
                                                                        setData('customer_ids', selected);
                                                                    }}
                                                                >
                                                                    {customers.map((customer) => (
                                                                        <option key={customer.id} value={customer.id}>
                                                                            {customer.account_code} - {customer.title}
                                                                        </option>
                                                                    ))}
                                                                </BootstrapForm.Select>
                                                                <BootstrapForm.Text className="text-muted">
                                                                    Ctrl tuşu ile birden fazla seçim yapabilirsiniz
                                                                </BootstrapForm.Text>
                                                            </BootstrapForm.Group>
                                                        </Col>

                                                        <Col md={6}>
                                                            <BootstrapForm.Group className="mb-3">
                                                                <BootstrapForm.Label>Ürünler</BootstrapForm.Label>
                                                                <BootstrapForm.Select
                                                                    multiple
                                                                    size={8}
                                                                    value={data.product_ids.map(String)}
                                                                    onChange={(e) => {
                                                                        const selected = Array.from(
                                                                            e.target.selectedOptions,
                                                                            (option) => parseInt(option.value)
                                                                        );
                                                                        setData('product_ids', selected);
                                                                    }}
                                                                >
                                                                    {products.map((product) => (
                                                                        <option key={product.id} value={product.id}>
                                                                            {product.code} - {product.name}
                                                                        </option>
                                                                    ))}
                                                                </BootstrapForm.Select>
                                                            </BootstrapForm.Group>
                                                        </Col>

                                                        <Col md={6}>
                                                            <BootstrapForm.Group className="mb-3">
                                                                <BootstrapForm.Label>Kategoriler</BootstrapForm.Label>
                                                                <BootstrapForm.Select
                                                                    multiple
                                                                    size={8}
                                                                    value={data.category_ids.map(String)}
                                                                    onChange={(e) => {
                                                                        const selected = Array.from(
                                                                            e.target.selectedOptions,
                                                                            (option) => parseInt(option.value)
                                                                        );
                                                                        setData('category_ids', selected);
                                                                    }}
                                                                >
                                                                    {categories.map((category) => (
                                                                        <option key={category.id} value={category.id}>
                                                                            {category.name}
                                                                        </option>
                                                                    ))}
                                                                </BootstrapForm.Select>
                                                            </BootstrapForm.Group>
                                                        </Col>

                                                        <Col md={6}>
                                                            <BootstrapForm.Group className="mb-3">
                                                                <BootstrapForm.Label>Hariç Tutulan Ürünler</BootstrapForm.Label>
                                                                <BootstrapForm.Select
                                                                    multiple
                                                                    size={6}
                                                                    value={data.excluded_product_ids.map(String)}
                                                                    onChange={(e) => {
                                                                        const selected = Array.from(
                                                                            e.target.selectedOptions,
                                                                            (option) => parseInt(option.value)
                                                                        );
                                                                        setData('excluded_product_ids', selected);
                                                                    }}
                                                                >
                                                                    {products.map((product) => (
                                                                        <option key={product.id} value={product.id}>
                                                                            {product.code} - {product.name}
                                                                        </option>
                                                                    ))}
                                                                </BootstrapForm.Select>
                                                            </BootstrapForm.Group>
                                                        </Col>

                                                        <Col md={6}>
                                                            <BootstrapForm.Group className="mb-3">
                                                                <BootstrapForm.Label>Hariç Tutulan Kategoriler</BootstrapForm.Label>
                                                                <BootstrapForm.Select
                                                                    multiple
                                                                    size={6}
                                                                    value={data.excluded_category_ids.map(String)}
                                                                    onChange={(e) => {
                                                                        const selected = Array.from(
                                                                            e.target.selectedOptions,
                                                                            (option) => parseInt(option.value)
                                                                        );
                                                                        setData('excluded_category_ids', selected);
                                                                    }}
                                                                >
                                                                    {categories.map((category) => (
                                                                        <option key={category.id} value={category.id}>
                                                                            {category.name}
                                                                        </option>
                                                                    ))}
                                                                </BootstrapForm.Select>
                                                            </BootstrapForm.Group>
                                                        </Col>
                                                    </Row>
                                                </Tab.Pane>

                                                {/* Settings Tab */}
                                                <Tab.Pane eventKey="settings">
                                                    <Row>
                                                        <Col md={6}>
                                                            <BootstrapForm.Group className="mb-3">
                                                                <BootstrapForm.Check
                                                                    type="checkbox"
                                                                    label="Diğer İskontolarla Birleştirilebilir"
                                                                    checked={data.can_combine}
                                                                    onChange={(e) => setData('can_combine', e.target.checked)}
                                                                />
                                                            </BootstrapForm.Group>

                                                            <BootstrapForm.Group className="mb-3">
                                                                <BootstrapForm.Check
                                                                    type="checkbox"
                                                                    label="İndirimli Ürünlere Uygulanır"
                                                                    checked={data.applies_to_discounted_products}
                                                                    onChange={(e) =>
                                                                        setData('applies_to_discounted_products', e.target.checked)
                                                                    }
                                                                />
                                                            </BootstrapForm.Group>

                                                            <BootstrapForm.Group className="mb-3">
                                                                <BootstrapForm.Check
                                                                    type="checkbox"
                                                                    label="Nakit Ödeme Gerektirir"
                                                                    checked={data.requires_cash_payment}
                                                                    onChange={(e) =>
                                                                        setData('requires_cash_payment', e.target.checked)
                                                                    }
                                                                />
                                                            </BootstrapForm.Group>
                                                        </Col>

                                                        <Col md={6}>
                                                            <BootstrapForm.Group className="mb-3">
                                                                <BootstrapForm.Check
                                                                    type="checkbox"
                                                                    label="Otomatik Uygula"
                                                                    checked={data.auto_apply}
                                                                    onChange={(e) => setData('auto_apply', e.target.checked)}
                                                                />
                                                            </BootstrapForm.Group>

                                                            <BootstrapForm.Group className="mb-3">
                                                                <BootstrapForm.Check
                                                                    type="checkbox"
                                                                    label="Faturada Göster"
                                                                    checked={data.show_on_invoice}
                                                                    onChange={(e) => setData('show_on_invoice', e.target.checked)}
                                                                />
                                                            </BootstrapForm.Group>

                                                            <BootstrapForm.Group className="mb-3">
                                                                <BootstrapForm.Check
                                                                    type="checkbox"
                                                                    label="Web Sitesinde Göster"
                                                                    checked={data.show_on_website}
                                                                    onChange={(e) => setData('show_on_website', e.target.checked)}
                                                                />
                                                            </BootstrapForm.Group>
                                                        </Col>

                                                        <Col md={12}>
                                                            <BootstrapForm.Group className="mb-3">
                                                                <BootstrapForm.Label>Notlar</BootstrapForm.Label>
                                                                <BootstrapForm.Control
                                                                    as="textarea"
                                                                    rows={4}
                                                                    value={data.notes}
                                                                    onChange={(e) => setData('notes', e.target.value)}
                                                                />
                                                            </BootstrapForm.Group>
                                                        </Col>
                                                    </Row>
                                                </Tab.Pane>
                                            </Tab.Content>
                                        </Card.Body>
                                        <Card.Footer>
                                            <div className="d-flex justify-content-end gap-2">
                                                <Link href={route('sales.discounts.index')}>
                                                    <Button variant="secondary" disabled={processing}>
                                                        İptal
                                                    </Button>
                                                </Link>
                                                <Button type="submit" variant="primary" disabled={processing}>
                                                    {processing && (
                                                        <span className="spinner-border spinner-border-sm me-1"></span>
                                                    )}
                                                    {isEdit ? 'Güncelle' : 'Kaydet'}
                                                </Button>
                                            </div>
                                        </Card.Footer>
                                    </Card>
                                </Col>
                            </Row>
                        </Tab.Container>
                    </BootstrapForm>
                </div>
            </div>
        </Layout>
    );
}
