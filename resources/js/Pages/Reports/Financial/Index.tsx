import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import Layout from '@/Layouts';
import { Card, Col, Row, Form, Button, Table, Badge } from 'react-bootstrap';
import { Bar, Line, Pie } from 'react-chartjs-2';
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
import { FaFilter, FaMoneyBillWave, FaFileInvoiceDollar, FaCreditCard, FaChartPie } from 'react-icons/fa';

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

interface MonthlyCashFlow {
    month: string;
    inflow: number;
    outflow: number;
    net: number;
}

interface AgingSummary {
    current: number;
    days_31_60: number;
    days_61_90: number;
    over_90: number;
}

interface OverdueReceivable {
    id: number;
    code: string;
    name: string;
    current_balance: number;
    last_transaction_date: string;
    payment_term_days: number;
}

interface Props {
    filters: {
        start_date: string;
        end_date: string;
    };
    summary: {
        total_receivables: number;
        total_payables: number;
        net_position: number;
        collection_rate: number;
    };
    monthlyCashFlow: MonthlyCashFlow[];
    agingSummary: AgingSummary;
    overdueReceivables: OverdueReceivable[];
}

export default function FinancialReportIndex({
    filters,
    summary,
    monthlyCashFlow,
    agingSummary,
    overdueReceivables,
}: Props) {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalFilters(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = () => {
        router.get('/reports/financial', localFilters as any, {
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

    // Cash flow chart
    const cashFlowChartData = {
        labels: monthlyCashFlow.map(d => {
            const date = new Date(d.month + '-01');
            return date.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' });
        }),
        datasets: [
            {
                label: 'Giriş',
                data: monthlyCashFlow.map(d => d.inflow),
                backgroundColor: 'rgba(75, 192, 192, 0.7)',
            },
            {
                label: 'Çıkış',
                data: monthlyCashFlow.map(d => d.outflow),
                backgroundColor: 'rgba(255, 99, 132, 0.7)',
            },
        ],
    };

    // Net cash flow line chart
    const netFlowChartData = {
        labels: monthlyCashFlow.map(d => {
            const date = new Date(d.month + '-01');
            return date.toLocaleDateString('tr-TR', { month: 'short' });
        }),
        datasets: [
            {
                label: 'Net Nakit Akışı',
                data: monthlyCashFlow.map(d => d.net),
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                fill: true,
            },
        ],
    };

    // Aging pie chart
    const agingChartData = {
        labels: ['0-30 Gün', '31-60 Gün', '61-90 Gün', '90+ Gün'],
        datasets: [
            {
                data: [
                    agingSummary.current,
                    agingSummary.days_31_60,
                    agingSummary.days_61_90,
                    agingSummary.over_90,
                ],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(255, 159, 64, 0.7)',
                    'rgba(255, 99, 132, 0.7)',
                ],
            },
        ],
    };

    return (
        <Layout>
            <Head title="Mali Raporlar" />

            <div className="page-content">
                <div className="page-header d-flex justify-content-between align-items-center mb-4">
                    <h4 className="page-title mb-0">Mali Raporlar</h4>
                    <div className="d-flex gap-2">
                        <Link href="/reports/financial/cash-flow" className="btn btn-outline-primary btn-sm">
                            <FaMoneyBillWave className="me-1" /> Nakit Akış
                        </Link>
                        <Link href="/reports/financial/accounts-receivable" className="btn btn-outline-primary btn-sm">
                            <FaFileInvoiceDollar className="me-1" /> Alacaklar
                        </Link>
                        <Link href="/reports/financial/accounts-payable" className="btn btn-outline-primary btn-sm">
                            <FaCreditCard className="me-1" /> Borçlar
                        </Link>
                        <Link href="/reports/financial/profit-margin" className="btn btn-outline-primary btn-sm">
                            <FaChartPie className="me-1" /> Kar Marjı
                        </Link>
                    </div>
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
                        <Card className="text-center h-100 border-success">
                            <Card.Body>
                                <div className="text-muted mb-2">Toplam Alacak</div>
                                <h3 className="mb-0 text-success">{formatCurrency(summary.total_receivables)}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="text-center h-100 border-danger">
                            <Card.Body>
                                <div className="text-muted mb-2">Toplam Borç</div>
                                <h3 className="mb-0 text-danger">{formatCurrency(summary.total_payables)}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="text-center h-100 border-primary">
                            <Card.Body>
                                <div className="text-muted mb-2">Net Pozisyon</div>
                                <h3 className={`mb-0 ${summary.net_position >= 0 ? 'text-success' : 'text-danger'}`}>
                                    {formatCurrency(summary.net_position)}
                                </h3>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="text-center h-100 border-info">
                            <Card.Body>
                                <div className="text-muted mb-2">Tahsilat Oranı</div>
                                <h3 className="mb-0 text-info">%{summary.collection_rate}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Charts */}
                <Row className="mb-4">
                    <Col md={8}>
                        <Card className="h-100">
                            <Card.Header>
                                <h5 className="mb-0">Aylık Nakit Akışı</h5>
                            </Card.Header>
                            <Card.Body>
                                <Bar
                                    data={cashFlowChartData}
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
                    <Col md={4}>
                        <Card className="h-100">
                            <Card.Header>
                                <h5 className="mb-0">Alacak Yaşlandırma</h5>
                            </Card.Header>
                            <Card.Body>
                                <Pie
                                    data={agingChartData}
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

                {/* Net Flow Trend */}
                <Card className="mb-4">
                    <Card.Header>
                        <h5 className="mb-0">Net Nakit Akış Trendi</h5>
                    </Card.Header>
                    <Card.Body>
                        <Line
                            data={netFlowChartData}
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

                {/* Overdue Receivables */}
                <Card>
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Vadesi Geçmiş Alacaklar</h5>
                        <Badge bg="danger">{overdueReceivables.length} müşteri</Badge>
                    </Card.Header>
                    <Card.Body>
                        <div className="table-responsive">
                            <Table striped hover>
                                <thead>
                                    <tr>
                                        <th>Müşteri Kodu</th>
                                        <th>Müşteri Adı</th>
                                        <th className="text-end">Bakiye</th>
                                        <th>Son İşlem</th>
                                        <th className="text-end">Vade (Gün)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {overdueReceivables.map((item) => (
                                        <tr key={item.id}>
                                            <td>{item.code}</td>
                                            <td>{item.name}</td>
                                            <td className="text-end text-danger">
                                                {formatCurrency(item.current_balance)}
                                            </td>
                                            <td>
                                                {item.last_transaction_date
                                                    ? new Date(item.last_transaction_date).toLocaleDateString('tr-TR')
                                                    : '-'}
                                            </td>
                                            <td className="text-end">{item.payment_term_days || 30}</td>
                                        </tr>
                                    ))}
                                    {overdueReceivables.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="text-center text-muted">
                                                Vadesi geçmiş alacak bulunmuyor
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
