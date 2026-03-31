import React, { useState } from "react";
import { Head, Link, useForm, router } from "@inertiajs/react";
import { Container, Row, Col, Card, Table, Button, Badge, Dropdown, Form, InputGroup } from "react-bootstrap";
import AdminLayout from "../../../Layouts/AdminLayout";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";

interface Department {
  id: number;
  name: string;
}

interface Workflow {
  id: number;
  name: string;
  description: string;
  department: Department | null;
  is_active: boolean;
  steps: any[];
  work_requests_count?: number;
  created_at: string;
  updated_at: string;
}

interface Props {
  workflows: {
    data: Workflow[];
    links?: any;
    meta?: {
      from?: number;
      to?: number;
      total?: number;
      current_page?: number;
      last_page?: number;
      per_page?: number;
    };
  };
  departments: Department[];
  filters: {
    department_id?: string;
    is_active?: string;
    search?: string;
  };
}

const ApprovalWorkflowIndex: React.FC<Props> = ({ workflows = { data: [] }, departments = [], filters = {} }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  const { data, setData, get } = useForm({
    department_id: filters.department_id || '',
    is_active: filters.is_active || '',
    search: filters.search || ''
  });

  const handleFilter = () => {
    get(route('admin.approval-workflows.index'), {
      preserveState: true,
      preserveScroll: true
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setData('search', searchTerm);
    get(route('admin.approval-workflows.index'), {
      preserveState: true,
      preserveScroll: true
    });
  };

  const clearFilters = () => {
    setData({
      department_id: '',
      is_active: '',
      search: ''
    });
    setSearchTerm('');
    router.get(route('admin.approval-workflows.index'));
  };

  const toggleStatus = (workflow: Workflow) => {
    router.post(route('admin.approval-workflows.toggle-status', workflow.id), {}, {
      onSuccess: () => {
        Swal.fire({
          icon: 'success',
          title: t('Success'),
          text: t('Status updated successfully'),
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  };

  const duplicateWorkflow = (workflow: Workflow) => {
    Swal.fire({
      title: t('Duplicate Workflow'),
      text: t('Are you sure you want to duplicate this workflow?'),
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#6c757d',
      confirmButtonText: t('Yes, duplicate'),
      cancelButtonText: t('Cancel')
    }).then((result) => {
      if (result.isConfirmed) {
        router.post(route('admin.approval-workflows.duplicate', workflow.id));
      }
    });
  };

  const deleteWorkflow = (workflow: Workflow) => {
    Swal.fire({
      title: t('Are you sure?'),
      text: t('This action cannot be undone!'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: t('Yes, delete'),
      cancelButtonText: t('Cancel')
    }).then((result) => {
      if (result.isConfirmed) {
        router.delete(route('admin.approval-workflows.destroy', workflow.id), {
          onSuccess: () => {
            Swal.fire(
              t('Deleted!'),
              t('Workflow has been deleted successfully.'),
              'success'
            );
          },
          onError: () => {
            Swal.fire(
              t('Error!'),
              t('Workflow could not be deleted.'),
              'error'
            );
          }
        });
      }
    });
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge bg="success">{t("Active")}</Badge>
    ) : (
      <Badge bg="secondary">{t("Inactive")}</Badge>
    );
  };

  return (
    <>
      <Head title={t("Approval Workflows") + " | Admin Panel"} />
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Approval Workflows")} pageTitle={t("Admin Panel")} />

          <Row>
            <Col lg={12}>
              <Card>
                <Card.Header className="d-flex align-items-center">
                  <h5 className="card-title mb-0 flex-grow-1">{t("Approval Workflows")}</h5>
                  <Link 
                    href={route('admin.approval-workflows.create')} 
                    className="btn btn-primary"
                  >
                    <i className="ri-add-line align-bottom me-1"></i> {t("Add New Workflow")}
                  </Link>
                </Card.Header>
                
                <Card.Body>
                  {/* Filters */}
                  <Row className="mb-3">
                    <Col md={3}>
                      <Form.Label>{t("Department")}</Form.Label>
                      <Form.Select
                        value={data.department_id}
                        onChange={(e) => {
                          setData('department_id', e.target.value);
                          handleFilter();
                        }}
                      >
                        <option value="">{t("All Departments")}</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col md={3}>
                      <Form.Label>{t("Status")}</Form.Label>
                      <Form.Select
                        value={data.is_active}
                        onChange={(e) => {
                          setData('is_active', e.target.value);
                          handleFilter();
                        }}
                      >
                        <option value="">{t("All Status")}</option>
                        <option value="1">{t("Active")}</option>
                        <option value="0">{t("Inactive")}</option>
                      </Form.Select>
                    </Col>
                    <Col md={4}>
                      <Form.Label>{t("Search")}</Form.Label>
                      <Form onSubmit={handleSearch}>
                        <InputGroup>
                          <Form.Control
                            type="text"
                            placeholder={t("Search workflows...")}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                          <Button variant="outline-secondary" type="submit">
                            <i className="ri-search-line"></i>
                          </Button>
                        </InputGroup>
                      </Form>
                    </Col>
                    <Col md={2} className="d-flex align-items-end">
                      <Button variant="light" onClick={clearFilters} className="w-100">
                        {t("Clear Filters")}
                      </Button>
                    </Col>
                  </Row>

                  {/* Table */}
                  <div className="table-responsive">
                    <Table className="table-striped table-nowrap align-middle mb-0">
                      <thead>
                        <tr>
                          <th scope="col">{t("Name")}</th>
                          <th scope="col">{t("Department")}</th>
                          <th scope="col">{t("Steps")}</th>
                          <th scope="col">{t("Status")}</th>
                          <th scope="col">{t("Usage")}</th>
                          <th scope="col">{t("Created")}</th>
                          <th scope="col">{t("Actions")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workflows?.data && workflows.data.length > 0 ? (
                          workflows.data.map((workflow) => (
                            <tr key={workflow.id}>
                              <td>
                                <div>
                                  <h6 className="mb-1">{workflow.name}</h6>
                                  {workflow.description && (
                                    <p className="text-muted mb-0 small">{workflow.description}</p>
                                  )}
                                </div>
                              </td>
                              <td>
                                {workflow.department ? (
                                  <Badge bg="light" text="dark">{workflow.department.name}</Badge>
                                ) : (
                                  <span className="text-muted">{t("All Departments")}</span>
                                )}
                              </td>
                              <td>
                                <span className="badge bg-info">{workflow.steps?.length || 0} {t("steps")}</span>
                              </td>
                              <td>{getStatusBadge(workflow.is_active)}</td>
                              <td>
                                <span className="text-muted">{workflow.work_requests_count || 0} {t("requests")}</span>
                              </td>
                              <td>
                                <span className="text-muted">
                                  {new Date(workflow.created_at).toLocaleDateString()}
                                </span>
                              </td>
                              <td>
                                <Dropdown>
                                  <Dropdown.Toggle variant="light" size="sm" id={`dropdown-${workflow.id}`}>
                                    <i className="ri-more-2-fill"></i>
                                  </Dropdown.Toggle>

                                  <Dropdown.Menu>
                                    <Dropdown.Item
                                      as={Link}
                                      href={route('admin.approval-workflows.show', workflow.id)}
                                    >
                                      <i className="ri-eye-line me-2"></i>{t("View")}
                                    </Dropdown.Item>
                                    <Dropdown.Item
                                      as={Link}
                                      href={route('admin.approval-workflows.edit', workflow.id)}
                                    >
                                      <i className="ri-pencil-line me-2"></i>{t("Edit")}
                                    </Dropdown.Item>
                                    <Dropdown.Item onClick={() => toggleStatus(workflow)}>
                                      <i className={`ri-${workflow.is_active ? 'pause' : 'play'}-line me-2`}></i>
                                      {workflow.is_active ? t("Deactivate") : t("Activate")}
                                    </Dropdown.Item>
                                    <Dropdown.Item onClick={() => duplicateWorkflow(workflow)}>
                                      <i className="ri-file-copy-line me-2"></i>{t("Duplicate")}
                                    </Dropdown.Item>
                                    <Dropdown.Divider />
                                    <Dropdown.Item 
                                      onClick={() => deleteWorkflow(workflow)}
                                      className="text-danger"
                                    >
                                      <i className="ri-delete-bin-line me-2"></i>{t("Delete")}
                                    </Dropdown.Item>
                                  </Dropdown.Menu>
                                </Dropdown>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="text-center py-4">
                              <div className="text-muted">
                                <i className="ri-inbox-line fs-1 mb-3 d-block"></i>
                                {t("No workflows found")}
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {workflows.links && workflows.meta && (
                    <Row className="mt-3">
                      <Col>
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="text-muted">
                            {t("Showing")} {workflows.meta.from || 0} {t("to")} {workflows.meta.to || 0} {t("of")} {workflows.meta.total || 0} {t("results")}
                          </div>
                          <div>
                            {workflows.links.map((link: any, index: number) => (
                              <Button
                                key={index}
                                variant={link.active ? "primary" : "light"}
                                size="sm"
                                className="me-1"
                                disabled={!link.url}
                                onClick={() => link.url && router.get(link.url)}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                              />
                            ))}
                          </div>
                        </div>
                      </Col>
                    </Row>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
};

ApprovalWorkflowIndex.layout = (page: any) => <AdminLayout children={page} />;
export default ApprovalWorkflowIndex;