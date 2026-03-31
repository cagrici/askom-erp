import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { Card, Col, Row, Alert, ListGroup, Modal } from 'react-bootstrap';
import Layout from '../../Layouts';
import { Link } from '@inertiajs/react';
import { CalendarEvent, Calendar } from 'react-bootstrap-icons';
import MessageGroupsList from '../../Components/Messages/MessageGroupsList';
import ChatArea from '../../Components/Messages/ChatArea';
import NewGroupModal from '../../Components/Messages/NewGroupModal';

interface Announcement {
  id: number;
  title: string;
  content: string;
  category?: {
    id: number;
    name: string;
    icon: string;
    color: string;
  } | null;
  created_at: string;
  is_featured: boolean;
}

interface CalendarEvent {
  id: number;
  title: string;
  start_time: string;
  end_time: string;
  location?: string;
  resource_type: string;
  resource_id: number;
}

interface Document {
  id: number;
  title: string;
  category: string;
  created_at: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
  } | null;
}

interface WorkRequest {
  id: number;
  title: string;
  status: string;
  priority: string;
  due_date: string;
  requester: {
    id: number;
    first_name: string;
    last_name: string;
  };
  assignee?: {
    id: number;
    first_name: string;
    last_name: string;
  } | null;
}

interface BirthdayPerson {
  id: number;
  first_name: string;
  last_name: string;
  avatar: string;
  birth_date: string;
}

interface Props {
  upcomingEvents: CalendarEvent[];
  announcements: Announcement[];
  pendingRequests: WorkRequest[];
  recentDocuments: Document[];
  birthdayPeople: BirthdayPerson[];
  userWidgets: any[];
  recentActivity: any[];
}

export default function Dashboard({
  upcomingEvents,
  announcements,
  pendingRequests,
  recentDocuments,
  birthdayPeople,
  userWidgets,
  recentActivity,
}: Props) {
  const [activeTab, setActiveTab] = useState('home');
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatBirthday = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
    }).format(date);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'in_progress':
        return 'info';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'danger';
      case 'rejected':
        return 'danger';
      case 'approved':
        return 'success';
      default:
        return 'secondary';
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'success';
      case 'medium':
        return 'info';
      case 'high':
        return 'warning';
      case 'critical':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const handleGroupSelect = (groupId: number) => {
    setActiveGroupId(groupId);
  };

  const handleNewGroup = () => {
    setShowNewGroupModal(true);
  };

  const handleCloseNewGroupModal = () => {
    setShowNewGroupModal(false);
  };

  const handleGroupCreated = (groupId: number) => {
    setActiveGroupId(groupId);
    setShowNewGroupModal(false);
    // İş talepleri listesini yenile
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <>
      <Head title="Dashboard" />

      <div className="page-content" style={{ height: 'calc(100vh - 140px)' }}>
        <Row style={{ height: '100%' }}>
          {/* Sol Kolon - Message Groups */}
          <Col lg={4} className="h-100">
            <MessageGroupsList
              activeGroupId={activeGroupId}
              onGroupSelect={handleGroupSelect}
              onNewGroup={handleNewGroup}
              refreshTrigger={refreshTrigger}
            />
          </Col>

          {/* Orta Kolon - Chat Area */}
          <Col lg={5} className="h-100">
            <ChatArea
              activeGroupId={activeGroupId}
              onBack={() => setActiveGroupId(null)}
              onGroupUpdate={() => {
                // Groups listesini yenile
                // Bu prop MessageGroupsList'e geçirilebilir
              }}
            />
          </Col>

          {/* Sağ Kolon - Dashboard Info */}
          <Col lg={3} className="h-100">
            {/* Duyurular - Kompakt */}
            <Card className="mb-3">
              <Card.Header className="py-2">
                <h6 className="mb-0">
                  <i className="bi bi-megaphone me-2"></i>Duyurular
                  <Link
                    href={route('announcements.index')}
                    className="btn btn-sm btn-outline-primary ms-2"
                    style={{ fontSize: '0.75rem' }}
                  >
                    Tümü
                  </Link>
                </h6>
              </Card.Header>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                <ListGroup variant="flush">
                  {announcements.slice(0, 3).map((announcement) => (
                    <ListGroup.Item key={announcement.id} className="py-2">
                      <div className="small">
                        {announcement.is_featured && (
                          <span className="badge bg-danger me-1" style={{ fontSize: '0.6rem' }}>Öne Çıkan</span>
                        )}
                        <Link href={route('announcements.show', announcement.id)} className="text-decoration-none">
                          <div className="fw-bold">{announcement.title.substring(0, 40)}...</div>
                        </Link>
                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                          {announcement.category?.name || 'Genel'} | {formatDate(announcement.created_at)}
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                  {announcements.length === 0 && (
                    <ListGroup.Item className="py-2 text-muted small">Duyuru yok</ListGroup.Item>
                  )}
                </ListGroup>
              </div>
            </Card>

            {/* Etkinlikler - Kompakt */}
            <Card className="mb-3">
              <Card.Header className="py-2">
                <h6 className="mb-0">
                  <Calendar className="me-2" />Etkinlikler
                  <Link
                    href={route('calendar.index')}
                    className="btn btn-sm btn-outline-primary ms-2"
                    style={{ fontSize: '0.75rem' }}
                  >
                    Takvim
                  </Link>
                </h6>
              </Card.Header>
              <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                <ListGroup variant="flush">
                  {upcomingEvents.slice(0, 2).map((event) => (
                    <ListGroup.Item key={event.id} className="py-2">
                      <div className="small">
                        <div className="fw-bold">{event.title.substring(0, 35)}...</div>
                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                          <CalendarEvent className="me-1" />
                          {formatDateTime(event.start_time)}
                        </div>
                        {event.location && <div className="text-muted" style={{ fontSize: '0.65rem' }}>{event.location}</div>}
                      </div>
                    </ListGroup.Item>
                  ))}
                  {upcomingEvents.length === 0 && (
                    <ListGroup.Item className="py-2 text-muted small">Etkinlik yok</ListGroup.Item>
                  )}
                </ListGroup>
              </div>
            </Card>

            {/* Birthdays */}
            {birthdayPeople.length > 0 && (
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">
                    <i className="bi bi-gift me-2"></i>Doğum Günleri
                  </h5>
                </Card.Header>
                <ListGroup variant="flush">
                  {birthdayPeople.map((person) => (
                    <ListGroup.Item key={person.id}>
                      <div className="d-flex align-items-center">
                        {person.avatar ? (
                          <img
                            src={person.avatar}
                            alt={`${person.first_name} ${person.last_name}`}
                            className="rounded-circle me-2"
                            width="32"
                            height="32"
                          />
                        ) : (
                          <div
                            className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2"
                            style={{ width: '32px', height: '32px' }}
                          >
                            {person.first_name.charAt(0)}
                            {person.last_name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="fw-bold">
                            {person.first_name} {person.last_name}
                          </div>
                          <small>{formatBirthday(person.birth_date)}</small>
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card>
            )}
          </Col>
        </Row>

        {/* New Group Modal */}
        {showNewGroupModal && (
          <NewGroupModal
            show={showNewGroupModal}
            onHide={handleCloseNewGroupModal}
            onSuccess={handleGroupCreated}
          />
        )}
      </div>
    </>
  );
}

// Add the layout property
Dashboard.layout = (page: any) => <Layout children={page} />;
