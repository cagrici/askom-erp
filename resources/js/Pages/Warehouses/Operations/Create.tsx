import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import Layout from '../../../Layouts';

interface Warehouse {
    id: number;
    name: string;
    code: string;
}

interface Staff {
    id: number;
    employee_id: number;
    warehouse_id: number;
    employee: {
        id: number;
        first_name: string;
        last_name: string;
        employee_id: string;
    };
}

interface Props {
    warehouses: Warehouse[];
    staff: Staff[];
}

const Create: React.FC<Props> = ({ warehouses, staff }) => {
    const [selectedWarehouse, setSelectedWarehouse] = useState('');
    const [availableStaff, setAvailableStaff] = useState<Staff[]>([]);

    const { data, setData, post, processing, errors, reset } = useForm({
        warehouse_id: '',
        operation_type: 'receiving',
        priority: 'normal',
        assigned_staff_id: '',
        description: '',
        notes: '',
        estimated_duration: '',
        estimated_completion: ''
    });

    const handleWarehouseChange = (warehouseId: string) => {
        setSelectedWarehouse(warehouseId);
        setData(prevData => ({
            ...prevData,
            warehouse_id: warehouseId ? parseInt(warehouseId) : '',
            assigned_staff_id: '' // Reset staff selection
        }));

        // Filter staff by warehouse
        const filteredStaff = staff.filter(s => s.warehouse_id.toString() === warehouseId);
        setAvailableStaff(filteredStaff);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('warehouses.operations.store'), {
            onSuccess: () => reset()
        });
    };

    const operationTypes = [
        { value: 'receiving', label: 'Mal Kabul' },
        { value: 'picking', label: 'Toplama' },
        { value: 'packing', label: 'Paketleme' },
        { value: 'shipping', label: 'Sevkiyat' },
        { value: 'counting', label: 'Sayım' },
        { value: 'relocation', label: 'Yer Değiştirme' },
        { value: 'maintenance', label: 'Bakım' }
    ];

    const priorityLevels = [
        { value: 'low', label: 'Düşük' },
        { value: 'normal', label: 'Normal' },
        { value: 'high', label: 'Yüksek' },
        { value: 'urgent', label: 'Acil' }
    ];

    return (
        <Layout>
            <Head title="Yeni Depo Operasyonu" />

            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Yeni Depo Operasyonu</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link href="/warehouses">Depo Yönetimi</Link></li>
                                        <li className="breadcrumb-item"><Link href="/warehouses/operations">Operasyonlar</Link></li>
                                        <li className="breadcrumb-item active">Yeni Operasyon</li>
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
                                    <h5 className="card-title mb-0">Operasyon Bilgileri</h5>
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
                                                    <label htmlFor="operation_type" className="form-label">
                                                        Operasyon Tipi <span className="text-danger">*</span>
                                                    </label>
                                                    <select
                                                        id="operation_type"
                                                        className={`form-select ${errors.operation_type ? 'is-invalid' : ''}`}
                                                        value={data.operation_type}
                                                        onChange={(e) => setData('operation_type', e.target.value)}
                                                        required
                                                    >
                                                        {operationTypes.map(type => (
                                                            <option key={type.value} value={type.value}>
                                                                {type.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {errors.operation_type && (
                                                        <div className="invalid-feedback">{errors.operation_type}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="col-lg-6">
                                                <div className="mb-3">
                                                    <label htmlFor="priority" className="form-label">
                                                        Öncelik <span className="text-danger">*</span>
                                                    </label>
                                                    <select
                                                        id="priority"
                                                        className={`form-select ${errors.priority ? 'is-invalid' : ''}`}
                                                        value={data.priority}
                                                        onChange={(e) => setData('priority', e.target.value)}
                                                        required
                                                    >
                                                        {priorityLevels.map(priority => (
                                                            <option key={priority.value} value={priority.value}>
                                                                {priority.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {errors.priority && (
                                                        <div className="invalid-feedback">{errors.priority}</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="col-lg-6">
                                                <div className="mb-3">
                                                    <label htmlFor="assigned_staff_id" className="form-label">
                                                        Atanan Personel
                                                    </label>
                                                    <select
                                                        id="assigned_staff_id"
                                                        className={`form-select ${errors.assigned_staff_id ? 'is-invalid' : ''}`}
                                                        value={data.assigned_staff_id}
                                                        onChange={(e) => setData('assigned_staff_id', e.target.value ? parseInt(e.target.value) : '')}
                                                        disabled={!selectedWarehouse}
                                                    >
                                                        <option value="">Personel Seçin (Opsiyonel)</option>
                                                        {availableStaff.map(staff => (
                                                            <option key={staff.id} value={staff.id}>
                                                                {staff.employee.first_name} {staff.employee.last_name} ({staff.employee.employee_id})
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {errors.assigned_staff_id && (
                                                        <div className="invalid-feedback">{errors.assigned_staff_id}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="col-lg-6">
                                                <div className="mb-3">
                                                    <label htmlFor="estimated_duration" className="form-label">
                                                        Tahmini Süre (dakika)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        id="estimated_duration"
                                                        className={`form-control ${errors.estimated_duration ? 'is-invalid' : ''}`}
                                                        value={data.estimated_duration}
                                                        onChange={(e) => setData('estimated_duration', e.target.value)}
                                                        placeholder="Dakika olarak giriniz"
                                                        min="1"
                                                    />
                                                    {errors.estimated_duration && (
                                                        <div className="invalid-feedback">{errors.estimated_duration}</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="col-lg-6">
                                                <div className="mb-3">
                                                    <label htmlFor="estimated_completion" className="form-label">
                                                        Tahmini Tamamlanma Tarihi
                                                    </label>
                                                    <input
                                                        type="datetime-local"
                                                        id="estimated_completion"
                                                        className={`form-control ${errors.estimated_completion ? 'is-invalid' : ''}`}
                                                        value={data.estimated_completion}
                                                        onChange={(e) => setData('estimated_completion', e.target.value)}
                                                    />
                                                    {errors.estimated_completion && (
                                                        <div className="invalid-feedback">{errors.estimated_completion}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="col-lg-12">
                                                <div className="mb-3">
                                                    <label htmlFor="description" className="form-label">
                                                        Açıklama <span className="text-danger">*</span>
                                                    </label>
                                                    <textarea
                                                        id="description"
                                                        className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                                                        rows={3}
                                                        value={data.description}
                                                        onChange={(e) => setData('description', e.target.value)}
                                                        placeholder="Operasyon açıklamasını yazın"
                                                        required
                                                    ></textarea>
                                                    {errors.description && (
                                                        <div className="invalid-feedback">{errors.description}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="col-lg-12">
                                                <div className="mb-3">
                                                    <label htmlFor="notes" className="form-label">
                                                        Not / Talimatlar
                                                    </label>
                                                    <textarea
                                                        id="notes"
                                                        className={`form-control ${errors.notes ? 'is-invalid' : ''}`}
                                                        rows={3}
                                                        value={data.notes}
                                                        onChange={(e) => setData('notes', e.target.value)}
                                                        placeholder="Ek notlar veya özel talimatlar"
                                                    ></textarea>
                                                    {errors.notes && (
                                                        <div className="invalid-feedback">{errors.notes}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="row">
                                            <div className="col-lg-12">
                                                <div className="text-end">
                                                    <Link
                                                        href="/warehouses/operations"
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
