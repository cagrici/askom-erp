import React, { useState, useEffect } from 'react';
import Layout from '@/Layouts';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import { Card, Form, Button, Row, Col, Nav, Tab, InputGroup, Alert, Badge } from 'react-bootstrap';
import { CategoryModal, BrandModal, SupplierModal, createCategory, createBrand, createSupplier } from '@/Components/ProductModals';
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

interface ProductImage {
    id: number;
    image_path: string;
    thumbnail_path: string;
    is_primary: boolean;
    sort_order: number;
}

interface ProductUnit {
    id?: number;
    unit_id: number;
    unit?: Unit;
    conversion_factor: number;
    barcode?: string;
    sale_price?: number;
    wholesale_price?: number;
    min_order_quantity?: number;
    is_base_unit: boolean;
    is_active?: boolean;
}

interface ProductTranslation {
    id?: number;
    locale: string;
    name: string;
    description?: string;
    short_description?: string;
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
}

interface Product {
    id: number;
    name: string;
    slug: string;
    code: string;
    barcode?: string;
    sku: string;
    category_id?: number;
    categories?: Category[];
    brand_id?: number;
    supplier_id?: number;
    description?: string;
    short_description?: string;
    translations?: ProductTranslation[];
    cost_price?: number;
    sale_price?: number;
    wholesale_price?: number;
    min_sale_price?: number;
    tax_rate: number;
    currency: string;
    stock_quantity: number;
    min_stock_level?: number;
    max_stock_level?: number;
    track_inventory: boolean;
    allow_backorder: boolean;
    weight?: number;
    width?: number;
    height?: number;
    depth?: number;
    volume?: number;
    unit_of_measure: string;
    items_per_package: number;
    items_per_box?: number;
    boxes_per_pallet?: number;
    package_type?: string;
    product_type: string;
    is_active: boolean;
    is_featured: boolean;
    is_digital: boolean;
    is_new: boolean;
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
    specifications?: Record<string, any>;
    tags?: string[];
    country_of_origin?: string;
    warranty_period?: number;
    warranty_info?: string;
    images?: ProductImage[];
    units?: ProductUnit[];
}

interface Props {
    product: Product;
    categories: Category[];
    categoriesHierarchy: Category[];
    brands: Brand[];
    suppliers: Supplier[];
    units: Unit[];
    taxes: Tax[];
    attributes: ProductAttribute[];
    productTypes: Array<{ value: string; label: string }>;
    currencies: Array<{ value: string; label: string }>;
    commonUnits?: Array<{ code: string; name: string; conversion: number }>;
    userPermissions: {
        canCreateCategories: boolean;
        canCreateBrands: boolean;
        canCreateSuppliers: boolean;
    };
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function ProductEdit({ 
    product,
    categories,
    categoriesHierarchy, 
    brands, 
    suppliers, 
    units,
    taxes,
    attributes, 
    productTypes, 
    currencies,
    commonUnits,
    userPermissions,
    flash 
}: Props) {
    const { t } = useTranslation();
    const { props } = usePage<any>();
    const [activeTab, setActiveTab] = useState('basic');
    const [activeLanguageTab, setActiveLanguageTab] = useState('tr');
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [showAlert, setShowAlert] = useState<{type: 'success' | 'error' | 'warning' | 'info', message: string} | null>(null);

    // Supported languages
    const supportedLanguages = [
        { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
        { code: 'en', name: 'English', flag: '🇬🇧' },
        { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
        { code: 'fr', name: 'Français', flag: '🇫🇷' }
    ];

    // Initialize translations from product data
    const initializeTranslations = () => {
        const translations: Record<string, any> = {};
        
        // Debug: Translations verilerini kontrol et
        console.log('Product translations:', product.translations);
        
        supportedLanguages.forEach(lang => {
            const existingTranslation = product.translations?.find(t => t.locale === lang.code);
            console.log(`Translation for ${lang.code}:`, existingTranslation);
            
            translations[lang.code] = {
                name: existingTranslation?.name || (lang.code === 'tr' ? product.name || '' : ''),
                description: existingTranslation?.description || (lang.code === 'tr' ? product.description || '' : ''),
                short_description: existingTranslation?.short_description || (lang.code === 'tr' ? product.short_description || '' : ''),
                meta_title: existingTranslation?.meta_title || (lang.code === 'tr' ? product.meta_title || '' : ''),
                meta_description: existingTranslation?.meta_description || (lang.code === 'tr' ? product.meta_description || '' : ''),
                meta_keywords: existingTranslation?.meta_keywords || (lang.code === 'tr' ? product.meta_keywords || '' : '')
            };
        });
        
        console.log('Initialized translations:', translations);
        return translations;
    };
    
    // Modal states
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showBrandModal, setShowBrandModal] = useState(false);
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    
    // Lists state for dynamic updates
    const [categoriesList, setCategoriesList] = useState(categories);
    const [brandsList, setBrandsList] = useState(brands);
    const [suppliersList, setSuppliersList] = useState(suppliers);

    // Helper function to get supplier display text
    const getSupplierDisplayText = (supplierId: number | null) => {
        if (!supplierId) return '';
        const supplier = suppliersList.find(s => s.id === supplierId);
        if (!supplier) return '';
        
        // Get first 2 words from title
        const titleWords = supplier.title.split(' ').slice(0, 2).join(' ');
        return supplier.account_code ? `${titleWords} (${supplier.account_code})` : titleWords;
    };

    // Flash mesajları için useEffect - hem prop'tan hem de global'den kontrol et
    useEffect(() => {
        // Props'tan gelen flash mesajlarını kontrol et
        if (flash?.success) {
            setShowAlert({type: 'success', message: flash.success});
            setTimeout(() => setShowAlert(null), 5000);
        } else if (flash?.error) {
            setShowAlert({type: 'error', message: flash.error});
            setTimeout(() => setShowAlert(null), 8000);
        }
        // Global flash mesajlarını kontrol et
        else if (props.flash?.success) {
            setShowAlert({type: 'success', message: props.flash.success});
            setTimeout(() => setShowAlert(null), 5000);
        } else if (props.flash?.error) {
            setShowAlert({type: 'error', message: props.flash.error});
            setTimeout(() => setShowAlert(null), 8000);
        } else if (props.flash?.warning) {
            setShowAlert({type: 'warning', message: props.flash.warning});
            setTimeout(() => setShowAlert(null), 6000);
        } else if (props.flash?.info) {
            setShowAlert({type: 'info', message: props.flash.info});
            setTimeout(() => setShowAlert(null), 5000);
        }
    }, [flash, props.flash]);

    // Tab'lardaki hataları kontrol eden fonksiyon
    const getTabErrors = (tabName: string) => {
        const tabFields: Record<string, string[]> = {
            'basic': ['name', 'code', 'sku', 'barcode', 'category_id', 'brand_id', 'supplier_id', 'description', 'short_description'],
            'pricing': ['cost_price', 'sale_price', 'wholesale_price', 'min_sale_price', 'tax_rate', 'currency'],
            'inventory': ['stock_quantity', 'min_stock_level', 'max_stock_level', 'track_inventory', 'allow_backorder'],
            'physical': ['weight', 'width', 'height', 'depth', 'volume', 'unit_of_measure'],
            'packaging': ['items_per_package', 'items_per_box', 'boxes_per_pallet', 'package_type'],
            'units': ['units'],
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

    const { data, setData, put, processing, errors, reset, clearErrors } = useForm({
        // Temel Bilgiler
        name: product.name || '',
        code: product.code || '',
        barcode: product.barcode || '',
        sku: product.sku || '',
        category_id: product.category_id || null,
        categories: product.categories?.map(cat => cat.id) || [],
        brand_id: product.brand_id || null,
        supplier_id: product.supplier_id || null,
        description: product.description || '',
        short_description: product.short_description || '',

        // Translations
        translations: initializeTranslations(),
        
        // Fiyat Bilgileri
        cost_price: product.cost_price || '',
        sale_price: product.sale_price || '',
        wholesale_price: product.wholesale_price || '',
        min_sale_price: product.min_sale_price || '',
        tax_rate: product.tax_rate || '18',
        currency: product.currency || 'TRY',
        
        // Stok Bilgileri
        stock_quantity: product.stock_quantity || '',
        min_stock_level: product.min_stock_level || '',
        max_stock_level: product.max_stock_level || '',
        track_inventory: product.track_inventory || true,
        allow_backorder: product.allow_backorder || false,
        
        // Fiziksel Özellikler
        weight: product.weight || '',
        width: product.width || '',
        height: product.height || '',
        depth: product.depth || '',
        volume: product.volume || '',
        unit_of_measure: product.unit_of_measure || 'adet',
        
        // Paketleme
        items_per_package: product.items_per_package || '1',
        items_per_box: product.items_per_box || '',
        boxes_per_pallet: product.boxes_per_pallet || '',
        package_type: product.package_type || '',
        
        // Ürün Durumları
        is_active: product.is_active || true,
        is_featured: product.is_featured || false,
        is_digital: product.is_digital || false,
        is_new: product.is_new || false,
        
        // SEO
        meta_title: product.meta_title || '',
        meta_description: product.meta_description || '',
        meta_keywords: product.meta_keywords || '',
        
        // Diğer
        country_of_origin: product.country_of_origin || '',
        warranty_period: product.warranty_period || '',
        warranty_info: product.warranty_info || '',
        tags: product.tags || [],
        specifications: product.specifications || {},
        
        // Görseller
        images: [] as File[],
        
        // ERP Alanları
        product_type: product.product_type || 'trading_goods',
        tax_id: product.tax_id || '',
        can_be_purchased: product.can_be_purchased ?? true,
        can_be_sold: product.can_be_sold ?? true,
        is_stockable: product.is_stockable ?? true,
        is_serialized: product.is_serialized ?? false,
        lead_time_days: product.lead_time_days || '',
        purchase_uom: product.purchase_uom || '',
        sales_uom: product.sales_uom || '',
        
        // Birimler
        units: product.units || [],
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

    // İlk hatalı tab'ı bulan fonksiyon
    const findFirstErrorTab = (errors: Record<string, string>) => {
        const tabFields: Record<string, string[]> = {
            'basic': ['name', 'code', 'sku', 'barcode', 'category_id', 'brand_id', 'supplier_id', 'description', 'short_description'],
            'pricing': ['cost_price', 'sale_price', 'wholesale_price', 'min_sale_price', 'tax_rate', 'currency'],
            'inventory': ['stock_quantity', 'min_stock_level', 'max_stock_level', 'track_inventory', 'allow_backorder'],
            'physical': ['weight', 'width', 'height', 'depth', 'volume', 'unit_of_measure'],
            'packaging': ['items_per_package', 'items_per_box', 'boxes_per_pallet', 'package_type'],
            'units': ['units'],
            'images': ['images'],
            'seo': ['meta_title', 'meta_description', 'meta_keywords']
        };

        const tabOrder = ['basic', 'pricing', 'inventory', 'physical', 'packaging', 'units', 'images', 'seo'];
        
        for (const tab of tabOrder) {
            const fields = tabFields[tab] || [];
            if (fields.some(field => errors[field])) {
                return tab;
            }
        }
        
        return null;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Translation verilerini backend'in beklediği formata çevir
        const translationsArray = Object.entries(data.translations)
            .filter(([locale, translation]) => {
                // En az name alanı dolu olmalı
                return translation && translation.name && translation.name.trim().length > 0;
            })
            .map(([locale, translation]) => ({
                locale,
                name: translation.name.trim(),
                description: translation.description ? translation.description.trim() : null,
                short_description: translation.short_description ? translation.short_description.trim() : null,
                meta_title: translation.meta_title ? translation.meta_title.trim() : null,
                meta_description: translation.meta_description ? translation.meta_description.trim() : null,
                meta_keywords: translation.meta_keywords ? translation.meta_keywords.trim() : null
            }));

        // Form verilerini hazırla ve dönüştür
        const formDataToSend = { 
            ...data,
            translations: translationsArray
        };
        
        
        // ID alanlarını number'a çevir veya null yap
        const idFields = ['category_id', 'brand_id', 'supplier_id'];
        idFields.forEach(field => {
            if (formDataToSend[field] === '' || formDataToSend[field] === null || formDataToSend[field] === undefined) {
                formDataToSend[field] = null;
            } else {
                formDataToSend[field] = parseInt(String(formDataToSend[field]));
            }
        });
        
        // Numeric alanları number'a çevir
        const numericFields = ['cost_price', 'sale_price', 'wholesale_price', 'min_sale_price', 'tax_rate', 'stock_quantity', 'min_stock_level', 'max_stock_level', 'weight', 'width', 'height', 'depth', 'volume', 'items_per_package', 'items_per_box', 'boxes_per_pallet', 'warranty_period'];
        numericFields.forEach(field => {
            if (formDataToSend[field] === '' || formDataToSend[field] === null || formDataToSend[field] === undefined) {
                formDataToSend[field] = null;
            } else {
                const numValue = parseFloat(String(formDataToSend[field]));
                formDataToSend[field] = isNaN(numValue) ? null : numValue;
            }
        });
        
        // Boolean alanları düzenle
        const booleanFields = ['track_inventory', 'allow_backorder', 'is_active', 'is_featured', 'is_digital', 'is_new'];
        booleanFields.forEach(field => {
            formDataToSend[field] = Boolean(formDataToSend[field]);
        });
        
        // Her zaman FormData kullan (resim olsun olmasın)
        console.log('Sending with FormData:', formDataToSend);
        console.log('Selected images:', selectedImages.length);
        console.log('Units data to send:', formDataToSend.units);
        
        const formData = new FormData();
        
        // _method alanını ekle (Laravel'in PUT request için)
        formData.append('_method', 'PUT');
        
        // Tüm form verilerini ekle
        Object.entries(formDataToSend).forEach(([key, value]) => {
            if (key === 'images') {
                // Seçilen resimleri ekle
                selectedImages.forEach((image, index) => {
                    console.log(`Adding image ${index}:`, {
                        name: image.name,
                        size: image.size,
                        type: image.type
                    });
                    formData.append(`images[${index}]`, image);
                });
                console.log(`Total images added: ${selectedImages.length}`);
            } else if (key === 'tags' && Array.isArray(value)) {
                formData.append(key, JSON.stringify(value));
            } else if (key === 'specifications' && typeof value === 'object') {
                formData.append(key, JSON.stringify(value));
            } else if (key === 'translations' && Array.isArray(value)) {
                // Translations array özel işleme
                value.forEach((translation, index) => {
                    Object.entries(translation).forEach(([translationKey, translationValue]) => {
                        if (translationValue !== null && translationValue !== undefined) {
                            formData.append(`translations[${index}][${translationKey}]`, String(translationValue));
                        }
                    });
                });
            } else if (key === 'categories' && Array.isArray(value)) {
                // Categories array özel işleme
                value.forEach((categoryId, index) => {
                    if (categoryId !== null && categoryId !== undefined) {
                        formData.append(`categories[${index}]`, String(categoryId));
                    }
                });
            } else if (key === 'units' && Array.isArray(value)) {
                // Units array özel işleme
                value.forEach((unit, index) => {
                    Object.entries(unit).forEach(([unitKey, unitValue]) => {
                        if (unitValue !== null && unitValue !== undefined) {
                            // Boolean değerleri 1/0 olarak gönder
                            if (typeof unitValue === 'boolean') {
                                formData.append(`units[${index}][${unitKey}]`, unitValue ? '1' : '0');
                            } else {
                                formData.append(`units[${index}][${unitKey}]`, String(unitValue));
                            }
                        }
                    });
                });
            } else if (typeof value === 'boolean') {
                formData.append(key, value ? '1' : '0');
            } else {
                // Her alanı gönder, null veya undefined ise empty string olarak gönder
                const stringValue = value === null || value === undefined ? '' : String(value);
                formData.append(key, stringValue);
            }
        });

        // FormData içeriğini kontrol et
        console.log('FormData contents:');
        for (let [key, value] of formData.entries()) {
            console.log(key, ':', value);
        }

        // Her zaman POST method kullan FormData ile
        router.post(route('products.update', product.id), formData, {
            forceFormData: true,
            onStart: () => {
                console.log('Upload başlatıldı...');
            },
            onProgress: (progress) => {
                console.log('Upload progress:', progress);
            },
            onSuccess: (response) => {
                console.log('Upload başarılı!', response);
                // Seçilen resimleri temizle
                setSelectedImages([]);
                setData('images', []);
                // Flash mesajı göster
                if (selectedImages.length > 0) {
                    // Sayfayı yenile (güncellenmiş görselleri görmek için)
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                }
            },
            onError: (errors) => {
                console.log('FormData validation errors:', errors);
                const firstErrorTab = findFirstErrorTab(errors);
                if (firstErrorTab) {
                    setActiveTab(firstErrorTab);
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
            },
            onFinish: () => {
                console.log('Request tamamlandı');
            }
        });
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

    // AJAX functions for creating new items
    const handleCreateCategory = async (categoryData: {name: string, description?: string, parent_id?: number}) => {
        try {
            const result = await createCategory(categoryData);
            if (result.success) {
                setCategoriesList([...categoriesList, result.data]);
                setData('category_id', result.data.id);
                setShowCategoryModal(false);
                setShowAlert({type: 'success', message: result.message});
            } else {
                setShowAlert({type: 'error', message: result.message});
            }
        } catch (error) {
            setShowAlert({type: 'error', message: 'Kategori oluşturulurken bir hata oluştu.'});
        }
    };

    const handleCreateBrand = async (brandData: {name: string, description?: string}) => {
        try {
            const result = await createBrand(brandData);
            if (result.success) {
                setBrandsList([...brandsList, result.data]);
                setData('brand_id', result.data.id);
                setShowBrandModal(false);
                setShowAlert({type: 'success', message: result.message});
            } else {
                setShowAlert({type: 'error', message: result.message});
            }
        } catch (error) {
            setShowAlert({type: 'error', message: 'Marka oluşturulurken bir hata oluştu.'});
        }
    };

    const handleCreateSupplier = async (supplierData: {name: string, company_name?: string, phone?: string, email?: string}) => {
        try {
            const result = await createSupplier(supplierData);
            if (result.success) {
                setSuppliersList([...suppliersList, result.data]);
                setData('supplier_id', result.data.id);
                setShowSupplierModal(false);
                setShowAlert({type: 'success', message: result.message});
            } else {
                setShowAlert({type: 'error', message: result.message});
            }
        } catch (error) {
            setShowAlert({type: 'error', message: 'Tedarikçi oluşturulurken bir hata oluştu.'});
        }
    };

    // Unit management functions
    const addUnit = () => {
        const newUnit: ProductUnit = {
            unit_id: 0,
            conversion_factor: 1,
            barcode: '',
            sale_price: undefined,
            wholesale_price: undefined,
            min_order_quantity: 1,
            is_base_unit: data.units.length === 0,
            is_active: true
        };
        setData('units', [...data.units, newUnit]);
    };

    const removeUnit = (index: number) => {
        const newUnits = data.units.filter((_, i) => i !== index);
        setData('units', newUnits);
    };

    const updateUnit = (index: number, field: keyof ProductUnit, value: any) => {
        const updatedUnits = [...data.units];
        updatedUnits[index] = { ...updatedUnits[index], [field]: value };
        
        // Eğer is_base_unit true yapılıyorsa, diğerlerini false yap
        if (field === 'is_base_unit' && value === true) {
            updatedUnits.forEach((unit, i) => {
                if (i !== index) {
                    unit.is_base_unit = false;
                }
            });
        }
        
        setData('units', updatedUnits);
    };

    const setUnitFromCommon = (index: number, commonUnit: { code: string; name: string; conversion: number }) => {
        const updatedUnits = [...data.units];
        updatedUnits[index] = {
            ...updatedUnits[index],
            unit_name: commonUnit.name,
            unit_code: commonUnit.code,
            conversion_factor: commonUnit.conversion
        };
        setData('units', updatedUnits);
    };

    return (
        <>
            <Head title={`${product.name} - Düzenle`} />
            <Layout>
                <div className="page-content">
                    <div className="container-fluid">
                    <Row className="mb-3">
                        <Col>
                            <div className="page-title-box d-flex align-items-center justify-content-between">
                                <h4 className="mb-0">Ürün Düzenle: {product.name}</h4>
                                <div className="d-flex gap-2">
                                    <Link href={route('products.show', product.id)} className="btn btn-info">
                                        <i className="ri-eye-line me-1"></i>
                                        Görüntüle
                                    </Link>
                                    <Link href={route('products.index')} className="btn btn-secondary">
                                        <i className="ri-arrow-left-line me-1"></i>
                                        Geri Dön
                                    </Link>
                                </div>
                            </div>
                        </Col>
                    </Row>

                    {/* Başarı/Hata/Uyarı/Bilgi Mesajları */}
                    {showAlert && (
                        <Row className="mb-3">
                            <Col>
                                <Alert 
                                    variant={
                                        showAlert.type === 'success' ? 'success' :
                                        showAlert.type === 'error' ? 'danger' :
                                        showAlert.type === 'warning' ? 'warning' : 'info'
                                    } 
                                    dismissible 
                                    onClose={() => setShowAlert(null)}
                                >
                                    <Alert.Heading className="h6">
                                        <i className={
                                            showAlert.type === 'success' ? 'ri-check-line me-1' :
                                            showAlert.type === 'error' ? 'ri-error-warning-line me-1' :
                                            showAlert.type === 'warning' ? 'ri-alert-line me-1' : 'ri-information-line me-1'
                                        }></i>
                                        {
                                            showAlert.type === 'success' ? 'Başarılı' :
                                            showAlert.type === 'error' ? 'Hata' :
                                            showAlert.type === 'warning' ? 'Uyarı' : 'Bilgi'
                                        }
                                    </Alert.Heading>
                                    {showAlert.message}
                                </Alert>
                            </Col>
                        </Row>
                    )}

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
                                                    <Nav.Link eventKey="units" className={hasTabErrors('units') ? 'text-danger' : ''}>
                                                        <i className="ri-stack-2-line me-1"></i>
                                                        Birimler
                                                        {hasTabErrors('units') && <i className="ri-error-warning-line ms-1 text-danger"></i>}
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
                                                                    placeholder="Ürün kodu"
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
                                                                    placeholder="SKU"
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
                                                                    placeholder="Stok takip kodu"
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
                                                                onMainCategoryChange={(categoryId) => setData('category_id', categoryId || null)}
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
                                                                <InputGroup>
                                                                    <Form.Select
                                                                        value={data.brand_id || ''}
                                                                        onChange={(e) => setData('brand_id', e.target.value || null)}
                                                                        isInvalid={!!errors.brand_id}
                                                                    >
                                                                        <option value="">Marka Seçin</option>
                                                                        {brandsList.map(brand => (
                                                                            <option key={brand.id} value={brand.id}>
                                                                                {brand.name}
                                                                            </option>
                                                                        ))}
                                                                    </Form.Select>
                                                                    {userPermissions.canCreateBrands && (
                                                                        <Button 
                                                                            variant="outline-primary" 
                                                                            onClick={() => setShowBrandModal(true)}
                                                                            title="Yeni Marka Ekle"
                                                                        >
                                                                            <i className="ri-add-line"></i>
                                                                        </Button>
                                                                    )}
                                                                </InputGroup>
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
                                                                    showCreateButton={userPermissions.canCreateSuppliers}
                                                                    onCreateNew={() => setShowSupplierModal(true)}
                                                                    createButtonText="Yeni Tedarikçi"
                                                                    initialDisplayText={getSupplierDisplayText(data.supplier_id)}
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

                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Açıklama</Form.Label>
                                                        <Form.Control
                                                            as="textarea"
                                                            rows={4}
                                                            value={data.description}
                                                            onChange={(e) => setData('description', e.target.value)}
                                                            placeholder="Ürün açıklaması"
                                                        />
                                                    </Form.Group>

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
                                                                        id="can_be_purchased_edit"
                                                                        label="Satın Alınabilir"
                                                                        checked={data.can_be_purchased}
                                                                        onChange={(e) => setData('can_be_purchased', e.target.checked)}
                                                                    />
                                                                    <Form.Check
                                                                        type="checkbox"
                                                                        id="can_be_sold_edit"
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
                                                                        id="is_stockable_edit"
                                                                        label="Stoklanabilir"
                                                                        checked={data.is_stockable}
                                                                        onChange={(e) => setData('is_stockable', e.target.checked)}
                                                                    />
                                                                    <Form.Check
                                                                        type="checkbox"
                                                                        id="is_serialized_edit"
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
                                                                <Form.Label>Maliyet Fiyatı</Form.Label>
                                                                <InputGroup>
                                                                    <Form.Control
                                                                        type="number"
                                                                        min="0"
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
                                                                        min="0"
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
                                                                <Form.Label>Minimum Stok</Form.Label>
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
                                                                <Form.Label>Maksimum Stok</Form.Label>
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
                                                                <Form.Check
                                                                    type="checkbox"
                                                                    id="track_inventory"
                                                                    label="Stok Takibi Yap"
                                                                    checked={data.track_inventory}
                                                                    onChange={(e) => setData('track_inventory', e.target.checked)}
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Check
                                                                    type="checkbox"
                                                                    id="allow_backorder"
                                                                    label="Stok Bittiğinde Sipariş Al"
                                                                    checked={data.allow_backorder}
                                                                    onChange={(e) => setData('allow_backorder', e.target.checked)}
                                                                />
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
                                                                    min="0"
                                                                    step="0.001"
                                                                    value={data.weight}
                                                                    onChange={(e) => setData('weight', e.target.value)}
                                                                    placeholder="0.000"
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={3}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Genişlik (cm)</Form.Label>
                                                                <Form.Control
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    value={data.width}
                                                                    onChange={(e) => setData('width', e.target.value)}
                                                                    placeholder="0.00"
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={3}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Yükseklik (cm)</Form.Label>
                                                                <Form.Control
                                                                    type="number"
                                                                    min="0"
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
                                                                    min="0"
                                                                    step="0.01"
                                                                    value={data.depth}
                                                                    onChange={(e) => setData('depth', e.target.value)}
                                                                    placeholder="0.00"
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>
                                                </Tab.Pane>

                                                {/* Birimler */}
                                                <Tab.Pane eventKey="units">
                                                    <div className="mb-3">
                                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                                            <h5 className="mb-0">Ürün Birimleri</h5>
                                                            <Button
                                                                variant="primary"
                                                                size="sm"
                                                                onClick={addUnit}
                                                            >
                                                                <i className="ri-add-line me-1"></i>
                                                                Birim Ekle
                                                            </Button>
                                                        </div>
                                                        
                                                        {data.units.length === 0 ? (
                                                            <Alert variant="info">
                                                                <i className="ri-information-line me-2"></i>
                                                                Henüz birim eklenmemiş. Ürünün farklı satış birimlerini (adet, paket, koli vb.) ekleyebilirsiniz.
                                                            </Alert>
                                                        ) : (
                                                            <div className="table-responsive">
                                                                <table className="table table-bordered">
                                                                    <thead>
                                                                        <tr>
                                                                            <th width="200">Birim</th>
                                                                            <th width="120">Dönüşüm Katsayısı</th>
                                                                            <th width="150">Barkod</th>
                                                                            <th width="120">Satış Fiyatı</th>
                                                                            <th width="120">Toptan Fiyat</th>
                                                                            <th width="100">Min. Sipariş</th>
                                                                            <th width="80">Ana Birim</th>
                                                                            <th width="60"></th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {data.units.map((unit, index) => (
                                                                            <tr key={index}>
                                                                                <td>
                                                                                    <Form.Select
                                                                                        size="sm"
                                                                                        value={unit.unit_id}
                                                                                        onChange={(e) => updateUnit(index, 'unit_id', parseInt(e.target.value))}
                                                                                        required
                                                                                    >
                                                                                        <option value="">Birim Seçin</option>
                                                                                        {units.map(u => (
                                                                                            <option key={u.id} value={u.id}>
                                                                                                {u.name} ({u.symbol})
                                                                                            </option>
                                                                                        ))}
                                                                                    </Form.Select>
                                                                                </td>
                                                                                <td>
                                                                                    <Form.Control
                                                                                        type="number"
                                                                                        size="sm"
                                                                                        min="0.0001"
                                                                                        step="0.0001"
                                                                                        value={unit.conversion_factor}
                                                                                        onChange={(e) => updateUnit(index, 'conversion_factor', parseFloat(e.target.value) || 1)}
                                                                                        placeholder="1"
                                                                                    />
                                                                                </td>
                                                                                <td>
                                                                                    <Form.Control
                                                                                        type="text"
                                                                                        size="sm"
                                                                                        value={unit.barcode || ''}
                                                                                        onChange={(e) => updateUnit(index, 'barcode', e.target.value)}
                                                                                        placeholder="Barkod"
                                                                                    />
                                                                                </td>
                                                                                <td>
                                                                                    <Form.Control
                                                                                        type="number"
                                                                                        size="sm"
                                                                                        min="0"
                                                                                        step="0.01"
                                                                                        value={unit.sale_price || ''}
                                                                                        onChange={(e) => updateUnit(index, 'sale_price', e.target.value ? parseFloat(e.target.value) : undefined)}
                                                                                        placeholder="0.00"
                                                                                    />
                                                                                </td>
                                                                                <td>
                                                                                    <Form.Control
                                                                                        type="number"
                                                                                        size="sm"
                                                                                        min="0"
                                                                                        step="0.01"
                                                                                        value={unit.wholesale_price || ''}
                                                                                        onChange={(e) => updateUnit(index, 'wholesale_price', e.target.value ? parseFloat(e.target.value) : undefined)}
                                                                                        placeholder="0.00"
                                                                                    />
                                                                                </td>
                                                                                <td>
                                                                                    <Form.Control
                                                                                        type="number"
                                                                                        size="sm"
                                                                                        min="1"
                                                                                        value={unit.min_order_quantity || 1}
                                                                                        onChange={(e) => updateUnit(index, 'min_order_quantity', parseInt(e.target.value) || 1)}
                                                                                    />
                                                                                </td>
                                                                                <td className="text-center">
                                                                                    <Form.Check
                                                                                        type="radio"
                                                                                        name="baseUnit"
                                                                                        checked={unit.is_base_unit}
                                                                                        onChange={() => updateUnit(index, 'is_base_unit', true)}
                                                                                    />
                                                                                </td>
                                                                                <td>
                                                                                    <Button
                                                                                        variant="danger"
                                                                                        size="sm"
                                                                                        onClick={() => removeUnit(index)}
                                                                                        disabled={data.units.length === 1}
                                                                                    >
                                                                                        <i className="ri-delete-bin-line"></i>
                                                                                    </Button>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                        
                                                        {commonUnits && commonUnits.length > 0 && (
                                                            <div className="mt-3">
                                                                <small className="text-muted">
                                                                    Hazır birimler: 
                                                                    {commonUnits.map((unit, index) => (
                                                                        <Badge
                                                                            key={index}
                                                                            bg="secondary"
                                                                            className="ms-1 cursor-pointer"
                                                                            onClick={() => data.units.length > 0 && setUnitFromCommon(data.units.length - 1, unit)}
                                                                        >
                                                                            {unit.name} ({unit.code})
                                                                        </Badge>
                                                                    ))}
                                                                </small>
                                                            </div>
                                                        )}
                                                    </div>
                                                </Tab.Pane>

                                                {/* Görseller */}
                                                <Tab.Pane eventKey="images">
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Mevcut Görseller</Form.Label>
                                                        {product.images && product.images.length > 0 ? (
                                                            <Row>
                                                                {product.images.map((image, index) => (
                                                                    <Col md={3} key={image.id} className="mb-3">
                                                                        <div className="position-relative">
                                                                            <img
                                                                                src={`/storage/${image.image_path}`}
                                                                                alt={`${product.name} - ${index + 1}`}
                                                                                className="img-fluid rounded border"
                                                                                style={{ height: '150px', width: '100%', objectFit: 'cover' }}
                                                                            />
                                                                            {image.is_primary && (
                                                                                <Badge 
                                                                                    bg="primary" 
                                                                                    className="position-absolute top-0 start-0 m-2"
                                                                                >
                                                                                    Ana Görsel
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                    </Col>
                                                                ))}
                                                            </Row>
                                                        ) : (
                                                            <p className="text-muted">Henüz görsel eklenmemiş.</p>
                                                        )}
                                                    </Form.Group>

                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Yeni Görseller Ekle</Form.Label>
                                                        <Form.Control
                                                            type="file"
                                                            multiple
                                                            accept="image/*"
                                                            onChange={handleImageChange}
                                                            isInvalid={!!errors.images}
                                                        />
                                                        <Form.Text className="text-muted">
                                                            Birden fazla görsel seçebilirsiniz. Yeni görseller mevcut görsellere eklenecektir.
                                                        </Form.Text>
                                                        <Form.Control.Feedback type="invalid">
                                                            {errors.images}
                                                        </Form.Control.Feedback>
                                                    </Form.Group>

                                                    {selectedImages.length > 0 && (
                                                        <div>
                                                            <h6>Seçilen Yeni Görseller:</h6>
                                                            <Row>
                                                                {selectedImages.map((image, index) => (
                                                                    <Col md={3} key={index} className="mb-3">
                                                                        <div className="position-relative">
                                                                            <img
                                                                                src={URL.createObjectURL(image)}
                                                                                alt={`Yeni görsel ${index + 1}`}
                                                                                className="img-fluid rounded border"
                                                                                style={{ height: '150px', width: '100%', objectFit: 'cover' }}
                                                                            />
                                                                            <Button
                                                                                variant="danger"
                                                                                size="sm"
                                                                                className="position-absolute top-0 end-0 m-2"
                                                                                onClick={() => removeImage(index)}
                                                                            >
                                                                                <i className="ri-close-line"></i>
                                                                            </Button>
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

                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Menşe Ülke</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            value={data.country_of_origin}
                                                            onChange={(e) => setData('country_of_origin', e.target.value)}
                                                            placeholder="Türkiye"
                                                        />
                                                    </Form.Group>

                                                    <Row>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Garanti Süresi (Ay)</Form.Label>
                                                                <Form.Control
                                                                    type="number"
                                                                    min="0"
                                                                    value={data.warranty_period}
                                                                    onChange={(e) => setData('warranty_period', e.target.value)}
                                                                    placeholder="24"
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>

                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Garanti Bilgileri</Form.Label>
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
                                                Güncelleniyor...
                                            </>
                                        ) : (
                                            <>
                                                <i className="ri-save-line me-1"></i>
                                                Ürünü Güncelle
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </Col>
                        </Row>
                    </Form>
                    </div>
                </div>

                {/* Category Modal */}
                <CategoryModal
                    show={showCategoryModal}
                    onHide={() => setShowCategoryModal(false)}
                    onSave={handleCreateCategory}
                    categories={categoriesList}
                />

                {/* Brand Modal */}
                <BrandModal
                    show={showBrandModal}
                    onHide={() => setShowBrandModal(false)}
                    onSave={handleCreateBrand}
                />

                {/* Supplier Modal */}
                <SupplierModal
                    show={showSupplierModal}
                    onHide={() => setShowSupplierModal(false)}
                    onSave={handleCreateSupplier}
                />
            </Layout>
        </>
    );
}