import React from "react";
import { Head, Link, router } from "@inertiajs/react";
import { Container, Row, Col, Card, Badge, Button, Table, Alert } from "react-bootstrap";
import AdminLayout from "../../../Layouts/AdminLayout";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";

interface Department {
  id: number;
  name: string;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
}

interface WorkRequest {
  id: number;
  title: string;
  status: string;
  priority: string;
  requester: User;
  assignee: User;
  created_at: string;
}

interface WorkflowStep {
  name: string;
  type: 'user' | 'role' | 'department' | 'manager';
  approver_id?: number;
  role?: string;
  department_id?: number;
  order: number;
  required: boolean;
}

interface Workflow {
  id: number;
  name: string;
  description: string;
  department: Department | null;
  is_active: boolean;
  steps: WorkflowStep[];
  work_requests: WorkRequest[];
  created_at: string;
  updated_at: string;
}

interface Props {
  workflow: Workflow;
}

const ApprovalWorkflowShow: React.FC<Props> = ({ workflow }) => {
  const { t } = useTranslation();

  const toggleStatus = () => {
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

  const duplicateWorkflow = () => {
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

  const deleteWorkflow = () => {
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
            router.get(route('admin.approval-workflows.index'));
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

  const getStepTypeIcon = (type: string) => {
    switch (type) {
      case 'user': return 'ri-user-line';
      case 'role': return 'ri-group-line';
      case 'department': return 'ri-building-line';
      case 'manager': return 'ri-user-star-line';
      default: return 'ri-user-line';
    }
  };

  const getStepTypeLabel = (type: string) => {
    switch (type) {
      case 'user': return t('Specific User');
      case 'role': return t('User Role');
      case 'department': return t('Department Manager');
      case 'manager': return t('Direct Manager');
      default: return type;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: {[key: string]: { bg: string, text: string }} = {
      'pending': { bg: 'warning', text: t('Pending') },
      'in_progress': { bg: 'info', text: t('In Progress') },
      'approved': { bg: 'success', text: t('Approved') },
      'rejected': { bg: 'danger', text: t('Rejected') },
      'completed': { bg: 'success', text: t('Completed') }
    };
    
    const statusInfo = statusMap[status] || { bg: 'secondary', text: status };
    return <Badge bg={statusInfo.bg}>{statusInfo.text}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap: {[key: string]: { bg: string, text: string }} = {
      'low': { bg: 'success', text: t('Low') },
      'normal': { bg: 'info', text: t('Normal') },
      'high': { bg: 'warning', text: t('High') },
      'urgent': { bg: 'danger', text: t('Urgent') }
    };
    
    const priorityInfo = priorityMap[priority] || { bg: 'secondary', text: priority };
    return <Badge bg={priorityInfo.bg}>{priorityInfo.text}</Badge>;
  };

  return (
    <>
      <Head title={workflow.name + " | " + t("Approval Workflows")} />
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={workflow.name} pageTitle={t("Approval Workflows")} />

          <Row>
            <Col lg={8}>
              {/* Workflow Information */}
              <Card className="mb-4">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">{t("Workflow Details")}</h5>
                  <div>
                    {workflow.is_active ? (
                      <Badge bg="success" className="fs-6">{t("Active")}</Badge>
                    ) : (
                      <Badge bg="secondary" className="fs-6">{t("Inactive")}</Badge>
                    )}
                  </div>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <div className="mb-3">
                        <h6 className="text-muted mb-1">{t("Name")}</h6>
                        <p className="mb-0 fs-5 fw-medium">{workflow.name}</p>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="mb-3">
                        <h6 className="text-muted mb-1">{t("Department")}</h6>
                        <p className="mb-0">
                          {workflow.department ? (
                            <Badge bg="light" text="dark">{workflow.department.name}</Badge>
                          ) : (
                            <span className="text-muted">{t("All Departments")}</span>
                          )}
                        </p>
                      </div>
                    </Col>
                  </Row>

                  {workflow.description && (
                    <Row>
                      <Col>
                        <div className="mb-3">
                          <h6 className="text-muted mb-1">{t("Description")}</h6>
                          <p className="mb-0">{workflow.description}</p>
                        </div>
                      </Col>
                    </Row>
                  )}

                  <Row>
                    <Col md={6}>
                      <div className="mb-3">
                        <h6 className="text-muted mb-1">{t("Total Steps")}</h6>
                        <p className="mb-0">
                          <Badge bg="info">{workflow.steps.length} {t("steps")}</Badge>
                        </p>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="mb-3">
                        <h6 className="text-muted mb-1">{t("Usage Count")}</h6>
                        <p className="mb-0">
                          <Badge bg="secondary">{workflow.work_requests.length} {t("requests")}</Badge>
                        </p>
                      </div>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <div>
                        <h6 className="text-muted mb-1">{t("Created")}</h6>
                        <p className="mb-0 text-muted small">
                          {new Date(workflow.created_at).toLocaleString()}
                        </p>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div>
                        <h6 className="text-muted mb-1">{t("Last Updated")}</h6>
                        <p className="mb-0 text-muted small">
                          {new Date(workflow.updated_at).toLocaleString()}
                        </p>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Approval Steps */}
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="card-title mb-0">{t("Approval Steps")}</h5>
                </Card.Header>
                <Card.Body>
                  {workflow.steps && workflow.steps.length > 0 ? (
                    <div className="workflow-steps">
                      {workflow.steps.map((step, index) => (
                        <div key={index} className="d-flex align-items-start mb-4">
                          <div className="flex-shrink-0">
                            <div className="avatar-sm bg-primary bg-opacity-10 rounded">
                              <span className="avatar-title text-primary fs-4">
                                {index + 1}
                              </span>
                            </div>
                          </div>
                          <div className="flex-grow-1 ms-3">
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <h6 className="mb-1">{step.name}</h6>
                                <div className="d-flex align-items-center gap-2 mb-2">
                                  <Badge bg="light" text="dark">
                                    <i className={`${getStepTypeIcon(step.type)} me-1`}></i>
                                    {getStepTypeLabel(step.type)}
                                  </Badge>
                                  {step.required && (
                                    <Badge bg="danger">{t("Required")}</Badge>
                                  )}
                                </div>
                                
                                {/* Additional step details */}
                                {step.type === 'role' && step.role && (
                                  <p className="text-muted mb-0 small">
                                    <i className="ri-shield-user-line me-1"></i>
                                    {t("Role")}: {step.role}
                                  </p>
                                )}
                                
                                {step.type === 'department' && step.department_id && (
                                  <p className="text-muted mb-0 small">
                                    <i className="ri-building-line me-1"></i>
                                    {t("Department ID")}: {step.department_id}
                                  </p>
                                )}
                                
                                {step.type === 'user' && step.approver_id && (
                                  <p className="text-muted mb-0 small">
                                    <i className="ri-user-line me-1"></i>
                                    {t("User ID")}: {step.approver_id}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Step connector */}
                          {index < workflow.steps.length - 1 && (
                            <div className="position-absolute" style={{ 
                              left: '19px', 
                              top: '60px', 
                              height: '30px', 
                              width: '2px', 
                              backgroundColor: '#e9ecef' 
                            }}></div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Alert variant="info">
                      <i className="ri-information-line me-2"></i>
                      {t("No approval steps defined for this workflow")}
                    </Alert>
                  )}
                </Card.Body>
              </Card>

              {/* Recent Work Requests */}
              <Card>
                <Card.Header>
                  <h5 className="card-title mb-0">{t("Recent Work Requests")} ({workflow.work_requests.length})</h5>
                </Card.Header>
                <Card.Body>
                  {workflow.work_requests && workflow.work_requests.length > 0 ? (
                    <div className="table-responsive">
                      <Table className="table-sm">
                        <thead>
                          <tr>
                            <th>{t("Title")}</th>
                            <th>{t("Requester")}</th>
                            <th>{t("Status")}</th>
                            <th>{t("Priority")}</th>
                            <th>{t("Date")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {workflow.work_requests.map((request) => (
                            <tr key={request.id}>
                              <td>
                                <Link 
                                  href={route('work-requests.show', request.id)}
                                  className="text-decoration-none"
                                >
                                  {request.title}
                                </Link>
                              </td>
                              <td>{request.requester.first_name} {request.requester.last_name}</td>
                              <td>{getStatusBadge(request.status)}</td>
                              <td>{getPriorityBadge(request.priority)}</td>
                              <td className="text-muted small">
                                {new Date(request.created_at).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <Alert variant="light">
                      <i className="ri-inbox-line me-2"></i>
                      {t("No work requests have used this workflow yet")}
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Action Sidebar */}
            <Col lg={4}>
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="card-title mb-0">{t("Actions")}</h5>
                </Card.Header>
                <Card.Body className="d-grid gap-2">
                  <Link 
                    href={route('admin.approval-workflows.edit', workflow.id)}
                    className="btn btn-primary"
                  >
                    <i className="ri-edit-line me-1"></i> {t("Edit Workflow")}
                  </Link>
                  
                  <Button 
                    variant={workflow.is_active ? "warning" : "success"}
                    onClick={toggleStatus}
                  >
                    <i className={`ri-${workflow.is_active ? 'pause' : 'play'}-line me-1`}></i>
                    {workflow.is_active ? t("Deactivate") : t("Activate")}
                  </Button>
                  
                  <Button variant="info" onClick={duplicateWorkflow}>
                    <i className="ri-file-copy-line me-1"></i> {t("Duplicate")}
                  </Button>
                  
                  <hr />
                  
                  <Button variant="danger" onClick={deleteWorkflow}>
                    <i className="ri-delete-bin-line me-1"></i> {t("Delete Workflow")}
                  </Button>
                  
                  <Link 
                    href={route('admin.approval-workflows.index')}
                    className="btn btn-light"
                  >
                    <i className="ri-arrow-left-line me-1"></i> {t("Back to List")}
                  </Link>
                </Card.Body>
              </Card>

              {/* Quick Stats */}
              <Card>
                <Card.Header>
                  <h5 className="card-title mb-0">{t("Quick Stats")}</h5>
                </Card.Header>
                <Card.Body>
                  <div className="text-center">
                    <div className="row text-center">
                      <div className="col-6 border-end">
                        <div className="p-2">
                          <h4 className="mb-1 text-primary">{workflow.steps.length}</h4>
                          <p className="text-muted mb-0 small">{t("Total Steps")}</p>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="p-2">
                          <h4 className="mb-1 text-info">{workflow.work_requests.length}</h4>
                          <p className="text-muted mb-0 small">{t("Usage Count")}</p>
                        </div>
                      </div>
                    </div>
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

ApprovalWorkflowShow.layout = (page: any) => <AdminLayout children={page} />;
export default ApprovalWorkflowShow;