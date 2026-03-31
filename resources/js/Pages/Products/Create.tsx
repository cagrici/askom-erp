import React, { useState } from 'react';
import Layout from '@/Layouts';
import { Head, Link, useForm } from '@inertiajs/react';
import { Card, Form, Button, Row, Col, Nav, Tab, InputGroup, Alert } from 'react-bootstrap';
import SearchableSelect from '@/Components/SearchableSelect';
import HierarchicalCategorySelect from '@/Components/HierarchicalCategorySelect';
import { useTranslation } from 'react-i18next';

interface Category {
    id: number;
    name: string;
    full_name?: string;
    parent_id?: number;
    level?: number;
    children?: Category[];
}

interface Brand {
    id: number;
    name: string;
}

interface Supplier {
    id: number;
    title: string;
    account_code?: string;
}

interface Unit {
    id: number;
    name: string;
    symbol: string;
    type: string;
}

interface Tax {
    id: number;
    name: string;
    type: 'percentage' | 'fixed';
    rate: number;
    fixed_amount?: number;
    code: string;
}

interface ProductAttribute {
    id: number;
    name: string;
    type: string;
    unit?: string;
    is_required: boolean;
    values?: Array<{
        id: number;
        value: string;
        color_hex?: string;
    }>;
}

interface Props {
    categories: Category[];
    categoriesHierarchy: Category[];
    brands: Brand[];
    suppliers: Supplier[];
    units: Unit[];
    taxes: Tax[];
    attributes: ProductAttribute[];
    productTypes: Array<{ value: string; label: string }>;
    currencies: Array<{ value: string; label: string }>;
    userPermissions: {
        canCreateCategories: boolean;
        canCreateBrands: boolean;
        canCreateSuppliers: boolean;
    };
}

export default function ProductCreate({ 
    categories, 
    categoriesHierarchy,
    brands, 
    suppliers, 
    units,
    taxes,
    attributes, 
    productTypes, 
    currencies 
}: Props) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('basic');
    const [activeLanguageTab, setActiveLanguageTab] = useState('tr');
    const [selectedImages, setSelectedImages] = useState<File[]>([]);

    // Supported languages
    const supportedLanguages = [
        { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
        { code: 'en', name: 'English', flag: '🇬🇧' },
        { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
        { code: 'fr', name: 'Français', flag: '🇫🇷' }
    ];

    // Tab'lardaki hataları kontrol eden fonksiyon
    const getTabErrors = (tabName: string) => {
        const tabFields: Record<string, string[]> = {
            'basic': ['name', 'code', 'sku', 'barcode', 'category_id', 'brand_id', 'supplier_id', 'description', 'short_description'],
            'pricing': ['cost_price', 'sale_price', 'wholesale_price', 'min_sale_price', 'tax_rate', 'currency'],
            'inventory': ['stock_quantity', 'min_stock_level', 'max_stock_level', 'track_inventory', 'allow_backorder'],
            'physical': ['weight', 'width', 'height', 'depth', 'volume', 'unit_of_measure'],
            'packaging': ['items_per_package', 'items_per_box', 'boxes_per_pallet', 'package_type'],
            'images': ['images'],
            'seo': ['meta_title', 'meta_description', 'meta_keywords']
        };

        const fields = tabFields[tabName] || [];
        return fields.filter(field => errors[field]);
    };

    const hasTabErrors = (tabName: string) => {
        return getTabErrors(tabName).length > 0;
    };

    // Tab değiştirme fonksiyonu
    const handleTabChange = (tabKey: string | null) => {
        if (tabKey) {
            setActiveTab(tabKey);
        }
    };

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        // Temel Bilgiler
        name: '',
        code: '',
        barcode: '',
        sku: '',
        category_id: '',
        categories: [],
        brand_id: '',
        supplier_id: '',
        description: '',
        short_description: '',

        // Translations
        translations: {
            tr: { name: '', description: '', short_description: '', meta_title: '', meta_description: '', meta_keywords: '' },
            en: { name: '', description: '', short_description: '', meta_title: '', meta_description: '', meta_keywords: '' },
            de: { name: '', description: '', short_description: '', meta_title: '', meta_description: '', meta_keywords: '' },
            fr: { name: '', description: '', short_description: '', meta_title: '', meta_description: '', meta_keywords: '' }
        },
        
        // Fiyat Bilgileri
        cost_price: '',
        sale_price: '',
        wholesale_price: '',
        min_sale_price: '',
        tax_rate: '18',
        currency: 'TRY',
        
        // Stok Bilgileri
        stock_quantity: '',
        min_stock_level: '',
        max_stock_level: '',
        track_inventory: true,
        allow_backorder: false,
        
        // Fiziksel Özellikler
        weight: '',
        width: '',
        height: '',
        depth: '',
        volume: '',
        unit_of_measure: 'adet',
        
        // Paketleme
        items_per_package: '1',
        items_per_box: '',
        boxes_per_pallet: '',
        package_type: '',
        
        // Tip ve Durum
        product_type: 'trading_goods',
        tax_id: '',
        is_active: true,
        is_featured: false,
        is_digital: false,
        is_new: false,
        
        // ERP Alanları
        can_be_purchased: true,
        can_be_sold: true,
        is_stockable: true,
        is_serialized: false,
        lead_time_days: '',
        purchase_uom: '',
        sales_uom: '',
        
        // SEO
        meta_title: '',
        meta_description: '',
        meta_keywords: '',
        
        // Diğer
        country_of_origin: '',
        warranty_period: '',
        warranty_info: '',
        tags: [] as string[],
        specifications: {} as { [key: string]: string },
        
        // Özellikler
        attributes: [] as Array<{
            attribute_id: number;
            value?: string;
            attribute_value_id?: number;
        }>,
        
        // Görseller
        images: [] as File[],
    });

    // Translation field'larını güncelleme fonksiyonu
    const updateTranslation = (locale: string, field: string, value: string) => {
        setData('translations', {
            ...data.translations,
            [locale]: {
                ...data.translations[locale],
                [field]: value
            }
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Translation verilerini backend'in beklediği formata çevir
        const translationsArray = Object.entries(data.translations)
            .filter(([locale, translation]) => 
                translation.name.trim() || translation.description.trim() || translation.short_description.trim()
            )
            .map(([locale, translation]) => ({
                locale,
                ...translation
            }));

        const formData = new FormData();
        
        // Form verilerini ekle
        Object.entries(data).forEach(([key, value]) => {
            if (key === 'images') {
                selectedImages.forEach((image, index) => {
                    formData.append(`images[${index}]`, image);
                });
            } else if (key === 'translations') {
                // Translations'ları backend'in beklediği formatta gönder
                translationsArray.forEach((translation, index) => {
                    Object.entries(translation).forEach(([field, fieldValue]) => {
                        formData.append(`translations[${index}][${field}]`, String(fieldValue || ''));
                    });
                });
            } else if (key === 'tags' || key === 'attributes') {
                formData.append(key, JSON.stringify(value));
            } else if (key === 'specifications') {
                formData.append(key, JSON.stringify(value));
            } else if (typeof value === 'boolean') {
                formData.append(key, value ? '1' : '0');
            } else {
                formData.append(key, String(value || ''));
            }
        });

        post(route('products.store'), formData, {
            forceFormData: true,
            onError: (errors) => {
                // İlk hatalı tab'a geç
                const firstErrorTab = findFirstErrorTab(errors);
                if (firstErrorTab) {
                    setActiveTab(firstErrorTab);
                }
                
                // Sayfanın başına scroll yap
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    };

    // İlk hatalı tab'ı bulan fonksiyon
    const findFirstErrorTab = (errors: Record<string, string>) => {
        const tabFields: Record<string, string[]> = {
            'basic': ['name', 'code', 'sku', 'barcode', 'category_id', 'brand_id', 'supplier_id', 'description', 'short_description'],
            'pricing': ['cost_price', 'sale_price', 'wholesale_price', 'min_sale_price', 'tax_rate', 'currency'],
            'inventory': ['stock_quantity', 'min_stock_level', 'max_stock_level', 'track_inventory', 'allow_backorder'],
            'physical': ['weight', 'width', 'height', 'depth', 'volume', 'unit_of_measure'],
            'packaging': ['items_per_package', 'items_per_box', 'boxes_per_pallet', 'package_type'],
            'images': ['images'],
            'seo': ['meta_title', 'meta_description', 'meta_keywords']
        };

        const tabOrder = ['basic', 'pricing', 'inventory', 'physical', 'packaging', 'images', 'seo'];
        
        for (const tab of tabOrder) {
            const fields = tabFields[tab] || [];
            if (fields.some(field => errors[field])) {
                return tab;
            }
        }
        
        return null;
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setSelectedImages(files);
            setData('images', files);
        }
    };

    const removeImage = (index: number) => {
        const newImages = selectedImages.filter((_, i) => i !== index);
        setSelectedImages(newImages);
        setData('images', newImages);
    };

    const addTag = (tag: string) => {
        if (tag && !data.tags.includes(tag)) {
            setData('tags', [...data.tags, tag]);
        }
    };

    const removeTag = (index: number) => {
        setData('tags', data.tags.filter((_, i) => i !== index));
    };

    const addSpecification = (key: string, value: string) => {
        setData('specifications', {
            ...data.specifications,
            [key]: value
        });
    };

    const removeSpecification = (key: string) => {
        const newSpecs = { ...data.specifications };
        delete newSpecs[key];
        setData('specifications', newSpecs);
    };

    return (
        <Layout>
            <Head title="Yeni Ürün Ekle" />

            <div className="page-content">
                <div className="container-fluid">
                    <Row className="mb-3">
                        <Col>
                            <div className="page-title-box d-flex align-items-center justify-content-between">
                                <h4 className="mb-0">Yeni Ürün Ekle</h4>
                                <div className="d-flex gap-2">
                                    <Link href={route('products.index')} className="btn btn-secondary">
                                        <i className="ri-arrow-left-line me-1"></i>
                                        Geri Dön
                                    </Link>
                                </div>
                            </div>
                        </Col>
                    </Row>

                    {/* Genel Hata Mesajları */}
                    {Object.keys(errors).length > 0 && (
                        <Row className="mb-3">
                            <Col>
                                <Alert variant="danger">
                                    <Alert.Heading className="h6">
                                        <i className="ri-error-warning-line me-1"></i>
                                        Form Hatası
                                    </Alert.Heading>
                                    <p className="mb-2">Lütfen aşağıdaki hataları düzeltip tekrar deneyin:</p>
                                    <ul className="mb-0">
                                        {Object.entries(errors).map(([field, message], index) => (
                                            <li key={index}>
                                                <strong>{field}:</strong> {message}
                                            </li>
                                        ))}
                                    </ul>
                                </Alert>
                            </Col>
                        </Row>
                    )}

                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col xl={12}>
                                <Card>
                                    <Card.Body>
                                        <Tab.Container activeKey={activeTab} onSelect={handleTabChange}>
                                            <Nav variant="tabs" className="mb-4">
                                                <Nav.Item>
                                                    <Nav.Link eventKey="basic" className={hasTabErrors('basic') ? 'text-danger' : ''}>
                                                        <i className="ri-information-line me-1"></i>
                                                        Temel Bilgiler
                                                        {hasTabErrors('basic') && <i className="ri-error-warning-line ms-1 text-danger"></i>}
                                                    </Nav.Link>
                                                </Nav.Item>
                                                <Nav.Item>
                                                    <Nav.Link eventKey="pricing" className={hasTabErrors('pricing') ? 'text-danger' : ''}>
                                                        <i className="ri-money-dollar-circle-line me-1"></i>
                                                        Fiyatlandırma
                                                        {hasTabErrors('pricing') && <i className="ri-error-warning-line ms-1 text-danger"></i>}
                                                    </Nav.Link>
                                                </Nav.Item>
                                                <Nav.Item>
                                                    <Nav.Link eventKey="inventory" className={hasTabErrors('inventory') ? 'text-danger' : ''}>
                                                        <i className="ri-stack-line me-1"></i>
                                                        Stok Yönetimi
                                                        {hasTabErrors('inventory') && <i className="ri-error-warning-line ms-1 text-danger"></i>}
                                                    </Nav.Link>
                                                </Nav.Item>
                                                <Nav.Item>
                                                    <Nav.Link eventKey="physical" className={hasTabErrors('physical') ? 'text-danger' : ''}>
                                                        <i className="ri-ruler-line me-1"></i>
                                                        Fiziksel Özellikler
                                                        {hasTabErrors('physical') && <i className="ri-error-warning-line ms-1 text-danger"></i>}
                                                    </Nav.Link>
                                                </Nav.Item>
                                                <Nav.Item>
                                                    <Nav.Link eventKey="images" className={hasTabErrors('images') ? 'text-danger' : ''}>
                                                        <i className="ri-image-line me-1"></i>
                                                        Görseller
                                                        {hasTabErrors('images') && <i className="ri-error-warning-line ms-1 text-danger"></i>}
                                                    </Nav.Link>
                                                </Nav.Item>
                                                <Nav.Item>
                                                    <Nav.Link eventKey="seo" className={hasTabErrors('seo') ? 'text-danger' : ''}>
                                                        <i className="ri-search-eye-line me-1"></i>
                                                        SEO & Diğer
                                                        {hasTabErrors('seo') && <i className="ri-error-warning-line ms-1 text-danger"></i>}
                                                    </Nav.Link>
                                                </Nav.Item>
                                            </Nav>

                                            <Tab.Content>
                                                {/* Temel Bilgiler */}
                                                <Tab.Pane eventKey="basic">
                                                    {/* Language Tabs for Translatable Fields */}
                                                    <Card className="mb-4">
                                                        <Card.Header>
                                                            <h6 className="mb-0">📝 Çevirilebilir Alanlar</h6>
                                                        </Card.Header>
                                                        <Card.Body>
                                                            <Tab.Container activeKey={activeLanguageTab} onSelect={(k) => setActiveLanguageTab(k || 'tr')}>
                                                                <Nav variant="pills" className="mb-3">
                                                                    {supportedLanguages.map(lang => (
                                                                        <Nav.Item key={lang.code}>
                                                                            <Nav.Link eventKey={lang.code}>
                                                                                {lang.flag} {lang.name}
                                                                            </Nav.Link>
                                                                        </Nav.Item>
                                                                    ))}
                                                                </Nav>
                                                                
                                                                <Tab.Content>
                                                                    {supportedLanguages.map(lang => (
                                                                        <Tab.Pane key={lang.code} eventKey={lang.code}>
                                                                            <Row>
                                                                                <Col md={6}>
                                                                                    <Form.Group className="mb-3">
                                                                                        <Form.Label>
                                                                                            Ürün Adı ({lang.name}) 
                                                                                            {lang.code === 'tr' && <span className="text-danger">*</span>}
                                                                                        </Form.Label>
                                                                                        <Form.Control
                                                                                            type="text"
                                                                                            value={data.translations[lang.code].name}
                                                                                            onChange={(e) => updateTranslation(lang.code, 'name', e.target.value)}
                                                                                            isInvalid={!!errors[`translations.${lang.code}.name`]}
                                                                                            placeholder={`${lang.name} ürün adı`}
                                                                                        />
                                                                                        <Form.Control.Feedback type="invalid">
                                                                                            {errors[`translations.${lang.code}.name`]}
                                                                                        </Form.Control.Feedback>
                                                                                    </Form.Group>
                                                                                </Col>
                                                                                <Col md={6}>
                                                                                    <Form.Group className="mb-3">
                                                                                        <Form.Label>Kısa Açıklama ({lang.name})</Form.Label>
                                                                                        <Form.Control
                                                                                            as="textarea"
                                                                                            rows={3}
                                                                                            value={data.translations[lang.code].short_description}
                                                                                            onChange={(e) => updateTranslation(lang.code, 'short_description', e.target.value)}
                                                                                            placeholder={`${lang.name} kısa açıklama`}
                                                                                        />
                                                                                    </Form.Group>
                                                                                </Col>
                                                                            </Row>
                                                                            <Row>
                                                                                <Col md={12}>
                                                                                    <Form.Group className="mb-3">
                                                                                        <Form.Label>Detaylı Açıklama ({lang.name})</Form.Label>
                                                                                        <Form.Control
                                                                                            as="textarea"
                                                                                            rows={5}
                                                                                            value={data.translations[lang.code].description}
                                                                                            onChange={(e) => updateTranslation(lang.code, 'description', e.target.value)}
                                                                                            placeholder={`${lang.name} detaylı açıklama`}
                                                                                        />
                                                                                    </Form.Group>
                                                                                </Col>
                                                                            </Row>
                                                                        </Tab.Pane>
                                                                    ))}
                                                                </Tab.Content>
                                                            </Tab.Container>
                                                        </Card.Body>
                                                    </Card>

                                                    <Row>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Ürün Kodu</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    value={data.code}
                                                                    onChange={(e) => setData('code', e.target.value)}
                                                                    isInvalid={!!errors.code}
                                                                    placeholder="Otomatik oluşturulacak"
                                                                />
                                                                <Form.Control.Feedback type="invalid">
                                                                    {errors.code}
                                                                </Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>SKU</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    value={data.sku}
                                                                    onChange={(e) => setData('sku', e.target.value)}
                                                                    isInvalid={!!errors.sku}
                                                                    placeholder="Otomatik oluşturulacak"
                                                                />
                                                                <Form.Control.Feedback type="invalid">
                                                                    {errors.sku}
                                                                </Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>

                                                    <Row>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>SKU</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    value={data.sku}
                                                                    onChange={(e) => setData('sku', e.target.value)}
                                                                    isInvalid={!!errors.sku}
                                                                    placeholder="Otomatik oluşturulacak"
                                                                />
                                                                <Form.Control.Feedback type="invalid">
                                                                    {errors.sku}
                                                                </Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Barkod</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    value={data.barcode}
                                                                    onChange={(e) => setData('barcode', e.target.value)}
                                                                    isInvalid={!!errors.barcode}
                                                                    placeholder="Ürün barkodu"
                                                                />
                                                                <Form.Control.Feedback type="invalid">
                                                                    {errors.barcode}
                                                                </Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>

                                                    <Row>
                                                        <Col md={12}>
                                                            <HierarchicalCategorySelect
                                                                categories={categories}
                                                                categoriesHierarchy={categoriesHierarchy}
                                                                selectedMainCategory={data.category_id}
                                                                selectedCategories={data.categories}
                                                                onMainCategoryChange={(categoryId) => setData('category_id', categoryId)}
                                                                onCategoriesChange={(categoryIds) => setData('categories', categoryIds)}
                                                                mainCategoryError={errors.category_id}
                                                                categoriesError={errors.categories}
                                                            />
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Col md={4}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Marka</Form.Label>
                                                                <Form.Select
                                                                    value={data.brand_id}
                                                                    onChange={(e) => setData('brand_id', e.target.value)}
                                                                    isInvalid={!!errors.brand_id}
                                                                >
                                                                    <option value="">Marka Seçin</option>
                                                                    {brands.map(brand => (
                                                                        <option key={brand.id} value={brand.id}>
                                                                            {brand.name}
                                                                        </option>
                                                                    ))}
                                                                </Form.Select>
                                                                <Form.Control.Feedback type="invalid">
                                                                    {errors.brand_id}
                                                                </Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={4}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Tedarikçi</Form.Label>
                                                                <SearchableSelect
                                                                    value={data.supplier_id}
                                                                    onChange={(value) => setData('supplier_id', value)}
                                                                    searchUrl={route('accounting.current-accounts.suggestions')}
                                                                    searchParams={{ type: 'supplier' }}
                                                                    placeholder="Tedarikçi ara..."
                                                                    isInvalid={!!errors.supplier_id}
                                                                    name="supplier_id"
                                                                    showCreateButton={true}
                                                                    createButtonText="Yeni Tedarikçi"
                                                                    displayFormat={(option) => {
                                                                        const titleWords = option.title.split(' ').slice(0, 2).join(' ');
                                                                        return option.account_code ? `${titleWords} (${option.account_code})` : titleWords;
                                                                    }}
                                                                />
                                                                {errors.supplier_id && (
                                                                    <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                                                                        {errors.supplier_id}
                                                                    </Form.Control.Feedback>
                                                                )}
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>

                                                    <Row>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Ürün Tipi</Form.Label>
                                                                <Form.Select
                                                                    value={data.product_type}
                                                                    onChange={(e) => setData('product_type', e.target.value)}
                                                                >
                                                                    {productTypes.map(type => (
                                                                        <option key={type.value} value={type.value}>
                                                                            {type.label}
                                                                        </option>
                                                                    ))}
                                                                </Form.Select>
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Vergi</Form.Label>
                                                                <Form.Select
                                                                    value={data.tax_id}
                                                                    onChange={(e) => setData('tax_id', e.target.value)}
                                                                    isInvalid={!!errors.tax_id}
                                                                >
                                                                    <option value="">Vergi Seçin</option>
                                                                    {taxes.map(tax => (
                                                                        <option key={tax.id} value={tax.id}>
                                                                            {tax.name} ({tax.type === 'percentage' ? `%${tax.rate}` : `${tax.fixed_amount}`})
                                                                        </option>
                                                                    ))}
                                                                </Form.Select>
                                                                <Form.Control.Feedback type="invalid">
                                                                    {errors.tax_id}
                                                                </Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>
                                                    
                                                    <Row>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>ERP Ayarları</Form.Label>
                                                                <div className="d-flex gap-3 align-items-center">
                                                                    <Form.Check
                                                                        type="checkbox"
                                                                        id="can_be_purchased"
                                                                        label="Satın Alınabilir"
                                                                        checked={data.can_be_purchased}
                                                                        onChange={(e) => setData('can_be_purchased', e.target.checked)}
                                                                    />
                                                                    <Form.Check
                                                                        type="checkbox"
                                                                        id="can_be_sold"
                                                                        label="Satılabilir"
                                                                        checked={data.can_be_sold}
                                                                        onChange={(e) => setData('can_be_sold', e.target.checked)}
                                                                    />
                                                                </div>
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Stok ve Seri Ayarları</Form.Label>
                                                                <div className="d-flex gap-3 align-items-center">
                                                                    <Form.Check
                                                                        type="checkbox"
                                                                        id="is_stockable"
                                                                        label="Stoklanabilir"
                                                                        checked={data.is_stockable}
                                                                        onChange={(e) => setData('is_stockable', e.target.checked)}
                                                                    />
                                                                    <Form.Check
                                                                        type="checkbox"
                                                                        id="is_serialized"
                                                                        label="Seri Numaralı"
                                                                        checked={data.is_serialized}
                                                                        onChange={(e) => setData('is_serialized', e.target.checked)}
                                                                    />
                                                                </div>
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>
                                                    
                                                    <Row>
                                                        <Col md={4}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Tedarik Süresi (Gün)</Form.Label>
                                                                <Form.Control
                                                                    type="number"
                                                                    value={data.lead_time_days}
                                                                    onChange={(e) => setData('lead_time_days', e.target.value)}
                                                                    isInvalid={!!errors.lead_time_days}
                                                                    placeholder="0"
                                                                    min="0"
                                                                    step="0.01"
                                                                />
                                                                <Form.Control.Feedback type="invalid">
                                                                    {errors.lead_time_days}
                                                                </Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={4}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Satın Alma Birimi</Form.Label>
                                                                <Form.Select
                                                                    value={data.purchase_uom}
                                                                    onChange={(e) => setData('purchase_uom', e.target.value)}
                                                                    isInvalid={!!errors.purchase_uom}
                                                                >
                                                                    <option value="">Birim Seçin</option>
                                                                    {units.map(unit => (
                                                                        <option key={unit.id} value={unit.symbol}>
                                                                            {unit.name} ({unit.symbol})
                                                                        </option>
                                                                    ))}
                                                                </Form.Select>
                                                                <Form.Control.Feedback type="invalid">
                                                                    {errors.purchase_uom}
                                                                </Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={4}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Satış Birimi</Form.Label>
                                                                <Form.Select
                                                                    value={data.sales_uom}
                                                                    onChange={(e) => setData('sales_uom', e.target.value)}
                                                                    isInvalid={!!errors.sales_uom}
                                                                >
                                                                    <option value="">Birim Seçin</option>
                                                                    {units.map(unit => (
                                                                        <option key={unit.id} value={unit.symbol}>
                                                                            {unit.name} ({unit.symbol})
                                                                        </option>
                                                                    ))}
                                                                </Form.Select>
                                                                <Form.Control.Feedback type="invalid">
                                                                    {errors.sales_uom}
                                                                </Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>

                                                    <Row>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Durum</Form.Label>
                                                                <div className="d-flex gap-3 align-items-center">
                                                                    <Form.Check
                                                                        type="checkbox"
                                                                        id="is_active"
                                                                        label="Aktif"
                                                                        checked={data.is_active}
                                                                        onChange={(e) => setData('is_active', e.target.checked)}
                                                                    />
                                                                    <Form.Check
                                                                        type="checkbox"
                                                                        id="is_featured"
                                                                        label="Öne Çıkan"
                                                                        checked={data.is_featured}
                                                                        onChange={(e) => setData('is_featured', e.target.checked)}
                                                                    />
                                                                    <Form.Check
                                                                        type="checkbox"
                                                                        id="is_new"
                                                                        label="Yeni Ürün"
                                                                        checked={data.is_new}
                                                                        onChange={(e) => setData('is_new', e.target.checked)}
                                                                    />
                                                                </div>
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>

                                                </Tab.Pane>

                                                {/* Fiyatlandırma */}
                                                <Tab.Pane eventKey="pricing">
                                                    <Row>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Maliyet Fiyatı <span className="text-danger">*</span></Form.Label>
                                                                <InputGroup>
                                                                    <Form.Control
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={data.cost_price}
                                                                        onChange={(e) => setData('cost_price', e.target.value)}
                                                                        isInvalid={!!errors.cost_price}
                                                                        placeholder="0.00"
                                                                    />
                                                                    <InputGroup.Text>₺</InputGroup.Text>
                                                                </InputGroup>
                                                                <Form.Control.Feedback type="invalid">
                                                                    {errors.cost_price}
                                                                </Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Satış Fiyatı <span className="text-danger">*</span></Form.Label>
                                                                <InputGroup>
                                                                    <Form.Control
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={data.sale_price}
                                                                        onChange={(e) => setData('sale_price', e.target.value)}
                                                                        isInvalid={!!errors.sale_price}
                                                                        placeholder="0.00"
                                                                    />
                                                                    <InputGroup.Text>₺</InputGroup.Text>
                                                                </InputGroup>
                                                                <Form.Control.Feedback type="invalid">
                                                                    {errors.sale_price}
                                                                </Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>

                                                    <Row>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Toptan Fiyatı</Form.Label>
                                                                <InputGroup>
                                                                    <Form.Control
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={data.wholesale_price}
                                                                        onChange={(e) => setData('wholesale_price', e.target.value)}
                                                                        placeholder="0.00"
                                                                    />
                                                                    <InputGroup.Text>₺</InputGroup.Text>
                                                                </InputGroup>
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Minimum Satış Fiyatı</Form.Label>
                                                                <InputGroup>
                                                                    <Form.Control
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={data.min_sale_price}
                                                                        onChange={(e) => setData('min_sale_price', e.target.value)}
                                                                        placeholder="0.00"
                                                                    />
                                                                    <InputGroup.Text>₺</InputGroup.Text>
                                                                </InputGroup>
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>

                                                    <Row>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>KDV Oranı (%)</Form.Label>
                                                                <Form.Control
                                                                    type="number"
                                                                    min="0"
                                                                    max="100"
                                                                    value={data.tax_rate}
                                                                    onChange={(e) => setData('tax_rate', e.target.value)}
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Para Birimi</Form.Label>
                                                                <Form.Select
                                                                    value={data.currency}
                                                                    onChange={(e) => setData('currency', e.target.value)}
                                                                >
                                                                    {currencies.map(currency => (
                                                                        <option key={currency.value} value={currency.value}>
                                                                            {currency.label}
                                                                        </option>
                                                                    ))}
                                                                </Form.Select>
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>
                                                </Tab.Pane>

                                                {/* Stok Yönetimi */}
                                                <Tab.Pane eventKey="inventory">
                                                    <Row>
                                                        <Col md={4}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Mevcut Stok <span className="text-danger">*</span></Form.Label>
                                                                <Form.Control
                                                                    type="number"
                                                                    min="0"
                                                                    value={data.stock_quantity}
                                                                    onChange={(e) => setData('stock_quantity', e.target.value)}
                                                                    isInvalid={!!errors.stock_quantity}
                                                                    placeholder="0"
                                                                />
                                                                <Form.Control.Feedback type="invalid">
                                                                    {errors.stock_quantity}
                                                                </Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={4}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Minimum Stok Seviyesi <span className="text-danger">*</span></Form.Label>
                                                                <Form.Control
                                                                    type="number"
                                                                    min="0"
                                                                    value={data.min_stock_level}
                                                                    onChange={(e) => setData('min_stock_level', e.target.value)}
                                                                    isInvalid={!!errors.min_stock_level}
                                                                    placeholder="0"
                                                                />
                                                                <Form.Control.Feedback type="invalid">
                                                                    {errors.min_stock_level}
                                                                </Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={4}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Maksimum Stok Seviyesi</Form.Label>
                                                                <Form.Control
                                                                    type="number"
                                                                    min="0"
                                                                    value={data.max_stock_level}
                                                                    onChange={(e) => setData('max_stock_level', e.target.value)}
                                                                    placeholder="0"
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>

                                                    <Row>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Ölçü Birimi</Form.Label>
                                                                <Form.Select
                                                                    value={data.unit_of_measure}
                                                                    onChange={(e) => setData('unit_of_measure', e.target.value)}
                                                                >
                                                                    {units.map(unit => (
                                                                        <option key={unit.value} value={unit.value}>
                                                                            {unit.label}
                                                                        </option>
                                                                    ))}
                                                                </Form.Select>
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Stok Takibi</Form.Label>
                                                                <div className="d-flex gap-3 align-items-center">
                                                                    <Form.Check
                                                                        type="checkbox"
                                                                        id="track_inventory"
                                                                        label="Stok Takibi Yap"
                                                                        checked={data.track_inventory}
                                                                        onChange={(e) => setData('track_inventory', e.target.checked)}
                                                                    />
                                                                    <Form.Check
                                                                        type="checkbox"
                                                                        id="allow_backorder"
                                                                        label="Stok Bittiğinde Sipariş Al"
                                                                        checked={data.allow_backorder}
                                                                        onChange={(e) => setData('allow_backorder', e.target.checked)}
                                                                    />
                                                                </div>
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>
                                                </Tab.Pane>

                                                {/* Fiziksel Özellikler */}
                                                <Tab.Pane eventKey="physical">
                                                    <Row>
                                                        <Col md={3}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Ağırlık (kg)</Form.Label>
                                                                <Form.Control
                                                                    type="number"
                                                                    step="0.001"
                                                                    value={data.weight}
                                                                    onChange={(e) => setData('weight', e.target.value)}
                                                                    placeholder="0.000"
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={3}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>En (cm)</Form.Label>
                                                                <Form.Control
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={data.width}
                                                                    onChange={(e) => setData('width', e.target.value)}
                                                                    placeholder="0.00"
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={3}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Boy (cm)</Form.Label>
                                                                <Form.Control
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={data.height}
                                                                    onChange={(e) => setData('height', e.target.value)}
                                                                    placeholder="0.00"
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={3}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Derinlik (cm)</Form.Label>
                                                                <Form.Control
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={data.depth}
                                                                    onChange={(e) => setData('depth', e.target.value)}
                                                                    placeholder="0.00"
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>

                                                    <Row>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Hacim (litre)</Form.Label>
                                                                <Form.Control
                                                                    type="number"
                                                                    step="0.001"
                                                                    value={data.volume}
                                                                    onChange={(e) => setData('volume', e.target.value)}
                                                                    placeholder="0.000"
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Menşei Ülke</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    value={data.country_of_origin}
                                                                    onChange={(e) => setData('country_of_origin', e.target.value)}
                                                                    placeholder="Türkiye"
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>

                                                    <Row>
                                                        <Col md={4}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Paket İçi Adet</Form.Label>
                                                                <Form.Control
                                                                    type="number"
                                                                    min="1"
                                                                    value={data.items_per_package}
                                                                    onChange={(e) => setData('items_per_package', e.target.value)}
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={4}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Koli İçi Adet</Form.Label>
                                                                <Form.Control
                                                                    type="number"
                                                                    min="1"
                                                                    value={data.items_per_box}
                                                                    onChange={(e) => setData('items_per_box', e.target.value)}
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={4}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Palet İçi Koli</Form.Label>
                                                                <Form.Control
                                                                    type="number"
                                                                    min="1"
                                                                    value={data.boxes_per_pallet}
                                                                    onChange={(e) => setData('boxes_per_pallet', e.target.value)}
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>

                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Paket Tipi</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            value={data.package_type}
                                                            onChange={(e) => setData('package_type', e.target.value)}
                                                            placeholder="Karton Kutu, Plastik Poşet, vb."
                                                        />
                                                    </Form.Group>
                                                </Tab.Pane>

                                                {/* Görseller */}
                                                <Tab.Pane eventKey="images">
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Ürün Görselleri</Form.Label>
                                                        <Form.Control
                                                            type="file"
                                                            multiple
                                                            accept="image/*"
                                                            onChange={handleImageChange}
                                                            isInvalid={!!errors.images}
                                                        />
                                                        <Form.Text className="text-muted">
                                                            Birden fazla görsel seçebilirsiniz. İlk görsel ana görsel olarak kullanılacaktır.
                                                        </Form.Text>
                                                        <Form.Control.Feedback type="invalid">
                                                            {errors.images}
                                                        </Form.Control.Feedback>
                                                    </Form.Group>

                                                    {selectedImages.length > 0 && (
                                                        <div className="selected-images">
                                                            <h6>Seçilen Görseller:</h6>
                                                            <Row>
                                                                {selectedImages.map((image, index) => (
                                                                    <Col key={index} md={2} className="mb-3">
                                                                        <div className="position-relative">
                                                                            <img
                                                                                src={URL.createObjectURL(image)}
                                                                                alt={`Preview ${index + 1}`}
                                                                                className="img-thumbnail"
                                                                                style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                                                                            />
                                                                            <Button
                                                                                variant="danger"
                                                                                size="sm"
                                                                                className="position-absolute top-0 end-0 m-1"
                                                                                onClick={() => removeImage(index)}
                                                                            >
                                                                                <i className="ri-close-line"></i>
                                                                            </Button>
                                                                            {index === 0 && (
                                                                                <span className="badge bg-primary position-absolute bottom-0 start-0 m-1">
                                                                                    Ana Görsel
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </Col>
                                                                ))}
                                                            </Row>
                                                        </div>
                                                    )}
                                                </Tab.Pane>

                                                {/* SEO & Diğer */}
                                                <Tab.Pane eventKey="seo">
                                                    {/* Language Tabs for SEO Fields */}
                                                    <Card className="mb-4">
                                                        <Card.Header>
                                                            <h6 className="mb-0">🔍 SEO Çevirilebilir Alanlar</h6>
                                                        </Card.Header>
                                                        <Card.Body>
                                                            <Tab.Container activeKey={activeLanguageTab} onSelect={(k) => setActiveLanguageTab(k || 'tr')}>
                                                                <Nav variant="pills" className="mb-3">
                                                                    {supportedLanguages.map(lang => (
                                                                        <Nav.Item key={lang.code}>
                                                                            <Nav.Link eventKey={lang.code}>
                                                                                {lang.flag} {lang.name}
                                                                            </Nav.Link>
                                                                        </Nav.Item>
                                                                    ))}
                                                                </Nav>
                                                                
                                                                <Tab.Content>
                                                                    {supportedLanguages.map(lang => (
                                                                        <Tab.Pane key={lang.code} eventKey={lang.code}>
                                                                            <Form.Group className="mb-3">
                                                                                <Form.Label>SEO Başlık ({lang.name})</Form.Label>
                                                                                <Form.Control
                                                                                    type="text"
                                                                                    value={data.translations[lang.code].meta_title}
                                                                                    onChange={(e) => updateTranslation(lang.code, 'meta_title', e.target.value)}
                                                                                    placeholder={`${lang.name} SEO başlık`}
                                                                                />
                                                                            </Form.Group>
                                                                            <Form.Group className="mb-3">
                                                                                <Form.Label>SEO Açıklama ({lang.name})</Form.Label>
                                                                                <Form.Control
                                                                                    as="textarea"
                                                                                    rows={3}
                                                                                    value={data.translations[lang.code].meta_description}
                                                                                    onChange={(e) => updateTranslation(lang.code, 'meta_description', e.target.value)}
                                                                                    placeholder={`${lang.name} SEO açıklama`}
                                                                                />
                                                                            </Form.Group>
                                                                            <Form.Group className="mb-3">
                                                                                <Form.Label>SEO Anahtar Kelimeler ({lang.name})</Form.Label>
                                                                                <Form.Control
                                                                                    type="text"
                                                                                    value={data.translations[lang.code].meta_keywords}
                                                                                    onChange={(e) => updateTranslation(lang.code, 'meta_keywords', e.target.value)}
                                                                                    placeholder={`${lang.name} anahtar kelimeler`}
                                                                                />
                                                                            </Form.Group>
                                                                        </Tab.Pane>
                                                                    ))}
                                                                </Tab.Content>
                                                            </Tab.Container>
                                                        </Card.Body>
                                                    </Card>

                                                    <Row>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Garanti Süresi (Ay)</Form.Label>
                                                                <Form.Control
                                                                    type="number"
                                                                    min="0"
                                                                    value={data.warranty_period}
                                                                    onChange={(e) => setData('warranty_period', e.target.value)}
                                                                    placeholder="0"
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>

                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Garanti Bilgisi</Form.Label>
                                                        <Form.Control
                                                            as="textarea"
                                                            rows={3}
                                                            value={data.warranty_info}
                                                            onChange={(e) => setData('warranty_info', e.target.value)}
                                                            placeholder="Garanti ile ilgili detay bilgiler"
                                                        />
                                                    </Form.Group>
                                                </Tab.Pane>
                                            </Tab.Content>
                                        </Tab.Container>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>

                        <Row>
                            <Col>
                                <div className="text-end">
                                    <Link href={route('products.index')} className="btn btn-secondary me-2">
                                        İptal
                                    </Link>
                                    <Button type="submit" variant="primary" disabled={processing}>
                                        {processing ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Kaydediliyor...
                                            </>
                                        ) : (
                                            <>
                                                <i className="ri-save-line me-1"></i>
                                                Ürünü Kaydet
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </Col>
                        </Row>
                    </Form>
                </div>
            </div>
        </Layout>
    );
}