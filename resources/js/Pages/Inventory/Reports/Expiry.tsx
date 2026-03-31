import React from 'react';
import { Head, Link } from '@inertiajs/react';
import Layout from '../../../Layouts';

interface InventoryStock {
    id: number;
    quantity_on_hand: number;
    quantity_available: number;
    unit_cost: number;
    total_cost: number;
    lot_number?: string;
    expiry_date: string;
    manufacturing_date?: string;
    condition: string;
    inventory_item: {
        id: number;
        name: string;
        sku: string;
        barcode?: string;
        base_unit: string;
    };
    warehouse: {
        id: number;
        name: string;
        code: string;
    };
    location?: {
        id: number;
        name: string;
        code: string;
    };
}

interface Props {
    expiringItems: InventoryStock[];
}

const Expiry: React.FC<Props> = ({ expiringItems }) => {
    const getExpiryStatus = (expiryDate: string) => {
        const expiry = new Date(expiryDate);
        const now = new Date();
        const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry < 0) {
            return {
                status: 'expired',
                text: 'Vadesi Geçmiş',
                class: 'bg-danger-subtle text-danger',
                icon: 'ri-close-circle-line',
                days: Math.abs(daysUntilExpiry)
            };
        } else if (daysUntilExpiry <= 7) {
            return {
                status: 'critical',
                text: `${daysUntilExpiry} gün kaldı`,
                class: 'bg-danger-subtle text-danger',
                icon: 'ri-alarm-warning-line',
                days: daysUntilExpiry
            };
        } else if (daysUntilExpiry <= 30) {
            return {
                status: 'warning',
                text: `${daysUntilExpiry} gün kaldı`,
                class: 'bg-warning-subtle text-warning',
                icon: 'ri-error-warning-line',
                days: daysUntilExpiry
            };
        } else {
            return {
                status: 'normal',
                text: `${daysUntilExpiry} gün kaldı`,
                class: 'bg-info-subtle text-info',
                icon: 'ri-information-line',
                days: daysUntilExpiry
            };
        }
    };

    const getStatsData = () => {
        const expired = expiringItems.filter(item => {
            const expiry = new Date(item.expiry_date);
            return expiry < new Date();
        });

        const critical = expiringItems.filter(item => {
            const expiry = new Date(item.expiry_date);
            const now = new Date();
            const days = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return days >= 0 && days <= 7;
        });

        const warning = expiringItems.filter(item => {
            const expiry = new Date(item.expiry_date);
            const now = new Date();
            const days = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return days > 7 && days <= 30;
        });

        const normal = expiringItems.filter(item => {
            const expiry = new Date(item.expiry_date);
            const now = new Date();
            const days = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return days > 30;
        });

        return {
            expired: {
                count: expired.length,
                value: expired.reduce((sum, item) => sum + item.total_cost, 0)
            },
            critical: {
                count: critical.length,
                value: critical.reduce((sum, item) => sum + item.total_cost, 0)
            },
            warning: {
                count: warning.length,
                value: warning.reduce((sum, item) => sum + item.total_cost, 0)
            },
            normal: {
                count: normal.length,
                value: normal.reduce((sum, item) => sum + item.total_cost, 0)
            },
            total: {
                count: expiringItems.length,
                value: expiringItems.reduce((sum, item) => sum + item.total_cost, 0)
            }
        };
    };

    const stats = getStatsData();

    const exportToPDF = () => {
        window.print();
    };

    const exportToExcel = () => {
        const csvContent = "data:text/csv;charset=utf-8," 
            + "SKU,Ürün Adı,Lot No,Son Kullanma Tarihi,Kalan Gün,Miktar,Birim,Toplam Değer,Depo,Lokasyon,Durum\n"
            + expiringItems.map(item => {
                const expiryStatus = getExpiryStatus(item.expiry_date);
                return `${item.inventory_item.sku},"${item.inventory_item.name}","${item.lot_number || ''}",${new Date(item.expiry_date).toLocaleDateString('tr-TR')},${expiryStatus.days},${item.quantity_on_hand},${item.inventory_item.base_unit},${item.total_cost},"${item.warehouse.name}","${item.location?.name || ''}",${expiryStatus.text}`;
            }).join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "son_kullanma_tarihi_raporu.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Layout>
            <Head title="Son Kullanma Tarihi Raporu" />
            
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Son Kullanma Tarihi Raporu</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link href="/inventory">Envanter</Link></li>
                                        <li className="breadcrumb-item"><Link href="/inventory/reports">Raporlar</Link></li>
                                        <li className="breadcrumb-item active">SKT Raporu</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="row">
                        <div className="col-xl-3 col-md-6">
                            <div className="card card-animate border-danger">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1 overflow-hidden">
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Vadesi Geçmiş</p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-danger-subtle rounded fs-3">
                                                <i className="bx bx-x-circle text-danger"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">{stats.expired.count}</span>
                                            </h4>
                                            <p className="text-muted mb-0">₺{stats.expired.value.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-3 col-md-6">
                            <div className="card card-animate border-danger">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1 overflow-hidden">
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Kritik (7 gün)</p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-danger-subtle rounded fs-3">
                                                <i className="bx bx-alarm-exclamation text-danger"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">{stats.critical.count}</span>
                                            </h4>
                                            <p className="text-muted mb-0">₺{stats.critical.value.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-3 col-md-6">
                            <div className="card card-animate border-warning">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1 overflow-hidden">
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Uyarı (30 gün)</p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-warning-subtle rounded fs-3">
                                                <i className="bx bx-error text-warning"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">{stats.warning.count}</span>
                                            </h4>
                                            <p className="text-muted mb-0">₺{stats.warning.value.toLocaleString()}</p>
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
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Toplam</p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-primary-subtle rounded fs-3">
                                                <i className="bx bx-package text-primary"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">{stats.total.count}</span>
                                            </h4>
                                            <p className="text-muted mb-0">₺{stats.total.value.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="card">
                                <div className="card-header">
                                    <h4 className="card-title mb-0">Önerilen Aksiyonlar</h4>
                                </div>
                                <div className="card-body">
                                    <div className="row">
                                        <div className="col-md-3">
                                            <div className="border rounded p-3 text-center h-100">
                                                <div className="avatar-md mx-auto mb-3">
                                                    <div className="avatar-title bg-danger-subtle text-danger rounded-circle">
                                                        <i className="bx bx-error-circle fs-2"></i>
                                                    </div>
                                                </div>
                                                <h6>Vadesi Geçmiş Ürünler</h6>
                                                <p className="text-muted mb-3">Bu ürünler satılamaz ve imha edilmelidir</p>
                                                <button className="btn btn-danger btn-sm">
                                                    <i className="ri-delete-bin-line"></i> İmha Et
                                                </button>
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="border rounded p-3 text-center h-100">
                                                <div className="avatar-md mx-auto mb-3">
                                                    <div className="avatar-title bg-warning-subtle text-warning rounded-circle">
                                                        <i className="bx bx-alarm-exclamation fs-2"></i>
                                                    </div>
                                                </div>
                                                <h6>Kritik Ürünler</h6>
                                                <p className="text-muted mb-3">Acil satış veya transfer yapılmalıdır</p>
                                                <button className="btn btn-warning btn-sm">
                                                    <i className="ri-price-tag-3-line"></i> İndirimli Sat
                                                </button>
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="border rounded p-3 text-center h-100">
                                                <div className="avatar-md mx-auto mb-3">
                                                    <div className="avatar-title bg-info-subtle text-info rounded-circle">
                                                        <i className="bx bx-transfer fs-2"></i>
                                                    </div>
                                                </div>
                                                <h6>Transfer</h6>
                                                <p className="text-muted mb-3">Başka lokasyona transfer edilebilir</p>
                                                <button className="btn btn-info btn-sm">
                                                    <i className="ri-truck-line"></i> Transfer Et
                                                </button>
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="border rounded p-3 text-center h-100">
                                                <div className="avatar-md mx-auto mb-3">
                                                    <div className="avatar-title bg-success-subtle text-success rounded-circle">
                                                        <i className="bx bx-check-shield fs-2"></i>
                                                    </div>
                                                </div>
                                                <h6>Kalite Kontrolü</h6>
                                                <p className="text-muted mb-3">Ürün durumu yeniden değerlendirilmeli</p>
                                                <button className="btn btn-success btn-sm">
                                                    <i className="ri-shield-check-line"></i> Kontrol Et
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Table */}
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="card">
                                <div className="card-header align-items-center d-flex">
                                    <h4 className="card-title mb-0 flex-grow-1">
                                        Son Kullanma Tarihi Raporu ({expiringItems.length} kayıt)
                                    </h4>
                                    <div className="flex-shrink-0">
                                        <div className="d-flex gap-1">
                                            <button 
                                                className="btn btn-soft-danger btn-sm"
                                                onClick={exportToPDF}
                                            >
                                                <i className="ri-file-pdf-line align-middle"></i> PDF
                                            </button>
                                            <button 
                                                className="btn btn-soft-success btn-sm"
                                                onClick={exportToExcel}
                                            >
                                                <i className="ri-file-excel-line align-middle"></i> Excel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="card-body">
                                    <div className="table-responsive table-card">
                                        <table className="table table-nowrap table-striped-columns mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th scope="col">Ürün</th>
                                                    <th scope="col">Lot No</th>
                                                    <th scope="col">Son Kullanma Tarihi</th>
                                                    <th scope="col">Durum</th>
                                                    <th scope="col">Miktar</th>
                                                    <th scope="col">Toplam Değer</th>
                                                    <th scope="col">Depo/Lokasyon</th>
                                                    <th scope="col">İşlemler</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {expiringItems.length > 0 ? (
                                                    expiringItems.map((item) => {
                                                        const expiryStatus = getExpiryStatus(item.expiry_date);
                                                        return (
                                                            <tr key={item.id}>
                                                                <td>
                                                                    <div className="d-flex align-items-center">
                                                                        <div className="flex-grow-1">
                                                                            <Link href={`/inventory/items/${item.inventory_item.id}`} className="text-body fw-medium">
                                                                                {item.inventory_item.name}
                                                                            </Link>
                                                                            <br />
                                                                            <small className="text-muted">SKU: {item.inventory_item.sku}</small>
                                                                            {item.inventory_item.barcode && (
                                                                                <><br /><small className="text-muted">{item.inventory_item.barcode}</small></>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    {item.lot_number ? (
                                                                        <span className="badge bg-light text-body">{item.lot_number}</span>
                                                                    ) : (
                                                                        <span className="text-muted">-</span>
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    <span className="fw-medium">
                                                                        {new Date(item.expiry_date).toLocaleDateString('tr-TR')}
                                                                    </span>
                                                                    {item.manufacturing_date && (
                                                                        <>
                                                                            <br />
                                                                            <small className="text-muted">
                                                                                Üretim: {new Date(item.manufacturing_date).toLocaleDateString('tr-TR')}
                                                                            </small>
                                                                        </>
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    <span className={`badge ${expiryStatus.class}`}>
                                                                        <i className={`${expiryStatus.icon} me-1`}></i>
                                                                        {expiryStatus.text}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <span className="fw-medium">
                                                                        {item.quantity_on_hand} {item.inventory_item.base_unit}
                                                                    </span>
                                                                    <br />
                                                                    <small className="text-success">
                                                                        Kullanılabilir: {item.quantity_available}
                                                                    </small>
                                                                </td>
                                                                <td>
                                                                    <span className="fw-medium">₺{item.total_cost.toLocaleString()}</span>
                                                                    <br />
                                                                    <small className="text-muted">@₺{item.unit_cost.toLocaleString()}</small>
                                                                </td>
                                                                <td>
                                                                    <span className="fw-medium">{item.warehouse.name}</span>
                                                                    {item.location && (
                                                                        <><br /><small className="text-muted">{item.location.name}</small></>
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    <div className="dropdown">
                                                                        <button className="btn btn-soft-secondary btn-sm dropdown" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                                            <i className="ri-more-fill align-middle"></i>
                                                                        </button>
                                                                        <ul className="dropdown-menu dropdown-menu-end">
                                                                            {expiryStatus.status === 'expired' ? (
                                                                                <li>
                                                                                    <a className="dropdown-item text-danger" href="#">
                                                                                        <i className="ri-delete-bin-line align-bottom me-2"></i> İmha Et
                                                                                    </a>
                                                                                </li>
                                                                            ) : (
                                                                                <>
                                                                                    <li>
                                                                                        <a className="dropdown-item" href="#">
                                                                                            <i className="ri-price-tag-3-line align-bottom me-2 text-muted"></i> İndirimli Sat
                                                                                        </a>
                                                                                    </li>
                                                                                    <li>
                                                                                        <a className="dropdown-item" href="#">
                                                                                            <i className="ri-truck-line align-bottom me-2 text-muted"></i> Transfer Et
                                                                                        </a>
                                                                                    </li>
                                                                                </>
                                                                            )}
                                                                            <li>
                                                                                <a className="dropdown-item" href="#">
                                                                                    <i className="ri-shield-check-line align-bottom me-2 text-muted"></i> Kalite Kontrolü
                                                                                </a>
                                                                            </li>
                                                                            <li className="dropdown-divider"></li>
                                                                            <li>
                                                                                <a className="dropdown-item" href="#">
                                                                                    <i className="ri-edit-box-line align-bottom me-2 text-muted"></i> SKT Güncelle
                                                                                </a>
                                                                            </li>
                                                                        </ul>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                ) : (
                                                    <tr>
                                                        <td colSpan={8} className="text-center py-4">
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

export default Expiry;