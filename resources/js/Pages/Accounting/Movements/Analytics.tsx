import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Card, Row, Col, Form, Button } from 'react-bootstrap';
import Layout from '../../../Layouts';

interface MovementTrend {
    date: string;
    incoming: number;
    outgoing: number;
    transfers: number;
}

interface ValueAnalysis {
    movement_type: string;
    count: number;
    total_value: number;
    avg_value: number;
}

interface WarehouseActivity {
    warehouse_id: number;
    movement_count: number;
    total_value: number;
    warehouse?: {
        id: number;
        name: string;
        code: string;
    };
}

interface PageProps {
    period: string;
    trends: MovementTrend[];
    valueAnalysis: ValueAnalysis[];
    warehouseActivity: WarehouseActivity[];
    statusDistribution: Record<string, number>;
}

export default function Analytics() {
    const { period, trends, valueAnalysis, warehouseActivity, statusDistribution } = usePage<PageProps>().props;
    const [selectedPeriod, setSelectedPeriod] = useState(period);

    const handlePeriodChange = (newPeriod: string) => {
        setSelectedPeriod(newPeriod);
        router.get(route('accounting.movements.analytics'), { period: newPeriod });
    };

    const formatCurrency = (amount: number, currency: string = 'TRY') => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    const formatNumber = (number: number) => {
        return new Intl.NumberFormat('tr-TR').format(number);
    };

    const getMovementTypeText = (type: string) => {
        const types: Record<string, string> = {
            'receipt': 'Mal Kabul',
            'issue': 'Çıkış',
            'transfer': 'Transfer',
            'adjustment': 'Düzeltme',
            'return': 'İade',
            'production_consume': 'Üretim Tüketim',
            'production_output': 'Üretim Çıktı',
            'cycle_count': 'Sayım',
            'damage': 'Hasar',
            'loss': 'Kayıp',
            'found': 'Bulunan',
            'scrap': 'Hurda',
            'sample': 'Numune',
        };
        return types[type] || type;
    };

    const getStatusText = (status: string) => {
        const statuses: Record<string, string> = {
            'draft': 'Taslak',
            'pending': 'Bekleyen',
            'completed': 'Tamamlandı',
            'cancelled': 'İptal',
            'error': 'Hata',
        };
        return statuses[status] || status;
    };

    return (
        <Layout title="Hareket Analitikleri">
            <Head title="Hareket Analitikleri" />
            <div className="page-content">
            <div className="container-fluid">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1 className="h3 mb-0">Hareket Analitikleri</h1>
                    <div>
                        <Link
                            href={route('accounting.movements.index')}
                            className="btn btn-outline-secondary"
                        >
                            <i className="fas fa-arrow-left"></i> Geri Dön
                        </Link>
                    </div>
                </div>

                {/* Period Selection */}
                <Card className="mb-4">
                    <Card.Body>
                        <Row className="align-items-center">
                            <Col md={3}>
                                <Form.Label>Analiz Dönemi:</Form.Label>
                                <Form.Select
                                    value={selectedPeriod}
                                    onChange={(e) => handlePeriodChange(e.target.value)}
                                >
                                    <option value="7">Son 7 Gün</option>
                                    <option value="30">Son 30 Gün</option>
                                    <option value="90">Son 90 Gün</option>
                                    <option value="365">Son 1 Yıl</option>
                                </Form.Select>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                <Row>
                    {/* Movement Trends Chart Placeholder */}
                    <Col lg={8}>
                        <Card className="mb-4">
                            <Card.Header>
                                <h6 className="mb-0">Hareket Trendleri</h6>
                            </Card.Header>
                            <Card.Body>
                                <div className="text-center py-4">
                                    <i className="fas fa-chart-line fa-3x text-muted mb-3"></i>
                                    <p className="text-muted">
                                        Hareket trendleri grafiği burada gösterilecek
                                        <br />
                                        <small>Chart.js veya başka bir grafik kütüphanesi ile entegre edilebilir</small>
                                    </p>

                                    {/* Simple text-based data display for now */}
                                    <div className="mt-4">
                                        <h6>Günlük Hareket Verileri (Son {selectedPeriod} Gün)</h6>
                                        <div className="row">
                                            <div className="col-md-4">
                                                <div className="border rounded p-3 mb-2">
                                                    <div className="text-success fw-bold">
                                                        {formatNumber(trends.reduce((sum, t) => sum + t.incoming, 0))}
                                                    </div>
                                                    <small className="text-muted">Toplam Giriş</small>
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="border rounded p-3 mb-2">
                                                    <div className="text-danger fw-bold">
                                                        {formatNumber(trends.reduce((sum, t) => sum + t.outgoing, 0))}
                                                    </div>
                                                    <small className="text-muted">Toplam Çıkış</small>
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="border rounded p-3 mb-2">
                                                    <div className="text-info fw-bold">
                                                        {formatNumber(trends.reduce((sum, t) => sum + t.transfers, 0))}
                                                    </div>
                                                    <small className="text-muted">Toplam Transfer</small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Status Distribution */}
                    <Col lg={4}>
                        <Card className="mb-4">
                            <Card.Header>
                                <h6 className="mb-0">Durum Dağılımı</h6>
                            </Card.Header>
                            <Card.Body>
                                {Object.entries(statusDistribution).map(([status, count]) => (
                                    <div key={status} className="d-flex justify-content-between align-items-center mb-2">
                                        <span>{getStatusText(status)}</span>
                                        <span className="badge bg-secondary">{formatNumber(count)}</span>
                                    </div>
                                ))}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Value Analysis */}
                <Card className="mb-4">
                    <Card.Header>
                        <h6 className="mb-0">Hareket Tiplerine Göre Değer Analizi</h6>
                    </Card.Header>
                    <Card.Body>
                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Hareket Tipi</th>
                                        <th>Toplam Adet</th>
                                        <th>Toplam Değer</th>
                                        <th>Ortalama Değer</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {valueAnalysis.map((item, index) => (
                                        <tr key={index}>
                                            <td>{getMovementTypeText(item.movement_type)}</td>
                                            <td>{formatNumber(item.count)}</td>
                                            <td>{formatCurrency(item.total_value)}</td>
                                            <td>{formatCurrency(item.avg_value)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card.Body>
                </Card>

                {/* Warehouse Activity */}
                <Card>
                    <Card.Header>
                        <h6 className="mb-0">Depo Aktiviteleri</h6>
                    </Card.Header>
                    <Card.Body>
                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Depo</th>
                                        <th>Hareket Sayısı</th>
                                        <th>Toplam Değer</th>
                                        <th>Aktivite Oranı</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {warehouseActivity.map((item, index) => {
                                        const totalMovements = warehouseActivity.reduce((sum, w) => sum + w.movement_count, 0);
                                        const activityRate = totalMovements > 0 ? (item.movement_count / totalMovements) * 100 : 0;

                                        return (
                                            <tr key={index}>
                                                <td>
                                                    {item.warehouse ? (
                                                        <div>
                                                            <div className="fw-bold">{item.warehouse.name}</div>
                                                            <small className="text-muted">{item.warehouse.code}</small>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted">Bilinmeyen Depo</span>
                                                    )}
                                                </td>
                                                <td>{formatNumber(item.movement_count)}</td>
                                                <td>{formatCurrency(item.total_value)}</td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <div className="progress flex-grow-1 me-2" style={{ height: '6px' }}>
                                                            <div
                                                                className="progress-bar"
                                                                style={{ width: `${activityRate}%` }}
                                                            ></div>
                                                        </div>
                                                        <small>{activityRate.toFixed(1)}%</small>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card.Body>
                </Card>
            </div>
            </div>
        </Layout>
    );
}
