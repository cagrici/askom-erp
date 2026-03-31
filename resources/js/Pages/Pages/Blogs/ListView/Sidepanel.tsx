import React from 'react'
import { Card, CardBody, Col } from 'react-bootstrap'
import { Link } from '@inertiajs/react'

// Varsayılan resimler
import small4 from "../../../../../images/small/img-4.jpg"
import small6 from "../../../../../images/small/img-6.jpg"
import small7 from "../../../../../images/small/img-7.jpg"

interface Category {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    color: string | null;
    icon: string | null;
    is_active: boolean;
}

interface Tag {
    id: number;
    name: string;
    slug: string;
}

interface SidepanelProps {
    categories?: Category[];
    tags?: Tag[];
}

const Sidepanel = ({ categories = [], tags = [] }: SidepanelProps) => {
    // Arama için state
    const [search, setSearch] = React.useState('');

    // Arama işlemi
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (search) {
            window.location.href = route('news.list', { search });
        }
    };

    // Yıl listesi oluşturma
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    return (
        <React.Fragment>
            <Col xxl={3}>
                <Card>
                    <CardBody className="p-4">
                        <div className="search-box">
                            <p className="text-muted">Ara</p>
                            <form onSubmit={handleSearch}>
                                <div className="position-relative">
                                    <input
                                        type="text"
                                        className="form-control rounded bg-light border-light"
                                        placeholder="Ara..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                    <i className="mdi mdi-magnify search-icon"></i>
                                </div>
                            </form>
                        </div>

                        {categories.length > 0 && (
                            <div className="mt-4">
                                <h5 className="fs-14 mb-3">Kategoriler</h5>
                                <div className="list-group">
                                    {categories.map((category) => (
                                        <Link
                                            key={category.id}
                                            href={route('news.list', { category: category.slug })}
                                            className="list-group-item list-group-item-action"
                                        >
                                            <i className={`mdi ${category.icon || 'mdi-folder'} align-middle me-2 text-${category.color || 'primary'}`}></i>
                                            <span>{category.name}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {tags.length > 0 && (
                            <div className="mt-4">
                                <h5 className="fs-14 mb-3">Etiketler</h5>
                                <div className="d-flex flex-wrap gap-2">
                                    {tags.map((tag) => (
                                        <Link
                                            key={tag.id}
                                            href={route('news.list', { tag: tag.slug })}
                                            className="badge bg-light text-body"
                                        >
                                            {tag.name}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-4">
                            <h5 className="fs-14 mb-3">Arşiv</h5>
                            <div className="list-group">
                                {years.map((year) => (
                                    <Link
                                        key={year}
                                        href={route('news.list', { year })}
                                        className="list-group-item list-group-item-action"
                                    >
                                        <i className="mdi mdi-calendar-blank align-middle me-2 text-secondary"></i>
                                        <span>{year}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </Col>
        </React.Fragment>
    );
};

export default Sidepanel
