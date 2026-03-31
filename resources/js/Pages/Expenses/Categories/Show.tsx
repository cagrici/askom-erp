import React from 'react';
import { Container, Row, Col, Card, Badge, Button } from 'react-bootstrap';
import BreadCrumb from '../../../Components/Common/BreadCrumb';
import { Head, Link } from '@inertiajs/react';
import Layout from '../../../Layouts';

interface ExpenseCategory {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    is_active: boolean;
    parent_id: number | null;
    parent?: {
        id: number;
        name: string;
    };
}

interface ShowProps {
    category: ExpenseCategory;
    expenseCount: number;
}

const ExpenseCategoryShow = (props: ShowProps) => {
    const { category, expenseCount } = props;
    
    return (
        <React.Fragment>
            <Head title={`${category.name} | Harcama Kategorisi | Portal`} />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Harcama Kategorisi" pageTitle="Harcama Yönetimi" />
                    
                    <Row>
                        <Col lg={12}>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h4 className="mb-0">{category.name}</h4>
                                <div className="d-flex gap-2">
                                    <Link href={route('expense-categories.index')} className="btn btn-light">
                                        <i className="ri-arrow-left-line align-bottom me-1"></i> Geri
                                    </Link>
                                    <Link href={route('expense-categories.edit', category.id)} className="btn btn-primary">
                                        <i className="ri-pencil-line align-bottom me-1"></i> Düzenle
                                    </Link>
                                    <Link 
                                        href={route('expense-categories.toggle-active', category.id)} 
                                        method="post" 
                                        className={`btn btn-${category.is_active ? 'danger' : 'success'}`}
                                        as="button"
                                    >
                                        <i className={`ri-${category.is_active ? 'close' : 'check'}-line align-bottom me-1`}></i> 
                                        {category.is_active ? 'Pasif Duruma Getir' : 'Aktif Duruma Getir'}
                                    </Link>
                                </div>
                            </div>
                        </Col>
                        
                        <Col lg={8}>
                            <Card>
                                <Card.Header>
                                    <h5 className="card-title mb-0">Kategori Bilgileri</h5>
                                </Card.Header>
                                <Card.Body>
                                    <Row className="mb-3">
                                        <Col md={6}>
                                            <h6 className="fw-semibold">Durum:</h6>
                                            <Badge bg={category.is_active ? 'success' : 'danger'} className="fs-6">
                                                {category.is_active ? 'Aktif' : 'Pasif'}
                                            </Badge>
                                        </Col>
                                        <Col md={6}>
                                            <h6 className="fw-semibold">Toplam Harcama:</h6>
                                            <Badge bg="info" className="fs-6">
                                                {expenseCount}
                                            </Badge>
                                        </Col>
                                    </Row>
                                    
                                    <Row className="mb-3">
                                        <Col md={6}>
                                            <h6 className="fw-semibold">Slug:</h6>
                                            <p>{category.slug}</p>
                                        </Col>
                                        <Col md={6}>
                                            <h6 className="fw-semibold">Üst Kategori:</h6>
                                            <p>
                                                {category.parent ? (
                                                    <Link href={route('expense-categories.show', category.parent.id)}>
                                                        {category.parent.name}
                                                    </Link>
                                                ) : (
                                                    'Yok (Ana Kategori)'
                                                )}
                                            </p>
                                        </Col>
                                    </Row>
                                    
                                    <Row className="mb-3">
                                        <Col md={12}>
                                            <h6 className="fw-semibold">Açıklama:</h6>
                                            <p>{category.description || 'Açıklama yok'}</p>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>
                        
                        <Col lg={4}>
                            <Card>
                                <Card.Header>
                                    <h5 className="card-title mb-0">Hızlı İşlemler</h5>
                                </Card.Header>
                                <Card.Body>
                                    <div className="d-grid gap-2">
                                        <Link 
                                            href={`${route('expenses.index')}?category=${category.id}`} 
                                            className="btn btn-info"
                                        >
                                            <i className="ri-list-check me-1"></i> Bu Kategorideki Harcamaları Görüntüle
                                        </Link>
                                        
                                        <Link href={route('expense-categories.edit', category.id)} className="btn btn-primary">
                                            <i className="ri-pencil-line me-1"></i> Kategoriyi Düzenle
                                        </Link>
                                        
                                        <Link 
                                            href={route('expense-categories.toggle-active', category.id)} 
                                            method="post" 
                                            className={`btn btn-${category.is_active ? 'danger' : 'success'}`}
                                            as="button"
                                        >
                                            <i className={`ri-${category.is_active ? 'close' : 'check'}-line me-1`}></i> 
                                            {category.is_active ? 'Pasif Duruma Getir' : 'Aktif Duruma Getir'}
                                        </Link>
                                        
                                        {expenseCount === 0 && (
                                            <Link 
                                                href={route('expense-categories.destroy', category.id)} 
                                                method="delete" 
                                                className="btn btn-danger"
                                                as="button"
                                                data={{
                                                    confirm: 'Bu kategoriyi silmek istediğinize emin misiniz?',
                                                    cancel: 'İptal',
                                                }}
                                            >
                                                <i className="ri-delete-bin-line me-1"></i> Kategoriyi Sil
                                            </Link>
                                        )}
                                    </div>
                                    
                                    {expenseCount > 0 && (
                                        <div className="alert alert-warning mt-3">
                                            <i className="ri-alert-line me-1"></i> Bu kategori {expenseCount} harcamada kullanıldığı için silinemez.
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    );
};

ExpenseCategoryShow.layout = (page: any) => <Layout children={page} />;
export default ExpenseCategoryShow;
