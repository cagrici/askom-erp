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

interface Offer {
    id: number;
    offer_no: string;
    current_account: {
        id: number;
        name: string;
    } | null;
    lead: {
        id: number;
        lead_no: string;
        contact_name: string;
    } | null;
    total_amount: number;
    currency: string;
    status: string;
    pipeline_stage_id: number | null;
    weighted_value: number | null;
    days_in_stage: number;
    created_at: string;
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
    offersByStage: Record<number, Offer[]>;
    summary: {
        total_offers: number;
        total_value: number;
        weighted_value: number;
    };
}

const PipelineIndex = ({
    stages = [],
    offersByStage = {},
    summary = { total_offers: 0, total_value: 0, weighted_value: 0 }
}: Props) => {
    const [localOffers, setLocalOffers] = useState<Record<number, Offer[]>>(offersByStage || {});

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
        const offerId = parseInt(draggableId);

        const sourceOffers = [...(localOffers[sourceStageId] || [])];
        const destOffers = sourceStageId === destStageId
            ? sourceOffers
            : [...(localOffers[destStageId] || [])];

        const [movedOffer] = sourceOffers.splice(source.index, 1);

        if (sourceStageId === destStageId) {
            sourceOffers.splice(destination.index, 0, movedOffer);
            setLocalOffers({
                ...localOffers,
                [sourceStageId]: sourceOffers,
            });
        } else {
            movedOffer.pipeline_stage_id = destStageId;
            destOffers.splice(destination.index, 0, movedOffer);
            setLocalOffers({
                ...localOffers,
                [sourceStageId]: sourceOffers,
                [destStageId]: destOffers,
            });

            router.patch(
                route("crm.pipeline.update-stage", offerId),
                { pipeline_stage_id: destStageId },
                { preserveScroll: true, preserveState: true }
            );
        }
    };

    const formatCurrency = (value: number | null, currency: string) => {
        if (!value) return "-";
        return new Intl.NumberFormat("tr-TR", {
            style: "currency",
            currency: currency || "TRY",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const getStageTotal = (stageId: number) => {
        const offers = localOffers[stageId] || [];
        return offers.reduce((sum, offer) => sum + (offer.total_amount || 0), 0);
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, string> = {
            draft: "secondary",
            sent: "info",
            approved: "success",
            rejected: "danger",
            expired: "warning",
            converted: "primary",
        };
        const labels: Record<string, string> = {
            draft: "Taslak",
            sent: "Gönderildi",
            approved: "Onaylandı",
            rejected: "Reddedildi",
            expired: "Süresi Doldu",
            converted: "Siparişe Dönüştü",
        };
        return <Badge bg={variants[status] || "secondary"}>{labels[status] || status}</Badge>;
    };

    return (
        <React.Fragment>
            <Head title="Teklif Pipeline | CRM" />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Teklif Pipeline" pageTitle="CRM" />

                    {/* Summary Cards */}
                    <Row className="mb-3">
                        <Col md={4}>
                            <Card className="bg-primary text-white">
                                <Card.Body className="py-3">
                                    <div className="d-flex justify-content-between">
                                        <div>
                                            <p className="mb-1 opacity-75">Toplam Teklif</p>
                                            <h4 className="mb-0 text-white">{summary.total_offers}</h4>
                                        </div>
                                        <div className="avatar-sm">
                                            <span className="avatar-title bg-white bg-opacity-25 rounded-circle">
                                                <i className="ri-file-list-3-line fs-4"></i>
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

                    {/* Actions */}
                    <Row className="mb-3">
                        <Col>
                            <div className="d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">Pipeline Görünümü</h5>
                                <Link
                                    href={route("sales.offers.create")}
                                    className="btn btn-primary"
                                >
                                    <i className="ri-add-line me-1"></i>
                                    Yeni Teklif
                                </Link>
                            </div>
                        </Col>
                    </Row>

                    {/* Pipeline Board */}
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
                                                            {(localOffers[stage.id] || []).length}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="d-flex justify-content-between mt-1">
                                                    <small className="text-muted">
                                                        {formatCurrency(getStageTotal(stage.id), "TRY")}
                                                    </small>
                                                    {stage.win_probability > 0 && (
                                                        <small className="text-muted">
                                                            %{stage.win_probability}
                                                        </small>
                                                    )}
                                                </div>
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
                                                        {(localOffers[stage.id] || []).map(
                                                            (offer, index) => (
                                                                <Draggable
                                                                    key={offer.id}
                                                                    draggableId={String(offer.id)}
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
                                                                                                "sales.offers.show",
                                                                                                offer.id
                                                                                            )}
                                                                                            className="text-primary fw-medium text-decoration-none"
                                                                                        >
                                                                                            {offer.offer_no}
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
                                                                                                        "sales.offers.show",
                                                                                                        offer.id
                                                                                                    )}
                                                                                                >
                                                                                                    <i className="ri-eye-line me-2"></i>
                                                                                                    Görüntüle
                                                                                                </Dropdown.Item>
                                                                                                <Dropdown.Item
                                                                                                    as={Link}
                                                                                                    href={route(
                                                                                                        "sales.offers.edit",
                                                                                                        offer.id
                                                                                                    )}
                                                                                                >
                                                                                                    <i className="ri-pencil-line me-2"></i>
                                                                                                    Düzenle
                                                                                                </Dropdown.Item>
                                                                                            </Dropdown.Menu>
                                                                                        </Dropdown>
                                                                                    </div>

                                                                                    {offer.current_account && (
                                                                                        <h6 className="mb-1 text-truncate">
                                                                                            {offer.current_account.name}
                                                                                        </h6>
                                                                                    )}
                                                                                    {offer.lead && (
                                                                                        <p className="text-muted small mb-2 text-truncate">
                                                                                            <Link
                                                                                                href={route(
                                                                                                    "crm.leads.show",
                                                                                                    offer.lead.id
                                                                                                )}
                                                                                                className="text-muted"
                                                                                            >
                                                                                                {offer.lead.lead_no}
                                                                                            </Link>
                                                                                            {" - "}
                                                                                            {offer.lead.contact_name}
                                                                                        </p>
                                                                                    )}

                                                                                    <div className="d-flex flex-wrap gap-1 mb-2">
                                                                                        {getStatusBadge(offer.status)}
                                                                                    </div>

                                                                                    <div className="text-success fw-medium mb-2">
                                                                                        {formatCurrency(
                                                                                            offer.total_amount,
                                                                                            offer.currency
                                                                                        )}
                                                                                    </div>

                                                                                    {offer.weighted_value && (
                                                                                        <small className="text-muted d-block">
                                                                                            Ağırlıklı:{" "}
                                                                                            {formatCurrency(
                                                                                                offer.weighted_value,
                                                                                                offer.currency
                                                                                            )}
                                                                                        </small>
                                                                                    )}

                                                                                    {offer.days_in_stage > 0 && (
                                                                                        <div className="mt-2 pt-2 border-top">
                                                                                            <small className="text-muted">
                                                                                                <i className="ri-time-line me-1"></i>
                                                                                                {offer.days_in_stage} gündür bu aşamada
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

PipelineIndex.layout = (page: any) => <Layout children={page} />;
export default PipelineIndex;
