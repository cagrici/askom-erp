import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Card, Row, Col, Table, Button, Form, InputGroup, Badge, Dropdown } from 'react-bootstrap';
import Layout from '../../../Layouts';

interface BankAccount {
    id: number;
    account_name: string;
    bank_name: string;
    branch_name?: string;
    branch_code?: string;
    account_number: string;
    iban?: string;
    swift_code?: string;
    currency: string;
    account_type: string;
    description?: string;
    is_active: boolean;
    is_default: boolean;
    created_at: string;
    updated_at: string;
    account_type_text: string;
    formatted_account_number: string;
}

interface BankAccountStats {
    total_accounts: number;
    active_accounts: number;
    try_accounts: number;
    foreign_accounts: number;
    business_accounts: number;
    default_account?: BankAccount;
}

interface PageProps {
    bankAccounts: {
        data?: BankAccount[];
        links?: any[];
        meta?: any;
    };
    stats: BankAccountStats;
    charts?: {
        currencyDistribution: Record<string, number>;
        typeDistribution: Record<string, number>;
        bankDistribution: Record<string, number>;
    };
    filters: {
        search?: string;
        bank_name?: string;
        currency?: string;
        account_type?: string;
        is_active?: string;
        sort_field?: string;
        sort_direction?: string;
    };
}

export default function Index() {
    const { bankAccounts, stats, charts, filters } = usePage<PageProps>().props;

    // Provide default values to prevent errors
    const accountsData = bankAccounts?.data || [];
    const accountsLinks = bankAccounts?.links || [];
    const accountsMeta = bankAccounts?.meta || { total: 0 };

    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedFilters, setSelectedFilters] = useState({
        bank_name: filters.bank_name || '',
        currency: filters.currency || '',
        account_type: filters.account_type || '',
        is_active: filters.is_active || '',
    });

    const handleSearch = () => {
        router.get(route('accounting.bank-accounts.index'), {
            ...selectedFilters,
            search: searchTerm,
        });
    };

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...selectedFilters, [key]: value };
        setSelectedFilters(newFilters);
        router.get(route('accounting.bank-accounts.index'), {
            ...newFilters,
            search: searchTerm,
        });
    };

    const handleSort = (field: string) => {
        const direction = filters.sort_field === field && filters.sort_direction === 'asc' ? 'desc' : 'asc';
        router.get(route('accounting.bank-accounts.index'), {
            ...selectedFilters,
            search: searchTerm,
            sort_field: field,
            sort_direction: direction,
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR');
    };

    const getStatusIcon = (isActive: boolean) => {
        return isActive ? '✅' : '❌';
    };

    const getCurrencyFlag = (currency: string) => {
        switch (currency) {
            case 'TRY':
                return '🇹🇷';
            case 'USD':
                return '🇺🇸';
            case 'EUR':
                return '🇪🇺';
            case 'GBP':
                return '🇬🇧';
            default:
                return '💰';
        }
    };

    return (
        <Layout title="Banka Hesapları">
            <Head title="Banka Hesapları" />
            <div className="page-content">
                <div className="container-fluid">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h1 className="h3 mb-0">Banka Hesapları</h1>
                        <div>
                            <Link
                                href={route('accounting.bank-accounts.create')}
                                className="btn btn-primary me-2"
                            >
                                <i className="fas fa-plus"></i> Yeni Hesap
                            </Link>
                            <Link
                                href={route('accounting.bank-accounts.export')}
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
                                    <h5 className="text-primary">{stats.total_accounts}</h5>
                                    <small className="text-muted">Toplam Hesap</small>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={3} md={6}>
                            <Card className="text-center">
                                <Card.Body>
                                    <h5 className="text-success">{stats.active_accounts}</h5>
                                    <small className="text-muted">Aktif Hesap</small>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={3} md={6}>
                            <Card className="text-center">
                                <Card.Body>
                                    <h5 className="text-info">{stats.try_accounts}</h5>
                                    <small className="text-muted">TL Hesapları</small>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={3} md={6}>
                            <Card className="text-center">
                                <Card.Body>
                                    <h5 className="text-warning">{stats.foreign_accounts}</h5>
                                    <small className="text-muted">Döviz Hesapları</small>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Default Account Info */}
                    {stats.default_account && (
                        <Row className="mb-4">
                            <Col>
                                <Card className="border-success">
                                    <Card.Header className="bg-success text-white">
                                        <h6 className="mb-0">
                                            <i className="fas fa-star"></i> Varsayılan Banka Hesabı
                                        </h6>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row>
                                            <Col md={3}>
                                                <strong>Hesap Adı:</strong> {stats.default_account.account_name}
                                            </Col>
                                            <Col md={3}>
                                                <strong>Banka:</strong> {stats.default_account.bank_name}
                                            </Col>
                                            <Col md={3}>
                                                <strong>IBAN:</strong> {stats.default_account.iban || stats.default_account.account_number}
                                            </Col>
                                            <Col md={3}>
                                                <strong>Para Birimi:</strong> {getCurrencyFlag(stats.default_account.currency)} {stats.default_account.currency}
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    )}

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
                                        value={selectedFilters.account_type}
                                        onChange={(e) => handleFilterChange('account_type', e.target.value)}
                                    >
                                        <option value="">Tüm Hesap Tipleri</option>
                                        <option value="checking">Vadesiz</option>
                                        <option value="savings">Vadeli</option>
                                        <option value="business">Ticari</option>
                                        <option value="other">Diğer</option>
                                    </Form.Select>
                                </Col>
                                <Col md={2}>
                                    <Form.Select
                                        value={selectedFilters.is_active}
                                        onChange={(e) => handleFilterChange('is_active', e.target.value)}
                                    >
                                        <option value="">Tüm Durumlar</option>
                                        <option value="1">Aktif</option>
                                        <option value="0">Pasif</option>
                                    </Form.Select>
                                </Col>
                                <Col md={3}>
                                    <Form.Control
                                        type="text"
                                        placeholder="Banka adı..."
                                        value={selectedFilters.bank_name}
                                        onChange={(e) => handleFilterChange('bank_name', e.target.value)}
                                    />
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* Bank Accounts Table */}
                    <Card>
                        <Card.Header>
                            <h6 className="mb-0">Banka Hesapları ({accountsMeta.total} kayıt)</h6>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <Table responsive hover className="mb-0">
                                <thead>
                                    <tr>
                                        <th
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => handleSort('account_name')}
                                        >
                                            Hesap Adı
                                            {filters.sort_field === 'account_name' && (
                                                <i className={`fas fa-sort-${filters.sort_direction === 'asc' ? 'up' : 'down'} ms-1`}></i>
                                            )}
                                        </th>
                                        <th
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => handleSort('bank_name')}
                                        >
                                            Banka
                                            {filters.sort_field === 'bank_name' && (
                                                <i className={`fas fa-sort-${filters.sort_direction === 'asc' ? 'up' : 'down'} ms-1`}></i>
                                            )}
                                        </th>
                                        <th>Hesap Bilgileri</th>
                                        <th>Tip</th>
                                        <th>Para Birimi</th>
                                        <th>Durum</th>
                                        <th>İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {accountsData.map((account) => (
                                        <tr key={account.id}>
                                            <td>
                                                <Link
                                                    href={route('accounting.bank-accounts.show', account.id)}
                                                    className="text-decoration-none fw-bold"
                                                >
                                                    {account.account_name}
                                                </Link>
                                                {account.is_default && (
                                                    <Badge bg="success" className="ms-2">
                                                        <i className="fas fa-star"></i> Varsayılan
                                                    </Badge>
                                                )}
                                            </td>
                                            <td>
                                                <div>
                                                    <div className="fw-bold">{account.bank_name}</div>
                                                    {account.branch_name && (
                                                        <small className="text-muted">{account.branch_name}</small>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div>
                                                    <div className="fw-bold">{account.formatted_account_number}</div>
                                                    {account.account_number !== account.formatted_account_number && (
                                                        <small className="text-muted">{account.account_number}</small>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span className="badge bg-info">{account.account_type_text}</span>
                                            </td>
                                            <td>
                                                <span className="fw-bold">
                                                    {getCurrencyFlag(account.currency)} {account.currency}
                                                </span>
                                            </td>
                                            <td>
                                                <Badge bg={account.is_active ? 'success' : 'secondary'}>
                                                    {getStatusIcon(account.is_active)} {account.is_active ? 'Aktif' : 'Pasif'}
                                                </Badge>
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
                                                            href={route('accounting.bank-accounts.show', account.id)}
                                                        >
                                                            <i className="fas fa-eye me-2"></i>
                                                            Görüntüle
                                                        </Dropdown.Item>
                                                        <Dropdown.Item
                                                            as={Link}
                                                            href={route('accounting.bank-accounts.edit', account.id)}
                                                        >
                                                            <i className="fas fa-edit me-2"></i>
                                                            Düzenle
                                                        </Dropdown.Item>
                                                        <Dropdown.Divider />
                                                        <Dropdown.Item
                                                            as={Link}
                                                            href={route('accounting.bank-accounts.toggle-status', account.id)}
                                                            method="patch"
                                                        >
                                                            <i className={`fas fa-${account.is_active ? 'times' : 'check'} me-2`}></i>
                                                            {account.is_active ? 'Pasif Yap' : 'Aktif Yap'}
                                                        </Dropdown.Item>
                                                        {!account.is_default && (
                                                            <Dropdown.Item
                                                                as={Link}
                                                                href={route('accounting.bank-accounts.set-default', account.id)}
                                                                method="patch"
                                                            >
                                                                <i className="fas fa-star me-2"></i>
                                                                Varsayılan Yap
                                                            </Dropdown.Item>
                                                        )}
                                                        <Dropdown.Divider />
                                                        <Dropdown.Item
                                                            as={Link}
                                                            href={route('accounting.bank-accounts.destroy', account.id)}
                                                            method="delete"
                                                            onBefore={() => confirm('Bu banka hesabını silmek istediğinizden emin misiniz?')}
                                                            className="text-danger"
                                                        >
                                                            <i className="fas fa-trash me-2"></i>
                                                            Sil
                                                        </Dropdown.Item>
                                                    </Dropdown.Menu>
                                                </Dropdown>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>

                            {accountsData.length === 0 && (
                                <div className="text-center py-4">
                                    <i className="fas fa-university fa-2x text-muted mb-2"></i>
                                    <p className="text-muted">Banka hesabı bulunamadı</p>
                                </div>
                            )}
                        </Card.Body>

                        {accountsLinks && accountsLinks.length > 3 && (
                            <Card.Footer>
                                <nav>
                                    <ul className="pagination justify-content-center mb-0">
                                        {accountsLinks.map((link, index) => (
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

                    {/* Charts Row */}
                    {charts && (
                        <Row className="mt-4">
                            <Col md={4}>
                                <Card>
                                    <Card.Header>
                                        <h6 className="mb-0">Para Birimi Dağılımı</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        {Object.entries(charts.currencyDistribution).map(([currency, count]) => (
                                            <div key={currency} className="d-flex justify-content-between align-items-center mb-2">
                                                <span>{getCurrencyFlag(currency)} {currency}</span>
                                                <span className="badge bg-primary">{count}</span>
                                            </div>
                                        ))}
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={4}>
                                <Card>
                                    <Card.Header>
                                        <h6 className="mb-0">Hesap Tipi Dağılımı</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        {Object.entries(charts.typeDistribution).map(([type, count]) => (
                                            <div key={type} className="d-flex justify-content-between align-items-center mb-2">
                                                <span>{type}</span>
                                                <span className="badge bg-info">{count}</span>
                                            </div>
                                        ))}
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={4}>
                                <Card>
                                    <Card.Header>
                                        <h6 className="mb-0">Bankalar</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        {Object.entries(charts.bankDistribution).map(([bank, count]) => (
                                            <div key={bank} className="d-flex justify-content-between align-items-center mb-2">
                                                <span>{bank}</span>
                                                <span className="badge bg-secondary">{count}</span>
                                            </div>
                                        ))}
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    )}
                </div>
            </div>
        </Layout>
    );
}
