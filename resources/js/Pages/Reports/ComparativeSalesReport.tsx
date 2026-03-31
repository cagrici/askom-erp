import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import Layout from '@/Layouts';
import { Card, Col, Row, Form, Button, Table, Badge } from 'react-bootstrap';
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
import { FaArrowUp, FaArrowDown, FaFilter, FaDownload } from 'react-icons/fa';

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

interface Company {
    id: number;
    name: string;
}

interface ComparisonItem {
    product_id: number;
    code: string;
    name: string;
    current_quantity: number;
    previous_quantity: number;
    quantity_change: number;
    quantity_change_rate: number;
    current_amount: number;
    previous_amount: number;
    amount_change: number;
    amount_change_rate: number;
}

interface MonthlyData {
    month: string;
    current_amount: number;
    previous_amount: number;
}

interface TopProduct {
    code: string;
    name: string;
    total_quantity: number;
    total_amount: number;
}

interface Props {
    filters: {
        start_date: string;
        end_date: string;
        co_id: number | null;
    };
    companies: Company[];
    comparisonData: ComparisonItem[];
    monthlyData: MonthlyData[];
    topProducts: TopProduct[];
    summary: {
        currentPeriodTotal: number;
        previousPeriodTotal: number;
        growthRate: number;
    };
}

export default function ComparativeSalesReport({
    filters = { start_date: '', end_date: '', co_id: null },
    companies = [],
    comparisonData = [],
    monthlyData = [],
    topProducts = [],
    summary = { currentPeriodTotal: 0, previousPeriodTotal: 0, growthRate: 0 },
}: Props) {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setLocalFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const applyFilters = () => {
        router.get('/reports/comparative-sales', localFilters as any, {
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

    // Monthly comparison chart data
    const monthlyChartData = {
        labels: monthlyData.map(d => {
            const date = new Date(d.month + '-01');
            return date.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' });
        }),
        datasets: [
            {
                label: 'Mevcut Dönem',
                data: monthlyData.map(d => d.current_amount),
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
            },
            {
                label: 'Önceki Yıl',
                data: monthlyData.map(d => d.previous_amount),
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
            },
        ],
    };

    // Top products bar chart data
    const topProductsChartData = {
        labels: topProducts.slice(0, 10).map(p => p.name.substring(0, 20) + (p.name.length > 20 ? '...' : '')),
        datasets: [
            {
                label: 'Satış Tutarı',
                data: topProducts.slice(0, 10).map(p => p.total_amount),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(153, 102, 255, 0.5)',
                    'rgba(255, 159, 64, 0.5)',
                    'rgba(199, 199, 199, 0.5)',
                    'rgba(83, 102, 255, 0.5)',
                    'rgba(255, 99, 255, 0.5)',
                    'rgba(99, 255, 132, 0.5)',
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(199, 199, 199, 1)',
                    'rgba(83, 102, 255, 1)',
                    'rgba(255, 99, 255, 1)',
                    'rgba(99, 255, 132, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    // Growth distribution pie chart
    const growthDistribution = {
        positive: comparisonData.filter(item => item.amount_change_rate > 0).length,
        negative: comparisonData.filter(item => item.amount_change_rate < 0).length,
        neutral: comparisonData.filter(item => item.amount_change_rate === 0).length,
    };

    const growthChartData = {
        labels: ['Artış', 'Azalış', 'Değişim Yok'],
        datasets: [
            {
                data: [growthDistribution.positive, growthDistribution.negative, growthDistribution.neutral],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(201, 203, 207, 0.5)',
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(201, 203, 207, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    return (
        <Layout>
            <Head title="Karşılaştırmalı Satış Raporu" />

            <div className="page-content">
            <div className="page-header">
                <h4 className="page-title">Karşılaştırmalı Satış Raporu</h4>
            </div>

            {/* Filters */}
            <Card className="mb-4">
                <Card.Body>
                    <Row className="align-items-end">
                        <Col md={3}>
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
                        <Col md={3}>
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
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Firma</Form.Label>
                                <Form.Select
                                    name="co_id"
                                    value={localFilters.co_id || ''}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">Tüm Firmalar</option>
                                    {companies.map(company => (
                                        <option key={company.id} value={company.id}>
                                            {company.name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
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
                    <Card>
                        <Card.Body>
                            <h5 className="card-title">Mevcut Dönem Toplam</h5>
                            <h3 className="mb-0">{formatCurrency(summary.currentPeriodTotal)}</h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card>
                        <Card.Body>
                            <h5 className="card-title">Önceki Yıl Aynı Dönem</h5>
                            <h3 className="mb-0">{formatCurrency(summary.previousPeriodTotal)}</h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card>
                        <Card.Body>
                            <h5 className="card-title">Büyüme Oranı</h5>
                            <h3 className="mb-0">
                                <Badge bg={summary.growthRate >= 0 ? 'success' : 'danger'}>
                                    {summary.growthRate >= 0 ? <FaArrowUp /> : <FaArrowDown />}
                                    {' '}%{Math.abs(summary.growthRate)}
                                </Badge>
                            </h3>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Charts */}
            <Row className="mb-4">
                <Col md={8}>
                    <Card>
                        <Card.Header>
                            <h5 className="mb-0">Aylık Satış Karşılaştırması</h5>
                        </Card.Header>
                        <Card.Body>
                            <Line
                                data={monthlyChartData}
                                options={{
                                    responsive: true,
                                    plugins: {
                                        legend: {
                                            position: 'top' as const,
                                        },
                                        title: {
                                            display: false,
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
                    <Card>
                        <Card.Header>
                            <h5 className="mb-0">Büyüme Dağılımı</h5>
                        </Card.Header>
                        <Card.Body>
                            <Pie
                                data={growthChartData}
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

            <Row className="mb-4">
                <Col md={12}>
                    <Card>
                        <Card.Header>
                            <h5 className="mb-0">En Çok Satan 10 Ürün</h5>
                        </Card.Header>
                        <Card.Body>
                            <Bar
                                data={topProductsChartData}
                                options={{
                                    responsive: true,
                                    plugins: {
                                        legend: {
                                            display: false,
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

            {/* Detailed Comparison Table */}
            <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Detaylı Karşılaştırma</h5>
                </Card.Header>
                <Card.Body>
                    <div className="table-responsive">
                        <Table striped bordered hover>
                            <thead>
                                <tr>
                                    <th>Ürün Kodu</th>
                                    <th>Ürün Adı</th>
                                    <th className="text-end">Mevcut Miktar</th>
                                    <th className="text-end">Önceki Miktar</th>
                                    <th className="text-end">Miktar Değişimi</th>
                                    <th className="text-end">Mevcut Tutar</th>
                                    <th className="text-end">Önceki Tutar</th>
                                    <th className="text-end">Tutar Değişimi</th>
                                    <th className="text-center">Büyüme %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparisonData.slice(0, 20).map((item) => (
                                    <tr key={item.product_id}>
                                        <td>{item.code}</td>
                                        <td>{item.name}</td>
                                        <td className="text-end">{formatNumber(item.current_quantity)}</td>
                                        <td className="text-end">{formatNumber(item.previous_quantity)}</td>
                                        <td className="text-end">
                                            <span className={item.quantity_change >= 0 ? 'text-success' : 'text-danger'}>
                                                {item.quantity_change >= 0 && '+'}{formatNumber(item.quantity_change)}
                                            </span>
                                        </td>
                                        <td className="text-end">{formatCurrency(item.current_amount)}</td>
                                        <td className="text-end">{formatCurrency(item.previous_amount)}</td>
                                        <td className="text-end">
                                            <span className={item.amount_change >= 0 ? 'text-success' : 'text-danger'}>
                                                {item.amount_change >= 0 && '+'}{formatCurrency(item.amount_change)}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            <Badge bg={item.amount_change_rate >= 0 ? 'success' : 'danger'}>
                                                {item.amount_change_rate >= 0 ? <FaArrowUp /> : <FaArrowDown />}
                                                {' '}%{Math.abs(item.amount_change_rate)}
                                            </Badge>
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
