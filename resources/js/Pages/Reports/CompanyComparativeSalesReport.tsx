import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import Layout from '@/Layouts';
import { Card, Col, Row, Form, Button, Table } from 'react-bootstrap';
import { FaArrowUp, FaArrowDown, FaFilter, FaPrint } from 'react-icons/fa';

interface CompanyData {
    company: {
        id: number;
        name: string;
    };
    current_period: {
        total_tl: number;
        total_usd: number;
        invoice_count: number;
    };
    previous_period: {
        total_tl: number;
        total_usd: number;
        invoice_count: number;
    };
    metrics: any;
    changes: {
        tl_change: number;
        tl_change_rate: number;
        usd_change: number;
        usd_change_rate: number;
    };
}

interface Props {
    filters: {
        start_date: string;
        end_date: string;
        prev_start_date: string;
        prev_end_date: string;
    };
    reportData: CompanyData[];
    cumulativeTotals: {
        current_period: {
            tl: number;
            usd: number;
        };
        previous_period: {
            tl: number;
            usd: number;
        };
        changes: {
            tl_change: number;
            tl_change_rate: number;
            usd_change: number;
            usd_change_rate: number;
        };
    };
}

export default function CompanyComparativeSalesReport({
    filters,
    reportData,
    cumulativeTotals,
}: Props) {
    const [localFilters, setLocalFilters] = useState({
        start_date: filters.start_date,
        end_date: filters.end_date,
    });

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const applyFilters = () => {
        router.get('/reports/company-comparative-sales', localFilters as any, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const formatCurrency = (amount: number, currency: string = 'TRY') => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const formatNumber = (num: number, decimals: number = 0) => {
        return new Intl.NumberFormat('tr-TR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(num);
    };

    const renderChangeRate = (rate: number) => {
        const isPositive = rate > 0;
        const color = isPositive ? 'text-success' : rate < 0 ? 'text-danger' : 'text-muted';
        const icon = isPositive ? <FaArrowUp /> : rate < 0 ? <FaArrowDown /> : null;

        return (
            <span className={color}>
                {icon} % {Math.abs(rate).toFixed(2)}
            </span>
        );
    };

    const renderMetricSection = (company: CompanyData) => {
        const { metrics } = company;
        
        switch (company.company.id) {
            case 2715: // Sentetik
                return (
                    <div className="mt-3">
                        <h6>Miktar Detayları</h6>
                        <Row>
                            <Col md={4}>
                                <small className="text-muted">ADET</small>
                                <div>{formatNumber(metrics.current.adet)} AD.</div>
                                <div className="text-muted small">{formatNumber(metrics.previous.adet)} AD.</div>
                                {renderChangeRate(metrics.changes.adet_rate)}
                            </Col>
                            <Col md={4}>
                                <small className="text-muted">KG</small>
                                <div>{formatNumber(metrics.current.kg, 2)} KG</div>
                                <div className="text-muted small">{formatNumber(metrics.previous.kg, 2)} KG</div>
                                {renderChangeRate(metrics.changes.kg_rate)}
                            </Col>
                            <Col md={4}>
                                <small className="text-muted">METRE</small>
                                <div>{formatNumber(metrics.current.m, 2)} M</div>
                                <div className="text-muted small">{formatNumber(metrics.previous.m, 2)} M</div>
                                {renderChangeRate(metrics.changes.m_rate)}
                            </Col>
                        </Row>
                    </div>
                );
                
            case 2716: // Mermer
                return (
                    <div className="mt-3">
                        <h6>Miktar Detayları</h6>
                        <Row>
                            <Col md={2}>
                                <small className="text-muted">BLOK (TON)</small>
                                <div>{formatNumber(metrics.current.ton, 2)}</div>
                                <div className="text-muted small">{formatNumber(metrics.previous.ton, 2)}</div>
                                {renderChangeRate(metrics.changes.ton_rate)}
                            </Col>
                            <Col md={2}>
                                <small className="text-muted">PLAKA (M²)</small>
                                <div>{formatNumber(metrics.current.plaka_m2, 2)}</div>
                                <div className="text-muted small">{formatNumber(metrics.previous.plaka_m2, 2)}</div>
                                {renderChangeRate(metrics.changes.plaka_rate)}
                            </Col>
                            <Col md={2}>
                                <small className="text-muted">EBATLI (M²)</small>
                                <div>{formatNumber(metrics.current.ebatli_m2, 2)}</div>
                                <div className="text-muted small">{formatNumber(metrics.previous.ebatli_m2, 2)}</div>
                                {renderChangeRate(metrics.changes.ebatli_rate)}
                            </Col>
                            <Col md={3}>
                                <small className="text-muted">PALEDYEN (TON)</small>
                                <div>{formatNumber(metrics.current.paledyen_ton, 2)}</div>
                                <div className="text-muted small">{formatNumber(metrics.previous.paledyen_ton, 2)}</div>
                                {renderChangeRate(metrics.changes.paledyen_rate)}
                            </Col>
                            <Col md={3}>
                                <small className="text-muted">MOZAİK (M²)</small>
                                <div>{formatNumber(metrics.current.mozaik_m2, 2)}</div>
                                <div className="text-muted small">{formatNumber(metrics.previous.mozaik_m2, 2)}</div>
                                {renderChangeRate(metrics.changes.mozaik_rate)}
                            </Col>
                        </Row>
                    </div>
                );
                
            case 2725: // Taşyünü
                return (
                    <div className="mt-3">
                        <h6>Miktar Detayları</h6>
                        <Row>
                            <Col md={12}>
                                <small className="text-muted">TON</small>
                                <div>{formatNumber(metrics.current.ton, 2)} TON</div>
                                <div className="text-muted small">{formatNumber(metrics.previous.ton, 2)} TON</div>
                                {renderChangeRate(metrics.changes.ton_rate)}
                            </Col>
                        </Row>
                    </div>
                );
                
            default:
                return null;
        }
    };

    return (
        <Layout>
            <Head title="Firma Bazlı Karşılaştırmalı Satış Raporu" />

            <div className="page-content">
                <div className="container-fluid">
                    <div className="page-header d-flex justify-content-between align-items-center mb-4">
                        <h4 className="page-title text-danger fw-bold">
                            AKDAĞ - KARŞILAŞTIRMALI SATIŞ RAPORU - STOK BAZINDA DAĞILIM
                        </h4>
                        <Button variant="outline-secondary" size="sm">
                            <FaPrint className="me-2" />
                            Yazdır
                        </Button>
                    </div>

                    {/* Filters */}
                    <Card className="mb-4">
                        <Card.Body>
                            <Row className="align-items-end">
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>Başlangıç Tarihi</Form.Label>
                                        <Form.Control
                                            type="date"
                                            name="start_date"
                                            value={localFilters.start_date}
                                            onChange={handleFilterChange}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>Bitiş Tarihi</Form.Label>
                                        <Form.Control
                                            type="date"
                                            name="end_date"
                                            value={localFilters.end_date}
                                            onChange={handleFilterChange}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Button variant="primary" onClick={applyFilters}>
                                        <FaFilter className="me-2" />
                                        Filtrele
                                    </Button>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* Company Reports */}
                    {reportData.map((company) => (
                        <Card key={company.company.id} className="mb-4">
                            <Card.Header className={`text-white ${
                                company.company.id === 2715 ? 'bg-primary' : 
                                company.company.id === 2716 ? 'bg-warning' : 
                                'bg-info'
                            }`}>
                                <h5 className="mb-0 text-white">{company.company.name}</h5>
                            </Card.Header>
                            <Card.Body>
                                <div className="table-responsive">
                                    <Table bordered className="mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>BAŞLANGIÇ TARİHİ</th>
                                                <th>BİTİŞ TARİHİ</th>
                                                <th className="text-end">SATIŞ TUTARI (TL)</th>
                                                <th className="text-center">% TL</th>
                                                <th className="text-end">SATIŞ TUTARI (USD)</th>
                                                <th className="text-center">% USD</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>{filters.start_date}</td>
                                                <td>{filters.end_date}</td>
                                                <td className="text-end">{formatCurrency(company.current_period.total_tl)}</td>
                                                <td className="text-center" rowSpan={2}>
                                                    {renderChangeRate(company.changes.tl_change_rate)}
                                                </td>
                                                <td className="text-end">{formatCurrency(company.current_period.total_usd, 'USD')}</td>
                                                <td className="text-center" rowSpan={2}>
                                                    {renderChangeRate(company.changes.usd_change_rate)}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>{filters.prev_start_date}</td>
                                                <td>{filters.prev_end_date}</td>
                                                <td className="text-end">{formatCurrency(company.previous_period.total_tl)}</td>
                                                <td className="text-end">{formatCurrency(company.previous_period.total_usd, 'USD')}</td>
                                            </tr>
                                            <tr className="table-secondary">
                                                <td colSpan={2} className="text-center">
                                                    <strong>{filters.start_date} - {filters.end_date}</strong>
                                                </td>
                                                <td className="text-end">
                                                    <strong>{formatCurrency(company.current_period.total_tl)}</strong>
                                                </td>
                                                <td></td>
                                                <td className="text-end">
                                                    <strong>{formatCurrency(company.current_period.total_usd, 'USD')}</strong>
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tbody>
                                    </Table>
                                </div>
                                {renderMetricSection(company)}
                            </Card.Body>
                        </Card>
                    ))}

                    {/* Cumulative Totals */}
                    <Card className="border-danger">
                        <Card.Header className="bg-danger text-white">
                            <h5 className="mb-0 text-white">KÜMÜLATİF</h5>
                        </Card.Header>
                        <Card.Body>
                            <div className="table-responsive">
                                <Table bordered className="mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>BAŞLANGIÇ TARİHİ</th>
                                            <th>BİTİŞ TARİHİ</th>
                                            <th className="text-end">SATIŞ TUTARI (TL)</th>
                                            <th className="text-center">% TL</th>
                                            <th className="text-end">SATIŞ TUTARI (USD)</th>
                                            <th className="text-center">% USD</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>{filters.start_date}</td>
                                            <td>{filters.end_date}</td>
                                            <td className="text-end">{formatCurrency(cumulativeTotals.current_period.tl)}</td>
                                            <td className="text-center" rowSpan={2}>
                                                {renderChangeRate(cumulativeTotals.changes.tl_change_rate)}
                                            </td>
                                            <td className="text-end">{formatCurrency(cumulativeTotals.current_period.usd, 'USD')}</td>
                                            <td className="text-center" rowSpan={2}>
                                                {renderChangeRate(cumulativeTotals.changes.usd_change_rate)}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>{filters.prev_start_date}</td>
                                            <td>{filters.prev_end_date}</td>
                                            <td className="text-end">{formatCurrency(cumulativeTotals.previous_period.tl)}</td>
                                            <td className="text-end">{formatCurrency(cumulativeTotals.previous_period.usd, 'USD')}</td>
                                        </tr>
                                        <tr className="table-danger">
                                            <td colSpan={2} className="text-center">
                                                <strong>{filters.start_date} - {filters.end_date}</strong>
                                            </td>
                                            <td className="text-end">
                                                <strong>{formatCurrency(cumulativeTotals.current_period.tl)}</strong>
                                            </td>
                                            <td></td>
                                            <td className="text-end">
                                                <strong>{formatCurrency(cumulativeTotals.current_period.usd, 'USD')}</strong>
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tbody>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>
                </div>
            </div>
        </Layout>
    );
}