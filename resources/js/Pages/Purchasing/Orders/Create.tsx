import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import Layout from '../../../Layouts';
import ProductSearch from '../../../Components/ProductSearch';
import { PurchaseRequest, CurrentAccount, Location, Product, Unit, Tax } from '@/types/purchasing';
import { PageProps } from '@/types';

interface CreateOrderProps extends PageProps {
    purchaseRequest?: PurchaseRequest;
    requestItems?: any[];
    suppliers: CurrentAccount[];
    locations: Location[];
    products: Product[];
    units: Unit[];
    taxes: Tax[];
}

export default function Create({ 
    purchaseRequest, 
    requestItems, 
    suppliers, 
    locations, 
    products, 
    units,
    taxes 
}: CreateOrderProps) {
    const { data, setData, post, processing, errors } = useForm({
        title: purchaseRequest?.title || '',
        description: purchaseRequest?.description || '',
        purchase_request_id: purchaseRequest?.id || null,
        supplier_id: '',
        location_id: purchaseRequest?.location_id || '',
        order_date: new Date().toISOString().split('T')[0],
        delivery_date: '',
        delivery_address: '',
        delivery_contact: '',
        delivery_phone: '',
        priority: 'medium',
        payment_terms: '',
        currency: 'TRY',
        exchange_rate: 1,
        subtotal: 0,
        tax_amount: 0,
        discount_amount: 0,
        total_amount: 0,
        notes: '',
        items: requestItems?.map(item => ({
            purchase_request_item_id: item.id,
            product_id: item.product_id,
            selectedProduct: null,
            item_name: item.description,
            description: item.description,
            specifications: item.specification,
            ordered_quantity: item.quantity,
            unit_name: item.unit,
            unit_price: 0,
            discount_percentage: 0,
            delivery_date: '',
            notes: item.notes,
            status: 'pending',
        })) || [{
            purchase_request_item_id: null,
            product_id: '',
            selectedProduct: null,
            item_name: '',
            description: '',
            specifications: '',
            ordered_quantity: 1,
            unit_id: null,
            unit_name: 'Adet',
            unit_price: 0,
            discount_percentage: 0,
            tax_id: null,
            tax_rate: 18,
            tax_name: 'KDV 18%',
            delivery_date: '',
            notes: '',
            status: 'pending',
        }]
    });

    const addItem = () => {
        setData('items', [...data.items, {
            purchase_request_item_id: null,
            product_id: '',
            selectedProduct: null,
            item_name: '',
            description: '',
            specifications: '',
            ordered_quantity: 1,
            unit_id: null,
            unit_name: 'Adet',
            unit_price: 0,
            discount_percentage: 0,
            tax_id: null,
            tax_rate: 18,
            tax_name: 'KDV 18%',
            delivery_date: '',
            notes: '',
            status: 'pending',
        }]);
    };

    const removeItem = (index: number) => {
        const newItems = data.items.filter((_, i) => i !== index);
        setData('items', newItems);
        calculateTotals(newItems);
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...data.items];
        newItems[index] = { ...newItems[index], [field]: value };
        
        // Recalculate item total
        if (['ordered_quantity', 'unit_price', 'discount_percentage', 'tax_rate'].includes(field)) {
            const item = newItems[index];
            const subtotal = item.ordered_quantity * item.unit_price;
            const discountAmount = subtotal * (item.discount_percentage / 100);
            const total = subtotal - discountAmount;
            
            newItems[index].total_price = total;
        }
        
        setData('items', newItems);
        calculateTotals(newItems);
    };

    const calculateTotals = (items: any[]) => {
        const subtotal = items.reduce((sum, item) => sum + (item.ordered_quantity * item.unit_price), 0);
        const totalDiscount = items.reduce((sum, item) => sum + ((item.ordered_quantity * item.unit_price) * (item.discount_percentage / 100)), 0);
        const netAmount = subtotal - totalDiscount;
        
        // Calculate tax based on each item's tax rate
        const totalTax = items.reduce((sum, item) => {
            const itemNet = (item.ordered_quantity * item.unit_price) - ((item.ordered_quantity * item.unit_price) * (item.discount_percentage / 100));
            const taxRate = item.tax_rate || 18;
            return sum + (itemNet * (taxRate / 100));
        }, 0);
        
        const total = netAmount + totalTax;

        setData(prev => ({
            ...prev,
            subtotal,
            discount_amount: totalDiscount,
            tax_amount: totalTax,
            total_amount: total
        }));
    };

    const getStatusText = (status: string) => {
        const statuses: Record<string, string> = {
            'pending': 'Bekliyor',
            'confirmed': 'Onaylandı',
            'partially_received': 'Kısmen Alındı',
            'received': 'Alındı',
            'cancelled': 'İptal Edildi',
        };
        return statuses[status] || status;
    };

    const getStatusBadgeColor = (status: string) => {
        const colors: Record<string, string> = {
            'pending': 'warning',
            'confirmed': 'primary',
            'partially_received': 'info',
            'received': 'success',
            'cancelled': 'danger',
        };
        return colors[status] || 'secondary';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('purchasing.orders.store'));
    };

    return (
        <Layout>
            <Head title="Yeni Satın Alma Siparişi" />
            
            <div className="page-content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <h3 className="card-title">
                                        Yeni Satın Alma Siparişi
                                        {purchaseRequest && (
                                            <small className="text-muted ms-2">
                                                (Talep No: {purchaseRequest.request_number})
                                            </small>
                                        )}
                                    </h3>
                                    <Link
                                        href={route('purchasing.orders.index')}
                                        className="btn btn-secondary"
                                    >
                                        <i className="fas fa-arrow-left me-2"></i>
                                        Geri Dön
                                    </Link>
                                </div>

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
                                                    required
                                                />
                                                {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Tedarikçi <span className="text-danger">*</span></label>
                                                <select
                                                    className={`form-select ${errors.supplier_id ? 'is-invalid' : ''}`}
                                                    value={data.supplier_id}
                                                    onChange={(e) => setData('supplier_id', e.target.value)}
                                                    required
                                                >
                                                    <option value="">Tedarikçi Seçin</option>
                                                    {suppliers.map((supplier) => (
                                                        <option key={supplier.id} value={supplier.id}>
                                                            {supplier.title}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.supplier_id && <div className="invalid-feedback">{errors.supplier_id}</div>}
                                            </div>
                                        </div>

                                        {/* Order Type Selection */}
                                        <div className="row mb-4">
                                            <div className="col-md-12">
                                                <div className="alert alert-info">
                                                    <div className="d-flex align-items-center">
                                                        <i className="fas fa-info-circle me-2"></i>
                                                        <div className="flex-grow-1">
                                                            <strong>Sipariş Türü:</strong>
                                                            {purchaseRequest ? (
                                                                <span className="ms-2">
                                                                    <span className="badge bg-success">Talep Bazlı Sipariş</span>
                                                                    - Bu sipariş #{purchaseRequest.request_number} numaralı onaylanmış satın alma talebinden oluşturuluyor.
                                                                </span>
                                                            ) : (
                                                                <span className="ms-2">
                                                                    <span className="badge bg-warning">Doğrudan Sipariş</span>
                                                                    - Bu sipariş talep olmadan doğrudan oluşturuluyor. Acil ihtiyaçlar için uygundur.
                                                                </span>
                                                            )}
                                                        </div>
                                                        {!purchaseRequest && (
                                                            <Link
                                                                href={route('purchasing.requests.create')}
                                                                className="btn btn-sm btn-outline-primary"
                                                            >
                                                                <i className="fas fa-plus me-1"></i>
                                                                Önce Talep Oluştur
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row mb-4">
                                            <div className="col-md-6">
                                                <label className="form-label">Lokasyon</label>
                                                <select
                                                    className={`form-select ${errors.location_id ? 'is-invalid' : ''}`}
                                                    value={data.location_id}
                                                    onChange={(e) => setData('location_id', e.target.value)}
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
                                                <label className="form-label">Sipariş Tarihi <span className="text-danger">*</span></label>
                                                <input
                                                    type="date"
                                                    className={`form-control ${errors.order_date ? 'is-invalid' : ''}`}
                                                    value={data.order_date}
                                                    onChange={(e) => setData('order_date', e.target.value)}
                                                    required
                                                />
                                                {errors.order_date && <div className="invalid-feedback">{errors.order_date}</div>}
                                            </div>
                                            <div className="col-md-3">
                                                <label className="form-label">Teslimat Tarihi <span className="text-danger">*</span></label>
                                                <input
                                                    type="date"
                                                    className={`form-control ${errors.delivery_date ? 'is-invalid' : ''}`}
                                                    value={data.delivery_date}
                                                    onChange={(e) => setData('delivery_date', e.target.value)}
                                                    required
                                                />
                                                {errors.delivery_date && <div className="invalid-feedback">{errors.delivery_date}</div>}
                                            </div>
                                        </div>

                                        <div className="row mb-4">
                                            <div className="col-md-4">
                                                <label className="form-label">Teslimat Adresi <span className="text-danger">*</span></label>
                                                <textarea
                                                    className={`form-control ${errors.delivery_address ? 'is-invalid' : ''}`}
                                                    value={data.delivery_address}
                                                    onChange={(e) => setData('delivery_address', e.target.value)}
                                                    rows={3}
                                                    required
                                                />
                                                {errors.delivery_address && <div className="invalid-feedback">{errors.delivery_address}</div>}
                                            </div>
                                            <div className="col-md-4">
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
                                            <div className="col-md-4">
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
                                        </div>

                                        {/* Items */}
                                        <div className="mb-4">
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <h5>Sipariş Kalemleri</h5>
                                                <button
                                                    type="button"
                                                    className="btn btn-success btn-sm"
                                                    onClick={addItem}
                                                >
                                                    <i className="fas fa-plus me-2"></i>
                                                    Kalem Ekle
                                                </button>
                                            </div>

                                            {purchaseRequest && (
                                                <div className="alert alert-success mb-3">
                                                    <div className="d-flex align-items-start">
                                                        <i className="fas fa-info-circle me-2 mt-1"></i>
                                                        <div>
                                                            <strong>Talep Dönüştürme:</strong><br/>
                                                            <small>
                                                                • Bu sipariş #{purchaseRequest.request_number} numaralı onaylanmış talep kalemlerinden oluşturuluyor<br/>
                                                                • Talep kalemleri otomatik olarak eklenmiştir<br/>
                                                                • Durum alanlarını güncelleyerek sipariş sürecini takip edebilirsiniz<br/>
                                                                • İstediğiniz zaman yeni kalemler ekleyebilirsiniz
                                                            </small>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="table-responsive">
                                                <table className="table table-bordered">
                                                    <thead>
                                                        <tr>
                                                            <th>Ürün</th>
                                                            <th>Miktar</th>
                                                            <th>Birim</th>
                                                            <th>Birim Fiyat</th>
                                                            <th>İndirim %</th>
                                                            <th>Vergi</th>
                                                            <th>Toplam</th>
                                                            <th>Durum</th>
                                                            <th>İşlem</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {data.items.map((item, index) => (
                                                            <tr key={index}>
                                                                <td>
                                                                    <div className="d-flex">
                                                                        {/* Product Image */}
                                                                        <div className="me-3 flex-shrink-0">
                                                                            {item.selectedProduct?.primary_image ? (
                                                                                <img 
                                                                                    src={item.selectedProduct.primary_image.thumbnail_url} 
                                                                                    alt={item.selectedProduct.name}
                                                                                    className="rounded"
                                                                                    style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                                                                                />
                                                                            ) : (
                                                                                <div 
                                                                                    className="bg-light rounded d-flex align-items-center justify-content-center"
                                                                                    style={{ width: '60px', height: '60px' }}
                                                                                >
                                                                                    <i className="ri-image-line text-muted"></i>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        
                                                                        {/* Product Details */}
                                                                        <div className="d-flex flex-column flex-grow-1">
                                                                            <div className="mb-2">
                                                                                <ProductSearch
                                                                                    value={item.selectedProduct || null}
                                                                                    onChange={(product) => {
                                                                                        updateItem(index, 'selectedProduct', product);
                                                                                        updateItem(index, 'product_id', product?.id || '');
                                                                                        if (product) {
                                                                                            updateItem(index, 'item_name', product.name);
                                                                                            updateItem(index, 'description', product.name);
                                                                                            
                                                                                            // Set default unit from product's activeUnits (prefer base unit)
                                                                                            let defaultUnit = product.baseUnit;
                                                                                            let defaultUnitId = product.baseUnit?.id || null;
                                                                                            
                                                                                            if (product.activeUnits && product.activeUnits.length > 0) {
                                                                                                const baseProductUnit = product.activeUnits.find(pu => pu.is_base_unit);
                                                                                                const firstProductUnit = product.activeUnits[0];
                                                                                                const preferredUnit = baseProductUnit || firstProductUnit;
                                                                                                
                                                                                                if (preferredUnit?.unit) {
                                                                                                    defaultUnit = preferredUnit.unit;
                                                                                                    defaultUnitId = preferredUnit.unit.id;
                                                                                                }
                                                                                            }
                                                                                            
                                                                                            updateItem(index, 'unit_name', defaultUnit?.symbol || 'Adet');
                                                                                            updateItem(index, 'unit_id', defaultUnitId);
                                                                                            updateItem(index, 'unit_price', product.sale_price || 0);
                                                                                            updateItem(index, 'tax_rate', product.tax?.rate || 18);
                                                                                            updateItem(index, 'tax_name', product.tax?.name || 'KDV 18%');
                                                                                            updateItem(index, 'tax_id', product.tax?.id || null);
                                                                                        }
                                                                                    }}
                                                                                    placeholder="Ürün ara (kod, ad)..."
                                                                                />
                                                                            </div>
                                                                            
                                                                            {/* Product Name or Description */}
                                                                            {item.selectedProduct ? (
                                                                                <div>
                                                                                    <div className="fw-medium">{item.selectedProduct.name}</div>
                                                                                    <small className="text-muted">Kod: {item.selectedProduct.code}</small>
                                                                                    {item.selectedProduct.sku && (
                                                                                        <small className="text-muted ms-2">SKU: {item.selectedProduct.sku}</small>
                                                                                    )}
                                                                                    <input
                                                                                        type="text"
                                                                                        className="form-control form-control-sm mt-1"
                                                                                        value={item.description}
                                                                                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                                                        placeholder="Ek açıklama (opsiyonel)"
                                                                                    />
                                                                                </div>
                                                                            ) : (
                                                                                <input
                                                                                    type="text"
                                                                                    className="form-control form-control-sm"
                                                                                    value={item.description}
                                                                                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                                                    placeholder="Ürün açıklaması"
                                                                                    required
                                                                                />
                                                                            )}
                                                                            
                                                                            {item.purchase_request_item_id && (
                                                                                <small className="text-muted mt-1">
                                                                                    <i className="fas fa-link me-1"></i>
                                                                                    Talep kaleminden
                                                                                </small>
                                                                            )}
                                                                            {item.specifications && (
                                                                                <small className="text-info mt-1">
                                                                                    <strong>Özellik:</strong> {item.specifications}
                                                                                </small>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <input
                                                                        type="number"
                                                                        className="form-control form-control-sm"
                                                                        value={item.ordered_quantity}
                                                                        onChange={(e) => updateItem(index, 'ordered_quantity', parseFloat(e.target.value) || 0)}
                                                                        min="0"
                                                                        step="0.01"
                                                                        required
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <select
                                                                        className="form-select form-select-sm"
                                                                        value={item.unit_id || ''}
                                                                        onChange={(e) => {
                                                                            const selectedUnitId = parseInt(e.target.value);
                                                                            updateItem(index, 'unit_id', selectedUnitId || null);
                                                                            
                                                                            // Find the selected unit from product's activeUnits or general units
                                                                            let selectedUnit = null;
                                                                            if (item.selectedProduct?.activeUnits) {
                                                                                const productUnit = item.selectedProduct.activeUnits.find(pu => pu.unit?.id === selectedUnitId);
                                                                                selectedUnit = productUnit?.unit;
                                                                            } else {
                                                                                selectedUnit = units.find(unit => unit.id === selectedUnitId);
                                                                            }
                                                                            
                                                                            if (selectedUnit) {
                                                                                updateItem(index, 'unit_name', selectedUnit.symbol);
                                                                            }
                                                                        }}
                                                                        required
                                                                    >
                                                                        <option value="">Birim Seçin</option>
                                                                        {item.selectedProduct?.activeUnits && item.selectedProduct.activeUnits.length > 0 ? (
                                                                            // Show product's specific units
                                                                            item.selectedProduct.activeUnits.map(productUnit => (
                                                                                productUnit.unit && (
                                                                                    <option key={productUnit.unit.id} value={productUnit.unit.id}>
                                                                                        {productUnit.unit.name} ({productUnit.unit.symbol})
                                                                                        {productUnit.conversion_factor !== 1 && ` - ${productUnit.conversion_factor}x`}
                                                                                    </option>
                                                                                )
                                                                            ))
                                                                        ) : (
                                                                            // Fallback to general units if no product-specific units
                                                                            units.map(unit => (
                                                                                <option key={unit.id} value={unit.id}>
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
                                                                        required
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <input
                                                                        type="number"
                                                                        className="form-control form-control-sm"
                                                                        value={item.discount_percentage}
                                                                        onChange={(e) => updateItem(index, 'discount_percentage', parseFloat(e.target.value) || 0)}
                                                                        min="0"
                                                                        max="100"
                                                                        step="0.01"
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <select
                                                                        className="form-select form-select-sm"
                                                                        value={item.tax_id || ''}
                                                                        onChange={(e) => {
                                                                            const selectedTax = taxes.find(tax => tax.id === parseInt(e.target.value));
                                                                            updateItem(index, 'tax_id', e.target.value ? parseInt(e.target.value) : null);
                                                                            if (selectedTax) {
                                                                                updateItem(index, 'tax_rate', selectedTax.rate);
                                                                                updateItem(index, 'tax_name', selectedTax.name);
                                                                            }
                                                                        }}
                                                                    >
                                                                        <option value="">Vergi Seçin</option>
                                                                        {taxes.map(tax => (
                                                                            <option key={tax.id} value={tax.id}>
                                                                                {tax.name} ({tax.type === 'percentage' ? `%${tax.rate}` : `${tax.fixed_amount}`})
                                                                            </option>
                                                                        ))}
                                                                    </select>
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
                                                                    <select
                                                                        className="form-select form-select-sm"
                                                                        value={item.status}
                                                                        onChange={(e) => updateItem(index, 'status', e.target.value)}
                                                                    >
                                                                        <option value="pending">Bekliyor</option>
                                                                        <option value="confirmed">Onaylandı</option>
                                                                        <option value="partially_received">Kısmen Alındı</option>
                                                                        <option value="received">Alındı</option>
                                                                        <option value="cancelled">İptal Edildi</option>
                                                                    </select>
                                                                    <div className="mt-1">
                                                                        <span className={`badge bg-${getStatusBadgeColor(item.status)}`}>
                                                                            {getStatusText(item.status)}
                                                                        </span>
                                                                    </div>
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
                                                </table>
                                            </div>
                                        </div>

                                        {/* Totals */}
                                        <div className="row">
                                            <div className="col-md-8">
                                                <label className="form-label">Notlar</label>
                                                <textarea
                                                    className="form-control"
                                                    value={data.notes}
                                                    onChange={(e) => setData('notes', e.target.value)}
                                                    rows={3}
                                                />
                                            </div>
                                            <div className="col-md-4">
                                                <div className="card">
                                                    <div className="card-body">
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span>Ara Toplam:</span>
                                                            <span>{new Intl.NumberFormat('tr-TR', {
                                                                style: 'currency',
                                                                currency: data.currency
                                                            }).format(data.subtotal)}</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span>İndirim:</span>
                                                            <span>{new Intl.NumberFormat('tr-TR', {
                                                                style: 'currency',
                                                                currency: data.currency
                                                            }).format(data.discount_amount)}</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span>Vergi:</span>
                                                            <span>{new Intl.NumberFormat('tr-TR', {
                                                                style: 'currency',
                                                                currency: data.currency
                                                            }).format(data.tax_amount || 0)}</span>
                                                        </div>
                                                        <hr />
                                                        <div className="d-flex justify-content-between fw-bold">
                                                            <span>Genel Toplam:</span>
                                                            <span>{new Intl.NumberFormat('tr-TR', {
                                                                style: 'currency',
                                                                currency: data.currency
                                                            }).format(data.total_amount)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card-footer d-flex justify-content-end gap-2">
                                        <Link
                                            href={route('purchasing.orders.index')}
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