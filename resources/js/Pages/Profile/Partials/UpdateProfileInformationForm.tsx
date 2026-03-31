import InputError from '../../../Components/InputError';
import { Link, useForm, usePage } from '@inertiajs/react';
import { Transition } from '@headlessui/react';
import { Button, Card, Col, Form, Row } from 'react-bootstrap';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function UpdateProfileInformation({ mustVerifyEmail, status, className = '' }: any) {
    const { t } = useTranslation();
    const user = usePage().props.auth.user;

    const { data, setData, post, errors, processing, recentlySuccessful } = useForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        name: user.name || '',
        email: user.email || '',
        username: user.username || '',
        phone: user.phone || '',
        position: user.position || '',
        avatar: null as File | null,
        _method: 'PATCH' as const,
    });

    // Avatar preview state
    const [avatarPreview, setAvatarPreview] = useState<string | null>(
        user.avatar ? `/storage/${user.avatar}` : (user.avatar || null)
    );

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('avatar', file);

            // Create preview URL
            const previewUrl = URL.createObjectURL(file);
            setAvatarPreview(previewUrl);
        }
    };

    const submit = (e: any) => {
        e.preventDefault();

        post(route('profile.update'), {
            forceFormData: true,
        });
    };

    return (
        <React.Fragment>
            <Card className="shadow-sm">
                <Card.Header className="bg-light">
                    <h5 className="card-title mb-0">
                        <i className="ri-user-line me-2"></i>
                        {t('Profile Information')}
                    </h5>
                </Card.Header>
                <Card.Body>
                    <p className="text-muted mb-4">
                        {t('Update your account profile information and email address.')}
                    </p>

                    <Form onSubmit={submit}>
                        {/* Avatar Section */}
                        <Row className="mb-4">
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>{t('Profile Picture')}</Form.Label>
                                    <div className="d-flex align-items-center gap-3">
                                        <div>
                                            <img
                                                src={avatarPreview || '/images/users/user-dummy-img.jpg'}
                                                alt={t('Profile Picture')}
                                                className="rounded-circle"
                                                style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                                onError={(e) => {
                                                    e.currentTarget.src = '/images/users/user-dummy-img.jpg';
                                                }}
                                            />
                                        </div>
                                        <div className="flex-grow-1">
                                            <Form.Control
                                                type="file"
                                                accept="image/*"
                                                onChange={handleAvatarChange}
                                                isInvalid={!!errors.avatar}
                                            />
                                            {errors.avatar && (
                                                <Form.Control.Feedback type="invalid">{errors.avatar}</Form.Control.Feedback>
                                            )}
                                            <Form.Text className="text-muted">
                                                {t('Allowed formats: JPG, PNG, GIF. Max size: 2MB.')}
                                            </Form.Text>
                                        </div>
                                    </div>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>{t('First Name')} <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={data.first_name}
                                        onChange={(e) => setData('first_name', e.target.value)}
                                        isInvalid={!!errors.first_name}
                                        required
                                    />
                                    <InputError message={errors.first_name} />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>{t('Last Name')} <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={data.last_name}
                                        onChange={(e) => setData('last_name', e.target.value)}
                                        isInvalid={!!errors.last_name}
                                        required
                                    />
                                    <InputError message={errors.last_name} />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>{t('Username')}</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={data.username}
                                        onChange={(e) => setData('username', e.target.value)}
                                        isInvalid={!!errors.username}
                                    />
                                    <InputError message={errors.username} />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>{t('Email')} <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        isInvalid={!!errors.email}
                                        required
                                    />
                                    <InputError message={errors.email} />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>{t('Phone')}</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        isInvalid={!!errors.phone}
                                    />
                                    <InputError message={errors.phone} />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>{t('Position')}</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={data.position}
                                        onChange={(e) => setData('position', e.target.value)}
                                        isInvalid={!!errors.position}
                                    />
                                    <InputError message={errors.position} />
                                </Form.Group>
                            </Col>
                        </Row>

                        {mustVerifyEmail && user.email_verified_at === null && (
                            <div className="alert alert-warning">
                                <p className="mb-2">
                                    {t('Your email address is unverified.')}
                                </p>
                                <Link
                                    href={route('verification.send')}
                                    method="post"
                                    as="button"
                                    className="btn btn-sm btn-outline-primary"
                                >
                                    {t('Click here to re-send the verification email.')}
                                </Link>

                                {status === 'verification-link-sent' && (
                                    <div className="mt-2 text-success">
                                        {t('A new verification link has been sent to your email address.')}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="d-flex justify-content-end mt-4">
                            <Button variant="primary" disabled={processing} type="submit">
                                <i className="ri-save-line me-2"></i>
                                {processing ? t('Saving...') : t('Save Changes')}
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
                                    {t('Saved successfully!')}
                                </span>
                            </Transition>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </React.Fragment>
    );
}
