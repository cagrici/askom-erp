import React from 'react';
import { Button, Card, Col, Container, Row, Form, } from 'react-bootstrap';

import AuthSlider from '../authCarousel';
import { useTranslation } from 'react-i18next';


//formik
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Head, Link } from '@inertiajs/react';

const CoverPasswReset = () => {

    const validation = useFormik({
        enableReinitialize: true,

        initialValues: {
            email: "",
        },
        validationSchema: Yup.object({
            email: Yup.string().required("Lütfen E-posta adresinizi giriniz"),
        }),
        onSubmit: (values) => {
        }
    });

    const {t} = useTranslation();
    return (
        <React.Fragment>
            <Head title = "Reset Password | UyumPro B2B Paneli"/>
            <div className="auth-page-wrapper auth-bg-cover py-5 d-flex justify-content-center align-items-center min-vh-100">
                <div className="bg-overlay"></div>
                <div className="auth-page-content overflow-hidden pt-lg-5">
                    <Container>
                        <Row>
                            <Col lg={12}>
                                <Card className="overflow-hidden">
                                    <Row className="justify-content-center g-0">
                                        <AuthSlider />

                                        <Col lg={6}>
                                            <div className="p-lg-5 p-4">
                                                <h5 className="text-primary">{t('Forgot Password?')}</h5>
                                                <p className="text-muted">{t('Reset password with Portal')}</p>

                                                <div className="mt-2 text-center">
                                                    <i className="ri-mail-send-line display-5 text-success"></i>
                                                </div>

                                                <div className="alert border-0 alert-warning text-center mb-2 mx-2" role="alert">
                                                    {t('Enter your email and instructions will be sent to you!')}
                                                </div>
                                                <div className="p-2">
                                                    <Form onSubmit={validation.handleSubmit}>
                                                        <div className="mb-4">
                                                            <Form.Label className="form-label">{t('Email')}</Form.Label>
                                                            <Form.Control
                                                                type="email"
                                                                className="form-control"
                                                                id="email"
                                                                placeholder={t('Enter email address')}
                                                                name="email"
                                                                value={validation.values.email}
                                                                onBlur={validation.handleBlur}
                                                                onChange={validation.handleChange}
                                                                isInvalid={validation.errors.email && validation.touched.email ? true : false}
                                                            />
                                                            {validation.errors.email && validation.touched.email ? (
                                                                <Form.Control.Feedback type="invalid">{validation.errors.email}</Form.Control.Feedback>
                                                            ) : null}
                                                        </div>

                                                        <div className="text-center mt-4">
                                                            <Button className="w-100 btn-secondary" type="submit">{t('Send Reset Link')}</Button>
                                                        </div>
                                                    </Form>
                                                </div>

                                                <div className="mt-5 text-center">
                                                    <p className="mb-0">{t('Wait, I remember my password...')} <Link href="/auth-signin-cover" className="fw-bold text-primary text-decoration-underline"> {t('Click here')} </Link> </p>
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>
                                </Card>
                            </Col>
                        </Row>
                    </Container>
                </div>
                <footer className="footer">
                    <Container>
                        <Row>
                            <Col lg={12}>
                                <div className="text-center">
                                    <p className="mb-0">&copy; {new Date().getFullYear()} Atilgan Group. Teknik destek: UyumPro. </p>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </footer>
            </div>
        </React.Fragment>
    );
};

export default CoverPasswReset;
