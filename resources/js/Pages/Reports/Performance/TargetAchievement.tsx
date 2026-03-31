import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import Layout from '@/Layouts';
import { Card, Col, Row, Form, Button, Table, Badge, ProgressBar } from 'react-bootstrap';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { FaFilter, FaBullseye } from 'react-icons/fa';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface MonthlyData {
    month: string;
    month_name: string;
    target: number;
    actual: number;
    achievement: number;
    variance: number;
}

interface SalespersonData {
    name: string;
    target: number;
    actual: number;
    achievement: number;
}

interface Props {
    filters: {
        year: number;
    };
    monthlyData: MonthlyData[];
    bySalesperson: SalespersonData[];
    summary: {
        total_target: number;
        total_actual: number;
        overall_achievement: number;
    };
    years: number[];
}

export default function TargetAchievement({ filters, monthlyData, bySalesperson, summary, years }: Props) {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setLocalFilters(prev => ({ ...prev, [name]: parseInt(value) }));
    };

    const applyFilters = () => {
        router.get('/reports/performance/target-achievement', localFilters as any, {
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

    const monthlyChartData = {
        labels: monthlyData.map(m => m.month_name),
        datasets: [
            {
                label: 'Hedef',
                data: monthlyData.map(m => m.target),
                backgroundColor: 'rgba(255, 99, 132, 0.7)',
            },
            {
                label: 'Gerçekleşen',
                data: monthlyData.map(m => m.actual),
                backgroundColor: 'rgba(75, 192, 192, 0.7)',
            },
        ],
    };

    const salespersonChartData = {
        labels: bySalesperson.map(s => s.name),
        datasets: [
            {
                label: 'Gerçekleşme %',
                data: bySalesperson.map(s => s.achievement),
                backgroundColor: bySalesperson.map(s =>
                    s.achievement >= 100 ? 'rgba(75, 192, 192, 0.7)' : 'rgba(255, 206, 86, 0.7)'
                ),
            },
        ],
    };

    return (
        <Layout>
            <Head title="Hedef Gerçekleşme Raporu" />

            <div className="page-content">
                <div className="page-header mb-4">
                    <h4 className="page-title">
                        <FaBullseye className="me-2" />
                        Hedef Gerçekleşme Raporu
                    </h4>
                </div>

                {/* Filters */}
                <Card className="mb-4">
                    <Card.Body>
                        <Row className="align-items-end">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Yıl</Form.Label>
                                    <Form.Select
                                        name="year"
                                        value={localFilters.year}
                                        onChange={handleFilterChange}
                                    >
                                        {years.map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </Form.Select>
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
                        <Card className="text-center h-100">
                            <Card.Body>
                                <div className="text-muted mb-2">Toplam Hedef</div>
                                <h3 className="mb-0 text-danger">{formatCurrency(summary.total_target)}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="text-center h-100">
                            <Card.Body>
                                <div className="text-muted mb-2">Toplam Gerçekleşen</div>
                                <h3 className="mb-0 text-success">{formatCurrency(summary.total_actual)}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="text-center h-100">
                            <Card.Body>
                                <div className="text-muted mb-2">Genel Gerçekleşme</div>
                                <h3 className={`mb-2 ${summary.overall_achievement >= 100 ? 'text-success' : 'text-warning'}`}>
                                    %{summary.overall_achievement}
                                </h3>
                                <ProgressBar
                                    now={Math.min(summary.overall_achievement, 100)}
                                    variant={summary.overall_achievement >= 100 ? 'success' : 'warning'}
                                />
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Monthly Chart */}
                <Card className="mb-4">
                    <Card.Header>
                        <h5 className="mb-0">Aylık Hedef vs Gerçekleşen</h5>
                    </Card.Header>
                    <Card.Body>
                        <Bar
                            data={monthlyChartData}
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

                {/* By Salesperson */}
                <Row className="mb-4">
                    <Col md={6}>
                        <Card className="h-100">
                            <Card.Header>
                                <h5 className="mb-0">Temsilci Bazlı Gerçekleşme</h5>
                            </Card.Header>
                            <Card.Body>
                                <Bar
                                    data={salespersonChartData}
                                    options={{
                                        responsive: true,
                                        indexAxis: 'y' as const,
                                        plugins: {
                                            legend: { display: false },
                                        },
                                        scales: {
                                            x: {
                                                max: 150,
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
                    <Col md={6}>
                        <Card className="h-100">
                            <Card.Header>
                                <h5 className="mb-0">Temsilci Detayları</h5>
                            </Card.Header>
                            <Card.Body>
                                <Table striped hover size="sm">
                                    <thead>
                                        <tr>
                                            <th>Temsilci</th>
                                            <th className="text-end">Hedef</th>
                                            <th className="text-end">Gerçekleşen</th>
                                            <th className="text-center">%</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bySalesperson.map((person, idx) => (
                                            <tr key={idx}>
                                                <td>{person.name}</td>
                                                <td className="text-end">{formatCurrency(person.target)}</td>
                                                <td className="text-end">{formatCurrency(person.actual)}</td>
                                                <td className="text-center">
                                                    <Badge bg={person.achievement >= 100 ? 'success' : 'warning'}>
                                                        %{person.achievement}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Monthly Details Table */}
                <Card>
                    <Card.Header>
                        <h5 className="mb-0">Aylık Detaylar</h5>
                    </Card.Header>
                    <Card.Body>
                        <div className="table-responsive">
                            <Table striped hover>
                                <thead>
                                    <tr>
                                        <th>Ay</th>
                                        <th className="text-end">Hedef</th>
                                        <th className="text-end">Gerçekleşen</th>
                                        <th className="text-end">Fark</th>
                                        <th>Gerçekleşme</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {monthlyData.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>{item.month_name}</td>
                                            <td className="text-end">{formatCurrency(item.target)}</td>
                                            <td className="text-end">{formatCurrency(item.actual)}</td>
                                            <td className={`text-end ${item.variance >= 0 ? 'text-success' : 'text-danger'}`}>
                                                {item.variance >= 0 ? '+' : ''}{formatCurrency(item.variance)}
                                            </td>
                                            <td style={{ width: '200px' }}>
                                                <ProgressBar
                                                    now={Math.min(item.achievement, 100)}
                                                    variant={item.achievement >= 100 ? 'success' : item.achievement >= 80 ? 'info' : 'warning'}
                                                    label={`%${item.achievement}`}
                                                />
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
