import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { Card, Table, Button, Row, Col, Form, Badge, ProgressBar } from 'react-bootstrap';
import Layout from '@/Layouts';

interface Customer {
    id: number;
    name: string;
    title?: string;
}

interface SalesOrder {
    id: number;
    order_number: string;
    customer?: Customer;
}

interface ShippingOrder {
    id: number;
    shipping_number: string;
    sales_order?: SalesOrder;
    priority: string;
    priority_label: string;
}

interface User {
    id: number;
    name: string;
}

interface PickingTask {
    id: number;
    task_number: string;
    shipping_order_id: number;
    shipping_order?: ShippingOrder;
    assigned_to_id: number;
    assigned_to?: User;
    assigned_by?: User;
    status: string;
    status_label: string;
    started_at?: string;
    completed_at?: string;
    total_items: number;
    picked_items: number;
    created_at: string;
}

interface PaginatedPickingTasks {
    data: PickingTask[];
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    links: Array<{
        url?: string;
        label: string;
        active: boolean;
    }>;
}

interface Stats {
    my_assigned: number;
    my_in_progress: number;
    total_pending: number;
}

interface Props {
    pickingTasks: PaginatedPickingTasks;
    stats: Stats;
    filters: {
        status?: string;
        date?: string;
        my_tasks?: string;
    };
    statuses: Record<string, string>;
}

const getStatusBadgeVariant = (status: string): string => {
    const variants: Record<string, string> = {
        assigned: 'warning',
        in_progress: 'primary',
        completed: 'success',
        cancelled: 'danger',
    };
    return variants[status] || 'secondary';
};

const getPriorityBadgeVariant = (priority: string): string => {
    const variants: Record<string, string> = {
        urgent: 'danger',
        high: 'warning',
        normal: 'primary',
        low: 'secondary',
    };
    return variants[priority] || 'secondary';
};

export default function Index({
    pickingTasks,
    stats,
    filters,
    statuses,
}: Props) {
    const { data, setData, get, processing } = useForm({
        status: filters.status || '',
        date: filters.date || '',
        my_tasks: filters.my_tasks || '',
    });

    const handleFilter = () => {
        get(route('warehouse.picking-tasks.index'), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const formatDateTime = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('tr-TR');
    };

    const getProgressVariant = (picked: number, total: number): string => {
        const percent = total > 0 ? (picked / total) * 100 : 0;
        if (percent === 100) return 'success';
        if (percent >= 50) return 'info';
        return 'warning';
    };

    return (
        <Layout>
            <Head title="Toplama Gorevleri" />
<div className="page-content">
            <div className="container-fluid py-4">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h4 className="mb-1">Toplama Gorevleri</h4>
                        <p className="text-muted mb-0">Depo toplama islemleri</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <Row className="mb-4">
                    <Col md={4}>
                        <Card className="border-0 shadow-sm bg-warning bg-opacity-10">
                            <Card.Body className="text-center">
                                <div className="text-warning fs-1 mb-2">
                                    <i className="ri-user-received-line"></i>
                                </div>
                                <h3 className="mb-1">{stats.my_assigned}</h3>
                                <p className="text-muted mb-0">Bana Atanan</p>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="border-0 shadow-sm bg-primary bg-opacity-10">
                            <Card.Body className="text-center">
                                <div className="text-primary fs-1 mb-2">
                                    <i className="ri-loader-4-line"></i>
                                </div>
                                <h3 className="mb-1">{stats.my_in_progress}</h3>
                                <p className="text-muted mb-0">Devam Eden</p>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="border-0 shadow-sm">
                            <Card.Body className="text-center">
                                <div className="text-secondary fs-1 mb-2">
                                    <i className="ri-stack-line"></i>
                                </div>
                                <h3 className="mb-1">{stats.total_pending}</h3>
                                <p className="text-muted mb-0">Toplam Bekleyen</p>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Filters */}
                <Card className="border-0 shadow-sm mb-4">
                    <Card.Body>
                        <Row className="align-items-end">
                            <Col md={3}>
                                <Form.Label>Durum</Form.Label>
                                <Form.Select
                                    value={data.status}
                                    onChange={(e) => {
                                        setData('status', e.target.value);
                                        setTimeout(handleFilter, 100);
                                    }}
                                >
                                    <option value="">Aktif Gorevler</option>
                                    {Object.entries(statuses).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </Form.Select>
                            </Col>
                            <Col md={3}>
                                <Form.Label>Tarih</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={data.date}
                                    onChange={(e) => {
                                        setData('date', e.target.value);
                                        setTimeout(handleFilter, 100);
                                    }}
                                />
                            </Col>
                            <Col md={3}>
                                <Form.Check
                                    type="checkbox"
                                    id="my_tasks"
                                    label="Sadece benim gorevlerim"
                                    checked={data.my_tasks === '1'}
                                    onChange={(e) => {
                                        setData('my_tasks', e.target.checked ? '1' : '');
                                        setTimeout(handleFilter, 100);
                                    }}
                                    className="mt-4"
                                />
                            </Col>
                            <Col md={3}>
                                <Button
                                    variant="outline-secondary"
                                    onClick={() => {
                                        setData({ status: '', date: '', my_tasks: '' });
                                        router.get(route('warehouse.picking-tasks.index'));
                                    }}
                                    className="w-100"
                                >
                                    <i className="ri-refresh-line me-1"></i>
                                    Temizle
                                </Button>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Tasks Table */}
                <Card className="border-0 shadow-sm">
                    <Card.Body className="p-0">
                        <Table responsive hover className="mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th>Gorev No</th>
                                    <th>Sevk Emri</th>
                                    <th>Musteri</th>
                                    <th>Oncelik</th>
                                    <th>Atanan</th>
                                    <th>Durum</th>
                                    <th style={{ width: '200px' }}>Ilerleme</th>
                                    <th>Baslama</th>
                                    <th className="text-end">Islemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pickingTasks.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="text-center py-5">
                                            <div className="text-muted">
                                                <i className="ri-inbox-line fs-1 d-block mb-2"></i>
                                                Toplama gorevi bulunamadi
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    pickingTasks.data.map((task) => (
                                        <tr key={task.id}>
                                            <td>
                                                <Link
                                                    href={route('warehouse.picking-tasks.show', task.id)}
                                                    className="fw-bold text-decoration-none"
                                                >
                                                    {task.task_number}
                                                </Link>
                                            </td>
                                            <td>
                                                <Link
                                                    href={route('warehouse.shipping-orders.show', task.shipping_order_id)}
                                                    className="text-decoration-none"
                                                >
                                                    {task.shipping_order?.shipping_number}
                                                </Link>
                                            </td>
                                            <td>
                                                <small>
                                                    {task.shipping_order?.sales_order?.customer?.name ||
                                                        task.shipping_order?.sales_order?.customer?.title ||
                                                        '-'}
                                                </small>
                                            </td>
                                            <td>
                                                <Badge bg={getPriorityBadgeVariant(task.shipping_order?.priority || 'normal')}>
                                                    {task.shipping_order?.priority_label}
                                                </Badge>
                                            </td>
                                            <td>{task.assigned_to?.name}</td>
                                            <td>
                                                <Badge bg={getStatusBadgeVariant(task.status)}>
                                                    {task.status_label}
                                                </Badge>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    <ProgressBar
                                                        now={task.total_items > 0 ? (task.picked_items / task.total_items) * 100 : 0}
                                                        variant={getProgressVariant(task.picked_items, task.total_items)}
                                                        style={{ height: '8px', width: '100px' }}
                                                    />
                                                    <small className="text-muted">
                                                        {task.picked_items}/{task.total_items}
                                                    </small>
                                                </div>
                                            </td>
                                            <td>
                                                <small>{formatDateTime(task.started_at)}</small>
                                            </td>
                                            <td className="text-end">
                                                <Link
                                                    href={route('warehouse.picking-tasks.show', task.id)}
                                                    className="btn btn-sm btn-primary"
                                                >
                                                    {task.status === 'assigned' ? (
                                                        <>
                                                            <i className="ri-play-line me-1"></i>
                                                            Basla
                                                        </>
                                                    ) : task.status === 'in_progress' ? (
                                                        <>
                                                            <i className="ri-barcode-line me-1"></i>
                                                            Devam Et
                                                        </>
                                                    ) : (
                                                        <>
                                                            <i className="ri-eye-line me-1"></i>
                                                            Goruntule
                                                        </>
                                                    )}
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </Card.Body>

                    {/* Pagination */}
                    {pickingTasks.last_page > 1 && (
                        <Card.Footer className="bg-white">
                            <nav className="d-flex justify-content-between align-items-center">
                                <small className="text-muted">
                                    Toplam {pickingTasks.total} kayit
                                </small>
                                <ul className="pagination pagination-sm mb-0">
                                    {pickingTasks.links.map((link, index) => (
                                        <li
                                            key={index}
                                            className={`page-item ${link.active ? 'active' : ''} ${!link.url ? 'disabled' : ''}`}
                                        >
                                            {link.url ? (
                                                <Link
                                                    href={link.url}
                                                    className="page-link"
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            ) : (
                                                <span
                                                    className="page-link"
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </nav>
                        </Card.Footer>
                    )}
                </Card>
            </div>
        </div>
        </Layout>
    );
}
