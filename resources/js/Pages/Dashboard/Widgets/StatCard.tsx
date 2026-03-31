import React from 'react';
import { Card, Badge } from 'react-bootstrap';
import CountUp from 'react-countup';

interface StatCardProps {
    title: string;
    value: number;
    prefix?: string;
    suffix?: string;
    icon: string;
    color: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';
    subtitle?: string;
    change?: number;
    trend?: 'up' | 'down';
    badge?: number;
    badgeText?: string;
}

const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    prefix = '',
    suffix = '',
    icon,
    color,
    subtitle,
    change,
    trend,
    badge,
    badgeText
}) => {
    const bgColorClass = `bg-${color}-subtle`;
    const textColorClass = `text-${color}`;

    return (
        <Card className="card-animate border-0 shadow-sm h-100">
            <Card.Body>
                <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                        <p className="text-uppercase fw-medium text-muted mb-0 fs-12">
                            {title}
                        </p>
                        <h4 className="fs-22 fw-semibold mb-0 mt-2">
                            {prefix}
                            <CountUp
                                end={value}
                                separator="."
                                decimal=","
                                decimals={prefix === '₺' ? 2 : 0}
                                duration={1.5}
                            />
                            {suffix}
                        </h4>
                        {subtitle && (
                            <p className="text-muted mb-0 mt-1 fs-12">{subtitle}</p>
                        )}
                        {change !== undefined && (
                            <p className={`mb-0 mt-1 fs-12 ${trend === 'up' ? 'text-success' : 'text-danger'}`}>
                                <i className={`ri-arrow-${trend === 'up' ? 'up' : 'down'}-line me-1`}></i>
                                {Math.abs(change).toFixed(1)}%
                            </p>
                        )}
                        {badge !== undefined && badge > 0 && (
                            <Badge bg="warning" className="mt-2">
                                {badge} {badgeText}
                            </Badge>
                        )}
                    </div>
                    <div className="flex-shrink-0">
                        <div className={`avatar-sm rounded ${bgColorClass}`}>
                            <span className={`avatar-title ${bgColorClass} ${textColorClass} rounded fs-3`}>
                                <i className={icon}></i>
                            </span>
                        </div>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
};

export default StatCard;
