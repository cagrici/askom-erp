import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Card, Table, Button, Row, Col, Badge, ProgressBar } from 'react-bootstrap';
import Layout from '@/Layouts';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface SalesTarget {
    id: number;
    name: string;
    code: string;
    description: string | null;
    period_type: string;
    period_type_label: string;
    assignment_type: string;
    assignment_type_label: string;
    start_date: string;
    end_date: string;
    status: string;
    status_label: string;
    is_active: boolean;

    // Target Metrics
    revenue_target: number;
    quantity_target: number;
    order_target: number;
    new_customer_target: number;

    // Actual Performance
    actual_revenue: number;
    actual_quantity: number;
    actual_orders: number;
    actual_new_customers: number;

    // Achievement Percentages
    revenue_achievement: number;
    quantity_achievement: number;
    order_achievement: number;
    new_customer_achievement: number;
    overall_achievement: number;

    // Weights
    revenue_weight: number;
    quantity_weight: number;
    order_weight: number;
    new_customer_weight: number;

    // Bonus/Reward
    bonus_threshold: number;
    bonus_amount: number | null;

    // Progress
    days_remaining: number;
    days_elapsed: number;
    total_days: number;
    progress_percentage: number;

    // Relations
    user?: { name: string };
    department?: { name: string };
    location?: { name: string };
    creator?: { name: string };
    updater?: { name: string };

    notes: string | null;
    last_calculated_at: string | null;
    created_at: string;
}

interface PerformanceData {
    revenue_data: {
        target: number;
        actual: number;
        achievement: number;
        remaining: number;
    };
    quantity_data: {
        target: number;
        actual: number;
        achievement: number;
        remaining: number;
    };
    order_data: {
        target: number;
        actual: number;
        achievement: number;
        remaining: number;
    };
    new_customer_data: {
        target: number;
        actual: number;
        achievement: number;
        remaining: number;
    };
}

interface DailyProgress {
    date: string;
    revenue: number;
    orders: number;
    cumulative_revenue: number;
    cumulative_orders: number;
}

interface Props {
    target: SalesTarget;
    performanceData: PerformanceData;
    dailyProgress: DailyProgress[];
}

export default function Show({ target, performanceData, dailyProgress }: Props) {
    const handleToggleStatus = () => {
        router.patch(route('sales.targets.toggle-status', target.id), {}, {
            preserveScroll: true,
        });
    };

    const handleRecalculate = () => {
        if (confirm('Hedef değerleri satış siparişlerinden yeniden hesaplanacak. Devam etmek istiyor musunuz?')) {
            router.post(route('sales.targets.recalculate', target.id));
        }
    };

    const handleDelete = () => {
        if (confirm('Bu hedef silinecek. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?')) {
            router.delete(route('sales.targets.destroy', target.id), {
                onSuccess: () => router.visit(route('sales.targets.index')),
            });
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            active: 'success',
            completed: 'primary',
            cancelled: 'danger',
        };
        return colors[status] || 'secondary';
    };

    const getAchievementColor = (achievement: number) => {
        if (achievement >= 100) return 'success';
        if (achievement >= 75) return 'info';
        if (achievement >= 50) return 'warning';
        return 'danger';
    };

    const getPeriodTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            monthly: 'primary',
            quarterly: 'info',
            yearly: 'success',
            custom: 'warning',
        };
        return colors[type] || 'secondary';
    };

    return (
        <Layout>
            <Head title={`Hedef Detayı - ${target.name}`} />

            <div className="page-content">
                <div className="container-fluid">
                    <Row className="mb-3">
                        <Col>
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Satış Hedefi Detayı: {target.name}</h4>
                                <div className="page-title-right d-flex gap-2">
                                    <Link href={route('sales.targets.index')}>
                                        <Button variant="secondary" size="sm">
                                            <i className="ri-arrow-left-line me-1"></i>
                                            Geri Dön
                                        </Button>
                                    </Link>
                                    <Link href={route('sales.targets.edit', target.id)}>
                                        <Button variant="primary" size="sm">
                                            <i className="ri-edit-line me-1"></i>
                                            Düzenle
                                        </Button>
                                    </Link>
                                    <Button variant="info" size="sm" onClick={handleRecalculate}>
                                        <i className="ri-refresh-line me-1"></i>
                                        Yeniden Hesapla
                                    </Button>
                                </div>
                            </div>
                        </Col>
                    </Row>

                    <Row>
                        <Col lg={8}>
                            {/* Target Info */}
                            <Card className="mb-3">
                                <Card.Header className="d-flex justify-content-between align-items-center">
                                    <h5 className="card-title mb-0">Hedef Bilgileri</h5>
                                    <div className="d-flex gap-2">
                                        <Badge bg={getStatusColor(target.status)} className="fs-6">
                                            {target.status_label}
                                        </Badge>
                                        <Badge bg={target.is_active ? 'success' : 'secondary'} className="fs-6">
                                            {target.is_active ? 'Aktif' : 'Pasif'}
                                        </Badge>
                                    </div>
                                </Card.Header>
                                <Card.Body>
                                    <Row>
                                        <Col md={6}>
                                            <p className="mb-2">
                                                <strong>Hedef Adı:</strong> {target.name}
                                            </p>
                                            <p className="mb-2">
                                                <strong>Hedef Kodu:</strong> {target.code}
                                            </p>
                                            <p className="mb-2">
                                                <strong>Dönem:</strong>{' '}
                                                <Badge bg={getPeriodTypeColor(target.period_type)}>
                                                    {target.period_type_label}
                                                </Badge>
                                            </p>
                                            <p className="mb-2">
                                                <strong>Atama Tipi:</strong> {target.assignment_type_label}
                                            </p>
                                        </Col>
                                        <Col md={6}>
                                            <p className="mb-2">
                                                <strong>Başlangıç:</strong>{' '}
                                                {format(new Date(target.start_date), 'dd MMMM yyyy', { locale: tr })}
                                            </p>
                                            <p className="mb-2">
                                                <strong>Bitiş:</strong>{' '}
                                                {format(new Date(target.end_date), 'dd MMMM yyyy', { locale: tr })}
                                            </p>
                                            {target.days_remaining > 0 && target.status === 'active' && (
                                                <p className="mb-2">
                                                    <strong className="text-warning">
                                                        <i className="ri-time-line me-1"></i>
                                                        {target.days_remaining} gün kaldı
                                                    </strong>
                                                </p>
                                            )}
                                            {target.user && (
                                                <p className="mb-2">
                                                    <strong>Satış Sorumlusu:</strong> {target.user.name}
                                                </p>
                                            )}
                                            {target.department && (
                                                <p className="mb-2">
                                                    <strong>Departman:</strong> {target.department.name}
                                                </p>
                                            )}
                                            {target.location && (
                                                <p className="mb-2">
                                                    <strong>Lokasyon:</strong> {target.location.name}
                                                </p>
                                            )}
                                        </Col>
                                    </Row>

                                    {target.description && (
                                        <>
                                            <hr />
                                            <Row>
                                                <Col>
                                                    <strong>Açıklama:</strong>
                                                    <p className="mt-2">{target.description}</p>
                                                </Col>
                                            </Row>
                                        </>
                                    )}

                                    <hr />

                                    {/* Time Progress */}
                                    <Row>
                                        <Col>
                                            <div className="mb-2">
                                                <strong>Süre İlerlemesi:</strong>
                                                <span className="float-end text-muted">
                                                    {target.days_elapsed} / {target.total_days} gün
                                                </span>
                                            </div>
                                            <ProgressBar
                                                now={target.progress_percentage}
                                                variant="primary"
                                                style={{ height: '8px' }}
                                            />
                                            <small className="text-muted">
                                                %{target.progress_percentage.toFixed(1)} tamamlandı
                                            </small>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            {/* Performance Metrics */}
                            <Card className="mb-3">
                                <Card.Header>
                                    <h5 className="card-title mb-0">Performans Metrikleri</h5>
                                </Card.Header>
                                <Card.Body>
                                    <Row className="g-3">
                                        {/* Revenue */}
                                        <Col md={6}>
                                            <Card className="border mb-0">
                                                <Card.Body>
                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                        <h6 className="mb-0">
                                                            <i className="ri-money-dollar-circle-line text-success me-1"></i>
                                                            Ciro Hedefi
                                                        </h6>
                                                        <Badge bg="secondary">{target.revenue_weight}%</Badge>
                                                    </div>
                                                    <h4 className="mb-2">
                                                        ₺{performanceData.revenue_data.actual.toLocaleString('tr-TR', {
                                                            minimumFractionDigits: 2,
                                                        })}
                                                        <span className="text-muted fs-6">
                                                            {' '}/ ₺{performanceData.revenue_data.target.toLocaleString('tr-TR', {
                                                                minimumFractionDigits: 2,
                                                            })}
                                                        </span>
                                                    </h4>
                                                    <ProgressBar
                                                        now={Math.min(100, performanceData.revenue_data.achievement)}
                                                        variant={getAchievementColor(performanceData.revenue_data.achievement)}
                                                        style={{ height: '6px' }}
                                                        className="mb-2"
                                                    />
                                                    <div className="d-flex justify-content-between">
                                                        <small className="text-muted">
                                                            Kalan: ₺{performanceData.revenue_data.remaining.toLocaleString('tr-TR', {
                                                                minimumFractionDigits: 2,
                                                            })}
                                                        </small>
                                                        <small className={`fw-semibold text-${getAchievementColor(performanceData.revenue_data.achievement)}`}>
                                                            %{performanceData.revenue_data.achievement.toFixed(1)}
                                                        </small>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        </Col>

                                        {/* Quantity */}
                                        <Col md={6}>
                                            <Card className="border mb-0">
                                                <Card.Body>
                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                        <h6 className="mb-0">
                                                            <i className="ri-inbox-line text-info me-1"></i>
                                                            Adet Hedefi
                                                        </h6>
                                                        <Badge bg="secondary">{target.quantity_weight}%</Badge>
                                                    </div>
                                                    <h4 className="mb-2">
                                                        {performanceData.quantity_data.actual.toLocaleString()}
                                                        <span className="text-muted fs-6">
                                                            {' '}/ {performanceData.quantity_data.target.toLocaleString()}
                                                        </span>
                                                    </h4>
                                                    <ProgressBar
                                                        now={Math.min(100, performanceData.quantity_data.achievement)}
                                                        variant={getAchievementColor(performanceData.quantity_data.achievement)}
                                                        style={{ height: '6px' }}
                                                        className="mb-2"
                                                    />
                                                    <div className="d-flex justify-content-between">
                                                        <small className="text-muted">
                                                            Kalan: {performanceData.quantity_data.remaining.toLocaleString()}
                                                        </small>
                                                        <small className={`fw-semibold text-${getAchievementColor(performanceData.quantity_data.achievement)}`}>
                                                            %{performanceData.quantity_data.achievement.toFixed(1)}
                                                        </small>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        </Col>

                                        {/* Orders */}
                                        <Col md={6}>
                                            <Card className="border mb-0">
                                                <Card.Body>
                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                        <h6 className="mb-0">
                                                            <i className="ri-file-list-line text-primary me-1"></i>
                                                            Sipariş Hedefi
                                                        </h6>
                                                        <Badge bg="secondary">{target.order_weight}%</Badge>
                                                    </div>
                                                    <h4 className="mb-2">
                                                        {performanceData.order_data.actual.toLocaleString()}
                                                        <span className="text-muted fs-6">
                                                            {' '}/ {performanceData.order_data.target.toLocaleString()}
                                                        </span>
                                                    </h4>
                                                    <ProgressBar
                                                        now={Math.min(100, performanceData.order_data.achievement)}
                                                        variant={getAchievementColor(performanceData.order_data.achievement)}
                                                        style={{ height: '6px' }}
                                                        className="mb-2"
                                                    />
                                                    <div className="d-flex justify-content-between">
                                                        <small className="text-muted">
                                                            Kalan: {performanceData.order_data.remaining.toLocaleString()}
                                                        </small>
                                                        <small className={`fw-semibold text-${getAchievementColor(performanceData.order_data.achievement)}`}>
                                                            %{performanceData.order_data.achievement.toFixed(1)}
                                                        </small>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        </Col>

                                        {/* New Customers */}
                                        <Col md={6}>
                                            <Card className="border mb-0">
                                                <Card.Body>
                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                        <h6 className="mb-0">
                                                            <i className="ri-user-add-line text-warning me-1"></i>
                                                            Yeni Müşteri Hedefi
                                                        </h6>
                                                        <Badge bg="secondary">{target.new_customer_weight}%</Badge>
                                                    </div>
                                                    <h4 className="mb-2">
                                                        {performanceData.new_customer_data.actual.toLocaleString()}
                                                        <span className="text-muted fs-6">
                                                            {' '}/ {performanceData.new_customer_data.target.toLocaleString()}
                                                        </span>
                                                    </h4>
                                                    <ProgressBar
                                                        now={Math.min(100, performanceData.new_customer_data.achievement)}
                                                        variant={getAchievementColor(performanceData.new_customer_data.achievement)}
                                                        style={{ height: '6px' }}
                                                        className="mb-2"
                                                    />
                                                    <div className="d-flex justify-content-between">
                                                        <small className="text-muted">
                                                            Kalan: {performanceData.new_customer_data.remaining.toLocaleString()}
                                                        </small>
                                                        <small className={`fw-semibold text-${getAchievementColor(performanceData.new_customer_data.achievement)}`}>
                                                            %{performanceData.new_customer_data.achievement.toFixed(1)}
                                                        </small>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            {/* Daily Progress */}
                            {dailyProgress && dailyProgress.length > 0 && (
                                <Card>
                                    <Card.Header>
                                        <h5 className="card-title mb-0">Günlük İlerleme</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <div className="table-responsive">
                                            <Table hover className="mb-0" size="sm">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>Tarih</th>
                                                        <th className="text-end">Günlük Ciro</th>
                                                        <th className="text-end">Kümülatif Ciro</th>
                                                        <th className="text-end">Günlük Sipariş</th>
                                                        <th className="text-end">Kümülatif Sipariş</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {dailyProgress.slice(-10).reverse().map((day, index) => (
                                                        <tr key={index}>
                                                            <td>
                                                                <small>{format(new Date(day.date), 'dd MMM yyyy', { locale: tr })}</small>
                                                            </td>
                                                            <td className="text-end">
                                                                <small>
                                                                    ₺{day.revenue.toLocaleString('tr-TR', {
                                                                        minimumFractionDigits: 2,
                                                                    })}
                                                                </small>
                                                            </td>
                                                            <td className="text-end fw-semibold">
                                                                <small>
                                                                    ₺{day.cumulative_revenue.toLocaleString('tr-TR', {
                                                                        minimumFractionDigits: 2,
                                                                    })}
                                                                </small>
                                                            </td>
                                                            <td className="text-end">
                                                                <small>{day.orders}</small>
                                                            </td>
                                                            <td className="text-end fw-semibold">
                                                                <small>{day.cumulative_orders}</small>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </div>
                                    </Card.Body>
                                </Card>
                            )}
                        </Col>

                        <Col lg={4}>
                            {/* Overall Achievement */}
                            <Card className="mb-3 card-animate">
                                <Card.Header>
                                    <h5 className="card-title mb-0">Genel Başarı</h5>
                                </Card.Header>
                                <Card.Body className="text-center">
                                    <div className="mb-3">
                                        <h1 className={`display-4 mb-0 text-${getAchievementColor(target.overall_achievement)}`}>
                                            %{target.overall_achievement.toFixed(1)}
                                        </h1>
                                        <p className="text-muted">Ağırlıklı Başarı Oranı</p>
                                    </div>
                                    <ProgressBar
                                        now={Math.min(100, target.overall_achievement)}
                                        variant={getAchievementColor(target.overall_achievement)}
                                        style={{ height: '10px' }}
                                    />
                                    {target.bonus_threshold > 0 && (
                                        <div className="mt-3 p-3 bg-light rounded">
                                            <p className="mb-1 text-muted">
                                                <i className="ri-gift-line me-1"></i>
                                                Bonus Eşiği
                                            </p>
                                            <h5 className="mb-0">%{target.bonus_threshold}</h5>
                                            {target.bonus_amount && (
                                                <p className="mb-0 text-success mt-2">
                                                    <strong>
                                                        ₺{target.bonus_amount.toLocaleString('tr-TR', {
                                                            minimumFractionDigits: 2,
                                                        })}
                                                    </strong>
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    {target.last_calculated_at && (
                                        <div className="mt-3 text-muted">
                                            <small>
                                                Son Hesaplama:{' '}
                                                {format(new Date(target.last_calculated_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                                            </small>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>

                            {/* Actions */}
                            <Card className="mb-3">
                                <Card.Header>
                                    <h5 className="card-title mb-0">İşlemler</h5>
                                </Card.Header>
                                <Card.Body>
                                    <div className="d-grid gap-2">
                                        <Button
                                            variant={target.is_active ? 'warning' : 'success'}
                                            onClick={handleToggleStatus}
                                        >
                                            <i className="ri-toggle-line me-1"></i>
                                            {target.is_active ? 'Pasifleştir' : 'Aktifleştir'}
                                        </Button>
                                        <Button variant="info" onClick={handleRecalculate}>
                                            <i className="ri-refresh-line me-1"></i>
                                            Yeniden Hesapla
                                        </Button>
                                        <Button variant="danger" onClick={handleDelete}>
                                            <i className="ri-delete-bin-line me-1"></i>
                                            Sil
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>

                            {/* Notes */}
                            {target.notes && (
                                <Card>
                                    <Card.Header>
                                        <h5 className="card-title mb-0">Notlar</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <p className="mb-0">{target.notes}</p>
                                    </Card.Body>
                                </Card>
                            )}

                            {/* Creator Info */}
                            {target.creator && (
                                <Card>
                                    <Card.Body>
                                        <p className="text-muted mb-1">
                                            <small>Oluşturan: {target.creator.name}</small>
                                        </p>
                                        <p className="text-muted mb-0">
                                            <small>
                                                {format(new Date(target.created_at), 'dd MMMM yyyy HH:mm', {
                                                    locale: tr,
                                                })}
                                            </small>
                                        </p>
                                    </Card.Body>
                                </Card>
                            )}
                        </Col>
                    </Row>
                </div>
            </div>
        </Layout>
    );
}
