import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Card, Row, Col, Table, Button, Form, InputGroup, Badge, Dropdown } from 'react-bootstrap';
import Layout from '../../../Layouts';

interface InventoryMovement {
    id: number;
    movement_number: string;
    movement_type: string;
    direction: string;
    quantity: number;
    unit: string;
    total_cost: number;
    cost_currency: string;
    movement_date: string;
    reference_number?: string;
    document_number?: string;
    partner_name?: string;
    status: string;
    warehouse?: {
        id: number;
        name: string;
    };
    inventory_item?: {
        id: number;
        name: string;
        code: string;
    };
    creator?: {
        id: number;
        name: string;
    };
    movement_type_text: string;
    direction_text: string;
    direction_color: string;
    status_color: string;
    formatted_quantity: string;
}

interface MovementStats {
    total_movements: number;
    today_movements: number;
    pending_movements: number;
    completed_movements: number;
    total_value: number;
    incoming_movements: number;
    outgoing_movements: number;
}

interface PageProps {
    movements: {
        data?: InventoryMovement[];
        links?: any[];
        meta?: any;
    };
    stats: MovementStats;
    recentMovements?: InventoryMovement[];
    charts?: {
        movementsByDirection: Record<string, number>;
        movementsOverTime: Record<string, number>;
    };
    filters: {
        search?: string;
        movement_type?: string;
        direction?: string;
        status?: string;
        warehouse_id?: string;
        date_from?: string;
        date_to?: string;
        sort_field?: string;
        sort_direction?: string;
    };
}

export default function Index() {
    const { movements, stats, recentMovements, charts, filters } = usePage<PageProps>().props;

    // Provide default values to prevent errors
    const movementsData = movements?.data || [];
    const movementsLinks = movements?.links || [];
    const movementsMeta = movements?.meta || { total: 0 };
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedFilters, setSelectedFilters] = useState({
        movement_type: filters.movement_type || '',
        direction: filters.direction || '',
        status: filters.status || '',
        warehouse_id: filters.warehouse_id || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
    });

    const handleSearch = () => {
        router.get(route('accounting.movements.index'), {
            ...selectedFilters,
            search: searchTerm,
        });
    };

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...selectedFilters, [key]: value };
        setSelectedFilters(newFilters);
        router.get(route('accounting.movements.index'), {
            ...newFilters,
            search: searchTerm,
        });
    };

    const handleSort = (field: string) => {
        const direction = filters.sort_field === field && filters.sort_direction === 'asc' ? 'desc' : 'asc';
        router.get(route('accounting.movements.index'), {
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

    const getDirectionIcon = (direction: string) => {
        switch (direction) {
            case 'in':
                return '↗️';
            case 'out':
                return '↙️';
            case 'transfer':
                return '↔️';
            default:
                return '•';
        }
    };

    return (
        <Layout title="Muhasebe Hareketleri">
            <Head title="Muhasebe Hareketleri" />
            <div className="page-content">
            <div className="container-fluid">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1 className="h3 mb-0">Muhasebe Hareketleri</h1>
                    <div>
                        <Link
                            href={route('accounting.movements.analytics')}
                            className="btn btn-outline-primary me-2"
                        >
                            <i className="fas fa-chart-line"></i> Analitik
                        </Link>
                        <Link
                            href={route('accounting.movements.export')}
                            className="btn btn-success"
                        >
                            <i className="fas fa-download"></i> Dışa Aktar
                        </Link>
                    </div>
                </div>

                {/* Statistics Cards */}
                <Row className="mb-4">
                    <Col md={3}>
                        <Card className="text-center">
                            <Card.Body>
                                <h5 className="text-primary">{stats.total_movements}</h5>
                                <small className="text-muted">Toplam Hareket</small>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="text-center">
                            <Card.Body>
                                <h5 className="text-info">{stats.today_movements}</h5>
                                <small className="text-muted">Bugünkü Hareketler</small>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="text-center">
                            <Card.Body>
                                <h5 className="text-warning">{stats.pending_movements}</h5>
                                <small className="text-muted">Bekleyen</small>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="text-center">
                            <Card.Body>
                                <h5 className="text-success">{formatCurrency(stats.total_value)}</h5>
                                <small className="text-muted">Toplam Değer</small>
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
                            <Col md={4}>
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
                                    value={selectedFilters.direction}
                                    onChange={(e) => handleFilterChange('direction', e.target.value)}
                                >
                                    <option value="">Tüm Yönler</option>
                                    <option value="in">Giriş</option>
                                    <option value="out">Çıkış</option>
                                    <option value="transfer">Transfer</option>
                                </Form.Select>
                            </Col>
                            <Col md={2}>
                                <Form.Select
                                    value={selectedFilters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                >
                                    <option value="">Tüm Durumlar</option>
                                    <option value="draft">Taslak</option>
                                    <option value="pending">Bekleyen</option>
                                    <option value="completed">Tamamlandı</option>
                                    <option value="cancelled">İptal</option>
                                </Form.Select>
                            </Col>
                            <Col md={2}>
                                <Form.Control
                                    type="date"
                                    value={selectedFilters.date_from}
                                    onChange={(e) => handleFilterChange('date_from', e.target.value)}
                                    placeholder="Başlangıç Tarihi"
                                />
                            </Col>
                            <Col md={2}>
                                <Form.Control
                                    type="date"
                                    value={selectedFilters.date_to}
                                    onChange={(e) => handleFilterChange('date_to', e.target.value)}
                                    placeholder="Bitiş Tarihi"
                                />
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Movements Table */}
                <Card>
                    <Card.Header>
                        <h6 className="mb-0">Hareket Listesi ({movementsMeta.total} kayıt)</h6>
                    </Card.Header>
                    <Card.Body className="p-0">
                        <Table responsive hover className="mb-0">
                            <thead>
                                <tr>
                                    <th
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleSort('movement_number')}
                                    >
                                        Hareket No
                                        {filters.sort_field === 'movement_number' && (
                                            <i className={`fas fa-sort-${filters.sort_direction === 'asc' ? 'up' : 'down'} ms-1`}></i>
                                        )}
                                    </th>
                                    <th
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleSort('movement_date')}
                                    >
                                        Tarih
                                        {filters.sort_field === 'movement_date' && (
                                            <i className={`fas fa-sort-${filters.sort_direction === 'asc' ? 'up' : 'down'} ms-1`}></i>
                                        )}
                                    </th>
                                    <th>Ürün</th>
                                    <th>Hareket Tipi</th>
                                    <th>Yön</th>
                                    <th>Miktar</th>
                                    <th>Toplam Tutar</th>
                                    <th>Durum</th>
                                    <th>İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {movementsData.map((movement) => (
                                    <tr key={movement.id}>
                                        <td>
                                            <Link
                                                href={route('accounting.movements.show', movement.id)}
                                                className="text-decoration-none fw-bold"
                                            >
                                                {movement.movement_number}
                                            </Link>
                                        </td>
                                        <td>{formatDate(movement.movement_date)}</td>
                                        <td>
                                            {movement.inventory_item && (
                                                <div>
                                                    <div className="fw-bold">{movement.inventory_item.name}</div>
                                                    <small className="text-muted">{movement.inventory_item.code}</small>
                                                </div>
                                            )}
                                        </td>
                                        <td>{movement.movement_type_text}</td>
                                        <td>
                                            <Badge bg={movement.direction_color}>
                                                {getDirectionIcon(movement.direction)} {movement.direction_text}
                                            </Badge>
                                        </td>
                                        <td>{movement.formatted_quantity}</td>
                                        <td>{formatCurrency(movement.total_cost, movement.cost_currency)}</td>
                                        <td>
                                            <Badge bg={movement.status_color}>
                                                {movement.status}
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
                                                        href={route('accounting.movements.show', movement.id)}
                                                    >
                                                        <i className="fas fa-eye me-2"></i>
                                                        Görüntüle
                                                    </Dropdown.Item>
                                                </Dropdown.Menu>
                                            </Dropdown>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>

                        {movementsData.length === 0 && (
                            <div className="text-center py-4">
                                <i className="fas fa-inbox fa-2x text-muted mb-2"></i>
                                <p className="text-muted">Hareket bulunamadı</p>
                            </div>
                        )}
                    </Card.Body>

                    {movementsLinks && movementsLinks.length > 3 && (
                        <Card.Footer>
                            <nav>
                                <ul className="pagination justify-content-center mb-0">
                                    {movementsLinks.map((link, index) => (
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
