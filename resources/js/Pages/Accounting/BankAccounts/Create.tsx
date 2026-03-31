import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Card, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import Layout from '../../../Layouts';

interface FormData {
    account_name: string;
    bank_name: string;
    branch_name: string;
    branch_code: string;
    account_number: string;
    iban: string;
    swift_code: string;
    currency: string;
    account_type: string;
    description: string;
    is_active: boolean;
    is_default: boolean;
}

export default function Create() {
    const [ibanValidation, setIbanValidation] = useState<{valid: boolean, message: string} | null>(null);
    
    const { data, setData, post, processing, errors, reset } = useForm<FormData>({
        account_name: '',
        bank_name: '',
        branch_name: '',
        branch_code: '',
        account_number: '',
        iban: '',
        swift_code: '',
        currency: 'TRY',
        account_type: 'business',
        description: '',
        is_active: true,
        is_default: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('accounting.bank-accounts.store'));
    };

    const validateIban = async (iban: string) => {
        if (!iban || iban.length < 15) {
            setIbanValidation(null);
            return;
        }

        try {
            const response = await fetch(route('accounting.bank-accounts.validate-iban'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ iban }),
            });
            
            const result = await response.json();
            setIbanValidation(result);
        } catch (error) {
            setIbanValidation({ valid: false, message: 'IBAN doğrulama hatası' });
        }
    };

    const handleIbanChange = (value: string) => {
        const formattedIban = value.toUpperCase().replace(/\s/g, '');
        setData('iban', formattedIban);
        
        if (formattedIban.length >= 15) {
            validateIban(formattedIban);
        } else {
            setIbanValidation(null);
        }
    };

    const getCurrencyFlag = (currency: string) => {
        switch (currency) {
            case 'TRY': return '🇹🇷';
            case 'USD': return '🇺🇸';
            case 'EUR': return '🇪🇺';
            case 'GBP': return '🇬🇧';
            default: return '💰';
        }
    };

    return (
        <Layout title="Yeni Banka Hesabı">
            <Head title="Yeni Banka Hesabı" />
            <div className="page-content">
                <div className="container-fluid">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h1 className="h3 mb-0">Yeni Banka Hesabı</h1>
                            <p className="text-muted mb-0">Banka hesabı bilgilerini girin</p>
                        </div>
                        <Button 
                            variant="outline-secondary"
                            href={route('accounting.bank-accounts.index')}
                            as="a"
                        >
                            <i className="fas fa-arrow-left"></i> Geri Dön
                        </Button>
                    </div>

                    <Row>
                        <Col lg={8}>
                            <Form onSubmit={handleSubmit}>
                                <Card className="mb-4">
                                    <Card.Header>
                                        <h6 className="mb-0">Temel Bilgiler</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Hesap Adı <span className="text-danger">*</span></Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={data.account_name}
                                                        onChange={(e) => setData('account_name', e.target.value)}
                                                        isInvalid={!!errors.account_name}
                                                        placeholder="Ana İşletme Hesabı"
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.account_name}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Banka Adı <span className="text-danger">*</span></Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={data.bank_name}
                                                        onChange={(e) => setData('bank_name', e.target.value)}
                                                        isInvalid={!!errors.bank_name}
                                                        placeholder="Türkiye İş Bankası"
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.bank_name}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Şube Adı</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={data.branch_name}
                                                        onChange={(e) => setData('branch_name', e.target.value)}
                                                        placeholder="Kadıköy Şubesi"
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Şube Kodu</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={data.branch_code}
                                                        onChange={(e) => setData('branch_code', e.target.value)}
                                                        placeholder="1234"
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Para Birimi <span className="text-danger">*</span></Form.Label>
                                                    <Form.Select
                                                        value={data.currency}
                                                        onChange={(e) => setData('currency', e.target.value)}
                                                        isInvalid={!!errors.currency}
                                                    >
                                                        <option value="TRY">🇹🇷 Türk Lirası (TRY)</option>
                                                        <option value="USD">🇺🇸 Amerikan Doları (USD)</option>
                                                        <option value="EUR">🇪🇺 Euro (EUR)</option>
                                                        <option value="GBP">🇬🇧 İngiliz Sterlini (GBP)</option>
                                                    </Form.Select>
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.currency}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Hesap Tipi <span className="text-danger">*</span></Form.Label>
                                                    <Form.Select
                                                        value={data.account_type}
                                                        onChange={(e) => setData('account_type', e.target.value)}
                                                        isInvalid={!!errors.account_type}
                                                    >
                                                        <option value="checking">Vadesiz Hesap</option>
                                                        <option value="savings">Vadeli Hesap</option>
                                                        <option value="business">Ticari Hesap</option>
                                                        <option value="other">Diğer</option>
                                                    </Form.Select>
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.account_type}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>

                                <Card className="mb-4">
                                    <Card.Header>
                                        <h6 className="mb-0">Hesap Detayları</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Hesap Numarası <span className="text-danger">*</span></Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={data.account_number}
                                                        onChange={(e) => setData('account_number', e.target.value)}
                                                        isInvalid={!!errors.account_number}
                                                        placeholder="12345678901"
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.account_number}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>SWIFT Kodu</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={data.swift_code}
                                                        onChange={(e) => setData('swift_code', e.target.value.toUpperCase())}
                                                        placeholder="ISCBTR2A"
                                                        maxLength={11}
                                                    />
                                                    <Form.Text className="text-muted">
                                                        Uluslararası transferler için gerekli
                                                    </Form.Text>
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Form.Group className="mb-3">
                                            <Form.Label>IBAN</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={data.iban}
                                                onChange={(e) => handleIbanChange(e.target.value)}
                                                isInvalid={!!errors.iban}
                                                placeholder="TR330006400000112345678901"
                                                maxLength={34}
                                                className={`font-monospace ${
                                                    ibanValidation?.valid === true ? 'is-valid' : 
                                                    ibanValidation?.valid === false ? 'is-invalid' : ''
                                                }`}
                                            />
                                            {ibanValidation && (
                                                <div className={`form-text ${ibanValidation.valid ? 'text-success' : 'text-danger'}`}>
                                                    <i className={`fas fa-${ibanValidation.valid ? 'check' : 'times'} me-1`}></i>
                                                    {ibanValidation.message}
                                                </div>
                                            )}
                                            <Form.Control.Feedback type="invalid">
                                                {errors.iban}
                                            </Form.Control.Feedback>
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Açıklama</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={3}
                                                value={data.description}
                                                onChange={(e) => setData('description', e.target.value)}
                                                placeholder="Bu hesap hakkında ek bilgiler..."
                                            />
                                        </Form.Group>
                                    </Card.Body>
                                </Card>

                                <Card className="mb-4">
                                    <Card.Header>
                                        <h6 className="mb-0">Hesap Ayarları</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        <Form.Check
                                            type="checkbox"
                                            id="is_active"
                                            label="Hesap aktif"
                                            checked={data.is_active}
                                            onChange={(e) => setData('is_active', e.target.checked)}
                                            className="mb-3"
                                        />
                                        
                                        <Form.Check
                                            type="checkbox"
                                            id="is_default"
                                            label="Varsayılan hesap olarak ayarla"
                                            checked={data.is_default}
                                            onChange={(e) => setData('is_default', e.target.checked)}
                                        />
                                        <Form.Text className="text-muted">
                                            Varsayılan hesap, yeni tahsilatlarda otomatik olarak seçilir.
                                        </Form.Text>
                                    </Card.Body>
                                </Card>

                                <div className="d-flex justify-content-end gap-2">
                                    <Button 
                                        variant="outline-secondary" 
                                        href={route('accounting.bank-accounts.index')}
                                        as="a"
                                    >
                                        İptal
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        variant="primary"
                                        disabled={processing}
                                    >
                                        {processing ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                Kaydediliyor...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-save me-2"></i>
                                                Banka Hesabını Kaydet
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </Form>
                        </Col>

                        <Col lg={4}>
                            <Card className="mb-4">
                                <Card.Header>
                                    <h6 className="mb-0">Önizleme</h6>
                                </Card.Header>
                                <Card.Body>
                                    <div className="mb-3">
                                        <strong>Hesap Adı:</strong><br />
                                        <span className="text-muted">{data.account_name || 'Belirtilmedi'}</span>
                                    </div>
                                    <div className="mb-3">
                                        <strong>Banka:</strong><br />
                                        <span className="text-muted">{data.bank_name || 'Belirtilmedi'}</span>
                                    </div>
                                    <div className="mb-3">
                                        <strong>Para Birimi:</strong><br />
                                        <span className="text-muted">{getCurrencyFlag(data.currency)} {data.currency}</span>
                                    </div>
                                    <div className="mb-3">
                                        <strong>Hesap Numarası:</strong><br />
                                        <span className="text-muted font-monospace">{data.account_number || 'Belirtilmedi'}</span>
                                    </div>
                                    {data.iban && (
                                        <div className="mb-3">
                                            <strong>IBAN:</strong><br />
                                            <span className="text-muted font-monospace">{data.iban}</span>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>

                            <Alert variant="info">
                                <i className="fas fa-info-circle me-2"></i>
                                <strong>Bilgi:</strong> Yıldız (*) ile işaretli alanlar zorunludur. IBAN otomatik olarak doğrulanacaktır.
                            </Alert>
                        </Col>
                    </Row>
                </div>
            </div>
        </Layout>
    );
}