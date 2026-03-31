import React from 'react';
import { Head, Link } from '@inertiajs/react';
import PortalLayout from '@/Layouts/PortalLayout';

interface ProductImage {
    id: number;
    image_path: string;
}

interface Category {
    id: number;
    name: string;
}

interface Unit {
    id: number;
    unit_code: string;
}

interface Brand {
    id: number;
    name: string;
}

interface Product {
    id: number;
    code: string;
    name: string;
    description?: string;
    short_description?: string;
    sale_price: number;
    stock_quantity?: number;
    category?: Category;
    unit?: Unit;
    brand?: Brand;
    images?: ProductImage[];
    primary_image_url?: string;
    specifications?: any;
    tax_rate?: number;
}

interface Props {
    product: Product;
    relatedProducts?: Product[];
}

const Show: React.FC<Props> = ({ product, relatedProducts = [] }) => {
    const [selectedImage, setSelectedImage] = React.useState(product.primary_image_url || '/images/no-image.png');

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 2,
        }).format(price);
    };

    const getStockBadge = (quantity?: number) => {
        if (!quantity || quantity === 0) {
            return <span className="badge bg-danger">Stokta Yok</span>;
        }
        if (quantity < 10) {
            return <span className="badge bg-warning">Az Stokta</span>;
        }
        return <span className="badge bg-success">Stokta ({quantity} adet)</span>;
    };

    return (
        <PortalLayout>
            <Head title={product.name} />

            <div className="row mb-4">
                <div className="col">
                    <Link href={route('portal.products.index')} className="btn btn-sm btn-outline-secondary mb-2">
                        <i className="bx bx-arrow-back me-1"></i>
                        Ürün Kataloğuna Dön
                    </Link>
                </div>
            </div>

            <div className="row g-4">
                {/* Product Images */}
                <div className="col-md-5">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <div className="mb-3">
                                <img
                                    src={selectedImage}
                                    className="img-fluid rounded"
                                    alt={product.name}
                                    style={{ width: '100%', height: '400px', objectFit: 'contain' }}
                                />
                            </div>
                            {product.images && product.images.length > 0 && (
                                <div className="d-flex gap-2 overflow-auto">
                                    {product.images.map((image, index) => (
                                        <img
                                            key={index}
                                            src={`/storage/${image.image_path}`}
                                            className={`rounded cursor-pointer border ${selectedImage === `/storage/${image.image_path}` ? 'border-primary border-3' : ''}`}
                                            style={{ width: '80px', height: '80px', objectFit: 'cover', cursor: 'pointer' }}
                                            onClick={() => setSelectedImage(`/storage/${image.image_path}`)}
                                            alt={`${product.name} ${index + 1}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Product Info */}
                <div className="col-md-7">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="mb-3">
                                {product.category && (
                                    <span className="badge bg-secondary me-2">{product.category.name}</span>
                                )}
                                {product.brand && (
                                    <span className="badge bg-info">{product.brand.name}</span>
                                )}
                            </div>

                            <h2 className="mb-3">{product.name}</h2>
                            <p className="text-muted mb-4">Ürün Kodu: <strong>{product.code}</strong></p>

                            {product.short_description && (
                                <p className="mb-4">{product.short_description}</p>
                            )}

                            <div className="row mb-4">
                                <div className="col-md-6">
                                    <div className="d-flex align-items-baseline gap-3">
                                        <h3 className="text-primary mb-0">{formatPrice(product.sale_price)}</h3>
                                        {product.tax_rate && (
                                            <small className="text-muted">(KDV: %{product.tax_rate})</small>
                                        )}
                                    </div>
                                    {product.unit && (
                                        <small className="text-muted">Birim: {product.unit.unit_code}</small>
                                    )}
                                </div>
                                <div className="col-md-6 text-md-end">
                                    {getStockBadge(product.stock_quantity)}
                                </div>
                            </div>

                            <div className="alert alert-info">
                                <i className="bx bx-info-circle me-2"></i>
                                Fiyat teklifi almak veya sipariş vermek için satış ekibimizle iletişime geçin.
                            </div>

                            <div className="d-flex gap-2">
                                <a href={`mailto:sales@askom.com?subject=Ürün Hakkında Bilgi: ${product.name}`} className="btn btn-primary">
                                    <i className="bx bx-envelope me-2"></i>
                                    Teklif İste
                                </a>
                                <a href="tel:+902121234567" className="btn btn-outline-primary">
                                    <i className="bx bx-phone me-2"></i>
                                    Ara
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Product Description */}
            {product.description && (
                <div className="row mt-4">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white">
                                <h5 className="mb-0">Ürün Açıklaması</h5>
                            </div>
                            <div className="card-body">
                                <div dangerouslySetInnerHTML={{ __html: product.description }} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Specifications */}
            {product.specifications && (
                <div className="row mt-4">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white">
                                <h5 className="mb-0">Teknik Özellikler</h5>
                            </div>
                            <div className="card-body">
                                <div dangerouslySetInnerHTML={{ __html: product.specifications }} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Related Products */}
            {relatedProducts.length > 0 && (
                <div className="row mt-4">
                    <div className="col-12">
                        <h5 className="mb-3">Benzer Ürünler</h5>
                        <div className="row g-3">
                            {relatedProducts.map((relatedProduct) => (
                                <div key={relatedProduct.id} className="col-md-3">
                                    <Link href={route('portal.products.show', relatedProduct.id)}>
                                        <div className="card border-0 shadow-sm h-100">
                                            <img
                                                src={relatedProduct.primary_image_url || '/images/no-image.png'}
                                                className="card-img-top"
                                                style={{ height: '200px', objectFit: 'cover' }}
                                                alt={relatedProduct.name}
                                            />
                                            <div className="card-body">
                                                <h6 className="mb-2">{relatedProduct.name}</h6>
                                                <p className="text-muted small mb-2">Kod: {relatedProduct.code}</p>
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <span className="fw-bold text-primary">{formatPrice(relatedProduct.sale_price)}</span>
                                                    <span className="btn btn-sm btn-outline-primary">Detay</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </PortalLayout>
    );
};

export default Show;
