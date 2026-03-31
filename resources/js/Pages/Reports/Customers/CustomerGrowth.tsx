import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import Layout from '@/Layouts';
import { Card, Col, Row, Form, Button, Table, Badge, ProgressBar } from 'react-bootstrap';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { FaFilter, FaArrowUp, FaArrowDown } from 'react-icons/fa';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

interface MonthlyNewCustomer {
    month: string;
    count: number;
}

interface LeadConversion {
    month: string;
    total_leads: number;
    converted_leads: number;
    conversion_rate: number;
}

interface CustomerSource {
    source: string;
    count: number;
}

interface Props {
    filters: {
        start_date: string;
        end_date: string;
    };
    monthlyNewCustomers: MonthlyNewCustomer[];
    leadConversion: LeadConversion[];
    customerSources: CustomerSource[];
}

export default function CustomerGrowth({
    filters,
    monthlyNewCustomers,
    leadConversion,
    customerSources,
}: Props) {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalFilters(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = () => {
        router.get('/reports/customers/growth', localFilters as any, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('tr-TR').format(num);
    };

    const totalNewCustomers = monthlyNewCustomers.reduce((sum, m) => sum + m.count, 0);
    const avgMonthlyGrowth = monthlyNewCustomers.length > 0
        ? totalNewCustomers / monthlyNewCustomers.length
        : 0;

    const totalLeads = leadConversion.reduce((sum, l) => sum + l.total_leads, 0);
    const totalConverted = leadConversion.reduce((sum, l) => sum + l.converted_leads, 0);
    const avgConversionRate = totalLeads > 0 ? (totalConverted / totalLeads) * 100 : 0;

    const growthChartData = {
        labels: monthlyNewCustomers.map(m => {
            const date = new Date(m.month + '-01');
            return date.toLocaleDateString('tr-TR', { month: 'short' });
        }),
        datasets: [
            {
                label: 'Yeni Müşteri',
                data: monthlyNewCustomers.map(m => m.count),
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                fill: true,
            },
        ],
    };

    const conversionChartData = {
        labels: leadConversion.map(l => {
            const date = new Date(l.month + '-01');
            return date.toLocaleDateString('tr-TR', { month: 'short' });
        }),
        datasets: [
            {
                label: 'Toplam Lead',
                data: leadConversion.map(l => l.total_leads),
                backgroundColor: 'rgba(255, 206, 86, 0.7)',
            },
            {
                label: 'Dönüşen',
                data: leadConversion.map(l => l.converted_leads),
                backgroundColor: 'rgba(75, 192, 192, 0.7)',
            },
        ],
    };

    const sourceChartData = {
        labels: customerSources.map(s => s.source),
        datasets: [
            {
                data: customerSources.map(s => s.count),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                ],
            },
        ],
    };

    return (
        <Layout>
            <Head title="Müşteri Büyüme Analizi" />

            <div className="page-content">
                <div className="page-header mb-4">
                    <h4 className="page-title">Müşteri Büyüme Analizi</h4>
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
                                <div className="text-muted mb-2">Toplam Yeni Müşteri</div>
                                <h3 className="mb-0 text-success">{formatNumber(totalNewCustomers)}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="text-center h-100">
                            <Card.Body>
                                <div className="text-muted mb-2">Aylık Ortalama</div>
                                <h3 className="mb-0 text-info">{avgMonthlyGrowth.toFixed(0)}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="text-center h-100">
                            <Card.Body>
                                <div className="text-muted mb-2">Toplam Lead</div>
                                <h3 className="mb-0 text-warning">{formatNumber(totalLeads)}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="text-center h-100">
                            <Card.Body>
                                <div className="text-muted mb-2">Dönüşüm Oranı</div>
                                <h3 className="mb-0 text-primary">%{avgConversionRate.toFixed(1)}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Charts Row 1 */}
                <Row className="mb-4">
                    <Col md={8}>
                        <Card className="h-100">
                            <Card.Header>
                                <h5 className="mb-0">Aylık Yeni Müşteri Trendi</h5>
                            </Card.Header>
                            <Card.Body>
                                <Line
                                    data={growthChartData}
                                    options={{
                                        responsive: true,
                                        plugins: {
                                            legend: { display: false },
                                        },
                                    }}
                                />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="h-100">
                            <Card.Header>
                                <h5 className="mb-0">Müşteri Kaynakları</h5>
                            </Card.Header>
                            <Card.Body>
                                {customerSources.length > 0 ? (
                                    <Pie
                                        data={sourceChartData}
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
                                    <p className="text-center text-muted">Kaynak verisi bulunmuyor</p>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Lead Conversion Chart */}
                <Card className="mb-4">
                    <Card.Header>
                        <h5 className="mb-0">Lead Dönüşüm Analizi</h5>
                    </Card.Header>
                    <Card.Body>
                        <Bar
                            data={conversionChartData}
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: {
                                        position: 'top' as const,
                                    },
                                },
                            }}
                        />
                    </Card.Body>
                </Card>

                {/* Lead Conversion Table */}
                <Card>
                    <Card.Header>
                        <h5 className="mb-0">Aylık Lead Dönüşüm Detayları</h5>
                    </Card.Header>
                    <Card.Body>
                        <div className="table-responsive">
                            <Table striped hover>
                                <thead>
                                    <tr>
                                        <th>Ay</th>
                                        <th className="text-end">Toplam Lead</th>
                                        <th className="text-end">Dönüşen</th>
                                        <th>Dönüşüm Oranı</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leadConversion.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>
                                                {new Date(item.month + '-01').toLocaleDateString('tr-TR', {
                                                    month: 'long',
                                                    year: 'numeric',
                                                })}
                                            </td>
                                            <td className="text-end">{formatNumber(item.total_leads)}</td>
                                            <td className="text-end">{formatNumber(item.converted_leads)}</td>
                                            <td style={{ width: '200px' }}>
                                                <div className="d-flex align-items-center">
                                                    <ProgressBar
                                                        now={item.conversion_rate}
                                                        max={100}
                                                        variant={
                                                            item.conversion_rate >= 30
                                                                ? 'success'
                                                                : item.conversion_rate >= 15
                                                                ? 'warning'
                                                                : 'danger'
                                                        }
                                                        className="flex-grow-1 me-2"
                                                    />
                                                    <Badge
                                                        bg={
                                                            item.conversion_rate >= 30
                                                                ? 'success'
                                                                : item.conversion_rate >= 15
                                                                ? 'warning'
                                                                : 'danger'
                                                        }
                                                    >
                                                        %{item.conversion_rate}
                                                    </Badge>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {leadConversion.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="text-center text-muted">
                                                Lead dönüşüm verisi bulunmuyor
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    </Card.Body>
                </Card>
            </div>
        </Layout>
    );
}
