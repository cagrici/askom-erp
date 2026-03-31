import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import Layout from '../../../Layouts';

interface Warehouse {
    id: number;
    name: string;
    code: string;
    zones?: Zone[];
}

interface Zone {
    id: number;
    warehouse_id: number;
    name: string;
    code: string;
}

interface Props {
    warehouses: Warehouse[];
}

const Create: React.FC<Props> = ({ warehouses }) => {
    const [selectedWarehouse, setSelectedWarehouse] = useState('');
    const [availableZones, setAvailableZones] = useState<Zone[]>([]);

    const { data, setData, post, processing, errors, reset } = useForm({
        warehouse_id: '',
        zone_id: '',
        aisle: '',
        rack: '',
        shelf: '',
        position: '',
        location_type: 'shelf',
        max_weight: '',
        max_volume: '',
        length: '',
        width: '',
        height: '',
        status: 'available',
        is_pickable: true,
        is_bulk_location: false,
        temperature_controlled: false
    });

    const handleWarehouseChange = (warehouseId: string) => {
        setSelectedWarehouse(warehouseId);
        
        // Use setData with callback to ensure both updates happen together
        setData(prevData => ({
            ...prevData,
            warehouse_id: warehouseId ? parseInt(warehouseId) : '',
            zone_id: '' // Reset zone selection
        }));
        
        const warehouse = warehouses.find(w => w.id.toString() === warehouseId);
        if (warehouse && warehouse.zones) {
            setAvailableZones(warehouse.zones);
        } else {
            setAvailableZones([]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('warehouses.locations.store'), {
            onSuccess: () => reset()
        });
    };

    const locationTypes = [
        { value: 'floor', label: 'Zemin' },
        { value: 'rack', label: 'Raf' },
        { value: 'shelf', label: 'Şelf' },
        { value: 'bin', label: 'Kutu' },
        { value: 'pallet', label: 'Palet' },
        { value: 'bulk', label: 'Dökme' },
        { value: 'special', label: 'Özel' }
    ];

    return (
        <Layout>
            <Head title="Yeni Depolama Lokasyonu" />
            
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Yeni Depolama Lokasyonu</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link href="/warehouses">Depo Yönetimi</Link></li>
                                        <li className="breadcrumb-item"><Link href="/warehouses/locations">Lokasyonlar</Link></li>
                                        <li className="breadcrumb-item active">Yeni Lokasyon</li>
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
                                    <h5 className="card-title mb-0">Lokasyon Bilgileri</h5>
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
                                                        onChange={(e) => handleWarehouseChange(e.target.value)}
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
                                                    <label htmlFor="zone_id" className="form-label">
                                                        Bölge <span className="text-danger">*</span>
                                                    </label>
                                                    <select
                                                        id="zone_id"
                                                        className={`form-select ${errors.zone_id ? 'is-invalid' : ''}`}
                                                        value={data.zone_id}
                                                        onChange={(e) => {
                                                            const zoneId = e.target.value ? parseInt(e.target.value) : '';
                                                            setData('zone_id', zoneId);
                                                        }}
                                                        required
                                                        disabled={!selectedWarehouse}
                                                    >
                                                        <option value="">Bölge Seçin</option>
                                                        {availableZones.map(zone => (
                                                            <option key={zone.id} value={zone.id}>
                                                                {zone.name} ({zone.code})
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {errors.zone_id && (
                                                        <div className="invalid-feedback">{errors.zone_id}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Position Information */}
                                        <div className="row">
                                            <div className="col-lg-12">
                                                <div className="card">
                                                    <div className="card-header">
                                                        <h6 className="card-title mb-0">Pozisyon Bilgileri</h6>
                                                    </div>
                                                    <div className="card-body">
                                                        <div className="row">
                                                            <div className="col-lg-3">
                                                                <div className="mb-3">
                                                                    <label htmlFor="aisle" className="form-label">
                                                                        Koridor <span className="text-danger">*</span>
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        id="aisle"
                                                                        className={`form-control ${errors.aisle ? 'is-invalid' : ''}`}
                                                                        value={data.aisle}
                                                                        onChange={(e) => setData('aisle', e.target.value)}
                                                                        placeholder="Örn: A"
                                                                        required
                                                                    />
                                                                    {errors.aisle && (
                                                                        <div className="invalid-feedback">{errors.aisle}</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="col-lg-3">
                                                                <div className="mb-3">
                                                                    <label htmlFor="rack" className="form-label">
                                                                        Raf <span className="text-danger">*</span>
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        id="rack"
                                                                        className={`form-control ${errors.rack ? 'is-invalid' : ''}`}
                                                                        value={data.rack}
                                                                        onChange={(e) => setData('rack', e.target.value)}
                                                                        placeholder="Örn: 01"
                                                                        required
                                                                    />
                                                                    {errors.rack && (
                                                                        <div className="invalid-feedback">{errors.rack}</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="col-lg-3">
                                                                <div className="mb-3">
                                                                    <label htmlFor="shelf" className="form-label">
                                                                        Şelf <span className="text-danger">*</span>
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        id="shelf"
                                                                        className={`form-control ${errors.shelf ? 'is-invalid' : ''}`}
                                                                        value={data.shelf}
                                                                        onChange={(e) => setData('shelf', e.target.value)}
                                                                        placeholder="Örn: 01"
                                                                        required
                                                                    />
                                                                    {errors.shelf && (
                                                                        <div className="invalid-feedback">{errors.shelf}</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="col-lg-3">
                                                                <div className="mb-3">
                                                                    <label htmlFor="position" className="form-label">
                                                                        Pozisyon
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        id="position"
                                                                        className={`form-control ${errors.position ? 'is-invalid' : ''}`}
                                                                        value={data.position}
                                                                        onChange={(e) => setData('position', e.target.value)}
                                                                        placeholder="Opsiyonel"
                                                                    />
                                                                    {errors.position && (
                                                                        <div className="invalid-feedback">{errors.position}</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="row">
                                                            <div className="col-lg-12">
                                                                <div className="alert alert-info">
                                                                    <i className="ri-information-line me-2"></i>
                                                                    Lokasyon kodu otomatik olarak oluşturulacaktır: <strong>{data.aisle}-{data.rack}-{data.shelf}{data.position ? '-' + data.position : ''}</strong>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="col-lg-6">
                                                <div className="mb-3">
                                                    <label htmlFor="location_type" className="form-label">
                                                        Lokasyon Tipi <span className="text-danger">*</span>
                                                    </label>
                                                    <select
                                                        id="location_type"
                                                        className={`form-select ${errors.location_type ? 'is-invalid' : ''}`}
                                                        value={data.location_type}
                                                        onChange={(e) => setData('location_type', e.target.value)}
                                                        required
                                                    >
                                                        {locationTypes.map(type => (
                                                            <option key={type.value} value={type.value}>
                                                                {type.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {errors.location_type && (
                                                        <div className="invalid-feedback">{errors.location_type}</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="col-lg-6">
                                                <div className="mb-3">
                                                    <label htmlFor="locationStatus" className="form-label">
                                                        Durum <span className="text-danger">*</span>
                                                    </label>
                                                    <select
                                                        id="locationStatus"
                                                        className={`form-select ${errors.status ? 'is-invalid' : ''}`}
                                                        value={data.status}
                                                        onChange={(e) => setData('status', e.target.value)}
                                                        required
                                                    >
                                                        <option value="available">Müsait</option>
                                                        <option value="occupied">Dolu</option>
                                                        <option value="reserved">Rezerve</option>
                                                        <option value="blocked">Bloklu</option>
                                                        <option value="maintenance">Bakımda</option>
                                                    </select>
                                                    {errors.status && (
                                                        <div className="invalid-feedback">{errors.status}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Physical Specifications */}
                                        <div className="row">
                                            <div className="col-lg-12">
                                                <div className="card">
                                                    <div className="card-header">
                                                        <h6 className="card-title mb-0">Fiziksel Özellikler</h6>
                                                    </div>
                                                    <div className="card-body">
                                                        <div className="row">
                                                            <div className="col-lg-3">
                                                                <div className="mb-3">
                                                                    <label htmlFor="length" className="form-label">
                                                                        Uzunluk (cm)
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        id="length"
                                                                        className={`form-control ${errors.length ? 'is-invalid' : ''}`}
                                                                        value={data.length}
                                                                        onChange={(e) => setData('length', e.target.value)}
                                                                        placeholder="cm"
                                                                        min="0"
                                                                        step="0.1"
                                                                    />
                                                                    {errors.length && (
                                                                        <div className="invalid-feedback">{errors.length}</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="col-lg-3">
                                                                <div className="mb-3">
                                                                    <label htmlFor="width" className="form-label">
                                                                        Genişlik (cm)
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        id="width"
                                                                        className={`form-control ${errors.width ? 'is-invalid' : ''}`}
                                                                        value={data.width}
                                                                        onChange={(e) => setData('width', e.target.value)}
                                                                        placeholder="cm"
                                                                        min="0"
                                                                        step="0.1"
                                                                    />
                                                                    {errors.width && (
                                                                        <div className="invalid-feedback">{errors.width}</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="col-lg-3">
                                                                <div className="mb-3">
                                                                    <label htmlFor="height" className="form-label">
                                                                        Yükseklik (cm)
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        id="height"
                                                                        className={`form-control ${errors.height ? 'is-invalid' : ''}`}
                                                                        value={data.height}
                                                                        onChange={(e) => setData('height', e.target.value)}
                                                                        placeholder="cm"
                                                                        min="0"
                                                                        step="0.1"
                                                                    />
                                                                    {errors.height && (
                                                                        <div className="invalid-feedback">{errors.height}</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="col-lg-3">
                                                                <div className="mb-3">
                                                                    <label htmlFor="max_volume" className="form-label">
                                                                        Maksimum Hacim (m³)
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        id="max_volume"
                                                                        className={`form-control ${errors.max_volume ? 'is-invalid' : ''}`}
                                                                        value={data.max_volume}
                                                                        onChange={(e) => setData('max_volume', e.target.value)}
                                                                        placeholder="m³"
                                                                        min="0"
                                                                        step="0.01"
                                                                    />
                                                                    {errors.max_volume && (
                                                                        <div className="invalid-feedback">{errors.max_volume}</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="row">
                                                            <div className="col-lg-6">
                                                                <div className="mb-3">
                                                                    <label htmlFor="max_weight" className="form-label">
                                                                        Maksimum Ağırlık (kg)
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        id="max_weight"
                                                                        className={`form-control ${errors.max_weight ? 'is-invalid' : ''}`}
                                                                        value={data.max_weight}
                                                                        onChange={(e) => setData('max_weight', e.target.value)}
                                                                        placeholder="kg"
                                                                        min="0"
                                                                        step="0.1"
                                                                    />
                                                                    {errors.max_weight && (
                                                                        <div className="invalid-feedback">{errors.max_weight}</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Location Properties */}
                                        <div className="row">
                                            <div className="col-lg-12">
                                                <div className="card">
                                                    <div className="card-header">
                                                        <h6 className="card-title mb-0">Lokasyon Özellikleri</h6>
                                                    </div>
                                                    <div className="card-body">
                                                        <div className="row">
                                                            <div className="col-lg-4">
                                                                <div className="mb-3">
                                                                    <div className="form-check">
                                                                        <input
                                                                            type="checkbox"
                                                                            id="is_pickable"
                                                                            className="form-check-input"
                                                                            checked={data.is_pickable}
                                                                            onChange={(e) => setData('is_pickable', e.target.checked)}
                                                                        />
                                                                        <label htmlFor="is_pickable" className="form-check-label">
                                                                            Toplanabilir Lokasyon
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-lg-4">
                                                                <div className="mb-3">
                                                                    <div className="form-check">
                                                                        <input
                                                                            type="checkbox"
                                                                            id="is_bulk_location"
                                                                            className="form-check-input"
                                                                            checked={data.is_bulk_location}
                                                                            onChange={(e) => setData('is_bulk_location', e.target.checked)}
                                                                        />
                                                                        <label htmlFor="is_bulk_location" className="form-check-label">
                                                                            Dökme Depolama
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-lg-4">
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
                                                                            Sıcaklık Kontrollü
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="row">
                                            <div className="col-lg-12">
                                                <div className="text-end">
                                                    <Link
                                                        href="/warehouses/locations"
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