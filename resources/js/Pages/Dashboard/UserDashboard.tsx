import React from 'react';
import { Head } from '@inertiajs/react';
import { Card, Col, Row, ListGroup, Container } from 'react-bootstrap';
import Layout from '../../Layouts';
import { Link } from '@inertiajs/react';
import { CalendarEvent, Calendar, Chat } from 'react-bootstrap-icons';

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

export default function UserDashboard({
  upcomingEvents,
  announcements,
  pendingRequests,
  recentDocuments,
  birthdayPeople,
  userWidgets,
  recentActivity,
}: Props) {
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

  return (
    <>
      <Head title="Dashboard" />

      <div className="page-content">
        <Container fluid>
          {/* Welcome Section */}
          <Row className="mb-4">
            <Col>
              <Card className="bg-primary text-white">
                <Card.Body>
                  <Row className="align-items-center">
                    <Col>
                      <h4 className="text-white mb-1">Hoş Geldiniz!</h4>
                      <p className="text-white-75 mb-0">Portal'a hoş geldiniz. İhtiyacınız olan tüm araçlara buradan erişebilirsiniz.</p>
                    </Col>
                    <Col xs="auto">
                      <div className="avatar-lg bg-light bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center">
                        <i className="ri-dashboard-line fs-22"></i>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Quick Actions */}
          <Row className="mb-4">
            <Col>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Hızlı Erişim</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={3} className="mb-3">
                      <Link
                        href="/is-talepleri"
                        className="btn btn-outline-primary btn-lg w-100 h-100 d-flex flex-column align-items-center justify-content-center text-decoration-none"
                        style={{ minHeight: '120px' }}
                      >
                        <Chat size={32} className="mb-2" />
                        <span>İş Talepleri</span>
                      </Link>
                    </Col>
                    <Col md={3} className="mb-3">
                        <Link
                            href={route('meal-menu.index')}
                            className="btn btn-outline-success btn-lg w-100 h-100 d-flex flex-column align-items-center justify-content-center text-decoration-none"
                            style={{minHeight: '120px'}}
                        >
                            <i className="ri ri-restaurant-line fs-22 mb-2"></i>
                            <span>Yemek Menüsü</span>
                        </Link>
                    </Col>
                      <Col md={3} className="mb-3">
                          <Link
                              href={route('announcements.index')}
                              className="btn btn-outline-info btn-lg w-100 h-100 d-flex flex-column align-items-center justify-content-center text-decoration-none"
                              style={{minHeight: '120px'}}
                          >
                              <i className="ri ri-message-2-fill fs-22 mb-2"></i>
                              <span>Duyurular</span>
                          </Link>
                      </Col>
                      <Col md={3} className="mb-3">
                          <Link
                              href={route('documents.index')}
                        className="btn btn-outline-warning btn-lg w-100 h-100 d-flex flex-column align-items-center justify-content-center text-decoration-none"
                        style={{ minHeight: '120px' }}
                      >
                        <i className="ri-file-text-line fs-22 mb-2"></i>
                        <span>Dokümanlar</span>
                      </Link>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            {/* Duyurular */}
            <Col lg={4} className="mb-4">
              <Card className="h-100">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <i className="bi bi-megaphone me-2"></i>Son Duyurular
                  </h5>
                  <Link
                    href={route('announcements.index')}
                    className="btn btn-sm btn-outline-primary"
                  >
                    Tümü
                  </Link>
                </Card.Header>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <ListGroup variant="flush">
                    {announcements.slice(0, 5).map((announcement) => (
                      <ListGroup.Item key={announcement.id}>
                        <div>
                          {announcement.is_featured && (
                            <span className="badge bg-danger me-2">Öne Çıkan</span>
                          )}
                          <Link href={route('announcements.show', announcement.id)} className="text-decoration-none">
                            <div className="fw-bold">{announcement.title}</div>
                          </Link>
                          <div className="text-muted small">
                            {announcement.category?.name || 'Genel'} | {formatDate(announcement.created_at)}
                          </div>
                        </div>
                      </ListGroup.Item>
                    ))}
                    {announcements.length === 0 && (
                      <ListGroup.Item className="text-muted">Duyuru yok</ListGroup.Item>
                    )}
                  </ListGroup>
                </div>
              </Card>
            </Col>

            {/* Yaklaşan Etkinlikler */}
            <Col lg={4} className="mb-4">
              <Card className="h-100">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <Calendar className="me-2" />Yaklaşan Etkinlikler
                  </h5>
                  <Link
                    href={route('takvim.index')}
                    className="btn btn-sm btn-outline-success"
                  >
                    Takvim
                  </Link>
                </Card.Header>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <ListGroup variant="flush">
                    {upcomingEvents.slice(0, 5).map((event) => (
                      <ListGroup.Item key={event.id}>
                        <div>
                          <div className="fw-bold">{event.title}</div>
                          <div className="text-muted small">
                            <CalendarEvent className="me-1" />
                            {formatDateTime(event.start_time)}
                          </div>
                          {event.location && <div className="text-muted small">{event.location}</div>}
                        </div>
                      </ListGroup.Item>
                    ))}
                    {upcomingEvents.length === 0 && (
                      <ListGroup.Item className="text-muted">Etkinlik yok</ListGroup.Item>
                    )}
                  </ListGroup>
                </div>
              </Card>
            </Col>

            {/* Doğum Günleri & İş Talepleri */}
            <Col lg={4} className="mb-4">
              {/* Doğum Günleri */}
              {birthdayPeople.length > 0 && (
                <Card className="mb-3">
                  <Card.Header>
                    <h5 className="mb-0">
                      <i className="bi bi-gift me-2"></i>Doğum Günleri
                    </h5>
                  </Card.Header>
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
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
                  </div>
                </Card>
              )}

              {/* Bekleyen İş Talepleri */}
              <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <i className="bi bi-list-task me-2"></i>Bekleyen İş Talepleri
                  </h5>
                  <Link
                    href="/is-talepleri"
                    className="btn btn-sm btn-outline-info"
                  >
                    Tümü
                  </Link>
                </Card.Header>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <ListGroup variant="flush">
                    {pendingRequests.slice(0, 10).map((request) => (
                      <ListGroup.Item key={request.id}>
                        <div>
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="fw-bold">{request.title}</div>
                            <div>
                              <span className={`badge bg-${getStatusVariant(request.status)}`}>
                                {request.status}
                              </span>
                              <span className={`badge bg-${getPriorityVariant(request.priority)} ms-1`}>
                                {request.priority}
                              </span>
                            </div>
                          </div>
                          <div className="text-muted small">
                            {request.requester.first_name} {request.requester.last_name}
                          </div>
                        </div>
                      </ListGroup.Item>
                    ))}
                    {pendingRequests.length === 0 && (
                      <ListGroup.Item className="text-muted">Bekleyen talep yok</ListGroup.Item>
                    )}
                  </ListGroup>
                </div>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
}

// Add the layout property
UserDashboard.layout = (page: any) => <Layout children={page} />;
