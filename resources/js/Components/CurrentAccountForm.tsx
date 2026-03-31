import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Spinner } from 'react-bootstrap';
import axios from 'axios';

interface FormData {
    title: string;
    account_type: string;
    person_type: string;
    account_code: string;
    tax_number: string;
    tax_office: string;
    tax_office_id: string;
    mersys_no: string;
    trade_registry_no: string;
    employee_count: number;
    annual_revenue: number;
    establishment_year: number;
    address: string;
    district: string;
    district_id: string;
    city: string;
    city_id: string;
    postal_code: string;
    country: string;
    country_id: string;
    phone_1: string;
    phone_2: string;
    mobile: string;
    fax: string;
    email: string;
    website: string;
    contact_person: string;
    contact_title: string;
    contact_phone: string;
    contact_email: string;
    additional_contacts: any[];
    credit_limit: number;
    payment_term_id: string;
    payment_method_id: string;
    discount_rate: number;
    currency: string;
    risk_limit: number;
    e_invoice_enabled: boolean;
    e_invoice_address: string;
    e_archive_enabled: boolean;
    gib_alias: string;
    category: string;
    sector: string;
    region: string;
    sales_representative_id: string;
    lead_source: string;
    customer_segment: string;
    preferred_language: string;
    communication_preferences: any;
    is_active: boolean;
    notes: string;
    crm_notes: string;
}

interface GeographicData {
    countries: any[];
    cities: any[];
    districts: any[];
    taxOffices: any[];
    paymentTerms: any[];
    paymentMethods: any[];
    salesRepresentatives: any[];
}

interface Props {
    formData: FormData;
    setFormData: (data: FormData) => void;
    errors?: any;
}

export default function CurrentAccountForm({ formData, setFormData, errors = {} }: Props) {
    const [activeTab, setActiveTab] = useState('basic');

    const [geographicData, setGeographicData] = useState<GeographicData>({
        countries: [],
        cities: [],
        districts: [],
        taxOffices: [],
        paymentTerms: [],
        paymentMethods: [],
        salesRepresentatives: []
    });

    const [loadingStates, setLoadingStates] = useState({
        countries: false,
        cities: false,
        districts: false,
        taxOffices: false,
        paymentTerms: false,
        paymentMethods: false,
        salesRepresentatives: false
    });


    // Track if this is the initial load to prevent clearing selections
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
    const [hasCompletedInitialGeographicLoad, setHasCompletedInitialGeographicLoad] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, []);

    // Reload geographic data when formData changes (for edit mode)
    useEffect(() => {
        if (hasLoadedInitialData && isInitialLoad && (formData.country_id || formData.city_id)) {
            const reloadGeographicData = async () => {
                if (formData.country_id) {
                    await loadCities(formData.country_id, true);
                }
                if (formData.city_id) {
                    await loadDistricts(formData.city_id, true);
                    await loadTaxOffices(formData.city_id);
                }
                // Initial load completed after reloading geographic data
                setIsInitialLoad(false);
                setHasCompletedInitialGeographicLoad(true);
            };
            reloadGeographicData();
        }
    }, [formData.country_id, formData.city_id, hasLoadedInitialData, isInitialLoad]);


    const loadInitialData = async () => {
        try {
            const [countriesRes, paymentTermsRes, paymentMethodsRes, salesRepresentativesRes] = await Promise.all([
                axios.get('/api/geographic/countries'),
                axios.get('/api/geographic/payment-terms'),
                axios.get('/api/geographic/payment-methods'),
                axios.get('/api/geographic/sales-representatives')
            ]);

            setGeographicData(prev => ({
                ...prev,
                countries: countriesRes.data,
                paymentTerms: paymentTermsRes.data,
                paymentMethods: paymentMethodsRes.data,
                salesRepresentatives: salesRepresentativesRes.data
            }));

            // If we have existing city_id, load cities and districts
            if (formData.country_id) {
                await loadCities(formData.country_id, true); // true = preserve existing selections
            }
            if (formData.city_id) {
                await loadDistricts(formData.city_id, true); // true = preserve existing selections
                await loadTaxOffices(formData.city_id);
            }

            // Mark initial data as loaded but keep initial load flag for edit mode
            setHasLoadedInitialData(true);
            
            // If no geographic data to load (create mode), mark as complete
            if (!formData.country_id && !formData.city_id) {
                setHasCompletedInitialGeographicLoad(true);
            }
        } catch (error) {
            console.error('Error loading initial data:', error);
            setHasLoadedInitialData(true);
            setHasCompletedInitialGeographicLoad(true);
        }
    };

    const loadCities = async (countryId: string, preserveSelections = false) => {
        if (!countryId) return;

        setLoadingStates(prev => ({ ...prev, cities: true }));
        try {
            const response = await axios.get(`/api/geographic/cities/${countryId}`);
            setGeographicData(prev => ({
                ...prev,
                cities: response.data,
                districts: preserveSelections ? prev.districts : [],
                taxOffices: preserveSelections ? prev.taxOffices : []
            }));

            // Clear dependent selections only if not preserving
            if (!preserveSelections) {
                setFormData(prev => ({
                    ...prev,
                    city_id: '',
                    city: '',
                    district_id: '',
                    district: '',
                    tax_office_id: '',
                    tax_office: ''
                }));
            }
        } catch (error) {
            console.error('Error loading cities:', error);
        } finally {
            setLoadingStates(prev => ({ ...prev, cities: false }));
        }
    };

    const loadDistricts = async (cityId: string, preserveSelections = false) => {
        if (!cityId) return;

        setLoadingStates(prev => ({ ...prev, districts: true }));
        try {
            const response = await axios.get(`/api/geographic/districts/${cityId}`);

            setGeographicData(prev => ({
                ...prev,
                districts: response.data
            }));

            // Clear district selection only if not preserving
            if (!preserveSelections) {
                setFormData(prev => ({
                    ...prev,
                    district_id: '',
                    district: ''
                }));
            }
        } catch (error) {
            console.error('Error loading districts:', error);
        } finally {
            setLoadingStates(prev => ({ ...prev, districts: false }));
        }
    };

    const loadTaxOffices = async (cityId: string) => {
        if (!cityId) return;

        setLoadingStates(prev => ({ ...prev, taxOffices: true }));
        try {
            const response = await axios.get(`/api/geographic/tax-offices/${cityId}`);
            setGeographicData(prev => ({
                ...prev,
                taxOffices: response.data
            }));
        } catch (error) {
            console.error('Error loading tax offices:', error);
        } finally {
            setLoadingStates(prev => ({ ...prev, taxOffices: false }));
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

        setFormData({
            ...formData,
            [name]: finalValue
        });
    };

    const handleCountryChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const countryId = e.target.value;
        const country = geographicData.countries.find(c => c.id.toString() === countryId);

        setFormData({
            ...formData,
            country_id: countryId,
            country: country?.name || '',
            city_id: '',
            city: '',
            district_id: '',
            district: '',
            tax_office_id: '',
            tax_office: ''
        });

        // Load cities for the new country
        if (countryId) {
            await loadCities(countryId);
        }
    };

    const handleCityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const cityId = e.target.value;
        const city = geographicData.cities.find(c => c.id.toString() === cityId);
        const previousCityId = formData.city_id;

        // Mevcut district_id'yi sakla
        const currentDistrictId = formData.district_id;

        setFormData({
            ...formData,
            city_id: cityId,
            city: city?.name || '',
            district_id: '',
            district: '',
            tax_office_id: '',
            tax_office: ''
        });

        // İlçeleri ve vergi dairelerini yükle
        if (cityId) {
            await loadDistricts(cityId);
            await loadTaxOffices(cityId);

            // Eğer aynı şehir seçildiyse (edit modunda), mevcut district seçimini geri yükle
            if (cityId === previousCityId && currentDistrictId) {
                // Districts yüklendikten sonra district seçimini geri yükle
                setTimeout(() => {
                    const districtExists = geographicData.districts.some(d => d.id.toString() === currentDistrictId);
                    if (districtExists) {
                        const district = geographicData.districts.find(d => d.id.toString() === currentDistrictId);
                        setFormData(prev => ({
                            ...prev,
                            district_id: currentDistrictId,
                            district: district?.name || ''
                        }));
                    }
                }, 100);
            }
        }
    };

    const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const districtId = e.target.value;
        const district = geographicData.districts.find(d => d.id.toString() === districtId);

        setFormData({
            ...formData,
            district_id: districtId,
            district: district?.name || ''
        });
    };

    const handleTaxOfficeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const taxOfficeId = e.target.value;
        const taxOffice = geographicData.taxOffices.find(t => t.id.toString() === taxOfficeId);

        setFormData({
            ...formData,
            tax_office_id: taxOfficeId,
            tax_office: taxOffice?.name || ''
        });
    };

    const handleTabClick = (tabKey: string) => {
        setActiveTab(tabKey);
    };

    return (
        <div>
            {/* Custom Tab Navigation */}
            <div className="nav nav-tabs mb-3" role="tablist">
                <button
                    type="button"
                    className={`nav-link ${activeTab === 'basic' ? 'active' : ''}`}
                    onClick={() => handleTabClick('basic')}
                >
                    Temel Bilgiler
                </button>
                <button
                    type="button"
                    className={`nav-link ${activeTab === 'contact' ? 'active' : ''}`}
                    onClick={() => handleTabClick('contact')}
                >
                    İletişim
                </button>
                <button
                    type="button"
                    className={`nav-link ${activeTab === 'financial' ? 'active' : ''}`}
                    onClick={() => handleTabClick('financial')}
                >
                    Mali Bilgiler
                </button>
                <button
                    type="button"
                    className={`nav-link ${activeTab === 'crm' ? 'active' : ''}`}
                    onClick={() => handleTabClick('crm')}
                >
                    CRM Bilgileri
                </button>
                <button
                    type="button"
                    className={`nav-link ${activeTab === 'system' ? 'active' : ''}`}
                    onClick={() => handleTabClick('system')}
                >
                    Sistem
                </button>
            </div>

            {/* Debug Info */}
            <div className="mb-2">
                <small className="text-muted">Active Tab: {activeTab}</small>
            </div>

            {/* Tab Contents */}
            <div className="tab-content">
                {activeTab === 'basic' && (
                <div className="tab-pane active show" style={{ display: 'block' }}>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Ünvan/Ad Soyad <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.title}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.title}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Cari Tipi <span className="text-danger">*</span></Form.Label>
                                <Form.Select
                                    name="account_type"
                                    value={formData.account_type}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.account_type}
                                >
                                    <option value="">Seçiniz</option>
                                    <option value="customer">Müşteri</option>
                                    <option value="supplier">Tedarikçi</option>
                                    <option value="both">Müşteri/Tedarikçi</option>
                                    <option value="personnel">Personel</option>
                                    <option value="shareholder">Ortak</option>
                                    <option value="other">Diğer</option>
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">
                                    {errors.account_type}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Kişi Tipi <span className="text-danger">*</span></Form.Label>
                                <Form.Select
                                    name="person_type"
                                    value={formData.person_type}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.person_type}
                                >
                                    <option value="">Seçiniz</option>
                                    <option value="individual">Gerçek Kişi</option>
                                    <option value="corporate">Tüzel Kişi</option>
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">
                                    {errors.person_type}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Cari Kodu</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="account_code"
                                    value={formData.account_code}
                                    onChange={handleInputChange}
                                    placeholder="Otomatik oluşturulacak"
                                    isInvalid={!!errors.account_code}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.account_code}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Vergi/TC No</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="tax_number"
                                    value={formData.tax_number}
                                    onChange={handleInputChange}
                                    maxLength={11}
                                    isInvalid={!!errors.tax_number}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.tax_number}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>MERSİS No</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="mersys_no"
                                    value={formData.mersys_no}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.mersys_no}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.mersys_no}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Ticaret Sicil No</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="trade_registry_no"
                                    value={formData.trade_registry_no}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.trade_registry_no}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.trade_registry_no}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    {formData.person_type === 'corporate' && (
                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Çalışan Sayısı</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="employee_count"
                                        value={formData.employee_count || ''}
                                        onChange={handleInputChange}
                                        min="0"
                                        isInvalid={!!errors.employee_count}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.employee_count}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Yıllık Ciro</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="annual_revenue"
                                        value={formData.annual_revenue || ''}
                                        onChange={handleInputChange}
                                        min="0"
                                        step="0.01"
                                        isInvalid={!!errors.annual_revenue}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.annual_revenue}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Kuruluş Yılı</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="establishment_year"
                                        value={formData.establishment_year || ''}
                                        onChange={handleInputChange}

                                        max={new Date().getFullYear()}
                                        isInvalid={!!errors.establishment_year}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.establishment_year}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>
                    )}
                </div>
                )}

                {activeTab === 'contact' && (
                <div className="tab-pane active show" style={{ display: 'block' }}>
                    <Row>
                        <Col md={12}>
                            <Form.Group className="mb-3">
                                <Form.Label>Adres</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.address}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.address}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Ülke</Form.Label>
                                <Form.Select
                                    name="country_id"
                                    value={formData.country_id}
                                    onChange={handleCountryChange}
                                    isInvalid={!!errors.country_id}
                                >
                                    <option value="">Ülke Seçiniz</option>
                                    {geographicData.countries.map(country => (
                                        <option key={country.id} value={country.id.toString()}>
                                            {country.name}
                                        </option>
                                    ))}
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">
                                    {errors.country_id}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Şehir</Form.Label>
                                <Form.Select
                                    name="city_id"
                                    value={formData.city_id}
                                    onChange={handleCityChange}
                                    disabled={!formData.country_id || loadingStates.cities}
                                    isInvalid={!!errors.city_id}
                                >
                                    <option value="">
                                        {loadingStates.cities ? 'Yükleniyor...' : 'Şehir Seçiniz'}
                                    </option>
                                    {geographicData.cities.map(city => (
                                        <option key={city.id} value={city.id.toString()}>
                                            {city.name} {city.code && `(${city.code})`}
                                        </option>
                                    ))}
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">
                                    {errors.city_id}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>İlçe</Form.Label>
                                <Form.Select
                                    name="district_id"
                                    value={formData.district_id}
                                    onChange={handleDistrictChange}
                                    disabled={!formData.city_id || loadingStates.districts}
                                    isInvalid={!!errors.district_id}
                                >
                                    <option value="">
                                        {loadingStates.districts ? 'Yükleniyor...' : 'İlçe Seçiniz'}
                                    </option>
                                    {geographicData.districts.map(district => (
                                        <option key={district.id} value={district.id.toString()}>
                                            {district.name} {district.postal_code && `(${district.postal_code})`}
                                        </option>
                                    ))}
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">
                                    {errors.district_id}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Posta Kodu</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="postal_code"
                                    value={formData.postal_code}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.postal_code}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.postal_code}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Vergi Dairesi</Form.Label>
                                <Form.Select
                                    name="tax_office_id"
                                    value={formData.tax_office_id}
                                    onChange={handleTaxOfficeChange}
                                    disabled={!formData.city_id || loadingStates.taxOffices}
                                    isInvalid={!!errors.tax_office_id}
                                >
                                    <option value="">
                                        {loadingStates.taxOffices ? 'Yükleniyor...' : 'Vergi Dairesi Seçiniz'}
                                    </option>
                                    {geographicData.taxOffices.map(taxOffice => (
                                        <option key={taxOffice.id} value={taxOffice.id.toString()}>
                                            {taxOffice.name} {taxOffice.code && `(${taxOffice.code})`}
                                        </option>
                                    ))}
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">
                                    {errors.tax_office_id}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Telefon 1</Form.Label>
                                <Form.Control
                                    type="tel"
                                    name="phone_1"
                                    value={formData.phone_1}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.phone_1}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.phone_1}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Telefon 2</Form.Label>
                                <Form.Control
                                    type="tel"
                                    name="phone_2"
                                    value={formData.phone_2}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.phone_2}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.phone_2}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Mobil</Form.Label>
                                <Form.Control
                                    type="tel"
                                    name="mobile"
                                    value={formData.mobile}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.mobile}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.mobile}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Fax</Form.Label>
                                <Form.Control
                                    type="tel"
                                    name="fax"
                                    value={formData.fax}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.fax}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.fax}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>E-posta</Form.Label>
                                <Form.Control
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.email}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.email}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Web Sitesi</Form.Label>
                                <Form.Control
                                    type="url"
                                    name="website"
                                    value={formData.website}
                                    onChange={handleInputChange}
                                    placeholder="https://"
                                    isInvalid={!!errors.website}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.website}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    {/* Yetkili Kişi Bilgileri */}
                    <hr />
                    <h6 className="mb-3">Yetkili Kişi Bilgileri</h6>
                    <Row>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>Ad Soyad</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="contact_person"
                                    value={formData.contact_person}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.contact_person}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.contact_person}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>Pozisyon</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="contact_title"
                                    value={formData.contact_title}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.contact_title}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.contact_title}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>Telefon</Form.Label>
                                <Form.Control
                                    type="tel"
                                    name="contact_phone"
                                    value={formData.contact_phone}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.contact_phone}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.contact_phone}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>E-posta</Form.Label>
                                <Form.Control
                                    type="email"
                                    name="contact_email"
                                    value={formData.contact_email}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.contact_email}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.contact_email}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>
                </div>
                )}

                {activeTab === 'financial' && (
                <div className="tab-pane active show" style={{ display: 'block' }}>
                    <Row>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>Kredi Limiti</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="credit_limit"
                                    value={formData.credit_limit || ''}
                                    onChange={handleInputChange}
                                    min="0"
                                    step="0.01"
                                    isInvalid={!!errors.credit_limit}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.credit_limit}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>Risk Limiti</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="risk_limit"
                                    value={formData.risk_limit || ''}
                                    onChange={handleInputChange}
                                    min="0"
                                    step="0.01"
                                    isInvalid={!!errors.risk_limit}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.risk_limit}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>Para Birimi</Form.Label>
                                <Form.Select
                                    name="currency"
                                    value={formData.currency}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.currency}
                                >
                                    <option value="TRY">₺ Türk Lirası</option>
                                    <option value="USD">$ Amerikan Doları</option>
                                    <option value="EUR">€ Euro</option>
                                    <option value="GBP">£ İngiliz Sterlini</option>
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">
                                    {errors.currency}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Ödeme Vadesi</Form.Label>
                                <Form.Select
                                    name="payment_term_id"
                                    value={formData.payment_term_id}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.payment_term_id}
                                >
                                    <option value="">Ödeme Vadesi Seçiniz</option>
                                    {geographicData.paymentTerms.map(term => (
                                        <option key={term.id} value={term.id.toString()}>
                                            {term.name} ({term.days} gün)
                                        </option>
                                    ))}
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">
                                    {errors.payment_term_id}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Ödeme Şekli</Form.Label>
                                <Form.Select
                                    name="payment_method_id"
                                    value={formData.payment_method_id}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.payment_method_id}
                                >
                                    <option value="">Ödeme Şekli Seçiniz</option>
                                    {geographicData.paymentMethods.map(method => (
                                        <option key={method.id} value={method.id.toString()}>
                                            {method.name}
                                        </option>
                                    ))}
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">
                                    {errors.payment_method_id}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>İskonto Oranı (%)</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="discount_rate"
                                    value={formData.discount_rate || ''}
                                    onChange={handleInputChange}
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    isInvalid={!!errors.discount_rate}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.discount_rate}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    {/* E-Fatura Bilgileri */}
                    <hr />
                    <h6 className="mb-3">E-Fatura Bilgileri</h6>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Check
                                    type="checkbox"
                                    name="e_invoice_enabled"
                                    checked={formData.e_invoice_enabled}
                                    onChange={handleInputChange}
                                    label="E-Fatura Aktif"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Check
                                    type="checkbox"
                                    name="e_archive_enabled"
                                    checked={formData.e_archive_enabled}
                                    onChange={handleInputChange}
                                    label="E-Arşiv Aktif"
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    {formData.e_invoice_enabled && (
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>E-Fatura Adresi</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="e_invoice_address"
                                        value={formData.e_invoice_address}
                                        onChange={handleInputChange}
                                        isInvalid={!!errors.e_invoice_address}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.e_invoice_address}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>GİB Alias</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="gib_alias"
                                        value={formData.gib_alias}
                                        onChange={handleInputChange}
                                        isInvalid={!!errors.gib_alias}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.gib_alias}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>
                    )}
                </div>
                )}

                {activeTab === 'crm' && (
                <div className="tab-pane active show" style={{ display: 'block' }}>
                    <Row>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>Müşteri Kaynağı</Form.Label>
                                <Form.Select
                                    name="lead_source"
                                    value={formData.lead_source}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.lead_source}
                                >
                                    <option value="">Kaynak Seçiniz</option>
                                    <option value="website">Web Sitesi</option>
                                    <option value="referral">Tavsiye</option>
                                    <option value="social_media">Sosyal Medya</option>
                                    <option value="advertisement">Reklam</option>
                                    <option value="cold_call">Soğuk Arama</option>
                                    <option value="exhibition">Fuar</option>
                                    <option value="email_campaign">E-posta Kampanyası</option>
                                    <option value="other">Diğer</option>
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">
                                    {errors.lead_source}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>Müşteri Segmenti</Form.Label>
                                <Form.Select
                                    name="customer_segment"
                                    value={formData.customer_segment}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.customer_segment}
                                >
                                    <option value="">Segment Seçiniz</option>
                                    <option value="a">A Segment (Premium)</option>
                                    <option value="b">B Segment (Orta)</option>
                                    <option value="c">C Segment (Standart)</option>
                                    <option value="vip">VIP</option>
                                    <option value="new">Yeni Müşteri</option>
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">
                                    {errors.customer_segment}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>Tercih Edilen Dil</Form.Label>
                                <Form.Select
                                    name="preferred_language"
                                    value={formData.preferred_language}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.preferred_language}
                                >
                                    <option value="tr">Türkçe</option>
                                    <option value="en">English</option>
                                    <option value="de">Deutsch</option>
                                    <option value="fr">Français</option>
                                    <option value="ar">العربية</option>
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">
                                    {errors.preferred_language}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>Sektör</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="sector"
                                    value={formData.sector}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.sector}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.sector}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>Bölge</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="region"
                                    value={formData.region}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.region}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.region}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>Satış Temsilcisi</Form.Label>
                                <Form.Select
                                    name="sales_representative_id"
                                    value={formData.sales_representative_id}
                                    onChange={handleInputChange}
                                    isInvalid={!!errors.sales_representative_id}
                                    disabled={loadingStates.salesRepresentatives}
                                >
                                    <option value="">Satış Temsilcisi Seçiniz</option>
                                    {geographicData.salesRepresentatives.map(rep => (
                                        <option key={rep.id} value={rep.id.toString()}>
                                            {rep.display_name}
                                        </option>
                                    ))}
                                </Form.Select>
                                {loadingStates.salesRepresentatives && (
                                    <div className="d-flex align-items-center mt-1">
                                        <Spinner size="sm" className="me-2" />
                                        <small className="text-muted">Yükleniyor...</small>
                                    </div>
                                )}
                                <Form.Control.Feedback type="invalid">
                                    {errors.sales_representative_id}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={12}>
                            <Form.Group className="mb-3">
                                <Form.Label>CRM Notları</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={4}
                                    name="crm_notes"
                                    value={formData.crm_notes}
                                    onChange={handleInputChange}
                                    placeholder="Müşteri ile ilgili özel notlar, görüşme kayıtları vs."
                                    isInvalid={!!errors.crm_notes}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.crm_notes}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>
                </div>
                )}

                {activeTab === 'system' && (
                <div className="tab-pane active show" style={{ display: 'block' }}>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Check
                                    type="checkbox"
                                    name="is_active"
                                    checked={formData.is_active}
                                    onChange={handleInputChange}
                                    label="Aktif"
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>Kategori</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    placeholder="A, B, C müşteri vs."
                                    isInvalid={!!errors.category}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.category}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={12}>
                            <Form.Group className="mb-3">
                                <Form.Label>Notlar</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={4}
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    placeholder="Genel notlar ve açıklamalar"
                                    isInvalid={!!errors.notes}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.notes}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>
                </div>
                )}
            </div>
        </div>
    );
}
