import React from 'react';
import Layout from '@/Layouts';
import { Head } from '@inertiajs/react';
import { Row, Col, Card, ProgressBar, Badge } from 'react-bootstrap';
import CountUp from 'react-countup';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import {
    StatCard,
    RecentOrdersTable,
    TopCustomersTable,
    TeamPerformanceTable
} from '../Widgets';

interface SalesManagerDashboardProps {
    team_sales_summary: {
        today: { total: number; count: number };
        this_week: { total: number; count: number };
        this_month: { total: number; count: number };
    };
    salesperson_performance: Array<{
        id: number;
        name: string;
        order_count: number;
        total_revenue: number;
    }>;
    sales_targets: {
        target: number;
        achieved: number;
        percentage: number;
    };
    pending_offers: Array<{
        id: number;
        offer_number: string;
        customer: string;
        total: number;
        date: string;
    }>;
    top_customers: Array<{
        id: number;
        title: string;
        account_code: string;
        order_count: number;
        total_revenue: number;
    }>;
    category_sales: Array<{
        category: string;
        total: number;
    }>;
    conversion_rates: {
        offers_created: number;
        offers_converted: number;
        conversion_rate: number;
    };
    recent_orders: Array<{
        id: number;
        order_number: string;
        customer: string;
        customer_code: string;
        date: string;
        total: number;
        status: string;
    }>;
}

const SalesManagerDashboard: React.FC<SalesManagerDashboardProps> = ({
    team_sales_summary,
    salesperson_performance,
    sales_targets,
    pending_offers,
    top_customers,
    category_sales,
    conversion_rates,
    recent_orders
}) => {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 0
        }).format(value);
    };

    // Kategori satislari grafigi
    const categorySalesChart: ApexOptions = {
        chart: {
            type: 'donut',
            height: 300
        },
        labels: category_sales.map(item => item.category),
        colors: ['#405189', '#0ab39c', '#f7b84b', '#3577f1', '#f06548', '#299cdb'],
        legend: {
            position: 'bottom',
            fontSize: '12px'
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '65%',
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: 'Toplam',
                            formatter: function (w) {
                                const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                                return formatCurrency(total);
                            }
                        }
                    }
                }
            }
        },
        dataLabels: {
            enabled: false
        },
        tooltip: {
            y: {
                formatter: (value: number) => formatCurrency(value)
            }
        }
    };

    return (
        <Layout>
            <Head title="Satis Yoneticisi Dashboard" />
            <div className="page-content">
                <div className="container-fluid">
                    {/* Baslik */}
                    <Row className="mb-4">
                        <Col>
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <h4 className="mb-1">Satis Yoneticisi Paneli</h4>
                                    <p className="text-muted mb-0">Ekip performansi ve satis takibi</p>
                                </div>
                                <div className="text-end">
                                    <small className="text-muted">
                                        Son guncelleme: {new Date().toLocaleString('tr-TR')}
                                    </small>
                                </div>
                            </div>
                        </Col>
                    </Row>

                    {/* Ekip Satis Ozeti */}
                    <Row className="g-3 mb-4">
                        <Col xl={3} md={6}>
                            <StatCard
                                title="Bugunun Ekip Satisi"
                                value={team_sales_summary.today.total}
                                prefix="₺"
                                icon="ri-team-line"
                                color="primary"
                                subtitle={`${team_sales_summary.today.count} siparis`}
                            />
                        </Col>
                        <Col xl={3} md={6}>
                            <StatCard
                                title="Bu Haftanin Satisi"
                                value={team_sales_summary.this_week.total}
                                prefix="₺"
                                icon="ri-calendar-line"
                                color="info"
                                subtitle={`${team_sales_summary.this_week.count} siparis`}
                            />
                        </Col>
                        <Col xl={3} md={6}>
                            <StatCard
                                title="Bu Ayin Satisi"
                                value={team_sales_summary.this_month.total}
                                prefix="₺"
                                icon="ri-money-dollar-circle-line"
                                color="success"
                                subtitle={`${team_sales_summary.this_month.count} siparis`}
                            />
                        </Col>
                        <Col xl={3} md={6}>
                            <Card className="card-animate border-0 shadow-sm h-100">
                                <Card.Body>
                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                        <span className="text-muted fs-12 text-uppercase fw-medium">Aylik Hedef</span>
                                        <Badge bg={sales_targets.percentage >= 100 ? 'success' : sales_targets.percentage >= 75 ? 'warning' : 'danger'}>
                                            %{sales_targets.percentage.toFixed(0)}
                                        </Badge>
                                    </div>
                                    <h4 className="fs-22 fw-semibold mb-2">
                                        <CountUp
                                            end={sales_targets.achieved}
                                            separator="."
                                            decimal=","
                                            prefix="₺"
                                            duration={1.5}
                                        />
                                    </h4>
                                    <ProgressBar
                                        now={Math.min(100, sales_targets.percentage)}
                                        variant={sales_targets.percentage >= 100 ? 'success' : sales_targets.percentage >= 75 ? 'warning' : 'danger'}
                                        style={{ height: '8px' }}
                                    />
                                    <small className="text-muted mt-2 d-block">
                                        Hedef: {formatCurrency(sales_targets.target)}
                                    </small>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Temsilci Performansi ve Kategori Satislari */}
                    <Row className="g-3 mb-4">
                        <Col xl={8}>
                            <TeamPerformanceTable
                                team={salesperson_performance}
                                title="Satis Temsilcisi Performansi (Bu Ay)"
                            />
                        </Col>
                        <Col xl={4}>
                            <Card className="card-animate border-0 shadow-sm h-100">
                                <Card.Header className="border-0 bg-transparent">
                                    <h5 className="card-title mb-0">Kategori Bazli Satislar</h5>
                                </Card.Header>
                                <Card.Body className="pt-0">
                                    {category_sales.length > 0 ? (
                                        <Chart
                                            options={categorySalesChart}
                                            series={category_sales.map(item => item.total)}
                                            type="donut"
                                            height={300}
                                        />
                                    ) : (
                                        <div className="text-center py-4">
                                            <p className="text-muted mb-0">Veri bulunamadi</p>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* En Degerli Musteriler */}
                    <Row className="g-3 mb-4">
                        <Col xl={6}>
                            <TopCustomersTable
                                customers={top_customers}
                                title="Bu Ayin En Degerli Musterileri"
                            />
                        </Col>
                        <Col xl={6}>
                            <Card className="card-animate border-0 shadow-sm h-100">
                                <Card.Header className="border-0 bg-transparent">
                                    <h5 className="card-title mb-0">
                                        <i className="ri-file-list-3-line me-2"></i>
                                        Bekleyen Teklifler
                                    </h5>
                                </Card.Header>
                                <Card.Body className="pt-0">
                                    {pending_offers.length === 0 ? (
                                        <div className="text-center py-4">
                                            <i className="ri-checkbox-circle-line fs-1 text-success"></i>
                                            <p className="text-muted mb-0 mt-2">Bekleyen teklif bulunmuyor</p>
                                        </div>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table table-hover table-nowrap mb-0 align-middle">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>Teklif No</th>
                                                        <th>Musteri</th>
                                                        <th className="text-end">Tutar</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {pending_offers.map((offer) => (
                                                        <tr key={offer.id}>
                                                            <td className="fw-medium text-primary">{offer.offer_number}</td>
                                                            <td>{offer.customer}</td>
                                                            <td className="text-end fw-medium">{formatCurrency(offer.total)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Son Siparisler */}
                    <Row className="g-3">
                        <Col xs={12}>
                            <RecentOrdersTable
                                orders={recent_orders}
                                title="Son Siparisler"
                                showViewAll={true}
                            />
                        </Col>
                    </Row>
                </div>
            </div>
        </Layout>
    );
};

export default SalesManagerDashboard;
