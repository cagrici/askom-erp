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
import Layout from "../../Layouts";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import DeleteModal from "../../Components/Common/DeleteModal";
import defaultCompanyImg from "../../../images/companies/img-1.png";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Branch {
  id: number;
  name: string;
  address: string;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  phone: string | null;
  email: string | null;
  working_hours: string | null;
  location_map_link: string | null;
  is_active: boolean;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
}

interface ContactPerson {
  id: number;
  name: string;
  email: string;
}

interface PartnerCompany {
  id: number;
  name: string;
  category_id: number;
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_path: string | null;
  discount_details: string;
  terms_conditions: string | null;
  agreement_start_date: string;
  agreement_end_date: string | null;
  is_active: boolean;
  contact_person_id: number | null;
  external_contact_name: string | null;
  external_contact_phone: string | null;
  external_contact_email: string | null;
  location_map_link: string | null;
  how_to_claim: string | null;
  promo_code: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  category: Category;
  contactPerson: ContactPerson | null;
  branches: Branch[];
}

interface PartnerCompaniesIndexProps {
  partnerCompanies: {
    data: PartnerCompany[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: any[];
  };
  categories: Category[];
  filters: {
    category_id?: string;
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

const PartnerCompaniesIndex: React.FC<PartnerCompaniesIndexProps> = ({
  partnerCompanies,
  categories,
  filters,
  flash
}) => {
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [companyToDelete, setCompanyToDelete] = useState<PartnerCompany | null>(null);
  const [search, setSearch] = useState<string>(filters.search || "");
  const [categoryId, setCategoryId] = useState<string>(filters.category_id || "");
  const [status, setStatus] = useState<string>(filters.status || "");
  const [sortField, setSortField] = useState<string>(filters.sort_field || "name");
  const [sortDirection, setSortDirection] = useState<string>(filters.sort_direction || "asc");
  const [selectedCompany, setSelectedCompany] = useState<PartnerCompany | null>(null);
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
    router.get(route('partner-companies.index'), { search, category_id: categoryId, status, sort_field: sortField, sort_direction: sortDirection }, { preserveState: true });
  };

  // Handle filter reset
  const resetFilters = () => {
    setSearch("");
    setCategoryId("");
    setStatus("");
    setSortField("name");
    setSortDirection("asc");
    router.get(route('partner-companies.index'));
  };

  // Handle sort
  const handleSort = (field: string) => {
    const direction = field === sortField && sortDirection === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortDirection(direction);
    router.get(route('partner-companies.index'), {
      search,
      category_id: categoryId,
      status,
      sort_field: field,
      sort_direction: direction
    }, { preserveState: true });
  };

  // Handle delete confirmation
  const onClickDelete = (company: PartnerCompany) => {
    setCompanyToDelete(company);
    setDeleteModal(true);
  };

  // Handle delete
  const handleDeleteCompany = () => {
    if (companyToDelete) {
      router.delete(route('partner-companies.destroy', companyToDelete.id), {
        onSuccess: () => {
          setDeleteModal(false);
          setCompanyToDelete(null);
        },
      });
    }
  };

  // Handle view company details
  const handleViewDetails = (company: PartnerCompany) => {
    setSelectedCompany(company);
    setInfoModal(true);
  };

  // Get status badge
  const getStatusBadge = (company: PartnerCompany) => {
    if (!company.is_active) {
      return <Badge bg="danger">Pasif</Badge>;
    }

    if (company.agreement_end_date && new Date(company.agreement_end_date) < new Date()) {
      return <Badge bg="warning">Süresi Dolmuş</Badge>;
    }

    // Check if expiring soon (within 30 days)
    if (company.agreement_end_date) {
      const endDate = new Date(company.agreement_end_date);
      const today = new Date();
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= 0 && diffDays <= 30) {
        return <Badge bg="warning">Yakında Sona Erecek ({diffDays} gün)</Badge>;
      }
    }

    return <Badge bg="success">Aktif</Badge>;
  };

  // Pagination component
  const PaginationComponent = () => {
    if (partnerCompanies.last_page <= 1) return null;

    const paginationItems = [];
    const showEllipsis = partnerCompanies.last_page > 7;
    const currentPage = partnerCompanies.current_page;

    // First page
    paginationItems.push(
      <Pagination.Item
        key={1}
        active={currentPage === 1}
        onClick={() => currentPage !== 1 && router.get(route('partner-companies.index'), {
          page: 1, search, category_id: categoryId, status, sort_field: sortField, sort_direction: sortDirection
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
    let endPage = showEllipsis ? Math.min(partnerCompanies.last_page - 1, currentPage + 2) : partnerCompanies.last_page - 1;

    for (let i = startPage; i <= endPage; i++) {
      paginationItems.push(
        <Pagination.Item
          key={i}
          active={currentPage === i}
          onClick={() => currentPage !== i && router.get(route('partner-companies.index'), {
            page: i, search, category_id: categoryId, status, sort_field: sortField, sort_direction: sortDirection
          }, { preserveState: true })}
        >
          {i}
        </Pagination.Item>
      );
    }

    // Ellipsis at end if needed
    if (showEllipsis && currentPage < partnerCompanies.last_page - 3) {
      paginationItems.push(<Pagination.Ellipsis key="end-ellipsis" />);
    }

    // Last page
    if (partnerCompanies.last_page > 1) {
      paginationItems.push(
        <Pagination.Item
          key={partnerCompanies.last_page}
          active={currentPage === partnerCompanies.last_page}
          onClick={() => currentPage !== partnerCompanies.last_page && router.get(route('partner-companies.index'), {
            page: partnerCompanies.last_page, search, category_id: categoryId, status, sort_field: sortField, sort_direction: sortDirection
          }, { preserveState: true })}
        >
          {partnerCompanies.last_page}
        </Pagination.Item>
      );
    }

    return (
      <Pagination className="pagination pagination-rounded justify-content-end mb-2">
        <Pagination.Prev
          disabled={currentPage === 1}
          onClick={() => router.get(route('partner-companies.index'), {
            page: currentPage - 1, search, category_id: categoryId, status, sort_field: sortField, sort_direction: sortDirection
          }, { preserveState: true })}
        />
        {paginationItems}
        <Pagination.Next
          disabled={currentPage === partnerCompanies.last_page}
          onClick={() => router.get(route('partner-companies.index'), {
            page: currentPage + 1, search, category_id: categoryId, status, sort_field: sortField, sort_direction: sortDirection
          }, { preserveState: true })}
        />
      </Pagination>
    );
  };

  return (
    <>
      <Head title="Anlaşmalı Kurumlar | Portal" />
      <DeleteModal
        show={deleteModal}
        onCloseClick={() => setDeleteModal(false)}
        onDeleteClick={handleDeleteCompany}
        deleteModalText={`Bu anlaşmalı kurumu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
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
            <h5 className="modal-title">Anlaşmalı Kurum Detayları</h5>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCompany && (
            <Row>
              <Col lg={4} className="text-center mb-3">
                <div className="position-relative d-inline-block">
                  <div className="avatar-xl">
                    <div className="avatar-title bg-light rounded-circle">
                      {selectedCompany.logo_path ? (
                        <img
                          src={selectedCompany.logo_path}
                          alt={selectedCompany.name}
                          className="avatar-xl rounded-circle object-fit-cover"
                        />
                      ) : (
                        <img
                          src={defaultCompanyImg}
                          alt={selectedCompany.name}
                          className="avatar-xl rounded-circle object-fit-cover"
                        />
                      )}
                    </div>
                  </div>
                </div>
                <h5 className="mt-3 mb-1">{selectedCompany.name}</h5>
                <p className="text-muted">{selectedCompany.category.name}</p>
                <div className="d-flex gap-2 justify-content-center mt-2">
                  {getStatusBadge(selectedCompany)}
                </div>
              </Col>
              <Col lg={8}>
                <h5 className="fw-semibold">İndirim Bilgileri</h5>
                <div className="table-responsive">
                  <Table className="table-borderless mb-0">
                    <tbody>
                      <tr>
                        <th scope="row">İndirim Detayları</th>
                        <td>{selectedCompany.discount_details}</td>
                      </tr>
                      {selectedCompany.promo_code && (
                        <tr>
                          <th scope="row">Promosyon Kodu</th>
                          <td>{selectedCompany.promo_code}</td>
                        </tr>
                      )}
                      {selectedCompany.how_to_claim && (
                        <tr>
                          <th scope="row">Nasıl Kullanılır</th>
                          <td>{selectedCompany.how_to_claim}</td>
                        </tr>
                      )}
                      <tr>
                        <th scope="row">Anlaşma Başlangıç</th>
                        <td>{new Date(selectedCompany.agreement_start_date).toLocaleDateString('tr-TR')}</td>
                      </tr>
                      {selectedCompany.agreement_end_date && (
                        <tr>
                          <th scope="row">Anlaşma Bitiş</th>
                          <td>{new Date(selectedCompany.agreement_end_date).toLocaleDateString('tr-TR')}</td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>

                <h5 className="fw-semibold mt-4">İletişim Bilgileri</h5>
                <div className="table-responsive">
                  <Table className="table-borderless mb-0">
                    <tbody>
                      <tr>
                        <th scope="row">Telefon</th>
                        <td>{selectedCompany.phone || "-"}</td>
                      </tr>
                      <tr>
                        <th scope="row">E-posta</th>
                        <td>{selectedCompany.email || "-"}</td>
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
                        <th scope="row">Adres</th>
                        <td>
                          {selectedCompany.address ? (
                            <>
                              {selectedCompany.address}
                              {selectedCompany.city && `, ${selectedCompany.city}`}
                              {selectedCompany.state && `, ${selectedCompany.state}`}
                              {selectedCompany.postal_code && ` ${selectedCompany.postal_code}`}
                              {selectedCompany.country && `, ${selectedCompany.country}`}
                            </>
                          ) : "-"}
                        </td>
                      </tr>
                      {selectedCompany.location_map_link && (
                        <tr>
                          <th scope="row">Konum</th>
                          <td>
                            <a
                              href={selectedCompany.location_map_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="link-primary"
                            >
                              Haritada Görüntüle
                            </a>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>

                {selectedCompany.branches.length > 0 && (
                  <div className="mt-4">
                    <h5 className="fw-semibold">Şubeler ({selectedCompany.branches.length})</h5>
                    <ul className="list-group list-group-flush">
                      {selectedCompany.branches.map((branch) => (
                        <li key={branch.id} className="list-group-item px-0">
                          <h6 className="mb-1">{branch.name}</h6>
                          <p className="text-muted mb-1">{branch.address}</p>
                          {branch.phone && <small className="text-muted d-block">Tel: {branch.phone}</small>}
                          {branch.working_hours && <small className="text-muted d-block">Çalışma Saatleri: {branch.working_hours}</small>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="hstack gap-2 justify-content-end mt-4">
                  <Link
                    href={route('partner-companies.edit', selectedCompany.id)}
                    className="btn btn-primary"
                  >
                    <i className="ri-pencil-line align-bottom me-1"></i> Düzenle
                  </Link>
                </div>
              </Col>
            </Row>
          )}
        </Modal.Body>
      </Modal>

      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Anlaşmalı Kurumlar" pageTitle="İnsan Kaynakları" />

          <Row>
            <Col lg={12}>
              <Card>
                <Card.Header className="d-flex align-items-center">
                  <h5 className="card-title mb-0 flex-grow-1">Anlaşmalı Kurumlar</h5>
                  <div className="d-flex gap-2">
                    <Link href={route('partner-companies.create')} className="btn btn-primary">
                      <i className="ri-add-line align-bottom me-1"></i> Yeni Anlaşmalı Kurum Ekle
                    </Link>
                    <Link href={route('partner-company-categories.index')} className="btn btn-soft-secondary">
                      <i className="ri-list-check align-bottom me-1"></i> Kategorileri Yönet
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
                          value={categoryId}
                          onChange={(e) => setCategoryId(e.target.value)}
                        >
                          <option value="">Tüm Kategoriler</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
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
                          <option value="expired">Süresi Dolmuş</option>
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
                            Kurum Adı
                            {sortField === "name" && (
                              <span className="ms-1">
                                {sortDirection === "asc" ?
                                  <i className="ri-arrow-up-s-line align-bottom"></i> :
                                  <i className="ri-arrow-down-s-line align-bottom"></i>
                                }
                              </span>
                            )}
                          </th>
                          <th className="sort cursor-pointer" onClick={() => handleSort("category_id")}>
                            Kategori
                            {sortField === "category_id" && (
                              <span className="ms-1">
                                {sortDirection === "asc" ?
                                  <i className="ri-arrow-up-s-line align-bottom"></i> :
                                  <i className="ri-arrow-down-s-line align-bottom"></i>
                                }
                              </span>
                            )}
                          </th>
                          <th>İndirim Detayları</th>
                          <th className="sort cursor-pointer" onClick={() => handleSort("agreement_start_date")}>
                            Başlangıç Tarihi
                            {sortField === "agreement_start_date" && (
                              <span className="ms-1">
                                {sortDirection === "asc" ?
                                  <i className="ri-arrow-up-s-line align-bottom"></i> :
                                  <i className="ri-arrow-down-s-line align-bottom"></i>
                                }
                              </span>
                            )}
                          </th>
                          <th className="sort cursor-pointer" onClick={() => handleSort("agreement_end_date")}>
                            Bitiş Tarihi
                            {sortField === "agreement_end_date" && (
                              <span className="ms-1">
                                {sortDirection === "asc" ?
                                  <i className="ri-arrow-up-s-line align-bottom"></i> :
                                  <i className="ri-arrow-down-s-line align-bottom"></i>
                                }
                              </span>
                            )}
                          </th>
                          <th>Durum</th>
                          <th>İşlemler</th>
                        </tr>
                      </thead>
                      <tbody>
                        {partnerCompanies.data.length > 0 ? (
                          partnerCompanies.data.map((company) => (
                            <tr key={company.id}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div className="flex-shrink-0">
                                    {company.logo_path ? (
                                      <img
                                        src={company.logo_path}
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
                              <td>{company.category?.name || "-"}</td>
                              <td>
                                <div className="text-wrap" style={{ maxWidth: '250px' }}>
                                  {company.discount_details || "-"}
                                </div>
                              </td>
                              <td>{new Date(company.agreement_start_date).toLocaleDateString('tr-TR')}</td>
                              <td>
                                {company.agreement_end_date
                                  ? new Date(company.agreement_end_date).toLocaleDateString('tr-TR')
                                  : "Süresiz"}
                              </td>
                              <td>{getStatusBadge(company)}</td>
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
                                    href={route('partner-companies.edit', company.id)}
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

PartnerCompaniesIndex.layout = (page: any) => <Layout children={page} />;
export default PartnerCompaniesIndex;
