import React, { useState } from 'react';
import Layout from '@/Layouts';
import { Head, Link, router } from '@inertiajs/react';
import { Card, Row, Col, Button, Modal, Form, Alert, Badge } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface ProductImage {
    id: number;
    image_path: string;
    thumbnail_path?: string;
    image_url: string;
    thumbnail_url: string;
    is_primary: boolean;
    sort_order: number;
}

interface Product {
    id: number;
    name: string;
    code: string;
    sku: string;
    images: ProductImage[];
}

interface Props {
    product: Product;
}

export default function ProductImagesShow({ product }: Props) {
    const { t } = useTranslation();
    
    // Debug: console log to check data structure
    console.log('Product data:', product);
    console.log('Product images:', product.images);
    
    const [selectedImage, setSelectedImage] = useState<ProductImage | null>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [imageToDelete, setImageToDelete] = useState<ProductImage | null>(null);
    const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
    const [draggedImage, setDraggedImage] = useState<ProductImage | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const handleUpload = () => {
        if (!uploadFiles || uploadFiles.length === 0) {
            alert('Lütfen yüklenecek dosyaları seçin.');
            return;
        }

        const formData = new FormData();
        Array.from(uploadFiles).forEach(file => formData.append('images[]', file));

        router.post(route('product-images.upload', product.id), formData, {
            onSuccess: () => {
                setShowUploadModal(false);
                setUploadFiles(null);
            }
        });
    };

    const handleSetPrimary = (image: ProductImage) => {
        router.post(route('product-images.set-primary', [product.id, image.id]));
    };

    const handleDelete = (image: ProductImage) => {
        setImageToDelete(image);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (imageToDelete) {
            router.delete(route('product-images.destroy', [product.id, imageToDelete.id]));
            setShowDeleteModal(false);
            setImageToDelete(null);
        }
    };

    const handleDragStart = (image: ProductImage) => {
        setDraggedImage(image);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDragOverIndex(index);
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDrop = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        setDragOverIndex(null);

        if (!draggedImage) return;

        const draggedIndex = product.images.findIndex(img => img.id === draggedImage.id);
        if (draggedIndex === targetIndex) return;

        // Create new order
        const newImages = [...product.images];
        const [movedImage] = newImages.splice(draggedIndex, 1);
        newImages.splice(targetIndex, 0, movedImage);

        // Update sort orders
        const updatedImages = newImages.map((img, index) => ({
            id: img.id,
            sort_order: index + 1
        }));

        router.post(route('product-images.update-order', product.id), {
            images: updatedImages
        });

        setDraggedImage(null);
    };

    const handleDragEnd = () => {
        setDraggedImage(null);
        setDragOverIndex(null);
    };

    return (
        <>
            <Head title={`${product.name} - Görseller`} />
            <Layout>
                <div className="page-content">
                <div className="container-fluid">
                    <Row className="mb-3">
                        <Col>
                            <div className="page-title-box d-flex align-items-center justify-content-between">
                                <div>
                                    <h4 className="mb-0">{product.name} - Görseller</h4>
                                    <p className="text-muted mb-0">
                                        Kod: {product.code} | SKU: {product.sku}
                                    </p>
                                </div>
                                <div className="d-flex gap-2">
                                    <Button variant="success" onClick={() => setShowUploadModal(true)}>
                                        <i className="ri-upload-line me-1"></i>
                                        Görsel Yükle
                                    </Button>
                                    <Link href={route('product-images.index')} className="btn btn-secondary">
                                        <i className="ri-arrow-left-line me-1"></i>
                                        Geri Dön
                                    </Link>
                                </div>
                            </div>
                        </Col>
                    </Row>

                    {product.images.length === 0 ? (
                        <Card>
                            <Card.Body className="text-center py-5">
                                <i className="ri-image-line fs-1 text-muted mb-3"></i>
                                <h5 className="text-muted">Bu ürüne ait görsel bulunmuyor</h5>
                                <p className="text-muted">Yeni görseller yüklemek için "Görsel Yükle" butonunu kullanın.</p>
                                <Button variant="success" onClick={() => setShowUploadModal(true)}>
                                    <i className="ri-upload-line me-1"></i>
                                    İlk Görseli Yükle
                                </Button>
                            </Card.Body>
                        </Card>
                    ) : (
                        <Row>
                            {/* Ana Görsel */}
                            <Col xl={6}>
                                <Card>
                                    <Card.Header>
                                        <h5 className="card-title mb-0">Ana Görsel</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        {selectedImage ? (
                                            <div className="text-center position-relative">
                                                <img
                                                    src={selectedImage.image_url}
                                                    alt={product.name}
                                                    className="img-fluid rounded border"
                                                    style={{ maxHeight: '500px', width: '100%', objectFit: 'contain' }}
                                                />
                                                <div className="position-absolute top-0 end-0 m-2">
                                                    {selectedImage.is_primary && (
                                                        <Badge bg="primary">Ana Görsel</Badge>
                                                    )}
                                                </div>
                                                <div className="mt-3 d-flex gap-2 justify-content-center">
                                                    {!selectedImage.is_primary && (
                                                        <Button 
                                                            variant="primary" 
                                                            size="sm"
                                                            onClick={() => handleSetPrimary(selectedImage)}
                                                        >
                                                            <i className="ri-star-line me-1"></i>
                                                            Ana Görsel Yap
                                                        </Button>
                                                    )}
                                                    <Button 
                                                        variant="danger" 
                                                        size="sm"
                                                        onClick={() => handleDelete(selectedImage)}
                                                    >
                                                        <i className="ri-delete-bin-line me-1"></i>
                                                        Sil
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-4">
                                                <p className="text-muted">Görüntülemek için yan taraftaki görsellerden birini seçin.</p>
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Col>

                            {/* Görsel Listesi */}
                            <Col xl={6}>
                                <Card>
                                    <Card.Header className="d-flex justify-content-between align-items-center">
                                        <h5 className="card-title mb-0">
                                            Tüm Görseller ({product.images.length})
                                        </h5>
                                        <Badge bg="info">Sürükle & Bırak ile sırala</Badge>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row>
                                            {product.images
                                                .sort((a, b) => a.sort_order - b.sort_order)
                                                .map((image, index) => (
                                                <Col xs={6} md={4} key={image.id} className="mb-3">
                                                    <div
                                                        className={`position-relative border rounded p-2 ${
                                                            selectedImage?.id === image.id ? 'border-primary border-2' : ''
                                                        } ${
                                                            dragOverIndex === index ? 'border-success border-2 bg-light' : ''
                                                        }`}
                                                        style={{ cursor: 'pointer' }}
                                                        draggable
                                                        onDragStart={() => handleDragStart(image)}
                                                        onDragOver={(e) => handleDragOver(e, index)}
                                                        onDragLeave={handleDragLeave}
                                                        onDrop={(e) => handleDrop(e, index)}
                                                        onDragEnd={handleDragEnd}
                                                        onClick={() => setSelectedImage(image)}
                                                    >
                                                        <img
                                                            src={image.thumbnail_url || image.image_url}
                                                            alt={`${product.name} - ${index + 1}`}
                                                            className="img-fluid rounded"
                                                            style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                                                        />
                                                        
                                                        {/* Overlay with badges */}
                                                        <div className="position-absolute top-0 start-0 w-100 p-1">
                                                            <div className="d-flex justify-content-between align-items-start">
                                                                <div className="d-flex flex-column gap-1">
                                                                    {image.is_primary && (
                                                                        <Badge bg="primary" className="small">Ana</Badge>
                                                                    )}
                                                                    <Badge bg="secondary" className="small">
                                                                        #{image.sort_order}
                                                                    </Badge>
                                                                </div>
                                                                <div className="d-flex flex-column gap-1">
                                                                    <Button
                                                                        variant="light"
                                                                        size="sm"
                                                                        className="p-1 opacity-75"
                                                                        style={{ fontSize: '0.7rem' }}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDelete(image);
                                                                        }}
                                                                    >
                                                                        <i className="ri-delete-bin-line"></i>
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Drag handle */}
                                                        <div className="position-absolute bottom-0 end-0 p-1">
                                                            <i className="ri-drag-move-2-line text-muted"></i>
                                                        </div>
                                                    </div>
                                                </Col>
                                            ))}
                                        </Row>

                                        <div className="text-center mt-3">
                                            <Button 
                                                variant="outline-primary" 
                                                onClick={() => setShowUploadModal(true)}
                                            >
                                                <i className="ri-add-line me-1"></i>
                                                Daha Fazla Görsel Ekle
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    )}
                </div>
            </div>
            </Layout>

            {/* Görsel Yükleme Modal */}
            <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Yeni Görsel Yükle</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Görsel Dosyaları</Form.Label>
                        <Form.Control
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => setUploadFiles((e.target as HTMLInputElement).files)}
                        />
                        <Form.Text className="text-muted">
                            JPEG, PNG, JPG, WEBP formatlarında, maksimum 5MB boyutunda dosyalar yükleyebilirsiniz.
                            Aynı anda maksimum 10 dosya seçebilirsiniz.
                        </Form.Text>
                    </Form.Group>

                    {uploadFiles && uploadFiles.length > 0 && (
                        <Alert variant="info">
                            <i className="ri-information-line me-1"></i>
                            {uploadFiles.length} dosya seçildi. 
                            {product.images.length === 0 && ' İlk yüklenen görsel otomatik olarak ana görsel olarak ayarlanacaktır.'}
                        </Alert>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowUploadModal(false)}>
                        İptal
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={handleUpload}
                        disabled={!uploadFiles || uploadFiles.length === 0}
                    >
                        <i className="ri-upload-line me-1"></i>
                        Yükle
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Silme Onay Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Görseli Sil</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {imageToDelete && (
                        <>
                            <div className="text-center mb-3">
                                <img
                                    src={imageToDelete.thumbnail_url || imageToDelete.image_url}
                                    alt="Silinecek görsel"
                                    className="img-fluid rounded border"
                                    style={{ maxHeight: '200px' }}
                                />
                            </div>
                            <p>Bu görseli silmek istediğinizden emin misiniz?</p>
                            {imageToDelete.is_primary && (
                                <Alert variant="warning">
                                    <i className="ri-warning-line me-1"></i>
                                    Bu görsel ana görseldir. Silindiğinde listede bulunan ilk görsel otomatik olarak ana görsel olarak ayarlanacaktır.
                                </Alert>
                            )}
                            <p className="text-muted small">Bu işlem geri alınamaz.</p>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                        İptal
                    </Button>
                    <Button variant="danger" onClick={confirmDelete}>
                        <i className="ri-delete-bin-line me-1"></i>
                        Sil
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}