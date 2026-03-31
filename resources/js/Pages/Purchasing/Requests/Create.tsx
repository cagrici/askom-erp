import React, { useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import Layout from '../../../Layouts';
import ProductSearch from '../../../Components/ProductSearch';
import { Location, Department, Unit } from '@/types/purchasing';
import { PageProps } from '@/types';

interface CreateRequestProps extends PageProps {
    locations: Location[];
    departments: Department[];
    units: Unit[];
}

export default function Create({ locations, departments, units }: CreateRequestProps) {
    const { flash } = usePage<CreateRequestProps>().props;
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        description: '',
        department_id: '',
        location_id: '',
        requested_by: '',
        required_date: '',
        priority: 'medium',
        budget_code: '',
        currency: 'TRY',
        total_amount: 0,
        notes: '',
        items: [{
            product_id: '',
            selectedProduct: null,
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
            product_id: '',
            selectedProduct: null,
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
        console.log('🚀 Form submission started');
        console.log('📝 Form data:', data);
        console.log('🎯 Submit URL:', route('purchasing.requests.store'));

        post(route('purchasing.requests.store'), {
            onSuccess: (page) => {
                console.log('✅ Form submission successful:', page);
            },
            onError: (errors) => {
                console.log('❌ Form submission errors:', errors);
            },
            onFinish: () => {
                console.log('🏁 Form submission finished');
            }
        });
    };

    return (
        <Layout>
            <Head title="Yeni Satın Alma Talebi" />

            <div className="page-content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <h3 className="card-title">Yeni Satın Alma Talebi</h3>
                                    <Link
                                        href={route('purchasing.requests.index')}
                                        className="btn btn-secondary"
                                    >
                                        <i className="fas fa-arrow-left me-2"></i>
                                        Geri Dön
                                    </Link>
                                </div>

                                <form onSubmit={handleSubmit}>
                                    <div className="card-body">
                                        {/* Error/Success Messages */}
                                        {flash?.error && (
                                            <div className="alert alert-danger alert-dismissible fade show" role="alert">
                                                <i className="fas fa-exclamation-triangle me-2"></i>
                                                {flash.error}
                                                <button type="button" className="btn-close" data-bs-dismiss="alert"></button>
                                            </div>
                                        )}
                                        {flash?.success && (
                                            <div className="alert alert-success alert-dismissible fade show" role="alert">
                                                <i className="fas fa-check-circle me-2"></i>
                                                {flash.success}
                                                <button type="button" className="btn-close" data-bs-dismiss="alert"></button>
                                            </div>
                                        )}
                                        {Object.keys(errors).length > 0 && (
                                            <div className="alert alert-warning alert-dismissible fade show" role="alert">
                                                <i className="fas fa-exclamation-triangle me-2"></i>
                                                <strong>Aşağıdaki alanları kontrol ediniz:</strong>
                                                <ul className="mb-0 mt-2">
                                                    {Object.entries(errors).map(([key, error]) => (
                                                        <li key={key}>{error}</li>
                                                    ))}
                                                </ul>
                                                <button type="button" className="btn-close" data-bs-dismiss="alert"></button>
                                            </div>
                                        )}
                                        {/* Basic Information */}
                                        <div className="row mb-4">
                                            <div className="col-md-6">
                                                <label className="form-label">Başlık <span className="text-danger">*</span></label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                                                    value={data.title}
                                                    onChange={(e) => setData('title', e.target.value)}
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
                                                    min={new Date().toISOString().split('T')[0]}
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
                                                />
                                            </div>
                                            <div className="col-md-3">
                                                <label className="form-label">Para Birimi</label>
                                                <select
                                                    className="form-select"
                                                    value={data.currency}
                                                    onChange={(e) => setData('currency', e.target.value)}
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
                                                    rows={3}
                                                />
                                            </div>
                                        </div>

                                        {/* Items */}
                                        <div className="mb-4">
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <h5>Talep Kalemleri</h5>
                                                <button
                                                    type="button"
                                                    className="btn btn-success btn-sm"
                                                    onClick={addItem}
                                                >
                                                    <i className="fas fa-plus me-2"></i>
                                                    Kalem Ekle
                                                </button>
                                            </div>

                                            <div className="alert alert-info mb-3">
                                                <div className="d-flex align-items-start">
                                                    <i className="ri ri-search-line me-2 mt-1"></i>
                                                    <div>
                                                        <strong>Akıllı Ürün Arama:</strong><br/>
                                                        <small>
                                                            • Ürün adı veya kodu yazarak arama yapın (min. 2 karakter)<br/>
                                                            • Örnek: "kahve", "KHV001", "çay" gibi<br/>
                                                            • 100K+ ürün arasından hızlı bulma<br/>
                                                            • Bulunamayan ürünler için "Yeni ürün talep et" seçeneği
                                                        </small>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="table-responsive">
                                                <table className="table table-bordered">
                                                    <thead>
                                                        <tr>
                                                            <th width="25%">Ürün & Açıklama</th>
                                                            <th width="15%">Özellik</th>
                                                            <th width="10%">Miktar</th>
                                                            <th width="12%">Birim</th>
                                                            <th width="12%">Tahmini Birim Fiyat</th>
                                                            <th width="10%">Toplam</th>
                                                            <th width="12%">Notlar</th>
                                                            <th width="4%">İşlem</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {data.items.map((item, index) => (
                                                            <tr key={index}>
                                                                <td>
                                                                    <div className="mb-2">
                                                                        <ProductSearch
                                                                            value={item.selectedProduct || null}
                                                                            onChange={(product) => {
                                                                                updateItem(index, 'selectedProduct', product);
                                                                                updateItem(index, 'product_id', product?.id || '');
                                                                                if (product) {
                                                                                    updateItem(index, 'description', product.name);

                                                                                    // Set default unit from product's activeUnits (prefer base unit)
                                                                                    let defaultUnitSymbol = product.baseUnit?.symbol || 'Adet';

                                                                                    if (product.activeUnits && product.activeUnits.length > 0) {
                                                                                        const baseProductUnit = product.activeUnits.find(pu => pu.is_base_unit);
                                                                                        const firstProductUnit = product.activeUnits[0];
                                                                                        const preferredUnit = baseProductUnit || firstProductUnit;

                                                                                        if (preferredUnit?.unit) {
                                                                                            defaultUnitSymbol = preferredUnit.unit.symbol;
                                                                                        }
                                                                                    }

                                                                                    updateItem(index, 'unit', defaultUnitSymbol);
                                                                                    updateItem(index, 'unit_price', product.sale_price || 0);
                                                                                }
                                                                            }}
                                                                            placeholder="Ürün ara (kod, ad)..."
                                                                        />
                                                                    </div>
                                                                    <input
                                                                        type="text"
                                                                        className="form-control form-control-sm"
                                                                        value={item.description}
                                                                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                                        placeholder={item.selectedProduct ? "Ek açıklama (opsiyonel)" : "Ürün açıklaması (yeni ürün talebi)"}
                                                                        required={!item.selectedProduct}
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <input
                                                                        type="text"
                                                                        className="form-control form-control-sm"
                                                                        value={item.specification}
                                                                        onChange={(e) => updateItem(index, 'specification', e.target.value)}
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <input
                                                                        type="number"
                                                                        className="form-control form-control-sm"
                                                                        value={item.quantity}
                                                                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                                        min="0"
                                                                        step="0.01"
                                                                        required
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <select
                                                                        className="form-select form-select-sm"
                                                                        value={item.unit}
                                                                        onChange={(e) => updateItem(index, 'unit', e.target.value)}
                                                                        required
                                                                    >
                                                                        <option value="">Birim Seçin</option>
                                                                        {item.selectedProduct?.activeUnits && item.selectedProduct.activeUnits.length > 0 ? (
                                                                            // Show product's specific units
                                                                            item.selectedProduct.activeUnits.map(productUnit => (
                                                                                productUnit.unit && (
                                                                                    <option key={productUnit.unit.id} value={productUnit.unit.symbol}>
                                                                                        {productUnit.unit.name} ({productUnit.unit.symbol})
                                                                                        {productUnit.conversion_factor !== 1 && ` - ${productUnit.conversion_factor}x`}
                                                                                    </option>
                                                                                )
                                                                            ))
                                                                        ) : (
                                                                            // Fallback to general units if no product-specific units
                                                                            units.map((unit) => (
                                                                                <option key={unit.id} value={unit.symbol}>
                                                                                    {unit.name} ({unit.symbol})
                                                                                </option>
                                                                            ))
                                                                        )}
                                                                    </select>
                                                                </td>
                                                                <td>
                                                                    <input
                                                                        type="number"
                                                                        className="form-control form-control-sm"
                                                                        value={item.unit_price}
                                                                        onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
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
                                                                    />
                                                                </td>
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
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    <tfoot>
                                                        <tr>
                                                            <td colSpan={5} className="text-end fw-bold">Toplam:</td>
                                                            <td className="fw-bold">
                                                                {new Intl.NumberFormat('tr-TR', {
                                                                    style: 'currency',
                                                                    currency: data.currency
                                                                }).format(data.total_amount)}
                                                            </td>
                                                            <td colSpan={2}></td>
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
                                            İptal
                                        </Link>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={processing}
                                        >
                                            {processing ? (
                                                <>
                                                    <i className="fas fa-spinner fa-spin me-2"></i>
                                                    Kaydediliyor...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fas fa-save me-2"></i>
                                                    Kaydet
                                                </>
                                            )}
                                        </button>
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
