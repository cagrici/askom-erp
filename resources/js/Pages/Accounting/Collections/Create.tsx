import React, { useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Card, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import Layout from '../../../Layouts';

interface PaymentMethod {
    id: number;
    name: string;
    code: string;
    type: string;
    requires_bank_account: boolean;
}

interface PaymentTerm {
    id: number;
    name: string;
    code: string;
    days: number;
}

interface BankAccount {
    id: number;
    account_name: string;
    bank_name: string;
    iban: string;
    currency: string;
}

interface CurrentAccount {
    id: number;
    account_code: string;
    title: string;
}

interface PageProps {
    paymentMethods: PaymentMethod[];
    paymentTerms: PaymentTerm[];
    bankAccounts: BankAccount[];
    currentAccounts: CurrentAccount[];
}

export default function Create() {
    const { paymentMethods, paymentTerms, bankAccounts, currentAccounts } = usePage<PageProps>().props;
    
    const { data, setData, post, processing, errors } = useForm({
        current_account_id: '',
        payment_method_id: '',
        payment_term_id: '',
        bank_account_id: '',
        collection_date: new Date().toISOString().split('T')[0],
        amount: '',
        currency: 'TRY',
        exchange_rate: '1',
        collection_type: 'invoice_payment',
        reference_number: '',
        document_number: '',
        document_date: '',
        due_date: '',
        maturity_date: '',
        commission_rate: '',
        commission_amount: '',
        description: '',
        notes: '',
        check_number: '',
        check_bank: '',
        check_branch: '',
        check_account: '',
        promissory_note_number: '',
        promissory_note_guarantor: '',
        is_advance_payment: false,
        invoice_numbers: [] as string[],
        installment_count: '1',
    });

    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
    const [showCheckFields, setShowCheckFields] = useState(false);
    const [showPromissoryNoteFields, setShowPromissoryNoteFields] = useState(false);

    const handlePaymentMethodChange = (methodId: string) => {
        const method = paymentMethods.find(m => m.id.toString() === methodId);
        setSelectedPaymentMethod(method || null);
        setData('payment_method_id', methodId);
        
        // Show/hide relevant fields based on payment method type
        setShowCheckFields(method?.type === 'check');
        setShowPromissoryNoteFields(method?.type === 'promissory_note');
        
        // Clear bank account if not required
        if (method && !method.requires_bank_account) {
            setData('bank_account_id', '');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('accounting.collections.store'));
    };

    const calculateCommission = () => {
        const amount = parseFloat(data.amount || '0');
        const rate = parseFloat(data.commission_rate || '0');
        
        if (rate > 0) {
            const commission = (amount * rate) / 100;
            setData('commission_amount', commission.toFixed(2));
        }
    };

    const addInvoiceNumber = () => {
        const invoiceNumber = prompt('Fatura numarasını giriniz:');
        if (invoiceNumber && invoiceNumber.trim()) {
            setData('invoice_numbers', [...data.invoice_numbers, invoiceNumber.trim()]);
        }
    };

    const removeInvoiceNumber = (index: number) => {
        const newInvoices = data.invoice_numbers.filter((_, i) => i !== index);
        setData('invoice_numbers', newInvoices);
    };

    return (
        <Layout title="Yeni Tahsilat">
            <Head title="Yeni Tahsilat" />
            <div className="page-content">
                <div className="container-fluid">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h1 className="h3 mb-0">Yeni Tahsilat</h1>
                        <Link
                            href={route('accounting.collections.index')}
                            className="btn btn-outline-secondary"
                        >
                            <i className="fas fa-arrow-left"></i> Geri Dön
                        </Link>
                    </div>

                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col lg={8}>
                                {/* Basic Information */}
                                <Card className="mb-4">
                                    <Card.Header>
                                        <h6 className="mb-0">Temel Bilgiler</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Cari Hesap *</Form.Label>
                                                    <Form.Select
                                                        value={data.current_account_id}
                                                        onChange={(e) => setData('current_account_id', e.target.value)}
                                                        isInvalid={!!errors.current_account_id}
                                                        required
                                                    >
                                                        <option value="">Cari hesap seçiniz</option>
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
                                                    <Form.Label>Tahsilat Tarihi *</Form.Label>
                                                    <Form.Control
                                                        type="date"
                                                        value={data.collection_date}
                                                        onChange={(e) => setData('collection_date', e.target.value)}
                                                        isInvalid={!!errors.collection_date}
                                                        required
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.collection_date}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Ödeme Yöntemi *</Form.Label>
                                                    <Form.Select
                                                        value={data.payment_method_id}
                                                        onChange={(e) => handlePaymentMethodChange(e.target.value)}
                                                        isInvalid={!!errors.payment_method_id}
                                                        required
                                                    >
                                                        <option value="">Ödeme yöntemi seçiniz</option>
                                                        {paymentMethods.map(method => (
                                                            <option key={method.id} value={method.id}>
                                                                {method.name}
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
                                                        isInvalid={!!errors.payment_term_id}
                                                    >
                                                        <option value="">Ödeme vadesi seçiniz</option>
                                                        {paymentTerms.map(term => (
                                                            <option key={term.id} value={term.id}>
                                                                {term.name}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.payment_term_id}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        {selectedPaymentMethod?.requires_bank_account && (
                                            <Row>
                                                <Col md={12}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Banka Hesabı *</Form.Label>
                                                        <Form.Select
                                                            value={data.bank_account_id}
                                                            onChange={(e) => setData('bank_account_id', e.target.value)}
                                                            isInvalid={!!errors.bank_account_id}
                                                            required
                                                        >
                                                            <option value="">Banka hesabı seçiniz</option>
                                                            {bankAccounts.map(account => (
                                                                <option key={account.id} value={account.id}>
                                                                    {account.account_name} - {account.bank_name} ({account.currency})
                                                                </option>
                                                            ))}
                                                        </Form.Select>
                                                        <Form.Control.Feedback type="invalid">
                                                            {errors.bank_account_id}
                                                        </Form.Control.Feedback>
                                                    </Form.Group>
                                                </Col>
                                            </Row>
                                        )}

                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Tahsilat Tipi *</Form.Label>
                                                    <Form.Select
                                                        value={data.collection_type}
                                                        onChange={(e) => setData('collection_type', e.target.value)}
                                                        isInvalid={!!errors.collection_type}
                                                        required
                                                    >
                                                        <option value="invoice_payment">Fatura Tahsilatı</option>
                                                        <option value="advance_payment">Avans Tahsilatı</option>
                                                        <option value="partial_payment">Kısmi Tahsilat</option>
                                                        <option value="overpayment">Fazla Ödeme</option>
                                                        <option value="refund">İade</option>
                                                        <option value="adjustment">Düzeltme</option>
                                                        <option value="other">Diğer</option>
                                                    </Form.Select>
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.collection_type}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Check
                                                        type="checkbox"
                                                        label="Avans ödemesi"
                                                        checked={data.is_advance_payment}
                                                        onChange={(e) => setData('is_advance_payment', e.target.checked)}
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>

                                {/* Amount Information */}
                                <Card className="mb-4">
                                    <Card.Header>
                                        <h6 className="mb-0">Tutar Bilgileri</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row>
                                            <Col md={4}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Tutar *</Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        step="0.01"
                                                        min="0.01"
                                                        value={data.amount}
                                                        onChange={(e) => setData('amount', e.target.value)}
                                                        isInvalid={!!errors.amount}
                                                        required
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.amount}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>
                                            <Col md={4}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Para Birimi *</Form.Label>
                                                    <Form.Select
                                                        value={data.currency}
                                                        onChange={(e) => setData('currency', e.target.value)}
                                                        isInvalid={!!errors.currency}
                                                        required
                                                    >
                                                        <option value="TRY">TRY (Türk Lirası)</option>
                                                        <option value="USD">USD (Amerikan Doları)</option>
                                                        <option value="EUR">EUR (Euro)</option>
                                                        <option value="GBP">GBP (İngiliz Sterlini)</option>
                                                    </Form.Select>
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.currency}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>
                                            {data.currency !== 'TRY' && (
                                                <Col md={4}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Kur</Form.Label>
                                                        <Form.Control
                                                            type="number"
                                                            step="0.000001"
                                                            min="0.000001"
                                                            value={data.exchange_rate}
                                                            onChange={(e) => setData('exchange_rate', e.target.value)}
                                                            isInvalid={!!errors.exchange_rate}
                                                        />
                                                        <Form.Control.Feedback type="invalid">
                                                            {errors.exchange_rate}
                                                        </Form.Control.Feedback>
                                                    </Form.Group>
                                                </Col>
                                            )}
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
                                                        onBlur={calculateCommission}
                                                        isInvalid={!!errors.commission_rate}
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.commission_rate}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Komisyon Tutarı</Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={data.commission_amount}
                                                        onChange={(e) => setData('commission_amount', e.target.value)}
                                                        isInvalid={!!errors.commission_amount}
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.commission_amount}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>

                                {/* Document Information */}
                                <Card className="mb-4">
                                    <Card.Header>
                                        <h6 className="mb-0">Belge Bilgileri</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Referans No</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={data.reference_number}
                                                        onChange={(e) => setData('reference_number', e.target.value)}
                                                        isInvalid={!!errors.reference_number}
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.reference_number}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Belge No</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={data.document_number}
                                                        onChange={(e) => setData('document_number', e.target.value)}
                                                        isInvalid={!!errors.document_number}
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.document_number}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={4}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Belge Tarihi</Form.Label>
                                                    <Form.Control
                                                        type="date"
                                                        value={data.document_date}
                                                        onChange={(e) => setData('document_date', e.target.value)}
                                                        isInvalid={!!errors.document_date}
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.document_date}
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
                                                    <Form.Label>Vade Sonu</Form.Label>
                                                    <Form.Control
                                                        type="date"
                                                        value={data.maturity_date}
                                                        onChange={(e) => setData('maturity_date', e.target.value)}
                                                        isInvalid={!!errors.maturity_date}
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.maturity_date}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        {/* Invoice Numbers */}
                                        <Row>
                                            <Col md={12}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Fatura Numaraları</Form.Label>
                                                    <div className="d-flex flex-wrap gap-2 mb-2">
                                                        {data.invoice_numbers.map((invoice, index) => (
                                                            <span
                                                                key={index}
                                                                className="badge bg-secondary d-flex align-items-center"
                                                            >
                                                                {invoice}
                                                                <button
                                                                    type="button"
                                                                    className="btn-close btn-close-white ms-2"
                                                                    style={{ fontSize: '0.6em' }}
                                                                    onClick={() => removeInvoiceNumber(index)}
                                                                ></button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="outline-primary"
                                                        size="sm"
                                                        onClick={addInvoiceNumber}
                                                    >
                                                        <i className="fas fa-plus"></i> Fatura Ekle
                                                    </Button>
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>

                                {/* Check Information */}
                                {showCheckFields && (
                                    <Card className="mb-4">
                                        <Card.Header>
                                            <h6 className="mb-0">Çek Bilgileri</h6>
                                        </Card.Header>
                                        <Card.Body>
                                            <Row>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Çek No</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            value={data.check_number}
                                                            onChange={(e) => setData('check_number', e.target.value)}
                                                            isInvalid={!!errors.check_number}
                                                        />
                                                        <Form.Control.Feedback type="invalid">
                                                            {errors.check_number}
                                                        </Form.Control.Feedback>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Banka</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            value={data.check_bank}
                                                            onChange={(e) => setData('check_bank', e.target.value)}
                                                            isInvalid={!!errors.check_bank}
                                                        />
                                                        <Form.Control.Feedback type="invalid">
                                                            {errors.check_bank}
                                                        </Form.Control.Feedback>
                                                    </Form.Group>
                                                </Col>
                                            </Row>
                                            <Row>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Şube</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            value={data.check_branch}
                                                            onChange={(e) => setData('check_branch', e.target.value)}
                                                            isInvalid={!!errors.check_branch}
                                                        />
                                                        <Form.Control.Feedback type="invalid">
                                                            {errors.check_branch}
                                                        </Form.Control.Feedback>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Hesap No</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            value={data.check_account}
                                                            onChange={(e) => setData('check_account', e.target.value)}
                                                            isInvalid={!!errors.check_account}
                                                        />
                                                        <Form.Control.Feedback type="invalid">
                                                            {errors.check_account}
                                                        </Form.Control.Feedback>
                                                    </Form.Group>
                                                </Col>
                                            </Row>
                                        </Card.Body>
                                    </Card>
                                )}

                                {/* Promissory Note Information */}
                                {showPromissoryNoteFields && (
                                    <Card className="mb-4">
                                        <Card.Header>
                                            <h6 className="mb-0">Senet Bilgileri</h6>
                                        </Card.Header>
                                        <Card.Body>
                                            <Row>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Senet No</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            value={data.promissory_note_number}
                                                            onChange={(e) => setData('promissory_note_number', e.target.value)}
                                                            isInvalid={!!errors.promissory_note_number}
                                                        />
                                                        <Form.Control.Feedback type="invalid">
                                                            {errors.promissory_note_number}
                                                        </Form.Control.Feedback>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Kefil</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            value={data.promissory_note_guarantor}
                                                            onChange={(e) => setData('promissory_note_guarantor', e.target.value)}
                                                            isInvalid={!!errors.promissory_note_guarantor}
                                                        />
                                                        <Form.Control.Feedback type="invalid">
                                                            {errors.promissory_note_guarantor}
                                                        </Form.Control.Feedback>
                                                    </Form.Group>
                                                </Col>
                                            </Row>
                                        </Card.Body>
                                    </Card>
                                )}

                                {/* Description and Notes */}
                                <Card className="mb-4">
                                    <Card.Header>
                                        <h6 className="mb-0">Açıklamalar</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Açıklama</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={3}
                                                value={data.description}
                                                onChange={(e) => setData('description', e.target.value)}
                                                isInvalid={!!errors.description}
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {errors.description}
                                            </Form.Control.Feedback>
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Notlar</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={3}
                                                value={data.notes}
                                                onChange={(e) => setData('notes', e.target.value)}
                                                isInvalid={!!errors.notes}
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {errors.notes}
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Card.Body>
                                </Card>
                            </Col>

                            <Col lg={4}>
                                {/* Summary Card */}
                                <Card className="mb-4">
                                    <Card.Header>
                                        <h6 className="mb-0">Özet</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        {data.amount && (
                                            <>
                                                <div className="d-flex justify-content-between mb-2">
                                                    <span>Tutar:</span>
                                                    <span className="fw-bold">
                                                        {parseFloat(data.amount || '0').toLocaleString('tr-TR')} {data.currency}
                                                    </span>
                                                </div>
                                                {data.commission_amount && parseFloat(data.commission_amount) > 0 && (
                                                    <div className="d-flex justify-content-between mb-2">
                                                        <span>Komisyon:</span>
                                                        <span className="text-warning">
                                                            -{parseFloat(data.commission_amount).toLocaleString('tr-TR')} {data.currency}
                                                        </span>
                                                    </div>
                                                )}
                                                <hr />
                                                <div className="d-flex justify-content-between">
                                                    <span className="fw-bold">Net Tutar:</span>
                                                    <span className="fw-bold text-success">
                                                        {(parseFloat(data.amount || '0') - parseFloat(data.commission_amount || '0')).toLocaleString('tr-TR')} {data.currency}
                                                    </span>
                                                </div>
                                                {data.currency !== 'TRY' && data.exchange_rate && parseFloat(data.exchange_rate) > 0 && (
                                                    <>
                                                        <hr />
                                                        <div className="d-flex justify-content-between">
                                                            <span>TL Karşılığı:</span>
                                                            <span>
                                                                {((parseFloat(data.amount || '0') - parseFloat(data.commission_amount || '0')) * parseFloat(data.exchange_rate)).toLocaleString('tr-TR')} TRY
                                                            </span>
                                                        </div>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </Card.Body>
                                </Card>

                                {/* Actions */}
                                <Card>
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
                                                        <i className="fas fa-save"></i> Tahsilatı Kaydet
                                                    </>
                                                )}
                                            </Button>
                                            <Link
                                                href={route('accounting.collections.index')}
                                                className="btn btn-outline-secondary"
                                            >
                                                <i className="fas fa-times"></i> İptal
                                            </Link>
                                        </div>
                                    </Card.Body>
                                </Card>

                                {/* Help */}
                                <Card className="mt-4">
                                    <Card.Header>
                                        <h6 className="mb-0">
                                            <i className="fas fa-info-circle"></i> Bilgi
                                        </h6>
                                    </Card.Header>
                                    <Card.Body>
                                        <small className="text-muted">
                                            <ul className="mb-0 ps-3">
                                                <li>Tahsilat numarası otomatik olarak oluşturulacaktır.</li>
                                                <li>Komisyon oranı girildiğinde tutar otomatik hesaplanır.</li>
                                                <li>Dövizli işlemlerde kur bilgisi zorunludur.</li>
                                                <li>Çek ve senet ödemeleri için ek bilgiler girilmelidir.</li>
                                            </ul>
                                        </small>
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