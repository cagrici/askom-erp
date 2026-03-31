import React from 'react';
import { Head } from '@inertiajs/react';
import Layout from '../../Layouts';

interface Props {
    title: string;
    module: string;
    description: string;
}

export default function ComingSoon({ title, module, description }: Props) {
    return (
        <Layout>
            <Head title={title} />

            <div className="page-header d-print-none">
                <div className="container-xl">
                    <div className="row g-2 align-items-center">
                        <div className="col">
                            <h2 className="page-title">
                                {title}
                            </h2>
                        </div>
                    </div>
                </div>
            </div>

            <div className="page-body">
                <div className="container-xl">
                    <div className="row justify-content-center">
                        <div className="col-md-8 col-lg-6">
                            <div className="card">
                                <div className="card-body text-center py-5">
                                    <div className="mb-4">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="icon icon-tabler icon-tabler-tool text-muted"
                                            width="96"
                                            height="96"
                                            viewBox="0 0 24 24"
                                            strokeWidth="1.5"
                                            stroke="currentColor"
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                            <path d="M7 10h3v-3l-3.5 -3.5a6 6 0 0 1 8 8l6 6a2 2 0 0 1 -3 3l-6 -6a6 6 0 0 1 -8 -8l3.5 3.5" />
                                        </svg>
                                    </div>

                                    <h2 className="mb-3">{title}</h2>

                                    <p className="text-muted fs-4 mb-4">
                                        {description}
                                    </p>

                                    <div className="alert alert-info d-inline-block mb-0">
                                        <div className="d-flex align-items-center">
                                            <div>
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="icon alert-icon"
                                                    width="24"
                                                    height="24"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth="2"
                                                    stroke="currentColor"
                                                    fill="none"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                                    <path d="M12 9v4" />
                                                    <path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z" />
                                                    <path d="M12 16h.01" />
                                                </svg>
                                            </div>
                                            <div className="ms-2">
                                                <strong>Çok yakında!</strong> Bu sayfa şu anda hazırlanmaktadır.
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <a
                                            href="/purchasing/requests"
                                            className="btn btn-primary"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="icon icon-tabler icon-tabler-arrow-left"
                                                width="24"
                                                height="24"
                                                viewBox="0 0 24 24"
                                                strokeWidth="2"
                                                stroke="currentColor"
                                                fill="none"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                                <path d="M5 12l14 0" />
                                                <path d="M5 12l6 6" />
                                                <path d="M5 12l6 -6" />
                                            </svg>
                                            Satınalma Taleplerine Dön
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
