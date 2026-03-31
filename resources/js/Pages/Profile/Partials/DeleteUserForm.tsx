import React, { useRef, useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Button, Card, Col, Container, Form, Modal, Row } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import InputError from '../../../Components/InputError';

export default function DeleteUserForm({ className = '' }) {
    const { t } = useTranslation();
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState<boolean>(false);
    const passwordInput: any = useRef();

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (e: any) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);

        reset();
    };

    return (
        <React.Fragment>
            <Card className="shadow-sm border-danger">
                <Card.Header className="bg-danger-subtle">
                    <h5 className="card-title mb-0 text-danger">
                        <i className="ri-delete-bin-line me-2"></i>
                        {t('Delete Account')}
                    </h5>
                </Card.Header>
                <Card.Body>
                    <p className="text-muted mb-4">
                        {t('Once your account is deleted, all of its resources and data will be permanently deleted. Before deleting your account, please download any data or information that you wish to retain.')}
                    </p>
                    <Button 
                        variant="danger" 
                        onClick={confirmUserDeletion}
                        size="sm"
                    >
                        <i className="ri-delete-bin-line me-2"></i>
                        {t('Delete Account')}
                    </Button>
                </Card.Body>
            </Card>

            <Modal show={confirmingUserDeletion} onHide={closeModal} centered>
                <Modal.Header className="bg-danger-subtle" closeButton>
                    <h5 className='modal-title text-danger'>
                        <i className="ri-alert-line me-2"></i>
                        {t('Are you sure you want to delete your account?')}
                    </h5>
                </Modal.Header>
                <Form onSubmit={deleteUser}>
                    <Modal.Body>
                        <div className="alert alert-warning">
                            <i className="ri-warning-line me-2"></i>
                            <strong>{t('Warning!')} </strong>
                            {t('This action cannot be undone.')}
                        </div>
                        
                        <p className="mb-3">
                            {t('Once your account is deleted, all of its resources and data will be permanently deleted. Please enter your password to confirm you would like to permanently delete your account.')}
                        </p>
                        
                        <Form.Group>
                            <Form.Label htmlFor="password">{t('Password')}</Form.Label>
                            <Form.Control
                                id="password"
                                type="password"
                                name="password"
                                ref={passwordInput}
                                value={data.password}
                                onChange={(e: any) => setData('password', e.target.value)}
                                placeholder={t('Enter your password')}
                                isInvalid={!!errors.password}
                                required
                                autoFocus
                            />
                            <InputError message={errors.password} />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="light" onClick={closeModal}>
                            {t('Cancel')}
                        </Button>
                        <Button 
                            variant="danger" 
                            disabled={processing} 
                            type="submit"
                        >
                            {processing ? t('Deleting...') : t('Delete Account')}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </React.Fragment>
    );
}
