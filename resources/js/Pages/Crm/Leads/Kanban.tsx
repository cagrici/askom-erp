import React, { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import {
    Col,
    Container,
    Row,
    Card,
    Badge,
    Button,
    Dropdown,
} from "react-bootstrap";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import Layout from "../../../Layouts";
import BreadCrumb from "../../../Components/Common/BreadCrumb";

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
    next_follow_up_at: string | null;
}

interface Stage {
    id: number;
    name: string;
    color: string;
    is_won: boolean;
    is_lost: boolean;
    win_probability: number;
}

interface Props {
    stages: Stage[];
    leadsByStage: Record<number, Lead[]>;
    summary: {
        total_leads: number;
        total_value: number;
        weighted_value: number;
    };
}

const LeadsKanban = ({
    stages = [],
    leadsByStage = {},
    summary = { total_leads: 0, total_value: 0, weighted_value: 0 }
}: Props) => {
    const [localLeads, setLocalLeads] = useState<Record<number, Lead[]>>(leadsByStage || {});

    const handleDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const sourceStageId = parseInt(source.droppableId);
        const destStageId = parseInt(destination.droppableId);
        const leadId = parseInt(draggableId);

        // Optimistic update
        const sourceLeads = [...(localLeads[sourceStageId] || [])];
        const destLeads = sourceStageId === destStageId
            ? sourceLeads
            : [...(localLeads[destStageId] || [])];

        const [movedLead] = sourceLeads.splice(source.index, 1);

        if (sourceStageId === destStageId) {
            sourceLeads.splice(destination.index, 0, movedLead);
            setLocalLeads({
                ...localLeads,
                [sourceStageId]: sourceLeads,
            });
        } else {
            // Update lead's stage info for display
            const destStage = stages.find(s => s.id === destStageId);
            if (destStage) {
                movedLead.stage = {
                    id: destStage.id,
                    name: destStage.name,
                    color: destStage.color,
                };
            }
            destLeads.splice(destination.index, 0, movedLead);
            setLocalLeads({
                ...localLeads,
                [sourceStageId]: sourceLeads,
                [destStageId]: destLeads,
            });

            // Send update to server
            router.patch(
                route("crm.leads.update-stage", leadId),
                { lead_stage_id: destStageId },
                { preserveScroll: true, preserveState: true }
            );
        }
    };

    const getPriorityColor = (priority: string) => {
        const colors: Record<string, string> = {
            low: "secondary",
            medium: "info",
            high: "warning",
            urgent: "danger",
        };
        return colors[priority] || "secondary";
    };

    const formatCurrency = (value: number | null, currency: string) => {
        if (!value) return null;
        return new Intl.NumberFormat("tr-TR", {
            style: "currency",
            currency: currency || "TRY",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const getStageTotal = (stageId: number) => {
        const leads = localLeads[stageId] || [];
        return leads.reduce((sum, lead) => sum + (lead.estimated_value || 0), 0);
    };

    return (
        <React.Fragment>
            <Head title="Lead Kanban | CRM" />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Lead Kanban" pageTitle="CRM" />

                    {/* Summary Cards */}
                    <Row className="mb-3">
                        <Col md={4}>
                            <Card className="bg-primary text-white">
                                <Card.Body className="py-3">
                                    <div className="d-flex justify-content-between">
                                        <div>
                                            <p className="mb-1 opacity-75">Toplam Lead</p>
                                            <h4 className="mb-0 text-white">{summary.total_leads}</h4>
                                        </div>
                                        <div className="avatar-sm">
                                            <span className="avatar-title bg-white bg-opacity-25 rounded-circle">
                                                <i className="ri-user-add-line fs-4"></i>
                                            </span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card className="bg-success text-white">
                                <Card.Body className="py-3">
                                    <div className="d-flex justify-content-between">
                                        <div>
                                            <p className="mb-1 opacity-75">Toplam Değer</p>
                                            <h4 className="mb-0 text-white">
                                                {formatCurrency(summary.total_value, "TRY")}
                                            </h4>
                                        </div>
                                        <div className="avatar-sm">
                                            <span className="avatar-title bg-white bg-opacity-25 rounded-circle">
                                                <i className="ri-money-dollar-circle-line fs-4"></i>
                                            </span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card className="bg-info text-white">
                                <Card.Body className="py-3">
                                    <div className="d-flex justify-content-between">
                                        <div>
                                            <p className="mb-1 opacity-75">Ağırlıklı Değer</p>
                                            <h4 className="mb-0 text-white">
                                                {formatCurrency(summary.weighted_value, "TRY")}
                                            </h4>
                                        </div>
                                        <div className="avatar-sm">
                                            <span className="avatar-title bg-white bg-opacity-25 rounded-circle">
                                                <i className="ri-bar-chart-grouped-line fs-4"></i>
                                            </span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* View Toggle & Actions */}
                    <Row className="mb-3">
                        <Col>
                            <div className="d-flex justify-content-between align-items-center">
                                <div className="d-flex gap-2">
                                    <Link
                                        href={route("crm.leads.index")}
                                        className="btn btn-soft-secondary"
                                    >
                                        <i className="ri-list-check me-1"></i>
                                        Liste
                                    </Link>
                                    <Button variant="primary" disabled>
                                        <i className="ri-layout-masonry-line me-1"></i>
                                        Kanban
                                    </Button>
                                </div>
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

                    {/* Kanban Board */}
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <div className="kanban-board" style={{ overflowX: "auto" }}>
                            <div className="d-flex gap-3" style={{ minWidth: stages.length * 320 }}>
                                {stages.map((stage) => (
                                    <div
                                        key={stage.id}
                                        className="kanban-column"
                                        style={{ width: 300, flexShrink: 0 }}
                                    >
                                        <Card className="h-100">
                                            <Card.Header
                                                className="py-2"
                                                style={{
                                                    backgroundColor: stage.color + "20",
                                                    borderBottom: `3px solid ${stage.color}`,
                                                }}
                                            >
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div className="d-flex align-items-center gap-2">
                                                        <span
                                                            className="rounded-circle"
                                                            style={{
                                                                width: 10,
                                                                height: 10,
                                                                backgroundColor: stage.color,
                                                            }}
                                                        ></span>
                                                        <span className="fw-medium">{stage.name}</span>
                                                        <Badge bg="secondary" pill>
                                                            {(localLeads[stage.id] || []).length}
                                                        </Badge>
                                                    </div>
                                                    <small className="text-muted">
                                                        {formatCurrency(getStageTotal(stage.id), "TRY")}
                                                    </small>
                                                </div>
                                                {stage.win_probability > 0 && (
                                                    <small className="text-muted">
                                                        Olasılık: %{stage.win_probability}
                                                    </small>
                                                )}
                                            </Card.Header>
                                            <Droppable droppableId={String(stage.id)}>
                                                {(provided, snapshot) => (
                                                    <Card.Body
                                                        ref={provided.innerRef}
                                                        {...provided.droppableProps}
                                                        className="p-2"
                                                        style={{
                                                            minHeight: 400,
                                                            maxHeight: "calc(100vh - 400px)",
                                                            overflowY: "auto",
                                                            backgroundColor: snapshot.isDraggingOver
                                                                ? stage.color + "10"
                                                                : undefined,
                                                        }}
                                                    >
                                                        {(localLeads[stage.id] || []).map(
                                                            (lead, index) => (
                                                                <Draggable
                                                                    key={lead.id}
                                                                    draggableId={String(lead.id)}
                                                                    index={index}
                                                                >
                                                                    {(provided, snapshot) => (
                                                                        <div
                                                                            ref={provided.innerRef}
                                                                            {...provided.draggableProps}
                                                                            {...provided.dragHandleProps}
                                                                            className={`kanban-card mb-2 ${
                                                                                snapshot.isDragging
                                                                                    ? "shadow-lg"
                                                                                    : ""
                                                                            }`}
                                                                        >
                                                                            <Card className="mb-0 border">
                                                                                <Card.Body className="p-2">
                                                                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                                                                        <Link
                                                                                            href={route(
                                                                                                "crm.leads.show",
                                                                                                lead.id
                                                                                            )}
                                                                                            className="text-primary fw-medium text-decoration-none"
                                                                                        >
                                                                                            {lead.lead_no}
                                                                                        </Link>
                                                                                        <Dropdown>
                                                                                            <Dropdown.Toggle
                                                                                                variant="link"
                                                                                                className="p-0 text-muted"
                                                                                                size="sm"
                                                                                            >
                                                                                                <i className="ri-more-2-fill"></i>
                                                                                            </Dropdown.Toggle>
                                                                                            <Dropdown.Menu>
                                                                                                <Dropdown.Item
                                                                                                    as={Link}
                                                                                                    href={route(
                                                                                                        "crm.leads.show",
                                                                                                        lead.id
                                                                                                    )}
                                                                                                >
                                                                                                    <i className="ri-eye-line me-2"></i>
                                                                                                    Görüntüle
                                                                                                </Dropdown.Item>
                                                                                                <Dropdown.Item
                                                                                                    as={Link}
                                                                                                    href={route(
                                                                                                        "crm.leads.edit",
                                                                                                        lead.id
                                                                                                    )}
                                                                                                >
                                                                                                    <i className="ri-pencil-line me-2"></i>
                                                                                                    Düzenle
                                                                                                </Dropdown.Item>
                                                                                            </Dropdown.Menu>
                                                                                        </Dropdown>
                                                                                    </div>

                                                                                    <h6 className="mb-1 text-truncate">
                                                                                        {lead.contact_name}
                                                                                    </h6>
                                                                                    {lead.company_name && (
                                                                                        <p className="text-muted small mb-2 text-truncate">
                                                                                            {lead.company_name}
                                                                                        </p>
                                                                                    )}

                                                                                    <div className="d-flex flex-wrap gap-1 mb-2">
                                                                                        <Badge
                                                                                            bg={getPriorityColor(
                                                                                                lead.priority
                                                                                            )}
                                                                                            className="small"
                                                                                        >
                                                                                            {lead.priority_label}
                                                                                        </Badge>
                                                                                        {lead.source && (
                                                                                            <Badge
                                                                                                bg="light"
                                                                                                text="dark"
                                                                                                className="small"
                                                                                            >
                                                                                                {lead.source.name}
                                                                                            </Badge>
                                                                                        )}
                                                                                    </div>

                                                                                    {lead.estimated_value && (
                                                                                        <div className="text-success fw-medium small mb-2">
                                                                                            {formatCurrency(
                                                                                                lead.estimated_value,
                                                                                                lead.currency
                                                                                            )}
                                                                                        </div>
                                                                                    )}

                                                                                    <div className="d-flex justify-content-between align-items-center">
                                                                                        <div className="d-flex align-items-center gap-1">
                                                                                            <div
                                                                                                className="progress"
                                                                                                style={{
                                                                                                    width: 40,
                                                                                                    height: 4,
                                                                                                }}
                                                                                            >
                                                                                                <div
                                                                                                    className="progress-bar bg-primary"
                                                                                                    style={{
                                                                                                        width: `${lead.lead_score}%`,
                                                                                                    }}
                                                                                                ></div>
                                                                                            </div>
                                                                                            <span className="text-muted small">
                                                                                                {lead.lead_score}
                                                                                            </span>
                                                                                        </div>
                                                                                        {lead.assignee && (
                                                                                            <div
                                                                                                className="avatar-xs"
                                                                                                title={
                                                                                                    lead.assignee.name
                                                                                                }
                                                                                            >
                                                                                                <span className="avatar-title rounded-circle bg-soft-primary text-primary">
                                                                                                    {lead.assignee.name
                                                                                                        .charAt(0)
                                                                                                        .toUpperCase()}
                                                                                                </span>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>

                                                                                    {lead.next_follow_up_at && (
                                                                                        <div className="mt-2 pt-2 border-top">
                                                                                            <small className="text-muted">
                                                                                                <i className="ri-calendar-line me-1"></i>
                                                                                                {new Date(
                                                                                                    lead.next_follow_up_at
                                                                                                ).toLocaleDateString(
                                                                                                    "tr-TR"
                                                                                                )}
                                                                                            </small>
                                                                                        </div>
                                                                                    )}
                                                                                </Card.Body>
                                                                            </Card>
                                                                        </div>
                                                                    )}
                                                                </Draggable>
                                                            )
                                                        )}
                                                        {provided.placeholder}
                                                    </Card.Body>
                                                )}
                                            </Droppable>
                                        </Card>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </DragDropContext>
                </Container>
            </div>
        </React.Fragment>
    );
};

LeadsKanban.layout = (page: any) => <Layout children={page} />;
export default LeadsKanban;
