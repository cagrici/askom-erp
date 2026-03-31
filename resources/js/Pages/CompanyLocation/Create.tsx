import React from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import { Container, Row, Col, Card, Form, Button } from "react-bootstrap";
import Layout from "../../Layouts";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import { Location } from "@/types";
import { useTranslation } from "react-i18next";

interface CreateLocationProps {
  parentLocations: Location[];
  locationTypes: any[];
}

const CreateLocation: React.FC<CreateLocationProps> = ({ parentLocations, locationTypes }) => {
  const { t } = useTranslation();

  const { data, setData, post, processing, errors } = useForm({
    name: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postal_code: "",
    phone: "",
    email: "",
    description: "",
    type: "",
    location_type_id: "",
    is_active: true,
    latitude: null as number | null,
    longitude: null as number | null,
    meta_data: {},
    parent_id: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('company-locations.store'));
  };

  // Lokasyon tipleri - artık sunucudan alınıyor, bu yüzden kaldırdık
  // const locationTypes = [
  //   { value: "headquarters", label: t("Headquarters") },
  //   { value: "branch", label: t("Branch") },
  //   { value: "office", label: t("Office") },
  //   { value: "factory", label: t("Factory") },
  //   { value: "warehouse", label: t("Warehouse") },
  //   { value: "other", label: t("Other") }
  // ];

  // Ülke listesi (örnek olarak bazı ülkeler)
  const countries = [
    { code: "TR", name: "Turkey" },
    { code: "US", name: "United States" },
    { code: "GB", name: "United Kingdom" },
    { code: "DE", name: "Germany" },
    { code: "FR", name: "France" },
    { code: "IT", name: "Italy" },
    { code: "ES", name: "Spain" },
    { code: "CA", name: "Canada" },
    { code: "AU", name: "Australia" },
    { code: "JP", name: "Japan" }
    // Diğer ülkeler eklenebilir
  ];

  return (
    <>
      <Head title={t("Add New Location") + " | Portal"} />
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Add New Location")} pageTitle={t("Location Management")} />

          <Form onSubmit={handleSubmit}>
            <Row>
              <Col lg={8}>
                {/* Temel Bilgiler */}
                <Card className="mb-4">
                  <Card.Header>
                    <h5 className="card-title mb-0">{t("Location Information")}</h5>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>{t("Location Name")} *</Form.Label>
                          <Form.Control
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            isInvalid={!!errors.name}
                            required
                          />
                          {errors.name && <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>}
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>{t("Location Type")}</Form.Label>
                          <Form.Select
                            value={data.location_type_id || ""}
                            onChange={(e) => setData('location_type_id', e.target.value)}
                            isInvalid={!!errors.location_type_id}
                          >
                            <option value="">{t("Select a type")}</option>
                            {locationTypes.map((type) => (
                              <option key={type.id} value={type.id}>{type.name}</option>
                            ))}
                          </Form.Select>
                          {errors.location_type_id && <Form.Control.Feedback type="invalid">{errors.location_type_id}</Form.Control.Feedback>}
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>{t("Parent Location")}</Form.Label>
                          <Form.Select
                            value={data.parent_id}
                            onChange={(e) => setData('parent_id', e.target.value)}
                            isInvalid={!!errors.parent_id}
                          >
                            <option value="">{t("None")}</option>
                            {parentLocations.map((location) => (
                              <option key={location.id} value={location.id}>{location.name}</option>
                            ))}
                          </Form.Select>
                          {errors.parent_id && <Form.Control.Feedback type="invalid">{errors.parent_id}</Form.Control.Feedback>}
                          <Form.Text className="text-muted">
                            {t("If this is a sub-location, select its parent location")}
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>{t("Description")}</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            isInvalid={!!errors.description}
                          />
                          {errors.description && <Form.Control.Feedback type="invalid">{errors.description}</Form.Control.Feedback>}
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Check
                            type="switch"
                            id="is_active"
                            label={t("Active")}
                            checked={data.is_active}
                            onChange={(e) => setData('is_active', e.target.checked)}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                {/* Adres Bilgileri */}
                <Card className="mb-4">
                  <Card.Header>
                    <h5 className="card-title mb-0">{t("Address Information")}</h5>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>{t("Street Address")}</Form.Label>
                          <Form.Control
                            type="text"
                            value={data.address}
                            onChange={(e) => setData('address', e.target.value)}
                            isInvalid={!!errors.address}
                          />
                          {errors.address && <Form.Control.Feedback type="invalid">{errors.address}</Form.Control.Feedback>}
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>{t("City")}</Form.Label>
                          <Form.Control
                            type="text"
                            value={data.city}
                            onChange={(e) => setData('city', e.target.value)}
                            isInvalid={!!errors.city}
                          />
                          {errors.city && <Form.Control.Feedback type="invalid">{errors.city}</Form.Control.Feedback>}
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>{t("State/Province")}</Form.Label>
                          <Form.Control
                            type="text"
                            value={data.state}
                            onChange={(e) => setData('state', e.target.value)}
                            isInvalid={!!errors.state}
                          />
                          {errors.state && <Form.Control.Feedback type="invalid">{errors.state}</Form.Control.Feedback>}
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>{t("Country")}</Form.Label>
                          <Form.Select
                            value={data.country}
                            onChange={(e) => setData('country', e.target.value)}
                            isInvalid={!!errors.country}
                          >
                            <option value="">{t("Select a country")}</option>
                            {countries.map((country) => (
                              <option key={country.code} value={country.name}>{country.name}</option>
                            ))}
                          </Form.Select>
                          {errors.country && <Form.Control.Feedback type="invalid">{errors.country}</Form.Control.Feedback>}
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>{t("Postal Code")}</Form.Label>
                          <Form.Control
                            type="text"
                            value={data.postal_code}
                            onChange={(e) => setData('postal_code', e.target.value)}
                            isInvalid={!!errors.postal_code}
                          />
                          {errors.postal_code && <Form.Control.Feedback type="invalid">{errors.postal_code}</Form.Control.Feedback>}
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>{t("Latitude")}</Form.Label>
                          <Form.Control
                            type="number"
                            step="any"
                            value={data.latitude || ""}
                            onChange={(e) => setData('latitude', e.target.value ? parseFloat(e.target.value) : null)}
                            isInvalid={!!errors.latitude}
                          />
                          {errors.latitude && <Form.Control.Feedback type="invalid">{errors.latitude}</Form.Control.Feedback>}
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>{t("Longitude")}</Form.Label>
                          <Form.Control
                            type="number"
                            step="any"
                            value={data.longitude || ""}
                            onChange={(e) => setData('longitude', e.target.value ? parseFloat(e.target.value) : null)}
                            isInvalid={!!errors.longitude}
                          />
                          {errors.longitude && <Form.Control.Feedback type="invalid">{errors.longitude}</Form.Control.Feedback>}
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={4}>
                {/* İletişim Bilgileri */}
                <Card className="mb-4">
                  <Card.Header>
                    <h5 className="card-title mb-0">{t("Contact Information")}</h5>
                  </Card.Header>
                  <Card.Body>
                    <Form.Group className="mb-3">
                      <Form.Label>{t("Phone Number")}</Form.Label>
                      <Form.Control
                        type="tel"
                        value={data.phone}
                        onChange={(e) => setData('phone', e.target.value)}
                        isInvalid={!!errors.phone}
                      />
                      {errors.phone && <Form.Control.Feedback type="invalid">{errors.phone}</Form.Control.Feedback>}
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>{t("Email Address")}</Form.Label>
                      <Form.Control
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        isInvalid={!!errors.email}
                      />
                      {errors.email && <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>}
                    </Form.Group>
                  </Card.Body>
                </Card>

                {/* Aksiyonlar */}
                <Card>
                  <Card.Body>
                    <div className="d-grid gap-2">
                      <Button type="submit" variant="primary" disabled={processing}>
                        {processing ? t("Saving...") : t("Save Location")}
                      </Button>
                      <Link href={route('company-locations.index')} className="btn btn-light">
                        {t("Cancel")}
                      </Link>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Form>
        </Container>
      </div>
    </>
  );
};

CreateLocation.layout = (page: any) => <Layout children={page} />;
export default CreateLocation;
