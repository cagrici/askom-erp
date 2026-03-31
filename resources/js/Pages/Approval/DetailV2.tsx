import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Card, Col, Row, Badge, Container, Button, Alert, ListGroup, Table } from 'react-bootstrap';
import Layout from '../../Layouts';
import Swal from 'sweetalert2';
import 'animate.css';

interface Customer {
    name: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
}

interface Item {
    name: string;
    description?: string;
    quantity: number;
    price: number;
    formattedPrice: string;
    total: number;
    formattedTotal: string;
}

interface RequestedBy {
    name: string;
    title?: string;
    department?: string;
    phone?: string;
}

interface Detail {
    id: number;
    orderNo?: string;
    offerNo?: string;
    requestNo?: string;
    customer?: Customer;
    employee?: string;
    department?: string;
    date: string;
    formattedDate: string;
    deliveryDate?: string;
    formattedDeliveryDate?: string;
    validUntil?: string;
    formattedValidUntil?: string;
    amount: number;
    formattedAmount: string;
    status: string;
    priority: string;
    items?: Item[];
    notes?: string;
    description?: string;
    terms?: string[];
    requestedBy?: RequestedBy;
    approvalLevel?: number;
    totalApprovalLevels?: number;
    type?: string;
    summary?: string;
}

interface TypeInfo {
    title: string;
    icon: string;
    color: string;
}

interface Props {
    type: string;
    typeInfo: TypeInfo;
    detail: Detail | null;
}

export default function ApprovalDetailV2({ type, typeInfo, detail }: Props) {
    const [loading, setLoading] = useState(false);

    if (!detail) {
        return (
            <>
                <Head title="Detay Bulunamadı" />
                <div className="page-content">
                    <Container>
                        <Card>
                            <Card.Body className="text-center py-5">
                                <i className="bi ri-error-warning-line fs-1 text-danger mb-3 d-block"></i>
                                <h4>Detay Bulunamadı</h4>
                                <p className="text-muted">İstenen öğe bulunamadı veya erişim izniniz yok.</p>
                                <Link href="/onay-2" className="btn btn-primary">
                                    <i className="bi ri-arrow-left-line me-2"></i>
                                    Onay merkezine dön
                                </Link>
                            </Card.Body>
                        </Card>
                    </Container>
                </div>
            </>
        );
    }

    const handleApprove = async () => {
        const result = await Swal.fire({
            title: 'Onaylamak istediğinize emin misiniz?',
            text: "Bu işlemi onayladıktan sonra geri alamazsınız!",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#6c757d',
            confirmButtonText: '<i class="bi ri-check-line me-2"></i>Evet, Onayla',
            cancelButtonText: '<i class="bi ri-close-circle-line me-2"></i>İptal',
            customClass: {
                confirmButton: 'btn btn-success',
                cancelButton: 'btn btn-secondary'
            },
            buttonsStyling: false
        });

        if (result.isConfirmed) {
            setLoading(true);
            try {
                const response = await fetch(`/onay-2/${type}/${detail.id}/approve`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                });
                
                if (response.ok) {
                    await Swal.fire({
                        title: 'Onaylandı!',
                        text: 'İşlem başarıyla onaylandı.',
                        icon: 'success',
                        confirmButtonText: 'Tamam',
                        confirmButtonColor: '#10b981',
                        customClass: {
                            confirmButton: 'btn btn-success'
                        },
                        buttonsStyling: false,
                        timer: 2000,
                        timerProgressBar: true,
                        showClass: {
                            popup: 'animate__animated animate__bounceIn'
                        },
                        hideClass: {
                            popup: 'animate__animated animate__fadeOutUp'
                        }
                    });
                    router.visit(`/onay-2/${type}`);
                } else {
                    Swal.fire({
                        title: 'Hata!',
                        text: 'Onaylama işlemi başarısız oldu.',
                        icon: 'error',
                        confirmButtonText: 'Tamam',
                        confirmButtonColor: '#dc3545',
                        customClass: {
                            confirmButton: 'btn btn-danger'
                        },
                        buttonsStyling: false
                    });
                }
            } catch (error) {
                Swal.fire({
                    title: 'Hata!',
                    text: 'Bir hata oluştu. Lütfen tekrar deneyin.',
                    icon: 'error',
                    confirmButtonText: 'Tamam',
                    confirmButtonColor: '#dc3545',
                    customClass: {
                        confirmButton: 'btn btn-danger'
                    },
                    buttonsStyling: false
                });
            } finally {
                setLoading(false);
            }
        }
    };

    const handleRejectClick = async () => {
        const { value: reason } = await Swal.fire({
            title: 'İşlemi Reddet',
            text: 'Bu işlemi neden reddediyorsunuz?',
            icon: 'question',
            input: 'textarea',
            inputPlaceholder: 'Red sebebinizi buraya yazın...',
            inputAttributes: {
                rows: '4'
            },
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: '<i class="bi ri-close-circle-line me-2"></i>Reddet',
            cancelButtonText: '<i class="bi ri-arrow-left-line me-2"></i>İptal',
            customClass: {
                confirmButton: 'btn btn-danger',
                cancelButton: 'btn btn-secondary'
            },
            buttonsStyling: false,
            inputValidator: (value) => {
                if (!value || !value.trim()) {
                    return 'Lütfen red sebebini belirtin!'
                }
                if (value.trim().length < 10) {
                    return 'Red sebebi en az 10 karakter olmalıdır!'
                }
            },
            showClass: {
                popup: 'animate__animated animate__fadeInDown'
            },
            hideClass: {
                popup: 'animate__animated animate__fadeOutUp'
            }
        });

        if (reason) {
            setLoading(true);
            try {
                const response = await fetch(`/onay-2/${type}/${detail.id}/reject`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                    body: JSON.stringify({ reason: reason.trim() }),
                });
                
                if (response.ok) {
                    await Swal.fire({
                        title: 'Reddedildi!',
                        text: 'İşlem başarıyla reddedildi.',
                        icon: 'success',
                        confirmButtonText: 'Tamam',
                        confirmButtonColor: '#dc3545',
                        customClass: {
                            confirmButton: 'btn btn-danger'
                        },
                        buttonsStyling: false,
                        timer: 2000,
                        timerProgressBar: true,
                        showClass: {
                            popup: 'animate__animated animate__bounceIn'
                        },
                        hideClass: {
                            popup: 'animate__animated animate__fadeOutUp'
                        }
                    });
                    router.visit(`/onay-2/${type}`);
                } else {
                    Swal.fire({
                        title: 'Hata!',
                        text: 'Reddetme işlemi başarısız oldu.',
                        icon: 'error',
                        confirmButtonText: 'Tamam',
                        confirmButtonColor: '#dc3545',
                        customClass: {
                            confirmButton: 'btn btn-danger'
                        },
                        buttonsStyling: false,
                        showClass: {
                            popup: 'animate__animated animate__shakeX'
                        }
                    });
                }
            } catch (error) {
                Swal.fire({
                    title: 'Hata!',
                    text: 'Bir hata oluştu. Lütfen tekrar deneyin.',
                    icon: 'error',
                    confirmButtonText: 'Tamam',
                    confirmButtonColor: '#dc3545',
                    customClass: {
                        confirmButton: 'btn btn-danger'
                    },
                    buttonsStyling: false,
                    showClass: {
                        popup: 'animate__animated animate__shakeX'
                    }
                });
            } finally {
                setLoading(false);
            }
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getPriorityBadge = (priority: string) => {
        switch(priority) {
            case 'high':
                return <Badge bg="danger" className="rounded-pill"><i className="bi ri-fire-fill me-1"></i>Yüksek Öncelik</Badge>;
            case 'medium':
                return <Badge bg="warning" className="rounded-pill"><i className="bi ri-time-line me-1"></i>Orta Öncelik</Badge>;
            case 'low':
                return <Badge bg="success" className="rounded-pill"><i className="bi ri-check-line me-1"></i>Düşük Öncelik</Badge>;
            default:
                return null;
        }
    };

    return (
        <>
            <Head title={`${typeInfo.title} Detayı`} />
            
            <div className="page-content">
                <Container fluid>
                    {/* Page Header */}
                    <div className="page-title-box d-flex align-items-center justify-content-between mb-4">
                        <div className="d-flex align-items-center">
                            <Link 
                                href={`/onay-2/${type}`} 
                                className="btn btn-light btn-sm me-3"
                            >
                                <i className="bi ri-arrow-left-line"></i>
                            </Link>
                            <div>
                                <h4 className="mb-0">
                                    {detail.orderNo || detail.offerNo || detail.requestNo}
                                </h4>
                                <p className="text-muted mb-0 mt-1">{typeInfo.title} Detayı</p>
                            </div>
                        </div>
                        {getPriorityBadge(detail.priority)}
                    </div>

                    {/* Quick Summary */}
                    <Row className="mb-4">
                        <Col md={6}>
                            <Card className="bg-primary bg-opacity-10 border-0">
                                <Card.Body className="text-center">
                                    <h2 className="mb-1 text-primary">{formatCurrency(detail.amount)}</h2>
                                    <p className="mb-0 text-muted">Toplam Tutar</p>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={6}>
                            <Card className="bg-light border-0">
                                <Card.Body className="text-center">
                                    <h4 className="mb-1">{detail.formattedDate}</h4>
                                    <p className="mb-0 text-muted">Talep Tarihi</p>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Customer/Employee Info */}
                    {(detail.customer || detail.employee) && (
                        <Card className="mb-4">
                            <Card.Header>
                                <h5 className="mb-0">
                                    <i className="bi ri-user-line me-2"></i>
                                    {detail.customer ? 'Müşteri Bilgileri' : 'Çalışan Bilgileri'}
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                {detail.customer ? (
                                    <Row>
                                        <Col md={6}>
                                            <ListGroup variant="flush">
                                                <ListGroup.Item className="ps-0">
                                                    <strong>Firma:</strong> {detail.customer.name}
                                                </ListGroup.Item>
                                                {detail.customer.contactPerson && (
                                                    <ListGroup.Item className="ps-0">
                                                        <strong>İletişim:</strong> {detail.customer.contactPerson}
                                                    </ListGroup.Item>
                                                )}
                                            </ListGroup>
                                        </Col>
                                        <Col md={6}>
                                            <ListGroup variant="flush">
                                                {detail.customer.phone && (
                                                    <ListGroup.Item className="ps-0">
                                                        <i className="bi ri-phone-line me-2"></i>
                                                        {detail.customer.phone}
                                                    </ListGroup.Item>
                                                )}
                                                {detail.customer.email && (
                                                    <ListGroup.Item className="ps-0">
                                                        <i className="bi ri-mail-line me-2"></i>
                                                        {detail.customer.email}
                                                    </ListGroup.Item>
                                                )}
                                            </ListGroup>
                                        </Col>
                                        {detail.customer.address && (
                                            <Col xs={12}>
                                                <ListGroup.Item className="ps-0 border-0">
                                                    <i className="bi ri-map-pin-line me-2"></i>
                                                    {detail.customer.address}
                                                </ListGroup.Item>
                                            </Col>
                                        )}
                                    </Row>
                                ) : (
                                    <div>
                                        <p className="mb-2"><strong>Çalışan:</strong> {detail.employee}</p>
                                        {detail.department && (
                                            <p className="mb-2"><strong>Departman:</strong> {detail.department}</p>
                                        )}
                                        {detail.type && (
                                            <p className="mb-0">
                                                <Badge bg="info">{detail.type}</Badge>
                                            </p>
                                        )}
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    )}

                    {/* Items */}
                    {detail.items && detail.items.length > 0 && (
                        <Card className="mb-4">
                            <Card.Header>
                                <h5 className="mb-0">
                                    <i className="bi ri-package-line me-2"></i>
                                    Ürünler/Hizmetler
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                <Table responsive striped hover>
                                    <thead>
                                        <tr>
                                            <th>Ürün/Hizmet</th>
                                            <th className="text-center">Miktar</th>
                                            <th className="text-end">Birim Fiyat</th>
                                            <th className="text-end">Toplam</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {detail.items.map((item, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <strong>{item.name}</strong>
                                                    {item.description && (
                                                        <small className="d-block text-muted">{item.description}</small>
                                                    )}
                                                </td>
                                                <td className="text-center">{item.quantity}</td>
                                                <td className="text-end">{item.formattedPrice}</td>
                                                <td className="text-end fw-bold">{item.formattedTotal}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <th colSpan={3} className="text-end">Genel Toplam:</th>
                                            <th className="text-end text-primary">{formatCurrency(detail.amount)}</th>
                                        </tr>
                                    </tfoot>
                                </Table>
                            </Card.Body>
                        </Card>
                    )}

                    {/* Description/Summary */}
                    {(detail.description || detail.summary) && (
                        <Card className="mb-4">
                            <Card.Header>
                                <h5 className="mb-0">
                                    <i className="bi ri-file-text-line me-2"></i>
                                    Açıklama
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                <p className="mb-0">{detail.description || detail.summary}</p>
                            </Card.Body>
                        </Card>
                    )}

                    {/* Terms */}
                    {detail.terms && detail.terms.length > 0 && (
                        <Card className="mb-4">
                            <Card.Header>
                                <h5 className="mb-0">
                                    <i className="bi ri-list-check me-2"></i>
                                    Şartlar
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                <ListGroup variant="flush">
                                    {detail.terms.map((term, index) => (
                                        <ListGroup.Item key={index} className="ps-0">
                                            <i className="bi bi-check2-circle text-success me-2"></i>
                                            {term}
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            </Card.Body>
                        </Card>
                    )}

                    {/* Dates */}
                    <Card className="mb-4">
                        <Card.Header>
                            <h5 className="mb-0">
                                <i className="bi ri-calendar-line me-2"></i>
                                Tarihler
                            </h5>
                        </Card.Header>
                        <Card.Body>
                            <Row>
                                <Col md={4}>
                                    <p className="mb-2">
                                        <strong>Talep Tarihi:</strong><br />
                                        {detail.formattedDate}
                                    </p>
                                </Col>
                                {detail.deliveryDate && (
                                    <Col md={4}>
                                        <p className="mb-2">
                                            <strong>Teslimat Tarihi:</strong><br />
                                            {detail.formattedDeliveryDate}
                                        </p>
                                    </Col>
                                )}
                                {detail.validUntil && (
                                    <Col md={4}>
                                        <p className="mb-2">
                                            <strong>Geçerlilik:</strong><br />
                                            {detail.formattedValidUntil}
                                        </p>
                                    </Col>
                                )}
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* Notes */}
                    {detail.notes && (
                        <Alert variant="warning" className="mb-4">
                            <Alert.Heading>
                                <i className="bi ri-error-warning-line me-2"></i>
                                Notlar
                            </Alert.Heading>
                            <p className="mb-0">{detail.notes}</p>
                        </Alert>
                    )}

                    {/* Requested By */}
                    {detail.requestedBy && (
                        <Card className="mb-4">
                            <Card.Header>
                                <h5 className="mb-0">
                                    <i className="bi ri-user-star-line me-2"></i>
                                    Talep Eden
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                <Row>
                                    <Col md={6}>
                                        <p className="mb-2"><strong>{detail.requestedBy.name}</strong></p>
                                        {detail.requestedBy.title && (
                                            <p className="mb-2 text-muted">{detail.requestedBy.title}</p>
                                        )}
                                        {detail.requestedBy.department && (
                                            <p className="mb-0">
                                                <Badge bg="secondary">{detail.requestedBy.department}</Badge>
                                            </p>
                                        )}
                                    </Col>
                                    <Col md={6}>
                                        {detail.requestedBy.phone && (
                                            <p className="mb-0">
                                                <i className="bi ri-phone-line me-2"></i>
                                                {detail.requestedBy.phone}
                                            </p>
                                        )}
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    )}

                    {/* Action Buttons */}
                    <Card className="sticky-bottom">
                        <Card.Body>
                            <Row>
                                <Col xs={6}>
                                    <Button
                                        variant="danger"
                                        size="lg"
                                        className="w-100"
                                        onClick={handleRejectClick}
                                        disabled={loading}
                                    >
                                        <i className="bi ri-close-circle-line me-2"></i>
                                        Reddet
                                    </Button>
                                </Col>
                                <Col xs={6}>
                                    <Button
                                        variant="success"
                                        size="lg"
                                        className="w-100"
                                        onClick={handleApprove}
                                        disabled={loading}
                                    >
                                        <i className="bi ri-check-line me-2"></i>
                                        Onayla
                                    </Button>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Container>
            </div>

        </>
    );
}

ApprovalDetailV2.layout = (page: any) => <Layout children={page} />;