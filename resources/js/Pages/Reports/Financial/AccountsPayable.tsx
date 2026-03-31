import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import Layout from '@/Layouts';
import { Card, Col, Row, Form, Button, Table } from 'react-bootstrap';
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
import { FaFilter } from 'react-icons/fa';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Payable {
    id: number;
    code: string;
    name: string;
    balance: number;
    payment_term_days: number;
}

interface AgingBreakdown {
    label: string;
    value: number;
}

interface PaymentScheduleItem {
    id: number;
    doc_number: string;
    due_date: string;
    remaining_amount: number;
    current_account?: {
        id: number;
        name: string;
    };
}

interface Props {
    filters: {
        start_date: string;
        end_date: string;
    };
    payables: {
        data: Payable[];
        total: number;
    };
    agingBreakdown: AgingBreakdown[];
    paymentSchedule: PaymentScheduleItem[];
}

export default function AccountsPayable({ filters, payables, agingBreakdown, paymentSchedule }: Props) {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalFilters(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = () => {
        router.get('/reports/financial/accounts-payable', localFilters as any, {
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

    const totalPayables = payables.data.reduce((sum, p) => sum + p.balance, 0);

    const agingChartData = {
        labels: agingBreakdown.map(a => a.label),
        datasets: [
            {
                label: 'Borç Tutarı',
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

    return (
        <Layout>
            <Head title="Borç Raporu" />

            <div className="page-content">
                <div className="page-header mb-4">
                    <h4 className="page-title">Borç Raporu</h4>
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
                                <div className="text-muted mb-2">Toplam Borç</div>
                                <h3 className="mb-0 text-danger">{formatCurrency(totalPayables)}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="text-center h-100">
                            <Card.Body>
                                <div className="text-muted mb-2">Tedarikçi Sayısı</div>
                                <h3 className="mb-0 text-info">{payables.total}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="text-center h-100">
                            <Card.Body>
                                <div className="text-muted mb-2">Ortalama Borç</div>
                                <h3 className="mb-0 text-primary">
                                    {formatCurrency(payables.total > 0 ? totalPayables / payables.total : 0)}
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
                                <h5 className="mb-0">Yaklaşan Ödemeler</h5>
                            </Card.Header>
                            <Card.Body>
                                <div className="table-responsive">
                                    <Table striped hover size="sm">
                                        <thead>
                                            <tr>
                                                <th>Fatura No</th>
                                                <th>Tedarikçi</th>
                                                <th>Vade</th>
                                                <th className="text-end">Tutar</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paymentSchedule.slice(0, 10).map((item) => (
                                                <tr key={item.id}>
                                                    <td>{item.doc_number}</td>
                                                    <td>{item.current_account?.name || '-'}</td>
                                                    <td>{new Date(item.due_date).toLocaleDateString('tr-TR')}</td>
                                                    <td className="text-end">{formatCurrency(item.remaining_amount)}</td>
                                                </tr>
                                            ))}
                                            {paymentSchedule.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="text-center text-muted">
                                                        Yaklaşan ödeme bulunmuyor
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Payables Table */}
                <Card>
                    <Card.Header>
                        <h5 className="mb-0">Tedarikçi Borçları</h5>
                    </Card.Header>
                    <Card.Body>
                        <div className="table-responsive">
                            <Table striped hover>
                                <thead>
                                    <tr>
                                        <th>Tedarikçi Kodu</th>
                                        <th>Tedarikçi Adı</th>
                                        <th className="text-end">Bakiye</th>
                                        <th className="text-end">Vade (Gün)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payables.data.map((item) => (
                                        <tr key={item.id}>
                                            <td>{item.code}</td>
                                            <td>{item.name}</td>
                                            <td className="text-end text-danger">{formatCurrency(item.balance)}</td>
                                            <td className="text-end">{item.payment_term_days || 30}</td>
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
