import React, { useState } from 'react';
import { Container, Row, Col, Card, Badge, Button, Modal, Form, Table } from 'react-bootstrap';
import BreadCrumb from '../../../Components/Common/BreadCrumb';
import { Head, Link, useForm } from '@inertiajs/react';
import Layout from '../../../Layouts';

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
    category: Category;
    department: Department | null;
    location: Location | null;
}

interface ExpenseReport {
    id: number;
    title: string;
    description: string | null;
    user: User;
    start_date: string;
    end_date: string;
    total_amount: number;
    status: string;
    approver: User | null;
    approved_at: string | null;
    rejection_reason: string | null;
    notes: string | null;
    created_at: string;
    expenses: Expense[];
}

interface ShowProps {
    report: ExpenseReport;
}

const ExpenseReportShow = (props: ShowProps) => {
    const { report } = props;
    
    const [showRejectModal, setShowRejectModal] = useState(false);
    
    const { data: rejectData, setData: setRejectData, post: postReject, processing: rejectProcessing, errors: rejectErrors } = useForm({
        rejection_reason: '',
    });
    
    // Handle reject modal submission
    const handleReject = (e: React.FormEvent) => {
        e.preventDefault();
        
        postReject(route('expense-reports.reject', report.id), {
            onSuccess: () => {
                setShowRejectModal(false);
            },
        });
    };
    
    // Format currency
    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(amount);
    };
    
    // Format date
    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('tr-TR');
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
    
    return (
        <React.Fragment>
            <Head title={`${report.title} | Harcama Raporu | Portal`} />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Harcama Raporu" pageTitle="Harcama Yönetimi" />
                    
                    <Row>
                        <Col lg={12}>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h4 className="mb-0">{report.title}</h4>
                                <div className="d-flex gap-2">
                                    <Link href={route('expense-reports.index')} className="btn btn-light">
                                        <i className="ri-arrow-left-line align-bottom me-1"></i> Geri
                                    </Link>
                                    
                                    {report.status === 'pending' && (
                                        <Link href={route('expense-reports.edit', report.id)} className="btn btn-primary">
                                            <i className="ri-pencil-line align-bottom me-1"></i> Düzenle
                                        </Link>
                                    )}
                                    
                                    <Link href={route('expense-reports.export-pdf', report.id)} className="btn btn-info" target="_blank">
                                        <i className="ri-file-pdf-line align-bottom me-1"></i> PDF İndir
                                    </Link>
                                    
                                    <Link href={route('expense-reports.export-excel', report.id)} className="btn btn-success">
                                        <i className="ri-file-excel-line align-bottom me-1"></i> Excel İndir
                                    </Link>
                                    
                                    {report.status === 'pending' && (
                                        <>
                                            <Button 
                                                variant="success"
                                                onClick={() => {
                                                    if (confirm('Bu raporu onaylamak istediğinize emin misiniz?')) {
                                                        postReject(route('expense-reports.approve', report.id));
                                                    }
                                                }}
                                            >
                                                <i className="ri-check-line align-bottom me-1"></i> Onayla
                                            </Button>
                                            
                                            <Button 
                                                variant="danger" 
                                                onClick={() => setShowRejectModal(true)}
                                            >
                                                <i className="ri-close-line align-bottom me-1"></i> Reddet
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </Col>
                        
                        <Col lg={8}>
                            <Card className="mb-4">
                                <Card.Header>
                                    <h5 className="card-title mb-0">Rapor Bilgileri</h5>
                                </Card.Header>
                                <Card.Body>
                                    <Row className="mb-3">
                                        <Col md={6}>
                                            <h6 className="fw-semibold">Durum:</h6>
                                            <Badge bg={getStatusBadge(report.status)} className="fs-6">
                                                {getStatusText(report.status)}
                                            </Badge>
                                        </Col>
                                        <Col md={6}>
                                            <h6 className="fw-semibold">Toplam Tutar:</h6>
                                            <p className="text-primary fs-5 fw-semibold">
                                                {formatCurrency(report.total_amount, report.expenses[0]?.currency || 'TRY')}
                                            </p>
                                        </Col>
                                    </Row>
                                    
                                    <Row className="mb-3">
                                        <Col md={12}>
                                            <h6 className="fw-semibold">Tarih Aralığı:</h6>
                                            <p>{formatDate(report.start_date)} - {formatDate(report.end_date)}</p>
                                        </Col>
                                    </Row>
                                    
                                    {report.description && (
                                        <Row className="mb-3">
                                            <Col md={12}>
                                                <h6 className="fw-semibold">Açıklama:</h6>
                                                <p>{report.description}</p>
                                            </Col>
                                        </Row>
                                    )}
                                    
                                    {report.notes && (
                                        <Row className="mb-3">
                                            <Col md={12}>
                                                <h6 className="fw-semibold">Notlar:</h6>
                                                <p>{report.notes}</p>
                                            </Col>
                                        </Row>
                                    )}
                                    
                                    {report.rejection_reason && (
                                        <Row className="mb-3">
                                            <Col md={12}>
                                                <h6 className="fw-semibold text-danger">Red Nedeni:</h6>
                                                <p className="text-danger">{report.rejection_reason}</p>
                                            </Col>
                                        </Row>
                                    )}
                                </Card.Body>
                            </Card>
                            
                            <Card>
                                <Card.Header>
                                    <h5 className="card-title mb-0">Rapordaki Harcamalar</h5>
                                </Card.Header>
                                <Card.Body>
                                    <div className="table-responsive">
                                        <Table className="table-bordered table-striped">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>#</th>
                                                    <th>Harcama</th>
                                                    <th>Kategori</th>
                                                    <th>Tarih</th>
                                                    <th>Tutar</th>
                                                    <th>Durum</th>
                                                    <th>İşlemler</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {report.expenses.map((expense, index) => (
                                                    <tr key={expense.id}>
                                                        <td>{index + 1}</td>
                                                        <td>
                                                            <div className="fw-medium">{expense.title}</div>
                                                            {expense.description && (
                                                                <small className="text-muted d-block">{expense.description}</small>
                                                            )}
                                                        </td>
                                                        <td>{expense.category.name}</td>
                                                        <td>{formatDate(expense.expense_date)}</td>
                                                        <td className="text-end fw-medium">
                                                            {formatCurrency(expense.amount, expense.currency)}
                                                        </td>
                                                        <td>
                                                            <Badge bg={getStatusBadge(expense.status)}>
                                                                {getStatusText(expense.status)}
                                                            </Badge>
                                                        </td>
                                                        <td>
                                                            <Link href={route('expenses.show', expense.id)} className="btn btn-sm btn-soft-info">
                                                                <i className="ri-eye-fill"></i>
                                                            </Link>
                                                            {expense.receipt_path && (
                                                                <a 
                                                                    href={route('expenses.download-receipt', expense.id)} 
                                                                    className="btn btn-sm btn-soft-primary ms-1"
                                                                    target="_blank"
                                                                >
                                                                    <i className="ri-download-2-line"></i>
                                                                </a>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="table-light">
                                                <tr>
                                                    <td colSpan={4} className="text-end fw-bold">
                                                        Toplam:
                                                    </td>
                                                    <td className="text-end fw-bold">
                                                        {formatCurrency(report.total_amount, report.expenses[0]?.currency || 'TRY')}
                                                    </td>
                                                    <td colSpan={2}></td>
                                                </tr>
                                            </tfoot>
                                        </Table>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        
                        <Col lg={4}>
                            <Card>
                                <Card.Header>
                                    <h5 className="card-title mb-0">Rapor Sahibi</h5>
                                </Card.Header>
                                <Card.Body>
                                    <div className="d-flex align-items-center mb-3">
                                        <div className="flex-shrink-0 avatar-md me-3">
                                            <div className="avatar-title bg-soft-primary text-primary rounded-circle fs-1">
                                                {report.user.first_name.charAt(0) + report.user.last_name.charAt(0)}
                                            </div>
                                        </div>
                                        <div className="flex-grow-1">
                                            <h5 className="fs-16 mb-1">
                                                {report.user.first_name} {report.user.last_name}
                                            </h5>
                                            <p className="text-muted mb-0">
                                                Rapor Sahibi
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <hr />
                                    
                                    <div className="mb-3">
                                        <h6 className="fw-semibold">Oluşturulma Tarihi:</h6>
                                        <p>{formatDate(report.created_at)}</p>
                                    </div>
                                    
                                    {report.approver && (
                                        <>
                                            <hr />
                                            <div className="mb-3">
                                                <h6 className="fw-semibold">Onaylayan:</h6>
                                                <p>{report.approver.first_name} {report.approver.last_name}</p>
                                                <p className="text-muted mb-0">
                                                    <small>Onay Tarihi: {formatDate(report.approved_at)}</small>
                                                </p>
                                            </div>
                                        </>
                                    )}
                                    
                                    <hr />
                                    
                                    <div className="mb-3">
                                        <h6 className="fw-semibold">Rapor İstatistikleri:</h6>
                                        <div className="mt-3">
                                            <p className="mb-2">
                                                <span className="text-muted">Toplam Harcama Sayısı:</span>
                                                <span className="float-end fw-semibold">{report.expenses.length}</span>
                                            </p>
                                            
                                            <p className="mb-2">
                                                <span className="text-muted">Toplam Tutar:</span>
                                                <span className="float-end fw-semibold">
                                                    {formatCurrency(report.total_amount, report.expenses[0]?.currency || 'TRY')}
                                                </span>
                                            </p>
                                            
                                            <p className="mb-0">
                                                <span className="text-muted">Ortalama Harcama:</span>
                                                <span className="float-end fw-semibold">
                                                    {formatCurrency(
                                                        report.expenses.length > 0 ? report.total_amount / report.expenses.length : 0, 
                                                        report.expenses[0]?.currency || 'TRY'
                                                    )}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                    
                    {/* Reject Modal */}
                    <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)}>
                        <Modal.Header closeButton>
                            <Modal.Title>Raporu Reddet</Modal.Title>
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
                </Container>
            </div>
        </React.Fragment>
    );
};

ExpenseReportShow.layout = (page: any) => <Layout children={page} />;
export default ExpenseReportShow;
