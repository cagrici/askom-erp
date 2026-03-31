import React from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Card, Row, Col, Table, ProgressBar } from 'react-bootstrap';
import Chart from 'react-apexcharts';

interface DashboardProps {
    userStats: {
        total_users: number;
        total_roles: number;
        total_permissions: number;
        active_users: number;
    };
    workStats: {
        task_status: Record<string, number>;
        priority_distribution: Record<string, number>;
        category_stats: Array<{
            category: string;
            total: number;
            completed: number;
            active: number;
        }>;
        department_performance: Array<{
            department: string;
            total_tasks: number;
            completed_tasks: number;
            overdue_tasks: number;
        }>;
        top_performers: Array<{
            user_name: string;
            total_tasks: number;
            completed_tasks: number;
        }>;
        weekly_trends: Array<{
            year: number;
            week: number;
            created_tasks: number;
            completed_tasks: number;
        }>;
        totals: {
            total_tasks: number;
            active_tasks: number;
            completed_tasks: number;
            overdue_tasks: number;
            this_week_completed: number;
        };
    };
}

const Dashboard: React.FC<DashboardProps> = ({ userStats, workStats }) => {
    const { t } = useTranslation();

    const userStatCards = [
        {
            title: 'Toplam Kullanıcı',
            value: userStats.total_users,
            icon: 'bx bx-user',
            color: 'primary',
            bgColor: 'bg-primary-subtle'
        },
        {
            title: 'Aktif Kullanıcı',
            value: userStats.active_users,
            icon: 'bx bx-user-check',
            color: 'success',
            bgColor: 'bg-success-subtle'
        },
        {
            title: 'Toplam Rol',
            value: userStats.total_roles,
            icon: 'bx bx-shield',
            color: 'info',
            bgColor: 'bg-info-subtle'
        },
        {
            title: 'Toplam Yetki',
            value: userStats.total_permissions,
            icon: 'bx bx-key',
            color: 'warning',
            bgColor: 'bg-warning-subtle'
        }
    ];

    const workStatCards = [
        {
            title: 'Toplam İş',
            value: workStats.totals.total_tasks,
            icon: 'ri ri-task-line',
            color: 'info',
            bgColor: 'bg-info-subtle'
        },
        {
            title: 'Aktif İşler',
            value: workStats.totals.active_tasks,
            icon: 'ri ri-time-line',
            color: 'warning',
            bgColor: 'bg-warning-subtle'
        },
        {
            title: 'Tamamlanan',
            value: workStats.totals.completed_tasks,
            icon: 'ri ri-check-double-line',
            color: 'success',
            bgColor: 'bg-success-subtle'
        },
        {
            title: 'Gecikmiş',
            value: workStats.totals.overdue_tasks,
            icon: 'ri ri-alarm-warning-line',
            color: 'danger',
            bgColor: 'bg-danger-subtle'
        },
        {
            title: 'Bu Hafta Biten',
            value: workStats.totals.this_week_completed,
            icon: 'ri ri-calendar-check-line',
            color: 'primary',
            bgColor: 'bg-primary-subtle'
        }
    ];

    // Görev durumu pasta grafiği
    const taskStatusChart = {
        series: Object.values(workStats.task_status),
        options: {
            chart: {
                type: 'donut' as const,
                height: 300
            },
            labels: Object.keys(workStats.task_status).map(status => {
                switch(status) {
                    case 'open': return 'Açık';
                    case 'in_progress': return 'Devam Ediyor';
                    case 'completed': return 'Tamamlandı';
                    case 'cancelled': return 'İptal';
                    default: return status;
                }
            }),
            colors: ['#f39c12', '#3498db', '#2ecc71', '#95a5a6'],
            legend: {
                position: 'bottom' as const
            }
        }
    };

    // Öncelik dağılımı bar grafiği
    const priorityChart = {
        series: [{
            name: 'Görev Sayısı',
            data: Object.values(workStats.priority_distribution)
        }],
        options: {
            chart: {
                type: 'bar' as const,
                height: 300
            },
            xaxis: {
                categories: Object.keys(workStats.priority_distribution).map(priority => {
                    switch(priority) {
                        case 'urgent': return '🔥 Acil';
                        case 'high': return '⚡ Yüksek';
                        case 'medium': return '➖ Orta';
                        case 'low': return '🔻 Düşük';
                        default: return priority;
                    }
                })
            },
            colors: ['#e74c3c', '#f39c12', '#3498db', '#95a5a6'],
            plotOptions: {
                bar: {
                    borderRadius: 4,
                    horizontal: false,
                }
            }
        }
    };

    // Haftalık trend çizgi grafiği
    const weeklyTrendChart = {
        series: [
            {
                name: 'Oluşturulan',
                data: workStats.weekly_trends.map(item => item.created_tasks)
            },
            {
                name: 'Tamamlanan',
                data: workStats.weekly_trends.map(item => item.completed_tasks)
            }
        ],
        options: {
            chart: {
                type: 'line' as const,
                height: 300
            },
            xaxis: {
                categories: workStats.weekly_trends.map(item => `${item.year}-W${item.week}`)
            },
            colors: ['#3498db', '#2ecc71'],
            stroke: {
                width: 3
            }
        }
    };

    return (
        <AdminLayout>
            <Head title="Admin Dashboard" />
            
            <div className="admin-dashboard">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="mb-0">
                        <i className="ri ri-dashboard-line me-2"></i>
                        Admin Dashboard
                    </h2>
                </div>

                {/* Kullanıcı İstatistikleri */}
                <div className="mb-4">
                    <h5 className="mb-3">
                        <i className="bx bx-user me-2"></i>
                        Kullanıcı İstatistikleri
                    </h5>
                    <Row className="g-3">
                        {userStatCards.map((card, index) => (
                            <Col key={index} xl={3} md={6}>
                                <Card className="h-100 border-0 shadow-sm">
                                    <Card.Body>
                                        <div className="d-flex align-items-center">
                                            <div className={`avatar-sm rounded-circle ${card.bgColor} d-flex align-items-center justify-content-center me-3`}>
                                                <i className={`${card.icon} text-${card.color} fs-4`}></i>
                                            </div>
                                            <div className="flex-grow-1">
                                                <p className="text-muted mb-1 fs-13">{card.title}</p>
                                                <h4 className="mb-0">{card.value.toLocaleString()}</h4>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </div>

                {/* İş Takip İstatistikleri */}
                <div className="mb-4">
                    <h5 className="mb-3">
                        <i className="ri ri-task-line me-2"></i>
                        İş Takip İstatistikleri
                    </h5>
                    <Row className="g-3 mb-4">
                        {workStatCards.map((card, index) => (
                            <Col key={index} xl={2} md={4} sm={6}>
                                <Card className="h-100 border-0 shadow-sm">
                                    <Card.Body className="text-center">
                                        <div className={`avatar-sm rounded-circle ${card.bgColor} d-flex align-items-center justify-content-center mx-auto mb-2`}>
                                            <i className={`${card.icon} text-${card.color} fs-4`}></i>
                                        </div>
                                        <h4 className="mb-1">{card.value.toLocaleString()}</h4>
                                        <p className="text-muted mb-0 fs-13">{card.title}</p>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </div>

                {/* Grafikler */}
                <Row className="g-4 mb-4">
                    <Col xl={4}>
                        <Card className="h-100 border-0 shadow-sm">
                            <Card.Header className="bg-transparent border-bottom">
                                <h6 className="mb-0">
                                    <i className="ri ri-pie-chart-line me-2"></i>
                                    Görev Durumu Dağılımı
                                </h6>
                            </Card.Header>
                            <Card.Body>
                                <Chart
                                    options={taskStatusChart.options}
                                    series={taskStatusChart.series}
                                    type="donut"
                                    height={300}
                                />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col xl={4}>
                        <Card className="h-100 border-0 shadow-sm">
                            <Card.Header className="bg-transparent border-bottom">
                                <h6 className="mb-0">
                                    <i className="ri ri-bar-chart-line me-2"></i>
                                    Öncelik Dağılımı
                                </h6>
                            </Card.Header>
                            <Card.Body>
                                <Chart
                                    options={priorityChart.options}
                                    series={priorityChart.series}
                                    type="bar"
                                    height={300}
                                />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col xl={4}>
                        <Card className="h-100 border-0 shadow-sm">
                            <Card.Header className="bg-transparent border-bottom">
                                <h6 className="mb-0">
                                    <i className="ri ri-line-chart-line me-2"></i>
                                    Haftalık Trend
                                </h6>
                            </Card.Header>
                            <Card.Body>
                                <Chart
                                    options={weeklyTrendChart.options}
                                    series={weeklyTrendChart.series}
                                    type="line"
                                    height={300}
                                />
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <Row className="g-4">
                    {/* Kategori Performansı */}
                    <Col xl={6}>
                        <Card className="border-0 shadow-sm">
                            <Card.Header className="bg-transparent border-bottom">
                                <h6 className="mb-0">
                                    <i className="ri ri-folder-chart-line me-2"></i>
                                    Kategori Performansı
                                </h6>
                            </Card.Header>
                            <Card.Body>
                                <Table responsive className="mb-0">
                                    <thead>
                                        <tr>
                                            <th>Kategori</th>
                                            <th className="text-center">Toplam</th>
                                            <th className="text-center">Aktif</th>
                                            <th className="text-center">Tamamlanan</th>
                                            <th>Başarı Oranı</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {workStats.category_stats.map((category, index) => {
                                            const successRate = category.total > 0 ? 
                                                Math.round((category.completed / category.total) * 100) : 0;
                                            return (
                                                <tr key={index}>
                                                    <td className="fw-medium">{category.category}</td>
                                                    <td className="text-center">{category.total}</td>
                                                    <td className="text-center">
                                                        <span className="badge bg-warning">{category.active}</span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="badge bg-success">{category.completed}</span>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <ProgressBar 
                                                                now={successRate} 
                                                                className="flex-grow-1 me-2"
                                                                style={{ height: '6px' }}
                                                                variant={successRate >= 80 ? 'success' : successRate >= 60 ? 'warning' : 'danger'}
                                                            />
                                                            <small className="text-muted">{successRate}%</small>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Departman Performansı */}
                    <Col xl={6}>
                        <Card className="border-0 shadow-sm">
                            <Card.Header className="bg-transparent border-bottom">
                                <h6 className="mb-0">
                                    <i className="ri ri-building-line me-2"></i>
                                    Departman Performansı
                                </h6>
                            </Card.Header>
                            <Card.Body>
                                <Table responsive className="mb-0">
                                    <thead>
                                        <tr>
                                            <th>Departman</th>
                                            <th className="text-center">Toplam</th>
                                            <th className="text-center">Tamamlanan</th>
                                            <th className="text-center">Gecikmiş</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {workStats.department_performance.map((dept, index) => (
                                            <tr key={index}>
                                                <td className="fw-medium">{dept.department}</td>
                                                <td className="text-center">{dept.total_tasks}</td>
                                                <td className="text-center">
                                                    <span className="badge bg-success">{dept.completed_tasks}</span>
                                                </td>
                                                <td className="text-center">
                                                    {dept.overdue_tasks > 0 ? (
                                                        <span className="badge bg-danger">{dept.overdue_tasks}</span>
                                                    ) : (
                                                        <span className="text-muted">0</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* En İyi Performans Gösteren Kullanıcılar */}
                <Row className="mt-4">
                    <Col xl={8}>
                        <Card className="border-0 shadow-sm">
                            <Card.Header className="bg-transparent border-bottom">
                                <h6 className="mb-0">
                                    <i className="ri ri-trophy-line me-2"></i>
                                    En İyi Performans (Son 30 Gün)
                                </h6>
                            </Card.Header>
                            <Card.Body>
                                <Table responsive className="mb-0">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Kullanıcı</th>
                                            <th className="text-center">Toplam Görev</th>
                                            <th className="text-center">Tamamlanan</th>
                                            <th className="text-center">Başarı Oranı</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {workStats.top_performers.map((user, index) => {
                                            const successRate = user.total_tasks > 0 ? 
                                                Math.round((user.completed_tasks / user.total_tasks) * 100) : 0;
                                            return (
                                                <tr key={index}>
                                                    <td>
                                                        {index === 0 && <i className="ri ri-trophy-fill text-warning me-1"></i>}
                                                        {index === 1 && <i className="ri ri-medal-fill text-secondary me-1"></i>}
                                                        {index === 2 && <i className="ri ri-medal-fill text-warning me-1"></i>}
                                                        {index + 1}
                                                    </td>
                                                    <td className="fw-medium">{user.user_name}</td>
                                                    <td className="text-center">{user.total_tasks}</td>
                                                    <td className="text-center">
                                                        <span className="badge bg-success">{user.completed_tasks}</span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className={`badge ${successRate >= 80 ? 'bg-success' : successRate >= 60 ? 'bg-warning' : 'bg-danger'}`}>
                                                            {successRate}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </Col>
                    
                    {/* Hızlı İşlemler */}
                    <Col xl={4}>
                        <Card className="border-0 shadow-sm">
                            <Card.Header className="bg-transparent border-bottom">
                                <h6 className="mb-0">
                                    <i className="ri ri-tools-line me-2"></i>
                                    Hızlı İşlemler
                                </h6>
                            </Card.Header>
                            <Card.Body>
                                <div className="d-grid gap-2">
                                    <a href="/admin/users/create" className="btn btn-primary">
                                        <i className="bx bx-plus me-2"></i>
                                        Yeni Kullanıcı
                                    </a>
                                    <a href="/admin/roles/create" className="btn btn-info">
                                        <i className="bx bx-plus me-2"></i>
                                        Rol Oluştur
                                    </a>
                                    <a href="/admin/permissions/create" className="btn btn-warning">
                                        <i className="bx bx-plus me-2"></i>
                                        Yetki Ekle
                                    </a>
                                    <a href="/dashboard" className="btn btn-success">
                                        <i className="ri ri-message-3-line me-2"></i>
                                        İş Takip Sistemi
                                    </a>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </div>
        </AdminLayout>
    );
};

export default Dashboard;