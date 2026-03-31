import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Button, Card, Table, Form, Row, Col, Badge, Modal, Alert } from 'react-bootstrap';
import { FaEdit, FaTrash, FaPlus, FaFilter, FaBuilding, FaMapMarkerAlt, FaUsers } from 'react-icons/fa';
import AdminLayout from '../../../Layouts/AdminLayout';
import Pagination from '../../../Components/Common/Pagination';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

interface CompanyProps {
    id: number;
    name: string;
    legal_name?: string;
    tax_id?: string;
    registration_number?: string;
    logo?: string;
    website?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    currency?: string;
    fiscal_year_start?: string;
    industry?: string;
    description?: string;
    status: boolean;
    locations_count: number;
    employees_count: number;
}

interface IndexProps {
    companies: {
        data: CompanyProps[];
        links: any;
        total: number;
    };
    filters: {
        search?: string;
        status?: boolean;
        industry?: string;
    };
}

export default function Index({ companies, filters }: IndexProps) {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status !== undefined ? filters.status.toString() : '');
    const [selectedIndustry, setSelectedIndustry] = useState(filters.industry || '');
    const [showFilters, setShowFilters] = useState(false);
    
    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [editingCompany, setEditingCompany] = useState<CompanyProps | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Form data
    const [formData, setFormData] = useState({
        name: '',
        legal_name: '',
        tax_id: '',
        registration_number: '',
        logo: '',
        website: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
        currency: 'TRY',
        fiscal_year_start: '',
        industry: '',
        description: '',
        status: true,
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('admin.companies.index'),
            {
                search: searchTerm,
                status: selectedStatus !== '' ? selectedStatus : undefined,
                industry: selectedIndustry
            },
            { preserveState: true }
        );
    };

    const handleReset = () => {
        setSearchTerm('');
        setSelectedStatus('');
        setSelectedIndustry('');
        router.get(route('admin.companies.index'));
    };

    const handleCreate = () => {
        setEditingCompany(null);
        setFormData({
            name: '',
            legal_name: '',
            tax_id: '',
            registration_number: '',
            logo: '',
            website: '',
            email: '',
            phone: '',
            address: '',
            city: '',
            state: '',
            postal_code: '',
            country: 'Türkiye',
            currency: 'TRY',
            fiscal_year_start: '',
            industry: '',
            description: '',
            status: true,
        });
        setError('');
        setSuccess('');
        setShowModal(true);
    };

    const handleEdit = (company: CompanyProps) => {
        setEditingCompany(company);
        setFormData({
            name: company.name || '',
            legal_name: company.legal_name || '',
            tax_id: company.tax_id || '',
            registration_number: company.registration_number || '',
            logo: company.logo || '',
            website: company.website || '',
            email: company.email || '',
            phone: company.phone || '',
            address: company.address || '',
            city: company.city || '',
            state: company.state || '',
            postal_code: company.postal_code || '',
            country: company.country || 'Türkiye',
            currency: company.currency || 'TRY',
            fiscal_year_start: company.fiscal_year_start || '',
            industry: company.industry || '',
            description: company.description || '',
            status: company.status,
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
            const url = editingCompany 
                ? route('admin.companies.update', editingCompany.id)
                : route('admin.companies.store');
            
            const method = editingCompany ? 'put' : 'post';
            
            const response = await axios[method](url, formData);
            
            if (response.data.success) {
                setSuccess(response.data.message);
                setTimeout(() => {
                    setShowModal(false);
                    router.reload({ only: ['companies'] });
                }, 1000);
            }
        } catch (error: any) {
            setError(error.response?.data?.message || 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this company?')) return;

        try {
            const response = await axios.delete(route('admin.companies.destroy', id));
            if (response.data.success) {
                router.reload({ only: ['companies'] });
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
            <Head title="Companies Management" />
            
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">
                    <FaBuilding className="me-2" />
                    Şirket Yönetimi
                </h2>
                <Button variant="primary" onClick={handleCreate}>
                    <FaPlus className="me-2" />
                    Yeni Şirket
                </Button>
            </div>

            <Card className="shadow-sm">
                <Card.Header className="bg-white border-bottom">
                    <div className="d-flex justify-content-between align-items-center">
                        <h6 className="mb-0">Şirket Listesi ({companies.total})</h6>
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
                                            placeholder="Şirket ara..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </Col>
                                    <Col md={3}>
                                        <Form.Control
                                            type="text"
                                            placeholder="Sektör..."
                                            value={selectedIndustry}
                                            onChange={(e) => setSelectedIndustry(e.target.value)}
                                        />
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
                                <th>Şirket</th>
                                <th>İletişim</th>
                                <th>Adres</th>
                                <th>Sektör</th>
                                <th>İstatistikler</th>
                                <th>Durum</th>
                                <th width="100">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {companies.data.map((company) => (
                                <tr key={company.id}>
                                    <td>
                                        <div>
                                            <strong>{company.name}</strong>
                                            {company.legal_name && company.legal_name !== company.name && (
                                                <div className="text-muted small">{company.legal_name}</div>
                                            )}
                                            {company.tax_id && <div className="text-muted small">Vergi No: {company.tax_id}</div>}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="text-muted small">
                                            {company.phone && <div>📞 {company.phone}</div>}
                                            {company.email && <div>✉️ {company.email}</div>}
                                            {company.website && (
                                                <div>
                                                    <a href={company.website} target="_blank" rel="noopener noreferrer">
                                                        🌐 Website
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="text-muted small">
                                            {company.address && <div>{company.address}</div>}
                                            {(company.city || company.state) && (
                                                <div>{company.city}{company.state && `, ${company.state}`}</div>
                                            )}
                                            {company.country && company.country !== 'Türkiye' && <div>{company.country}</div>}
                                        </div>
                                    </td>
                                    <td>
                                        {company.industry && (
                                            <Badge bg="info" className="text-wrap">
                                                {company.industry}
                                            </Badge>
                                        )}
                                    </td>
                                    <td>
                                        <div className="d-flex flex-column gap-1">
                                            <small className="d-flex align-items-center">
                                                <FaMapMarkerAlt className="me-1" />
                                                {company.locations_count} Lokasyon
                                            </small>
                                            <small className="d-flex align-items-center">
                                                <FaUsers className="me-1" />
                                                {company.employees_count} Çalışan
                                            </small>
                                        </div>
                                    </td>
                                    <td>
                                        <Badge bg={company.status ? 'success' : 'danger'}>
                                            {company.status ? 'Aktif' : 'Pasif'}
                                        </Badge>
                                    </td>
                                    <td>
                                        <div className="d-flex gap-1">
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                onClick={() => handleEdit(company)}
                                            >
                                                <FaEdit />
                                            </Button>
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => handleDelete(company.id)}
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

                {companies.links && (
                    <Card.Footer className="bg-white">
                        <Pagination links={companies.links} />
                    </Card.Footer>
                )}
            </Card>

            {/* Create/Edit Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editingCompany ? 'Şirket Düzenle' : 'Yeni Şirket'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        {error && <Alert variant="danger">{error}</Alert>}
                        {success && <Alert variant="success">{success}</Alert>}
                        
                        <Row className="g-3">
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Şirket Adı *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Yasal Ünvan</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="legal_name"
                                        value={formData.legal_name}
                                        onChange={handleInputChange}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Vergi Numarası</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="tax_id"
                                        value={formData.tax_id}
                                        onChange={handleInputChange}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Ticaret Sicil No</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="registration_number"
                                        value={formData.registration_number}
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
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Web Sitesi</Form.Label>
                                    <Form.Control
                                        type="url"
                                        name="website"
                                        value={formData.website}
                                        onChange={handleInputChange}
                                        placeholder="https://example.com"
                                    />
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
                                    <Form.Label>Ülke</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="country"
                                        value={formData.country}
                                        onChange={handleInputChange}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Para Birimi</Form.Label>
                                    <Form.Select
                                        name="currency"
                                        value={formData.currency}
                                        onChange={handleInputChange}
                                    >
                                        <option value="TRY">TRY - Türk Lirası</option>
                                        <option value="USD">USD - US Dollar</option>
                                        <option value="EUR">EUR - Euro</option>
                                        <option value="GBP">GBP - British Pound</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Sektör</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="industry"
                                        value={formData.industry}
                                        onChange={handleInputChange}
                                        placeholder="Örn: Teknoloji, İmalat, Hizmet"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Açıklama</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Check
                                    type="checkbox"
                                    name="status"
                                    label="Aktif"
                                    checked={formData.status}
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
                            {isLoading ? 'Kaydediliyor...' : (editingCompany ? 'Güncelle' : 'Kaydet')}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </AdminLayout>
    );
}