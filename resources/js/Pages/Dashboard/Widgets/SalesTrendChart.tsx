import React from 'react';
import { Card } from 'react-bootstrap';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

interface SalesTrendChartProps {
    data: Array<{
        month: string;
        month_short: string;
        total: number;
        count: number;
    }>;
    title?: string;
    height?: number;
}

const SalesTrendChart: React.FC<SalesTrendChartProps> = ({
    data,
    title = 'Aylik Satis Trendi',
    height = 350
}) => {
    const chartOptions: ApexOptions = {
        chart: {
            type: 'area',
            height: height,
            toolbar: {
                show: false
            },
            zoom: {
                enabled: false
            }
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            curve: 'smooth',
            width: 2
        },
        colors: ['#405189', '#0ab39c'],
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.4,
                opacityTo: 0.1,
                stops: [0, 90, 100]
            }
        },
        xaxis: {
            categories: data.map(item => item.month_short),
            labels: {
                style: {
                    fontSize: '11px'
                }
            }
        },
        yaxis: [
            {
                title: {
                    text: 'Satis (TL)',
                    style: {
                        fontSize: '12px'
                    }
                },
                labels: {
                    formatter: (value: number) => {
                        if (value >= 1000000) {
                            return (value / 1000000).toFixed(1) + 'M';
                        } else if (value >= 1000) {
                            return (value / 1000).toFixed(0) + 'K';
                        }
                        return value.toFixed(0);
                    }
                }
            },
            {
                opposite: true,
                title: {
                    text: 'Siparis Sayisi',
                    style: {
                        fontSize: '12px'
                    }
                }
            }
        ],
        tooltip: {
            shared: true,
            y: {
                formatter: function (value: number, { seriesIndex }: { seriesIndex: number }) {
                    if (seriesIndex === 0) {
                        return new Intl.NumberFormat('tr-TR', {
                            style: 'currency',
                            currency: 'TRY',
                            minimumFractionDigits: 0
                        }).format(value);
                    }
                    return value + ' adet';
                }
            }
        },
        legend: {
            position: 'top',
            horizontalAlign: 'right'
        },
        grid: {
            borderColor: '#f1f1f1'
        }
    };

    const chartSeries = [
        {
            name: 'Satis (TL)',
            data: data.map(item => item.total)
        },
        {
            name: 'Siparis',
            data: data.map(item => item.count)
        }
    ];

    return (
        <Card className="card-animate border-0 shadow-sm h-100">
            <Card.Header className="border-0 bg-transparent">
                <h5 className="card-title mb-0">{title}</h5>
            </Card.Header>
            <Card.Body className="pt-0">
                <Chart
                    options={chartOptions}
                    series={chartSeries}
                    type="area"
                    height={height}
                />
            </Card.Body>
        </Card>
    );
};

export default SalesTrendChart;
