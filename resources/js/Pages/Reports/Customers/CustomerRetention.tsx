import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import Layout from '@/Layouts';
import { Card, Col, Row, Form, Button, Table, Badge, ProgressBar } from 'react-bootstrap';
import { Line, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { FaFilter } from 'react-icons/fa';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend);

interface MonthlyRetention {
    month: string;
    previous_customers: number;
    retained_customers: number;
    retention_rate: number;
}

interface ChurnAnalysis {
    active_30_days: number;
    inactive_30_60_days: number;
    inactive_60_90_days: number;
    churned_90_plus: number;
}

interface RepeatCustomerRate {
    total_customers: number;
    repeat_customers: number;
    repeat_rate: number;
}

interface Props {
    filters: {
        start_date: string;
        end_date: string;
    };
    monthlyRetention: MonthlyRetention[];
    churnAnalysis: ChurnAnalysis;
    repeatCustomerRate: RepeatCustomerRate;
}

export default function CustomerRetention({
    filters,
    monthlyRetention,
    churnAnalysis,
    repeatCustomerRate,
}: Props) {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalFilters(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = () => {
        router.get('/reports/customers/retention', localFilters as any, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('tr-TR').format(num);
    };

    const avgRetention = monthlyRetention.length > 0
        ? monthlyRetention.reduce((sum, m) => sum + m.retention_rate, 0) / monthlyRetention.length
        : 0;

    const retentionChartData = {
        labels: monthlyRetention.map(m => {
            const date = new Date(m.month + '-01');
            return date.toLocaleDateString('tr-TR', { month: 'short' });
        }),
        datasets: [
            {
                label: 'Tutma Oranı (%)',
                data: monthlyRetention.map(m => m.retention_rate),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                fill: true,
            },
        ],
    };

    const churnChartData = {
        labels: ['Aktif (30 gün)', 'İnaktif (30-60 gün)', 'İnaktif (60-90 gün)', 'Kayıp (90+ gün)'],
        datasets: [
            {
                data: [
                    churnAnalysis.active_30_days,
                    churnAnalysis.inactive_30_60_days,
                    churnAnalysis.inactive_60_90_days,
                    churnAnalysis.churned_90_plus,
                ],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(255, 159, 64, 0.7)',
                    'rgba(255, 99, 132, 0.7)',
                ],
            },
        ],
    };

    return (
        <Layout>
            <Head title="Müşteri Sadakati Analizi" />

            <div className="page-content">
                <div className="page-header mb-4">
                    <h4 className="page-title">Müşteri Sadakati Analizi</h4>
                </div>

                {/* Filters */}
                <Card className="mb-4">
                    <Card.Body>
                        <Row className="align-items-end">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Başlangıç Tarihi</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="start_date"
                                        value={localFilters.start_date}
                                        onChange={handleFilterChange}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Bitiş Tarihi</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="end_date"
                                        value={localFilters.end_date}
                                        onChange={handleFilterChange}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Button variant="primary" onClick={applyFilters}>
                                    <FaFilter className="me-2" />
                                    Filtrele
                                </Button>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Summary Cards */}
                <Row className="mb-4">
                    <Col md={3}>
                        <Card className="text-center h-100">
                            <Card.Body>
                                <div className="text-muted mb-2">Ortalama Tutma Oranı</div>
                                <h3 className="mb-0 text-success">%{avgRetention.toFixed(1)}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="text-center h-100">
                            <Card.Body>
                                <div className="text-muted mb-2">Tekrar Müşteri Oranı</div>
                                <h3 className="mb-0 text-info">%{repeatCustomerRate.repeat_rate}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="text-center h-100">
                            <Card.Body>
                                <div className="text-muted mb-2">Aktif Müşteri</div>
                                <h3 className="mb-0 text-primary">{formatNumber(churnAnalysis.active_30_days)}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="text-center h-100">
                            <Card.Body>
                                <div className="text-muted mb-2">Kayıp Müşteri</div>
                                <h3 className="mb-0 text-danger">{formatNumber(churnAnalysis.churned_90_plus)}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Charts */}
                <Row className="mb-4">
                    <Col md={8}>
                        <Card className="h-100">
                            <Card.Header>
                                <h5 className="mb-0">Aylık Tutma Oranı Trendi</h5>
                            </Card.Header>
                            <Card.Body>
                                <Line
                                    data={retentionChartData}
                                    options={{
                                        responsive: true,
                                        plugins: {
                                            legend: { display: false },
                                        },
                                        scales: {
                                            y: {
                                                min: 0,
                                                max: 100,
                                                ticks: {
                                                    callback: function(value) {
                                                        return value + '%';
                                                    },
                                                },
                                            },
                                        },
                                    }}
                                />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="h-100">
                            <Card.Header>
                                <h5 className="mb-0">Müşteri Durumu Dağılımı</h5>
                            </Card.Header>
                            <Card.Body>
                                <Pie
                                    data={churnChartData}
                                    options={{
                                        responsive: true,
                                        plugins: {
                                            legend: {
                                                position: 'bottom' as const,
                                            },
                                        },
                                    }}
                                />
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Repeat Customer Info */}
                <Card className="mb-4">
                    <Card.Header>
                        <h5 className="mb-0">Tekrar Müşteri Analizi</h5>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={4} className="text-center">
                                <h5>Toplam Müşteri</h5>
                                <h2 className="text-primary">{formatNumber(repeatCustomerRate.total_customers)}</h2>
                            </Col>
                            <Col md={4} className="text-center">
                                <h5>Tekrar Sipariş Veren</h5>
                                <h2 className="text-success">{formatNumber(repeatCustomerRate.repeat_customers)}</h2>
                            </Col>
                            <Col md={4} className="text-center">
                                <h5>Tekrar Oranı</h5>
                                <h2 className="text-info">%{repeatCustomerRate.repeat_rate}</h2>
                            </Col>
                        </Row>
                        <div className="mt-4">
                            <ProgressBar>
                                <ProgressBar
                                    variant="success"
                                    now={(repeatCustomerRate.repeat_customers / repeatCustomerRate.total_customers) * 100}
                                    label={`Tekrar: ${repeatCustomerRate.repeat_customers}`}
                                />
                                <ProgressBar
                                    variant="warning"
                                    now={((repeatCustomerRate.total_customers - repeatCustomerRate.repeat_customers) / repeatCustomerRate.total_customers) * 100}
                                    label={`Tek Sefer: ${repeatCustomerRate.total_customers - repeatCustomerRate.repeat_customers}`}
                                />
                            </ProgressBar>
                        </div>
                    </Card.Body>
                </Card>

                {/* Monthly Retention Table */}
                <Card>
                    <Card.Header>
                        <h5 className="mb-0">Aylık Tutma Detayları</h5>
                    </Card.Header>
                    <Card.Body>
                        <div className="table-responsive">
                            <Table striped hover>
                                <thead>
                                    <tr>
                                        <th>Ay</th>
                                        <th className="text-end">Önceki Ay Müşterisi</th>
                                        <th className="text-end">Bu Ay Kalan</th>
                                        <th>Tutma Oranı</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {monthlyRetention.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>
                                                {new Date(item.month + '-01').toLocaleDateString('tr-TR', {
                                                    month: 'long',
                                                    year: 'numeric',
                                                })}
                                            </td>
                                            <td className="text-end">{formatNumber(item.previous_customers)}</td>
                                            <td className="text-end">{formatNumber(item.retained_customers)}</td>
                                            <td style={{ width: '200px' }}>
                                                <div className="d-flex align-items-center">
                                                    <ProgressBar
                                                        now={item.retention_rate}
                                                        variant={
                                                            item.retention_rate >= 70
                                                                ? 'success'
                                                                : item.retention_rate >= 50
                                                                ? 'warning'
                                                                : 'danger'
                                                        }
                                                        className="flex-grow-1 me-2"
                                                    />
                                                    <Badge
                                                        bg={
                                                            item.retention_rate >= 70
                                                                ? 'success'
                                                                : item.retention_rate >= 50
                                                                ? 'warning'
                                                                : 'danger'
                                                        }
                                                    >
                                                        %{item.retention_rate}
                                                    </Badge>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    </Card.Body>
                </Card>
            </div>
        </Layout>
    );
}
