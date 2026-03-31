import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import Layout from '@/Layouts';
import { Card, Col, Row, Form, Button, Table } from 'react-bootstrap';
import { Bar, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { FaFilter, FaArrowUp, FaArrowDown } from 'react-icons/fa';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

interface DailyCashFlow {
    payment_date: string;
    inflow: number;
    outflow: number;
}

interface SourceData {
    source: string;
    total: number;
}

interface CategoryData {
    category: string;
    total: number;
}

interface Props {
    filters: {
        start_date: string;
        end_date: string;
    };
    dailyCashFlow: DailyCashFlow[];
    inflowsBySource: SourceData[];
    outflowsByCategory: CategoryData[];
}

export default function CashFlow({ filters, dailyCashFlow, inflowsBySource, outflowsByCategory }: Props) {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalFilters(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = () => {
        router.get('/reports/financial/cash-flow', localFilters as any, {
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

    const totalInflow = inflowsBySource.reduce((sum, s) => sum + s.total, 0);
    const totalOutflow = outflowsByCategory.reduce((sum, c) => sum + c.total, 0);
    const netFlow = totalInflow - totalOutflow;

    const colors = [
        'rgba(75, 192, 192, 0.7)',
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 206, 86, 0.7)',
        'rgba(153, 102, 255, 0.7)',
        'rgba(255, 159, 64, 0.7)',
    ];

    const inflowChartData = {
        labels: inflowsBySource.map(s => s.source),
        datasets: [
            {
                data: inflowsBySource.map(s => s.total),
                backgroundColor: colors,
            },
        ],
    };

    const outflowChartData = {
        labels: outflowsByCategory.map(c => c.category),
        datasets: [
            {
                data: outflowsByCategory.map(c => c.total),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(255, 159, 64, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(201, 203, 207, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                ],
            },
        ],
    };

    const dailyChartData = {
        labels: dailyCashFlow.slice(-30).map(d =>
            new Date(d.payment_date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })
        ),
        datasets: [
            {
                label: 'Giriş',
                data: dailyCashFlow.slice(-30).map(d => d.inflow),
                backgroundColor: 'rgba(75, 192, 192, 0.7)',
            },
            {
                label: 'Çıkış',
                data: dailyCashFlow.slice(-30).map(d => d.outflow),
                backgroundColor: 'rgba(255, 99, 132, 0.7)',
            },
        ],
    };

    return (
        <Layout>
            <Head title="Nakit Akış Raporu" />

            <div className="page-content">
                <div className="page-header mb-4">
                    <h4 className="page-title">Nakit Akış Raporu</h4>
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
                    <Col md={4}>
                        <Card className="text-center h-100 border-success">
                            <Card.Body>
                                <FaArrowUp className="text-success mb-2" size={24} />
                                <div className="text-muted mb-2">Toplam Giriş</div>
                                <h3 className="mb-0 text-success">{formatCurrency(totalInflow)}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="text-center h-100 border-danger">
                            <Card.Body>
                                <FaArrowDown className="text-danger mb-2" size={24} />
                                <div className="text-muted mb-2">Toplam Çıkış</div>
                                <h3 className="mb-0 text-danger">{formatCurrency(totalOutflow)}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="text-center h-100 border-primary">
                            <Card.Body>
                                <div className="text-muted mb-2">Net Nakit Akışı</div>
                                <h3 className={`mb-0 ${netFlow >= 0 ? 'text-success' : 'text-danger'}`}>
                                    {formatCurrency(netFlow)}
                                </h3>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Daily Chart */}
                <Card className="mb-4">
                    <Card.Header>
                        <h5 className="mb-0">Günlük Nakit Akışı (Son 30 Gün)</h5>
                    </Card.Header>
                    <Card.Body>
                        <Bar
                            data={dailyChartData}
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

                {/* Source/Category Charts */}
                <Row className="mb-4">
                    <Col md={6}>
                        <Card className="h-100">
                            <Card.Header>
                                <h5 className="mb-0">Giriş Kaynakları</h5>
                            </Card.Header>
                            <Card.Body>
                                {inflowsBySource.length > 0 ? (
                                    <Pie
                                        data={inflowChartData}
                                        options={{
                                            responsive: true,
                                            plugins: {
                                                legend: {
                                                    position: 'bottom' as const,
                                                },
                                            },
                                        }}
                                    />
                                ) : (
                                    <p className="text-center text-muted">Veri bulunamadı</p>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6}>
                        <Card className="h-100">
                            <Card.Header>
                                <h5 className="mb-0">Çıkış Kategorileri</h5>
                            </Card.Header>
                            <Card.Body>
                                {outflowsByCategory.length > 0 ? (
                                    <Pie
                                        data={outflowChartData}
                                        options={{
                                            responsive: true,
                                            plugins: {
                                                legend: {
                                                    position: 'bottom' as const,
                                                },
                                            },
                                        }}
                                    />
                                ) : (
                                    <p className="text-center text-muted">Veri bulunamadı</p>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Detail Tables */}
                <Row>
                    <Col md={6}>
                        <Card>
                            <Card.Header>
                                <h5 className="mb-0">Giriş Detayları</h5>
                            </Card.Header>
                            <Card.Body>
                                <Table striped hover size="sm">
                                    <thead>
                                        <tr>
                                            <th>Kaynak</th>
                                            <th className="text-end">Tutar</th>
                                            <th className="text-end">%</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {inflowsBySource.map((item, idx) => (
                                            <tr key={idx}>
                                                <td>{item.source}</td>
                                                <td className="text-end">{formatCurrency(item.total)}</td>
                                                <td className="text-end">
                                                    {totalInflow > 0
                                                        ? ((item.total / totalInflow) * 100).toFixed(1)
                                                        : 0}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6}>
                        <Card>
                            <Card.Header>
                                <h5 className="mb-0">Çıkış Detayları</h5>
                            </Card.Header>
                            <Card.Body>
                                <Table striped hover size="sm">
                                    <thead>
                                        <tr>
                                            <th>Kategori</th>
                                            <th className="text-end">Tutar</th>
                                            <th className="text-end">%</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {outflowsByCategory.map((item, idx) => (
                                            <tr key={idx}>
                                                <td>{item.category}</td>
                                                <td className="text-end">{formatCurrency(item.total)}</td>
                                                <td className="text-end">
                                                    {totalOutflow > 0
                                                        ? ((item.total / totalOutflow) * 100).toFixed(1)
                                                        : 0}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </div>
        </Layout>
    );
}
