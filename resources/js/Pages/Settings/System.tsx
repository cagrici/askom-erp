import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import Layout from '../../Layouts';
import { Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';

interface Setting {
    id: number;
    key: string;
    value: string | number | boolean;
    type: string;
    group: string;
    description: string | null;
    is_public: boolean;
}

interface Props {
    settings: Record<string, Setting>;
}

export default function System({ settings = {} }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        maintenance_mode: settings.maintenance_mode?.value === true || settings.maintenance_mode?.value === '1' || false,
        debug_mode: settings.debug_mode?.value === true || settings.debug_mode?.value === '1' || false,
        cache_enabled: settings.cache_enabled?.value === true || settings.cache_enabled?.value === '1' || true,
        pagination_per_page: settings.pagination_per_page?.value || 20,
        session_lifetime: settings.session_lifetime?.value || 120,
        max_upload_size: settings.max_upload_size?.value || 10,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('settings.system.update'), {
            preserveScroll: true,
        });
    };

    return (
        <Layout>
            <Head title="Sistem Ayarları" />
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Sistem Ayarları</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item">
                                            <Link href={route('dashboard')}>Dashboard</Link>
                                        </li>
                                        <li className="breadcrumb-item">Ayarlar</li>
                                        <li className="breadcrumb-item active">Sistem</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Settings Navigation Tabs */}
                    <div className="row mb-3">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-body">
                                    <ul className="nav nav-pills" role="tablist">
                                        <li className="nav-item">
                                            <Link
                                                href={route('settings.general')}
                                                className="nav-link"
                                            >
                                                <i className="ri-settings-3-line me-1"></i>
                                                Genel
                                            </Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link
                                                href={route('settings.system')}
                                                className="nav-link active"
                                            >
                                                <i className="ri-server-line me-1"></i>
                                                Sistem
                                            </Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link
                                                href={route('settings.email')}
                                                className="nav-link"
                                            >
                                                <i className="ri-mail-line me-1"></i>
                                                E-posta
                                            </Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link
                                                href={route('settings.backup')}
                                                className="nav-link"
                                            >
                                                <i className="ri-database-2-line me-1"></i>
                                                Yedekleme
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col lg={6}>
                                {/* System Mode Settings */}
                                <Card>
                                    <Card.Header>
                                        <h5 className="card-title mb-0">Sistem Modu</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <div className="mb-3">
                                            <Form.Check
                                                type="switch"
                                                id="maintenance_mode"
                                                label="Bakım Modu"
                                                checked={data.maintenance_mode}
                                                onChange={(e) => setData('maintenance_mode', e.target.checked)}
                                            />
                                            <Form.Text className="text-muted">
                                                Bakım modu aktifken sadece yöneticiler sisteme erişebilir.
                                            </Form.Text>
                                        </div>

                                        <div className="mb-3">
                                            <Form.Check
                                                type="switch"
                                                id="debug_mode"
                                                label="Hata Ayıklama Modu"
                                                checked={data.debug_mode}
                                                onChange={(e) => setData('debug_mode', e.target.checked)}
                                            />
                                            <Form.Text className="text-muted">
                                                Debug modu aktifken detaylı hata mesajları görüntülenir.
                                            </Form.Text>
                                        </div>

                                        <div className="mb-0">
                                            <Form.Check
                                                type="switch"
                                                id="cache_enabled"
                                                label="Önbellek"
                                                checked={data.cache_enabled}
                                                onChange={(e) => setData('cache_enabled', e.target.checked)}
                                            />
                                            <Form.Text className="text-muted">
                                                Önbellek performansı artırır ancak bazı değişikliklerin görünmesi gecikebilir.
                                            </Form.Text>
                                        </div>
                                    </Card.Body>
                                </Card>

                                {data.maintenance_mode && (
                                    <Alert variant="warning">
                                        <i className="ri-alert-line me-2"></i>
                                        Bakım modu aktif! Normal kullanıcılar sisteme erişemeyecek.
                                    </Alert>
                                )}

                                {data.debug_mode && (
                                    <Alert variant="danger">
                                        <i className="ri-bug-line me-2"></i>
                                        Debug modu aktif! Üretim ortamında bu modu kapalı tutmanız önerilir.
                                    </Alert>
                                )}
                            </Col>

                            <Col lg={6}>
                                {/* Performance Settings */}
                                <Card>
                                    <Card.Header>
                                        <h5 className="card-title mb-0">Performans Ayarları</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <div className="mb-3">
                                            <Form.Label>Sayfa Başına Kayıt</Form.Label>
                                            <Form.Control
                                                type="number"
                                                min={5}
                                                max={100}
                                                value={data.pagination_per_page}
                                                onChange={(e) => setData('pagination_per_page', parseInt(e.target.value) || 20)}
                                                isInvalid={!!errors.pagination_per_page}
                                            />
                                            <Form.Text className="text-muted">
                                                Listelerde sayfa başına gösterilecek kayıt sayısı (5-100)
                                            </Form.Text>
                                            <Form.Control.Feedback type="invalid">
                                                {errors.pagination_per_page}
                                            </Form.Control.Feedback>
                                        </div>

                                        <div className="mb-3">
                                            <Form.Label>Oturum Süresi (dakika)</Form.Label>
                                            <Form.Control
                                                type="number"
                                                min={5}
                                                max={1440}
                                                value={data.session_lifetime}
                                                onChange={(e) => setData('session_lifetime', parseInt(e.target.value) || 120)}
                                                isInvalid={!!errors.session_lifetime}
                                            />
                                            <Form.Text className="text-muted">
                                                Kullanıcı oturumunun aktif kalacağı süre (5-1440 dakika)
                                            </Form.Text>
                                            <Form.Control.Feedback type="invalid">
                                                {errors.session_lifetime}
                                            </Form.Control.Feedback>
                                        </div>

                                        <div className="mb-0">
                                            <Form.Label>Maksimum Dosya Boyutu (MB)</Form.Label>
                                            <Form.Control
                                                type="number"
                                                min={1}
                                                max={100}
                                                value={data.max_upload_size}
                                                onChange={(e) => setData('max_upload_size', parseInt(e.target.value) || 10)}
                                                isInvalid={!!errors.max_upload_size}
                                            />
                                            <Form.Text className="text-muted">
                                                Yüklenebilecek maksimum dosya boyutu (1-100 MB)
                                            </Form.Text>
                                            <Form.Control.Feedback type="invalid">
                                                {errors.max_upload_size}
                                            </Form.Control.Feedback>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>

                        <div className="row mt-3">
                            <div className="col-12">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Kaydediliyor...
                                        </>
                                    ) : (
                                        <>
                                            <i className="ri-save-line me-1"></i>
                                            Kaydet
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </Form>
                </div>
            </div>
        </Layout>
    );
}
