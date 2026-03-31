import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import Layout from "../../../Layouts";
interface WorkOrder {
    id: number;
    worder_no: string;
    product: {
        id: number;
        item_name: string;
    } | null;
    total_quantity: number;
    scanned_quantity: number;
    remaining_quantity: number;
    status_name: string;
    create_date: string;
}

interface Props extends PageProps {
    workOrders: {
        data: WorkOrder[];
        links: any[];
    };
}

export default function Index({ auth, workOrders }: Props) {
    return (
        <Layout>
            <Head title="Üretim İş Emirleri" />
            <div className="page-content">
            <div className="container-fluid py-4">
                <div className="row">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <h2 className="h4 mb-0">Bekleyen İş Emirleri</h2>
                                <Link
                                    href="/uretim/etiket-okut"
                                    className="btn btn-success"
                                >
                                    <i className="bi bi-qr-code-scan me-2"></i>
                                    Etiket Okutma
                                </Link>
                            </div>
                            <div className="card-body">
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>İş Emri No</th>
                                                <th>Ürün</th>
                                                <th>Toplam Adet</th>
                                                <th>Okutulan</th>
                                                <th>Kalan</th>
                                                <th>Durum</th>
                                                <th>Oluşturma Tarihi</th>
                                                <th>İşlemler</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {workOrders.data.map((workOrder) => (
                                                <tr key={workOrder.id}>
                                                    <td className="fw-bold">{workOrder.worder_no}</td>
                                                    <td>{workOrder.product?.item_name || 'N/A'}</td>
                                                    <td>{workOrder.total_quantity}</td>
                                                    <td>{workOrder.scanned_quantity}</td>
                                                    <td>{workOrder.remaining_quantity}</td>
                                                    <td>
                                                        <span className="badge bg-success">
                                                            {workOrder.status_name}
                                                        </span>
                                                    </td>
                                                    <td>{workOrder.create_date}</td>
                                                    <td>
                                                        <Link
                                                            href={`/uretim/is-emirleri/${workOrder.id}`}
                                                            className="btn btn-sm btn-primary"
                                                        >
                                                            <i className="bi bi-eye me-1"></i>
                                                            Detay
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {workOrders.links && (
                                    <nav className="mt-4">
                                        <ul className="pagination justify-content-center">
                                            {workOrders.links.map((link, index) => (
                                                <li key={index} className={`page-item ${link.active ? 'active' : ''} ${!link.url ? 'disabled' : ''}`}>
                                                    <Link
                                                        href={link.url || '#'}
                                                        className="page-link"
                                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                                    />
                                                </li>
                                            ))}
                                        </ul>
                                    </nav>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </Layout>
    );
}
