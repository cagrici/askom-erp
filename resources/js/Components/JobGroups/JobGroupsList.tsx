import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Spinner, Modal, Form, Alert, InputGroup, ListGroup, Dropdown, OverlayTrigger, Tooltip } from 'react-bootstrap';
import axios from 'axios';
import { User, Users, Plus, UserPlus, UserMinus, Shield, MessageSquare, X, Search, Trash2, Edit2, Check, XIcon } from 'lucide-react';

interface JobGroup {
    id: number;
    name: string;
    description: string | null;
    created_by: number;
    members_count: number;
    creator: {
        id: number;
        name: string;
        last_name: string;
    };
    members: Array<{
        id: number;
        name: string;
        last_name: string;
        email: string;
        pivot: {
            is_admin: boolean;
        };
    }>;
}

interface Location {
    id: number;
    name: string;
}

interface JobGroupsListProps {
    canCreateGroups: boolean;
    onGroupSelect: (group: JobGroup) => void;
    locations?: Location[];
    currentUserLocationId?: number;
    selectedGroupId?: number;
    currentUserId?: number;
}

export default function JobGroupsList({ canCreateGroups, onGroupSelect, locations, currentUserLocationId, selectedGroupId, currentUserId }: JobGroupsListProps) {
    const [groups, setGroups] = useState<JobGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<JobGroup | null>(null);
    const [availableUsers, setAvailableUsers] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        member_ids: [] as number[],
        location_id: currentUserLocationId || null
    });
    const [error, setError] = useState('');
    // Member management states
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletingGroup, setDeletingGroup] = useState(false);
    // Edit group name states
    const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
    const [editingGroupName, setEditingGroupName] = useState('');

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            const response = await axios.get('/job-groups');
            setGroups(response.data.groups);
        } catch (error) {
            console.error('Error fetching groups:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableUsers = async (locationId?: number | null) => {
        try {
            const params = locationId ? { location_id: locationId } : {};
            const response = await axios.get('/job-groups/api/users', { params });
            setAvailableUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleCreateGroup = () => {
        fetchAvailableUsers(formData.location_id);
        setShowCreateModal(true);
    };

    const handleSubmitGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.member_ids.length === 0) {
            setError('En az bir üye seçmelisiniz.');
            return;
        }

        try {
            await axios.post('/job-groups', formData);
            setShowCreateModal(false);
            setFormData({ name: '', description: '', member_ids: [], location_id: currentUserLocationId || null });
            fetchGroups();
        } catch (error: any) {
            setError(error.response?.data?.message || 'Grup oluşturulurken bir hata oluştu.');
        }
    };

    const handleShowMembers = async (group: JobGroup) => {
        setSelectedGroup(group);
        setShowMembersModal(true);
        setSearchTerm('');
        setSearchResults([]);
        setShowSearch(false);

        // Fetch detailed group info with members
        try {
            console.log('Fetching group details for ID:', group.id);
            console.log('URL:', `/job-groups/${group.id}`);
            const response = await axios.get(`/job-groups/${group.id}`);
            console.log('Response:', response.data);
            setSelectedGroup(response.data.group);
        } catch (error) {
            console.error('Error fetching group details:', error);
            console.error('Error details:', error.response);
        }
    };

    const searchUsers = async (term: string) => {
        if (term.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const params = selectedGroup?.location_id
                ? { location_id: selectedGroup.location_id, search: term }
                : { search: term };

            const response = await axios.get('/job-groups/api/users', { params });

            // Filter out current members
            const currentMemberIds = selectedGroup?.members.map(m => m.id) || [];
            const filteredUsers = response.data.filter((user: any) =>
                !currentMemberIds.includes(user.id)
            );

            setSearchResults(filteredUsers);
        } catch (error) {
            console.error('Error searching users:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearchChange = (term: string) => {
        setSearchTerm(term);
        searchUsers(term);
    };

    const addMemberToGroup = async (userId: number) => {
        if (!selectedGroup) return;

        try {
            await axios.post(`/job-groups/${selectedGroup.id}/members`, {
                user_id: userId
            });

            // Refresh group details
            const response = await axios.get(`/job-groups/${selectedGroup.id}`);
            setSelectedGroup(response.data.group);

            // Clear search
            setSearchTerm('');
            setSearchResults([]);

            fetchGroups(); // Refresh groups list
        } catch (error: any) {
            setError(error.response?.data?.message || 'Üye eklenirken hata oluştu.');
        }
    };

    const removeMemberFromGroup = async (userId: number) => {
        if (!selectedGroup) return;

        try {
            await axios.delete(`/job-groups/${selectedGroup.id}/members`, {
                data: { user_id: userId }
            });

            // Refresh group details
            const response = await axios.get(`/job-groups/${selectedGroup.id}`);
            setSelectedGroup(response.data.group);

            fetchGroups(); // Refresh groups list
        } catch (error: any) {
            setError(error.response?.data?.message || 'Üye çıkarılırken hata oluştu.');
        }
    };

    const makeUserAdmin = async (userId: number) => {
        if (!selectedGroup) return;

        try {
            await axios.put(`/job-groups/${selectedGroup.id}/members/admin`, {
                user_id: userId
            });

            // Refresh group details
            const response = await axios.get(`/job-groups/${selectedGroup.id}`);
            setSelectedGroup(response.data.group);
        } catch (error: any) {
            setError(error.response?.data?.message || 'Yönetici yapılırken hata oluştu.');
        }
    };

    const handleDeleteGroup = () => {
        setShowDeleteConfirm(true);
    };

    const confirmDeleteGroup = async () => {
        if (!selectedGroup) return;

        setDeletingGroup(true);
        setError('');

        try {
            await axios.delete(`/job-groups/${selectedGroup.id}`);

            // Close modals and refresh
            setShowDeleteConfirm(false);
            setShowMembersModal(false);
            setSelectedGroup(null);

            // Refresh groups list
            fetchGroups();

        } catch (error: any) {
            setError(error.response?.data?.message || 'Grup silinirken hata oluştu.');
        } finally {
            setDeletingGroup(false);
        }
    };

    const cancelDeleteGroup = () => {
        setShowDeleteConfirm(false);
    };

    const startEditingGroupName = (group: JobGroup) => {
        setEditingGroupId(group.id);
        setEditingGroupName(group.name);
    };

    const cancelEditingGroupName = () => {
        setEditingGroupId(null);
        setEditingGroupName('');
    };

    const saveGroupName = async (groupId: number) => {
        if (!editingGroupName.trim()) {
            setError('Grup adı boş olamaz.');
            return;
        }

        try {
            // Use absolute path to avoid routing issues
            const response = await axios.put(`${window.location.origin}/job-groups/${groupId}`, {
                name: editingGroupName.trim(),
                description: selectedGroup?.description || ''
            });

            // Update local groups state
            setGroups(prev => prev.map(group => 
                group.id === groupId 
                    ? { ...group, name: editingGroupName.trim() }
                    : group
            ));

            // Update selectedGroup if in modal
            if (selectedGroup && selectedGroup.id === groupId) {
                setSelectedGroup({ ...selectedGroup, name: editingGroupName.trim() });
            }

            setEditingGroupId(null);
            setEditingGroupName('');
        } catch (error: any) {
            setError(error.response?.data?.message || 'Grup adı güncellenirken hata oluştu.');
        }
    };

    const toggleMemberSelection = (userId: number) => {
        setFormData(prev => ({
            ...prev,
            member_ids: prev.member_ids.includes(userId)
                ? prev.member_ids.filter(id => id !== userId)
                : [...prev.member_ids, userId]
        }));
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
                <Spinner animation="border" />
            </div>
        );
    }

    return (
        <Card className="h-100">
            <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">İş Grupları</h5>
                {canCreateGroups && (
                    <OverlayTrigger
                        placement="left"
                        overlay={<Tooltip>Yeni Grup Oluştur</Tooltip>}
                    >
                        <Button size="sm" variant="primary" onClick={handleCreateGroup}>
                            <i className="ri ri-add-line"></i>
                        </Button>
                    </OverlayTrigger>
                )}
            </Card.Header>
            <Card.Body style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 280px)' }}>
                {error && (
                    <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-3">
                        {error}
                    </Alert>
                )}
                {groups.length === 0 ? (
                    <div className="text-center text-muted py-4">
                        <Users size={48} className="mb-2" />
                        <p>Henüz bir iş grubunuz yok.</p>
                        {canCreateGroups && (
                            <Button variant="primary" size="sm" onClick={handleCreateGroup}>
                                İlk Grubu Oluştur
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="d-flex flex-column gap-2">
                        {groups.map(group => (
                            <Card
                                key={group.id}
                                className={`cursor-pointer hover-shadow ${selectedGroupId === group.id ? 'border-primary bg-light' : ''}`}
                                onClick={() => onGroupSelect(group)}
                                style={{ cursor: 'pointer' }}
                            >
                                <Card.Body className="p-3">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <h6 className="mb-0">{group.name}</h6>
                                        <Badge bg="secondary">{group.members_count} üye</Badge>
                                    </div>
                                    {group.description && (
                                        <p className="text-muted small mb-2">{group.description}</p>
                                    )}
                                    <div className="d-flex justify-content-between align-items-center">
                                        <small className="text-muted">
                                            Oluşturan: {group.creator.name} {group.creator.last_name}
                                        </small>
                                        <Button
                                            size="sm"
                                            variant="outline-secondary"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleShowMembers(group);
                                            }}
                                        >
                                            <Users size={14} />
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        ))}
                    </div>
                )}
            </Card.Body>

            {/* Create Group Modal */}
            <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Yeni İş Grubu Oluştur</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmitGroup}>
                    <Modal.Body>
                        {error && <Alert variant="danger">{error}</Alert>}
                        <Form.Group className="mb-3">
                            <Form.Label>Grup Adı *</Form.Label>
                            <Form.Control
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Grup adını giriniz"
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Açıklama</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Grup açıklaması (isteğe bağlı)"
                            />
                        </Form.Group>
                        {locations && locations.length > 0 && (
                            <Form.Group className="mb-3">
                                <Form.Label>Lokasyon</Form.Label>
                                <Form.Select
                                    value={formData.location_id || ''}
                                    onChange={(e) => {
                                        const newLocationId = e.target.value ? parseInt(e.target.value) : null;
                                        setFormData({ ...formData, location_id: newLocationId, member_ids: [] });
                                        fetchAvailableUsers(newLocationId);
                                    }}
                                >
                                    <option value="">Tüm Lokasyonlar</option>
                                    {locations.map(location => (
                                        <option key={location.id} value={location.id}>
                                            {location.name}
                                        </option>
                                    ))}
                                </Form.Select>
                                <Form.Text className="text-muted">
                                    Seçilen lokasyondaki kullanıcılar gruba eklenebilir
                                </Form.Text>
                            </Form.Group>
                        )}
                        <Form.Group className="mb-3">
                            <Form.Label>Grup Üyeleri *</Form.Label>
                            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                {availableUsers.map(user => (
                                    <Form.Check
                                        key={user.id}
                                        type="checkbox"
                                        id={`user-${user.id}`}
                                        label={`${user.name} ${user.last_name}`}
                                        checked={formData.member_ids.includes(user.id)}
                                        onChange={() => toggleMemberSelection(user.id)}
                                        className="mb-2"
                                    />
                                ))}
                            </div>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                            İptal
                        </Button>
                        <Button type="submit" variant="primary">
                            Grubu Oluştur
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Members Modal */}
            <Modal show={showMembersModal} onHide={() => setShowMembersModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title className="d-flex justify-content-between align-items-center w-100">
                        <div className="d-flex align-items-center flex-grow-1">
                            {editingGroupId === selectedGroup?.id ? (
                                <div className="d-flex align-items-center me-2">
                                    <Form.Control
                                        size="sm"
                                        value={editingGroupName}
                                        onChange={(e) => setEditingGroupName(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                saveGroupName(selectedGroup.id);
                                            }
                                            if (e.key === 'Escape') {
                                                cancelEditingGroupName();
                                            }
                                        }}
                                        autoFocus
                                        className="me-2"
                                    />
                                    <Button
                                        size="sm"
                                        variant="success"
                                        onClick={() => saveGroupName(selectedGroup!.id)}
                                        title="Kaydet"
                                    >
                                        <Check size={14} />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={cancelEditingGroupName}
                                        title="İptal"
                                        className="ms-1"
                                    >
                                        <XIcon size={14} />
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <span className="me-2">{selectedGroup?.name}</span>
                                    <Button
                                        size="sm"
                                        variant="outline-primary"
                                        onClick={() => startEditingGroupName(selectedGroup!)}
                                        title="Grup adını düzenle"
                                    >
                                        <Edit2 size={14} />
                                    </Button>
                                </>
                            )}
                        </div>
                        {/* Only show delete button if current user is the creator */}
                        {selectedGroup?.created_by === currentUserId && !editingGroupId && (
                            <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={handleDeleteGroup}
                                title="Grubu Sil"
                            >
                                <Trash2 size={16} />
                            </Button>
                        )}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

                    {/* Add Member Section */}
                    <div className="mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6>Yeni Üye Ekle</h6>
                            <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => setShowSearch(!showSearch)}
                            >
                                <UserPlus size={16} className="me-1" />
                                {showSearch ? 'Aramayı Kapat' : 'Üye Ekle'}
                            </Button>
                        </div>

                        {showSearch && (
                            <div className="position-relative">
                                <InputGroup>
                                    <InputGroup.Text>
                                        <Search size={16} />
                                    </InputGroup.Text>
                                    <Form.Control
                                        type="text"
                                        placeholder="Kullanıcı ara (en az 2 karakter)..."
                                        value={searchTerm}
                                        onChange={(e) => handleSearchChange(e.target.value)}
                                    />
                                    {isSearching && (
                                        <InputGroup.Text>
                                            <Spinner animation="border" size="sm" />
                                        </InputGroup.Text>
                                    )}
                                </InputGroup>

                                {searchResults.length > 0 && (
                                    <ListGroup className="position-absolute w-100" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                                        {searchResults.map(user => (
                                            <ListGroup.Item
                                                key={user.id}
                                                className="d-flex justify-content-between align-items-center cursor-pointer"
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => addMemberToGroup(user.id)}
                                            >
                                                <div>
                                                    <strong>{user.name} {user.last_name}</strong>
                                                    <br />
                                                    <small className="text-muted">{user.email}</small>
                                                </div>
                                                <Plus size={16} className="text-success" />
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                )}

                                {searchTerm.length >= 2 && searchResults.length === 0 && !isSearching && (
                                    <div className="text-muted text-center mt-2">
                                        Kullanıcı bulunamadı
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <hr />

                    {/* Current Members */}
                    <div>
                        <h6 className="mb-3">Mevcut Üyeler ({selectedGroup?.members.length || 0})</h6>
                        {selectedGroup?.members.map(member => (
                            <div key={member.id} className="d-flex align-items-center justify-content-between mb-2 p-3 border rounded">
                                <div className="d-flex align-items-center">
                                    <User size={20} className="me-2" />
                                    <div>
                                        <strong>{member.name} {member.last_name}</strong>
                                        <br />
                                        <small className="text-muted">{member.email}</small>
                                    </div>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    {member.pivot.is_admin ? (
                                        <Badge bg="warning">
                                            <Shield size={14} className="me-1" />
                                            Yönetici
                                        </Badge>
                                    ) : (
                                        <Button
                                            variant="outline-warning"
                                            size="sm"
                                            onClick={() => makeUserAdmin(member.id)}
                                            title="Yönetici Yap"
                                        >
                                            <Shield size={14} />
                                        </Button>
                                    )}

                                    {/* Only show remove button if not the last admin */}
                                    {!(member.pivot.is_admin && selectedGroup?.members.filter(m => m.pivot.is_admin).length <= 1) && (
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => removeMemberFromGroup(member.id)}
                                            title="Gruptan Çıkar"
                                        >
                                            <UserMinus size={14} />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowMembersModal(false)}>
                        Kapat
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteConfirm} onHide={cancelDeleteGroup} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="text-danger">
                        <Trash2 size={20} className="me-2" />
                        Grubu Sil
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Alert variant="warning">
                        <strong>Dikkat!</strong> Bu işlem geri alınamaz.
                    </Alert>
                    <p>
                        <strong>"{selectedGroup?.name}"</strong> grubunu silmek istediğinizden emin misiniz?
                    </p>
                    <p className="text-muted small">
                        Bu işlem sonrasında:
                    </p>
                    <ul className="text-muted small">
                        <li>Grup mesaj geçmişi silinecek</li>
                        <li>Tüm grup üyeleri gruptan çıkarılacak</li>
                        <li>Bu işlem geri alınamaz</li>
                    </ul>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={cancelDeleteGroup}
                        disabled={deletingGroup}
                    >
                        İptal
                    </Button>
                    <Button
                        variant="danger"
                        onClick={confirmDeleteGroup}
                        disabled={deletingGroup}
                    >
                        {deletingGroup ? (
                            <>
                                <Spinner size="sm" className="me-1" />
                                Siliniyor...
                            </>
                        ) : (
                            <>
                                <Trash2 size={16} className="me-1" />
                                Grubu Sil
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Card>
    );
}
