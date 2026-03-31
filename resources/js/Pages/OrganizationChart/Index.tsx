import React, { useEffect, useRef, useState } from 'react';
import { Head } from '@inertiajs/react';
import { Container, Card, Modal, Row, Col, Badge } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import Layout from '../../Layouts/index';

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
        name: string;
    };
}

interface Department {
    id: number;
    name: string;
    manager?: User;
}

interface OrganizationNode {
    id: number;
    name: string;
    title: string;
    img: string;
    department: string;
    email: string;
    phone?: string;
    level: number;
    parentId?: number | null;
}

interface Props {
    organizationData: OrganizationNode[];
    isAdmin: boolean;
}

export default function Index({ organizationData, isAdmin }: Props) {
    const { t } = useTranslation();
    const chartRef = useRef<HTMLDivElement>(null);
    const chartInstance = useRef<any>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState<OrganizationNode | null>(null);

    useEffect(() => {
        // Add CSS to hide edit buttons and improve cursor
        const style = document.createElement('style');
        style.textContent = `
            /* Hide edit buttons in organization chart */
            .boc-edit { display: none !important; }
            [data-edit-id] { display: none !important; }
            .boc-input { display: none !important; }
            /* Change cursor to pointer on nodes */
            [data-n-id] { cursor: pointer !important; }
            /* Add hover effect */
            [data-n-id]:hover { opacity: 0.9; }
        `;
        document.head.appendChild(style);

        if (chartRef.current && organizationData.length > 0) {
            // Destroy existing chart if it exists
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }

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

            // Initialize the chart
            chartInstance.current = new OrgChart(chartRef.current, {
                template: "olivia",
                enableDragDrop: false,
                nodeBinding: {
                    field_0: "name",
                    field_1: "title", 
                    field_2: "department",
                    img_0: "img"
                },
                nodes: chartData,
                menu: {
                    pdf: { text: t("Export PDF") },
                    png: { text: t("Export PNG") },
                    svg: { text: t("Export SVG") },
                    csv: { text: t("Export CSV") }
                },
                toolbar: {
                    zoom: true,
                    fit: true,
                    expandAll: false,
                    fullScreen: true
                },
                tags: {
                    "ceo": {
                        template: "isla"
                    },
                    "manager": {
                        template: "luba"
                    }
                },
                enableSearch: true,
                searchFields: ["name", "title", "department"],
                scaleInitial: 0.7,
                orientation: 0,
                levelSeparation: 120,
                siblingSeparation: 50,
                subtreeSeparation: 50
            });
            
            // Additional setup to disable editing features and add click handler
            if (chartInstance.current) {
                // Completely disable edit functionality
                chartInstance.current.editUI = {
                    show: function() { return false; },
                    hide: function() { return false; },
                    content: function() { return ''; }
                };
                
                // Add direct DOM event listener
                setTimeout(() => {
                    const chartContainer = chartRef.current;
                    if (chartContainer) {
                        chartContainer.addEventListener('click', (event: any) => {
                            let element = event.target;
                            
                            // Traverse up to find node with data-n-id
                            while (element && !element.getAttribute('data-n-id')) {
                                element = element.parentElement;
                                if (!element || element === chartContainer) break;
                            }
                            
                            if (element && element.getAttribute('data-n-id')) {
                                const nodeId = element.getAttribute('data-n-id');
                                const person = organizationData.find(p => p.id === parseInt(nodeId));
                                if (person) {
                                    setSelectedPerson(person);
                                    setShowDetailsModal(true);
                                }
                            }
                        });
                    }
                }, 1000); // Wait for chart to be fully rendered
            }
        }

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
            // Remove the style element when component unmounts
            const styleElements = document.querySelectorAll('style');
            styleElements.forEach(el => {
                if (el.textContent?.includes('Hide edit buttons in organization chart')) {
                    el.remove();
                }
            });
        };
    }, [organizationData, t]);

    const handleCloseDetailsModal = () => {
        setShowDetailsModal(false);
        setSelectedPerson(null);
    };

    return (
        <Layout>
            <Head title={t('Organization Chart')} />
            
            <div className="page-content">
                <Container fluid className="px-4">
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between mb-4">
                                <h4 className="mb-sm-0">{t('Organization Chart')}</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item">
                                            <a href={route('dashboard')}>{t('Dashboard')}</a>
                                        </li>
                                        <li className="breadcrumb-item active">{t('Organization Chart')}</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-12">
                            <Card>
                                <Card.Header className="bg-light">
                                    <div className="d-flex align-items-center">
                                        <h5 className="card-title mb-0 flex-grow-1">
                                            {t('Company Organization Structure')}
                                        </h5>
                                        <div className="flex-shrink-0">
                                            <span className="badge bg-primary">
                                                {organizationData.length} {t('Employees')}
                                            </span>
                                        </div>
                                    </div>
                                </Card.Header>
                                <Card.Body>
                                    {organizationData.length > 0 ? (
                                        <div 
                                            ref={chartRef}
                                            style={{ 
                                                height: '600px', 
                                                width: '100%',
                                                border: '1px solid #dee2e6',
                                                borderRadius: '0.375rem',
                                                overflow: 'hidden'
                                            }}
                                        />
                                    ) : (
                                        <div className="text-center py-5">
                                            <i className="ri-group-line display-4 text-muted mb-3"></i>
                                            <h5 className="text-muted">{t('No organization data available')}</h5>
                                            <p className="text-muted">
                                                {t('Please add users with positions to see the organization chart')}
                                            </p>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </div>
                    </div>

                    {/* Statistics Row */}
                    <div className="row mt-4">
                        <div className="col-md-3">
                            <Card className="card-animate">
                                <Card.Body>
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-medium text-muted mb-0">
                                                {t('Total Employees')}
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <h5 className="text-success">
                                                <i className="ri-arrow-up-line fs-13 align-middle"></i>
                                            </h5>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-2">
                                        <div>
                                            <h2 className="ff-secondary fw-semibold text-primary">
                                                {organizationData.length}
                                            </h2>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-primary-subtle rounded fs-3">
                                                <i className="ri-group-line text-primary"></i>
                                            </span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </div>

                        <div className="col-md-3">
                            <Card className="card-animate">
                                <Card.Body>
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-medium text-muted mb-0">
                                                {t('Departments')}
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <h5 className="text-success">
                                                <i className="ri-arrow-up-line fs-13 align-middle"></i>
                                            </h5>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-2">
                                        <div>
                                            <h2 className="ff-secondary fw-semibold text-info">
                                                {organizationData.filter((node, index, arr) => 
                                                    arr.findIndex(n => n.department === node.department) === index
                                                ).length}
                                            </h2>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-info-subtle rounded fs-3">
                                                <i className="ri-building-line text-info"></i>
                                            </span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </div>

                        <div className="col-md-3">
                            <Card className="card-animate">
                                <Card.Body>
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-medium text-muted mb-0">
                                                {t('Managers')}
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <h5 className="text-success">
                                                <i className="ri-arrow-up-line fs-13 align-middle"></i>
                                            </h5>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-2">
                                        <div>
                                            <h2 className="ff-secondary fw-semibold text-warning">
                                                {organizationData.filter(node => node.level === 2).length}
                                            </h2>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-warning-subtle rounded fs-3">
                                                <i className="ri-user-star-line text-warning"></i>
                                            </span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </div>

                        <div className="col-md-3">
                            <Card className="card-animate">
                                <Card.Body>
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-medium text-muted mb-0">
                                                {t('Active Users')}
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <h5 className="text-success">
                                                <i className="ri-arrow-up-line fs-13 align-middle"></i>
                                            </h5>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-2">
                                        <div>
                                            <h2 className="ff-secondary fw-semibold text-success">
                                                {organizationData.filter(node => node.phone).length}
                                            </h2>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-success-subtle rounded fs-3">
                                                <i className="ri-user-line text-success"></i>
                                            </span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </div>
                    </div>
                </Container>
            </div>

            {/* Person Details Modal */}
            <Modal show={showDetailsModal} onHide={handleCloseDetailsModal} size="lg" centered>
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title>
                        <i className="ri-user-line me-2"></i>
                        {t('Employee Details')}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedPerson && (
                        <div>
                            <Row className="mb-4">
                                <Col md={4} className="text-center">
                                    <img
                                        src={selectedPerson.img}
                                        alt={selectedPerson.name}
                                        className="rounded-circle"
                                        style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                                        onError={(e) => {
                                            e.currentTarget.src = '/images/users/user-dummy-img.jpg';
                                        }}
                                    />
                                    <h4 className="mt-3 mb-1">{selectedPerson.name}</h4>
                                    <p className="text-muted mb-0">{selectedPerson.title}</p>
                                    {selectedPerson.department && (
                                        <Badge bg="primary" className="mt-2">
                                            {selectedPerson.department}
                                        </Badge>
                                    )}
                                </Col>
                                <Col md={8}>
                                    <h5 className="mb-3">
                                        <i className="ri-information-line me-2"></i>
                                        {t('Contact Information')}
                                    </h5>
                                    <table className="table table-borderless">
                                        <tbody>
                                            <tr>
                                                <td className="text-muted" style={{ width: '40%' }}>
                                                    <i className="ri-mail-line me-2"></i>
                                                    {t('Email')}:
                                                </td>
                                                <td>
                                                    <a href={`mailto:${selectedPerson.email}`}>
                                                        {selectedPerson.email}
                                                    </a>
                                                </td>
                                            </tr>
                                            {selectedPerson.phone && (
                                                <tr>
                                                    <td className="text-muted">
                                                        <i className="ri-phone-line me-2"></i>
                                                        {t('Phone')}:
                                                    </td>
                                                    <td>
                                                        <a href={`tel:${selectedPerson.phone}`}>
                                                            {selectedPerson.phone}
                                                        </a>
                                                    </td>
                                                </tr>
                                            )}
                                            <tr>
                                                <td className="text-muted">
                                                    <i className="ri-briefcase-line me-2"></i>
                                                    {t('Position')}:
                                                </td>
                                                <td>{selectedPerson.title}</td>
                                            </tr>
                                            {selectedPerson.department && (
                                                <tr>
                                                    <td className="text-muted">
                                                        <i className="ri-building-line me-2"></i>
                                                        {t('Department')}:
                                                    </td>
                                                    <td>{selectedPerson.department}</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </Col>
                            </Row>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleCloseDetailsModal}
                    >
                        {t('Close')}
                    </button>
                </Modal.Footer>
            </Modal>
        </Layout>
    );
}