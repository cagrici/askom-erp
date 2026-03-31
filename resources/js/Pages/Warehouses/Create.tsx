import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import Layout from '../../Layouts';

interface FormData {
    name: string;
    code: string;
    warehouse_type: string;
    address: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    phone: string;
    email: string;
    max_capacity: number | '';
    used_capacity: number | '';
    status: string;
    total_area: number | '';
    storage_area: number | '';
    office_area: number | '';
    height: number | '';
    max_weight: number | '';
    max_volume: number | '';
}

const Create: React.FC = () => {
    const { data, setData, post, processing, errors } = useForm<FormData>({
        name: '',
        code: '',
        warehouse_type: 'main',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'Turkey',
        phone: '',
        email: '',
        max_capacity: '',
        used_capacity: 0,
        status: 'active',
        total_area: '',
        storage_area: '',
        office_area: '',
        height: '',
        max_weight: '',
        max_volume: '',
    });

    const warehouseTypes = [
        { value: 'main', label: 'Ana Depo' },
        { value: 'regional', label: 'Bölge Deposu' },
        { value: 'distribution', label: 'Dağıtım Merkezi' },
        { value: 'retail', label: 'Perakende Deposu' },
        { value: 'production', label: 'Üretim Deposu' },
        { value: 'cross_dock', label: 'Cross-Dock' },
        { value: 'cold_storage', label: 'Soğuk Depo' },
        { value: 'manufacturing', label: 'Üretim' },
        { value: 'hazardous', label: 'Tehlikeli Madde Deposu' },
    ];

    const statusOptions = [
        { value: 'active', label: 'Aktif' },
        { value: 'inactive', label: 'Pasif' },
        { value: 'maintenance', label: 'Bakımda' },
        { value: 'planned', label: 'Planlanmış' },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/warehouses');
    };

    return (
        <Layout>
            <Head title="Yeni Depo Oluştur" />

            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Yeni Depo Oluştur</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link href="/warehouses">Depo Yönetimi</Link></li>
                                        <li className="breadcrumb-item active">Yeni Depo</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="row">
                            {/* Basic Information */}
                            <div className="col-lg-8">
                                <div className="card">
                                    <div className="card-header">
                                        <h5 className="card-title mb-0">Temel Bilgiler</h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="row">
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label">Depo Adı <span className="text-danger">*</span></label>
                                                    <input
                                                        type="text"
                                                        className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                                        value={data.name}
                                                        onChange={(e) => setData('name', e.target.value)}
                                                        placeholder="Depo adını girin"
                                                    />
                                                    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label">Depo Kodu <span className="text-danger">*</span></label>
                                                    <input
                                                        type="text"
                                                        className={`form-control ${errors.code ? 'is-invalid' : ''}`}
                                                        value={data.code}
                                                        onChange={(e) => setData('code', e.target.value)}
                                                        placeholder="Örn: WH-001"
                                                    />
                                                    {errors.code && <div className="invalid-feedback">{errors.code}</div>}
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label">Depo Tipi <span className="text-danger">*</span></label>
                                                    <select
                                                        className={`form-select ${errors.warehouse_type ? 'is-invalid' : ''}`}
                                                        value={data.warehouse_type}
                                                        onChange={(e) => setData('warehouse_type', e.target.value)}
                                                    >
                                                        {warehouseTypes.map((type) => (
                                                            <option key={type.value} value={type.value}>
                                                                {type.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {errors.warehouse_type && <div className="invalid-feedback">{errors.warehouse_type}</div>}
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label">Durum</label>
                                                    <select
                                                        className={`form-select ${errors.status ? 'is-invalid' : ''}`}
                                                        value={data.status}
                                                        onChange={(e) => setData('status', e.target.value)}
                                                    >
                                                        {statusOptions.map((status) => (
                                                            <option key={status.value} value={status.value}>
                                                                {status.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {errors.status && <div className="invalid-feedback">{errors.status}</div>}
                                                </div>
                                            </div>
                                            <div className="col-12">
                                                <div className="mb-3">
                                                    <label className="form-label">Adres <span className="text-danger">*</span></label>
                                                    <textarea
                                                        className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                                                        rows={3}
                                                        value={data.address}
                                                        onChange={(e) => setData('address', e.target.value)}
                                                        placeholder="Depo adresini girin"
                                                    ></textarea>
                                                    {errors.address && <div className="invalid-feedback">{errors.address}</div>}
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label">Şehir <span className="text-danger">*</span></label>
                                                    <input
                                                        type="text"
                                                        className={`form-control ${errors.city ? 'is-invalid' : ''}`}
                                                        value={data.city}
                                                        onChange={(e) => setData('city', e.target.value)}
                                                        placeholder="Şehir"
                                                    />
                                                    {errors.city && <div className="invalid-feedback">{errors.city}</div>}
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label">İl/Bölge</label>
                                                    <input
                                                        type="text"
                                                        className={`form-control ${errors.state ? 'is-invalid' : ''}`}
                                                        value={data.state}
                                                        onChange={(e) => setData('state', e.target.value)}
                                                        placeholder="İl/Bölge"
                                                    />
                                                    {errors.state && <div className="invalid-feedback">{errors.state}</div>}
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label">Posta Kodu</label>
                                                    <input
                                                        type="text"
                                                        className={`form-control ${errors.postal_code ? 'is-invalid' : ''}`}
                                                        value={data.postal_code}
                                                        onChange={(e) => setData('postal_code', e.target.value)}
                                                        placeholder="Posta kodu"
                                                    />
                                                    {errors.postal_code && <div className="invalid-feedback">{errors.postal_code}</div>}
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label">Ülke <span className="text-danger">*</span></label>
                                                    <input
                                                        type="text"
                                                        className={`form-control ${errors.country ? 'is-invalid' : ''}`}
                                                        value={data.country}
                                                        onChange={(e) => setData('country', e.target.value)}
                                                        placeholder="Ülke"
                                                    />
                                                    {errors.country && <div className="invalid-feedback">{errors.country}</div>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Physical Specifications */}
                                <div className="card">
                                    <div className="card-header">
                                        <h5 className="card-title mb-0">Fiziksel Özellikler</h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="row">
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label">Toplam Alan (m²)</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        className={`form-control ${errors.total_area ? 'is-invalid' : ''}`}
                                                        value={data.total_area}
                                                        onChange={(e) => setData('total_area', e.target.value ? parseFloat(e.target.value) : '')}
                                                        placeholder="0.00"
                                                    />
                                                    {errors.total_area && <div className="invalid-feedback">{errors.total_area}</div>}
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label">Depolama Alanı (m²)</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        className={`form-control ${errors.storage_area ? 'is-invalid' : ''}`}
                                                        value={data.storage_area}
                                                        onChange={(e) => setData('storage_area', e.target.value ? parseFloat(e.target.value) : '')}
                                                        placeholder="0.00"
                                                    />
                                                    {errors.storage_area && <div className="invalid-feedback">{errors.storage_area}</div>}
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label">Ofis Alanı (m²)</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        className={`form-control ${errors.office_area ? 'is-invalid' : ''}`}
                                                        value={data.office_area}
                                                        onChange={(e) => setData('office_area', e.target.value ? parseFloat(e.target.value) : '')}
                                                        placeholder="0.00"
                                                    />
                                                    {errors.office_area && <div className="invalid-feedback">{errors.office_area}</div>}
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label">Yükseklik (m)</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        className={`form-control ${errors.height ? 'is-invalid' : ''}`}
                                                        value={data.height}
                                                        onChange={(e) => setData('height', e.target.value ? parseFloat(e.target.value) : '')}
                                                        placeholder="0.00"
                                                    />
                                                    {errors.height && <div className="invalid-feedback">{errors.height}</div>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Contact & Capacity Information */}
                            <div className="col-lg-4">
                                <div className="card">
                                    <div className="card-header">
                                        <h5 className="card-title mb-0">İletişim Bilgileri</h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="mb-3">
                                            <label className="form-label">Telefon</label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                                                value={data.phone}
                                                onChange={(e) => setData('phone', e.target.value)}
                                                placeholder="+90 (XXX) XXX XX XX"
                                            />
                                            {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">E-posta</label>
                                            <input
                                                type="email"
                                                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                placeholder="depo@example.com"
                                            />
                                            {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                                        </div>
                                    </div>
                                </div>

                                <div className="card">
                                    <div className="card-header">
                                        <h5 className="card-title mb-0">Kapasite Bilgileri</h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="mb-3">
                                            <label className="form-label">Maksimum Kapasite <span className="text-danger">*</span></label>
                                            <input
                                                type="number"
                                                className={`form-control ${errors.max_capacity ? 'is-invalid' : ''}`}
                                                value={data.max_capacity}
                                                onChange={(e) => setData('max_capacity', e.target.value ? parseInt(e.target.value) : '')}
                                                placeholder="Maksimum kapasite (adet)"
                                            />
                                            {errors.max_capacity && <div className="invalid-feedback">{errors.max_capacity}</div>}
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Kullanılan Kapasite</label>
                                            <input
                                                type="number"
                                                className={`form-control ${errors.used_capacity ? 'is-invalid' : ''}`}
                                                value={data.used_capacity}
                                                onChange={(e) => setData('used_capacity', e.target.value ? parseInt(e.target.value) : '')}
                                                placeholder="Mevcut kullanım (adet)"
                                            />
                                            {errors.used_capacity && <div className="invalid-feedback">{errors.used_capacity}</div>}
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Maksimum Ağırlık (kg)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className={`form-control ${errors.max_weight ? 'is-invalid' : ''}`}
                                                value={data.max_weight}
                                                onChange={(e) => setData('max_weight', e.target.value ? parseFloat(e.target.value) : '')}
                                                placeholder="0.00"
                                            />
                                            {errors.max_weight && <div className="invalid-feedback">{errors.max_weight}</div>}
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Maksimum Hacim (m³)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className={`form-control ${errors.max_volume ? 'is-invalid' : ''}`}
                                                value={data.max_volume}
                                                onChange={(e) => setData('max_volume', e.target.value ? parseFloat(e.target.value) : '')}
                                                placeholder="0.00"
                                            />
                                            {errors.max_volume && <div className="invalid-feedback">{errors.max_volume}</div>}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="card">
                                    <div className="card-body">
                                        <div className="d-flex gap-2">
                                            <button
                                                type="submit"
                                                className="btn btn-primary flex-fill"
                                                disabled={processing}
                                            >
                                                {processing ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                        Kaydediliyor...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="ri-save-line me-2"></i>
                                                        Kaydet
                                                    </>
                                                )}
                                            </button>
                                            <Link
                                                href="/warehouses"
                                                className="btn btn-secondary"
                                            >
                                                <i className="ri-arrow-left-line me-2"></i>
                                                Geri
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
};

export default Create;
