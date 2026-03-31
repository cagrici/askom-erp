import React, { useState, useEffect } from 'react';
import Layout from '@/Layouts';
import { Head, Link } from '@inertiajs/react';
import { Card, Button, Row, Col, Form, Table, Badge, Tab, Tabs, Alert, Spinner } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

interface Category {
    id: number;
    name: string;
}

interface Brand {
    id: number;
    name: string;
}

interface Location {
    id: number;
    name: string;
    code: string;
}

interface Product {
    id: number;
    name: string;
    code: string;
    category?: string;
    brand?: string;
    stock_quantity: number;
    cost_price: number;
    stock_value: number;
    abc_category?: string;
    cumulative_percentage?: number;
    value_percentage?: number;
    age_category?: string;
    days_old?: number;
    last_movement_date?: string;
    turnover_rate?: number;
    stock_days?: number;
    performance?: string;
}

interface Props {
    categories: Category[];
    brands: Brand[];
    locations: Location[];
}

export default function StockReports({ categories, brands, locations }: Props) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('stock-status');
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<any>(null);
    const [filters, setFilters] = useState({
        category_id: '',
        brand_id: '',
        location_id: '',
        stock_status: '',
        date_from: '',
        date_to: '',
        product_id: '',
        movement_type: ''
    });

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const loadReport = async (reportType: string, reportFilters: any = {}) => {
        setLoading(true);
        try {
            const response = await axios.get(route(`stock.reports.${reportType}`), {
                params: { ...filters, ...reportFilters }
            });
            setReportData(response.data);
        } catch (error) {
            console.error('Report loading error:', error);
            setReportData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReport(activeTab);
    }, [activeTab]);

    const formatCurrency = (amount: number | undefined | null) => {
        if (amount === undefined || amount === null || isNaN(amount)) {
            return '₺0,00';
        }
        return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('tr-TR');
    };

    const exportReport = () => {
        if (!reportData) return;
        
        // CSV export functionality
        const csvContent = generateCSV(reportData, activeTab);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `stok_raporu_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const generateCSV = (data: any, reportType: string) => {
        // CSV generation logic based on report type
        let headers: string[] = [];
        let rows: string[][] = [];

        switch (reportType) {
            case 'stock-status':
                headers = ['Ürün Kodu', 'Ürün Adı', 'Kategori', 'Marka', 'Stok Miktarı', 'Maliyet Fiyatı', 'Stok Değeri'];
                rows = data.products.map((product: Product) => [
                    product.code || '',
                    product.name || '',
                    product.category || '',
                    product.brand || '',
                    (product.stock_quantity || 0).toString(),
                    (product.cost_price || 0).toString(),
                    (product.stock_value || 0).toString()
                ]);
                break;
            case 'abc-analysis':
                headers = ['Ürün Kodu', 'Ürün Adı', 'ABC Kategorisi', 'Stok Değeri', 'Değer Yüzdesi', 'Kümülatif Yüzde'];
                rows = data.products.map((product: Product) => [
                    product.code || '',
                    product.name || '',
                    product.abc_category || '',
                    (product.stock_value || 0).toString(),
                    (product.value_percentage || 0).toString(),
                    (product.cumulative_percentage || 0).toString()
                ]);
                break;
            default:
                headers = ['Data'];
                rows = [['No data available']];
        }

        const csvRows = [headers, ...rows];
        return csvRows.map(row => row.map(field => `"${field}"`).join(';')).join('\n');
    };

    const renderStockStatusReport = () => {
        if (!reportData) return null;

        return (
            <div>
                {/* Filters */}
                <Card className="mb-4">
                    <Card.Body>
                        <Row>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Kategori</Form.Label>
                                    <Form.Select
                                        value={filters.category_id}
                                        onChange={(e) => handleFilterChange('category_id', e.target.value)}
                                    >
                                        <option value="">Tüm Kategoriler</option>
                                        {categories.map(category => (
                                            <option key={category.id} value={category.id}>
                                                {category.name || `Category ${category.id}`}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Marka</Form.Label>
                                    <Form.Select
                                        value={filters.brand_id}
                                        onChange={(e) => handleFilterChange('brand_id', e.target.value)}
                                    >
                                        <option value="">Tüm Markalar</option>
                                        {brands.map(brand => (
                                            <option key={brand.id} value={brand.id}>
                                                {brand.name || `Brand ${brand.id}`}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Stok Durumu</Form.Label>
                                    <Form.Select
                                        value={filters.stock_status}
                                        onChange={(e) => handleFilterChange('stock_status', e.target.value)}
                                    >
                                        <option value="">Tüm Durumlar</option>
                                        <option value="in_stock">Stokta</option>
                                        <option value="out_of_stock">Stokta Yok</option>
                                        <option value="low_stock">Düşük Stok</option>
                                        <option value="overstock">Fazla Stok</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>&nbsp;</Form.Label>
                                    <div className="d-grid">
                                        <Button 
                                            variant="primary"
                                            onClick={() => loadReport('stock-status')}
                                            disabled={loading}
                                        >
                                            {loading ? <Spinner size="sm" /> : 'Raporu Güncelle'}
                                        </Button>
                                    </div>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Statistics Cards */}
                <Row className="mb-4">
                    <Col md={3}>
                        <Card className="bg-primary text-white">
                            <Card.Body>
                                <div className="d-flex align-items-center">
                                    <div className="flex-grow-1">
                                        <h3 className="mb-0">{reportData.statistics?.total_products || 0}</h3>
                                        <p className="mb-0">Toplam Ürün</p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <i className="ri-package-line fs-1"></i>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="bg-success text-white">
                            <Card.Body>
                                <div className="d-flex align-items-center">
                                    <div className="flex-grow-1">
                                        <h3 className="mb-0">{reportData.statistics?.in_stock_count || 0}</h3>
                                        <p className="mb-0">Stokta</p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <i className="ri-check-line fs-1"></i>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="bg-warning text-white">
                            <Card.Body>
                                <div className="d-flex align-items-center">
                                    <div className="flex-grow-1">
                                        <h3 className="mb-0">{reportData.statistics?.low_stock_count || 0}</h3>
                                        <p className="mb-0">Düşük Stok</p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <i className="ri-alert-line fs-1"></i>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="bg-danger text-white">
                            <Card.Body>
                                <div className="d-flex align-items-center">
                                    <div className="flex-grow-1">
                                        <h3 className="mb-0">{reportData.statistics?.out_of_stock_count || 0}</h3>
                                        <p className="mb-0">Stokta Yok</p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <i className="ri-close-line fs-1"></i>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Data Table */}
                <Card>
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Stok Durumu Detayları</h5>
                        <div>
                            <Badge bg="info" className="me-2">
                                Toplam Değer: {formatCurrency(reportData.statistics?.total_stock_value || 0)}
                            </Badge>
                            <Button size="sm" variant="outline-success" onClick={exportReport}>
                                <i className="ri-download-line me-1"></i>
                                Export
                            </Button>
                        </div>
                    </Card.Header>
                    <Card.Body>
                        <div className="table-responsive">
                            <Table hover>
                                <thead className="table-light">
                                    <tr>
                                        <th>Ürün Kodu</th>
                                        <th>Ürün Adı</th>
                                        <th>Kategori</th>
                                        <th>Marka</th>
                                        <th className="text-center">Stok Miktarı</th>
                                        <th className="text-end">Maliyet Fiyatı</th>
                                        <th className="text-end">Stok Değeri</th>
                                        <th className="text-center">Durum</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.products?.map((product: Product) => (
                                        <tr key={product.id}>
                                            <td className="fw-medium">{String(product.code)}</td>
                                            <td>{String(product.name)}</td>
                                            <td>{String(product.category || '-')}</td>
                                            <td>{String(product.brand || '-')}</td>
                                            <td className="text-center">
                                                <Badge bg="secondary">{product.stock_quantity || 0}</Badge>
                                            </td>
                                            <td className="text-end">{formatCurrency(product.cost_price)}</td>
                                            <td className="text-end fw-medium">{formatCurrency(product.stock_value)}</td>
                                            <td className="text-center">
                                                {(product.stock_quantity || 0) === 0 ? (
                                                    <Badge bg="danger">Stokta Yok</Badge>
                                                ) : (product.stock_quantity || 0) <= 10 ? (
                                                    <Badge bg="warning">Düşük Stok</Badge>
                                                ) : (
                                                    <Badge bg="success">Stokta</Badge>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    </Card.Body>
                </Card>
            </div>
        );
    };

    const renderABCAnalysisReport = () => {
        if (!reportData) return null;

        return (
            <div>
                {/* Statistics Cards */}
                <Row className="mb-4">
                    <Col md={4}>
                        <Card className="bg-primary text-white">
                            <Card.Body>
                                <h4>A Kategorisi</h4>
                                <div className="d-flex justify-content-between">
                                    <span>Ürün Sayısı:</span>
                                    <strong>{reportData.statistics?.category_a_count || 0}</strong>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span>Toplam Değer:</span>
                                    <strong>{formatCurrency(reportData.statistics?.category_a_value || 0)}</strong>
                                </div>
                                <small>%80 değer oluşturan ürünler</small>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="bg-success text-white">
                            <Card.Body>
                                <h4>B Kategorisi</h4>
                                <div className="d-flex justify-content-between">
                                    <span>Ürün Sayısı:</span>
                                    <strong>{reportData.statistics?.category_b_count || 0}</strong>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span>Toplam Değer:</span>
                                    <strong>{formatCurrency(reportData.statistics?.category_b_value || 0)}</strong>
                                </div>
                                <small>%15 değer oluşturan ürünler</small>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="bg-warning text-white">
                            <Card.Body>
                                <h4>C Kategorisi</h4>
                                <div className="d-flex justify-content-between">
                                    <span>Ürün Sayısı:</span>
                                    <strong>{reportData.statistics?.category_c_count || 0}</strong>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span>Toplam Değer:</span>
                                    <strong>{formatCurrency(reportData.statistics?.category_c_value || 0)}</strong>
                                </div>
                                <small>%5 değer oluşturan ürünler</small>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Data Table */}
                <Card>
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">ABC Analizi Detayları</h5>
                        <Button size="sm" variant="outline-success" onClick={exportReport}>
                            <i className="ri-download-line me-1"></i>
                            Export
                        </Button>
                    </Card.Header>
                    <Card.Body>
                        <div className="table-responsive">
                            <Table hover>
                                <thead className="table-light">
                                    <tr>
                                        <th>ABC</th>
                                        <th>Ürün Kodu</th>
                                        <th>Ürün Adı</th>
                                        <th>Kategori</th>
                                        <th className="text-end">Stok Değeri</th>
                                        <th className="text-center">Değer %</th>
                                        <th className="text-center">Kümülatif %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.products?.map((product: Product, index: number) => (
                                        <tr key={product.id}>
                                            <td>
                                                <Badge 
                                                    bg={
                                                        product.abc_category === 'A' ? 'primary' :
                                                        product.abc_category === 'B' ? 'success' : 'warning'
                                                    }
                                                    className="fs-6"
                                                >
                                                    {String(product.abc_category || '')}
                                                </Badge>
                                            </td>
                                            <td className="fw-medium">{String(product.code)}</td>
                                            <td>{String(product.name)}</td>
                                            <td>{String(product.category || '-')}</td>
                                            <td className="text-end fw-medium">{formatCurrency(product.stock_value)}</td>
                                            <td className="text-center">%{product.value_percentage?.toFixed(2)}</td>
                                            <td className="text-center">%{product.cumulative_percentage?.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    </Card.Body>
                </Card>
            </div>
        );
    };

    const renderStockAgingReport = () => {
        if (!reportData) return null;

        return (
            <div>
                {/* Age Statistics */}
                <Row className="mb-4">
                    {reportData.age_statistics?.map((stat: any, index: number) => (
                        <Col md={2} key={index}>
                            <Card>
                                <Card.Body className="text-center">
                                    <h5>{stat.category}</h5>
                                    <h3 className="text-primary">{stat.count}</h3>
                                    <small className="text-muted">
                                        {formatCurrency(stat.total_value)}
                                    </small>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>

                {/* Data Table */}
                <Card>
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Stok Yaşlandırma Detayları</h5>
                        <Button size="sm" variant="outline-success" onClick={exportReport}>
                            <i className="ri-download-line me-1"></i>
                            Export
                        </Button>
                    </Card.Header>
                    <Card.Body>
                        <div className="table-responsive">
                            <Table hover>
                                <thead className="table-light">
                                    <tr>
                                        <th>Ürün Kodu</th>
                                        <th>Ürün Adı</th>
                                        <th>Kategori</th>
                                        <th className="text-center">Yaş Kategorisi</th>
                                        <th className="text-center">Gün Sayısı</th>
                                        <th className="text-center">Son Hareket</th>
                                        <th className="text-end">Stok Değeri</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.products?.map((product: Product) => (
                                        <tr key={product.id}>
                                            <td className="fw-medium">{String(product.code)}</td>
                                            <td>{String(product.name)}</td>
                                            <td>{String(product.category || '-')}</td>
                                            <td className="text-center">
                                                <Badge 
                                                    bg={
                                                        (product.days_old || 0) <= 30 ? 'success' :
                                                        (product.days_old || 0) <= 90 ? 'warning' : 'danger'
                                                    }
                                                >
                                                    {String(product.age_category || '')}
                                                </Badge>
                                            </td>
                                            <td className="text-center">{product.days_old || 0} gün</td>
                                            <td className="text-center">{formatDate(product.last_movement_date)}</td>
                                            <td className="text-end fw-medium">{formatCurrency(product.stock_value)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    </Card.Body>
                </Card>
            </div>
        );
    };

    const renderStockTurnoverReport = () => {
        if (!reportData) return null;

        return (
            <div>
                {/* Performance Statistics */}
                <Row className="mb-4">
                    {reportData.performance_statistics?.map((stat: any, index: number) => (
                        <Col md={2} key={index}>
                            <Card>
                                <Card.Body className="text-center">
                                    <h6>{stat.performance}</h6>
                                    <h4 className="text-primary">{stat.count}</h4>
                                    <small className="text-muted">
                                        Ort: {stat.avg_turnover?.toFixed(1)}
                                    </small>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>

                {/* Data Table */}
                <Card>
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Stok Dönüş Hızı Detayları</h5>
                        <Button size="sm" variant="outline-success" onClick={exportReport}>
                            <i className="ri-download-line me-1"></i>
                            Export
                        </Button>
                    </Card.Header>
                    <Card.Body>
                        <div className="table-responsive">
                            <Table hover>
                                <thead className="table-light">
                                    <tr>
                                        <th>Ürün Kodu</th>
                                        <th>Ürün Adı</th>
                                        <th>Kategori</th>
                                        <th className="text-center">Dönüş Hızı</th>
                                        <th className="text-center">Stok Günleri</th>
                                        <th className="text-center">Performans</th>
                                        <th className="text-end">Stok Değeri</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.products?.map((product: Product) => (
                                        <tr key={product.id}>
                                            <td className="fw-medium">{String(product.code)}</td>
                                            <td>{String(product.name)}</td>
                                            <td>{String(product.category || '-')}</td>
                                            <td className="text-center">
                                                <Badge bg="info">{product.turnover_rate || 0}</Badge>
                                            </td>
                                            <td className="text-center">{product.stock_days || 0} gün</td>
                                            <td className="text-center">
                                                <Badge 
                                                    bg={
                                                        product.performance === 'Mükemmel' ? 'success' :
                                                        product.performance === 'İyi' ? 'primary' :
                                                        product.performance === 'Orta' ? 'warning' : 'danger'
                                                    }
                                                >
                                                    {String(product.performance || '')}
                                                </Badge>
                                            </td>
                                            <td className="text-end fw-medium">{formatCurrency(product.stock_value)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    </Card.Body>
                </Card>
            </div>
        );
    };

    return (
        <Layout>
            <Head title="Stok Raporları" />

            <div className="page-content">
                <div className="container-fluid">
                    <Row className="mb-3">
                        <Col>
                            <div className="page-title-box d-flex align-items-center justify-content-between">
                                <div>
                                    <h4 className="mb-0">Stok Raporları</h4>
                                    <div className="page-title-right">
                                        <ol className="breadcrumb m-0">
                                            <li className="breadcrumb-item">
                                                <Link href={route('stock.index')}>Stok Yönetimi</Link>
                                            </li>
                                            <li className="breadcrumb-item active">Raporlar</li>
                                        </ol>
                                    </div>
                                </div>
                                <div className="d-flex gap-2">
                                    <Link 
                                        href={route('stock.index')} 
                                        className="btn btn-secondary"
                                    >
                                        <i className="ri-arrow-left-line me-1"></i>
                                        Stok Yönetimi
                                    </Link>
                                </div>
                            </div>
                        </Col>
                    </Row>

                    <Card>
                        <Card.Body>
                            <Tabs
                                activeKey={activeTab}
                                onSelect={(k) => k && setActiveTab(k)}
                                className="nav-tabs-custom mb-4"
                            >
                                <Tab eventKey="stock-status" title={
                                    <span><i className="ri-bar-chart-line me-1"></i>Stok Durumu</span>
                                }>
                                    {loading ? (
                                        <div className="text-center py-5">
                                            <Spinner animation="border" role="status">
                                                <span className="visually-hidden">Yükleniyor...</span>
                                            </Spinner>
                                        </div>
                                    ) : (
                                        renderStockStatusReport()
                                    )}
                                </Tab>

                                <Tab eventKey="abc-analysis" title={
                                    <span><i className="ri-pie-chart-line me-1"></i>ABC Analizi</span>
                                }>
                                    {loading ? (
                                        <div className="text-center py-5">
                                            <Spinner animation="border" role="status">
                                                <span className="visually-hidden">Yükleniyor...</span>
                                            </Spinner>
                                        </div>
                                    ) : (
                                        renderABCAnalysisReport()
                                    )}
                                </Tab>

                                <Tab eventKey="stock-aging" title={
                                    <span><i className="ri-time-line me-1"></i>Stok Yaşlandırma</span>
                                }>
                                    {loading ? (
                                        <div className="text-center py-5">
                                            <Spinner animation="border" role="status">
                                                <span className="visually-hidden">Yükleniyor...</span>
                                            </Spinner>
                                        </div>
                                    ) : (
                                        renderStockAgingReport()
                                    )}
                                </Tab>

                                <Tab eventKey="stock-turnover" title={
                                    <span><i className="ri-refresh-line me-1"></i>Dönüş Hızı</span>
                                }>
                                    {loading ? (
                                        <div className="text-center py-5">
                                            <Spinner animation="border" role="status">
                                                <span className="visually-hidden">Yükleniyor...</span>
                                            </Spinner>
                                        </div>
                                    ) : (
                                        renderStockTurnoverReport()
                                    )}
                                </Tab>
                            </Tabs>
                        </Card.Body>
                    </Card>
                </div>
            </div>
        </Layout>
    );
}