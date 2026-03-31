import React from 'react';
import { Card, Table, ProgressBar } from 'react-bootstrap';
import { Link } from '@inertiajs/react';

interface LowStockTableProps {
    products: Array<{
        id: number;
        name: string;
        code: string;
        current_stock: number;
        min_stock: number;
    }>;
    title?: string;
}

const LowStockTable: React.FC<LowStockTableProps> = ({
    products,
    title = 'Dusuk Stok Uyarilari'
}) => {
    const getStockPercentage = (current: number, min: number) => {
        if (min === 0) return 100;
        return Math.min(100, Math.round((current / min) * 100));
    };

    const getProgressVariant = (percentage: number) => {
        if (percentage <= 25) return 'danger';
        if (percentage <= 50) return 'warning';
        return 'info';
    };

    return (
        <Card className="card-animate border-0 shadow-sm h-100">
            <Card.Header className="border-0 bg-transparent d-flex align-items-center justify-content-between">
                <h5 className="card-title mb-0">
                    <i className="ri-alert-line text-warning me-2"></i>
                    {title}
                </h5>
                {products.length > 0 && (
                    <span className="badge bg-danger">{products.length}</span>
                )}
            </Card.Header>
            <Card.Body className="pt-0">
                {products.length === 0 ? (
                    <div className="text-center py-4">
                        <i className="ri-checkbox-circle-line fs-1 text-success"></i>
                        <p className="text-muted mb-0 mt-2">Tum stoklar yeterli seviyede</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <Table className="table-hover table-nowrap mb-0 align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>Urun</th>
                                    <th className="text-center">Mevcut</th>
                                    <th className="text-center">Minimum</th>
                                    <th style={{ width: '120px' }}>Seviye</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => {
                                    const percentage = getStockPercentage(product.current_stock, product.min_stock);
                                    const variant = getProgressVariant(percentage);

                                    return (
                                        <tr key={product.id}>
                                            <td>
                                                <div>
                                                    <Link href={`/products/${product.id}`} className="fw-medium text-dark">
                                                        {product.name}
                                                    </Link>
                                                    <small className="text-muted d-block">{product.code}</small>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <span className={`fw-bold text-${variant}`}>
                                                    {product.current_stock}
                                                </span>
                                            </td>
                                            <td className="text-center text-muted">
                                                {product.min_stock}
                                            </td>
                                            <td>
                                                <ProgressBar
                                                    now={percentage}
                                                    variant={variant}
                                                    style={{ height: '6px' }}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default LowStockTable;
