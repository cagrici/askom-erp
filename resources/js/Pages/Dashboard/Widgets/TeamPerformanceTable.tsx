import React from 'react';
import { Card, Table, Badge } from 'react-bootstrap';

interface TeamPerformanceTableProps {
    team: Array<{
        id: number;
        name: string;
        order_count: number;
        total_revenue: number;
    }>;
    title?: string;
}

const TeamPerformanceTable: React.FC<TeamPerformanceTableProps> = ({
    team,
    title = 'Satis Temsilcisi Performansi'
}) => {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 0
        }).format(value);
    };

    // En yuksek ciroyu bul
    const maxRevenue = team.length > 0 ? Math.max(...team.map(t => t.total_revenue)) : 0;

    return (
        <Card className="card-animate border-0 shadow-sm h-100">
            <Card.Header className="border-0 bg-transparent">
                <h5 className="card-title mb-0">
                    <i className="ri-team-line me-2"></i>
                    {title}
                </h5>
            </Card.Header>
            <Card.Body className="pt-0">
                {team.length === 0 ? (
                    <div className="text-center py-4">
                        <i className="ri-team-line fs-1 text-muted"></i>
                        <p className="text-muted mb-0 mt-2">Performans verisi bulunamadi</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <Table className="table-hover table-nowrap mb-0 align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>#</th>
                                    <th>Temsilci</th>
                                    <th className="text-center">Siparis</th>
                                    <th className="text-end">Ciro</th>
                                </tr>
                            </thead>
                            <tbody>
                                {team.map((member, index) => {
                                    const isTopPerformer = member.total_revenue === maxRevenue && maxRevenue > 0;

                                    return (
                                        <tr key={member.id}>
                                            <td>
                                                {index < 3 ? (
                                                    <span className={`badge rounded-circle ${
                                                        index === 0 ? 'bg-warning' :
                                                        index === 1 ? 'bg-secondary' :
                                                        'bg-danger-subtle text-danger'
                                                    }`}>
                                                        {index + 1}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted">{index + 1}</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div className="avatar-xs me-2">
                                                        <span className="avatar-title bg-primary-subtle text-primary rounded-circle">
                                                            {member.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <span className="fw-medium">
                                                        {member.name}
                                                        {isTopPerformer && (
                                                            <i className="ri-star-fill text-warning ms-1"></i>
                                                        )}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <Badge bg="info-subtle" text="info">
                                                    {member.order_count}
                                                </Badge>
                                            </td>
                                            <td className="text-end fw-medium text-success">
                                                {formatCurrency(member.total_revenue)}
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

export default TeamPerformanceTable;
