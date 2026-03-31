import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';
import axios from 'axios';

interface NewGroupModalProps {
    show: boolean;
    onHide: () => void;
    onSuccess?: (groupId: number) => void;
}

interface Department {
    id: number;
    name: string;
}

interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
}

interface WorkCategory {
    id: number;
    name: string;
    color?: string;
    icon?: string;
}

const NewGroupModal: React.FC<NewGroupModalProps> = ({ show, onHide, onSuccess }) => {
    const [groupName, setGroupName] = useState('');
    const [groupType, setGroupType] = useState<'department' | 'private' | 'project'>('private');
    const [description, setDescription] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState<number | ''>('');
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [workCategories, setWorkCategories] = useState<WorkCategory[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (show) {
            fetchDepartments();
            fetchUsers();
            fetchWorkCategories();
        }
    }, [show]);

    const fetchDepartments = async () => {
        try {
            const response = await axios.get('/api/departments');
            setDepartments(response.data);
        } catch (error) {
            console.error('Failed to fetch departments:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await axios.get('/api/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    const fetchWorkCategories = async () => {
        try {
            const response = await axios.get('/api/work-categories');
            setWorkCategories(response.data);
        } catch (error) {
            console.error('Failed to fetch work categories:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Validation - Grup adı zorunlu
            if (!groupName.trim()) {
                setError('İş talebi başlığı zorunludur.');
                setLoading(false);
                return;
            }
            
            // Validation - Açıklama zorunlu
            if (!description.trim()) {
                setError('İş talebi açıklaması zorunludur.');
                setLoading(false);
                return;
            }
            
            if ((groupType === 'private' || groupType === 'project') && selectedUsers.length === 0) {
                setError('Lütfen en az bir kişi seçin.');
                setLoading(false);
                return;
            }
            
            if (groupType === 'department' && !selectedDepartment) {
                setError('Lütfen bir departman seçin.');
                setLoading(false);
                return;
            }

            const data: any = {
                name: groupName.trim(),
                type: groupType,
                description: description.trim(),
            };

            if (groupType === 'department' && selectedDepartment) {
                data.department_id = selectedDepartment;
            } else if (groupType === 'private' || groupType === 'project') {
                data.participant_ids = selectedUsers;
            }
            
            if (selectedCategory) {
                data.category_id = selectedCategory;
            }

            const response = await axios.post('/api/messages/groups', data);
            const newGroup = response.data;
            
            if (onSuccess) {
                onSuccess(newGroup.id);
            }
            
            handleClose();
        } catch (error: any) {
            setError(error.message || 'Grup oluşturulurken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setGroupName('');
        setGroupType('private');
        setDescription('');
        setSelectedDepartment('');
        setSelectedUsers([]);
        setSelectedCategory('');
        setError('');
        onHide();
    };

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Yeni İş Talebi Oluştur</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    
                    <Alert variant="info" className="mb-3">
                        <i className="ri ri-information-line me-2"></i>
                        <strong>İş Talebi Oluşturma:</strong> Yeni bir iş talebi oluşturmak için başlık ve açıklama alanlarını doldurun, ardından ilgili kişileri seçin.
                    </Alert>

                    <Form.Group className="mb-3">
                        <Form.Label>İş Talebi Başlığı <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="İş talebinizin başlığını yazın"
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Grup Tipi</Form.Label>
                        <Form.Select
                            value={groupType}
                            onChange={(e) => setGroupType(e.target.value as any)}
                        >
                            <option value="private">Özel Sohbet (Seçtiğim kişilerle)</option>
                            <option value="department">Departman Sohbeti</option>
                            <option value="project">Proje Sohbeti</option>
                        </Form.Select>
                    </Form.Group>

                    {groupType === 'department' && (
                        <Form.Group className="mb-3">
                            <Form.Label>Departman</Form.Label>
                            <Form.Select
                                value={selectedDepartment}
                                onChange={(e) => setSelectedDepartment(Number(e.target.value))}
                                required
                            >
                                <option value="">Departman seçin</option>
                                {departments.map((dept) => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    )}

                    {(groupType === 'private' || groupType === 'project') && (
                        <Form.Group className="mb-3">
                            <Form.Label>Katılımcılar</Form.Label>
                            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                {users.map((user) => (
                                    <Form.Check
                                        key={user.id}
                                        type="checkbox"
                                        id={`user-${user.id}`}
                                        label={`${user.first_name} ${user.last_name} (${user.email})`}
                                        checked={selectedUsers.includes(user.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedUsers([...selectedUsers, user.id]);
                                            } else {
                                                setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                                            }
                                        }}
                                    />
                                ))}
                            </div>
                        </Form.Group>
                    )}

                    <Form.Group className="mb-3">
                        <Form.Label>Kategori</Form.Label>
                        <Form.Select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : '')}
                        >
                            <option value="">Kategori seçin (opsiyonel)</option>
                            {workCategories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>İş Talebi Açıklaması <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="İş talebinizin detaylarını açıklayın..."
                            required
                        />
                        <Form.Text className="text-muted">
                            Yapılması gereken işi detaylı bir şekilde açıklayın.
                        </Form.Text>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        İptal
                    </Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? 'Oluşturuluyor...' : 'Oluştur'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default NewGroupModal;