import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Card, Button, Row, Col, Form, Badge, Alert, Modal, Table } from 'react-bootstrap';
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

interface ShippingOrderItem {
    id: number;
    product_id: number;
    product?: Product;
    shipping_quantity: number;
    picked_quantity: number;
    status: string;
}

interface SalesOrder {
    id: number;
    order_number: string;
    order_date: string;
    customer?: Customer;
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

interface ShippingAddress {
    name?: string;
    contact_person?: string;
    contact_phone?: string;
    address?: string;
    district?: string;
    city?: string;
    postal_code?: string;
    delivery_notes?: string;
}

interface ShippingOrder {
    id: number;
    shipping_number: string;
    sales_order_id: number;
    sales_order?: SalesOrder;
    vehicle_id?: number;
    vehicle?: Vehicle;
    driver_id?: number;
    driver?: Driver;
    status: string;
    status_label: string;
    priority: string;
    priority_label: string;
    requested_ship_date?: string;
    notes?: string;
    shipping_notes?: string;
    shipping_address?: ShippingAddress;
    items?: ShippingOrderItem[];
}

interface DeliveryAddress {
    id: number;
    name: string;
    contact_person?: string;
    contact_phone?: string;
    address?: string;
    postal_code?: string;
    is_default: boolean;
    full_address?: string;
}

interface Props {
    shippingOrder: ShippingOrder;
    vehicles: Vehicle[];
    drivers: Driver[];
    priorities: Record<string, string>;
    deliveryAddresses: DeliveryAddress[];
}

export default function Edit({
    shippingOrder,
    vehicles: initialVehicles,
    drivers: initialDrivers,
    priorities,
    deliveryAddresses,
}: Props) {
    const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
    const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);
    const [useCustomAddress, setUseCustomAddress] = useState(
        !deliveryAddresses.length ||
        (shippingOrder.shipping_address && Object.keys(shippingOrder.shipping_address).length > 0)
    );

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

    const { data, setData, put, processing, errors } = useForm({
        vehicle_id: shippingOrder.vehicle_id?.toString() || '',
        driver_id: shippingOrder.driver_id?.toString() || '',
        priority: shippingOrder.priority,
        requested_ship_date: shippingOrder.requested_ship_date || '',
        notes: shippingOrder.notes || '',
        shipping_notes: shippingOrder.shipping_notes || '',
        delivery_address_id: '',
        shipping_address: {
            name: shippingOrder.shipping_address?.name || '',
            contact_person: shippingOrder.shipping_address?.contact_person || '',
            contact_phone: shippingOrder.shipping_address?.contact_phone || '',
            address: shippingOrder.shipping_address?.address || '',
            district: shippingOrder.shipping_address?.district || '',
            city: shippingOrder.shipping_address?.city || '',
            postal_code: shippingOrder.shipping_address?.postal_code || '',
            delivery_notes: shippingOrder.shipping_address?.delivery_notes || '',
        },
        save_address_to_customer: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('warehouse.shipping-orders.update', shippingOrder.id));
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

    const getStatusBadgeVariant = (status: string): string => {
        const variants: Record<string, string> = {
            pending: 'warning',
            picking_assigned: 'info',
            picking: 'primary',
            ready_to_ship: 'success',
            shipped: 'secondary',
            delivered: 'dark',
            cancelled: 'danger',
        };
        return variants[status] || 'secondary';
    };

    return (
        <Layout>
            <Head title={`Sevk Emri Duzenle - ${shippingOrder.shipping_number}`} />
            <div className="page-content">
                <div className="container-fluid py-4">
                    {/* Header */}
                    <div className="d-flex justify-content-between align-items-start mb-4">
                        <div>
                            <Link
                                href={route('warehouse.shipping-orders.show', shippingOrder.id)}
                                className="text-muted text-decoration-none mb-2 d-inline-block"
                            >
                                <i className="ri-arrow-left-line me-1"></i>
                                Sevk Emrine Don
                            </Link>
                            <h4 className="mb-1">
                                {shippingOrder.shipping_number} - Duzenle
                                <Badge
                                    bg={getStatusBadgeVariant(shippingOrder.status)}
                                    className="ms-2"
                                >
                                    {shippingOrder.status_label}
                                </Badge>
                            </h4>
                            <p className="text-muted mb-0">
                                Siparis: {shippingOrder.sales_order?.order_number} |
                                Musteri: {shippingOrder.sales_order?.customer?.name || shippingOrder.sales_order?.customer?.title}
                            </p>
                        </div>
                    </div>

                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col lg={8}>
                                {/* Items Preview (Read-only) */}
                                <Card className="border-0 shadow-sm mb-4">
                                    <Card.Header className="bg-white">
                                        <h5 className="mb-0">
                                            <i className="ri-list-check me-2"></i>
                                            Sevk Kalemleri
                                        </h5>
                                    </Card.Header>
                                    <Card.Body className="p-0">
                                        <Table responsive hover className="mb-0">
                                            <thead className="bg-light">
                                                <tr>
                                                    <th>Urun</th>
                                                    <th className="text-center">Sevk Miktari</th>
                                                    <th className="text-center">Toplanan</th>
                                                    <th className="text-center">Durum</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {shippingOrder.items?.map((item) => (
                                                    <tr key={item.id}>
                                                        <td>
                                                            <div className="fw-bold">{item.product?.code}</div>
                                                            <small className="text-muted">{item.product?.name}</small>
                                                        </td>
                                                        <td className="text-center">{item.shipping_quantity}</td>
                                                        <td className="text-center">{item.picked_quantity}</td>
                                                        <td className="text-center">
                                                            <Badge bg={item.status === 'picked' ? 'success' : 'secondary'}>
                                                                {item.status}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </Card.Body>
                                    <Card.Footer className="bg-light">
                                        <small className="text-muted">
                                            <i className="ri-information-line me-1"></i>
                                            Kalemler duzenlenemez. Kalem degisikligi icin sevk emrini iptal edip yeniden olusturun.
                                        </small>
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

                                {/* Delivery Address */}
                                <Card className="border-0 shadow-sm mb-4">
                                    <Card.Header className="bg-white">
                                        <h5 className="mb-0">
                                            <i className="ri-map-pin-line me-2"></i>
                                            Teslimat Adresi
                                        </h5>
                                    </Card.Header>
                                    <Card.Body>
                                        {deliveryAddresses.length > 0 && (
                                            <Form.Group className="mb-3">
                                                <Form.Label>Kayitli Adreslerden Sec</Form.Label>
                                                <Form.Select
                                                    value={data.delivery_address_id}
                                                    onChange={(e) => {
                                                        setData('delivery_address_id', e.target.value);
                                                        if (e.target.value) {
                                                            setUseCustomAddress(false);
                                                        }
                                                    }}
                                                >
                                                    <option value="">-- Adres secin veya manuel girin --</option>
                                                    {deliveryAddresses.map((addr) => (
                                                        <option key={addr.id} value={addr.id}>
                                                            {addr.name}
                                                            {addr.is_default && ' (Varsayilan)'}
                                                            {addr.address && ` - ${addr.address.substring(0, 40)}...`}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                            </Form.Group>
                                        )}

                                        <Form.Check
                                            type="checkbox"
                                            id="useCustomAddress"
                                            label="Manuel adres gir"
                                            checked={useCustomAddress}
                                            onChange={(e) => {
                                                setUseCustomAddress(e.target.checked);
                                                if (e.target.checked) {
                                                    setData('delivery_address_id', '');
                                                }
                                            }}
                                            className="mb-3"
                                        />

                                        {useCustomAddress && (
                                            <>
                                                <Row>
                                                    <Col md={6}>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label>Adres Adi</Form.Label>
                                                            <Form.Control
                                                                type="text"
                                                                value={data.shipping_address.name}
                                                                onChange={(e) => setData('shipping_address', { ...data.shipping_address, name: e.target.value })}
                                                                placeholder="Merkez Depo, Fabrika..."
                                                            />
                                                        </Form.Group>
                                                    </Col>
                                                    <Col md={6}>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label>Yetkili Kisi</Form.Label>
                                                            <Form.Control
                                                                type="text"
                                                                value={data.shipping_address.contact_person}
                                                                onChange={(e) => setData('shipping_address', { ...data.shipping_address, contact_person: e.target.value })}
                                                                placeholder="Ad Soyad"
                                                            />
                                                        </Form.Group>
                                                    </Col>
                                                </Row>

                                                <Form.Group className="mb-3">
                                                    <Form.Label>Telefon</Form.Label>
                                                    <Form.Control
                                                        type="tel"
                                                        value={data.shipping_address.contact_phone}
                                                        onChange={(e) => setData('shipping_address', { ...data.shipping_address, contact_phone: e.target.value })}
                                                        placeholder="05XX XXX XX XX"
                                                    />
                                                </Form.Group>

                                                <Form.Group className="mb-3">
                                                    <Form.Label>Adres</Form.Label>
                                                    <Form.Control
                                                        as="textarea"
                                                        rows={2}
                                                        value={data.shipping_address.address}
                                                        onChange={(e) => setData('shipping_address', { ...data.shipping_address, address: e.target.value })}
                                                        placeholder="Sokak, Mahalle, Bina No..."
                                                    />
                                                </Form.Group>

                                                <Row>
                                                    <Col md={4}>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label>Ilce</Form.Label>
                                                            <Form.Control
                                                                type="text"
                                                                value={data.shipping_address.district}
                                                                onChange={(e) => setData('shipping_address', { ...data.shipping_address, district: e.target.value })}
                                                            />
                                                        </Form.Group>
                                                    </Col>
                                                    <Col md={4}>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label>Sehir</Form.Label>
                                                            <Form.Control
                                                                type="text"
                                                                value={data.shipping_address.city}
                                                                onChange={(e) => setData('shipping_address', { ...data.shipping_address, city: e.target.value })}
                                                            />
                                                        </Form.Group>
                                                    </Col>
                                                    <Col md={4}>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label>Posta Kodu</Form.Label>
                                                            <Form.Control
                                                                type="text"
                                                                value={data.shipping_address.postal_code}
                                                                onChange={(e) => setData('shipping_address', { ...data.shipping_address, postal_code: e.target.value })}
                                                            />
                                                        </Form.Group>
                                                    </Col>
                                                </Row>

                                                <Form.Group className="mb-3">
                                                    <Form.Label>Teslimat Notlari</Form.Label>
                                                    <Form.Control
                                                        as="textarea"
                                                        rows={2}
                                                        value={data.shipping_address.delivery_notes}
                                                        onChange={(e) => setData('shipping_address', { ...data.shipping_address, delivery_notes: e.target.value })}
                                                        placeholder="Teslimat saatleri, ozel talimatlar..."
                                                    />
                                                </Form.Group>

                                                <Form.Check
                                                    type="checkbox"
                                                    id="saveAddressToCustomer"
                                                    label="Bu adresi musterinin kayitli adreslerine ekle"
                                                    checked={data.save_address_to_customer}
                                                    onChange={(e) => setData('save_address_to_customer', e.target.checked)}
                                                    className="mt-3 border-top pt-3"
                                                />
                                            </>
                                        )}
                                    </Card.Body>
                                </Card>

                                {/* Submit */}
                                <div className="d-grid gap-2">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="lg"
                                        disabled={processing}
                                    >
                                        {processing ? (
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
                                    <Link
                                        href={route('warehouse.shipping-orders.show', shippingOrder.id)}
                                        className="btn btn-outline-secondary"
                                    >
                                        Vazgec
                                    </Link>
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
