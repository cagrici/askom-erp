import BreadCrumb from '../../../../Components/Common/BreadCrumb'
import Pagination from '../../../../Components/Common/Pagination';
import React from 'react'
import { Col, Container, Row } from 'react-bootstrap'
import Layout from '../../../../Layouts';
import { Link } from '@inertiajs/react';
import { PageProps } from '@inertiajs/core';

interface Post {
    id: number;
    title: string;
    slug: string;
    summary: string;
    content: string;
    category: { id: number; name: string; slug: string; };
    author: { id: number; name: string; };
    featured_image_path: string;
    publish_at: string;
    status: string;
    allow_comments: boolean;
    is_featured: boolean;
    created_at: string;
    updated_at: string;
}

interface Category {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    color: string | null;
    icon: string | null;
    is_active: boolean;
}

interface BlogGridProps {
    posts: {
        data: Post[];
        current_page: number;
        per_page: number;
        total: number;
    };
    categories: Category[];
    filters: {
        status: string;
        category: number | null;
        search: string | null;
    };
}

const BlogGridView = ({ posts, categories, filters }: PageProps<BlogGridProps>) => {
    document.title = "Haberler | Şirket İçi Portal";

    // Filtreleme ve arama için state kullanımı
    const [search, setSearch] = React.useState(filters && filters.search ? filters.search : '');
    const [selectedCategory, setSelectedCategory] = React.useState<number | null>(filters && filters.category ? filters.category : null);
    const [timeRange, setTimeRange] = React.useState('All');

    // Arama işlemi için form submit fonksiyonu
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        window.location.href = route('news.grid', { 
            search: search, 
            category: selectedCategory,
            status: filters && filters.status ? filters.status : 'published'
        });
    };

    // Kategori değişikliği işlemi
    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const categoryId = e.target.value ? parseInt(e.target.value) : null;
        setSelectedCategory(categoryId);
        window.location.href = route('news.grid', { 
            search: search, 
            category: categoryId,
            status: filters && filters.status ? filters.status : 'published'
        });
    };

    // Zaman aralığı değişikliği işlemi
    const handleTimeRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setTimeRange(e.target.value);
        // Burada API'ye zaman aralığı filtresi eklenebilir
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Haberler" pageTitle="İntranet" />
                    <Row className="g-4 mb-3">
                        <div className="col-sm-auto">
                            <div>
                                <Link href={route('news.create')} className="btn btn-success"><i className="ri-add-line align-bottom me-1"></i> Yeni Haber</Link>
                            </div>
                        </div>
                        <div className="col-sm">
                            <div className="d-flex justify-content-sm-end gap-2">
                                <div className="search-box ms-2">
                                    <form onSubmit={handleSearch}>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            placeholder="Ara..." 
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                        />
                                        <i className="ri-search-line search-icon"></i>
                                    </form>
                                </div>

                                <select 
                                    className="form-control" 
                                    style={{ width: "152px" }} 
                                    value={selectedCategory || ''}
                                    onChange={handleCategoryChange}
                                >
                                    <option value="">Tüm Kategoriler</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>

                                <select 
                                    className="form-control w-md" 
                                    style={{width: "152px"}} 
                                    value={timeRange}
                                    onChange={handleTimeRangeChange}
                                >
                                    <option value="All">Tümü</option>
                                    <option value="Today">Bugün</option>
                                    <option value="Yesterday">Dün</option>
                                    <option value="Last 7 Days">Son 7 Gün</option>
                                    <option value="Last 30 Days">Son 30 Gün</option>
                                    <option value="This Month">Bu Ay</option>
                                    <option value="Last Year">Geçen Yıl</option>
                                </select>
                            </div>
                        </div>
                    </Row>

                    <Row>
                        {posts && posts.data && posts.data.length > 0 ? (
                            posts.data.map((post) => (
                                <Col xxl={3} lg={6} key={post.id}>
                                    <div className="card overflow-hidden blog-grid-card">
                                        <div className="position-relative overflow-hidden">
                                            {post.featured_image_path ? (
                                                <img 
                                                    src={`/storage/${post.featured_image_path}`} 
                                                    alt={post.title} 
                                                    className="blog-img object-fit-cover" 
                                                />
                                            ) : (
                                                <div className="blog-img object-fit-cover bg-light d-flex align-items-center justify-content-center" style={{ height: "200px" }}>
                                                    <i className="ri-image-line display-4 text-muted"></i>
                                                </div>
                                            )}
                                        </div>
                                        <div className="card-body">
                                            <h5 className="card-title">
                                                <Link href={route('news.show', post.id)} className="text-reset">
                                                    {post.title}
                                                </Link>
                                            </h5>
                                            <p className="text-muted mb-2">{post.summary || post.title}</p>
                                            <Link 
                                                href={route('news.show', post.id)} 
                                                className="link link-primary text-decoration-underline link-offset-1"
                                            >
                                                Daha Fazla <i className="ri-arrow-right-up-line"></i>
                                            </Link>
                                        </div>
                                    </div>
                                </Col>
                            ))
                        ) : (
                            <Col xs={12}>
                                <div className="text-center p-4">
                                    <div className="avatar-md mx-auto mb-4">
                                        <div className="avatar-title bg-light rounded-circle text-primary display-6">
                                            <i className="ri-file-text-line"></i>
                                        </div>
                                    </div>
                                    <h5>Haber bulunamadı</h5>
                                    <p className="text-muted">Girilen kriterlere uygun haber bulunamadı.</p>
                                </div>
                            </Col>
                        )}
                    </Row>

                    <div className="row g-0 text-center text-sm-start align-items-center mb-4">
                        <div className="col-sm-6">
                            <div>
                                <p className="mb-sm-0 text-muted">
                                    Gösterilen <span className="fw-semibold">{posts && posts.data && posts.data.length > 0 ? (posts.current_page - 1) * posts.per_page + 1 : 0}</span> - 
                                    <span className="fw-semibold">
                                        {posts ? Math.min(posts.current_page * posts.per_page, posts.total) : 0}
                                    </span> / 
                                    <span className="fw-semibold text-decoration-underline">{posts ? posts.total : 0}</span> kayıt
                                </p>
                            </div>
                        </div>
                        <div className="col-sm-6">
                            <Pagination
                                perPageData={posts ? posts.per_page : 10}
                                data={{ length: posts ? posts.total : 0 }}
                                currentPage={posts ? posts.current_page : 1}
                                setCurrentPage={(page: number) => {
                                    window.location.href = route('news.grid', {
                                        page: page,
                                        search: search,
                                        category: selectedCategory,
                                        status: filters && filters.status ? filters.status : 'published'
                                    });
                                }}
                            />
                        </div>
                    </div>
                </Container>
            </div>
        </React.Fragment>
    )
}

BlogGridView.layout = (page:any) => <Layout children={page} />
export default BlogGridView