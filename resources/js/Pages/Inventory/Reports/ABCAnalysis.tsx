import React from 'react';
import { Head, Link } from '@inertiajs/react';
import Layout from '../../../Layouts';

interface InventoryItem {
    id: number;
    name: string;
    sku: string;
    barcode?: string;
    abc_classification: 'A' | 'B' | 'C';
    annual_consumption_value: number;
    annual_consumption_quantity: number;
    unit_cost: number;
    base_unit: string;
    category?: string;
}

interface Props {
    items: InventoryItem[];
}

const ABCAnalysis: React.FC<Props> = ({ items }) => {
    const getABCData = () => {
        const aItems = items.filter(item => item.abc_classification === 'A');
        const bItems = items.filter(item => item.abc_classification === 'B');
        const cItems = items.filter(item => item.abc_classification === 'C');

        const totalValue = items.reduce((sum, item) => sum + item.annual_consumption_value, 0);

        return {
            A: {
                items: aItems,
                count: aItems.length,
                percentage: (aItems.length / items.length) * 100,
                value: aItems.reduce((sum, item) => sum + item.annual_consumption_value, 0),
                valuePercentage: (aItems.reduce((sum, item) => sum + item.annual_consumption_value, 0) / totalValue) * 100,
            },
            B: {
                items: bItems,
                count: bItems.length,
                percentage: (bItems.length / items.length) * 100,
                value: bItems.reduce((sum, item) => sum + item.annual_consumption_value, 0),
                valuePercentage: (bItems.reduce((sum, item) => sum + item.annual_consumption_value, 0) / totalValue) * 100,
            },
            C: {
                items: cItems,
                count: cItems.length,
                percentage: (cItems.length / items.length) * 100,
                value: cItems.reduce((sum, item) => sum + item.annual_consumption_value, 0),
                valuePercentage: (cItems.reduce((sum, item) => sum + item.annual_consumption_value, 0) / totalValue) * 100,
            },
            total: {
                count: items.length,
                value: totalValue,
            }
        };
    };

    const abcData = getABCData();

    const getABCBadge = (classification: string) => {
        const colors = {
            'A': 'bg-success-subtle text-success',
            'B': 'bg-warning-subtle text-warning',
            'C': 'bg-info-subtle text-info'
        };
        return <span className={`badge ${colors[classification as keyof typeof colors] || 'bg-secondary-subtle text-secondary'}`}>{classification}</span>;
    };

    const exportToPDF = () => {
        window.print();
    };

    const exportToExcel = () => {
        const csvContent = "data:text/csv;charset=utf-8," 
            + "ABC Sınıfı,SKU,Ürün Adı,Kategori,Yıllık Tüketim Miktarı,Yıllık Tüketim Değeri,Birim Fiyat\n"
            + items.map(item => 
                `${item.abc_classification},${item.sku},"${item.name}","${item.category || ''}",${item.annual_consumption_quantity},${item.annual_consumption_value},${item.unit_cost}`
            ).join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "abc_analiz_raporu.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Layout>
            <Head title="ABC Analiz Raporu" />
            
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">ABC Analiz Raporu</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link href="/inventory">Envanter</Link></li>
                                        <li className="breadcrumb-item"><Link href="/inventory/reports">Raporlar</Link></li>
                                        <li className="breadcrumb-item active">ABC Analizi</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ABC Summary Cards */}
                    <div className="row">
                        <div className="col-xl-3 col-md-6">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1 overflow-hidden">
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">A Sınıfı Ürünler</p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-success-subtle rounded fs-3">
                                                <i className="bx bx-star text-success"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">{abcData.A.count}</span>
                                            </h4>
                                            <p className="text-muted mb-0">
                                                %{abcData.A.percentage.toFixed(1)} - ₺{abcData.A.value.toLocaleString()}
                                                <br />
                                                <small>Değerin %{abcData.A.valuePercentage.toFixed(1)}'i</small>
                                            </p>
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
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">B Sınıfı Ürünler</p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-warning-subtle rounded fs-3">
                                                <i className="bx bx-medal text-warning"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">{abcData.B.count}</span>
                                            </h4>
                                            <p className="text-muted mb-0">
                                                %{abcData.B.percentage.toFixed(1)} - ₺{abcData.B.value.toLocaleString()}
                                                <br />
                                                <small>Değerin %{abcData.B.valuePercentage.toFixed(1)}'i</small>
                                            </p>
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
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">C Sınıfı Ürünler</p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-info-subtle rounded fs-3">
                                                <i className="bx bx-badge text-info"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                <span className="counter-value">{abcData.C.count}</span>
                                            </h4>
                                            <p className="text-muted mb-0">
                                                %{abcData.C.percentage.toFixed(1)} - ₺{abcData.C.value.toLocaleString()}
                                                <br />
                                                <small>Değerin %{abcData.C.valuePercentage.toFixed(1)}'i</small>
                                            </p>
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
                                                <span className="counter-value">{abcData.total.count}</span>
                                            </h4>
                                            <p className="text-muted mb-0">₺{abcData.total.value.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ABC Analysis Chart */}
                    <div className="row">
                        <div className="col-xl-6">
                            <div className="card">
                                <div className="card-header">
                                    <h4 className="card-title mb-0">Ürün Dağılımı</h4>
                                </div>
                                <div className="card-body">
                                    <div className="d-flex justify-content-around">
                                        <div className="text-center">
                                            <div className="avatar-lg mx-auto mb-3">
                                                <div className="avatar-title bg-success-subtle text-success rounded-circle fs-2">
                                                    A
                                                </div>
                                            </div>
                                            <h5 className="fs-15">{abcData.A.count} Ürün</h5>
                                            <p className="text-muted mb-0">%{abcData.A.percentage.toFixed(1)}</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="avatar-lg mx-auto mb-3">
                                                <div className="avatar-title bg-warning-subtle text-warning rounded-circle fs-2">
                                                    B
                                                </div>
                                            </div>
                                            <h5 className="fs-15">{abcData.B.count} Ürün</h5>
                                            <p className="text-muted mb-0">%{abcData.B.percentage.toFixed(1)}</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="avatar-lg mx-auto mb-3">
                                                <div className="avatar-title bg-info-subtle text-info rounded-circle fs-2">
                                                    C
                                                </div>
                                            </div>
                                            <h5 className="fs-15">{abcData.C.count} Ürün</h5>
                                            <p className="text-muted mb-0">%{abcData.C.percentage.toFixed(1)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-6">
                            <div className="card">
                                <div className="card-header">
                                    <h4 className="card-title mb-0">Değer Dağılımı</h4>
                                </div>
                                <div className="card-body">
                                    <div className="d-flex justify-content-around">
                                        <div className="text-center">
                                            <div className="avatar-lg mx-auto mb-3">
                                                <div className="avatar-title bg-success-subtle text-success rounded-circle fs-2">
                                                    A
                                                </div>
                                            </div>
                                            <h5 className="fs-15">₺{abcData.A.value.toLocaleString()}</h5>
                                            <p className="text-muted mb-0">%{abcData.A.valuePercentage.toFixed(1)}</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="avatar-lg mx-auto mb-3">
                                                <div className="avatar-title bg-warning-subtle text-warning rounded-circle fs-2">
                                                    B
                                                </div>
                                            </div>
                                            <h5 className="fs-15">₺{abcData.B.value.toLocaleString()}</h5>
                                            <p className="text-muted mb-0">%{abcData.B.valuePercentage.toFixed(1)}</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="avatar-lg mx-auto mb-3">
                                                <div className="avatar-title bg-info-subtle text-info rounded-circle fs-2">
                                                    C
                                                </div>
                                            </div>
                                            <h5 className="fs-15">₺{abcData.C.value.toLocaleString()}</h5>
                                            <p className="text-muted mb-0">%{abcData.C.valuePercentage.toFixed(1)}</p>
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
                                        ABC Analiz Detayları ({items.length} ürün)
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
                                                    <th scope="col">ABC</th>
                                                    <th scope="col">SKU</th>
                                                    <th scope="col">Ürün Adı</th>
                                                    <th scope="col">Kategori</th>
                                                    <th scope="col">Yıllık Tüketim Miktarı</th>
                                                    <th scope="col">Yıllık Tüketim Değeri</th>
                                                    <th scope="col">Birim Fiyat</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.length > 0 ? (
                                                    items.map((item) => (
                                                        <tr key={item.id}>
                                                            <td>
                                                                {getABCBadge(item.abc_classification)}
                                                            </td>
                                                            <td>
                                                                <span className="fw-medium">{item.sku}</span>
                                                            </td>
                                                            <td>
                                                                <Link href={`/inventory/items/${item.id}`} className="text-body">
                                                                    {item.name}
                                                                </Link>
                                                                {item.barcode && (
                                                                    <React.Fragment>
                                                                        <br />
                                                                        <small className="text-muted">{item.barcode}</small>
                                                                    </React.Fragment>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <span className="text-muted">{item.category || '-'}</span>
                                                            </td>
                                                            <td>
                                                                <span className="fw-medium">{item.annual_consumption_quantity.toLocaleString()} {item.base_unit}</span>
                                                            </td>
                                                            <td>
                                                                <span className="fw-medium">₺{item.annual_consumption_value.toLocaleString()}</span>
                                                            </td>
                                                            <td>
                                                                <span className="fw-medium">₺{item.unit_cost.toLocaleString()}</span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={7} className="text-center py-4">
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

                    {/* ABC Analysis Guidelines */}
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="card">
                                <div className="card-header">
                                    <h4 className="card-title mb-0">ABC Analizi Rehberi</h4>
                                </div>
                                <div className="card-body">
                                    <div className="row">
                                        <div className="col-md-4">
                                            <div className="border rounded p-3 h-100">
                                                <div className="d-flex align-items-center mb-3">
                                                    <div className="avatar-sm me-3">
                                                        <div className="avatar-title bg-success-subtle text-success rounded-circle">
                                                            A
                                                        </div>
                                                    </div>
                                                    <h5 className="mb-0">A Sınıfı Ürünler</h5>
                                                </div>
                                                <ul className="list-unstyled mb-0">
                                                    <li><i className="ri-check-line text-success me-2"></i>Yüksek değerli ürünler</li>
                                                    <li><i className="ri-check-line text-success me-2"></i>Sıkı stok kontrolü</li>
                                                    <li><i className="ri-check-line text-success me-2"></i>Düşük güvenlik stoku</li>
                                                    <li><i className="ri-check-line text-success me-2"></i>Sık sayım</li>
                                                    <li><i className="ri-check-line text-success me-2"></i>Özel tedarikçi ilişkileri</li>
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="border rounded p-3 h-100">
                                                <div className="d-flex align-items-center mb-3">
                                                    <div className="avatar-sm me-3">
                                                        <div className="avatar-title bg-warning-subtle text-warning rounded-circle">
                                                            B
                                                        </div>
                                                    </div>
                                                    <h5 className="mb-0">B Sınıfı Ürünler</h5>
                                                </div>
                                                <ul className="list-unstyled mb-0">
                                                    <li><i className="ri-check-line text-warning me-2"></i>Orta değerli ürünler</li>
                                                    <li><i className="ri-check-line text-warning me-2"></i>Normal stok kontrolü</li>
                                                    <li><i className="ri-check-line text-warning me-2"></i>Orta güvenlik stoku</li>
                                                    <li><i className="ri-check-line text-warning me-2"></i>Periyodik sayım</li>
                                                    <li><i className="ri-check-line text-warning me-2"></i>Standart tedarik süreçleri</li>
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="border rounded p-3 h-100">
                                                <div className="d-flex align-items-center mb-3">
                                                    <div className="avatar-sm me-3">
                                                        <div className="avatar-title bg-info-subtle text-info rounded-circle">
                                                            C
                                                        </div>
                                                    </div>
                                                    <h5 className="mb-0">C Sınıfı Ürünler</h5>
                                                </div>
                                                <ul className="list-unstyled mb-0">
                                                    <li><i className="ri-check-line text-info me-2"></i>Düşük değerli ürünler</li>
                                                    <li><i className="ri-check-line text-info me-2"></i>Basit stok kontrolü</li>
                                                    <li><i className="ri-check-line text-info me-2"></i>Yüksek güvenlik stoku</li>
                                                    <li><i className="ri-check-line text-info me-2"></i>Nadir sayım</li>
                                                    <li><i className="ri-check-line text-info me-2"></i>Toplu sipariş stratejileri</li>
                                                </ul>
                                            </div>
                                        </div>
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

export default ABCAnalysis;