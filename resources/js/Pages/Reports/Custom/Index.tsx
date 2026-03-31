import React from 'react';
import { Head, Link } from '@inertiajs/react';
import Layout from '@/Layouts';
import { Card, Col, Row, ListGroup, Badge } from 'react-bootstrap';
import {
    FaChartLine,
    FaMoneyBillWave,
    FaUsers,
    FaBoxes,
    FaTachometerAlt,
    FaStar,
    FaClock,
    FaFileAlt,
} from 'react-icons/fa';

export default function CustomReports() {
    const reportCategories = [
        {
            title: 'Satış Raporları',
            icon: <FaChartLine className="text-primary" size={24} />,
            color: 'primary',
            reports: [
                { name: 'Satış Dashboard', path: '/reports/sales', badge: 'Dashboard' },
                { name: 'Ürün Bazlı Satış', path: '/reports/sales/by-product' },
                { name: 'Müşteri Bazlı Satış', path: '/reports/sales/by-customer' },
                { name: 'Temsilci Bazlı Satış', path: '/reports/sales/by-salesperson' },
                { name: 'Bölge Bazlı Satış', path: '/reports/sales/by-region' },
                { name: 'Karşılaştırmalı Satış', path: '/reports/comparative-sales' },
            ],
        },
        {
            title: 'Mali Raporlar',
            icon: <FaMoneyBillWave className="text-success" size={24} />,
            color: 'success',
            reports: [
                { name: 'Mali Dashboard', path: '/reports/financial', badge: 'Dashboard' },
                { name: 'Nakit Akış Raporu', path: '/reports/financial/cash-flow' },
                { name: 'Alacak Raporu', path: '/reports/financial/accounts-receivable' },
                { name: 'Borç Raporu', path: '/reports/financial/accounts-payable' },
                { name: 'Kar Marjı Analizi', path: '/reports/financial/profit-margin' },
                { name: 'Yaşlandırma Raporu', path: '/accounting/aging' },
            ],
        },
        {
            title: 'Müşteri Raporları',
            icon: <FaUsers className="text-info" size={24} />,
            color: 'info',
            reports: [
                { name: 'Müşteri Dashboard', path: '/reports/customers', badge: 'Dashboard' },
                { name: 'ABC Segmentasyonu', path: '/reports/customers/segmentation' },
                { name: 'Yaşam Boyu Değer', path: '/reports/customers/lifetime-value' },
                { name: 'Müşteri Sadakati', path: '/reports/customers/retention' },
                { name: 'Müşteri Büyümesi', path: '/reports/customers/growth' },
            ],
        },
        {
            title: 'Ürün Raporları',
            icon: <FaBoxes className="text-warning" size={24} />,
            color: 'warning',
            reports: [
                { name: 'Ürün Dashboard', path: '/reports/products', badge: 'Dashboard' },
                { name: 'Ürün Performansı', path: '/reports/products/performance' },
                { name: 'Ürün Karlılığı', path: '/reports/products/profitability' },
                { name: 'Ürün Trendleri', path: '/reports/products/trends' },
                { name: 'Yavaş Hareket Eden', path: '/reports/products/slow-moving' },
            ],
        },
        {
            title: 'Performans Raporları',
            icon: <FaTachometerAlt className="text-danger" size={24} />,
            color: 'danger',
            reports: [
                { name: 'Performans Dashboard', path: '/reports/performance', badge: 'Dashboard' },
                { name: 'Satış Ekibi', path: '/reports/performance/sales-team' },
                { name: 'Hedef Takibi', path: '/reports/performance/target-achievement' },
                { name: 'Operasyonel KPI', path: '/reports/performance/operational-kpis' },
                { name: 'Trend Analizi', path: '/reports/performance/trend-analysis' },
            ],
        },
        {
            title: 'Stok Raporları',
            icon: <FaFileAlt className="text-secondary" size={24} />,
            color: 'secondary',
            reports: [
                { name: 'Stok Raporları', path: '/stock/reports', badge: 'Dashboard' },
                { name: 'Stok Durumu', path: '/stock/reports/stock-status' },
                { name: 'ABC Analizi', path: '/stock/reports/abc-analysis' },
                { name: 'Stok Yaşlandırma', path: '/stock/reports/stock-aging' },
                { name: 'Stok Devir Hızı', path: '/stock/reports/stock-turnover' },
            ],
        },
    ];

    const favoriteReports = [
        { name: 'Satış Dashboard', path: '/reports/sales', icon: <FaChartLine /> },
        { name: 'Müşteri Segmentasyonu', path: '/reports/customers/segmentation', icon: <FaUsers /> },
        { name: 'Kar Marjı Analizi', path: '/reports/financial/profit-margin', icon: <FaMoneyBillWave /> },
        { name: 'Stok Durumu', path: '/stock/reports/stock-status', icon: <FaBoxes /> },
    ];

    const recentReports = [
        { name: 'Satış Trendi', path: '/reports/sales', time: '10 dakika önce' },
        { name: 'Müşteri Analizi', path: '/reports/customers', time: '1 saat önce' },
        { name: 'Mali Özet', path: '/reports/financial', time: '2 saat önce' },
    ];

    return (
        <Layout>
            <Head title="Özel Raporlar" />

            <div className="page-content">
                <div className="page-header mb-4">
                    <h4 className="page-title">Rapor Merkezi</h4>
                    <p className="text-muted mb-0">
                        Tüm raporlara buradan hızlıca erişebilirsiniz.
                    </p>
                </div>

                {/* Quick Access */}
                <Row className="mb-4">
                    <Col md={8}>
                        <Card>
                            <Card.Header>
                                <h5 className="mb-0">
                                    <FaStar className="text-warning me-2" />
                                    Hızlı Erişim
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                <Row>
                                    {favoriteReports.map((report, idx) => (
                                        <Col md={3} key={idx}>
                                            <Link
                                                href={report.path}
                                                className="d-block text-center p-3 border rounded text-decoration-none hover-shadow"
                                            >
                                                <div className="mb-2">{report.icon}</div>
                                                <small>{report.name}</small>
                                            </Link>
                                        </Col>
                                    ))}
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="h-100">
                            <Card.Header>
                                <h5 className="mb-0">
                                    <FaClock className="text-muted me-2" />
                                    Son Görüntülenen
                                </h5>
                            </Card.Header>
                            <ListGroup variant="flush">
                                {recentReports.map((report, idx) => (
                                    <ListGroup.Item
                                        key={idx}
                                        action
                                        as={Link}
                                        href={report.path}
                                        className="d-flex justify-content-between align-items-center"
                                    >
                                        {report.name}
                                        <small className="text-muted">{report.time}</small>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </Card>
                    </Col>
                </Row>

                {/* Report Categories */}
                <Row>
                    {reportCategories.map((category, idx) => (
                        <Col md={6} lg={4} key={idx} className="mb-4">
                            <Card className="h-100">
                                <Card.Header className={`bg-${category.color} bg-opacity-10`}>
                                    <div className="d-flex align-items-center">
                                        {category.icon}
                                        <h5 className="mb-0 ms-2">{category.title}</h5>
                                    </div>
                                </Card.Header>
                                <ListGroup variant="flush">
                                    {category.reports.map((report, rIdx) => (
                                        <ListGroup.Item
                                            key={rIdx}
                                            action
                                            as={Link}
                                            href={report.path}
                                            className="d-flex justify-content-between align-items-center"
                                        >
                                            {report.name}
                                            {report.badge && (
                                                <Badge bg={category.color}>{report.badge}</Badge>
                                            )}
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>
        </Layout>
    );
}
