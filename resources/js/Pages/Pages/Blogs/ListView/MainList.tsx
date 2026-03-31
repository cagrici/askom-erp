import { Link } from '@inertiajs/react'
import Pagination from '../../../../Components/Common/Pagination'
import React, { useState } from 'react'
import { Card, CardBody, Col, Row } from 'react-bootstrap'

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
    tags: Array<{
        id: number;
        name: string;
        slug: string;
    }>;
}

interface MainListProps {
    posts: {
        data: Post[];
        current_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        status: string;
        category: number | null;
        search: string | null;
    };
}

const MainList = ({ posts, filters }: MainListProps) => {
    // Filtreleme ve arama için state kullanımı
    const [search, setSearch] = useState(filters && filters.search ? filters.search : '');
    const [timeRange, setTimeRange] = useState('All');

    // Arama işlemi için form submit fonksiyonu
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        window.location.href = route('news.list', { 
        search: search, 
        category: filters && filters.category ? filters.category : null,
        status: filters && filters.status ? filters.status : 'published'
        });
    };

    // Zaman aralığı değişikliği işlemi
    const handleTimeRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setTimeRange(e.target.value);
        // Burada API'ye zaman aralığı filtresi eklenebilir
    };

    // Tarih formatı düzenleme
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('tr-TR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        }).format(date);
    };

    return (
        <React.Fragment>
            <div className="col-xxl-9">
                <div className="row g-4 mb-3">
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
                </div>

                <Row className='gx-4'>
                    {posts && posts.data && posts.data.length > 0 ? (
                        posts.data.map((post) => (
                            <Col xxl={12} key={post.id}>
                                <Card>
                                    <CardBody>
                                        <div className="row g-4">
                                            <div className="col-xxl-3 col-lg-5">
                                                {post.featured_image_path ? (
                                                    <img
                                                        src={`/storage/${post.featured_image_path}`}
                                                        alt={post.title}
                                                        className="img-fluid rounded w-100 object-fit-cover"
                                                        style={{ maxHeight: "200px" }}
                                                    />
                                                ) : (
                                                    <div className="img-fluid rounded w-100 bg-light d-flex align-items-center justify-content-center" style={{ height: "200px" }}>
                                                        <i className="ri-image-line display-4 text-muted"></i>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="col-xxl-9 col-lg-7">
                                                <p className="mb-2 text-primary text-uppercase">
                                                    {post.category ? post.category.name : 'Genel'}
                                                </p>
                                                <Link href={route('news.show', post.id)}>
                                                    <h5 className="fs-15 fw-semibold">{post.title}</h5>
                                                </Link>
                                                <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
                                                    <span className="text-muted">
                                                        <i className="ri-calendar-event-line me-1"></i> {formatDate(post.publish_at)}
                                                    </span> |
                                                    <Link href={`/profile/${post.author.id}`}>
                                                        <i className="ri-user-3-line me-1"></i> {post.author.name}
                                                    </Link>
                                                </div>
                                                <p className="text-muted mb-2">{post.summary || post.title}</p>
                                                <Link
                                                    href={route('news.show', post.id)}
                                                    className="text-decoration-underline"
                                                >
                                                    Daha Fazla <i className="ri-arrow-right-line"></i>
                                                </Link>
                                                {post.tags && post.tags.length > 0 && (
                                                    <div className="d-flex align-items-center gap-2 mt-3 flex-wrap">
                                                        {post.tags.map((tag) => (
                                                            <Link
                                                                href={`/news/list?tag=${tag.id}`}
                                                                key={tag.id}
                                                                className="badge text-success bg-success-subtle"
                                                            >
                                                                {tag.name}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
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
                                window.location.href = route('news.list', {
                                page: page,
                                search: search,
                                category: filters && filters.category ? filters.category : null,
                                status: filters && filters.status ? filters.status : 'published'
                                });
                            }}
                        />
                    </div>
                </div>
            </div>
        </React.Fragment>
    )
}

export default MainList
