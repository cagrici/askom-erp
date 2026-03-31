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

interface Task {
    id: number;
    type: string;
    title: string;
    description: string | null;
    priority: string;
    status: string;
    due_date: string;
    reminder_date: string | null;
    completed_at: string | null;
    completion_notes: string | null;
    subject_type: string;
    subject: {
        id: number;
        lead_no?: string;
        contact_name?: string;
        name?: string;
    } | null;
    assignee: {
        id: number;
        name: string;
    } | null;
    completer: {
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
    tasks: {
        data: Task[];
        links: any;
        meta: any;
    };
    users: User[];
    filters: {
        type?: string;
        status?: string;
        priority?: string;
        assigned_to?: string;
        date_from?: string;
        date_to?: string;
        search?: string;
    };
    stats: {
        pending: number;
        in_progress: number;
        completed: number;
        overdue: number;
    };
}

const taskTypes = [
    { value: "call", label: "Arama", icon: "ri-phone-line" },
    { value: "email", label: "E-posta", icon: "ri-mail-send-line" },
    { value: "meeting", label: "Toplantı", icon: "ri-calendar-check-line" },
    { value: "follow_up", label: "Takip", icon: "ri-user-follow-line" },
    { value: "proposal", label: "Teklif", icon: "ri-file-text-line" },
    { value: "demo", label: "Demo", icon: "ri-slideshow-line" },
    { value: "visit", label: "Ziyaret", icon: "ri-map-pin-line" },
    { value: "other", label: "Diğer", icon: "ri-checkbox-circle-line" },
];

const TasksIndex = ({ tasks, users, filters, stats }: Props) => {
    const [deleteModal, setDeleteModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [search, setSearch] = useState(filters.search || "");

    const { data, setData, post, processing, errors, reset } = useForm({
        type: "call",
        title: "",
        description: "",
        priority: "medium",
        due_date: "",
        reminder_date: "",
        assigned_to: "",
    });

    const handleFilter = (key: string, value: string) => {
        router.get(
            route("crm.tasks.index"),
            { ...filters, [key]: value || undefined },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        handleFilter("search", search);
    };

    const handleDelete = () => {
        if (selectedTask) {
            router.delete(route("crm.tasks.destroy", selectedTask.id), {
                onSuccess: () => setDeleteModal(false),
            });
        }
    };

    const handleComplete = (taskId: number) => {
        router.patch(route("crm.tasks.complete", taskId), {}, {
            preserveScroll: true,
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("crm.tasks.store"), {
            onSuccess: () => {
                setShowModal(false);
                reset();
            },
        });
    };

    const getTaskType = (type: string) => {
        return taskTypes.find((t) => t.value === type) || taskTypes[7];
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
        return <Badge bg={variants[priority] || "secondary"}>{labels[priority] || priority}</Badge>;
    };

    const getStatusBadge = (status: string, dueDate: string) => {
        const isOverdue = new Date(dueDate) < new Date() && status !== "completed";

        if (isOverdue) {
            return <Badge bg="danger">Gecikmiş</Badge>;
        }

        const variants: Record<string, string> = {
            pending: "warning",
            in_progress: "info",
            completed: "success",
            cancelled: "secondary",
        };
        const labels: Record<string, string> = {
            pending: "Bekliyor",
            in_progress: "Devam Ediyor",
            completed: "Tamamlandı",
            cancelled: "İptal",
        };
        return <Badge bg={variants[status] || "secondary"}>{labels[status] || status}</Badge>;
    };

    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat("tr-TR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }).format(new Date(dateString));
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

    const getSubjectLink = (task: Task) => {
        if (!task.subject) return "-";

        if (task.subject_type.includes("Lead")) {
            return (
                <Link
                    href={route("crm.leads.show", task.subject.id)}
                    className="text-primary"
                >
                    {task.subject.lead_no}
                </Link>
            );
        }

        if (task.subject_type.includes("CurrentAccount")) {
            return (
                <Link
                    href={route("current-accounts.show", task.subject.id)}
                    className="text-primary"
                >
                    {task.subject.name}
                </Link>
            );
        }

        return task.subject.name || "-";
    };

    const columns = [
        {
            header: "",
            accessorKey: "status",
            cell: (cell: any) => {
                const task = cell.row.original;
                if (task.status === "completed") {
                    return (
                        <i className="ri-checkbox-circle-fill text-success fs-5"></i>
                    );
                }
                return (
                    <Button
                        variant="link"
                        className="p-0"
                        onClick={() => handleComplete(task.id)}
                        title="Tamamla"
                    >
                        <i className="ri-checkbox-blank-circle-line text-muted fs-5"></i>
                    </Button>
                );
            },
        },
        {
            header: "Tip",
            accessorKey: "type",
            cell: (cell: any) => {
                const type = getTaskType(cell.getValue());
                return (
                    <span className="d-flex align-items-center gap-1">
                        <i className={`${type.icon} text-primary`}></i>
                        {type.label}
                    </span>
                );
            },
        },
        {
            header: "Başlık",
            accessorKey: "title",
            cell: (cell: any) => {
                const task = cell.row.original;
                return (
                    <div>
                        <div className={`fw-medium ${task.status === "completed" ? "text-decoration-line-through text-muted" : ""}`}>
                            {cell.getValue()}
                        </div>
                        {task.description && (
                            <small className="text-muted text-truncate d-block" style={{ maxWidth: 250 }}>
                                {task.description}
                            </small>
                        )}
                    </div>
                );
            },
        },
        {
            header: "İlişkili",
            cell: (cell: any) => getSubjectLink(cell.row.original),
        },
        {
            header: "Bitiş Tarihi",
            accessorKey: "due_date",
            cell: (cell: any) => {
                const task = cell.row.original;
                const isOverdue = new Date(cell.getValue()) < new Date() && task.status !== "completed";
                return (
                    <span className={isOverdue ? "text-danger fw-medium" : ""}>
                        {formatDate(cell.getValue())}
                    </span>
                );
            },
        },
        {
            header: "Öncelik",
            accessorKey: "priority",
            cell: (cell: any) => getPriorityBadge(cell.getValue()),
        },
        {
            header: "Durum",
            cell: (cell: any) => getStatusBadge(cell.row.original.status, cell.row.original.due_date),
        },
        {
            header: "Atanan",
            accessorKey: "assignee",
            cell: (cell: any) => cell.getValue()?.name || "-",
        },
        {
            header: "İşlemler",
            cell: (cell: any) => (
                <div className="d-flex gap-2">
                    <Link
                        href={route("crm.tasks.edit", cell.row.original.id)}
                        className="btn btn-sm btn-soft-primary"
                        title="Düzenle"
                    >
                        <i className="ri-pencil-line"></i>
                    </Link>
                    <Button
                        variant="soft-danger"
                        size="sm"
                        onClick={() => {
                            setSelectedTask(cell.row.original);
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
            <Head title="Görevler | CRM" />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Görevler" pageTitle="CRM" />

                    {/* Stats Cards */}
                    <Row className="mb-3">
                        <Col md={3}>
                            <Card
                                className={`cursor-pointer ${filters.status === "pending" ? "border-warning" : ""}`}
                                onClick={() => handleFilter("status", filters.status === "pending" ? "" : "pending")}
                            >
                                <Card.Body className="py-3">
                                    <div className="d-flex justify-content-between">
                                        <div>
                                            <p className="mb-1 text-muted">Bekleyen</p>
                                            <h4 className="mb-0">{stats.pending}</h4>
                                        </div>
                                        <div className="avatar-sm">
                                            <span className="avatar-title bg-soft-warning rounded-circle">
                                                <i className="ri-time-line text-warning fs-4"></i>
                                            </span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={3}>
                            <Card
                                className={`cursor-pointer ${filters.status === "in_progress" ? "border-info" : ""}`}
                                onClick={() => handleFilter("status", filters.status === "in_progress" ? "" : "in_progress")}
                            >
                                <Card.Body className="py-3">
                                    <div className="d-flex justify-content-between">
                                        <div>
                                            <p className="mb-1 text-muted">Devam Eden</p>
                                            <h4 className="mb-0">{stats.in_progress}</h4>
                                        </div>
                                        <div className="avatar-sm">
                                            <span className="avatar-title bg-soft-info rounded-circle">
                                                <i className="ri-loader-4-line text-info fs-4"></i>
                                            </span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={3}>
                            <Card
                                className={`cursor-pointer ${filters.status === "completed" ? "border-success" : ""}`}
                                onClick={() => handleFilter("status", filters.status === "completed" ? "" : "completed")}
                            >
                                <Card.Body className="py-3">
                                    <div className="d-flex justify-content-between">
                                        <div>
                                            <p className="mb-1 text-muted">Tamamlanan</p>
                                            <h4 className="mb-0">{stats.completed}</h4>
                                        </div>
                                        <div className="avatar-sm">
                                            <span className="avatar-title bg-soft-success rounded-circle">
                                                <i className="ri-checkbox-circle-line text-success fs-4"></i>
                                            </span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={3}>
                            <Card className="border-danger">
                                <Card.Body className="py-3">
                                    <div className="d-flex justify-content-between">
                                        <div>
                                            <p className="mb-1 text-muted">Gecikmiş</p>
                                            <h4 className="mb-0 text-danger">{stats.overdue}</h4>
                                        </div>
                                        <div className="avatar-sm">
                                            <span className="avatar-title bg-soft-danger rounded-circle">
                                                <i className="ri-error-warning-line text-danger fs-4"></i>
                                            </span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

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
                                                {taskTypes.map((type) => (
                                                    <option key={type.value} value={type.value}>
                                                        {type.label}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Col>
                                        <Col md={2}>
                                            <Form.Select
                                                value={filters.priority || ""}
                                                onChange={(e) => handleFilter("priority", e.target.value)}
                                            >
                                                <option value="">Tüm Öncelikler</option>
                                                <option value="urgent">Acil</option>
                                                <option value="high">Yüksek</option>
                                                <option value="medium">Orta</option>
                                                <option value="low">Düşük</option>
                                            </Form.Select>
                                        </Col>
                                        <Col md={2}>
                                            <Form.Select
                                                value={filters.assigned_to || ""}
                                                onChange={(e) => handleFilter("assigned_to", e.target.value)}
                                            >
                                                <option value="">Tüm Kullanıcılar</option>
                                                {users.map((user) => (
                                                    <option key={user.id} value={user.id}>
                                                        {user.name}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Col>
                                        <Col md={3} className="text-end">
                                            <Button
                                                variant="primary"
                                                onClick={() => setShowModal(true)}
                                            >
                                                <i className="ri-add-line me-1"></i>
                                                Yeni Görev
                                            </Button>
                                        </Col>
                                    </Row>
                                </Card.Header>
                                <Card.Body className="pt-0">
                                    <TableContainer
                                        columns={columns}
                                        data={tasks.data || []}
                                        isGlobalFilter={false}
                                        customPageSize={20}
                                        divClass="table-responsive"
                                        tableClass="table-hover align-middle"
                                        theadClass="table-light"
                                    />

                                    {tasks.links && (
                                        <div className="d-flex justify-content-center mt-3">
                                            <nav>
                                                <ul className="pagination pagination-sm mb-0">
                                                    {tasks.links.map((link: any, index: number) => (
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

            {/* New Task Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Form onSubmit={handleSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>Yeni Görev</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Görev Tipi *</Form.Label>
                                    <Form.Select
                                        value={data.type}
                                        onChange={(e) => setData("type", e.target.value)}
                                        isInvalid={!!errors.type}
                                    >
                                        {taskTypes.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Öncelik *</Form.Label>
                                    <Form.Select
                                        value={data.priority}
                                        onChange={(e) => setData("priority", e.target.value)}
                                        isInvalid={!!errors.priority}
                                    >
                                        <option value="low">Düşük</option>
                                        <option value="medium">Orta</option>
                                        <option value="high">Yüksek</option>
                                        <option value="urgent">Acil</option>
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
                                    <Form.Label>Bitiş Tarihi *</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={data.due_date}
                                        onChange={(e) => setData("due_date", e.target.value)}
                                        isInvalid={!!errors.due_date}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.due_date}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Hatırlatma</Form.Label>
                                    <Form.Control
                                        type="datetime-local"
                                        value={data.reminder_date}
                                        onChange={(e) => setData("reminder_date", e.target.value)}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Atanan Kişi</Form.Label>
                                    <Form.Select
                                        value={data.assigned_to}
                                        onChange={(e) => setData("assigned_to", e.target.value)}
                                    >
                                        <option value="">Seçiniz</option>
                                        {users.map((user) => (
                                            <option key={user.id} value={user.id}>
                                                {user.name}
                                            </option>
                                        ))}
                                    </Form.Select>
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

TasksIndex.layout = (page: any) => <Layout children={page} />;
export default TasksIndex;
