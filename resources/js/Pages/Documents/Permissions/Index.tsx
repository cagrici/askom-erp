
// resources/js/Pages/Documents/Permissions/Index.tsx
import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button, Card, Container, Table, Badge, Form, Row, Col, Alert, Tab, Tabs } from 'react-bootstrap';
import { FiSave, FiArrowLeft, FiTrash2, FiPlus } from 'react-icons/fi';

import Layout from '../../../Layouts';

interface User {
    id: number;
    name: string;
    email: string;
}

interface Role {
    id: number;
    name: string;
}

interface DocumentPermission {
    id: number;
    document_id: number;
    user_id: number | null;
    role_id: number | null;
    can_view: boolean;
    can_edit: boolean;
    can_delete: boolean;
    can_share: boolean;
    user: User | null;
    role: Role | null;
}

interface Document {
    id: number;
    title: string;
    permissions: DocumentPermission[];
}

interface Props {
    document: Document;
    users: User[];
    roles: Role[];
    flash?: {
        success?: string;
        error?: string;
    };
}

const DocumentPermissionsIndex: React.FC<Props> = ({ document, users, roles, flash = {} }) => {
    const [activeTab, setActiveTab] = useState<string>('users');
    const [flashMessage, setFlashMessage] = useState<{type: string, message: string} | null>(
        flash?.success ? {type: 'success', message: flash.success} :
            flash?.error ? {type: 'danger', message: flash.error} : null
    );

    // Kullanıcı bazlı izin ekleme formu
    const { data: userData, setData: setUserData, post: postUserData, processing: processingUser, errors: userErrors, reset: resetUser } = useForm({
        document_id: document.id,
        user_id: '',
        can_view: true,
        can_edit: false,
        can_delete: false,
        can_share: false
    });

    // Rol bazlı izin ekleme formu
    const { data: roleData, setData: setRoleData, post: postRoleData, processing: processingRole, errors: roleErrors, reset: resetRole } = useForm({
        document_id: document.id,
        role_id: '',
        can_view: true,
        can_edit: false,
        can_delete: false,
        can_share: false
    });

    const handleUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setUserData(name as any, val);
    };

    const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setRoleData(name as any, val);
    };

    const handleUserSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        postUserData(route('document-permissions.store', document.id), {
            onSuccess: () => {
                resetUser('user_id');
            }
        });
    };

    const handleRoleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        postRoleData(route('document-permissions.store', document.id), {
            onSuccess: () => {
                resetRole('role_id');
            }
        });
    };

    // Kullanıcı bazlı izinleri filtrele
    const userPermissions = document.permissions.filter(p => p.user_id !== null);

    // Rol bazlı izinleri filtrele
    const rolePermissions = document.permissions.filter(p => p.role_id !== null);

    // Clear flash messages after 5 seconds
    React.useEffect(() => {
        if (flashMessage) {
            const timeout = setTimeout(() => {
                setFlashMessage(null);
            }, 5000);

            return () => clearTimeout(timeout);
        }
    }, [flashMessage]);

    return (
        <React.Fragment>
            <Head title={`İzinler - ${document.title}`} />
            <div className="page-content">
                <Container fluid>
                    {flashMessage && (
                        <Alert variant={flashMessage.type} dismissible onClose={() => setFlashMessage(null)}>
                            {flashMessage.message}
                        </Alert>
                    )}

                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div className="d-flex align-items-center">
                            <h1 className="mb-0 me-3">Belge İzinleri</h1>
                            <h5 className="text-muted mb-0">{document.title}</h5>
                        </div>
                        <div>
                            <Link href={route('documents.show', document.id)} className="btn btn-secondary">
                                <FiArrowLeft className="me-1" /> Belgeye Dön
                            </Link>
                        </div>
                    </div>

                    <Card>
                        <Card.Body>
                            <Tabs
                                activeKey={activeTab}
                                onSelect={(k) => setActiveTab(k || 'users')}
                                className="mb-4"
                            >
                                <Tab eventKey="users" title="Kullanıcı İzinleri">
                                    <Row>
                                        <Col md={7}>
                                            <h5 className="mb-3">Kullanıcı İzinleri</h5>
                                            {userPermissions.length === 0 ? (
                                                <Alert variant="info">
                                                    Henüz hiçbir kullanıcıya özel izin atanmamış.
                                                </Alert>
                                            ) : (
                                                <Table responsive hover>
                                                    <thead>
                                                    <tr>
                                                        <th>Kullanıcı</th>
                                                        <th className="text-center">Görüntüleme</th>
                                                        <th className="text-center">Düzenleme</th>
                                                        <th className="text-center">Silme</th>
                                                        <th className="text-center">Paylaşım</th>
                                                        <th></th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {userPermissions.map((permission) => (
                                                        <tr key={permission.id}>
                                                            <td>
                                                                <strong>{permission.user?.name}</strong><br />
                                                                <small className="text-muted">{permission.user?.email}</small>
                                                            </td>
                                                            <td className="text-center">
                                                                {permission.can_view ? (
                                                                    <Badge bg="success">Evet</Badge>
                                                                ) : (
                                                                    <Badge bg="danger">Hayır</Badge>
                                                                )}
                                                            </td>
                                                            <td className="text-center">
                                                                {permission.can_edit ? (
                                                                    <Badge bg="success">Evet</Badge>
                                                                ) : (
                                                                    <Badge bg="danger">Hayır</Badge>
                                                                )}
                                                            </td>
                                                            <td className="text-center">
                                                                {permission.can_delete ? (
                                                                    <Badge bg="success">Evet</Badge>
                                                                ) : (
                                                                    <Badge bg="danger">Hayır</Badge>
                                                                )}
                                                            </td>
                                                            <td className="text-center">
                                                                {permission.can_share ? (
                                                                    <Badge bg="success">Evet</Badge>
                                                                ) : (
                                                                    <Badge bg="danger">Hayır</Badge>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <Link href={route('document-permissions.destroy', permission.id)} method="delete" as="button" className="btn btn-sm btn-danger">
                                                                    <FiTrash2 />
                                                                </Link>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    </tbody>
                                                </Table>
                                            )}
                                        </Col>
                                        <Col md={5}>
                                            <Card className="bg-light">
                                                <Card.Body>
                                                    <h5 className="mb-3">Kullanıcı İzni Ekle</h5>
                                                    <Form onSubmit={handleUserSubmit}>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label>Kullanıcı <span className="text-danger">*</span></Form.Label>
                                                            <Form.Select
                                                                name="user_id"
                                                                value={userData.user_id}
                                                                onChange={handleUserChange}
                                                                isInvalid={!!userErrors.user_id}
                                                                required
                                                            >
                                                                <option value="">Kullanıcı Seçin</option>
                                                                {users.map(user => (
                                                                    <option key={user.id} value={user.id}>
                                                                        {user.name} ({user.email})
                                                                    </option>
                                                                ))}
                                                            </Form.Select>
                                                            {userErrors.user_id && (
                                                                <Form.Control.Feedback type="invalid">
                                                                    {userErrors.user_id}
                                                                </Form.Control.Feedback>
                                                            )}
                                                        </Form.Group>

                                                        <div className="mb-3 border p-3 rounded">
                                                            <h6 className="mb-3">İzinler</h6>
                                                            <Form.Check
                                                                type="checkbox"
                                                                id="user-can-view"
                                                                label="Görüntüleme"
                                                                name="can_view"
                                                                checked={userData.can_view}
                                                                onChange={handleUserChange}
                                                                className="mb-2"
                                                            />
                                                            <Form.Check
                                                                type="checkbox"
                                                                id="user-can-edit"
                                                                label="Düzenleme"
                                                                name="can_edit"
                                                                checked={userData.can_edit}
                                                                onChange={handleUserChange}
                                                                className="mb-2"
                                                            />
                                                            <Form.Check
                                                                type="checkbox"
                                                                id="user-can-delete"
                                                                label="Silme"
                                                                name="can_delete"
                                                                checked={userData.can_delete}
                                                                onChange={handleUserChange}
                                                                className="mb-2"
                                                            />
                                                            <Form.Check
                                                                type="checkbox"
                                                                id="user-can-share"
                                                                label="Paylaşım (izinleri değiştirme)"
                                                                name="can_share"
                                                                checked={userData.can_share}
                                                                onChange={handleUserChange}
                                                            />
                                                        </div>

                                                        <div className="d-grid">
                                                            <Button type="submit" variant="primary" disabled={processingRole}>
                                                                <FiPlus className="me-1" /> {processingRole ? 'Ekleniyor...' : 'Rol İzni Ekle'}
                                                            </Button>
                                                        </div>
                                                    </Form>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </Row>
                                </Tab>
                            </Tabs>
                        </Card.Body>
                    </Card>
                </Container>
            </div>
        </React.Fragment>
    );
};

DocumentPermissionsIndex.layout = (page: any) => <Layout children={page} />
export default DocumentPermissionsIndex;
