import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, CardBody, Form, Button } from 'react-bootstrap';
import { Link, useForm } from '@inertiajs/react';
import Layout from '../../../../Layouts';
import { PageProps } from '@inertiajs/core';
// @ts-ignore
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
// @ts-ignore
import { CKEditor } from '@ckeditor/ckeditor5-react';

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

interface CreatePostProps {
    categories: Category[];
    tags: Tag[];
}

const BlogCreatePost = ({ categories, tags }: PageProps<CreatePostProps>) => {
    document.title = "Yeni Haber Oluştur | Şirket İçi Portal";

    // Preview image
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Selected tags
    const [selectedTags, setSelectedTags] = useState<number[]>([]);

    // Form state
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        summary: '',
        content: '',
        category_id: '',
        featured_image: null as File | null,
        publish_at: formatDateForInput(new Date()),
        status: 'draft',
        allow_comments: true,
        is_featured: false,
        department_id: '',
        tags: [] as number[],
    });

    // Date formatting for input
    function formatDateForInput(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    // Handle file change
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file) {
            setData('featured_image', file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreviewImage(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setData('featured_image', null);
            setPreviewImage(null);
        }
    };

    // Handle tag selection
    const handleTagChange = (tagId: number) => {
        const isSelected = selectedTags.includes(tagId);
        let newSelectedTags: number[];
        
        if (isSelected) {
            newSelectedTags = selectedTags.filter(id => id !== tagId);
        } else {
            newSelectedTags = [...selectedTags, tagId];
        }
        
        setSelectedTags(newSelectedTags);
        setData('tags', newSelectedTags);
    };

    // Form submit handler
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('news.store'));
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Yeni Haber" pageTitle="Haberler" />

                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardBody>
                                    <div className="mb-3">
                                        <Form onSubmit={handleSubmit}>
                                            <Row className="mb-3">
                                                <Col lg={8}>
                                                    <h4 className="card-title mb-4">Haber Bilgileri</h4>
                                                    
                                                    <div className="mb-3">
                                                        <Form.Label htmlFor="post-title">Başlık</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            id="post-title"
                                                            placeholder="Haber başlığını giriniz"
                                                            value={data.title}
                                                            onChange={(e) => setData('title', e.target.value)}
                                                            isInvalid={!!errors.title}
                                                            required
                                                        />
                                                        {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                                                    </div>

                                                    <div className="mb-3">
                                                        <Form.Label htmlFor="post-summary">Özet</Form.Label>
                                                        <Form.Control
                                                            as="textarea"
                                                            id="post-summary"
                                                            rows={3}
                                                            placeholder="Haber özetini giriniz"
                                                            value={data.summary}
                                                            onChange={(e) => setData('summary', e.target.value)}
                                                            isInvalid={!!errors.summary}
                                                        />
                                                        {errors.summary && <div className="invalid-feedback">{errors.summary}</div>}
                                                    </div>

                                                    <div className="mb-3">
                                                        <Form.Label htmlFor="post-content">İçerik</Form.Label>
                                                        <CKEditor
                                                            editor={ClassicEditor}
                                                            data={data.content}
                                                            onChange={(event: any, editor: any) => {
                                                                const content = editor.getData();
                                                                setData('content', content);
                                                            }}
                                                        />
                                                        {errors.content && (
                                                            <div className="text-danger mt-1">
                                                                {errors.content}
                                                            </div>
                                                        )}
                                                    </div>
                                                </Col>

                                                <Col lg={4}>
                                                    <div className="sticky-side-div">
                                                        <Card>
                                                            <CardBody>
                                                                <h5 className="card-title mb-3">Yayın</h5>
                                                                
                                                                <div className="mb-3">
                                                                    <Form.Label htmlFor="post-status">Durum</Form.Label>
                                                                    <Form.Select
                                                                        id="post-status"
                                                                        value={data.status}
                                                                        onChange={(e) => setData('status', e.target.value)}
                                                                        isInvalid={!!errors.status}
                                                                    >
                                                                        <option value="draft">Taslak</option>
                                                                        <option value="published">Yayında</option>
                                                                        <option value="archived">Arşiv</option>
                                                                    </Form.Select>
                                                                    {errors.status && <div className="invalid-feedback">{errors.status}</div>}
                                                                </div>

                                                                <div className="mb-3">
                                                                    <Form.Label htmlFor="post-publish-date">Yayın Tarihi</Form.Label>
                                                                    <Form.Control
                                                                        type="datetime-local"
                                                                        id="post-publish-date"
                                                                        value={data.publish_at}
                                                                        onChange={(e) => setData('publish_at', e.target.value)}
                                                                        isInvalid={!!errors.publish_at}
                                                                    />
                                                                    {errors.publish_at && <div className="invalid-feedback">{errors.publish_at}</div>}
                                                                </div>

                                                                <div className="mb-3">
                                                                    <Form.Check
                                                                        type="checkbox"
                                                                        id="allow-comments"
                                                                        label="Yorumlara İzin Ver"
                                                                        checked={data.allow_comments}
                                                                        onChange={(e) => setData('allow_comments', e.target.checked)}
                                                                    />
                                                                </div>

                                                                <div className="mb-3">
                                                                    <Form.Check
                                                                        type="checkbox"
                                                                        id="is-featured"
                                                                        label="Öne Çıkan"
                                                                        checked={data.is_featured}
                                                                        onChange={(e) => setData('is_featured', e.target.checked)}
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <div className="d-grid">
                                                                        <Button variant="success" type="submit" disabled={processing}>
                                                                            {processing ? (
                                                                                <><span className="spinner-border spinner-border-sm me-1"></span> Kaydediliyor...</>
                                                                            ) : (
                                                                                'Kaydet'
                                                                            )}
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </CardBody>
                                                        </Card>

                                                        <Card>
                                                            <CardBody>
                                                                <h5 className="card-title mb-3">Kategori</h5>
                                                                <div className="mb-3">
                                                                    <Form.Select
                                                                        value={data.category_id}
                                                                        onChange={(e) => setData('category_id', e.target.value)}
                                                                        isInvalid={!!errors.category_id}
                                                                    >
                                                                        <option value="">Kategori Seçin</option>
                                                                        {categories.map((category) => (
                                                                            <option key={category.id} value={category.id}>
                                                                                {category.name}
                                                                            </option>
                                                                        ))}
                                                                    </Form.Select>
                                                                    {errors.category_id && <div className="invalid-feedback">{errors.category_id}</div>}
                                                                </div>
                                                            </CardBody>
                                                        </Card>

                                                        <Card>
                                                            <CardBody>
                                                                <h5 className="card-title mb-3">Öne Çıkan Görsel</h5>
                                                                <div className="mb-3">
                                                                    <Form.Control
                                                                        type="file"
                                                                        accept="image/*"
                                                                        onChange={handleFileChange}
                                                                        isInvalid={!!errors.featured_image}
                                                                    />
                                                                    {errors.featured_image && <div className="invalid-feedback">{errors.featured_image}</div>}
                                                                </div>
                                                                {previewImage && (
                                                                    <div className="mt-3">
                                                                        <img 
                                                                            src={previewImage} 
                                                                            alt="Preview" 
                                                                            className="img-thumbnail" 
                                                                            style={{ maxHeight: '200px' }} 
                                                                        />
                                                                    </div>
                                                                )}
                                                            </CardBody>
                                                        </Card>

                                                        <Card>
                                                            <CardBody>
                                                                <h5 className="card-title mb-3">Etiketler</h5>
                                                                <div>
                                                                    {tags.map((tag) => (
                                                                        <Form.Check
                                                                            key={tag.id}
                                                                            type="checkbox"
                                                                            id={`tag-${tag.id}`}
                                                                            label={tag.name}
                                                                            checked={selectedTags.includes(tag.id)}
                                                                            onChange={() => handleTagChange(tag.id)}
                                                                            className="mb-2"
                                                                        />
                                                                    ))}
                                                                </div>
                                                                {errors.tags && <div className="text-danger mt-1">{errors.tags}</div>}
                                                            </CardBody>
                                                        </Card>
                                                    </div>
                                                </Col>
                                            </Row>
                                        </Form>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    );
};

BlogCreatePost.layout = (page:any) => <Layout children={page} />
export default BlogCreatePost;