import React from 'react';
import { Head, Link } from '@inertiajs/react';
import PortalLayout from '@/Layouts/PortalLayout';

interface Product {
    id: number;
    code: string;
    name: string;
    primary_image_url?: string;
}

interface InvoiceItem {
    id: number;
    product_id: number;
    product: Product;
    product_name: string;
    product_code: string;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    tax_amount: number;
    line_total: number;
}

interface Customer {
    id: number;
    title: string;
    account_code: string;
    tax_number?: string;
    tax_office?: string;
    address?: string;
    phone?: string;
    email?: string;
}

interface Invoice {
    id: number;
    order_number: string;
    order_date: string;
    status: string;
    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    total_amount: number;
    notes?: string;
    customer: Customer;
    items: InvoiceItem[];
}

interface Props {
    invoice: Invoice;
}

const Show: React.FC<Props> = ({ invoice }) => {
    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; class: string }> = {
            invoiced: { label: 'Faturalandı', class: 'info' },
            paid: { label: 'Ödendi', class: 'success' },
            completed: { label: 'Tamamlandı', class: 'success' },
        };
        const { label, class: badgeClass } = statusMap[status] || { label: status, class: 'secondary' };
        return <span className={`badge bg-${badgeClass}`}>{label}</span>;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
        }).format(amount);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('tr-TR');
    };

    return (
        <PortalLayout>
            <Head title={`Fatura - ${invoice.order_number}`} />

            <div className="row mb-4">
                <div className="col">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <Link href={route('portal.invoices.index')} className="btn btn-sm btn-outline-secondary mb-2">
                                <i className="bx bx-arrow-back me-1"></i>
                                Geri
                            </Link>
                            <h2 className="mb-0">Fatura Detayı</h2>
                            <p className="text-muted">{invoice.order_number}</p>
                        </div>
                        <div>
                            <Link
                                href={route('portal.invoices.pdf', invoice.id)}
                                className="btn btn-primary"
                            >
                                <i className="bx bx-download me-2"></i>
                                PDF İndir
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-3">
                {/* Invoice Info */}
                <div className="col-md-8">
                    <div className="card border-0 shadow-sm mb-3">
                        <div className="card-header bg-white d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Fatura Bilgileri</h5>
                            {getStatusBadge(invoice.status)}
                        </div>
                        <div className="card-body">
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="text-muted small">Fatura Numarası</label>
                                    <div className="fw-bold">{invoice.order_number}</div>
                                </div>
                                <div className="col-md-6">
                                    <label className="text-muted small">Fatura Tarihi</label>
                                    <div className="fw-bold">{formatDate(invoice.order_date)}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div className="card border-0 shadow-sm mb-3">
                        <div className="card-header bg-white">
                            <h5 className="mb-0">Müşteri Bilgileri</h5>
                        </div>
                        <div className="card-body">
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="text-muted small">Firma Adı</label>
                                    <div className="fw-bold">{invoice.customer.title}</div>
                                </div>
                                <div className="col-md-6">
                                    <label className="text-muted small">Müşteri Kodu</label>
                                    <div>{invoice.customer.account_code}</div>
                                </div>
                                {invoice.customer.tax_number && (
                                    <>
                                        <div className="col-md-6">
                                            <label className="text-muted small">Vergi Numarası</label>
                                            <div>{invoice.customer.tax_number}</div>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="text-muted small">Vergi Dairesi</label>
                                            <div>{invoice.customer.tax_office}</div>
                                        </div>
                                    </>
                                )}
                                {invoice.customer.address && (
                                    <div className="col-12">
                                        <label className="text-muted small">Adres</label>
                                        <div>{invoice.customer.address}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Products */}
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white">
                            <h5 className="mb-0">Ürünler</h5>
                        </div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Ürün</th>
                                            <th>Miktar</th>
                                            <th>Birim Fiyat</th>
                                            <th>İndirim</th>
                                            <th>KDV</th>
                                            <th className="text-end">Toplam</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoice.items.map((item) => (
                                            <tr key={item.id}>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        {item.product?.primary_image_url && (
                                                            <img
                                                                src={item.product.primary_image_url}
                                                                alt={item.product_name}
                                                                className="rounded me-2"
                                                                style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                                            />
                                                        )}
                                                        <div>
                                                            <div className="fw-bold">{item.product_name}</div>
                                                            <small className="text-muted">{item.product_code}</small>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{item.quantity}</td>
                                                <td>{formatCurrency(item.unit_price)}</td>
                                                <td>{formatCurrency(item.discount_amount)}</td>
                                                <td>{formatCurrency(item.tax_amount)}</td>
                                                <td className="text-end fw-bold">{formatCurrency(item.line_total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary */}
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm sticky-top" style={{ top: '20px' }}>
                        <div className="card-header bg-white">
                            <h5 className="mb-0">Fatura Özeti</h5>
                        </div>
                        <div className="card-body">
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">Ara Toplam</span>
                                <span className="fw-bold">{formatCurrency(invoice.subtotal)}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">İndirim</span>
                                <span className="text-danger">-{formatCurrency(invoice.discount_amount)}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">KDV</span>
                                <span className="fw-bold">{formatCurrency(invoice.tax_amount)}</span>
                            </div>
                            <hr />
                            <div className="d-flex justify-content-between">
                                <span className="fs-5 fw-bold">Genel Toplam</span>
                                <span className="fs-5 fw-bold text-primary">{formatCurrency(invoice.total_amount)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PortalLayout>
    );
};

export default Show;
