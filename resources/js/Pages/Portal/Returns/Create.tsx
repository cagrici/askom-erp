import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import PortalLayout from '@/Layouts/PortalLayout';
import Swal from 'sweetalert2';
import axios from 'axios';

interface Product {
    id: number;
    name: string;
    product_code?: string;
    primary_image_url?: string;
}

interface OrderItem {
    id: number;
    product_id: number;
    product_name: string;
    product_code?: string;
    quantity: number;
    unit_price: number;
    product?: Product;
}

interface SalesOrder {
    id: number;
    order_number: string;
    order_date: string;
    delivered_at: string;
    total_amount: number;
    items: OrderItem[];
}

interface Props {
    returnableOrders: SalesOrder[];
    reasons: Record<string, string>;
    maxReturnDays: number;
    minImages: number;
}

interface ReturnItem {
    sales_order_item_id: number;
    product_name: string;
    product_code?: string;
    max_quantity: number;
    quantity_returned: number;
    images: File[];
    imagePreviewUrls: string[];
}

const Create: React.FC<Props> = ({ returnableOrders, reasons, maxReturnDays, minImages }) => {
    const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
    const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        sales_order_id: '',
        return_reason: '',
        return_description: '',
    });

    const handleOrderSelect = (orderId: string) => {
        const order = returnableOrders.find((o) => o.id === Number(orderId));
        setSelectedOrder(order || null);
        setReturnItems([]);
        setData('sales_order_id', orderId);
    };

    const handleAddItem = (orderItem: OrderItem) => {
        const existingItem = returnItems.find((item) => item.sales_order_item_id === orderItem.id);

        if (existingItem) {
            Swal.fire({
                icon: 'warning',
                title: 'Uyarı',
                text: 'Bu ürün zaten eklendi.',
                confirmButtonText: 'Tamam'
            });
            return;
        }

        const newItem: ReturnItem = {
            sales_order_item_id: orderItem.id,
            product_name: orderItem.product_name,
            product_code: orderItem.product_code,
            max_quantity: orderItem.quantity,
            quantity_returned: orderItem.quantity,
            images: [],
            imagePreviewUrls: [],
        };

        setReturnItems([...returnItems, newItem]);
    };

    const handleRemoveItem = (itemId: number) => {
        const item = returnItems.find((i) => i.sales_order_item_id === itemId);
        if (item) {
            item.imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
        }
        setReturnItems(returnItems.filter((item) => item.sales_order_item_id !== itemId));
    };

    const handleQuantityChange = (itemId: number, quantity: number) => {
        setReturnItems(
            returnItems.map((item) =>
                item.sales_order_item_id === itemId
                    ? { ...item, quantity_returned: quantity }
                    : item
            )
        );
    };

    const handleImageUpload = (itemId: number, files: FileList | null) => {
        if (!files) return;

        const newImages = Array.from(files);
        const currentItem = returnItems.find((item) => item.sales_order_item_id === itemId);

        if (!currentItem) return;

        const totalImages = currentItem.images.length + newImages.length;

        if (totalImages > 10) {
            Swal.fire({
                icon: 'warning',
                title: 'Uyarı',
                text: 'Maksimum 10 fotoğraf yükleyebilirsiniz.',
                confirmButtonText: 'Tamam'
            });
            return;
        }

        const newPreviewUrls = newImages.map((file) => URL.createObjectURL(file));

        setReturnItems(
            returnItems.map((item) =>
                item.sales_order_item_id === itemId
                    ? {
                          ...item,
                          images: [...item.images, ...newImages],
                          imagePreviewUrls: [...item.imagePreviewUrls, ...newPreviewUrls],
                      }
                    : item
            )
        );
    };

    const handleRemoveImage = (itemId: number, imageIndex: number) => {
        setReturnItems(
            returnItems.map((item) => {
                if (item.sales_order_item_id === itemId) {
                    URL.revokeObjectURL(item.imagePreviewUrls[imageIndex]);
                    return {
                        ...item,
                        images: item.images.filter((_, index) => index !== imageIndex),
                        imagePreviewUrls: item.imagePreviewUrls.filter((_, index) => index !== imageIndex),
                    };
                }
                return item;
            })
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (returnItems.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Uyarı',
                text: 'En az bir ürün seçmelisiniz.',
                confirmButtonText: 'Tamam'
            });
            return;
        }

        for (const item of returnItems) {
            if (item.images.length < minImages) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Uyarı',
                    text: `Her ürün için en az ${minImages} fotoğraf yüklemelisiniz.`,
                    confirmButtonText: 'Tamam'
                });
                return;
            }
        }

        console.log('Submitting return with items:', returnItems);

        // Build FormData manually to properly handle files
        const formData = new FormData();
        formData.append('sales_order_id', data.sales_order_id);
        formData.append('return_reason', data.return_reason);
        formData.append('return_description', data.return_description);

        // Add items with images
        returnItems.forEach((item, index) => {
            formData.append(`items[${index}][sales_order_item_id]`, item.sales_order_item_id.toString());
            formData.append(`items[${index}][quantity_returned]`, item.quantity_returned.toString());

            // Add images for this item
            item.images.forEach((image, imgIndex) => {
                formData.append(`items[${index}][images][${imgIndex}]`, image);
            });
        });

        // Log FormData for debugging
        console.log('FormData contents:');
        for (const pair of formData.entries()) {
            console.log(pair[0], pair[1] instanceof File ? `File: ${pair[1].name}` : pair[1]);
        }

        setSubmitting(true);

        try {
            const response = await axios.post(route('portal.returns.store'), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('Return request submitted successfully', response.data);

            await Swal.fire({
                icon: 'success',
                title: 'Başarılı',
                text: 'İade talebiniz başarıyla gönderildi.',
                confirmButtonText: 'Tamam'
            });

            // Redirect using Inertia router
            router.visit(route('portal.returns.show', response.data.return_id || response.data.id));

        } catch (error: any) {
            console.error('Return creation error:', error);

            let errorMessage = 'İade talebi oluşturulurken bir hata oluştu.';

            if (error.response?.data?.errors) {
                const firstError = Object.values(error.response.data.errors)[0];
                errorMessage = Array.isArray(firstError) ? firstError[0] : firstError as string;
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            Swal.fire({
                icon: 'error',
                title: 'Hata',
                text: errorMessage,
                confirmButtonText: 'Tamam'
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <PortalLayout>
            <Head title="Yeni İade Talebi" />

            <div className="row mb-4">
                <div className="col">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h2 className="mb-0">Yeni İade Talebi</h2>
                            <p className="text-muted">İade etmek istediğiniz ürünleri seçin</p>
                        </div>
                        <Link href={route('portal.returns.index')} className="btn btn-outline-secondary">
                            <i className="bx bx-arrow-back me-2"></i>
                            Geri
                        </Link>
                    </div>
                </div>
            </div>

            <div className="alert alert-info mb-4">
                <i className="bx bx-info-circle me-2"></i>
                Sipariş teslim tarihinden itibaren <strong>{maxReturnDays} gün</strong> içinde iade yapabilirsiniz.
                Her ürün için en az <strong>{minImages} fotoğraf</strong> yüklemeniz gerekmektedir.
            </div>

            {errors.error && (
                <div className="alert alert-danger mb-4">
                    <i className="bx bx-error-circle me-2"></i>
                    {errors.error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="row g-3">
                    {/* Left Column - Order Selection */}
                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-header bg-white">
                                <h5 className="mb-0">Sipariş Bilgileri</h5>
                            </div>
                            <div className="card-body">
                                <div className="mb-3">
                                    <label className="form-label">Sipariş <span className="text-danger">*</span></label>
                                    <select
                                        className={`form-select ${errors.sales_order_id ? 'is-invalid' : ''}`}
                                        value={data.sales_order_id}
                                        onChange={(e) => handleOrderSelect(e.target.value)}
                                        required
                                    >
                                        <option value="">Sipariş Seçiniz</option>
                                        {returnableOrders.map((order) => (
                                            <option key={order.id} value={order.id}>
                                                {order.order_number} - {new Date(order.delivered_at).toLocaleDateString('tr-TR')}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.sales_order_id && <div className="invalid-feedback">{errors.sales_order_id}</div>}
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">İade Nedeni <span className="text-danger">*</span></label>
                                    <select
                                        className={`form-select ${errors.return_reason ? 'is-invalid' : ''}`}
                                        value={data.return_reason}
                                        onChange={(e) => setData('return_reason', e.target.value)}
                                        required
                                    >
                                        <option value="">Seçiniz</option>
                                        {Object.entries(reasons).map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                    {errors.return_reason && <div className="invalid-feedback">{errors.return_reason}</div>}
                                </div>

                                <div>
                                    <label className="form-label">Detaylı Açıklama <span className="text-danger">*</span></label>
                                    <textarea
                                        className={`form-control ${errors.return_description ? 'is-invalid' : ''}`}
                                        rows={5}
                                        value={data.return_description}
                                        onChange={(e) => setData('return_description', e.target.value)}
                                        placeholder="İade nedeninizi detaylı olarak açıklayınız..."
                                        required
                                    />
                                    {errors.return_description && <div className="invalid-feedback">{errors.return_description}</div>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Products */}
                    <div className="col-md-8">
                        {/* Order Items */}
                        {selectedOrder && (
                            <div className="card border-0 shadow-sm mb-3">
                                <div className="card-header bg-white">
                                    <h5 className="mb-0">Sipariş Ürünleri</h5>
                                </div>
                                <div className="card-body">
                                    <div className="table-responsive">
                                        <table className="table table-hover">
                                            <thead>
                                                <tr>
                                                    <th>Ürün</th>
                                                    <th className="text-center">Miktar</th>
                                                    <th className="text-end">İşlem</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedOrder.items.map((item) => {
                                                    const isAdded = returnItems.some((ri) => ri.sales_order_item_id === item.id);
                                                    return (
                                                        <tr key={item.id}>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    {item.product?.primary_image_url && (
                                                                        <img
                                                                            src={item.product.primary_image_url}
                                                                            className="rounded me-2"
                                                                            style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                                                            alt={item.product_name}
                                                                        />
                                                                    )}
                                                                    <div>
                                                                        <div className="fw-bold">{item.product_name}</div>
                                                                        {item.product_code && (
                                                                            <small className="text-muted">Kod: {item.product_code}</small>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="text-center">{item.quantity}</td>
                                                            <td className="text-end">
                                                                <button
                                                                    type="button"
                                                                    className={`btn btn-sm ${isAdded ? 'btn-success' : 'btn-outline-primary'}`}
                                                                    onClick={() => handleAddItem(item)}
                                                                    disabled={isAdded}
                                                                >
                                                                    {isAdded ? <><i className="bx bx-check me-1"></i>Eklendi</> : <><i className="bx bx-plus me-1"></i>Ekle</>}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Selected Return Items */}
                        {returnItems.length > 0 && (
                            <div className="card border-0 shadow-sm">
                                <div className="card-header bg-white">
                                    <h5 className="mb-0">İade Edilecek Ürünler ({returnItems.length})</h5>
                                </div>
                                <div className="card-body">
                                    {returnItems.map((item) => (
                                        <div key={item.sales_order_item_id} className="card mb-3">
                                            <div className="card-body">
                                                <div className="d-flex justify-content-between align-items-start mb-3">
                                                    <h6 className="mb-0">{item.product_name}</h6>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => handleRemoveItem(item.sales_order_item_id)}
                                                    >
                                                        <i className="bx bx-trash"></i>
                                                    </button>
                                                </div>

                                                <div className="row g-3">
                                                    <div className="col-md-6">
                                                        <label className="form-label">İade Miktarı</label>
                                                        <input
                                                            type="number"
                                                            className="form-control"
                                                            min="1"
                                                            max={item.max_quantity}
                                                            value={item.quantity_returned}
                                                            onChange={(e) => handleQuantityChange(item.sales_order_item_id, Number(e.target.value))}
                                                        />
                                                        <small className="text-muted">Maksimum: {item.max_quantity}</small>
                                                    </div>

                                                    <div className="col-12">
                                                        <label className="form-label">
                                                            Ürün Fotoğrafları <span className="text-danger">*</span>
                                                            <small className="text-muted ms-2">(En az {minImages}, en fazla 10 fotoğraf)</small>
                                                        </label>
                                                        <input
                                                            type="file"
                                                            className="form-control"
                                                            accept="image/*"
                                                            multiple
                                                            onChange={(e) => handleImageUpload(item.sales_order_item_id, e.target.files)}
                                                        />
                                                        {item.images.length < minImages && (
                                                            <small className="text-danger">
                                                                Henüz {minImages - item.images.length} fotoğraf daha yüklemeniz gerekiyor
                                                            </small>
                                                        )}
                                                    </div>

                                                    {item.imagePreviewUrls.length > 0 && (
                                                        <div className="col-12">
                                                            <div className="row g-2">
                                                                {item.imagePreviewUrls.map((url, index) => (
                                                                    <div key={index} className="col-3">
                                                                        <div className="position-relative">
                                                                            <img
                                                                                src={url}
                                                                                className="img-thumbnail"
                                                                                style={{ width: '100%', height: '100px', objectFit: 'cover' }}
                                                                                alt={`Preview ${index + 1}`}
                                                                            />
                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-sm btn-danger position-absolute top-0 end-0"
                                                                                style={{ margin: '4px' }}
                                                                                onClick={() => handleRemoveImage(item.sales_order_item_id, index)}
                                                                            >
                                                                                <i className="bx bx-x"></i>
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Submit Button */}
                {returnItems.length > 0 && (
                    <div className="row mt-4">
                        <div className="col">
                            <div className="card border-0 shadow-sm">
                                <div className="card-body">
                                    <div className="d-flex justify-content-end gap-2">
                                        <Link href={route('portal.returns.index')} className="btn btn-outline-secondary">
                                            İptal
                                        </Link>
                                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                                            {submitting ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Gönderiliyor...
                                                </>
                                            ) : 'İade Talebini Gönder'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </form>
        </PortalLayout>
    );
};

export default Create;
