import React, { useState } from 'react';
import { Container, Row, Col, Card, Badge, Button, Modal, Form } from 'react-bootstrap';
import BreadCrumb from '../../Components/Common/BreadCrumb';
import { Head, Link, useForm } from '@inertiajs/react';
import Layout from '../../Layouts';

// Define types for our props
interface User {
    id: number;
    first_name: string;
    last_name: string;
}

interface Category {
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

interface ExpenseReport {
    id: number;
    title: string;
}

interface Expense {
    id: number;
    title: string;
    description: string | null;
    amount: number;
    currency: string;
    expense_date: string;
    status: string;
    expense_type: string;
    receipt_path: string | null;
    user: User;
    category: Category;
    department: Department | null;
    location: Location | null;
    approver: User | null;
    approved_at: string | null;
    rejection_reason: string | null;
    payment_method: string | null;
    payment_reference: string | null;
    paid_at: string | null;
    is_reimbursed: boolean;
    created_at: string;
    reports: ExpenseReport[];
}

interface ShowProps {
    expense: Expense;
}

const ExpenseShow = (props: ShowProps) => {
    const { expense } = props;
    
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    
    const { data: rejectData, setData: setRejectData, post: postReject, processing: rejectProcessing, errors: rejectErrors } = useForm({
        rejection_reason: '',
    });
    
    const { data: paymentData, setData: setPaymentData, post: postPayment, processing: paymentProcessing, errors: paymentErrors } = useForm({
        payment_method: expense.payment_method || '',
        payment_reference: expense.payment_reference || '',
    });
    
    // Handle reject modal submission
    const handleReject = (e: React.FormEvent) => {
        e.preventDefault();
        
        postReject(route('expenses.reject', expense.id), {
            onSuccess: () => {
                setShowRejectModal(false);
            },
        });
    };
    
    // Handle payment modal submission
    const handleMarkAsPaid = (e: React.FormEvent) => {
        e.preventDefault();
        
        postPayment(route('expenses.mark-as-paid', expense.id), {
            onSuccess: () => {
                setShowPaymentModal(false);
            },
        });
    };
    
    // Handle mark as reimbursed
    const handleMarkAsReimbursed = () => {
        if (confirm('Bu harcamayı geri ödendi olarak işaretlemek istediğinize emin misiniz?')) {
            postPayment(route('expenses.mark-as-reimbursed', expense.id));
        }
    };
    
    // Format currency
    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(amount);
    };
    
    // Format date
    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('tr-TR');
    };
    
    // Get status badge class
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return 'warning';
            case 'approved':
                return 'success';
            case 'rejected':
                return 'danger';
            case 'paid':
                return 'info';
            default:
                return 'secondary';
        }
    };
    
    // Get translated status
    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending':
                return 'Beklemede';
            case 'approved':
                return 'Onaylandı';
            case 'rejected':
                return 'Reddedildi';
            case 'paid':
                return 'Ödendi';
            default:
                return status;
        }
    };
    
    // Get expense type translation
    const getExpenseTypeText = (type: string) => {
        switch (type) {
            case 'regular':
                return 'Olağan Harcama';
            case 'travel':
                return 'Seyahat';
            case 'meal':
                return 'Yemek';
            case 'accommodation':
                return 'Konaklama';
            case 'transport':
                return 'Ulaşım';
            case 'office':
                return 'Ofis Malzemeleri';
            case 'representation':
                return 'Temsil Gideri';
            case 'other':
                return 'Diğer';
            default:
                return type;
        }
    };
    
    // Get payment method translation
    const getPaymentMethodText = (method: string | null) => {
        if (!method) return '-';
        
        switch (method) {
            case 'cash':
                return 'Nakit';
            case 'credit_card':
                return 'Kredi Kartı';
            case 'corporate_card':
                return 'Şirket Kartı';
            case 'bank_transfer':
                return 'Banka Transferi';
            case 'other':
                return 'Diğer';
            default:
                return method;
        }
    };
    
    return (
        <React.Fragment>
            <Head title={`${expense.title} | Harcama Detayı | Portal`} />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Harcama Detayı" pageTitle="Harcama Yönetimi" />
                    
                    <Row>
                        <Col lg={12}>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h4 className="mb-0">{expense.title}</h4>
                                <div className="d-flex gap-2">
                                    <Link href={route('expenses.index')} className="btn btn-light">
                                        <i className="ri-arrow-left-line align-bottom me-1"></i> Geri
                                    </Link>
                                    
                                    {expense.status === 'pending' && (
                                        <Link href={route('expenses.edit', expense.id)} className="btn btn-primary">
                                            <i className="ri-pencil-line align-bottom me-1"></i> Düzenle
                                        </Link>
                                    )}
                                    
                                    {expense.status === 'pending' && (
                                        <Button 
                                            variant="success"
                                            onClick={() => {
                                                if (confirm('Bu harcamayı onaylamak istediğinize emin misiniz?')) {
                                                    postReject(route('expenses.approve', expense.id));
                                                }
                                            }}
                                        >
                                            <i className="ri-check-line align-bottom me-1"></i> Onayla
                                        </Button>
                                    )}
                                    
                                    {expense.status === 'pending' && (
                                        <Button 
                                            variant="danger" 
                                            onClick={() => setShowRejectModal(true)}
                                        >
                                            <i className="ri-close-line align-bottom me-1"></i> Reddet
                                        </Button>
                                    )}
                                    
                                    {expense.status === 'approved' && !expense.paid_at && (
                                        <Button 
                                            variant="info" 
                                            onClick={() => setShowPaymentModal(true)}
                                        >
                                            <i className="ri-money-dollar-circle-line align-bottom me-1"></i> Ödeme Yap
                                        </Button>
                                    )}
                                    
                                    {expense.status === 'paid' && !expense.is_reimbursed && (
                                        <Button 
                                            variant="success" 
                                            onClick={handleMarkAsReimbursed}
                                        >
                                            <i className="ri-refund-2-line align-bottom me-1"></i> Geri Ödendi İşaretle
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Col>
                        
                        <Col lg={8}>
                            <Card>
                                <Card.Header>
                                    <h5 className="card-title mb-0">Harcama Bilgileri</h5>
                                </Card.Header>
                                <Card.Body>
                                    <Row className="mb-3">
                                        <Col md={6}>
                                            <h6 className="fw-semibold">Durum:</h6>
                                            <Badge bg={getStatusBadge(expense.status)} className="fs-6">
                                                {getStatusText(expense.status)}
                                            </Badge>
                                        </Col>
                                        <Col md={6}>
                                            <h6 className="fw-semibold">Tutar:</h6>
                                            <p className="text-primary fs-5 fw-semibold">
                                                {formatCurrency(expense.amount, expense.currency)}
                                            </p>
                                        </Col>
                                    </Row>
                                    
                                    <Row className="mb-3">
                                        <Col md={6}>
                                            <h6 className="fw-semibold">Kategori:</h6>
                                            <p>{expense.category.name}</p>
                                        </Col>
                                        <Col md={6}>
                                            <h6 className="fw-semibold">Harcama Tipi:</h6>
                                            <p>{getExpenseTypeText(expense.expense_type)}</p>
                                        </Col>
                                    </Row>
                                    
                                    <Row className="mb-3">
                                        <Col md={6}>
                                            <h6 className="fw-semibold">Harcama Tarihi:</h6>
                                            <p>{formatDate(expense.expense_date)}</p>
                                        </Col>
                                        <Col md={6}>
                                            <h6 className="fw-semibold">Oluşturulma Tarihi:</h6>
                                            <p>{formatDate(expense.created_at)}</p>
                                        </Col>
                                    </Row>
                                    
                                    <Row className="mb-3">
                                        <Col md={12}>
                                            <h6 className="fw-semibold">Açıklama:</h6>
                                            <p>{expense.description || '-'}</p>
                                        </Col>
                                    </Row>
                                    
                                    {expense.payment_method && (
                                        <Row className="mb-3">
                                            <Col md={6}>
                                                <h6 className="fw-semibold">Ödeme Yöntemi:</h6>
                                                <p>{getPaymentMethodText(expense.payment_method)}</p>
                                            </Col>
                                            <Col md={6}>
                                                <h6 className="fw-semibold">Ödeme Referansı:</h6>
                                                <p>{expense.payment_reference || '-'}</p>
                                            </Col>
                                        </Row>
                                    )}
                                    
                                    {expense.paid_at && (
                                        <Row className="mb-3">
                                            <Col md={6}>
                                                <h6 className="fw-semibold">Ödeme Tarihi:</h6>
                                                <p>{formatDate(expense.paid_at)}</p>
                                            </Col>
                                            <Col md={6}>
                                                <h6 className="fw-semibold">Geri Ödeme Durumu:</h6>
                                                <Badge bg={expense.is_reimbursed ? 'success' : 'warning'}>
                                                    {expense.is_reimbursed ? 'Geri Ödendi' : 'Beklemede'}
                                                </Badge>
                                            </Col>
                                        </Row>
                                    )}
                                    
                                    {expense.receipt_path && (
                                        <Row className="mb-3">
                                            <Col md={12}>
                                                <h6 className="fw-semibold">Fiş/Fatura:</h6>
                                                <a 
                                                    href={route('expenses.download-receipt', expense.id)} 
                                                    className="btn btn-sm btn-info"
                                                    target="_blank"
                                                >
                                                    <i className="ri-download-2-line me-1"></i> İndir
                                                </a>
                                            </Col>
                                        </Row>
                                    )}
                                    
                                    {expense.reports.length > 0 && (
                                        <Row className="mb-3">
                                            <Col md={12}>
                                                <h6 className="fw-semibold">Dahil Olduğu Raporlar:</h6>
                                                <ul className="list-group">
                                                    {expense.reports.map(report => (
                                                        <li key={report.id} className="list-group-item">
                                                            <Link href={route('expense-reports.show', report.id)}>
                                                                {report.title}
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </Col>
                                        </Row>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                        
                        <Col lg={4}>
                            <Card>
                                <Card.Header>
                                    <h5 className="card-title mb-0">Harcama Sahibi</h5>
                                </Card.Header>
                                <Card.Body>
                                    <div className="d-flex align-items-center mb-3">
                                        <div className="flex-shrink-0 avatar-md me-3">
                                            <div className="avatar-title bg-soft-primary text-primary rounded-circle fs-1">
                                                {expense.user.first_name.charAt(0) + expense.user.last_name.charAt(0)}
                                            </div>
                                        </div>
                                        <div className="flex-grow-1">
                                            <h5 className="fs-16 mb-1">
                                                {expense.user.first_name} {expense.user.last_name}
                                            </h5>
                                            <p className="text-muted mb-0">
                                                {expense.department?.name || 'Departman belirtilmemiş'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <hr />
                                    
                                    {expense.location && (
                                        <div className="mb-3">
                                            <h6 className="fw-semibold">Lokasyon:</h6>
                                            <p>{expense.location.name}</p>
                                        </div>
                                    )}
                                    
                                    {expense.approver && (
                                        <>
                                            <hr />
                                            <div className="mb-3">
                                                <h6 className="fw-semibold">Onaylayan:</h6>
                                                <p>{expense.approver.first_name} {expense.approver.last_name}</p>
                                                <p className="text-muted mb-0">
                                                    <small>Onay Tarihi: {formatDate(expense.approved_at)}</small>
                                                </p>
                                            </div>
                                        </>
                                    )}
                                    
                                    {expense.status === 'rejected' && expense.rejection_reason && (
                                        <>
                                            <hr />
                                            <div className="mb-3">
                                                <h6 className="fw-semibold text-danger">Red Nedeni:</h6>
                                                <p>{expense.rejection_reason}</p>
                                            </div>
                                        </>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                    
                    {/* Reject Modal */}
                    <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)}>
                        <Modal.Header closeButton>
                            <Modal.Title>Harcamayı Reddet</Modal.Title>
                        </Modal.Header>
                        <Form onSubmit={handleReject}>
                            <Modal.Body>
                                <Form.Group>
                                    <Form.Label>Red Nedeni <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        name="rejection_reason"
                                        value={rejectData.rejection_reason}
                                        onChange={(e) => setRejectData('rejection_reason', e.target.value)}
                                        required
                                        isInvalid={!!rejectErrors.rejection_reason}
                                    />
                                    {rejectErrors.rejection_reason && (
                                        <Form.Control.Feedback type="invalid">{rejectErrors.rejection_reason}</Form.Control.Feedback>
                                    )}
                                </Form.Group>
                            </Modal.Body>
                            <Modal.Footer>
                                <Button variant="light" onClick={() => setShowRejectModal(false)}>
                                    İptal
                                </Button>
                                <Button variant="danger" type="submit" disabled={rejectProcessing}>
                                    Reddet
                                </Button>
                            </Modal.Footer>
                        </Form>
                    </Modal>
                    
                    {/* Payment Modal */}
                    <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)}>
                        <Modal.Header closeButton>
                            <Modal.Title>Ödeme Bilgileri</Modal.Title>
                        </Modal.Header>
                        <Form onSubmit={handleMarkAsPaid}>
                            <Modal.Body>
                                <Form.Group className="mb-3">
                                    <Form.Label>Ödeme Yöntemi <span className="text-danger">*</span></Form.Label>
                                    <Form.Select
                                        name="payment_method"
                                        value={paymentData.payment_method}
                                        onChange={(e) => setPaymentData('payment_method', e.target.value)}
                                        required
                                        isInvalid={!!paymentErrors.payment_method}
                                    >
                                        <option value="">Seçiniz...</option>
                                        <option value="cash">Nakit</option>
                                        <option value="credit_card">Kredi Kartı</option>
                                        <option value="corporate_card">Şirket Kartı</option>
                                        <option value="bank_transfer">Banka Transferi</option>
                                        <option value="other">Diğer</option>
                                    </Form.Select>
                                    {paymentErrors.payment_method && (
                                        <Form.Control.Feedback type="invalid">{paymentErrors.payment_method}</Form.Control.Feedback>
                                    )}
                                </Form.Group>
                                
                                <Form.Group>
                                    <Form.Label>Ödeme Referansı</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="payment_reference"
                                        value={paymentData.payment_reference}
                                        onChange={(e) => setPaymentData('payment_reference', e.target.value)}
                                        placeholder="Dekont no, işlem no, vb."
                                        isInvalid={!!paymentErrors.payment_reference}
                                    />
                                    {paymentErrors.payment_reference && (
                                        <Form.Control.Feedback type="invalid">{paymentErrors.payment_reference}</Form.Control.Feedback>
                                    )}
                                </Form.Group>
                            </Modal.Body>
                            <Modal.Footer>
                                <Button variant="light" onClick={() => setShowPaymentModal(false)}>
                                    İptal
                                </Button>
                                <Button variant="info" type="submit" disabled={paymentProcessing}>
                                    Ödemeyi Kaydet
                                </Button>
                            </Modal.Footer>
                        </Form>
                    </Modal>
                </Container>
            </div>
        </React.Fragment>
    );
};

ExpenseShow.layout = (page: any) => <Layout children={page} />;
export default ExpenseShow;
