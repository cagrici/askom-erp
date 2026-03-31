import React from 'react';
import Layout from '@/Layouts';
import { Head, Link } from '@inertiajs/react';
import { Card, Row, Col, Badge, ListGroup } from 'react-bootstrap';

interface DashboardProps {
    user: {
        id: number;
        name: string;
        first_name: string;
        email: string;
        avatar: string | null;
        roles: string[];
    };
    greeting: string;
    announcements: Array<{
        id: number;
        title: string;
        content: string;
        category: {
            name: string;
            color: string;
        } | null;
        is_featured: boolean;
        created_at: string;
    }>;
    upcomingEvents: Array<{
        id: number;
        title: string;
        start_time: string;
        location: string | null;
    }>;
    pendingTasks: Array<{
        id: number;
        title: string;
        status: string;
        priority: string;
        due_date: string | null;
    }>;
    birthdays: Array<{
        id: number;
        name: string;
        avatar: string | null;
        date: string;
    }>;
    quickLinks: Array<{
        title: string;
        url: string;
        icon: string;
        color: string;
    }>;
    currentDate: string;
}

const Dashboard: React.FC<DashboardProps> = ({
    user,
    greeting,
    announcements,
    upcomingEvents,
    pendingTasks,
    birthdays,
    quickLinks,
    currentDate
}) => {
    const getPriorityBadge = (priority: string) => {
        const config: Record<string, { bg: string; label: string }> = {
            low: { bg: 'success', label: 'Dusuk' },
            medium: { bg: 'info', label: 'Normal' },
            high: { bg: 'warning', label: 'Yuksek' },
            critical: { bg: 'danger', label: 'Kritik' },
        };
        const c = config[priority] || { bg: 'secondary', label: priority };
        return <Badge bg={c.bg} className="fs-10">{c.label}</Badge>;
    };

    const getStatusBadge = (status: string) => {
        const config: Record<string, { bg: string; label: string }> = {
            open: { bg: 'primary', label: 'Acik' },
            in_progress: { bg: 'info', label: 'Devam Ediyor' },
            pending: { bg: 'warning', label: 'Bekliyor' },
            completed: { bg: 'success', label: 'Tamamlandi' },
            closed: { bg: 'secondary', label: 'Kapandi' },
        };
        const c = config[status] || { bg: 'secondary', label: status };
        return <Badge bg={c.bg} className="fs-10">{c.label}</Badge>;
    };

    return (
        <Layout>
            <Head title="Anasayfa" />
            <div className="page-content">
                <div className="container-fluid">
                    {/* Karsilama Alani */}
                    <Row className="mb-4">
                        <Col xs={12}>
                            <Card className="border-0 shadow-sm bg-primary text-white overflow-hidden">
                                <Card.Body className="py-4">
                                    <Row className="align-items-center">
                                        <Col>
                                            <h2 className="mb-1">{greeting}, {user.first_name}!</h2>
                                            <p className="mb-0 opacity-75">{currentDate}</p>
                                            {user.roles.length > 0 && (
                                                <div className="mt-2">
                                                    {user.roles.map((role, idx) => (
                                                        <Badge key={idx} bg="light" text="primary" className="me-1">
                                                            {role}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </Col>
                                        <Col xs="auto" className="d-none d-md-block">
                                            <div className="avatar-xl">
                                                {user.avatar ? (
                                                    <img src={user.avatar} alt={user.name} className="rounded-circle img-fluid" />
                                                ) : (
                                                    <span className="avatar-title bg-white text-primary rounded-circle fs-1">
                                                        {user.first_name.charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Hizli Erisim Butonlari */}
                    {quickLinks.length > 0 && (
                        <Row className="mb-4 g-3">
                            {quickLinks.map((link, idx) => (
                                <Col key={idx} xs={6} sm={4} md={3} lg={2}>
                                    <Link href={link.url} className="text-decoration-none">
                                        <Card className={`card-animate border-0 shadow-sm h-100 bg-${link.color}-subtle`}>
                                            <Card.Body className="text-center py-3">
                                                <div className={`avatar-sm mx-auto mb-2`}>
                                                    <span className={`avatar-title bg-${link.color} text-white rounded-circle fs-4`}>
                                                        <i className={link.icon}></i>
                                                    </span>
                                                </div>
                                                <h6 className={`mb-0 text-${link.color}`}>{link.title}</h6>
                                            </Card.Body>
                                        </Card>
                                    </Link>
                                </Col>
                            ))}
                        </Row>
                    )}

                    <Row className="g-4">
                        {/* Sol Kolon - Duyurular ve Gorevler */}
                        <Col lg={8}>
                            {/* Duyurular */}
                            <Card className="border-0 shadow-sm mb-4">
                                <Card.Header className="bg-transparent border-0 d-flex align-items-center justify-content-between">
                                    <h5 className="card-title mb-0">
                                        <i className="ri-megaphone-line me-2 text-primary"></i>
                                        Duyurular
                                    </h5>
                                    <Link href="/announcements" className="text-primary fs-12">
                                        Tumunu Gor <i className="ri-arrow-right-line"></i>
                                    </Link>
                                </Card.Header>
                                <Card.Body className="pt-0">
                                    {announcements.length === 0 ? (
                                        <div className="text-center py-4">
                                            <i className="ri-notification-off-line fs-1 text-muted"></i>
                                            <p className="text-muted mb-0 mt-2">Henuz duyuru bulunmuyor</p>
                                        </div>
                                    ) : (
                                        <ListGroup variant="flush">
                                            {announcements.map((announcement) => (
                                                <ListGroup.Item key={announcement.id} className="px-0 py-3">
                                                    <div className="d-flex align-items-start">
                                                        <div className="flex-shrink-0 me-3">
                                                            {announcement.is_featured ? (
                                                                <span className="avatar-title bg-warning-subtle text-warning rounded-circle">
                                                                    <i className="ri-star-fill"></i>
                                                                </span>
                                                            ) : (
                                                                <span className={`avatar-title bg-${announcement.category?.color || 'primary'}-subtle text-${announcement.category?.color || 'primary'} rounded-circle`}>
                                                                    <i className="ri-notification-3-line"></i>
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex-grow-1">
                                                            <h6 className="mb-1">
                                                                {announcement.title}
                                                                {announcement.is_featured && (
                                                                    <Badge bg="warning" className="ms-2 fs-10">Onemli</Badge>
                                                                )}
                                                            </h6>
                                                            <p className="text-muted mb-1 fs-13" style={{
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 2,
                                                                WebkitBoxOrient: 'vertical'
                                                            }}>
                                                                {announcement.content}
                                                            </p>
                                                            <small className="text-muted">
                                                                <i className="ri-calendar-line me-1"></i>
                                                                {announcement.created_at}
                                                                {announcement.category && (
                                                                    <Badge bg={`${announcement.category.color}-subtle`} text={announcement.category.color} className="ms-2">
                                                                        {announcement.category.name}
                                                                    </Badge>
                                                                )}
                                                            </small>
                                                        </div>
                                                    </div>
                                                </ListGroup.Item>
                                            ))}
                                        </ListGroup>
                                    )}
                                </Card.Body>
                            </Card>

                            {/* Bekleyen Gorevler */}
                            <Card className="border-0 shadow-sm">
                                <Card.Header className="bg-transparent border-0 d-flex align-items-center justify-content-between">
                                    <h5 className="card-title mb-0">
                                        <i className="ri-task-line me-2 text-info"></i>
                                        Bekleyen Gorevlerim
                                    </h5>
                                    {pendingTasks.length > 0 && (
                                        <Badge bg="info">{pendingTasks.length}</Badge>
                                    )}
                                </Card.Header>
                                <Card.Body className="pt-0">
                                    {pendingTasks.length === 0 ? (
                                        <div className="text-center py-4">
                                            <i className="ri-checkbox-circle-line fs-1 text-success"></i>
                                            <p className="text-muted mb-0 mt-2">Bekleyen goreviniz bulunmuyor</p>
                                        </div>
                                    ) : (
                                        <ListGroup variant="flush">
                                            {pendingTasks.map((task) => (
                                                <ListGroup.Item key={task.id} className="px-0 py-3">
                                                    <div className="d-flex align-items-center justify-content-between">
                                                        <div className="d-flex align-items-center">
                                                            <div className="form-check me-3">
                                                                <input type="checkbox" className="form-check-input" disabled />
                                                            </div>
                                                            <div>
                                                                <h6 className="mb-1">{task.title}</h6>
                                                                <div className="d-flex align-items-center gap-2">
                                                                    {getStatusBadge(task.status)}
                                                                    {getPriorityBadge(task.priority)}
                                                                    {task.due_date && (
                                                                        <small className="text-muted">
                                                                            <i className="ri-calendar-line me-1"></i>
                                                                            {task.due_date}
                                                                        </small>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </ListGroup.Item>
                                            ))}
                                        </ListGroup>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Sag Kolon - Etkinlikler ve Dogum Gunleri */}
                        <Col lg={4}>
                            {/* Yaklasan Etkinlikler */}
                            <Card className="border-0 shadow-sm mb-4">
                                <Card.Header className="bg-transparent border-0">
                                    <h5 className="card-title mb-0">
                                        <i className="ri-calendar-event-line me-2 text-success"></i>
                                        Yaklasan Etkinlikler
                                    </h5>
                                </Card.Header>
                                <Card.Body className="pt-0">
                                    {upcomingEvents.length === 0 ? (
                                        <div className="text-center py-4">
                                            <i className="ri-calendar-line fs-1 text-muted"></i>
                                            <p className="text-muted mb-0 mt-2">Yaklasan etkinlik yok</p>
                                        </div>
                                    ) : (
                                        <ListGroup variant="flush">
                                            {upcomingEvents.map((event) => (
                                                <ListGroup.Item key={event.id} className="px-0 py-3">
                                                    <div className="d-flex align-items-center">
                                                        <div className="flex-shrink-0 me-3">
                                                            <span className="avatar-title bg-success-subtle text-success rounded">
                                                                <i className="ri-calendar-check-line"></i>
                                                            </span>
                                                        </div>
                                                        <div className="flex-grow-1">
                                                            <h6 className="mb-1">{event.title}</h6>
                                                            <small className="text-muted">
                                                                <i className="ri-time-line me-1"></i>
                                                                {event.start_time}
                                                            </small>
                                                            {event.location && (
                                                                <small className="text-muted d-block">
                                                                    <i className="ri-map-pin-line me-1"></i>
                                                                    {event.location}
                                                                </small>
                                                            )}
                                                        </div>
                                                    </div>
                                                </ListGroup.Item>
                                            ))}
                                        </ListGroup>
                                    )}
                                </Card.Body>
                            </Card>

                            {/* Dogum Gunleri */}
                            <Card className="border-0 shadow-sm">
                                <Card.Header className="bg-transparent border-0">
                                    <h5 className="card-title mb-0">
                                        <i className="ri-cake-2-line me-2 text-danger"></i>
                                        Dogum Gunleri
                                    </h5>
                                </Card.Header>
                                <Card.Body className="pt-0">
                                    {birthdays.length === 0 ? (
                                        <div className="text-center py-4">
                                            <i className="ri-cake-line fs-1 text-muted"></i>
                                            <p className="text-muted mb-0 mt-2">Bu hafta dogum gunu yok</p>
                                        </div>
                                    ) : (
                                        <ListGroup variant="flush">
                                            {birthdays.map((person) => (
                                                <ListGroup.Item key={person.id} className="px-0 py-3">
                                                    <div className="d-flex align-items-center">
                                                        <div className="flex-shrink-0 me-3">
                                                            {person.avatar ? (
                                                                <img src={person.avatar} alt={person.name} className="avatar-sm rounded-circle" />
                                                            ) : (
                                                                <span className="avatar-sm">
                                                                    <span className="avatar-title bg-danger-subtle text-danger rounded-circle">
                                                                        {person.name.charAt(0).toUpperCase()}
                                                                    </span>
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex-grow-1">
                                                            <h6 className="mb-0">{person.name}</h6>
                                                            <small className="text-muted">
                                                                <i className="ri-gift-line me-1"></i>
                                                                {person.date}
                                                            </small>
                                                        </div>
                                                    </div>
                                                </ListGroup.Item>
                                            ))}
                                        </ListGroup>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </div>
        </Layout>
    );
};

export default Dashboard;
