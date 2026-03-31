import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import Layout from '../../Layouts';
import Pagination from '../../Components/Pagination';
import { Search, Plus, Filter, Download, FileEarmark, SortDown, SortUp } from 'react-bootstrap-icons';
import {
  Card,
  Table,
  Badge,
  Button,
  Form,
  InputGroup,
  Row,
  Col,
  Dropdown,
} from 'react-bootstrap';

interface User {
  id: number;
  first_name: string;
  last_name: string;
}

interface Department {
  id: number;
  name: string;
}

interface Document {
  id: number;
  title: string;
  description: string;
  category: string;
  tags: string[];
  file_path: string;
  user: User;
  department: Department | null;
  location: {
    id: number;
    name: string;
  } | null;
  created_at: string;
  access_level: string;
  download_count: number;
  version: number;
  is_featured: boolean;
  status: string;
}

interface Props {
  documents: {
    data: Document[];
    links: any[];
    from: number;
    to: number;
    total: number;
  };
  categories: string[];
  departments: Department[];
  filters: {
    category: string | null;
    department_id: string | null;
    search: string | null;
  };
  sort: {
    field: string;
    direction: string;
  };
}

const Index = ({ documents, categories, departments, filters, sort }: Props) => {
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(filters.category);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(filters.department_id);
  const [sortField, setSortField] = useState(sort.field);
  const [sortDirection, setSortDirection] = useState(sort.direction);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = route('documents.index', {
      search: searchQuery,
      category: selectedCategory,
      department_id: selectedDepartment,
      sort_field: sortField,
      sort_direction: sortDirection,
    });
  };

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
    window.location.href = route('documents.index', {
      search: searchQuery,
      category: category,
      department_id: selectedDepartment,
      sort_field: sortField,
      sort_direction: sortDirection,
    });
  };

  const handleDepartmentSelect = (departmentId: string | null) => {
    setSelectedDepartment(departmentId);
    window.location.href = route('documents.index', {
      search: searchQuery,
      category: selectedCategory,
      department_id: departmentId,
      sort_field: sortField,
      sort_direction: sortDirection,
    });
  };

  const handleSort = (field: string) => {
    const direction = field === sortField && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(direction);
    window.location.href = route('documents.index', {
      search: searchQuery,
      category: selectedCategory,
      department_id: selectedDepartment,
      sort_field: field,
      sort_direction: direction,
    });
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedDepartment(null);
    window.location.href = route('documents.index');
  };

  const getAccessLevelBadge = (accessLevel: string) => {
    switch (accessLevel) {
      case 'private':
        return <Badge bg="secondary">Özel</Badge>;
      case 'department':
        return <Badge bg="info">Departman</Badge>;
      case 'location':
        return <Badge bg="primary">Lokasyon</Badge>;
      case 'public':
        return <Badge bg="success">Genel</Badge>;
      default:
        return <Badge bg="secondary">{accessLevel}</Badge>;
    }
  };

  return (
      <React.Fragment>
      <Head title="Dokümanlar" />

      <div className="page-content">
        <div className="container-fluid">
          <Row className="mb-4">
            <Col>
              <h2 className="page-title">Dokümanlar</h2>
            </Col>
            <Col xs="auto">
              <Link
                href={route('documents.create')}
                className="btn btn-primary"
              >
                <Plus className="me-1" size={18} />
                Yeni Doküman
              </Link>
            </Col>
          </Row>

          <Card className="mb-4">
            <Card.Body>
              <Row className="g-3">
                <Col md={6}>
                  <Form onSubmit={handleSearch}>
                    <InputGroup>
                      <Form.Control
                        placeholder="Dokümanlarda ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <button className="btn btn-primary" type="submit">
                        <Search />
                      </button>
                    </InputGroup>
                  </Form>
                </Col>
                <Col md={6} className="d-flex justify-content-end">
                  <div className="d-flex gap-2">
                    <Dropdown>
                      <Dropdown.Toggle variant="outline-secondary" id="category-dropdown">
                        <Filter className="me-1" />
                        {selectedCategory || 'Kategori'}
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => handleCategorySelect(null)}>
                          Tüm Kategoriler
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        {categories.map((category) => (
                          <Dropdown.Item
                            key={category}
                            onClick={() => handleCategorySelect(category)}
                          >
                            {category}
                          </Dropdown.Item>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown>

                    <Dropdown>
                      <Dropdown.Toggle variant="outline-secondary" id="department-dropdown">
                        <Filter className="me-1" />
                        {selectedDepartment
                          ? departments.find((d) => d.id.toString() === selectedDepartment)?.name || 'Departman'
                          : 'Departman'}
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => handleDepartmentSelect(null)}>
                          Tüm Departmanlar
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        {departments.map((department) => (
                          <Dropdown.Item
                            key={department.id}
                            onClick={() => handleDepartmentSelect(department.id.toString())}
                          >
                            {department.name}
                          </Dropdown.Item>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown>

                    {(selectedCategory || selectedDepartment) && (
                      <button
                        className="btn btn-outline-secondary"
                        onClick={clearFilters}
                        title="Filtreleri temizle"
                      >
                        Temizle
                      </button>
                    )}
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Document List */}
          <Card>
            <Table responsive hover className="mb-0">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleSort('title');
                      }}
                      className="d-flex align-items-center text-decoration-none"
                    >
                      Başlık
                      {sortField === 'title' && (
                        <span className="ms-1">
                          {sortDirection === 'asc' ? <SortUp size={14} /> : <SortDown size={14} />}
                        </span>
                      )}
                    </a>
                  </th>
                  <th style={{ width: '15%' }}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleSort('category');
                      }}
                      className="d-flex align-items-center text-decoration-none"
                    >
                      Kategori
                      {sortField === 'category' && (
                        <span className="ms-1">
                          {sortDirection === 'asc' ? <SortUp size={14} /> : <SortDown size={14} />}
                        </span>
                      )}
                    </a>
                  </th>
                  <th style={{ width: '15%' }}>Erişim</th>
                  <th style={{ width: '15%' }}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleSort('created_at');
                      }}
                      className="d-flex align-items-center text-decoration-none"
                    >
                      Tarih
                      {sortField === 'created_at' && (
                        <span className="ms-1">
                          {sortDirection === 'asc' ? <SortUp size={14} /> : <SortDown size={14} />}
                        </span>
                      )}
                    </a>
                  </th>
                  <th style={{ width: '5%' }} className="text-end">
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleSort('download_count');
                      }}
                      className="d-flex align-items-center justify-content-end text-decoration-none"
                    >
                      İndirme
                      {sortField === 'download_count' && (
                        <span className="ms-1">
                          {sortDirection === 'asc' ? <SortUp size={14} /> : <SortDown size={14} />}
                        </span>
                      )}
                    </a>
                  </th>
                  <th style={{ width: '10%' }} className="text-end">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {documents.data.length > 0 ? (
                  documents.data.map((document) => (
                    <tr key={document.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <FileEarmark className="me-2" size={18} />
                          <div>
                            <Link
                              href={route('documents.show', document.id)}
                              className="text-decoration-none fw-bold"
                            >
                              {document.title}
                            </Link>
                            {document.is_featured && (
                              <Badge bg="warning" className="ms-1">Öne Çıkan</Badge>
                            )}
                            <div className="small text-muted">
                              Ekleyen: {document.user.first_name} {document.user.last_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{document.category || '-'}</td>
                      <td>{getAccessLevelBadge(document.access_level)}</td>
                      <td>{formatDate(document.created_at)}</td>
                      <td className="text-end">{document.download_count}</td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end">
                          <a
                            href={route('documents.download', document.id)}
                            className="btn btn-sm btn-outline-primary me-1"
                            title="İndir"
                          >
                            <Download size={16} />
                          </a>
                          <Link
                            href={route('documents.show', document.id)}
                            className="btn btn-sm btn-outline-info"
                            title="Görüntüle"
                          >
                            <span>Görüntüle</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      <p className="mb-0">Belirtilen kriterlere uygun doküman bulunamadı.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card>

          <div className="d-flex justify-content-between mt-4">
            <div>
              Toplam {documents.total} dokümandan {documents.from}-{documents.to} arası görüntüleniyor
            </div>
            <Pagination links={documents.links} />
          </div>
        </div>
      </div>
      </React.Fragment>
  );
}

Index.layout = (page: any) => <Layout children={page} />;
export default Index;
