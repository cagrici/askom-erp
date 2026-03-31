import React, { useState, useRef, useEffect } from "react";
import { Head, Link, router } from "@inertiajs/react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Tab,
  Nav
} from "react-bootstrap";
import Layout from "../../../Layouts";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import defaultUserImg from "../../../../images/users/user-dummy-img.jpg";

interface Company {
  id: number;
  name: string;
  owner: string;
  industry_type: string;
  rating: number;
  location: string;
  employee: string;
  website: string;
  contact_email: string;
  since: string;
  picture: string | null;
  phone: string;
  fax: string;
  tax_number: string;
  address: string;
  city: string;
  country: string;
  postal_code: string;
  notes: string;
  is_customer: boolean;
  is_supplier: boolean;
  status: string;
}

interface Contact {
  id: number;
  name: string;
  position: string;
  phone: string;
  email: string;
  is_primary: boolean;
  notes: string;
}

interface CompanyEditProps {
  company: Company;
  contacts: Contact[];
  industryTypes: {
    id: number;
    name: string;
    description: string | null;
  }[];
  flash?: {
    success?: string;
    error?: string;
  };
}

const CompanyEdit: React.FC<CompanyEditProps> = ({ company, contacts: initialContacts, industryTypes, flash }) => {
  const [formData, setFormData] = useState({
    name: company.name || "",
    owner: company.owner || "",
    industry_type: company.industry_type || "",
    rating: company.rating?.toString() || "0",
    location: company.location || "",
    employee: company.employee || "",
    website: company.website || "",
    contact_email: company.contact_email || "",
    since: company.since || "",
    picture: company.picture || "",
    phone: company.phone || "",
    fax: company.fax || "",
    tax_number: company.tax_number || "",
    address: company.address || "",
    city: company.city || "",
    country: company.country || "",
    postal_code: company.postal_code || "",
    notes: company.notes || "",
    is_customer: company.is_customer || false,
    is_supplier: company.is_supplier || false,
    status: company.status || "active"
  });

  const [contacts, setContacts] = useState<Contact[]>(initialContacts || []);
  const [selectedImage, setSelectedImage] = useState<string | null>(company.picture);
  const [errors, setErrors] = useState<any>({});
  const [activeTab, setActiveTab] = useState("basic-info");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Show toast message if success message exists in flash
  useEffect(() => {
    if (flash?.success) {
      toast.success(flash.success, {
        position: "top-right",
        autoClose: 3000,
      });
    }
  }, [flash]);

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let newValue = value;

    // Handle checkbox fields
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      newValue = checkbox.checked.toString();
    }

    setFormData(prevData => ({
      ...prevData,
      [name]: newValue
    }));
  };

  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setSelectedImage(result);
        setFormData(prevData => ({
          ...prevData,
          picture: result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Open file browser
  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Add new contact
  const addContact = () => {
    const newContact: Contact = {
      id: 0, // Temporary ID, will be assigned by the server
      name: "",
      position: "",
      phone: "",
      email: "",
      is_primary: contacts.length === 0, // Make first contact primary by default
      notes: ""
    };
    setContacts([...contacts, newContact]);
  };

  // Update contact
  const updateContact = (index: number, field: keyof Contact, value: string | boolean) => {
    const updatedContacts = [...contacts];

    // If setting this contact as primary, unset others
    if (field === 'is_primary' && value === true) {
      updatedContacts.forEach(contact => {
        contact.is_primary = false;
      });
    }

    updatedContacts[index] = {
      ...updatedContacts[index],
      [field]: value
    };

    setContacts(updatedContacts);
  };

  // Remove contact
  const removeContact = (index: number) => {
    const updatedContacts = [...contacts];
    updatedContacts.splice(index, 1);

    // If removing primary contact and there are other contacts, set first one as primary
    if (contacts[index].is_primary && updatedContacts.length > 0) {
      updatedContacts[0].is_primary = true;
    }

    setContacts(updatedContacts);
  };

  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Convert boolean strings to actual booleans
    const processedData = {
      ...formData,
      is_customer: formData.is_customer === "true" || formData.is_customer === true,
      is_supplier: formData.is_supplier === "true" || formData.is_supplier === true,
      contacts: contacts
    };

    router.put(route('companies.update', company.id), processedData, {
      onSuccess: () => {
        toast.success("Şirket başarıyla güncellendi", {
          position: "top-right",
          autoClose: 3000
        });
      },
      onError: (errors) => {
        setErrors(errors);

        // Check which tab has errors and switch to it
        const contactErrors = Object.keys(errors).some(key => key.startsWith('contacts'));
        if (contactErrors) {
          setActiveTab('contacts');
        } else {
          setActiveTab('basic-info');
        }

        toast.error("Lütfen formdaki hataları düzeltin", {
          position: "top-right",
          autoClose: 3000
        });
      }
    });
  };

  return (
    <>
      <Head title="Şirket Düzenle | Portal" />
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Şirket Düzenle" pageTitle="Şirketler" />

          <Form onSubmit={handleSubmit}>
            <Row>
              <Col lg={12}>
                <Card>
                  <Card.Body>
                    <Tab.Container activeKey={activeTab} onSelect={(key) => key && setActiveTab(key)}>
                      <Nav variant="tabs" className="nav-tabs-custom rounded card-header-tabs border-bottom-0">
                        <Nav.Item>
                          <Nav.Link eventKey="basic-info">
                            <i className="ri-building-line me-1 align-middle"></i> Temel Bilgiler
                          </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                          <Nav.Link eventKey="contacts">
                            <i className="ri-contacts-line me-1 align-middle"></i> İletişim Kişileri
                          </Nav.Link>
                        </Nav.Item>
                      </Nav>

                      <Tab.Content className="text-muted mt-4">
                        <Tab.Pane eventKey="basic-info">
                          <Row className="g-3">
                            {/* Company Logo */}
                            <Col lg={12} className="text-center mb-3">
                              <div className="position-relative d-inline-block">
                                <div
                                  className="position-absolute bottom-0 end-0"
                                  onClick={handleImageClick}
                                  style={{ cursor: 'pointer', zIndex: 1 }}
                                >
                                  <div className="avatar-xs">
                                    <div className="avatar-title bg-light border rounded-circle text-muted">
                                      <i className="ri-image-fill"></i>
                                    </div>
                                  </div>
                                </div>
                                <div
                                  className="avatar-xl p-1"
                                  onClick={handleImageClick}
                                  style={{ cursor: 'pointer' }}
                                >
                                  <div className="avatar-title bg-light rounded-circle">
                                    <img
                                      src={selectedImage || defaultUserImg}
                                      alt="Şirket Logosu"
                                      id="companylogo-img"
                                      className="avatar-md rounded-circle object-fit-cover"
                                    />
                                  </div>
                                </div>
                                <input
                                  type="file"
                                  className="d-none"
                                  ref={fileInputRef}
                                  onChange={handleImageChange}
                                  accept="image/*"
                                />
                              </div>
                              <h5 className="fs-13 mt-3">Şirket Logosu</h5>
                              {errors.picture && (
                                <div className="text-danger mt-1">{errors.picture}</div>
                              )}
                            </Col>

                            <Col md={6}>
                              <Form.Group>
                                <Form.Label htmlFor="name">Şirket Adı <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                  type="text"
                                  id="name"
                                  name="name"
                                  value={formData.name}
                                  onChange={handleChange}
                                  isInvalid={!!errors.name}
                                  required
                                />
                                {errors.name && (
                                  <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                                )}
                              </Form.Group>
                            </Col>

                            <Col md={6}>
                              <Form.Group>
                                <Form.Label htmlFor="owner">Yetkili Kişi</Form.Label>
                                <Form.Control
                                  type="text"
                                  id="owner"
                                  name="owner"
                                  value={formData.owner}
                                  onChange={handleChange}
                                  isInvalid={!!errors.owner}
                                />
                                {errors.owner && (
                                  <Form.Control.Feedback type="invalid">{errors.owner}</Form.Control.Feedback>
                                )}
                              </Form.Group>
                            </Col>

                            <Col md={4}>
                              <Form.Group>
                                <Form.Label htmlFor="industry_type">Sektör</Form.Label>
                                <Form.Select
                                  id="industry_type"
                                  name="industry_type"
                                  value={formData.industry_type}
                                  onChange={handleChange}
                                  isInvalid={!!errors.industry_type}
                                >
                                  <option value="">Sektör Seçin</option>
                                  {industryTypes.map((type) => (
                                    <option key={type.id} value={type.name}>
                                      {type.name}
                                    </option>
                                  ))}
                                </Form.Select>
                                {errors.industry_type && (
                                  <Form.Control.Feedback type="invalid">{errors.industry_type}</Form.Control.Feedback>
                                )}
                              </Form.Group>
                            </Col>

                            <Col md={4}>
                              <Form.Group>
                                <Form.Label htmlFor="rating">Değerlendirme</Form.Label>
                                <Form.Control
                                  type="number"
                                  id="rating"
                                  name="rating"
                                  min="0"
                                  max="5"
                                  step="0.1"
                                  value={formData.rating}
                                  onChange={handleChange}
                                  isInvalid={!!errors.rating}
                                />
                                {errors.rating && (
                                  <Form.Control.Feedback type="invalid">{errors.rating}</Form.Control.Feedback>
                                )}
                              </Form.Group>
                            </Col>

                            <Col md={4}>
                              <Form.Group>
                                <Form.Label htmlFor="since">Kuruluş Yılı</Form.Label>
                                <Form.Control
                                  type="text"
                                  id="since"
                                  name="since"
                                  value={formData.since}
                                  onChange={handleChange}
                                  isInvalid={!!errors.since}
                                />
                                {errors.since && (
                                  <Form.Control.Feedback type="invalid">{errors.since}</Form.Control.Feedback>
                                )}
                              </Form.Group>
                            </Col>

                            <Col md={4}>
                              <Form.Group>
                                <Form.Label htmlFor="phone">Telefon</Form.Label>
                                <Form.Control
                                  type="text"
                                  id="phone"
                                  name="phone"
                                  value={formData.phone}
                                  onChange={handleChange}
                                  isInvalid={!!errors.phone}
                                />
                                {errors.phone && (
                                  <Form.Control.Feedback type="invalid">{errors.phone}</Form.Control.Feedback>
                                )}
                              </Form.Group>
                            </Col>

                            <Col md={4}>
                              <Form.Group>
                                <Form.Label htmlFor="fax">Faks</Form.Label>
                                <Form.Control
                                  type="text"
                                  id="fax"
                                  name="fax"
                                  value={formData.fax}
                                  onChange={handleChange}
                                  isInvalid={!!errors.fax}
                                />
                                {errors.fax && (
                                  <Form.Control.Feedback type="invalid">{errors.fax}</Form.Control.Feedback>
                                )}
                              </Form.Group>
                            </Col>

                            <Col md={4}>
                              <Form.Group>
                                <Form.Label htmlFor="tax_number">Vergi Numarası</Form.Label>
                                <Form.Control
                                  type="text"
                                  id="tax_number"
                                  name="tax_number"
                                  value={formData.tax_number}
                                  onChange={handleChange}
                                  isInvalid={!!errors.tax_number}
                                />
                                {errors.tax_number && (
                                  <Form.Control.Feedback type="invalid">{errors.tax_number}</Form.Control.Feedback>
                                )}
                              </Form.Group>
                            </Col>

                            <Col md={6}>
                              <Form.Group>
                                <Form.Label htmlFor="website">Web Sitesi</Form.Label>
                                <Form.Control
                                  type="text"
                                  id="website"
                                  name="website"
                                  value={formData.website}
                                  onChange={handleChange}
                                  isInvalid={!!errors.website}
                                />
                                {errors.website && (
                                  <Form.Control.Feedback type="invalid">{errors.website}</Form.Control.Feedback>
                                )}
                              </Form.Group>
                            </Col>

                            <Col md={6}>
                              <Form.Group>
                                <Form.Label htmlFor="contact_email">E-posta</Form.Label>
                                <Form.Control
                                  type="email"
                                  id="contact_email"
                                  name="contact_email"
                                  value={formData.contact_email}
                                  onChange={handleChange}
                                  isInvalid={!!errors.contact_email}
                                />
                                {errors.contact_email && (
                                  <Form.Control.Feedback type="invalid">{errors.contact_email}</Form.Control.Feedback>
                                )}
                              </Form.Group>
                            </Col>

                            <Col md={4}>
                              <Form.Group>
                                <Form.Label htmlFor="employee">Çalışan Sayısı</Form.Label>
                                <Form.Control
                                  type="text"
                                  id="employee"
                                  name="employee"
                                  value={formData.employee}
                                  onChange={handleChange}
                                  isInvalid={!!errors.employee}
                                  placeholder="Örn: 10-50"
                                />
                                {errors.employee && (
                                  <Form.Control.Feedback type="invalid">{errors.employee}</Form.Control.Feedback>
                                )}
                              </Form.Group>
                            </Col>

                            <Col md={4}>
                              <Form.Group>
                                <Form.Label htmlFor="location">Konum</Form.Label>
                                <Form.Control
                                  type="text"
                                  id="location"
                                  name="location"
                                  value={formData.location}
                                  onChange={handleChange}
                                  isInvalid={!!errors.location}
                                  placeholder="Örn: İstanbul, Türkiye"
                                />
                                {errors.location && (
                                  <Form.Control.Feedback type="invalid">{errors.location}</Form.Control.Feedback>
                                )}
                              </Form.Group>
                            </Col>

                            <Col md={4}>
                              <Form.Group>
                                <Form.Label htmlFor="status">Durum</Form.Label>
                                <Form.Select
                                  id="status"
                                  name="status"
                                  value={formData.status}
                                  onChange={handleChange}
                                  isInvalid={!!errors.status}
                                >
                                  <option value="active">Aktif</option>
                                  <option value="inactive">Pasif</option>
                                  <option value="pending">Beklemede</option>
                                </Form.Select>
                                {errors.status && (
                                  <Form.Control.Feedback type="invalid">{errors.status}</Form.Control.Feedback>
                                )}
                              </Form.Group>
                            </Col>

                            <Col md={12}>
                              <Form.Group>
                                <Form.Label htmlFor="address">Adres</Form.Label>
                                <Form.Control
                                  as="textarea"
                                  rows={3}
                                  id="address"
                                  name="address"
                                  value={formData.address}
                                  onChange={handleChange}
                                  isInvalid={!!errors.address}
                                />
                                {errors.address && (
                                  <Form.Control.Feedback type="invalid">{errors.address}</Form.Control.Feedback>
                                )}
                              </Form.Group>
                            </Col>

                            <Col md={4}>
                              <Form.Group>
                                <Form.Label htmlFor="city">Şehir</Form.Label>
                                <Form.Control
                                  type="text"
                                  id="city"
                                  name="city"
                                  value={formData.city}
                                  onChange={handleChange}
                                  isInvalid={!!errors.city}
                                />
                                {errors.city && (
                                  <Form.Control.Feedback type="invalid">{errors.city}</Form.Control.Feedback>
                                )}
                              </Form.Group>
                            </Col>

                            <Col md={4}>
                              <Form.Group>
                                <Form.Label htmlFor="country">Ülke</Form.Label>
                                <Form.Control
                                  type="text"
                                  id="country"
                                  name="country"
                                  value={formData.country}
                                  onChange={handleChange}
                                  isInvalid={!!errors.country}
                                />
                                {errors.country && (
                                  <Form.Control.Feedback type="invalid">{errors.country}</Form.Control.Feedback>
                                )}
                              </Form.Group>
                            </Col>

                            <Col md={4}>
                              <Form.Group>
                                <Form.Label htmlFor="postal_code">Posta Kodu</Form.Label>
                                <Form.Control
                                  type="text"
                                  id="postal_code"
                                  name="postal_code"
                                  value={formData.postal_code}
                                  onChange={handleChange}
                                  isInvalid={!!errors.postal_code}
                                />
                                {errors.postal_code && (
                                  <Form.Control.Feedback type="invalid">{errors.postal_code}</Form.Control.Feedback>
                                )}
                              </Form.Group>
                            </Col>

                            <Col md={12}>
                              <Form.Group>
                                <Form.Label htmlFor="notes">Notlar</Form.Label>
                                <Form.Control
                                  as="textarea"
                                  rows={3}
                                  id="notes"
                                  name="notes"
                                  value={formData.notes}
                                  onChange={handleChange}
                                  isInvalid={!!errors.notes}
                                />
                                {errors.notes && (
                                  <Form.Control.Feedback type="invalid">{errors.notes}</Form.Control.Feedback>
                                )}
                              </Form.Group>
                            </Col>

                            <Col md={6}>
                              <Form.Group className="mt-3">
                                <Form.Check
                                  type="checkbox"
                                  id="is_customer"
                                  name="is_customer"
                                  label="Bu şirket bir müşteridir"
                                  checked={formData.is_customer === true || formData.is_customer === "true"}
                                  onChange={handleChange}
                                  isInvalid={!!errors.is_customer}
                                />
                                {errors.is_customer && (
                                  <Form.Control.Feedback type="invalid">{errors.is_customer}</Form.Control.Feedback>
                                )}
                              </Form.Group>
                            </Col>

                            <Col md={6}>
                              <Form.Group className="mt-3">
                                <Form.Check
                                  type="checkbox"
                                  id="is_supplier"
                                  name="is_supplier"
                                  label="Bu şirket bir tedarikçidir"
                                  checked={formData.is_supplier === true || formData.is_supplier === "true"}
                                  onChange={handleChange}
                                  isInvalid={!!errors.is_supplier}
                                />
                                {errors.is_supplier && (
                                  <Form.Control.Feedback type="invalid">{errors.is_supplier}</Form.Control.Feedback>
                                )}
                              </Form.Group>
                            </Col>
                          </Row>
                        </Tab.Pane>

                        <Tab.Pane eventKey="contacts">
                          <div className="d-flex justify-content-end mb-4">
                            <Button
                              variant="primary"
                              onClick={addContact}
                              size="sm"
                            >
                              <i className="ri-add-line align-bottom me-1"></i> Yeni Kişi Ekle
                            </Button>
                          </div>

                          {contacts.length === 0 ? (
                            <div className="text-center py-4">
                              <div className="avatar-lg mx-auto mb-4">
                                <div className="avatar-title bg-light rounded-circle text-primary fs-24">
                                  <i className="ri-user-3-line"></i>
                                </div>
                              </div>
                              <h5>Henüz iletişim kişisi eklenmedi</h5>
                              <p className="text-muted">Bu şirket için iletişim kişilerini ekleyin.</p>
                              <Button
                                variant="success"
                                onClick={addContact}
                                size="sm"
                              >
                                <i className="ri-add-line align-bottom me-1"></i> İletişim Kişisi Ekle
                              </Button>
                            </div>
                          ) : (
                            contacts.map((contact, index) => (
                              <Card key={index} className="border mb-4">
                                <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                                  <div>
                                    <h5 className="mb-0">İletişim Kişisi #{index + 1}</h5>
                                    {contact.is_primary && (
                                      <span className="badge bg-success ms-2">Birincil</span>
                                    )}
                                  </div>
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => removeContact(index)}
                                  >
                                    <i className="ri-delete-bin-line"></i>
                                  </Button>
                                </Card.Header>
                                <Card.Body>
                                  <Row className="g-3">
                                    <Col md={6}>
                                      <Form.Group>
                                        <Form.Label>Ad Soyad <span className="text-danger">*</span></Form.Label>
                                        <Form.Control
                                          type="text"
                                          value={contact.name}
                                          onChange={(e) => updateContact(index, 'name', e.target.value)}
                                          isInvalid={!!errors[`contacts.${index}.name`]}
                                          required
                                        />
                                        {errors[`contacts.${index}.name`] && (
                                          <Form.Control.Feedback type="invalid">
                                            {errors[`contacts.${index}.name`]}
                                          </Form.Control.Feedback>
                                        )}
                                      </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                      <Form.Group>
                                        <Form.Label>Pozisyon</Form.Label>
                                        <Form.Control
                                          type="text"
                                          value={contact.position}
                                          onChange={(e) => updateContact(index, 'position', e.target.value)}
                                          isInvalid={!!errors[`contacts.${index}.position`]}
                                        />
                                        {errors[`contacts.${index}.position`] && (
                                          <Form.Control.Feedback type="invalid">
                                            {errors[`contacts.${index}.position`]}
                                          </Form.Control.Feedback>
                                        )}
                                      </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                      <Form.Group>
                                        <Form.Label>Telefon</Form.Label>
                                        <Form.Control
                                          type="text"
                                          value={contact.phone}
                                          onChange={(e) => updateContact(index, 'phone', e.target.value)}
                                          isInvalid={!!errors[`contacts.${index}.phone`]}
                                        />
                                        {errors[`contacts.${index}.phone`] && (
                                          <Form.Control.Feedback type="invalid">
                                            {errors[`contacts.${index}.phone`]}
                                          </Form.Control.Feedback>
                                        )}
                                      </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                      <Form.Group>
                                        <Form.Label>E-posta</Form.Label>
                                        <Form.Control
                                          type="email"
                                          value={contact.email}
                                          onChange={(e) => updateContact(index, 'email', e.target.value)}
                                          isInvalid={!!errors[`contacts.${index}.email`]}
                                        />
                                        {errors[`contacts.${index}.email`] && (
                                          <Form.Control.Feedback type="invalid">
                                            {errors[`contacts.${index}.email`]}
                                          </Form.Control.Feedback>
                                        )}
                                      </Form.Group>
                                    </Col>

                                    <Col md={12}>
                                      <Form.Group>
                                        <Form.Label>Notlar</Form.Label>
                                        <Form.Control
                                          as="textarea"
                                          rows={3}
                                          value={contact.notes}
                                          onChange={(e) => updateContact(index, 'notes', e.target.value)}
                                          isInvalid={!!errors[`contacts.${index}.notes`]}
                                        />
                                        {errors[`contacts.${index}.notes`] && (
                                          <Form.Control.Feedback type="invalid">
                                            {errors[`contacts.${index}.notes`]}
                                          </Form.Control.Feedback>
                                        )}
                                      </Form.Group>
                                    </Col>

                                    <Col md={12}>
                                      <Form.Group className="mt-2">
                                        <Form.Check
                                          type="checkbox"
                                          id={`is_primary_${index}`}
                                          label="Bu kişi birincil iletişim kişisidir"
                                          checked={contact.is_primary}
                                          onChange={(e) => updateContact(index, 'is_primary', e.target.checked)}
                                          isInvalid={!!errors[`contacts.${index}.is_primary`]}
                                        />
                                        {errors[`contacts.${index}.is_primary` ] && (
                                          <Form.Control.Feedback type="invalid">
                                            {errors[`contacts.${index}.is_primary`]}
                                          </Form.Control.Feedback>
                                        )}
                                      </Form.Group>
                                    </Col>
                                  </Row>
                                </Card.Body>
                              </Card>
                            ))
                          )}
                        </Tab.Pane>
                      </Tab.Content>
                    </Tab.Container>

                    <div className="d-flex justify-content-end gap-2 mt-4">
                      <Link href={route('companies.index')} className="btn btn-light">
                        İptal
                      </Link>
                      <Button type="submit" variant="primary">
                        Kaydet
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Form>
        </Container>
        <ToastContainer closeButton={false} position="top-right" />
      </div>
    </>
  );
}

CompanyEdit.layout = (page: any) => <Layout children={page} />;
export default CompanyEdit;
