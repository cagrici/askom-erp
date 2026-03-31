import React, { useState, useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Card, Row, Col, Form, Button, Alert, InputGroup } from 'react-bootstrap';
import Layout from '@/Layouts';
import axios from 'axios';

interface Customer {
    id: number;
    entity_name: string;
    entity_code: string;
    phone?: string;
    email?: string;
    address?: string;
}

interface Offer {
    id: number;
    offer_no: string;
    customer_name?: string;
    customer_phone?: string;
    customer_email?: string;
    entity?: {
        id: number;
        title: string;
        account_code: string;
    };
    total_amount: number;
}

interface Props {
    offer: Offer;
}

export default function ConvertToOrder({ offer }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        customer_id: offer.entity?.id || '',
    });

    const [customerSearch, setCustomerSearch] = useState('');
    const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
        offer.entity ? {
            id: offer.entity.id,
            entity_name: offer.entity.title,
            entity_code: offer.entity.account_code,
        } : null
    );

    // AJAX Customer search
    useEffect(() => {
        if (customerSearch.length >= 2) {
            setLoadingCustomers(true);
            const timer = setTimeout(() => {
                axios.get(route('sales.offers.search-customers'), {
                    params: { q: customerSearch }
                })
                .then(response => {
                    setFilteredCustomers(response.data);
                    setLoadingCustomers(false);
                })
                .catch(() => setLoadingCustomers(false));
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setFilteredCustomers([]);
        }
    }, [customerSearch]);

    const handleCustomerSelect = (customer: Customer) => {
        setSelectedCustomer(customer);
        setData('customer_id', customer.id.toString());
        setCustomerSearch('');
        setFilteredCustomers([]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('sales.offers.convert-to-order.store', offer.id));
    };

    return (
        <Layout>
            <Head title={`Siparişe Dönüştür - ${offer.offer_no}`} />

            <div className="page-content">
                <div className="container-fluid">
                    <Row className="mb-3">
                        <Col>
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Teklifi Siparişe Dönüştür</h4>
                                <Link href={route('sales.offers.show', offer.id)}>
                                    <Button variant="secondary" size="sm">
                                        <i className="ri-arrow-left-line me-1"></i>
                                        Geri
                                    </Button>
                                </Link>
                            </div>
                        </Col>
                    </Row>

                    <Row className="justify-content-center">
                        <Col lg={8}>
                            <Alert variant="info" className="mb-4">
                                <i className="ri-information-line me-2"></i>
                                <strong>Teklif No:</strong> {offer.offer_no}
                                <span className="ms-3"><strong>Tutar:</strong> {Number(offer.total_amount).toFixed(2)} ₺</span>
                            </Alert>

                            <Card>
                                <Card.Header>
                                    <h5 className="card-title mb-0">
                                        <i className="ri-user-line me-2"></i>Müşteri Seçimi
                                    </h5>
                                </Card.Header>
                                <Card.Body style={{ overflow: 'visible' }}>
                                    <Form onSubmit={handleSubmit}>
                                        {offer.customer_name && !offer.entity && (
                                            <Alert variant="warning" className="mb-3">
                                                <strong>Geçici Müşteri:</strong> {offer.customer_name}
                                                <br />
                                                {offer.customer_phone && <><strong>Tel:</strong> {offer.customer_phone}<br /></>}
                                                {offer.customer_email && <><strong>Email:</strong> {offer.customer_email}</>}
                                                <hr />
                                                <small>Bu teklif geçici müşteri ile oluşturulmuştur. Siparişe dönüştürmek için kayıtlı bir cari seçmelisiniz.</small>
                                            </Alert>
                                        )}

                                        <div className="position-relative mb-4">
                                            <Form.Label>Cari Ara *</Form.Label>
                                            <InputGroup>
                                                <InputGroup.Text><i className="ri-search-line"></i></InputGroup.Text>
                                                <Form.Control
                                                    placeholder="Müşteri adı, kod veya vergi no ile ara..."
                                                    value={customerSearch}
                                                    onChange={e => setCustomerSearch(e.target.value)}
                                                    isInvalid={!!errors.customer_id}
                                                />
                                            </InputGroup>
                                            {errors.customer_id && <div className="invalid-feedback d-block">{errors.customer_id}</div>}

                                            {loadingCustomers && (
                                                <div className="text-center p-2">
                                                    <span className="spinner-border spinner-border-sm"></span>
                                                </div>
                                            )}

                                            {filteredCustomers.length > 0 && (
                                                <div className="border rounded position-absolute w-100 bg-white shadow" style={{ zIndex: 9999, maxHeight: '300px', overflowY: 'auto', top: '100%', left: 0, pointerEvents: 'auto' }}>
                                                    {filteredCustomers.map(c => (
                                                        <div key={c.id} className="p-3 border-bottom hover-bg" onClick={() => handleCustomerSelect(c)} style={{ cursor: 'pointer', pointerEvents: 'auto' }}>
                                                            <strong>{c.entity_name}</strong><br />
                                                            <small className="text-muted">
                                                                Kod: {c.entity_code}
                                                                {c.phone && ` | Tel: ${c.phone}`}
                                                                {c.email && ` | ${c.email}`}
                                                            </small>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {selectedCustomer && (
                                            <Alert variant="success" className="mb-4">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <strong>Seçili Müşteri:</strong><br />
                                                        {selectedCustomer.entity_name}
                                                        <br />
                                                        <small className="text-muted">Kod: {selectedCustomer.entity_code}</small>
                                                    </div>
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        className="text-danger"
                                                        onClick={() => {
                                                            setSelectedCustomer(null);
                                                            setData('customer_id', '');
                                                        }}
                                                    >
                                                        <i className="ri-close-line"></i> Kaldır
                                                    </Button>
                                                </div>
                                            </Alert>
                                        )}

                                        <div className="d-flex gap-2 justify-content-end">
                                            <Link href={route('sales.offers.show', offer.id)}>
                                                <Button variant="outline-secondary">
                                                    İptal
                                                </Button>
                                            </Link>
                                            <Button
                                                type="submit"
                                                variant="primary"
                                                disabled={processing || !selectedCustomer}
                                            >
                                                <i className="ri-shopping-cart-line me-1"></i>
                                                Siparişe Dönüştür
                                            </Button>
                                        </div>
                                    </Form>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </div>

            <style>{`
                .hover-bg:hover {
                    background-color: #f8f9fa;
                }
            `}</style>
        </Layout>
    );
}
