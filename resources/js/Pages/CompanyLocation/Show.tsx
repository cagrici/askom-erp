import React from "react";
import { Head, Link } from "@inertiajs/react";
import { Container, Row, Col, Card, Badge, ListGroup, Button } from "react-bootstrap";
import Layout from "../../Layouts";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import { Location } from "@/types";
import { useTranslation } from "react-i18next";

interface ShowLocationProps {
  location: Location;
}

const ShowLocation: React.FC<ShowLocationProps> = ({ location }) => {
  const { t } = useTranslation();

  // Lokasyon tipine göre etiket rengi belirleme
  const getLocationTypeBadge = (type: string | null) => {
    if (!type) return null;

    const typeBadges: {[key: string]: string} = {
      "headquarters": "primary",
      "branch": "success",
      "office": "info",
      "factory": "warning",
      "warehouse": "dark",
      // Diğer tipler için renkler eklenebilir
    };

    const badgeColor = typeBadges[type] || "secondary";

    return (
      <Badge bg={badgeColor} className="text-uppercase">
        {type}
      </Badge>
    );
  };

  // Tarih formatla
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Head title={t("Location Details") + " | Portal"} />
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Location Details")} pageTitle={t("Location Management")} />

          <Row>
            <Col lg={12}>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="fw-semibold mb-0">
                  {location.name} {location.type && <span className="ms-2">{getLocationTypeBadge(location.type)}</span>}
                </h4>
                <div className="d-flex gap-2">
                  <Link
                    href={route('company-locations.edit', location.id)}
                    className="btn btn-primary"
                  >
                    <i className="ri-pencil-line align-bottom me-1"></i> {t("Edit")}
                  </Link>
                  <Link
                    href={route('company-locations.destroy', location.id)}
                    method="delete"
                    as="button"
                    type="button"
                    className="btn btn-danger"
                    data={{ _token: document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '' }}
                  >
                    <i className="ri-delete-bin-line align-bottom me-1"></i> {t("Delete")}
                  </Link>
                  <Link
                    href={route('company-locations.index')}
                    className="btn btn-secondary"
                  >
                    <i className="ri-arrow-left-line align-bottom me-1"></i> {t("Back to List")}
                  </Link>
                </div>
              </div>
            </Col>
          </Row>

          <Row>
            <Col lg={8}>
              {/* Lokasyon Bilgileri */}
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="card-title mb-0">{t("Location Information")}</h5>
                </Card.Header>
                <Card.Body>
                  <Row className="mb-3">
                    <Col md={4} className="fw-medium">{t("Name")}:</Col>
                    <Col md={8}>{location.name}</Col>
                  </Row>
                  <Row className="mb-3">
                    <Col md={4} className="fw-medium">{t("Type")}:</Col>
                    <Col md={8}>
                      {location.type ? getLocationTypeBadge(location.type) : <span className="text-muted">{t("Not specified")}</span>}
                    </Col>
                  </Row>
                  <Row className="mb-3">
                    <Col md={4} className="fw-medium">{t("Parent Location")}:</Col>
                    <Col md={8}>
                      {location.parent ? (
                        <Link href={route('company-locations.show', location.parent.id)}>
                          {location.parent.name}
                        </Link>
                      ) : (
                        <span className="text-muted">{t("None")}</span>
                      )}
                    </Col>
                  </Row>
                  {location.description && (
                    <Row className="mb-3">
                      <Col md={4} className="fw-medium">{t("Description")}:</Col>
                      <Col md={8}>{location.description}</Col>
                    </Row>
                  )}
                  <Row className="mb-3">
                    <Col md={4} className="fw-medium">{t("Status")}:</Col>
                    <Col md={8}>
                      <Badge bg={location.is_active ? "success" : "danger"}>
                        {location.is_active ? t("Active") : t("Inactive")}
                      </Badge>
                    </Col>
                  </Row>
                  <Row className="mb-3">
                    <Col md={4} className="fw-medium">{t("Created By")}:</Col>
                    <Col md={8}>
                      {location.creator ? location.creator.name : <span className="text-muted">-</span>}
                    </Col>
                  </Row>
                  <Row className="mb-0">
                    <Col md={4} className="fw-medium">{t("Created At")}:</Col>
                    <Col md={8}>{formatDate(location.created_at)}</Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Adres Bilgileri */}
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="card-title mb-0">{t("Address Information")}</h5>
                </Card.Header>
                <Card.Body>
                  {location.address ? (
                    <>
                      <Row className="mb-3">
                        <Col md={4} className="fw-medium">{t("Street Address")}:</Col>
                        <Col md={8}>{location.address}</Col>
                      </Row>

                      <Row className="mb-3">
                        <Col md={4} className="fw-medium">{t("City")}:</Col>
                        <Col md={8}>{location.city || <span className="text-muted">-</span>}</Col>
                      </Row>

                      <Row className="mb-3">
                        <Col md={4} className="fw-medium">{t("State/Province")}:</Col>
                        <Col md={8}>{location.state || <span className="text-muted">-</span>}</Col>
                      </Row>

                      <Row className="mb-3">
                        <Col md={4} className="fw-medium">{t("Country")}:</Col>
                        <Col md={8}>{location.country || <span className="text-muted">-</span>}</Col>
                      </Row>

                      <Row className="mb-3">
                        <Col md={4} className="fw-medium">{t("Postal Code")}:</Col>
                        <Col md={8}>{location.postal_code || <span className="text-muted">-</span>}</Col>
                      </Row>

                      {(location.latitude || location.longitude) && (
                        <Row className="mb-0">
                          <Col md={4} className="fw-medium">{t("Coordinates")}:</Col>
                          <Col md={8}>
                            {location.latitude && location.longitude ? (
                              <>
                                <div>{t("Latitude")}: {location.latitude}</div>
                                <div>{t("Longitude")}: {location.longitude}</div>
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-light mt-2"
                                >
                                  <i className="ri-map-pin-line me-1"></i> {t("View on Google Maps")}
                                </a>
                              </>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </Col>
                        </Row>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-3">
                      <p className="text-muted mb-0">{t("No address information available")}</p>
                    </div>
                  )}
                </Card.Body>
              </Card>

              {/* İletişim Bilgileri */}
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="card-title mb-0">{t("Contact Information")}</h5>
                </Card.Header>
                <Card.Body>
                  {location.phone || location.email ? (
                    <>
                      <Row className="mb-3">
                        <Col md={4} className="fw-medium">{t("Phone")}:</Col>
                        <Col md={8}>
                          {location.phone ? (
                            <a href={`tel:${location.phone}`}>
                              <i className="ri-phone-line me-1"></i> {location.phone}
                            </a>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </Col>
                      </Row>

                      <Row className="mb-0">
                        <Col md={4} className="fw-medium">{t("Email")}:</Col>
                        <Col md={8}>
                          {location.email ? (
                            <a href={`mailto:${location.email}`}>
                              <i className="ri-mail-line me-1"></i> {location.email}
                            </a>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </Col>
                      </Row>
                    </>
                  ) : (
                    <div className="text-center py-3">
                      <p className="text-muted mb-0">{t("No contact information available")}</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4}>
              {/* Alt Lokasyonlar */}
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="card-title mb-0">{t("Sub-locations")}</h5>
                </Card.Header>
                <Card.Body>
                  {location.children && location.children.length > 0 ? (
                    <ListGroup variant="flush">
                      {location.children.map(child => (
                        <ListGroup.Item key={child.id} className="d-flex justify-content-between align-items-center px-0">
                          <div>
                            <div className="fw-medium">{child.name}</div>
                            {child.type && (
                              <small>{getLocationTypeBadge(child.type)}</small>
                            )}
                          </div>
                          <Link
                            href={route('company-locations.show', child.id)}
                            className="btn btn-sm btn-soft-primary"
                          >
                            <i className="ri-eye-line"></i>
                          </Link>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  ) : (
                    <div className="text-center py-3">
                      <p className="text-muted mb-3">{t("No sub-locations found")}</p>
                      <Link
                        href={route('company-locations.create', { parent_id: location.id })}
                        className="btn btn-sm btn-primary"
                      >
                        <i className="ri-add-line me-1"></i> {t("Add Sub-location")}
                      </Link>
                    </div>
                  )}
                </Card.Body>
              </Card>

              {/* İlişkili Kayıtlar */}
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="card-title mb-0">{t("Related Records")}</h5>
                </Card.Header>
                <Card.Body>
                  <ListGroup variant="flush">
                    <ListGroup.Item className="px-0 d-flex justify-content-between">
                      <span>{t("Calendar Events")}</span>
                      <Badge bg="secondary">0</Badge>
                    </ListGroup.Item>
                    <ListGroup.Item className="px-0 d-flex justify-content-between">
                      <span>{t("Meal Menus")}</span>
                      <Badge bg="secondary">0</Badge>
                    </ListGroup.Item>
                    <ListGroup.Item className="px-0 d-flex justify-content-between">
                      <span>{t("Users")}</span>
                      <Badge bg="secondary">0</Badge>
                    </ListGroup.Item>
                  </ListGroup>
                </Card.Body>
              </Card>

              {/* Meta Veri */}
              {location.meta_data && Object.keys(location.meta_data).length > 0 && (
                <Card className="mb-4">
                  <Card.Header>
                    <h5 className="card-title mb-0">{t("Meta Data")}</h5>
                  </Card.Header>
                  <Card.Body>
                    <pre className="mb-0 text-wrap">
                      {JSON.stringify(location.meta_data, null, 2)}
                    </pre>
                  </Card.Body>
                </Card>
              )}
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
};

ShowLocation.layout = (page: any) => <Layout children={page} />;
export default ShowLocation;
