import React from 'react';
import { Card, Row, Col, Button } from 'react-bootstrap';
import { Link } from '@inertiajs/react';

interface ExpenseSummary {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    paid: number;
    month_total: number;
    month_count: number;
    categories: {
        id: number;
        name: string;
        count: number;
        total: number;
    }[];
}

interface ExpenseDashboardProps {
    summary: ExpenseSummary;
    currency?: string;
}

const ExpenseDashboard: React.FC<ExpenseDashboardProps> = ({ summary, currency = 'TRY' }) => {
    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(amount);
    };

    return (
        <div className="expense-dashboard">
            <Row>
                <Col xl={8}>
                    <Card className="card-height-100">
                        <Card.Header className="d-flex align-items-center">
                            <h4 className="card-title mb-0 flex-grow-1">Harcama Özeti</h4>
                            <div>
                                <Link href={route('expenses.index')} className="btn btn-soft-info btn-sm">
                                    <i className="ri-file-list-3-line align-middle"></i> Tüm Harcamalar
                                </Link>
                            </div>
                        </Card.Header>
                        <Card.Body>
                            <Row className="align-items-center">
                                <Col lg={6}>
                                    <div className="py-3">
                                        <h5 className="mb-3">Bu ayki harcama özeti:</h5>
                                        <div className="vstack gap-2">
                                            <div className="d-flex align-items-center">
                                                <div className="flex-shrink-0">
                                                    <i className="ri-calendar-check-line fs-18 align-middle me-2 text-success"></i>
                                                </div>
                                                <div className="flex-grow-1 ms-2">
                                                    <span>Bu ay toplam</span>
                                                </div>
                                                <div className="flex-shrink-0">
                                                    <span className="fw-semibold fs-13 text-success">{formatCurrency(summary.month_total)}</span>
                                                </div>
                                            </div>
                                            <div className="d-flex align-items-center">
                                                <div className="flex-shrink-0">
                                                    <i className="ri-exchange-dollar-line fs-18 align-middle me-2 text-primary"></i>
                                                </div>
                                                <div className="flex-grow-1 ms-2">
                                                    <span>Toplam harcama</span>
                                                </div>
                                                <div className="flex-shrink-0">
                                                    <span className="fw-semibold fs-13">{formatCurrency(summary.total)}</span>
                                                </div>
                                            </div>
                                            <div className="d-flex align-items-center">
                                                <div className="flex-shrink-0">
                                                    <i className="ri-time-line fs-18 align-middle me-2 text-warning"></i>
                                                </div>
                                                <div className="flex-grow-1 ms-2">
                                                    <span>Bekleyen harcama</span>
                                                </div>
                                                <div className="flex-shrink-0">
                                                    <span className="fw-semibold fs-13 text-warning">{formatCurrency(summary.pending)}</span>
                                                </div>
                                            </div>
                                            <div className="d-flex align-items-center">
                                                <div className="flex-shrink-0">
                                                    <i className="ri-check-double-line fs-18 align-middle me-2 text-success"></i>
                                                </div>
                                                <div className="flex-grow-1 ms-2">
                                                    <span>Onaylanan harcama</span>
                                                </div>
                                                <div className="flex-shrink-0">
                                                    <span className="fw-semibold fs-13 text-success">{formatCurrency(summary.approved)}</span>
                                                </div>
                                            </div>
                                            <div className="d-flex align-items-center">
                                                <div className="flex-shrink-0">
                                                    <i className="ri-close-circle-line fs-18 align-middle me-2 text-danger"></i>
                                                </div>
                                                <div className="flex-grow-1 ms-2">
                                                    <span>Reddedilen harcama</span>
                                                </div>
                                                <div className="flex-shrink-0">
                                                    <span className="fw-semibold fs-13 text-danger">{formatCurrency(summary.rejected)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-4">
                                            <Link href={route('expenses.create')} className="btn btn-primary">
                                                <i className="ri-add-line align-bottom me-1"></i> Yeni Harcama Ekle
                                            </Link>
                                        </div>
                                    </div>
                                </Col>
                                <Col lg={6}>
                                    <div className="py-3">
                                        <h5 className="mb-3">Kategoriye göre harcamalar:</h5>
                                        <div className="vstack gap-2">
                                            {summary.categories.slice(0, 5).map((category) => (
                                                <div key={category.id} className="d-flex align-items-center">
                                                    <div className="flex-grow-1">
                                                        <span>{category.name}</span>
                                                    </div>
                                                    <div className="flex-shrink-0">
                                                        <span className="fw-semibold fs-13">{formatCurrency(category.total)}</span>
                                                        <span className="ms-2 badge bg-light text-muted">{category.count}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            
                                            {summary.categories.length > 5 && (
                                                <div className="text-center mt-3">
                                                    <Link href={route('expense-categories.index')} className="btn btn-soft-secondary btn-sm">
                                                        Tüm Kategorileri Gör
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xl={4}>
                    <Card className="card-height-100">
                        <Card.Header className="d-flex align-items-center">
                            <h4 className="card-title mb-0 flex-grow-1">Hızlı İşlemler</h4>
                        </Card.Header>
                        <Card.Body>
                            <div className="d-grid gap-2">
                                <Link href={route('expenses.create')} className="btn btn-primary">
                                    <i className="ri-add-line align-bottom me-1"></i> Yeni Harcama Ekle
                                </Link>
                                <Link href={route('expense-reports.create')} className="btn btn-success">
                                    <i className="ri-file-list-3-line align-bottom me-1"></i> Yeni Harcama Raporu
                                </Link>
                                <Link 
                                    href={`${route('expenses.index')}?status=pending`} 
                                    className="btn btn-warning"
                                >
                                    <i className="ri-time-line align-bottom me-1"></i> Bekleyen Harcamalar
                                </Link>
                                <Link 
                                    href={`${route('expenses.index')}?status=approved`}
                                    className="btn btn-info"
                                >
                                    <i className="ri-check-double-line align-bottom me-1"></i> Onaylanan Harcamalar
                                </Link>
                            </div>
                            
                            <div className="mt-4">
                                <h5 className="fs-13 mb-3">Bu Ay Özet:</h5>
                                <div className="d-flex align-items-center">
                                    <div className="flex-grow-1">
                                        <p className="text-muted mb-1">Toplam Harcama</p>
                                        <h4 className="mb-0">{formatCurrency(summary.month_total)}</h4>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <span className="badge bg-light text-muted fs-12">
                                            <i className="ri-shopping-bag-line align-bottom me-1"></i> {summary.month_count} Harcama
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default ExpenseDashboard;
