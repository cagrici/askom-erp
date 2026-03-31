import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import Layout from '@/Layouts';
import { Card, Col, Row, Form, Button, Table, Badge, ProgressBar } from 'react-bootstrap';
import { Pie, Bar } from 'react-chartjs-2';
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
import { FaFilter } from 'react-icons/fa';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

interface Customer {
    id: number;
    code: string;
    name: string;
    total_sales: number;
    order_count: number;
    percentage: number;
    cumulative_percentage: number;
    segment: string;
}

interface SegmentSummary {
    A: { count: number; total_sales: number };
    B: { count: number; total_sales: number };
    C: { count: number; total_sales: number };
}

interface Props {
    filters: {
        start_date: string;
        end_date: string;
    };
    customers: Customer[];
    segmentSummary: SegmentSummary;
    totalSales: number;
}

export default function CustomerSegmentation({ filters, customers, segmentSummary, totalSales }: Props) {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalFilters(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = () => {
        router.get('/reports/customers/segmentation', localFilters as any, {
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

    const segmentChartData = {
        labels: ['A Sınıfı', 'B Sınıfı', 'C Sınıfı'],
        datasets: [
            {
                label: 'Müşteri Sayısı',
                data: [segmentSummary.A.count, segmentSummary.B.count, segmentSummary.C.count],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(255, 99, 132, 0.7)',
                ],
            },
        ],
    };

    const salesChartData = {
        labels: ['A Sınıfı', 'B Sınıfı', 'C Sınıfı'],
        datasets: [
            {
                label: 'Satış Tutarı',
                data: [segmentSummary.A.total_sales, segmentSummary.B.total_sales, segmentSummary.C.total_sales],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(255, 99, 132, 0.7)',
                ],
            },
        ],
    };

    const getSegmentBadge = (segment: string) => {
        switch (segment) {
            case 'A':
                return <Badge bg="success">A Sınıfı</Badge>;
            case 'B':
                return <Badge bg="warning">B Sınıfı</Badge>;
            case 'C':
                return <Badge bg="secondary">C Sınıfı</Badge>;
            default:
                return <Badge bg="light">-</Badge>;
        }
    };

    return (
        <Layout>
            <Head title="Müşteri Segmentasyonu (ABC Analizi)" />

            <div className="page-content">
                <div className="page-header mb-4">
                    <h4 className="page-title">Müşteri Segmentasyonu (ABC Analizi)</h4>
                    <p className="text-muted mb-0">
                        A Sınıfı: %80 satışı oluşturan müşteriler | B Sınıfı: %15 satış | C Sınıfı: %5 satış
                    </p>
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

                {/* Segment Summary Cards */}
                <Row className="mb-4">
                    <Col md={4}>
                        <Card className="border-success h-100">
                            <Card.Body className="text-center">
                                <Badge bg="success" className="mb-2">A SINIFI</Badge>
                                <h4>{formatNumber(segmentSummary.A.count)} Müşteri</h4>
                                <h5 className="text-success">{formatCurrency(segmentSummary.A.total_sales)}</h5>
                                <small className="text-muted">
                                    Satışın %{((segmentSummary.A.total_sales / totalSales) * 100).toFixed(1)}'i
                                </small>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="border-warning h-100">
                            <Card.Body className="text-center">
                                <Badge bg="warning" className="mb-2">B SINIFI</Badge>
                                <h4>{formatNumber(segmentSummary.B.count)} Müşteri</h4>
                                <h5 className="text-warning">{formatCurrency(segmentSummary.B.total_sales)}</h5>
                                <small className="text-muted">
                                    Satışın %{((segmentSummary.B.total_sales / totalSales) * 100).toFixed(1)}'i
                                </small>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="border-secondary h-100">
                            <Card.Body className="text-center">
                                <Badge bg="secondary" className="mb-2">C SINIFI</Badge>
                                <h4>{formatNumber(segmentSummary.C.count)} Müşteri</h4>
                                <h5 className="text-secondary">{formatCurrency(segmentSummary.C.total_sales)}</h5>
                                <small className="text-muted">
                                    Satışın %{((segmentSummary.C.total_sales / totalSales) * 100).toFixed(1)}'i
                                </small>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Charts */}
                <Row className="mb-4">
                    <Col md={6}>
                        <Card className="h-100">
                            <Card.Header>
                                <h5 className="mb-0">Müşteri Dağılımı</h5>
                            </Card.Header>
                            <Card.Body>
                                <Pie
                                    data={segmentChartData}
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
                    <Col md={6}>
                        <Card className="h-100">
                            <Card.Header>
                                <h5 className="mb-0">Satış Dağılımı</h5>
                            </Card.Header>
                            <Card.Body>
                                <Bar
                                    data={salesChartData}
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

                {/* Customers Table */}
                <Card>
                    <Card.Header>
                        <h5 className="mb-0">Müşteri Detayları</h5>
                    </Card.Header>
                    <Card.Body>
                        <div className="table-responsive">
                            <Table striped hover>
                                <thead>
                                    <tr>
                                        <th>Segment</th>
                                        <th>Müşteri Kodu</th>
                                        <th>Müşteri Adı</th>
                                        <th className="text-end">Satış</th>
                                        <th className="text-end">%</th>
                                        <th>Kümülatif</th>
                                        <th className="text-end">Sipariş</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customers.slice(0, 50).map((customer) => (
                                        <tr key={customer.id}>
                                            <td>{getSegmentBadge(customer.segment)}</td>
                                            <td>{customer.code}</td>
                                            <td>{customer.name}</td>
                                            <td className="text-end">{formatCurrency(customer.total_sales)}</td>
                                            <td className="text-end">%{customer.percentage}</td>
                                            <td style={{ width: '150px' }}>
                                                <ProgressBar
                                                    now={customer.cumulative_percentage}
                                                    variant={
                                                        customer.cumulative_percentage <= 80
                                                            ? 'success'
                                                            : customer.cumulative_percentage <= 95
                                                            ? 'warning'
                                                            : 'secondary'
                                                    }
                                                    label={`%${customer.cumulative_percentage}`}
                                                />
                                            </td>
                                            <td className="text-end">{formatNumber(customer.order_count)}</td>
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
