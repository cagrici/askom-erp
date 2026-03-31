import React, { useState, useEffect, useRef } from 'react';
import { Head, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import axios from 'axios';
import Layout from "../../../Layouts";

interface ScanResult {
    label_code: string;
    work_order: {
        worder_no: string;
        product_name: string;
        total_quantity: number;
        scanned_quantity: number;
        remaining_quantity: number;
        is_completed: boolean;
    };
}

interface Statistics {
    today_scanned: number;
    total_pending: number;
    recent_scans: Array<{
        label_code: string;
        work_order_no: string;
        product_name: string;
        scanned_at: string;
        scanned_by: string;
    }>;
}

export default function Index({ auth }: PageProps) {
    const [labelCode, setLabelCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [lastScan, setLastScan] = useState<ScanResult | null>(null);
    const [error, setError] = useState('');
    const [statistics, setStatistics] = useState<Statistics | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchStatistics();
        const interval = setInterval(fetchStatistics, 10000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        inputRef.current?.focus();
    }, [lastScan]);

    const fetchStatistics = async () => {
        try {
            const response = await axios.get('/uretim/etiketler/statistics');
            setStatistics(response.data);
        } catch (error) {
            console.error('İstatistik yükleme hatası:', error);
        }
    };

    const handleScan = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!labelCode.trim()) {
            setError('Lütfen etiket kodunu girin');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await axios.post('/uretim/etiketler/tara', {
                label_code: labelCode.trim(),
            });

            setLastScan(response.data.data);
            setLabelCode('');
            fetchStatistics();

            if (response.data.data.work_order.is_completed) {
                alert(`İş emri ${response.data.data.work_order.worder_no} tamamlandı!`);
            }
        } catch (error: any) {
            setError(error.response?.data?.message || 'Okutma hatası');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <Head title="Etiket Okutma" />
            <div className="page-content">
            <div className="container-fluid py-4">
                <div className="row">
                    <div className="col-lg-8">
                        <div className="card">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <h2 className="h4 mb-0">Etiket Okutma</h2>
                                <Link
                                    href="/uretim/is-emirleri"
                                    className="btn btn-secondary"
                                >
                                    <i className="bi bi-list me-2"></i>
                                    İş Emirleri
                                </Link>
                            </div>
                            <div className="card-body">
                                <form onSubmit={handleScan}>
                                    <div className="mb-4">
                                        <label className="form-label fs-5">Etiket Kodunu Okutun</label>
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            className="form-control form-control-lg"
                                            value={labelCode}
                                            onChange={(e) => setLabelCode(e.target.value)}
                                            disabled={loading}
                                            placeholder="Etiket kodunu okutun..."
                                            autoFocus
                                            style={{ fontSize: '1.5rem', padding: '1rem' }}
                                        />
                                    </div>

                                    {error && (
                                        <div className="alert alert-danger" role="alert">
                                            <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn btn-primary btn-lg w-100"
                                        style={{ padding: '1rem', fontSize: '1.25rem' }}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                İşleniyor...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-qr-code-scan me-2"></i>
                                                OKUT
                                            </>
                                        )}
                                    </button>
                                </form>

                                {lastScan && (
                                    <div className="mt-4">
                                        <div className="alert alert-success">
                                            <h5 className="alert-heading">
                                                <i className="bi bi-check-circle-fill me-2"></i>
                                                Son Okutulan Ürün
                                            </h5>
                                            <hr />
                                            <table className="table table-sm mb-0">
                                                <tbody>
                                                    <tr>
                                                        <th width="40%">Etiket Kodu:</th>
                                                        <td className="font-monospace">{lastScan.label_code}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>İş Emri No:</th>
                                                        <td>{lastScan.work_order.worder_no}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>Ürün:</th>
                                                        <td>{lastScan.work_order.product_name}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>İlerleme:</th>
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                <span className="me-2">
                                                                    {lastScan.work_order.scanned_quantity} / {lastScan.work_order.total_quantity}
                                                                </span>
                                                                <span className="text-muted small">
                                                                    (Kalan: {lastScan.work_order.remaining_quantity})
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            {lastScan.work_order.is_completed && (
                                                <div className="mt-3">
                                                    <div className="badge bg-success fs-6">
                                                        <i className="bi bi-check-circle me-1"></i>
                                                        Bu iş emri tamamlandı!
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-4">
                        <div className="card mb-4">
                            <div className="card-header">
                                <h5 className="mb-0">Günlük Özet</h5>
                            </div>
                            <div className="card-body">
                                {statistics && (
                                    <>
                                        <div className="mb-4">
                                            <h6 className="text-muted">Bugün Okutulan</h6>
                                            <h2 className="text-primary mb-0">{statistics.today_scanned}</h2>
                                        </div>
                                        <div>
                                            <h6 className="text-muted">Bekleyen Etiket</h6>
                                            <h3 className="text-warning mb-0">{statistics.total_pending}</h3>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h5 className="mb-0">Son Okutmalar</h5>
                            </div>
                            <div className="card-body">
                                {statistics && statistics.recent_scans.length > 0 ? (
                                    <div className="list-group list-group-flush">
                                        {statistics.recent_scans.map((scan, index) => (
                                            <div key={index} className="list-group-item px-0">
                                                <div className="d-flex w-100 justify-content-between">
                                                    <h6 className="mb-1">{scan.product_name}</h6>
                                                    <small>{scan.scanned_at}</small>
                                                </div>
                                                <p className="mb-1 small text-muted">
                                                    {scan.work_order_no}
                                                </p>
                                                <small className="text-muted">
                                                    <i className="bi bi-person me-1"></i>
                                                    {scan.scanned_by}
                                                </small>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted mb-0">Henüz okutma yapılmamış</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </Layout>
    );
}
