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

interface Post {
    id: number;
    title: string;
    slug: string;
    summary: string;
    content: string;
    category_id: number | null;
    author_id: number;
    featured_image_path: string | null;
    publish_at: string;
    status: string;
    allow_comments: boolean;
    is_featured: boolean;
    department_id: number | null;
    tags: Tag[];
}

interface EditPostProps {
    post: Post;
    categories: Category[];
    tags: Tag[];
}

const BlogEditPost = ({ post, categories, tags }: PageProps<EditPostProps>) => {
    document.title = "Haber Düzenle | Şirket İçi Portal";

    // Preview image
    const [previewImage, setPreviewImage] = useState<string | null>(
        post.featured_image_path ? `/storage/${post.featured_image_path}` : null
    );

    // Selected tags - initialize from post data
    const [selectedTags, setSelectedTags] = useState<number[]>(
        post.tags.map(tag => tag.id)
    );

    // Format date for input
    const formatDateForInput = (dateString: string): string => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // Form state
    const { data, setData, post: submitForm, processing, errors } = useForm({
        title: post.title,
        summary: post.summary || '',
        content: post.content,
        category_id: post.category_id?.toString() || '',
        featured_image: null as File | null,
        publish_at: formatDateForInput(post.publish_at),
        status: post.status,
        allow_comments: post.allow_comments,
        is_featured: post.is_featured,
        department_id: post.department_id?.toString() || '',
        tags: post.tags.map(tag => tag.id),
        _method: 'PUT', // Laravel method spoofing for PUT request
    });

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
            // Don't clear preview image if we already have an existing image
            if (!post.featured_image_path) {
                setPreviewImage(null);
            }
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
        submitForm(route('news.update', post.id));
    };

    // Delete post handler
    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        if (confirm('Bu haberi silmek istediğinizden emin misiniz?')) {
            submitForm(route('news.destroy', post.id), {
                method: 'delete',
                onSuccess: () => {
                    window.location.href = route('news.index');
                }
            });
        }
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Haber Düzenle" pageTitle="Haberler" />

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

                                                                <div className="d-flex gap-2">
                                                                    <Button variant="success" type="submit" className="flex-grow-1" disabled={processing}>
                                                                        {processing ? (
                                                                            <><span className="spinner-border spinner-border-sm me-1"></span> Güncelleniyor...</>
                                                                        ) : (
                                                                            'Güncelle'
                                                                        )}
                                                                    </Button>
                                                                    <Button 
                                                                        variant="danger" 
                                                                        onClick={handleDelete}
                                                                        disabled={processing}
                                                                    >
                                                                        <i className="ri-delete-bin-line"></i>
                                                                    </Button>
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
                                                                    <div className="form-text">Yeni bir görsel yüklemezseniz mevcut görsel korunacaktır.</div>
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

BlogEditPost.layout = (page:any) => <Layout children={page} />
export default BlogEditPost;