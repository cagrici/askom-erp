import React from 'react';
import { Card, Table } from 'react-bootstrap';
import { Link } from '@inertiajs/react';

interface TopCustomersTableProps {
    customers: Array<{
        id: number;
        title: string;
        account_code: string;
        order_count: number;
        total_revenue: number;
    }>;
    title?: string;
}

const TopCustomersTable: React.FC<TopCustomersTableProps> = ({
    customers,
    title = 'En Degerli Musteriler'
}) => {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 0
        }).format(value);
    };

    return (
        <Card className="card-animate border-0 shadow-sm h-100">
            <Card.Header className="border-0 bg-transparent">
                <h5 className="card-title mb-0">{title}</h5>
            </Card.Header>
            <Card.Body className="pt-0">
                {customers.length === 0 ? (
                    <div className="text-center py-4">
                        <i className="ri-user-line fs-1 text-muted"></i>
                        <p className="text-muted mb-0 mt-2">Musteri bulunamadi</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <Table className="table-hover table-nowrap mb-0 align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>#</th>
                                    <th>Musteri</th>
                                    <th className="text-center">Siparis</th>
                                    <th className="text-end">Ciro</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.map((customer, index) => (
                                    <tr key={customer.id}>
                                        <td>
                                            <span className={`badge ${index < 3 ? 'bg-primary' : 'bg-secondary'} rounded-circle`}>
                                                {index + 1}
                                            </span>
                                        </td>
                                        <td>
                                            <div>
                                                <Link href={`/current-accounts/${customer.id}`} className="fw-medium text-dark">
                                                    {customer.title}
                                                </Link>
                                                <small className="text-muted d-block">{customer.account_code}</small>
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <span className="badge bg-info-subtle text-info">
                                                {customer.order_count}
                                            </span>
                                        </td>
                                        <td className="text-end fw-medium text-success">
                                            {formatCurrency(customer.total_revenue)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default TopCustomersTable;
