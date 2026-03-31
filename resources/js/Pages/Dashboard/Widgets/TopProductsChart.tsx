import React from 'react';
import { Card } from 'react-bootstrap';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

interface TopProductsChartProps {
    data: Array<{
        id: number;
        name: string;
        code: string;
        quantity: number;
        revenue: number;
    }>;
    title?: string;
    height?: number;
}

const TopProductsChart: React.FC<TopProductsChartProps> = ({
    data,
    title = 'En Cok Satan Urunler',
    height = 300
}) => {
    const chartOptions: ApexOptions = {
        chart: {
            type: 'bar',
            height: height,
            toolbar: {
                show: false
            }
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                horizontal: true,
                barHeight: '60%',
                distributed: true
            }
        },
        colors: ['#405189', '#0ab39c', '#f7b84b', '#3577f1', '#f06548'],
        dataLabels: {
            enabled: true,
            formatter: function (value: number) {
                return new Intl.NumberFormat('tr-TR', {
                    style: 'currency',
                    currency: 'TRY',
                    minimumFractionDigits: 0
                }).format(value);
            },
            style: {
                fontSize: '11px'
            }
        },
        xaxis: {
            categories: data.map(item => item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name),
            labels: {
                formatter: (value: string) => {
                    const num = parseFloat(value);
                    if (num >= 1000) {
                        return (num / 1000).toFixed(0) + 'K';
                    }
                    return value;
                }
            }
        },
        yaxis: {
            labels: {
                style: {
                    fontSize: '11px'
                }
            }
        },
        legend: {
            show: false
        },
        tooltip: {
            y: {
                formatter: function (value: number) {
                    return new Intl.NumberFormat('tr-TR', {
                        style: 'currency',
                        currency: 'TRY',
                        minimumFractionDigits: 2
                    }).format(value);
                }
            }
        }
    };

    const chartSeries = [{
        name: 'Ciro',
        data: data.map(item => item.revenue)
    }];

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
                    type="bar"
                    height={height}
                />
            </Card.Body>
        </Card>
    );
};

export default TopProductsChart;
