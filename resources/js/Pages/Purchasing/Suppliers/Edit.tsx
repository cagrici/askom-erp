import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import Layout from '../../../Layouts';
import { CurrentAccount } from '@/types/purchasing';
import { PageProps } from '@/types';

interface EditSupplierProps extends PageProps {
    supplier: CurrentAccount;
    personTypes: Array<{
        value: string;
        label: string;
    }>;
}

export default function Edit({ supplier, personTypes }: EditSupplierProps) {
    const { data, setData, put, processing, errors } = useForm({
        title: supplier.title || '',
        account_code: supplier.account_code || '',
        person_type: supplier.person_type || 'corporate',
        tax_number: supplier.tax_number || '',
        tax_office: supplier.tax_office || '',
        phone_1: supplier.phone_1 || '',
        phone_2: supplier.phone_2 || '',
        mobile: supplier.mobile || '',
        email: supplier.email || '',
        address: supplier.address || '',
        district: supplier.district || '',
        city: supplier.city || '',
        country: supplier.country || '',
        contact_person: supplier.contact_person || '',
        contact_title: supplier.contact_title || '',
        contact_phone: supplier.contact_phone || '',
        contact_email: supplier.contact_email || '',
        credit_limit: supplier.credit_limit || '',
        payment_term_days: supplier.payment_term_days || '',
        currency: supplier.currency || 'TRY',
        is_active: supplier.is_active,
        notes: supplier.notes || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('suppliers.update', supplier.id));
    };

    return (
        <Layout>
            <Head title={`Tedarikçi Düzenle - ${supplier.title}`} />
            
            <div className="page-content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <h3 className="card-title">Tedarikçi Düzenle - {supplier.title}</h3>
                                    <div className="d-flex gap-2">
                                        <Link
                                            href={route('suppliers.show', supplier.id)}
                                            className="btn btn-info btn-sm"
                                        >
                                            <i className="fas fa-eye me-2"></i>
                                            Görüntüle
                                        </Link>
                                        <Link
                                            href={route('suppliers.index')}
                                            className="btn btn-secondary"
                                        >
                                            <i className="fas fa-arrow-left me-2"></i>
                                            Geri Dön
                                        </Link>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit}>
                                    <div className="card-body">
                                        {/* Basic Information */}
                                        <div className="row mb-4">
                                            <div className="col-md-6">
                                                <label className="form-label">Başlık <span className="text-danger">*</span></label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                                                    value={data.title}
                                                    onChange={(e) => setData('title', e.target.value)}
                                                    required
                                                />
                                                {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Hesap Kodu</label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${errors.account_code ? 'is-invalid' : ''}`}
                                                    value={data.account_code}
                                                    onChange={(e) => setData('account_code', e.target.value)}
                                                    placeholder="Otomatik oluşur"
                                                />
                                                {errors.account_code && <div className="invalid-feedback">{errors.account_code}</div>}
                                            </div>
                                        </div>

                                        <div className="row mb-4">
                                            <div className="col-md-6">
                                                <label className="form-label">Kişi Tipi <span className="text-danger">*</span></label>
                                                <select
                                                    className={`form-select ${errors.person_type ? 'is-invalid' : ''}`}
                                                    value={data.person_type}
                                                    onChange={(e) => setData('person_type', e.target.value)}
                                                    required
                                                >
                                                    {personTypes.map((type) => (
                                                        <option key={type.value} value={type.value}>
                                                            {type.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.person_type && <div className="invalid-feedback">{errors.person_type}</div>}
                                            </div>
                                            <div className="col-md-3">
                                                <label className="form-label">Para Birimi</label>
                                                <select
                                                    className="form-select"
                                                    value={data.currency}
                                                    onChange={(e) => setData('currency', e.target.value)}
                                                >
                                                    <option value="TRY">TRY</option>
                                                    <option value="USD">USD</option>
                                                    <option value="EUR">EUR</option>
                                                    <option value="GBP">GBP</option>
                                                </select>
                                            </div>
                                            <div className="col-md-3">
                                                <div className="form-check mt-4">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id="is_active"
                                                        checked={data.is_active}
                                                        onChange={(e) => setData('is_active', e.target.checked)}
                                                    />
                                                    <label className="form-check-label" htmlFor="is_active">
                                                        Aktif
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Tax Information */}
                                        <div className="row mb-4">
                                            <div className="col-md-6">
                                                <label className="form-label">Vergi Numarası</label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${errors.tax_number ? 'is-invalid' : ''}`}
                                                    value={data.tax_number}
                                                    onChange={(e) => setData('tax_number', e.target.value)}
                                                    maxLength={11}
                                                />
                                                {errors.tax_number && <div className="invalid-feedback">{errors.tax_number}</div>}
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Vergi Dairesi</label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${errors.tax_office ? 'is-invalid' : ''}`}
                                                    value={data.tax_office}
                                                    onChange={(e) => setData('tax_office', e.target.value)}
                                                />
                                                {errors.tax_office && <div className="invalid-feedback">{errors.tax_office}</div>}
                                            </div>
                                        </div>

                                        {/* Contact Information */}
                                        <div className="row mb-4">
                                            <div className="col-md-4">
                                                <label className="form-label">Telefon 1</label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${errors.phone_1 ? 'is-invalid' : ''}`}
                                                    value={data.phone_1}
                                                    onChange={(e) => setData('phone_1', e.target.value)}
                                                />
                                                {errors.phone_1 && <div className="invalid-feedback">{errors.phone_1}</div>}
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label">Telefon 2</label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${errors.phone_2 ? 'is-invalid' : ''}`}
                                                    value={data.phone_2}
                                                    onChange={(e) => setData('phone_2', e.target.value)}
                                                />
                                                {errors.phone_2 && <div className="invalid-feedback">{errors.phone_2}</div>}
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label">Mobil</label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${errors.mobile ? 'is-invalid' : ''}`}
                                                    value={data.mobile}
                                                    onChange={(e) => setData('mobile', e.target.value)}
                                                />
                                                {errors.mobile && <div className="invalid-feedback">{errors.mobile}</div>}
                                            </div>
                                        </div>

                                        <div className="row mb-4">
                                            <div className="col-md-6">
                                                <label className="form-label">E-posta</label>
                                                <input
                                                    type="email"
                                                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                                    value={data.email}
                                                    onChange={(e) => setData('email', e.target.value)}
                                                />
                                                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                                            </div>
                                        </div>

                                        {/* Address Information */}
                                        <div className="row mb-4">
                                            <div className="col-md-12">
                                                <label className="form-label">Adres</label>
                                                <textarea
                                                    className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                                                    value={data.address}
                                                    onChange={(e) => setData('address', e.target.value)}
                                                    rows={3}
                                                />
                                                {errors.address && <div className="invalid-feedback">{errors.address}</div>}
                                            </div>
                                        </div>

                                        <div className="row mb-4">
                                            <div className="col-md-4">
                                                <label className="form-label">İlçe</label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${errors.district ? 'is-invalid' : ''}`}
                                                    value={data.district}
                                                    onChange={(e) => setData('district', e.target.value)}
                                                />
                                                {errors.district && <div className="invalid-feedback">{errors.district}</div>}
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label">Şehir</label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${errors.city ? 'is-invalid' : ''}`}
                                                    value={data.city}
                                                    onChange={(e) => setData('city', e.target.value)}
                                                />
                                                {errors.city && <div className="invalid-feedback">{errors.city}</div>}
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label">Ülke</label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${errors.country ? 'is-invalid' : ''}`}
                                                    value={data.country}
                                                    onChange={(e) => setData('country', e.target.value)}
                                                />
                                                {errors.country && <div className="invalid-feedback">{errors.country}</div>}
                                            </div>
                                        </div>

                                        {/* Contact Person Information */}
                                        <div className="row mb-4">
                                            <div className="col-md-4">
                                                <label className="form-label">İletişim Kişisi</label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${errors.contact_person ? 'is-invalid' : ''}`}
                                                    value={data.contact_person}
                                                    onChange={(e) => setData('contact_person', e.target.value)}
                                                />
                                                {errors.contact_person && <div className="invalid-feedback">{errors.contact_person}</div>}
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label">İletişim Telefonu</label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${errors.contact_phone ? 'is-invalid' : ''}`}
                                                    value={data.contact_phone}
                                                    onChange={(e) => setData('contact_phone', e.target.value)}
                                                />
                                                {errors.contact_phone && <div className="invalid-feedback">{errors.contact_phone}</div>}
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label">İletişim E-posta</label>
                                                <input
                                                    type="email"
                                                    className={`form-control ${errors.contact_email ? 'is-invalid' : ''}`}
                                                    value={data.contact_email}
                                                    onChange={(e) => setData('contact_email', e.target.value)}
                                                />
                                                {errors.contact_email && <div className="invalid-feedback">{errors.contact_email}</div>}
                                            </div>
                                        </div>

                                        {/* Financial Information */}
                                        <div className="row mb-4">
                                            <div className="col-md-6">
                                                <label className="form-label">Kredi Limiti</label>
                                                <input
                                                    type="number"
                                                    className={`form-control ${errors.credit_limit ? 'is-invalid' : ''}`}
                                                    value={data.credit_limit}
                                                    onChange={(e) => setData('credit_limit', e.target.value)}
                                                    min="0"
                                                    step="0.01"
                                                />
                                                {errors.credit_limit && <div className="invalid-feedback">{errors.credit_limit}</div>}
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Ödeme Vadesi (Gün)</label>
                                                <input
                                                    type="number"
                                                    className={`form-control ${errors.payment_term_days ? 'is-invalid' : ''}`}
                                                    value={data.payment_term_days}
                                                    onChange={(e) => setData('payment_term_days', e.target.value)}
                                                    min="0"
                                                />
                                                {errors.payment_term_days && <div className="invalid-feedback">{errors.payment_term_days}</div>}
                                            </div>
                                        </div>

                                        {/* Notes */}
                                        <div className="row mb-4">
                                            <div className="col-12">
                                                <label className="form-label">Notlar</label>
                                                <textarea
                                                    className="form-control"
                                                    value={data.notes}
                                                    onChange={(e) => setData('notes', e.target.value)}
                                                    rows={3}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card-footer d-flex justify-content-end gap-2">
                                        <Link
                                            href={route('suppliers.index')}
                                            className="btn btn-secondary"
                                        >
                                            İptal
                                        </Link>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={processing}
                                        >
                                            {processing ? (
                                                <>
                                                    <i className="fas fa-spinner fa-spin me-2"></i>
                                                    Güncelleniyor...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fas fa-save me-2"></i>
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
        </Layout>
    );
}