import React, { useEffect, useRef, useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { Container, Card, Row, Col, Button, Modal, Form, Alert } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import AdminLayout from '../../../Layouts/AdminLayout';
import { FaPlus, FaEdit, FaTrash, FaUsers, FaSitemap, FaExpand, FaSearchMinus, FaSearchPlus } from 'react-icons/fa';

// Import the OrgChart library
import OrgChart from '@balkangraph/orgchart.js';

interface User {
    id: number;
    name: string;
    email: string;
    phone?: string;
    position?: string;
    avatar?: string;
    department?: {
        id: number;
        name: string;
    };
    positions?: Array<{
        id: number;
        title: string;
        level: number;
    }>;
}

interface Department {
    id: number;
    name: string;
    code: string;
}

interface OrganizationPosition {
    id: number;
    title: string;
    code: string;
    level: number;
    department_id?: number;
    department?: Department;
}

interface Props {
    organizationData: any[];
    users: User[];
    departments: Department[];
    positions: OrganizationPosition[];
    isAdmin: boolean;
}

export default function Index({ organizationData, users, departments, positions, isAdmin }: Props) {
    const { t } = useTranslation();
    const chartRef = useRef<HTMLDivElement>(null);
    const chartInstance = useRef<any>(null);
    
    // Modals state
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [alert, setAlert] = useState<{ type: 'success' | 'danger' | 'info', message: string } | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Forms
    const assignForm = useForm({
        user_id: '',
        position_id: '',
        is_primary: true,
        start_date: '',
    });

    const editForm = useForm({
        user_id: '',
        new_department_id: '',
        new_position: '',
    });

    useEffect(() => {
        if (chartRef.current && organizationData.length > 0) {
            // Clear any existing chart
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }

            chartInstance.current = new OrgChart(chartRef.current, {
                template: "olivia",
                enableDragDrop: isAdmin,
                dragDropMenu: {
                    addInGroup: { text: t("Add in Group") },
                    addAsChild: { text: t("Add as Child") },
                    edit: { text: t("Edit") },
                    details: { text: t("Details") }
                },
                nodeMenuItems: {
                    edit: { text: t("Edit"), icon: "edit" },
                    add: { text: t("Add"), icon: "add" },
                    remove: { text: t("Remove"), icon: "remove" }
                },
                nodeBinding: {
                    field_0: "name",
                    field_1: "title", 
                    field_2: "department",
                    img_0: "img"
                },
                tags: {
                    "ceo": {
                        template: "isla",
                        nodeMenuNeighbourLimit: 5
                    },
                    "manager": {
                        template: "luba", 
                        nodeMenuNeighbourLimit: 2
                    }
                },
                onNodeClick: function(args: any) {
                    if (isAdmin) {
                        const user = users.find(u => u.id === args.node.id);
                        if (user) {
                            setSelectedUser(user);
                            editForm.setData({
                                user_id: user.id.toString(),
                                new_department_id: user.department?.id?.toString() || '',
                                new_position: user.position || '',
                            });
                            setShowEditModal(true);
                        }
                    }
                },
                onInit: function() {
                    // Chart initialized - add additional event listeners
                    console.log('Chart initialized');
                },
                scaleInitial: 0.7,
                orientation: 0,
                levelSeparation: 120,
                siblingSeparation: 50,
                subtreeSeparation: 50,
                toolbar: {
                    layout: true,
                    zoom: true,
                    fit: true
                }
            });

            // Transform data for OrgChart
            const chartData = organizationData.map(node => ({
                id: node.id,
                pid: node.parentId, // parent id
                name: node.name,
                title: node.title,
                img: node.img,
                department: node.department,
                email: node.email,
                phone: node.phone || '',
            }));

            console.log('Original organizationData:', organizationData);
            console.log('Transformed chartData for OrgChart:', chartData);

            // Load the transformed organization data
            chartInstance.current.load(chartData);

            // Add simple event listeners to detect interactions
            if (isAdmin && chartRef.current) {
                const chartElement = chartRef.current;
                
                // Listen for any mouse interactions on the chart
                const handleInteraction = () => {
                    // Add a small delay to allow the drag-drop to complete
                    setTimeout(() => {
                        setHasUnsavedChanges(true);
                        setAlert({ 
                            type: 'info', 
                            message: t('Position changed. Click "Save Changes" to save the new organization structure.') 
                        });
                    }, 500);
                };

                // Add listeners for drag events
                chartElement.addEventListener('dragend', handleInteraction);
                chartElement.addEventListener('drop', handleInteraction);
                
                // Also listen for mouse release after potential drag
                let mouseDownTime = 0;
                chartElement.addEventListener('mousedown', () => {
                    mouseDownTime = Date.now();
                });
                
                chartElement.addEventListener('mouseup', () => {
                    // If mouse was held down for more than 100ms, consider it a potential drag
                    if (Date.now() - mouseDownTime > 100) {
                        handleInteraction();
                    }
                });

                // Cleanup function
                return () => {
                    chartElement.removeEventListener('dragend', handleInteraction);
                    chartElement.removeEventListener('drop', handleInteraction);
                };
            }
        }

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [organizationData, isAdmin, t]);

    const handleHierarchyUpdate = (userId: number, newParentId?: number, newDepartmentId?: number) => {
        router.post(route('admin.organization-chart.update-hierarchy'), {
            user_id: userId,
            new_manager_id: newParentId,
            new_department_id: newDepartmentId,
        }, {
            onSuccess: (page) => {
                setAlert({ type: 'success', message: t('Organization hierarchy updated successfully') });
                setTimeout(() => setAlert(null), 3000);
                // Reload the page data to show updated hierarchy
                router.reload({ only: ['organizationData', 'users'] });
            },
            onError: (errors) => {
                console.error('Error updating hierarchy:', errors);
                setAlert({ type: 'danger', message: t('Error updating organization hierarchy') });
                setTimeout(() => setAlert(null), 3000);
            }
        });
    };

    const saveCurrentHierarchy = () => {
        if (!chartInstance.current) {
            setAlert({ type: 'danger', message: t('Chart not initialized') });
            return;
        }

        try {
            // Get current chart data
            const nodes = chartInstance.current.config.nodes || [];
            console.log('Current chart nodes:', nodes);

            // Create update requests for each node
            const updates = nodes.map((node: any) => ({
                user_id: parseInt(node.id),
                new_manager_id: node.pid ? parseInt(node.pid) : null,
            }));

            console.log('Hierarchy updates to send:', updates);

            // Send all updates to backend using fetch instead of router.post
            fetch(route('admin.organization-chart.save-hierarchy'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    updates: updates
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    setHasUnsavedChanges(false);
                    setAlert({ type: 'success', message: t('Organization hierarchy saved successfully') });
                    setTimeout(() => setAlert(null), 3000);
                    // Reload the page data to show updated hierarchy
                    router.reload({ only: ['organizationData', 'users'] });
                } else {
                    setAlert({ type: 'danger', message: data.message || t('Error saving organization hierarchy') });
                    setTimeout(() => setAlert(null), 3000);
                }
            })
            .catch(error => {
                console.error('Error saving hierarchy:', error);
                setAlert({ type: 'danger', message: t('Error saving organization hierarchy') });
                setTimeout(() => setAlert(null), 3000);
            });

        } catch (error) {
            console.error('Error getting chart data:', error);
            setAlert({ type: 'danger', message: t('Error reading chart data') });
            setTimeout(() => setAlert(null), 3000);
        }
    };

    const handleNodeDropped = (event: any) => {
        // Listen for DOM changes that indicate a node was moved
        // This is a workaround since OrgChart.js events are not reliable
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Node was moved, trigger update
                    console.log('Node position changed via drag-drop');
                }
            });
        });

        if (chartRef.current) {
            observer.observe(chartRef.current, {
                childList: true,
                subtree: true
            });
        }

        return () => {
            observer.disconnect();
        };
    };

    const handleAssignPosition = (e: React.FormEvent) => {
        e.preventDefault();
        assignForm.post(route('admin.organization-chart.assign-position'), {
            onSuccess: () => {
                setShowAssignModal(false);
                assignForm.reset();
                setAlert({ type: 'success', message: t('Position assigned successfully') });
                setTimeout(() => setAlert(null), 3000);
            },
            onError: (errors) => {
                console.error('Assign position errors:', errors);
            }
        });
    };

    const handleEditUser = (e: React.FormEvent) => {
        e.preventDefault();
        editForm.post(route('admin.organization-chart.update-hierarchy'), {
            onSuccess: () => {
                setShowEditModal(false);
                editForm.reset();
                setSelectedUser(null);
                setAlert({ type: 'success', message: t('User updated successfully') });
                setTimeout(() => setAlert(null), 3000);
            },
            onError: (errors) => {
                console.error('Edit user errors:', errors);
            }
        });
    };

    const chartControls = () => {
        if (!chartInstance.current) return;
        
        return (
            <div className="d-flex gap-2 mb-3">
                <Button variant="outline-primary" size="sm" onClick={() => chartInstance.current.fit()}>
                    <FaExpand className="me-1" /> {t('Fit to Screen')}
                </Button>
                <Button variant="outline-primary" size="sm" onClick={() => chartInstance.current.zoom(1.2)}>
                    <FaSearchPlus className="me-1" /> {t('Zoom In')}
                </Button>
                <Button variant="outline-primary" size="sm" onClick={() => chartInstance.current.zoom(0.8)}>
                    <FaSearchMinus className="me-1" /> {t('Zoom Out')}
                </Button>
                <Button variant="outline-primary" size="sm" onClick={() => {
                    // Alternative: reload chart to show all nodes
                    if (chartInstance.current) {
                        const chartData = organizationData.map(node => ({
                            id: node.id,
                            pid: node.parentId, // parent id
                            name: node.name,
                            title: node.title,
                            img: node.img,
                            department: node.department,
                            email: node.email,
                            phone: node.phone || '',
                        }));
                        chartInstance.current.load(chartData);
                    }
                }}>
                    <FaSitemap className="me-1" /> {t('Refresh Chart')}
                </Button>
                <Button 
                    variant="info" 
                    size="sm" 
                    onClick={() => {
                        setHasUnsavedChanges(true);
                        setAlert({ 
                            type: 'info', 
                            message: t('Position changed. Click "Save Changes" to save the new organization structure.') 
                        });
                    }}
                >
                    <FaEdit className="me-1" /> {t('Mark as Changed')}
                </Button>
                <Button 
                    variant={hasUnsavedChanges ? "warning" : "outline-secondary"} 
                    size="sm" 
                    disabled={!hasUnsavedChanges}
                    onClick={() => {
                        setAlert({ type: 'info', message: t('Saving changes...') });
                        saveCurrentHierarchy();
                    }}
                >
                    <FaEdit className="me-1" /> 
                    {hasUnsavedChanges ? t('Save Changes') + ' ⚠️' : t('No Changes')}
                </Button>
            </div>
        );
    };

    return (
        <AdminLayout>
            <Head title={t('Organization Chart Management')} />
            
            <Container fluid>
                {alert && (
                    <Alert variant={alert.type} dismissible onClose={() => setAlert(null)}>
                        {alert.message}
                    </Alert>
                )}

                {/* Statistics Cards */}
                <Row className="mb-4">
                    <Col md={3}>
                        <Card className="card-animate">
                            <Card.Body>
                                <div className="d-flex justify-content-between">
                                    <div>
                                        <p className="fw-medium text-muted mb-0">{t('Total Employees')}</p>
                                        <h2 className="mt-1 fw-bold">{users.length}</h2>
                                    </div>
                                    <div className="avatar-sm bg-soft-primary rounded">
                                        <div className="avatar-title bg-primary rounded">
                                            <FaUsers className="text-white" />
                                        </div>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="card-animate">
                            <Card.Body>
                                <div className="d-flex justify-content-between">
                                    <div>
                                        <p className="fw-medium text-muted mb-0">{t('Departments')}</p>
                                        <h2 className="mt-1 fw-bold">{departments.length}</h2>
                                    </div>
                                    <div className="avatar-sm bg-soft-success rounded">
                                        <div className="avatar-title bg-success rounded">
                                            <FaSitemap className="text-white" />
                                        </div>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="card-animate">
                            <Card.Body>
                                <div className="d-flex justify-content-between">
                                    <div>
                                        <p className="fw-medium text-muted mb-0">{t('Positions')}</p>
                                        <h2 className="mt-1 fw-bold">{positions.length}</h2>
                                    </div>
                                    <div className="avatar-sm bg-soft-info rounded">
                                        <div className="avatar-title bg-info rounded">
                                            <FaEdit className="text-white" />
                                        </div>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <div className="d-grid">
                            <Button 
                                variant="primary" 
                                className="h-100 d-flex align-items-center justify-content-center"
                                onClick={() => setShowAssignModal(true)}
                            >
                                <FaPlus className="me-2" />
                                {t('Assign Position')}
                            </Button>
                        </div>
                    </Col>
                </Row>

                {/* Chart Controls */}
                {chartControls()}

                {/* Organization Chart */}
                <Card>
                    <Card.Header>
                        <h5 className="card-title mb-0">
                            <FaSitemap className="me-2" />
                            {t('Organization Chart')}
                        </h5>
                        <small className="text-muted">{t('Drag and drop to reorganize positions')}</small>
                    </Card.Header>
                    <Card.Body>
                        <div className="org-chart-container">
                            <div ref={chartRef} style={{ height: '600px', width: '100%' }}></div>
                        </div>
                    </Card.Body>
                </Card>

                {/* Assign Position Modal */}
                <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>{t('Assign Position')}</Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={handleAssignPosition}>
                        <Modal.Body>
                            <Form.Group className="mb-3">
                                <Form.Label>{t('User')}</Form.Label>
                                <Form.Select
                                    value={assignForm.data.user_id}
                                    onChange={(e) => assignForm.setData('user_id', e.target.value)}
                                    isInvalid={!!assignForm.errors.user_id}
                                    required
                                >
                                    <option value="">{t('Select User')}</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>
                                            {user.name} - {user.department?.name}
                                        </option>
                                    ))}
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">{assignForm.errors.user_id}</Form.Control.Feedback>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>{t('Position')}</Form.Label>
                                <Form.Select
                                    value={assignForm.data.position_id}
                                    onChange={(e) => assignForm.setData('position_id', e.target.value)}
                                    isInvalid={!!assignForm.errors.position_id}
                                    required
                                >
                                    <option value="">{t('Select Position')}</option>
                                    {positions.map(position => (
                                        <option key={position.id} value={position.id}>
                                            {position.title} ({position.department?.name})
                                        </option>
                                    ))}
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">{assignForm.errors.position_id}</Form.Control.Feedback>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Check
                                    type="checkbox"
                                    label={t('Primary Position')}
                                    checked={assignForm.data.is_primary}
                                    onChange={(e) => assignForm.setData('is_primary', e.target.checked)}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>{t('Start Date')}</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={assignForm.data.start_date}
                                    onChange={(e) => assignForm.setData('start_date', e.target.value)}
                                />
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setShowAssignModal(false)}>
                                {t('Cancel')}
                            </Button>
                            <Button variant="primary" type="submit" disabled={assignForm.processing}>
                                {assignForm.processing ? t('Assigning...') : t('Assign Position')}
                            </Button>
                        </Modal.Footer>
                    </Form>
                </Modal>

                {/* Edit User Modal */}
                <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>{t('Edit User')} - {selectedUser?.name}</Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={handleEditUser}>
                        <Modal.Body>
                            <Form.Group className="mb-3">
                                <Form.Label>{t('Department')}</Form.Label>
                                <Form.Select
                                    value={editForm.data.new_department_id}
                                    onChange={(e) => editForm.setData('new_department_id', e.target.value)}
                                >
                                    <option value="">{t('Select Department')}</option>
                                    {departments.map(dept => (
                                        <option key={dept.id} value={dept.id}>
                                            {dept.name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>{t('Position Title')}</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={editForm.data.new_position}
                                    onChange={(e) => editForm.setData('new_position', e.target.value)}
                                    placeholder={t('Enter position title')}
                                />
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                                {t('Cancel')}
                            </Button>
                            <Button variant="primary" type="submit" disabled={editForm.processing}>
                                {editForm.processing ? t('Updating...') : t('Update User')}
                            </Button>
                        </Modal.Footer>
                    </Form>
                </Modal>
            </Container>
        </AdminLayout>
    );
}