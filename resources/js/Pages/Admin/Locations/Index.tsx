import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Button, Card, Table, Form, Row, Col, Badge, Modal, Alert } from 'react-bootstrap';
import { FaEdit, FaTrash, FaPlus, FaFilter, FaMapMarkerAlt, FaBuilding } from 'react-icons/fa';
import AdminLayout from '../../../Layouts/AdminLayout';
import Pagination from '../../../Components/Common/Pagination';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

interface LocationProps {
    id: number;
    name: string;
    code?: string;
    location_type_id?: number;
    address?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    phone?: string;
    email?: string;
    website?: string;
    is_headquarters: boolean;
    is_active: boolean;
    company: {
        id: number | null;
        name: string;
    };
    location_type?: {
        id: number;
        name: string;
    };
    parent?: {
        id: number;
        name: string;
    };
}

interface CompanyProps {
    id: number;
    name: string;
}

interface LocationTypeProps {
    id: number;
    name: string;
}

interface IndexProps {
    locations: {
        data: LocationProps[];
        links: any;
        total: number;
    };
    companies: CompanyProps[];
    locationTypes: LocationTypeProps[];
    filters: {
        search?: string;
        company_id?: number;
        is_active?: boolean;
    };
}

export default function Index({ locations, companies, locationTypes, filters }: IndexProps) {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedCompany, setSelectedCompany] = useState(filters.company_id || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.is_active !== undefined ? filters.is_active.toString() : '');
    const [showFilters, setShowFilters] = useState(false);
    
    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [editingLocation, setEditingLocation] = useState<LocationProps | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Form data
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        location_type_id: '',
        company_id: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
        phone: '',
        email: '',
        website: '',
        timezone: '',
        latitude: '',
        longitude: '',
        is_headquarters: false,
        is_active: true,
        parent_id: '',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('admin.locations.index'),
            {
                search: searchTerm,
                company_id: selectedCompany,
                is_active: selectedStatus !== '' ? selectedStatus : undefined
            },
            { preserveState: true }
        );
    };

    const handleReset = () => {
        setSearchTerm('');
        setSelectedCompany('');
        setSelectedStatus('');
        router.get(route('admin.locations.index'));
    };

    const handleCreate = () => {
        setEditingLocation(null);
        setFormData({
            name: '',
            code: '',
            location_type_id: '',
            company_id: '',
            address: '',
            city: '',
            state: '',
            postal_code: '',
            country: '',
            phone: '',
            email: '',
            website: '',
            timezone: '',
            latitude: '',
            longitude: '',
            is_headquarters: false,
            is_active: true,
            parent_id: '',
        });
        setError('');
        setSuccess('');
        setShowModal(true);
    };

    const handleEdit = (location: LocationProps) => {
        setEditingLocation(location);
        setFormData({
            name: location.name || '',
            code: location.code || '',
            location_type_id: location.location_type_id?.toString() || '',
            company_id: location.company.id ? location.company.id.toString() : '',
            address: location.address || '',
            city: location.city || '',
            state: location.state || '',
            postal_code: location.postal_code || '',
            country: location.country || '',
            phone: location.phone || '',
            email: location.email || '',
            website: location.website || '',
            timezone: '',
            latitude: '',
            longitude: '',
            is_headquarters: location.is_headquarters,
            is_active: location.is_active,
            parent_id: location.parent?.id?.toString() || '',
        });
        setError('');
        setSuccess('');
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const url = editingLocation 
                ? route('admin.locations.update', editingLocation.id)
                : route('admin.locations.store');
            
            const method = editingLocation ? 'put' : 'post';
            
            const response = await axios[method](url, formData);
            
            if (response.data.success) {
                setSuccess(response.data.message);
                setTimeout(() => {
                    setShowModal(false);
                    router.reload({ only: ['locations'] });
                }, 1000);
            }
        } catch (error: any) {
            setError(error.response?.data?.message || 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this location?')) return;

        try {
            const response = await axios.delete(route('admin.locations.destroy', id));
            if (response.data.success) {
                router.reload({ only: ['locations'] });
            }
        } catch (error: any) {
            alert(error.response?.data?.message || 'An error occurred');
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    return (
        <AdminLayout>
            <Head title="Locations Management" />
            
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">
                    <FaMapMarkerAlt className="me-2" />
                    Şirket Lokasyonları
                </h2>
                <Button variant="primary" onClick={handleCreate}>
                    <FaPlus className="me-2" />
                    Yeni Lokasyon
                </Button>
            </div>

            <Card className="shadow-sm">
                <Card.Header className="bg-white border-bottom">
                    <div className="d-flex justify-content-between align-items-center">
                        <h6 className="mb-0">Lokasyon Listesi ({locations.total})</h6>
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <FaFilter className="me-1" />
                            Filtrele
                        </Button>
                    </div>

                    {showFilters && (
                        <div className="border-top pt-3 mt-3">
                            <Form onSubmit={handleSearch}>
                                <Row className="g-3">
                                    <Col md={4}>
                                        <Form.Control
                                            type="text"
                                            placeholder="Lokasyon ara..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </Col>
                                    <Col md={3}>
                                        <Form.Select
                                            value={selectedCompany}
                                            onChange={(e) => setSelectedCompany(e.target.value)}
                                        >
                                            <option value="">Tüm Şirketler</option>
                                            {companies.map(company => (
                                                <option key={company.id} value={company.id}>
                                                    {company.name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Select
                                            value={selectedStatus}
                                            onChange={(e) => setSelectedStatus(e.target.value)}
                                        >
                                            <option value="">Tüm Durumlar</option>
                                            <option value="true">Aktif</option>
                                            <option value="false">Pasif</option>
                                        </Form.Select>
                                    </Col>
                                    <Col md={2}>
                                        <div className="d-flex gap-2">
                                            <Button type="submit" variant="primary" size="sm">
                                                Ara
                                            </Button>
                                            <Button type="button" variant="outline-secondary" size="sm" onClick={handleReset}>
                                                Temizle
                                            </Button>
                                        </div>
                                    </Col>
                                </Row>
                            </Form>
                        </div>
                    )}
                </Card.Header>

                <Card.Body className="p-0">
                    <Table responsive hover className="mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>Lokasyon</th>
                                <th>Şirket</th>
                                <th>Adres</th>
                                <th>İletişim</th>
                                <th>Durum</th>
                                <th width="100">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {locations.data.map((location) => (
                                <tr key={location.id}>
                                    <td>
                                        <div>
                                            <strong>{location.name}</strong>
                                            {location.code && <div className="text-muted small">Kod: {location.code}</div>}
                                            {location.location_type && (
                                                <div className="text-muted small">Tip: {location.location_type.name}</div>
                                            )}
                                            {location.is_headquarters && (
                                                <Badge bg="warning" className="ms-1">Merkez</Badge>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="d-flex align-items-center">
                                            <FaBuilding className="text-muted me-1" />
                                            {location.company.name}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="text-muted small">
                                            {location.address && <div>{location.address}</div>}
                                            {(location.city || location.state) && (
                                                <div>{location.city}{location.state && `, ${location.state}`}</div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="text-muted small">
                                            {location.phone && <div>📞 {location.phone}</div>}
                                            {location.email && <div>✉️ {location.email}</div>}
                                        </div>
                                    </td>
                                    <td>
                                        <Badge bg={location.is_active ? 'success' : 'danger'}>
                                            {location.is_active ? 'Aktif' : 'Pasif'}
                                        </Badge>
                                    </td>
                                    <td>
                                        <div className="d-flex gap-1">
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                onClick={() => handleEdit(location)}
                                            >
                                                <FaEdit />
                                            </Button>
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => handleDelete(location.id)}
                                            >
                                                <FaTrash />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>

                {locations.links && (
                    <Card.Footer className="bg-white">
                        <Pagination links={locations.links} />
                    </Card.Footer>
                )}
            </Card>

            {/* Create/Edit Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editingLocation ? 'Lokasyon Düzenle' : 'Yeni Lokasyon'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        {error && <Alert variant="danger">{error}</Alert>}
                        {success && <Alert variant="success">{success}</Alert>}
                        
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Lokasyon Adı *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Lokasyon Kodu</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="code"
                                        value={formData.code}
                                        onChange={handleInputChange}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Şirket *</Form.Label>
                                    <Form.Select
                                        name="company_id"
                                        value={formData.company_id}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Şirket Seçin</option>
                                        {companies.map(company => (
                                            <option key={company.id} value={company.id}>
                                                {company.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Lokasyon Tipi</Form.Label>
                                    <Form.Select
                                        name="location_type_id"
                                        value={formData.location_type_id}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Lokasyon Tipi Seçin</option>
                                        {locationTypes.map(locationType => (
                                            <option key={locationType.id} value={locationType.id}>
                                                {locationType.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Adres</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Şehir</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>İl/Eyalet</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="state"
                                        value={formData.state}
                                        onChange={handleInputChange}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Posta Kodu</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="postal_code"
                                        value={formData.postal_code}
                                        onChange={handleInputChange}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Telefon</Form.Label>
                                    <Form.Control
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>E-posta</Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Web Sitesi</Form.Label>
                                    <Form.Control
                                        type="url"
                                        name="website"
                                        value={formData.website}
                                        onChange={handleInputChange}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Check
                                    type="checkbox"
                                    name="is_headquarters"
                                    label="Merkez Lokasyon"
                                    checked={formData.is_headquarters}
                                    onChange={handleInputChange}
                                />
                            </Col>
                            <Col md={6}>
                                <Form.Check
                                    type="checkbox"
                                    name="is_active"
                                    label="Aktif"
                                    checked={formData.is_active}
                                    onChange={handleInputChange}
                                />
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)} disabled={isLoading}>
                            İptal
                        </Button>
                        <Button variant="primary" type="submit" disabled={isLoading}>
                            {isLoading ? 'Kaydediliyor...' : (editingLocation ? 'Güncelle' : 'Kaydet')}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </AdminLayout>
    );
}