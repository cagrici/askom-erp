import React from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, Table, Dropdown } from 'react-bootstrap';
import BreadCrumb from '../../../Components/Common/BreadCrumb';
import { Head, Link, useForm } from '@inertiajs/react';
import Layout from '../../../Layouts';
import Pagination from '../../../Components/Common/Pagination';

// Define types for our props
interface User {
    id: number;
    first_name: string;
    last_name: string;
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
    created_at: string;
}

interface ReportsIndexProps {
    reports: {
        data: ExpenseReport[];
        links: any;
        meta: any;
    };
    filters: {
        status: string;
        search: string;
        date_from: string;
        date_to: string;
        sort_by: string;
        sort_order: string;
    };
    isAdmin: boolean;
}

const ExpenseReportIndex = (props: ReportsIndexProps) => {
    const { reports, filters, isAdmin } = props;
    
    // State for search form
    const { data, setData, get, processing } = useForm({
        search: filters.search || '',
        status: filters.status || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
        sort_by: filters.sort_by || 'created_at',
        sort_order: filters.sort_order || 'desc',
    });
    
    // Handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setData(name, value);
    };
    
    // Handle search form submission
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        
        get(route('expense-reports.index'), {
            preserveState: true,
        });
    };
    
    // Handle sort change
    const handleSort = (field: string) => {
        const direction = data.sort_by === field && data.sort_order === 'asc' ? 'desc' : 'asc';
        
        setData({
            ...data,
            sort_by: field,
            sort_order: direction,
        });
        
        get(route('expense-reports.index'), {
            preserveState: true,
        });
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
    
    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR');
    };
    
    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
    };
    
    return (
        <React.Fragment>
            <Head title="Harcama Raporları | Portal" />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Harcama Raporları" pageTitle="Finans Yönetimi" />
                    
                    <Row className="mb-4">
                        <Col lg={12}>
                            <Card>
                                <Card.Header>
                                    <h4 className="card-title mb-0 flex-grow-1">Filtreler</h4>
                                </Card.Header>
                                <Card.Body>
                                    <Form onSubmit={handleSearch}>
                                        <Row className="g-3">
                                            <Col lg={3}>
                                                <Form.Group>
                                                    <Form.Label>Arama</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        name="search"
                                                        value={data.search}
                                                        onChange={handleChange}
                                                        placeholder="Başlık veya açıklama ara..."
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col lg={3}>
                                                <Form.Group>
                                                    <Form.Label>Durum</Form.Label>
                                                    <Form.Select
                                                        name="status"
                                                        value={data.status}
                                                        onChange={handleChange}
                                                    >
                                                        <option value="">Tümü</option>
                                                        <option value="pending">Beklemede</option>
                                                        <option value="approved">Onaylandı</option>
                                                        <option value="rejected">Reddedildi</option>
                                                        <option value="paid">Ödendi</option>
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                            <Col lg={3}>
                                                <Form.Group>
                                                    <Form.Label>Başlangıç Tarihi</Form.Label>
                                                    <Form.Control
                                                        type="date"
                                                        name="date_from"
                                                        value={data.date_from}
                                                        onChange={handleChange}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col lg={3}>
                                                <Form.Group>
                                                    <Form.Label>Bitiş Tarihi</Form.Label>
                                                    <Form.Control
                                                        type="date"
                                                        name="date_to"
                                                        value={data.date_to}
                                                        onChange={handleChange}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col lg={12} className="text-end">
                                                <Button type="submit" variant="primary" disabled={processing}>
                                                    <i className="ri-search-line me-1"></i> Filtrele
                                                </Button>
                                            </Col>
                                        </Row>
                                    </Form>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                    
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <Card.Header className="d-flex align-items-center">
                                    <h4 className="card-title mb-0 flex-grow-1">Harcama Raporları</h4>
                                    <div className="d-flex gap-2">
                                        <Link href={route('expense-reports.create')} className="btn btn-primary">
                                            <i className="ri-add-line align-bottom me-1"></i> Yeni Rapor Oluştur
                                        </Link>
                                        <Link href={route('expenses.index')} className="btn btn-info">
                                            <i className="ri-list-check me-1"></i> Harcamalara Dön
                                        </Link>
                                    </div>
                                </Card.Header>
                                <Card.Body>
                                    <div className="table-responsive">
                                        <Table className="table-nowrap mb-0">
                                            <thead>
                                                <tr>
                                                    <th 
                                                        className="sort"
                                                        onClick={() => handleSort('title')}
                                                    >
                                                        <a href="#" className="text-reset d-block">
                                                            Başlık
                                                            {data.sort_by === 'title' && (
                                                                <i className={`las la-angle-${data.sort_order === 'asc' ? 'up' : 'down'} ms-1`}></i>
                                                            )}
                                                        </a>
                                                    </th>
                                                    {isAdmin && <th>Personel</th>}
                                                    <th 
                                                        className="sort"
                                                        onClick={() => handleSort('total_amount')}
                                                    >
                                                        <a href="#" className="text-reset d-block">
                                                            Toplam Tutar
                                                            {data.sort_by === 'total_amount' && (
                                                                <i className={`las la-angle-${data.sort_order === 'asc' ? 'up' : 'down'} ms-1`}></i>
                                                            )}
                                                        </a>
                                                    </th>
                                                    <th 
                                                        className="sort"
                                                        onClick={() => handleSort('start_date')}
                                                    >
                                                        <a href="#" className="text-reset d-block">
                                                            Tarih Aralığı
                                                            {data.sort_by === 'start_date' && (
                                                                <i className={`las la-angle-${data.sort_order === 'asc' ? 'up' : 'down'} ms-1`}></i>
                                                            )}
                                                        </a>
                                                    </th>
                                                    <th 
                                                        className="sort"
                                                        onClick={() => handleSort('status')}
                                                    >
                                                        <a href="#" className="text-reset d-block">
                                                            Durum
                                                            {data.sort_by === 'status' && (
                                                                <i className={`las la-angle-${data.sort_order === 'asc' ? 'up' : 'down'} ms-1`}></i>
                                                            )}
                                                        </a>
                                                    </th>
                                                    <th>İşlemler</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reports.data.length > 0 ? (
                                                    reports.data.map((report) => (
                                                        <tr key={report.id}>
                                                            <td>
                                                                <Link href={route('expense-reports.show', report.id)}>
                                                                    {report.title}
                                                                </Link>
                                                            </td>
                                                            {isAdmin && (
                                                                <td>
                                                                    {report.user.first_name} {report.user.last_name}
                                                                </td>
                                                            )}
                                                            <td>
                                                                <span className="fw-semibold">
                                                                    {formatCurrency(report.total_amount)}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {formatDate(report.start_date)} - {formatDate(report.end_date)}
                                                            </td>
                                                            <td>
                                                                <Badge bg={getStatusBadge(report.status)}>
                                                                    {report.status === 'pending' && 'Beklemede'}
                                                                    {report.status === 'approved' && 'Onaylandı'}
                                                                    {report.status === 'rejected' && 'Reddedildi'}
                                                                    {report.status === 'paid' && 'Ödendi'}
                                                                </Badge>
                                                            </td>
                                                            <td>
                                                                <Dropdown>
                                                                    <Dropdown.Toggle variant="light" size="sm" className="arrow-none">
                                                                        <i className="ri-more-fill"></i>
                                                                    </Dropdown.Toggle>
                                                                    <Dropdown.Menu>
                                                                        <Dropdown.Item as={Link} href={route('expense-reports.show', report.id)}>
                                                                            <i className="ri-eye-fill me-2 align-bottom text-muted"></i>
                                                                            Görüntüle
                                                                        </Dropdown.Item>
                                                                        
                                                                        {report.status === 'pending' && (
                                                                            <Dropdown.Item as={Link} href={route('expense-reports.edit', report.id)}>
                                                                                <i className="ri-pencil-fill me-2 align-bottom text-muted"></i>
                                                                                Düzenle
                                                                            </Dropdown.Item>
                                                                        )}
                                                                        
                                                                        <Dropdown.Item as={Link} href={route('expense-reports.export-pdf', report.id)} target="_blank">
                                                                            <i className="ri-file-pdf-line me-2 align-bottom text-muted"></i>
                                                                            PDF Olarak İndir
                                                                        </Dropdown.Item>
                                                                        
                                                                        <Dropdown.Item as={Link} href={route('expense-reports.export-excel', report.id)}>
                                                                            <i className="ri-file-excel-line me-2 align-bottom text-muted"></i>
                                                                            Excel Olarak İndir
                                                                        </Dropdown.Item>
                                                                        
                                                                        {isAdmin && report.status === 'pending' && (
                                                                            <>
                                                                                <Dropdown.Divider />
                                                                                <Dropdown.Item
                                                                                    as={Link}
                                                                                    href={route('expense-reports.approve', report.id)}
                                                                                    method="post"
                                                                                    className="text-success"
                                                                                >
                                                                                    <i className="ri-check-fill me-2 align-bottom"></i>
                                                                                    Onayla
                                                                                </Dropdown.Item>
                                                                                <Dropdown.Item
                                                                                    as={Link}
                                                                                    href={route('expense-reports.reject', report.id)}
                                                                                    method="post"
                                                                                    data={{ rejection_reason: 'Ret nedeni' }}
                                                                                    className="text-danger"
                                                                                >
                                                                                    <i className="ri-close-fill me-2 align-bottom"></i>
                                                                                    Reddet
                                                                                </Dropdown.Item>
                                                                            </>
                                                                        )}
                                                                    </Dropdown.Menu>
                                                                </Dropdown>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={isAdmin ? 6 : 5} className="text-center">
                                                            Kayıt bulunamadı
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </Table>
                                        
                                        {reports.data.length > 0 && (
                                            <div className="d-flex justify-content-end mt-3">
                                                <Pagination links={reports.links} />
                                            </div>
                                        )}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    );
};

ExpenseReportIndex.layout = (page: any) => <Layout children={page} />;
export default ExpenseReportIndex;
