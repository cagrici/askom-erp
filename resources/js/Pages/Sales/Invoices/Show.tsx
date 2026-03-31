import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Card, Table, Button, Row, Col, Badge, Dropdown } from 'react-bootstrap';
import Layout from '@/Layouts';
import { FiArrowLeft, FiPrinter, FiDownload, FiCheck, FiX } from 'react-icons/fi';

interface CurrentAccount {
    id: number;
    title: string;
    account_code: string;
    tax_office?: string;
    tax_number?: string;
}

interface SalesOrder {
    id: number;
    order_number: string;
}

interface DeliveryAddress {
    id: number;
    address_name: string;
    address: string;
    city: string;
    district: string;
    postal_code?: string;
}

interface Product {
    id: number;
    product_code: string;
    product_name: string;
}

interface InvoiceItem {
    id: number;
    product?: Product;
    product_code: string;
    product_name: string;
    description?: string;
    quantity: number;
    unit: string;
    unit_price: number;
    discount_rate: number;
    discount_amount: number;
    vat_rate: number;
    vat_amount: number;
    line_total: number;
    line_total_with_vat: number;
}

interface Invoice {
    id: number;
    logo_logicalref?: string;
    invoice_type: string;
    invoice_series: string;
    invoice_number: number;
    formatted_number: string;
    invoice_date: string;
    invoice_time: string;

    // Customer info
    customer_name: string;
    customer_code?: string;
    tax_office?: string;
    tax_number?: string;

    // Amounts
    net_total: number;
    discount_total: number;
    vat_total: number;
    gross_total: number;
    currency_code: string;
    exchange_rate: number;

    // Addresses
    billing_address?: string;
    shipping_address?: string;

    // Related documents
    waybill_number?: string;

    // Status
    status: string;
    status_label: string;
    status_badge: string;
    notes?: string;

    // Sync info
    logo_synced_at?: string;
    synced_by?: string;
    printed_at?: string;
    printed_by?: string;

    // Relationships
    current_account?: CurrentAccount;
    sales_order?: SalesOrder;
    delivery_address?: DeliveryAddress;
    items: InvoiceItem[];

    created_at: string;
    updated_at: string;
}

interface Props {
    invoice: Invoice;
}

export default function Show({ invoice }: Props) {
    const formatCurrency = (amount: number, currency: string = 'TRY') => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR');
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('tr-TR');
    };

    return (
        <Layout>
            <Head title={`Fatura ${invoice.formatted_number}`} />

            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Header */}
                    <Row className="mb-4">
                    <Col>
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <Link
                                    href={route('sales.invoices.index')}
                                    className="btn btn-link text-decoration-none p-0 mb-2"
                                >
                                    <FiArrowLeft className="me-2" />
                                    Faturalara Dön
                                </Link>
                                <h2 className="mb-1">Fatura Detayı</h2>
                                <p className="text-muted mb-0">{invoice.formatted_number}</p>
                            </div>
                            <div className="d-flex gap-2">
                                <Button
                                    variant="outline-primary"
                                    href={route('sales.invoices.pdf', invoice.id)}
                                    target="_blank"
                                >
                                    <FiPrinter className="me-2" />
                                    PDF Yazdır
                                </Button>
                                {invoice.status !== 'paid' && (
                                    <Button
                                        variant="success"
                                        onClick={() => {
                                            if (confirm('Fatura ödendi olarak işaretlensin mi?')) {
                                                router.patch(route('sales.invoices.mark-paid', invoice.id));
                                            }
                                        }}
                                    >
                                        <FiCheck className="me-2" />
                                        Ödendi Olarak İşaretle
                                    </Button>
                                )}
                                {invoice.status !== 'cancelled' && (
                                    <Button
                                        variant="danger"
                                        onClick={() => {
                                            const notes = prompt('İptal nedeni:');
                                            if (notes) {
                                                router.patch(route('sales.invoices.cancel', invoice.id), { notes });
                                            }
                                        }}
                                    >
                                        <FiX className="me-2" />
                                        İptal Et
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Col>
                </Row>

                <Row>
                    {/* Left Column */}
                    <Col lg={8}>
                        {/* Invoice Items */}
                        <Card className="mb-4">
                            <Card.Header>
                                <h5 className="mb-0">Fatura Kalemleri</h5>
                            </Card.Header>
                            <Card.Body>
                                <div className="table-responsive">
                                    <Table>
                                        <thead>
                                            <tr>
                                                <th>Ürün Kodu</th>
                                                <th>Ürün Adı</th>
                                                <th className="text-end">Miktar</th>
                                                <th className="text-end">Birim Fiyat</th>
                                                <th className="text-end">İndirim</th>
                                                <th className="text-end">KDV %</th>
                                                <th className="text-end">Toplam</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {invoice.items.map((item) => (
                                                <tr key={item.id}>
                                                    <td>{item.product_code}</td>
                                                    <td>
                                                        <div>{item.product_name}</div>
                                                        {item.description && (
                                                            <small className="text-muted">{item.description}</small>
                                                        )}
                                                    </td>
                                                    <td className="text-end">
                                                        {item.quantity} {item.unit}
                                                    </td>
                                                    <td className="text-end">
                                                        {formatCurrency(item.unit_price, invoice.currency_code)}
                                                    </td>
                                                    <td className="text-end">
                                                        {item.discount_rate > 0 && (
                                                            <>
                                                                %{item.discount_rate}<br />
                                                                <small className="text-muted">
                                                                    {formatCurrency(item.discount_amount, invoice.currency_code)}
                                                                </small>
                                                            </>
                                                        )}
                                                    </td>
                                                    <td className="text-end">%{item.vat_rate}</td>
                                                    <td className="text-end">
                                                        <strong>
                                                            {formatCurrency(item.line_total_with_vat, invoice.currency_code)}
                                                        </strong>
                                                        <br />
                                                        <small className="text-muted">
                                                            KDV: {formatCurrency(item.vat_amount, invoice.currency_code)}
                                                        </small>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <td colSpan={6} className="text-end"><strong>Ara Toplam:</strong></td>
                                                <td className="text-end">
                                                    <strong>{formatCurrency(invoice.net_total, invoice.currency_code)}</strong>
                                                </td>
                                            </tr>
                                            {invoice.discount_total > 0 && (
                                                <tr>
                                                    <td colSpan={6} className="text-end">İndirim:</td>
                                                    <td className="text-end text-danger">
                                                        -{formatCurrency(invoice.discount_total, invoice.currency_code)}
                                                    </td>
                                                </tr>
                                            )}
                                            <tr>
                                                <td colSpan={6} className="text-end">KDV:</td>
                                                <td className="text-end">
                                                    {formatCurrency(invoice.vat_total, invoice.currency_code)}
                                                </td>
                                            </tr>
                                            <tr className="table-active">
                                                <td colSpan={6} className="text-end"><strong>Genel Toplam:</strong></td>
                                                <td className="text-end">
                                                    <h5 className="mb-0 text-primary">
                                                        {formatCurrency(invoice.gross_total, invoice.currency_code)}
                                                    </h5>
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </Table>
                                </div>
                            </Card.Body>
                        </Card>

                        {/* Addresses */}
                        <Row>
                            {invoice.billing_address && (
                                <Col md={6}>
                                    <Card className="mb-4">
                                        <Card.Header>
                                            <h6 className="mb-0">Fatura Adresi</h6>
                                        </Card.Header>
                                        <Card.Body>
                                            <pre className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                                                {invoice.billing_address}
                                            </pre>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            )}
                            {invoice.shipping_address && (
                                <Col md={6}>
                                    <Card className="mb-4">
                                        <Card.Header>
                                            <h6 className="mb-0">Sevk Adresi</h6>
                                        </Card.Header>
                                        <Card.Body>
                                            <pre className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                                                {invoice.shipping_address}
                                            </pre>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            )}
                        </Row>

                        {/* Notes */}
                        {invoice.notes && (
                            <Card className="mb-4">
                                <Card.Header>
                                    <h6 className="mb-0">Notlar</h6>
                                </Card.Header>
                                <Card.Body>
                                    <p className="mb-0">{invoice.notes}</p>
                                </Card.Body>
                            </Card>
                        )}
                    </Col>

                    {/* Right Column */}
                    <Col lg={4}>
                        {/* Invoice Info */}
                        <Card className="mb-4">
                            <Card.Header>
                                <h6 className="mb-0">Fatura Bilgileri</h6>
                            </Card.Header>
                            <Card.Body>
                                <dl className="row mb-0">
                                    <dt className="col-sm-5">Fatura No:</dt>
                                    <dd className="col-sm-7">{invoice.formatted_number}</dd>

                                    <dt className="col-sm-5">Tarih:</dt>
                                    <dd className="col-sm-7">{formatDate(invoice.invoice_date)}</dd>

                                    <dt className="col-sm-5">Saat:</dt>
                                    <dd className="col-sm-7">{invoice.invoice_time}</dd>

                                    <dt className="col-sm-5">Tür:</dt>
                                    <dd className="col-sm-7">
                                        <Badge bg="secondary">{invoice.invoice_type}</Badge>
                                    </dd>

                                    <dt className="col-sm-5">Durum:</dt>
                                    <dd className="col-sm-7">
                                        <Badge bg={invoice.status_badge}>{invoice.status_label}</Badge>
                                    </dd>

                                    <dt className="col-sm-5">Para Birimi:</dt>
                                    <dd className="col-sm-7">{invoice.currency_code}</dd>

                                    {invoice.exchange_rate !== 1 && (
                                        <>
                                            <dt className="col-sm-5">Döviz Kuru:</dt>
                                            <dd className="col-sm-7">{invoice.exchange_rate}</dd>
                                        </>
                                    )}

                                    {invoice.waybill_number && (
                                        <>
                                            <dt className="col-sm-5">İrsaliye No:</dt>
                                            <dd className="col-sm-7">{invoice.waybill_number}</dd>
                                        </>
                                    )}

                                    {invoice.logo_logicalref && (
                                        <>
                                            <dt className="col-sm-5">Logo Ref:</dt>
                                            <dd className="col-sm-7">
                                                <code>{invoice.logo_logicalref}</code>
                                            </dd>
                                        </>
                                    )}
                                </dl>
                            </Card.Body>
                        </Card>

                        {/* Customer Info */}
                        <Card className="mb-4">
                            <Card.Header>
                                <h6 className="mb-0">Müşteri Bilgileri</h6>
                            </Card.Header>
                            <Card.Body>
                                <dl className="row mb-0">
                                    <dt className="col-sm-5">Müşteri Adı:</dt>
                                    <dd className="col-sm-7">
                                        {invoice.current_account ? (
                                            <Link href={route('accounting.current-accounts.show', invoice.current_account.id)}>
                                                {invoice.customer_name}
                                            </Link>
                                        ) : (
                                            invoice.customer_name
                                        )}
                                    </dd>

                                    {invoice.customer_code && (
                                        <>
                                            <dt className="col-sm-5">Müşteri Kodu:</dt>
                                            <dd className="col-sm-7">{invoice.customer_code}</dd>
                                        </>
                                    )}

                                    {invoice.tax_office && (
                                        <>
                                            <dt className="col-sm-5">Vergi Dairesi:</dt>
                                            <dd className="col-sm-7">{invoice.tax_office}</dd>
                                        </>
                                    )}

                                    {invoice.tax_number && (
                                        <>
                                            <dt className="col-sm-5">Vergi No:</dt>
                                            <dd className="col-sm-7">{invoice.tax_number}</dd>
                                        </>
                                    )}
                                </dl>
                            </Card.Body>
                        </Card>

                        {/* Related Documents */}
                        {invoice.sales_order && (
                            <Card className="mb-4">
                                <Card.Header>
                                    <h6 className="mb-0">İlgili Belgeler</h6>
                                </Card.Header>
                                <Card.Body>
                                    <dl className="row mb-0">
                                        <dt className="col-sm-5">Satış Siparişi:</dt>
                                        <dd className="col-sm-7">
                                            <Link href={route('sales.orders.show', invoice.sales_order.id)}>
                                                {invoice.sales_order.order_number}
                                            </Link>
                                        </dd>
                                    </dl>
                                </Card.Body>
                            </Card>
                        )}

                        {/* Sync Info */}
                        {invoice.logo_synced_at && (
                            <Card className="mb-4">
                                <Card.Header>
                                    <h6 className="mb-0">Senkronizasyon Bilgisi</h6>
                                </Card.Header>
                                <Card.Body>
                                    <dl className="row mb-0">
                                        <dt className="col-sm-5">Son Senkronizasyon:</dt>
                                        <dd className="col-sm-7">{formatDateTime(invoice.logo_synced_at)}</dd>

                                        {invoice.synced_by && (
                                            <>
                                                <dt className="col-sm-5">Senkronize Eden:</dt>
                                                <dd className="col-sm-7">{invoice.synced_by}</dd>
                                            </>
                                        )}

                                        {invoice.printed_at && (
                                            <>
                                                <dt className="col-sm-5">Yazdırma:</dt>
                                                <dd className="col-sm-7">{formatDateTime(invoice.printed_at)}</dd>
                                            </>
                                        )}
                                    </dl>
                                </Card.Body>
                            </Card>
                        )}

                        {/* Timestamps */}
                        <Card>
                            <Card.Header>
                                <h6 className="mb-0">Sistem Bilgileri</h6>
                            </Card.Header>
                            <Card.Body>
                                <dl className="row mb-0">
                                    <dt className="col-sm-5">Oluşturma:</dt>
                                    <dd className="col-sm-7">
                                        <small>{formatDateTime(invoice.created_at)}</small>
                                    </dd>

                                    <dt className="col-sm-5">Son Güncelleme:</dt>
                                    <dd className="col-sm-7">
                                        <small>{formatDateTime(invoice.updated_at)}</small>
                                    </dd>
                                </dl>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
                </div>
            </div>
        </Layout>
    );
}
