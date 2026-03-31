import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import PortalLayout from '@/Layouts/PortalLayout';
import { formatProductPrice } from '@/utils/currency';

interface ProductImage {
    id: number;
    image_path: string;
    thumbnail_path?: string;
}

interface Category {
    id: number;
    name: string;
}

interface Unit {
    id: number;
    unit_code: string;
}

interface Product {
    id: number;
    code: string;
    name: string;
    sale_price: number;
    sale_price_try?: number;
    currency?: string;
    logo_currency?: string;
    stock_quantity?: number;
    category?: Category;
    unit?: Unit;
    images?: ProductImage[];
    primary_image_url?: string;
}

interface Pagination {
    data: Product[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Filters {
    search?: string;
    category?: string;
    sort?: string;
    direction?: string;
}

interface Props {
    products: Pagination;
    categories: Category[];
    filters: Filters;
}

const Index: React.FC<Props> = ({ products, categories, filters }) => {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category || '');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const handleSearch = () => {
        router.get(route('portal.products.index'), {
            search: searchTerm,
            category: selectedCategory,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setSearchTerm('');
        setSelectedCategory('');
        router.get(route('portal.products.index'));
    };

    const getStockBadge = (quantity?: number) => {
        if (!quantity || quantity === 0) {
            return <span className="badge bg-danger">Stokta Yok</span>;
        }
        if (quantity < 10) {
            return <span className="badge bg-warning">Az Stokta</span>;
        }
        return <span className="badge bg-success">Stokta</span>;
    };

    return (
        <PortalLayout>
            <Head title="Ürün Kataloğu" />

            <div className="row mb-4">
                <div className="col">
                    <h2 className="mb-0">Ürün Kataloğu</h2>
                    <p className="text-muted">Tüm ürünlerimizi inceleyin</p>
                </div>
            </div>

            {/* Filters */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-md-5">
                            <label className="form-label">Ara</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Ürün adı, kodu veya barkod..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label">Kategori</label>
                            <select
                                className="form-select"
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                <option value="">Tümü</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-2 d-flex align-items-end gap-2">
                            <button className="btn btn-primary flex-grow-1" onClick={handleSearch}>
                                <i className="bx bx-search me-2"></i>
                                Ara
                            </button>
                            <button className="btn btn-outline-secondary" onClick={handleReset}>
                                <i className="bx bx-reset"></i>
                            </button>
                        </div>
                        <div className="col-md-2 d-flex align-items-end justify-content-end gap-2">
                            <button
                                className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                onClick={() => setViewMode('grid')}
                            >
                                <i className="bx bx-grid-alt"></i>
                            </button>
                            <button
                                className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                onClick={() => setViewMode('list')}
                            >
                                <i className="bx bx-list-ul"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products */}
            {products.data.length === 0 ? (
                <div className="card border-0 shadow-sm">
                    <div className="card-body text-center py-5">
                        <i className="bx bx-package fs-1 text-muted"></i>
                        <p className="text-muted mt-3">Ürün bulunamadı</p>
                    </div>
                </div>
            ) : (
                <>
                    {viewMode === 'grid' ? (
                        <div className="row g-4">
                            {products.data.map((product) => (
                                <div key={product.id} className="col-md-3">
                                    <div className="card border-0 shadow-sm h-100">
                                        <Link href={route('portal.products.show', product.id)}>
                                            <div className="position-relative" style={{ paddingTop: '100%' }}>
                                                <img
                                                    src={product.primary_image_url || '/images/no-image.png'}
                                                    className="position-absolute top-0 start-0 w-100 h-100"
                                                    style={{ objectFit: 'cover' }}
                                                    alt={product.name}
                                                />
                                            </div>
                                        </Link>
                                        <div className="card-body">
                                            <div className="mb-2">
                                                {getStockBadge(product.stock_quantity)}
                                                {product.category && (
                                                    <span className="badge bg-secondary ms-2">
                                                        {product.category.name}
                                                    </span>
                                                )}
                                            </div>
                                            <Link href={route('portal.products.show', product.id)} className="text-decoration-none">
                                                <h6 className="mb-1 text-dark">{product.name}</h6>
                                            </Link>
                                            <small className="text-muted d-block mb-2">Kod: {product.code}</small>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <span className="fs-5 fw-bold text-primary">
                                                    {formatProductPrice(product)}
                                                </span>
                                                <Link
                                                    href={route('portal.products.show', product.id)}
                                                    className="btn btn-sm btn-outline-primary"
                                                >
                                                    Detay
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="card border-0 shadow-sm">
                            <div className="card-body">
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle">
                                        <thead>
                                            <tr>
                                                <th>Ürün</th>
                                                <th>Kategori</th>
                                                <th>Stok</th>
                                                <th className="text-end">Fiyat</th>
                                                <th className="text-end">İşlem</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {products.data.map((product) => (
                                                <tr key={product.id}>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <img
                                                                src={product.primary_image_url || '/images/no-image.png'}
                                                                className="rounded me-3"
                                                                style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                                                                alt={product.name}
                                                            />
                                                            <div>
                                                                <div className="fw-bold">{product.name}</div>
                                                                <small className="text-muted">Kod: {product.code}</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>{product.category?.name || '-'}</td>
                                                    <td>{getStockBadge(product.stock_quantity)}</td>
                                                    <td className="text-end fw-bold">{formatProductPrice(product)}</td>
                                                    <td className="text-end">
                                                        <Link
                                                            href={route('portal.products.show', product.id)}
                                                            className="btn btn-sm btn-outline-primary"
                                                        >
                                                            <i className="bx bx-show me-1"></i>
                                                            Detay
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Pagination */}
                    {products.last_page > 1 && (
                        <div className="d-flex justify-content-between align-items-center mt-4">
                            <div className="text-muted">
                                Toplam {products.total} ürün, sayfa {products.current_page} / {products.last_page}
                            </div>
                            <nav>
                                <ul className="pagination mb-0">
                                    {products.links.map((link, index) => (
                                        <li
                                            key={index}
                                            className={`page-item ${link.active ? 'active' : ''} ${!link.url ? 'disabled' : ''}`}
                                        >
                                            {link.url ? (
                                                <Link
                                                    href={link.url}
                                                    className="page-link"
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            ) : (
                                                <span
                                                    className="page-link"
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </nav>
                        </div>
                    )}
                </>
            )}
        </PortalLayout>
    );
};

export default Index;
