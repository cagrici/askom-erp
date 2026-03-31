import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import Layout from '../../../Layouts';
import { Expense, ExpenseCategory, CurrentAccount, BankAccount, PaymentMethod, Employee, Location } from '@/types/expense';

interface Props {
    expense: Expense;
    categories: ExpenseCategory[];
    currentAccounts: CurrentAccount[];
    bankAccounts: BankAccount[];
    paymentMethods: PaymentMethod[];
    employees: Employee[];
    locations: Location[];
}

export default function Edit({
    expense,
    categories,
    currentAccounts,
    bankAccounts,
    paymentMethods,
    employees,
    locations
}: Props) {
    const { data, setData, put, processing, errors } = useForm({
        expense_category_id: expense.category?.id || '',
        current_account_id: expense.current_account?.id || '',
        bank_account_id: expense.bank_account?.id || '',
        payment_method_id: expense.payment_method?.id || '',
        employee_id: expense.employee?.id || '',
        location_id: expense.location?.id || '',
        title: expense.title || '',
        description: expense.description || '',
        amount: expense.amount.toString() || '',
        currency: expense.currency || 'TRY',
        exchange_rate: expense.exchange_rate?.toString() || '1',
        vat_rate: expense.vat_rate?.toString() || '18',
        withholding_tax_rate: expense.withholding_tax_rate?.toString() || '0',
        expense_date: expense.expense_date || '',
        invoice_date: expense.invoice_date || '',
        due_date: expense.due_date || '',
        invoice_number: expense.invoice_number || '',
        reference_number: expense.reference_number || '',
        receipt_number: expense.receipt_number || '',
        status: expense.status || 'draft',
        is_recurring: expense.is_recurring || false,
        recurring_frequency: expense.recurring_frequency || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('accounting.expenses.update', expense.id));
    };

    return (
        <Layout>
            <Head title={`Gider Düzenle - ${expense.title}`} />
            <div className="page-content">
            <div className="container-fluid">
                <div className="row">
                    <div className="col-12">
                        <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                            <h4 className="mb-sm-0">Gider Düzenle</h4>
                            <div className="page-title-right">
                                <ol className="breadcrumb m-0">
                                    <li className="breadcrumb-item">
                                        <Link href={route('dashboard')}>Dashboard</Link>
                                    </li>
                                    <li className="breadcrumb-item">
                                        <Link href={route('accounting.expenses.index')}>Giderler</Link>
                                    </li>
                                    <li className="breadcrumb-item">
                                        <Link href={route('accounting.expenses.show', expense.id)}>
                                            {expense.expense_number}
                                        </Link>
                                    </li>
                                    <li className="breadcrumb-item active">Düzenle</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-xl-12">
                        <div className="card">
                            <div className="card-header">
                                <h5 className="card-title mb-0">
                                    <i className="fas fa-edit me-2"></i>
                                    Gider Bilgileri - {expense.expense_number}
                                </h5>
                            </div>
                            <div className="card-body">
                                <form onSubmit={handleSubmit}>
                                    <div className="row">
                                        {/* Basic Information */}
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Gider Başlığı *</label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                                                value={data.title}
                                                onChange={(e) => setData('title', e.target.value)}
                                                placeholder="Gider başlığını giriniz"
                                            />
                                            {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Kategori *</label>
                                            <select
                                                className={`form-select ${errors.expense_category_id ? 'is-invalid' : ''}`}
                                                value={data.expense_category_id}
                                                onChange={(e) => setData('expense_category_id', e.target.value)}
                                            >
                                                <option value="">Kategori seçiniz</option>
                                                {categories.map((category) => (
                                                    <option key={category.id} value={category.id}>
                                                        {category.parent ? `${category.parent.name} > ` : ''}{category.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.expense_category_id && <div className="invalid-feedback">{errors.expense_category_id}</div>}
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Tutar *</label>
                                            <div className="input-group">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className={`form-control ${errors.amount ? 'is-invalid' : ''}`}
                                                    value={data.amount}
                                                    onChange={(e) => setData('amount', e.target.value)}
                                                    placeholder="0.00"
                                                />
                                                <select
                                                    className="form-select"
                                                    style={{ maxWidth: '100px' }}
                                                    value={data.currency}
                                                    onChange={(e) => setData('currency', e.target.value)}
                                                >
                                                    <option value="TRY">TRY</option>
                                                    <option value="USD">USD</option>
                                                    <option value="EUR">EUR</option>
                                                    <option value="GBP">GBP</option>
                                                </select>
                                                {errors.amount && <div className="invalid-feedback">{errors.amount}</div>}
                                            </div>
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Gider Tarihi *</label>
                                            <input
                                                type="date"
                                                className={`form-control ${errors.expense_date ? 'is-invalid' : ''}`}
                                                value={data.expense_date}
                                                onChange={(e) => setData('expense_date', e.target.value)}
                                            />
                                            {errors.expense_date && <div className="invalid-feedback">{errors.expense_date}</div>}
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Tedarikçi/Satıcı</label>
                                            <select
                                                className="form-select"
                                                value={data.current_account_id}
                                                onChange={(e) => setData('current_account_id', e.target.value)}
                                            >
                                                <option value="">Seçiniz</option>
                                                {currentAccounts.map((account) => (
                                                    <option key={account.id} value={account.id}>
                                                        {account.title} ({account.account_code})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Sorumlu Çalışan</label>
                                            <select
                                                className="form-select"
                                                value={data.employee_id}
                                                onChange={(e) => setData('employee_id', e.target.value)}
                                            >
                                                <option value="">Seçiniz</option>
                                                {employees.map((employee) => (
                                                    <option key={employee.id} value={employee.id}>
                                                        {employee.name || `${employee.first_name} ${employee.last_name}`}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Durum</label>
                                            <select
                                                className="form-select"
                                                value={data.status}
                                                onChange={(e) => setData('status', e.target.value)}
                                            >
                                                <option value="draft">Taslak</option>
                                                <option value="pending">Bekliyor</option>
                                                <option value="approved">Onaylandı</option>
                                                <option value="paid">Ödendi</option>
                                                <option value="cancelled">İptal Edildi</option>
                                            </select>
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Fatura Numarası</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={data.invoice_number}
                                                onChange={(e) => setData('invoice_number', e.target.value)}
                                                placeholder="Fatura numarası"
                                            />
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Fatura Tarihi</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={data.invoice_date}
                                                onChange={(e) => setData('invoice_date', e.target.value)}
                                            />
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Vade Tarihi</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={data.due_date}
                                                onChange={(e) => setData('due_date', e.target.value)}
                                            />
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">KDV Oranı (%)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="form-control"
                                                value={data.vat_rate}
                                                onChange={(e) => setData('vat_rate', e.target.value)}
                                                placeholder="18"
                                            />
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Stopaj Oranı (%)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="form-control"
                                                value={data.withholding_tax_rate}
                                                onChange={(e) => setData('withholding_tax_rate', e.target.value)}
                                                placeholder="0"
                                            />
                                        </div>

                                        <div className="col-md-12 mb-3">
                                            <label className="form-label">Açıklama</label>
                                            <textarea
                                                className="form-control"
                                                rows={3}
                                                value={data.description}
                                                onChange={(e) => setData('description', e.target.value)}
                                                placeholder="Gider açıklaması..."
                                            />
                                        </div>

                                        <div className="col-md-12 mb-3">
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="is_recurring"
                                                    checked={data.is_recurring}
                                                    onChange={(e) => setData('is_recurring', e.target.checked)}
                                                />
                                                <label className="form-check-label" htmlFor="is_recurring">
                                                    Tekrarlayan gider
                                                </label>
                                            </div>
                                        </div>

                                        {data.is_recurring && (
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">Tekrarlama Sıklığı</label>
                                                <select
                                                    className="form-select"
                                                    value={data.recurring_frequency}
                                                    onChange={(e) => setData('recurring_frequency', e.target.value)}
                                                >
                                                    <option value="">Seçiniz</option>
                                                    <option value="monthly">Aylık</option>
                                                    <option value="quarterly">3 Aylık</option>
                                                    <option value="yearly">Yıllık</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    <div className="d-flex justify-content-end gap-2">
                                        <Link
                                            href={route('accounting.expenses.show', expense.id)}
                                            className="btn btn-secondary"
                                        >
                                            <i className="fas fa-times me-1"></i>
                                            İptal
                                        </Link>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={processing}
                                        >
                                            {processing ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-1"></span>
                                                    Güncelleniyor...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fas fa-save me-1"></i>
                                                    Güncelle
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </Layout>
    );
}