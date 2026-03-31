import React, { useState, useRef } from "react";
import { Head, Link, router } from "@inertiajs/react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Tab,
  Nav,
  InputGroup
} from "react-bootstrap";
import Layout from "../../Layouts";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import Dropzone from "react-dropzone";
import { useFormik } from "formik";
import * as Yup from "yup";
import SimpleBar from "simplebar-react";
import defaultCompanyImg from "../../../images/companies/img-1.png";
import "react-datepicker/dist/react-datepicker.css";
import DatePicker from "react-datepicker";
import { ToastContainer } from "react-toastify";

interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
}

interface Contact {
  id: number;
  name: string;
  email: string;
}

interface Branch {
  id?: number;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  phone: string;
  email: string;
  working_hours: string;
  location_map_link: string;
  is_active: boolean;
}

interface PartnerCompany {
  id: number;
  name: string;
  category_id: number;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  phone: string;
  email: string;
  website: string;
  logo: string;
  discount_details: string;
  terms_conditions: string;
  agreement_start_date: string;
  agreement_end_date: string | null;
  is_active: boolean;
  contact_person_id: number | null;
  external_contact_name: string;
  external_contact_phone: string;
  external_contact_email: string;
  location_map_link: string;
  how_to_claim: string;
  promo_code: string;
  branches: Branch[];
}

interface PartnerCompanyEditProps {
  partnerCompany: PartnerCompany;
  categories: Category[];
  contacts: Contact[];
  errors?: {
    [key: string]: string;
  };
}

interface FormValues {
  name: string;
  category_id: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  phone: string;
  email: string;
  website: string;
  logo: string;
  discount_details: string;
  terms_conditions: string;
  agreement_start_date: Date | null;
  agreement_end_date: Date | null;
  is_active: boolean;
  contact_person_id: string;
  external_contact_name: string;
  external_contact_phone: string;
  external_contact_email: string;
  location_map_link: string;
  how_to_claim: string;
  promo_code: string;
  branches: Branch[];
}

const PartnerCompanyEdit: React.FC<PartnerCompanyEditProps> = ({
  partnerCompany,
  categories,
  contacts,
  errors = {}
}) => {
  const [selectedImage, setSelectedImage] = useState<string>(partnerCompany.logo || "");
  const [activeTab, setActiveTab] = useState<string>("basic");

  // Format dates from string to Date objects
  const formatDate = (dateString: string | null): Date | null => {
    if (!dateString) return null;
    return new Date(dateString);
  };

  // Initial form values from the partnerCompany data
  const initialValues: FormValues = {
    name: partnerCompany.name || "",
    category_id: partnerCompany.category_id?.toString() || "",
    description: partnerCompany.description || "",
    address: partnerCompany.address || "",
    city: partnerCompany.city || "",
    state: partnerCompany.state || "",
    country: partnerCompany.country || "",
    postal_code: partnerCompany.postal_code || "",
    phone: partnerCompany.phone || "",
    email: partnerCompany.email || "",
    website: partnerCompany.website || "",
    logo: partnerCompany.logo || "",
    discount_details: partnerCompany.discount_details || "",
    terms_conditions: partnerCompany.terms_conditions || "",
    agreement_start_date: formatDate(partnerCompany.agreement_start_date),
    agreement_end_date: formatDate(partnerCompany.agreement_end_date),
    is_active: partnerCompany.is_active,
    contact_person_id: partnerCompany.contact_person_id?.toString() || "",
    external_contact_name: partnerCompany.external_contact_name || "",
    external_contact_phone: partnerCompany.external_contact_phone || "",
    external_contact_email: partnerCompany.external_contact_email || "",
    location_map_link: partnerCompany.location_map_link || "",
    how_to_claim: partnerCompany.how_to_claim || "",
    promo_code: partnerCompany.promo_code || "",
    branches: partnerCompany.branches || [],
  };

  // Validation schema using Yup
  const validationSchema = Yup.object({
    name: Yup.string().required("Kurum adı gereklidir"),
    category_id: Yup.string().required("Kategori seçilmelidir"),
    email: Yup.string().email("Geçerli bir e-posta adresi giriniz"),
    external_contact_email: Yup.string().email("Geçerli bir e-posta adresi giriniz"),
    discount_details: Yup.string().required("İndirim detayları gereklidir"),
    agreement_start_date: Yup.date().required("Anlaşma başlangıç tarihi gereklidir"),
    agreement_end_date: Yup.date()
      .nullable()
      .min(Yup.ref('agreement_start_date'), "Bitiş tarihi başlangıç tarihinden sonra olmalıdır"),
  });

  // Form handling with Formik
  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: (values) => {
      // Convert dates to ISO strings for submission
      const formData = {
        ...values,
        agreement_start_date: values.agreement_start_date ? values.agreement_start_date.toISOString().split('T')[0] : null,
        agreement_end_date: values.agreement_end_date ? values.agreement_end_date.toISOString().split('T')[0] : null,
      };

      router.put(route('partner-companies.update', partnerCompany.id), formData);
    },
  });

  // Handle image upload
  const handleImageUpload = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();

    reader.onload = () => {
      if (reader.readyState === 2) {
        setSelectedImage(reader.result as string);
        formik.setFieldValue('logo', reader.result);
      }
    };

    reader.readAsDataURL(file);
  };

  // Add a new branch
  const handleAddBranch = () => {
    const newBranch: Branch = {
      name: "",
      address: "",
      city: "",
      state: "",
      country: "",
      postal_code: "",
      phone: "",
      email: "",
      working_hours: "",
      location_map_link: "",
      is_active: true,
    };

    formik.setFieldValue('branches', [...formik.values.branches, newBranch]);
  };

  // Remove a branch
  const handleRemoveBranch = (index: number) => {
    const updatedBranches = [...formik.values.branches];
    updatedBranches.splice(index, 1);
    formik.setFieldValue('branches', updatedBranches);
  };

  // Update a branch field
  const handleBranchChange = (index: number, field: keyof Branch, value: string | boolean) => {
    const updatedBranches = [...formik.values.branches];
    updatedBranches[index][field] = value;
    formik.setFieldValue('branches', updatedBranches);
  };

  return (
    <React.Fragment>
      <Head title="Anlaşmalı Kurum Düzenle | Portal" />
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Anlaşmalı Kurum Düzenle" pageTitle="Anlaşmalı Kurumlar" />

          <Form onSubmit={formik.handleSubmit}>
            <Row>
              <Col lg={12}>
                <Card>
                  <Card.Header>
                    <Nav variant="tabs" className="nav-tabs-custom rounded card-header-tabs border-bottom-0" role="tablist">
                      <Nav.Item>
                        <Nav.Link
                          active={activeTab === "basic"}
                          onClick={() => setActiveTab("basic")}
                        >
                          <i className="fas fa-home"></i>
                          Temel Bilgiler
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link
                          active={activeTab === "discount"}
                          onClick={() => setActiveTab("discount")}
                        >
                          <i className="far fa-user"></i>
                          İndirim Detayları
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link
                          active={activeTab === "contact"}
                          onClick={() => setActiveTab("contact")}
                        >
                          <i className="far fa-envelope"></i>
                          İletişim Bilgileri
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link
                          active={activeTab === "branches"}
                          onClick={() => setActiveTab("branches")}
                        >
                          <i className="far fa-map"></i>
                          Şubeler
                        </Nav.Link>
                      </Nav.Item>
                    </Nav>
                  </Card.Header>
                  <Card.Body>
                    <Tab.Content>
                      <Tab.Pane active={activeTab === "basic"}>
                        <Row>
                          <Col sm={6}>
                            <Form.Group className="mb-3">
                              <Form.Label htmlFor="name">Kurum Adı<span className="text-danger">*</span></Form.Label>
                              <Form.Control
                                type="text"
                                id="name"
                                placeholder="Kurum adını giriniz"
                                name="name"
                                value={formik.values.name}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                isInvalid={formik.touched.name && (!!formik.errors.name || !!errors.name)}
                              />
                              {formik.touched.name && formik.errors.name && (
                                <Form.Control.Feedback type="invalid">{formik.errors.name}</Form.Control.Feedback>
                              )}
                              {errors.name && (
                                <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                              )}
                            </Form.Group>
                          </Col>
                          <Col sm={6}>
                            <Form.Group className="mb-3">
                              <Form.Label htmlFor="category_id">Kategori<span className="text-danger">*</span></Form.Label>
                              <Form.Select
                                id="category_id"
                                name="category_id"
                                value={formik.values.category_id}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                isInvalid={formik.touched.category_id && (!!formik.errors.category_id || !!errors.category_id)}
                              >
                                <option value="">Kategori Seçiniz</option>
                                {categories.map((category) => (
                                  <option key={category.id} value={category.id}>
                                    {category.name}
                                  </option>
                                ))}
                              </Form.Select>
                              {formik.touched.category_id && formik.errors.category_id && (
                                <Form.Control.Feedback type="invalid">{formik.errors.category_id}</Form.Control.Feedback>
                              )}
                              {errors.category_id && (
                                <Form.Control.Feedback type="invalid">{errors.category_id}</Form.Control.Feedback>
                              )}
                            </Form.Group>
                          </Col>
                        </Row>
                        <Row>
                          <Col sm={12}>
                            <Form.Group className="mb-3">
                              <Form.Label htmlFor="description">Açıklama</Form.Label>
                              <Form.Control
                                as="textarea"
                                rows={3}
                                id="description"
                                placeholder="Kurum hakkında genel bilgi"
                                name="description"
                                value={formik.values.description}
                                onChange={formik.handleChange}
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                        <Row>
                          <Col sm={6}>
                            <Form.Group className="mb-3">
                              <Form.Label htmlFor="logo">Logo</Form.Label>
                              <div className="d-flex align-items-center">
                                <div className="avatar-sm me-2">
                                  <div className="avatar-title bg-light rounded">
                                    <img
                                      src={selectedImage || defaultCompanyImg}
                                      alt=""
                                      className="avatar-sm rounded object-fit-cover"
                                    />
                                  </div>
                                </div>
                                <div className="flex-grow-1">
                                  <Dropzone
                                    onDrop={(acceptedFiles) => handleImageUpload(acceptedFiles)}
                                    accept={{
                                      'image/*': ['.jpeg', '.jpg', '.png']
                                    }}
                                  >
                                    {({ getRootProps, getInputProps }) => (
                                      <div className="dropzone dz-clickable">
                                        <div
                                          className="dz-message needsclick"
                                          {...getRootProps()}
                                        >
                                          <input {...getInputProps()} />
                                          <div className="mb-3">
                                            <i className="display-4 text-muted ri-upload-cloud-2-fill" />
                                          </div>
                                          <h5>Logo değiştirmek için buraya tıklayın veya sürükleyin</h5>
                                        </div>
                                      </div>
                                    )}
                                  </Dropzone>
                                </div>
                              </div>
                            </Form.Group>
                          </Col>
                          <Col sm={6}>
                            <Form.Group className="mb-3">
                              <Form.Label htmlFor="website">Web Sitesi</Form.Label>
                              <Form.Control
                                type="text"
                                id="website"
                                placeholder="https://example.com"
                                name="website"
                                value={formik.values.website}
                                onChange={formik.handleChange}
                              />
                            </Form.Group>
                            <Form.Group className="mb-3">
                              <Form.Check
                                type="switch"
                                id="is_active"
                                label="Aktif"
                                name="is_active"
                                checked={formik.values.is_active}
                                onChange={formik.handleChange}
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                      </Tab.Pane>

                      <Tab.Pane active={activeTab === "discount"}>
                        <Row>
                          <Col sm={12}>
                            <Form.Group className="mb-3">
                              <Form.Label htmlFor="discount_details">İndirim Detayları<span className="text-danger">*</span></Form.Label>
                              <Form.Control
                                as="textarea"
                                rows={3}
                                id="discount_details"
                                placeholder="İndirim detaylarını giriniz"
                                name="discount_details"
                                value={formik.values.discount_details}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                isInvalid={formik.touched.discount_details && (!!formik.errors.discount_details || !!errors.discount_details)}
                              />
                              {formik.touched.discount_details && formik.errors.discount_details && (
                                <Form.Control.Feedback type="invalid">{formik.errors.discount_details}</Form.Control.Feedback>
                              )}
                              {errors.discount_details && (
                                <Form.Control.Feedback type="invalid">{errors.discount_details}</Form.Control.Feedback>
                              )}
                            </Form.Group>
                          </Col>
                        </Row>
                        <Row>
                          <Col sm={6}>
                            <Form.Group className="mb-3">
                              <Form.Label htmlFor="promo_code">Promosyon Kodu</Form.Label>
                              <Form.Control
                                type="text"
                                id="promo_code"
                                placeholder="Varsa promosyon kodunu giriniz"
                                name="promo_code"
                                value={formik.values.promo_code}
                                onChange={formik.handleChange}
                              />
                            </Form.Group>
                          </Col>
                          <Col sm={6}>
                            <Form.Group className="mb-3">
                              <Form.Label htmlFor="how_to_claim">Nasıl Kullanılır</Form.Label>
                              <Form.Control
                                as="textarea"
                                rows={2}
                                id="how_to_claim"
                                placeholder="İndirimin nasıl kullanılacağı hakkında bilgi"
                                name="how_to_claim"
                                value={formik.values.how_to_claim}
                                onChange={formik.handleChange}
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                        <Row>
                          <Col sm={12}>
                            <Form.Group className="mb-3">
                              <Form.Label htmlFor="terms_conditions">Şartlar ve Koşullar</Form.Label>
                              <Form.Control
                                as="textarea"
                                rows={3}
                                id="terms_conditions"
                                placeholder="İndirim kullanımı şartları"
                                name="terms_conditions"
                                value={formik.values.terms_conditions}
                                onChange={formik.handleChange}
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                        <Row>
                          <Col sm={6}>
                            <Form.Group className="mb-3">
                              <Form.Label htmlFor="agreement_start_date">Anlaşma Başlangıç Tarihi<span className="text-danger">*</span></Form.Label>
                              <DatePicker
                                className={`form-control ${formik.touched.agreement_start_date && (formik.errors.agreement_start_date || errors.agreement_start_date) ? 'is-invalid' : ''}`}
                                selected={formik.values.agreement_start_date}
                                onChange={(date) => formik.setFieldValue('agreement_start_date', date)}
                                dateFormat="dd.MM.yyyy"
                                id="agreement_start_date"
                              />
                              {formik.touched.agreement_start_date && formik.errors.agreement_start_date && (
                                <div className="invalid-feedback">{formik.errors.agreement_start_date}</div>
                              )}
                              {errors.agreement_start_date && (
                                <div className="invalid-feedback">{errors.agreement_start_date}</div>
                              )}
                            </Form.Group>
                          </Col>
                          <Col sm={6}>
                            <Form.Group className="mb-3">
                              <Form.Label htmlFor="agreement_end_date">Anlaşma Bitiş Tarihi</Form.Label>
                              <DatePicker
                                className={`form-control ${formik.touched.agreement_end_date && (formik.errors.agreement_end_date || errors.agreement_end_date) ? 'is-invalid' : ''}`}
                                selected={formik.values.agreement_end_date}
                                onChange={(date) => formik.setFieldValue('agreement_end_date', date)}
                                dateFormat="dd.MM.yyyy"
                                id="agreement_end_date"
                                isClearable
                                placeholderText="Süresiz"
                              />
                              {formik.touched.agreement_end_date && formik.errors.agreement_end_date && (
                                <div className="invalid-feedback">{formik.errors.agreement_end_date}</div>
                              )}
                              {errors.agreement_end_date && (
                                <div className="invalid-feedback">{errors.agreement_end_date}</div>
                              )}
                            </Form.Group>
                          </Col>
                        </Row>
                      </Tab.Pane>

                      <Tab.Pane active={activeTab === "contact"}>
                        <Row>
                          <Col lg={6}>
                            <h5 className="card-title mb-3">Kurum İletişim Bilgileri</h5>
                            <Form.Group className="mb-3">
                              <Form.Label htmlFor="address">Adres</Form.Label>
                              <Form.Control
                                as="textarea"
                                rows={2}
                                id="address"
                                placeholder="Kurum adresi"
                                name="address"
                                value={formik.values.address}
                                onChange={formik.handleChange}
                              />
                            </Form.Group>
                            <Row>
                              <Col sm={6}>
                                <Form.Group className="mb-3">
                                  <Form.Label htmlFor="city">Şehir</Form.Label>
                                  <Form.Control
                                    type="text"
                                    id="city"
                                    placeholder="Şehir"
                                    name="city"
                                    value={formik.values.city}
                                    onChange={formik.handleChange}
                                  />
                                </Form.Group>
                              </Col>
                              <Col sm={6}>
                                <Form.Group className="mb-3">
                                  <Form.Label htmlFor="state">İlçe</Form.Label>
                                  <Form.Control
                                    type="text"
                                    id="state"
                                    placeholder="İlçe"
                                    name="state"
                                    value={formik.values.state}
                                    onChange={formik.handleChange}
                                  />
                                </Form.Group>
                              </Col>
                            </Row>
                            <Row>
                              <Col sm={6}>
                                <Form.Group className="mb-3">
                                  <Form.Label htmlFor="postal_code">Posta Kodu</Form.Label>
                                  <Form.Control
                                    type="text"
                                    id="postal_code"
                                    placeholder="Posta kodu"
                                    name="postal_code"
                                    value={formik.values.postal_code}
                                    onChange={formik.handleChange}
                                  />
                                </Form.Group>
                              </Col>
                              <Col sm={6}>
                                <Form.Group className="mb-3">
                                  <Form.Label htmlFor="country">Ülke</Form.Label>
                                  <Form.Control
                                    type="text"
                                    id="country"
                                    placeholder="Ülke"
                                    name="country"
                                    value={formik.values.country}
                                    onChange={formik.handleChange}
                                  />
                                </Form.Group>
                              </Col>
                            </Row>
                            <Form.Group className="mb-3">
                              <Form.Label htmlFor="location_map_link">Harita Linki</Form.Label>
                              <Form.Control
                                type="text"
                                id="location_map_link"
                                placeholder="Google Maps linki"
                                name="location_map_link"
                                value={formik.values.location_map_link}
                                onChange={formik.handleChange}
                              />
                            </Form.Group>
                            <Form.Group className="mb-3">
                              <Form.Label htmlFor="phone">Telefon</Form.Label>
                              <Form.Control
                                type="text"
                                id="phone"
                                placeholder="Telefon numarası"
                                name="phone"
                                value={formik.values.phone}
                                onChange={formik.handleChange}
                              />
                            </Form.Group>
                            <Form.Group className="mb-3">
                              <Form.Label htmlFor="email">E-posta</Form.Label>
                              <Form.Control
                                type="email"
                                id="email"
                                placeholder="E-posta adresi"
                                name="email"
                                value={formik.values.email}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                isInvalid={formik.touched.email && (!!formik.errors.email || !!errors.email)}
                              />
                              {formik.touched.email && formik.errors.email && (
                                <Form.Control.Feedback type="invalid">{formik.errors.email}</Form.Control.Feedback>
                              )}
                              {errors.email && (
                                <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                              )}
                            </Form.Group>
                          </Col>
                          <Col lg={6}>
                            <h5 className="card-title mb-3">İletişim Kişisi Bilgileri</h5>
                            <Form.Group className="mb-3">
                              <Form.Label htmlFor="contact_person_id">Şirket İçi İletişim Kişisi</Form.Label>
                              <Form.Select
                                id="contact_person_id"
                                name="contact_person_id"
                                value={formik.values.contact_person_id}
                                onChange={formik.handleChange}
                              >
                                <option value="">İletişim Kişisi Seçiniz</option>
                                {contacts.map((contact) => (
                                  <option key={contact.id} value={contact.id}>
                                    {contact.name} ({contact.email})
                                  </option>
                                ))}
                              </Form.Select>
                            </Form.Group>
                            <div className="mb-3">
                              <div className="text-muted mb-2">veya</div>
                            </div>
                            <Form.Group className="mb-3">
                              <Form.Label htmlFor="external_contact_name">Kurum İletişim Kişisi</Form.Label>
                              <Form.Control
                                type="text"
                                id="external_contact_name"
                                placeholder="İletişim kişisi adı"
                                name="external_contact_name"
                                value={formik.values.external_contact_name}
                                onChange={formik.handleChange}
                              />
                            </Form.Group>
                            <Form.Group className="mb-3">
                              <Form.Label htmlFor="external_contact_phone">İletişim Kişisi Telefon</Form.Label>
                              <Form.Control
                                type="text"
                                id="external_contact_phone"
                                placeholder="İletişim kişisi telefon"
                                name="external_contact_phone"
                                value={formik.values.external_contact_phone}
                                onChange={formik.handleChange}
                              />
                            </Form.Group>
                            <Form.Group className="mb-3">
                              <Form.Label htmlFor="external_contact_email">İletişim Kişisi E-posta</Form.Label>
                              <Form.Control
                                type="email"
                                id="external_contact_email"
                                placeholder="İletişim kişisi e-posta"
                                name="external_contact_email"
                                value={formik.values.external_contact_email}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                isInvalid={formik.touched.external_contact_email && (!!formik.errors.external_contact_email || !!errors.external_contact_email)}
                              />
                              {formik.touched.external_contact_email && formik.errors.external_contact_email && (
                                <Form.Control.Feedback type="invalid">{formik.errors.external_contact_email}</Form.Control.Feedback>
                              )}
                              {errors.external_contact_email && (
                                <Form.Control.Feedback type="invalid">{errors.external_contact_email}</Form.Control.Feedback>
                              )}
                            </Form.Group>
                          </Col>
                        </Row>
                      </Tab.Pane>

                      <Tab.Pane active={activeTab === "branches"}>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                          <h5 className="card-title mb-0">Şubeler</h5>
                          <Button variant="success" size="sm" onClick={handleAddBranch}>
                            <i className="ri-add-line align-bottom me-1"></i> Yeni Şube Ekle
                          </Button>
                        </div>

                        {formik.values.branches.length === 0 ? (
                          <div className="text-center p-4 border rounded">
                            <p className="mb-0">Henüz şube eklenmedi. Yukarıdaki butonu kullanarak şube ekleyebilirsiniz.</p>
                          </div>
                        ) : (
                            <SimpleBar style={{ maxHeight: "400px" }}>
                                {formik.values.branches.map((branch, index) => (
                                    <Card key={index} className="mb-3 border">
                                        <Card.Body>
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <h6 className="mb-0">Şube #{index + 1}</h6>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => handleRemoveBranch(index)}
                                                >
                                                    <i className="ri-delete-bin-line align-bottom"></i>
                                                </Button>
                                            </div>
                                            <Row>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Şube Adı<span className="text-danger">*</span></Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            placeholder="Şube adı"
                                                            value={branch.name}
                                                            onChange={(e) => handleBranchChange(index, 'name', e.target.value)}
                                                            required
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Adres<span className="text-danger">*</span></Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            placeholder="Şube adresi"
                                                            value={branch.address}
                                                            onChange={(e) => handleBranchChange(index, 'address', e.target.value)}
                                                            required
                                                        />
                                                    </Form.Group>
                                                </Col>
                                            </Row>
                                            <Row>
                                                <Col md={3}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Şehir</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            placeholder="Şehir"
                                                            value={branch.city}
                                                            onChange={(e) => handleBranchChange(index, 'city', e.target.value)}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={3}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>İlçe</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            placeholder="İlçe"
                                                            value={branch.state}
                                                            onChange={(e) => handleBranchChange(index, 'state', e.target.value)}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={3}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Ülke</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            placeholder="Ülke"
                                                            value={branch.country}
                                                            onChange={(e) => handleBranchChange(index, 'country', e.target.value)}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={3}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Posta Kodu</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            placeholder="Posta kodu"
                                                            value={branch.postal_code}
                                                            onChange={(e) => handleBranchChange(index, 'postal_code', e.target.value)}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                            </Row>
                                            <Row>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Telefon</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            placeholder="Telefon"
                                                            value={branch.phone}
                                                            onChange={(e) => handleBranchChange(index, 'phone', e.target.value)}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Email</Form.Label>
                                                        <Form.Control
                                                            type="email"
                                                            placeholder="Email"
                                                            value={branch.email}
                                                            onChange={(e) => handleBranchChange(index, 'email', e.target.value)}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                            </Row>
                                            <Row>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Çalışma Saatleri</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            placeholder="Çalışma saatleri"
                                                            value={branch.working_hours}
                                                            onChange={(e) => handleBranchChange(index, 'working_hours', e.target.value)}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Harita Linki</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            placeholder="Google Maps linki"
                                                            value={branch.location_map_link}
                                                            onChange={(e) => handleBranchChange(index, 'location_map_link', e.target.value)}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                            </Row>
                                            <Form.Group className="mb-3">
                                                <Form.Check
                                                    type="switch"
                                                    id={`branch-active-${index}`}
                                                    label="Aktif"
                                                    checked={branch.is_active}
                                                    onChange={(e) => handleBranchChange(index, 'is_active', e.target.checked)}
                                                />
                                            </Form.Group>
                                        </Card.Body>
                                    </Card>
                                ))}
                            </SimpleBar>
                        )}
                      </Tab.Pane>
                    </Tab.Content>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
              <div className="d-flex justify-content-end gap-2 mt-4">
                  <Link href={route('partner-companies.index')} className="btn btn-light">
                      İptal
                  </Link>
                  <Button type="submit" variant="primary">
                      Güncelle
                  </Button>
              </div>
          </Form>
        </Container>
      </div>
        <ToastContainer />
    </React.Fragment>
  );
};

PartnerCompanyEdit.layout = (page: React.ReactNode) => <Layout children={page} />;
export default PartnerCompanyEdit;
