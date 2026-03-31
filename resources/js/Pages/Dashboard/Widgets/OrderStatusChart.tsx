import React from 'react';
import { Card } from 'react-bootstrap';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

interface OrderStatusChartProps {
    data: Array<{
        status: string;
        label: string;
        count: number;
    }>;
    title?: string;
    height?: number;
}

const OrderStatusChart: React.FC<OrderStatusChartProps> = ({
    data,
    title = 'Siparis Durumu Dagilimi',
    height = 300
}) => {
    const statusColors: Record<string, string> = {
        draft: '#6c757d',
        confirmed: '#405189',
        in_production: '#f7b84b',
        ready_to_ship: '#3577f1',
        shipped: '#0ab39c',
        delivered: '#099885',
        cancelled: '#f06548',
        returned: '#f06548'
    };

    const chartOptions: ApexOptions = {
        chart: {
            type: 'donut',
            height: height
        },
        labels: data.map(item => item.label),
        colors: data.map(item => statusColors[item.status] || '#6c757d'),
        legend: {
            position: 'bottom',
            fontSize: '12px'
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '65%',
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: 'Toplam',
                            fontSize: '14px',
                            fontWeight: 600,
                            formatter: function (w) {
                                return w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                            }
                        }
                    }
                }
            }
        },
        dataLabels: {
            enabled: false
        },
        tooltip: {
            y: {
                formatter: (value: number) => value + ' siparis'
            }
        }
    };

    const chartSeries = data.map(item => item.count);

    if (data.length === 0) {
        return (
            <Card className="card-animate border-0 shadow-sm h-100">
                <Card.Header className="border-0 bg-transparent">
                    <h5 className="card-title mb-0">{title}</h5>
                </Card.Header>
                <Card.Body className="d-flex align-items-center justify-content-center">
                    <p className="text-muted mb-0">Veri bulunamadi</p>
                </Card.Body>
            </Card>
        );
    }

    return (
        <Card className="card-animate border-0 shadow-sm h-100">
            <Card.Header className="border-0 bg-transparent">
                <h5 className="card-title mb-0">{title}</h5>
            </Card.Header>
            <Card.Body className="pt-0">
                <Chart
                    options={chartOptions}
                    series={chartSeries}
                    type="donut"
                    height={height}
                />
            </Card.Body>
        </Card>
    );
};

export default OrderStatusChart;
