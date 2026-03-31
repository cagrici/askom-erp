import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, Table, Dropdown } from 'react-bootstrap';
import BreadCrumb from '../../Components/Common/BreadCrumb';
import { Head, Link, useForm } from '@inertiajs/react';
import Layout from '../../Layouts';
import Pagination from '../../Components/Common/Pagination';

// Define types for our props
interface Expense {
    id: number;
    title: string;
    description: string;
    amount: number;
    currency: string;
    expense_date: string;
    status: string;
    user: {
        id: number;
        first_name: string;
        last_name: string;
    };
    category: {
        id: number;
        name: string;
    };
    department?: {
        id: number;
        name: string;
    };
    location?: {
        id: number;
        name: string;
    };
    receipt_path: string | null;
    created_at: string;
    expense_type: string;
    payment_method: string | null;
    is_reimbursed: boolean;
}

interface ExpenseCategory {
    id: number;
    name: string;
    slug: string;
}

interface Location {
    id: number;
    name: string;
}

interface ExpensesIndexProps {
    expenses: {
        data: Expense[];
        links: any;
        meta: any;
    };
    categories: ExpenseCategory[];
    locations: Location[];
    filters: {
        status: string;
        category: string;
        location: string;
        search: string;
        date_from: string;
        date_to: string;
        sort_by: string;
        sort_order: string;
    };
    isAdmin: boolean;
}

const ExpenseIndex = (props: ExpensesIndexProps) => {
    const { expenses, categories, locations, filters, isAdmin } = props;
    
    // State for search form
    const { data, setData, get, processing } = useForm({
        search: filters.search || '',
        status: filters.status || '',
        category: filters.category || '',
        location: filters.location || '',
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
        get(route('expenses.index'), {
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
        
        get(route('expenses.index'), {
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

    // Format currency
    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(amount);
    };
    
    return (
        <React.Fragment>
            <Head title="Harcamalar | Portal" />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Harcamalar" pageTitle="Finans Yönetimi" />
                    
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
                                                    <Form.Label>Kategori</Form.Label>
                                                    <Form.Select
                                                        name="category"
                                                        value={data.category}
                                                        onChange={handleChange}
                                                    >
                                                        <option value="">Tümü</option>
                                                        {categories.map((category) => (
                                                            <option key={category.id} value={category.id}>
                                                                {category.name}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                            <Col lg={3}>
                                                <Form.Group>
                                                    <Form.Label>Lokasyon</Form.Label>
                                                    <Form.Select
                                                        name="location"
                                                        value={data.location}
                                                        onChange={handleChange}
                                                    >
                                                        <option value="">Tümü</option>
                                                        {locations.map((location) => (
                                                            <option key={location.id} value={location.id}>
                                                                {location.name}
                                                            </option>
                                                        ))}
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
                                    <h4 className="card-title mb-0 flex-grow-1">Harcamalar</h4>
                                    <div className="d-flex gap-2">
                                        <Link href={route('expenses.create')} className="btn btn-primary">
                                            <i className="ri-add-line align-bottom me-1"></i> Yeni Harcama Ekle
                                        </Link>
                                        {isAdmin && (
                                            <Link href={route('expense-categories.index')} className="btn btn-info">
                                                <i className="ri-list-check me-1"></i> Kategoriler
                                            </Link>
                                        )}
                                        <Link href={route('expense-reports.index')} className="btn btn-success">
                                            <i className="ri-file-list-3-line me-1"></i> Harcama Raporları
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
                                                    <th 
                                                        className="sort"
                                                        onClick={() => handleSort('amount')}
                                                    >
                                                        <a href="#" className="text-reset d-block">
                                                            Tutar
                                                            {data.sort_by === 'amount' && (
                                                                <i className={`las la-angle-${data.sort_order === 'asc' ? 'up' : 'down'} ms-1`}></i>
                                                            )}
                                                        </a>
                                                    </th>
                                                    <th>Kategori</th>
                                                    {isAdmin && <th>Personel</th>}
                                                    <th 
                                                        className="sort"
                                                        onClick={() => handleSort('expense_date')}
                                                    >
                                                        <a href="#" className="text-reset d-block">
                                                            Harcama Tarihi
                                                            {data.sort_by === 'expense_date' && (
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
                                                    <th>Fiş/Fatura</th>
                                                    <th>İşlemler</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {expenses.data.length > 0 ? (
                                                    expenses.data.map((expense) => (
                                                        <tr key={expense.id}>
                                                            <td>
                                                                <Link href={route('expenses.show', expense.id)}>
                                                                    {expense.title}
                                                                </Link>
                                                            </td>
                                                            <td>
                                                                <span className="fw-semibold">
                                                                    {formatCurrency(expense.amount, expense.currency)}
                                                                </span>
                                                            </td>
                                                            <td>{expense.category.name}</td>
                                                            {isAdmin && (
                                                                <td>
                                                                    {expense.user.first_name} {expense.user.last_name}
                                                                </td>
                                                            )}
                                                            <td>
                                                                {new Date(expense.expense_date).toLocaleDateString('tr-TR')}
                                                            </td>
                                                            <td>
                                                                <Badge bg={getStatusBadge(expense.status)}>
                                                                    {expense.status === 'pending' && 'Beklemede'}
                                                                    {expense.status === 'approved' && 'Onaylandı'}
                                                                    {expense.status === 'rejected' && 'Reddedildi'}
                                                                    {expense.status === 'paid' && 'Ödendi'}
                                                                </Badge>
                                                            </td>
                                                            <td>
                                                                {expense.receipt_path ? (
                                                                    <a href={route('expenses.download-receipt', expense.id)} target="_blank" className="btn btn-sm btn-soft-info">
                                                                        <i className="ri-download-2-line"></i>
                                                                    </a>
                                                                ) : (
                                                                    <span className="badge bg-light text-muted">Yok</span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <Dropdown>
                                                                    <Dropdown.Toggle variant="light" size="sm" className="arrow-none">
                                                                        <i className="ri-more-fill"></i>
                                                                    </Dropdown.Toggle>
                                                                    <Dropdown.Menu>
                                                                        <Dropdown.Item as={Link} href={route('expenses.show', expense.id)}>
                                                                            <i className="ri-eye-fill me-2 align-bottom text-muted"></i>
                                                                            Görüntüle
                                                                        </Dropdown.Item>
                                                                        {expense.status === 'pending' && (
                                                                            <Dropdown.Item as={Link} href={route('expenses.edit', expense.id)}>
                                                                                <i className="ri-pencil-fill me-2 align-bottom text-muted"></i>
                                                                                Düzenle
                                                                            </Dropdown.Item>
                                                                        )}
                                                                        {isAdmin && expense.status === 'pending' && (
                                                                            <>
                                                                                <Dropdown.Divider />
                                                                                <Dropdown.Item
                                                                                    as={Link}
                                                                                    href={route('expenses.approve', expense.id)}
                                                                                    method="post"
                                                                                    className="text-success"
                                                                                >
                                                                                    <i className="ri-check-fill me-2 align-bottom"></i>
                                                                                    Onayla
                                                                                </Dropdown.Item>
                                                                                <Dropdown.Item
                                                                                    as={Link}
                                                                                    href={route('expenses.reject', expense.id)}
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
                                                        <td colSpan={isAdmin ? 8 : 7} className="text-center">
                                                            Kayıt bulunamadı
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </Table>
                                        
                                        {expenses.data.length > 0 && (
                                            <div className="d-flex justify-content-end mt-3">
                                                <Pagination links={expenses.links} />
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

ExpenseIndex.layout = (page: any) => <Layout children={page} />;
export default ExpenseIndex;
