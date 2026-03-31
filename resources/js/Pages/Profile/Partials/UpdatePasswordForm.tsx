import React, { useRef } from 'react';
import { useForm } from '@inertiajs/react';
import { Transition } from '@headlessui/react';
import { Button, Card, Col, Form, Row } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import InputError from '../../../Components/InputError';

export default function UpdatePasswordForm({ className = '' }) {
    const { t } = useTranslation();
    const passwordInput: any = useRef();
    const currentPasswordInput: any = useRef();

    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = (e: any) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current.focus();
                }

                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current.focus();
                }
            },
        });
    };

    return (
        <React.Fragment>
            <Card className="shadow-sm">
                <Card.Header className="bg-light">
                    <h5 className="card-title mb-0">
                        <i className="ri-lock-line me-2"></i>
                        {t('Update Password')}
                    </h5>
                </Card.Header>
                <Card.Body>
                    <p className="text-muted mb-4">
                        {t('Ensure your account is using a long, random password to stay secure.')}
                    </p>
                    
                    <Form onSubmit={updatePassword}>
                        <Row className="mb-3">
                            <Col lg={12}>
                                <Form.Group>
                                    <Form.Label htmlFor="current_password">
                                        {t('Current Password')} <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        id="current_password"
                                        ref={currentPasswordInput}
                                        value={data.current_password}
                                        onChange={(e: any) => setData('current_password', e.target.value)}
                                        type="password"
                                        autoComplete="current-password"
                                        isInvalid={!!errors.current_password}
                                        required
                                    />
                                    <InputError message={errors.current_password} />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col lg={6}>
                                <Form.Group>
                                    <Form.Label htmlFor="password">
                                        {t('New Password')} <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        id="password"
                                        ref={passwordInput}
                                        value={data.password}
                                        onChange={(e: any) => setData('password', e.target.value)}
                                        type="password"
                                        autoComplete="new-password"
                                        isInvalid={!!errors.password}
                                        required
                                    />
                                    <InputError message={errors.password} />
                                    <Form.Text className="text-muted">
                                        {t('Password must be at least 8 characters long.')}
                                    </Form.Text>
                                </Form.Group>
                            </Col>

                            <Col lg={6}>
                                <Form.Group>
                                    <Form.Label htmlFor="password_confirmation">
                                        {t('Confirm Password')} <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        id="password_confirmation"
                                        value={data.password_confirmation}
                                        onChange={(e: any) => setData('password_confirmation', e.target.value)}
                                        type="password"
                                        autoComplete="new-password"
                                        isInvalid={!!errors.password_confirmation}
                                        required
                                    />
                                    <InputError message={errors.password_confirmation} />
                                </Form.Group>
                            </Col>
                        </Row>

                        <div className="d-flex justify-content-end mt-4">
                            <Button variant="primary" disabled={processing} type="submit">
                                <i className="ri-save-line me-2"></i>
                                {processing ? t('Updating...') : t('Update Password')}
                            </Button>
                            
                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <span className="text-success ms-3">
                                    <i className="ri-check-line me-1"></i>
                                    {t('Password updated successfully!')}
                                </span>
                            </Transition>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </React.Fragment>
    );
}
