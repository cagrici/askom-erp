import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';
import BreadCrumb from '../../Components/Common/BreadCrumb';
import { Head, Link, useForm } from '@inertiajs/react';
import Layout from '../../Layouts';

// Define types for our props
interface ExpenseCategory {
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
    category_id: number;
    expense_type: string;
    receipt_path: string | null;
    department_id: number | null;
    location_id: number | null;
    payment_method: string | null;
    payment_reference: string | null;
}

interface EditProps {
    expense: Expense;
    categories: ExpenseCategory[];
    departments: Department[];
    locations: Location[];
}

const ExpenseEdit = (props: EditProps) => {
    const { expense, categories, departments, locations } = props;
    
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    
    const { data, setData, post, processing, errors } = useForm({
        title: expense.title,
        description: expense.description || '',
        amount: expense.amount.toString(),
        currency: expense.currency,
        expense_date: expense.expense_date.substring(0, 10), // Format YYYY-MM-DD for the date input
        category_id: expense.category_id,
        expense_type: expense.expense_type,
        receipt: null as File | null,
        department_id: expense.department_id || '',
        location_id: expense.location_id || '',
        payment_method: expense.payment_method || '',
        payment_reference: expense.payment_reference || '',
        status: expense.status,
        _method: 'PUT',
    });
    
    // Handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        
        if (type === 'file') {
            const fileInput = e.target as HTMLInputElement;
            const file = fileInput.files?.[0] || null;
            setSelectedFile(file);
            setData('receipt', file);
        } else {
            setData(name, value);
        }
    };
    
    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        post(route('expenses.update', expense.id), {
            forceFormData: true,
        });
    };
    
    return (
        <React.Fragment>
            <Head title="Harcama Düzenle | Portal" />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Harcama Düzenle" pageTitle="Harcama Yönetimi" />
                    
                    <Row className="justify-content-center">
                        <Col lg={8}>
                            <Card>
                                <Card.Header>
                                    <h4 className="card-title mb-0 flex-grow-1">Harcama Bilgileri</h4>
                                </Card.Header>
                                <Card.Body>
                                    <Form onSubmit={handleSubmit}>
                                        <Row className="mb-3">
                                            <Col md={12}>
                                                <Form.Group>
                                                    <Form.Label>Başlık <span className="text-danger">*</span></Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        name="title"
                                                        value={data.title}
                                                        onChange={handleChange}
                                                        required
                                                        isInvalid={!!errors.title}
                                                    />
                                                    {errors.title && <Form.Control.Feedback type="invalid">{errors.title}</Form.Control.Feedback>}
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        
                                        <Row className="mb-3">
                                            <Col md={12}>
                                                <Form.Group>
                                                    <Form.Label>Açıklama</Form.Label>
                                                    <Form.Control
                                                        as="textarea"
                                                        rows={3}
                                                        name="description"
                                                        value={data.description}
                                                        onChange={handleChange}
                                                        isInvalid={!!errors.description}
                                                    />
                                                    {errors.description && <Form.Control.Feedback type="invalid">{errors.description}</Form.Control.Feedback>}
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        
                                        <Row className="mb-3">
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Tutar <span className="text-danger">*</span></Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        name="amount"
                                                        value={data.amount}
                                                        onChange={handleChange}
                                                        required
                                                        isInvalid={!!errors.amount}
                                                    />
                                                    {errors.amount && <Form.Control.Feedback type="invalid">{errors.amount}</Form.Control.Feedback>}
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Para Birimi <span className="text-danger">*</span></Form.Label>
                                                    <Form.Select
                                                        name="currency"
                                                        value={data.currency}
                                                        onChange={handleChange}
                                                        required
                                                        isInvalid={!!errors.currency}
                                                    >
                                                        <option value="TRY">Türk Lirası (TRY)</option>
                                                        <option value="USD">Amerikan Doları (USD)</option>
                                                        <option value="EUR">Euro (EUR)</option>
                                                        <option value="GBP">İngiliz Sterlini (GBP)</option>
                                                    </Form.Select>
                                                    {errors.currency && <Form.Control.Feedback type="invalid">{errors.currency}</Form.Control.Feedback>}
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        
                                        <Row className="mb-3">
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Harcama Tarihi <span className="text-danger">*</span></Form.Label>
                                                    <Form.Control
                                                        type="date"
                                                        name="expense_date"
                                                        value={data.expense_date}
                                                        onChange={handleChange}
                                                        required
                                                        isInvalid={!!errors.expense_date}
                                                    />
                                                    {errors.expense_date && <Form.Control.Feedback type="invalid">{errors.expense_date}</Form.Control.Feedback>}
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Kategori <span className="text-danger">*</span></Form.Label>
                                                    <Form.Select
                                                        name="category_id"
                                                        value={data.category_id}
                                                        onChange={handleChange}
                                                        required
                                                        isInvalid={!!errors.category_id}
                                                    >
                                                        <option value="">Seçiniz...</option>
                                                        {categories.map((category) => (
                                                            <option key={category.id} value={category.id}>
                                                                {category.name}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                    {errors.category_id && <Form.Control.Feedback type="invalid">{errors.category_id}</Form.Control.Feedback>}
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        
                                        <Row className="mb-3">
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Harcama Tipi <span className="text-danger">*</span></Form.Label>
                                                    <Form.Select
                                                        name="expense_type"
                                                        value={data.expense_type}
                                                        onChange={handleChange}
                                                        required
                                                        isInvalid={!!errors.expense_type}
                                                    >
                                                        <option value="regular">Olağan Harcama</option>
                                                        <option value="travel">Seyahat</option>
                                                        <option value="meal">Yemek</option>
                                                        <option value="accommodation">Konaklama</option>
                                                        <option value="transport">Ulaşım</option>
                                                        <option value="office">Ofis Malzemeleri</option>
                                                        <option value="representation">Temsil Gideri</option>
                                                        <option value="other">Diğer</option>
                                                    </Form.Select>
                                                    {errors.expense_type && <Form.Control.Feedback type="invalid">{errors.expense_type}</Form.Control.Feedback>}
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Makbuz/Fatura</Form.Label>
                                                    {expense.receipt_path && (
                                                        <div className="mb-2">
                                                            <a 
                                                                href={route('expenses.download-receipt', expense.id)} 
                                                                target="_blank" 
                                                                className="btn btn-sm btn-soft-info"
                                                            >
                                                                <i className="ri-file-text-line me-1"></i>
                                                                Mevcut dosyayı görüntüle
                                                            </a>
                                                            <small className="ms-2 text-muted">
                                                                Yeni bir dosya yüklerseniz, mevcut dosya değiştirilecektir.
                                                            </small>
                                                        </div>
                                                    )}
                                                    <Form.Control
                                                        type="file"
                                                        name="receipt"
                                                        onChange={handleChange}
                                                        accept=".jpg,.jpeg,.png,.pdf"
                                                        isInvalid={!!errors.receipt}
                                                    />
                                                    <Form.Text className="text-muted">
                                                        JPG, PNG veya PDF formatında, max 2MB boyutunda.
                                                    </Form.Text>
                                                    {errors.receipt && <Form.Control.Feedback type="invalid">{errors.receipt}</Form.Control.Feedback>}
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        
                                        <Row className="mb-3">
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Departman</Form.Label>
                                                    <Form.Select
                                                        name="department_id"
                                                        value={data.department_id}
                                                        onChange={handleChange}
                                                        isInvalid={!!errors.department_id}
                                                    >
                                                        <option value="">Seçiniz...</option>
                                                        {departments.map((department) => (
                                                            <option key={department.id} value={department.id}>
                                                                {department.name}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                    {errors.department_id && <Form.Control.Feedback type="invalid">{errors.department_id}</Form.Control.Feedback>}
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Lokasyon</Form.Label>
                                                    <Form.Select
                                                        name="location_id"
                                                        value={data.location_id}
                                                        onChange={handleChange}
                                                        isInvalid={!!errors.location_id}
                                                    >
                                                        <option value="">Seçiniz...</option>
                                                        {locations.map((location) => (
                                                            <option key={location.id} value={location.id}>
                                                                {location.name}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                    {errors.location_id && <Form.Control.Feedback type="invalid">{errors.location_id}</Form.Control.Feedback>}
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        
                                        <Row className="mb-3">
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Ödeme Yöntemi</Form.Label>
                                                    <Form.Select
                                                        name="payment_method"
                                                        value={data.payment_method}
                                                        onChange={handleChange}
                                                        isInvalid={!!errors.payment_method}
                                                    >
                                                        <option value="">Seçiniz...</option>
                                                        <option value="cash">Nakit</option>
                                                        <option value="credit_card">Kredi Kartı</option>
                                                        <option value="corporate_card">Şirket Kartı</option>
                                                        <option value="bank_transfer">Banka Transferi</option>
                                                        <option value="other">Diğer</option>
                                                    </Form.Select>
                                                    {errors.payment_method && <Form.Control.Feedback type="invalid">{errors.payment_method}</Form.Control.Feedback>}
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Ödeme Referansı</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        name="payment_reference"
                                                        value={data.payment_reference}
                                                        onChange={handleChange}
                                                        placeholder="Fiş no, fatura no, vb."
                                                        isInvalid={!!errors.payment_reference}
                                                    />
                                                    {errors.payment_reference && <Form.Control.Feedback type="invalid">{errors.payment_reference}</Form.Control.Feedback>}
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        
                                        {expense.status !== 'pending' && (
                                            <Row className="mb-3">
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label>Durum <span className="text-danger">*</span></Form.Label>
                                                        <Form.Select
                                                            name="status"
                                                            value={data.status}
                                                            onChange={handleChange}
                                                            required
                                                            isInvalid={!!errors.status}
                                                        >
                                                            <option value="pending">Beklemede</option>
                                                            <option value="approved">Onaylandı</option>
                                                            <option value="rejected">Reddedildi</option>
                                                            <option value="paid">Ödendi</option>
                                                        </Form.Select>
                                                        {errors.status && <Form.Control.Feedback type="invalid">{errors.status}</Form.Control.Feedback>}
                                                    </Form.Group>
                                                </Col>
                                            </Row>
                                        )}
                                        
                                        <div className="d-flex justify-content-end gap-2 mt-4">
                                            <Link href={route('expenses.show', expense.id)} className="btn btn-light">
                                                İptal
                                            </Link>
                                            <Button type="submit" variant="primary" disabled={processing}>
                                                <i className="ri-save-line align-bottom me-1"></i> Kaydet
                                            </Button>
                                        </div>
                                    </Form>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    );
};

ExpenseEdit.layout = (page: any) => <Layout children={page} />;
export default ExpenseEdit;
