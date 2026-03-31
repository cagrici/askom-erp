import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Card, Row, Col, Badge, Table, Button } from 'react-bootstrap';
import Layout from '../../../Layouts';

interface BankAccount {
    id: number;
    account_name: string;
    bank_name: string;
    branch_name?: string;
    branch_code?: string;
    account_number: string;
    iban?: string;
    swift_code?: string;
    currency: string;
    account_type: string;
    description?: string;
    is_active: boolean;
    is_default: boolean;
    created_at: string;
    updated_at: string;
    account_type_text: string;
    formatted_account_number: string;
}

interface PageProps {
    bankAccount: BankAccount;
}

export default function Show() {
    const { bankAccount } = usePage<PageProps>().props;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR');
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('tr-TR');
    };

    const getCurrencyFlag = (currency: string) => {
        switch (currency) {
            case 'TRY':
                return '🇹🇷';
            case 'USD':
                return '🇺🇸';
            case 'EUR':
                return '🇪🇺';
            case 'GBP':
                return '🇬🇧';
            default:
                return '💰';
        }
    };

    const handleToggleStatus = () => {
        if (confirm(`Bu hesabı ${bankAccount.is_active ? 'pasif' : 'aktif'} yapmak istediğinizden emin misiniz?`)) {
            router.patch(route('accounting.bank-accounts.toggle-status', bankAccount.id));
        }
    };

    const handleSetDefault = () => {
        if (confirm('Bu hesabı varsayılan banka hesabı olarak ayarlamak istediğinizden emin misiniz?')) {
            router.patch(route('accounting.bank-accounts.set-default', bankAccount.id));
        }
    };

    const handleDelete = () => {
        if (confirm('Bu banka hesabını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
            router.delete(route('accounting.bank-accounts.destroy', bankAccount.id));
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            // Could add a toast notification here
            alert('Panoya kopyalandı!');
        });
    };

    return (
        <Layout title={`Banka Hesabı - ${bankAccount.account_name}`}>
            <Head title={`Banka Hesabı - ${bankAccount.account_name}`} />
            <div className="page-content">
                <div className="container-fluid">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h1 className="h3 mb-0">Banka Hesabı Detayı</h1>
                            <p className="text-muted mb-0">{bankAccount.account_name}</p>
                        </div>
                        <div>
                            <Link
                                href={route('accounting.bank-accounts.index')}
                                className="btn btn-outline-secondary me-2"
                            >
                                <i className="fas fa-arrow-left"></i> Geri Dön
                            </Link>
                            <Button
                                variant={bankAccount.is_active ? "warning" : "success"}
                                onClick={handleToggleStatus}
                                className="me-2"
                            >
                                <i className={`fas fa-${bankAccount.is_active ? 'times' : 'check'}`}></i>
                                {bankAccount.is_active ? ' Pasif Yap' : ' Aktif Yap'}
                            </Button>
                            {!bankAccount.is_default && (
                                <Button
                                    variant="info"
                                    onClick={handleSetDefault}
                                    className="me-2"
                                >
                                    <i className="fas fa-star"></i> Varsayılan Yap
                                </Button>
                            )}
                            <Link
                                href={route('accounting.bank-accounts.edit', bankAccount.id)}
                                className="btn btn-primary me-2"
                            >
                                <i className="fas fa-edit"></i> Düzenle
                            </Link>
                            <Button
                                variant="danger"
                                onClick={handleDelete}
                            >
                                <i className="fas fa-trash"></i> Sil
                            </Button>
                        </div>
                    </div>

                    <Row>
                        <Col lg={8}>
                            {/* Basic Information */}
                            <Card className="mb-4">
                                <Card.Header>
                                    <h6 className="mb-0">Temel Bilgiler</h6>
                                </Card.Header>
                                <Card.Body>
                                    <Row>
                                        <Col md={6}>
                                            <Table borderless>
                                                <tbody>
                                                    <tr>
                                                        <td className="fw-bold">Hesap Adı:</td>
                                                        <td>{bankAccount.account_name}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="fw-bold">Banka:</td>
                                                        <td>{bankAccount.bank_name}</td>
                                                    </tr>
                                                    {bankAccount.branch_name && (
                                                        <tr>
                                                            <td className="fw-bold">Şube:</td>
                                                            <td>
                                                                {bankAccount.branch_name}
                                                                {bankAccount.branch_code && (
                                                                    <small className="text-muted ms-2">({bankAccount.branch_code})</small>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    )}
                                                    <tr>
                                                        <td className="fw-bold">Hesap Tipi:</td>
                                                        <td>
                                                            <Badge bg="info">{bankAccount.account_type_text}</Badge>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="fw-bold">Para Birimi:</td>
                                                        <td>
                                                            <span className="fw-bold">
                                                                {getCurrencyFlag(bankAccount.currency)} {bankAccount.currency}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </Table>
                                        </Col>
                                        <Col md={6}>
                                            <Table borderless>
                                                <tbody>
                                                    <tr>
                                                        <td className="fw-bold">Hesap No:</td>
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                <span className="me-2">{bankAccount.account_number}</span>
                                                                <Button
                                                                    variant="outline-secondary"
                                                                    size="sm"
                                                                    onClick={() => copyToClipboard(bankAccount.account_number)}
                                                                >
                                                                    <i className="ri ri-file-copy-line"></i>
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {bankAccount.iban && (
                                                        <tr>
                                                            <td className="fw-bold">IBAN:</td>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <span className="me-2 font-monospace">{bankAccount.iban}</span>
                                                                    <Button
                                                                        variant="outline-secondary"
                                                                        size="sm"
                                                                        onClick={() => copyToClipboard(bankAccount.iban!)}
                                                                    >
                                                                        <i className="ri ri-file-copy-line"></i>
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                    {bankAccount.swift_code && (
                                                        <tr>
                                                            <td className="fw-bold">SWIFT Kodu:</td>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <span className="me-2 font-monospace">{bankAccount.swift_code}</span>
                                                                    <Button
                                                                        variant="outline-secondary"
                                                                        size="sm"
                                                                        onClick={() => copyToClipboard(bankAccount.swift_code!)}
                                                                    >
                                                                        <i className="ri ri-file-copy-line"></i>
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                    <tr>
                                                        <td className="fw-bold">Durum:</td>
                                                        <td>
                                                            <Badge bg={bankAccount.is_active ? 'success' : 'secondary'}>
                                                                {bankAccount.is_active ? '✅ Aktif' : '❌ Pasif'}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="fw-bold">Varsayılan:</td>
                                                        <td>
                                                            {bankAccount.is_default ? (
                                                                <Badge bg="success">
                                                                    <i className="fas fa-star"></i> Varsayılan Hesap
                                                                </Badge>
                                                            ) : (
                                                                <Badge bg="secondary">Varsayılan Değil</Badge>
                                                            )}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </Table>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            {/* Description */}
                            {bankAccount.description && (
                                <Card className="mb-4">
                                    <Card.Header>
                                        <h6 className="mb-0">Açıklama</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        <p className="mb-0">{bankAccount.description}</p>
                                    </Card.Body>
                                </Card>
                            )}

                            {/* Account Details for Display */}
                            <Card className="mb-4">
                                <Card.Header>
                                    <h6 className="mb-0">Hesap Bilgileri</h6>
                                </Card.Header>
                                <Card.Body>
                                    <div className="bg-light p-3 rounded">
                                        <div className="row">
                                            <div className="col-md-6">
                                                <div className="mb-2">
                                                    <strong>Banka:</strong> {bankAccount.bank_name}
                                                </div>
                                                <div className="mb-2">
                                                    <strong>Hesap Adı:</strong> {bankAccount.account_name}
                                                </div>
                                                {bankAccount.branch_name && (
                                                    <div className="mb-2">
                                                        <strong>Şube:</strong> {bankAccount.branch_name}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="col-md-6">
                                                <div className="mb-2">
                                                    <strong>Hesap No:</strong> {bankAccount.account_number}
                                                </div>
                                                {bankAccount.iban && (
                                                    <div className="mb-2">
                                                        <strong>IBAN:</strong> {bankAccount.iban}
                                                    </div>
                                                )}
                                                <div className="mb-2">
                                                    <strong>Para Birimi:</strong> {bankAccount.currency}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <small className="text-muted">
                                        <i className="fas fa-info-circle"></i> Bu bilgileri müşterilerinize ödeme talimatı olarak verebilirsiniz.
                                    </small>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col lg={4}>
                            {/* Status Information */}
                            <Card className="mb-4">
                                <Card.Header>
                                    <h6 className="mb-0">Durum Bilgileri</h6>
                                </Card.Header>
                                <Card.Body>
                                    <div className="mb-3">
                                        <Badge bg={bankAccount.is_active ? 'success' : 'secondary'} className="fs-6">
                                            {bankAccount.is_active ? '✅ Aktif' : '❌ Pasif'}
                                        </Badge>
                                    </div>

                                    {bankAccount.is_default && (
                                        <div className="mb-3">
                                            <Badge bg="success" className="fs-6">
                                                <i className="fas fa-star"></i> Varsayılan Hesap
                                            </Badge>
                                        </div>
                                    )}

                                    <div className="mb-2">
                                        <strong>Hesap Tipi:</strong> {bankAccount.account_type_text}
                                    </div>
                                    <div className="mb-2">
                                        <strong>Para Birimi:</strong> {getCurrencyFlag(bankAccount.currency)} {bankAccount.currency}
                                    </div>
                                </Card.Body>
                            </Card>

                            {/* Quick Actions */}
                            <Card className="mb-4">
                                <Card.Header>
                                    <h6 className="mb-0">Hızlı İşlemler</h6>
                                </Card.Header>
                                <Card.Body>
                                    <div className="d-grid gap-2">
                                        {bankAccount.iban && (
                                            <Button
                                                variant="outline-primary"
                                                onClick={() => copyToClipboard(bankAccount.iban!)}
                                            >
                                                <i className="ri ri-file-copy-line"></i> IBAN'ı Kopyala
                                            </Button>
                                        )}
                                        <Button
                                            variant="outline-primary"
                                            onClick={() => copyToClipboard(bankAccount.account_number)}
                                        >
                                            <i className="ri ri-file-copy-line"></i> Hesap No'yu Kopyala
                                        </Button>
                                        {bankAccount.swift_code && (
                                            <Button
                                                variant="outline-primary"
                                                onClick={() => copyToClipboard(bankAccount.swift_code!)}
                                            >
                                                <i className="ri ri-file-copy-line"></i> SWIFT Kodu Kopyala
                                            </Button>
                                        )}
                                        <hr />
                                        <Link
                                            href={route('accounting.collections.create', { bank_account_id: bankAccount.id })}
                                            className="btn btn-success"
                                        >
                                            <i className="fas fa-plus"></i> Bu Hesapla Tahsilat Yap
                                        </Link>
                                    </div>
                                </Card.Body>
                            </Card>

                            {/* System Information */}
                            <Card>
                                <Card.Header>
                                    <h6 className="mb-0">Sistem Bilgileri</h6>
                                </Card.Header>
                                <Card.Body>
                                    <div className="mb-2">
                                        <strong>Oluşturma Tarihi:</strong> {formatDateTime(bankAccount.created_at)}
                                    </div>
                                    <div className="mb-2">
                                        <strong>Güncelleme Tarihi:</strong> {formatDateTime(bankAccount.updated_at)}
                                    </div>
                                    <div className="mb-2">
                                        <strong>Hesap ID:</strong> #{bankAccount.id}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </div>
        </Layout>
    );
}
