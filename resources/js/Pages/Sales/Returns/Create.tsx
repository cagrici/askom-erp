import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Card, Table, Button, Row, Col, Form, Alert, Image } from 'react-bootstrap';
import Layout from '@/Layouts';

interface Product {
    id: number;
    name: string;
    product_code?: string;
    images?: Array<{ image_path: string }>;
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

export default function Create({ returnableOrders, reasons, maxReturnDays, minImages }: Props) {
    const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
    const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);

    const { data, setData, post, processing, errors } = useForm({
        sales_order_id: '',
        return_reason: '',
        return_description: '',
        items: [] as Array<{
            sales_order_item_id: number;
            quantity_returned: number;
            images: File[];
        }>,
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
            alert('Bu ürün zaten eklendi.');
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
            alert('Maksimum 10 fotoğraf yükleyebilirsiniz.');
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
                    const newImages = item.images.filter((_, index) => index !== imageIndex);
                    const newPreviewUrls = item.imagePreviewUrls.filter((_, index) => index !== imageIndex);

                    // Revoke old URL
                    URL.revokeObjectURL(item.imagePreviewUrls[imageIndex]);

                    return {
                        ...item,
                        images: newImages,
                        imagePreviewUrls: newPreviewUrls,
                    };
                }
                return item;
            })
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate items
        if (returnItems.length === 0) {
            alert('En az bir ürün seçmelisiniz.');
            return;
        }

        // Validate images
        for (const item of returnItems) {
            if (item.images.length < minImages) {
                alert(`Her ürün için en az ${minImages} fotoğraf yüklemelisiniz.`);
                return;
            }
        }

        // Prepare form data
        const formData = new FormData();
        formData.append('sales_order_id', data.sales_order_id);
        formData.append('return_reason', data.return_reason);
        formData.append('return_description', data.return_description);

        returnItems.forEach((item, index) => {
            formData.append(`items[${index}][sales_order_item_id]`, item.sales_order_item_id.toString());
            formData.append(`items[${index}][quantity_returned]`, item.quantity_returned.toString());

            item.images.forEach((image, imgIndex) => {
                formData.append(`items[${index}][images][${imgIndex}]`, image);
            });
        });

        post(route('sales.returns.store'), {
            data: formData,
            forceFormData: true,
        });
    };

    return (
        <Layout>
            <Head title="Yeni İade Talebi" />

            <div className="page-content">
                <div className="container-fluid">
                <Row className="mb-3">
                    <Col>
                        <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                            <h4 className="mb-sm-0">Yeni İade Talebi</h4>
                            <div className="page-title-right">
                                <Link href={route('sales.returns.index')}>
                                    <Button variant="secondary" size="sm">
                                        <i className="ri-arrow-left-line me-1"></i>
                                        Geri Dön
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </Col>
                </Row>

                <Alert variant="info" className="mb-3">
                    <i className="ri-information-line me-2"></i>
                    Sipariş teslim tarihinden itibaren <strong>{maxReturnDays} gün</strong> içinde iade yapabilirsiniz.
                    Her ürün için en az <strong>{minImages} fotoğraf</strong> yüklemeniz gerekmektedir.
                </Alert>

                <Form onSubmit={handleSubmit}>
                    <Row>
                        <Col lg={4}>
                            {/* Order Selection */}
                            <Card className="mb-3">
                                <Card.Header>
                                    <h5 className="card-title mb-0">Sipariş Seçimi</h5>
                                </Card.Header>
                                <Card.Body>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Sipariş *</Form.Label>
                                        <Form.Select
                                            value={data.sales_order_id}
                                            onChange={(e) => handleOrderSelect(e.target.value)}
                                            isInvalid={!!errors.sales_order_id}
                                            required
                                        >
                                            <option value="">Sipariş Seçiniz</option>
                                            {returnableOrders.map((order) => (
                                                <option key={order.id} value={order.id}>
                                                    {order.order_number} -{' '}
                                                    {new Date(order.delivered_at).toLocaleDateString('tr-TR')}
                                                </option>
                                            ))}
                                        </Form.Select>
                                        {errors.sales_order_id && (
                                            <Form.Control.Feedback type="invalid">
                                                {errors.sales_order_id}
                                            </Form.Control.Feedback>
                                        )}
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>İade Nedeni *</Form.Label>
                                        <Form.Select
                                            value={data.return_reason}
                                            onChange={(e) => setData('return_reason', e.target.value)}
                                            isInvalid={!!errors.return_reason}
                                            required
                                        >
                                            <option value="">Seçiniz</option>
                                            {Object.entries(reasons).map(([key, label]) => (
                                                <option key={key} value={key}>
                                                    {label}
                                                </option>
                                            ))}
                                        </Form.Select>
                                        {errors.return_reason && (
                                            <Form.Control.Feedback type="invalid">
                                                {errors.return_reason}
                                            </Form.Control.Feedback>
                                        )}
                                    </Form.Group>

                                    <Form.Group>
                                        <Form.Label>Detaylı Açıklama *</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={5}
                                            value={data.return_description}
                                            onChange={(e) => setData('return_description', e.target.value)}
                                            isInvalid={!!errors.return_description}
                                            placeholder="İade nedeninizi detaylı olarak açıklayınız..."
                                            required
                                        />
                                        {errors.return_description && (
                                            <Form.Control.Feedback type="invalid">
                                                {errors.return_description}
                                            </Form.Control.Feedback>
                                        )}
                                    </Form.Group>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col lg={8}>
                            {/* Order Items */}
                            {selectedOrder && (
                                <Card className="mb-3">
                                    <Card.Header>
                                        <h5 className="card-title mb-0">Sipariş Ürünleri</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Table hover className="mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Ürün</th>
                                                    <th className="text-center">Miktar</th>
                                                    <th className="text-end">İşlem</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedOrder.items.map((item) => {
                                                    const isAdded = returnItems.some(
                                                        (ri) => ri.sales_order_item_id === item.id
                                                    );

                                                    return (
                                                        <tr key={item.id}>
                                                            <td>
                                                                <div className="d-flex align-items-center gap-2">
                                                                    {item.product?.images?.[0] && (
                                                                        <Image
                                                                            src={`/storage/${item.product.images[0].image_path}`}
                                                                            rounded
                                                                            style={{
                                                                                width: '40px',
                                                                                height: '40px',
                                                                                objectFit: 'cover',
                                                                            }}
                                                                        />
                                                                    )}
                                                                    <div>
                                                                        <div className="fw-medium">
                                                                            {item.product_name}
                                                                        </div>
                                                                        {item.product_code && (
                                                                            <small className="text-muted">
                                                                                Kod: {item.product_code}
                                                                            </small>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="text-center">{item.quantity}</td>
                                                            <td className="text-end">
                                                                <Button
                                                                    variant={isAdded ? 'success' : 'outline-primary'}
                                                                    size="sm"
                                                                    onClick={() => handleAddItem(item)}
                                                                    disabled={isAdded}
                                                                >
                                                                    {isAdded ? (
                                                                        <>
                                                                            <i className="ri-check-line me-1"></i>
                                                                            Eklendi
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <i className="ri-add-line me-1"></i>
                                                                            Ekle
                                                                        </>
                                                                    )}
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </Table>
                                    </Card.Body>
                                </Card>
                            )}

                            {/* Selected Return Items */}
                            {returnItems.length > 0 && (
                                <Card>
                                    <Card.Header>
                                        <h5 className="card-title mb-0">İade Edilecek Ürünler</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        {returnItems.map((item) => (
                                            <Card key={item.sales_order_item_id} className="mb-3">
                                                <Card.Body>
                                                    <Row>
                                                        <Col md={6}>
                                                            <h6 className="mb-3">{item.product_name}</h6>

                                                            <Form.Group className="mb-3">
                                                                <Form.Label>İade Miktarı</Form.Label>
                                                                <Form.Control
                                                                    type="number"
                                                                    min="1"
                                                                    max={item.max_quantity}
                                                                    value={item.quantity_returned}
                                                                    onChange={(e) =>
                                                                        handleQuantityChange(
                                                                            item.sales_order_item_id,
                                                                            Number(e.target.value)
                                                                        )
                                                                    }
                                                                />
                                                                <Form.Text>
                                                                    Maksimum: {item.max_quantity}
                                                                </Form.Text>
                                                            </Form.Group>

                                                            <Form.Group>
                                                                <Form.Label>
                                                                    Fotoğraflar (En az {minImages} adet) *
                                                                </Form.Label>
                                                                <Form.Control
                                                                    type="file"
                                                                    multiple
                                                                    accept="image/*"
                                                                    onChange={(e) =>
                                                                        handleImageUpload(
                                                                            item.sales_order_item_id,
                                                                            (e.target as HTMLInputElement).files
                                                                        )
                                                                    }
                                                                />
                                                                <Form.Text>
                                                                    Yüklenmiş: {item.images.length} / Minimum: {minImages}
                                                                </Form.Text>
                                                            </Form.Group>
                                                        </Col>

                                                        <Col md={6}>
                                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                                <h6 className="mb-0">Önizleme</h6>
                                                                <Button
                                                                    variant="outline-danger"
                                                                    size="sm"
                                                                    onClick={() => handleRemoveItem(item.sales_order_item_id)}
                                                                >
                                                                    <i className="ri-delete-bin-line"></i>
                                                                </Button>
                                                            </div>
                                                            <div className="d-flex flex-wrap gap-2">
                                                                {item.imagePreviewUrls.map((url, index) => (
                                                                    <div key={index} className="position-relative">
                                                                        <Image
                                                                            src={url}
                                                                            rounded
                                                                            style={{
                                                                                width: '80px',
                                                                                height: '80px',
                                                                                objectFit: 'cover',
                                                                            }}
                                                                        />
                                                                        <Button
                                                                            variant="danger"
                                                                            size="sm"
                                                                            className="position-absolute top-0 end-0"
                                                                            style={{
                                                                                padding: '2px 6px',
                                                                                fontSize: '10px',
                                                                            }}
                                                                            onClick={() =>
                                                                                handleRemoveImage(
                                                                                    item.sales_order_item_id,
                                                                                    index
                                                                                )
                                                                            }
                                                                        >
                                                                            <i className="ri-close-line"></i>
                                                                        </Button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </Col>
                                                    </Row>
                                                </Card.Body>
                                            </Card>
                                        ))}

                                        <div className="text-end mt-3">
                                            <Button
                                                type="submit"
                                                variant="primary"
                                                disabled={processing}
                                            >
                                                {processing ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                                        Gönderiliyor...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="ri-send-plane-line me-2"></i>
                                                        İade Talebini Gönder
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            )}
                        </Col>
                    </Row>
                </Form>
                </div>
            </div>
        </Layout>
    );
}
