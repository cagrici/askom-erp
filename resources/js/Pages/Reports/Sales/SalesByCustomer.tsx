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

interface Customer {
    id: number;
    name: string;
    code: string;
    total_amount: number;
    order_count: number;
    avg_order_value: number;
    last_order_date: string;
}

interface TopCustomer {
    name: string;
    total_amount: number;
}

interface Props {
    filters: {
        start_date: string;
        end_date: string;
    };
    customers: {
        data: Customer[];
        current_page: number;
        last_page: number;
        total: number;
    };
    topCustomers: TopCustomer[];
}

export default function SalesByCustomer({ filters, customers, topCustomers }: Props) {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalFilters(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = () => {
        router.get('/reports/sales/by-customer', localFilters as any, {
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

    const chartData = {
        labels: topCustomers.map(c =>
            c.name.length > 25 ? c.name.substring(0, 25) + '...' : c.name
        ),
        datasets: [
            {
                label: 'Satış Tutarı',
                data: topCustomers.map(c => c.total_amount),
                backgroundColor: 'rgba(75, 192, 192, 0.7)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            },
        ],
    };

    return (
        <Layout>
            <Head title="Müşteri Bazlı Satış Raporu" />

            <div className="page-content">
                <div className="page-header mb-4">
                    <h4 className="page-title">Müşteri Bazlı Satış Raporu</h4>
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

                {/* Top Customers Chart */}
                <Card className="mb-4">
                    <Card.Header>
                        <h5 className="mb-0">En Değerli 10 Müşteri</h5>
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
                        <h5 className="mb-0">Müşteri Detayları ({customers.total} müşteri)</h5>
                    </Card.Header>
                    <Card.Body>
                        <div className="table-responsive">
                            <Table striped hover>
                                <thead>
                                    <tr>
                                        <th>Müşteri Kodu</th>
                                        <th>Müşteri Adı</th>
                                        <th className="text-end">Toplam Satış</th>
                                        <th className="text-end">Sipariş Sayısı</th>
                                        <th className="text-end">Ort. Sipariş</th>
                                        <th>Son Sipariş</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customers.data.map((customer) => (
                                        <tr key={customer.id}>
                                            <td>{customer.code}</td>
                                            <td>{customer.name}</td>
                                            <td className="text-end">{formatCurrency(customer.total_amount)}</td>
                                            <td className="text-end">{formatNumber(customer.order_count)}</td>
                                            <td className="text-end">{formatCurrency(customer.avg_order_value)}</td>
                                            <td>
                                                {customer.last_order_date
                                                    ? new Date(customer.last_order_date).toLocaleDateString('tr-TR')
                                                    : '-'}
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
