import React from 'react';
import { Card, ProgressBar, Row, Col } from 'react-bootstrap';

interface WarehouseCapacityChartProps {
    warehouses: Array<{
        id: number;
        name: string;
        code: string;
        used: number;
        max: number;
        percentage: number;
    }>;
    title?: string;
}

const WarehouseCapacityChart: React.FC<WarehouseCapacityChartProps> = ({
    warehouses,
    title = 'Depo Doluluk Oranlari'
}) => {
    const getProgressVariant = (percentage: number) => {
        if (percentage >= 90) return 'danger';
        if (percentage >= 70) return 'warning';
        if (percentage >= 50) return 'info';
        return 'success';
    };

    const formatNumber = (value: number) => {
        return new Intl.NumberFormat('tr-TR').format(value);
    };

    return (
        <Card className="card-animate border-0 shadow-sm h-100">
            <Card.Header className="border-0 bg-transparent">
                <h5 className="card-title mb-0">
                    <i className="ri-building-line me-2"></i>
                    {title}
                </h5>
            </Card.Header>
            <Card.Body className="pt-0">
                {warehouses.length === 0 ? (
                    <div className="text-center py-4">
                        <i className="ri-building-line fs-1 text-muted"></i>
                        <p className="text-muted mb-0 mt-2">Depo bulunamadi</p>
                    </div>
                ) : (
                    <div className="d-flex flex-column gap-4">
                        {warehouses.map((warehouse) => {
                            const variant = getProgressVariant(warehouse.percentage);

                            return (
                                <div key={warehouse.id}>
                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                        <div>
                                            <h6 className="mb-0">{warehouse.name}</h6>
                                            <small className="text-muted">{warehouse.code}</small>
                                        </div>
                                        <div className="text-end">
                                            <span className={`fw-bold text-${variant}`}>
                                                %{warehouse.percentage}
                                            </span>
                                            <small className="text-muted d-block">
                                                {formatNumber(warehouse.used)} / {formatNumber(warehouse.max)}
                                            </small>
                                        </div>
                                    </div>
                                    <ProgressBar
                                        now={warehouse.percentage}
                                        variant={variant}
                                        style={{ height: '8px' }}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default WarehouseCapacityChart;
