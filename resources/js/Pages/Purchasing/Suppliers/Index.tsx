import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Layout from '../../../Layouts';
import { CurrentAccount } from '@/types/purchasing';
import { PaginatedData, PageProps } from '@/types';

interface SuppliersIndexProps extends PageProps {
    suppliers: PaginatedData<CurrentAccount>;
    filters: {
        search?: string;
        is_active?: boolean;
        person_type?: string;
    };
    personTypes: Array<{
        value: string;
        label: string;
    }>;
}

export default function Index({
    suppliers = { data: [], total: 0, from: 0, to: 0, links: [] },
    filters = {},
    personTypes = []
}: SuppliersIndexProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(
        filters.is_active !== undefined && filters.is_active !== null
            ? String(filters.is_active)
            : ''
    );
    const [selectedPersonType, setSelectedPersonType] = useState(filters.person_type || '');

    const handleFilter = () => {
        router.get(route('suppliers.index'), {
            search: searchTerm,
            is_active: selectedStatus === '' ? undefined : selectedStatus === 'true',
            person_type: selectedPersonType,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedStatus('');
        setSelectedPersonType('');
        router.get(route('suppliers.index'));
    };

    const handleDelete = (supplier: CurrentAccount) => {
        if (confirm(`"${supplier.title}" tedarikçisini silmek istediğinizden emin misiniz?`)) {
            router.delete(route('suppliers.destroy', supplier.id), {
                onSuccess: () => {
                    // Success message will be handled by flash messages
                },
                onError: () => {
                    alert('Tedarikçi silinirken bir hata oluştu.');
                }
            });
        }
    };

    return (
        <Layout>
            <Head title="Tedarikçi Yönetimi" />

            <div className="page-content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <h3 className="card-title">Tedarikçi Yönetimi</h3>
                                    <Link
                                        href={route('suppliers.create')}
                                        className="btn btn-primary"
                                    >
                                        <i className="ri-add-line me-2"></i>
                                        Yeni Tedarikçi
                                    </Link>
                                </div>

                                <div className="card-body">
                                    {/* Filters */}
                                    <div className="row mb-3">
                                        <div className="col-md-4">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Tedarikçi adı, kodu, email ara..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleFilter()}
                                            />
                                        </div>
                                        <div className="col-md-2">
                                            <select
                                                className="form-select"
                                                value={selectedStatus}
                                                onChange={(e) => setSelectedStatus(e.target.value)}
                                            >
                                                <option value="">Tüm Durumlar</option>
                                                <option value="true">Aktif</option>
                                                <option value="false">Pasif</option>
                                            </select>
                                        </div>
                                        <div className="col-md-2">
                                            <select
                                                className="form-select"
                                                value={selectedPersonType}
                                                onChange={(e) => setSelectedPersonType(e.target.value)}
                                            >
                                                <option value="">Tüm Tipler</option>
                                                {personTypes.map(type => (
                                                    <option key={type.value} value={type.value}>
                                                        {type.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="input-group">
                                                <button
                                                    className="btn btn-outline-secondary"
                                                    type="button"
                                                    onClick={handleFilter}
                                                    title="Ara"
                                                >
                                                    <i className="ri-search-line"></i>
                                                </button>
                                                <button
                                                    className="btn btn-outline-secondary"
                                                    type="button"
                                                    onClick={handleClearFilters}
                                                    title="Temizle"
                                                >
                                                    <i className="ri-close-line"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Suppliers Table */}
                                    <div className="table-responsive">
                                        <table className="table table-striped table-hover">
                                            <thead>
                                                <tr>
                                                    <th>Tedarikçi Bilgileri</th>
                                                    <th>Kişi Tipi</th>
                                                    <th>İletişim</th>
                                                    <th>Vergi No</th>
                                                    <th>Şehir</th>
                                                    <th>Kredi Limiti</th>
                                                    <th>Durum</th>
                                                    <th>İşlemler</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {suppliers?.data?.length > 0 ? (
                                                    suppliers.data.map((supplier) => (
                                                        <tr key={supplier.id}>
                                                            <td>
                                                                <div>
                                                                    <div className="fw-medium">
                                                                        <Link
                                                                            href={route('suppliers.show', supplier.id)}
                                                                            className="text-decoration-none"
                                                                        >
                                                                            {supplier.title}
                                                                        </Link>
                                                                    </div>
                                                                    <small className="text-muted">
                                                                        Kod: {supplier.account_code || '-'}
                                                                    </small>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className="badge bg-secondary">
                                                                    {supplier.person_type === 'individual' ? 'Gerçek Kişi' : 'Tüzel Kişi'}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <div>
                                                                    {supplier.phone_1 && (
                                                                        <div className="small">
                                                                            <i className="ri-phone-line me-1"></i>
                                                                            {supplier.phone_1}
                                                                        </div>
                                                                    )}
                                                                    {supplier.email && (
                                                                        <div className="small">
                                                                            <i className="ri-mail-line me-1"></i>
                                                                            {supplier.email}
                                                                        </div>
                                                                    )}
                                                                    {supplier.contact_person && (
                                                                        <div className="small">
                                                                            <i className="ri-user-line me-1"></i>
                                                                            {supplier.contact_person}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td>{supplier.tax_number || '-'}</td>
                                                            <td>{supplier.city || '-'}</td>
                                                            <td>
                                                                {supplier.credit_limit ? (
                                                                    new Intl.NumberFormat('tr-TR', {
                                                                        style: 'currency',
                                                                        currency: supplier.currency || 'TRY'
                                                                    }).format(supplier.credit_limit)
                                                                ) : '-'}
                                                            </td>
                                                            <td>
                                                                <span className={`badge ${supplier.is_active ? 'bg-success' : 'bg-danger'}`}>
                                                                    {supplier.is_active ? 'Aktif' : 'Pasif'}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <div className="btn-group" role="group">
                                                                    <Link
                                                                        href={route('suppliers.show', supplier.id)}
                                                                        className="btn btn-sm btn-outline-primary"
                                                                        title="Görüntüle"
                                                                    >
                                                                        <i className="ri-eye-line"></i>
                                                                    </Link>
                                                                    <Link
                                                                        href={route('suppliers.edit', supplier.id)}
                                                                        className="btn btn-sm btn-outline-warning"
                                                                        title="Düzenle"
                                                                    >
                                                                        <i className="ri-pencil-line"></i>
                                                                    </Link>
                                                                    <button
                                                                        className="btn btn-sm btn-outline-danger"
                                                                        title="Sil"
                                                                        onClick={() => handleDelete(supplier)}
                                                                    >
                                                                        <i className="ri-delete-bin-line"></i>
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={8} className="text-center py-4">
                                                            <div className="text-muted">
                                                                <i className="ri-inbox-line fa-3x mb-3"></i>
                                                                <p>Henüz tedarikçi bulunmuyor.</p>
                                                                <Link
                                                                    href={route('suppliers.create')}
                                                                    className="btn btn-primary"
                                                                >
                                                                    İlk Tedarikçiyi Oluştur
                                                                </Link>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    {suppliers?.data?.length > 0 && (
                                        <div className="d-flex justify-content-between align-items-center mt-3">
                                            <div className="text-muted">
                                                {suppliers?.from || 0} - {suppliers?.to || 0} arası, toplam {suppliers?.total || 0} kayıt
                                            </div>
                                            {suppliers?.links && (
                                                <nav>
                                                    <div className="d-flex">
                                                        {suppliers.links.map((link, index) => (
                                                            <button
                                                                key={index}
                                                                className={`btn btn-sm ${
                                                                    link.active
                                                                        ? 'btn-primary'
                                                                        : link.url
                                                                            ? 'btn-outline-primary'
                                                                            : 'btn-outline-secondary disabled'
                                                                } mx-1`}
                                                                onClick={() => link.url && router.get(link.url)}
                                                                disabled={!link.url}
                                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                                            />
                                                        ))}
                                                    </div>
                                                </nav>
                                            )}
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
