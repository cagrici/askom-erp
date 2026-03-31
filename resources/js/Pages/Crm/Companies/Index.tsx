import React, { useState, useEffect } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Dropdown,
  Form,
  Modal,
  Table,
  Badge,
  Pagination
} from "react-bootstrap";
import Layout from "../../../Layouts";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import DeleteModal from "../../../Components/Common/DeleteModal";
import defaultUserImg from "../../../../images/users/user-dummy-img.jpg";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Company {
  id: number;
  name: string;
  owner: string;
  industry_type: string;
  rating: number;
  location: string;
  employee: string;
  website: string;
  contact_email: string;
  since: string;
  picture: string | null;
  phone: string;
  is_customer: boolean;
  is_supplier: boolean;
  status: string;
  primaryContact?: {
    id: number;
    name: string;
    phone: string;
    email: string;
    position: string;
  };
}

interface IndustryType {
  id: number;
  name: string;
  description: string | null;
}

interface CompaniesIndexProps {
  companies: {
    data: Company[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: any[];
  };
  industryTypes: IndustryType[];
  filters: {
    type?: string;
    status?: string;
    search?: string;
    sort_field?: string;
    sort_direction?: string;
  };
  flash?: {
    success?: string;
    error?: string;
  };
}

const CompaniesIndex: React.FC<CompaniesIndexProps> = ({ companies, industryTypes, filters, flash }) => {
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [search, setSearch] = useState<string>(filters.search || "");
  const [type, setType] = useState<string>(filters.type || "");
  const [status, setStatus] = useState<string>(filters.status || "");
  const [sortField, setSortField] = useState<string>(filters.sort_field || "name");
  const [sortDirection, setSortDirection] = useState<string>(filters.sort_direction || "asc");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [infoModal, setInfoModal] = useState<boolean>(false);
  
  // Show toast message if success message exists in flash
  useEffect(() => {
    if (flash?.success) {
      toast.success(flash.success, {
        position: "top-right",
        autoClose: 3000,
      });
    }
  }, [flash]);

  // Handle search
  const handleSearch = () => {
    router.get(route('companies.index'), { search, type, status, sort_field: sortField, sort_direction: sortDirection }, { preserveState: true });
  };

  // Handle filter reset
  const resetFilters = () => {
    setSearch("");
    setType("");
    setStatus("");
    setSortField("name");
    setSortDirection("asc");
    router.get(route('companies.index'));
  };

  // Handle sort
  const handleSort = (field: string) => {
    const direction = field === sortField && sortDirection === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortDirection(direction);
    router.get(route('companies.index'), {
      search,
      type,
      status,
      sort_field: field,
      sort_direction: direction
    }, { preserveState: true });
  };

  // Handle delete confirmation
  const onClickDelete = (company: Company) => {
    setCompanyToDelete(company);
    setDeleteModal(true);
  };

  // Handle delete
  const handleDeleteCompany = () => {
    if (companyToDelete) {
      router.delete(route('companies.destroy', companyToDelete.id), {
        onSuccess: () => {
          setDeleteModal(false);
          setCompanyToDelete(null);
        },
      });
    }
  };

  // Handle view company details
  const handleViewDetails = (company: Company) => {
    setSelectedCompany(company);
    setInfoModal(true);
  };
  
  // Get company type badges
  const getCompanyTypeBadges = (company: Company) => {
    return (
      <>
        {company.is_customer && (
          <Badge bg="success" className="me-1">Müşteri</Badge>
        )}
        {company.is_supplier && (
          <Badge bg="info">Tedarikçi</Badge>
        )}
      </>
    );
  };
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    let badgeClass = "bg-success";
    
    if (status === "inactive") {
      badgeClass = "bg-danger";
    } else if (status === "pending") {
      badgeClass = "bg-warning";
    }
    
    return (
      <Badge className={badgeClass}>
        {status === "active" ? "Aktif" : status === "inactive" ? "Pasif" : "Beklemede"}
      </Badge>
    );
  };

  // Pagination component
  const PaginationComponent = () => {
    if (companies.last_page <= 1) return null;

    const paginationItems = [];
    const showEllipsis = companies.last_page > 7;
    const currentPage = companies.current_page;
    
    // First page
    paginationItems.push(
      <Pagination.Item 
        key={1} 
        active={currentPage === 1}
        onClick={() => currentPage !== 1 && router.get(route('companies.index'), { 
          page: 1, search, type, status, sort_field: sortField, sort_direction: sortDirection
        }, { preserveState: true })}
      >
        1
      </Pagination.Item>
    );

    // Ellipsis at start if needed
    if (showEllipsis && currentPage > 4) {
      paginationItems.push(<Pagination.Ellipsis key="start-ellipsis" />);
    }

    // Pages around current
    let startPage = showEllipsis ? Math.max(2, currentPage - 2) : 2;
    let endPage = showEllipsis ? Math.min(companies.last_page - 1, currentPage + 2) : companies.last_page - 1;

    for (let i = startPage; i <= endPage; i++) {
      paginationItems.push(
        <Pagination.Item 
          key={i}
          active={currentPage === i}
          onClick={() => currentPage !== i && router.get(route('companies.index'), { 
            page: i, search, type, status, sort_field: sortField, sort_direction: sortDirection
          }, { preserveState: true })}
        >
          {i}
        </Pagination.Item>
      );
    }

    // Ellipsis at end if needed
    if (showEllipsis && currentPage < companies.last_page - 3) {
      paginationItems.push(<Pagination.Ellipsis key="end-ellipsis" />);
    }

    // Last page
    if (companies.last_page > 1) {
      paginationItems.push(
        <Pagination.Item 
          key={companies.last_page} 
          active={currentPage === companies.last_page}
          onClick={() => currentPage !== companies.last_page && router.get(route('companies.index'), { 
            page: companies.last_page, search, type, status, sort_field: sortField, sort_direction: sortDirection
          }, { preserveState: true })}
        >
          {companies.last_page}
        </Pagination.Item>
      );
    }

    return (
      <Pagination className="pagination pagination-rounded justify-content-end mb-2">
        <Pagination.Prev
          disabled={currentPage === 1}
          onClick={() => router.get(route('companies.index'), { 
            page: currentPage - 1, search, type, status, sort_field: sortField, sort_direction: sortDirection
          }, { preserveState: true })}
        />
        {paginationItems}
        <Pagination.Next
          disabled={currentPage === companies.last_page}
          onClick={() => router.get(route('companies.index'), { 
            page: currentPage + 1, search, type, status, sort_field: sortField, sort_direction: sortDirection
          }, { preserveState: true })}
        />
      </Pagination>
    );
  };
  
  return (
    <>
      <Head title="Şirketler | Portal" />
      <DeleteModal
        show={deleteModal}
        onCloseClick={() => setDeleteModal(false)}
        onDeleteClick={handleDeleteCompany}
        deleteModalText={`Bu şirketi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
      />
      
      {/* Company Details Modal */}
      <Modal
        size="lg"
        show={infoModal}
        onHide={() => setInfoModal(false)}
        centered
      >
        <Modal.Header className="bg-primary-subtle p-3" closeButton>
          <Modal.Title>
            <h5 className="modal-title">Şirket Detayları</h5>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCompany && (
            <Row>
              <Col lg={4} className="text-center mb-3">
                <div className="position-relative d-inline-block">
                  <div className="avatar-xl">
                    <div className="avatar-title bg-light rounded-circle">
                      {selectedCompany.picture ? (
                        <img 
                          src={selectedCompany.picture} 
                          alt={selectedCompany.name} 
                          className="avatar-xl rounded-circle object-fit-cover"
                        />
                      ) : (
                        <img 
                          src={defaultUserImg} 
                          alt={selectedCompany.name} 
                          className="avatar-xl rounded-circle object-fit-cover"
                        />
                      )}
                    </div>
                  </div>
                </div>
                <h5 className="mt-3 mb-1">{selectedCompany.name}</h5>
                <p className="text-muted">{selectedCompany.owner}</p>
                <div className="d-flex gap-2 justify-content-center mt-4 mb-2">
                  {getCompanyTypeBadges(selectedCompany)}
                  <Badge 
                    bg={selectedCompany.status === "active" ? "success" : 
                        selectedCompany.status === "inactive" ? "danger" : "warning"}
                  >
                    {selectedCompany.status === "active" ? "Aktif" : 
                     selectedCompany.status === "inactive" ? "Pasif" : "Beklemede"}
                  </Badge>
                </div>
              </Col>
              <Col lg={8}>
                <h5 className="fw-semibold">Bilgiler</h5>
                <div className="table-responsive">
                  <Table className="table-borderless mb-0">
                    <tbody>
                      <tr>
                        <th scope="row">Sektör</th>
                        <td>{selectedCompany.industry_type || "-"}</td>
                      </tr>
                      <tr>
                        <th scope="row">Konum</th>
                        <td>{selectedCompany.location || "-"}</td>
                      </tr>
                      <tr>
                        <th scope="row">Çalışan Sayısı</th>
                        <td>{selectedCompany.employee || "-"}</td>
                      </tr>
                      <tr>
                        <th scope="row">Değerlendirme</th>
                        <td>
                          {selectedCompany.rating} <i className="ri-star-fill text-warning"></i>
                        </td>
                      </tr>
                      <tr>
                        <th scope="row">Web Sitesi</th>
                        <td>
                          {selectedCompany.website ? (
                            <a 
                              href={selectedCompany.website.startsWith('http') ? selectedCompany.website : `https://${selectedCompany.website}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="link-primary"
                            >
                              {selectedCompany.website}
                            </a>
                          ) : "-"}
                        </td>
                      </tr>
                      <tr>
                        <th scope="row">E-posta</th>
                        <td>{selectedCompany.contact_email || "-"}</td>
                      </tr>
                      <tr>
                        <th scope="row">Telefon</th>
                        <td>{selectedCompany.phone || "-"}</td>
                      </tr>
                      <tr>
                        <th scope="row">Kuruluş Yılı</th>
                        <td>{selectedCompany.since || "-"}</td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
                
                {selectedCompany.primaryContact && (
                  <div className="mt-4">
                    <h5 className="fw-semibold">Birincil İletişim Kişisi</h5>
                    <div className="table-responsive">
                      <Table className="table-borderless mb-0">
                        <tbody>
                          <tr>
                            <th scope="row">Ad Soyad</th>
                            <td>{selectedCompany.primaryContact.name}</td>
                          </tr>
                          <tr>
                            <th scope="row">Pozisyon</th>
                            <td>{selectedCompany.primaryContact.position || "-"}</td>
                          </tr>
                          <tr>
                            <th scope="row">Telefon</th>
                            <td>{selectedCompany.primaryContact.phone || "-"}</td>
                          </tr>
                          <tr>
                            <th scope="row">E-posta</th>
                            <td>{selectedCompany.primaryContact.email || "-"}</td>
                          </tr>
                        </tbody>
                      </Table>
                    </div>
                  </div>
                )}
                
                <div className="hstack gap-2 justify-content-end mt-4">
                  <Link 
                    href={route('companies.edit', selectedCompany.id)} 
                    className="btn btn-primary"
                  >
                    <i className="ri-pencil-line align-bottom me-1"></i> Düzenle
                  </Link>
                  <Link 
                    href={route('companies.contacts.index', selectedCompany.id)} 
                    className="btn btn-info"
                  >
                    <i className="ri-contacts-line align-bottom me-1"></i> İletişim Kişileri
                  </Link>
                </div>
              </Col>
            </Row>
          )}
        </Modal.Body>
      </Modal>
      
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Şirketler" pageTitle="Müşteri İlişkileri" />
          
          <Row>
            <Col lg={12}>
              <Card>
                <Card.Header className="d-flex align-items-center">
                  <h5 className="card-title mb-0 flex-grow-1">Şirketler</h5>
                  <div className="d-flex gap-2">
                    <Link href={route('companies.create')} className="btn btn-primary">
                      <i className="ri-add-line align-bottom me-1"></i> Yeni Şirket Ekle
                    </Link>
                  </div>
                </Card.Header>
                
                <Card.Body>
                  <Row className="g-3 mb-4">
                    <Col sm={6} md={4} xl={3}>
                      <Form.Group>
                        <Form.Control
                          type="text"
                          placeholder="Ara..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col sm={6} md={3} xl={2}>
                      <Form.Group>
                        <Form.Select
                          value={type}
                          onChange={(e) => setType(e.target.value)}
                        >
                          <option value="">Tüm Şirketler</option>
                          <option value="customer">Sadece Müşteriler</option>
                          <option value="supplier">Sadece Tedarikçiler</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col sm={6} md={3} xl={2}>
                      <Form.Group>
                        <Form.Select
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                        >
                          <option value="">Tüm Durumlar</option>
                          <option value="active">Aktif</option>
                          <option value="inactive">Pasif</option>
                          <option value="pending">Beklemede</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col sm={6} md={2} xl={2}>
                      <div className="d-flex gap-2">
                        <Button variant="primary" onClick={handleSearch}>
                          <i className="ri-search-line"></i>
                        </Button>
                        <Button variant="light" onClick={resetFilters}>
                          <i className="ri-refresh-line"></i>
                        </Button>
                      </div>
                    </Col>
                  </Row>
                  
                  <div className="table-responsive table-card mb-3">
                    <Table className="align-middle table-nowrap mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="sort cursor-pointer" onClick={() => handleSort("name")}>
                            Şirket Adı
                            {sortField === "name" && (
                              <span className="ms-1">
                                {sortDirection === "asc" ? 
                                  <i className="ri-arrow-up-s-line align-bottom"></i> : 
                                  <i className="ri-arrow-down-s-line align-bottom"></i>
                                }
                              </span>
                            )}
                          </th>
                          <th className="sort cursor-pointer" onClick={() => handleSort("owner")}>
                            Yetkili Kişi
                            {sortField === "owner" && (
                              <span className="ms-1">
                                {sortDirection === "asc" ? 
                                  <i className="ri-arrow-up-s-line align-bottom"></i> : 
                                  <i className="ri-arrow-down-s-line align-bottom"></i>
                                }
                              </span>
                            )}
                          </th>
                          <th>Tür</th>
                          <th className="sort cursor-pointer" onClick={() => handleSort("industry_type")}>
                            Sektör
                            {sortField === "industry_type" && (
                              <span className="ms-1">
                                {sortDirection === "asc" ? 
                                  <i className="ri-arrow-up-s-line align-bottom"></i> : 
                                  <i className="ri-arrow-down-s-line align-bottom"></i>
                                }
                              </span>
                            )}
                          </th>
                          <th className="sort cursor-pointer" onClick={() => handleSort("location")}>
                            Konum
                            {sortField === "location" && (
                              <span className="ms-1">
                                {sortDirection === "asc" ? 
                                  <i className="ri-arrow-up-s-line align-bottom"></i> : 
                                  <i className="ri-arrow-down-s-line align-bottom"></i>
                                }
                              </span>
                            )}
                          </th>
                          <th>Durumu</th>
                          <th>İşlemler</th>
                        </tr>
                      </thead>
                      <tbody>
                        {companies.data.length > 0 ? (
                          companies.data.map((company) => (
                            <tr key={company.id}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div className="flex-shrink-0">
                                    {company.picture ? (
                                      <img
                                        src={company.picture}
                                        alt=""
                                        className="avatar-xs rounded-circle"
                                      />
                                    ) : (
                                      <div className="avatar-xs me-2">
                                        <div className="avatar-title bg-soft-primary text-primary rounded-circle">
                                          {company.name.charAt(0)}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-grow-1 ms-2 name">
                                    {company.name}
                                  </div>
                                </div>
                              </td>
                              <td>{company.owner || "-"}</td>
                              <td>{getCompanyTypeBadges(company)}</td>
                              <td>{company.industry_type || "-"}</td>
                              <td>{company.location || "-"}</td>
                              <td>{getStatusBadge(company.status)}</td>
                              <td>
                                <div className="d-flex gap-2">
                                  <Button 
                                    variant="soft-primary" 
                                    size="sm" 
                                    onClick={() => handleViewDetails(company)}
                                  >
                                    <i className="ri-eye-fill"></i>
                                  </Button>
                                  <Link 
                                    href={route('companies.edit', company.id)} 
                                    className="btn btn-soft-success btn-sm"
                                  >
                                    <i className="ri-pencil-fill"></i>
                                  </Link>
                                  <Button 
                                    variant="soft-danger" 
                                    size="sm" 
                                    onClick={() => onClickDelete(company)}
                                  >
                                    <i className="ri-delete-bin-fill"></i>
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="text-center">
                              Kayıt bulunamadı
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                  
                  <PaginationComponent />
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
        <ToastContainer closeButton={false} position="top-right" />
      </div>
    </>
  );
}

CompaniesIndex.layout = (page: any) => <Layout children={page} />;
export default CompaniesIndex;