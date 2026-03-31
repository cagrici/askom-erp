import React, { useState, useEffect } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { Card, Table, Button, Row, Col, Form, InputGroup, Badge, Alert, Modal } from 'react-bootstrap';
import Select from 'react-select';
import Layout from '@/Layouts';

interface Customer {
    id: number;
    name: string;
    title?: string;
}

interface Product {
    id: number;
    name: string;
    code: string;
}

interface SalesOrderItem {
    id: number;
    product_id: number;
    product?: Product;
    product_name: string;
    product_code?: string;
    quantity: number;
    shipped_quantity?: number;
    shippable_quantity?: number;
    corridor?: string;
}

interface SalesOrder {
    id: number;
    order_number: string;
    order_date: string;
    customer?: Customer;
    status: string;
    status_label: string;
    items?: SalesOrderItem[];
    shipping_address?: any;
}

interface Vehicle {
    id: number;
    plate_number: string;
    make?: string;
    model?: string;
    status?: string;
}

interface Driver {
    id: number;
    name: string;
}

interface ShippableOrder {
    id: number;
    order_number: string;
    customer_name: string;
    order_date: string;
    total_amount: number;
    currency: string;
    status: string;
    status_label: string;
    items_count: number;
    can_ship: boolean;
}

interface ExistingShippingOrder {
    id: number;
    shipping_number: string;
    status: string;
    created_at: string;
}

interface Props {
    salesOrder?: SalesOrder;
    vehicles: Vehicle[];
    drivers: Driver[];
    priorities: Record<string, string>;
    cannotCreateReason?: string;
    existingShippingOrders?: ExistingShippingOrder[];
}

interface ShippingItem {
    sales_order_item_id: number;
    shipping_quantity: number;
    max_quantity: number;
    product_name: string;
    product_code: string;
    corridor?: string;
    selected: boolean;
}

export default function Create({
    salesOrder: initialSalesOrder,
    vehicles: initialVehicles,
    drivers: initialDrivers,
    priorities,
    cannotCreateReason,
    existingShippingOrders,
}: Props) {
    const [salesOrder, setSalesOrder] = useState<SalesOrder | undefined>(initialSalesOrder);
    const [shippableOrders, setShippableOrders] = useState<ShippableOrder[]>([]);
    const [searchingOrders, setSearchingOrders] = useState(false);
    const [items, setItems] = useState<ShippingItem[]>([]);

    // Vehicles and drivers state (can be updated when new ones are added)
    const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
    const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);

    // Modal states
    const [showVehicleModal, setShowVehicleModal] = useState(false);
    const [showDriverModal, setShowDriverModal] = useState(false);
    const [vehicleSubmitting, setVehicleSubmitting] = useState(false);
    const [driverSubmitting, setDriverSubmitting] = useState(false);

    // New vehicle form
    const [newVehicle, setNewVehicle] = useState({
        plate_number: '',
        make: '',
        model: '',
        year: '',
        color: '',
        capacity: '',
    });

    // New driver form
    const [newDriver, setNewDriver] = useState({
        name: '',
        phone: '',
        license_number: '',
        license_expiry: '',
    });

    const { data, setData, post, processing, errors } = useForm({
        sales_order_id: salesOrder?.id || '',
        vehicle_id: '',
        driver_id: '',
        priority: 'normal',
        requested_ship_date: '',
        notes: '',
        shipping_notes: '',
        items: [] as { sales_order_item_id: number; shipping_quantity: number }[],
    });

    // Load shippable orders if no order is preselected
    useEffect(() => {
        if (!salesOrder) {
            loadShippableOrders();
        }
    }, []);

    // Initialize items when sales order is set
    useEffect(() => {
        if (salesOrder?.items) {
            const shippingItems: ShippingItem[] = salesOrder.items
                .filter(item => (item.shippable_quantity || (item.quantity - (item.shipped_quantity || 0))) > 0)
                .map(item => ({
                    sales_order_item_id: item.id,
                    shipping_quantity: item.shippable_quantity || (item.quantity - (item.shipped_quantity || 0)),
                    max_quantity: item.shippable_quantity || (item.quantity - (item.shipped_quantity || 0)),
                    product_name: item.product_name || item.product?.name || '',
                    product_code: item.product_code || item.product?.code || '',
                    corridor: item.corridor,
                    selected: true,
                }));
            setItems(shippingItems);
            setData('sales_order_id', salesOrder.id);
        }
    }, [salesOrder]);

    // Update form items when items change
    useEffect(() => {
        const formItems = items
            .filter(item => item.selected && item.shipping_quantity > 0)
            .map(item => ({
                sales_order_item_id: item.sales_order_item_id,
                shipping_quantity: item.shipping_quantity,
            }));
        setData('items', formItems);
    }, [items]);

    const loadShippableOrders = async () => {
        setSearchingOrders(true);
        try {
            const response = await fetch(route('warehouse.shipping-orders.shippable-orders'));
            const data = await response.json();
            setShippableOrders(data);
        } catch (error) {
            console.error('Error loading shippable orders:', error);
        } finally {
            setSearchingOrders(false);
        }
    };

    const selectOrder = (orderId: number) => {
        router.get(route('warehouse.shipping-orders.create'), { sales_order_id: orderId }, {
            preserveState: false,
        });
    };

    const toggleItemSelection = (index: number) => {
        const newItems = [...items];
        newItems[index].selected = !newItems[index].selected;
        setItems(newItems);
    };

    const updateItemQuantity = (index: number, quantity: number) => {
        const newItems = [...items];
        newItems[index].shipping_quantity = Math.min(Math.max(0, quantity), newItems[index].max_quantity);
        setItems(newItems);
    };

    const selectAllItems = () => {
        setItems(items.map(item => ({ ...item, selected: true })));
    };

    const deselectAllItems = () => {
        setItems(items.map(item => ({ ...item, selected: false })));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (data.items.length === 0) {
            alert('Lutfen en az bir kalem secin.');
            return;
        }

        post(route('warehouse.shipping-orders.store'));
    };

    // Add new vehicle
    const handleAddVehicle = async (e: React.FormEvent) => {
        e.preventDefault();
        setVehicleSubmitting(true);

        try {
            const response = await fetch(route('warehouse.vehicles.store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(newVehicle),
            });

            const result = await response.json();

            if (response.ok && result.vehicle) {
                // Add new vehicle to the list and select it
                setVehicles([...vehicles, result.vehicle]);
                setData('vehicle_id', result.vehicle.id.toString());
                setShowVehicleModal(false);
                setNewVehicle({
                    plate_number: '',
                    make: '',
                    model: '',
                    year: '',
                    color: '',
                    capacity: '',
                });
            } else {
                alert(result.message || 'Arac eklenirken hata olustu.');
            }
        } catch (error) {
            console.error('Error adding vehicle:', error);
            alert('Arac eklenirken hata olustu.');
        } finally {
            setVehicleSubmitting(false);
        }
    };

    // Add new driver
    const handleAddDriver = async (e: React.FormEvent) => {
        e.preventDefault();
        setDriverSubmitting(true);

        try {
            const response = await fetch(route('warehouse.drivers.store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(newDriver),
            });

            const result = await response.json();

            if (response.ok && result.driver) {
                // Add new driver to the list and select it
                setDrivers([...drivers, result.driver]);
                setData('driver_id', result.driver.id.toString());
                setShowDriverModal(false);
                setNewDriver({
                    name: '',
                    phone: '',
                    license_number: '',
                    license_expiry: '',
                });
            } else {
                alert(result.message || 'Sofor eklenirken hata olustu.');
            }
        } catch (error) {
            console.error('Error adding driver:', error);
            alert('Sofor eklenirken hata olustu.');
        } finally {
            setDriverSubmitting(false);
        }
    };

    const selectedCount = items.filter(i => i.selected).length;
    const totalQuantity = items.filter(i => i.selected).reduce((sum, i) => sum + i.shipping_quantity, 0);

    return (
        <Layout>
            <Head title="Yeni Sevk Emri" />
            <div className="page-content">
            <div className="container-fluid py-4">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <Link
                            href={route('warehouse.shipping-orders.index')}
                            className="text-muted text-decoration-none mb-2 d-inline-block"
                        >
                            <i className="ri-arrow-left-line me-1"></i>
                            Sevk Emirlerine Don
                        </Link>
                        <h4 className="mb-0">Yeni Sevk Emri</h4>
                    </div>
                </div>

                {/* Order Selection */}
                {!salesOrder && (
                    <Card className="border-0 shadow-sm mb-4">
                        <Card.Header className="bg-white">
                            <h5 className="mb-0">
                                <i className="ri-file-list-3-line me-2"></i>
                                Siparis Sec
                            </h5>
                        </Card.Header>
                        <Card.Body>
                            {searchingOrders ? (
                                <div className="text-center py-4">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Yukleniyor...</span>
                                    </div>
                                </div>
                            ) : shippableOrders.length === 0 ? (
                                <Alert variant="info">
                                    <i className="ri-information-line me-2"></i>
                                    Sevk edilebilir siparis bulunamadi.
                                </Alert>
                            ) : (
                                <Table responsive hover>
                                    <thead className="bg-light">
                                        <tr>
                                            <th>Siparis No</th>
                                            <th>Musteri</th>
                                            <th>Tarih</th>
                                            <th>Durum</th>
                                            <th className="text-center">Kalem</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {shippableOrders.map((order) => (
                                            <tr key={order.id}>
                                                <td className="fw-bold">{order.order_number}</td>
                                                <td>{order.customer_name}</td>
                                                <td>{order.order_date}</td>
                                                <td>
                                                    <Badge bg="secondary">{order.status_label}</Badge>
                                                </td>
                                                <td className="text-center">{order.items_count}</td>
                                                <td>
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        onClick={() => selectOrder(order.id)}
                                                        disabled={!order.can_ship}
                                                    >
                                                        Sec
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </Card.Body>
                    </Card>
                )}

                {/* Cannot Create Warning */}
                {salesOrder && cannotCreateReason && (
                    <Card className="border-0 shadow-sm mb-4">
                        <Card.Body>
                            <Alert variant="warning" className="mb-0">
                                <div className="d-flex align-items-start">
                                    <i className="ri-error-warning-line fs-4 me-3 text-warning"></i>
                                    <div className="flex-grow-1">
                                        <h5 className="alert-heading mb-2">Sevk Emri Olusturulamaz</h5>
                                        <p className="mb-3">{cannotCreateReason}</p>

                                        {existingShippingOrders && existingShippingOrders.length > 0 && (
                                            <div className="mt-3">
                                                <p className="mb-2"><strong>Mevcut Sevk Emirleri:</strong></p>
                                                <ul className="mb-0">
                                                    {existingShippingOrders.map((so) => (
                                                        <li key={so.id}>
                                                            <Link
                                                                href={route('warehouse.shipping-orders.show', so.id)}
                                                                className="text-primary"
                                                            >
                                                                {so.shipping_number}
                                                            </Link>
                                                            {' '}- {so.status}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        <div className="mt-3">
                                            <Link
                                                href={route('warehouse.shipping-orders.index')}
                                                className="btn btn-outline-primary me-2"
                                            >
                                                <i className="ri-list-check me-1"></i>
                                                Sevk Emirleri Listesi
                                            </Link>
                                            <Link
                                                href={route('warehouse.shipping-orders.create')}
                                                className="btn btn-outline-secondary"
                                            >
                                                <i className="ri-search-line me-1"></i>
                                                Baska Siparis Sec
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </Alert>
                        </Card.Body>
                    </Card>
                )}

                {/* Create Form */}
                {salesOrder && !cannotCreateReason && (
                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col lg={8}>
                                {/* Order Info */}
                                <Card className="border-0 shadow-sm mb-4">
                                    <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                                        <h5 className="mb-0">
                                            <i className="ri-file-text-line me-2"></i>
                                            Siparis: {salesOrder.order_number}
                                        </h5>
                                        <Link
                                            href={route('warehouse.shipping-orders.create')}
                                            className="btn btn-sm btn-outline-secondary"
                                        >
                                            Degistir
                                        </Link>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row>
                                            <Col md={6}>
                                                <p className="mb-1">
                                                    <strong>Musteri:</strong>{' '}
                                                    {salesOrder.customer?.name || salesOrder.customer?.title}
                                                </p>
                                                <p className="mb-0">
                                                    <strong>Siparis Tarihi:</strong>{' '}
                                                    {new Date(salesOrder.order_date).toLocaleDateString('tr-TR')}
                                                </p>
                                            </Col>
                                            <Col md={6}>
                                                <p className="mb-1">
                                                    <strong>Durum:</strong>{' '}
                                                    <Badge bg="secondary">{salesOrder.status_label}</Badge>
                                                </p>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>

                                {/* Items Selection */}
                                <Card className="border-0 shadow-sm mb-4">
                                    <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                                        <h5 className="mb-0">
                                            <i className="ri-list-check me-2"></i>
                                            Sevk Kalemleri
                                        </h5>
                                        <div>
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                onClick={selectAllItems}
                                                className="me-2"
                                            >
                                                Tumunu Sec
                                            </Button>
                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                onClick={deselectAllItems}
                                            >
                                                Temizle
                                            </Button>
                                        </div>
                                    </Card.Header>
                                    <Card.Body className="p-0">
                                        {items.length === 0 ? (
                                            <Alert variant="warning" className="m-3">
                                                <i className="ri-error-warning-line me-2"></i>
                                                Sevk edilebilir kalem bulunamadi.
                                            </Alert>
                                        ) : (
                                            <Table responsive hover className="mb-0">
                                                <thead className="bg-light">
                                                    <tr>
                                                        <th style={{ width: '50px' }}></th>
                                                        <th>Urun</th>
                                                        <th>Koridor</th>
                                                        <th className="text-center" style={{ width: '150px' }}>Sevk Miktari</th>
                                                        <th className="text-center" style={{ width: '100px' }}>Max</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {items.map((item, index) => (
                                                        <tr key={item.sales_order_item_id} className={item.selected ? '' : 'table-secondary'}>
                                                            <td className="text-center">
                                                                <Form.Check
                                                                    type="checkbox"
                                                                    checked={item.selected}
                                                                    onChange={() => toggleItemSelection(index)}
                                                                />
                                                            </td>
                                                            <td>
                                                                <div className="fw-bold">{item.product_code}</div>
                                                                <small className="text-muted">{item.product_name}</small>
                                                            </td>
                                                            <td>
                                                                <small className="text-muted">{item.corridor || '-'}</small>
                                                            </td>
                                                            <td>
                                                                <Form.Control
                                                                    type="number"
                                                                    min="0"
                                                                    max={item.max_quantity}
                                                                    step="0.001"
                                                                    value={item.shipping_quantity}
                                                                    onChange={(e) => updateItemQuantity(index, parseFloat(e.target.value) || 0)}
                                                                    disabled={!item.selected}
                                                                    className="text-center"
                                                                />
                                                            </td>
                                                            <td className="text-center text-muted">
                                                                {item.max_quantity}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        )}
                                    </Card.Body>
                                    <Card.Footer className="bg-white">
                                        <div className="d-flex justify-content-between">
                                            <span>
                                                <strong>{selectedCount}</strong> kalem secildi
                                            </span>
                                            <span>
                                                Toplam miktar: <strong>{totalQuantity.toFixed(2)}</strong>
                                            </span>
                                        </div>
                                    </Card.Footer>
                                </Card>
                            </Col>

                            <Col lg={4}>
                                {/* Shipping Details */}
                                <Card className="border-0 shadow-sm mb-4">
                                    <Card.Header className="bg-white">
                                        <h5 className="mb-0">
                                            <i className="ri-truck-line me-2"></i>
                                            Sevkiyat Bilgileri
                                        </h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Oncelik *</Form.Label>
                                            <Form.Select
                                                value={data.priority}
                                                onChange={(e) => setData('priority', e.target.value)}
                                                isInvalid={!!errors.priority}
                                            >
                                                {Object.entries(priorities).map(([value, label]) => (
                                                    <option key={value} value={value}>{label}</option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Istenen Sevk Tarihi</Form.Label>
                                            <Form.Control
                                                type="date"
                                                value={data.requested_ship_date}
                                                onChange={(e) => setData('requested_ship_date', e.target.value)}
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Arac</Form.Label>
                                            <div className="d-flex gap-2">
                                                <div className="flex-grow-1">
                                                    <Select
                                                        options={vehicles.map((vehicle) => ({
                                                            value: vehicle.id.toString(),
                                                            label: `${vehicle.plate_number}${vehicle.make && vehicle.model ? ` - ${vehicle.make} ${vehicle.model}` : ''}`,
                                                            status: vehicle.status,
                                                        }))}
                                                        value={
                                                            data.vehicle_id
                                                                ? (() => {
                                                                    const v = vehicles.find(v => v.id.toString() === data.vehicle_id);
                                                                    return v ? {
                                                                        value: v.id.toString(),
                                                                        label: `${v.plate_number}${v.make && v.model ? ` - ${v.make} ${v.model}` : ''}`,
                                                                        status: v.status,
                                                                    } : null;
                                                                })()
                                                                : null
                                                        }
                                                        onChange={(option) => setData('vehicle_id', option ? option.value : '')}
                                                        isClearable
                                                        isSearchable
                                                        placeholder="Ara ve sec..."
                                                        noOptionsMessage={() => 'Arac bulunamadi'}
                                                        formatOptionLabel={(option: any, { context }: { context: string }) => (
                                                            <div className="d-flex justify-content-between align-items-center">
                                                                <span style={{ color: context === 'value' ? '#212529' : 'inherit' }}>{option.label}</span>
                                                                {option.status && option.status !== 'available' && (
                                                                    <Badge bg={option.status === 'in_use' ? 'warning' : 'secondary'} className="ms-2">
                                                                        {option.status === 'in_use' ? 'Kullanımda' : option.status === 'maintenance' ? 'Bakımda' : option.status}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        )}
                                                        styles={{
                                                            control: (base) => ({
                                                                ...base,
                                                                minHeight: '38px',
                                                            }),
                                                            singleValue: (base) => ({
                                                                ...base,
                                                                color: '#212529',
                                                            }),
                                                        }}
                                                    />
                                                </div>
                                                <Button
                                                    variant="outline-secondary"
                                                    onClick={() => setShowVehicleModal(true)}
                                                    title="Yeni Arac Ekle"
                                                >
                                                    <i className="ri-add-line"></i>
                                                </Button>
                                            </div>
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Sofor</Form.Label>
                                            <div className="d-flex gap-2">
                                                <div className="flex-grow-1">
                                                    <Select
                                                        options={drivers.map((driver) => ({
                                                            value: driver.id.toString(),
                                                            label: driver.name,
                                                        }))}
                                                        value={
                                                            data.driver_id
                                                                ? (() => {
                                                                    const d = drivers.find(d => d.id.toString() === data.driver_id);
                                                                    return d ? {
                                                                        value: d.id.toString(),
                                                                        label: d.name,
                                                                    } : null;
                                                                })()
                                                                : null
                                                        }
                                                        onChange={(option) => setData('driver_id', option ? option.value : '')}
                                                        isClearable
                                                        isSearchable
                                                        placeholder="Ara ve sec..."
                                                        noOptionsMessage={() => 'Sofor bulunamadi'}
                                                        styles={{
                                                            control: (base) => ({
                                                                ...base,
                                                                minHeight: '38px',
                                                            }),
                                                            singleValue: (base) => ({
                                                                ...base,
                                                                color: '#212529',
                                                            }),
                                                        }}
                                                    />
                                                </div>
                                                <Button
                                                    variant="outline-secondary"
                                                    onClick={() => setShowDriverModal(true)}
                                                    title="Yeni Sofor Ekle"
                                                >
                                                    <i className="ri-add-line"></i>
                                                </Button>
                                            </div>
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Notlar</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={2}
                                                value={data.notes}
                                                onChange={(e) => setData('notes', e.target.value)}
                                                placeholder="Genel notlar..."
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Sevkiyat Notlari</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={2}
                                                value={data.shipping_notes}
                                                onChange={(e) => setData('shipping_notes', e.target.value)}
                                                placeholder="Sevkiyat ile ilgili notlar..."
                                            />
                                        </Form.Group>
                                    </Card.Body>
                                </Card>

                                {/* Submit */}
                                <div className="d-grid">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="lg"
                                        disabled={processing || selectedCount === 0}
                                    >
                                        {processing ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Kaydediliyor...
                                            </>
                                        ) : (
                                            <>
                                                <i className="ri-save-line me-2"></i>
                                                Sevk Emri Olustur
                                            </>
                                        )}
                                    </Button>
                                </div>

                                {Object.keys(errors).length > 0 && (
                                    <Alert variant="danger" className="mt-3">
                                        <ul className="mb-0">
                                            {Object.entries(errors).map(([key, message]) => (
                                                <li key={key}>{message as string}</li>
                                            ))}
                                        </ul>
                                    </Alert>
                                )}
                            </Col>
                        </Row>
                    </Form>
                )}
            </div>
</div>
            {/* Add Vehicle Modal */}
            <Modal show={showVehicleModal} onHide={() => setShowVehicleModal(false)}>
                <Form onSubmit={handleAddVehicle}>
                    <Modal.Header closeButton>
                        <Modal.Title>
                            <i className="ri-car-line me-2"></i>
                            Yeni Arac Ekle
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Plaka *</Form.Label>
                            <Form.Control
                                type="text"
                                value={newVehicle.plate_number}
                                onChange={(e) => setNewVehicle({ ...newVehicle, plate_number: e.target.value.toUpperCase() })}
                                placeholder="34 ABC 123"
                                required
                            />
                        </Form.Group>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Marka</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={newVehicle.make}
                                        onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
                                        placeholder="Ford, Mercedes..."
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Model</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={newVehicle.model}
                                        onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                                        placeholder="Transit, Sprinter..."
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Yil</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={newVehicle.year}
                                        onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })}
                                        placeholder="2024"
                                        min="1990"
                                        max="2030"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Renk</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={newVehicle.color}
                                        onChange={(e) => setNewVehicle({ ...newVehicle, color: e.target.value })}
                                        placeholder="Beyaz, Gri..."
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Kapasite (kg/m3)</Form.Label>
                            <Form.Control
                                type="text"
                                value={newVehicle.capacity}
                                onChange={(e) => setNewVehicle({ ...newVehicle, capacity: e.target.value })}
                                placeholder="1500 kg"
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowVehicleModal(false)}>
                            Iptal
                        </Button>
                        <Button type="submit" variant="primary" disabled={vehicleSubmitting || !newVehicle.plate_number}>
                            {vehicleSubmitting ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    Kaydediliyor...
                                </>
                            ) : (
                                <>
                                    <i className="ri-save-line me-2"></i>
                                    Kaydet
                                </>
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Add Driver Modal */}
            <Modal show={showDriverModal} onHide={() => setShowDriverModal(false)}>
                <Form onSubmit={handleAddDriver}>
                    <Modal.Header closeButton>
                        <Modal.Title>
                            <i className="ri-user-line me-2"></i>
                            Yeni Sofor Ekle
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Ad Soyad *</Form.Label>
                            <Form.Control
                                type="text"
                                value={newDriver.name}
                                onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })}
                                placeholder="Ahmet Yilmaz"
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Telefon *</Form.Label>
                            <Form.Control
                                type="tel"
                                value={newDriver.phone}
                                onChange={(e) => setNewDriver({ ...newDriver, phone: e.target.value })}
                                placeholder="05321234567"
                                required
                            />
                            <Form.Text className="text-muted">
                                Telefon numarasi benzersiz olmalidir.
                            </Form.Text>
                        </Form.Group>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Ehliyet No</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={newDriver.license_number}
                                        onChange={(e) => setNewDriver({ ...newDriver, license_number: e.target.value })}
                                        placeholder="AB123456"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Ehliyet Bitis</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={newDriver.license_expiry}
                                        onChange={(e) => setNewDriver({ ...newDriver, license_expiry: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowDriverModal(false)}>
                            Iptal
                        </Button>
                        <Button type="submit" variant="primary" disabled={driverSubmitting || !newDriver.name || !newDriver.phone}>
                            {driverSubmitting ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    Kaydediliyor...
                                </>
                            ) : (
                                <>
                                    <i className="ri-save-line me-2"></i>
                                    Kaydet
                                </>
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Layout>
    );
}
