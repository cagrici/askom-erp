import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import Layout from '@/Layouts';
import { Card, Col, Row, Form, Button, Table, Badge, ProgressBar } from 'react-bootstrap';
import { Bar, Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { FaFilter, FaTrophy, FaMedal } from 'react-icons/fa';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

interface Salesperson {
    id: number;
    name: string;
    total_sales: number;
    order_count: number;
    customer_count: number;
    avg_order_value: number;
    target_amount: number;
    achievement: number;
}

interface MonthlyTrend {
    [key: string]: Array<{
        name: string;
        month: string;
        total_sales: number;
    }>;
}

interface Ranking {
    rank: number;
    name: string;
    total_sales: number;
    achievement: number;
}

interface Props {
    filters: {
        start_date: string;
        end_date: string;
    };
    salespeople: Salesperson[];
    monthlyTrend: MonthlyTrend;
    ranking: Ranking[];
}

export default function SalesTeamPerformance({ filters, salespeople, monthlyTrend, ranking }: Props) {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalFilters(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = () => {
        router.get('/reports/performance/sales-team', localFilters as any, {
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

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('tr-TR').format(num);
    };

    // Bar chart
    const barChartData = {
        labels: salespeople.map(s => s.name || 'Atanmamış'),
        datasets: [
            {
                label: 'Satış',
                data: salespeople.map(s => s.total_sales),
                backgroundColor: 'rgba(54, 162, 235, 0.7)',
            },
            {
                label: 'Hedef',
                data: salespeople.map(s => s.target_amount),
                backgroundColor: 'rgba(255, 99, 132, 0.7)',
            },
        ],
    };

    // Line chart for trends
    const months = [...new Set(Object.values(monthlyTrend).flat().map(d => d.month))].sort();
    const colors = [
        'rgb(255, 99, 132)',
        'rgb(54, 162, 235)',
        'rgb(255, 206, 86)',
        'rgb(75, 192, 192)',
        'rgb(153, 102, 255)',
    ];

    const lineChartData = {
        labels: months.map(m => {
            const date = new Date(m + '-01');
            return date.toLocaleDateString('tr-TR', { month: 'short' });
        }),
        datasets: Object.entries(monthlyTrend).slice(0, 5).map(([name, data], index) => ({
            label: name || 'Atanmamış',
            data: months.map(month => {
                const found = data.find(d => d.month === month);
                return found ? found.total_sales : 0;
            }),
            borderColor: colors[index % colors.length],
            tension: 0.3,
        })),
    };

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <FaTrophy className="text-warning" />;
        if (rank === 2) return <FaMedal className="text-secondary" />;
        if (rank === 3) return <FaMedal style={{ color: '#cd7f32' }} />;
        return <span className="text-muted">{rank}</span>;
    };

    return (
        <Layout>
            <Head title="Satış Ekibi Performansı" />

            <div className="page-content">
                <div className="page-header mb-4">
                    <h4 className="page-title">Satış Ekibi Performansı</h4>
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

                {/* Ranking Cards */}
                <Row className="mb-4">
                    {ranking.slice(0, 3).map((person, idx) => (
                        <Col md={4} key={idx}>
                            <Card className={`text-center h-100 ${idx === 0 ? 'border-warning' : ''}`}>
                                <Card.Body>
                                    <div className="mb-2">{getRankIcon(person.rank)}</div>
                                    <h5>{person.name}</h5>
                                    <h3 className="text-primary">{formatCurrency(person.total_sales)}</h3>
                                    <Badge bg={person.achievement >= 100 ? 'success' : 'warning'}>
                                        %{person.achievement} Hedef
                                    </Badge>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>

                {/* Charts */}
                <Row className="mb-4">
                    <Col md={6}>
                        <Card className="h-100">
                            <Card.Header>
                                <h5 className="mb-0">Satış vs Hedef</h5>
                            </Card.Header>
                            <Card.Body>
                                <Bar
                                    data={barChartData}
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
                    <Col md={6}>
                        <Card className="h-100">
                            <Card.Header>
                                <h5 className="mb-0">Aylık Trend</h5>
                            </Card.Header>
                            <Card.Body>
                                <Line
                                    data={lineChartData}
                                    options={{
                                        responsive: true,
                                        plugins: {
                                            legend: {
                                                position: 'bottom' as const,
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
                </Row>

                {/* Detail Table */}
                <Card>
                    <Card.Header>
                        <h5 className="mb-0">Detaylı Performans</h5>
                    </Card.Header>
                    <Card.Body>
                        <div className="table-responsive">
                            <Table striped hover>
                                <thead>
                                    <tr>
                                        <th>Sıra</th>
                                        <th>Temsilci</th>
                                        <th className="text-end">Satış</th>
                                        <th className="text-end">Hedef</th>
                                        <th>Gerçekleşme</th>
                                        <th className="text-end">Sipariş</th>
                                        <th className="text-end">Müşteri</th>
                                        <th className="text-end">Ort. Sipariş</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {salespeople.map((person, idx) => (
                                        <tr key={person.id || idx}>
                                            <td className="text-center">{getRankIcon(idx + 1)}</td>
                                            <td>{person.name || 'Atanmamış'}</td>
                                            <td className="text-end">{formatCurrency(person.total_sales)}</td>
                                            <td className="text-end">{formatCurrency(person.target_amount)}</td>
                                            <td style={{ width: '150px' }}>
                                                <ProgressBar
                                                    now={Math.min(person.achievement, 100)}
                                                    variant={person.achievement >= 100 ? 'success' : 'warning'}
                                                    label={`%${person.achievement}`}
                                                />
                                            </td>
                                            <td className="text-end">{formatNumber(person.order_count)}</td>
                                            <td className="text-end">{formatNumber(person.customer_count)}</td>
                                            <td className="text-end">{formatCurrency(person.avg_order_value)}</td>
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
