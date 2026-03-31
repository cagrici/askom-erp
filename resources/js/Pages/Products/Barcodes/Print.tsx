import React from 'react';
import { Head } from '@inertiajs/react';
import { Card, Row, Col, Button } from 'react-bootstrap';

interface Category {
    id: number;
    name: string;
}

interface Brand {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    code: string;
    sku: string;
    barcode: string;
    sale_price?: number;
    category?: Category;
    brand?: Brand;
}

interface Settings {
    barcode_type: string;
    label_size: string;
    columns: number;
    show_product_name: boolean;
    show_price: boolean;
}

interface Props {
    products: Product[];
    settings: Settings;
}

export default function BarcodePrint({ products, settings }: Props) {
    const handlePrint = () => {
        window.print();
    };

    const formatPrice = (price?: number) => {
        return price ? `₺${price.toLocaleString()}` : '';
    };

    const getLabelStyle = () => {
        const [width, height] = settings.label_size.split('x').map(s => parseInt(s));
        return {
            width: `${width}mm`,
            height: `${height}mm`,
            minHeight: `${height}mm`,
        };
    };

    const getGridStyle = () => {
        return {
            gridTemplateColumns: `repeat(${settings.columns}, 1fr)`,
        };
    };

    return (
        <html>
            <head>
                <Head title="Barkod Yazdırma Önizleme" />
                <style>{`
                    @media print {
                        body { margin: 0; }
                        .no-print { display: none !important; }
                        .print-grid {
                            display: grid;
                            gap: 2mm;
                            page-break-inside: avoid;
                        }
                        .barcode-label {
                            border: 1px solid #000;
                            padding: 1mm;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            text-align: center;
                            font-size: 8pt;
                            font-family: 'Courier New', monospace;
                            page-break-inside: avoid;
                        }
                        .barcode-text {
                            font-weight: bold;
                            margin: 1mm 0;
                            letter-spacing: 1px;
                        }
                        .product-name {
                            font-size: 7pt;
                            margin-bottom: 1mm;
                            word-wrap: break-word;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            display: -webkit-box;
                            -webkit-line-clamp: 2;
                            -webkit-box-orient: vertical;
                        }
                        .price {
                            font-size: 9pt;
                            font-weight: bold;
                            margin-top: 1mm;
                        }
                    }

                    .print-grid {
                        display: grid;
                        gap: 3px;
                        margin: 10px;
                    }

                    .barcode-label {
                        border: 1px solid #ccc;
                        padding: 8px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        text-align: center;
                        font-size: 12px;
                        font-family: 'Courier New', monospace;
                        background: white;
                    }

                    .barcode-text {
                        font-weight: bold;
                        margin: 4px 0;
                        letter-spacing: 1px;
                        font-size: 14px;
                    }

                    .product-name {
                        font-size: 10px;
                        margin-bottom: 4px;
                        word-wrap: break-word;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        display: -webkit-box;
                        -webkit-line-clamp: 2;
                        -webkit-box-orient: vertical;
                        line-height: 1.2;
                    }

                    .price {
                        font-size: 13px;
                        font-weight: bold;
                        margin-top: 4px;
                        color: #d63384;
                    }

                    .barcode-placeholder {
                        width: 80%;
                        height: 20px;
                        background: repeating-linear-gradient(90deg, #000 0px, #000 1px, #fff 1px, #fff 2px);
                        margin: 4px 0;
                    }
                `}</style>
            </head>
            <body>
                <div className="no-print p-3 bg-light border-bottom">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h4 className="mb-1">Barkod Yazdırma Önizleme</h4>
                            <p className="text-muted mb-0">
                                {products.length} ürün | {settings.label_size}mm | {settings.columns} sütun | 
                                Tip: {settings.barcode_type}
                            </p>
                        </div>
                        <div className="d-flex gap-2">
                            <Button variant="primary" onClick={handlePrint}>
                                <i className="ri-printer-line me-1"></i>
                                Yazdır
                            </Button>
                            <Button variant="secondary" onClick={() => window.history.back()}>
                                <i className="ri-arrow-left-line me-1"></i>
                                Geri Dön
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="print-grid" style={getGridStyle()}>
                    {products.map((product, index) => (
                        <div key={`${product.id}-${index}`} className="barcode-label" style={getLabelStyle()}>
                            {settings.show_product_name && (
                                <div className="product-name">
                                    {product.name.length > 25 ? 
                                        product.name.substring(0, 25) + '...' : 
                                        product.name
                                    }
                                </div>
                            )}
                            
                            {/* Barkod placeholder - gerçek implementasyonda barcode kütüphanesi kullanılacak */}
                            <div className="barcode-placeholder"></div>
                            
                            <div className="barcode-text">
                                {product.barcode}
                            </div>
                            
                            {settings.show_price && product.sale_price && (
                                <div className="price">
                                    {formatPrice(product.sale_price)}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Bilgi notu - sadece önizlemede göster */}
                <div className="no-print p-3 bg-info bg-opacity-10 border-top">
                    <div className="d-flex align-items-center">
                        <i className="ri-information-line me-2 text-info"></i>
                        <small className="text-muted">
                            Bu bir önizlemedir. Gerçek barkodlar yazdırma sırasında oluşturulacaktır.
                            Yazdırma öncesi etiket boyutlarını ve yazıcı ayarlarını kontrol edin.
                        </small>
                    </div>
                </div>
            </body>
        </html>
    );
}