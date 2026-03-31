import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import Layout from '../../../Layouts';
import { ExpenseCategory, CurrentAccount, BankAccount, PaymentMethod, Employee, Location } from '@/types/expense';

interface Props {
    categories: ExpenseCategory[];
    currentAccounts: CurrentAccount[];
    bankAccounts: BankAccount[];
    paymentMethods: PaymentMethod[];
    employees: Employee[];
    locations: Location[];
    selectedCategory?: number;
    selectedCurrentAccount?: number;
}

export default function Create({
    categories,
    currentAccounts,
    bankAccounts,
    paymentMethods,
    employees,
    locations,
    selectedCategory,
    selectedCurrentAccount
}: Props) {
    const { data, setData, post, processing, errors } = useForm({
        expense_category_id: selectedCategory || '',
        current_account_id: selectedCurrentAccount || '',
        bank_account_id: '',
        payment_method_id: '',
        employee_id: '',
        location_id: '',
        title: '',
        description: '',
        amount: '',
        currency: 'TRY',
        exchange_rate: '1',
        vat_rate: '18',
        withholding_tax_rate: '0',
        expense_date: new Date().toISOString().split('T')[0],
        invoice_date: '',
        due_date: '',
        invoice_number: '',
        reference_number: '',
        receipt_number: '',
        status: 'draft',
        is_recurring: false,
        recurring_frequency: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('accounting.expenses.store'));
    };

    return (
        <Layout>
            <Head title="Yeni Gider" />
            <div className="page-content">
            <div className="container-fluid">
                <div className="row">
                    <div className="col-12">
                        <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                            <h4 className="mb-sm-0">Yeni Gider</h4>
                            <div className="page-title-right">
                                <ol className="breadcrumb m-0">
                                    <li className="breadcrumb-item">
                                        <Link href={route('dashboard')}>Dashboard</Link>
                                    </li>
                                    <li className="breadcrumb-item">
                                        <Link href={route('accounting.expenses.index')}>Giderler</Link>
                                    </li>
                                    <li className="breadcrumb-item active">Yeni Gider</li>
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
                                    <i className="fas fa-receipt me-2"></i>
                                    Gider Bilgileri
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
                                                        {employee.name}
                                                    </option>
                                                ))}
                                            </select>
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
                                    </div>

                                    <div className="d-flex justify-content-end gap-2">
                                        <Link
                                            href={route('accounting.expenses.index')}
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
                                                    Kaydediliyor...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fas fa-save me-1"></i>
                                                    Kaydet
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
