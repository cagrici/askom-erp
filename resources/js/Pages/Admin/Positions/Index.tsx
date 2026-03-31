import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Button, Card, Table, Form, Row, Col, Badge, Modal, Alert } from 'react-bootstrap';
import { FaEdit, FaTrash, FaPlus, FaFilter, FaUsers, FaBuilding, FaCrown, FaEye, FaUserPlus } from 'react-icons/fa';
import AdminLayout from '../../../Layouts/AdminLayout';
import Pagination from '../../../Components/Common/Pagination';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

interface DepartmentProps {
    id: number;
    name: string;
}

interface PositionProps {
    id: number;
    title: string;
    code?: string;
    description?: string;
    department?: DepartmentProps;
    level?: number;
    is_management: boolean;
    min_salary?: number;
    max_salary?: number;
    currency?: string;
    status: boolean;
    employees_count: number;
    users_count: number;
}

interface IndexProps {
    positions: {
        data: PositionProps[];
        links: any;
        total: number;
    };
    departments: DepartmentProps[];
    filters: {
        search?: string;
        department_id?: number;
        is_management?: boolean;
        status?: boolean;
    };
}

export default function Index({ positions, departments, filters }: IndexProps) {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedDepartment, setSelectedDepartment] = useState(filters.department_id || '');
    const [selectedManagement, setSelectedManagement] = useState(filters.is_management !== undefined ? filters.is_management.toString() : '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status !== undefined ? filters.status.toString() : '');
    const [showFilters, setShowFilters] = useState(false);
    
    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [editingPosition, setEditingPosition] = useState<PositionProps | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Employee management modal states
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);
    const [selectedPosition, setSelectedPosition] = useState<PositionProps | null>(null);
    const [activeTab, setActiveTab] = useState<'employees' | 'users'>('employees');
    const [assignedEmployees, setAssignedEmployees] = useState<any[]>([]);
    const [assignedUsers, setAssignedUsers] = useState<any[]>([]);
    const [availableEmployees, setAvailableEmployees] = useState<any[]>([]);
    const [availableUsers, setAvailableUsers] = useState<any[]>([]);
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
    const [employeeSearch, setEmployeeSearch] = useState('');
    const [userSearch, setUserSearch] = useState('');
    
    // Form data
    const [formData, setFormData] = useState({
        title: '',
        code: '',
        description: '',
        department_id: '',
        level: '',
        is_management: false,
        min_salary: '',
        max_salary: '',
        currency: 'TRY',
        status: true,
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('admin.positions.index'),
            {
                search: searchTerm,
                department_id: selectedDepartment,
                is_management: selectedManagement !== '' ? selectedManagement : undefined,
                status: selectedStatus !== '' ? selectedStatus : undefined
            },
            { preserveState: true }
        );
    };

    const handleReset = () => {
        setSearchTerm('');
        setSelectedDepartment('');
        setSelectedManagement('');
        setSelectedStatus('');
        router.get(route('admin.positions.index'));
    };

    const handleCreate = () => {
        setEditingPosition(null);
        setFormData({
            title: '',
            code: '',
            description: '',
            department_id: '',
            level: '',
            is_management: false,
            min_salary: '',
            max_salary: '',
            currency: 'TRY',
            status: true,
        });
        setError('');
        setSuccess('');
        setShowModal(true);
    };

    const handleEdit = (position: PositionProps) => {
        setEditingPosition(position);
        setFormData({
            title: position.title || '',
            code: position.code || '',
            description: position.description || '',
            department_id: position.department?.id?.toString() || '',
            level: position.level?.toString() || '',
            is_management: position.is_management,
            min_salary: position.min_salary?.toString() || '',
            max_salary: position.max_salary?.toString() || '',
            currency: position.currency || 'TRY',
            status: position.status,
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
            const url = editingPosition 
                ? route('admin.positions.update', editingPosition.id)
                : route('admin.positions.store');
            
            const method = editingPosition ? 'put' : 'post';
            
            const response = await axios[method](url, formData);
            
            if (response.data.success) {
                setSuccess(response.data.message);
                setTimeout(() => {
                    setShowModal(false);
                    router.reload({ only: ['positions'] });
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
        if (!confirm('Bu pozisyonu silmek istediğinizden emin misiniz?')) return;

        try {
            const response = await axios.delete(route('admin.positions.destroy', id));
            if (response.data.success) {
                router.reload({ only: ['positions'] });
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

    const getSalaryRange = (position: PositionProps) => {
        if (!position.min_salary && !position.max_salary) return null;
        
        const currency = position.currency || 'TRY';
        if (position.min_salary && position.max_salary) {
            return `${position.min_salary.toLocaleString()} - ${position.max_salary.toLocaleString()} ${currency}`;
        }
        if (position.min_salary) {
            return `${position.min_salary.toLocaleString()}+ ${currency}`;
        }
        if (position.max_salary) {
            return `Max ${position.max_salary.toLocaleString()} ${currency}`;
        }
        return null;
    };

    // Employee management functions
    const handleManageEmployees = async (position: PositionProps) => {
        setSelectedPosition(position);
        setActiveTab('employees');
        setShowEmployeeModal(true);
        await loadPositionData(position);
    };

    const loadPositionData = async (position: PositionProps) => {
        try {
            // Load assigned employees
            const employeesResponse = await axios.get(route('admin.positions.employees', position.id));
            setAssignedEmployees(employeesResponse.data.data || []);

            // Load assigned users
            const usersResponse = await axios.get(route('admin.positions.users', position.id));
            setAssignedUsers(usersResponse.data.data || []);

            // Load available employees
            const availableEmployeesResponse = await axios.get(route('admin.positions.available-employees', position.id));
            setAvailableEmployees(availableEmployeesResponse.data.data || []);

            // Load available users
            const availableUsersResponse = await axios.get(route('admin.positions.available-users', position.id));
            setAvailableUsers(availableUsersResponse.data.data || []);
        } catch (error) {
            console.error('Error loading position data:', error);
        }
    };

    const handleAssignEmployees = async () => {
        if (selectedEmployeeIds.length === 0 || !selectedPosition) return;

        try {
            const response = await axios.post(route('admin.positions.assign-employees', selectedPosition.id), {
                employee_ids: selectedEmployeeIds
            });

            if (response.data.success) {
                setSuccess(response.data.message);
                setSelectedEmployeeIds([]);
                await loadPositionData(selectedPosition);
                router.reload({ only: ['positions'] });
            }
        } catch (error: any) {
            setError(error.response?.data?.message || 'An error occurred');
        }
    };

    const handleAssignUsers = async () => {
        if (selectedUserIds.length === 0 || !selectedPosition) return;

        try {
            const response = await axios.post(route('admin.positions.assign-users', selectedPosition.id), {
                user_ids: selectedUserIds
            });

            if (response.data.success) {
                setSuccess(response.data.message);
                setSelectedUserIds([]);
                await loadPositionData(selectedPosition);
                router.reload({ only: ['positions'] });
            }
        } catch (error: any) {
            setError(error.response?.data?.message || 'An error occurred');
        }
    };

    const handleRemoveEmployee = async (employee: any) => {
        if (!selectedPosition) return;

        if (!confirm('Bu çalışanı pozisyondan çıkarmak istediğinizden emin misiniz?')) return;

        try {
            const response = await axios.delete(route('admin.positions.remove-employee', [selectedPosition.id, employee.id]));
            
            if (response.data.success) {
                await loadPositionData(selectedPosition);
                router.reload({ only: ['positions'] });
            }
        } catch (error: any) {
            alert(error.response?.data?.message || 'An error occurred');
        }
    };

    const handleRemoveUser = async (user: any) => {
        if (!selectedPosition) return;

        if (!confirm('Bu kullanıcıyı pozisyondan çıkarmak istediğinizden emin misiniz?')) return;

        try {
            const response = await axios.delete(route('admin.positions.remove-user', [selectedPosition.id, user.id]));
            
            if (response.data.success) {
                await loadPositionData(selectedPosition);
                router.reload({ only: ['positions'] });
            }
        } catch (error: any) {
            alert(error.response?.data?.message || 'An error occurred');
        }
    };

    const handleEmployeeSelection = (employeeId: number) => {
        setSelectedEmployeeIds(prev => 
            prev.includes(employeeId) 
                ? prev.filter(id => id !== employeeId)
                : [...prev, employeeId]
        );
    };

    const handleUserSelection = (userId: number) => {
        setSelectedUserIds(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    return (
        <AdminLayout>
            <Head title="Positions Management" />
            
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">
                    <FaBuilding className="me-2" />
                    Organizasyon Pozisyonları
                </h2>
                <Button variant="primary" onClick={handleCreate}>
                    <FaPlus className="me-2" />
                    Yeni Pozisyon
                </Button>
            </div>

            <Card className="shadow-sm">
                <Card.Header className="bg-white border-bottom">
                    <div className="d-flex justify-content-between align-items-center">
                        <h6 className="mb-0">Pozisyon Listesi ({positions.total})</h6>
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
                                            placeholder="Pozisyon ara..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </Col>
                                    <Col md={3}>
                                        <Form.Select
                                            value={selectedDepartment}
                                            onChange={(e) => setSelectedDepartment(e.target.value)}
                                        >
                                            <option value="">Tüm Departmanlar</option>
                                            {departments.map(dept => (
                                                <option key={dept.id} value={dept.id}>
                                                    {dept.name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Col>
                                    <Col md={2}>
                                        <Form.Select
                                            value={selectedManagement}
                                            onChange={(e) => setSelectedManagement(e.target.value)}
                                        >
                                            <option value="">Tüm Pozisyonlar</option>
                                            <option value="true">Yönetici</option>
                                            <option value="false">Personel</option>
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
                                <th>Pozisyon</th>
                                <th>Departman</th>
                                <th>Seviye & Tip</th>
                                <th>Maaş Aralığı</th>
                                <th>Atamalar</th>
                                <th>Durum</th>
                                <th width="100">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {positions.data.map((position) => (
                                <tr key={position.id}>
                                    <td>
                                        <div>
                                            <strong className="d-flex align-items-center">
                                                {position.is_management && <FaCrown className="text-warning me-1" />}
                                                {position.title}
                                            </strong>
                                            {position.code && <div className="text-muted small">Kod: {position.code}</div>}
                                            {position.description && (
                                                <div className="text-muted small" title={position.description}>
                                                    {position.description.length > 50 
                                                        ? position.description.substring(0, 50) + '...'
                                                        : position.description
                                                    }
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        {position.department?.name ? (
                                            <div className="d-flex align-items-center">
                                                <FaBuilding className="text-muted me-1" />
                                                {position.department.name}
                                            </div>
                                        ) : (
                                            <span className="text-muted">Tanımsız</span>
                                        )}
                                    </td>
                                    <td>
                                        <div>
                                            {position.level && (
                                                <Badge bg="info" className="me-1">
                                                    Seviye {position.level}
                                                </Badge>
                                            )}
                                            <Badge bg={position.is_management ? 'warning' : 'secondary'}>
                                                {position.is_management ? 'Yönetici' : 'Personel'}
                                            </Badge>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="text-muted small">
                                            {getSalaryRange(position) || 'Belirtilmemiş'}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="d-flex flex-column gap-1">
                                            <small className="d-flex align-items-center">
                                                <FaUsers className="me-1" />
                                                {position.employees_count} Çalışan
                                            </small>
                                            <small className="d-flex align-items-center">
                                                <FaUsers className="me-1" />
                                                {position.users_count} Kullanıcı
                                            </small>
                                        </div>
                                    </td>
                                    <td>
                                        <Badge bg={position.status ? 'success' : 'danger'}>
                                            {position.status ? 'Aktif' : 'Pasif'}
                                        </Badge>
                                    </td>
                                    <td>
                                        <div className="d-flex gap-1">
                                            <Button
                                                variant="outline-info"
                                                size="sm"
                                                onClick={() => handleManageEmployees(position)}
                                                title="Çalışan Yönetimi"
                                            >
                                                <FaUsers />
                                            </Button>
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                onClick={() => handleEdit(position)}
                                                title="Düzenle"
                                            >
                                                <FaEdit />
                                            </Button>
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => handleDelete(position.id)}
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

                {positions.links && (
                    <Card.Footer className="bg-white">
                        <Pagination links={positions.links} />
                    </Card.Footer>
                )}
            </Card>

            {/* Create/Edit Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editingPosition ? 'Pozisyon Düzenle' : 'Yeni Pozisyon'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        {error && <Alert variant="danger">{error}</Alert>}
                        {success && <Alert variant="success">{success}</Alert>}
                        
                        <Row className="g-3">
                            <Col md={8}>
                                <Form.Group>
                                    <Form.Label>Pozisyon Adı *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Pozisyon Kodu</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="code"
                                        value={formData.code}
                                        onChange={handleInputChange}
                                        placeholder="Örn: MGR-001"
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
                                    <Form.Label>Departman</Form.Label>
                                    <Form.Select
                                        name="department_id"
                                        value={formData.department_id}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Departman Seçin</option>
                                        {departments.map(dept => (
                                            <option key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Seviye (1-10)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="level"
                                        value={formData.level}
                                        onChange={handleInputChange}
                                        min="1"
                                        max="10"
                                        placeholder="1"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Minimum Maaş</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="min_salary"
                                        value={formData.min_salary}
                                        onChange={handleInputChange}
                                        min="0"
                                        step="0.01"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Maksimum Maaş</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="max_salary"
                                        value={formData.max_salary}
                                        onChange={handleInputChange}
                                        min="0"
                                        step="0.01"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
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
                            <Col md={6}>
                                <Form.Check
                                    type="checkbox"
                                    name="is_management"
                                    label="Yönetici Pozisyonu"
                                    checked={formData.is_management}
                                    onChange={handleInputChange}
                                />
                            </Col>
                            <Col md={6}>
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
                            {isLoading ? 'Kaydediliyor...' : (editingPosition ? 'Güncelle' : 'Kaydet')}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Employee Management Modal */}
            <Modal show={showEmployeeModal} onHide={() => setShowEmployeeModal(false)} size="xl">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <FaUsers className="me-2" />
                        Çalışan Yönetimi - {selectedPosition?.title}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success">{success}</Alert>}

                    {/* Tabs */}
                    <ul className="nav nav-tabs mb-3">
                        <li className="nav-item">
                            <button 
                                className={`nav-link ${activeTab === 'employees' ? 'active' : ''}`}
                                onClick={() => setActiveTab('employees')}
                            >
                                <FaUsers className="me-1" />
                                Çalışanlar ({assignedEmployees.length})
                            </button>
                        </li>
                        <li className="nav-item">
                            <button 
                                className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
                                onClick={() => setActiveTab('users')}
                            >
                                <FaUsers className="me-1" />
                                Kullanıcılar ({assignedUsers.length})
                            </button>
                        </li>
                    </ul>

                    {/* Employees Tab */}
                    {activeTab === 'employees' && (
                        <Row>
                            <Col md={6}>
                                <Card>
                                    <Card.Header>
                                        <h6 className="mb-0">Atanmış Çalışanlar ({assignedEmployees.length})</h6>
                                    </Card.Header>
                                    <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                        {assignedEmployees.length === 0 ? (
                                            <p className="text-muted text-center">Bu pozisyona atanmış çalışan bulunmuyor.</p>
                                        ) : (
                                            <div className="list-group list-group-flush">
                                                {assignedEmployees.map((employee) => (
                                                    <div key={employee.id} className="list-group-item d-flex justify-content-between align-items-center">
                                                        <div>
                                                            <strong>{employee.user?.name || 'N/A'}</strong>
                                                            <div className="text-muted small">
                                                                {employee.user?.email}
                                                                {employee.department && ` • ${employee.department.name}`}
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={() => handleRemoveEmployee(employee)}
                                                        >
                                                            <FaTrash />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={6}>
                                <Card>
                                    <Card.Header className="d-flex justify-content-between align-items-center">
                                        <h6 className="mb-0">Çalışan Ekle</h6>
                                        {selectedEmployeeIds.length > 0 && (
                                            <Button 
                                                variant="success" 
                                                size="sm"
                                                onClick={handleAssignEmployees}
                                            >
                                                <FaUserPlus className="me-1" />
                                                Seçilenleri Ata ({selectedEmployeeIds.length})
                                            </Button>
                                        )}
                                    </Card.Header>
                                    <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                        <Form.Control
                                            type="text"
                                            placeholder="Çalışan ara..."
                                            value={employeeSearch}
                                            onChange={(e) => setEmployeeSearch(e.target.value)}
                                            className="mb-3"
                                        />
                                        {availableEmployees.length === 0 ? (
                                            <p className="text-muted text-center">Atanabilecek çalışan bulunmuyor.</p>
                                        ) : (
                                            <div className="list-group list-group-flush">
                                                {availableEmployees
                                                    .filter(employee => 
                                                        employee.user?.name?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
                                                        employee.user?.email?.toLowerCase().includes(employeeSearch.toLowerCase())
                                                    )
                                                    .map((employee) => (
                                                    <div key={employee.id} className="list-group-item">
                                                        <Form.Check
                                                            type="checkbox"
                                                            id={`employee-${employee.id}`}
                                                            label={
                                                                <div>
                                                                    <strong>{employee.user?.name || 'N/A'}</strong>
                                                                    <div className="text-muted small">
                                                                        {employee.user?.email}
                                                                        {employee.department && ` • ${employee.department.name}`}
                                                                    </div>
                                                                </div>
                                                            }
                                                            checked={selectedEmployeeIds.includes(employee.id)}
                                                            onChange={() => handleEmployeeSelection(employee.id)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    )}

                    {/* Users Tab */}
                    {activeTab === 'users' && (
                        <Row>
                            <Col md={6}>
                                <Card>
                                    <Card.Header>
                                        <h6 className="mb-0">Atanmış Kullanıcılar ({assignedUsers.length})</h6>
                                    </Card.Header>
                                    <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                        {assignedUsers.length === 0 ? (
                                            <p className="text-muted text-center">Bu pozisyona atanmış kullanıcı bulunmuyor.</p>
                                        ) : (
                                            <div className="list-group list-group-flush">
                                                {assignedUsers.map((user) => (
                                                    <div key={user.id} className="list-group-item d-flex justify-content-between align-items-center">
                                                        <div>
                                                            <strong>{user.name}</strong>
                                                            <div className="text-muted small">
                                                                {user.email}
                                                                {user.department && ` • ${user.department.name}`}
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={() => handleRemoveUser(user)}
                                                        >
                                                            <FaTrash />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={6}>
                                <Card>
                                    <Card.Header className="d-flex justify-content-between align-items-center">
                                        <h6 className="mb-0">Kullanıcı Ekle</h6>
                                        {selectedUserIds.length > 0 && (
                                            <Button 
                                                variant="success" 
                                                size="sm"
                                                onClick={handleAssignUsers}
                                            >
                                                <FaUserPlus className="me-1" />
                                                Seçilenleri Ata ({selectedUserIds.length})
                                            </Button>
                                        )}
                                    </Card.Header>
                                    <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                        <Form.Control
                                            type="text"
                                            placeholder="Kullanıcı ara..."
                                            value={userSearch}
                                            onChange={(e) => setUserSearch(e.target.value)}
                                            className="mb-3"
                                        />
                                        {availableUsers.length === 0 ? (
                                            <p className="text-muted text-center">Atanabilecek kullanıcı bulunmuyor.</p>
                                        ) : (
                                            <div className="list-group list-group-flush">
                                                {availableUsers
                                                    .filter(user => 
                                                        user.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                                                        user.email?.toLowerCase().includes(userSearch.toLowerCase())
                                                    )
                                                    .map((user) => (
                                                    <div key={user.id} className="list-group-item">
                                                        <Form.Check
                                                            type="checkbox"
                                                            id={`user-${user.id}`}
                                                            label={
                                                                <div>
                                                                    <strong>{user.name}</strong>
                                                                    <div className="text-muted small">
                                                                        {user.email}
                                                                        {user.department && ` • ${user.department.name}`}
                                                                    </div>
                                                                </div>
                                                            }
                                                            checked={selectedUserIds.includes(user.id)}
                                                            onChange={() => handleUserSelection(user.id)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowEmployeeModal(false)}>
                        Kapat
                    </Button>
                </Modal.Footer>
            </Modal>
        </AdminLayout>
    );
}