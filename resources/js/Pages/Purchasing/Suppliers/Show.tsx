import React from 'react';
import { Head, Link } from '@inertiajs/react';
import Layout from '../../../Layouts';
import { CurrentAccount } from '@/types/purchasing';
import { PageProps } from '@/types';

interface ShowSupplierProps extends PageProps {
    supplier: CurrentAccount;
}

export default function Show({ supplier }: ShowSupplierProps) {
    return (
        <Layout>
            <Head title={`Tedarikçi - ${supplier.title}`} />
            
            <div className="page-content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <h3 className="card-title">Tedarikçi Detayları</h3>
                                    <div className="d-flex gap-2">
                                        <Link
                                            href={route('suppliers.edit', supplier.id)}
                                            className="btn btn-warning"
                                        >
                                            <i className="fas fa-edit me-2"></i>
                                            Düzenle
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

                                <div className="card-body">
                                    <div className="row">
                                        {/* Basic Information */}
                                        <div className="col-md-6">
                                            <h5 className="mb-3">Temel Bilgiler</h5>
                                            <table className="table table-borderless">
                                                <tbody>
                                                    <tr>
                                                        <td width="150"><strong>Başlık:</strong></td>
                                                        <td>{supplier.title}</td>
                                                    </tr>
                                                    <tr>
                                                        <td><strong>Hesap Kodu:</strong></td>
                                                        <td>{supplier.account_code || '-'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td><strong>Kişi Tipi:</strong></td>
                                                        <td>
                                                            {supplier.person_type === 'individual' ? 'Gerçek Kişi' : 'Tüzel Kişi'}
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td><strong>Vergi No:</strong></td>
                                                        <td>{supplier.tax_number || '-'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td><strong>Vergi Dairesi:</strong></td>
                                                        <td>{supplier.tax_office || '-'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td><strong>Para Birimi:</strong></td>
                                                        <td>{supplier.currency || 'TRY'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td><strong>Durum:</strong></td>
                                                        <td>
                                                            <span className={`badge ${supplier.is_active ? 'bg-success' : 'bg-danger'}`}>
                                                                {supplier.is_active ? 'Aktif' : 'Pasif'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Contact Information */}
                                        <div className="col-md-6">
                                            <h5 className="mb-3">İletişim Bilgileri</h5>
                                            <table className="table table-borderless">
                                                <tbody>
                                                    <tr>
                                                        <td width="150"><strong>Telefon 1:</strong></td>
                                                        <td>{supplier.phone_1 || '-'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td><strong>Telefon 2:</strong></td>
                                                        <td>{supplier.phone_2 || '-'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td><strong>Mobil:</strong></td>
                                                        <td>{supplier.mobile || '-'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td><strong>E-posta:</strong></td>
                                                        <td>{supplier.email || '-'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td><strong>İletişim Kişisi:</strong></td>
                                                        <td>{supplier.contact_person || '-'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td><strong>İletişim Telefonu:</strong></td>
                                                        <td>{supplier.contact_phone || '-'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td><strong>İletişim E-posta:</strong></td>
                                                        <td>{supplier.contact_email || '-'}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div className="row mt-4">
                                        {/* Address Information */}
                                        <div className="col-md-6">
                                            <h5 className="mb-3">Adres Bilgileri</h5>
                                            <table className="table table-borderless">
                                                <tbody>
                                                    <tr>
                                                        <td width="150"><strong>Adres:</strong></td>
                                                        <td>{supplier.address || '-'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td><strong>İlçe:</strong></td>
                                                        <td>{supplier.district || '-'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td><strong>Şehir:</strong></td>
                                                        <td>{supplier.city || '-'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td><strong>Ülke:</strong></td>
                                                        <td>{supplier.country || '-'}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Financial Information */}
                                        <div className="col-md-6">
                                            <h5 className="mb-3">Mali Bilgiler</h5>
                                            <table className="table table-borderless">
                                                <tbody>
                                                    <tr>
                                                        <td width="150"><strong>Kredi Limiti:</strong></td>
                                                        <td>
                                                            {supplier.credit_limit ? 
                                                                new Intl.NumberFormat('tr-TR', {
                                                                    style: 'currency',
                                                                    currency: supplier.currency || 'TRY'
                                                                }).format(supplier.credit_limit) : '-'
                                                            }
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td><strong>Ödeme Vadesi:</strong></td>
                                                        <td>{supplier.payment_term_days ? `${supplier.payment_term_days} gün` : '-'}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {supplier.notes && (
                                        <div className="row mt-4">
                                            <div className="col-12">
                                                <h5 className="mb-3">Notlar</h5>
                                                <div className="border rounded p-3">
                                                    {supplier.notes}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}