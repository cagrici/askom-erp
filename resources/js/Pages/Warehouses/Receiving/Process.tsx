import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import Layout from '../../../Layouts';
import ReceivingHelpModal from '../../../Components/Warehouses/ReceivingHelpModal';

interface PurchaseOrderItem {
    id: number;
    item_code: string;
    item_name: string;
    ordered_quantity: number;
    received_quantity: number;
    remaining_quantity: number;
    unit_price: number;
    barcode?: string;
    batch_number?: string;
    expiry_date?: string;
}

interface PurchaseOrder {
    id: number;
    order_number: string;
    supplier_name: string;
    order_date: string;
    expected_delivery_date: string;
    warehouse: {
        id: number;
        name: string;
        code: string;
    };
    items: PurchaseOrderItem[];
}

interface Props {
    purchaseOrder: PurchaseOrder;
}

const Process: React.FC<Props> = ({ purchaseOrder }) => {
    const [selectedItem, setSelectedItem] = useState<PurchaseOrderItem | null>(null);
    const [barcodeInput, setBarcodeInput] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<string>('');
    const barcodeInputRef = useRef<HTMLInputElement>(null);

    const [showQualityControl, setShowQualityControl] = useState(false);
    const [qualityStatus, setQualityStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
    const [qualityNotes, setQualityNotes] = useState('');
    const [damageDetails, setDamageDetails] = useState('');
    const [qualityPhotos, setQualityPhotos] = useState<File[]>([]);
    const [showHelpModal, setShowHelpModal] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        item_id: '',
        quantity: '',
        batch_number: '',
        expiry_date: '',
        barcode: '',
        notes: '',
        quality_status: 'pending',
        quality_notes: '',
        damage_details: '',
        inspector_id: ''
    });

    useEffect(() => {
        // Focus on barcode input when component mounts
        if (barcodeInputRef.current) {
            barcodeInputRef.current.focus();
        }
    }, []);

    const handleBarcodeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!barcodeInput.trim()) return;

        // Barkod ile ürün ara
        const foundItem = purchaseOrder.items.find(item => 
            item.barcode === barcodeInput || 
            item.item_code === barcodeInput
        );

        if (foundItem) {
            setSelectedItem(foundItem);
            setData({
                item_id: foundItem.id.toString(),
                quantity: foundItem.remaining_quantity.toString(),
                batch_number: '',
                expiry_date: '',
                barcode: foundItem.barcode || '',
                notes: ''
            });
            setScanResult(`✓ Ürün bulundu: ${foundItem.item_name}`);
        } else {
            setScanResult(`⚠ Barkod bulunamadı: ${barcodeInput}`);
            setSelectedItem(null);
        }
        
        setBarcodeInput('');
        setTimeout(() => setScanResult(''), 3000);
    };

    const handleItemSelect = (item: PurchaseOrderItem) => {
        setSelectedItem(item);
        setData({
            item_id: item.id.toString(),
            quantity: item.remaining_quantity.toString(),
            batch_number: '',
            expiry_date: '',
            barcode: item.barcode || '',
            notes: ''
        });
    };

    const handleReceive = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Kalite kontrol gerekli mi kontrol et
        if (selectedItem && shouldRequireQualityControl(selectedItem)) {
            setShowQualityControl(true);
            return;
        }
        
        submitReceiving();
    };

    const submitReceiving = () => {
        const formData = {
            ...data,
            quality_status: qualityStatus,
            quality_notes: qualityNotes,
            damage_details: damageDetails
        };
        
        post(route('warehouses.receiving.store', purchaseOrder.id), {
            data: formData,
            onSuccess: () => {
                reset();
                setSelectedItem(null);
                setShowQualityControl(false);
                setQualityStatus('pending');
                setQualityNotes('');
                setDamageDetails('');
                setScanResult('✓ Ürün başarıyla teslim alındı!');
                setTimeout(() => setScanResult(''), 3000);
            }
        });
    };

    const shouldRequireQualityControl = (item: PurchaseOrderItem): boolean => {
        // Belirli kategoriler için kalite kontrol zorunlu
        const qcRequiredCategories = ['elektronik', 'cam', 'kırılabilir', 'medikal'];
        return item.item_name.toLowerCase().includes('cam') || 
               item.item_name.toLowerCase().includes('elektronik') ||
               parseFloat(data.quantity) * item.unit_price > 1000; // Değerli ürünler
    };

    const handleQualityControlSubmit = () => {
        if (qualityStatus === 'rejected' && !damageDetails.trim()) {
            alert('Red edilen ürünler için hasar detayları zorunludur.');
            return;
        }
        submitReceiving();
    };

    const generateBarcode = () => {
        const newBarcode = 'ASK' + Date.now().toString().slice(-8);
        setData('barcode', newBarcode);
    };

    const getProgressPercentage = (received: number, ordered: number): number => {
        return ordered > 0 ? Math.round((received / ordered) * 100) : 0;
    };

    return (
        <Layout>
            <Head title={`${purchaseOrder.order_number} - Teslim Alma`} />
            
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Mal Teslim Alma</h4>
                                <div className="page-title-right">
                                    <button
                                        type="button"
                                        className="btn btn-info btn-sm me-3"
                                        onClick={() => setShowHelpModal(true)}
                                    >
                                        <i className="ri-question-line me-1"></i>
                                        Yardım
                                    </button>
                                    <ol className="breadcrumb m-0 d-inline-block">
                                        <li className="breadcrumb-item"><Link href="/warehouses">Depo Yönetimi</Link></li>
                                        <li className="breadcrumb-item"><Link href="/warehouses/receiving">Mal Kabul</Link></li>
                                        <li className="breadcrumb-item active">Teslim Alma</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Info */}
                    <div className="row">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">Sipariş Bilgileri</h5>
                                </div>
                                <div className="card-body">
                                    <div className="row">
                                        <div className="col-md-3">
                                            <strong>Sipariş No:</strong><br />
                                            <span className="text-primary">{purchaseOrder.order_number}</span>
                                        </div>
                                        <div className="col-md-3">
                                            <strong>Tedarikçi:</strong><br />
                                            {purchaseOrder.supplier_name}
                                        </div>
                                        <div className="col-md-3">
                                            <strong>Depo:</strong><br />
                                            {purchaseOrder.warehouse.name}
                                        </div>
                                        <div className="col-md-3">
                                            <strong>Beklenen Teslimat:</strong><br />
                                            {new Date(purchaseOrder.expected_delivery_date).toLocaleDateString('tr-TR')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        {/* Barcode Scanner */}
                        <div className="col-lg-4">
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">
                                        <i className="ri-qr-scan-line me-2"></i>Barkod Okuyucu
                                    </h5>
                                </div>
                                <div className="card-body">
                                    <form onSubmit={handleBarcodeSubmit}>
                                        <div className="mb-3">
                                            <label className="form-label">Barkod / Ürün Kodu</label>
                                            <input
                                                ref={barcodeInputRef}
                                                type="text"
                                                className="form-control form-control-lg"
                                                value={barcodeInput}
                                                onChange={(e) => setBarcodeInput(e.target.value)}
                                                placeholder="Barkod okutun veya yazın..."
                                                autoFocus
                                            />
                                        </div>
                                        <button type="submit" className="btn btn-primary w-100">
                                            <i className="ri-search-line me-1"></i>Ürün Ara
                                        </button>
                                    </form>
                                    
                                    {scanResult && (
                                        <div className={`alert ${scanResult.includes('✓') ? 'alert-success' : 'alert-warning'} mt-3 mb-0`}>
                                            {scanResult}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Selected Item */}
                            {selectedItem && (
                                <div className="card">
                                    <div className="card-header">
                                        <h5 className="card-title mb-0">Seçili Ürün</h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="mb-3">
                                            <strong>Ürün:</strong><br />
                                            {selectedItem.item_name}
                                        </div>
                                        <div className="mb-3">
                                            <strong>Kod:</strong><br />
                                            {selectedItem.item_code}
                                        </div>
                                        <div className="mb-3">
                                            <strong>Kalan Miktar:</strong><br />
                                            <span className="text-warning">{selectedItem.remaining_quantity}</span>
                                        </div>
                                        <div className="progress" style={{ height: '6px' }}>
                                            <div 
                                                className="progress-bar bg-success"
                                                style={{ width: `${getProgressPercentage(selectedItem.received_quantity, selectedItem.ordered_quantity)}%` }}
                                            ></div>
                                        </div>
                                        <small className="text-muted">
                                            {selectedItem.received_quantity}/{selectedItem.ordered_quantity} teslim alındı
                                        </small>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Receive Form */}
                        <div className="col-lg-4">
                            {selectedItem && (
                                <div className="card">
                                    <div className="card-header">
                                        <h5 className="card-title mb-0">Teslim Al</h5>
                                    </div>
                                    <div className="card-body">
                                        <form onSubmit={handleReceive}>
                                            <div className="mb-3">
                                                <label className="form-label">
                                                    Miktar <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    className={`form-control ${errors.quantity ? 'is-invalid' : ''}`}
                                                    value={data.quantity}
                                                    onChange={(e) => setData('quantity', e.target.value)}
                                                    max={selectedItem.remaining_quantity}
                                                    min="1"
                                                    required
                                                />
                                                {errors.quantity && (
                                                    <div className="invalid-feedback">{errors.quantity}</div>
                                                )}
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label">Lot/Seri No</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={data.batch_number}
                                                    onChange={(e) => setData('batch_number', e.target.value)}
                                                    placeholder="Lot numarası"
                                                />
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label">Son Kullanma Tarihi</label>
                                                <input
                                                    type="date"
                                                    className="form-control"
                                                    value={data.expiry_date}
                                                    onChange={(e) => setData('expiry_date', e.target.value)}
                                                />
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label">Barkod</label>
                                                <div className="input-group">
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={data.barcode}
                                                        onChange={(e) => setData('barcode', e.target.value)}
                                                        placeholder="Barkod numarası"
                                                    />
                                                    {!data.barcode && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-secondary"
                                                            onClick={generateBarcode}
                                                        >
                                                            Oluştur
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label">Notlar</label>
                                                <textarea
                                                    className="form-control"
                                                    rows={3}
                                                    value={data.notes}
                                                    onChange={(e) => setData('notes', e.target.value)}
                                                    placeholder="Teslim alma notları"
                                                ></textarea>
                                            </div>

                                            {/* Quality Control Alert */}
                                            {selectedItem && shouldRequireQualityControl(selectedItem) && (
                                                <div className="alert alert-warning">
                                                    <i className="ri-shield-check-line me-2"></i>
                                                    <strong>Kalite Kontrol Gerekli!</strong><br />
                                                    Bu ürün için kalite kontrol işlemi zorunludur.
                                                </div>
                                            )}

                                            <button
                                                type="submit"
                                                className={`btn w-100 ${selectedItem && shouldRequireQualityControl(selectedItem) ? 'btn-warning' : 'btn-success'}`}
                                                disabled={processing}
                                            >
                                                {processing ? (
                                                    <>
                                                        <i className="ri-loader-2-line me-1"></i>
                                                        Kaydediliyor...
                                                    </>
                                                ) : (
                                                    <>
                                                        {selectedItem && shouldRequireQualityControl(selectedItem) ? (
                                                            <>
                                                                <i className="ri-shield-check-line me-1"></i>
                                                                Kalite Kontrole Gönder
                                                            </>
                                                        ) : (
                                                            <>
                                                                <i className="ri-check-line me-1"></i>
                                                                Teslim Al
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Items List */}
                        <div className="col-lg-4">
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">Sipariş Kalemleri</h5>
                                </div>
                                <div className="card-body p-0">
                                    <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                        <table className="table table-sm table-nowrap mb-0">
                                            <thead className="table-light sticky-top">
                                                <tr>
                                                    <th>Ürün</th>
                                                    <th>Sipariş</th>
                                                    <th>Teslim</th>
                                                    <th>İşlem</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {purchaseOrder.items.map(item => {
                                                    const progress = getProgressPercentage(item.received_quantity, item.ordered_quantity);
                                                    const isSelected = selectedItem?.id === item.id;
                                                    const isCompleted = item.remaining_quantity === 0;
                                                    
                                                    return (
                                                        <tr 
                                                            key={item.id}
                                                            className={`${isSelected ? 'table-active' : ''} ${isCompleted ? 'table-success' : ''}`}
                                                        >
                                                            <td>
                                                                <div className="fw-medium">{item.item_name}</div>
                                                                <small className="text-muted">{item.item_code}</small>
                                                            </td>
                                                            <td className="text-center">{item.ordered_quantity}</td>
                                                            <td className="text-center">
                                                                <span className={isCompleted ? 'text-success fw-medium' : ''}>
                                                                    {item.received_quantity}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {!isCompleted && (
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-sm btn-outline-primary"
                                                                        onClick={() => handleItemSelect(item)}
                                                                    >
                                                                        Seç
                                                                    </button>
                                                                )}
                                                                {isCompleted && (
                                                                    <i className="ri-check-double-line text-success"></i>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quality Control Modal */}
            {showQualityControl && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    <i className="ri-shield-check-line me-2"></i>
                                    Kalite Kontrol
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close"
                                    onClick={() => setShowQualityControl(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                {selectedItem && (
                                    <div className="mb-4">
                                        <div className="alert alert-info">
                                            <strong>Kontrol Edilen Ürün:</strong> {selectedItem.item_name}<br />
                                            <strong>Miktar:</strong> {data.quantity}<br />
                                            <strong>Lot/Seri:</strong> {data.batch_number || '-'}
                                        </div>
                                    </div>
                                )}

                                <div className="row">
                                    <div className="col-md-12">
                                        <div className="mb-3">
                                            <label className="form-label">
                                                Kalite Durumu <span className="text-danger">*</span>
                                            </label>
                                            <div className="btn-group w-100" role="group">
                                                <input
                                                    type="radio"
                                                    className="btn-check"
                                                    name="qualityStatus"
                                                    id="approved"
                                                    checked={qualityStatus === 'approved'}
                                                    onChange={() => setQualityStatus('approved')}
                                                />
                                                <label className="btn btn-outline-success" htmlFor="approved">
                                                    <i className="ri-check-double-line me-1"></i>
                                                    Onaylandı
                                                </label>

                                                <input
                                                    type="radio"
                                                    className="btn-check"
                                                    name="qualityStatus"
                                                    id="rejected"
                                                    checked={qualityStatus === 'rejected'}
                                                    onChange={() => setQualityStatus('rejected')}
                                                />
                                                <label className="btn btn-outline-danger" htmlFor="rejected">
                                                    <i className="ri-close-circle-line me-1"></i>
                                                    Reddedildi
                                                </label>

                                                <input
                                                    type="radio"
                                                    className="btn-check"
                                                    name="qualityStatus"
                                                    id="partial"
                                                    checked={qualityStatus === 'pending'}
                                                    onChange={() => setQualityStatus('pending')}
                                                />
                                                <label className="btn btn-outline-warning" htmlFor="partial">
                                                    <i className="ri-pause-circle-line me-1"></i>
                                                    Beklemede
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Kalite Kontrol Notları</label>
                                            <textarea
                                                className="form-control"
                                                rows={4}
                                                value={qualityNotes}
                                                onChange={(e) => setQualityNotes(e.target.value)}
                                                placeholder="Kalite kontrol değerlendirme notları..."
                                            ></textarea>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        {qualityStatus === 'rejected' && (
                                            <div className="mb-3">
                                                <label className="form-label">
                                                    Hasar/Problem Detayları <span className="text-danger">*</span>
                                                </label>
                                                <textarea
                                                    className="form-control"
                                                    rows={4}
                                                    value={damageDetails}
                                                    onChange={(e) => setDamageDetails(e.target.value)}
                                                    placeholder="Hasarın detaylarını ve nedenini açıklayın..."
                                                    required
                                                ></textarea>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Quality Control Checklist */}
                                <div className="border rounded p-3 bg-light">
                                    <h6 className="mb-3">Kalite Kontrol Listesi</h6>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="form-check mb-2">
                                                <input className="form-check-input" type="checkbox" id="physical-check" />
                                                <label className="form-check-label" htmlFor="physical-check">
                                                    Fiziksel görünüm kontrol edildi
                                                </label>
                                            </div>
                                            <div className="form-check mb-2">
                                                <input className="form-check-input" type="checkbox" id="packaging-check" />
                                                <label className="form-check-label" htmlFor="packaging-check">
                                                    Ambalaj durumu kontrol edildi
                                                </label>
                                            </div>
                                            <div className="form-check mb-2">
                                                <input className="form-check-input" type="checkbox" id="quantity-check" />
                                                <label className="form-check-label" htmlFor="quantity-check">
                                                    Miktar sayımı doğrulandı
                                                </label>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="form-check mb-2">
                                                <input className="form-check-input" type="checkbox" id="expiry-check" />
                                                <label className="form-check-label" htmlFor="expiry-check">
                                                    Son kullanma tarihi kontrol edildi
                                                </label>
                                            </div>
                                            <div className="form-check mb-2">
                                                <input className="form-check-input" type="checkbox" id="documentation-check" />
                                                <label className="form-check-label" htmlFor="documentation-check">
                                                    Belgeler kontrol edildi
                                                </label>
                                            </div>
                                            <div className="form-check mb-2">
                                                <input className="form-check-input" type="checkbox" id="specification-check" />
                                                <label className="form-check-label" htmlFor="specification-check">
                                                    Teknik özellikler doğrulandı
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary"
                                    onClick={() => setShowQualityControl(false)}
                                >
                                    İptal
                                </button>
                                <button 
                                    type="button" 
                                    className={`btn ${qualityStatus === 'approved' ? 'btn-success' : 
                                                      qualityStatus === 'rejected' ? 'btn-danger' : 'btn-warning'}`}
                                    onClick={handleQualityControlSubmit}
                                    disabled={qualityStatus === 'rejected' && !damageDetails.trim()}
                                >
                                    <i className={`${qualityStatus === 'approved' ? 'ri-check-line' : 
                                                    qualityStatus === 'rejected' ? 'ri-close-line' : 'ri-time-line'} me-1`}></i>
                                    {qualityStatus === 'approved' ? 'Onayla ve Teslim Al' : 
                                     qualityStatus === 'rejected' ? 'Reddet ve Kaydet' : 'Beklemede Bırak'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Help Modal */}
            <ReceivingHelpModal
                show={showHelpModal}
                onClose={() => setShowHelpModal(false)}
            />
        </Layout>
    );
};

export default Process;