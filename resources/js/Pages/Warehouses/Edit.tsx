import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import Layout from '../../Layouts';

interface Warehouse {
    id: number;
    name: string;
    code: string;
    warehouse_type: string;
    address: string;
    city: string;
    postal_code: string;
    country: string;
    phone?: string;
    email?: string;
    manager_name?: string;
    capacity?: number;
    area_sqm?: number;
    status: string;
    description?: string;
}

interface Props {
    warehouse: Warehouse;
}

const Edit: React.FC<Props> = ({ warehouse }) => {
    const { data, setData, put, processing, errors } = useForm({
        name: warehouse.name,
        code: warehouse.code,
        warehouse_type: warehouse.warehouse_type,
        address: warehouse.address,
        city: warehouse.city,
        postal_code: warehouse.postal_code,
        country: warehouse.country,
        phone: warehouse.phone || '',
        email: warehouse.email || '',
        manager_name: warehouse.manager_name || '',
        capacity: warehouse.capacity || '',
        area_sqm: warehouse.area_sqm || '',
        status: warehouse.status,
        description: warehouse.description || ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('warehouses.update', warehouse.id));
    };

    const warehouseTypes = [
        { value: 'main', label: 'Ana Depo' },
        { value: 'regional', label: 'Bölgesel' },
        { value: 'distribution', label: 'Dağıtım' },
        { value: 'retail', label: 'Perakende' },
        { value: 'production', label: 'Üretim' },
        { value: 'cross_dock', label: 'Cross Dock' },
        { value: 'hazardous', label: 'Tehlikeli Madde' },
        { value: 'manufacturing', label: 'Üretim' },
        { value: 'cold_storage', label: 'Soğuk Hava' }
    ];


    const statuses = [
        { value: 'active', label: 'Aktif' },
        { value: 'inactive', label: 'İnaktif' },
        { value: 'maintenance', label: 'Bakımda' },
        { value: 'closed', label: 'Kapalı' }
    ];

    return (
        <Layout>
            <Head title={`${warehouse.name} - Düzenle`} />

            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Depo Düzenle</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link href="/warehouses">Depo Yönetimi</Link></li>
                                        <li className="breadcrumb-item active">Düzenle</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Edit Form */}
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">Depo Bilgileri</h5>
                                </div>
                                <div className="card-body">
                                    <form onSubmit={handleSubmit}>
                                        <div className="row">
                                            <div className="col-lg-6">
                                                <div className="mb-3">
                                                    <label htmlFor="name" className="form-label">
                                                        Depo Adı <span className="text-danger">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        id="name"
                                                        className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                                        value={data.name}
                                                        onChange={(e) => setData('name', e.target.value)}
                                                        placeholder="Depo adını giriniz"
                                                        required
                                                    />
                                                    {errors.name && (
                                                        <div className="invalid-feedback">{errors.name}</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="col-lg-6">
                                                <div className="mb-3">
                                                    <label htmlFor="code" className="form-label">
                                                        Depo Kodu <span className="text-danger">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        id="code"
                                                        className={`form-control ${errors.code ? 'is-invalid' : ''}`}
                                                        value={data.code}
                                                        onChange={(e) => setData('code', e.target.value)}
                                                        placeholder="Depo kodunu giriniz"
                                                        required
                                                    />
                                                    {errors.code && (
                                                        <div className="invalid-feedback">{errors.code}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="col-lg-6">
                                                <div className="mb-3">
                                                    <label htmlFor="warehouse_type" className="form-label">
                                                        Depo Tipi <span className="text-danger">*</span>
                                                    </label>
                                                    <select
                                                        id="warehouse_type"
                                                        className={`form-select ${errors.warehouse_type ? 'is-invalid' : ''}`}
                                                        value={data.warehouse_type}
                                                        onChange={(e) => setData('warehouse_type', e.target.value)}
                                                        required
                                                    >
                                                        <option value="">Depo tipi seçin</option>
                                                        {warehouseTypes.map(type => (
                                                            <option key={type.value} value={type.value}>
                                                                {type.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {errors.warehouse_type && (
                                                        <div className="invalid-feedback">{errors.warehouse_type}</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="col-lg-6">
                                                <div className="mb-3">
                                                    <label htmlFor="warehouseStatus" className="form-label">
                                                        Durum <span className="text-danger">*</span>
                                                    </label>
                                                    <select
                                                        id="warehouseStatus"
                                                        className={`form-select ${errors.status ? 'is-invalid' : ''}`}
                                                        value={data.status}
                                                        onChange={(e) => setData('status', e.target.value)}
                                                        required
                                                    >
                                                        {statuses.map(status => (
                                                            <option key={status.value} value={status.value}>
                                                                {status.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {errors.status && (
                                                        <div className="invalid-feedback">{errors.status}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="col-lg-12">
                                                <div className="mb-3">
                                                    <label htmlFor="address" className="form-label">
                                                        Adres <span className="text-danger">*</span>
                                                    </label>
                                                    <textarea
                                                        id="address"
                                                        className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                                                        rows={3}
                                                        value={data.address}
                                                        onChange={(e) => setData('address', e.target.value)}
                                                        placeholder="Depo adresini giriniz"
                                                        required
                                                    ></textarea>
                                                    {errors.address && (
                                                        <div className="invalid-feedback">{errors.address}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="col-lg-4">
                                                <div className="mb-3">
                                                    <label htmlFor="city" className="form-label">
                                                        Şehir <span className="text-danger">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        id="city"
                                                        className={`form-control ${errors.city ? 'is-invalid' : ''}`}
                                                        value={data.city}
                                                        onChange={(e) => setData('city', e.target.value)}
                                                        placeholder="Şehir"
                                                        required
                                                    />
                                                    {errors.city && (
                                                        <div className="invalid-feedback">{errors.city}</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="col-lg-4">
                                                <div className="mb-3">
                                                    <label htmlFor="postal_code" className="form-label">
                                                        Posta Kodu
                                                    </label>
                                                    <input
                                                        type="text"
                                                        id="postal_code"
                                                        className={`form-control ${errors.postal_code ? 'is-invalid' : ''}`}
                                                        value={data.postal_code}
                                                        onChange={(e) => setData('postal_code', e.target.value)}
                                                        placeholder="Posta kodu"
                                                    />
                                                    {errors.postal_code && (
                                                        <div className="invalid-feedback">{errors.postal_code}</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="col-lg-4">
                                                <div className="mb-3">
                                                    <label htmlFor="country" className="form-label">
                                                        Ülke <span className="text-danger">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        id="country"
                                                        className={`form-control ${errors.country ? 'is-invalid' : ''}`}
                                                        value={data.country}
                                                        onChange={(e) => setData('country', e.target.value)}
                                                        placeholder="Ülke"
                                                        required
                                                    />
                                                    {errors.country && (
                                                        <div className="invalid-feedback">{errors.country}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="col-lg-6">
                                                <div className="mb-3">
                                                    <label htmlFor="phone" className="form-label">
                                                        Telefon
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        id="phone"
                                                        className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                                                        value={data.phone}
                                                        onChange={(e) => setData('phone', e.target.value)}
                                                        placeholder="Telefon numarası"
                                                    />
                                                    {errors.phone && (
                                                        <div className="invalid-feedback">{errors.phone}</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="col-lg-6">
                                                <div className="mb-3">
                                                    <label htmlFor="email" className="form-label">
                                                        E-posta
                                                    </label>
                                                    <input
                                                        type="email"
                                                        id="email"
                                                        className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                                        value={data.email}
                                                        onChange={(e) => setData('email', e.target.value)}
                                                        placeholder="E-posta adresi"
                                                    />
                                                    {errors.email && (
                                                        <div className="invalid-feedback">{errors.email}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="col-lg-4">
                                                <div className="mb-3">
                                                    <label htmlFor="manager_name" className="form-label">
                                                        Müdür Adı
                                                    </label>
                                                    <input
                                                        type="text"
                                                        id="manager_name"
                                                        className={`form-control ${errors.manager_name ? 'is-invalid' : ''}`}
                                                        value={data.manager_name}
                                                        onChange={(e) => setData('manager_name', e.target.value)}
                                                        placeholder="Müdür adı"
                                                    />
                                                    {errors.manager_name && (
                                                        <div className="invalid-feedback">{errors.manager_name}</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="col-lg-4">
                                                <div className="mb-3">
                                                    <label htmlFor="capacity" className="form-label">
                                                        Kapasite (m³)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        id="capacity"
                                                        className={`form-control ${errors.capacity ? 'is-invalid' : ''}`}
                                                        value={data.capacity}
                                                        onChange={(e) => setData('capacity', e.target.value)}
                                                        placeholder="Kapasite"
                                                        min="0"
                                                    />
                                                    {errors.capacity && (
                                                        <div className="invalid-feedback">{errors.capacity}</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="col-lg-4">
                                                <div className="mb-3">
                                                    <label htmlFor="area_sqm" className="form-label">
                                                        Alan (m²)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        id="area_sqm"
                                                        className={`form-control ${errors.area_sqm ? 'is-invalid' : ''}`}
                                                        value={data.area_sqm}
                                                        onChange={(e) => setData('area_sqm', e.target.value)}
                                                        placeholder="Alan"
                                                        min="0"
                                                    />
                                                    {errors.area_sqm && (
                                                        <div className="invalid-feedback">{errors.area_sqm}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="col-lg-12">
                                                <div className="mb-3">
                                                    <label htmlFor="description" className="form-label">
                                                        Açıklama
                                                    </label>
                                                    <textarea
                                                        id="description"
                                                        className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                                                        rows={4}
                                                        value={data.description}
                                                        onChange={(e) => setData('description', e.target.value)}
                                                        placeholder="Depo açıklaması"
                                                    ></textarea>
                                                    {errors.description && (
                                                        <div className="invalid-feedback">{errors.description}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="row">
                                            <div className="col-lg-12">
                                                <div className="text-end">
                                                    <Link
                                                        href="/warehouses"
                                                        className="btn btn-secondary me-2"
                                                    >
                                                        <i className="ri-arrow-left-line me-1"></i>
                                                        Geri
                                                    </Link>
                                                    <button
                                                        type="submit"
                                                        className="btn btn-primary"
                                                        disabled={processing}
                                                    >
                                                        {processing ? (
                                                            <React.Fragment>
                                                                <i className="ri-loader-2-line me-1"></i>
                                                                Güncelleniyor...
                                                            </React.Fragment>
                                                        ) : (
                                                            <React.Fragment>
                                                                <i className="ri-save-line me-1"></i>
                                                                Güncelle
                                                            </React.Fragment>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
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
};

export default Edit;
