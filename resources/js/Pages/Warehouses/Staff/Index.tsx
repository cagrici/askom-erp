import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Layout from '../../../Layouts';

interface Warehouse {
    id: number;
    name: string;
    code: string;
}

interface Staff {
    id: number;
    warehouse_id: number;
    employee_id?: string;
    first_name: string;
    last_name: string;
    full_name: string;
    email?: string;
    phone?: string;
    role: string;
    hire_date: string;
    hourly_rate?: number;
    shift: string;
    status: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    completed_operations_this_month: number;
    efficiency_rating: number;
    warehouse: Warehouse;
    created_at: string;
}

interface Props {
    staff: Staff[];
    warehouses: Warehouse[];
}

const Index: React.FC<Props> = ({ staff, warehouses }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [warehouseFilter, setWarehouseFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [shiftFilter, setShiftFilter] = useState('');

    useEffect(() => {
        // Initialize Bootstrap dropdowns
        const dropdowns = document.querySelectorAll('[data-bs-toggle="dropdown"]');
        dropdowns.forEach(dropdown => {
            dropdown.addEventListener('click', function(e) {
                e.preventDefault();
                const menu = this.nextElementSibling;
                if (menu) {
                    menu.classList.toggle('show');
                }
            });
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.dropdown')) {
                document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                    menu.classList.remove('show');
                });
            }
        });

        return () => {
            document.removeEventListener('click', function() {});
        };
    }, []);

    const filteredStaff = staff.filter(person => {
        const matchesSearch = person.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (person.employee_id && person.employee_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (person.email && person.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            person.warehouse.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesWarehouse = !warehouseFilter || person.warehouse_id.toString() === warehouseFilter;
        const matchesStatus = !statusFilter || person.status === statusFilter;
        const matchesRole = !roleFilter || person.role === roleFilter;
        const matchesShift = !shiftFilter || person.shift === shiftFilter;

        return matchesSearch && matchesWarehouse && matchesStatus && matchesRole && matchesShift;
    });

    const getRoleText = (role: string) => {
        const roles: { [key: string]: string } = {
            'manager': 'Müdür',
            'supervisor': 'Süpervizör',
            'operator': 'Operatör',
            'picker': 'Toplayıcı',
            'packer': 'Paketleyici',
            'receiver': 'Mal Kabul',
            'shipper': 'Sevkiyatçı',
            'quality_control': 'Kalite Kontrol',
            'maintenance': 'Bakım'
        };
        return roles[role] || role;
    };

    const getShiftText = (shift: string) => {
        const shifts: { [key: string]: string } = {
            'day': 'Sabah',
            'evening': 'Akşam',
            'night': 'Gece',
            'rotating': 'Dönüşümlü'
        };
        return shifts[shift] || shift;
    };

    const getStatusBadge = (status: string) => {
        const statuses: { [key: string]: { text: string; class: string } } = {
            'active': { text: 'Aktif', class: 'bg-success-subtle text-success' },
            'inactive': { text: 'Pasif', class: 'bg-secondary-subtle text-secondary' },
            'on_leave': { text: 'İzinli', class: 'bg-warning-subtle text-warning' },
            'terminated': { text: 'İşten Çıkarıldı', class: 'bg-danger-subtle text-danger' }
        };
        const statusInfo = statuses[status] || { text: status, class: 'bg-secondary-subtle text-secondary' };
        return <span className={`badge ${statusInfo.class}`}>{statusInfo.text}</span>;
    };

    const getEfficiencyColor = (rating: number) => {
        if (rating >= 90) return 'text-success';
        if (rating >= 70) return 'text-warning';
        return 'text-danger';
    };

    const getEfficiencyIcon = (rating: number) => {
        if (rating >= 90) return 'bx bx-trending-up';
        if (rating >= 70) return 'bx bx-trending-up';
        return 'bx bx-trending-down';
    };

    const handleDelete = (person: Staff) => {
        if (confirm(`${person.full_name} personelini silmek istediğinizden emin misiniz?`)) {
            router.delete(`/warehouses/staff/${person.id}`);
        }
    };

    return (
        <Layout>
            <Head title="Depo Personeli" />

            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Depo Personeli</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link href="/warehouses">Depo Yönetimi</Link></li>
                                        <li className="breadcrumb-item active">Personel</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="row">
                        <div className="col-xl-3 col-md-6">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1 overflow-hidden">
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Toplam Personel</p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-primary-subtle rounded fs-3">
                                                <i className="bx bx-user text-primary"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">{staff.length}</span>
                                            </h4>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-3 col-md-6">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1 overflow-hidden">
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Aktif Personel</p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-success-subtle rounded fs-3">
                                                <i className="bx bx-check-circle text-success"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">{staff.filter(s => s.status === 'active').length}</span>
                                            </h4>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-3 col-md-6">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1 overflow-hidden">
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Aylık Operasyon</p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-info-subtle rounded fs-3">
                                                <i className="bx bx-task text-info"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">{staff.reduce((sum, s) => sum + s.completed_operations_this_month, 0)}</span>
                                            </h4>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-3 col-md-6">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1 overflow-hidden">
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Ortalama Verimlilik</p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-warning-subtle rounded fs-3">
                                                <i className="bx bx-trending-up text-warning"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">
                                                    {staff.length > 0 ? (staff.reduce((sum, s) => sum + s.efficiency_rating, 0) / staff.length).toFixed(1) : 0}
                                                </span>%
                                            </h4>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters and Actions */}
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="card">
                                <div className="card-header">
                                    <div className="d-flex align-items-center">
                                        <h5 className="card-title mb-0 flex-grow-1">Personel Listesi</h5>
                                        <div className="flex-shrink-0">
                                            <Link
                                                href="/warehouses/staff/create"
                                                className="btn btn-primary add-btn"
                                            >
                                                <i className="ri-add-line align-bottom me-1"></i> Yeni Personel
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-body">
                                    <div className="row g-3 mb-3">
                                        <div className="col-md-2">
                                            <div className="search-box">
                                                <input
                                                    type="text"
                                                    className="form-control search"
                                                    placeholder="Personel ara..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                                <i className="ri-search-line search-icon"></i>
                                            </div>
                                        </div>
                                        <div className="col-md-2">
                                            <select
                                                className="form-select"
                                                value={warehouseFilter}
                                                onChange={(e) => setWarehouseFilter(e.target.value)}
                                            >
                                                <option value="">Tüm Depolar</option>
                                                {warehouses.map(warehouse => (
                                                    <option key={warehouse.id} value={warehouse.id}>
                                                        {warehouse.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-2">
                                            <select
                                                className="form-select"
                                                value={statusFilter}
                                                onChange={(e) => setStatusFilter(e.target.value)}
                                            >
                                                <option value="">Tüm Durumlar</option>
                                                <option value="active">Aktif</option>
                                                <option value="inactive">Pasif</option>
                                                <option value="on_leave">İzinli</option>
                                                <option value="terminated">İşten Çıkarıldı</option>
                                            </select>
                                        </div>
                                        <div className="col-md-2">
                                            <select
                                                className="form-select"
                                                value={roleFilter}
                                                onChange={(e) => setRoleFilter(e.target.value)}
                                            >
                                                <option value="">Tüm Roller</option>
                                                <option value="manager">Müdür</option>
                                                <option value="supervisor">Süpervizör</option>
                                                <option value="operator">Operatör</option>
                                                <option value="picker">Toplayıcı</option>
                                                <option value="packer">Paketleyici</option>
                                                <option value="receiver">Mal Kabul</option>
                                                <option value="shipper">Sevkiyatçı</option>
                                            </select>
                                        </div>
                                        <div className="col-md-2">
                                            <select
                                                className="form-select"
                                                value={shiftFilter}
                                                onChange={(e) => setShiftFilter(e.target.value)}
                                            >
                                                <option value="">Tüm Vardiyalar</option>
                                                <option value="day">Sabah</option>
                                                <option value="evening">Akşam</option>
                                                <option value="night">Gece</option>
                                                <option value="rotating">Dönüşümlü</option>
                                            </select>
                                        </div>
                                        <div className="col-md-2">
                                            <button
                                                className="btn btn-secondary w-100"
                                                onClick={() => {
                                                    setSearchTerm('');
                                                    setWarehouseFilter('');
                                                    setStatusFilter('');
                                                    setRoleFilter('');
                                                    setShiftFilter('');
                                                }}
                                            >
                                                <i className="ri-refresh-line"></i> Temizle
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Staff Table */}
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="card">
                                <div className="card-body">
                                    <div className="table-responsive table-card">
                                        <table className="table table-nowrap table-striped-columns mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th scope="col">Personel</th>
                                                    <th scope="col">Rol</th>
                                                    <th scope="col">Depo</th>
                                                    <th scope="col">Vardiya</th>
                                                    <th scope="col">Performans</th>
                                                    <th scope="col">Bu Ay</th>
                                                    <th scope="col">İletişim</th>
                                                    <th scope="col">Durum</th>
                                                    <th scope="col">İşlemler</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredStaff.length > 0 ? (
                                                    filteredStaff.map((person) => (
                                                        <tr key={person.id}>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <div className="avatar-sm me-3">
                                                                        <div className="avatar-title bg-primary-subtle text-primary rounded-circle">
                                                                            <i className="bx bx-user"></i>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-grow-1">
                                                                        <Link
                                                                            href={`/warehouses/staff/${person.id}`}
                                                                            className="text-body fw-medium"
                                                                        >
                                                                            {person.full_name}
                                                                        </Link>
                                                                        {person.employee_id && (
                                                                            <p className="text-muted mb-0">{person.employee_id}</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className="badge bg-light text-body">
                                                                    {getRoleText(person.role)}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className="fw-medium">{person.warehouse.name}</span>
                                                                <br />
                                                                <small className="text-muted">{person.warehouse.code}</small>
                                                            </td>
                                                            <td>
                                                                <span className="fw-medium">{getShiftText(person.shift)}</span>
                                                            </td>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <i className={`${getEfficiencyIcon(person.efficiency_rating)} ${getEfficiencyColor(person.efficiency_rating)} me-2`}></i>
                                                                    <span className={`fw-medium ${getEfficiencyColor(person.efficiency_rating)}`}>
                                                                        {person.efficiency_rating.toFixed(1)}%
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className="fw-medium">{person.completed_operations_this_month}</span>
                                                                <br />
                                                                <small className="text-muted">operasyon</small>
                                                            </td>
                                                            <td>
                                                                {person.email && (
                                                                    <React.Fragment>
                                                                        <a href={`mailto:${person.email}`} className="text-primary">
                                                                            <i className="bx bx-envelope me-1"></i>
                                                                            E-posta
                                                                        </a>
                                                                        <br />
                                                                    </React.Fragment>
                                                                )}
                                                                {person.phone && (
                                                                    <a href={`tel:${person.phone}`} className="text-success">
                                                                        <i className="bx bx-phone me-1"></i>
                                                                        Telefon
                                                                    </a>
                                                                )}
                                                            </td>
                                                            <td>
                                                                {getStatusBadge(person.status)}
                                                            </td>
                                                            <td>
                                                                <div className="dropdown">
                                                                    <button
                                                                        className="btn btn-soft-secondary btn-sm dropdown-toggle"
                                                                        type="button"
                                                                        data-bs-toggle="dropdown"
                                                                        aria-expanded="false"
                                                                    >
                                                                        <i className="ri-more-fill align-middle"></i>
                                                                    </button>
                                                                    <ul className="dropdown-menu dropdown-menu-end">
                                                                        <li>
                                                                            <Link
                                                                                className="dropdown-item"
                                                                                href={`/warehouses/staff/${person.id}`}
                                                                            >
                                                                                <i className="ri-eye-fill align-bottom me-2 text-muted"></i> Görüntüle
                                                                            </Link>
                                                                        </li>
                                                                        <li>
                                                                            <Link
                                                                                className="dropdown-item"
                                                                                href={`/warehouses/staff/${person.id}/edit`}
                                                                            >
                                                                                <i className="ri-pencil-fill align-bottom me-2 text-muted"></i> Düzenle
                                                                            </Link>
                                                                        </li>
                                                                        <li className="dropdown-divider"></li>
                                                                        <li>
                                                                            <button
                                                                                className="dropdown-item text-danger"
                                                                                onClick={() => handleDelete(person)}
                                                                            >
                                                                                <i className="ri-delete-bin-fill align-bottom me-2"></i> Sil
                                                                            </button>
                                                                        </li>
                                                                    </ul>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={9} className="text-center py-4">
                                                            <div className="text-muted">Kayıt bulunamadı</div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Index;
