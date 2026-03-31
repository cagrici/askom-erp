import React, { useState, useEffect, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
import { Card, Container, Form, InputGroup, ListGroup } from 'react-bootstrap';
import { FaSearch, FaMicrophone } from 'react-icons/fa';
import Layout from "../../Layouts";

import { PageProps } from '@/types';

interface PendingItem {
    id: number;
    type: 'order' | 'offer';
    doc_no: string;
    entity_name: string;
    amount: string;
    date: string;
    sort_date?: string;
}

interface PendingResponse {
    data: PendingItem[];
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    has_more: boolean;
}

export default function Pending({ auth }: PageProps) {
    const [items, setItems] = useState<PendingItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [filter, setFilter] = useState<'all' | 'orders' | 'offers'>('all');

    const fetchItems = useCallback(async (pageNum: number = 1, resetItems: boolean = false) => {
        if (loading) return;

        setLoading(true);

        try {
            const response = await fetch(`/onay-3/pending/api?page=${pageNum}&per_page=20&type=${filter}`);
            const data: PendingResponse = await response.json();

            console.log('API Response:', data);
            console.log('API URL:', `/onay-3/pending/api?page=${pageNum}&per_page=20&type=${filter}`);
            console.log('Data array:', data.data);
            console.log('Data length:', data.data?.length);

            if (resetItems) {
                console.log('Setting items (reset):', data.data);
                setItems(data.data);
            } else {
                console.log('Adding items to existing:', data.data);
                setItems(prev => [...prev, ...data.data]);
            }

            setHasMore(data.has_more);
            setPage(pageNum);
        } catch (error) {
            console.error('Error fetching items:', error);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        console.log('useEffect triggered - fetching initial data');
        setItems([]);
        setPage(1);
        setHasMore(true);
        fetchItems(1, true);
    }, [filter, fetchItems]);

    useEffect(() => {
        const handleScroll = () => {
            if (
                window.innerHeight + document.documentElement.scrollTop
                >= document.documentElement.offsetHeight - 1000 &&
                !loading &&
                hasMore
            ) {
                fetchItems(page + 1);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [fetchItems, page, loading, hasMore]);

    const getTypeDisplay = (type: 'order' | 'offer') => {
        return type === 'order' ? 'Sipariş' : 'Teklif';
    };

    const getTypeColor = (type: 'order' | 'offer') => {
        return type === 'order' ? 'primary' : 'success';
    };

    const getTypeIcon = (type: 'order' | 'offer') => {
        return type === 'order' ? 'ri-shopping-cart-line' : 'ri-file-text-line';
    };

    return (
        <>
            <Head title="Onay Bekleyen Kayıtlar" />

            <div className="page-content">
                <Container fluid>
                    {/* Page Title */}
                    <div className="page-title-box d-sm-flex align-items-center justify-content-between mb-4">
                        <div>
                            <h4 className="mb-sm-0">Onay Bekleyen Kayıtlar</h4>
                            <p className="text-muted mb-0 mt-1">
                                Onay bekleyen siparişler ve teklifler
                            </p>
                        </div>
                        <div className="text-end">
                            <h2 className="text-primary mb-0">{items.length}</h2>
                            <small className="text-muted">Toplam Kayıt</small>
                        </div>
                    </div>

                    {/* Filter Buttons */}
                    <div className="mb-4">
                        <ButtonGroup>
                            <Button
                                variant={filter === 'all' ? 'primary' : 'outline-primary'}
                                onClick={() => setFilter('all')}
                            >
                                <i className="ri-list-check me-1"></i>
                                Tümü
                            </Button>
                            <Button
                                variant={filter === 'orders' ? 'primary' : 'outline-primary'}
                                onClick={() => setFilter('orders')}
                            >
                                <i className="ri-shopping-cart-line me-1"></i>
                                Siparişler
                            </Button>
                            <Button
                                variant={filter === 'offers' ? 'success' : 'outline-success'}
                                onClick={() => setFilter('offers')}
                            >
                                <i className="ri-file-text-line me-1"></i>
                                Teklifler
                            </Button>
                        </ButtonGroup>
                    </div>

                    {/* Debug info - Remove in production */}
                    <div className="mb-4 p-2 bg-light border rounded">
                        <small className="text-muted">
                            Items count: {items.length} | Loading: {loading ? 'true' : 'false'}
                        </small>
                    </div>

                    {/* Items List */}
                    {items.length === 0 && !loading ? (
                        <div className="text-center py-5">
                            <div className="text-muted">
                                <i className="ri-inbox-line fs-1 mb-3 d-block"></i>
                                <h5>Onay bekleyen kayıt bulunamadı.</h5>
                                <p>Şu anda onay bekleyen sipariş veya teklif bulunmamaktadır.</p>
                            </div>
                        </div>
                    ) : (
                        <Row className="g-4">
                            {items.map((item) => (
                                <Col lg={6} key={`${item.type}-${item.id}`}>
                                    <Card className="h-100 hover-shadow">
                                        <Card.Body>
                                            <div className="d-flex align-items-start justify-content-between mb-3">
                                                <div className="d-flex align-items-center">
                                                    <div className={`avatar-sm bg-${getTypeColor(item.type)} bg-opacity-10 rounded me-3`}>
                                                        <span className={`avatar-title text-${getTypeColor(item.type)} fs-5`}>
                                                            <i className={getTypeIcon(item.type)}></i>
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <Badge bg={getTypeColor(item.type)} className="mb-1">
                                                            {getTypeDisplay(item.type)}
                                                        </Badge>
                                                        <h6 className="mb-0">{item.doc_no}</h6>
                                                        <small className="text-muted">{item.date}</small>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="mb-3">
                                                <label className="form-label text-muted mb-1">Cari:</label>
                                                <p className="mb-0 fw-medium">{item.entity_name}</p>
                                            </div>
                                            
                                            <div className="mb-3">
                                                <label className="form-label text-muted mb-1">Tutar:</label>
                                                <h5 className="mb-0 text-primary">{item.amount}</h5>
                                            </div>
                                        </Card.Body>
                                        <Card.Footer className="bg-transparent border-top-0">
                                            <div className="d-flex gap-2">
                                                <Button variant="success" size="sm" className="flex-grow-1">
                                                    <i className="ri-check-line me-1"></i>
                                                    Onayla
                                                </Button>
                                                <Button variant="danger" size="sm" className="flex-grow-1">
                                                    <i className="ri-close-line me-1"></i>
                                                    Reddet
                                                </Button>
                                            </div>
                                        </Card.Footer>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    )}
                    
                    {/* Loading */}
                    {loading && (
                        <div className="text-center py-4">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Yükleniyor...</span>
                            </div>
                            <p className="text-muted mt-2">Veriler yükleniyor...</p>
                        </div>
                    )}
                    
                    {/* End of results */}
                    {!hasMore && items.length > 0 && (
                        <div className="text-center py-4">
                            <div className="text-muted">
                                <i className="ri-check-double-line fs-4 mb-2 d-block"></i>
                                <small>Tüm kayıtlar yüklendi.</small>
                            </div>
                        </div>
                    )}
                </Container>
            </div>

            <style jsx>{`
                .hover-shadow {
                    transition: all 0.3s ease;
                }
                .hover-shadow:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
                }
            `}</style>
        </>
    );
}

Pending.layout = (page: any) => <Layout children={page} />;