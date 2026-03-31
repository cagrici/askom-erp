import React from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, Table, Dropdown } from 'react-bootstrap';
import BreadCrumb from '../../../Components/Common/BreadCrumb';
import { Head, Link, useForm } from '@inertiajs/react';
import Layout from '../../../Layouts';
import Pagination from '../../../Components/Common/Pagination';

// Define types for our props
interface ExpenseCategory {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    is_active: boolean;
    parent_id: number | null;
    parent?: {
        id: number;
        name: string;
    };
}

interface CategoriesIndexProps {
    categories: {
        data: ExpenseCategory[];
        links: any;
        meta: any;
    };
    filters: {
        search: string;
        is_active: boolean | null;
        sort_by: string;
        sort_order: string;
    };
}

const ExpenseCategoryIndex = (props: CategoriesIndexProps) => {
    const { categories, filters } = props;
    
    // State for search form
    const { data, setData, get, processing } = useForm({
        search: filters.search || '',
        is_active: filters.is_active === null ? '' : filters.is_active ? '1' : '0',
        sort_by: filters.sort_by || 'name',
        sort_order: filters.sort_order || 'asc',
    });
    
    // Handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setData(name, value);
    };
    
    // Handle search form submission
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        
        get(route('expense-categories.index'), {
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
        
        get(route('expense-categories.index'), {
            preserveState: true,
        });
    };
    
    // Handle toggle active
    const handleToggleActive = (categoryId: number, currentStatus: boolean) => {
        if (confirm(`Bu kategoriyi ${currentStatus ? 'pasif' : 'aktif'} duruma getirmek istediğinize emin misiniz?`)) {
            // Use Link method to submit a POST request to toggle the status
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = route('expense-categories.toggle-active', categoryId);
            
            // Add CSRF token
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = '_token';
            csrfInput.value = csrfToken;
            form.appendChild(csrfInput);
            
            // Add method field for Laravel to know it's a POST request
            const methodInput = document.createElement('input');
            methodInput.type = 'hidden';
            methodInput.name = '_method';
            methodInput.value = 'POST';
            form.appendChild(methodInput);
            
            document.body.appendChild(form);
            form.submit();
        }
    };
    
    return (
        <React.Fragment>
            <Head title="Harcama Kategorileri | Portal" />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Harcama Kategorileri" pageTitle="Harcama Yönetimi" />
                    
                    <Row className="mb-4">
                        <Col lg={12}>
                            <Card>
                                <Card.Header>
                                    <h4 className="card-title mb-0 flex-grow-1">Filtreler</h4>
                                </Card.Header>
                                <Card.Body>
                                    <Form onSubmit={handleSearch}>
                                        <Row className="g-3">
                                            <Col lg={6}>
                                                <Form.Group>
                                                    <Form.Label>Arama</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        name="search"
                                                        value={data.search}
                                                        onChange={handleChange}
                                                        placeholder="İsim veya açıklama ara..."
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col lg={6}>
                                                <Form.Group>
                                                    <Form.Label>Durum</Form.Label>
                                                    <Form.Select
                                                        name="is_active"
                                                        value={data.is_active}
                                                        onChange={handleChange}
                                                    >
                                                        <option value="">Tümü</option>
                                                        <option value="1">Aktif</option>
                                                        <option value="0">Pasif</option>
                                                    </Form.Select>
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
                                    <h4 className="card-title mb-0 flex-grow-1">Harcama Kategorileri</h4>
                                    <div className="d-flex gap-2">
                                        <Link href={route('expense-categories.create')} className="btn btn-primary">
                                            <i className="ri-add-line align-bottom me-1"></i> Yeni Kategori Ekle
                                        </Link>
                                        <Link href={route('expenses.index')} className="btn btn-info">
                                            <i className="ri-arrow-left-line align-bottom me-1"></i> Harcamalara Dön
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
                                                        onClick={() => handleSort('name')}
                                                    >
                                                        <a href="#" className="text-reset d-block">
                                                            İsim
                                                            {data.sort_by === 'name' && (
                                                                <i className={`las la-angle-${data.sort_order === 'asc' ? 'up' : 'down'} ms-1`}></i>
                                                            )}
                                                        </a>
                                                    </th>
                                                    <th>Üst Kategori</th>
                                                    <th>Açıklama</th>
                                                    <th 
                                                        className="sort"
                                                        onClick={() => handleSort('is_active')}
                                                    >
                                                        <a href="#" className="text-reset d-block">
                                                            Durum
                                                            {data.sort_by === 'is_active' && (
                                                                <i className={`las la-angle-${data.sort_order === 'asc' ? 'up' : 'down'} ms-1`}></i>
                                                            )}
                                                        </a>
                                                    </th>
                                                    <th>İşlemler</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {categories.data.length > 0 ? (
                                                    categories.data.map((category) => (
                                                        <tr key={category.id}>
                                                            <td>
                                                                <Link href={route('expense-categories.show', category.id)}>
                                                                    {category.name}
                                                                </Link>
                                                            </td>
                                                            <td>
                                                                {category.parent ? (
                                                                    <Link href={route('expense-categories.show', category.parent.id)}>
                                                                        {category.parent.name}
                                                                    </Link>
                                                                ) : (
                                                                    '-'
                                                                )}
                                                            </td>
                                                            <td>{category.description || '-'}</td>
                                                            <td>
                                                                <Badge 
                                                                    bg={category.is_active ? 'success' : 'danger'}
                                                                    role="button"
                                                                    onClick={() => handleToggleActive(category.id, category.is_active)}
                                                                >
                                                                    {category.is_active ? 'Aktif' : 'Pasif'}
                                                                </Badge>
                                                            </td>
                                                            <td>
                                                                <Dropdown>
                                                                    <Dropdown.Toggle variant="light" size="sm" className="arrow-none">
                                                                        <i className="ri-more-fill"></i>
                                                                    </Dropdown.Toggle>
                                                                    <Dropdown.Menu>
                                                                        <Dropdown.Item as={Link} href={route('expense-categories.show', category.id)}>
                                                                            <i className="ri-eye-fill me-2 align-bottom text-muted"></i>
                                                                            Görüntüle
                                                                        </Dropdown.Item>
                                                                        <Dropdown.Item as={Link} href={route('expense-categories.edit', category.id)}>
                                                                            <i className="ri-pencil-fill me-2 align-bottom text-muted"></i>
                                                                            Düzenle
                                                                        </Dropdown.Item>
                                                                        <Dropdown.Divider />
                                                                        <Dropdown.Item
                                                                            as={Link}
                                                                            href={route('expense-categories.toggle-active', category.id)}
                                                                            method="post"
                                                                            className={category.is_active ? 'text-danger' : 'text-success'}
                                                                        >
                                                                            <i className={`ri-${category.is_active ? 'close' : 'check'}-line me-2 align-bottom`}></i>
                                                                            {category.is_active ? 'Pasif Duruma Getir' : 'Aktif Duruma Getir'}
                                                                        </Dropdown.Item>
                                                                    </Dropdown.Menu>
                                                                </Dropdown>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={5} className="text-center">
                                                            Kayıt bulunamadı
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </Table>
                                        
                                        {categories.data.length > 0 && (
                                            <div className="d-flex justify-content-end mt-3">
                                                <Pagination links={categories.links} />
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

ExpenseCategoryIndex.layout = (page: any) => <Layout children={page} />;
export default ExpenseCategoryIndex;
