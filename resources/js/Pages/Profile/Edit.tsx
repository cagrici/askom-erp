import React from 'react';
import Layout from '../../Layouts';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { Head } from '@inertiajs/react';
import { Col, Container, Row, Card } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

export default function Edit({ auth, mustVerifyEmail, status }: any) {
    const { t } = useTranslation();
    
    return (
        <React.Fragment>
            <Layout>
                <Head title={t('Profile Settings')} />
                <div className='page-content'>
                    <Container fluid className="px-4">
                        {/* Page Title */}
                        <div className="row">
                            <div className="col-12">
                                <div className="page-title-box d-sm-flex align-items-center justify-content-between mb-4">
                                    <h4 className="mb-sm-0">{t('Profile Settings')}</h4>
                                    <div className="page-title-right">
                                        <ol className="breadcrumb m-0">
                                            <li className="breadcrumb-item">
                                                <a href={route('dashboard')}>{t('Dashboard')}</a>
                                            </li>
                                            <li className="breadcrumb-item active">{t('Profile Settings')}</li>
                                        </ol>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Row>
                            <Col lg={12}>
                                <UpdateProfileInformationForm
                                    mustVerifyEmail={mustVerifyEmail}
                                    status={status}
                                />
                            </Col>
                        </Row>
                        
                        <Row className="mt-4">
                            <Col lg={12}>
                                <UpdatePasswordForm />
                            </Col>
                        </Row>
                        
                        <Row className="mt-4">
                            <Col lg={12}>
                                <DeleteUserForm />
                            </Col>
                        </Row>
                    </Container>
                </div>
            </Layout>
        </React.Fragment>
    );
}
