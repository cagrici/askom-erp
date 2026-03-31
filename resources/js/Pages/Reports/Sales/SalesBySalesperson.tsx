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
    total_amount: number;
    order_count: number;
    customer_count: number;
    avg_order_value: number;
}

interface MonthlyPerformance {
    [key: string]: Array<{
        name: string;
        month: string;
        total_amount: number;
    }>;
}

interface Props {
    filters: {
        start_date: string;
        end_date: string;
    };
    salespeople: Salesperson[];
    monthlyPerformance: MonthlyPerformance;
}

export default function SalesBySalesperson({ filters, salespeople, monthlyPerformance }: Props) {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalFilters(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = () => {
        router.get('/reports/sales/by-salesperson', localFilters as any, {
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

    const maxSales = Math.max(...salespeople.map(s => s.total_amount), 1);

    // Bar chart for comparison
    const barChartData = {
        labels: salespeople.slice(0, 10).map(s => s.name || 'Atanmamış'),
        datasets: [
            {
                label: 'Satış Tutarı',
                data: salespeople.slice(0, 10).map(s => s.total_amount),
                backgroundColor: 'rgba(153, 102, 255, 0.7)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1,
            },
        ],
    };

    // Line chart for monthly trends
    const months = [...new Set(
        Object.values(monthlyPerformance).flat().map(d => d.month)
    )].sort();

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
        datasets: Object.entries(monthlyPerformance).slice(0, 5).map(([name, data], index) => ({
            label: name || 'Atanmamış',
            data: months.map(month => {
                const found = data.find(d => d.month === month);
                return found ? found.total_amount : 0;
            }),
            borderColor: colors[index % colors.length],
            backgroundColor: colors[index % colors.length].replace('rgb', 'rgba').replace(')', ', 0.5)'),
            tension: 0.3,
        })),
    };

    const getRankBadge = (index: number) => {
        if (index === 0) return <FaTrophy className="text-warning" />;
        if (index === 1) return <FaMedal className="text-secondary" />;
        if (index === 2) return <FaMedal className="text-danger" />;
        return <span className="text-muted">{index + 1}</span>;
    };

    return (
        <Layout>
            <Head title="Satış Temsilcisi Performansı" />

            <div className="page-content">
                <div className="page-header mb-4">
                    <h4 className="page-title">Satış Temsilcisi Performansı</h4>
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

                {/* Charts */}
                <Row className="mb-4">
                    <Col md={6}>
                        <Card className="h-100">
                            <Card.Header>
                                <h5 className="mb-0">Satış Karşılaştırması</h5>
                            </Card.Header>
                            <Card.Body>
                                <Bar
                                    data={barChartData}
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
                    </Col>
                    <Col md={6}>
                        <Card className="h-100">
                            <Card.Header>
                                <h5 className="mb-0">Aylık Performans Trendi</h5>
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

                {/* Salespeople Table */}
                <Card>
                    <Card.Header>
                        <h5 className="mb-0">Temsilci Performans Detayları</h5>
                    </Card.Header>
                    <Card.Body>
                        <div className="table-responsive">
                            <Table striped hover>
                                <thead>
                                    <tr>
                                        <th style={{ width: '50px' }}>Sıra</th>
                                        <th>Temsilci</th>
                                        <th className="text-end">Toplam Satış</th>
                                        <th style={{ width: '200px' }}>Performans</th>
                                        <th className="text-end">Sipariş</th>
                                        <th className="text-end">Müşteri</th>
                                        <th className="text-end">Ort. Sipariş</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {salespeople.map((person, index) => (
                                        <tr key={person.id || index}>
                                            <td className="text-center">{getRankBadge(index)}</td>
                                            <td>{person.name || 'Atanmamış'}</td>
                                            <td className="text-end">{formatCurrency(person.total_amount)}</td>
                                            <td>
                                                <ProgressBar
                                                    now={(person.total_amount / maxSales) * 100}
                                                    variant={index === 0 ? 'success' : index < 3 ? 'info' : 'primary'}
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
