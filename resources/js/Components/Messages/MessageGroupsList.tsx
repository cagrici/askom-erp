import React, { useState, useEffect } from 'react';
import { Card, ListGroup, Button, Badge, Form, Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

interface MessageGroupsListProps {
    activeGroupId: number | null;
    onGroupSelect: (groupId: number) => void;
    onNewGroup: () => void;
    refreshTrigger?: number; // Yenileme tetikleyicisi
}

const MessageGroupsList: React.FC<MessageGroupsListProps> = ({
    activeGroupId,
    onGroupSelect,
    onNewGroup,
    refreshTrigger
}) => {
    const [groups, setGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        status: '',
        priority: '',
        assignedTo: '',
        category: '',
        overdue: false,
        myTasks: false
    });
    const [filteredGroups, setFilteredGroups] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchFilters, setSearchFilters] = useState({
        dateFrom: '',
        dateTo: '',
        fileType: 'all',
        groupId: ''
    });
    const { t } = useTranslation();
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        fetchGroups();
        fetchCategories();
        fetchUsers();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [groups, filters]);

    useEffect(() => {
        if (refreshTrigger) {
            fetchGroups();
        }
    }, [refreshTrigger]);

    const fetchGroups = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/messages/groups');
            const groupsData = response.data.groups || [];
            setGroups(groupsData);
            setFilteredGroups(groupsData);
        } catch (error) {
            console.error('Failed to fetch groups:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await axios.get('/api/messages/categories');
            setCategories(response.data);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
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

    const applyFilters = () => {
        let filtered = [...groups];
        const currentUserId = (window as any).auth?.user?.id;

        // Status filter
        if (filters.status) {
            filtered = filtered.filter(g => g.status === filters.status);
        }

        // Priority filter
        if (filters.priority) {
            filtered = filtered.filter(g => g.priority === filters.priority);
        }

        // Assigned to filter
        if (filters.assignedTo) {
            filtered = filtered.filter(g => g.assigned_to === parseInt(filters.assignedTo));
        }

        // Category filter
        if (filters.category) {
            filtered = filtered.filter(g => g.category?.id === parseInt(filters.category));
        }

        // Overdue filter
        if (filters.overdue) {
            filtered = filtered.filter(g => g.is_overdue);
        }

        // My tasks filter
        if (filters.myTasks && currentUserId) {
            filtered = filtered.filter(g => g.assigned_to === currentUserId);
        }

        setFilteredGroups(filtered);
    };

    const resetFilters = () => {
        setFilters({
            status: '',
            priority: '',
            assignedTo: '',
            category: '',
            overdue: false,
            myTasks: false
        });
    };

    const performSearch = async () => {
        if (!searchQuery.trim() && !searchFilters.dateFrom && !searchFilters.dateTo && searchFilters.fileType === 'all') {
            return;
        }

        setIsSearching(true);

        try {
            const params = new URLSearchParams();
            if (searchQuery.trim()) params.append('query', searchQuery.trim());
            if (searchFilters.dateFrom) params.append('date_from', searchFilters.dateFrom);
            if (searchFilters.dateTo) params.append('date_to', searchFilters.dateTo);
            if (searchFilters.fileType !== 'all') params.append('file_type', searchFilters.fileType);
            if (searchFilters.groupId) params.append('group_id', searchFilters.groupId);

            const response = await axios.get(`/api/messages/search?${params.toString()}`);
            setSearchResults(response.data.messages || []);
        } catch (error: any) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const clearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
        setSearchFilters({
            dateFrom: '',
            dateTo: '',
            fileType: 'all',
            groupId: ''
        });
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'open': return 'info';
            case 'in_progress': return 'warning';
            case 'completed': return 'success';
            case 'cancelled': return 'secondary';
            default: return 'secondary';
        }
    };

    const getPriorityBadgeVariant = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'danger';
            case 'high': return 'warning';
            case 'medium': return 'info';
            case 'low': return 'secondary';
            default: return 'secondary';
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'urgent': return '🔥';
            case 'high': return '⚡';
            case 'medium': return '➖';
            case 'low': return '🔻';
            default: return '';
        }
    };

    const truncateText = (text: string, limit: number = 50) => {
        return text.length > limit ? text.substring(0, limit) + '...' : text;
    };

    if (loading) {
        return (
            <Card className="h-100">
                <Card.Header>
                    <h5 className="mb-0">
                        <i className="ri ri-message-3-line me-2"></i>
                        İş Talepleri
                    </h5>
                </Card.Header>
                <Card.Body className="d-flex align-items-center justify-content-center">
                    <div className="text-center">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Yükleniyor...</span>
                        </div>
                        <p className="mt-2 text-muted">Yükleniyor...</p>
                    </div>
                </Card.Body>
            </Card>
        );
    }

    return (
        <Card className="h-100">
            <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                    <i className="ri ri-message-3-line me-2"></i>
                    İş Talepleri
                    <Badge bg="secondary" className="ms-2">{filteredGroups.length}</Badge>
                </h5>
                <div>
                    <Button
                        variant="link"
                        size="sm"
                        onClick={() => setShowFilterPanel(!showFilterPanel)}
                        className={`p-0 me-2 ${showFilterPanel ? 'text-primary' : ''}`}
                        title="Filtrele"
                    >
                        <i className="ri ri-filter-line fs-5"></i>
                        {Object.values(filters).some(v => v) && (
                            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem' }}>
                                •
                            </span>
                        )}
                    </Button>
                    <Button
                        variant="link"
                        size="sm"
                        onClick={() => setShowSearchModal(true)}
                        className="p-0 me-2"
                        title="Mesajlarda Ara"
                    >
                        <i className="ri ri-search-line fs-5"></i>
                    </Button>
                    <OverlayTrigger
                        placement="left"
                        overlay={<Tooltip>Yeni İş Talebi</Tooltip>}
                    >
                        <Button
                            size="sm"
                            variant="primary"
                            onClick={onNewGroup}
                        >
                            <i className="ri ri-add-line"></i>
                        </Button>
                    </OverlayTrigger>
                </div>
            </Card.Header>

            {/* Quick Filters */}
            <div className="border-bottom px-3 py-2 bg-white">
                <div className="d-flex flex-wrap gap-1">
                    <Button
                        variant={filters.myTasks ? "primary" : "outline-primary"}
                        size="sm"
                        onClick={() => setFilters({...filters, myTasks: !filters.myTasks})}
                    >
                        <i className="ri ri-user-line me-1"></i>
                        İşlerim
                    </Button>
                    <Button
                        variant={filters.status === 'open' ? "warning" : "outline-warning"}
                        size="sm"
                        onClick={() => setFilters({...filters, status: filters.status === 'open' ? '' : 'open'})}
                    >
                        <i className="ri ri-time-line me-1"></i>
                        Açık
                    </Button>
                    <Button
                        variant={filters.overdue ? "danger" : "outline-danger"}
                        size="sm"
                        onClick={() => setFilters({...filters, overdue: !filters.overdue})}
                    >
                        <i className="ri ri-alarm-warning-line me-1"></i>
                        Geciken
                    </Button>
                    <Button
                        variant={filters.priority === 'urgent' ? "danger" : "outline-secondary"}
                        size="sm"
                        onClick={() => setFilters({...filters, priority: filters.priority === 'urgent' ? '' : 'urgent'})}
                    >
                        🔥 Acil
                    </Button>
                    <Button
                        variant={filters.status === 'completed' ? "success" : "outline-success"}
                        size="sm"
                        onClick={() => setFilters({...filters, status: filters.status === 'completed' ? '' : 'completed'})}
                    >
                        <i className="ri ri-check-line me-1"></i>
                        Biten
                    </Button>
                </div>
            </div>

            {/* Filtreleme Paneli */}
            {showFilterPanel && (
                <div className="border-bottom bg-light py-2 px-3">
                    <div className="row g-2">
                        <div className="col-md-6">
                            <Form.Select
                                size="sm"
                                value={filters.status}
                                onChange={(e) => setFilters({...filters, status: e.target.value})}
                            >
                                <option value="">Tüm Durumlar</option>
                                <option value="open">Açık</option>
                                <option value="in_progress">Devam Ediyor</option>
                                <option value="completed">Tamamlandı</option>
                                <option value="cancelled">İptal</option>
                            </Form.Select>
                        </div>
                        <div className="col-md-6">
                            <Form.Select
                                size="sm"
                                value={filters.priority}
                                onChange={(e) => setFilters({...filters, priority: e.target.value})}
                            >
                                <option value="">Tüm Öncelikler</option>
                                <option value="urgent">🔥 Acil</option>
                                <option value="high">⚡ Yüksek</option>
                                <option value="medium">➖ Orta</option>
                                <option value="low">🔻 Düşük</option>
                            </Form.Select>
                        </div>
                        <div className="col-md-6">
                            <Form.Select
                                size="sm"
                                value={filters.category}
                                onChange={(e) => setFilters({...filters, category: e.target.value})}
                            >
                                <option value="">Tüm Kategoriler</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </div>
                        <div className="col-md-6">
                            <Form.Select
                                size="sm"
                                value={filters.assignedTo}
                                onChange={(e) => setFilters({...filters, assignedTo: e.target.value})}
                            >
                                <option value="">Tüm Kullanıcılar</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.name || `${user.first_name} ${user.last_name}`.trim()}
                                    </option>
                                ))}
                            </Form.Select>
                        </div>
                        <div className="col-12 text-end">
                            <Button
                                variant="link"
                                size="sm"
                                onClick={resetFilters}
                                className="text-decoration-none"
                            >
                                <i className="ri ri-refresh-line me-1"></i>
                                Temizle
                            </Button>
                        </div>
                    </div>
                    {filteredGroups.length !== groups.length && (
                        <div className="text-muted small mt-2">
                            {filteredGroups.length} / {groups.length} sonuç gösteriliyor
                        </div>
                    )}
                </div>
            )}

            <div className="flex-grow-1 overflow-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                <ListGroup variant="flush">
                    {filteredGroups.length > 0 ? (
                        filteredGroups.map((group) => (
                            <ListGroup.Item
                                key={group.id}
                                className={`cursor-pointer p-3 ${activeGroupId === group.id ? 'bg-primary bg-opacity-10 border-primary' : ''}`}
                                onClick={() => onGroupSelect(group.id)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="d-flex justify-content-between align-items-start">
                                    <div className="flex-grow-1 me-2">
                                        {/* Title */}
                                        <div className="fw-bold mb-1">
                                            {truncateText(group.name, 35)}
                                            {group.unread_count > 0 && (
                                                <Badge bg="danger" className="ms-2">
                                                    {group.unread_count}
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Latest Message */}
                                        {group.latest_message && (
                                            <div className="text-muted small mb-2">
                                                <strong>{group.latest_message.user?.name}:</strong>{' '}
                                                {group.latest_message.type === 'audio' ? '🎵 Ses mesajı' :
                                                 group.latest_message.type === 'file' ? '📎 Dosya' :
                                                 truncateText(group.latest_message.content || '', 30)}
                                            </div>
                                        )}

                                        {/* Status and Priority */}
                                        <div className="d-flex gap-1 mb-1">
                                            <Badge bg={getStatusBadgeVariant(group.status)} className="small">
                                                {group.status === 'open' ? 'açık' :
                                                 group.status === 'in_progress' ? 'devam ediyor' :
                                                 group.status === 'completed' ? 'tamamlandı' :
                                                 group.status === 'cancelled' ? 'iptal' : group.status}
                                            </Badge>
                                            <Badge bg={getPriorityBadgeVariant(group.priority)} className="small">
                                                {getPriorityIcon(group.priority)} {t(group.priority)}
                                            </Badge>
                                        </div>

                                        {/* Assigned User & Due Date */}
                                        <div className="small text-muted">
                                            {group.assigned_user && (
                                                <div>👤 {group.assigned_user.name}</div>
                                            )}
                                            {group.due_date && (
                                                <div className={group.is_overdue ? 'text-danger' : ''}>
                                                    📅 {new Date(group.due_date).toLocaleDateString('tr-TR')}
                                                    {group.is_overdue && ' (GECİKMİŞ)'}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Timestamp */}
                                    <div className="text-muted small text-end">
                                        {group.latest_message &&
                                            new Date(group.latest_message.created_at).toLocaleTimeString('tr-TR', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })
                                        }
                                    </div>
                                </div>
                            </ListGroup.Item>
                        ))
                    ) : (
                        <ListGroup.Item className="text-center text-muted py-4">
                            <i className="ri ri-message-3-line fs-1 mb-3 d-block opacity-25"></i>
                            <p className="mb-0">
                                {groups.length === 0 ? 'Henüz iş talebi bulunmuyor.' : 'Filtrelere uygun iş talebi bulunamadı.'}
                            </p>
                            {groups.length === 0 && (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    className="mt-2"
                                    onClick={onNewGroup}
                                >
                                    <i className="ri ri-add-line me-1"></i>
                                    İlk İş Talebini Oluştur
                                </Button>
                            )}
                        </ListGroup.Item>
                    )}
                </ListGroup>
            </div>

            {/* Arama Modal */}
            <Modal show={showSearchModal} onHide={() => setShowSearchModal(false)} size="xl">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="ri ri-search-line me-2"></i>
                        Mesajlarda Ara
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={(e) => { e.preventDefault(); performSearch(); }}>
                        <div className="row g-3">
                            {/* Arama Metni */}
                            <div className="col-md-12">
                                <Form.Group>
                                    <Form.Label>Mesaj İçeriği</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Aramak istediğiniz kelime veya cümle..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </Form.Group>
                            </div>

                            {/* Tarih Filtreleri */}
                            <div className="col-md-6">
                                <Form.Group>
                                    <Form.Label>Başlangıç Tarihi</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={searchFilters.dateFrom}
                                        onChange={(e) => setSearchFilters({...searchFilters, dateFrom: e.target.value})}
                                    />
                                </Form.Group>
                            </div>
                            <div className="col-md-6">
                                <Form.Group>
                                    <Form.Label>Bitiş Tarihi</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={searchFilters.dateTo}
                                        onChange={(e) => setSearchFilters({...searchFilters, dateTo: e.target.value})}
                                    />
                                </Form.Group>
                            </div>

                            {/* Dosya Türü ve Grup Filtreleri */}
                            <div className="col-md-6">
                                <Form.Group>
                                    <Form.Label>Dosya Türü</Form.Label>
                                    <Form.Select
                                        value={searchFilters.fileType}
                                        onChange={(e) => setSearchFilters({...searchFilters, fileType: e.target.value})}
                                    >
                                        <option value="all">Tümü</option>
                                        <option value="image">🖼️ Resimler</option>
                                        <option value="audio">🎵 Sesli Mesajlar</option>
                                        <option value="document">📄 Dokümanlar</option>
                                    </Form.Select>
                                </Form.Group>
                            </div>
                            <div className="col-md-6">
                                <Form.Group>
                                    <Form.Label>Grup</Form.Label>
                                    <Form.Select
                                        value={searchFilters.groupId}
                                        onChange={(e) => setSearchFilters({...searchFilters, groupId: e.target.value})}
                                    >
                                        <option value="">Tüm Gruplar</option>
                                        {groups.map((group) => (
                                            <option key={group.id} value={group.id}>
                                                {group.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </div>
                        </div>

                        <div className="d-flex gap-2 mt-4">
                            <Button
                                variant="primary"
                                type="submit"
                                disabled={isSearching}
                            >
                                {isSearching ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                        Aranıyor...
                                    </>
                                ) : (
                                    <>
                                        <i className="ri ri-search-line me-2"></i>
                                        Ara
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline-secondary"
                                onClick={clearSearch}
                                disabled={isSearching}
                            >
                                <i className="ri ri-refresh-line me-2"></i>
                                Temizle
                            </Button>
                        </div>
                    </Form>

                    {/* Arama Sonuçları */}
                    {searchResults.length > 0 && (
                        <div className="mt-4">
                            <h6 className="border-bottom pb-2">
                                <i className="ri ri-file-list-line me-2"></i>
                                Arama Sonuçları ({searchResults.length})
                            </h6>
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {searchResults.map((message) => (
                                    <div key={message.id} className="border rounded p-3 mb-2 bg-light">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <div>
                                                <strong className="text-primary">{message.user.name}</strong>
                                                <small className="text-muted ms-2">
                                                    {new Date(message.created_at).toLocaleString('tr-TR')}
                                                </small>
                                            </div>
                                            <span className="badge bg-secondary">
                                                {message.type === 'audio' ? '🎵 Ses' :
                                                 message.type === 'file' ? '📎 Dosya' :
                                                 '💬 Metin'}
                                            </span>
                                        </div>

                                        {message.content && (
                                            <div className="mb-2">
                                                {message.content}
                                            </div>
                                        )}

                                        {message.attachments && message.attachments.length > 0 && (
                                            <div className="attachments">
                                                {message.attachments.map((attachment: any) => (
                                                    <div key={attachment.id} className="d-inline-block me-2">
                                                        {attachment.mime_type.startsWith('image/') ? (
                                                            <img
                                                                src={attachment.url}
                                                                alt={attachment.original_name}
                                                                className="img-thumbnail"
                                                                style={{ maxHeight: '60px' }}
                                                            />
                                                        ) : (
                                                            <a
                                                                href={attachment.url}
                                                                download={attachment.original_name}
                                                                className="btn btn-sm btn-outline-primary"
                                                            >
                                                                <i className="ri ri-attachment-line me-1"></i>
                                                                {attachment.original_name}
                                                            </a>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {searchResults.length === 0 && searchQuery && !isSearching && (
                        <div className="text-center mt-4 text-muted">
                            <i className="ri ri-search-2-line fs-1 mb-3 d-block"></i>
                            <p>Arama kriterlerinize uygun mesaj bulunamadı.</p>
                        </div>
                    )}
                </Modal.Body>
            </Modal>
        </Card>
    );
};

export default MessageGroupsList;
