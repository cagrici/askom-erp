import React from 'react';
import { Card, Table, Badge } from 'react-bootstrap';
import { Link } from '@inertiajs/react';

interface RecentOrdersTableProps {
    orders: Array<{
        id: number;
        order_number: string;
        customer: string;
        customer_code?: string;
        date: string;
        total: number;
        status: string;
        payment_status?: string;
    }>;
    title?: string;
    showViewAll?: boolean;
    viewAllLink?: string;
}

const RecentOrdersTable: React.FC<RecentOrdersTableProps> = ({
    orders,
    title = 'Son Siparisler',
    showViewAll = true,
    viewAllLink = '/sales/orders'
}) => {
    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { bg: string; label: string }> = {
            draft: { bg: 'secondary', label: 'Taslak' },
            confirmed: { bg: 'primary', label: 'Onaylandi' },
            in_production: { bg: 'warning', label: 'Uretimde' },
            ready_to_ship: { bg: 'info', label: 'Sevke Hazir' },
            shipped: { bg: 'success', label: 'Sevk Edildi' },
            delivered: { bg: 'success', label: 'Teslim Edildi' },
            cancelled: { bg: 'danger', label: 'Iptal' },
            returned: { bg: 'danger', label: 'Iade' },
            pending: { bg: 'warning', label: 'Bekliyor' },
            processing: { bg: 'info', label: 'Isleniyor' }
        };

        const config = statusConfig[status] || { bg: 'secondary', label: status };
        return <Badge bg={config.bg}>{config.label}</Badge>;
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 2
        }).format(value);
    };

    return (
        <Card className="card-animate border-0 shadow-sm h-100">
            <Card.Header className="border-0 bg-transparent d-flex align-items-center justify-content-between">
                <h5 className="card-title mb-0">{title}</h5>
                {showViewAll && (
                    <Link href={viewAllLink} className="text-primary fs-12">
                        Tumunu Gor <i className="ri-arrow-right-line"></i>
                    </Link>
                )}
            </Card.Header>
            <Card.Body className="pt-0">
                {orders.length === 0 ? (
                    <div className="text-center py-4">
                        <i className="ri-inbox-line fs-1 text-muted"></i>
                        <p className="text-muted mb-0 mt-2">Siparis bulunamadi</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <Table className="table-hover table-nowrap mb-0 align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>Siparis No</th>
                                    <th>Musteri</th>
                                    <th>Tarih</th>
                                    <th className="text-end">Tutar</th>
                                    <th className="text-center">Durum</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order.id}>
                                        <td>
                                            <Link href={`/sales/orders/${order.id}`} className="fw-medium text-primary">
                                                {order.order_number}
                                            </Link>
                                        </td>
                                        <td>
                                            <div>
                                                <span className="fw-medium">{order.customer}</span>
                                                {order.customer_code && (
                                                    <small className="text-muted d-block">{order.customer_code}</small>
                                                )}
                                            </div>
                                        </td>
                                        <td className="text-muted">{order.date}</td>
                                        <td className="text-end fw-medium">{formatCurrency(order.total)}</td>
                                        <td className="text-center">{getStatusBadge(order.status)}</td>
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

export default RecentOrdersTable;
