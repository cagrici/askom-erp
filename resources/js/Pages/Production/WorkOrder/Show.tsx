import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import axios from 'axios';
import Layout from "../../../Layouts";
interface Label {
    id: number;
    label_code: string;
    is_printed: boolean;
    is_scanned: boolean;
    printed_at: string | null;
    scanned_at: string | null;
}

interface WorkOrder {
    id: number;
    worder_no: string;
    product: {
        id: number;
        name: string;
    } | null;
    total_quantity: number;
    scanned_quantity: number;
    remaining_quantity: number;
    created_labels_count: number;
    remaining_labels_to_create: number;
    status_name: string;
    create_date: string;
    labels: Label[];
}

interface Props extends PageProps {
    workOrder: WorkOrder;
}

export default function Show({ auth, workOrder }: Props) {
    const [quantity, setQuantity] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedLabels, setSelectedLabels] = useState<number[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const [previewLabels, setPreviewLabels] = useState<Label[]>([]);

    const handleGenerateLabels = async () => {
        if (!quantity || parseInt(quantity) <= 0) {
            alert('Lütfen geçerli bir adet girin');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`/uretim/is-emirleri/${workOrder.id}/generate-labels`, {
                quantity: parseInt(quantity),
            });

            alert(response.data.message);
            router.reload();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Etiket oluşturma hatası');
        } finally {
            setLoading(false);
        }
    };

    const handleShowPreview = () => {
        if (selectedLabels.length === 0) {
            alert('Lütfen yazdırılacak etiketleri seçin');
            return;
        }

        const labelsToPreview = unprintedLabels.filter(label => 
            selectedLabels.includes(label.id)
        );
        setPreviewLabels(labelsToPreview);
        setShowPreview(true);
    };

    const handlePrintLabels = async () => {
        setLoading(true);
        try {
            const response = await axios.post('/uretim/etiketler/yazdir', {
                label_ids: selectedLabels,
            });

            alert(response.data.message);
            setSelectedLabels([]);
            setShowPreview(false);
            router.reload();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Yazdırma hatası');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteLabels = async () => {
        if (selectedLabels.length === 0) {
            alert('Lütfen silinecek etiketleri seçin');
            return;
        }

        if (!confirm(`${selectedLabels.length} etiket silinecek. Emin misiniz?`)) {
            return;
        }

        setLoading(true);
        try {
            const response = await axios.delete('/uretim/etiketler/sil', {
                data: { label_ids: selectedLabels },
            });
            
            alert(response.data.message);
            setSelectedLabels([]);
            router.reload();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Silme hatası');
        } finally {
            setLoading(false);
        }
    };

    const toggleLabel = (labelId: number) => {
        setSelectedLabels(prev =>
            prev.includes(labelId)
                ? prev.filter(id => id !== labelId)
                : [...prev, labelId]
        );
    };

    const handleSelectAll = () => {
        if (selectedLabels.length === unprintedLabels.length) {
            // Tümü seçiliyse hepsini kaldır
            setSelectedLabels([]);
        } else {
            // Tümünü seç
            setSelectedLabels(unprintedLabels.map(label => label.id));
        }
    };

    const unprintedLabels = workOrder.labels.filter(label => !label.is_printed);

    return (
        <Layout>
            <Head title={`İş Emri - ${workOrder.worder_no}`} />
            <div className="page-content">
            <div className="container-fluid py-4">
                <div className="row">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <h2 className="h4 mb-0">İş Emri Detayı</h2>
                                <Link
                                    href="/uretim/is-emirleri"
                                    className="btn btn-secondary"
                                >
                                    <i className="bi bi-arrow-left me-2"></i>
                                    Geri
                                </Link>
                            </div>
                            <div className="card-body">
                                <div className="row mb-4">
                                    <div className="col-md-6">
                                        <h5 className="mb-3">İş Emri Bilgileri</h5>
                                        <table className="table table-sm">
                                            <tbody>
                                                <tr>
                                                    <th width="40%">İş Emri No:</th>
                                                    <td>{workOrder.worder_no}</td>
                                                </tr>
                                                <tr>
                                                    <th>Ürün:</th>
                                                    <td>{workOrder.product?.name || 'N/A'}</td>
                                                </tr>
                                                <tr>
                                                    <th>Toplam Adet:</th>
                                                    <td>{workOrder.total_quantity}</td>
                                                </tr>
                                                <tr>
                                                    <th>Okutulan Adet:</th>
                                                    <td>{workOrder.scanned_quantity}</td>
                                                </tr>
                                                <tr>
                                                    <th>Kalan Adet:</th>
                                                    <td>{workOrder.remaining_quantity}</td>
                                                </tr>
                                                <tr>
                                                    <th>Oluşturulan Etiket:</th>
                                                    <td>{workOrder.created_labels_count}</td>
                                                </tr>
                                                <tr>
                                                    <th>Durum:</th>
                                                    <td>
                                                        <span className="badge bg-success">
                                                            {workOrder.status_name}
                                                        </span>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="card bg-light">
                                            <div className="card-body">
                                                <h5 className="card-title mb-3">Etiket Oluştur</h5>
                                                <div className="mb-3">
                                                    <label className="form-label">
                                                        Etiket Adedi (Max: {workOrder.remaining_labels_to_create})
                                                    </label>
                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        min="1"
                                                        max={workOrder.remaining_labels_to_create}
                                                        value={quantity}
                                                        onChange={(e) => setQuantity(e.target.value)}
                                                        placeholder="Adet girin"
                                                        disabled={workOrder.remaining_labels_to_create === 0}
                                                    />
                                                </div>
                                                {workOrder.remaining_labels_to_create === 0 && (
                                                    <div className="alert alert-warning mb-3">
                                                        <i className="bi bi-exclamation-triangle me-2"></i>
                                                        Maksimum etiket sayısına ulaşıldı.
                                                    </div>
                                                )}
                                                <button
                                                    onClick={handleGenerateLabels}
                                                    disabled={loading || workOrder.remaining_labels_to_create === 0}
                                                    className="btn btn-primary w-100"
                                                >
                                                    {loading ? (
                                                        <>
                                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                            Oluşturuluyor...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <i className="bi bi-printer me-2"></i>
                                                            Etiket Oluştur
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {unprintedLabels.length > 0 && (
                                    <div className="mt-4">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <h5>Yazdırılmamış Etiketler</h5>
                                            <div>
                                                <button
                                                    onClick={handleSelectAll}
                                                    disabled={loading || unprintedLabels.length === 0}
                                                    className="btn btn-outline-primary me-2"
                                                >
                                                    <i className="bi bi-check-square me-2"></i>
                                                    {selectedLabels.length === unprintedLabels.length ? 'Seçimi Kaldır' : 'Tümünü Seç'}
                                                </button>
                                                <button
                                                    onClick={handleDeleteLabels}
                                                    disabled={loading || selectedLabels.length === 0}
                                                    className="btn btn-danger me-2"
                                                >
                                                    <i className="bi bi-trash me-2"></i>
                                                    Sil ({selectedLabels.length})
                                                </button>
                                                <button
                                                    onClick={handleShowPreview}
                                                    disabled={loading || selectedLabels.length === 0}
                                                    className="btn btn-success"
                                                >
                                                    <i className="bi bi-eye me-2"></i>
                                                    Önizle & Yazdır ({selectedLabels.length})
                                                </button>
                                            </div>
                                        </div>
                                        <div className="row g-3">
                                            {unprintedLabels.map((label) => (
                                                <div key={label.id} className="col-md-4">
                                                    <div
                                                        onClick={() => toggleLabel(label.id)}
                                                        className={`card cursor-pointer ${
                                                            selectedLabels.includes(label.id)
                                                                ? 'border-primary bg-primary bg-opacity-10'
                                                                : ''
                                                        }`}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <div className="card-body">
                                                            <p className="mb-0 font-monospace small">{label.label_code}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {workOrder.labels.length > 0 && (
                                    <div className="mt-5">
                                        <h5 className="mb-3">Tüm Etiketler</h5>
                                        <div className="table-responsive">
                                            <table className="table table-sm">
                                                <thead>
                                                    <tr>
                                                        <th>Etiket Kodu</th>
                                                        <th>Yazdırıldı</th>
                                                        <th>Okutuldu</th>
                                                        <th>Yazdırma Zamanı</th>
                                                        <th>Okutma Zamanı</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {workOrder.labels.map((label) => (
                                                        <tr key={label.id}>
                                                            <td className="font-monospace">{label.label_code}</td>
                                                            <td>
                                                                {label.is_printed ? (
                                                                    <i className="bi bi-check-circle-fill text-success"></i>
                                                                ) : (
                                                                    <i className="bi bi-x-circle text-muted"></i>
                                                                )}
                                                            </td>
                                                            <td>
                                                                {label.is_scanned ? (
                                                                    <i className="bi bi-check-circle-fill text-success"></i>
                                                                ) : (
                                                                    <i className="bi bi-x-circle text-muted"></i>
                                                                )}
                                                            </td>
                                                            <td>{label.printed_at || '-'}</td>
                                                            <td>{label.scanned_at || '-'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </div>

            {/* Etiket Önizleme Modal */}
            {showPreview && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-xl">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    <i className="bi bi-eye me-2"></i>
                                    Etiket Yazdırma Önizlemesi
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowPreview(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <h6 className="text-muted">İş Emri Bilgileri</h6>
                                        <table className="table table-sm">
                                            <tbody>
                                                <tr>
                                                    <th width="40%">İş Emri No:</th>
                                                    <td>{workOrder.worder_no}</td>
                                                </tr>
                                                <tr>
                                                    <th>Ürün:</th>
                                                    <td>{workOrder.product?.name || 'N/A'}</td>
                                                </tr>
                                                <tr>
                                                    <th>Yazdırılacak Adet:</th>
                                                    <td>{previewLabels.length} adet</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="col-md-6">
                                        <h6 className="text-muted">Etiket Tasarımı</h6>
                                        <div className="border rounded p-3 bg-white" style={{ fontFamily: 'monospace' }}>
                                            <div className="text-center">
                                                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                                    {workOrder.worder_no}
                                                </div>
                                                <div style={{ fontSize: '14px', marginTop: '8px' }}>
                                                    Ürün: {workOrder.product?.name || 'N/A'}
                                                </div>
                                                <div style={{ fontSize: '24px', fontFamily: 'monospace', margin: '12px 0', letterSpacing: '2px', border: '2px solid #000', padding: '8px' }}>
                                                    ||||| |||| | ||||| ||||
                                                </div>
                                                <div style={{ fontSize: '12px' }}>
                                                    Örnek Etiket Kodu
                                                </div>
                                                <div style={{ fontSize: '10px', color: '#666', marginTop: '8px' }}>
                                                    Tarih: {new Date().toLocaleString('tr-TR')}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <h6 className="text-muted mb-3">Yazdırılacak Etiketler ({previewLabels.length} adet)</h6>
                                <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    <table className="table table-sm table-striped">
                                        <thead className="table-dark">
                                            <tr>
                                                <th>#</th>
                                                <th>Etiket Kodu</th>
                                                <th>Unix Timestamp</th>
                                                <th>Tarih Saat</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewLabels.map((label, index) => (
                                                <tr key={label.id}>
                                                    <td>{index + 1}</td>
                                                    <td className="font-monospace">{label.label_code}</td>
                                                    <td className="font-monospace">
                                                        {/* Unix timestamp'i label_code'dan çıkar */}
                                                        {label.label_code.split('-')[1] || 'N/A'}
                                                    </td>
                                                    <td>
                                                        {label.label_code.split('-')[1] 
                                                            ? new Date(parseInt(label.label_code.split('-')[1]) * 1000).toLocaleString('tr-TR')
                                                            : 'N/A'
                                                        }
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowPreview(false)}
                                >
                                    <i className="bi bi-x-circle me-2"></i>
                                    İptal
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-success"
                                    onClick={handlePrintLabels}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                            Yazdırılıyor...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-printer me-2"></i>
                                            Yazdırmayı Onayla ({previewLabels.length} adet)
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}
