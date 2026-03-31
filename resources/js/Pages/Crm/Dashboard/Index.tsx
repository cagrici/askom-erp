import React from "react";
import { Head, Link } from "@inertiajs/react";
import {
    Col,
    Container,
    Row,
    Card,
    Badge,
    ListGroup,
    ProgressBar,
} from "react-bootstrap";
import Layout from "../../../Layouts";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

interface LeadStage {
    id: number;
    name: string;
    color: string;
    count: number;
    value: number;
}

interface RecentLead {
    id: number;
    lead_no: string;
    contact_name: string;
    company_name: string | null;
    stage: {
        id: number;
        name: string;
        color: string;
    } | null;
    priority: string;
    estimated_value: number | null;
    currency: string;
    created_at: string;
}

interface UpcomingTask {
    id: number;
    title: string;
    type: string;
    due_date: string;
    priority: string;
    subject_type: string;
    subject: {
        id: number;
        lead_no?: string;
        contact_name?: string;
    } | null;
}

interface RecentActivity {
    id: number;
    type: string;
    title: string;
    activity_date: string;
    performed_by: {
        id: number;
        name: string;
    } | null;
    subject: {
        id: number;
        lead_no?: string;
        contact_name?: string;
    } | null;
}

interface Props {
    stats: {
        total_leads: number;
        leads_this_month: number;
        total_value: number;
        weighted_value: number;
        conversion_rate: number;
        avg_lead_score: number;
    };
    leadsByStage: LeadStage[];
    leadsBySource: { name: string; count: number }[];
    recentLeads: RecentLead[];
    upcomingTasks: UpcomingTask[];
    recentActivities: RecentActivity[];
    conversionTrend: { month: string; converted: number; lost: number }[];
}

const CrmDashboard = ({
    stats = { total_leads: 0, leads_this_month: 0, total_value: 0, weighted_value: 0, conversion_rate: 0, avg_lead_score: 0 },
    leadsByStage = [],
    leadsBySource = [],
    recentLeads = [],
    upcomingTasks = [],
    recentActivities = [],
    conversionTrend = [],
}: Props) => {
    const formatCurrency = (value: number | null, currency: string = "TRY") => {
        if (!value) return "-";
        return new Intl.NumberFormat("tr-TR", {
            style: "currency",
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
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
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(dateString));
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

    const getActivityIcon = (type: string) => {
        const icons: Record<string, string> = {
            call: "ri-phone-line",
            email: "ri-mail-line",
            meeting: "ri-calendar-event-line",
            note: "ri-sticky-note-line",
            sms: "ri-message-2-line",
            visit: "ri-map-pin-line",
            demo: "ri-slideshow-line",
            other: "ri-more-line",
        };
        return icons[type] || "ri-record-circle-line";
    };

    const getTaskIcon = (type: string) => {
        const icons: Record<string, string> = {
            call: "ri-phone-line",
            email: "ri-mail-send-line",
            meeting: "ri-calendar-check-line",
            follow_up: "ri-user-follow-line",
            proposal: "ri-file-text-line",
            demo: "ri-slideshow-line",
            visit: "ri-map-pin-line",
            other: "ri-checkbox-circle-line",
        };
        return icons[type] || "ri-checkbox-circle-line";
    };

    // Funnel Chart Options
    const funnelOptions: ApexOptions = {
        chart: {
            type: "bar",
            height: 300,
            toolbar: { show: false },
        },
        plotOptions: {
            bar: {
                horizontal: true,
                distributed: true,
                barHeight: "80%",
            },
        },
        colors: leadsByStage.map((s) => s.color),
        dataLabels: {
            enabled: true,
            formatter: (val: number, opts: any) => {
                return `${leadsByStage[opts.dataPointIndex]?.name}: ${val}`;
            },
            style: {
                colors: ["#fff"],
            },
        },
        xaxis: {
            categories: leadsByStage.map((s) => s.name),
        },
        yaxis: { show: false },
        legend: { show: false },
        tooltip: {
            y: {
                formatter: (val: number) => `${val} Lead`,
            },
        },
    };

    const funnelSeries = [
        {
            name: "Lead Sayısı",
            data: leadsByStage.map((s) => s.count),
        },
    ];

    // Source Distribution Pie Chart
    const sourceOptions: ApexOptions = {
        chart: {
            type: "donut",
            height: 300,
        },
        labels: leadsBySource.map((s) => s.name),
        colors: ["#3577f1", "#0ab39c", "#f06548", "#f7b84b", "#299cdb", "#405189"],
        legend: {
            position: "bottom",
        },
        dataLabels: {
            enabled: true,
        },
    };

    const sourceSeries = leadsBySource.map((s) => s.count);

    // Conversion Trend Chart
    const trendOptions: ApexOptions = {
        chart: {
            type: "area",
            height: 250,
            toolbar: { show: false },
            stacked: false,
        },
        stroke: {
            curve: "smooth",
            width: 2,
        },
        xaxis: {
            categories: conversionTrend.map((t) => t.month),
        },
        colors: ["#0ab39c", "#f06548"],
        fill: {
            type: "gradient",
            gradient: {
                opacityFrom: 0.4,
                opacityTo: 0.1,
            },
        },
        legend: {
            position: "top",
        },
        tooltip: {
            shared: true,
        },
    };

    const trendSeries = [
        {
            name: "Kazanılan",
            data: conversionTrend.map((t) => t.converted),
        },
        {
            name: "Kaybedilen",
            data: conversionTrend.map((t) => t.lost),
        },
    ];

    return (
        <React.Fragment>
            <Head title="CRM Dashboard" />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="CRM Dashboard" pageTitle="CRM" />

                    {/* Stats Cards */}
                    <Row>
                        <Col xl={2} md={4}>
                            <Card className="card-animate">
                                <Card.Body>
                                    <div className="d-flex justify-content-between">
                                        <div>
                                            <p className="fw-medium text-muted mb-0">Toplam Lead</p>
                                            <h2 className="mt-2 ff-secondary fw-semibold">
                                                {stats.total_leads}
                                            </h2>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-soft-primary rounded-circle fs-3">
                                                <i className="ri-user-add-line text-primary"></i>
                                            </span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xl={2} md={4}>
                            <Card className="card-animate">
                                <Card.Body>
                                    <div className="d-flex justify-content-between">
                                        <div>
                                            <p className="fw-medium text-muted mb-0">Bu Ay</p>
                                            <h2 className="mt-2 ff-secondary fw-semibold">
                                                {stats.leads_this_month}
                                            </h2>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-soft-success rounded-circle fs-3">
                                                <i className="ri-calendar-line text-success"></i>
                                            </span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xl={2} md={4}>
                            <Card className="card-animate">
                                <Card.Body>
                                    <div className="d-flex justify-content-between">
                                        <div>
                                            <p className="fw-medium text-muted mb-0">Toplam Değer</p>
                                            <h4 className="mt-2 ff-secondary fw-semibold">
                                                {formatCurrency(stats.total_value)}
                                            </h4>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-soft-info rounded-circle fs-3">
                                                <i className="ri-money-dollar-circle-line text-info"></i>
                                            </span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xl={2} md={4}>
                            <Card className="card-animate">
                                <Card.Body>
                                    <div className="d-flex justify-content-between">
                                        <div>
                                            <p className="fw-medium text-muted mb-0">Ağırlıklı</p>
                                            <h4 className="mt-2 ff-secondary fw-semibold">
                                                {formatCurrency(stats.weighted_value)}
                                            </h4>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-soft-warning rounded-circle fs-3">
                                                <i className="ri-bar-chart-grouped-line text-warning"></i>
                                            </span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xl={2} md={4}>
                            <Card className="card-animate">
                                <Card.Body>
                                    <div className="d-flex justify-content-between">
                                        <div>
                                            <p className="fw-medium text-muted mb-0">Dönüşüm</p>
                                            <h2 className="mt-2 ff-secondary fw-semibold">
                                                %{stats.conversion_rate.toFixed(1)}
                                            </h2>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-soft-success rounded-circle fs-3">
                                                <i className="ri-percent-line text-success"></i>
                                            </span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xl={2} md={4}>
                            <Card className="card-animate">
                                <Card.Body>
                                    <div className="d-flex justify-content-between">
                                        <div>
                                            <p className="fw-medium text-muted mb-0">Ort. Skor</p>
                                            <h2 className="mt-2 ff-secondary fw-semibold">
                                                {stats.avg_lead_score.toFixed(0)}
                                            </h2>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-soft-danger rounded-circle fs-3">
                                                <i className="ri-star-line text-danger"></i>
                                            </span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    <Row>
                        {/* Lead Funnel */}
                        <Col xl={6}>
                            <Card>
                                <Card.Header className="d-flex justify-content-between align-items-center">
                                    <h5 className="card-title mb-0">Lead Huni</h5>
                                    <Link href={route("crm.leads.kanban")} className="btn btn-sm btn-soft-primary">
                                        Kanban'a Git
                                    </Link>
                                </Card.Header>
                                <Card.Body>
                                    {leadsByStage.length > 0 ? (
                                        <Chart
                                            options={funnelOptions}
                                            series={funnelSeries}
                                            type="bar"
                                            height={300}
                                        />
                                    ) : (
                                        <div className="text-center py-5 text-muted">
                                            Henüz lead verisi yok
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Source Distribution */}
                        <Col xl={3}>
                            <Card>
                                <Card.Header>
                                    <h5 className="card-title mb-0">Kaynak Dağılımı</h5>
                                </Card.Header>
                                <Card.Body>
                                    {leadsBySource.length > 0 ? (
                                        <Chart
                                            options={sourceOptions}
                                            series={sourceSeries}
                                            type="donut"
                                            height={280}
                                        />
                                    ) : (
                                        <div className="text-center py-5 text-muted">
                                            Henüz kaynak verisi yok
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Upcoming Tasks */}
                        <Col xl={3}>
                            <Card>
                                <Card.Header className="d-flex justify-content-between align-items-center">
                                    <h5 className="card-title mb-0">Yaklaşan Görevler</h5>
                                    <Link href={route("crm.tasks.index")} className="btn btn-sm btn-soft-secondary">
                                        Tümü
                                    </Link>
                                </Card.Header>
                                <Card.Body className="p-0">
                                    {upcomingTasks.length > 0 ? (
                                        <ListGroup variant="flush">
                                            {upcomingTasks.slice(0, 5).map((task) => (
                                                <ListGroup.Item key={task.id} className="px-3 py-2">
                                                    <div className="d-flex align-items-start gap-2">
                                                        <div className="avatar-xs flex-shrink-0">
                                                            <span className="avatar-title rounded-circle bg-soft-primary text-primary">
                                                                <i className={getTaskIcon(task.type)}></i>
                                                            </span>
                                                        </div>
                                                        <div className="flex-grow-1 overflow-hidden">
                                                            <h6 className="mb-1 text-truncate">{task.title}</h6>
                                                            <div className="d-flex gap-2 align-items-center">
                                                                <small className="text-muted">
                                                                    <i className="ri-calendar-line me-1"></i>
                                                                    {formatDate(task.due_date)}
                                                                </small>
                                                                {getPriorityBadge(task.priority)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </ListGroup.Item>
                                            ))}
                                        </ListGroup>
                                    ) : (
                                        <div className="text-center py-4 text-muted">
                                            <i className="ri-checkbox-circle-line fs-2 d-block mb-2"></i>
                                            Yaklaşan görev yok
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    <Row>
                        {/* Conversion Trend */}
                        <Col xl={6}>
                            <Card>
                                <Card.Header>
                                    <h5 className="card-title mb-0">Dönüşüm Trendi</h5>
                                </Card.Header>
                                <Card.Body>
                                    {conversionTrend.length > 0 ? (
                                        <Chart
                                            options={trendOptions}
                                            series={trendSeries}
                                            type="area"
                                            height={250}
                                        />
                                    ) : (
                                        <div className="text-center py-5 text-muted">
                                            Henüz trend verisi yok
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Recent Leads */}
                        <Col xl={6}>
                            <Card>
                                <Card.Header className="d-flex justify-content-between align-items-center">
                                    <h5 className="card-title mb-0">Son Eklenen Lead'ler</h5>
                                    <Link href={route("crm.leads.index")} className="btn btn-sm btn-soft-primary">
                                        Tümü
                                    </Link>
                                </Card.Header>
                                <Card.Body className="p-0">
                                    <div className="table-responsive">
                                        <table className="table table-hover mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Lead</th>
                                                    <th>Aşama</th>
                                                    <th>Değer</th>
                                                    <th>Tarih</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {recentLeads.slice(0, 5).map((lead) => (
                                                    <tr key={lead.id}>
                                                        <td>
                                                            <Link
                                                                href={route("crm.leads.show", lead.id)}
                                                                className="fw-medium text-primary"
                                                            >
                                                                {lead.lead_no}
                                                            </Link>
                                                            <div className="small text-muted">
                                                                {lead.contact_name}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            {lead.stage ? (
                                                                <Badge
                                                                    style={{ backgroundColor: lead.stage.color }}
                                                                >
                                                                    {lead.stage.name}
                                                                </Badge>
                                                            ) : (
                                                                "-"
                                                            )}
                                                        </td>
                                                        <td>
                                                            {lead.estimated_value
                                                                ? formatCurrency(lead.estimated_value, lead.currency)
                                                                : "-"}
                                                        </td>
                                                        <td className="text-muted">
                                                            {formatDate(lead.created_at)}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {recentLeads.length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="text-center py-4 text-muted">
                                                            Henüz lead yok
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    <Row>
                        {/* Recent Activities */}
                        <Col xl={6}>
                            <Card>
                                <Card.Header className="d-flex justify-content-between align-items-center">
                                    <h5 className="card-title mb-0">Son Aktiviteler</h5>
                                    <Link href={route("crm.activities.index")} className="btn btn-sm btn-soft-secondary">
                                        Tümü
                                    </Link>
                                </Card.Header>
                                <Card.Body className="p-0">
                                    {recentActivities.length > 0 ? (
                                        <ListGroup variant="flush">
                                            {recentActivities.slice(0, 5).map((activity) => (
                                                <ListGroup.Item key={activity.id} className="px-3 py-2">
                                                    <div className="d-flex align-items-start gap-2">
                                                        <div className="avatar-xs flex-shrink-0">
                                                            <span className="avatar-title rounded-circle bg-soft-info text-info">
                                                                <i className={getActivityIcon(activity.type)}></i>
                                                            </span>
                                                        </div>
                                                        <div className="flex-grow-1">
                                                            <h6 className="mb-1">{activity.title}</h6>
                                                            <div className="d-flex justify-content-between text-muted small">
                                                                <span>
                                                                    {activity.performed_by?.name || "Sistem"}
                                                                </span>
                                                                <span>
                                                                    {formatDateTime(activity.activity_date)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </ListGroup.Item>
                                            ))}
                                        </ListGroup>
                                    ) : (
                                        <div className="text-center py-4 text-muted">
                                            <i className="ri-history-line fs-2 d-block mb-2"></i>
                                            Henüz aktivite yok
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Stage Progress */}
                        <Col xl={6}>
                            <Card>
                                <Card.Header>
                                    <h5 className="card-title mb-0">Aşama Dağılımı</h5>
                                </Card.Header>
                                <Card.Body>
                                    {leadsByStage.length > 0 ? (
                                        <div className="d-flex flex-column gap-3">
                                            {leadsByStage.map((stage) => {
                                                const total = leadsByStage.reduce((sum, s) => sum + s.count, 0);
                                                const percentage = total > 0 ? (stage.count / total) * 100 : 0;
                                                return (
                                                    <div key={stage.id}>
                                                        <div className="d-flex justify-content-between mb-1">
                                                            <span className="fw-medium">{stage.name}</span>
                                                            <span className="text-muted">
                                                                {stage.count} ({percentage.toFixed(1)}%)
                                                            </span>
                                                        </div>
                                                        <ProgressBar
                                                            now={percentage}
                                                            style={{
                                                                height: 8,
                                                                backgroundColor: stage.color + "30",
                                                            }}
                                                        >
                                                            <ProgressBar
                                                                now={percentage}
                                                                style={{ backgroundColor: stage.color }}
                                                            />
                                                        </ProgressBar>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-5 text-muted">
                                            Henüz aşama verisi yok
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    );
};

CrmDashboard.layout = (page: any) => <Layout children={page} />;
export default CrmDashboard;
