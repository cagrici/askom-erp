import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Card, Container, Row, Col } from 'react-bootstrap';
import logolight from '../../../images/logo-light.png';
import { FaClipboardCheck, FaHistory, FaChartLine } from 'react-icons/fa';
import Layout from "../../Layouts";

export default function Index() {
    return (
        <>
            <Head title="Onay Sistemi" />

            <div style={{ backgroundColor: '#2c3e50', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
                <Container fluid className="py-4">
                    <div className="text-center mb-5">
                        <div style={{ backgroundColor: '#000', padding: '2rem', maxWidth: '400px', margin: '0 auto 3rem' }}>
                            <img src={logolight} alt="Logo" style={{ maxWidth: '100%', height: 'auto' }} />
                        </div>
                    </div>

                    <Row className="justify-content-center g-4">
                        <Col lg={4} md={6}>
                            <Link href="/onay-fatura-teklif/pending" className="text-decoration-none d-block h-100">
                                <Card className="text-center shadow-sm hover-shadow h-100"
                                      style={{
                                          backgroundColor: '#000',
                                          color: 'white',
                                          cursor: 'pointer',
                                          transition: 'all 0.3s ease',
                                          border: 'none',
                                          borderRadius: '15px',
                                          minHeight: '200px'
                                      }}>
                                    <Card.Body className="d-flex flex-column align-items-center justify-content-center py-5">
                                        <FaClipboardCheck size={50} className="mb-3" />
                                        <h2 className="h1 mb-0">ONAY</h2>
                                        <p className="mt-2 mb-0 text-white-50">Bekleyen onayları görüntüle</p>
                                    </Card.Body>
                                </Card>
                            </Link>
                        </Col>


                        <Col lg={4} md={6}>
                            <Link href="/onay-fatura-teklif/cari-analiz" className="text-decoration-none d-block h-100">
                                <Card className="text-center shadow-sm hover-shadow h-100"
                                      style={{
                                          backgroundColor: '#000',
                                          color: 'white',
                                          cursor: 'pointer',
                                          transition: 'all 0.3s ease',
                                          border: 'none',
                                          borderRadius: '15px',
                                          minHeight: '200px'
                                      }}>
                                    <Card.Body className="d-flex flex-column align-items-center justify-content-center py-5">
                                        <FaChartLine size={50} className="mb-3" />
                                        <h2 className="h1 mb-0">CARİ ANALİZ</h2>
                                        <p className="mt-2 mb-0 text-white-50">Cari bazlı analiz yap</p>
                                    </Card.Body>
                                </Card>
                            </Link>
                        </Col>
                    </Row>
                </Container>
            </div>

            <style jsx>{`
                .hover-shadow {
                    position: relative;
                    overflow: hidden;
                }
                .hover-shadow::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
                    transition: left 0.5s;
                }
                .hover-shadow:hover::before {
                    left: 100%;
                }
                .hover-shadow:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5) !important;
                }
            `}</style>
        </>
    );
}
