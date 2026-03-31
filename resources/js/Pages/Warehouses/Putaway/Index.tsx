import React, { useState, useEffect } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import Layout from '../../../Layouts';
import { initializeTableDropdowns, cleanupDropdowns } from '../../../utils/dropdownUtils';

interface PutawayItem {
    id: number;
    item_code: string;
    item_name: string;
    category: string;
    quantity: number;
    unit: string;
    batch_number?: string;
    received_date: string;
    quality_status: 'approved' | 'pending' | 'rejected';
    current_location?: {
        id: number;
        code: string;
        name: string;
        zone: string;
    };
    suggested_locations: SuggestedLocation[];
    priority: 'low' | 'medium' | 'high';
    warehouse: {
        id: number;
        name: string;
        code: string;
    };
    dimensions?: {
        length: number;
        width: number;
        height: number;
        weight: number;
    };
    storage_requirements?: string[];
}

interface SuggestedLocation {
    location_id: number;
    location_code: string;
    location_name: string;
    zone_name: string;
    zone_type: string;
    compatibility_score: number;
    distance_score: number;
    capacity_utilization: number;
    reasons: string[];
    warnings?: string[];
}

interface Props {
    putawayItems: PutawayItem[];
    warehouses: any[];
}

const Index: React.FC<Props> = ({ putawayItems, warehouses }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [warehouseFilter, setWarehouseFilter] = useState('');
    const [selectedItems, setSelectedItems] = useState<number[]>([]);

    const { post, processing } = useForm();

    useEffect(() => {
        // Initialize improved dropdown functionality
        initializeTableDropdowns();

        // Initialize Bootstrap components
        const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltips.forEach(tooltip => {
            new (window as any).bootstrap.Tooltip(tooltip);
        });

        return () => {
            // Cleanup on unmount
            cleanupDropdowns();
        };
    }, []);

    const filteredItems = putawayItems.filter(item => {
        const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.item_code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = !statusFilter || item.quality_status === statusFilter;
        const matchesPriority = !priorityFilter || item.priority === priorityFilter;
        const matchesWarehouse = !warehouseFilter || item.warehouse.id.toString() === warehouseFilter;
        
        return matchesSearch && matchesStatus && matchesPriority && matchesWarehouse;
    });

    const getPriorityBadge = (priority: string) => {
        const badges: { [key: string]: string } = {
            'low': 'info',
            'medium': 'warning',
            'high': 'danger'
        };
        
        const labels: { [key: string]: string } = {
            'low': 'Düşük',
            'medium': 'Orta',
            'high': 'Yüksek'
        };

        return (
            <span className={`badge bg-${badges[priority]} fs-12`}>
                {labels[priority]}
            </span>
        );
    };

    const getStatusBadge = (status: string) => {
        const badges: { [key: string]: string } = {
            'approved': 'success',
            'pending': 'warning',
            'rejected': 'danger'
        };
        
        const labels: { [key: string]: string } = {
            'approved': 'Onaylandı',
            'pending': 'Beklemede',
            'rejected': 'Reddedildi'
        };

        return (
            <span className={`badge bg-${badges[status]} fs-12`}>
                {labels[status]}
            </span>
        );
    };

    const handleSelectItem = (itemId: number) => {
        setSelectedItems(prev => 
            prev.includes(itemId) 
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const handleSelectAll = () => {
        if (selectedItems.length === filteredItems.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(filteredItems.map(item => item.id));
        }
    };

    const handleBulkPutaway = () => {
        if (selectedItems.length === 0) return;
        
        post(route('warehouses.putaway.bulk-assign'), {
            data: { item_ids: selectedItems },
            onSuccess: () => {
                setSelectedItems([]);
            }
        });
    };

    const handleOptimizeAll = () => {
        post(route('warehouses.putaway.optimize'), {
            onSuccess: () => {
                router.reload();
            }
        });
    };

    return (
        <Layout>
            <Head title="Yerleştirme Önerileri" />
            
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Yerleştirme Önerileri</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link href="/warehouses">Depo Yönetimi</Link></li>
                                        <li className="breadcrumb-item active">Yerleştirme</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="row">
                        <div className="col-xl-3 col-md-6">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1 overflow-hidden">
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Bekleyen Yerleştirme</p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <h5 className="text-warning mb-0">
                                                {putawayItems.filter(item => !item.current_location).length}
                                            </h5>
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
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Yüksek Öncelik</p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <h5 className="text-danger mb-0">
                                                {putawayItems.filter(item => item.priority === 'high').length}
                                            </h5>
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
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Toplam Miktar</p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <h5 className="text-primary mb-0">
                                                {putawayItems.reduce((sum, item) => sum + item.quantity, 0)}
                                            </h5>
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
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Ortalama Uyumluluk</p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <h5 className="text-success mb-0">
                                                {Math.round(
                                                    putawayItems
                                                        .filter(item => item.suggested_locations.length > 0)
                                                        .reduce((sum, item) => sum + item.suggested_locations[0]?.compatibility_score || 0, 0) /
                                                    putawayItems.filter(item => item.suggested_locations.length > 0).length || 1
                                                )}%
                                            </h5>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions and Filters */}
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="card">
                                <div className="card-header">
                                    <div className="row align-items-center">
                                        <div className="col-md-4">
                                            <h5 className="card-title mb-0">Yerleştirme Listesi</h5>
                                        </div>
                                        <div className="col-md-8">
                                            <div className="row g-2">
                                                <div className="col-md-3">
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        placeholder="Ürün ara..."
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                    />
                                                </div>
                                                <div className="col-md-2">
                                                    <select
                                                        className="form-select"
                                                        value={statusFilter}
                                                        onChange={(e) => setStatusFilter(e.target.value)}
                                                    >
                                                        <option value="">Tüm Durumlar</option>
                                                        <option value="approved">Onaylandı</option>
                                                        <option value="pending">Beklemede</option>
                                                    </select>
                                                </div>
                                                <div className="col-md-2">
                                                    <select
                                                        className="form-select"
                                                        value={priorityFilter}
                                                        onChange={(e) => setPriorityFilter(e.target.value)}
                                                    >
                                                        <option value="">Tüm Öncelikler</option>
                                                        <option value="high">Yüksek</option>
                                                        <option value="medium">Orta</option>
                                                        <option value="low">Düşük</option>
                                                    </select>
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
                                                <div className="col-md-3">
                                                    <div className="btn-group w-100">
                                                        <button
                                                            type="button"
                                                            className="btn btn-primary"
                                                            onClick={handleOptimizeAll}
                                                            disabled={processing}
                                                        >
                                                            <i className="ri-route-line me-1"></i>
                                                            Optimizasyon
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-success"
                                                            onClick={handleBulkPutaway}
                                                            disabled={selectedItems.length === 0 || processing}
                                                        >
                                                            <i className="ri-checkbox-multiple-line me-1"></i>
                                                            Toplu Yerleştir ({selectedItems.length})
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-body">
                                    {filteredItems.length > 0 ? (
                                        <div className="table-responsive">
                                            <table className="table table-nowrap table-hover mb-0">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>
                                                            <div className="form-check">
                                                                <input 
                                                                    className="form-check-input" 
                                                                    type="checkbox"
                                                                    checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                                                                    onChange={handleSelectAll}
                                                                />
                                                            </div>
                                                        </th>
                                                        <th>Ürün</th>
                                                        <th>Kategori</th>
                                                        <th>Miktar</th>
                                                        <th>Mevcut Konum</th>
                                                        <th>Önerilen Konum</th>
                                                        <th>Uyumluluk</th>
                                                        <th>Öncelik</th>
                                                        <th>İşlemler</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredItems.map(item => {
                                                        const bestSuggestion = item.suggested_locations[0];
                                                        
                                                        return (
                                                            <tr key={item.id}>
                                                                <td>
                                                                    <div className="form-check">
                                                                        <input 
                                                                            className="form-check-input" 
                                                                            type="checkbox"
                                                                            checked={selectedItems.includes(item.id)}
                                                                            onChange={() => handleSelectItem(item.id)}
                                                                        />
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div>
                                                                        <div className="fw-medium">{item.item_name}</div>
                                                                        <small className="text-muted">{item.item_code}</small>
                                                                        {item.batch_number && (
                                                                            <div><small className="badge bg-light text-dark">{item.batch_number}</small></div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td>{item.category}</td>
                                                                <td>
                                                                    <span className="fw-medium">{item.quantity}</span>
                                                                    <small className="text-muted"> {item.unit}</small>
                                                                </td>
                                                                <td>
                                                                    {item.current_location ? (
                                                                        <div>
                                                                            <span className="badge bg-success">{item.current_location.code}</span>
                                                                            <div><small className="text-muted">{item.current_location.zone}</small></div>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="badge bg-warning">Beklemede</span>
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    {bestSuggestion ? (
                                                                        <div>
                                                                            <span className="badge bg-primary">{bestSuggestion.location_code}</span>
                                                                            <div><small className="text-muted">{bestSuggestion.zone_name}</small></div>
                                                                            {bestSuggestion.warnings && bestSuggestion.warnings.length > 0 && (
                                                                                <div>
                                                                                    <small className="text-warning">
                                                                                        <i className="ri-alert-line me-1"></i>
                                                                                        {bestSuggestion.warnings[0]}
                                                                                    </small>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-muted">Öneri yok</span>
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    {bestSuggestion && (
                                                                        <div className="d-flex align-items-center">
                                                                            <div className="progress flex-fill me-2" style={{ height: '6px' }}>
                                                                                <div 
                                                                                    className={`progress-bar ${
                                                                                        bestSuggestion.compatibility_score >= 80 ? 'bg-success' :
                                                                                        bestSuggestion.compatibility_score >= 60 ? 'bg-warning' : 'bg-danger'
                                                                                    }`}
                                                                                    style={{ width: `${bestSuggestion.compatibility_score}%` }}
                                                                                ></div>
                                                                            </div>
                                                                            <span className="fs-12">{bestSuggestion.compatibility_score}%</span>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td>{getPriorityBadge(item.priority)}</td>
                                                                <td>
                                                                    <div className="dropdown">
                                                                        <button 
                                                                            className="btn btn-soft-secondary btn-sm dropdown-toggle" 
                                                                            type="button" 
                                                                            data-bs-toggle="dropdown"
                                                                        >
                                                                            <i className="ri-more-fill"></i>
                                                                        </button>
                                                                        <ul className="dropdown-menu dropdown-menu-end">
                                                                            <li>
                                                                                <Link
                                                                                    className="dropdown-item"
                                                                                    href={route('warehouses.putaway.show', item.id)}
                                                                                >
                                                                                    <i className="ri-eye-fill me-2 text-muted"></i>
                                                                                    Detay Görüntüle
                                                                                </Link>
                                                                            </li>
                                                                            {bestSuggestion && (
                                                                                <li>
                                                                                    <Link
                                                                                        className="dropdown-item"
                                                                                        href={route('warehouses.putaway.assign', [item.id, bestSuggestion.location_id])}
                                                                                        method="post"
                                                                                        as="button"
                                                                                    >
                                                                                        <i className="ri-map-pin-line me-2 text-success"></i>
                                                                                        Önerilen Konuma Yerleştir
                                                                                    </Link>
                                                                                </li>
                                                                            )}
                                                                            <li>
                                                                                <Link
                                                                                    className="dropdown-item"
                                                                                    href={route('warehouses.putaway.manual', item.id)}
                                                                                >
                                                                                    <i className="ri-map-pin-user-line me-2 text-primary"></i>
                                                                                    Manuel Yerleştir
                                                                                </Link>
                                                                            </li>
                                                                        </ul>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4">
                                            <div className="avatar-md mx-auto mb-4">
                                                <div className="avatar-title bg-light text-primary rounded-circle fs-24">
                                                    <i className="ri-archive-line"></i>
                                                </div>
                                            </div>
                                            <h5 className="fs-16">Yerleştirilecek ürün bulunamadı</h5>
                                            <p className="text-muted mb-0">Tüm ürünler yerleştirilmiş veya filtreleri kontrol edin.</p>
                                        </div>
                                    )}
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