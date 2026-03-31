import React from "react";
import { Head, Link } from "@inertiajs/react";
import { Container, Row, Col, Card, Table, Badge, Button } from "react-bootstrap";
import Layout from "../../Layouts";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import { Location } from "@/types";
import { useTranslation } from "react-i18next";

interface CompanyLocationIndexProps {
  locations: Location[];
}

const CompanyLocationIndex: React.FC<CompanyLocationIndexProps> = ({ locations }) => {
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

  // Ana lokasyonları ve alt lokasyonlarını hiyerarşik olarak düzenleme
  const organizeLocationsHierarchically = () => {
    const mainLocations = locations.filter(loc => !loc.parent_id);
    const childLocations = locations.filter(loc => loc.parent_id);
    
    // Her bir ana lokasyon için çocukları bulup atama işlemi
    mainLocations.forEach(mainLoc => {
      mainLoc.children = childLocations.filter(childLoc => childLoc.parent_id === mainLoc.id);
    });
    
    return mainLocations;
  };
  
  const hierarchicalLocations = organizeLocationsHierarchically();

  return (
    <>
      <Head title={t("Company Locations") + " | Portal"} />
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Company Locations")} pageTitle={t("Location Management")} />
          
          <Row>
            <Col lg={12}>
              <Card>
                <Card.Header className="d-flex align-items-center">
                  <h5 className="card-title mb-0 flex-grow-1">{t("Company Locations")}</h5>
                  <div className="d-flex gap-2">
                    <Link href={route('company-locations.create')} className="btn btn-primary">
                      <i className="ri-add-line align-bottom me-1"></i> {t("Add New Location")}
                    </Link>
                  </div>
                </Card.Header>
                
                <Card.Body>
                  <div className="table-responsive">
                    <Table className="table-striped table-nowrap align-middle mb-0">
                      <thead>
                        <tr>
                          <th scope="col">{t("Name")}</th>
                          <th scope="col">{t("Type")}</th>
                          <th scope="col">{t("Address")}</th>
                          <th scope="col">{t("Contact")}</th>
                          <th scope="col">{t("Status")}</th>
                          <th scope="col" style={{ width: "150px" }}>{t("Actions")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hierarchicalLocations.length > 0 ? (
                          hierarchicalLocations.map((location) => (
                            <React.Fragment key={location.id}>
                              {/* Ana lokasyon satırı */}
                              <tr className="main-location-row">
                                <td>
                                  <span className="fw-medium">{location.name}</span>
                                </td>
                                <td>{getLocationTypeBadge(location.type)}</td>
                                <td>
                                  {location.city && location.country ? (
                                    <span>{location.city}, {location.country}</span>
                                  ) : location.city || location.country || "-"}
                                </td>
                                <td>
                                  {location.phone || location.email ? (
                                    <div>
                                      {location.phone && <div><i className="ri-phone-line me-1"></i>{location.phone}</div>}
                                      {location.email && <div><i className="ri-mail-line me-1"></i>{location.email}</div>}
                                    </div>
                                  ) : "-"}
                                </td>
                                <td>
                                  <Badge bg={location.is_active ? "success" : "danger"}>
                                    {location.is_active ? t("Active") : t("Inactive")}
                                  </Badge>
                                </td>
                                <td>
                                  <div className="d-flex gap-2">
                                    <Link 
                                      href={route('company-locations.show', location.id)} 
                                      className="btn btn-sm btn-soft-primary"
                                    >
                                      <i className="ri-eye-fill"></i>
                                    </Link>
                                    <Link 
                                      href={route('company-locations.edit', location.id)} 
                                      className="btn btn-sm btn-soft-success"
                                    >
                                      <i className="ri-pencil-fill"></i>
                                    </Link>
                                    <Link 
                                      href={route('company-locations.destroy', location.id)} 
                                      method="delete" 
                                      as="button" 
                                      type="button"
                                      className="btn btn-sm btn-soft-danger"
                                      data={{ _token: document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '' }}
                                    >
                                      <i className="ri-delete-bin-fill"></i>
                                    </Link>
                                  </div>
                                </td>
                              </tr>
                              
                              {/* Alt lokasyon satırları */}
                              {location.children && location.children.length > 0 && (
                                location.children.map(childLoc => (
                                  <tr key={childLoc.id} className="sub-location-row">
                                    <td>
                                      <div className="ps-3 border-start border-2 ms-3">
                                        <i className="ri-arrow-right-s-line me-2 text-muted"></i>
                                        {childLoc.name}
                                      </div>
                                    </td>
                                    <td>{getLocationTypeBadge(childLoc.type)}</td>
                                    <td>
                                      {childLoc.city && childLoc.country ? (
                                        <span>{childLoc.city}, {childLoc.country}</span>
                                      ) : childLoc.city || childLoc.country || "-"}
                                    </td>
                                    <td>
                                      {childLoc.phone || childLoc.email ? (
                                        <div>
                                          {childLoc.phone && <div><i className="ri-phone-line me-1"></i>{childLoc.phone}</div>}
                                          {childLoc.email && <div><i className="ri-mail-line me-1"></i>{childLoc.email}</div>}
                                        </div>
                                      ) : "-"}
                                    </td>
                                    <td>
                                      <Badge bg={childLoc.is_active ? "success" : "danger"}>
                                        {childLoc.is_active ? t("Active") : t("Inactive")}
                                      </Badge>
                                    </td>
                                    <td>
                                      <div className="d-flex gap-2">
                                        <Link 
                                          href={route('company-locations.show', childLoc.id)} 
                                          className="btn btn-sm btn-soft-primary"
                                        >
                                          <i className="ri-eye-fill"></i>
                                        </Link>
                                        <Link 
                                          href={route('company-locations.edit', childLoc.id)} 
                                          className="btn btn-sm btn-soft-success"
                                        >
                                          <i className="ri-pencil-fill"></i>
                                        </Link>
                                        <Link 
                                          href={route('company-locations.destroy', childLoc.id)} 
                                          method="delete" 
                                          as="button" 
                                          type="button"
                                          className="btn btn-sm btn-soft-danger"
                                          data={{ _token: document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '' }}
                                        >
                                          <i className="ri-delete-bin-fill"></i>
                                        </Link>
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </React.Fragment>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="text-center py-4">
                              <div className="py-3">
                                <i className="ri-map-pin-line display-5 text-muted"></i>
                                <h5 className="mt-3">{t("No company locations found")}</h5>
                                <p className="text-muted mb-3">{t("Start adding your company's locations to manage them here.")}</p>
                                <Link href={route('company-locations.create')} className="btn btn-primary">
                                  <i className="ri-add-line align-bottom me-1"></i> {t("Add New Location")}
                                </Link>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
};

CompanyLocationIndex.layout = (page: any) => <Layout children={page} />;
export default CompanyLocationIndex;