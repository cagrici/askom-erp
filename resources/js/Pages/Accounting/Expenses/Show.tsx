import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Layout from '../../../Layouts';
import { Expense } from '@/types/expense';

interface Props {
    expense: Expense;
}

export default function Show({ expense }: Props) {
    const handleApprove = () => {
        if (confirm('Bu gideri onaylamak istediğinizden emin misiniz?')) {
            router.patch(route('accounting.expenses.approve', expense.id));
        }
    };

    const handleReject = () => {
        const reason = prompt('Red nedeni:');
        if (reason) {
            router.patch(route('accounting.expenses.reject', expense.id), { reason });
        }
    };

    const handleMarkAsPaid = () => {
        if (confirm('Bu gideri ödenmiş olarak işaretlemek istediğinizden emin misiniz?')) {
            router.patch(route('accounting.expenses.mark-paid', expense.id));
        }
    };

    const handleDelete = () => {
        if (confirm('Bu gideri silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
            router.delete(route('accounting.expenses.destroy', expense.id));
        }
    };

    return (
        <Layout>
            <Head title={`Gider: ${expense.expense_number}`} />
            <div className="page-content">
            <div className="container-fluid">
                <div className="row">
                    <div className="col-12">
                        <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                            <h4 className="mb-sm-0">Gider Detayı</h4>
                            <div className="page-title-right">
                                <ol className="breadcrumb m-0">
                                    <li className="breadcrumb-item">
                                        <Link href={route('dashboard')}>Dashboard</Link>
                                    </li>
                                    <li className="breadcrumb-item">
                                        <Link href={route('accounting.expenses.index')}>Giderler</Link>
                                    </li>
                                    <li className="breadcrumb-item active">{expense.expense_number}</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-xl-8">
                        <div className="card">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <h5 className="card-title mb-0">
                                    <i className="fas fa-receipt me-2"></i>
                                    {expense.expense_number}
                                </h5>
                                <div className="d-flex gap-2">
                                    {expense.can_edit && (
                                        <Link
                                            href={route('accounting.expenses.edit', expense.id)}
                                            className="btn btn-outline-primary btn-sm"
                                        >
                                            <i className="fas fa-edit me-1"></i>
                                            Düzenle
                                        </Link>
                                    )}
                                    {expense.can_approve && (
                                        <button
                                            onClick={handleApprove}
                                            className="btn btn-success btn-sm"
                                        >
                                            <i className="fas fa-check me-1"></i>
                                            Onayla
                                        </button>
                                    )}
                                    {expense.can_pay && (
                                        <button
                                            onClick={handleMarkAsPaid}
                                            className="btn btn-info btn-sm"
                                        >
                                            <i className="fas fa-money-bill me-1"></i>
                                            Ödendi İşaretle
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="card-body">
                                <div className="row">
                                    <div className="col-md-6">
                                        <h6 className="text-muted">Temel Bilgiler</h6>
                                        <table className="table table-borderless table-sm">
                                            <tbody>
                                                <tr>
                                                    <td className="fw-medium" style={{ width: '150px' }}>Başlık:</td>
                                                    <td>{expense.title}</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Kategori:</td>
                                                    <td>
                                                        <span
                                                            className="badge rounded-pill px-2 py-1"
                                                            style={{
                                                                backgroundColor: expense.category?.color + '20',
                                                                color: expense.category?.color
                                                            }}
                                                        >
                                                            {expense.category?.name || 'Kategorisiz'}
                                                        </span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Gider Tarihi:</td>
                                                    <td>{new Date(expense.expense_date).toLocaleDateString('tr-TR')}</td>
                                                </tr>
                                                {expense.due_date && (
                                                    <tr>
                                                        <td className="fw-medium">Vade Tarihi:</td>
                                                        <td>
                                                            {new Date(expense.due_date).toLocaleDateString('tr-TR')}
                                                            {expense.is_overdue && (
                                                                <span className="badge bg-danger ms-2">
                                                                    {expense.days_overdue} gün gecikme
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )}
                                                {expense.current_account && (
                                                    <tr>
                                                        <td className="fw-medium">Tedarikçi:</td>
                                                        <td>{expense.current_account.title}</td>
                                                    </tr>
                                                )}
                                                {expense.employee && (
                                                    <tr>
                                                        <td className="fw-medium">Sorumlu:</td>
                                                        <td>{expense.employee.name}</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="col-md-6">
                                        <h6 className="text-muted">Tutar Bilgileri</h6>
                                        <table className="table table-borderless table-sm">
                                            <tbody>
                                                <tr>
                                                    <td className="fw-medium" style={{ width: '150px' }}>Ana Tutar:</td>
                                                    <td className="fw-bold">{expense.formatted_amount}</td>
                                                </tr>
                                                {expense.vat_amount > 0 && (
                                                    <tr>
                                                        <td className="fw-medium">KDV (%{expense.vat_rate}):</td>
                                                        <td>{expense.vat_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {expense.currency}</td>
                                                    </tr>
                                                )}
                                                {expense.withholding_tax_amount > 0 && (
                                                    <tr>
                                                        <td className="fw-medium">Stopaj (%{expense.withholding_tax_rate}):</td>
                                                        <td className="text-danger">-{expense.withholding_tax_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {expense.currency}</td>
                                                    </tr>
                                                )}
                                                <tr className="border-top">
                                                    <td className="fw-bold">Net Tutar:</td>
                                                    <td className="fw-bold text-primary">{expense.formatted_net_amount}</td>
                                                </tr>
                                                {expense.currency !== 'TRY' && (
                                                    <tr>
                                                        <td className="fw-medium">TL Karşılığı:</td>
                                                        <td>{expense.amount_in_base_currency.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TRY</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {expense.description && (
                                    <div className="mt-3">
                                        <h6 className="text-muted">Açıklama</h6>
                                        <p className="text-muted">{expense.description}</p>
                                    </div>
                                )}

                                {expense.items && expense.items.length > 0 && (
                                    <div className="mt-4">
                                        <h6 className="text-muted">Gider Kalemleri</h6>
                                        <div className="table-responsive">
                                            <table className="table table-sm">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>Açıklama</th>
                                                        <th className="text-center">Miktar</th>
                                                        <th className="text-end">Birim Fiyat</th>
                                                        <th className="text-end">Toplam</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {expense.items.map((item) => (
                                                        <tr key={item.id}>
                                                            <td>{item.description}</td>
                                                            <td className="text-center">{item.quantity}</td>
                                                            <td className="text-end">{item.formatted_unit_price}</td>
                                                            <td className="text-end fw-medium">{item.formatted_total_amount}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="col-xl-4">
                        <div className="card">
                            <div className="card-header">
                                <h6 className="card-title mb-0">Durum Bilgileri</h6>
                            </div>
                            <div className="card-body">
                                <div className="mb-3">
                                    <label className="form-label text-muted small">Genel Durum</label>
                                    <div>
                                        <span className={`badge bg-${expense.status_badge_color} fs-6`}>
                                            {expense.status_text}
                                        </span>
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label text-muted small">Onay Durumu</label>
                                    <div>{expense.approval_status_text}</div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label text-muted small">Ödeme Durumu</label>
                                    <div>{expense.payment_status_text}</div>
                                </div>
                                {expense.is_recurring && (
                                    <div className="mb-3">
                                        <label className="form-label text-muted small">Tekrarlama</label>
                                        <div>
                                            <span className="badge bg-info">
                                                {expense.recurring_frequency === 'monthly' ? 'Aylık' :
                                                 expense.recurring_frequency === 'quarterly' ? 'Üç Aylık' :
                                                 expense.recurring_frequency === 'yearly' ? 'Yıllık' : 'Bilinmiyor'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h6 className="card-title mb-0">İşlemler</h6>
                            </div>
                            <div className="card-body">
                                <div className="d-grid gap-2">
                                    {expense.approval_status === 'pending' && (
                                        <>
                                            <button
                                                onClick={handleApprove}
                                                className="btn btn-success btn-sm"
                                            >
                                                <i className="fas fa-check me-1"></i>
                                                Onayla
                                            </button>
                                            <button
                                                onClick={handleReject}
                                                className="btn btn-outline-danger btn-sm"
                                            >
                                                <i className="fas fa-times me-1"></i>
                                                Reddet
                                            </button>
                                        </>
                                    )}

                                    <Link
                                        href={route('accounting.expenses.duplicate', expense.id)}
                                        method="post"
                                        className="btn btn-outline-secondary btn-sm"
                                    >
                                        <i className="fas fa-copy me-1"></i>
                                        Kopyala
                                    </Link>

                                    {expense.can_delete && (
                                        <button
                                            onClick={handleDelete}
                                            className="btn btn-outline-danger btn-sm"
                                        >
                                            <i className="fas fa-trash me-1"></i>
                                            Sil
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </Layout>
    );
}
