import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Alert, Table } from 'react-bootstrap';

interface SyncStats {
    success: boolean;
    total_synced_products?: number;
    products_with_logo_price?: number;
    total_price_lists?: number;
    total_price_cards?: number;
    last_price_sync?: string | null;
    error?: string;
}

interface SyncResult {
    success: boolean;
    stats?: {
        total: number;
        updated: number;
        skipped: number;
        errors: string[];
    };
    error?: string;
}

type ModalState = 'idle' | 'loading_stats' | 'running' | 'completed' | 'error';

interface Props {
    show: boolean;
    onHide: () => void;
}

export default function LogoPriceSyncModal({ show, onHide }: Props) {
    const [state, setState] = useState<ModalState>('loading_stats');
    const [stats, setStats] = useState<SyncStats | null>(null);
    const [result, setResult] = useState<SyncResult | null>(null);
    const [notifyEmail, setNotifyEmail] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (show) {
            loadStats();
        } else {
            setState('loading_stats');
            setResult(null);
            setErrorMessage('');
        }
    }, [show]);

    const loadStats = async () => {
        setState('loading_stats');
        try {
            const response = await fetch('/sales/price-lists/sync-stats', {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            const data = await response.json();
            setStats(data);
            setState('idle');
        } catch (e) {
            setStats(null);
            setState('idle');
        }
    };

    const startSync = async () => {
        setState('running');
        setResult(null);
        setErrorMessage('');

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const response = await fetch('/sales/price-lists/sync-logo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ notify_email: notifyEmail }),
            });

            const data: SyncResult = await response.json();
            setResult(data);

            if (data.success) {
                setState('completed');
                loadStats();
            } else {
                setErrorMessage(data.error || 'Bilinmeyen bir hata oluştu.');
                setState('error');
            }
        } catch (e: any) {
            setErrorMessage(e.message || 'Bağlantı hatası oluştu.');
            setState('error');
        }
    };

    const handleClose = () => {
        if (state === 'running') return;
        onHide();
    };

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return 'Henüz senkronize edilmedi';
        const d = new Date(dateStr);
        return d.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatNumber = (num: number | undefined) => {
        if (num === undefined || num === null) return '0';
        return num.toLocaleString('tr-TR');
    };

    return (
        <Modal show={show} onHide={handleClose} centered size="lg" backdrop={state === 'running' ? 'static' : true}>
            <Modal.Header closeButton={state !== 'running'}>
                <Modal.Title>
                    <i className="ri-refresh-line me-2"></i>
                    Logo Fiyat Senkronizasyonu
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {state === 'loading_stats' && (
                    <div className="text-center py-4">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-2 text-muted mb-0">Bilgiler yükleniyor...</p>
                    </div>
                )}

                {(state === 'idle' || state === 'running') && (
                    <>
                        {/* Last sync info */}
                        <div className="d-flex align-items-center mb-3 p-3 bg-light rounded">
                            <i className="ri-time-line fs-4 text-primary me-3"></i>
                            <div>
                                <small className="text-muted d-block">Son Senkronizasyon</small>
                                <strong>{formatDate(stats?.last_price_sync)}</strong>
                            </div>
                        </div>

                        {/* Stats table */}
                        {stats?.success && (
                            <Table size="sm" className="mb-3">
                                <tbody>
                                    <tr>
                                        <td className="text-muted">Toplam Logo Ürünü</td>
                                        <td className="text-end fw-semibold">{formatNumber(stats.total_synced_products)}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-muted">Fiyatı Olan Ürün</td>
                                        <td className="text-end fw-semibold">{formatNumber(stats.products_with_logo_price)}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-muted">Fiyat Listesi</td>
                                        <td className="text-end fw-semibold">{formatNumber(stats.total_price_lists)}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-muted">Fiyat Kartı</td>
                                        <td className="text-end fw-semibold">{formatNumber(stats.total_price_cards)}</td>
                                    </tr>
                                </tbody>
                            </Table>
                        )}

                        {/* Warning */}
                        <Alert variant="warning" className="d-flex align-items-start mb-3">
                            <i className="ri-error-warning-line fs-5 me-2 mt-1"></i>
                            <div>
                                <strong>Bu işlem birkaç dakika sürebilir.</strong>
                                <br />
                                <small>Senkronizasyon sırasında lütfen bu pencereyi kapatmayınız.</small>
                            </div>
                        </Alert>

                        {/* Email notification checkbox */}
                        <Form.Check
                            type="checkbox"
                            id="notify-email"
                            label="İşlem tamamlandığında e-posta ile bilgilendir"
                            checked={notifyEmail}
                            onChange={(e) => setNotifyEmail(e.target.checked)}
                            disabled={state === 'running'}
                        />

                        {/* Running state */}
                        {state === 'running' && (
                            <div className="text-center mt-4 py-3">
                                <Spinner animation="border" variant="primary" />
                                <p className="mt-3 mb-0 fw-semibold">Senkronizasyon devam ediyor...</p>
                                <small className="text-muted">Logo veritabanından fiyatlar çekiliyor. Lütfen bekleyiniz.</small>
                            </div>
                        )}
                    </>
                )}

                {state === 'completed' && result?.stats && (
                    <>
                        <Alert variant="success" className="d-flex align-items-center">
                            <i className="ri-checkbox-circle-line fs-4 me-2"></i>
                            <strong>Senkronizasyon başarıyla tamamlandı!</strong>
                        </Alert>

                        <Table bordered size="sm">
                            <tbody>
                                <tr>
                                    <td>Toplam İşlenen</td>
                                    <td className="text-end fw-semibold">{formatNumber(result.stats.total)}</td>
                                </tr>
                                <tr className="table-success">
                                    <td>Güncellenen</td>
                                    <td className="text-end fw-semibold">{formatNumber(result.stats.updated)}</td>
                                </tr>
                                <tr>
                                    <td>Atlanan</td>
                                    <td className="text-end fw-semibold">{formatNumber(result.stats.skipped)}</td>
                                </tr>
                                {result.stats.errors.length > 0 && (
                                    <tr className="table-danger">
                                        <td>Hata</td>
                                        <td className="text-end fw-semibold">{formatNumber(result.stats.errors.length)}</td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>

                        {notifyEmail && (
                            <small className="text-muted">
                                <i className="ri-mail-line me-1"></i>
                                Sonuçlar e-posta adresinize gönderildi.
                            </small>
                        )}
                    </>
                )}

                {state === 'error' && (
                    <>
                        <Alert variant="danger" className="d-flex align-items-start">
                            <i className="ri-error-warning-line fs-4 me-2 mt-1"></i>
                            <div>
                                <strong>Senkronizasyon başarısız!</strong>
                                <br />
                                <small>{errorMessage}</small>
                            </div>
                        </Alert>
                    </>
                )}
            </Modal.Body>

            <Modal.Footer>
                {state === 'idle' && (
                    <>
                        <Button variant="light" onClick={handleClose}>
                            Kapat
                        </Button>
                        <Button variant="primary" onClick={startSync}>
                            <i className="ri-refresh-line me-1"></i>
                            Senkronizasyonu Başlat
                        </Button>
                    </>
                )}

                {state === 'running' && (
                    <Button variant="secondary" disabled>
                        <Spinner animation="border" size="sm" className="me-2" />
                        İşlem devam ediyor...
                    </Button>
                )}

                {state === 'completed' && (
                    <Button variant="primary" onClick={handleClose}>
                        Kapat
                    </Button>
                )}

                {state === 'error' && (
                    <>
                        <Button variant="light" onClick={handleClose}>
                            Kapat
                        </Button>
                        <Button variant="warning" onClick={startSync}>
                            <i className="ri-refresh-line me-1"></i>
                            Tekrar Dene
                        </Button>
                    </>
                )}
            </Modal.Footer>
        </Modal>
    );
}
