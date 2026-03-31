// resources/js/Pages/Documents/Edit.tsx
import React, { useState, useRef } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button, Card, Container, Form, Row, Col, Alert } from 'react-bootstrap';
import { FiSave, FiX, FiUpload, FiFileText } from 'react-icons/fi';

import Layout from '../../Layouts';

interface Category {
    id: number;
    name: string;
}

interface Tag {
    id: number;
    name: string;
}

interface Document {
    id: number;
    title: string;
    description: string | null;
    file_name: string;
    file_type: string;
    file_size: number;
    category_id: number | null;
    tags?: Tag[];
}

interface Props {
    document: Document;
    categories?: Category[];
    tags?: Tag[];
    flash?: {
        success?: string;
        error?: string;
    };
}

const DocumentEdit: React.FC<Props> = ({ document, categories = [], tags = [], flash = {} }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [createNewVersion, setCreateNewVersion] = useState<boolean>(false);
    const [flashMessage, setFlashMessage] = useState<{type: string, message: string} | null>(
        flash?.success ? {type: 'success', message: flash.success} :
            flash?.error ? {type: 'danger', message: flash.error} : null
    );

    const { data, setData, put, processing, errors } = useForm({
        title: document.title,
        description: document.description || '',
        category_id: document.category_id ? document.category_id.toString() : '',
        tags: document.tags ? document.tags.map(tag => tag.id) : [],
        file: null as File | null,
        change_notes: '',
        create_new_version: false
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setData(name as any, value);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setSelectedFile(file);
        setData('file', file);

        // Yeni dosya seçildiğinde versiyon kontrolü otomatik aktif olsun
        if (file) {
            setCreateNewVersion(true);
            setData('create_new_version', true);
        }
    };

    const handleFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleTagsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const options = Array.from(e.target.selectedOptions);
        const selectedTags = options.map(option => parseInt(option.value));
        setData('tags', selectedTags);
    };

    const handleVersionToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        setCreateNewVersion(isChecked);
        setData('create_new_version', isChecked);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('documents.update', document.id));
    };

    // Format file size
    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
        else return (bytes / 1073741824).toFixed(1) + ' GB';
    };

    // Clear flash messages after 5 seconds
    React.useEffect(() => {
        if (flashMessage) {
            const timeout = setTimeout(() => {
                setFlashMessage(null);
            }, 5000);

            return () => clearTimeout(timeout);
        }
    }, [flashMessage]);

    return (
        <React.Fragment>
            <Head title={`Belge Düzenle - ${document.title}`} />
            <div className="page-content">
                <Container fluid>
                    {flashMessage && (
                        <Alert variant={flashMessage.type} dismissible onClose={() => setFlashMessage(null)}>
                            {flashMessage.message}
                        </Alert>
                    )}

                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h1 className="mb-0">Belge Düzenle</h1>
                    </div>

                    <Card>
                        <Card.Body>
                            <Form onSubmit={handleSubmit}>
                                <Row className="mb-3">
                                    <Col md={8}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Belge Başlığı <span className="text-danger">*</span></Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="title"
                                                value={data.title}
                                                onChange={handleChange}
                                                isInvalid={!!errors.title}
                                                required
                                            />
                                            {errors.title && (
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.title}
                                                </Form.Control.Feedback>
                                            )}
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Açıklama</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={3}
                                                name="description"
                                                value={data.description}
                                                onChange={handleChange}
                                                isInvalid={!!errors.description}
                                            />
                                            {errors.description && (
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.description}
                                                </Form.Control.Feedback>
                                            )}
                                        </Form.Group>

                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Kategori</Form.Label>
                                                    <Form.Select
                                                        name="category_id"
                                                        value={data.category_id}
                                                        onChange={handleChange}
                                                        isInvalid={!!errors.category_id}
                                                    >
                                                        <option value="">Kategori Seçin</option>
                                                        {categories.map(category => (
                                                            <option key={category.id} value={category.id}>
                                                                {category.name}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                    {errors.category_id && (
                                                        <Form.Control.Feedback type="invalid">
                                                            {errors.category_id}
                                                        </Form.Control.Feedback>
                                                    )}
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Etiketler</Form.Label>
                                                    <Form.Select
                                                        multiple
                                                        name="tags"
                                                        value={data.tags ? data.tags.map(String) : []}
                                                        onChange={handleTagsChange}
                                                        isInvalid={!!errors.tags}
                                                        style={{ height: '100px' }}
                                                    >
                                                        {tags.map(tag => (
                                                            <option key={tag.id} value={tag.id}>
                                                                {tag.name}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                    <Form.Text className="text-muted">
                                                        Birden fazla seçim için Ctrl (veya Cmd) tuşuna basılı tutarak seçim yapın.
                                                    </Form.Text>
                                                    {errors.tags && (
                                                        <Form.Control.Feedback type="invalid">
                                                            {errors.tags}
                                                        </Form.Control.Feedback>
                                                    )}
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Form.Group className="mb-3">
                                            <Form.Check
                                                type="checkbox"
                                                id="create-new-version"
                                                label="Yeni versiyon oluştur"
                                                checked={createNewVersion}
                                                onChange={handleVersionToggle}
                                                className="mb-2"
                                            />
                                            <Form.Text className="text-muted">
                                                İşaretlerseniz, yeni bir dosya yükleyebilir veya sadece belge bilgilerini güncelleyebilirsiniz.
                                            </Form.Text>
                                        </Form.Group>

                                        {createNewVersion && (
                                            <>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Değişiklik Notları</Form.Label>
                                                    <Form.Control
                                                        as="textarea"
                                                        rows={2}
                                                        name="change_notes"
                                                        value={data.change_notes}
                                                        onChange={handleChange}
                                                        isInvalid={!!errors.change_notes}
                                                        placeholder="Bu versiyonda yapılan değişiklikleri açıklayın"
                                                    />
                                                    {errors.change_notes && (
                                                        <Form.Control.Feedback type="invalid">
                                                            {errors.change_notes}
                                                        </Form.Control.Feedback>
                                                    )}
                                                </Form.Group>

                                                <Form.Group className="mb-3">
                                                    <Form.Label>Yeni Dosya</Form.Label>
                                                    <div className="d-flex flex-column align-items-center justify-content-center p-4 border rounded bg-light text-center">
                                                        {selectedFile ? (
                                                            <>
                                                                <div className="mb-3">
                                                                    <i className="bi bi-file-earmark fs-1"></i>
                                                                </div>
                                                                <p className="mb-1"><strong>{selectedFile.name}</strong></p>
                                                                <p className="text-muted mb-3">
                                                                    {selectedFile.type} - {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                                </p>
                                                                <Button variant="outline-secondary" size="sm" onClick={handleFileSelect}>
                                                                    Dosyayı Değiştir
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="mb-3">
                                                                    <FiUpload size={48} className="text-muted" />
                                                                </div>
                                                                <p className="mb-3">Yeni bir dosya seçmek için tıklayın</p>
                                                                <Button variant="primary" onClick={handleFileSelect}>
                                                                    Dosya Seç
                                                                </Button>
                                                            </>
                                                        )}
                                                        <Form.Control
                                                            type="file"
                                                            id="file"
                                                            ref={fileInputRef}
                                                            onChange={handleFileChange}
                                                            className="d-none"
                                                        />
                                                    </div>
                                                    {errors.file && (
                                                        <div className="text-danger mt-2">
                                                            {errors.file}
                                                        </div>
                                                    )}
                                                    <Form.Text className="text-muted">
                                                        Maksimum dosya boyutu: 10MB
                                                    </Form.Text>
                                                </Form.Group>
                                            </>
                                        )}
                                    </Col>
                                    <Col md={4}>
                                        <Card className="bg-light mb-3">
                                            <Card.Header>Mevcut Dosya</Card.Header>
                                            <Card.Body className="text-center">
                                                <div className="mb-3">
                                                    <FiFileText size={48} />
                                                </div>
                                                <h5>{document.file_name}</h5>
                                                <p className="text-muted">
                                                    {document.file_type}<br />
                                                    {formatFileSize(document.file_size)}
                                                </p>
                                                <Link href={route('documents.download', document.id)} className="btn btn-outline-primary">
                                                    İndir
                                                </Link>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>

                                <div className="d-flex justify-content-end gap-2 mt-3">
                                    <Link href={route('documents.show', document.id)} className="btn btn-secondary">
                                        <FiX className="me-1" /> İptal
                                    </Link>
                                    <Button type="submit" variant="primary" disabled={processing}>
                                        <FiSave className="me-1" /> {processing ? 'Kaydediliyor...' : 'Kaydet'}
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Container>
            </div>
        </React.Fragment>
    );
};

DocumentEdit.layout = (page: any) => <Layout children={page} />
export default DocumentEdit;
