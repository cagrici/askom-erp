import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import Layout from '../../../Layouts';

interface Warehouse {
    id: number;
    name: string;
    code: string;
}

interface Props {
    warehouses: Warehouse[];
}

const Create: React.FC<Props> = ({ warehouses }) => {
    const { data, setData, post, processing, errors, reset } = useForm({
        warehouse_id: '',
        name: '',
        code: '',
        zone_type: 'storage',
        description: '',
        max_locations: '',
        temperature_controlled: false,
        min_temperature: '',
        max_temperature: '',
        status: 'active'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('warehouses.zones.store'), {
            onSuccess: () => reset()
        });
    };

    const zoneTypes = [
        { value: 'receiving', label: 'Mal Kabul' },
        { value: 'storage', label: 'Depolama' },
        { value: 'picking', label: 'Toplama' },
        { value: 'packing', label: 'Paketleme' },
        { value: 'shipping', label: 'Sevkiyat' },
        { value: 'quarantine', label: 'Karantina' },
        { value: 'returns', label: 'İadeler' }
    ];

    return (
        <Layout>
            <Head title="Yeni Depo Bölgesi" />
            
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Yeni Depo Bölgesi</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link href="/warehouses">Depo Yönetimi</Link></li>
                                        <li className="breadcrumb-item"><Link href="/warehouses/zones">Bölgeler</Link></li>
                                        <li className="breadcrumb-item active">Yeni Bölge</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Create Form */}
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">Bölge Bilgileri</h5>
                                </div>
                                <div className="card-body">
                                    <form onSubmit={handleSubmit}>
                                        <div className="row">
                                            <div className="col-lg-6">
                                                <div className="mb-3">
                                                    <label htmlFor="warehouse_id" className="form-label">
                                                        Depo <span className="text-danger">*</span>
                                                    </label>
                                                    <select
                                                        id="warehouse_id"
                                                        className={`form-select ${errors.warehouse_id ? 'is-invalid' : ''}`}
                                                        value={data.warehouse_id}
                                                        onChange={(e) => setData('warehouse_id', e.target.value)}
                                                        required
                                                    >
                                                        <option value="">Depo Seçin</option>
                                                        {warehouses.map(warehouse => (
                                                            <option key={warehouse.id} value={warehouse.id}>
                                                                {warehouse.name} ({warehouse.code})
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {errors.warehouse_id && (
                                                        <div className="invalid-feedback">{errors.warehouse_id}</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="col-lg-6">
                                                <div className="mb-3">
                                                    <label htmlFor="zone_type" className="form-label">
                                                        Bölge Tipi <span className="text-danger">*</span>
                                                    </label>
                                                    <select
                                                        id="zone_type"
                                                        className={`form-select ${errors.zone_type ? 'is-invalid' : ''}`}
                                                        value={data.zone_type}
                                                        onChange={(e) => setData('zone_type', e.target.value)}
                                                        required
                                                    >
                                                        {zoneTypes.map(type => (
                                                            <option key={type.value} value={type.value}>
                                                                {type.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {errors.zone_type && (
                                                        <div className="invalid-feedback">{errors.zone_type}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="col-lg-6">
                                                <div className="mb-3">
                                                    <label htmlFor="name" className="form-label">
                                                        Bölge Adı <span className="text-danger">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        id="name"
                                                        className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                                        value={data.name}
                                                        onChange={(e) => setData('name', e.target.value)}
                                                        placeholder="Bölge adını giriniz"
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
                                                        Bölge Kodu <span className="text-danger">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        id="code"
                                                        className={`form-control ${errors.code ? 'is-invalid' : ''}`}
                                                        value={data.code}
                                                        onChange={(e) => setData('code', e.target.value)}
                                                        placeholder="Örn: A-01"
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
                                                    <label htmlFor="max_locations" className="form-label">
                                                        Maksimum Lokasyon Sayısı
                                                    </label>
                                                    <input
                                                        type="number"
                                                        id="max_locations"
                                                        className={`form-control ${errors.max_locations ? 'is-invalid' : ''}`}
                                                        value={data.max_locations}
                                                        onChange={(e) => setData('max_locations', e.target.value)}
                                                        placeholder="Opsiyonel"
                                                        min="1"
                                                    />
                                                    {errors.max_locations && (
                                                        <div className="invalid-feedback">{errors.max_locations}</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="col-lg-6">
                                                <div className="mb-3">
                                                    <label htmlFor="zoneStatus" className="form-label">
                                                        Durum <span className="text-danger">*</span>
                                                    </label>
                                                    <select
                                                        id="zoneStatus"
                                                        className={`form-select ${errors.status ? 'is-invalid' : ''}`}
                                                        value={data.status}
                                                        onChange={(e) => setData('status', e.target.value)}
                                                        required
                                                    >
                                                        <option value="active">Aktif</option>
                                                        <option value="inactive">Pasif</option>
                                                        <option value="maintenance">Bakımda</option>
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
                                                    <label htmlFor="description" className="form-label">
                                                        Açıklama
                                                    </label>
                                                    <textarea
                                                        id="description"
                                                        className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                                                        rows={3}
                                                        value={data.description}
                                                        onChange={(e) => setData('description', e.target.value)}
                                                        placeholder="Bölge hakkında açıklama yazın"
                                                    ></textarea>
                                                    {errors.description && (
                                                        <div className="invalid-feedback">{errors.description}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Temperature Control Section */}
                                        <div className="row">
                                            <div className="col-lg-12">
                                                <div className="card">
                                                    <div className="card-header">
                                                        <h6 className="card-title mb-0">Sıcaklık Kontrolü</h6>
                                                    </div>
                                                    <div className="card-body">
                                                        <div className="row">
                                                            <div className="col-lg-12">
                                                                <div className="mb-3">
                                                                    <div className="form-check">
                                                                        <input
                                                                            type="checkbox"
                                                                            id="temperature_controlled"
                                                                            className="form-check-input"
                                                                            checked={data.temperature_controlled}
                                                                            onChange={(e) => setData('temperature_controlled', e.target.checked)}
                                                                        />
                                                                        <label htmlFor="temperature_controlled" className="form-check-label">
                                                                            Sıcaklık Kontrollü Bölge
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {data.temperature_controlled && (
                                                            <div className="row">
                                                                <div className="col-lg-6">
                                                                    <div className="mb-3">
                                                                        <label htmlFor="min_temperature" className="form-label">
                                                                            Minimum Sıcaklık (°C)
                                                                        </label>
                                                                        <input
                                                                            type="number"
                                                                            id="min_temperature"
                                                                            className={`form-control ${errors.min_temperature ? 'is-invalid' : ''}`}
                                                                            value={data.min_temperature}
                                                                            onChange={(e) => setData('min_temperature', e.target.value)}
                                                                            placeholder="Örn: -18"
                                                                            step="0.1"
                                                                        />
                                                                        {errors.min_temperature && (
                                                                            <div className="invalid-feedback">{errors.min_temperature}</div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="col-lg-6">
                                                                    <div className="mb-3">
                                                                        <label htmlFor="max_temperature" className="form-label">
                                                                            Maksimum Sıcaklık (°C)
                                                                        </label>
                                                                        <input
                                                                            type="number"
                                                                            id="max_temperature"
                                                                            className={`form-control ${errors.max_temperature ? 'is-invalid' : ''}`}
                                                                            value={data.max_temperature}
                                                                            onChange={(e) => setData('max_temperature', e.target.value)}
                                                                            placeholder="Örn: -10"
                                                                            step="0.1"
                                                                        />
                                                                        {errors.max_temperature && (
                                                                            <div className="invalid-feedback">{errors.max_temperature}</div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="row">
                                            <div className="col-lg-12">
                                                <div className="text-end">
                                                    <Link
                                                        href="/warehouses/zones"
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
                                                                Kaydediliyor...
                                                            </React.Fragment>
                                                        ) : (
                                                            <React.Fragment>
                                                                <i className="ri-save-line me-1"></i>
                                                                Kaydet
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

export default Create;