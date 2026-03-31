import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import PortalLayout from '@/Layouts/PortalLayout';

interface DeliveryAddress {
    id: number;
    name: string;
    contact_person?: string;
    contact_phone?: string;
    address: string;
    postal_code?: string;
    is_default: boolean;
}

interface Customer {
    id: number;
    title: string;
    account_code: string;
    phone?: string;
    email?: string;
    address?: string;
    tax_number?: string;
    tax_office?: string;
    delivery_addresses: DeliveryAddress[];
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface Props {
    customer: Customer;
    user: User;
}

const Index: React.FC<Props> = ({ customer, user }) => {
    const [editingAddress, setEditingAddress] = useState<number | null>(null);
    const [showAddAddress, setShowAddAddress] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);

    const { data: profileData, setData: setProfileData, put: putProfile, processing: processingProfile, errors: profileErrors } = useForm({
        name: customer.title || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        tax_number: customer.tax_number || '',
        tax_office: customer.tax_office || '',
    });

    const { data: passwordData, setData: setPasswordData, put: putPassword, processing: processingPassword, errors: passwordErrors, reset: resetPassword } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const { data: addressData, setData: setAddressData, post: postAddress, put: putAddress, delete: deleteAddress, processing: processingAddress, errors: addressErrors, reset: resetAddressData } = useForm({
        name: '',
        contact_person: '',
        contact_phone: '',
        address: '',
        postal_code: '',
        is_default: false,
    });

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        putProfile(route('portal.profile.update'));
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        putPassword(route('portal.profile.password.update'), {
            onSuccess: () => {
                resetPassword();
                setShowChangePassword(false);
            }
        });
    };

    const handleAddAddress = (e: React.FormEvent) => {
        e.preventDefault();
        postAddress(route('portal.profile.delivery-addresses.store'), {
            onSuccess: () => {
                resetAddressData();
                setShowAddAddress(false);
            }
        });
    };

    const handleEditAddress = (address: DeliveryAddress) => {
        setAddressData({
            name: address.name,
            contact_person: address.contact_person || '',
            contact_phone: address.contact_phone || '',
            address: address.address,
            postal_code: address.postal_code || '',
            is_default: address.is_default,
        });
        setEditingAddress(address.id);
    };

    const handleUpdateAddress = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingAddress) {
            putAddress(route('portal.profile.delivery-addresses.update', editingAddress), {
                onSuccess: () => {
                    resetAddressData();
                    setEditingAddress(null);
                }
            });
        }
    };

    const handleDeleteAddress = (id: number) => {
        if (confirm('Bu teslimat adresini silmek istediğinizden emin misiniz?')) {
            deleteAddress(route('portal.profile.delivery-addresses.destroy', id));
        }
    };

    return (
        <PortalLayout>
            <Head title="Profilim" />

            <div className="row mb-4">
                <div className="col">
                    <h2 className="mb-0">Profilim</h2>
                    <p className="text-muted">Profil bilgilerinizi yönetin</p>
                </div>
            </div>

            <div className="row g-3">
                {/* Customer Info */}
                <div className="col-md-8">
                    <div className="card border-0 shadow-sm mb-3">
                        <div className="card-header bg-white">
                            <h5 className="mb-0">Firma Bilgileri</h5>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleProfileSubmit}>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label">Firma Adı <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className={`form-control ${profileErrors.name ? 'is-invalid' : ''}`}
                                            value={profileData.name}
                                            onChange={(e) => setProfileData('name', e.target.value)}
                                            required
                                        />
                                        {profileErrors.name && <div className="invalid-feedback">{profileErrors.name}</div>}
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Müşteri Kodu</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={customer.account_code}
                                            disabled
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Telefon</label>
                                        <input
                                            type="text"
                                            className={`form-control ${profileErrors.phone ? 'is-invalid' : ''}`}
                                            value={profileData.phone}
                                            onChange={(e) => setProfileData('phone', e.target.value)}
                                        />
                                        {profileErrors.phone && <div className="invalid-feedback">{profileErrors.phone}</div>}
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">E-posta</label>
                                        <input
                                            type="email"
                                            className={`form-control ${profileErrors.email ? 'is-invalid' : ''}`}
                                            value={profileData.email}
                                            onChange={(e) => setProfileData('email', e.target.value)}
                                        />
                                        {profileErrors.email && <div className="invalid-feedback">{profileErrors.email}</div>}
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Vergi Numarası</label>
                                        <input
                                            type="text"
                                            className={`form-control ${profileErrors.tax_number ? 'is-invalid' : ''}`}
                                            value={profileData.tax_number}
                                            onChange={(e) => setProfileData('tax_number', e.target.value)}
                                        />
                                        {profileErrors.tax_number && <div className="invalid-feedback">{profileErrors.tax_number}</div>}
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Vergi Dairesi</label>
                                        <input
                                            type="text"
                                            className={`form-control ${profileErrors.tax_office ? 'is-invalid' : ''}`}
                                            value={profileData.tax_office}
                                            onChange={(e) => setProfileData('tax_office', e.target.value)}
                                        />
                                        {profileErrors.tax_office && <div className="invalid-feedback">{profileErrors.tax_office}</div>}
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">Adres</label>
                                        <textarea
                                            className={`form-control ${profileErrors.address ? 'is-invalid' : ''}`}
                                            rows={3}
                                            value={profileData.address}
                                            onChange={(e) => setProfileData('address', e.target.value)}
                                        />
                                        {profileErrors.address && <div className="invalid-feedback">{profileErrors.address}</div>}
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <button type="submit" className="btn btn-primary" disabled={processingProfile}>
                                        {processingProfile ? 'Kaydediliyor...' : 'Bilgileri Güncelle'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Delivery Addresses */}
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Teslimat Adresleri</h5>
                            <button
                                className="btn btn-sm btn-primary"
                                onClick={() => {
                                    resetAddressData();
                                    setShowAddAddress(true);
                                }}
                            >
                                <i className="bx bx-plus me-1"></i>
                                Yeni Adres
                            </button>
                        </div>
                        <div className="card-body">
                            {customer.delivery_addresses.length === 0 ? (
                                <p className="text-muted text-center py-4">Henüz teslimat adresi eklenmemiş</p>
                            ) : (
                                <div className="row g-3">
                                    {customer.delivery_addresses.map((address) => (
                                        <div key={address.id} className="col-md-6">
                                            <div className={`card h-100 ${address.is_default ? 'border-primary' : ''}`}>
                                                <div className="card-body">
                                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                                        <h6 className="card-title mb-0">{address.name}</h6>
                                                        {address.is_default && (
                                                            <span className="badge bg-primary">Varsayılan</span>
                                                        )}
                                                    </div>
                                                    {address.contact_person && (
                                                        <p className="mb-1"><strong>İletişim:</strong> {address.contact_person}</p>
                                                    )}
                                                    {address.contact_phone && (
                                                        <p className="mb-1"><strong>Telefon:</strong> {address.contact_phone}</p>
                                                    )}
                                                    <p className="mb-1">{address.address}</p>
                                                    {address.postal_code && (
                                                        <p className="mb-2"><strong>Posta Kodu:</strong> {address.postal_code}</p>
                                                    )}
                                                    <div className="btn-group btn-group-sm mt-2">
                                                        <button
                                                            className="btn btn-outline-primary"
                                                            onClick={() => handleEditAddress(address)}
                                                        >
                                                            <i className="bx bx-edit"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-outline-danger"
                                                            onClick={() => handleDeleteAddress(address.id)}
                                                        >
                                                            <i className="bx bx-trash"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* User Account */}
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm mb-3">
                        <div className="card-header bg-white">
                            <h5 className="mb-0">Kullanıcı Hesabı</h5>
                        </div>
                        <div className="card-body">
                            <div className="mb-3">
                                <label className="text-muted small">Kullanıcı Adı</label>
                                <div className="fw-bold">{user.name}</div>
                            </div>
                            <div className="mb-3">
                                <label className="text-muted small">E-posta</label>
                                <div>{user.email}</div>
                            </div>
                            <button
                                className="btn btn-outline-primary w-100"
                                onClick={() => setShowChangePassword(!showChangePassword)}
                            >
                                <i className="bx bx-key me-2"></i>
                                Şifre Değiştir
                            </button>
                        </div>
                    </div>

                    {/* Change Password Form */}
                    {showChangePassword && (
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white">
                                <h5 className="mb-0">Şifre Değiştir</h5>
                            </div>
                            <div className="card-body">
                                <form onSubmit={handlePasswordSubmit}>
                                    <div className="mb-3">
                                        <label className="form-label">Mevcut Şifre <span className="text-danger">*</span></label>
                                        <input
                                            type="password"
                                            className={`form-control ${passwordErrors.current_password ? 'is-invalid' : ''}`}
                                            value={passwordData.current_password}
                                            onChange={(e) => setPasswordData('current_password', e.target.value)}
                                            required
                                        />
                                        {passwordErrors.current_password && <div className="invalid-feedback">{passwordErrors.current_password}</div>}
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Yeni Şifre <span className="text-danger">*</span></label>
                                        <input
                                            type="password"
                                            className={`form-control ${passwordErrors.password ? 'is-invalid' : ''}`}
                                            value={passwordData.password}
                                            onChange={(e) => setPasswordData('password', e.target.value)}
                                            required
                                        />
                                        {passwordErrors.password && <div className="invalid-feedback">{passwordErrors.password}</div>}
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Yeni Şifre (Tekrar) <span className="text-danger">*</span></label>
                                        <input
                                            type="password"
                                            className={`form-control ${passwordErrors.password_confirmation ? 'is-invalid' : ''}`}
                                            value={passwordData.password_confirmation}
                                            onChange={(e) => setPasswordData('password_confirmation', e.target.value)}
                                            required
                                        />
                                        {passwordErrors.password_confirmation && <div className="invalid-feedback">{passwordErrors.password_confirmation}</div>}
                                    </div>
                                    <div className="d-flex gap-2">
                                        <button type="submit" className="btn btn-primary flex-grow-1" disabled={processingPassword}>
                                            {processingPassword ? 'Kaydediliyor...' : 'Şifreyi Güncelle'}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={() => setShowChangePassword(false)}
                                        >
                                            İptal
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Address Modal */}
            {(showAddAddress || editingAddress) && (
                <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <form onSubmit={editingAddress ? handleUpdateAddress : handleAddAddress}>
                                <div className="modal-header">
                                    <h5 className="modal-title">{editingAddress ? 'Adresi Düzenle' : 'Yeni Adres Ekle'}</h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => {
                                            setShowAddAddress(false);
                                            setEditingAddress(null);
                                            resetAddressData();
                                        }}
                                    ></button>
                                </div>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label">Adres Adı <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className={`form-control ${addressErrors.name ? 'is-invalid' : ''}`}
                                            value={addressData.name}
                                            onChange={(e) => setAddressData('name', e.target.value)}
                                            placeholder="Örn: Merkez Ofis, Depo, vb."
                                            required
                                        />
                                        {addressErrors.name && <div className="invalid-feedback">{addressErrors.name}</div>}
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">İletişim Kişisi</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={addressData.contact_person}
                                            onChange={(e) => setAddressData('contact_person', e.target.value)}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Telefon</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={addressData.contact_phone}
                                            onChange={(e) => setAddressData('contact_phone', e.target.value)}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Adres <span className="text-danger">*</span></label>
                                        <textarea
                                            className={`form-control ${addressErrors.address ? 'is-invalid' : ''}`}
                                            rows={3}
                                            value={addressData.address}
                                            onChange={(e) => setAddressData('address', e.target.value)}
                                            required
                                        />
                                        {addressErrors.address && <div className="invalid-feedback">{addressErrors.address}</div>}
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Posta Kodu</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={addressData.postal_code}
                                            onChange={(e) => setAddressData('postal_code', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={addressData.is_default}
                                            onChange={(e) => setAddressData('is_default', e.target.checked)}
                                            id="isDefaultCheck"
                                        />
                                        <label className="form-check-label" htmlFor="isDefaultCheck">
                                            Varsayılan adres olarak ayarla
                                        </label>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setShowAddAddress(false);
                                            setEditingAddress(null);
                                            resetAddressData();
                                        }}
                                    >
                                        İptal
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={processingAddress}>
                                        {processingAddress ? 'Kaydediliyor...' : editingAddress ? 'Güncelle' : 'Ekle'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </PortalLayout>
    );
};

export default Index;
