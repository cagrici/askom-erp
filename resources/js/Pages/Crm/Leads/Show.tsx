import React, { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import {
    Col,
    Container,
    Row,
    Card,
    Badge,
    Button,
    Tab,
    Nav,
    ListGroup,
    Modal,
    Form,
} from "react-bootstrap";
import Layout from "../../../Layouts";
import BreadCrumb from "../../../Components/Common/BreadCrumb";

interface Lead {
    id: number;
    lead_no: string;
    company_name: string | null;
    contact_name: string;
    contact_title: string | null;
    email: string | null;
    phone: string | null;
    mobile: string | null;
    website: string | null;
    address: string | null;
    city: string | null;
    district: string | null;
    country: string | null;
    industry: string | null;
    company_size: string | null;
    estimated_value: number | null;
    currency: string;
    lead_score: number;
    priority: string;
    priority_label: string;
    notes: string | null;
    requirements: string | null;
    lost_reason: string | null;
    expected_close_date: string | null;
    last_contact_at: string | null;
    next_follow_up_at: string | null;
    converted_at: string | null;
    created_at: string;
    display_name: string;
    is_converted: boolean;
    stage: { id: number; name: string; color: string } | null;
    source: { id: number; name: string } | null;
    assignee: { id: number; name: string } | null;
    sales_representative: { id: number; full_name: string } | null;
    location: { id: number; name: string } | null;
    creator: { id: number; name: string } | null;
    converted_account: { id: number; title: string } | null;
    stage_history: any[];
    activities: any[];
    tasks: any[];
    offers: any[];
}

interface Stage {
    id: number;
    name: string;
    color: string;
}

interface Props {
    lead: Lead;
    stages: Stage[];
    activityTypes: Record<string, string>;
    taskTypes: Record<string, string>;
}

const LeadShow = ({ lead, stages, activityTypes, taskTypes }: Props) => {
    const [stageModal, setStageModal] = useState(false);
    const [selectedStage, setSelectedStage] = useState<number | null>(null);
    const [stageNotes, setStageNotes] = useState("");

    const handleStageChange = () => {
        if (selectedStage) {
            router.patch(
                route("crm.leads.update-stage", lead.id),
                { stage_id: selectedStage, notes: stageNotes },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setStageModal(false);
                        setStageNotes("");
                    },
                }
            );
        }
    };

    const getPriorityBadge = (priority: string) => {
        const variants: Record<string, string> = {
            low: "secondary",
            medium: "info",
            high: "warning",
            urgent: "danger",
        };
        const labels: Record<string, string> = {
            low: "Düşük",
            medium: "Orta",
            high: "Yüksek",
            urgent: "Acil",
        };
        return (
            <Badge bg={variants[priority] || "secondary"}>
                {labels[priority] || priority}
            </Badge>
        );
    };

    const formatDate = (date: string | null) => {
        if (!date) return "-";
        return new Date(date).toLocaleDateString("tr-TR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    };

    const formatDateTime = (date: string | null) => {
        if (!date) return "-";
        return new Date(date).toLocaleString("tr-TR");
    };

    const formatCurrency = (value: number | null, currency: string) => {
        if (!value) return "-";
        return new Intl.NumberFormat("tr-TR", {
            style: "currency",
            currency: currency || "TRY",
        }).format(value);
    };

    return (
        <React.Fragment>
            <Head title={`${lead.lead_no} | Lead Detay`} />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Lead Detay" pageTitle="CRM" />

                    <Row>
                        <Col lg={4}>
                            {/* Lead Info Card */}
                            <Card>
                                <Card.Body>
                                    <div className="text-center mb-4">
                                        <div className="avatar-lg mx-auto mb-3">
                                            <div className="avatar-title bg-primary-subtle text-primary fs-24 rounded-circle">
                                                {lead.contact_name.charAt(0).toUpperCase()}
                                            </div>
                                        </div>
                                        <h5 className="mb-1">{lead.contact_name}</h5>
                                        {lead.company_name && (
                                            <p className="text-muted mb-2">{lead.company_name}</p>
                                        )}
                                        <p className="text-muted mb-3">{lead.lead_no}</p>

                                        {lead.stage && (
                                            <Badge
                                                style={{ backgroundColor: lead.stage.color }}
                                                className="fs-12 px-3 py-2 mb-3"
                                            >
                                                {lead.stage.name}
                                            </Badge>
                                        )}

                                        <div className="d-flex justify-content-center gap-2">
                                            {!lead.is_converted && (
                                                <>
                                                    <Button
                                                        variant="soft-primary"
                                                        size="sm"
                                                        onClick={() => setStageModal(true)}
                                                    >
                                                        <i className="ri-exchange-line me-1"></i>
                                                        Aşama Değiştir
                                                    </Button>
                                                    <Link
                                                        href={route("crm.leads.convert.show", lead.id)}
                                                        className="btn btn-sm btn-soft-success"
                                                    >
                                                        <i className="ri-user-add-line me-1"></i>
                                                        Dönüştür
                                                    </Link>
                                                </>
                                            )}
                                            {lead.is_converted && (
                                                <Badge bg="success" className="fs-12 px-3 py-2">
                                                    <i className="ri-check-line me-1"></i>
                                                    Dönüştürüldü
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="border-top pt-3">
                                        <h6 className="text-muted text-uppercase mb-3">İletişim</h6>
                                        <ListGroup variant="flush">
                                            {lead.email && (
                                                <ListGroup.Item className="px-0">
                                                    <i className="ri-mail-line me-2 text-muted"></i>
                                                    <a href={`mailto:${lead.email}`}>{lead.email}</a>
                                                </ListGroup.Item>
                                            )}
                                            {lead.phone && (
                                                <ListGroup.Item className="px-0">
                                                    <i className="ri-phone-line me-2 text-muted"></i>
                                                    <a href={`tel:${lead.phone}`}>{lead.phone}</a>
                                                </ListGroup.Item>
                                            )}
                                            {lead.mobile && (
                                                <ListGroup.Item className="px-0">
                                                    <i className="ri-smartphone-line me-2 text-muted"></i>
                                                    <a href={`tel:${lead.mobile}`}>{lead.mobile}</a>
                                                </ListGroup.Item>
                                            )}
                                            {lead.website && (
                                                <ListGroup.Item className="px-0">
                                                    <i className="ri-global-line me-2 text-muted"></i>
                                                    <a href={lead.website} target="_blank" rel="noopener noreferrer">
                                                        {lead.website}
                                                    </a>
                                                </ListGroup.Item>
                                            )}
                                        </ListGroup>
                                    </div>
                                </Card.Body>
                            </Card>

                            {/* Stats Card */}
                            <Card>
                                <Card.Body>
                                    <h6 className="text-muted text-uppercase mb-3">Bilgiler</h6>
                                    <div className="table-responsive">
                                        <table className="table table-borderless mb-0">
                                            <tbody>
                                                <tr>
                                                    <td className="text-muted">Öncelik</td>
                                                    <td>{getPriorityBadge(lead.priority)}</td>
                                                </tr>
                                                <tr>
                                                    <td className="text-muted">Skor</td>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <div className="progress progress-sm flex-grow-1 me-2" style={{ width: 80 }}>
                                                                <div
                                                                    className="progress-bar bg-primary"
                                                                    style={{ width: `${lead.lead_score}%` }}
                                                                ></div>
                                                            </div>
                                                            <span>{lead.lead_score}</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="text-muted">Kaynak</td>
                                                    <td>{lead.source?.name || "-"}</td>
                                                </tr>
                                                <tr>
                                                    <td className="text-muted">Tahmini Değer</td>
                                                    <td>{formatCurrency(lead.estimated_value, lead.currency)}</td>
                                                </tr>
                                                <tr>
                                                    <td className="text-muted">Sorumlu</td>
                                                    <td>{lead.assignee?.name || "-"}</td>
                                                </tr>
                                                <tr>
                                                    <td className="text-muted">Satış Temsilcisi</td>
                                                    <td>{lead.sales_representative?.full_name || "-"}</td>
                                                </tr>
                                                <tr>
                                                    <td className="text-muted">Lokasyon</td>
                                                    <td>{lead.location?.name || "-"}</td>
                                                </tr>
                                                <tr>
                                                    <td className="text-muted">Beklenen Kapanış</td>
                                                    <td>{formatDate(lead.expected_close_date)}</td>
                                                </tr>
                                                <tr>
                                                    <td className="text-muted">Son İletişim</td>
                                                    <td>{formatDateTime(lead.last_contact_at)}</td>
                                                </tr>
                                                <tr>
                                                    <td className="text-muted">Sonraki Takip</td>
                                                    <td>{formatDateTime(lead.next_follow_up_at)}</td>
                                                </tr>
                                                <tr>
                                                    <td className="text-muted">Oluşturulma</td>
                                                    <td>{formatDate(lead.created_at)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col lg={8}>
                            <Card>
                                <Card.Header>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <h5 className="card-title mb-0">Detaylar</h5>
                                        <Link
                                            href={route("crm.leads.edit", lead.id)}
                                            className="btn btn-sm btn-primary"
                                        >
                                            <i className="ri-pencil-line me-1"></i>
                                            Düzenle
                                        </Link>
                                    </div>
                                </Card.Header>
                                <Card.Body>
                                    <Tab.Container defaultActiveKey="timeline">
                                        <Nav variant="tabs" className="nav-tabs-custom mb-3">
                                            <Nav.Item>
                                                <Nav.Link eventKey="timeline">
                                                    <i className="ri-time-line me-1"></i>
                                                    Zaman Çizelgesi
                                                </Nav.Link>
                                            </Nav.Item>
                                            <Nav.Item>
                                                <Nav.Link eventKey="activities">
                                                    <i className="ri-phone-line me-1"></i>
                                                    Aktiviteler ({lead.activities?.length || 0})
                                                </Nav.Link>
                                            </Nav.Item>
                                            <Nav.Item>
                                                <Nav.Link eventKey="tasks">
                                                    <i className="ri-task-line me-1"></i>
                                                    Görevler ({lead.tasks?.length || 0})
                                                </Nav.Link>
                                            </Nav.Item>
                                            <Nav.Item>
                                                <Nav.Link eventKey="notes">
                                                    <i className="ri-file-text-line me-1"></i>
                                                    Notlar
                                                </Nav.Link>
                                            </Nav.Item>
                                        </Nav>

                                        <Tab.Content>
                                            <Tab.Pane eventKey="timeline">
                                                <div className="timeline">
                                                    {lead.stage_history && lead.stage_history.length > 0 ? (
                                                        lead.stage_history.map((history: any, index: number) => (
                                                            <div key={index} className="timeline-item">
                                                                <div className="timeline-icon">
                                                                    <i className="ri-exchange-line"></i>
                                                                </div>
                                                                <div className="timeline-content">
                                                                    <div className="d-flex justify-content-between">
                                                                        <span>
                                                                            <strong>{history.from_stage?.name || "Yeni"}</strong>
                                                                            {" → "}
                                                                            <strong>{history.to_stage?.name}</strong>
                                                                        </span>
                                                                        <small className="text-muted">
                                                                            {formatDateTime(history.created_at)}
                                                                        </small>
                                                                    </div>
                                                                    {history.notes && (
                                                                        <p className="text-muted mb-0 mt-1">{history.notes}</p>
                                                                    )}
                                                                    <small className="text-muted">
                                                                        {history.changed_by?.name}
                                                                    </small>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-center text-muted py-4">
                                                            Henüz aşama değişikliği yok.
                                                        </div>
                                                    )}
                                                </div>
                                            </Tab.Pane>

                                            <Tab.Pane eventKey="activities">
                                                {lead.activities && lead.activities.length > 0 ? (
                                                    <ListGroup variant="flush">
                                                        {lead.activities.map((activity: any, index: number) => (
                                                            <ListGroup.Item key={index}>
                                                                <div className="d-flex">
                                                                    <div className="avatar-sm me-3">
                                                                        <div className="avatar-title bg-primary-subtle text-primary rounded-circle">
                                                                            <i className={activity.type_icon}></i>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-grow-1">
                                                                        <h6 className="mb-1">{activity.title}</h6>
                                                                        <p className="text-muted mb-1">{activity.description}</p>
                                                                        <small className="text-muted">
                                                                            {activity.performer?.name} - {formatDateTime(activity.activity_date)}
                                                                        </small>
                                                                    </div>
                                                                </div>
                                                            </ListGroup.Item>
                                                        ))}
                                                    </ListGroup>
                                                ) : (
                                                    <div className="text-center text-muted py-4">
                                                        Henüz aktivite kaydedilmemiş.
                                                    </div>
                                                )}
                                            </Tab.Pane>

                                            <Tab.Pane eventKey="tasks">
                                                {lead.tasks && lead.tasks.length > 0 ? (
                                                    <ListGroup variant="flush">
                                                        {lead.tasks.map((task: any, index: number) => (
                                                            <ListGroup.Item key={index}>
                                                                <div className="d-flex align-items-center">
                                                                    <Form.Check
                                                                        type="checkbox"
                                                                        checked={task.status === "completed"}
                                                                        disabled
                                                                        className="me-2"
                                                                    />
                                                                    <div className="flex-grow-1">
                                                                        <span className={task.status === "completed" ? "text-decoration-line-through text-muted" : ""}>
                                                                            {task.title}
                                                                        </span>
                                                                        <small className="text-muted ms-2">
                                                                            {formatDateTime(task.due_date)}
                                                                        </small>
                                                                    </div>
                                                                    <Badge bg={task.is_overdue ? "danger" : "secondary"}>
                                                                        {task.status_label}
                                                                    </Badge>
                                                                </div>
                                                            </ListGroup.Item>
                                                        ))}
                                                    </ListGroup>
                                                ) : (
                                                    <div className="text-center text-muted py-4">
                                                        Henüz görev oluşturulmamış.
                                                    </div>
                                                )}
                                            </Tab.Pane>

                                            <Tab.Pane eventKey="notes">
                                                <Row>
                                                    <Col md={12}>
                                                        <h6>Genel Notlar</h6>
                                                        <p className="text-muted">{lead.notes || "Not girilmemiş."}</p>
                                                    </Col>
                                                    <Col md={12}>
                                                        <h6>İhtiyaçlar / Gereksinimler</h6>
                                                        <p className="text-muted">{lead.requirements || "Gereksinim girilmemiş."}</p>
                                                    </Col>
                                                    {lead.lost_reason && (
                                                        <Col md={12}>
                                                            <h6 className="text-danger">Kayıp Nedeni</h6>
                                                            <p className="text-muted">{lead.lost_reason}</p>
                                                        </Col>
                                                    )}
                                                </Row>
                                            </Tab.Pane>
                                        </Tab.Content>
                                    </Tab.Container>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* Stage Change Modal */}
            <Modal show={stageModal} onHide={() => setStageModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Aşama Değiştir</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Yeni Aşama</Form.Label>
                        <Form.Select
                            value={selectedStage || ""}
                            onChange={(e) => setSelectedStage(Number(e.target.value))}
                        >
                            <option value="">Seçiniz</option>
                            {stages.map((stage) => (
                                <option
                                    key={stage.id}
                                    value={stage.id}
                                    disabled={stage.id === lead.stage?.id}
                                >
                                    {stage.name}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Not (Opsiyonel)</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={stageNotes}
                            onChange={(e) => setStageNotes(e.target.value)}
                            placeholder="Aşama değişikliği hakkında not..."
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setStageModal(false)}>
                        İptal
                    </Button>
                    <Button variant="primary" onClick={handleStageChange} disabled={!selectedStage}>
                        Kaydet
                    </Button>
                </Modal.Footer>
            </Modal>
        </React.Fragment>
    );
};

LeadShow.layout = (page: any) => <Layout children={page} />;
export default LeadShow;
