import React, { useState } from "react";
import { Head, Link, useForm, router } from "@inertiajs/react";
import { Container, Row, Col, Card, Table, Button, Badge, Dropdown, Modal, Form, InputGroup } from "react-bootstrap";
import AdminLayout from '../../../Layouts/AdminLayout';
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import { Category } from "@/types";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";

interface CategoryIndexProps {
  categories?: Category[];
  currentType: string | null;
  types?: string[];
}

const CategoryIndex: React.FC<CategoryIndexProps> = ({ categories = [], currentType, types = [] }) => {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [viewCategory, setViewCategory] = useState<Category | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [searchIcon, setSearchIcon] = useState("");
  
  const { data, setData, post, put, processing, errors, reset } = useForm({
    name: '',
    description: '',
    type: currentType || '',
    parent_id: '',
    color: '#000000',
    icon: '',
    is_active: true,
    display_order: 0
  });

  const popularIcons = [
    'ri-file-text-line', 'ri-notification-line', 'ri-restaurant-line', 'ri-newspaper-line',
    'ri-folder-line', 'ri-briefcase-line', 'ri-user-line', 'ri-team-line',
    'ri-calendar-line', 'ri-time-line', 'ri-map-pin-line', 'ri-phone-line',
    'ri-mail-line', 'ri-global-line', 'ri-home-line', 'ri-building-line',
    'ri-car-line', 'ri-bus-line', 'ri-plane-line', 'ri-ship-line',
    'ri-heart-line', 'ri-star-line', 'ri-flag-line', 'ri-bookmark-line',
    'ri-shopping-cart-line', 'ri-gift-line', 'ri-wallet-line', 'ri-bank-card-line',
    'ri-bar-chart-line', 'ri-pie-chart-line', 'ri-line-chart-line', 'ri-database-line',
    'ri-cloud-line', 'ri-computer-line', 'ri-smartphone-line', 'ri-wifi-line',
    'ri-settings-line', 'ri-tools-line', 'ri-shield-line', 'ri-lock-line',
    'ri-key-line', 'ri-alarm-line', 'ri-camera-line', 'ri-image-line',
    'ri-video-line', 'ri-music-line', 'ri-mic-line', 'ri-volume-up-line',
    'ri-book-line', 'ri-article-line', 'ri-file-copy-line', 'ri-clipboard-line',
    'ri-printer-line', 'ri-save-line', 'ri-delete-bin-line', 'ri-edit-line'
  ];

  const filteredIcons = popularIcons.filter(icon => 
    icon.toLowerCase().includes(searchIcon.toLowerCase())
  );

  const getTypeLabel = (type: string | null) => {
    if (!type) return "";

    // Türkçe çeviri için tip adlarını düzenleyin
    const typeLabels: {[key: string]: string} = {
      "document": "Döküman",
      "announcement": "Duyuru",
      "meal": "Yemek",
      "news": "Haber",
      // Diğer tip adları buraya eklenebilir
    };

    return typeLabels[type] || type;
  };

  const getCategoryTypeFilterOptions = () => {
    // Kategoriler içindeki benzersiz tipleri bulalım
    const uniqueTypes = new Set<string>();
    if (categories && Array.isArray(categories)) {
      categories.forEach(cat => {
        if (cat.type) uniqueTypes.add(cat.type);
      });
    }

    return Array.from(uniqueTypes);
  };

  const typeOptions = getCategoryTypeFilterOptions();

  return (
    <>
      <Head title={t("Categories") + " | Portal"} />
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={t("Categories")} pageTitle={t("Category Management")} />

          <Row>
            <Col lg={12}>
              <Card>
                <Card.Header className="d-flex align-items-center">
                  <h5 className="card-title mb-0 flex-grow-1">{t("Categories")}</h5>
                  <div className="d-flex gap-2">
                    {/* Tip filtresi */}
                    <Dropdown>
                      <Dropdown.Toggle variant="light" id="dropdown-type-filter">
                        {currentType ? getTypeLabel(currentType) : t("All Types")}
                      </Dropdown.Toggle>

                      <Dropdown.Menu>
                        <Dropdown.Item href={route('admin.categories.index')}>{t("All Types")}</Dropdown.Item>
                        {typeOptions.map(type => (
                          <Dropdown.Item
                            key={type}
                            href={route('admin.categories.index', { type })}
                            active={currentType === type}
                          >
                            {getTypeLabel(type)}
                          </Dropdown.Item>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown>

                    {/* Yeni kategori ekleme butonu */}
                    <Button
                      variant="primary"
                      onClick={() => handleCreate()}
                    >
                      <i className="ri-add-line align-bottom me-1"></i> {t("Add New Category")}
                    </Button>
                  </div>
                </Card.Header>

                <Card.Body>
                  <div className="table-responsive">
                    <Table className="table-striped table-nowrap align-middle mb-0">
                      <thead>
                        <tr>
                          <th scope="col">{t("ID")}</th>
                          <th scope="col">{t("Name")}</th>
                          <th scope="col">{t("Type")}</th>
                          <th scope="col">{t("Parent Category")}</th>
                          <th scope="col">{t("Status")}</th>
                          <th scope="col">{t("Order")}</th>
                          <th scope="col">{t("Actions")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories && categories.length > 0 ? (
                          categories.map((category) => (
                            <tr key={category.id}>
                              <td>{category.id}</td>
                              <td>
                                <div className="d-flex align-items-center">
                                  {category.icon && (
                                    <i className={`${category.icon} me-2`} style={{
                                      color: category.color || 'inherit'
                                    }}></i>
                                  )}
                                  <span>{category.name}</span>
                                </div>
                              </td>
                              <td>{getTypeLabel(category.type)}</td>
                              <td>{category.parent ? category.parent.name : "-"}</td>
                              <td>
                                <Badge bg={category.is_active ? "success" : "danger"}>
                                  {category.is_active ? t("Active") : t("Inactive")}
                                </Badge>
                              </td>
                              <td>{category.display_order || "-"}</td>
                              <td>
                                <div className="d-flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="soft-primary"
                                    onClick={() => handleView(category)}
                                  >
                                    <i className="ri-eye-fill"></i>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="soft-success"
                                    onClick={() => handleEdit(category)}
                                  >
                                    <i className="ri-pencil-fill"></i>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="soft-danger"
                                    onClick={() => handleDelete(category.id)}
                                  >
                                    <i className="ri-delete-bin-fill"></i>
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="text-center">
                              {t("No categories found")}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Category Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editMode ? t("Edit Category") : t("Add New Category")}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{t("Name")} <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    isInvalid={!!errors.name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{t("Type")}</Form.Label>
                  <Form.Select
                    value={data.type || ''}
                    onChange={(e) => setData('type', e.target.value)}
                    isInvalid={!!errors.type}
                  >
                    <option value="">{t("Select Type")}</option>
                    <option value="document">{t("Document")}</option>
                    <option value="announcement">{t("Announcement")}</option>
                    <option value="meal">{t("Meal")}</option>
                    <option value="news">{t("News")}</option>
                    {types.filter(type => !['document', 'announcement', 'meal', 'news'].includes(type)).map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.type}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{t("Parent Category")}</Form.Label>
                  <Form.Select
                    value={data.parent_id || ''}
                    onChange={(e) => setData('parent_id', e.target.value)}
                    isInvalid={!!errors.parent_id}
                  >
                    <option value="">{t("No Parent")}</option>
                    {categories && categories
                      .filter(cat => cat.id !== selectedCategory?.id)
                      .map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))
                    }
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.parent_id}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{t("Display Order")}</Form.Label>
                  <Form.Control
                    type="number"
                    value={data.display_order}
                    onChange={(e) => setData('display_order', parseInt(e.target.value) || 0)}
                    isInvalid={!!errors.display_order}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.display_order}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{t("Color")}</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="color"
                      value={data.color || '#000000'}
                      onChange={(e) => setData('color', e.target.value)}
                      style={{ maxWidth: '100px' }}
                    />
                    <Form.Control
                      type="text"
                      value={data.color || '#000000'}
                      onChange={(e) => setData('color', e.target.value)}
                      isInvalid={!!errors.color}
                    />
                  </InputGroup>
                  <Form.Control.Feedback type="invalid">
                    {errors.color}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{t("Icon")}</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      value={data.icon || ''}
                      onChange={(e) => setData('icon', e.target.value)}
                      placeholder="ri-folder-line"
                      isInvalid={!!errors.icon}
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={() => setShowIconPicker(!showIconPicker)}
                    >
                      <i className={data.icon || 'ri-apps-line'}></i>
                    </Button>
                  </InputGroup>
                  <Form.Control.Feedback type="invalid">
                    {errors.icon}
                  </Form.Control.Feedback>
                  
                  {showIconPicker && (
                    <Card className="mt-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      <Card.Body>
                        <Form.Control
                          type="text"
                          placeholder={t("Search icon...")}
                          value={searchIcon}
                          onChange={(e) => setSearchIcon(e.target.value)}
                          className="mb-2"
                        />
                        <div className="d-flex flex-wrap gap-2">
                          {filteredIcons.map(icon => (
                            <Button
                              key={icon}
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => {
                                setData('icon', icon);
                                setShowIconPicker(false);
                              }}
                              title={icon}
                            >
                              <i className={icon}></i>
                            </Button>
                          ))}
                        </div>
                      </Card.Body>
                    </Card>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>{t("Description")}</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={data.description || ''}
                onChange={(e) => setData('description', e.target.value)}
                isInvalid={!!errors.description}
              />
              <Form.Control.Feedback type="invalid">
                {errors.description}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="switch"
                id="is_active"
                label={t("Active")}
                checked={data.is_active}
                onChange={(e) => setData('is_active', e.target.checked)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              {t("Cancel")}
            </Button>
            <Button variant="primary" type="submit" disabled={processing}>
              {processing ? t("Saving...") : t("Save")}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* View Category Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{t("Category Details")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewCategory && (
            <>
              <Row className="mb-4">
                <Col md={6}>
                  <div className="mb-3">
                    <h6 className="text-muted mb-1">{t("Name")}</h6>
                    <div className="d-flex align-items-center">
                      {viewCategory.icon && (
                        <i className={`${viewCategory.icon} me-2 fs-4`} style={{ 
                          color: viewCategory.color || 'inherit' 
                        }}></i>
                      )}
                      <h5 className="mb-0">{viewCategory.name}</h5>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <h6 className="text-muted mb-1">{t("Type")}</h6>
                    <h5 className="mb-0">{getTypeLabel(viewCategory.type)}</h5>
                  </div>
                </Col>
              </Row>

              <Row className="mb-4">
                <Col md={6}>
                  <div className="mb-3">
                    <h6 className="text-muted mb-1">{t("Status")}</h6>
                    <Badge bg={viewCategory.is_active ? "success" : "danger"} className="fs-6">
                      {viewCategory.is_active ? t("Active") : t("Inactive")}
                    </Badge>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <h6 className="text-muted mb-1">{t("Display Order")}</h6>
                    <h5 className="mb-0">{viewCategory.display_order || "-"}</h5>
                  </div>
                </Col>
              </Row>

              {viewCategory.description && (
                <Row className="mb-4">
                  <Col>
                    <div className="mb-3">
                      <h6 className="text-muted mb-1">{t("Description")}</h6>
                      <p className="mb-0">{viewCategory.description}</p>
                    </div>
                  </Col>
                </Row>
              )}

              <Row className="mb-4">
                <Col md={6}>
                  <div className="mb-3">
                    <h6 className="text-muted mb-1">{t("Color")}</h6>
                    <div className="d-flex align-items-center gap-2">
                      <div 
                        style={{ 
                          width: '30px', 
                          height: '30px', 
                          backgroundColor: viewCategory.color || '#000000',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                      ></div>
                      <span>{viewCategory.color || '#000000'}</span>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <h6 className="text-muted mb-1">{t("Icon Class")}</h6>
                    <code className="fs-6">{viewCategory.icon || '-'}</code>
                  </div>
                </Col>
              </Row>

              {/* Parent Category */}
              {viewCategory.parent && (
                <Row className="mb-4">
                  <Col>
                    <h6 className="text-muted mb-2">{t("Parent Category")}</h6>
                    <Card className="border">
                      <Card.Body className="p-3">
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="d-flex align-items-center">
                            {viewCategory.parent.icon && (
                              <i className={`${viewCategory.parent.icon} me-2`} style={{ 
                                color: viewCategory.parent.color || 'inherit' 
                              }}></i>
                            )}
                            <span className="fw-medium">{viewCategory.parent.name}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => {
                              handleView(viewCategory.parent!);
                            }}
                          >
                            {t("View")}
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )}

              {/* Child Categories */}
              {viewCategory.children && viewCategory.children.length > 0 && (
                <Row className="mb-4">
                  <Col>
                    <h6 className="text-muted mb-2">{t("Child Categories")} ({viewCategory.children.length})</h6>
                    <div className="list-group">
                      {viewCategory.children.map((child) => (
                        <div key={child.id} className="list-group-item">
                          <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center">
                              {child.icon && (
                                <i className={`${child.icon} me-2`} style={{ 
                                  color: child.color || 'inherit' 
                                }}></i>
                              )}
                              <span className="fw-medium">{child.name}</span>
                              <Badge bg={child.is_active ? "success" : "danger"} className="ms-2">
                                {child.is_active ? t("Active") : t("Inactive")}
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => {
                                handleView(child);
                              }}
                            >
                              {t("View")}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Col>
                </Row>
              )}

              {/* Metadata */}
              <Row>
                <Col md={6}>
                  <div className="text-muted small">
                    <div>{t("Created by")}: {viewCategory.creator?.name || '-'}</div>
                    <div>{t("Created at")}: {new Date(viewCategory.created_at).toLocaleString()}</div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="text-muted small">
                    <div>{t("Updated by")}: {viewCategory.updater?.name || '-'}</div>
                    <div>{t("Updated at")}: {new Date(viewCategory.updated_at).toLocaleString()}</div>
                  </div>
                </Col>
              </Row>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            {t("Close")}
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              setShowViewModal(false);
              handleEdit(viewCategory!);
            }}
          >
            <i className="ri-pencil-line me-1"></i> {t("Edit")}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );

  function handleCreate() {
    setEditMode(false);
    setSelectedCategory(null);
    reset();
    setData('type', currentType || '');
    setShowModal(true);
  }

  function handleEdit(category: Category) {
    setEditMode(true);
    setSelectedCategory(category);
    setData({
      name: category.name,
      description: category.description || '',
      type: category.type || '',
      parent_id: category.parent_id?.toString() || '',
      color: category.color || '#000000',
      icon: category.icon || '',
      is_active: category.is_active,
      display_order: category.display_order || 0
    });
    setShowModal(true);
  }

  function handleCloseModal() {
    setShowModal(false);
    setShowIconPicker(false);
    setSearchIcon('');
    reset();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (editMode && selectedCategory) {
      put(route('admin.categories.update', selectedCategory.id), {
        onSuccess: () => {
          handleCloseModal();
          Swal.fire({
            icon: 'success',
            title: t('Success'),
            text: t('Category updated successfully'),
            timer: 1500,
            showConfirmButton: false
          });
        }
      });
    } else {
      post(route('admin.categories.store'), {
        onSuccess: () => {
          handleCloseModal();
          Swal.fire({
            icon: 'success',
            title: t('Success'),
            text: t('Category created successfully'),
            timer: 1500,
            showConfirmButton: false
          });
        }
      });
    }
  }

  function handleView(category: Category) {
    // Kategori detaylarını getir
    router.get(route('admin.categories.show', category.id), {}, {
      preserveState: true,
      preserveScroll: true,
      onSuccess: (page: any) => {
        setViewCategory(page.props.category);
        setShowViewModal(true);
      }
    });
  }

  function handleDelete(id: number) {
    Swal.fire({
      title: t('Are you sure?'),
      text: t('You won\'t be able to revert this!'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: t('Yes, delete it!'),
      cancelButtonText: t('Cancel')
    }).then((result) => {
      if (result.isConfirmed) {
        router.delete(route('admin.categories.destroy', id), {
          onSuccess: () => {
            Swal.fire(
              t('Deleted!'),
              t('Category has been deleted.'),
              'success'
            );
          }
        });
      }
    });
  }
}

CategoryIndex.layout = (page: any) => <AdminLayout children={page} />;
export default CategoryIndex;
