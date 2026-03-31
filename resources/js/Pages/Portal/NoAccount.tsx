import React from 'react';
import { Head, Link } from '@inertiajs/react';

interface Props {
    message: string;
}

const NoAccount: React.FC<Props> = ({ message }) => {
    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
            <Head title="Cari Hesap Bulunamadı" />

            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-6">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body text-center p-5">
                                <div className="mb-4">
                                    <i className="bx bx-error-circle text-warning" style={{ fontSize: '80px' }}></i>
                                </div>

                                <h3 className="mb-3">Cari Hesap Bulunamadı</h3>

                                <p className="text-muted mb-4">
                                    {message || 'Hesabınıza atanmış bir cari bulunamadı.'}
                                </p>

                                <div className="alert alert-info text-start">
                                    <strong>Ne yapmalıyım?</strong>
                                    <ul className="mb-0 mt-2">
                                        <li>Yöneticinizle iletişime geçin</li>
                                        <li>Cari hesap ataması yapılmasını talep edin</li>
                                        <li>Atama yapıldıktan sonra tekrar giriş yapın</li>
                                    </ul>
                                </div>

                                <div className="d-flex gap-2 justify-content-center mt-4">
                                    <Link
                                        href={route('dashboard')}
                                        className="btn btn-primary"
                                    >
                                        <i className="bx bx-home me-2"></i>
                                        Ana Sayfaya Dön
                                    </Link>

                                    <Link
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                        className="btn btn-outline-secondary"
                                    >
                                        <i className="bx bx-log-out me-2"></i>
                                        Çıkış Yap
                                    </Link>
                                </div>

                                <div className="mt-4 pt-4 border-top">
                                    <p className="text-muted small mb-0">
                                        <i className="bx bx-info-circle me-1"></i>
                                        Destek için: <a href="mailto:destek@firma.com">destek@firma.com</a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NoAccount;
