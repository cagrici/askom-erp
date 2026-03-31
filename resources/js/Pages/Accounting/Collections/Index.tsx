import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Card, Row, Col, Table, Button, Form, InputGroup, Badge, Dropdown } from 'react-bootstrap';
import Layout from '../../../Layouts';

interface Collection {
    id: number;
    collection_number: string;
    collection_date: string;
    amount: number;
    currency: string;
    net_amount: number;
    collection_type: string;
    status: string;
    due_date?: string;
    maturity_date?: string;
    reference_number?: string;
    document_number?: string;
    is_reconciled: boolean;
    approval_status: string;
    current_account?: {
        id: number;
        account_code: string;
        title: string;
    };
    payment_method?: {
        id: number;
        name: string;
        type: string;
    };
    creator?: {
        id: number;
        name: string;
    };
    collection_type_text: string;
    status_text: string;
    status_color: string;
    formatted_amount: string;
    formatted_net_amount: string;
    is_overdue: boolean;
    is_maturity_today: boolean;
    is_maturity_soon: boolean;
}

interface CollectionStats {
    total_collections: number;
    today_collections: number;
    pending_collections: number;
    collected_amount_today: number;
    pending_amount: number;
    overdue_collections: number;
    maturity_today: number;
    unreconciled_count: number;
}

interface PaymentMethod {
    id: number;
    name: string;
    code: string;
    type: string;
}

interface CurrentAccount {
    id: number;
    account_code: string;
    title: string;
}

interface PageProps {
    collections: {
        data?: Collection[];
        links?: any[];
        meta?: any;
    };
    stats: CollectionStats;
    recentCollections?: Collection[];
    charts?: {
        collectionsByStatus: Record<string, { count: number; total: number }>;
        collectionsOverTime: Record<string, { count: number; total: number }>;
    };
    paymentMethods: PaymentMethod[];
    currentAccounts: CurrentAccount[];
    filters: {
        search?: string;
        current_account_id?: string;
        payment_method_id?: string;
        status?: string;
        collection_type?: string;
        currency?: string;
        date_from?: string;
        date_to?: string;
        maturity_from?: string;
        maturity_to?: string;
        is_reconciled?: string;
        approval_status?: string;
        sort_field?: string;
        sort_direction?: string;
    };
}

export default function Index() {
    const { collections, stats, recentCollections, charts, paymentMethods, currentAccounts, filters } = usePage<PageProps>().props;

    // Provide default values to prevent errors
    const collectionsData = collections?.data || [];
    const collectionsLinks = collections?.links || [];
    const collectionsMeta = collections?.meta || { total: 0 };

    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedFilters, setSelectedFilters] = useState({
        current_account_id: filters.current_account_id || '',
        payment_method_id: filters.payment_method_id || '',
        status: filters.status || '',
        collection_type: filters.collection_type || '',
        currency: filters.currency || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
        maturity_from: filters.maturity_from || '',
        maturity_to: filters.maturity_to || '',
        is_reconciled: filters.is_reconciled || '',
        approval_status: filters.approval_status || '',
    });

    const handleSearch = () => {
        router.get(route('accounting.collections.index'), {
            ...selectedFilters,
            search: searchTerm,
        });
    };

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...selectedFilters, [key]: value };
        setSelectedFilters(newFilters);
        router.get(route('accounting.collections.index'), {
            ...newFilters,
            search: searchTerm,
        });
    };

    const handleSort = (field: string) => {
        const direction = filters.sort_field === field && filters.sort_direction === 'asc' ? 'desc' : 'asc';
        router.get(route('accounting.collections.index'), {
            ...selectedFilters,
            search: searchTerm,
            sort_field: field,
            sort_direction: direction,
        });
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

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'collected':
                return '✅';
            case 'pending':
                return '⏳';
            case 'bounced':
                return '❌';
            case 'cancelled':
                return '🚫';
            default:
                return '•';
        }
    };

    return (
        <Layout title="Tahsilatlar">
            <Head title="Tahsilatlar" />
            <div className="page-content">
                <div className="container-fluid">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h1 className="h3 mb-0">Tahsilatlar</h1>
                        <div>
                            <Link
                                href={route('accounting.collections.maturity-calendar')}
                                className="btn btn-outline-info me-2"
                            >
                                <i className="fas fa-calendar"></i> Vade Takvimi
                            </Link>
                            <Link
                                href={route('accounting.collections.create')}
                                className="btn btn-primary me-2"
                            >
                                <i className="fas fa-plus"></i> Yeni Tahsilat
                            </Link>
                            <Link
                                href={route('accounting.collections.export')}
                                className="btn btn-success"
                            >
                                <i className="fas fa-download"></i> Dışa Aktar
                            </Link>
                        </div>
                    </div>

                    {/* Statistics Cards */}
                    <Row className="mb-4">
                        <Col lg={3} md={6}>
                            <Card className="text-center">
                                <Card.Body>
                                    <h5 className="text-primary">{stats.total_collections}</h5>
                                    <small className="text-muted">Toplam Tahsilat</small>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={3} md={6}>
                            <Card className="text-center">
                                <Card.Body>
                                    <h5 className="text-success">{formatCurrency(stats.collected_amount_today)}</h5>
                                    <small className="text-muted">Bugünkü Tahsilat</small>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={3} md={6}>
                            <Card className="text-center">
                                <Card.Body>
                                    <h5 className="text-warning">{formatCurrency(stats.pending_amount)}</h5>
                                    <small className="text-muted">Bekleyen Tutar</small>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={3} md={6}>
                            <Card className="text-center">
                                <Card.Body>
                                    <h5 className="text-danger">{stats.overdue_collections}</h5>
                                    <small className="text-muted">Vadesi Geçen</small>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Additional Stats Row */}
                    <Row className="mb-4">
                        <Col lg={3} md={6}>
                            <Card className="text-center">
                                <Card.Body>
                                    <h5 className="text-info">{stats.maturity_today}</h5>
                                    <small className="text-muted">Bugün Vadesi Gelen</small>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={3} md={6}>
                            <Card className="text-center">
                                <Card.Body>
                                    <h5 className="text-secondary">{stats.unreconciled_count}</h5>
                                    <small className="text-muted">Mutabakat Bekleyen</small>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={3} md={6}>
                            <Card className="text-center">
                                <Card.Body>
                                    <h5 className="text-warning">{stats.pending_collections}</h5>
                                    <small className="text-muted">Bekleyen Tahsilat</small>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={3} md={6}>
                            <Card className="text-center">
                                <Card.Body>
                                    <h5 className="text-info">{stats.today_collections}</h5>
                                    <small className="text-muted">Bugünkü İşlem</small>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Filters */}
                    <Card className="mb-4">
                        <Card.Header>
                            <h6 className="mb-0">Filtreler</h6>
                        </Card.Header>
                        <Card.Body>
                            <Row>
                                <Col md={3}>
                                    <InputGroup className="mb-3">
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
                                        <option value="pending">Bekleyen</option>
                                        <option value="partial">Kısmi</option>
                                        <option value="collected">Tahsil Edildi</option>
                                        <option value="bounced">Karşılıksız</option>
                                        <option value="cancelled">İptal</option>
                                    </Form.Select>
                                </Col>
                                <Col md={2}>
                                    <Form.Select
                                        value={selectedFilters.collection_type}
                                        onChange={(e) => handleFilterChange('collection_type', e.target.value)}
                                    >
                                        <option value="">Tüm Tipler</option>
                                        <option value="invoice_payment">Fatura Tahsilatı</option>
                                        <option value="advance_payment">Avans</option>
                                        <option value="partial_payment">Kısmi</option>
                                        <option value="overpayment">Fazla Ödeme</option>
                                        <option value="refund">İade</option>
                                    </Form.Select>
                                </Col>
                                <Col md={2}>
                                    <Form.Select
                                        value={selectedFilters.currency}
                                        onChange={(e) => handleFilterChange('currency', e.target.value)}
                                    >
                                        <option value="">Tüm Para Birimleri</option>
                                        <option value="TRY">TRY</option>
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                        <option value="GBP">GBP</option>
                                    </Form.Select>
                                </Col>
                                <Col md={3}>
                                    <Form.Select
                                        value={selectedFilters.payment_method_id}
                                        onChange={(e) => handleFilterChange('payment_method_id', e.target.value)}
                                    >
                                        <option value="">Tüm Ödeme Yöntemleri</option>
                                        {paymentMethods.map(method => (
                                            <option key={method.id} value={method.id}>
                                                {method.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Col>
                            </Row>
                            <Row>
                                <Col md={3}>
                                    <Form.Label>Tahsilat Tarihi (Başlangıç)</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={selectedFilters.date_from}
                                        onChange={(e) => handleFilterChange('date_from', e.target.value)}
                                    />
                                </Col>
                                <Col md={3}>
                                    <Form.Label>Tahsilat Tarihi (Bitiş)</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={selectedFilters.date_to}
                                        onChange={(e) => handleFilterChange('date_to', e.target.value)}
                                    />
                                </Col>
                                <Col md={3}>
                                    <Form.Label>Vade Tarihi (Başlangıç)</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={selectedFilters.maturity_from}
                                        onChange={(e) => handleFilterChange('maturity_from', e.target.value)}
                                    />
                                </Col>
                                <Col md={3}>
                                    <Form.Label>Vade Tarihi (Bitiş)</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={selectedFilters.maturity_to}
                                        onChange={(e) => handleFilterChange('maturity_to', e.target.value)}
                                    />
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* Collections Table */}
                    <Card>
                        <Card.Header>
                            <h6 className="mb-0">Tahsilat Listesi ({collectionsMeta.total} kayıt)</h6>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <Table responsive hover className="mb-0">
                                <thead>
                                    <tr>
                                        <th
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => handleSort('collection_number')}
                                        >
                                            Tahsilat No
                                            {filters.sort_field === 'collection_number' && (
                                                <i className={`fas fa-sort-${filters.sort_direction === 'asc' ? 'up' : 'down'} ms-1`}></i>
                                            )}
                                        </th>
                                        <th
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => handleSort('collection_date')}
                                        >
                                            Tarih
                                            {filters.sort_field === 'collection_date' && (
                                                <i className={`fas fa-sort-${filters.sort_direction === 'asc' ? 'up' : 'down'} ms-1`}></i>
                                            )}
                                        </th>
                                        <th>Cari Hesap</th>
                                        <th>Tip</th>
                                        <th>Ödeme Yöntemi</th>
                                        <th>Tutar</th>
                                        <th>Vade</th>
                                        <th>Durum</th>
                                        <th>İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {collectionsData.map((collection) => (
                                        <tr key={collection.id} className={collection.is_maturity_today ? 'table-warning' : collection.is_overdue ? 'table-danger' : ''}>
                                            <td>
                                                <Link
                                                    href={route('accounting.collections.show', collection.id)}
                                                    className="text-decoration-none fw-bold"
                                                >
                                                    {collection.collection_number}
                                                </Link>
                                                {collection.is_maturity_today && (
                                                    <Badge bg="warning" className="ms-1">Bugün</Badge>
                                                )}
                                                {collection.is_overdue && (
                                                    <Badge bg="danger" className="ms-1">Gecikmiş</Badge>
                                                )}
                                            </td>
                                            <td>{formatDate(collection.collection_date)}</td>
                                            <td>
                                                {collection.current_account && (
                                                    <div>
                                                        <div className="fw-bold">{collection.current_account.title}</div>
                                                        <small className="text-muted">{collection.current_account.account_code}</small>
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <span className="badge bg-info">{collection.collection_type_text}</span>
                                            </td>
                                            <td>
                                                {collection.payment_method && (
                                                    <span>{collection.payment_method.name}</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="fw-bold text-success">{collection.formatted_amount}</div>
                                                {collection.formatted_net_amount !== collection.formatted_amount && (
                                                    <small className="text-muted">Net: {collection.formatted_net_amount}</small>
                                                )}
                                            </td>
                                            <td>
                                                {collection.maturity_date && formatDate(collection.maturity_date)}
                                            </td>
                                            <td>
                                                <Badge bg={collection.status_color}>
                                                    {getStatusIcon(collection.status)} {collection.status_text}
                                                </Badge>
                                                {!collection.is_reconciled && collection.status === 'collected' && (
                                                    <div>
                                                        <Badge bg="warning" className="mt-1">Mutabakat Bekliyor</Badge>
                                                    </div>
                                                )}
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
                                                            href={route('accounting.collections.show', collection.id)}
                                                        >
                                                            <i className="fas fa-eye me-2"></i>
                                                            Görüntüle
                                                        </Dropdown.Item>
                                                        <Dropdown.Item
                                                            as={Link}
                                                            href={route('accounting.collections.edit', collection.id)}
                                                        >
                                                            <i className="fas fa-edit me-2"></i>
                                                            Düzenle
                                                        </Dropdown.Item>
                                                        {collection.status === 'pending' && (
                                                            <Dropdown.Item
                                                                as={Link}
                                                                href={route('accounting.collections.mark-collected', collection.id)}
                                                                method="patch"
                                                            >
                                                                <i className="fas fa-check me-2"></i>
                                                                Tahsil Et
                                                            </Dropdown.Item>
                                                        )}
                                                    </Dropdown.Menu>
                                                </Dropdown>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>

                            {collectionsData.length === 0 && (
                                <div className="text-center py-4">
                                    <i className="fas fa-inbox fa-2x text-muted mb-2"></i>
                                    <p className="text-muted">Tahsilat bulunamadı</p>
                                </div>
                            )}
                        </Card.Body>

                        {collectionsLinks && collectionsLinks.length > 3 && (
                            <Card.Footer>
                                <nav>
                                    <ul className="pagination justify-content-center mb-0">
                                        {collectionsLinks.map((link, index) => (
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
