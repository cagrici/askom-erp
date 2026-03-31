import React, { useState } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import { Container, Row, Col, Card, Form, Button, Alert, Badge } from "react-bootstrap";
import AdminLayout from "../../../Layouts/AdminLayout";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { useTranslation } from "react-i18next";

interface Department {
  id: number;
  name: string;
}

interface Role {
  id: number;
  name: string;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  department?: Department;
  position: string;
}

interface WorkflowStep {
  name: string;
  type: 'user' | 'role' | 'department' | 'manager';
  approver_id?: number;
  role_id?: number;
  department_id?: number;
  conditions?: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
  order: number;
  required: boolean;
}

interface Props {
  departments?: Department[];
  users?: User[];
  roles?: Role[];
}

const ApprovalWorkflowCreate: React.FC<Props> = ({ departments = [], users = [], roles = [] }) => {
  const { t } = useTranslation();
  const [steps, setSteps] = useState<WorkflowStep[]>([{
    name: '',
    type: 'user',
    order: 1,
    required: true
  }]);

  const { data, setData, post, processing, errors } = useForm({
    name: '',
    description: '',
    department_id: '',
    is_active: true,
    steps: steps
  });

  const addStep = () => {
    const newStep: WorkflowStep = {
      name: '',
      type: 'user',
      order: steps.length + 1,
      required: true
    };
    const newSteps = [...steps, newStep];
    setSteps(newSteps);
    setData('steps', newSteps);
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      const newSteps = steps.filter((_, i) => i !== index)
        .map((step, i) => ({ ...step, order: i + 1 }));
      setSteps(newSteps);
      setData('steps', newSteps);
    }
  };

  const updateStep = (index: number, field: keyof WorkflowStep, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    
    // Clear related fields when type changes
    if (field === 'type') {
      newSteps[index].approver_id = undefined;
      newSteps[index].role_id = undefined;
      newSteps[index].department_id = undefined;
    }
    
    setSteps(newSteps);
    setData('steps', newSteps);
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === steps.length - 1)) {
      return;
    }

    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap steps
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    
    // Update order numbers
    newSteps.forEach((step, i) => {
      step.order = i + 1;
    });
    
    setSteps(newSteps);
    setData('steps', newSteps);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('admin.approval-workflows.store'), {
      onError: (errors) => {
        console.log('Validation errors:', errors);
      }
    });
  };

  const getStepTypeOptions = () => [
    { value: 'user', label: t('Specific User') },
    { value: 'role', label: t('User Role') },
    { value: 'department', label: t('Department Manager') },
    { value: 'manager', label: t('Direct Manager') }
  ];

  const getUsersByDepartment = (departmentId?: number) => {
    if (!departmentId) return users;
    return users.filter(user => user.department.id === departmentId);
  };

  return (
    <>
      <Head title={t("Create Approval Workflow") + " | Admin Panel"} />
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Create Approval Workflow")} pageTitle={t("Approval Workflows")} />

          <Row>
            <Col lg={12}>
              <Card>
                <Card.Header className="d-flex align-items-center">
                  <h5 className="card-title mb-0 flex-grow-1">{t("Create New Workflow")}</h5>
                  <Link href={route('admin.approval-workflows.index')} className="btn btn-light">
                    <i className="ri-arrow-left-line align-bottom me-1"></i> {t("Back to List")}
                  </Link>
                </Card.Header>
                
                <Card.Body>
                  <Form onSubmit={handleSubmit}>
                    {/* Basic Information */}
                    <Row className="mb-4">
                      <Col lg={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>{t("Workflow Name")} <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            isInvalid={!!errors.name}
                            placeholder={t("Enter workflow name")}
                          />
                          {errors.name && (
                            <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                          )}
                        </Form.Group>
                      </Col>
                      <Col lg={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>{t("Department")}</Form.Label>
                          <Form.Select
                            value={data.department_id}
                            onChange={(e) => setData('department_id', e.target.value)}
                            isInvalid={!!errors.department_id}
                          >
                            <option value="">{t("All Departments")}</option>
                            {departments.map(dept => (
                              <option key={dept.id} value={dept.id}>{dept.name}</option>
                            ))}
                          </Form.Select>
                          {errors.department_id && (
                            <Form.Control.Feedback type="invalid">{errors.department_id}</Form.Control.Feedback>
                          )}
                          <Form.Text className="text-muted">
                            {t("Leave empty to apply to all departments")}
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="mb-4">
                      <Col lg={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>{t("Description")}</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            isInvalid={!!errors.description}
                            placeholder={t("Describe this workflow's purpose and usage")}
                          />
                          {errors.description && (
                            <Form.Control.Feedback type="invalid">{errors.description}</Form.Control.Feedback>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="mb-4">
                      <Col lg={12}>
                        <Form.Check
                          type="switch"
                          id="is_active"
                          label={t("Active")}
                          checked={data.is_active}
                          onChange={(e) => setData('is_active', e.target.checked)}
                        />
                        <Form.Text className="text-muted">
                          {t("Only active workflows can be selected for new requests")}
                        </Form.Text>
                      </Col>
                    </Row>

                    {/* Approval Steps */}
                    <div className="mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="mb-0">{t("Approval Steps")}</h6>
                        <Button variant="outline-primary" size="sm" onClick={addStep}>
                          <i className="ri-add-line me-1"></i> {t("Add Step")}
                        </Button>
                      </div>

                      {steps.map((step, index) => (
                        <Card key={index} className="mb-3 border">
                          <Card.Header className="py-2">
                            <div className="d-flex justify-content-between align-items-center">
                              <div className="d-flex align-items-center">
                                <Badge bg="primary" className="me-2">{index + 1}</Badge>
                                <span className="fw-medium">{t("Step")} {index + 1}</span>
                              </div>
                              <div>
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  className="me-1"
                                  onClick={() => moveStep(index, 'up')}
                                  disabled={index === 0}
                                >
                                  <i className="ri-arrow-up-line"></i>
                                </Button>
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  className="me-2"
                                  onClick={() => moveStep(index, 'down')}
                                  disabled={index === steps.length - 1}
                                >
                                  <i className="ri-arrow-down-line"></i>
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => removeStep(index)}
                                  disabled={steps.length === 1}
                                >
                                  <i className="ri-delete-bin-line"></i>
                                </Button>
                              </div>
                            </div>
                          </Card.Header>
                          <Card.Body>
                            <Row>
                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <Form.Label>{t("Step Name")} <span className="text-danger">*</span></Form.Label>
                                  <Form.Control
                                    type="text"
                                    value={step.name}
                                    onChange={(e) => updateStep(index, 'name', e.target.value)}
                                    placeholder={t("e.g., Department Manager Approval")}
                                    isInvalid={!!errors[`steps.${index}.name`]}
                                  />
                                  {errors[`steps.${index}.name`] && (
                                    <Form.Control.Feedback type="invalid">
                                      {errors[`steps.${index}.name`]}
                                    </Form.Control.Feedback>
                                  )}
                                </Form.Group>
                              </Col>
                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <Form.Label>{t("Approver Type")} <span className="text-danger">*</span></Form.Label>
                                  <Form.Select
                                    value={step.type}
                                    onChange={(e) => updateStep(index, 'type', e.target.value)}
                                    isInvalid={!!errors[`steps.${index}.type`]}
                                  >
                                    {getStepTypeOptions().map(option => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </Form.Select>
                                  {errors[`steps.${index}.type`] && (
                                    <Form.Control.Feedback type="invalid">
                                      {errors[`steps.${index}.type`]}
                                    </Form.Control.Feedback>
                                  )}
                                </Form.Group>
                              </Col>
                            </Row>

                            {/* Dynamic fields based on step type */}
                            {step.type === 'user' && (
                              <Row>
                                <Col md={12}>
                                  <Form.Group className="mb-3">
                                    <Form.Label>{t("Select User")} <span className="text-danger">*</span></Form.Label>
                                    <Form.Select
                                      value={step.approver_id || ''}
                                      onChange={(e) => updateStep(index, 'approver_id', Number(e.target.value))}
                                      isInvalid={!!errors[`steps.${index}.approver_id`]}
                                    >
                                      <option value="">{t("Select a user")}</option>
                                      {users.map(user => (
                                        <option key={user.id} value={user.id}>
                                          {user.first_name} {user.last_name} - {user.position} ({user.department?.name || t("No Department")})
                                        </option>
                                      ))}
                                    </Form.Select>
                                    {errors[`steps.${index}.approver_id`] && (
                                      <Form.Control.Feedback type="invalid">
                                        {errors[`steps.${index}.approver_id`]}
                                      </Form.Control.Feedback>
                                    )}
                                  </Form.Group>
                                </Col>
                              </Row>
                            )}

                            {step.type === 'role' && (
                              <Row>
                                <Col md={12}>
                                  <Form.Group className="mb-3">
                                    <Form.Label>{t("Select Role")} <span className="text-danger">*</span></Form.Label>
                                    <Form.Select
                                      value={step.role_id || ''}
                                      onChange={(e) => updateStep(index, 'role_id', Number(e.target.value))}
                                      isInvalid={!!errors[`steps.${index}.role_id`]}
                                    >
                                      <option value="">{t("Select a role")}</option>
                                      {roles.map(role => (
                                        <option key={role.id} value={role.id}>
                                          {role.name}
                                        </option>
                                      ))}
                                    </Form.Select>
                                    {errors[`steps.${index}.role_id`] && (
                                      <Form.Control.Feedback type="invalid">
                                        {errors[`steps.${index}.role_id`]}
                                      </Form.Control.Feedback>
                                    )}
                                  </Form.Group>
                                </Col>
                              </Row>
                            )}

                            {step.type === 'department' && (
                              <Row>
                                <Col md={12}>
                                  <Form.Group className="mb-3">
                                    <Form.Label>{t("Department")} <span className="text-danger">*</span></Form.Label>
                                    <Form.Select
                                      value={step.department_id || ''}
                                      onChange={(e) => updateStep(index, 'department_id', Number(e.target.value))}
                                      isInvalid={!!errors[`steps.${index}.department_id`]}
                                    >
                                      <option value="">{t("Select department")}</option>
                                      {departments.map(dept => (
                                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                                      ))}
                                    </Form.Select>
                                    {errors[`steps.${index}.department_id`] && (
                                      <Form.Control.Feedback type="invalid">
                                        {errors[`steps.${index}.department_id`]}
                                      </Form.Control.Feedback>
                                    )}
                                  </Form.Group>
                                </Col>
                              </Row>
                            )}

                            {step.type === 'manager' && (
                              <Alert variant="info" className="mb-3">
                                <i className="ri-information-line me-2"></i>
                                {t("This step will automatically route to the requester's direct manager")}
                              </Alert>
                            )}

                            <Row>
                              <Col md={12}>
                                <Form.Check
                                  type="switch"
                                  id={`required_${index}`}
                                  label={t("Required Step")}
                                  checked={step.required}
                                  onChange={(e) => updateStep(index, 'required', e.target.checked)}
                                />
                                <Form.Text className="text-muted">
                                  {t("If unchecked, this step can be skipped based on conditions")}
                                </Form.Text>
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>
                      ))}
                    </div>

                    {/* Submit Buttons */}
                    <div className="text-end">
                      <Link href={route('admin.approval-workflows.index')} className="btn btn-light me-2">
                        {t("Cancel")}
                      </Link>
                      <Button type="submit" variant="primary" disabled={processing}>
                        {processing ? t("Creating...") : t("Create Workflow")}
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
};

ApprovalWorkflowCreate.layout = (page: any) => <AdminLayout children={page} />;
export default ApprovalWorkflowCreate;