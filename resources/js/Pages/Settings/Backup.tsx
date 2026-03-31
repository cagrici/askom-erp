import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import Layout from '../../Layouts';

interface Backup {
    filename: string;
    size: number;
    size_formatted: string;
    created_at: string;
    type: string;
}

interface BackupStats {
    total_backups: number;
    total_size: number;
    total_size_formatted: string;
    last_backup: string | null;
    database_size: string;
}

interface Props {
    backups: Backup[];
    stats: BackupStats;
}

export default function Backup({ backups, stats }: Props) {
    const [creatingBackup, setCreatingBackup] = useState(false);
    const [backupType, setBackupType] = useState<'database' | 'files' | 'full'>('database');

    const createBackup = () => {
        setCreatingBackup(true);
        router.post(route('settings.backup.create'),
            { type: backupType },
            {
                onFinish: () => setCreatingBackup(false),
                preserveScroll: true,
            }
        );
    };

    const downloadBackup = (filename: string) => {
        window.location.href = route('settings.backup.download', { filename });
    };

    const deleteBackup = (filename: string) => {
        if (confirm('Bu yedek dosyasını silmek istediğinizden emin misiniz?')) {
            router.delete(route('settings.backup.delete', { filename }), {
                preserveScroll: true,
            });
        }
    };

    const getBackupTypeLabel = (type: string) => {
        const types: Record<string, string> = {
            database: 'Veritabanı',
            files: 'Dosyalar',
            full: 'Tam Yedek',
            unknown: 'Bilinmeyen'
        };
        return types[type] || types.unknown;
    };

    const getBackupTypeBadge = (type: string) => {
        const badges: Record<string, string> = {
            database: 'info',
            files: 'warning',
            full: 'success',
            unknown: 'secondary'
        };
        return badges[type] || badges.unknown;
    };

    return (
        <Layout>
            <Head title="Yedekleme Ayarları" />
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Yedekleme Ayarları</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item">
                                            <Link href={route('dashboard')}>Dashboard</Link>
                                        </li>
                                        <li className="breadcrumb-item">Ayarlar</li>
                                        <li className="breadcrumb-item active">Yedekleme</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Settings Navigation Tabs */}
                    <div className="row mb-3">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-body">
                                    <ul className="nav nav-pills" role="tablist">
                                        <li className="nav-item">
                                            <Link
                                                href={route('settings.general')}
                                                className="nav-link"
                                            >
                                                <i className="fas fa-cog me-1"></i>
                                                Genel
                                            </Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link
                                                href={route('settings.system')}
                                                className="nav-link"
                                            >
                                                <i className="fas fa-server me-1"></i>
                                                Sistem
                                            </Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link
                                                href={route('settings.email')}
                                                className="nav-link"
                                            >
                                                <i className="fas fa-envelope me-1"></i>
                                                E-posta
                                            </Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link
                                                href={route('settings.tax.index')}
                                                className="nav-link"
                                            >
                                                <i className="fas fa-percentage me-1"></i>
                                                Vergi
                                            </Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link
                                                href={route('settings.locations.index')}
                                                className="nav-link"
                                            >
                                                <i className="fas fa-map-marker-alt me-1"></i>
                                                Lokasyonlar
                                            </Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link
                                                href={route('settings.backup.index')}
                                                className="nav-link active"
                                            >
                                                <i className="fas fa-database me-1"></i>
                                                Yedekleme
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Statistics Cards */}
                    <div className="row">
                        <div className="col-xl-3 col-md-6">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-medium text-muted mb-0">
                                                Toplam Yedek
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <h5 className="text-success fs-14 mb-0">
                                                <i className="fas fa-copy align-middle"></i>
                                            </h5>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-0">
                                                {stats.total_backups}
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
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-medium text-muted mb-0">
                                                Toplam Boyut
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <h5 className="text-info fs-14 mb-0">
                                                <i className="fas fa-hdd align-middle"></i>
                                            </h5>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-0">
                                                {stats.total_size_formatted}
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
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-medium text-muted mb-0">
                                                Son Yedek
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <h5 className="text-warning fs-14 mb-0">
                                                <i className="fas fa-clock align-middle"></i>
                                            </h5>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-0">
                                                {stats.last_backup ? new Date(stats.last_backup).toLocaleDateString('tr-TR') : '-'}
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
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-medium text-muted mb-0">
                                                Veritabanı Boyutu
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <h5 className="text-primary fs-14 mb-0">
                                                <i className="fas fa-database align-middle"></i>
                                            </h5>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-0">
                                                {stats.database_size}
                                            </h4>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        {/* Create Backup Section */}
                        <div className="col-lg-4">
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">
                                        <i className="fas fa-plus-circle me-2"></i>
                                        Yeni Yedek Oluştur
                                    </h5>
                                </div>
                                <div className="card-body">
                                    <div className="mb-3">
                                        <label className="form-label">Yedek Tipi</label>
                                        <select
                                            className="form-select"
                                            value={backupType}
                                            onChange={(e) => setBackupType(e.target.value as any)}
                                            disabled={creatingBackup}
                                        >
                                            <option value="database">Veritabanı</option>
                                            <option value="files">Dosyalar</option>
                                            <option value="full">Tam Yedek (Veritabanı + Dosyalar)</option>
                                        </select>
                                    </div>

                                    <div className="alert alert-info border-0 mb-3">
                                        <h6 className="alert-heading">
                                            <i className="fas fa-info-circle me-2"></i>
                                            Bilgi
                                        </h6>
                                        <p className="mb-2">
                                            <strong>Veritabanı:</strong> Tüm veritabanı tablolarını yedekler (.sql)
                                        </p>
                                        <p className="mb-2">
                                            <strong>Dosyalar:</strong> Yüklenen dosyaları yedekler (.zip)
                                        </p>
                                        <p className="mb-0">
                                            <strong>Tam Yedek:</strong> Veritabanı ve dosyaları birlikte yedekler (.zip)
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        className="btn btn-primary w-100"
                                        onClick={createBackup}
                                        disabled={creatingBackup}
                                    >
                                        {creatingBackup ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Yedek Oluşturuluyor...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-download me-2"></i>
                                                Yedek Oluştur
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Important Notes */}
                            <div className="card border-warning">
                                <div className="card-body">
                                    <h5 className="card-title text-warning">
                                        <i className="fas fa-exclamation-triangle me-2"></i>
                                        Önemli Notlar
                                    </h5>
                                    <ul className="mb-0">
                                        <li className="mb-2">
                                            Yedekleme işlemi sunucu kaynaklarını kullanır. Büyük sistemlerde işlem uzun sürebilir.
                                        </li>
                                        <li className="mb-2">
                                            Yedekleme dosyaları sunucuda <code>storage/app/backups/</code> dizininde saklanır.
                                        </li>
                                        <li className="mb-2">
                                            Düzenli olarak eski yedekleri silmeyi unutmayın.
                                        </li>
                                        <li className="mb-0">
                                            Kritik yedekleri farklı bir konuma indirmeniz önerilir.
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Backup List */}
                        <div className="col-lg-8">
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">
                                        <i className="fas fa-list me-2"></i>
                                        Mevcut Yedekler
                                    </h5>
                                </div>
                                <div className="card-body">
                                    {backups.length === 0 ? (
                                        <div className="text-center py-5">
                                            <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                                            <p className="text-muted">Henüz yedek dosyası bulunmamaktadır.</p>
                                        </div>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table table-hover align-middle mb-0">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>Dosya Adı</th>
                                                        <th>Tip</th>
                                                        <th>Boyut</th>
                                                        <th>Tarih</th>
                                                        <th className="text-end">İşlemler</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {backups.map((backup) => (
                                                        <tr key={backup.filename}>
                                                            <td>
                                                                <i className="fas fa-file-archive text-primary me-2"></i>
                                                                {backup.filename}
                                                            </td>
                                                            <td>
                                                                <span className={`badge bg-${getBackupTypeBadge(backup.type)}`}>
                                                                    {getBackupTypeLabel(backup.type)}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {backup.size_formatted}
                                                            </td>
                                                            <td>
                                                                {new Date(backup.created_at).toLocaleString('tr-TR')}
                                                            </td>
                                                            <td className="text-end">
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-success me-2"
                                                                    onClick={() => downloadBackup(backup.filename)}
                                                                    title="İndir"
                                                                >
                                                                    <i className="fas fa-download"></i>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-danger"
                                                                    onClick={() => deleteBackup(backup.filename)}
                                                                    title="Sil"
                                                                >
                                                                    <i className="fas fa-trash"></i>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Backup Best Practices */}
                            <div className="card border-success">
                                <div className="card-body">
                                    <h5 className="card-title text-success">
                                        <i className="fas fa-lightbulb me-2"></i>
                                        Yedekleme En İyi Uygulamaları
                                    </h5>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <h6 className="mb-2">Düzenli Yedekleme</h6>
                                            <ul className="mb-3">
                                                <li>Günlük veritabanı yedeği</li>
                                                <li>Haftalık tam yedek</li>
                                                <li>Aylık arşiv yedeği</li>
                                            </ul>
                                        </div>
                                        <div className="col-md-6">
                                            <h6 className="mb-2">Yedek Saklama</h6>
                                            <ul className="mb-3">
                                                <li>Farklı lokasyonda saklayın</li>
                                                <li>Bulut depolama kullanın</li>
                                                <li>Şifreleyerek koruyun</li>
                                            </ul>
                                        </div>
                                        <div className="col-md-6">
                                            <h6 className="mb-2">Test Edin</h6>
                                            <ul className="mb-0">
                                                <li>Düzenli geri yükleme testi yapın</li>
                                                <li>Yedek bütünlüğünü kontrol edin</li>
                                            </ul>
                                        </div>
                                        <div className="col-md-6">
                                            <h6 className="mb-2">Otomasyon</h6>
                                            <ul className="mb-0">
                                                <li>Cron job ile otomatikleştirin</li>
                                                <li>E-posta bildirimleri ayarlayın</li>
                                            </ul>
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
}
