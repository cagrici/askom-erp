import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Card, Row, Col, Table, Button, Form, InputGroup, Badge, Dropdown, Alert } from 'react-bootstrap';
import Layout from '../../../Layouts';

interface Payment {
    id: number;
    payment_number: string;
    current_account_id: number;
    bank_account_id: number;
    payment_method_id: number;
    amount: number;
    currency: string;
    net_amount: number;
    payment_date: string;
    due_date?: string;
    reference_number?: string;
    status: string;
    approval_status: string;
    is_reconciled: boolean;
    is_overdue: boolean;
    days_overdue: number;
    status_text: string;
    approval_status_text: string;
    status_badge_color: string;
    formatted_amount: string;
    formatted_net_amount: string;
    can_edit: boolean;
    can_delete: boolean;
    can_approve: boolean;
    can_pay: boolean;
    can_reconcile: boolean;
    current_account: {
        id: number;
        title: string;
        account_code: string;
    };
    bank_account: {
        id: number;
        account_name: string;
        bank_name: string;
    };
    payment_method: {
        id: number;
        name: string;
    };
    created_by?: {
        id: number;
        name: string;
    };
}

interface PaymentStats {
    total_payments: number;
    draft_payments: number;
    pending_payments: number;
    approved_payments: number;
    paid_payments: number;
    overdue_payments: number;
    total_amount_try: number;
    total_amount_usd: number;
    total_amount_eur: number;
    pending_amount_try: number;
    pending_amount_usd: number;
    pending_amount_eur: number;
}

interface PageProps {
    payments: {
        data?: Payment[];
        links?: any[];
        meta?: any;
    };
    stats: PaymentStats;
    charts?: {
        currencyDistribution: Record<string, any>;
        statusDistribution: Record<string, number>;
        monthlyData: any[];
    };
    filters: {
        search?: string;
        status?: string;
        approval_status?: string;
        currency?: string;
        bank_account_id?: string;
        current_account_id?: string;
        payment_method_id?: string;
        date_from?: string;
        date_to?: string;
        is_reconciled?: string;
        is_overdue?: string;
        sort_field?: string;
        sort_direction?: string;
    };
    filterOptions: {
        bankAccounts: Array<{id: number, account_name: string, bank_name: string}>;
        paymentMethods: Array<{id: number, name: string}>;
    };
}

export default function Index() {
    const { payments, stats, charts, filters, filterOptions } = usePage<PageProps>().props;

    // Provide default values to prevent errors
    const paymentsData = payments?.data || [];
    const paymentsLinks = payments?.links || [];
    const paymentsMeta = payments?.meta || { total: 0 };

    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedFilters, setSelectedFilters] = useState({
        status: filters.status || '',
        approval_status: filters.approval_status || '',
        currency: filters.currency || '',
        bank_account_id: filters.bank_account_id || '',
        current_account_id: filters.current_account_id || '',
        payment_method_id: filters.payment_method_id || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
        is_reconciled: filters.is_reconciled || '',
        is_overdue: filters.is_overdue || '',
    });

    const handleSearch = () => {
        router.get(route('accounting.payments.index'), {
            ...selectedFilters,
            search: searchTerm,
        });
    };

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...selectedFilters, [key]: value };
        setSelectedFilters(newFilters);
        router.get(route('accounting.payments.index'), {
            ...newFilters,
            search: searchTerm,
        });
    };

    const handleSort = (field: string) => {
        const direction = filters.sort_field === field && filters.sort_direction === 'asc' ? 'desc' : 'asc';
        router.get(route('accounting.payments.index'), {
            ...selectedFilters,
            search: searchTerm,
            sort_field: field,
            sort_direction: direction,
        });
    };

    const handleApprove = (paymentId: number) => {
        if (confirm('Bu ödemeyi onaylamak istediğinizden emin misiniz?')) {
            router.patch(route('accounting.payments.approve', paymentId));
        }
    };

    const handleMarkAsPaid = (paymentId: number) => {
        if (confirm('Bu ödemeyi ödenmiş olarak işaretlemek istediğinizden emin misiniz?')) {
            router.patch(route('accounting.payments.mark-paid', paymentId));
        }
    };

    const handleReconcile = (paymentId: number) => {
        if (confirm('Bu ödeme için mutabakat yapmak istediğinizden emin misiniz?')) {
            router.patch(route('accounting.payments.reconcile', paymentId));
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR');
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount) + ' ' + currency;
    };

    const getCurrencyFlag = (currency: string) => {
        switch (currency) {
            case 'TRY': return '🇹🇷';
            case 'USD': return '🇺🇸';
            case 'EUR': return '🇪🇺';
            case 'GBP': return '🇬🇧';
            default: return '💰';
        }
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedFilters({
            status: '',
            approval_status: '',
            currency: '',
            bank_account_id: '',
            current_account_id: '',
            payment_method_id: '',
            date_from: '',
            date_to: '',
            is_reconciled: '',
            is_overdue: '',
        });
        router.get(route('accounting.payments.index'));
    };

    return (
        <Layout title="Ödemeler">
            <Head title="Ödemeler" />
            <div className="page-content">
                <div className="container-fluid">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h1 className="h3 mb-0">Ödemeler</h1>
                        <div>
                            <Link
                                href={route('accounting.payments.create')}
                                className="btn btn-primary me-2"
                            >
                                <i className="fas fa-plus"></i> Yeni Ödeme
                            </Link>
                            <Link
                                href={route('accounting.payments.analytics')}
                                className="btn btn-info me-2"
                            >
                                <i className="fas fa-chart-line"></i> Analitik
                            </Link>
                            <Link
                                href={route('accounting.payments.export')}
                                className="btn btn-success"
                            >
                                <i className="fas fa-download"></i> Dışa Aktar
                            </Link>
                        </div>
                    </div>

                    {/* Statistics Cards */}
                    <Row className="mb-4">
                        <Col lg={2} md={4} sm={6}>
                            <Card className="text-center">
                                <Card.Body>
                                    <h5 className="text-primary">{stats.total_payments}</h5>
                                    <small className="text-muted">Toplam Ödeme</small>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={2} md={4} sm={6}>
                            <Card className="text-center">
                                <Card.Body>
                                    <h5 className="text-warning">{stats.pending_payments}</h5>
                                    <small className="text-muted">Bekleyen</small>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={2} md={4} sm={6}>
                            <Card className="text-center">
                                <Card.Body>
                                    <h5 className="text-info">{stats.approved_payments}</h5>
                                    <small className="text-muted">Onaylanan</small>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={2} md={4} sm={6}>
                            <Card className="text-center">
                                <Card.Body>
                                    <h5 className="text-success">{stats.paid_payments}</h5>
                                    <small className="text-muted">Ödenen</small>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={2} md={4} sm={6}>
                            <Card className="text-center">
                                <Card.Body>
                                    <h5 className="text-danger">{stats.overdue_payments}</h5>
                                    <small className="text-muted">Vadesi Geçen</small>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={2} md={4} sm={6}>
                            <Card className="text-center">
                                <Card.Body>
                                    <h5 className="text-secondary">{stats.draft_payments}</h5>
                                    <small className="text-muted">Taslak</small>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Amount Statistics */}
                    <Row className="mb-4">
                        <Col md={4}>
                            <Card>
                                <Card.Header>
                                    <h6 className="mb-0">🇹🇷 TRY Ödemeleri</h6>
                                </Card.Header>
                                <Card.Body>
                                    <div>
                                        <strong>Toplam:</strong> {formatCurrency(stats.total_amount_try, 'TRY')}
                                    </div>
                                    <div>
                                        <strong>Bekleyen:</strong> {formatCurrency(stats.pending_amount_try, 'TRY')}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card>
                                <Card.Header>
                                    <h6 className="mb-0">🇺🇸 USD Ödemeleri</h6>
                                </Card.Header>
                                <Card.Body>
                                    <div>
                                        <strong>Toplam:</strong> {formatCurrency(stats.total_amount_usd, 'USD')}
                                    </div>
                                    <div>
                                        <strong>Bekleyen:</strong> {formatCurrency(stats.pending_amount_usd, 'USD')}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card>
                                <Card.Header>
                                    <h6 className="mb-0">🇪🇺 EUR Ödemeleri</h6>
                                </Card.Header>
                                <Card.Body>
                                    <div>
                                        <strong>Toplam:</strong> {formatCurrency(stats.total_amount_eur, 'EUR')}
                                    </div>
                                    <div>
                                        <strong>Bekleyen:</strong> {formatCurrency(stats.pending_amount_eur, 'EUR')}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Filters */}
                    <Card className="mb-4">
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <h6 className="mb-0">Filtreler</h6>
                            <Button variant="outline-secondary" size="sm" onClick={clearFilters}>
                                <i className="fas fa-times"></i> Temizle
                            </Button>
                        </Card.Header>
                        <Card.Body>
                            <Row className="mb-3">
                                <Col md={3}>
                                    <InputGroup>
                                        <Form.Control
                                            type="text"
                                            placeholder="Arama..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                        />
                                        <Button variant="outline-secondary" onClick={handleSearch}>
                                            <i className="ri ri-search-line"></i>
                                        </Button>
                                    </InputGroup>
                                </Col>
                                <Col md={2}>
                                    <Form.Select
                                        value={selectedFilters.status}
                                        onChange={(e) => handleFilterChange('status', e.target.value)}
                                    >
                                        <option value="">Tüm Durumlar</option>
                                        <option value="draft">Taslak</option>
                                        <option value="pending">Beklemede</option>
                                        <option value="approved">Onaylandı</option>
                                        <option value="paid">Ödendi</option>
                                        <option value="cancelled">İptal Edildi</option>
                                        <option value="bounced">İade Edildi</option>
                                    </Form.Select>
                                </Col>
                                <Col md={2}>
                                    <Form.Select
                                        value={selectedFilters.approval_status}
                                        onChange={(e) => handleFilterChange('approval_status', e.target.value)}
                                    >
                                        <option value="">Tüm Onay Durumları</option>
                                        <option value="pending">Onay Bekliyor</option>
                                        <option value="approved">Onaylandı</option>
                                        <option value="rejected">Reddedildi</option>
                                    </Form.Select>
                                </Col>
                                <Col md={2}>
                                    <Form.Select
                                        value={selectedFilters.currency}
                                        onChange={(e) => handleFilterChange('currency', e.target.value)}
                                    >
                                        <option value="">Tüm Para Birimleri</option>
                                        <option value="TRY">🇹🇷 TRY</option>
                                        <option value="USD">🇺🇸 USD</option>
                                        <option value="EUR">🇪🇺 EUR</option>
                                        <option value="GBP">🇬🇧 GBP</option>
                                    </Form.Select>
                                </Col>
                                <Col md={2}>
                                    <Form.Select
                                        value={selectedFilters.is_overdue}
                                        onChange={(e) => handleFilterChange('is_overdue', e.target.value)}
                                    >
                                        <option value="">Tüm Vadeler</option>
                                        <option value="1">Vadesi Geçen</option>
                                        <option value="0">Vadesi Geçmeyen</option>
                                    </Form.Select>
                                </Col>
                                <Col md={1}>
                                    <Form.Select
                                        value={selectedFilters.is_reconciled}
                                        onChange={(e) => handleFilterChange('is_reconciled', e.target.value)}
                                    >
                                        <option value="">Mutabakat</option>
                                        <option value="1">Yapıldı</option>
                                        <option value="0">Yapılmadı</option>
                                    </Form.Select>
                                </Col>
                            </Row>
                            <Row>
                                <Col md={3}>
                                    <Form.Select
                                        value={selectedFilters.bank_account_id}
                                        onChange={(e) => handleFilterChange('bank_account_id', e.target.value)}
                                    >
                                        <option value="">Tüm Banka Hesapları</option>
                                        {filterOptions.bankAccounts.map(account => (
                                            <option key={account.id} value={account.id}>
                                                {account.account_name} - {account.bank_name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Col>
                                <Col md={2}>
                                    <Form.Select
                                        value={selectedFilters.payment_method_id}
                                        onChange={(e) => handleFilterChange('payment_method_id', e.target.value)}
                                    >
                                        <option value="">Tüm Ödeme Yöntemleri</option>
                                        {filterOptions.paymentMethods.map(method => (
                                            <option key={method.id} value={method.id}>
                                                {method.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Col>
                                <Col md={2}>
                                    <Form.Control
                                        type="date"
                                        placeholder="Başlangıç Tarihi"
                                        value={selectedFilters.date_from}
                                        onChange={(e) => handleFilterChange('date_from', e.target.value)}
                                    />
                                </Col>
                                <Col md={2}>
                                    <Form.Control
                                        type="date"
                                        placeholder="Bitiş Tarihi"
                                        value={selectedFilters.date_to}
                                        onChange={(e) => handleFilterChange('date_to', e.target.value)}
                                    />
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* Payments Table */}
                    <Card>
                        <Card.Header>
                            <h6 className="mb-0">Ödemeler ({paymentsMeta.total} kayıt)</h6>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <Table responsive hover className="mb-0">
                                <thead>
                                    <tr>
                                        <th
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => handleSort('payment_number')}
                                        >
                                            Ödeme No
                                            {filters.sort_field === 'payment_number' && (
                                                <i className={`fas fa-sort-${filters.sort_direction === 'asc' ? 'up' : 'down'} ms-1`}></i>
                                            )}
                                        </th>
                                        <th
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => handleSort('current_account')}
                                        >
                                            Cari Hesap
                                            {filters.sort_field === 'current_account' && (
                                                <i className={`fas fa-sort-${filters.sort_direction === 'asc' ? 'up' : 'down'} ms-1`}></i>
                                            )}
                                        </th>
                                        <th
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => handleSort('amount')}
                                        >
                                            Tutar
                                            {filters.sort_field === 'amount' && (
                                                <i className={`fas fa-sort-${filters.sort_direction === 'asc' ? 'up' : 'down'} ms-1`}></i>
                                            )}
                                        </th>
                                        <th
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => handleSort('payment_date')}
                                        >
                                            Ödeme Tarihi
                                            {filters.sort_field === 'payment_date' && (
                                                <i className={`fas fa-sort-${filters.sort_direction === 'asc' ? 'up' : 'down'} ms-1`}></i>
                                            )}
                                        </th>
                                        <th>Durum</th>
                                        <th>Onay Durumu</th>
                                        <th>Ödeme Yöntemi</th>
                                        <th>İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paymentsData.map((payment) => (
                                        <tr key={payment.id}>
                                            <td>
                                                <Link
                                                    href={route('accounting.payments.show', payment.id)}
                                                    className="text-decoration-none fw-bold"
                                                >
                                                    {payment.payment_number}
                                                </Link>
                                                {payment.reference_number && (
                                                    <div>
                                                        <small className="text-muted">Ref: {payment.reference_number}</small>
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <div className="fw-bold">{payment.current_account.title}</div>
                                                <small className="text-muted">{payment.current_account.account_code}</small>
                                            </td>
                                            <td>
                                                <div className="fw-bold">{payment.formatted_amount}</div>
                                                {payment.net_amount !== payment.amount && (
                                                    <small className="text-muted">Net: {payment.formatted_net_amount}</small>
                                                )}
                                            </td>
                                            <td>
                                                <div>{formatDate(payment.payment_date)}</div>
                                                {payment.due_date && (
                                                    <small className={`${payment.is_overdue ? 'text-danger' : 'text-muted'}`}>
                                                        Vade: {formatDate(payment.due_date)}
                                                        {payment.is_overdue && ` (${payment.days_overdue} gün)`}
                                                    </small>
                                                )}
                                            </td>
                                            <td>
                                                <Badge bg={payment.status_badge_color}>
                                                    {payment.status_text}
                                                </Badge>
                                                {payment.is_reconciled && (
                                                    <div className="mt-1">
                                                        <Badge bg="success" size="sm">
                                                            <i className="fas fa-check"></i> Mutabakat
                                                        </Badge>
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <Badge bg={
                                                    payment.approval_status === 'approved' ? 'success' :
                                                    payment.approval_status === 'rejected' ? 'danger' : 'warning'
                                                }>
                                                    {payment.approval_status_text}
                                                </Badge>
                                            </td>
                                            <td>
                                                <div>{payment.payment_method.name}</div>
                                                <small className="text-muted">{payment.bank_account.account_name}</small>
                                            </td>
                                            <td>
                                                <Dropdown>
                                                    <Dropdown.Toggle
                                                        variant="link"
                                                        size="sm"
                                                        className="text-decoration-none"
                                                    >
                                                        <i className="fas fa-ellipsis-v"></i>
                                                    </Dropdown.Toggle>
                                                    <Dropdown.Menu>
                                                        <Dropdown.Item
                                                            as={Link}
                                                            href={route('accounting.payments.show', payment.id)}
                                                        >
                                                            <i className="fas fa-eye me-2"></i>
                                                            Görüntüle
                                                        </Dropdown.Item>
                                                        {payment.can_edit && (
                                                            <Dropdown.Item
                                                                as={Link}
                                                                href={route('accounting.payments.edit', payment.id)}
                                                            >
                                                                <i className="fas fa-edit me-2"></i>
                                                                Düzenle
                                                            </Dropdown.Item>
                                                        )}
                                                        <Dropdown.Divider />
                                                        {payment.can_approve && (
                                                            <Dropdown.Item
                                                                onClick={() => handleApprove(payment.id)}
                                                            >
                                                                <i className="fas fa-check me-2"></i>
                                                                Onayla
                                                            </Dropdown.Item>
                                                        )}
                                                        {payment.can_pay && (
                                                            <Dropdown.Item
                                                                onClick={() => handleMarkAsPaid(payment.id)}
                                                            >
                                                                <i className="fas fa-money-bill-wave me-2"></i>
                                                                Ödenmiş İşaretle
                                                            </Dropdown.Item>
                                                        )}
                                                        {payment.can_reconcile && (
                                                            <Dropdown.Item
                                                                onClick={() => handleReconcile(payment.id)}
                                                            >
                                                                <i className="fas fa-handshake me-2"></i>
                                                                Mutabakat Yap
                                                            </Dropdown.Item>
                                                        )}
                                                        {payment.can_delete && (
                                                            <>
                                                                <Dropdown.Divider />
                                                                <Dropdown.Item
                                                                    as={Link}
                                                                    href={route('accounting.payments.destroy', payment.id)}
                                                                    method="delete"
                                                                    className="text-danger"
                                                                    onBefore={() => confirm('Bu ödemeyi silmek istediğinizden emin misiniz?')}
                                                                >
                                                                    <i className="fas fa-trash me-2"></i>
                                                                    Sil
                                                                </Dropdown.Item>
                                                            </>
                                                        )}
                                                    </Dropdown.Menu>
                                                </Dropdown>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>

                            {paymentsData.length === 0 && (
                                <div className="text-center py-4">
                                    <i className="fas fa-money-bill-wave fa-2x text-muted mb-2"></i>
                                    <p className="text-muted">Ödeme bulunamadı</p>
                                    <Link
                                        href={route('accounting.payments.create')}
                                        className="btn btn-primary"
                                    >
                                        <i className="fas fa-plus"></i> İlk Ödemeyi Ekle
                                    </Link>
                                </div>
                            )}
                        </Card.Body>

                        {paymentsLinks && paymentsLinks.length > 3 && (
                            <Card.Footer>
                                <nav>
                                    <ul className="pagination justify-content-center mb-0">
                                        {paymentsLinks.map((link, index) => (
                                            <li
                                                key={index}
                                                className={`page-item ${link.active ? 'active' : ''} ${!link.url ? 'disabled' : ''}`}
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
                            </Card.Footer>
                        )}
                    </Card>
                </div>
            </div>
        </Layout>
    );
}
