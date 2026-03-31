import React from 'react';
import { Head, Link } from '@inertiajs/react';
import Layout from '../../../Layouts';

const Index: React.FC = () => {
    const reportCategories = [
        {
            title: 'Stok Raporları',
            description: 'Stok seviyesi ve değer raporları',
            icon: 'ri-bar-chart-box-line',
            color: 'primary',
            reports: [
                {
                    name: 'Stok Özet Raporu',
                    description: 'Tüm stokların özet görünümü',
                    url: '/inventory/reports?type=stock_summary',
                    icon: 'ri-file-list-3-line'
                },
                {
                    name: 'ABC Analizi',
                    description: 'Ürünlerin ABC sınıflandırması',
                    url: '/inventory/reports?type=abc_analysis',
                    icon: 'ri-pie-chart-line'
                },
                {
                    name: 'Stok Değer Raporu',
                    description: 'Stok değerlerinin detaylı analizi',
                    url: '/inventory/reports?type=stock_value',
                    icon: 'ri-money-dollar-circle-line'
                }
            ]
        },
        {
            title: 'Hareket Raporları',
            description: 'Stok giriş-çıkış ve transfer raporları',
            icon: 'ri-arrow-left-right-line',
            color: 'success',
            reports: [
                {
                    name: 'Hareket Raporu',
                    description: 'Tüm stok hareketlerinin detayı',
                    url: '/inventory/reports?type=movement_report',
                    icon: 'ri-exchange-line'
                },
                {
                    name: 'Giriş-Çıkış Raporu',
                    description: 'Belirli dönemdeki giriş ve çıkışlar',
                    url: '/inventory/reports?type=inout_report',
                    icon: 'ri-arrow-up-down-line'
                },
                {
                    name: 'Transfer Raporu',
                    description: 'Depolar arası transfer hareketleri',
                    url: '/inventory/reports?type=transfer_report',
                    icon: 'ri-truck-line'
                }
            ]
        },
        {
            title: 'Uyarı Raporları',
            description: 'Düşük stok ve SKT uyarıları',
            icon: 'ri-alarm-warning-line',
            color: 'warning',
            reports: [
                {
                    name: 'Son Kullanma Tarihi Raporu',
                    description: 'Yaklaşan ve geçmiş SKT\'ler',
                    url: '/inventory/reports?type=expiry_report',
                    icon: 'ri-time-line'
                },
                {
                    name: 'Düşük Stok Raporu',
                    description: 'Minimum stok seviyesinin altındaki ürünler',
                    url: '/inventory/reports?type=low_stock_report',
                    icon: 'ri-error-warning-line'
                },
                {
                    name: 'Stok Yokluğu Raporu',
                    description: 'Stoku tükenmiş ürünler',
                    url: '/inventory/reports?type=out_of_stock_report',
                    icon: 'ri-close-circle-line'
                }
            ]
        },
        {
            title: 'Analiz Raporları',
            description: 'Derinlemesine analiz ve istatistikler',
            icon: 'ri-line-chart-line',
            color: 'info',
            reports: [
                {
                    name: 'Yavaş Hareket Eden Ürünler',
                    description: 'Uzun süre hareket etmeyen stoklar',
                    url: '/inventory/reports?type=slow_moving',
                    icon: 'ri-speed-line'
                },
                {
                    name: 'Sayım Varyans Raporu',
                    description: 'Fiziki sayım ile sistem farkları',
                    url: '/inventory/reports?type=count_variance',
                    icon: 'ri-calculator-line'
                },
                {
                    name: 'Stok Devir Hızı',
                    description: 'Ürün bazında stok devir analizi',
                    url: '/inventory/reports?type=turnover_analysis',
                    icon: 'ri-refresh-line'
                }
            ]
        }
    ];

    const quickStats = [
        {
            title: 'Toplam Stok Değeri',
            value: '₺2.450.000',
            change: '+12.5%',
            changeType: 'increase',
            icon: 'ri-money-dollar-circle-line',
            color: 'primary'
        },
        {
            title: 'Aktif Ürün Sayısı',
            value: '1.245',
            change: '+3.2%',
            changeType: 'increase',
            icon: 'ri-package-line',
            color: 'success'
        },
        {
            title: 'Düşük Stok Uyarısı',
            value: '23',
            change: '-15.0%',
            changeType: 'decrease',
            icon: 'ri-error-warning-line',
            color: 'warning'
        },
        {
            title: 'SKT Yaklaşan',
            value: '8',
            change: '+25.0%',
            changeType: 'increase',
            icon: 'ri-time-line',
            color: 'danger'
        }
    ];

    return (
        <Layout>
            <Head title="Envanter Raporları" />
            
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Envanter Raporları</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link href="/inventory">Envanter</Link></li>
                                        <li className="breadcrumb-item active">Raporlar</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="row">
                        {quickStats.map((stat, index) => (
                            <div key={index} className="col-xl-3 col-md-6">
                                <div className="card card-animate">
                                    <div className="card-body">
                                        <div className="d-flex align-items-center">
                                            <div className="flex-grow-1 overflow-hidden">
                                                <p className="text-uppercase fw-medium text-muted text-truncate mb-0">
                                                    {stat.title}
                                                </p>
                                            </div>
                                            <div className="avatar-sm flex-shrink-0">
                                                <span className={`avatar-title bg-${stat.color}-subtle rounded fs-3`}>
                                                    <i className={`${stat.icon} text-${stat.color}`}></i>
                                                </span>
                                            </div>
                                        </div>
                                        <div className="d-flex align-items-end justify-content-between mt-4">
                                            <div>
                                                <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                    <span className="counter-value">{stat.value}</span>
                                                </h4>
                                                <span className={`badge bg-${stat.changeType === 'increase' ? 'success' : 'danger'}-subtle text-${stat.changeType === 'increase' ? 'success' : 'danger'} mb-0`}>
                                                    <i className={`ri-arrow-${stat.changeType === 'increase' ? 'up' : 'down'}-line align-middle`}></i>
                                                    {stat.change}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Report Categories */}
                    {reportCategories.map((category, categoryIndex) => (
                        <div key={categoryIndex} className="row">
                            <div className="col-lg-12">
                                <div className="card">
                                    <div className="card-header">
                                        <div className="d-flex align-items-center">
                                            <div className={`avatar-sm me-3`}>
                                                <span className={`avatar-title bg-${category.color}-subtle text-${category.color} rounded fs-3`}>
                                                    <i className={category.icon}></i>
                                                </span>
                                            </div>
                                            <div className="flex-grow-1">
                                                <h4 className="card-title mb-1">{category.title}</h4>
                                                <p className="text-muted mb-0">{category.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card-body">
                                        <div className="row">
                                            {category.reports.map((report, reportIndex) => (
                                                <div key={reportIndex} className="col-md-4">
                                                    <Link 
                                                        href={report.url}
                                                        className="text-decoration-none"
                                                    >
                                                        <div className="border rounded p-4 h-100 hover-shadow-sm">
                                                            <div className="d-flex align-items-start">
                                                                <div className="avatar-sm me-3">
                                                                    <div className="avatar-title bg-light text-primary rounded">
                                                                        <i className={report.icon}></i>
                                                                    </div>
                                                                </div>
                                                                <div className="flex-grow-1">
                                                                    <h5 className="fs-15 mb-2">{report.name}</h5>
                                                                    <p className="text-muted mb-0">{report.description}</p>
                                                                </div>
                                                                <div className="flex-shrink-0">
                                                                    <i className="ri-arrow-right-line text-muted"></i>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Recent Reports */}
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="card">
                                <div className="card-header align-items-center d-flex">
                                    <h4 className="card-title mb-0 flex-grow-1">Son Oluşturulan Raporlar</h4>
                                    <div className="flex-shrink-0">
                                        <button type="button" className="btn btn-soft-info btn-sm">
                                            <i className="ri-file-list-3-line align-middle"></i> Tümünü Görüntüle
                                        </button>
                                    </div>
                                </div>
                                <div className="card-body">
                                    <div className="table-responsive table-card">
                                        <table className="table table-borderless table-centered align-middle table-nowrap mb-0">
                                            <thead className="text-muted table-light">
                                                <tr>
                                                    <th scope="col">Rapor Adı</th>
                                                    <th scope="col">Tür</th>
                                                    <th scope="col">Oluşturan</th>
                                                    <th scope="col">Tarih</th>
                                                    <th scope="col">Durum</th>
                                                    <th scope="col">İşlemler</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <div className="avatar-xs me-3">
                                                                <div className="avatar-title bg-success-subtle text-success rounded-circle">
                                                                    <i className="ri-file-excel-line"></i>
                                                                </div>
                                                            </div>
                                                            <div className="flex-grow-1">
                                                                <h5 className="fs-14 mb-0">Ocak 2024 Stok Özeti</h5>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td><span className="badge bg-primary-subtle text-primary">Stok Raporu</span></td>
                                                    <td>John Doe</td>
                                                    <td>15 Şubat 2024</td>
                                                    <td><span className="badge bg-success-subtle text-success">Tamamlandı</span></td>
                                                    <td>
                                                        <div className="dropdown">
                                                            <button className="btn btn-soft-secondary btn-sm dropdown" type="button" data-bs-toggle="dropdown">
                                                                <i className="ri-more-fill"></i>
                                                            </button>
                                                            <ul className="dropdown-menu dropdown-menu-end">
                                                                <li><a className="dropdown-item" href="#"><i className="ri-eye-line me-2"></i>Görüntüle</a></li>
                                                                <li><a className="dropdown-item" href="#"><i className="ri-download-line me-2"></i>İndir</a></li>
                                                                <li><a className="dropdown-item" href="#"><i className="ri-share-line me-2"></i>Paylaş</a></li>
                                                            </ul>
                                                        </div>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <div className="avatar-xs me-3">
                                                                <div className="avatar-title bg-danger-subtle text-danger rounded-circle">
                                                                    <i className="ri-file-pdf-line"></i>
                                                                </div>
                                                            </div>
                                                            <div className="flex-grow-1">
                                                                <h5 className="fs-14 mb-0">SKT Uyarı Raporu</h5>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td><span className="badge bg-warning-subtle text-warning">Uyarı Raporu</span></td>
                                                    <td>Jane Smith</td>
                                                    <td>14 Şubat 2024</td>
                                                    <td><span className="badge bg-success-subtle text-success">Tamamlandı</span></td>
                                                    <td>
                                                        <div className="dropdown">
                                                            <button className="btn btn-soft-secondary btn-sm dropdown" type="button" data-bs-toggle="dropdown">
                                                                <i className="ri-more-fill"></i>
                                                            </button>
                                                            <ul className="dropdown-menu dropdown-menu-end">
                                                                <li><a className="dropdown-item" href="#"><i className="ri-eye-line me-2"></i>Görüntüle</a></li>
                                                                <li><a className="dropdown-item" href="#"><i className="ri-download-line me-2"></i>İndir</a></li>
                                                                <li><a className="dropdown-item" href="#"><i className="ri-share-line me-2"></i>Paylaş</a></li>
                                                            </ul>
                                                        </div>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <div className="avatar-xs me-3">
                                                                <div className="avatar-title bg-info-subtle text-info rounded-circle">
                                                                    <i className="ri-file-chart-line"></i>
                                                                </div>
                                                            </div>
                                                            <div className="flex-grow-1">
                                                                <h5 className="fs-14 mb-0">ABC Analiz Raporu</h5>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td><span className="badge bg-info-subtle text-info">Analiz Raporu</span></td>
                                                    <td>Mike Johnson</td>
                                                    <td>13 Şubat 2024</td>
                                                    <td><span className="badge bg-warning-subtle text-warning">İşlemde</span></td>
                                                    <td>
                                                        <div className="dropdown">
                                                            <button className="btn btn-soft-secondary btn-sm dropdown" type="button" data-bs-toggle="dropdown">
                                                                <i className="ri-more-fill"></i>
                                                            </button>
                                                            <ul className="dropdown-menu dropdown-menu-end">
                                                                <li><a className="dropdown-item" href="#"><i className="ri-eye-line me-2"></i>Görüntüle</a></li>
                                                                <li><a className="dropdown-item" href="#"><i className="ri-close-line me-2"></i>İptal Et</a></li>
                                                            </ul>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .hover-shadow-sm:hover {
                    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075) !important;
                    transition: box-shadow 0.15s ease-in-out;
                }
            `}</style>
        </Layout>
    );
};

export default Index;