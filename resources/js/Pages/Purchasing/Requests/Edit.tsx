import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import Layout from '../../../Layouts';
import { PurchaseRequest, Location, Department, Product, Unit } from '@/types/purchasing';
import { PageProps } from '@/types';

interface EditRequestProps extends PageProps {
    request: PurchaseRequest;
    locations: Location[];
    departments: Department[];
    products: Product[];
    units: Unit[];
}

export default function Edit({ request, locations, departments, products, units }: EditRequestProps) {
    const { data, setData, put, processing, errors } = useForm({
        title: request.title || '',
        description: request.description || '',
        department_id: request.department_id || '',
        location_id: request.location_id || '',
        required_date: request.required_date ? new Date(request.required_date).toISOString().split('T')[0] : '',
        priority: request.priority || 'medium',
        budget_code: request.budget_code || '',
        currency: request.currency || 'TRY',
        total_amount: request.total_amount || 0,
        notes: request.notes || '',
        items: request.items || [{
            id: null,
            product_id: '',
            description: '',
            specification: '',
            quantity: 1,
            unit: 'Adet',
            unit_price: 0,
            total_price: 0,
            notes: '',
        }]
    });

    const addItem = () => {
        setData('items', [...data.items, {
            id: null,
            product_id: '',
            description: '',
            specification: '',
            quantity: 1,
            unit: 'Adet',
            unit_price: 0,
            total_price: 0,
            notes: '',
        }]);
    };

    const removeItem = (index: number) => {
        const newItems = data.items.filter((_, i) => i !== index);
        setData('items', newItems);
        calculateTotal(newItems);
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...data.items];
        newItems[index] = { ...newItems[index], [field]: value };
        
        // Recalculate item total
        if (['quantity', 'unit_price'].includes(field)) {
            const item = newItems[index];
            newItems[index].total_price = item.quantity * item.unit_price;
        }
        
        setData('items', newItems);
        calculateTotal(newItems);
    };

    const calculateTotal = (items: any[]) => {
        const total = items.reduce((sum, item) => sum + item.total_price, 0);
        setData(prev => ({ ...prev, total_amount: total }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('purchasing.requests.update', request.id));
    };

    const getStatusBadge = (status: string) => {
        const statusClasses = {
            'draft': 'bg-secondary',
            'pending': 'bg-warning',
            'approved': 'bg-success',
            'rejected': 'bg-danger',
            'converted': 'bg-info',
            'cancelled': 'bg-dark',
        };
        
        const statusLabels = {
            'draft': 'Taslak',
            'pending': 'Beklemede',
            'approved': 'Onaylandı',
            'rejected': 'Reddedildi',
            'converted': 'Siparişe Dönüştürüldü',
            'cancelled': 'İptal',
        };

        return (
            <span className={`badge ${statusClasses[status as keyof typeof statusClasses] || 'bg-secondary'}`}>
                {statusLabels[status as keyof typeof statusLabels] || status}
            </span>
        );
    };

    const canEdit = ['draft', 'pending'].includes(request.status);

    return (
        <Layout>
            <Head title={`Talep Düzenle - ${request.request_number}`} />
            
            <div className="page-content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <div>
                                        <h3 className="card-title">
                                            Talep Düzenle - {request.request_number}
                                        </h3>
                                        <div className="mt-1">
                                            {getStatusBadge(request.status)}
                                        </div>
                                    </div>
                                    <div className="d-flex gap-2">
                                        <Link
                                            href={route('purchasing.requests.show', request.id)}
                                            className="btn btn-info btn-sm"
                                        >
                                            <i className="fas fa-eye me-2"></i>
                                            Görüntüle
                                        </Link>
                                        <Link
                                            href={route('purchasing.requests.index')}
                                            className="btn btn-secondary"
                                        >
                                            <i className="fas fa-arrow-left me-2"></i>
                                            Geri Dön
                                        </Link>
                                    </div>
                                </div>

                                {!canEdit && (
                                    <div className="alert alert-warning mx-3 mt-3">
                                        <i className="fas fa-exclamation-triangle me-2"></i>
                                        Bu talep durumu nedeniyle düzenlenemez. Sadece taslak ve beklemede olan talepler düzenlenebilir.
                                    </div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    <div className="card-body">
                                        {/* Basic Information */}
                                        <div className="row mb-4">
                                            <div className="col-md-6">
                                                <label className="form-label">Başlık <span className="text-danger">*</span></label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                                                    value={data.title}
                                                    onChange={(e) => setData('title', e.target.value)}
                                                    disabled={!canEdit}
                                                    required
                                                />
                                                {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Departman <span className="text-danger">*</span></label>
                                                <select
                                                    className={`form-select ${errors.department_id ? 'is-invalid' : ''}`}
                                                    value={data.department_id}
                                                    onChange={(e) => setData('department_id', e.target.value)}
                                                    disabled={!canEdit}
                                                    required
                                                >
                                                    <option value="">Departman Seçin</option>
                                                    {departments.map((department) => (
                                                        <option key={department.id} value={department.id}>
                                                            {department.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.department_id && <div className="invalid-feedback">{errors.department_id}</div>}
                                            </div>
                                        </div>

                                        <div className="row mb-4">
                                            <div className="col-md-6">
                                                <label className="form-label">Lokasyon <span className="text-danger">*</span></label>
                                                <select
                                                    className={`form-select ${errors.location_id ? 'is-invalid' : ''}`}
                                                    value={data.location_id}
                                                    onChange={(e) => setData('location_id', e.target.value)}
                                                    disabled={!canEdit}
                                                    required
                                                >
                                                    <option value="">Lokasyon Seçin</option>
                                                    {locations.map((location) => (
                                                        <option key={location.id} value={location.id}>
                                                            {location.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.location_id && <div className="invalid-feedback">{errors.location_id}</div>}
                                            </div>
                                            <div className="col-md-3">
                                                <label className="form-label">Gerekli Tarih <span className="text-danger">*</span></label>
                                                <input
                                                    type="date"
                                                    className={`form-control ${errors.required_date ? 'is-invalid' : ''}`}
                                                    value={data.required_date}
                                                    onChange={(e) => setData('required_date', e.target.value)}
                                                    disabled={!canEdit}
                                                    required
                                                />
                                                {errors.required_date && <div className="invalid-feedback">{errors.required_date}</div>}
                                            </div>
                                            <div className="col-md-3">
                                                <label className="form-label">Öncelik</label>
                                                <select
                                                    className="form-select"
                                                    value={data.priority}
                                                    onChange={(e) => setData('priority', e.target.value)}
                                                    disabled={!canEdit}
                                                >
                                                    <option value="low">Düşük</option>
                                                    <option value="medium">Orta</option>
                                                    <option value="high">Yüksek</option>
                                                    <option value="urgent">Acil</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="row mb-4">
                                            <div className="col-md-6">
                                                <label className="form-label">Bütçe Kodu</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={data.budget_code}
                                                    onChange={(e) => setData('budget_code', e.target.value)}
                                                    disabled={!canEdit}
                                                />
                                            </div>
                                            <div className="col-md-3">
                                                <label className="form-label">Para Birimi</label>
                                                <select
                                                    className="form-select"
                                                    value={data.currency}
                                                    onChange={(e) => setData('currency', e.target.value)}
                                                    disabled={!canEdit}
                                                >
                                                    <option value="TRY">TRY</option>
                                                    <option value="USD">USD</option>
                                                    <option value="EUR">EUR</option>
                                                    <option value="GBP">GBP</option>
                                                </select>
                                            </div>
                                            <div className="col-md-3">
                                                <label className="form-label">Toplam Tutar</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={data.total_amount}
                                                    readOnly
                                                    step="0.01"
                                                />
                                            </div>
                                        </div>

                                        <div className="row mb-4">
                                            <div className="col-md-12">
                                                <label className="form-label">Açıklama</label>
                                                <textarea
                                                    className="form-control"
                                                    value={data.description}
                                                    onChange={(e) => setData('description', e.target.value)}
                                                    disabled={!canEdit}
                                                    rows={3}
                                                />
                                            </div>
                                        </div>

                                        {/* Items */}
                                        <div className="mb-4">
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <h5>Talep Kalemleri</h5>
                                                {canEdit && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-success btn-sm"
                                                        onClick={addItem}
                                                    >
                                                        <i className="fas fa-plus me-2"></i>
                                                        Kalem Ekle
                                                    </button>
                                                )}
                                            </div>

                                            <div className="table-responsive">
                                                <table className="table table-bordered">
                                                    <thead>
                                                        <tr>
                                                            <th>Açıklama</th>
                                                            <th>Özellik</th>
                                                            <th>Miktar</th>
                                                            <th>Birim</th>
                                                            <th>Tahmini Birim Fiyat</th>
                                                            <th>Toplam</th>
                                                            <th>Notlar</th>
                                                            {canEdit && <th>İşlem</th>}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {data.items.map((item, index) => (
                                                            <tr key={index}>
                                                                <td>
                                                                    <input
                                                                        type="text"
                                                                        className="form-control form-control-sm"
                                                                        value={item.description}
                                                                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                                        disabled={!canEdit}
                                                                        required
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <input
                                                                        type="text"
                                                                        className="form-control form-control-sm"
                                                                        value={item.specification}
                                                                        onChange={(e) => updateItem(index, 'specification', e.target.value)}
                                                                        disabled={!canEdit}
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <input
                                                                        type="number"
                                                                        className="form-control form-control-sm"
                                                                        value={item.quantity}
                                                                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                                        disabled={!canEdit}
                                                                        min="0"
                                                                        step="0.01"
                                                                        required
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <input
                                                                        type="text"
                                                                        className="form-control form-control-sm"
                                                                        value={item.unit}
                                                                        onChange={(e) => updateItem(index, 'unit', e.target.value)}
                                                                        disabled={!canEdit}
                                                                        required
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <input
                                                                        type="number"
                                                                        className="form-control form-control-sm"
                                                                        value={item.unit_price}
                                                                        onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                                                        disabled={!canEdit}
                                                                        min="0"
                                                                        step="0.01"
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <span className="fw-bold">
                                                                        {new Intl.NumberFormat('tr-TR', {
                                                                            style: 'currency',
                                                                            currency: data.currency
                                                                        }).format(item.total_price)}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <input
                                                                        type="text"
                                                                        className="form-control form-control-sm"
                                                                        value={item.notes}
                                                                        onChange={(e) => updateItem(index, 'notes', e.target.value)}
                                                                        disabled={!canEdit}
                                                                    />
                                                                </td>
                                                                {canEdit && (
                                                                    <td>
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-danger btn-sm"
                                                                            onClick={() => removeItem(index)}
                                                                            disabled={data.items.length === 1}
                                                                        >
                                                                            <i className="fas fa-trash"></i>
                                                                        </button>
                                                                    </td>
                                                                )}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    <tfoot>
                                                        <tr>
                                                            <td colSpan={canEdit ? 5 : 4} className="text-end fw-bold">Toplam:</td>
                                                            <td className="fw-bold">
                                                                {new Intl.NumberFormat('tr-TR', {
                                                                    style: 'currency',
                                                                    currency: data.currency
                                                                }).format(data.total_amount)}
                                                            </td>
                                                            <td colSpan={canEdit ? 2 : 1}></td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Notes */}
                                        <div className="row">
                                            <div className="col-md-12">
                                                <label className="form-label">Notlar</label>
                                                <textarea
                                                    className="form-control"
                                                    value={data.notes}
                                                    onChange={(e) => setData('notes', e.target.value)}
                                                    disabled={!canEdit}
                                                    rows={3}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card-footer d-flex justify-content-end gap-2">
                                        <Link
                                            href={route('purchasing.requests.index')}
                                            className="btn btn-secondary"
                                        >
                                            Geri Dön
                                        </Link>
                                        {canEdit && (
                                            <button
                                                type="submit"
                                                className="btn btn-primary"
                                                disabled={processing}
                                            >
                                                {processing ? (
                                                    <>
                                                        <i className="fas fa-spinner fa-spin me-2"></i>
                                                        Güncelleniyor...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="fas fa-save me-2"></i>
                                                        Güncelle
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}