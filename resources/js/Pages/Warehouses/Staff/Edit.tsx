import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import Layout from '../../../Layouts';

interface Warehouse {
    id: number;
    name: string;
    code: string;
}

interface Employee {
    id: number;
    first_name: string;
    last_name: string;
    employee_id: string;
    email?: string;
    phone?: string;
}

interface WarehouseStaff {
    id: number;
    warehouse_id: number;
    employee_id: number;
    role: string;
    employment_type: string;
    shift: string;
    hire_date: string;
    status: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    warehouse: Warehouse;
    employee: Employee;
}

interface Props {
    staff: WarehouseStaff;
    warehouses: Warehouse[];
}

const Edit: React.FC<Props> = ({ staff, warehouses }) => {
    const { data, setData, put, processing, errors, reset } = useForm({
        warehouse_id: staff.warehouse_id,
        role: staff.role,
        employment_type: staff.employment_type,
        shift: staff.shift,
        hire_date: staff.hire_date,
        status: staff.status,
        emergency_contact_name: staff.emergency_contact_name || '',
        emergency_contact_phone: staff.emergency_contact_phone || ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('warehouses.staff.update', staff.id));
    };

    const roles = [
        { value: 'warehouse_manager', label: 'Depo Müdürü' },
        { value: 'supervisor', label: 'Süpervizör' },
        { value: 'team_leader', label: 'Takım Lideri' },
        { value: 'receiver', label: 'Teslim Alma Memuru' },
        { value: 'picker', label: 'Toplayıcı' },
        { value: 'packer', label: 'Paketleyici' },
        { value: 'shipper', label: 'Sevkiyat Memuru' },
        { value: 'forklift_operator', label: 'Forklift Operatörü' },
        { value: 'quality_control', label: 'Kalite Kontrol' },
        { value: 'maintenance', label: 'Bakım Teknisyeni' },
        { value: 'inventory_controller', label: 'Envanter Kontrol' },
        { value: 'returns_processor', label: 'İade İşlemcisi' }
    ];

    const employmentTypes = [
        { value: 'full_time', label: 'Tam Zamanlı' },
        { value: 'part_time', label: 'Yarı Zamanlı' },
        { value: 'contractor', label: 'Müteahhit' },
        { value: 'seasonal', label: 'Mevsimlik' }
    ];

    const shifts = [
        { value: 'day', label: 'Gündüz' },
        { value: 'evening', label: 'Akşam' },
        { value: 'night', label: 'Gece' },
        { value: 'rotating', label: 'Değişken' }
    ];

    const statuses = [
        { value: 'active', label: 'Aktif' },
        { value: 'inactive', label: 'İnaktif' },
        { value: 'suspended', label: 'Askıya Alınmış' },
        { value: 'terminated', label: 'İşten Çıkarılmış' }
    ];

    return (
        <Layout>
            <Head title={`${staff.employee?.first_name || ''} ${staff.employee?.last_name || ''} - Düzenle`} />
            
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Depo Personeli Düzenle</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link href="/warehouses">Depo Yönetimi</Link></li>
                                        <li className="breadcrumb-item"><Link href="/warehouses/staff">Personel</Link></li>
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
                                    <h5 className="card-title mb-0">Personel Bilgileri</h5>
                                </div>
                                <div className="card-body">
                                    {/* Current Employee Info */}
                                    <div className="row mb-4">
                                        <div className="col-lg-12">
                                            <div className="alert alert-info">
                                                <h6 className="alert-heading">Çalışan Bilgileri</h6>
                                                <div className="row">
                                                    <div className="col-md-3">
                                                        <strong>Ad Soyad:</strong><br />
                                                        {staff.employee?.first_name || ''} {staff.employee?.last_name || ''}
                                                    </div>
                                                    <div className="col-md-3">
                                                        <strong>Sicil No:</strong><br />
                                                        {staff.employee?.employee_id || ''}
                                                    </div>
                                                    {staff.employee?.email && (
                                                        <div className="col-md-3">
                                                            <strong>E-posta:</strong><br />
                                                            {staff.employee.email}
                                                        </div>
                                                    )}
                                                    {staff.employee?.phone && (
                                                        <div className="col-md-3">
                                                            <strong>Telefon:</strong><br />
                                                            {staff.employee.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

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
                                                        onChange={(e) => setData('warehouse_id', parseInt(e.target.value))}
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
                                                    <label htmlFor="role" className="form-label">
                                                        Depo Görevi <span className="text-danger">*</span>
                                                    </label>
                                                    <select
                                                        id="role"
                                                        className={`form-select ${errors.role ? 'is-invalid' : ''}`}
                                                        value={data.role}
                                                        onChange={(e) => setData('role', e.target.value)}
                                                        required
                                                    >
                                                        {roles.map(role => (
                                                            <option key={role.value} value={role.value}>
                                                                {role.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {errors.role && (
                                                        <div className="invalid-feedback">{errors.role}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="col-lg-6">
                                                <div className="mb-3">
                                                    <label htmlFor="employment_type" className="form-label">
                                                        Çalışma Tipi <span className="text-danger">*</span>
                                                    </label>
                                                    <select
                                                        id="employment_type"
                                                        className={`form-select ${errors.employment_type ? 'is-invalid' : ''}`}
                                                        value={data.employment_type}
                                                        onChange={(e) => setData('employment_type', e.target.value)}
                                                        required
                                                    >
                                                        {employmentTypes.map(type => (
                                                            <option key={type.value} value={type.value}>
                                                                {type.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {errors.employment_type && (
                                                        <div className="invalid-feedback">{errors.employment_type}</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="col-lg-6">
                                                <div className="mb-3">
                                                    <label htmlFor="shift" className="form-label">
                                                        Vardiya <span className="text-danger">*</span>
                                                    </label>
                                                    <select
                                                        id="shift"
                                                        className={`form-select ${errors.shift ? 'is-invalid' : ''}`}
                                                        value={data.shift}
                                                        onChange={(e) => setData('shift', e.target.value)}
                                                        required
                                                    >
                                                        {shifts.map(shift => (
                                                            <option key={shift.value} value={shift.value}>
                                                                {shift.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {errors.shift && (
                                                        <div className="invalid-feedback">{errors.shift}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="col-lg-6">
                                                <div className="mb-3">
                                                    <label htmlFor="hire_date" className="form-label">
                                                        İşe Başlama Tarihi <span className="text-danger">*</span>
                                                    </label>
                                                    <input
                                                        type="date"
                                                        id="hire_date"
                                                        className={`form-control ${errors.hire_date ? 'is-invalid' : ''}`}
                                                        value={data.hire_date}
                                                        onChange={(e) => setData('hire_date', e.target.value)}
                                                        required
                                                    />
                                                    {errors.hire_date && (
                                                        <div className="invalid-feedback">{errors.hire_date}</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="col-lg-6">
                                                <div className="mb-3">
                                                    <label htmlFor="staffStatus" className="form-label">
                                                        Durum <span className="text-danger">*</span>
                                                    </label>
                                                    <select
                                                        id="staffStatus"
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
                                            <div className="col-lg-6">
                                                <div className="mb-3">
                                                    <label htmlFor="emergency_contact_name" className="form-label">
                                                        Acil Durum İletişim Adı
                                                    </label>
                                                    <input
                                                        type="text"
                                                        id="emergency_contact_name"
                                                        className={`form-control ${errors.emergency_contact_name ? 'is-invalid' : ''}`}
                                                        value={data.emergency_contact_name}
                                                        onChange={(e) => setData('emergency_contact_name', e.target.value)}
                                                        placeholder="Ad Soyad"
                                                    />
                                                    {errors.emergency_contact_name && (
                                                        <div className="invalid-feedback">{errors.emergency_contact_name}</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="col-lg-6">
                                                <div className="mb-3">
                                                    <label htmlFor="emergency_contact_phone" className="form-label">
                                                        Acil Durum İletişim Telefonu
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        id="emergency_contact_phone"
                                                        className={`form-control ${errors.emergency_contact_phone ? 'is-invalid' : ''}`}
                                                        value={data.emergency_contact_phone}
                                                        onChange={(e) => setData('emergency_contact_phone', e.target.value)}
                                                        placeholder="0555 123 45 67"
                                                    />
                                                    {errors.emergency_contact_phone && (
                                                        <div className="invalid-feedback">{errors.emergency_contact_phone}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="row">
                                            <div className="col-lg-12">
                                                <div className="text-end">
                                                    <Link
                                                        href="/warehouses/staff"
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