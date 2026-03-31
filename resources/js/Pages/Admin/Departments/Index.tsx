import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Button, Card, Table, Form, Row, Col, Badge, Modal, Alert } from 'react-bootstrap';
import { FaEdit, FaTrash, FaPlus, FaFilter, FaUsers, FaBuilding, FaSitemap, FaMapMarkerAlt, FaDollarSign } from 'react-icons/fa';
import AdminLayout from '../../../Layouts/AdminLayout';
import Pagination from '../../../Components/Common/Pagination';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

interface CompanyProps {
    id: number;
    name: string;
}

interface LocationProps {
    id: number;
    name: string;
    company?: CompanyProps;
}

interface EmployeeProps {
    id: number;
    user?: {
        id: number;
        name: string;
        email: string;
    };
}

interface DepartmentProps {
    id: number;
    name: string;
    code?: string;
    description?: string;
    company?: CompanyProps;
    parent?: {
        id: number;
        name: string;
    };
    location?: LocationProps;
    manager?: EmployeeProps;
    budget?: number;
    is_active: boolean;
    employees_count: number;
    users_count: number;
    positions_count: number;
    children_count: number;
}

interface IndexProps {
    departments: {
        data: DepartmentProps[];
        links: any;
        total: number;
    };
    companies: CompanyProps[];
    locations: LocationProps[];
    parentDepartments: DepartmentProps[];
    employees: EmployeeProps[];
    filters: {
        search?: string;
        company_id?: number;
        location_id?: number;
        parent_id?: number;
        is_active?: boolean;
    };
}

export default function Index({ departments, companies, locations, parentDepartments, employees, filters }: IndexProps) {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedCompany, setSelectedCompany] = useState(filters.company_id || '');
    const [selectedLocation, setSelectedLocation] = useState(filters.location_id || '');
    const [selectedParent, setSelectedParent] = useState(filters.parent_id || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.is_active !== undefined ? filters.is_active.toString() : '');
    const [showFilters, setShowFilters] = useState(false);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState<DepartmentProps | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form data
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        company_id: '',
        parent_id: '',
        manager_id: '',
        location_id: '',
        budget: '',
        is_active: true,
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('admin.departments.index'),
            {
                search: searchTerm,
                company_id: selectedCompany,
                location_id: selectedLocation,
                parent_id: selectedParent,
                is_active: selectedStatus !== '' ? selectedStatus : undefined
            },
            { preserveState: true }
        );
    };

    const handleReset = () => {
        setSearchTerm('');
        setSelectedCompany('');
        setSelectedLocation('');
        setSelectedParent('');
        setSelectedStatus('');
        router.get(route('admin.departments.index'));
    };

    const handleCreate = () => {
        setEditingDepartment(null);
        setFormData({
            name: '',
            code: '',
            description: '',
            company_id: '',
            parent_id: '',
            manager_id: '',
            location_id: '',
            budget: '',
            is_active: true,
        });
        setError('');
        setSuccess('');
        setShowModal(true);
    };

    const handleEdit = (department: DepartmentProps) => {
        setEditingDepartment(department);
        setFormData({
            name: department.name || '',
            code: department.code || '',
            description: department.description || '',
            company_id: department.company?.id?.toString() || '',
            parent_id: department.parent?.id?.toString() || '',
            manager_id: department.manager?.id?.toString() || '',
            location_id: department.location?.id?.toString() || '',
            budget: department.budget?.toString() || '',
            is_active: department.is_active,
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
            const url = editingDepartment
                ? route('admin.departments.update', editingDepartment.id)
                : route('admin.departments.store');

            const method = editingDepartment ? 'put' : 'post';

            const response = await axios[method](url, formData);

            if (response.data.success) {
                setSuccess(response.data.message);
                setTimeout(() => {
                    setShowModal(false);
                    router.reload({ only: ['departments'] });
                }, 1000);
            }
        } catch (error: any) {
            if (error.response?.data?.errors) {
                const errorMessages = Object.values(error.response.data.errors).flat();
                setError(errorMessages.join(', '));
            } else {
                setError(error.response?.data?.message || 'An error occurred');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Bu departmanı silmek istediğinizden emin misiniz?')) return;

        try {
            const response = await axios.delete(route('admin.departments.destroy', id));
            if (response.data.success) {
                router.reload({ only: ['departments'] });
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

    const formatBudget = (budget?: number) => {
        if (!budget) return null;
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(budget);
    };

    return (
        <AdminLayout>
            <Head title="Departments Management" />

            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">
                    <FaSitemap className="me-2" />
                    Departman Yönetimi
                </h2>
                <Button variant="primary" onClick={handleCreate}>
                    <FaPlus className="me-2" />
                    Yeni Departman
                </Button>
            </div>

            <Card className="shadow-sm">
                <Card.Header className="bg-white border-bottom">
                    <div className="d-flex justify-content-between align-items-center">
                        <h6 className="mb-0">Departman Listesi ({departments.total})</h6>
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
                                    <Col md={3}>
                                        <Form.Control
                                            type="text"
                                            placeholder="Departman ara..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </Col>
                                    <Col md={2}>
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
                                    <Col md={2}>
                                        <Form.Select
                                            value={selectedLocation}
                                            onChange={(e) => setSelectedLocation(e.target.value)}
                                        >
                                            <option value="">Tüm Lokasyonlar</option>
                                            {locations.map(location => (
                                                <option key={location.id} value={location.id}>
                                                    {location.name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Col>
                                    <Col md={2}>
                                        <Form.Select
                                            value={selectedParent}
                                            onChange={(e) => setSelectedParent(e.target.value)}
                                        >
                                            <option value="">Tüm Üst Departmanlar</option>
                                            {parentDepartments.map(dept => (
                                                <option key={dept.id} value={dept.id}>
                                                    {dept.name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Col>
                                    <Col md={2}>
                                        <Form.Select
                                            value={selectedStatus}
                                            onChange={(e) => setSelectedStatus(e.target.value)}
                                        >
                                            <option value="">Tüm Durumlar</option>
                                            <option value="true">Aktif</option>
                                            <option value="false">Pasif</option>
                                        </Form.Select>
                                    </Col>
                                    <Col md={1}>
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
                                <th>Departman</th>
                                <th>Şirket & Lokasyon</th>
                                <th>Üst Departman</th>
                                <th>Yönetici</th>
                                <th>Bütçe</th>
                                <th>İstatistikler</th>
                                <th>Durum</th>
                                <th width="100">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {departments.data.map((department) => (
                                <tr key={department.id}>
                                    <td>
                                        <div>
                                            <strong className="d-flex align-items-center">
                                                <FaSitemap className="text-primary me-1" />
                                                {department.name}
                                            </strong>
                                            {department.code && <div className="text-muted small">Kod: {department.code}</div>}
                                            {department.description && (
                                                <div className="text-muted small" title={department.description}>
                                                    {department.description.length > 40
                                                        ? department.description.substring(0, 40) + '...'
                                                        : department.description
                                                    }
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div>
                                            {department.company && (
                                                <div className="d-flex align-items-center">
                                                    <FaBuilding className="text-muted me-1" />
                                                    <small>{department.company.name}</small>
                                                </div>
                                            )}
                                            {department.location && (
                                                <div className="d-flex align-items-center">
                                                    <FaMapMarkerAlt className="text-muted me-1" />
                                                    <small>{department.location.name}</small>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        {department.parent ? (
                                            <Badge bg="info" className="text-wrap">
                                                {department.parent.name}
                                            </Badge>
                                        ) : (
                                            <Badge bg="primary">Ana Departman</Badge>
                                        )}
                                    </td>
                                    <td>
                                        {department.manager?.user ? (
                                            <div className="text-muted small">
                                                <strong>{department.manager.user.name}</strong>
                                                <div>{department.manager.user.email}</div>
                                            </div>
                                        ) : (
                                            <span className="text-muted">Atanmamış</span>
                                        )}
                                    </td>
                                    <td>
                                        {department.budget ? (
                                            <div className="d-flex align-items-center">
                                                <FaDollarSign className="text-success me-1" />
                                                <small>{formatBudget(department.budget)}</small>
                                            </div>
                                        ) : (
                                            <span className="text-muted">-</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="d-flex flex-column gap-1">
                                            <small className="d-flex align-items-center">
                                                <FaUsers className="me-1" />
                                                {department.employees_count} Çalışan
                                            </small>
                                            <small className="d-flex align-items-center">
                                                <FaUsers className="me-1" />
                                                {department.users_count} Kullanıcı
                                            </small>
                                            <small className="d-flex align-items-center">
                                                <FaSitemap className="me-1" />
                                                {department.positions_count} Pozisyon
                                            </small>
                                            {department.children_count > 0 && (
                                                <small className="d-flex align-items-center">
                                                    <FaSitemap className="me-1" />
                                                    {department.children_count} Alt Departman
                                                </small>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <Badge bg={department.is_active ? 'success' : 'danger'}>
                                            {department.is_active ? 'Aktif' : 'Pasif'}
                                        </Badge>
                                    </td>
                                    <td>
                                        <div className="d-flex gap-1">
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                onClick={() => handleEdit(department)}
                                                title="Düzenle"
                                            >
                                                <FaEdit />
                                            </Button>
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => handleDelete(department.id)}
                                                title="Sil"
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

                {departments.links && (
                    <Card.Footer className="bg-white">
                        <Pagination links={departments.links} />
                    </Card.Footer>
                )}
            </Card>

            {/* Create/Edit Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editingDepartment ? 'Departman Düzenle' : 'Yeni Departman'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        {error && <Alert variant="danger">{error}</Alert>}
                        {success && <Alert variant="success">{success}</Alert>}

                        <Row className="g-3">
                            <Col md={8}>
                                <Form.Group>
                                    <Form.Label>Departman Adı *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Departman Kodu</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="code"
                                        value={formData.code}
                                        onChange={handleInputChange}
                                        placeholder="Örn: IT-001"
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
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Şirket</Form.Label>
                                    <Form.Select
                                        name="company_id"
                                        value={formData.company_id}
                                        onChange={handleInputChange}
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
                                    <Form.Label>Lokasyon</Form.Label>
                                    <Form.Select
                                        name="location_id"
                                        value={formData.location_id}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Lokasyon Seçin</option>
                                        {locations.map(location => (
                                            <option key={location.id} value={location.id}>
                                                {location.name}
                                                {location.company && ` (${location.company.name})`}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Üst Departman</Form.Label>
                                    <Form.Select
                                        name="parent_id"
                                        value={formData.parent_id}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Ana Departman</option>
                                        {parentDepartments
                                            .filter(dept => editingDepartment ? dept.id !== editingDepartment.id : true)
                                            .map(dept => (
                                            <option key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Departman Yöneticisi</Form.Label>
                                    <Form.Select
                                        name="manager_id"
                                        value={formData.manager_id}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Yönetici Seçin</option>
                                        {employees.map(employee => (
                                            <option key={employee.id} value={employee.id}>
                                                {employee.user?.name || `Employee ${employee.id}`}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Bütçe (TRY)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="budget"
                                        value={formData.budget}
                                        onChange={handleInputChange}
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="d-flex align-items-end h-100 pb-2">
                                    <Form.Check
                                        type="checkbox"
                                        name="is_active"
                                        label="Aktif"
                                        checked={formData.is_active}
                                        onChange={handleInputChange}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)} disabled={isLoading}>
                            İptal
                        </Button>
                        <Button variant="primary" type="submit" disabled={isLoading}>
                            {isLoading ? 'Kaydediliyor...' : (editingDepartment ? 'Güncelle' : 'Kaydet')}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </AdminLayout>
    );
}
