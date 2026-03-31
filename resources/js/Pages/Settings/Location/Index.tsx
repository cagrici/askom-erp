import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import Layout from '@/Layouts';
import { Location, LocationType, PageProps, PaginatedData, Flash } from '@/types';

interface Props extends PageProps {
    locations: PaginatedData<Location & {
        location_type?: LocationType;
    }>;
    locationTypes: LocationType[];
    cities: string[];
    countries: string[];
    filters: {
        search?: string;
        is_active?: boolean;
        location_type_id?: number;
        city?: string;
        country?: string;
    };
    flash: Flash;
}

export default function LocationIndex({ locations, locationTypes, cities, countries, filters, flash }: Props) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        location_type_id: '',
        description: '',
        address: '',
        city: '',
        state: '',
        country: '',
        postal_code: '',
        phone: '',
        email: '',
        website: '',
        working_hours: '',
        latitude: '',
        longitude: '',
        is_active: true,
        employee_count: '',
        opening_date: ''
    });

    const handleSearch = (field: string, value: any) => {
        const params = { ...filters, [field]: value };
        if (!value) delete params[field];
        router.get('/settings/locations', params, { preserveState: true });
    };

    const handleCreate = () => {
        setFormData({
            name: '',
            code: '',
            location_type_id: '',
            description: '',
            address: '',
            city: '',
            state: '',
            country: '',
            postal_code: '',
            phone: '',
            email: '',
            website: '',
            working_hours: '',
            latitude: '',
            longitude: '',
            is_active: true,
            employee_count: '',
            opening_date: ''
        });
        setShowCreateModal(true);
    };

    const handleEdit = (location: any) => {
        setSelectedLocation(location);
        setFormData({
            name: location.name || '',
            code: location.code || '',
            location_type_id: location.location_type_id?.toString() || '',
            description: location.description || '',
            address: location.address || '',
            city: location.city || '',
            state: location.state || '',
            country: location.country || '',
            postal_code: location.postal_code || '',
            phone: location.phone || '',
            email: location.email || '',
            website: location.website || '',
            working_hours: location.working_hours || '',
            latitude: location.latitude?.toString() || '',
            longitude: location.longitude?.toString() || '',
            is_active: location.is_active ?? true,
            employee_count: location.employee_count?.toString() || '',
            opening_date: location.opening_date || ''
        });
        setShowEditModal(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const data = { ...formData };
        
        if (selectedLocation) {
            router.put(`/settings/locations/${selectedLocation.id}`, data, {
                onSuccess: () => setShowEditModal(false)
            });
        } else {
            router.post('/settings/locations', data, {
                onSuccess: () => setShowCreateModal(false)
            });
        }
    };

    const handleDelete = (location: any) => {
        if (confirm('Bu lokasyonu silmek istediğinizden emin misiniz?')) {
            router.delete(`/settings/locations/${location.id}`);
        }
    };

    const toggleStatus = (location: any) => {
        router.put(`/settings/locations/${location.id}/toggle-status`);
    };

    return (
        <Layout>
            <Head title="Lokasyon Ayarları" />

            <div className="container-fluid">
                <div className="row">
                    <div className="col-12">
                        <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                            <h4 className="mb-sm-0">Lokasyon Ayarları</h4>
                            <div className="page-title-right">
                                <ol className="breadcrumb m-0">
                                    <li className="breadcrumb-item"><Link href="/dashboard">Dashboard</Link></li>
                                    <li className="breadcrumb-item">Ayarlar</li>
                                    <li className="breadcrumb-item active">Lokasyonlar</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>

                {flash.success && (
                    <div className="alert alert-success alert-dismissible fade show" role="alert">
                        {flash.success}
                        <button type="button" className="btn-close" data-bs-dismiss="alert"></button>
                    </div>
                )}

                {flash.error && (
                    <div className="alert alert-danger alert-dismissible fade show" role="alert">
                        {flash.error}
                        <button type="button" className="btn-close" data-bs-dismiss="alert"></button>
                    </div>
                )}

                <div className="row">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <h5 className="card-title mb-0">Lokasyonlar</h5>
                                <button className="btn btn-primary" onClick={handleCreate}>
                                    <i className="ri-add-line me-1"></i> Yeni Lokasyon
                                </button>
                            </div>
                            <div className="card-body">
                                {/* Filters */}
                                <div className="row mb-3">
                                    <div className="col-md-3">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Ara..."
                                            value={filters.search || ''}
                                            onChange={(e) => handleSearch('search', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-md-2">
                                        <select
                                            className="form-select"
                                            value={filters.is_active?.toString() || ''}
                                            onChange={(e) => handleSearch('is_active', e.target.value)}
                                        >
                                            <option value="">Tüm Durumlar</option>
                                            <option value="1">Aktif</option>
                                            <option value="0">Pasif</option>
                                        </select>
                                    </div>
                                    <div className="col-md-2">
                                        <select
                                            className="form-select"
                                            value={filters.location_type_id?.toString() || ''}
                                            onChange={(e) => handleSearch('location_type_id', e.target.value)}
                                        >
                                            <option value="">Tüm Tipler</option>
                                            {locationTypes.map((type) => (
                                                <option key={type.id} value={type.id}>
                                                    {type.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-2">
                                        <select
                                            className="form-select"
                                            value={filters.city || ''}
                                            onChange={(e) => handleSearch('city', e.target.value)}
                                        >
                                            <option value="">Tüm Şehirler</option>
                                            {cities.map((city) => (
                                                <option key={city} value={city}>
                                                    {city}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-3">
                                        <select
                                            className="form-select"
                                            value={filters.country || ''}
                                            onChange={(e) => handleSearch('country', e.target.value)}
                                        >
                                            <option value="">Tüm Ülkeler</option>
                                            {countries.map((country) => (
                                                <option key={country} value={country}>
                                                    {country}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Table */}
                                <div className="table-responsive">
                                    <table className="table table-striped">
                                        <thead>
                                            <tr>
                                                <th>Kod</th>
                                                <th>Adı</th>
                                                <th>Tip</th>
                                                <th>Şehir</th>
                                                <th>Ülke</th>
                                                <th>Çalışan Sayısı</th>
                                                <th>Durum</th>
                                                <th>İşlemler</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {locations.data.map((location) => (
                                                <tr key={location.id}>
                                                    <td>
                                                        <span className="fw-medium">{location.code}</span>
                                                    </td>
                                                    <td>
                                                        <div>
                                                            <div className="fw-medium">{location.name}</div>
                                                            {location.address && (
                                                                <small className="text-muted">{location.address}</small>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {location.location_type ? (
                                                            <span className="badge bg-info">
                                                                {location.location_type.name}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted">-</span>
                                                        )}
                                                    </td>
                                                    <td>{location.city || '-'}</td>
                                                    <td>{location.country || '-'}</td>
                                                    <td>{location.employee_count || '-'}</td>
                                                    <td>
                                                        <div className="form-check form-switch">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                checked={location.is_active}
                                                                onChange={() => toggleStatus(location)}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="btn-group" role="group">
                                                            <button
                                                                className="btn btn-sm btn-outline-primary"
                                                                onClick={() => handleEdit(location)}
                                                            >
                                                                <i className="ri-edit-line"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-outline-danger"
                                                                onClick={() => handleDelete(location)}
                                                            >
                                                                <i className="ri-delete-bin-line"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {locations.links && (
                                    <nav>
                                        <ul className="pagination justify-content-center">
                                            {locations.links.map((link, index) => (
                                                <li
                                                    key={index}
                                                    className={`page-item ${link.active ? 'active' : ''} ${!link.url ? 'disabled' : ''}`}
                                                >
                                                    {link.url ? (
                                                        <Link
                                                            className="page-link"
                                                            href={link.url}
                                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                                        />
                                                    ) : (
                                                        <span
                                                            className="page-link"
                                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                                        />
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </nav>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            <div className={`modal fade ${showCreateModal || showEditModal ? 'show' : ''}`} style={{ display: showCreateModal || showEditModal ? 'block' : 'none' }}>
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">
                                {selectedLocation ? 'Lokasyon Düzenle' : 'Yeni Lokasyon'}
                            </h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setShowEditModal(false);
                                    setSelectedLocation(null);
                                }}
                            ></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Adı *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Kod *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.code}
                                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Lokasyon Tipi *</label>
                                            <select
                                                className="form-select"
                                                value={formData.location_type_id}
                                                onChange={(e) => setFormData({ ...formData, location_type_id: e.target.value })}
                                                required
                                            >
                                                <option value="">Seçiniz</option>
                                                {locationTypes.map((type) => (
                                                    <option key={type.id} value={type.id}>
                                                        {type.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Şehir *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.city}
                                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Ülke *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.country}
                                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Eyalet/İl</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.state}
                                                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Adres</label>
                                    <textarea
                                        className="form-control"
                                        rows={3}
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    ></textarea>
                                </div>
                                <div className="row">
                                    <div className="col-md-4">
                                        <div className="mb-3">
                                            <label className="form-label">Posta Kodu</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.postal_code}
                                                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="mb-3">
                                            <label className="form-label">Telefon</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="mb-3">
                                            <label className="form-label">E-posta</label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Web Sitesi</label>
                                            <input
                                                type="url"
                                                className="form-control"
                                                value={formData.website}
                                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Çalışma Saatleri</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.working_hours}
                                                onChange={(e) => setFormData({ ...formData, working_hours: e.target.value })}
                                                placeholder="09:00-18:00"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-md-4">
                                        <div className="mb-3">
                                            <label className="form-label">Enlem</label>
                                            <input
                                                type="number"
                                                step="any"
                                                className="form-control"
                                                value={formData.latitude}
                                                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="mb-3">
                                            <label className="form-label">Boylam</label>
                                            <input
                                                type="number"
                                                step="any"
                                                className="form-control"
                                                value={formData.longitude}
                                                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="mb-3">
                                            <label className="form-label">Çalışan Sayısı</label>
                                            <input
                                                type="number"
                                                min="0"
                                                className="form-control"
                                                value={formData.employee_count}
                                                onChange={(e) => setFormData({ ...formData, employee_count: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Açılış Tarihi</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={formData.opening_date}
                                                onChange={(e) => setFormData({ ...formData, opening_date: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <div className="form-check form-switch">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={formData.is_active}
                                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                                />
                                                <label className="form-check-label">Aktif</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Açıklama</label>
                                    <textarea
                                        className="form-control"
                                        rows={3}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    ></textarea>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setShowEditModal(false);
                                        setSelectedLocation(null);
                                    }}
                                >
                                    İptal
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {selectedLocation ? 'Güncelle' : 'Kaydet'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </Layout>
    );
}