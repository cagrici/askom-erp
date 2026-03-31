import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Card, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import Layout from '../../../Layouts';

interface CurrentAccount {
    id: number;
    title: string;
    account_code: string;
    account_type: string;
}

interface BankAccount {
    id: number;
    account_name: string;
    bank_name: string;
    currency: string;
    is_default: boolean;
}

interface PaymentMethod {
    id: number;
    name: string;
    requires_bank_account: boolean;
    commission_rate: number;
}

interface PaymentTerm {
    id: number;
    name: string;
    days: number;
    is_default: boolean;
}

interface FormData {
    current_account_id: string;
    bank_account_id: string;
    payment_method_id: string;
    payment_term_id: string;
    amount: string;
    currency: string;
    exchange_rate: string;
    commission_rate: string;
    bank_fees: string;
    payment_date: string;
    due_date: string;
    value_date: string;
    reference_number: string;
    document_number: string;
    description: string;
    notes: string;
    status: string;
}

interface PageProps {
    currentAccounts: CurrentAccount[];
    bankAccounts: BankAccount[];
    paymentMethods: PaymentMethod[];
    paymentTerms: PaymentTerm[];
    selectedCurrentAccount?: number;
    selectedBankAccount?: number;
}

export default function Create({ 
    currentAccounts, 
    bankAccounts, 
    paymentMethods, 
    paymentTerms,
    selectedCurrentAccount,
    selectedBankAccount
}: PageProps) {
    const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({
        'TRY': 1.00,
        'USD': 30.50,
        'EUR': 33.20,
        'GBP': 38.80,
    });

    const { data, setData, post, processing, errors, reset } = useForm<FormData>({
        current_account_id: selectedCurrentAccount?.toString() || '',
        bank_account_id: selectedBankAccount?.toString() || '',
        payment_method_id: '',
        payment_term_id: '',
        amount: '',
        currency: 'TRY',
        exchange_rate: '1.0000',
        commission_rate: '',
        bank_fees: '',
        payment_date: new Date().toISOString().split('T')[0],
        due_date: '',
        value_date: '',
        reference_number: '',
        document_number: '',
        description: '',
        notes: '',
        status: 'draft',
    });

    // Calculate net amount
    const [calculatedAmounts, setCalculatedAmounts] = useState({
        commissionAmount: 0,
        netAmount: 0,
        amountInBaseCurrency: 0,
    });

    useEffect(() => {
        const amount = parseFloat(data.amount) || 0;
        const commissionRate = parseFloat(data.commission_rate) || 0;
        const bankFees = parseFloat(data.bank_fees) || 0;
        const exchangeRate = parseFloat(data.exchange_rate) || 1;

        const commissionAmount = amount * (commissionRate / 100);
        const netAmount = amount - commissionAmount - bankFees;
        const amountInBaseCurrency = data.currency === 'TRY' ? amount : amount * exchangeRate;

        setCalculatedAmounts({
            commissionAmount,
            netAmount,
            amountInBaseCurrency,
        });
    }, [data.amount, data.commission_rate, data.bank_fees, data.exchange_rate, data.currency]);

    useEffect(() => {
        if (data.currency && exchangeRates[data.currency]) {
            setData('exchange_rate', exchangeRates[data.currency].toFixed(4));
        }
    }, [data.currency]);

    useEffect(() => {
        if (data.payment_method_id) {
            const selectedMethod = paymentMethods.find(m => m.id.toString() === data.payment_method_id);
            if (selectedMethod && selectedMethod.commission_rate > 0) {
                setData('commission_rate', selectedMethod.commission_rate.toString());
            }
        }
    }, [data.payment_method_id]);

    useEffect(() => {
        if (data.payment_term_id) {
            const selectedTerm = paymentTerms.find(t => t.id.toString() === data.payment_term_id);
            if (selectedTerm && data.payment_date) {
                const paymentDate = new Date(data.payment_date);
                const dueDate = new Date(paymentDate.getTime() + (selectedTerm.days * 24 * 60 * 60 * 1000));
                setData('due_date', dueDate.toISOString().split('T')[0]);
            }
        }
    }, [data.payment_term_id, data.payment_date]);

    useEffect(() => {
        if (data.bank_account_id) {
            const selectedAccount = bankAccounts.find(a => a.id.toString() === data.bank_account_id);
            if (selectedAccount) {
                setData('currency', selectedAccount.currency);
            }
        }
    }, [data.bank_account_id]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('accounting.payments.store'));
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

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount) + ' ' + currency;
    };

    return (
        <Layout title="Yeni Ödeme">
            <Head title="Yeni Ödeme" />
            <div className="page-content">
                <div className="container-fluid">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h1 className="h3 mb-0">Yeni Ödeme</h1>
                            <p className="text-muted mb-0">Ödeme bilgilerini girin</p>
                        </div>
                        <Button 
                            variant="outline-secondary"
                            href={route('accounting.payments.index')}
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
                                                    <Form.Label>Cari Hesap <span className="text-danger">*</span></Form.Label>
                                                    <Form.Select
                                                        value={data.current_account_id}
                                                        onChange={(e) => setData('current_account_id', e.target.value)}
                                                        isInvalid={!!errors.current_account_id}
                                                    >
                                                        <option value="">Cari hesap seçin...</option>
                                                        {currentAccounts.map(account => (
                                                            <option key={account.id} value={account.id}>
                                                                {account.account_code} - {account.title}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.current_account_id}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Banka Hesabı <span className="text-danger">*</span></Form.Label>
                                                    <Form.Select
                                                        value={data.bank_account_id}
                                                        onChange={(e) => setData('bank_account_id', e.target.value)}
                                                        isInvalid={!!errors.bank_account_id}
                                                    >
                                                        <option value="">Banka hesabı seçin...</option>
                                                        {bankAccounts.map(account => (
                                                            <option key={account.id} value={account.id}>
                                                                {account.account_name} - {account.bank_name} ({account.currency})
                                                                {account.is_default && ' (Varsayılan)'}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.bank_account_id}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Ödeme Yöntemi <span className="text-danger">*</span></Form.Label>
                                                    <Form.Select
                                                        value={data.payment_method_id}
                                                        onChange={(e) => setData('payment_method_id', e.target.value)}
                                                        isInvalid={!!errors.payment_method_id}
                                                    >
                                                        <option value="">Ödeme yöntemi seçin...</option>
                                                        {paymentMethods.map(method => (
                                                            <option key={method.id} value={method.id}>
                                                                {method.name}
                                                                {method.commission_rate > 0 && ` (Komisyon: %${method.commission_rate})`}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.payment_method_id}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Ödeme Vadesi</Form.Label>
                                                    <Form.Select
                                                        value={data.payment_term_id}
                                                        onChange={(e) => setData('payment_term_id', e.target.value)}
                                                    >
                                                        <option value="">Ödeme vadesi seçin...</option>
                                                        {paymentTerms.map(term => (
                                                            <option key={term.id} value={term.id}>
                                                                {term.name} ({term.days} gün)
                                                                {term.is_default && ' (Varsayılan)'}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>

                                <Card className="mb-4">
                                    <Card.Header>
                                        <h6 className="mb-0">Tutar ve Para Birimi</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row>
                                            <Col md={4}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Ödeme Tutarı <span className="text-danger">*</span></Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        step="0.01"
                                                        min="0.01"
                                                        value={data.amount}
                                                        onChange={(e) => setData('amount', e.target.value)}
                                                        isInvalid={!!errors.amount}
                                                        placeholder="0.00"
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.amount}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>
                                            <Col md={4}>
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
                                            <Col md={4}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Döviz Kuru</Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        step="0.0001"
                                                        min="0.0001"
                                                        value={data.exchange_rate}
                                                        onChange={(e) => setData('exchange_rate', e.target.value)}
                                                        disabled={data.currency === 'TRY'}
                                                        placeholder="1.0000"
                                                    />
                                                    <Form.Text className="text-muted">
                                                        {data.currency === 'TRY' ? 'TL için sabit 1.0000' : 'Güncel kur otomatik yüklendi'}
                                                    </Form.Text>
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Komisyon Oranı (%)</Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        max="100"
                                                        value={data.commission_rate}
                                                        onChange={(e) => setData('commission_rate', e.target.value)}
                                                        placeholder="0.00"
                                                    />
                                                    {calculatedAmounts.commissionAmount > 0 && (
                                                        <Form.Text className="text-muted">
                                                            Komisyon Tutarı: {formatCurrency(calculatedAmounts.commissionAmount, data.currency)}
                                                        </Form.Text>
                                                    )}
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Banka Masrafları</Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={data.bank_fees}
                                                        onChange={(e) => setData('bank_fees', e.target.value)}
                                                        placeholder="0.00"
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        {data.amount && (
                                            <Alert variant="info">
                                                <Row>
                                                    <Col md={4}>
                                                        <strong>Brüt Tutar:</strong><br />
                                                        {formatCurrency(parseFloat(data.amount) || 0, data.currency)}
                                                    </Col>
                                                    <Col md={4}>
                                                        <strong>Net Tutar:</strong><br />
                                                        {formatCurrency(calculatedAmounts.netAmount, data.currency)}
                                                    </Col>
                                                    {data.currency !== 'TRY' && (
                                                        <Col md={4}>
                                                            <strong>TL Karşılığı:</strong><br />
                                                            {formatCurrency(calculatedAmounts.amountInBaseCurrency, 'TRY')}
                                                        </Col>
                                                    )}
                                                </Row>
                                            </Alert>
                                        )}
                                    </Card.Body>
                                </Card>

                                <Card className="mb-4">
                                    <Card.Header>
                                        <h6 className="mb-0">Tarih Bilgileri</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row>
                                            <Col md={4}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Ödeme Tarihi <span className="text-danger">*</span></Form.Label>
                                                    <Form.Control
                                                        type="date"
                                                        value={data.payment_date}
                                                        onChange={(e) => setData('payment_date', e.target.value)}
                                                        isInvalid={!!errors.payment_date}
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.payment_date}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>
                                            <Col md={4}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Vade Tarihi</Form.Label>
                                                    <Form.Control
                                                        type="date"
                                                        value={data.due_date}
                                                        onChange={(e) => setData('due_date', e.target.value)}
                                                        isInvalid={!!errors.due_date}
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.due_date}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>
                                            <Col md={4}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Valör Tarihi</Form.Label>
                                                    <Form.Control
                                                        type="date"
                                                        value={data.value_date}
                                                        onChange={(e) => setData('value_date', e.target.value)}
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>

                                <Card className="mb-4">
                                    <Card.Header>
                                        <h6 className="mb-0">Ek Bilgiler</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Referans Numarası</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={data.reference_number}
                                                        onChange={(e) => setData('reference_number', e.target.value)}
                                                        placeholder="Referans numarası"
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Belge Numarası</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={data.document_number}
                                                        onChange={(e) => setData('document_number', e.target.value)}
                                                        placeholder="Belge numarası"
                                                    />
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
                                                placeholder="Ödeme açıklaması..."
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Notlar</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={3}
                                                value={data.notes}
                                                onChange={(e) => setData('notes', e.target.value)}
                                                placeholder="İç notlar..."
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Durum <span className="text-danger">*</span></Form.Label>
                                            <Form.Select
                                                value={data.status}
                                                onChange={(e) => setData('status', e.target.value)}
                                                isInvalid={!!errors.status}
                                            >
                                                <option value="draft">Taslak</option>
                                                <option value="pending">Beklemede (Onaya Gönder)</option>
                                            </Form.Select>
                                            <Form.Text className="text-muted">
                                                Taslak olarak kaydedebilir veya onaya gönderebilirsiniz.
                                            </Form.Text>
                                            <Form.Control.Feedback type="invalid">
                                                {errors.status}
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Card.Body>
                                </Card>

                                <div className="d-flex justify-content-end gap-2">
                                    <Button 
                                        variant="outline-secondary" 
                                        href={route('accounting.payments.index')}
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
                                                Ödemeyi Kaydet
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </Form>
                        </Col>

                        <Col lg={4}>
                            <Card className="mb-4">
                                <Card.Header>
                                    <h6 className="mb-0">Özet</h6>
                                </Card.Header>
                                <Card.Body>
                                    <div className="mb-3">
                                        <strong>Ödeme Tutarı:</strong><br />
                                        <span className="text-muted">
                                            {data.amount ? formatCurrency(parseFloat(data.amount), data.currency) : 'Belirtilmedi'}
                                        </span>
                                    </div>
                                    
                                    {calculatedAmounts.netAmount > 0 && calculatedAmounts.netAmount !== parseFloat(data.amount) && (
                                        <div className="mb-3">
                                            <strong>Net Tutar:</strong><br />
                                            <span className="text-success">
                                                {formatCurrency(calculatedAmounts.netAmount, data.currency)}
                                            </span>
                                        </div>
                                    )}

                                    {data.currency !== 'TRY' && calculatedAmounts.amountInBaseCurrency > 0 && (
                                        <div className="mb-3">
                                            <strong>TL Karşılığı:</strong><br />
                                            <span className="text-info">
                                                {formatCurrency(calculatedAmounts.amountInBaseCurrency, 'TRY')}
                                            </span>
                                        </div>
                                    )}

                                    <div className="mb-3">
                                        <strong>Para Birimi:</strong><br />
                                        <span className="text-muted">{getCurrencyFlag(data.currency)} {data.currency}</span>
                                    </div>

                                    <div className="mb-3">
                                        <strong>Ödeme Tarihi:</strong><br />
                                        <span className="text-muted">
                                            {data.payment_date ? new Date(data.payment_date).toLocaleDateString('tr-TR') : 'Belirtilmedi'}
                                        </span>
                                    </div>

                                    {data.due_date && (
                                        <div className="mb-3">
                                            <strong>Vade Tarihi:</strong><br />
                                            <span className="text-muted">
                                                {new Date(data.due_date).toLocaleDateString('tr-TR')}
                                            </span>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>

                            <Alert variant="info">
                                <i className="fas fa-info-circle me-2"></i>
                                <strong>Bilgi:</strong> Yıldız (*) ile işaretli alanlar zorunludur. Tutar hesaplamaları otomatik olarak yapılacaktır.
                            </Alert>
                        </Col>
                    </Row>
                </div>
            </div>
        </Layout>
    );
}