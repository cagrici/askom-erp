import React from 'react';
import { Head } from '@inertiajs/react';
import Layout from '@/Layouts';
import { Card, Col, Row, Table, Badge, ProgressBar } from 'react-bootstrap';
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Customer {
    id: number;
    code: string;
    name: string;
    customer_since: string;
    customer_age_months: number;
    total_sales: number;
    order_count: number;
    monthly_average: number;
    lifetime_value: number;
}

interface Props {
    customers: Customer[];
    summary: {
        total_customers: number;
        avg_lifetime_value: number;
        total_lifetime_value: number;
    };
}

export default function CustomerLifetimeValue({
    customers = [],
    summary = { total_customers: 0, avg_lifetime_value: 0, total_lifetime_value: 0 }
}: Props) {
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

    const maxLTV = Math.max(...customers.map(c => c.lifetime_value), 1);

    const chartData = {
        labels: customers.slice(0, 15).map(c =>
            c.name.length > 20 ? c.name.substring(0, 20) + '...' : c.name
        ),
        datasets: [
            {
                label: 'Yaşam Boyu Değer',
                data: customers.slice(0, 15).map(c => c.lifetime_value),
                backgroundColor: 'rgba(153, 102, 255, 0.7)',
            },
        ],
    };

    const getLTVBadge = (ltv: number) => {
        if (ltv >= 500000) return <Badge bg="success">Premium</Badge>;
        if (ltv >= 100000) return <Badge bg="info">Değerli</Badge>;
        if (ltv >= 50000) return <Badge bg="warning">Standart</Badge>;
        return <Badge bg="secondary">Düşük</Badge>;
    };

    return (
        <Layout>
            <Head title="Müşteri Yaşam Boyu Değeri" />

            <div className="page-content">
                <div className="page-header mb-4">
                    <h4 className="page-title">Müşteri Yaşam Boyu Değeri (CLV)</h4>
                    <p className="text-muted mb-0">
                        Tahmini 5 yıllık müşteri değeri (Aylık ortalama × 60 ay)
                    </p>
                </div>

                {/* Summary Cards */}
                <Row className="mb-4">
                    <Col md={4}>
                        <Card className="text-center h-100">
                            <Card.Body>
                                <div className="text-muted mb-2">Toplam Müşteri</div>
                                <h3 className="mb-0 text-primary">{formatNumber(summary.total_customers)}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="text-center h-100">
                            <Card.Body>
                                <div className="text-muted mb-2">Ortalama CLV</div>
                                <h3 className="mb-0 text-success">{formatCurrency(summary.avg_lifetime_value)}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="text-center h-100">
                            <Card.Body>
                                <div className="text-muted mb-2">Toplam CLV</div>
                                <h3 className="mb-0 text-info">{formatCurrency(summary.total_lifetime_value)}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Chart */}
                <Card className="mb-4">
                    <Card.Header>
                        <h5 className="mb-0">En Değerli 15 Müşteri</h5>
                    </Card.Header>
                    <Card.Body>
                        <Bar
                            data={chartData}
                            options={{
                                responsive: true,
                                indexAxis: 'y' as const,
                                plugins: {
                                    legend: { display: false },
                                },
                                scales: {
                                    x: {
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

                {/* Customers Table */}
                <Card>
                    <Card.Header>
                        <h5 className="mb-0">Müşteri CLV Detayları</h5>
                    </Card.Header>
                    <Card.Body>
                        <div className="table-responsive">
                            <Table striped hover>
                                <thead>
                                    <tr>
                                        <th>Müşteri</th>
                                        <th>Müşteri Yaşı</th>
                                        <th className="text-end">Toplam Satış</th>
                                        <th className="text-end">Sipariş</th>
                                        <th className="text-end">Aylık Ort.</th>
                                        <th className="text-end">CLV</th>
                                        <th>Değer</th>
                                        <th>Seviye</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customers.slice(0, 50).map((customer) => (
                                        <tr key={customer.id}>
                                            <td>
                                                <div>{customer.name}</div>
                                                <small className="text-muted">{customer.code}</small>
                                            </td>
                                            <td>{customer.customer_age_months} ay</td>
                                            <td className="text-end">{formatCurrency(customer.total_sales)}</td>
                                            <td className="text-end">{formatNumber(customer.order_count)}</td>
                                            <td className="text-end">{formatCurrency(customer.monthly_average)}</td>
                                            <td className="text-end fw-bold">{formatCurrency(customer.lifetime_value)}</td>
                                            <td style={{ width: '120px' }}>
                                                <ProgressBar
                                                    now={(customer.lifetime_value / maxLTV) * 100}
                                                    variant="info"
                                                />
                                            </td>
                                            <td>{getLTVBadge(customer.lifetime_value)}</td>
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
