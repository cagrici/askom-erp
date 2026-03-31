import React from 'react';
import { Head, Link } from '@inertiajs/react';
import Layout from '../../../Layouts';

export default function Show() {
    return (
        <Layout>
            <Head title="Kasa Detayı" />
            <div className="page-content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Kasa Detayı</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item">
                                            <Link href={route('dashboard')}>Dashboard</Link>
                                        </li>
                                        <li className="breadcrumb-item">Muhasebe</li>
                                        <li className="breadcrumb-item">
                                            <Link href={route('accounting.cash.index')}>Kasa İşlemleri</Link>
                                        </li>
                                        <li className="breadcrumb-item active">Detay</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-body text-center py-5">
                                    <i className="fas fa-tools fa-3x text-muted mb-3"></i>
                                    <h4 className="text-muted">Kasa Detay Sayfası</h4>
                                    <p className="text-muted">Bu sayfa henüz geliştirilme aşamasındadır.</p>
                                    <Link
                                        href={route('accounting.cash.index')}
                                        className="btn btn-primary mt-3"
                                    >
                                        <i className="fas fa-arrow-left me-1"></i>
                                        Kasa Listesine Dön
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
