import React, { useState } from "react";
import { Head, Link, router, useForm } from "@inertiajs/react";
import {
    Col,
    Container,
    Row,
    Card,
    Form,
    Button,
    Badge,
    Modal,
    InputGroup,
} from "react-bootstrap";
import Layout from "../../../Layouts";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";
import DeleteModal from "../../../Components/Common/DeleteModal";

interface Activity {
    id: number;
    type: string;
    title: string;
    description: string | null;
    activity_date: string;
    end_date: string | null;
    duration_minutes: number | null;
    direction: string | null;
    outcome: string | null;
    outcome_notes: string | null;
    subject_type: string;
    subject: {
        id: number;
        lead_no?: string;
        contact_name?: string;
        name?: string;
    } | null;
    performed_by: {
        id: number;
        name: string;
    } | null;
    created_at: string;
}

interface User {
    id: number;
    name: string;
}

interface Props {
    activities: {
        data: Activity[];
        links: any;
        meta: any;
    };
    users: User[];
    filters: {
        type?: string;
        performed_by?: string;
        date_from?: string;
        date_to?: string;
        search?: string;
    };
}

const activityTypes = [
    { value: "call", label: "Arama", icon: "ri-phone-line", color: "primary" },
    { value: "email", label: "E-posta", icon: "ri-mail-line", color: "info" },
    { value: "meeting", label: "Toplantı", icon: "ri-calendar-event-line", color: "success" },
    { value: "note", label: "Not", icon: "ri-sticky-note-line", color: "warning" },
    { value: "sms", label: "SMS", icon: "ri-message-2-line", color: "secondary" },
    { value: "visit", label: "Ziyaret", icon: "ri-map-pin-line", color: "danger" },
    { value: "demo", label: "Demo", icon: "ri-slideshow-line", color: "dark" },
    { value: "other", label: "Diğer", icon: "ri-more-line", color: "light" },
];

const ActivitiesIndex = ({
    activities = { data: [], links: [], meta: {} },
    users = [],
    filters = {}
}: Props) => {
    const [deleteModal, setDeleteModal] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [search, setSearch] = useState(filters?.search || "");

    const { data, setData, post, processing, errors, reset } = useForm({
        type: "call",
        title: "",
        description: "",
        activity_date: new Date().toISOString().slice(0, 16),
        end_date: "",
        duration_minutes: "",
        direction: "outbound",
        outcome: "",
        outcome_notes: "",
    });

    const handleFilter = (key: string, value: string) => {
        router.get(
            route("crm.activities.index"),
            { ...filters, [key]: value || undefined },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        handleFilter("search", search);
    };

    const handleDelete = () => {
        if (selectedActivity) {
            router.delete(route("crm.activities.destroy", selectedActivity.id), {
                onSuccess: () => setDeleteModal(false),
            });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("crm.activities.store"), {
            onSuccess: () => {
                setShowModal(false);
                reset();
            },
        });
    };

    const getActivityType = (type: string) => {
        return activityTypes.find((t) => t.value === type) || activityTypes[7];
    };

    const formatDateTime = (dateString: string) => {
        return new Intl.DateTimeFormat("tr-TR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(dateString));
    };

    const getSubjectLink = (activity: Activity) => {
        if (!activity.subject) return "-";

        if (activity.subject_type.includes("Lead")) {
            return (
                <Link
                    href={route("crm.leads.show", activity.subject.id)}
                    className="text-primary"
                >
                    {activity.subject.lead_no} - {activity.subject.contact_name}
                </Link>
            );
        }

        if (activity.subject_type.includes("CurrentAccount")) {
            return (
                <Link
                    href={route("current-accounts.show", activity.subject.id)}
                    className="text-primary"
                >
                    {activity.subject.name}
                </Link>
            );
        }

        return activity.subject.name || "-";
    };

    const columns = [
        {
            header: "Tip",
            accessorKey: "type",
            cell: (cell: any) => {
                const type = getActivityType(cell.getValue());
                return (
                    <Badge bg={type.color} className="d-flex align-items-center gap-1" style={{ width: "fit-content" }}>
                        <i className={type.icon}></i>
                        {type.label}
                    </Badge>
                );
            },
        },
        {
            header: "Başlık",
            accessorKey: "title",
            cell: (cell: any) => (
                <div>
                    <div className="fw-medium">{cell.getValue()}</div>
                    {cell.row.original.description && (
                        <small className="text-muted text-truncate d-block" style={{ maxWidth: 250 }}>
                            {cell.row.original.description}
                        </small>
                    )}
                </div>
            ),
        },
        {
            header: "İlişkili",
            cell: (cell: any) => getSubjectLink(cell.row.original),
        },
        {
            header: "Tarih",
            accessorKey: "activity_date",
            cell: (cell: any) => (
                <div>
                    <div>{formatDateTime(cell.getValue())}</div>
                    {cell.row.original.duration_minutes && (
                        <small className="text-muted">
                            {cell.row.original.duration_minutes} dk
                        </small>
                    )}
                </div>
            ),
        },
        {
            header: "Yön",
            accessorKey: "direction",
            cell: (cell: any) => {
                const direction = cell.getValue();
                if (!direction) return "-";
                return (
                    <Badge bg={direction === "inbound" ? "info" : "success"}>
                        {direction === "inbound" ? "Gelen" : "Giden"}
                    </Badge>
                );
            },
        },
        {
            header: "Sonuç",
            accessorKey: "outcome",
            cell: (cell: any) => cell.getValue() || "-",
        },
        {
            header: "Gerçekleştiren",
            accessorKey: "performed_by",
            cell: (cell: any) => cell.getValue()?.name || "-",
        },
        {
            header: "İşlemler",
            cell: (cell: any) => (
                <div className="d-flex gap-2">
                    <Link
                        href={route("crm.activities.edit", cell.row.original.id)}
                        className="btn btn-sm btn-soft-primary"
                        title="Düzenle"
                    >
                        <i className="ri-pencil-line"></i>
                    </Link>
                    <Button
                        variant="soft-danger"
                        size="sm"
                        onClick={() => {
                            setSelectedActivity(cell.row.original);
                            setDeleteModal(true);
                        }}
                        title="Sil"
                    >
                        <i className="ri-delete-bin-line"></i>
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <React.Fragment>
            <Head title="Aktiviteler | CRM" />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Aktiviteler" pageTitle="CRM" />

                    <Row>
                        <Col lg={12}>
                            <Card>
                                <Card.Header className="border-bottom-0">
                                    <Row className="g-3 align-items-center">
                                        <Col md={3}>
                                            <form onSubmit={handleSearch}>
                                                <InputGroup>
                                                    <Form.Control
                                                        type="text"
                                                        placeholder="Ara..."
                                                        value={search}
                                                        onChange={(e) => setSearch(e.target.value)}
                                                    />
                                                    <Button variant="primary" type="submit">
                                                        <i className="ri-search-line"></i>
                                                    </Button>
                                                </InputGroup>
                                            </form>
                                        </Col>
                                        <Col md={2}>
                                            <Form.Select
                                                value={filters.type || ""}
                                                onChange={(e) => handleFilter("type", e.target.value)}
                                            >
                                                <option value="">Tüm Tipler</option>
                                                {activityTypes.map((type) => (
                                                    <option key={type.value} value={type.value}>
                                                        {type.label}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Col>
                                        <Col md={2}>
                                            <Form.Select
                                                value={filters.performed_by || ""}
                                                onChange={(e) => handleFilter("performed_by", e.target.value)}
                                            >
                                                <option value="">Tüm Kullanıcılar</option>
                                                {users.map((user) => (
                                                    <option key={user.id} value={user.id}>
                                                        {user.name}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Col>
                                        <Col md={2}>
                                            <Form.Control
                                                type="date"
                                                value={filters.date_from || ""}
                                                onChange={(e) => handleFilter("date_from", e.target.value)}
                                                placeholder="Başlangıç"
                                            />
                                        </Col>
                                        <Col md={3} className="text-end">
                                            <Button
                                                variant="primary"
                                                onClick={() => setShowModal(true)}
                                            >
                                                <i className="ri-add-line me-1"></i>
                                                Yeni Aktivite
                                            </Button>
                                        </Col>
                                    </Row>
                                </Card.Header>
                                <Card.Body className="pt-0">
                                    <TableContainer
                                        columns={columns}
                                        data={activities.data || []}
                                        isGlobalFilter={false}
                                        customPageSize={20}
                                        divClass="table-responsive"
                                        tableClass="table-hover align-middle"
                                        theadClass="table-light"
                                    />

                                    {activities.links && (
                                        <div className="d-flex justify-content-center mt-3">
                                            <nav>
                                                <ul className="pagination pagination-sm mb-0">
                                                    {activities.links.map((link: any, index: number) => (
                                                        <li
                                                            key={index}
                                                            className={`page-item ${link.active ? "active" : ""} ${!link.url ? "disabled" : ""}`}
                                                        >
                                                            {link.url ? (
                                                                <Link
                                                                    href={link.url}
                                                                    className="page-link"
                                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                                    preserveScroll
                                                                />
                                                            ) : (
                                                                <span
                                                                    className="page-link"
                                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                                />
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </nav>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* New Activity Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Form onSubmit={handleSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>Yeni Aktivite</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Aktivite Tipi *</Form.Label>
                                    <Form.Select
                                        value={data.type}
                                        onChange={(e) => setData("type", e.target.value)}
                                        isInvalid={!!errors.type}
                                    >
                                        {activityTypes.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Yön</Form.Label>
                                    <Form.Select
                                        value={data.direction}
                                        onChange={(e) => setData("direction", e.target.value)}
                                    >
                                        <option value="">Seçiniz</option>
                                        <option value="inbound">Gelen</option>
                                        <option value="outbound">Giden</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Başlık *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={data.title}
                                        onChange={(e) => setData("title", e.target.value)}
                                        isInvalid={!!errors.title}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.title}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Tarih/Saat *</Form.Label>
                                    <Form.Control
                                        type="datetime-local"
                                        value={data.activity_date}
                                        onChange={(e) => setData("activity_date", e.target.value)}
                                        isInvalid={!!errors.activity_date}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Süre (dakika)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="0"
                                        value={data.duration_minutes}
                                        onChange={(e) => setData("duration_minutes", e.target.value)}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Açıklama</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        value={data.description}
                                        onChange={(e) => setData("description", e.target.value)}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Sonuç</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={data.outcome}
                                        onChange={(e) => setData("outcome", e.target.value)}
                                        placeholder="örn: İlgilendi, Geri arayacak"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Sonuç Notları</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={data.outcome_notes}
                                        onChange={(e) => setData("outcome_notes", e.target.value)}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>
                            İptal
                        </Button>
                        <Button variant="primary" type="submit" disabled={processing}>
                            {processing ? "Kaydediliyor..." : "Kaydet"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <DeleteModal
                show={deleteModal}
                onDeleteClick={handleDelete}
                onCloseClick={() => setDeleteModal(false)}
            />
        </React.Fragment>
    );
};

ActivitiesIndex.layout = (page: any) => <Layout children={page} />;
export default ActivitiesIndex;
