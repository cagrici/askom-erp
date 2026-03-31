import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { Card, Table, Button, Row, Col, Form, InputGroup, Badge, Dropdown, Modal } from 'react-bootstrap';
import Layout from '@/Layouts';
import { FiSearch, FiFilter, FiDownload, FiEye, FiPrinter, FiCheck, FiX, FiRefreshCw } from 'react-icons/fi';

interface CurrentAccount {
    id: number;
    title: string;
    account_code: string;
}

interface SalesOrder {
    id: number;
    order_number: string;
}

interface InvoiceItem {
    id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
}

interface Invoice {
    id: number;
    logo_logicalref?: string;
    invoice_type: string;
    invoice_series: string;
    invoice_number: number;
    formatted_number: string;
    invoice_date: string;
    customer_name: string;
    customer_code?: string;
    tax_office?: string;
    tax_number?: string;
    net_total: number;
    discount_total: number;
    vat_total: number;
    gross_total: number;
    currency_code: string;
    status: string;
    status_label: string;
    status_badge: string;
    waybill_number?: string;
    current_account?: CurrentAccount;
    sales_order?: SalesOrder;
    items_count?: number;
    logo_synced_at?: string;
}

interface PaginatedInvoices {
    data: Invoice[];
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    links: Array<{
        url?: string;
        label: string;
        active: boolean;
    }>;
}

interface Props {
    invoices: PaginatedInvoices;
    filters: {
        search?: string;
        status?: string;
        current_account_id?: number;
        invoice_type?: string;
        date_from?: string;
        date_to?: string;
        currency_code?: string;
        sort?: string;
        direction?: string;
    };
    customers: CurrentAccount[];
    invoiceTypes: Record<string, string>;
    statuses: Record<string, string>;
    currencies: string[];
    stats: {
        total_invoices: number;
        this_month_count: number;
        this_month_total: number;
        pending_count: number;
        paid_count: number;
        unpaid_total: number;
    };
}

export default function Index({
    invoices,
    filters,
    customers,
    invoiceTypes,
    statuses,
    currencies,
    stats
}: Props) {
    const [showFilters, setShowFilters] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    const { data, setData, get, processing } = useForm({
        search: filters.search || '',
        status: filters.status || '',
        current_account_id: filters.current_account_id || '',
        invoice_type: filters.invoice_type || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
        currency_code: filters.currency_code || '',
        sort: filters.sort || 'invoice_date',
        direction: filters.direction || 'desc',
    });

    const handleFilter = (e?: React.FormEvent) => {
        e?.preventDefault();
        get(route('sales.invoices.index'), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSort = (field: string) => {
        setData((prev) => ({
            ...prev,
            sort: field,
            direction: prev.sort === field && prev.direction === 'asc' ? 'desc' : 'asc',
        }));

        setTimeout(() => handleFilter(), 0);
    };

    const handleClearFilters = () => {
        setData({
            search: '',
            status: '',
            current_account_id: '',
            invoice_type: '',
            date_from: '',
            date_to: '',
            currency_code: '',
            sort: 'invoice_date',
            direction: 'desc',
        });

        router.get(route('sales.invoices.index'));
    };

    const formatCurrency = (amount: number, currency: string = 'TRY') => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR');
    };

    const SortIcon = ({ field }: { field: string }) => {
        if (data.sort !== field) return null;
        return data.direction === 'asc' ? '↑' : '↓';
    };

    return (
        <Layout>
            <Head title="Faturalar" />

            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Header */}
                    <Row className="mb-4">
                    <Col>
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h2 className="mb-1">Faturalar</h2>
                                <p className="text-muted">Logo'dan senkronize edilen faturalar</p>
                            </div>
                            <div className="d-flex gap-2">
                                <Button
                                    variant="outline-primary"
                                    onClick={() => router.reload()}
                                >
                                    <FiRefreshCw className="me-2" />
                                    Yenile
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={() => router.get(route('sales.invoices.export'))}
                                >
                                    <FiDownload className="me-2" />
                                    Dışa Aktar
                                </Button>
                            </div>
                        </div>
                    </Col>
                </Row>

                {/* Statistics Cards */}
                <Row className="mb-4">
                    <Col md={3}>
                        <Card>
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <p className="text-muted mb-1">Toplam Fatura</p>
                                        <h3 className="mb-0">{stats.total_invoices}</h3>
                                    </div>
                                    <div className="text-primary fs-1">📄</div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card>
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <p className="text-muted mb-1">Bu Ay</p>
                                        <h3 className="mb-0">{stats.this_month_count}</h3>
                                        <small className="text-muted">
                                            {formatCurrency(stats.this_month_total)}
                                        </small>
                                    </div>
                                    <div className="text-info fs-1">📅</div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card>
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <p className="text-muted mb-1">Ödenmemiş</p>
                                        <h3 className="mb-0">{stats.pending_count}</h3>
                                        <small className="text-muted">
                                            {formatCurrency(stats.unpaid_total)}
                                        </small>
                                    </div>
                                    <div className="text-warning fs-1">⏳</div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card>
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <p className="text-muted mb-1">Ödendi</p>
                                        <h3 className="mb-0">{stats.paid_count}</h3>
                                    </div>
                                    <div className="text-success fs-1">✅</div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Filters */}
                <Card className="mb-4">
                    <Card.Body>
                        <Form onSubmit={handleFilter}>
                            <Row className="g-3">
                                <Col md={4}>
                                    <InputGroup>
                                        <InputGroup.Text>
                                            <FiSearch />
                                        </InputGroup.Text>
                                        <Form.Control
                                            type="text"
                                            placeholder="Fatura no, müşteri adı, kod..."
                                            value={data.search}
                                            onChange={(e) => setData('search', e.target.value)}
                                        />
                                    </InputGroup>
                                </Col>
                                <Col md={2}>
                                    <Form.Select
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value)}
                                    >
                                        <option value="">Tüm Durumlar</option>
                                        {Object.entries(statuses).map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </Form.Select>
                                </Col>
                                <Col md={2}>
                                    <Form.Select
                                        value={data.invoice_type}
                                        onChange={(e) => setData('invoice_type', e.target.value)}
                                    >
                                        <option value="">Tüm Türler</option>
                                        {Object.entries(invoiceTypes).map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </Form.Select>
                                </Col>
                                <Col md={2}>
                                    <Button
                                        variant="outline-secondary"
                                        className="w-100"
                                        onClick={() => setShowFilters(!showFilters)}
                                    >
                                        <FiFilter className="me-2" />
                                        {showFilters ? 'Filtreler Gizle' : 'Daha Fazla Filtre'}
                                    </Button>
                                </Col>
                                <Col md={2}>
                                    <div className="d-flex gap-2">
                                        <Button
                                            variant="primary"
                                            type="submit"
                                            disabled={processing}
                                            className="flex-grow-1"
                                        >
                                            Filtrele
                                        </Button>
                                        <Button
                                            variant="outline-secondary"
                                            onClick={handleClearFilters}
                                        >
                                            Temizle
                                        </Button>
                                    </div>
                                </Col>
                            </Row>

                            {showFilters && (
                                <Row className="g-3 mt-2">
                                    <Col md={3}>
                                        <Form.Label>Müşteri</Form.Label>
                                        <Form.Select
                                            value={data.current_account_id}
                                            onChange={(e) => setData('current_account_id', e.target.value)}
                                        >
                                            <option value="">Tüm Müşteriler</option>
                                            {customers.map((customer) => (
                                                <option key={customer.id} value={customer.id}>
                                                    {customer.account_code} - {customer.title}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Col>
                                    <Col md={2}>
                                        <Form.Label>Para Birimi</Form.Label>
                                        <Form.Select
                                            value={data.currency_code}
                                            onChange={(e) => setData('currency_code', e.target.value)}
                                        >
                                            <option value="">Tümü</option>
                                            {currencies.map((currency) => (
                                                <option key={currency} value={currency}>{currency}</option>
                                            ))}
                                        </Form.Select>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Label>Başlangıç Tarihi</Form.Label>
                                        <Form.Control
                                            type="date"
                                            value={data.date_from}
                                            onChange={(e) => setData('date_from', e.target.value)}
                                        />
                                    </Col>
                                    <Col md={3}>
                                        <Form.Label>Bitiş Tarihi</Form.Label>
                                        <Form.Control
                                            type="date"
                                            value={data.date_to}
                                            onChange={(e) => setData('date_to', e.target.value)}
                                        />
                                    </Col>
                                </Row>
                            )}
                        </Form>
                    </Card.Body>
                </Card>

                {/* Invoices Table */}
                <Card>
                    <Card.Body>
                        <div className="table-responsive">
                            <Table hover>
                                <thead>
                                    <tr>
                                        <th onClick={() => handleSort('invoice_number')} style={{ cursor: 'pointer' }}>
                                            Fatura No <SortIcon field="invoice_number" />
                                        </th>
                                        <th onClick={() => handleSort('invoice_date')} style={{ cursor: 'pointer' }}>
                                            Tarih <SortIcon field="invoice_date" />
                                        </th>
                                        <th>Müşteri</th>
                                        <th>Tür</th>
                                        <th onClick={() => handleSort('gross_total')} style={{ cursor: 'pointer' }}>
                                            Tutar <SortIcon field="gross_total" />
                                        </th>
                                        <th>Durum</th>
                                        <th>İrsaliye No</th>
                                        <th className="text-end">İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.data.length > 0 ? (
                                        invoices.data.map((invoice) => (
                                            <tr key={invoice.id}>
                                                <td>
                                                    <strong>{invoice.formatted_number}</strong>
                                                    {invoice.logo_synced_at && (
                                                        <Badge bg="info" className="ms-2" title="Logo'dan senkronize edildi">
                                                            Logo
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td>{formatDate(invoice.invoice_date)}</td>
                                                <td>
                                                    <div>
                                                        <div>{invoice.customer_name}</div>
                                                        {invoice.customer_code && (
                                                            <small className="text-muted">{invoice.customer_code}</small>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <Badge bg="secondary">
                                                        {invoiceTypes[invoice.invoice_type] || invoice.invoice_type}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <strong>{formatCurrency(invoice.gross_total, invoice.currency_code)}</strong>
                                                    <div>
                                                        <small className="text-muted">
                                                            KDV: {formatCurrency(invoice.vat_total, invoice.currency_code)}
                                                        </small>
                                                    </div>
                                                </td>
                                                <td>
                                                    <Badge bg={invoice.status_badge}>
                                                        {invoice.status_label}
                                                    </Badge>
                                                </td>
                                                <td>{invoice.waybill_number || '-'}</td>
                                                <td className="text-end">
                                                    <Dropdown align="end">
                                                        <Dropdown.Toggle variant="light" size="sm">
                                                            İşlemler
                                                        </Dropdown.Toggle>
                                                        <Dropdown.Menu>
                                                            <Dropdown.Item
                                                                as={Link}
                                                                href={route('sales.invoices.show', invoice.id)}
                                                            >
                                                                <FiEye className="me-2" />
                                                                Detayları Gör
                                                            </Dropdown.Item>
                                                            <Dropdown.Item
                                                                href={route('sales.invoices.pdf', invoice.id)}
                                                                target="_blank"
                                                            >
                                                                <FiPrinter className="me-2" />
                                                                PDF İndir
                                                            </Dropdown.Item>
                                                            <Dropdown.Divider />
                                                            {invoice.status !== 'paid' && (
                                                                <Dropdown.Item
                                                                    onClick={() => {
                                                                        if (confirm('Fatura ödendi olarak işaretlensin mi?')) {
                                                                            router.patch(route('sales.invoices.mark-paid', invoice.id));
                                                                        }
                                                                    }}
                                                                >
                                                                    <FiCheck className="me-2" />
                                                                    Ödendi Olarak İşaretle
                                                                </Dropdown.Item>
                                                            )}
                                                            {invoice.status !== 'cancelled' && (
                                                                <Dropdown.Item
                                                                    className="text-danger"
                                                                    onClick={() => setSelectedInvoice(invoice)}
                                                                >
                                                                    <FiX className="me-2" />
                                                                    İptal Et
                                                                </Dropdown.Item>
                                                            )}
                                                        </Dropdown.Menu>
                                                    </Dropdown>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={8} className="text-center py-4">
                                                <div className="text-muted">
                                                    <p className="mb-0">Fatura bulunamadı.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {invoices.last_page > 1 && (
                            <div className="d-flex justify-content-between align-items-center mt-3">
                                <div className="text-muted">
                                    Toplam {invoices.total} kayıttan {invoices.data.length} tanesi gösteriliyor
                                </div>
                                <nav>
                                    <ul className="pagination mb-0">
                                        {invoices.links.map((link, index) => (
                                            <li
                                                key={index}
                                                className={`page-item ${link.active ? 'active' : ''} ${
                                                    !link.url ? 'disabled' : ''
                                                }`}
                                            >
                                                {link.url ? (
                                                    <Link
                                                        href={link.url}
                                                        className="page-link"
                                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                                    />
                                                ) : (
                                                    <span
                                                        className="page-link"
                                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                                    />
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </nav>
                            </div>
                        )}
                    </Card.Body>
                </Card>

                {/* Cancel Invoice Modal */}
                <Modal show={!!selectedInvoice} onHide={() => setSelectedInvoice(null)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Faturayı İptal Et</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group>
                            <Form.Label>İptal Nedeni</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                placeholder="İptal nedenini giriniz..."
                                required
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setSelectedInvoice(null)}>
                            Vazgeç
                        </Button>
                        <Button
                            variant="danger"
                            onClick={() => {
                                if (selectedInvoice) {
                                    router.patch(route('sales.invoices.cancel', selectedInvoice.id));
                                    setSelectedInvoice(null);
                                }
                            }}
                        >
                            İptal Et
                        </Button>
                    </Modal.Footer>
                </Modal>
                </div>
            </div>
        </Layout>
    );
}
