import React, { useState, useEffect } from 'react';
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
    department?: string;
}

interface Props {
    warehouses: Warehouse[];
    employees: Employee[];
}

const Create: React.FC<Props> = ({ warehouses, employees }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        warehouse_id: '',
        employee_id: '',
        role: 'picker',
        employment_type: 'full_time',
        shift: 'day',
        hire_date: '',
        status: 'active',
        emergency_contact_name: '',
        emergency_contact_phone: ''
    });

    useEffect(() => {
        if (searchTerm.length >= 2) {
            const filtered = employees.filter(employee => 
                (employee.first_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (employee.last_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (employee.employee_id?.toLowerCase() || '').includes(searchTerm.toLowerCase())
            ).slice(0, 10); // Limit to 10 results
            setFilteredEmployees(filtered);
            setShowDropdown(true);
        } else {
            setFilteredEmployees([]);
            setShowDropdown(false);
        }
    }, [searchTerm, employees]);

    const handleEmployeeSelect = (employee: Employee) => {
        setSelectedEmployee(employee);
        setSearchTerm(`${employee.first_name || ''} ${employee.last_name || ''} (${employee.employee_id || ''})`);
        setData('employee_id', employee.id);
        setShowDropdown(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('warehouses.staff.store'), {
            onSuccess: () => {
                reset();
                setSelectedEmployee(null);
                setSearchTerm('');
            }
        });
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

    return (
        <Layout>
            <Head title="Yeni Depo Personeli" />
            
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Yeni Depo Personeli</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link href="/warehouses">Depo Yönetimi</Link></li>
                                        <li className="breadcrumb-item"><Link href="/warehouses/staff">Personel</Link></li>
                                        <li className="breadcrumb-item active">Yeni Personel</li>
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
                                    <h5 className="card-title mb-0">Personel Bilgileri</h5>
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
                                                    <label htmlFor="employee_search" className="form-label">
                                                        Çalışan Ara <span className="text-danger">*</span>
                                                    </label>
                                                    <div className="position-relative">
                                                        <input
                                                            type="text"
                                                            id="employee_search"
                                                            className={`form-control ${errors.employee_id ? 'is-invalid' : ''}`}
                                                            value={searchTerm}
                                                            onChange={(e) => setSearchTerm(e.target.value)}
                                                            placeholder="Sicil no, ad veya soyad ile arayın..."
                                                            autoComplete="off"
                                                        />
                                                        {showDropdown && filteredEmployees.length > 0 && (
                                                            <div className="dropdown-menu show position-absolute w-100" style={{ zIndex: 1050 }}>
                                                                {filteredEmployees.map(employee => (
                                                                    <button
                                                                        key={employee.id}
                                                                        type="button"
                                                                        className="dropdown-item"
                                                                        onClick={() => handleEmployeeSelect(employee)}
                                                                    >
                                                                        <div className="d-flex justify-content-between">
                                                                            <span className="fw-medium">
                                                                                {employee.first_name || ''} {employee.last_name || ''}
                                                                            </span>
                                                                            <span className="text-muted">
                                                                                {employee.employee_id || ''}
                                                                            </span>
                                                                        </div>
                                                                        {employee.department && (
                                                                            <small className="text-muted d-block">{employee.department}</small>
                                                                        )}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {errors.employee_id && (
                                                        <div className="invalid-feedback d-block">{errors.employee_id}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Selected Employee Info */}
                                        {selectedEmployee && (
                                            <div className="row">
                                                <div className="col-lg-12">
                                                    <div className="alert alert-info">
                                                        <h6 className="alert-heading">Seçilen Çalışan</h6>
                                                        <div className="row">
                                                            <div className="col-md-3">
                                                                <strong>Ad Soyad:</strong><br />
                                                                {selectedEmployee.first_name || ''} {selectedEmployee.last_name || ''}
                                                            </div>
                                                            <div className="col-md-3">
                                                                <strong>Sicil No:</strong><br />
                                                                {selectedEmployee.employee_id || ''}
                                                            </div>
                                                            {selectedEmployee.email && (
                                                                <div className="col-md-3">
                                                                    <strong>E-posta:</strong><br />
                                                                    {selectedEmployee.email}
                                                                </div>
                                                            )}
                                                            {selectedEmployee.phone && (
                                                                <div className="col-md-3">
                                                                    <strong>Telefon:</strong><br />
                                                                    {selectedEmployee.phone}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="row">
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
                                        </div>

                                        <div className="row">
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
                                                        disabled={processing || !selectedEmployee}
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