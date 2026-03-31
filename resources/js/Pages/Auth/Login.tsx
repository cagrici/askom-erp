import React, { useEffect, useState } from 'react';
import GuestLayout from '../../Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import logoLight from "../../../images/logo-light.png";
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
export default function Login({ status, canResetPassword }: any) {

    const [passwordShow, setPasswordShow] = useState<boolean>(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
        use_uyumsoft_password:false,
    });

    const {t} = useTranslation();

    useEffect(() => {
        return () => {
            reset('password');
        };
    }, []);
    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        localStorage.setItem("I18N_LANGUAGE", lng);
    };
    const submit = (e: any) => {
        e.preventDefault();

        post(route('login'), {
            onError: (errors) => {
                console.error('Login error:', errors);
                // CSRF hatası varsa sayfayı yenile
                if (errors.message && errors.message.includes('419')) {
                    console.warn('CSRF token expired during login, refreshing page...');
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                }
            }
        });
    };

    return (
        <React.Fragment>
            <GuestLayout>
                <Head title={ t('Sign in to Portal') } />
                <div className="auth-page-content mt-lg-5">
                    <Container>
                        <Row>
                            <Col lg={12}>
                                <div className="text-center mt-sm-5 mb-4 text-white-50">
                                    <div>
                                        <Link href='/' className="d-inline-block auth-logo">
                                            <img src={logoLight} alt="" height="60" />
                                        </Link>
                                    </div>
                                    <p className="mt-3 fs-15 fw-medium">{ t('Portal') }</p>
                                </div>
                            </Col>
                        </Row>

                        <Row className="justify-content-center">
                            <Col md={8} lg={6} xl={5}>
                                <Card className="mt-4">
                                    <Card.Body className='p-4'>
                                        <div className="text-center mt-2">
                                            <h5 className="text-primary">{t('Welcome Back !')}</h5>
                                            <p className="text-muted">{ t('Sign in to continue to Portal')}</p>
                                        </div>
                                        {status && <div className="mb-4 font-medium text-sm text-green-600">{status}</div>}
                                        <div className='p-2 mt-4'>
                                            <Form onSubmit={submit}>
                                                <div className='mb-3'>
                                                    <Form.Label className='form-label' htmlFor="email" value="Email" > {t('Email')} </Form.Label>
                                                    <span className="text-danger ms-1">*</span>
                                                    <Form.Control
                                                        id="email"
                                                        type="email"
                                                        name="email"
                                                        placeholder={ t('Enter Email')}
                                                        value={data.email}
                                                        className={'mb-1 ' + (errors.email ? 'is-invalid' : ' ')}
                                                        autoComplete="username"
                                                        autoFocus
                                                        required
                                                        onChange={(e: any) => setData('email', e.target.value)}
                                                    />

                                                    <Form.Control.Feedback type="invalid" className='d-block mt-2'> {errors.email} </Form.Control.Feedback>
                                                </div>

                                                <div className="mb-3">
                                                    <div className="float-end">

                                                        {canResetPassword && (
                                                            <Link href={route('password.request')} className="text-muted">
                                                                {t('Forgot Password ?')}
                                                            </Link>
                                                        )}
                                                    </div>

                                                    <Form.Label className='form-label' htmlFor="password" value="Password" > {t('Password')} </Form.Label>
                                                    <span className="text-danger ms-1">*</span>
                                                    <div className="position-relative auth-pass-inputgroup mb-3">

                                                        <Form.Control
                                                            id="password"
                                                            type={passwordShow ? "text" : "password"}
                                                            name="password"
                                                            value={data.password}
                                                            placeholder={t('Enter Password')}
                                                            required
                                                            className={'mt-1 ' + (errors.password ? 'is-invalid' : ' ')}
                                                            autoComplete="current-password"
                                                            onChange={(e: any) => setData('password', e.target.value)}
                                                        />

                                                        <Form.Control.Feedback type="invalid" className='d-block mt-2'> {errors.password} </Form.Control.Feedback>
                                                        <button className="btn btn-link position-absolute end-0 top-0 text-decoration-none text-muted" type="button" id="password-addon" onClick={() => setPasswordShow(!passwordShow)}><i className="ri-eye-fill align-middle"></i></button>
                                                    </div>
                                                </div>

                                                <div className="block mt-4">
                                                    <label className="flex items-center">
                                                        <Form.Check.Input
                                                            className='form-check-input'
                                                            name="remember"
                                                            checked={data.remember}
                                                            onChange={(e: any) => setData('remember', e.target.checked)}
                                                        />
                                                        <Form.Check.Label className="form-check-label" htmlFor="auth-remember-check">
                                                            <span className='ms-2'>{t('Remember me')}</span>
                                                        </Form.Check.Label>

                                                    </label>
                                                </div>


                                                <div className="mt-4">

                                                    <Button type="submit" className="btn btn-secondary w-100" disabled={processing}>
                                                        { t('Sign In')}
                                                    </Button>
                                                </div>


                                            </Form>
                                        </div>
                                    </Card.Body>
                                </Card>
                                <div className="mt-4 text-center">
                                    <p className="mb-0">{t('Don\'t have an account ?')} <Link href={route('register')} className="fw-semibold text-primary text-decoration-underline"> {t('Signup')} </Link> </p>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </div>

            </GuestLayout>
        </React.Fragment>
    );
}

