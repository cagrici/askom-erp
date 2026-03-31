import React from 'react';
import Layout from '@/Layouts';
import { Head, Link } from '@inertiajs/react';
import { Row, Col, Card, Badge, Table, ProgressBar } from 'react-bootstrap';
import CountUp from 'react-countup';
import {
    StatCard,
    LowStockTable,
    WarehouseCapacityChart
} from '../Widgets';

interface WarehouseManagerDashboardProps {
    warehouse_capacity: Array<{
        id: number;
        name: string;
        code: string;
        used: number;
        max: number;
        percentage: number;
    }>;
    daily_operations: {
        inbound: number;
        outbound: number;
        transfers: number;
        total: number;
    };
    low_stock_alerts: Array<{
        id: number;
        name: string;
        code: string;
        current_stock: number;
        min_stock: number;
    }>;
    pending_shipments: Array<{
        id: number;
        order_number: string;
        customer: string;
        date: string;
        total: number;
    }>;
    location_usage: {
        total: number;
        occupied: number;
        empty: number;
        usage_percent: number;
    };
    recent_movements: Array<{
        id: number;
        number: string;
        type: string;
        type_label: string;
        product: string;
        quantity: number;
        warehouse: string;
        date: string;
    }>;
    staff_status: {
        active: number;
        inactive: number;
        total: number;
    };
    cycle_count_schedule: Array<{
        id: number;
        warehouse: string;
        scheduled_date: string;
        status: string;
    }>;
}

const WarehouseManagerDashboard: React.FC<WarehouseManagerDashboardProps> = ({
    warehouse_capacity,
    daily_operations,
    low_stock_alerts,
    pending_shipments,
    location_usage,
    recent_movements,
    staff_status,
    cycle_count_schedule
}) => {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 0
        }).format(value);
    };

    const getMovementTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            receipt: 'success',
            issue: 'danger',
            transfer: 'info',
            adjustment: 'warning'
        };
        return colors[type] || 'secondary';
    };

    return (
        <Layout>
            <Head title="Depo Yoneticisi Dashboard" />
            <div className="page-content">
                <div className="container-fluid">
                    {/* Baslik */}
                    <Row className="mb-4">
                        <Col>
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <h4 className="mb-1">Depo Yoneticisi Paneli</h4>
                                    <p className="text-muted mb-0">Depo operasyonlari ve stok takibi</p>
                                </div>
                                <div className="text-end">
                                    <small className="text-muted">
                                        Son guncelleme: {new Date().toLocaleString('tr-TR')}
                                    </small>
                                </div>
                            </div>
                        </Col>
                    </Row>

                    {/* Gunluk Operasyonlar */}
                    <Row className="g-3 mb-4">
                        <Col xl={3} md={6}>
                            <StatCard
                                title="Bugunun Girisleri"
                                value={daily_operations.inbound}
                                icon="ri-arrow-down-circle-line"
                                color="success"
                                suffix=" islem"
                            />
                        </Col>
                        <Col xl={3} md={6}>
                            <StatCard
                                title="Bugunun Cikislari"
                                value={daily_operations.outbound}
                                icon="ri-arrow-up-circle-line"
                                color="danger"
                                suffix=" islem"
                            />
                        </Col>
                        <Col xl={3} md={6}>
                            <StatCard
                                title="Transfer Islemleri"
                                value={daily_operations.transfers}
                                icon="ri-arrow-left-right-line"
                                color="info"
                                suffix=" islem"
                            />
                        </Col>
                        <Col xl={3} md={6}>
                            <StatCard
                                title="Toplam Islem"
                                value={daily_operations.total}
                                icon="ri-stack-line"
                                color="primary"
                                suffix=" islem"
                            />
                        </Col>
                    </Row>

                    {/* Lokasyon ve Personel Durumu */}
                    <Row className="g-3 mb-4">
                        <Col xl={4} md={6}>
                            <Card className="card-animate border-0 shadow-sm h-100">
                                <Card.Body>
                                    <div className="d-flex align-items-center justify-content-between mb-3">
                                        <h6 className="mb-0">Lokasyon Kullanimi</h6>
                                        <Badge bg={location_usage.usage_percent >= 90 ? 'danger' : location_usage.usage_percent >= 70 ? 'warning' : 'success'}>
                                            %{location_usage.usage_percent.toFixed(0)}
                                        </Badge>
                                    </div>
                                    <div className="d-flex align-items-center gap-3 mb-3">
                                        <div className="flex-grow-1">
                                            <ProgressBar
                                                now={location_usage.usage_percent}
                                                variant={location_usage.usage_percent >= 90 ? 'danger' : location_usage.usage_percent >= 70 ? 'warning' : 'success'}
                                                style={{ height: '10px' }}
                                            />
                                        </div>
                                    </div>
                                    <Row className="text-center">
                                        <Col>
                                            <h5 className="mb-0 text-primary">
                                                <CountUp end={location_usage.total} duration={1} />
                                            </h5>
                                            <small className="text-muted">Toplam</small>
                                        </Col>
                                        <Col>
                                            <h5 className="mb-0 text-success">
                                                <CountUp end={location_usage.occupied} duration={1} />
                                            </h5>
                                            <small className="text-muted">Dolu</small>
                                        </Col>
                                        <Col>
                                            <h5 className="mb-0 text-info">
                                                <CountUp end={location_usage.empty} duration={1} />
                                            </h5>
                                            <small className="text-muted">Bos</small>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xl={4} md={6}>
                            <Card className="card-animate border-0 shadow-sm h-100">
                                <Card.Body>
                                    <div className="d-flex align-items-center justify-content-between mb-3">
                                        <h6 className="mb-0">Personel Durumu</h6>
                                        <i className="ri-team-line text-primary fs-4"></i>
                                    </div>
                                    <Row className="text-center">
                                        <Col>
                                            <div className="avatar-sm mx-auto mb-2">
                                                <span className="avatar-title bg-success-subtle text-success rounded-circle fs-4">
                                                    <i className="ri-user-follow-line"></i>
                                                </span>
                                            </div>
                                            <h5 className="mb-0 text-success">
                                                <CountUp end={staff_status.active} duration={1} />
                                            </h5>
                                            <small className="text-muted">Aktif</small>
                                        </Col>
                                        <Col>
                                            <div className="avatar-sm mx-auto mb-2">
                                                <span className="avatar-title bg-secondary-subtle text-secondary rounded-circle fs-4">
                                                    <i className="ri-user-unfollow-line"></i>
                                                </span>
                                            </div>
                                            <h5 className="mb-0 text-secondary">
                                                <CountUp end={staff_status.inactive} duration={1} />
                                            </h5>
                                            <small className="text-muted">Pasif</small>
                                        </Col>
                                        <Col>
                                            <div className="avatar-sm mx-auto mb-2">
                                                <span className="avatar-title bg-primary-subtle text-primary rounded-circle fs-4">
                                                    <i className="ri-group-line"></i>
                                                </span>
                                            </div>
                                            <h5 className="mb-0 text-primary">
                                                <CountUp end={staff_status.total} duration={1} />
                                            </h5>
                                            <small className="text-muted">Toplam</small>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xl={4} md={12}>
                            <Card className="card-animate border-0 shadow-sm h-100 bg-warning-subtle">
                                <Card.Body>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <div>
                                            <p className="text-uppercase fw-medium text-warning mb-0 fs-12">
                                                Dusuk Stok Uyarisi
                                            </p>
                                            <h2 className="fs-1 fw-bold text-warning mb-0 mt-2">
                                                <CountUp end={low_stock_alerts.length} duration={1} />
                                            </h2>
                                            <p className="text-warning mb-0 mt-1">urun kritik seviyede</p>
                                        </div>
                                        <div className="avatar-lg">
                                            <span className="avatar-title bg-warning rounded-circle fs-1">
                                                <i className="ri-alert-line text-white"></i>
                                            </span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Depo Kapasiteleri ve Dusuk Stok */}
                    <Row className="g-3 mb-4">
                        <Col xl={6}>
                            <WarehouseCapacityChart
                                warehouses={warehouse_capacity}
                                title="Depo Doluluk Oranlari"
                            />
                        </Col>
                        <Col xl={6}>
                            <LowStockTable
                                products={low_stock_alerts}
                                title="Kritik Stok Uyarilari"
                            />
                        </Col>
                    </Row>

                    {/* Bekleyen Sevkiyatlar ve Son Hareketler */}
                    <Row className="g-3 mb-4">
                        <Col xl={6}>
                            <Card className="card-animate border-0 shadow-sm h-100">
                                <Card.Header className="border-0 bg-transparent d-flex align-items-center justify-content-between">
                                    <h5 className="card-title mb-0">
                                        <i className="ri-truck-line me-2"></i>
                                        Bekleyen Sevkiyatlar
                                    </h5>
                                    {pending_shipments.length > 0 && (
                                        <Badge bg="primary">{pending_shipments.length}</Badge>
                                    )}
                                </Card.Header>
                                <Card.Body className="pt-0">
                                    {pending_shipments.length === 0 ? (
                                        <div className="text-center py-4">
                                            <i className="ri-checkbox-circle-line fs-1 text-success"></i>
                                            <p className="text-muted mb-0 mt-2">Bekleyen sevkiyat bulunmuyor</p>
                                        </div>
                                    ) : (
                                        <div className="table-responsive">
                                            <Table className="table-hover table-nowrap mb-0 align-middle">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>Siparis No</th>
                                                        <th>Musteri</th>
                                                        <th>Tarih</th>
                                                        <th className="text-end">Tutar</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {pending_shipments.map((shipment) => (
                                                        <tr key={shipment.id}>
                                                            <td>
                                                                <Link href={`/sales/orders/${shipment.id}`} className="fw-medium text-primary">
                                                                    {shipment.order_number}
                                                                </Link>
                                                            </td>
                                                            <td>{shipment.customer}</td>
                                                            <td className="text-muted">{shipment.date}</td>
                                                            <td className="text-end fw-medium">{formatCurrency(shipment.total)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xl={6}>
                            <Card className="card-animate border-0 shadow-sm h-100">
                                <Card.Header className="border-0 bg-transparent">
                                    <h5 className="card-title mb-0">
                                        <i className="ri-exchange-line me-2"></i>
                                        Son Stok Hareketleri
                                    </h5>
                                </Card.Header>
                                <Card.Body className="pt-0">
                                    {recent_movements.length === 0 ? (
                                        <div className="text-center py-4">
                                            <i className="ri-inbox-line fs-1 text-muted"></i>
                                            <p className="text-muted mb-0 mt-2">Hareket bulunamadi</p>
                                        </div>
                                    ) : (
                                        <div className="table-responsive">
                                            <Table className="table-hover table-nowrap mb-0 align-middle">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>Hareket</th>
                                                        <th>Urun</th>
                                                        <th className="text-center">Miktar</th>
                                                        <th>Tarih</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {recent_movements.map((movement) => (
                                                        <tr key={movement.id}>
                                                            <td>
                                                                <Badge bg={`${getMovementTypeColor(movement.type)}-subtle`} text={getMovementTypeColor(movement.type)}>
                                                                    {movement.type_label}
                                                                </Badge>
                                                            </td>
                                                            <td className="fw-medium">{movement.product}</td>
                                                            <td className="text-center">
                                                                <span className={`fw-bold text-${getMovementTypeColor(movement.type)}`}>
                                                                    {movement.type === 'receipt' ? '+' : movement.type === 'issue' ? '-' : ''}
                                                                    {movement.quantity}
                                                                </span>
                                                            </td>
                                                            <td className="text-muted fs-12">{movement.date}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </div>
        </Layout>
    );
};

export default WarehouseManagerDashboard;
