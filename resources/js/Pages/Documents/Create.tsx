import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { Card, Col, Row, Form, Button } from 'react-bootstrap';
import { Link, useForm } from '@inertiajs/react';
import Layout from '../../Layouts';
import { ArrowLeft, Save, Paperclip, Tags } from 'react-bootstrap-icons';

interface Department {
  id: number;
  name: string;
}

interface Location {
  id: number;
  name: string;
}

interface Props {
  departments: Department[];
  locations: Location[];
  categories: string[];
}

    const Create = ({ departments, locations, categories }: Props) => {
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const { data, setData, post, processing, errors, reset } = useForm({
    title: '',
    description: '',
    category_id: '', // Change from 'category' to 'category_id'
    tags: [] as string[],
    department_id: '',
    location_id: '',
    access_level: 'private',
    is_featured: false,
    expire_date: '',
    file: null as File | null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Create FormData for file upload
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'tags') {
        // Handle array values
        formData.append(key, JSON.stringify(tags));
      } else if (key === 'file' && data.file) {
        formData.append(key, data.file);
      } else {
        formData.append(key, data[key] as string);
      }
    });

    post(route('documents.store'), formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setData('file', e.target.files[0]);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()];
      setTags(newTags);
      setData('tags', newTags);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    setData('tags', newTags);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setData('category_id', e.target.value); // Change from 'category' to 'category_id'
  };

  return (
    <React.Fragment>
      <Head title="Yeni Doküman" />

      <div className="page-content">
        <div className="container-fluid">
          <Row className="mb-4">
            <Col>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link href={route('dashboard')}>Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link href={route('documents.index')}>Dokümanlar</Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Yeni Doküman
                  </li>
                </ol>
              </nav>
            </Col>
          </Row>

          <Form onSubmit={handleSubmit}>
            <Row>
              <Col lg={8}>
                <Card className="mb-4">
                  <Card.Body>
                    <h4 className="card-title mb-4">Yeni Doküman Yükle</h4>

                    <Form.Group className="mb-3">
                      <Form.Label>Başlık</Form.Label>
                      <Form.Control
                        type="text"
                        value={data.title}
                        onChange={e => setData('title', e.target.value)}
                        isInvalid={!!errors.title}
                        required
                      />
                      {errors.title && (
                        <Form.Control.Feedback type="invalid">{errors.title}</Form.Control.Feedback>
                      )}
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Açıklama</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={data.description}
                        onChange={e => setData('description', e.target.value)}
                        isInvalid={!!errors.description}
                      />
                      {errors.description && (
                        <Form.Control.Feedback type="invalid">{errors.description}</Form.Control.Feedback>
                      )}
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Dosya</Form.Label>
                      <Form.Control
                        type="file"
                        onChange={handleFileChange}
                        isInvalid={!!errors.file}
                        required
                      />
                      <Form.Text className="text-muted">
                        Maksimum dosya boyutu: 20MB
                      </Form.Text>
                      {errors.file && (
                        <Form.Control.Feedback type="invalid">{errors.file}</Form.Control.Feedback>
                      )}
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Kategori</Form.Label>
                      <Form.Select
                        value={data.category_id} // Change from data.category to data.category_id
                        onChange={handleCategoryChange}
                        isInvalid={!!errors.category_id} // Change from errors.category to errors.category_id
                      >
                        <option value="">Kategori Seçin</option>
                        {categories.map((category, index) => (
                          <option key={index} value={category}>
                            {category}
                          </option>
                        ))}
                        <option value="0">Diğer</option>
                      </Form.Select>
                      {errors.category_id && ( // Change from errors.category to errors.category_id
                        <Form.Control.Feedback type="invalid">{errors.category_id}</Form.Control.Feedback>
                      )}
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="d-flex align-items-center">
                        <Tags className="me-1" />
                        Etiketler
                      </Form.Label>
                      <div className="d-flex mb-2">
                        <Form.Control
                          type="text"
                          value={tagInput}
                          onChange={e => setTagInput(e.target.value)}
                          placeholder="Etiket ekle"
                          onKeyPress={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddTag();
                            }
                          }}
                        />
                        <Button
                          variant="outline-primary"
                          className="ms-2"
                          onClick={handleAddTag}
                          type="button"
                        >
                          Ekle
                        </Button>
                      </div>
                      {tags.length > 0 && (
                        <div className="d-flex flex-wrap gap-2 mt-2">
                          {tags.map((tag, index) => (
                            <span
                              key={index}
                              className="badge bg-light text-dark d-flex align-items-center p-2"
                            >
                              {tag}
                              <button
                                type="button"
                                className="btn-close ms-2"
                                style={{ fontSize: '0.5rem' }}
                                onClick={() => handleRemoveTag(tag)}
                                aria-label="Remove tag"
                              ></button>
                            </span>
                          ))}
                        </div>
                      )}
                      <Form.Text className="text-muted">
                        Etiketler, dokümanınızın bulunmasını kolaylaştırır.
                      </Form.Text>
                    </Form.Group>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={4}>
                <Card className="mb-4">
                  <Card.Header>
                    <h5 className="mb-0">Doküman Ayarları</h5>
                  </Card.Header>
                  <Card.Body>
                    <Form.Group className="mb-3">
                      <Form.Label>Departman</Form.Label>
                      <Form.Select
                        value={data.department_id}
                        onChange={e => setData('department_id', e.target.value)}
                        isInvalid={!!errors.department_id}
                      >
                        <option value="">Departman Seçin</option>
                        {departments.map(department => (
                          <option key={department.id} value={department.id}>
                            {department.name}
                          </option>
                        ))}
                      </Form.Select>
                      {errors.department_id && (
                        <Form.Control.Feedback type="invalid">{errors.department_id}</Form.Control.Feedback>
                      )}
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Lokasyon</Form.Label>
                      <Form.Select
                        value={data.location_id}
                        onChange={e => setData('location_id', e.target.value)}
                        isInvalid={!!errors.location_id}
                      >
                        <option value="">Lokasyon Seçin</option>
                        {locations.map(location => (
                          <option key={location.id} value={location.id}>
                            {location.name}
                          </option>
                        ))}
                      </Form.Select>
                      {errors.location_id && (
                        <Form.Control.Feedback type="invalid">{errors.location_id}</Form.Control.Feedback>
                      )}
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Erişim Seviyesi</Form.Label>
                      <Form.Select
                        value={data.access_level}
                        onChange={e => setData('access_level', e.target.value)}
                        isInvalid={!!errors.access_level}
                        required
                      >
                        <option value="private">Özel (Sadece ben)</option>
                        <option value="department">Departman</option>
                        <option value="location">Lokasyon</option>
                        <option value="public">Genel (Tüm kullanıcılar)</option>
                      </Form.Select>
                      {errors.access_level && (
                        <Form.Control.Feedback type="invalid">{errors.access_level}</Form.Control.Feedback>
                      )}
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Son Geçerlilik Tarihi</Form.Label>
                      <Form.Control
                        type="date"
                        value={data.expire_date}
                        onChange={e => setData('expire_date', e.target.value)}
                        isInvalid={!!errors.expire_date}
                      />
                      <Form.Text className="text-muted">
                        Boş bırakılırsa doküman süresiz olacaktır.
                      </Form.Text>
                      {errors.expire_date && (
                        <Form.Control.Feedback type="invalid">{errors.expire_date}</Form.Control.Feedback>
                      )}
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        label="Öne Çıkan Doküman"
                        checked={data.is_featured}
                        onChange={e => setData('is_featured', e.target.checked)}
                      />
                      <Form.Text className="text-muted">
                        Öne çıkan dokümanlar listede vurgulanır.
                      </Form.Text>
                    </Form.Group>
                  </Card.Body>
                  <Card.Footer>
                    <div className="d-flex justify-content-between">
                      <Link
                        href={route('documents.index')}
                        className="btn btn-outline-secondary"
                      >
                        <ArrowLeft className="me-1" />
                        Geri
                      </Link>
                      <Button type="submit" variant="primary" disabled={processing}>
                        <Save className="me-1" />
                        Kaydet
                      </Button>
                    </div>
                  </Card.Footer>
                </Card>
              </Col>
            </Row>
          </Form>
        </div>
      </div>
    </React.Fragment>
  );
}
Create.layout = (page: any) => <Layout children={page} />;
export default Create;
