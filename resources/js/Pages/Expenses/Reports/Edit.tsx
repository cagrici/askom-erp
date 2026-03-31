import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Badge } from 'react-bootstrap';
import BreadCrumb from '../../../Components/Common/BreadCrumb';
import { Head, Link, useForm } from '@inertiajs/react';
import Layout from '../../../Layouts';

// Define types for our props
interface Category {
    id: number;
    name: string;
}

interface ExpenseItem {
    id: number;
    title: string;
    description: string | null;
    amount: number;
    currency: string;
    expense_date: string;
    category: Category;
    selected?: boolean;
}

interface ExpenseReport {
    id: number;
    title: string;
    description: string | null;
    start_date: string;
    end_date: string;
    notes: string | null;
}

interface EditProps {
    report: ExpenseReport;
    expenses: ExpenseItem[];
    selectedExpenseIds: number[];
}

const ExpenseReportEdit = (props: EditProps) => {
    const { report, expenses, selectedExpenseIds } = props;
    
    const [selectedExpenses, setSelectedExpenses] = useState<number[]>(selectedExpenseIds);
    const [totalAmount, setTotalAmount] = useState<number>(0);
    
    const { data, setData, post, processing, errors } = useForm({
        title: report.title,
        description: report.description || '',
        start_date: report.start_date.substring(0, 10), // Format YYYY-MM-DD for the date input
        end_date: report.end_date.substring(0, 10), // Format YYYY-MM-DD for the date input
        expense_ids: selectedExpenseIds,
        notes: report.notes || '',
        _method: 'PUT',
    });
    
    // Calculate total amount when selectedExpenses changes
    useEffect(() => {
        const selectedItems = expenses.filter(exp => selectedExpenses.includes(exp.id));
        const total = selectedItems.reduce((sum, expense) => sum + expense.amount, 0);
        setTotalAmount(total);
    }, [selectedExpenses, expenses]);
    
    // Handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setData(name, value);
    };
    
    // Handle expense selection
    const handleExpenseSelection = (id: number) => {
        let newSelected: number[];
        
        if (selectedExpenses.includes(id)) {
            // Remove from selection
            newSelected = selectedExpenses.filter(expenseId => expenseId !== id);
        } else {
            // Add to selection
            newSelected = [...selectedExpenses, id];
        }
        
        setSelectedExpenses(newSelected);
        setData('expense_ids', newSelected);
    };
    
    // Handle auto date selection based on selected expenses
    const handleAutoDateSelection = () => {
        if (selectedExpenses.length === 0) {
            alert('Lütfen önce harcama seçin');
            return;
        }
        
        const selectedExpenseItems = expenses.filter(exp => selectedExpenses.includes(exp.id));
        
        // Find min and max dates
        const dates = selectedExpenseItems.map(exp => new Date(exp.expense_date));
        const minDate = new Date(Math.min(...dates.map(date => date.getTime())));
        const maxDate = new Date(Math.max(...dates.map(date => date.getTime())));
        
        // Format dates as YYYY-MM-DD
        const formatDate = (date: Date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        
        setData({
            ...data,
            start_date: formatDate(minDate),
            end_date: formatDate(maxDate),
        });
    };
    
    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        post(route('expense-reports.update', report.id));
    };
    
    // Format currency
    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(amount);
    };
    
    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR');
    };
    
    return (
        <React.Fragment>
            <Head title="Harcama Raporu Düzenle | Portal" />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Harcama Raporu Düzenle" pageTitle="Harcama Yönetimi" />
                    
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <Card.Header>
                                    <h4 className="card-title mb-0 flex-grow-1">Rapor Bilgileri</h4>
                                </Card.Header>
                                <Card.Body>
                                    <Form onSubmit={handleSubmit}>
                                        <Row className="mb-3">
                                            <Col md={12}>
                                                <Form.Group>
                                                    <Form.Label>Rapor Başlığı <span className="text-danger">*</span></Form.Label>
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
                                            <Col md={5}>
                                                <Form.Group>
                                                    <Form.Label>Başlangıç Tarihi <span className="text-danger">*</span></Form.Label>
                                                    <Form.Control
                                                        type="date"
                                                        name="start_date"
                                                        value={data.start_date}
                                                        onChange={handleChange}
                                                        required
                                                        isInvalid={!!errors.start_date}
                                                    />
                                                    {errors.start_date && <Form.Control.Feedback type="invalid">{errors.start_date}</Form.Control.Feedback>}
                                                </Form.Group>
                                            </Col>
                                            <Col md={5}>
                                                <Form.Group>
                                                    <Form.Label>Bitiş Tarihi <span className="text-danger">*</span></Form.Label>
                                                    <Form.Control
                                                        type="date"
                                                        name="end_date"
                                                        value={data.end_date}
                                                        onChange={handleChange}
                                                        required
                                                        isInvalid={!!errors.end_date}
                                                    />
                                                    {errors.end_date && <Form.Control.Feedback type="invalid">{errors.end_date}</Form.Control.Feedback>}
                                                </Form.Group>
                                            </Col>
                                            <Col md={2} className="d-flex align-items-end">
                                                <Button 
                                                    variant="outline-primary" 
                                                    className="w-100"
                                                    onClick={handleAutoDateSelection}
                                                >
                                                    <i className="ri-calendar-check-line me-1"></i> Otomatik Doldur
                                                </Button>
                                            </Col>
                                        </Row>
                                        
                                        <Row className="mb-3">
                                            <Col md={12}>
                                                <Form.Group>
                                                    <Form.Label>Notlar</Form.Label>
                                                    <Form.Control
                                                        as="textarea"
                                                        rows={2}
                                                        name="notes"
                                                        value={data.notes}
                                                        onChange={handleChange}
                                                        placeholder="Ek notlar..."
                                                        isInvalid={!!errors.notes}
                                                    />
                                                    {errors.notes && <Form.Control.Feedback type="invalid">{errors.notes}</Form.Control.Feedback>}
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        
                                        <hr className="my-4" />
                                        
                                        <h5 className="mb-3">Rapora Eklenecek Harcamalar</h5>
                                        
                                        {errors.expense_ids && (
                                            <div className="alert alert-danger">
                                                {errors.expense_ids}
                                            </div>
                                        )}
                                        
                                        <div className="table-responsive mb-4">
                                            <Table className="table-bordered table-hover">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th style={{ width: "40px" }}>#</th>
                                                        <th>Başlık</th>
                                                        <th>Kategori</th>
                                                        <th>Tarih</th>
                                                        <th>Tutar</th>
                                                        <th style={{ width: "40px" }}>Seç</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {expenses.length > 0 ? (
                                                        expenses.map((expense) => (
                                                            <tr 
                                                                key={expense.id} 
                                                                className={selectedExpenses.includes(expense.id) ? 'table-primary' : ''}
                                                                onClick={() => handleExpenseSelection(expense.id)}
                                                                style={{ cursor: 'pointer' }}
                                                            >
                                                                <td>{expense.id}</td>
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
                                                                <td className="text-center">
                                                                    <Form.Check 
                                                                        type="checkbox" 
                                                                        checked={selectedExpenses.includes(expense.id)}
                                                                        onChange={() => {}}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    />
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={6} className="text-center">
                                                                Rapora eklenebilecek harcama bulunamadı
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                                <tfoot className="table-light">
                                                    <tr>
                                                        <td colSpan={4} className="text-end fw-bold">
                                                            Toplam:
                                                        </td>
                                                        <td className="text-end fw-bold">
                                                            {formatCurrency(totalAmount, expenses[0]?.currency || 'TRY')}
                                                        </td>
                                                        <td className="text-center">
                                                            <Badge bg="info">
                                                                {selectedExpenses.length}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </Table>
                                        </div>
                                        
                                        <div className="d-flex justify-content-end gap-2 mt-4">
                                            <Link href={route('expense-reports.show', report.id)} className="btn btn-light">
                                                İptal
                                            </Link>
                                            <Button type="submit" variant="primary" disabled={processing || selectedExpenses.length === 0}>
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

ExpenseReportEdit.layout = (page: any) => <Layout children={page} />;
export default ExpenseReportEdit;
