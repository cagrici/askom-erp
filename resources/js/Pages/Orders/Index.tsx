import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Head, usePage } from '@inertiajs/react';
import {
    Card,
    Container,
    Row,
    Col,
    Button,
    Form,
    Tab,
    Nav,
    Badge,
    Spinner
} from 'react-bootstrap';
import TableContainer from "../../Components/Common/TableContainer";
import BreadCrumb from '../../Components/Common/BreadCrumb';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import moment from 'moment';
import Layout from '../../Layouts';
import OrderDetailModal from './Components/OrderDetailModal';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

interface Entity {
    id: number;
    entity_name: string;
    entity_code: string;
}

interface Company {
    id: number;
    co_desc: string;
    co_code: string;
}

interface OrderItem {
    id: number;
    order_m_id: number;
    item_id: number;
    item_name: string;
    item_code: string;
    qty: number;
    unit_name: string;
    unit_price: number;
    amt: number;
}

interface Order {
    id: number;
    doc_no: string;
    doc_date: string;
    entity_id: number;
    entity_name: string;
    co_id: number;
    contract_no?: string;
    amt: number;
    amt_vat: number;
    order_status: number;
}

interface OrderDetail extends Order {
    entity: {
        id: number;
        entity_name: string;
        entity_code: string;
    };
    company: {
        id: number;
        co_desc: string;
        co_code: string;
    };
    contract?: {
        id: number;
        doc_no: string;
        amt: number;
        remaining_amount: number;
    };
    items: OrderItem[];
    address1?: string;
    shipping_date?: string;
    note3?: string;
}

interface OrdersResponse {
    data: Order[];
    links: any[];
    from: number;
    to: number;
    total: number;
    current_page: number;
    last_page: number;
}

interface FilterParams {
    search?: string;
    date_from?: string;
    date_to?: string;
    company_id?: string;
    entity_id?: string;
    status?: string;
    per_page: string;
    page: number;
    tab?: string;
}

interface Props {
    orders: OrdersResponse;
    companies: Company[];
    entities: Entity[];
    filters: {
        search?: string;
        date_from?: string;
        date_to?: string;
        company_id?: string;
        entity_id?: string;
        status?: string;
        per_page?: string;
    };
}

const Index: React.FC<Props> = (props) => {
    const { auth, flash } = usePage().props as any;
    const { t } = useTranslation();

    // State for UI controls
    const [showFilters, setShowFilters] = useState<boolean>(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [tableLoading, setTableLoading] = useState<boolean>(false);
    const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
    const [activeTab, setActiveTab] = useState<string>("all");

    // State for data
    const [orders, setOrders] = useState<OrdersResponse>(props.orders);

    // State for filters
    const [filters, setFilters] = useState<FilterParams>({
        search: props.filters.search || '',
        date_from: props.filters.date_from || '',
        date_to: props.filters.date_to || '',
        company_id: props.filters.company_id || '',
        entity_id: props.filters.entity_id || '',
        status: props.filters.status || '',
        per_page: props.filters.per_page || '10',
        page: 1
    });

    // Get status badge component
    const getStatusBadge = (status: number) => {
        const statusMap: { [key: number]: { variant: string; text: string } } = {
            0: { variant: 'secondary', text: t('New') },
            1: { variant: 'primary', text: t('Processing') },
            2: { variant: 'info', text: t('Shipped') },
            3: { variant: 'success', text: t('Delivered') },
            4: { variant: 'danger', text: t('Canceled') },
            5: { variant: 'warning', text: t('OnHold') }
        };

        const statusInfo = statusMap[status] || { variant: 'secondary', text: t('Unknown') };

        return (
            <Badge bg={statusInfo.variant} className="text-uppercase">
                {statusInfo.text}
            </Badge>
        );
    };

    // Format currency helper
    const formatCurrency = (amount: number | string, symbol = '₺') => {
        if (!amount) return `${symbol}0.00`;

        return `${symbol}${parseFloat(amount.toString()).toLocaleString('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    // Load orders based on current filters
    const loadOrders = useCallback(async () => {
        setTableLoading(true);
        try {
            // Add active tab to filter if it's not "all"
            const requestFilters = {...filters};
            if (activeTab !== "all") {
                // Map tab names to status values
                const tabStatusMap: {[key: string]: string} = {
                    "new": "0",
                    "processing": "1",
                    "shipped": "2",
                    "delivered": "3",
                    "canceled": "4",
                    "onhold": "5"
                };
                requestFilters.status = tabStatusMap[activeTab] || requestFilters.status;
            }

            const response = await axios.get('/api/orders', { params: requestFilters });
            setOrders(response.data);
        } catch (error) {
            console.error('Error loading orders:', error);
            toast.error(t('LoadOrdersError'));
        } finally {
            setTableLoading(false);
        }
    }, [filters, activeTab, t]);

    // Handle tab change
    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        // Reset page to 1 when changing tabs
        setFilters(prev => ({...prev, page: 1}));
    };

    // Handle viewing order details
    const handleViewOrder = async (order: Order) => {
        setSelectedOrder(order);
        setLoading(true);

        try {
            const response = await axios.get(`/api/orders/${order.id}`);
            setOrderDetail(response.data);
            setShowModal(true);
        } catch (error) {
            console.error('Error fetching order details:', error);
            toast.error(t('OrderDetailLoadError'), { autoClose: 3000 });
        } finally {
            setLoading(false);
        }
    };

    // Handle filter form submission
    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Reset to page 1 when applying new filters
        setFilters(prev => ({...prev, page: 1}));
    };

    // Handle filter reset
    const handleResetFilters = () => {
        setFilters({
            search: '',
            date_from: '',
            date_to: '',
            company_id: '',
            entity_id: '',
            status: '',
            per_page: '10',
            page: 1
        });
    };

    // Handle page change
    const handlePageChange = (page: number) => {
        setFilters(prev => ({...prev, page}));
    };

    // Handle per page change
    const handlePerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilters(prev => ({
            ...prev,
            per_page: e.target.value,
            page: 1 // Reset to page 1 when changing items per page
        }));
    };

    // Handle filter changes
    const handleFilterChange = (name: keyof FilterParams, value: any) => {
        setFilters(prev => ({...prev, [name]: value}));
    };

    // Table columns definition
    const columns = useMemo(
        () => [
            {
                header: t("OrderNumber"),
                accessorKey: "doc_no",
                enableColumnFilter: false,
                cell: (cell: any) => {
                    return (
                        <span className="fw-medium">{cell.getValue()}</span>
                    );
                },
            },
            {
                header: t("Date"),
                accessorKey: "doc_date",
                enableColumnFilter: false,
                cell: (cell: any) => {
                    return moment(cell.getValue()).format("DD.MM.YYYY");
                },
            },
            {
                header: t("Customer"),
                accessorKey: "entity_name",
                enableColumnFilter: false,
            },
            {
                header: t("ContractNumber"),
                accessorKey: "contract_no",
                enableColumnFilter: false,
                cell: (cell: any) => {
                    return cell.getValue() || "-";
                },
            },
            {
                header: t("Amount"),
                accessorKey: "amt",
                enableColumnFilter: false,
                cell: (cell: any) => {
                    return formatCurrency(cell.getValue());
                },
            },
            {
                header: t("Status"),
                accessorKey: "order_status",
                enableColumnFilter: false,
                cell: (cell: any) => {
                    return getStatusBadge(cell.getValue());
                },
            },
            {
                header: t("Action"),
                cell: (cellProps: any) => {
                    return (
                        <ul className="list-inline hstack gap-2 mb-0">
                            <li className="list-inline-item">
                                <Button
                                    variant="link"
                                    className="text-primary d-inline-block p-0"
                                    onClick={() => {
                                        const orderData = cellProps.row.original;
                                        handleViewOrder(orderData);
                                    }}
                                >
                                    <i className="ri-eye-fill fs-16"></i>
                                </Button>
                            </li>
                        </ul>
                    );
                },
            },
        ],
        [t]
    );

    // Load orders whenever filters or tab changes
    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    // Flash messages effect
    useEffect(() => {
        if (flash && flash.success) {
            toast.success(flash.success, { autoClose: 3000 });
        }

        if (flash && flash.error) {
            toast.error(flash.error, { autoClose: 3000 });
        }
    }, [flash]);

    return (
        <React.Fragment>
            <Head title={t("Orders") + " | " + t("B2BAutoPartsPortal")} />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title={t("Orders")} pageTitle={t("Management")} />
                    <Row>
                        <Col lg={12}>
                            <Card id="orderList">
                                <Card.Header className="border-0">
                                    <Row className="align-items-center gy-3">
                                        <div className="col-sm">
                                            <h5 className="card-title mb-0">{t("OrderList")}</h5>
                                        </div>
                                        <div className="col-sm-auto">
                                            <div className="d-flex gap-1 flex-wrap">
                                                <Button
                                                    variant="outline-secondary"
                                                    onClick={() => setShowFilters(!showFilters)}
                                                >
                                                    <i className="ri-filter-line align-bottom me-1"></i>{" "}
                                                    {showFilters ? t("HideFilters") : t("ShowFilters")}
                                                </Button>{" "}
                                                <Button
                                                    variant="outline-danger"
                                                    onClick={handleResetFilters}
                                                >
                                                    <i className="ri-refresh-line align-bottom me-1"></i>{" "}
                                                    {t("ResetFilters")}
                                                </Button>
                                            </div>
                                        </div>
                                    </Row>
                                </Card.Header>

                                <Card.Body className="pt-0">
                                    {showFilters && (
                                        <Form onSubmit={handleFilterSubmit} className="mb-4 p-3 border rounded bg-light">
                                            <Row className="mb-3">
                                                <Form.Group as={Col} md={4}>
                                                    <Form.Label>{t("Search")}</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        placeholder={t("SearchOrderPlaceholder")}
                                                        value={filters.search}
                                                        onChange={(e) => handleFilterChange('search', e.target.value)}
                                                    />
                                                    <Form.Text className="text-muted">
                                                        {t("SearchHelp")}
                                                    </Form.Text>
                                                </Form.Group>

                                                <Form.Group as={Col} md={4}>
                                                    <Form.Label>{t("Status")}</Form.Label>
                                                    <Form.Select
                                                        value={filters.status}
                                                        onChange={(e) => handleFilterChange('status', e.target.value)}
                                                    >
                                                        <option value="">{t("AnyStatus")}</option>
                                                        <option value="0">{t("New")}</option>
                                                        <option value="1">{t("Processing")}</option>
                                                        <option value="2">{t("Shipped")}</option>
                                                        <option value="3">{t("Delivered")}</option>
                                                        <option value="4">{t("Canceled")}</option>
                                                        <option value="5">{t("OnHold")}</option>
                                                    </Form.Select>
                                                </Form.Group>

                                                <Form.Group as={Col} md={4}>
                                                    <Form.Label>{t("ResultsPerPage")}</Form.Label>
                                                    <Form.Select
                                                        value={filters.per_page}
                                                        onChange={handlePerPageChange}
                                                    >
                                                        <option value="10">10</option>
                                                        <option value="25">25</option>
                                                        <option value="50">50</option>
                                                        <option value="100">100</option>
                                                    </Form.Select>
                                                </Form.Group>
                                            </Row>

                                            <Row className="mb-3">
                                                <Form.Group as={Col} md={3}>
                                                    <Form.Label>{t("DateFrom")}</Form.Label>
                                                    <Form.Control
                                                        type="date"
                                                        value={filters.date_from}
                                                        onChange={(e) => handleFilterChange('date_from', e.target.value)}
                                                    />
                                                </Form.Group>

                                                <Form.Group as={Col} md={3}>
                                                    <Form.Label>{t("DateTo")}</Form.Label>
                                                    <Form.Control
                                                        type="date"
                                                        value={filters.date_to}
                                                        onChange={(e) => handleFilterChange('date_to', e.target.value)}
                                                    />
                                                </Form.Group>

                                                <Form.Group as={Col} md={3}>
                                                    <Form.Label>{t("Company")}</Form.Label>
                                                    <Form.Select
                                                        value={filters.company_id}
                                                        onChange={(e) => handleFilterChange('company_id', e.target.value)}
                                                    >
                                                        <option value="">{t("AllCompanies")}</option>
                                                        {props.companies.map((company) => (
                                                            <option key={company.id} value={company.id}>
                                                                {company.co_desc}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                </Form.Group>

                                                <Form.Group as={Col} md={3}>
                                                    <Form.Label>{t("Customer")}</Form.Label>
                                                    <Form.Select
                                                        value={filters.entity_id}
                                                        onChange={(e) => handleFilterChange('entity_id', e.target.value)}
                                                    >
                                                        <option value="">{t("AllCustomers")}</option>
                                                        {props.entities.map((entity) => (
                                                            <option key={entity.id} value={entity.id}>
                                                                {entity.entity_name}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                </Form.Group>
                                            </Row>

                                            <div className="d-flex justify-content-end">
                                                <Button type="submit" variant="primary">
                                                    {t("ApplyFilters")}
                                                </Button>
                                            </div>
                                        </Form>
                                    )}

                                    <div>
                                        <Tab.Container defaultActiveKey="all">
                                            <Nav
                                                className="nav-tabs nav-tabs-custom nav-success"
                                                role="tablist"
                                            >
                                                <Nav.Item>
                                                    <Nav.Link
                                                        eventKey="all"
                                                        className={activeTab === "all" ? "active" : ""}
                                                        onClick={() => handleTabChange("all")}
                                                    >
                                                        <i className="ri-store-2-fill me-1 align-bottom"></i>{" "}
                                                        {t("AllOrders")}
                                                    </Nav.Link>
                                                </Nav.Item>
                                                <Nav.Item>
                                                    <Nav.Link
                                                        eventKey="new"
                                                        className={activeTab === "new" ? "active" : ""}
                                                        onClick={() => handleTabChange("new")}
                                                    >
                                                        <i className="ri-file-list-3-line me-1 align-bottom"></i>{" "}
                                                        {t("New")}
                                                    </Nav.Link>
                                                </Nav.Item>
                                                <Nav.Item>
                                                    <Nav.Link
                                                        eventKey="processing"
                                                        className={activeTab === "processing" ? "active" : ""}
                                                        onClick={() => handleTabChange("processing")}
                                                    >
                                                        <i className="ri-loader-4-line me-1 align-bottom"></i>{" "}
                                                        {t("Processing")}
                                                    </Nav.Link>
                                                </Nav.Item>
                                                <Nav.Item>
                                                    <Nav.Link
                                                        eventKey="delivered"
                                                        className={activeTab === "delivered" ? "active" : ""}
                                                        onClick={() => handleTabChange("delivered")}
                                                    >
                                                        <i className="ri-checkbox-circle-line me-1 align-bottom"></i>{" "}
                                                        {t("Delivered")}
                                                    </Nav.Link>
                                                </Nav.Item>
                                                <Nav.Item>
                                                    <Nav.Link
                                                        eventKey="canceled"
                                                        className={activeTab === "canceled" ? "active" : ""}
                                                        onClick={() => handleTabChange("canceled")}
                                                    >
                                                        <i className="ri-close-circle-line me-1 align-bottom"></i>{" "}
                                                        {t("Canceled")}
                                                    </Nav.Link>
                                                </Nav.Item>
                                            </Nav>

                                            <Tab.Content>
                                                <Tab.Pane eventKey={activeTab}>
                                                    {tableLoading ? (
                                                        <div className="text-center py-4">
                                                            <Spinner animation="border" role="status">
                                                                <span className="visually-hidden">{t("Loading")}</span>
                                                            </Spinner>
                                                            <p className="mt-2">{t("LoadingOrders")}</p>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <TableContainer
                                                                columns={columns}
                                                                data={orders.data || []}
                                                                isGlobalFilter={false}
                                                                customPageSize={parseInt(filters.per_page)}
                                                                divClass="table-responsive table-card mb-1 mt-3"
                                                                tableClass="align-middle table-nowrap"
                                                                theadClass="table-light text-muted text-uppercase"
                                                            />

                                                            {/* Custom Pagination */}
                                                            {orders.total > 0 && (
                                                                <div className="d-flex justify-content-between align-items-center mt-3 px-3">
                                                                    <div>
                                                                        {t("ShowingEntries", {
                                                                            from: orders.from,
                                                                            to: orders.to,
                                                                            total: orders.total
                                                                        })}
                                                                    </div>
                                                                    <nav aria-label="Page navigation">
                                                                        <ul className="pagination mb-0">
                                                                            {/* First page */}
                                                                            <li className={`page-item ${orders.current_page === 1 ? 'disabled' : ''}`}>
                                                                                <Button
                                                                                    variant="link"
                                                                                    className="page-link"
                                                                                    onClick={() => handlePageChange(1)}
                                                                                >
                                                                                    &laquo;
                                                                                </Button>
                                                                            </li>

                                                                            {/* Previous page */}
                                                                            <li className={`page-item ${orders.current_page === 1 ? 'disabled' : ''}`}>
                                                                                <Button
                                                                                    variant="link"
                                                                                    className="page-link"
                                                                                    onClick={() => handlePageChange(orders.current_page - 1)}
                                                                                >
                                                                                    &lsaquo;
                                                                                </Button>
                                                                            </li>

                                                                            {/* Page numbers */}
                                                                            {Array.from({ length: orders.last_page }, (_, i) => i + 1)
                                                                                .filter(page => {
                                                                                    // Show current page, first and last page, and pages around current page
                                                                                    return page === 1 ||
                                                                                        page === orders.last_page ||
                                                                                        Math.abs(page - orders.current_page) <= 1;
                                                                                })
                                                                                .map((page, index, array) => {
                                                                                    // Add ellipsis where needed
                                                                                    const prev = array[index - 1];
                                                                                    const showEllipsis = prev && page - prev > 1;

                                                                                    return (
                                                                                        <React.Fragment key={page}>
                                                                                            {showEllipsis && (
                                                                                                <li className="page-item disabled">
                                                                                                    <span className="page-link">...</span>
                                                                                                </li>
                                                                                            )}
                                                                                            <li className={`page-item ${orders.current_page === page ? 'active' : ''}`}>
                                                                                                <Button
                                                                                                    variant={orders.current_page === page ? 'primary' : 'link'}
                                                                                                    className="page-link"
                                                                                                    onClick={() => handlePageChange(page)}
                                                                                                >
                                                                                                    {page}
                                                                                                </Button>
                                                                                            </li>
                                                                                        </React.Fragment>
                                                                                    );
                                                                                })
                                                                            }

                                                                            {/* Next page */}
                                                                            <li className={`page-item ${orders.current_page === orders.last_page ? 'disabled' : ''}`}>
                                                                                <Button
                                                                                    variant="link"
                                                                                    className="page-link"
                                                                                    onClick={() => handlePageChange(orders.current_page + 1)}
                                                                                >
                                                                                    &rsaquo;
                                                                                </Button>
                                                                            </li>

                                                                            {/* Last page */}
                                                                            <li className={`page-item ${orders.current_page === orders.last_page ? 'disabled' : ''}`}>
                                                                                <Button
                                                                                    variant="link"
                                                                                    className="page-link"
                                                                                    onClick={() => handlePageChange(orders.last_page)}
                                                                                >
                                                                                    &raquo;
                                                                                </Button>
                                                                            </li>
                                                                        </ul>
                                                                    </nav>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </Tab.Pane>
                                            </Tab.Content>
                                        </Tab.Container>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>

            <OrderDetailModal
                show={showModal}
                order={orderDetail}
                loading={loading}
                onHide={() => {
                    setShowModal(false);
                    setOrderDetail(null);
                }}
            />

            <ToastContainer closeButton={false} limit={1} />
        </React.Fragment>
    );
};

Index.layout = (page: any) => <Layout children={page} />
export default Index;
