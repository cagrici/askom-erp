import React from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import {
    Col,
    Container,
    Row,
    Card,
    Form,
    Button,
    Badge,
} from "react-bootstrap";
import Layout from "../../../Layouts";
import BreadCrumb from "../../../Components/Common/BreadCrumb";

interface Stage {
    id: number;
    name: string;
    color: string;
}

interface Source {
    id: number;
    name: string;
}

interface SalesRep {
    id: number;
    full_name: string;
}

interface Location {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
}

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
    postal_code: string | null;
    industry: string | null;
    company_size: string | null;
    estimated_value: number | null;
    currency: string;
    lead_stage_id: number | null;
    lead_source_id: number | null;
    lead_score: number;
    priority: string;
    assigned_to: number | null;
    sales_representative_id: number | null;
    location_id: number | null;
    expected_close_date: string | null;
    next_follow_up_at: string | null;
    notes: string | null;
    requirements: string | null;
}

interface Props {
    lead: Lead;
    stages: Stage[];
    sources: Source[];
    salesRepresentatives: SalesRep[];
    locations: Location[];
    users: User[];
    priorities: { value: string; label: string }[];
}

const LeadEdit = ({ lead, stages, sources, salesRepresentatives, locations, users, priorities }: Props) => {
    const { data, setData, put, processing, errors } = useForm({
        company_name: lead.company_name || "",
        contact_name: lead.contact_name || "",
        contact_title: lead.contact_title || "",
        email: lead.email || "",
        phone: lead.phone || "",
        mobile: lead.mobile || "",
        website: lead.website || "",
        address: lead.address || "",
        city: lead.city || "",
        district: lead.district || "",
        country: lead.country || "Türkiye",
        postal_code: lead.postal_code || "",
        industry: lead.industry || "",
        company_size: lead.company_size || "",
        estimated_value: lead.estimated_value?.toString() || "",
        currency: lead.currency || "TRY",
        lead_stage_id: lead.lead_stage_id?.toString() || "",
        lead_source_id: lead.lead_source_id?.toString() || "",
        lead_score: lead.lead_score || 0,
        priority: lead.priority || "medium",
        assigned_to: lead.assigned_to?.toString() || "",
        sales_representative_id: lead.sales_representative_id?.toString() || "",
        location_id: lead.location_id?.toString() || "",
        expected_close_date: lead.expected_close_date || "",
        next_follow_up_at: lead.next_follow_up_at ? lead.next_follow_up_at.slice(0, 16) : "",
        notes: lead.notes || "",
        requirements: lead.requirements || "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route("crm.leads.update", lead.id));
    };

    return (
        <React.Fragment>
            <Head title={`${lead.lead_no} Düzenle | CRM`} />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Lead Düzenle" pageTitle="CRM" />

                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col lg={8}>
                                <Card>
                                    <Card.Header className="d-flex justify-content-between align-items-center">
                                        <h5 className="card-title mb-0">İletişim Bilgileri</h5>
                                        <Badge bg="primary">{lead.lead_no}</Badge>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row className="g-3">
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Şirket Adı</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={data.company_name}
                                                        onChange={(e) => setData("company_name", e.target.value)}
                                                        isInvalid={!!errors.company_name}
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.company_name}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Sektör</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={data.industry}
                                                        onChange={(e) => setData("industry", e.target.value)}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>İletişim Kişisi *</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={data.contact_name}
                                                        onChange={(e) => setData("contact_name", e.target.value)}
                                                        isInvalid={!!errors.contact_name}
                                                        required
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.contact_name}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Ünvan</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={data.contact_title}
                                                        onChange={(e) => setData("contact_title", e.target.value)}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>E-posta</Form.Label>
                                                    <Form.Control
                                                        type="email"
                                                        value={data.email}
                                                        onChange={(e) => setData("email", e.target.value)}
                                                        isInvalid={!!errors.email}
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.email}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>
                                            <Col md={3}>
                                                <Form.Group>
                                                    <Form.Label>Telefon</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={data.phone}
                                                        onChange={(e) => setData("phone", e.target.value)}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={3}>
                                                <Form.Group>
                                                    <Form.Label>Mobil</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={data.mobile}
                                                        onChange={(e) => setData("mobile", e.target.value)}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Web Sitesi</Form.Label>
                                                    <Form.Control
                                                        type="url"
                                                        value={data.website}
                                                        onChange={(e) => setData("website", e.target.value)}
                                                        placeholder="https://"
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Şirket Büyüklüğü</Form.Label>
                                                    <Form.Select
                                                        value={data.company_size}
                                                        onChange={(e) => setData("company_size", e.target.value)}
                                                    >
                                                        <option value="">Seçiniz</option>
                                                        <option value="1-10">1-10 Çalışan</option>
                                                        <option value="11-50">11-50 Çalışan</option>
                                                        <option value="51-200">51-200 Çalışan</option>
                                                        <option value="201-500">201-500 Çalışan</option>
                                                        <option value="500+">500+ Çalışan</option>
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>

                                <Card>
                                    <Card.Header>
                                        <h5 className="card-title mb-0">Adres Bilgileri</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row className="g-3">
                                            <Col md={12}>
                                                <Form.Group>
                                                    <Form.Label>Adres</Form.Label>
                                                    <Form.Control
                                                        as="textarea"
                                                        rows={2}
                                                        value={data.address}
                                                        onChange={(e) => setData("address", e.target.value)}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={4}>
                                                <Form.Group>
                                                    <Form.Label>Şehir</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={data.city}
                                                        onChange={(e) => setData("city", e.target.value)}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={4}>
                                                <Form.Group>
                                                    <Form.Label>İlçe</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={data.district}
                                                        onChange={(e) => setData("district", e.target.value)}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={4}>
                                                <Form.Group>
                                                    <Form.Label>Posta Kodu</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={data.postal_code}
                                                        onChange={(e) => setData("postal_code", e.target.value)}
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>

                                <Card>
                                    <Card.Header>
                                        <h5 className="card-title mb-0">Notlar</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row className="g-3">
                                            <Col md={12}>
                                                <Form.Group>
                                                    <Form.Label>Genel Notlar</Form.Label>
                                                    <Form.Control
                                                        as="textarea"
                                                        rows={3}
                                                        value={data.notes}
                                                        onChange={(e) => setData("notes", e.target.value)}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={12}>
                                                <Form.Group>
                                                    <Form.Label>İhtiyaçlar / Gereksinimler</Form.Label>
                                                    <Form.Control
                                                        as="textarea"
                                                        rows={3}
                                                        value={data.requirements}
                                                        onChange={(e) => setData("requirements", e.target.value)}
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>
                            </Col>

                            <Col lg={4}>
                                <Card>
                                    <Card.Header>
                                        <h5 className="card-title mb-0">Sınıflandırma</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row className="g-3">
                                            <Col md={12}>
                                                <Form.Group>
                                                    <Form.Label>Aşama</Form.Label>
                                                    <Form.Select
                                                        value={data.lead_stage_id}
                                                        onChange={(e) => setData("lead_stage_id", e.target.value)}
                                                    >
                                                        <option value="">Varsayılan</option>
                                                        {stages.map((stage) => (
                                                            <option key={stage.id} value={stage.id}>
                                                                {stage.name}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                            <Col md={12}>
                                                <Form.Group>
                                                    <Form.Label>Kaynak</Form.Label>
                                                    <Form.Select
                                                        value={data.lead_source_id}
                                                        onChange={(e) => setData("lead_source_id", e.target.value)}
                                                    >
                                                        <option value="">Seçiniz</option>
                                                        {sources.map((source) => (
                                                            <option key={source.id} value={source.id}>
                                                                {source.name}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                            <Col md={12}>
                                                <Form.Group>
                                                    <Form.Label>Öncelik</Form.Label>
                                                    <Form.Select
                                                        value={data.priority}
                                                        onChange={(e) => setData("priority", e.target.value)}
                                                    >
                                                        {priorities.map((p) => (
                                                            <option key={p.value} value={p.value}>
                                                                {p.label}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                            <Col md={12}>
                                                <Form.Group>
                                                    <Form.Label>Lead Skoru</Form.Label>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <Form.Range
                                                            min={0}
                                                            max={100}
                                                            value={data.lead_score}
                                                            onChange={(e) => setData("lead_score", parseInt(e.target.value))}
                                                        />
                                                        <Badge bg="primary" style={{ minWidth: 40 }}>
                                                            {data.lead_score}
                                                        </Badge>
                                                    </div>
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>

                                <Card>
                                    <Card.Header>
                                        <h5 className="card-title mb-0">Değerleme</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row className="g-3">
                                            <Col md={8}>
                                                <Form.Group>
                                                    <Form.Label>Tahmini Değer</Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={data.estimated_value}
                                                        onChange={(e) => setData("estimated_value", e.target.value)}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={4}>
                                                <Form.Group>
                                                    <Form.Label>Para Birimi</Form.Label>
                                                    <Form.Select
                                                        value={data.currency}
                                                        onChange={(e) => setData("currency", e.target.value)}
                                                    >
                                                        <option value="TRY">TRY</option>
                                                        <option value="USD">USD</option>
                                                        <option value="EUR">EUR</option>
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                            <Col md={12}>
                                                <Form.Group>
                                                    <Form.Label>Beklenen Kapanış Tarihi</Form.Label>
                                                    <Form.Control
                                                        type="date"
                                                        value={data.expected_close_date}
                                                        onChange={(e) => setData("expected_close_date", e.target.value)}
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>

                                <Card>
                                    <Card.Header>
                                        <h5 className="card-title mb-0">Atama</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row className="g-3">
                                            <Col md={12}>
                                                <Form.Group>
                                                    <Form.Label>Sorumlu Kullanıcı</Form.Label>
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
                                            <Col md={12}>
                                                <Form.Group>
                                                    <Form.Label>Satış Temsilcisi</Form.Label>
                                                    <Form.Select
                                                        value={data.sales_representative_id}
                                                        onChange={(e) => setData("sales_representative_id", e.target.value)}
                                                    >
                                                        <option value="">Seçiniz</option>
                                                        {salesRepresentatives.map((rep) => (
                                                            <option key={rep.id} value={rep.id}>
                                                                {rep.full_name}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                            <Col md={12}>
                                                <Form.Group>
                                                    <Form.Label>Lokasyon</Form.Label>
                                                    <Form.Select
                                                        value={data.location_id}
                                                        onChange={(e) => setData("location_id", e.target.value)}
                                                    >
                                                        <option value="">Seçiniz</option>
                                                        {locations.map((loc) => (
                                                            <option key={loc.id} value={loc.id}>
                                                                {loc.name}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                            <Col md={12}>
                                                <Form.Group>
                                                    <Form.Label>Sonraki Takip</Form.Label>
                                                    <Form.Control
                                                        type="datetime-local"
                                                        value={data.next_follow_up_at}
                                                        onChange={(e) => setData("next_follow_up_at", e.target.value)}
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>

                                <div className="d-flex gap-2">
                                    <Link href={route("crm.leads.show", lead.id)} className="btn btn-soft-secondary flex-fill">
                                        <i className="ri-arrow-left-line me-1"></i>
                                        İptal
                                    </Link>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        className="flex-fill"
                                        disabled={processing}
                                    >
                                        <i className="ri-save-line me-1"></i>
                                        {processing ? "Kaydediliyor..." : "Güncelle"}
                                    </Button>
                                </div>
                            </Col>
                        </Row>
                    </Form>
                </Container>
            </div>
        </React.Fragment>
    );
};

LeadEdit.layout = (page: any) => <Layout children={page} />;
export default LeadEdit;
