import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Modal, Form, Button, Row, Col } from 'react-bootstrap';
import Layout from '../../../Layouts';

interface CurrentAccount {
    id: number;
    account_code: string;
    title: string;
    account_type: string;
    person_type: string;
    tax_number?: string;
    tax_office?: string;
    tax_office_id?: string;
    mersys_no?: string;
    trade_registry_no?: string;
    employee_count?: number;
    annual_revenue?: number;
    establishment_year?: number;
    address?: string;
    district?: string;
    district_id?: string;
    city?: string;
    city_id?: string;
    postal_code?: string;
    country?: string;
    country_id?: string;
    phone_1?: string;
    phone_2?: string;
    mobile?: string;
    fax?: string;
    email?: string;
    website?: string;
    contact_person?: string;
    contact_title?: string;
    contact_phone?: string;
    contact_email?: string;
    additional_contacts?: any[];
    credit_limit: number;
    payment_term_id?: string;
    payment_method_id?: string;
    payment_term_days: number;
    discount_rate: number;
    currency: string;
    risk_limit: number;
    e_invoice_enabled: boolean;
    e_invoice_address?: string;
    e_archive_enabled: boolean;
    gib_alias?: string;
    category?: string;
    sector?: string;
    region?: string;
    sales_representative_id?: string;
    lead_source?: string;
    customer_segment?: string;
    preferred_language?: string;
    communication_preferences?: any;
    crm_notes?: string;
    current_balance: number;
    total_receivables: number;
    total_payables: number;
    overdue_amount: number;
    overdue_days: number;
    is_active: boolean;
    is_blocked: boolean;
    block_reason?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
    creator?: {
        id: number;
        name: string;
    };
    updater?: {
        id: number;
        name: string;
    };
    account_type_text: string;
    person_type_text: string;
    status_text: string;
    status_color: string;
    balance_color: string;
    formatted_balance: string;
    risk_status: string;
    risk_status_color: string;
    available_credit: number;
}

interface DeliveryAddress {
    id: number;
    current_account_id: number;
    name: string;
    contact_person?: string;
    contact_phone?: string;
    address: string;
    city_id?: number;
    district_id?: number;
    country_id?: number;
    postal_code?: string;
    type: 'shipping' | 'billing' | 'both';
    delivery_notes?: string;
    delivery_hours?: string;
    is_default: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface Transaction {
    id: number;
    transaction_type: 'debit' | 'credit';
    amount: number;
    transaction_date: string;
    document_type?: string;
    document_id?: string;
    description?: string;
    running_balance?: number;
    trcode?: number;
    modulenr?: number;
}

interface EkstreData {
    totalDebit: number;
    totalCredit: number;
    closingBalance: number;
}

interface Props {
    account: CurrentAccount;
    deliveryAddresses: DeliveryAddress[];
    transactions: Transaction[];
    ekstreData: EkstreData;
}

export default function CurrentAccountShow({ account, deliveryAddresses, transactions, ekstreData }: Props) {
    const [activeTab, setActiveTab] = useState('basic-info');
    
    // Modal states
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingAddress, setEditingAddress] = useState<DeliveryAddress | null>(null);
    const [deletingAddress, setDeletingAddress] = useState<DeliveryAddress | null>(null);
    
    // Address list state
    const [currentAddresses, setCurrentAddresses] = useState<DeliveryAddress[]>(deliveryAddresses || []);
    
    // Geographic data states
    const [countries, setCountries] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);
    const [districts, setDistricts] = useState<any[]>([]);
    
    // Address form state
    const [addressForm, setAddressForm] = useState({
        name: '',
        contact_person: '',
        contact_phone: '',
        address: '',
        country_id: '1', // Turkey default
        city_id: '',
        district_id: '',
        postal_code: '',
        type: 'shipping',
        delivery_notes: '',
        delivery_hours: '',
        is_default: false,
        is_active: true
    });

    // Geographic data loading functions
    const loadCountries = async () => {
        try {
            const response = await fetch('/api/geographic/countries');
            if (response.ok) {
                const data = await response.json();
                setCountries(data);
            }
        } catch (error) {
            console.error('Error loading countries:', error);
        }
    };

    const loadCities = async (countryId: string) => {
        try {
            const response = await fetch(`/api/geographic/cities/${countryId}`);
            if (response.ok) {
                const data = await response.json();
                setCities(data);
            }
        } catch (error) {
            console.error('Error loading cities:', error);
        }
    };

    const loadDistricts = async (cityId: string) => {
        try {
            const response = await fetch(`/api/geographic/districts/${cityId}`);
            if (response.ok) {
                const data = await response.json();
                setDistricts(data);
            }
        } catch (error) {
            console.error('Error loading districts:', error);
        }
    };

    // Load initial geographic data
    useEffect(() => {
        loadCountries();
        loadCities('1'); // Load Turkey cities by default
    }, []);

    // Address handling functions
    const resetAddressForm = () => {
        setAddressForm({
            name: '',
            contact_person: '',
            contact_phone: '',
            address: '',
            country_id: '1',
            city_id: '',
            district_id: '',
            postal_code: '',
            type: 'shipping',
            delivery_notes: '',
            delivery_hours: '',
            is_default: false,
            is_active: true
        });
    };

    const openAddModal = () => {
        resetAddressForm();
        setEditingAddress(null);
        setShowAddressModal(true);
    };

    const openEditModal = (address: DeliveryAddress) => {
        setAddressForm({
            name: address.name || '',
            contact_person: address.contact_person || '',
            contact_phone: address.contact_phone || '',
            address: address.address || '',
            country_id: address.country_id?.toString() || '1',
            city_id: address.city_id?.toString() || '',
            district_id: address.district_id?.toString() || '',
            postal_code: address.postal_code || '',
            type: address.type || 'shipping',
            delivery_notes: address.delivery_notes || '',
            delivery_hours: address.delivery_hours || '',
            is_default: address.is_default || false,
            is_active: address.is_active !== undefined ? address.is_active : true
        });
        setEditingAddress(address);
        
        // Load cities and districts for the selected address
        if (address.country_id) {
            loadCities(address.country_id.toString());
        }
        if (address.city_id) {
            loadDistricts(address.city_id.toString());
        }
        
        setShowAddressModal(true);
    };

    const handleSaveAddress = async () => {
        if (!addressForm.name.trim() || !addressForm.address.trim()) {
            alert('Lütfen adres adı ve adres bilgilerini giriniz.');
            return;
        }

        try {
            const url = editingAddress 
                ? `/accounting/current-accounts/${account.id}/delivery-addresses/${editingAddress.id}`
                : `/accounting/current-accounts/${account.id}/delivery-addresses`;
            
            const method = editingAddress ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({
                    ...addressForm,
                    current_account_id: account.id
                })
            });

            if (response.ok) {
                const savedAddress = await response.json();
                
                if (editingAddress) {
                    // Update existing address
                    setCurrentAddresses(prev => 
                        prev.map(addr => addr.id === editingAddress.id ? savedAddress : addr)
                    );
                } else {
                    // Add new address
                    setCurrentAddresses(prev => [...prev, savedAddress]);
                }
                
                setShowAddressModal(false);
                resetAddressForm();
                setEditingAddress(null);
            } else {
                const errorData = await response.json();
                alert('Adres kaydedilirken hata oluştu: ' + (errorData.message || 'Bilinmeyen hata'));
            }
        } catch (error) {
            console.error('Error saving address:', error);
            alert('Adres kaydedilirken hata oluştu.');
        }
    };

    const openDeleteModal = (address: DeliveryAddress) => {
        setDeletingAddress(address);
        setShowDeleteModal(true);
    };

    const handleDeleteAddress = async () => {
        if (!deletingAddress) return;

        try {
            const response = await fetch(`/accounting/current-accounts/${account.id}/delivery-addresses/${deletingAddress.id}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                }
            });

            if (response.ok) {
                setCurrentAddresses(prev => prev.filter(addr => addr.id !== deletingAddress.id));
                setShowDeleteModal(false);
                setDeletingAddress(null);
            } else {
                const errorData = await response.json();
                alert('Adres silinirken hata oluştu: ' + (errorData.message || 'Bilinmeyen hata'));
            }
        } catch (error) {
            console.error('Error deleting address:', error);
            alert('Adres silinirken hata oluştu.');
        }
    };

    const formatCurrency = (amount: number, currency: string = 'TRY') => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(dateString));
    };

    const getRiskBadge = (status: string, color: string) => {
        const labels = {
            'exceeded': 'Limit Aşıldı',
            'critical': 'Kritik',
            'warning': 'Uyarı',
            'safe': 'Güvenli',
            'no_limit': 'Limit Yok'
        };

        return (
            <span className={`badge bg-${color}-subtle text-${color}`}>
                {labels[status as keyof typeof labels] || status}
            </span>
        );
    };

    return (
        <Layout>
            <Head title={`Cari Kart - ${account.title}`} />

            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Cari Kart Detayı</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item">
                                            <Link href="/accounting/current-accounts">Cari Kartlar</Link>
                                        </li>
                                        <li className="breadcrumb-item active">{account.title}</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Account Header */}
                    <div className="row">
                        <div className="col-xxl-12">
                            <div className="card">
                                <div className="card-body">
                                    <div className="row align-items-center">
                                        <div className="col-lg-8">
                                            <div className="d-flex align-items-center">
                                                <div className="avatar-lg me-3">
                                                    <div className="avatar-title bg-primary-subtle text-primary rounded-circle fs-2">
                                                        <i className="bx bx-user-circle"></i>
                                                    </div>
                                                </div>
                                                <div className="flex-grow-1">
                                                    <div className="d-flex align-items-center gap-2 mb-1">
                                                        <h4 className="mb-0">{account.title}</h4>
                                                        <span className={`badge bg-${account.status_color}-subtle text-${account.status_color}`}>
                                                            {account.status_text}
                                                        </span>
                                                    </div>
                                                    <p className="text-muted mb-0">
                                                        <strong>Cari Kodu:</strong> {account.account_code}
                                                        {account.tax_number && (
                                                            <span className="ms-3">
                                                                <strong>Vergi/TC No:</strong> {account.tax_number}
                                                            </span>
                                                        )}
                                                    </p>
                                                    <div className="mt-2">
                                                        <span className="badge bg-light text-body me-2">
                                                            {account.account_type_text}
                                                        </span>
                                                        <span className="badge bg-light text-body">
                                                            {account.person_type_text}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-lg-4">
                                            <div className="d-flex justify-content-lg-end">
                                                <Link
                                                    href={route('accounting.current-accounts.edit', account.id)}
                                                    className="btn btn-primary me-2"
                                                >
                                                    <i className="ri-edit-line me-1"></i> Düzenle
                                                </Link>
                                                <button className="btn btn-soft-secondary">
                                                    <i className="ri-more-2-fill"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Balance Cards */}
                    <div className="row">
                        <div className="col-xl-3 col-md-6">
                            <div className="card card-animate">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1 overflow-hidden">
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Güncel Bakiye</p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className={`avatar-title bg-${(account.current_balance ?? 0) > 0 ? 'danger' : (account.current_balance ?? 0) < 0 ? 'success' : 'secondary'}-subtle rounded fs-3`}>
                                                <i className={`bx bx-${(account.current_balance ?? 0) >= 0 ? 'trending-up' : 'trending-down'} text-${(account.current_balance ?? 0) > 0 ? 'danger' : (account.current_balance ?? 0) < 0 ? 'success' : 'secondary'}`}></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className={`fs-22 fw-semibold ff-secondary mb-4 text-${(account.current_balance ?? 0) > 0 ? 'danger' : (account.current_balance ?? 0) < 0 ? 'success' : 'secondary'}`}>
                                                {formatCurrency(Math.abs(account.current_balance ?? 0), account.currency)}
                                                {(account.current_balance ?? 0) > 0 ? ' (B)' : (account.current_balance ?? 0) < 0 ? ' (A)' : ''}
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
                                        <div className="flex-grow-1 overflow-hidden">
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Toplam Borç</p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-danger-subtle rounded fs-3">
                                                <i className="bx bx-up-arrow-alt text-danger"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4 text-danger">
                                                {formatCurrency(account.total_receivables, account.currency)}
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
                                        <div className="flex-grow-1 overflow-hidden">
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Toplam Alacak</p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-success-subtle rounded fs-3">
                                                <i className="bx bx-down-arrow-alt text-success"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4 text-success">
                                                {formatCurrency(account.total_payables, account.currency)}
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
                                        <div className="flex-grow-1 overflow-hidden">
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Vadesi Geçen</p>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-warning-subtle rounded fs-3">
                                                <i className="bx bx-time-five text-warning"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4 text-warning">
                                                {formatCurrency(account.overdue_amount, account.currency)}
                                            </h4>
                                            {account.overdue_days > 0 && (
                                                <small className="text-muted">
                                                    {account.overdue_days} gün
                                                </small>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Account Details */}
                    <div className="row">
                        <div className="col-9">
                            <div className="card">
                                <div className="card-header">
                                    <ul className="nav nav-tabs-custom rounded card-header-tabs border-bottom-0" role="tablist">
                                        <li className="nav-item">
                                            <button
                                                className={`nav-link ${activeTab === 'basic-info' ? 'active' : ''}`}
                                                onClick={() => setActiveTab('basic-info')}
                                                type="button"
                                            >
                                                <i className="fas fa-home"></i> Temel Bilgiler
                                            </button>
                                        </li>
                                        <li className="nav-item">
                                            <button
                                                className={`nav-link ${activeTab === 'contact-info' ? 'active' : ''}`}
                                                onClick={() => setActiveTab('contact-info')}
                                                type="button"
                                            >
                                                <i className="far fa-user"></i> İletişim
                                            </button>
                                        </li>
                                        <li className="nav-item">
                                            <button
                                                className={`nav-link ${activeTab === 'financial-info' ? 'active' : ''}`}
                                                onClick={() => setActiveTab('financial-info')}
                                                type="button"
                                            >
                                                <i className="far fa-envelope"></i> Mali Bilgiler
                                            </button>
                                        </li>
                                        <li className="nav-item">
                                            <button
                                                className={`nav-link ${activeTab === 'system-info' ? 'active' : ''}`}
                                                onClick={() => setActiveTab('system-info')}
                                                type="button"
                                            >
                                                <i className="fas fa-cog"></i> Sistem
                                            </button>
                                        </li>
                                        <li className="nav-item">
                                            <button
                                                className={`nav-link ${activeTab === 'delivery-addresses' ? 'active' : ''}`}
                                                onClick={() => setActiveTab('delivery-addresses')}
                                                type="button"
                                            >
                                                <i className="fas fa-map-marker-alt"></i> Sevk Adresleri
                                            </button>
                                        </li>
                                        <li className="nav-item">
                                            <button
                                                className={`nav-link ${activeTab === 'ekstre' ? 'active' : ''}`}
                                                onClick={() => setActiveTab('ekstre')}
                                                type="button"
                                            >
                                                <i className="fas fa-file-invoice-dollar"></i> Cari Ekstre
                                                {transactions && transactions.length > 0 && (
                                                    <span className="badge bg-primary-subtle text-primary ms-1">{transactions.length}</span>
                                                )}
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                                <div className="card-body p-4">
                                    <div className="tab-content">
                                        {activeTab === 'basic-info' && (
                                        <div className="tab-pane active" id="basic-info" role="tabpanel">
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <div className="mb-3">
                                                        <label className="form-label text-muted">Ünvan/Ad Soyad</label>
                                                        <p className="form-control-plaintext">{account.title}</p>
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="mb-3">
                                                        <label className="form-label text-muted">Cari Tipi</label>
                                                        <p className="form-control-plaintext">{account.account_type_text}</p>
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="mb-3">
                                                        <label className="form-label text-muted">Kişi Tipi</label>
                                                        <p className="form-control-plaintext">{account.person_type_text}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="row">
                                                <div className="col-md-3">
                                                    <div className="mb-3">
                                                        <label className="form-label text-muted">Cari Kodu</label>
                                                        <p className="form-control-plaintext">{account.account_code}</p>
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="mb-3">
                                                        <label className="form-label text-muted">Vergi/TC No</label>
                                                        <p className="form-control-plaintext">{account.tax_number || '-'}</p>
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="mb-3">
                                                        <label className="form-label text-muted">Vergi Dairesi</label>
                                                        <p className="form-control-plaintext">{account.tax_office || '-'}</p>
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="mb-3">
                                                        <label className="form-label text-muted">Para Birimi</label>
                                                        <p className="form-control-plaintext">{account.currency}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            {(account.mersys_no || account.trade_registry_no) && (
                                                <div className="row">
                                                    <div className="col-md-6">
                                                        <div className="mb-3">
                                                            <label className="form-label text-muted">MERSİS No</label>
                                                            <p className="form-control-plaintext">{account.mersys_no || '-'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <div className="mb-3">
                                                            <label className="form-label text-muted">Ticaret Sicil No</label>
                                                            <p className="form-control-plaintext">{account.trade_registry_no || '-'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {account.notes && (
                                                <div className="row">
                                                    <div className="col-md-12">
                                                        <div className="mb-3">
                                                            <label className="form-label text-muted">Notlar</label>
                                                            <p className="form-control-plaintext">{account.notes}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        )}

                                        {activeTab === 'contact-info' && (
                                        <div className="tab-pane active" id="contact-info" role="tabpanel">
                                            <div className="row">
                                                <div className="col-md-12">
                                                    <div className="mb-3">
                                                        <label className="form-label text-muted">Adres</label>
                                                        <p className="form-control-plaintext">{account.address || '-'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="row">
                                                <div className="col-md-4">
                                                    <div className="mb-3">
                                                        <label className="form-label text-muted">Şehir</label>
                                                        <p className="form-control-plaintext">{account.city || '-'}</p>
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="mb-3">
                                                        <label className="form-label text-muted">İlçe</label>
                                                        <p className="form-control-plaintext">{account.district || '-'}</p>
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="mb-3">
                                                        <label className="form-label text-muted">Posta Kodu</label>
                                                        <p className="form-control-plaintext">{account.postal_code || '-'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="row">
                                                <div className="col-md-3">
                                                    <div className="mb-3">
                                                        <label className="form-label text-muted">Telefon 1</label>
                                                        <p className="form-control-plaintext">{account.phone_1 || '-'}</p>
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="mb-3">
                                                        <label className="form-label text-muted">Telefon 2</label>
                                                        <p className="form-control-plaintext">{account.phone_2 || '-'}</p>
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="mb-3">
                                                        <label className="form-label text-muted">Mobil</label>
                                                        <p className="form-control-plaintext">{account.mobile || '-'}</p>
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="mb-3">
                                                        <label className="form-label text-muted">Fax</label>
                                                        <p className="form-control-plaintext">{account.fax || '-'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <div className="mb-3">
                                                        <label className="form-label text-muted">E-posta</label>
                                                        <p className="form-control-plaintext">{account.email || '-'}</p>
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="mb-3">
                                                        <label className="form-label text-muted">Web Sitesi</label>
                                                        <p className="form-control-plaintext">
                                                            {account.website ? (
                                                                <a href={account.website} target="_blank" rel="noopener noreferrer">
                                                                    {account.website}
                                                                </a>
                                                            ) : '-'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            {(account.contact_person || account.contact_email || account.contact_phone) && (
                                                <>
                                                    <hr />
                                                    <h6 className="text-muted">Yetkili Kişi</h6>
                                                    <div className="row">
                                                        <div className="col-md-4">
                                                            <div className="mb-3">
                                                                <label className="form-label text-muted">Ad Soyad</label>
                                                                <p className="form-control-plaintext">{account.contact_person || '-'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="col-md-4">
                                                            <div className="mb-3">
                                                                <label className="form-label text-muted">Pozisyon</label>
                                                                <p className="form-control-plaintext">{account.contact_title || '-'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="col-md-4">
                                                            <div className="mb-3">
                                                                <label className="form-label text-muted">Telefon</label>
                                                                <p className="form-control-plaintext">{account.contact_phone || '-'}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="row">
                                                        <div className="col-md-6">
                                                            <div className="mb-3">
                                                                <label className="form-label text-muted">E-posta</label>
                                                                <p className="form-control-plaintext">{account.contact_email || '-'}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        )}

                                        {activeTab === 'financial-info' && (
                                        <div className="tab-pane active" id="financial-info" role="tabpanel">
                                            <div className="row">
                                                <div className="col-md-4">
                                                    <div className="mb-3">
                                                        <label className="form-label text-muted">Kredi Limiti</label>
                                                        <p className="form-control-plaintext">
                                                            {formatCurrency(account.credit_limit, account.currency)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="mb-3">
                                                        <label className="form-label text-muted">Kullanılabilir Kredi</label>
                                                        <p className="form-control-plaintext">
                                                            {formatCurrency(account.available_credit, account.currency)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="mb-3">
                                                        <label className="form-label text-muted">Risk Durumu</label>
                                                        <p className="form-control-plaintext">
                                                            {getRiskBadge(account.risk_status, account.risk_status_color)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="row">
                                                <div className="col-md-4">
                                                    <div className="mb-3">
                                                        <label className="form-label text-muted">Vade Günü</label>
                                                        <p className="form-control-plaintext">{account.payment_term_days} gün</p>
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="mb-3">
                                                        <label className="form-label text-muted">İskonto Oranı</label>
                                                        <p className="form-control-plaintext">%{account.discount_rate}</p>
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="mb-3">
                                                        <label className="form-label text-muted">Risk Limiti</label>
                                                        <p className="form-control-plaintext">
                                                            {formatCurrency(account.risk_limit, account.currency)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            {(account.e_invoice_enabled || account.e_archive_enabled) && (
                                                <>
                                                    <hr />
                                                    <h6 className="text-muted">E-Fatura Bilgileri</h6>
                                                    <div className="row">
                                                        <div className="col-md-6">
                                                            <div className="mb-3">
                                                                <label className="form-label text-muted">E-Fatura</label>
                                                                <p className="form-control-plaintext">
                                                                    <span className={`badge bg-${account.e_invoice_enabled ? 'success' : 'secondary'}-subtle text-${account.e_invoice_enabled ? 'success' : 'secondary'}`}>
                                                                        {account.e_invoice_enabled ? 'Aktif' : 'Pasif'}
                                                                    </span>
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="col-md-6">
                                                            <div className="mb-3">
                                                                <label className="form-label text-muted">E-Arşiv</label>
                                                                <p className="form-control-plaintext">
                                                                    <span className={`badge bg-${account.e_archive_enabled ? 'success' : 'secondary'}-subtle text-${account.e_archive_enabled ? 'success' : 'secondary'}`}>
                                                                        {account.e_archive_enabled ? 'Aktif' : 'Pasif'}
                                                                    </span>
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {account.e_invoice_address && (
                                                        <div className="row">
                                                            <div className="col-md-6">
                                                                <div className="mb-3">
                                                                    <label className="form-label text-muted">E-Fatura Adresi</label>
                                                                    <p className="form-control-plaintext">{account.e_invoice_address}</p>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <div className="mb-3">
                                                                    <label className="form-label text-muted">GİB Alias</label>
                                                                    <p className="form-control-plaintext">{account.gib_alias || '-'}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                        )}

                                        {activeTab === 'system-info' && (
                                        <div className="tab-pane active" id="system-info" role="tabpanel">
                                            <div className="row">
                                                <div className="col-md-4">
                                                    <div className="mb-3">
                                                        <label className="form-label text-muted">Durum</label>
                                                        <p className="form-control-plaintext">
                                                            <span className={`badge bg-${account.status_color}-subtle text-${account.status_color}`}>
                                                                {account.status_text}
                                                            </span>
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="mb-3">
                                                        <label className="form-label text-muted">Oluşturulma</label>
                                                        <p className="form-control-plaintext">{formatDate(account.created_at)}</p>
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="mb-3">
                                                        <label className="form-label text-muted">Son Güncelleme</label>
                                                        <p className="form-control-plaintext">{formatDate(account.updated_at)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <div className="mb-3">
                                                        <label className="form-label text-muted">Oluşturan</label>
                                                        <p className="form-control-plaintext">{account.creator?.name || '-'}</p>
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="mb-3">
                                                        <label className="form-label text-muted">Güncelleyen</label>
                                                        <p className="form-control-plaintext">{account.updater?.name || '-'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            {account.is_blocked && account.block_reason && (
                                                <div className="row">
                                                    <div className="col-md-12">
                                                        <div className="mb-3">
                                                            <label className="form-label text-muted">Bloke Nedeni</label>
                                                            <p className="form-control-plaintext text-danger">{account.block_reason}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {(account.category || account.sector || account.region || account.sales_representative) && (
                                                <>
                                                    <hr />
                                                    <h6 className="text-muted">Kategori Bilgileri</h6>
                                                    <div className="row">
                                                        <div className="col-md-3">
                                                            <div className="mb-3">
                                                                <label className="form-label text-muted">Kategori</label>
                                                                <p className="form-control-plaintext">{account.category || '-'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="col-md-3">
                                                            <div className="mb-3">
                                                                <label className="form-label text-muted">Sektör</label>
                                                                <p className="form-control-plaintext">{account.sector || '-'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="col-md-3">
                                                            <div className="mb-3">
                                                                <label className="form-label text-muted">Bölge</label>
                                                                <p className="form-control-plaintext">{account.region || '-'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="col-md-3">
                                                            <div className="mb-3">
                                                                <label className="form-label text-muted">Satış Temsilcisi</label>
                                                                <p className="form-control-plaintext">{account.sales_representative || '-'}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        )}

                                        {activeTab === 'delivery-addresses' && (
                                        <div className="tab-pane active" id="delivery-addresses" role="tabpanel">
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <h6 className="text-muted mb-0">Sevk Adresleri</h6>
                                                <button
                                                    type="button"
                                                    className="btn btn-primary btn-sm"
                                                    onClick={openAddModal}
                                                >
                                                    <i className="fas fa-plus me-1"></i>
                                                    Yeni Adres Ekle
                                                </button>
                                            </div>
                                            
                                            <div className="row">
                                                <div className="col-12">
                                                    <div className="alert alert-info">
                                                        <i className="fas fa-info-circle me-2"></i>
                                                        Bu müşteriye ait teslimat adresleri burada görüntülenir. Sipariş oluştururken bu adresler kullanılabilir.
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="row">
                                                <div className="col-12">
                                                    {currentAddresses && currentAddresses.length > 0 ? (
                                                        <div className="row">
                                                            {currentAddresses.map((address) => (
                                                                <div key={address.id} className="col-md-6 mb-3">
                                                                    <div className="card">
                                                                        <div className="card-header d-flex justify-content-between align-items-center">
                                                                            <h6 className="mb-0 d-flex align-items-center">
                                                                                <i className="fas fa-map-marker-alt me-2"></i>
                                                                                {address.name}
                                                                                {address.is_default && (
                                                                                    <span className="badge bg-success-subtle text-success ms-2">
                                                                                        Varsayılan
                                                                                    </span>
                                                                                )}
                                                                            </h6>
                                                                            <div className="d-flex gap-1">
                                                                                <button
                                                                                    className="btn btn-sm btn-soft-primary"
                                                                                    onClick={() => openEditModal(address)}
                                                                                    title="Düzenle"
                                                                                >
                                                                                    <i className="ri-edit-line"></i>
                                                                                </button>
                                                                                <button
                                                                                    className="btn btn-sm btn-soft-danger"
                                                                                    onClick={() => openDeleteModal(address)}
                                                                                    title="Sil"
                                                                                >
                                                                                    <i className="ri-delete-bin-line"></i>
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                        <div className="card-body">
                                                                            <p className="text-muted mb-2">
                                                                                <i className="fas fa-map me-2"></i>
                                                                                {address.address}
                                                                            </p>
                                                                            {address.contact_person && (
                                                                                <p className="text-muted mb-2">
                                                                                    <i className="fas fa-user me-2"></i>
                                                                                    {address.contact_person}
                                                                                </p>
                                                                            )}
                                                                            {address.contact_phone && (
                                                                                <p className="text-muted mb-2">
                                                                                    <i className="fas fa-phone me-2"></i>
                                                                                    {address.contact_phone}
                                                                                </p>
                                                                            )}
                                                                            {address.delivery_notes && (
                                                                                <p className="text-muted mb-2">
                                                                                    <i className="fas fa-sticky-note me-2"></i>
                                                                                    {address.delivery_notes}
                                                                                </p>
                                                                            )}
                                                                            {address.delivery_hours && (
                                                                                <p className="text-muted mb-0">
                                                                                    <i className="fas fa-clock me-2"></i>
                                                                                    <strong>Teslimat Saatleri:</strong> {address.delivery_hours}
                                                                                </p>
                                                                            )}
                                                                            <div className="mt-2">
                                                                                <span className={`badge bg-${address.type === 'shipping' ? 'primary' : address.type === 'billing' ? 'warning' : 'success'}-subtle text-${address.type === 'shipping' ? 'primary' : address.type === 'billing' ? 'warning' : 'success'}`}>
                                                                                    {address.type === 'shipping' ? 'Sevk' : address.type === 'billing' ? 'Fatura' : 'Her İkisi'}
                                                                                </span>
                                                                                <span className={`badge bg-${address.is_active ? 'success' : 'secondary'}-subtle text-${address.is_active ? 'success' : 'secondary'} ms-2`}>
                                                                                    {address.is_active ? 'Aktif' : 'Pasif'}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="card">
                                                            <div className="card-body text-center py-4">
                                                                <i className="fas fa-map-marker-alt text-muted mb-2" style={{fontSize: '2rem'}}></i>
                                                                <p className="text-muted mb-0">Bu müşteri için henüz teslimat adresi tanımlanmamış.</p>
                                                                <p className="text-muted small">Yeni adres eklemek için yukarıdaki butonu kullanın.</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        )}

                                        {activeTab === 'ekstre' && (
                                        <div className="tab-pane active" id="ekstre" role="tabpanel">
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <h6 className="mb-0">Cari Hesap Ekstresi</h6>
                                                <a
                                                    href={`/accounting/current-accounts/${account.id}/ekstre-pdf`}
                                                    className="btn btn-sm btn-soft-danger"
                                                    target="_blank"
                                                >
                                                    <i className="ri-file-pdf-line me-1"></i> PDF İndir
                                                </a>
                                            </div>
                                            {transactions && transactions.length > 0 ? (
                                                <>
                                                    <div className="table-responsive">
                                                        <table className="table table-sm table-bordered table-striped mb-0">
                                                            <thead className="table-light">
                                                                <tr>
                                                                    <th style={{width: '80px'}}>Tarih</th>
                                                                    <th style={{width: '140px'}}>Fiş Türü</th>
                                                                    <th style={{width: '120px'}}>Belge No</th>
                                                                    <th>Açıklama</th>
                                                                    <th style={{width: '110px'}} className="text-end">Borç</th>
                                                                    <th style={{width: '110px'}} className="text-end">Alacak</th>
                                                                    <th style={{width: '130px'}} className="text-end">Bakiye</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {transactions.map((tx) => (
                                                                    <tr key={tx.id}>
                                                                        <td className="text-center">
                                                                            {new Date(tx.transaction_date).toLocaleDateString('tr-TR')}
                                                                        </td>
                                                                        <td>{tx.document_type || '-'}</td>
                                                                        <td>{tx.document_id || '-'}</td>
                                                                        <td>{tx.description || ''}</td>
                                                                        <td className="text-end">
                                                                            {tx.transaction_type === 'debit'
                                                                                ? formatCurrency(Number(tx.amount), 'TRY')
                                                                                : ''}
                                                                        </td>
                                                                        <td className="text-end">
                                                                            {tx.transaction_type === 'credit'
                                                                                ? formatCurrency(Number(tx.amount), 'TRY')
                                                                                : ''}
                                                                        </td>
                                                                        <td className="text-end">
                                                                            <span className={(tx.running_balance ?? 0) >= 0 ? 'text-danger' : 'text-success'}>
                                                                                {formatCurrency(Math.abs(tx.running_balance ?? 0), 'TRY')}
                                                                            </span>
                                                                            <small className="text-muted ms-1">
                                                                                ({(tx.running_balance ?? 0) >= 0 ? 'B' : 'A'})
                                                                            </small>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                            <tfoot className="table-light">
                                                                <tr className="fw-bold">
                                                                    <td colSpan={4} className="text-end">TOPLAM</td>
                                                                    <td className="text-end">
                                                                        {formatCurrency(ekstreData?.totalDebit ?? 0, 'TRY')}
                                                                    </td>
                                                                    <td className="text-end">
                                                                        {formatCurrency(ekstreData?.totalCredit ?? 0, 'TRY')}
                                                                    </td>
                                                                    <td className="text-end">
                                                                        <span className={(ekstreData?.closingBalance ?? 0) >= 0 ? 'text-danger' : 'text-success'}>
                                                                            {formatCurrency(Math.abs(ekstreData?.closingBalance ?? 0), 'TRY')}
                                                                        </span>
                                                                        <small className="text-muted ms-1">
                                                                            ({(ekstreData?.closingBalance ?? 0) >= 0 ? 'B' : 'A'})
                                                                        </small>
                                                                    </td>
                                                                </tr>
                                                            </tfoot>
                                                        </table>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center py-4">
                                                    <i className="fas fa-file-invoice text-muted mb-2" style={{fontSize: '2rem'}}></i>
                                                    <p className="text-muted mb-0">Bu cari hesap için henüz hareket kaydı bulunmuyor.</p>
                                                </div>
                                            )}
                                        </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-3">
                            {/* Quick Actions */}
                            <div className="card">
                                <div className="card-header">
                                    <h6 className="card-title mb-0">Hızlı İşlemler</h6>
                                </div>
                                <div className="card-body">
                                    <div className="d-grid gap-2">
                                        <button className="btn btn-soft-primary">
                                            <i className="ri-file-text-line me-1"></i> Yeni Fatura
                                        </button>
                                        <button className="btn btn-soft-success">
                                            <i className="ri-money-dollar-circle-line me-1"></i> Tahsilat
                                        </button>
                                        <button className="btn btn-soft-warning">
                                            <i className="ri-bank-card-line me-1"></i> Ödeme
                                        </button>
                                        <hr />
                                        <button
                                            className="btn btn-soft-info"
                                            onClick={() => setActiveTab('ekstre')}
                                        >
                                            <i className="ri-history-line me-1"></i> Cari Hareket Geçmişi
                                        </button>
                                        <a
                                            href={`/accounting/current-accounts/${account.id}/ekstre-pdf`}
                                            className="btn btn-soft-secondary"
                                            target="_blank"
                                        >
                                            <i className="ri-file-chart-line me-1"></i> Cari Ekstreleri
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Risk Information */}
                            {(account.credit_limit > 0 || account.risk_limit > 0) && (
                                <div className="card">
                                    <div className="card-header">
                                        <h6 className="card-title mb-0">Risk Bilgileri</h6>
                                    </div>
                                    <div className="card-body">
                                        <div className="mb-3">
                                            <div className="d-flex justify-content-between mb-1">
                                                <span className="text-muted">Kredi Kullanımı</span>
                                                <span className="fw-medium">
                                                    {formatCurrency(account.total_receivables, account.currency)} / {formatCurrency(account.credit_limit, account.currency)}
                                                </span>
                                            </div>
                                            <div className="progress" style={{ height: '6px' }}>
                                                <div
                                                    className={`progress-bar bg-${account.total_receivables / account.credit_limit > 0.9 ? 'danger' : account.total_receivables / account.credit_limit > 0.75 ? 'warning' : 'success'}`}
                                                    style={{ width: `${Math.min((account.total_receivables / account.credit_limit) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="row text-center">
                                            <div className="col-6">
                                                <div className="border-end">
                                                    <p className="text-muted mb-1">Kullanılabilir</p>
                                                    <h6 className="mb-0 text-success">
                                                        {formatCurrency(account.available_credit, account.currency)}
                                                    </h6>
                                                </div>
                                            </div>
                                            <div className="col-6">
                                                <p className="text-muted mb-1">Risk Durumu</p>
                                                <h6 className="mb-0">
                                                    {getRiskBadge(account.risk_status, account.risk_status_color)}
                                                </h6>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add/Edit Address Modal */}
            <Modal show={showAddressModal} onHide={() => setShowAddressModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editingAddress ? 'Sevk Adresi Düzenle' : 'Yeni Sevk Adresi Ekle'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Label>Adres Adı *</Form.Label>
                            <Form.Control
                                type="text"
                                value={addressForm.name}
                                onChange={(e) => setAddressForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Örn: Merkez Ofis, Fabrika, Şube 1"
                                required
                            />
                        </Col>
                        <Col md={6}>
                            <Form.Label>Adres Tipi</Form.Label>
                            <Form.Select
                                value={addressForm.type}
                                onChange={(e) => setAddressForm(prev => ({ ...prev, type: e.target.value }))}
                            >
                                <option value="shipping">Sevk Adresi</option>
                                <option value="billing">Fatura Adresi</option>
                                <option value="both">Her İkisi</option>
                            </Form.Select>
                        </Col>
                        <Col md={6}>
                            <Form.Label>Ülke</Form.Label>
                            <Form.Select
                                value={addressForm.country_id}
                                onChange={(e) => {
                                    const countryId = e.target.value;
                                    setAddressForm(prev => ({ ...prev, country_id: countryId, city_id: '', district_id: '' }));
                                    if (countryId) {
                                        loadCities(countryId);
                                        setDistricts([]);
                                    }
                                }}
                                required
                            >
                                <option value="">Ülke seçiniz</option>
                                {countries.map(country => (
                                    <option key={country.id} value={country.id}>
                                        {country.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col md={6}>
                            <Form.Label>Şehir</Form.Label>
                            <Form.Select
                                value={addressForm.city_id}
                                onChange={(e) => {
                                    const cityId = e.target.value;
                                    setAddressForm(prev => ({ ...prev, city_id: cityId, district_id: '' }));
                                    if (cityId) {
                                        loadDistricts(cityId);
                                    } else {
                                        setDistricts([]);
                                    }
                                }}
                                disabled={!addressForm.country_id}
                                required
                            >
                                <option value="">Şehir seçiniz</option>
                                {cities.map(city => (
                                    <option key={city.id} value={city.id}>
                                        {city.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col md={6}>
                            <Form.Label>İlçe</Form.Label>
                            <Form.Select
                                value={addressForm.district_id}
                                onChange={(e) => setAddressForm(prev => ({ ...prev, district_id: e.target.value }))}
                                disabled={!addressForm.city_id}
                            >
                                <option value="">İlçe seçiniz</option>
                                {districts.map(district => (
                                    <option key={district.id} value={district.id}>
                                        {district.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col md={6}>
                            <Form.Label>İletişim Kişisi</Form.Label>
                            <Form.Control
                                type="text"
                                value={addressForm.contact_person}
                                onChange={(e) => setAddressForm(prev => ({ ...prev, contact_person: e.target.value }))}
                                placeholder="Ad Soyad"
                            />
                        </Col>
                        <Col md={6}>
                            <Form.Label>İletişim Telefonu</Form.Label>
                            <Form.Control
                                type="tel"
                                value={addressForm.contact_phone}
                                onChange={(e) => setAddressForm(prev => ({ ...prev, contact_phone: e.target.value }))}
                                placeholder="0542 123 45 67"
                            />
                        </Col>
                        <Col xs={12}>
                            <Form.Label>Adres *</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={addressForm.address}
                                onChange={(e) => setAddressForm(prev => ({ ...prev, address: e.target.value }))}
                                placeholder="Sokak, mahalle, bina no, daire no..."
                                required
                            />
                        </Col>
                        <Col md={6}>
                            <Form.Label>Posta Kodu</Form.Label>
                            <Form.Control
                                type="text"
                                value={addressForm.postal_code}
                                onChange={(e) => setAddressForm(prev => ({ ...prev, postal_code: e.target.value }))}
                                placeholder="34000"
                            />
                        </Col>
                        <Col md={6}>
                            <Form.Label>Teslimat Saatleri</Form.Label>
                            <Form.Control
                                type="text"
                                value={addressForm.delivery_hours}
                                onChange={(e) => setAddressForm(prev => ({ ...prev, delivery_hours: e.target.value }))}
                                placeholder="09:00-17:00"
                            />
                        </Col>
                        <Col xs={12}>
                            <Form.Label>Teslimat Notları</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                value={addressForm.delivery_notes}
                                onChange={(e) => setAddressForm(prev => ({ ...prev, delivery_notes: e.target.value }))}
                                placeholder="Özel teslimat talimatları..."
                            />
                        </Col>
                        <Col xs={12}>
                            <Form.Check
                                type="checkbox"
                                label="Bu adresi varsayılan yap"
                                checked={addressForm.is_default}
                                onChange={(e) => setAddressForm(prev => ({ ...prev, is_default: e.target.checked }))}
                            />
                        </Col>
                        <Col xs={12}>
                            <Form.Check
                                type="checkbox"
                                label="Adres aktif"
                                checked={addressForm.is_active}
                                onChange={(e) => setAddressForm(prev => ({ ...prev, is_active: e.target.checked }))}
                            />
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAddressModal(false)}>
                        İptal
                    </Button>
                    <Button variant="primary" onClick={handleSaveAddress}>
                        {editingAddress ? 'Güncelle' : 'Adres Ekle'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} size="sm">
                <Modal.Header closeButton>
                    <Modal.Title>Adresi Sil</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>"{deletingAddress?.name}" adresini silmek istediğinizden emin misiniz?</p>
                    <p className="text-muted small">Bu işlem geri alınamaz.</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                        İptal
                    </Button>
                    <Button variant="danger" onClick={handleDeleteAddress}>
                        Sil
                    </Button>
                </Modal.Footer>
            </Modal>

        </Layout>
    );
}
