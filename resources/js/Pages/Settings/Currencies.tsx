import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import Layout from '../../Layouts';

interface Currency {
    id: number;
    cur_code: string;
    name: string;
    cur_symbol: string;
    description: string | null;
    exchange_rate: string;
    is_default: boolean;
    decimal_places: number;
    thousand_separator: string;
    decimal_separator: string;
    symbol_position: 'before' | 'after';
    last_updated_at: string | null;
    is_active: boolean;
}

interface Props {
    currencies: Currency[];
}

export default function Currencies({ currencies }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        cur_code: '',
        name: '',
        cur_symbol: '',
        description: '',
        exchange_rate: '1.000000',
        decimal_places: 2,
        thousand_separator: ',',
        decimal_separator: '.',
        symbol_position: 'before' as 'before' | 'after',
        is_active: true,
    });

    const openCreateModal = () => {
        reset();
        setEditingCurrency(null);
        setShowModal(true);
    };

    const openEditModal = (currency: Currency) => {
        setEditingCurrency(currency);
        setData({
            cur_code: currency.cur_code,
            name: currency.name,
            cur_symbol: currency.cur_symbol,
            description: currency.description || '',
            exchange_rate: currency.exchange_rate,
            decimal_places: currency.decimal_places,
            thousand_separator: currency.thousand_separator,
            decimal_separator: currency.decimal_separator,
            symbol_position: currency.symbol_position,
            is_active: currency.is_active,
        });
        setShowModal(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingCurrency) {
            put(route('settings.currencies.update', editingCurrency.id), {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                },
                preserveScroll: true,
            });
        } else {
            post(route('settings.currencies.store'), {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                },
                preserveScroll: true,
            });
        }
    };

    const deleteCurrency = (currency: Currency) => {
        if (confirm(`${currency.name} para birimini silmek istediğinizden emin misiniz?`)) {
            router.delete(route('settings.currencies.destroy', currency.id), {
                preserveScroll: true,
            });
        }
    };

    const setDefault = (currency: Currency) => {
        router.patch(route('settings.currencies.set-default', currency.id), {}, {
            preserveScroll: true,
        });
    };

    const toggleStatus = (currency: Currency) => {
        router.patch(route('settings.currencies.toggle-status', currency.id), {}, {
            preserveScroll: true,
        });
    };

    const updateExchangeRates = () => {
        const defaultCurrency = currencies.find(c => c.is_default);
        if (!defaultCurrency) {
            alert('Lütfen önce bir varsayılan para birimi belirleyin.');
            return;
        }

        router.post(route('settings.currencies.update-rates'), {
            base_currency: defaultCurrency.cur_code,
        }, {
            preserveScroll: true,
        });
    };

    const formatExampleAmount = (currency: Currency) => {
        const amount = 1234.56;
        const formatted = amount.toLocaleString('tr-TR', {
            minimumFractionDigits: currency.decimal_places,
            maximumFractionDigits: currency.decimal_places,
        })
            .replace(/\./g, 'THOUSAND')
            .replace(/,/g, 'DECIMAL')
            .replace(/THOUSAND/g, currency.thousand_separator)
            .replace(/DECIMAL/g, currency.decimal_separator);

        if (currency.symbol_position === 'before') {
            return `${currency.cur_symbol}${formatted}`;
        }
        return `${formatted}${currency.cur_symbol}`;
    };

    return (
        <Layout>
            <Head title="Para Birimleri" />
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Para Birimleri</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item">
                                            <Link href={route('dashboard')}>Dashboard</Link>
                                        </li>
                                        <li className="breadcrumb-item">Ayarlar</li>
                                        <li className="breadcrumb-item active">Para Birimleri</li>
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
                                                href={route('settings.currencies.index')}
                                                className="nav-link active"
                                            >
                                                <i className="fas fa-dollar-sign me-1"></i>
                                                Para Birimleri
                                            </Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link
                                                href={route('settings.backup.index')}
                                                className="nav-link"
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

                    {/* Actions */}
                    <div className="row mb-3">
                        <div className="col-12">
                            <div className="d-flex justify-content-between align-items-center">
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={openCreateModal}
                                >
                                    <i className="fas fa-plus me-1"></i>
                                    Yeni Para Birimi
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-info"
                                    onClick={updateExchangeRates}
                                >
                                    <i className="fas fa-sync-alt me-1"></i>
                                    Kurları Güncelle
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Currencies Table */}
                    <div className="row">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-body">
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Kod</th>
                                                    <th>Ad</th>
                                                    <th>Sembol</th>
                                                    <th>Kur</th>
                                                    <th>Format Örneği</th>
                                                    <th>Son Güncelleme</th>
                                                    <th>Durum</th>
                                                    <th className="text-end">İşlemler</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currencies.map((currency) => (
                                                    <tr key={currency.id}>
                                                        <td>
                                                            <strong>{currency.cur_code}</strong>
                                                            {currency.is_default && (
                                                                <span className="badge bg-primary ms-2">
                                                                    Varsayılan
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td>{currency.name}</td>
                                                        <td>
                                                            <span className="badge bg-secondary">
                                                                {currency.cur_symbol}
                                                            </span>
                                                        </td>
                                                        <td>{parseFloat(currency.exchange_rate).toFixed(6)}</td>
                                                        <td>
                                                            <code>{formatExampleAmount(currency)}</code>
                                                        </td>
                                                        <td>
                                                            {currency.last_updated_at
                                                                ? new Date(currency.last_updated_at).toLocaleDateString('tr-TR')
                                                                : '-'}
                                                        </td>
                                                        <td>
                                                            <span
                                                                className={`badge bg-${currency.is_active ? 'success' : 'danger'}`}
                                                            >
                                                                {currency.is_active ? 'Aktif' : 'Pasif'}
                                                            </span>
                                                        </td>
                                                        <td className="text-end">
                                                            <div className="dropdown">
                                                                <button
                                                                    className="btn btn-sm btn-light dropdown-toggle"
                                                                    type="button"
                                                                    data-bs-toggle="dropdown"
                                                                    aria-expanded="false"
                                                                >
                                                                    İşlemler
                                                                </button>
                                                                <ul className="dropdown-menu dropdown-menu-end">
                                                                    <li>
                                                                        <button
                                                                            className="dropdown-item"
                                                                            onClick={() => openEditModal(currency)}
                                                                        >
                                                                            <i className="fas fa-edit me-2"></i>
                                                                            Düzenle
                                                                        </button>
                                                                    </li>
                                                                    {!currency.is_default && (
                                                                        <li>
                                                                            <button
                                                                                className="dropdown-item"
                                                                                onClick={() => setDefault(currency)}
                                                                            >
                                                                                <i className="fas fa-star me-2"></i>
                                                                                Varsayılan Yap
                                                                            </button>
                                                                        </li>
                                                                    )}
                                                                    <li>
                                                                        <button
                                                                            className="dropdown-item"
                                                                            onClick={() => toggleStatus(currency)}
                                                                        >
                                                                            <i className={`fas fa-${currency.is_active ? 'times' : 'check'} me-2`}></i>
                                                                            {currency.is_active ? 'Devre Dışı Bırak' : 'Aktif Et'}
                                                                        </button>
                                                                    </li>
                                                                    {!currency.is_default && (
                                                                        <>
                                                                            <li><hr className="dropdown-divider" /></li>
                                                                            <li>
                                                                                <button
                                                                                    className="dropdown-item text-danger"
                                                                                    onClick={() => deleteCurrency(currency)}
                                                                                >
                                                                                    <i className="fas fa-trash me-2"></i>
                                                                                    Sil
                                                                                </button>
                                                                            </li>
                                                                        </>
                                                                    )}
                                                                </ul>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Info Card */}
                    <div className="row">
                        <div className="col-12">
                            <div className="card border-info">
                                <div className="card-body">
                                    <h5 className="card-title text-info">
                                        <i className="fas fa-info-circle me-2"></i>
                                        Para Birimi Yönetimi Hakkında
                                    </h5>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <h6>Döviz Kuru Güncelleme</h6>
                                            <p className="mb-3">
                                                "Kurları Güncelle" butonu ile döviz kurlarını otomatik olarak güncelleyebilirsiniz.
                                                Bu özellik bir döviz kuru API servisi ile entegre edilmelidir.
                                            </p>
                                            <h6>Varsayılan Para Birimi</h6>
                                            <p className="mb-3">
                                                Varsayılan para birimi, sistemdeki ana para birimidir ve silinemez veya devre dışı bırakılamaz.
                                            </p>
                                        </div>
                                        <div className="col-md-6">
                                            <h6>Format Ayarları</h6>
                                            <p className="mb-3">
                                                Her para birimi için özel format ayarları yapabilirsiniz:
                                                ondalık basamak sayısı, binlik ayırıcı, ondalık ayırıcı ve sembol pozisyonu.
                                            </p>
                                            <h6>Önerilen API Servisleri</h6>
                                            <ul className="mb-0">
                                                <li>TCMB (Türkiye Cumhuriyet Merkez Bankası)</li>
                                                <li>exchangerate-api.com</li>
                                                <li>fixer.io</li>
                                                <li>openexchangerates.org</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <form onSubmit={handleSubmit}>
                                <div className="modal-header">
                                    <h5 className="modal-title">
                                        {editingCurrency ? 'Para Birimi Düzenle' : 'Yeni Para Birimi'}
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => setShowModal(false)}
                                    ></button>
                                </div>
                                <div className="modal-body">
                                    <div className="row">
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label">Para Birimi Kodu <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.cur_code ? 'is-invalid' : ''}`}
                                                value={data.cur_code}
                                                onChange={(e) => setData('cur_code', e.target.value.toUpperCase())}
                                                maxLength={3}
                                                placeholder="TRY"
                                            />
                                            {errors.cur_code && <div className="invalid-feedback">{errors.cur_code}</div>}
                                            <small className="text-muted">3 karakter (ISO 4217)</small>
                                        </div>

                                        <div className="col-md-8 mb-3">
                                            <label className="form-label">Para Birimi Adı <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                placeholder="Türk Lirası"
                                            />
                                            {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Sembol <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.cur_symbol ? 'is-invalid' : ''}`}
                                                value={data.cur_symbol}
                                                onChange={(e) => setData('cur_symbol', e.target.value)}
                                                placeholder="₺"
                                            />
                                            {errors.cur_symbol && <div className="invalid-feedback">{errors.cur_symbol}</div>}
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Kur <span className="text-danger">*</span></label>
                                            <input
                                                type="number"
                                                step="0.000001"
                                                className={`form-control ${errors.exchange_rate ? 'is-invalid' : ''}`}
                                                value={data.exchange_rate}
                                                onChange={(e) => setData('exchange_rate', e.target.value)}
                                            />
                                            {errors.exchange_rate && <div className="invalid-feedback">{errors.exchange_rate}</div>}
                                            <small className="text-muted">Varsayılan para birimine göre</small>
                                        </div>

                                        <div className="col-12 mb-3">
                                            <label className="form-label">Açıklama</label>
                                            <textarea
                                                className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                                                rows={2}
                                                value={data.description}
                                                onChange={(e) => setData('description', e.target.value)}
                                            ></textarea>
                                            {errors.description && <div className="invalid-feedback">{errors.description}</div>}
                                        </div>

                                        <div className="col-12 mb-3">
                                            <hr />
                                            <h6>Format Ayarları</h6>
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Ondalık Basamak <span className="text-danger">*</span></label>
                                            <select
                                                className={`form-select ${errors.decimal_places ? 'is-invalid' : ''}`}
                                                value={data.decimal_places}
                                                onChange={(e) => setData('decimal_places', parseInt(e.target.value))}
                                            >
                                                <option value={0}>0</option>
                                                <option value={1}>1</option>
                                                <option value={2}>2</option>
                                                <option value={3}>3</option>
                                                <option value={4}>4</option>
                                            </select>
                                            {errors.decimal_places && <div className="invalid-feedback">{errors.decimal_places}</div>}
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Sembol Konumu <span className="text-danger">*</span></label>
                                            <select
                                                className={`form-select ${errors.symbol_position ? 'is-invalid' : ''}`}
                                                value={data.symbol_position}
                                                onChange={(e) => setData('symbol_position', e.target.value as 'before' | 'after')}
                                            >
                                                <option value="before">Önce (₺1.234,56)</option>
                                                <option value="after">Sonra (1.234,56₺)</option>
                                            </select>
                                            {errors.symbol_position && <div className="invalid-feedback">{errors.symbol_position}</div>}
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Binlik Ayırıcı <span className="text-danger">*</span></label>
                                            <select
                                                className={`form-select ${errors.thousand_separator ? 'is-invalid' : ''}`}
                                                value={data.thousand_separator}
                                                onChange={(e) => setData('thousand_separator', e.target.value)}
                                            >
                                                <option value=",">Virgül (,)</option>
                                                <option value=".">Nokta (.)</option>
                                                <option value=" ">Boşluk ( )</option>
                                                <option value="">Yok</option>
                                            </select>
                                            {errors.thousand_separator && <div className="invalid-feedback">{errors.thousand_separator}</div>}
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Ondalık Ayırıcı <span className="text-danger">*</span></label>
                                            <select
                                                className={`form-select ${errors.decimal_separator ? 'is-invalid' : ''}`}
                                                value={data.decimal_separator}
                                                onChange={(e) => setData('decimal_separator', e.target.value)}
                                            >
                                                <option value=".">Nokta (.)</option>
                                                <option value=",">Virgül (,)</option>
                                            </select>
                                            {errors.decimal_separator && <div className="invalid-feedback">{errors.decimal_separator}</div>}
                                        </div>

                                        <div className="col-12 mb-3">
                                            <div className="form-check form-switch">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={data.is_active}
                                                    onChange={(e) => setData('is_active', e.target.checked)}
                                                />
                                                <label className="form-check-label">
                                                    Aktif
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setShowModal(false)}
                                    >
                                        İptal
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={processing}
                                    >
                                        {processing ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                Kaydediliyor...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-save me-1"></i>
                                                Kaydet
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}
