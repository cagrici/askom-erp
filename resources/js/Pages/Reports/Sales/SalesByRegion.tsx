import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import Layout from '@/Layouts';
import { Card, Col, Row, Form, Button, Table, ProgressBar } from 'react-bootstrap';
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
import { FaFilter, FaMapMarkerAlt } from 'react-icons/fa';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

interface Region {
    region: string;
    total_amount: number;
    order_count: number;
    customer_count: number;
}

interface Props {
    filters: {
        start_date: string;
        end_date: string;
    };
    regions: Region[];
}

export default function SalesByRegion({ filters, regions }: Props) {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalFilters(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = () => {
        router.get('/reports/sales/by-region', localFilters as any, {
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

    const totalSales = regions.reduce((sum, r) => sum + r.total_amount, 0);
    const maxSales = Math.max(...regions.map(r => r.total_amount), 1);

    const colors = [
        'rgba(255, 99, 132, 0.7)',
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 206, 86, 0.7)',
        'rgba(75, 192, 192, 0.7)',
        'rgba(153, 102, 255, 0.7)',
        'rgba(255, 159, 64, 0.7)',
        'rgba(199, 199, 199, 0.7)',
        'rgba(83, 102, 255, 0.7)',
    ];

    const pieChartData = {
        labels: regions.slice(0, 8).map(r => r.region),
        datasets: [
            {
                data: regions.slice(0, 8).map(r => r.total_amount),
                backgroundColor: colors,
                borderWidth: 1,
            },
        ],
    };

    const barChartData = {
        labels: regions.map(r => r.region),
        datasets: [
            {
                label: 'Satış Tutarı',
                data: regions.map(r => r.total_amount),
                backgroundColor: 'rgba(54, 162, 235, 0.7)',
            },
        ],
    };

    return (
        <Layout>
            <Head title="Bölge Bazlı Satış Raporu" />

            <div className="page-content">
                <div className="page-header mb-4">
                    <h4 className="page-title">
                        <FaMapMarkerAlt className="me-2" />
                        Bölge Bazlı Satış Raporu
                    </h4>
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
                                <div className="text-muted mb-2">Toplam Bölge</div>
                                <h3 className="mb-0 text-primary">{regions.length}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="text-center h-100">
                            <Card.Body>
                                <div className="text-muted mb-2">Toplam Satış</div>
                                <h3 className="mb-0 text-success">{formatCurrency(totalSales)}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="text-center h-100">
                            <Card.Body>
                                <div className="text-muted mb-2">Ort. Bölge Satışı</div>
                                <h3 className="mb-0 text-info">
                                    {formatCurrency(regions.length > 0 ? totalSales / regions.length : 0)}
                                </h3>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Charts */}
                <Row className="mb-4">
                    <Col md={5}>
                        <Card className="h-100">
                            <Card.Header>
                                <h5 className="mb-0">Bölge Dağılımı</h5>
                            </Card.Header>
                            <Card.Body>
                                <Pie
                                    data={pieChartData}
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
                    <Col md={7}>
                        <Card className="h-100">
                            <Card.Header>
                                <h5 className="mb-0">Bölge Karşılaştırması</h5>
                            </Card.Header>
                            <Card.Body>
                                <Bar
                                    data={barChartData}
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
                    </Col>
                </Row>

                {/* Regions Table */}
                <Card>
                    <Card.Header>
                        <h5 className="mb-0">Bölge Detayları</h5>
                    </Card.Header>
                    <Card.Body>
                        <div className="table-responsive">
                            <Table striped hover>
                                <thead>
                                    <tr>
                                        <th>Bölge</th>
                                        <th className="text-end">Satış Tutarı</th>
                                        <th style={{ width: '200px' }}>Pay</th>
                                        <th className="text-end">Sipariş</th>
                                        <th className="text-end">Müşteri</th>
                                        <th className="text-end">Ort. Sipariş</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {regions.map((region, index) => (
                                        <tr key={index}>
                                            <td>
                                                <FaMapMarkerAlt className="me-2 text-muted" />
                                                {region.region}
                                            </td>
                                            <td className="text-end">{formatCurrency(region.total_amount)}</td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <ProgressBar
                                                        now={(region.total_amount / totalSales) * 100}
                                                        className="flex-grow-1 me-2"
                                                        variant="info"
                                                    />
                                                    <small className="text-muted">
                                                        %{((region.total_amount / totalSales) * 100).toFixed(1)}
                                                    </small>
                                                </div>
                                            </td>
                                            <td className="text-end">{formatNumber(region.order_count)}</td>
                                            <td className="text-end">{formatNumber(region.customer_count)}</td>
                                            <td className="text-end">
                                                {formatCurrency(region.order_count > 0
                                                    ? region.total_amount / region.order_count
                                                    : 0)}
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
