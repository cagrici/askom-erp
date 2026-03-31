import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import Layout from '@/Layouts';
import { Card, Col, Row, Form, Button, Table, Badge, ProgressBar } from 'react-bootstrap';
import { Line, Bar, Radar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    RadialLinearScale,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { FaFilter, FaUsers, FaBullseye, FaCog, FaChartLine } from 'react-icons/fa';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    RadialLinearScale,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface SalesTeamPerformance {
    name: string;
    total_sales: number;
}

interface TargetVsActual {
    month: string;
    target: number;
    actual: number;
}

interface DepartmentPerformance {
    metric: string;
    value: number;
}

interface KPIScore {
    name: string;
    value: number;
    target: number;
    unit: string;
}

interface Props {
    filters: {
        start_date: string;
        end_date: string;
    };
    summary: {
        target_achievement: number;
        fulfillment_rate: number;
        on_time_delivery: number;
        customer_satisfaction: number;
    };
    salesTeamPerformance: SalesTeamPerformance[];
    targetVsActual: TargetVsActual[];
    departmentPerformance: DepartmentPerformance[];
    kpiScores: KPIScore[];
}

export default function PerformanceReportIndex({
    filters,
    summary,
    salesTeamPerformance,
    targetVsActual,
    departmentPerformance,
    kpiScores,
}: Props) {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalFilters(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = () => {
        router.get('/reports/performance', localFilters as any, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    // Sales team chart
    const salesTeamChartData = {
        labels: salesTeamPerformance.map(s => s.name || 'Atanmamış'),
        datasets: [
            {
                label: 'Satış',
                data: salesTeamPerformance.map(s => s.total_sales),
                backgroundColor: 'rgba(153, 102, 255, 0.7)',
            },
        ],
    };

    // Target vs Actual chart
    const targetChartData = {
        labels: targetVsActual.map(t => {
            const date = new Date(t.month + '-01');
            return date.toLocaleDateString('tr-TR', { month: 'short' });
        }),
        datasets: [
            {
                label: 'Hedef',
                data: targetVsActual.map(t => t.target),
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderDash: [5, 5],
            },
            {
                label: 'Gerçekleşen',
                data: targetVsActual.map(t => t.actual),
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
            },
        ],
    };

    // Radar chart for department performance
    const radarChartData = {
        labels: departmentPerformance.map(d => d.metric),
        datasets: [
            {
                label: 'Performans',
                data: departmentPerformance.map(d => d.value),
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgb(75, 192, 192)',
                pointBackgroundColor: 'rgb(75, 192, 192)',
            },
        ],
    };

    const getPerformanceBadge = (value: number) => {
        if (value >= 90) return <Badge bg="success">Mükemmel</Badge>;
        if (value >= 70) return <Badge bg="info">İyi</Badge>;
        if (value >= 50) return <Badge bg="warning">Orta</Badge>;
        return <Badge bg="danger">Düşük</Badge>;
    };

    return (
        <Layout>
            <Head title="Performans Raporları" />

            <div className="page-content">
                <div className="page-header d-flex justify-content-between align-items-center mb-4">
                    <h4 className="page-title mb-0">Performans Raporları</h4>
                    <div className="d-flex gap-2">
                        <Link href="/reports/performance/sales-team" className="btn btn-outline-primary btn-sm">
                            <FaUsers className="me-1" /> Satış Ekibi
                        </Link>
                        <Link href="/reports/performance/target-achievement" className="btn btn-outline-primary btn-sm">
                            <FaBullseye className="me-1" /> Hedef Takibi
                        </Link>
                        <Link href="/reports/performance/operational-kpis" className="btn btn-outline-primary btn-sm">
                            <FaCog className="me-1" /> Operasyonel KPI
                        </Link>
                        <Link href="/reports/performance/trend-analysis" className="btn btn-outline-primary btn-sm">
                            <FaChartLine className="me-1" /> Trend Analizi
                        </Link>
                    </div>
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
                                <div className="text-muted mb-2">Hedef Gerçekleşme</div>
                                <h3 className={`mb-2 ${summary.target_achievement >= 100 ? 'text-success' : 'text-warning'}`}>
                                    %{summary.target_achievement}
                                </h3>
                                <ProgressBar
                                    now={Math.min(summary.target_achievement, 100)}
                                    variant={summary.target_achievement >= 100 ? 'success' : 'warning'}
                                />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="text-center h-100">
                            <Card.Body>
                                <div className="text-muted mb-2">Sipariş Karşılama</div>
                                <h3 className="mb-2 text-info">%{summary.fulfillment_rate}</h3>
                                <ProgressBar now={summary.fulfillment_rate} variant="info" />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="text-center h-100">
                            <Card.Body>
                                <div className="text-muted mb-2">Zamanında Teslimat</div>
                                <h3 className="mb-2 text-primary">%{summary.on_time_delivery}</h3>
                                <ProgressBar now={summary.on_time_delivery} variant="primary" />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="text-center h-100">
                            <Card.Body>
                                <div className="text-muted mb-2">Müşteri Memnuniyeti</div>
                                <h3 className="mb-2 text-success">%{summary.customer_satisfaction}</h3>
                                <ProgressBar now={summary.customer_satisfaction} variant="success" />
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Charts */}
                <Row className="mb-4">
                    <Col md={8}>
                        <Card className="h-100">
                            <Card.Header>
                                <h5 className="mb-0">Hedef vs Gerçekleşen</h5>
                            </Card.Header>
                            <Card.Body>
                                <Line
                                    data={targetChartData}
                                    options={{
                                        responsive: true,
                                        plugins: {
                                            legend: {
                                                position: 'top' as const,
                                            },
                                        },
                                        scales: {
                                            y: {
                                                ticks: {
                                                    callback: function(value) {
                                                        return formatCurrency(value as number);
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
                                <h5 className="mb-0">Departman Performansı</h5>
                            </Card.Header>
                            <Card.Body>
                                <Radar
                                    data={radarChartData}
                                    options={{
                                        responsive: true,
                                        scales: {
                                            r: {
                                                min: 0,
                                                max: 100,
                                            },
                                        },
                                    }}
                                />
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Sales Team Chart */}
                <Card className="mb-4">
                    <Card.Header>
                        <h5 className="mb-0">Satış Ekibi Performansı</h5>
                    </Card.Header>
                    <Card.Body>
                        <Bar
                            data={salesTeamChartData}
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: { display: false },
                                },
                                scales: {
                                    y: {
                                        ticks: {
                                            callback: function(value) {
                                                return formatCurrency(value as number);
                                            },
                                        },
                                    },
                                },
                            }}
                        />
                    </Card.Body>
                </Card>

                {/* KPI Scores Table */}
                <Card>
                    <Card.Header>
                        <h5 className="mb-0">Temel Performans Göstergeleri (KPI)</h5>
                    </Card.Header>
                    <Card.Body>
                        <div className="table-responsive">
                            <Table striped hover>
                                <thead>
                                    <tr>
                                        <th>KPI</th>
                                        <th className="text-end">Değer</th>
                                        <th className="text-end">Hedef</th>
                                        <th>Gerçekleşme</th>
                                        <th className="text-center">Durum</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {kpiScores.map((kpi, idx) => {
                                        const achievement = kpi.target > 0 ? (kpi.value / kpi.target) * 100 : 0;
                                        return (
                                            <tr key={idx}>
                                                <td>{kpi.name}</td>
                                                <td className="text-end">
                                                    {kpi.unit === 'TL'
                                                        ? formatCurrency(kpi.value)
                                                        : `${kpi.value} ${kpi.unit}`}
                                                </td>
                                                <td className="text-end">
                                                    {kpi.unit === 'TL'
                                                        ? formatCurrency(kpi.target)
                                                        : `${kpi.target} ${kpi.unit}`}
                                                </td>
                                                <td style={{ width: '200px' }}>
                                                    <ProgressBar
                                                        now={Math.min(achievement, 100)}
                                                        variant={achievement >= 100 ? 'success' : achievement >= 70 ? 'info' : 'warning'}
                                                        label={`%${achievement.toFixed(0)}`}
                                                    />
                                                </td>
                                                <td className="text-center">
                                                    {getPerformanceBadge(achievement)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        </div>
                    </Card.Body>
                </Card>
            </div>
        </Layout>
    );
}
