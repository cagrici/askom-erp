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
import { FaFilter } from 'react-icons/fa';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

interface Receivable {
    id: number;
    code: string;
    name: string;
    current_balance: number;
    credit_limit: number;
    payment_term_days: number;
}

interface AgingBreakdown {
    label: string;
    value: number;
}

interface CollectionTrend {
    month: string;
    total: number;
}

interface Props {
    filters: {
        start_date: string;
        end_date: string;
    };
    receivables: {
        data: Receivable[];
        total: number;
    };
    agingBreakdown: AgingBreakdown[];
    collectionTrend: CollectionTrend[];
}

export default function AccountsReceivable({ filters, receivables, agingBreakdown, collectionTrend }: Props) {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalFilters(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = () => {
        router.get('/reports/financial/accounts-receivable', localFilters as any, {
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

    const totalReceivables = receivables.data.reduce((sum, r) => sum + r.current_balance, 0);

    const agingChartData = {
        labels: agingBreakdown.map(a => a.label),
        datasets: [
            {
                label: 'Alacak Tutarı',
                data: agingBreakdown.map(a => a.value),
                backgroundColor: [
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(255, 159, 64, 0.7)',
                    'rgba(255, 99, 132, 0.7)',
                ],
            },
        ],
    };

    const trendChartData = {
        labels: collectionTrend.map(c => {
            const date = new Date(c.month + '-01');
            return date.toLocaleDateString('tr-TR', { month: 'short' });
        }),
        datasets: [
            {
                label: 'Tahsilat',
                data: collectionTrend.map(c => c.total),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                fill: true,
            },
        ],
    };

    const getAgingBadge = (days: number) => {
        if (days <= 30) return <Badge bg="success">Güncel</Badge>;
        if (days <= 60) return <Badge bg="warning">31-60 Gün</Badge>;
        if (days <= 90) return <Badge bg="orange" style={{ backgroundColor: '#fd7e14' }}>61-90 Gün</Badge>;
        return <Badge bg="danger">90+ Gün</Badge>;
    };

    return (
        <Layout>
            <Head title="Alacak Raporu" />

            <div className="page-content">
                <div className="page-header mb-4">
                    <h4 className="page-title">Alacak Raporu</h4>
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

                {/* Summary */}
                <Row className="mb-4">
                    <Col md={4}>
                        <Card className="text-center h-100">
                            <Card.Body>
                                <div className="text-muted mb-2">Toplam Alacak</div>
                                <h3 className="mb-0 text-success">{formatCurrency(totalReceivables)}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="text-center h-100">
                            <Card.Body>
                                <div className="text-muted mb-2">Müşteri Sayısı</div>
                                <h3 className="mb-0 text-info">{receivables.total}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="text-center h-100">
                            <Card.Body>
                                <div className="text-muted mb-2">Ortalama Alacak</div>
                                <h3 className="mb-0 text-primary">
                                    {formatCurrency(receivables.total > 0 ? totalReceivables / receivables.total : 0)}
                                </h3>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Charts */}
                <Row className="mb-4">
                    <Col md={6}>
                        <Card className="h-100">
                            <Card.Header>
                                <h5 className="mb-0">Yaşlandırma Analizi</h5>
                            </Card.Header>
                            <Card.Body>
                                <Bar
                                    data={agingChartData}
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
                                <h5 className="mb-0">Tahsilat Trendi</h5>
                            </Card.Header>
                            <Card.Body>
                                <Line
                                    data={trendChartData}
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
                </Row>

                {/* Receivables Table */}
                <Card>
                    <Card.Header>
                        <h5 className="mb-0">Müşteri Alacakları</h5>
                    </Card.Header>
                    <Card.Body>
                        <div className="table-responsive">
                            <Table striped hover>
                                <thead>
                                    <tr>
                                        <th>Müşteri Kodu</th>
                                        <th>Müşteri Adı</th>
                                        <th className="text-end">Bakiye</th>
                                        <th className="text-end">Kredi Limiti</th>
                                        <th>Kullanım</th>
                                        <th className="text-end">Vade (Gün)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {receivables.data.map((item) => {
                                        const usage = item.credit_limit > 0
                                            ? (item.current_balance / item.credit_limit) * 100
                                            : 0;
                                        return (
                                            <tr key={item.id}>
                                                <td>{item.code}</td>
                                                <td>{item.name}</td>
                                                <td className="text-end">{formatCurrency(item.current_balance)}</td>
                                                <td className="text-end">{formatCurrency(item.credit_limit || 0)}</td>
                                                <td style={{ width: '150px' }}>
                                                    <ProgressBar
                                                        now={Math.min(usage, 100)}
                                                        variant={usage > 90 ? 'danger' : usage > 70 ? 'warning' : 'success'}
                                                    />
                                                </td>
                                                <td className="text-end">{item.payment_term_days || 30}</td>
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
