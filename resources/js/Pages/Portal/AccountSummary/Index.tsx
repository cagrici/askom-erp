import React from 'react';
import { Head, Link } from '@inertiajs/react';
import PortalLayout from '@/Layouts/PortalLayout';

interface Props {
    account: any;
    balance: number;
    creditLimit: number;
    usedCredit: number;
    availableCredit: number;
    openInvoices: any[];
    recentOrders: any[];
    recentTransactions: any[];
    monthlyStats: any[];
}

const Index: React.FC<Props> = ({
    account,
    balance,
    creditLimit,
    usedCredit,
    availableCredit,
    openInvoices,
    recentOrders,
    recentTransactions,
    monthlyStats
}) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('tr-TR');
    };

    return (
        <PortalLayout>
            <Head title="Cari Hesap Özeti" />

            <div className="row mb-4">
                <div className="col">
                    <h2 className="mb-0">Cari Hesap Özeti</h2>
                    <p className="text-muted">{account.title}</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="row g-4 mb-4">
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <p className="text-muted small mb-1">Bakiye</p>
                                    <h4 className={`mb-0 ${balance >= 0 ? 'text-success' : 'text-danger'}`}>
                                        {formatCurrency(balance)}
                                    </h4>
                                </div>
                                <div className="bg-primary bg-opacity-10 p-3 rounded">
                                    <i className="bx bx-wallet fs-3 text-primary"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <p className="text-muted small mb-1">Kredi Limiti</p>
                                    <h4 className="mb-0">{formatCurrency(creditLimit)}</h4>
                                </div>
                                <div className="bg-info bg-opacity-10 p-3 rounded">
                                    <i className="bx bx-credit-card fs-3 text-info"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <p className="text-muted small mb-1">Kullanılan Kredi</p>
                                    <h4 className="mb-0 text-warning">{formatCurrency(usedCredit)}</h4>
                                </div>
                                <div className="bg-warning bg-opacity-10 p-3 rounded">
                                    <i className="bx bx-money fs-3 text-warning"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <p className="text-muted small mb-1">Kullanılabilir Kredi</p>
                                    <h4 className="mb-0 text-success">{formatCurrency(availableCredit)}</h4>
                                </div>
                                <div className="bg-success bg-opacity-10 p-3 rounded">
                                    <i className="bx bx-check-circle fs-3 text-success"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-4">
                {/* Open Invoices */}
                <div className="col-md-6">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Açık Faturalar</h5>
                            <Link href={route('portal.invoices.index')} className="btn btn-sm btn-outline-primary">
                                Tümünü Gör
                            </Link>
                        </div>
                        <div className="card-body">
                            {openInvoices.length === 0 ? (
                                <p className="text-muted text-center py-3">Açık fatura bulunmamaktadır.</p>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Fatura No</th>
                                                <th>Vade</th>
                                                <th className="text-end">Tutar</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {openInvoices.map((invoice) => (
                                                <tr key={invoice.id}>
                                                    <td>
                                                        <Link href={route('portal.invoices.show', invoice.id)} className="text-decoration-none">
                                                            {invoice.invoice_no}
                                                        </Link>
                                                    </td>
                                                    <td>{formatDate(invoice.due_date)}</td>
                                                    <td className="text-end fw-bold">{formatCurrency(invoice.total_amount)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="col-md-6">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Son Siparişler</h5>
                            <Link href={route('portal.orders.index')} className="btn btn-sm btn-outline-primary">
                                Tümünü Gör
                            </Link>
                        </div>
                        <div className="card-body">
                            {recentOrders.length === 0 ? (
                                <p className="text-muted text-center py-3">Sipariş bulunmamaktadır.</p>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Sipariş No</th>
                                                <th>Tarih</th>
                                                <th className="text-end">Tutar</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentOrders.map((order) => (
                                                <tr key={order.id}>
                                                    <td>
                                                        <Link href={route('portal.orders.show', order.id)} className="text-decoration-none">
                                                            {order.order_number}
                                                        </Link>
                                                    </td>
                                                    <td>{formatDate(order.order_date)}</td>
                                                    <td className="text-end fw-bold">{formatCurrency(order.total_amount)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Son Hareketler</h5>
                            <Link href={route('portal.account-summary.transactions')} className="btn btn-sm btn-outline-primary">
                                Tümünü Gör
                            </Link>
                        </div>
                        <div className="card-body">
                            {recentTransactions.length === 0 ? (
                                <p className="text-muted text-center py-3">Hareket bulunmamaktadır.</p>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>Tarih</th>
                                                <th>Açıklama</th>
                                                <th>Borç</th>
                                                <th>Alacak</th>
                                                <th className="text-end">Bakiye</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentTransactions.map((transaction, index) => (
                                                <tr key={index}>
                                                    <td>{formatDate(transaction.transaction_date)}</td>
                                                    <td>{transaction.description}</td>
                                                    <td className="text-danger">
                                                        {transaction.transaction_type === 'debit' ? formatCurrency(transaction.amount) : '-'}
                                                    </td>
                                                    <td className="text-success">
                                                        {transaction.transaction_type === 'credit' ? formatCurrency(transaction.amount) : '-'}
                                                    </td>
                                                    <td className="text-end fw-bold">{formatCurrency(transaction.balance || 0)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </PortalLayout>
    );
};

export default Index;
