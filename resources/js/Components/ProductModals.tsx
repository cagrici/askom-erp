import React, { useState } from 'react';
import { Modal, Form, Button, Row, Col } from 'react-bootstrap';

interface Category {
    id: number;
    name: string;
    full_name?: string;
    parent_id?: number;
}

// Category Modal Component
export const CategoryModal = ({ show, onHide, onSave, categories }: {
    show: boolean;
    onHide: () => void;
    onSave: (data: {name: string, description?: string, parent_id?: number}) => void;
    categories: Category[];
}) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        parent_id: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            name: formData.name,
            description: formData.description || undefined,
            parent_id: formData.parent_id ? parseInt(formData.parent_id) : undefined
        });
    };

    const handleClose = () => {
        setFormData({ name: '', description: '', parent_id: '' });
        onHide();
    };

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Yeni Kategori Ekle</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Kategori Adı <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            required
                            placeholder="Kategori adını girin"
                        />
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                        <Form.Label>Üst Kategori</Form.Label>
                        <Form.Select
                            value={formData.parent_id}
                            onChange={(e) => setFormData({...formData, parent_id: e.target.value})}
                        >
                            <option value="">Ana Kategori</option>
                            {categories.filter(cat => !cat.parent_id).map(category => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Açıklama</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            placeholder="Kategori açıklaması"
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        İptal
                    </Button>
                    <Button variant="primary" type="submit">
                        <i className="ri-save-line me-1"></i>
                        Kaydet
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

// Brand Modal Component
export const BrandModal = ({ show, onHide, onSave }: {
    show: boolean;
    onHide: () => void;
    onSave: (data: {name: string, description?: string}) => void;
}) => {
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            name: formData.name,
            description: formData.description || undefined
        });
    };

    const handleClose = () => {
        setFormData({ name: '', description: '' });
        onHide();
    };

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Yeni Marka Ekle</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Marka Adı <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            required
                            placeholder="Marka adını girin"
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Açıklama</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            placeholder="Marka açıklaması"
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        İptal
                    </Button>
                    <Button variant="primary" type="submit">
                        <i className="ri-save-line me-1"></i>
                        Kaydet
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

// Supplier Modal Component
export const SupplierModal = ({ show, onHide, onSave }: {
    show: boolean;
    onHide: () => void;
    onSave: (data: {name: string, company_name?: string, phone?: string, email?: string}) => void;
}) => {
    const [formData, setFormData] = useState({
        name: '',
        company_name: '',
        phone: '',
        email: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            name: formData.name,
            company_name: formData.company_name || undefined,
            phone: formData.phone || undefined,
            email: formData.email || undefined
        });
    };

    const handleClose = () => {
        setFormData({ name: '', company_name: '', phone: '', email: '' });
        onHide();
    };

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Yeni Tedarikçi Ekle</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Tedarikçi Adı <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            required
                            placeholder="Tedarikçi adını girin"
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Firma Adı</Form.Label>
                        <Form.Control
                            type="text"
                            value={formData.company_name}
                            onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                            placeholder="Firma adını girin"
                        />
                    </Form.Group>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Telefon</Form.Label>
                                <Form.Control
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    placeholder="Telefon numarası"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>E-posta</Form.Label>
                                <Form.Control
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    placeholder="E-posta adresi"
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        İptal
                    </Button>
                    <Button variant="primary" type="submit">
                        <i className="ri-save-line me-1"></i>
                        Kaydet
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

// Helper AJAX functions
export const createCategory = async (categoryData: {name: string, description?: string, parent_id?: number}) => {
    const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
        body: JSON.stringify(categoryData),
    });

    return await response.json();
};

export const createBrand = async (brandData: {name: string, description?: string}) => {
    const response = await fetch('/api/brands', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
        body: JSON.stringify(brandData),
    });

    return await response.json();
};

export const createSupplier = async (supplierData: {name: string, company_name?: string, phone?: string, email?: string}) => {
    const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
        body: JSON.stringify(supplierData),
    });

    return await response.json();
};