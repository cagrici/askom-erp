import React, { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import {
    Col,
    Container,
    Row,
    Card,
    Form,
    Button,
    Badge,
    InputGroup,
} from "react-bootstrap";
import Layout from "../../../Layouts";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import TableContainer from "../../../Components/Common/TableContainer";
import DeleteModal from "../../../Components/Common/DeleteModal";

interface Lead {
    id: number;
    lead_no: string;
    company_name: string | null;
    contact_name: string;
    email: string | null;
    phone: string | null;
    lead_score: number;
    priority: string;
    priority_label: string;
    estimated_value: number | null;
    currency: string;
    stage: {
        id: number;
        name: string;
        color: string;
    } | null;
    source: {
        id: number;
        name: string;
    } | null;
    assignee: {
        id: number;
        name: string;
    } | null;
    created_at: string;
    display_name: string;
}

interface Stage {
    id: number;
    name: string;
    color: string;
}

interface Source {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
}

interface Props {
    leads: {
        data: Lead[];
        links: any;
        meta: any;
    };
    stages: Stage[];
    sources: Source[];
    users: User[];
    filters: {
        stage_id?: string;
        source_id?: string;
        assigned_to?: string;
        priority?: string;
        search?: string;
        date_from?: string;
        date_to?: string;
        show_all?: string;
    };
}

const LeadsIndex = ({ leads, stages, sources, users, filters }: Props) => {
    const [deleteModal, setDeleteModal] = useState(false);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [search, setSearch] = useState(filters.search || "");

    const handleFilter = (key: string, value: string) => {
        router.get(
            route("crm.leads.index"),
            { ...filters, [key]: value || undefined },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        handleFilter("search", search);
    };

    const handleDelete = () => {
        if (selectedLead) {
            router.delete(route("crm.leads.destroy", selectedLead.id), {
                onSuccess: () => setDeleteModal(false),
            });
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

    const columns = [
        {
            header: "Lead No",
            accessorKey: "lead_no",
            cell: (cell: any) => (
                <Link
                    href={route("crm.leads.show", cell.row.original.id)}
                    className="fw-medium text-primary"
                >
                    {cell.getValue()}
                </Link>
            ),
        },
        {
            header: "İletişim",
            accessorKey: "display_name",
            cell: (cell: any) => (
                <div>
                    <div className="fw-medium">{cell.row.original.contact_name}</div>
                    {cell.row.original.company_name && (
                        <small className="text-muted">{cell.row.original.company_name}</small>
                    )}
                </div>
            ),
        },
        {
            header: "E-posta / Telefon",
            cell: (cell: any) => (
                <div>
                    {cell.row.original.email && (
                        <div><i className="ri-mail-line me-1"></i>{cell.row.original.email}</div>
                    )}
                    {cell.row.original.phone && (
                        <div><i className="ri-phone-line me-1"></i>{cell.row.original.phone}</div>
                    )}
                </div>
            ),
        },
        {
            header: "Aşama",
            accessorKey: "stage",
            cell: (cell: any) => {
                const stage = cell.getValue();
                if (!stage) return "-";
                return (
                    <Badge style={{ backgroundColor: stage.color }}>
                        {stage.name}
                    </Badge>
                );
            },
        },
        {
            header: "Kaynak",
            accessorKey: "source",
            cell: (cell: any) => cell.getValue()?.name || "-",
        },
        {
            header: "Öncelik",
            accessorKey: "priority",
            cell: (cell: any) => getPriorityBadge(cell.getValue()),
        },
        {
            header: "Skor",
            accessorKey: "lead_score",
            cell: (cell: any) => (
                <div className="d-flex align-items-center">
                    <div className="flex-grow-1 me-2" style={{ width: 60 }}>
                        <div className="progress progress-sm">
                            <div
                                className="progress-bar bg-primary"
                                style={{ width: `${cell.getValue()}%` }}
                            ></div>
                        </div>
                    </div>
                    <span className="text-muted">{cell.getValue()}</span>
                </div>
            ),
        },
        {
            header: "Tahmini Değer",
            accessorKey: "estimated_value",
            cell: (cell: any) => {
                const value = cell.getValue();
                if (!value) return "-";
                return new Intl.NumberFormat("tr-TR", {
                    style: "currency",
                    currency: cell.row.original.currency || "TRY",
                }).format(value);
            },
        },
        {
            header: "Sorumlu",
            accessorKey: "assignee",
            cell: (cell: any) => cell.getValue()?.name || "-",
        },
        {
            header: "İşlemler",
            cell: (cell: any) => (
                <div className="d-flex gap-2">
                    <Link
                        href={route("crm.leads.show", cell.row.original.id)}
                        className="btn btn-sm btn-soft-info"
                        title="Görüntüle"
                    >
                        <i className="ri-eye-line"></i>
                    </Link>
                    <Link
                        href={route("crm.leads.edit", cell.row.original.id)}
                        className="btn btn-sm btn-soft-primary"
                        title="Düzenle"
                    >
                        <i className="ri-pencil-line"></i>
                    </Link>
                    <Button
                        variant="soft-danger"
                        size="sm"
                        onClick={() => {
                            setSelectedLead(cell.row.original);
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
            <Head title="Lead Yönetimi | CRM" />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Lead Listesi" pageTitle="CRM" />

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
                                                value={filters.stage_id || ""}
                                                onChange={(e) => handleFilter("stage_id", e.target.value)}
                                            >
                                                <option value="">Tüm Aşamalar</option>
                                                {stages.map((stage) => (
                                                    <option key={stage.id} value={stage.id}>
                                                        {stage.name}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Col>
                                        <Col md={2}>
                                            <Form.Select
                                                value={filters.source_id || ""}
                                                onChange={(e) => handleFilter("source_id", e.target.value)}
                                            >
                                                <option value="">Tüm Kaynaklar</option>
                                                {sources.map((source) => (
                                                    <option key={source.id} value={source.id}>
                                                        {source.name}
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
                                        <Col md={3} className="text-end">
                                            <div className="d-flex gap-2 justify-content-end">
                                                <Link
                                                    href={route("crm.leads.kanban")}
                                                    className="btn btn-soft-secondary"
                                                >
                                                    <i className="ri-layout-masonry-line me-1"></i>
                                                    Kanban
                                                </Link>
                                                <Link
                                                    href={route("crm.leads.create")}
                                                    className="btn btn-primary"
                                                >
                                                    <i className="ri-add-line me-1"></i>
                                                    Yeni Lead
                                                </Link>
                                            </div>
                                        </Col>
                                    </Row>
                                </Card.Header>
                                <Card.Body className="pt-0">
                                    <TableContainer
                                        columns={columns}
                                        data={leads.data || []}
                                        isGlobalFilter={false}
                                        customPageSize={20}
                                        divClass="table-responsive"
                                        tableClass="table-hover align-middle"
                                        theadClass="table-light"
                                    />

                                    {/* Pagination */}
                                    {leads.links && (
                                        <div className="d-flex justify-content-center mt-3">
                                            <nav>
                                                <ul className="pagination pagination-sm mb-0">
                                                    {leads.links.map((link: any, index: number) => (
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

            <DeleteModal
                show={deleteModal}
                onDeleteClick={handleDelete}
                onCloseClick={() => setDeleteModal(false)}
            />
        </React.Fragment>
    );
};

LeadsIndex.layout = (page: any) => <Layout children={page} />;
export default LeadsIndex;
