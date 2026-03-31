import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { Card, Col, Row, Badge, Button, Alert, ListGroup } from 'react-bootstrap';
import { Link, useForm } from '@inertiajs/react';
import Layout from '../../Layouts';
import { Download, FileEarmark, PencilSquare, Trash, InfoCircle } from 'react-bootstrap-icons';

interface Document {
  id: number;
  title: string;
  description: string;
  category: string;
  tags: string[];
  file_path: string;
  user: {
    id: number;
    first_name: string;
    last_name: string;
  };
  department: {
    id: number;
    name: string;
  } | null;
  location: {
    id: number;
    name: string;
  } | null;
  created_at: string;
  updated_at: string;
  access_level: string;
  download_count: number;
  version: number;
  is_featured: boolean;
  status: string;
  expire_date: string | null;
}

interface Props {
  document: Document;
}

    const Show = ({ document }: Props) => {


        const { delete: destroy } = useForm();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  const handleDelete = () => {
    if (confirm('Bu dokümanı silmek istediğinize emin misiniz?')) {
      destroy(route('documents.destroy', document.id));
    }
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

  const getFileExtension = (filePath: string) => {
    return filePath.split('.').pop()?.toLowerCase();
  };

  const getFileIcon = () => {
    const extension = getFileExtension(document.file_path);
    switch (extension) {
      case 'pdf':
        return <FileEarmark className="me-1" />;
      case 'doc':
      case 'docx':
        return <FileEarmark className="me-1" />;
      case 'xls':
      case 'xlsx':
        return <FileEarmark className="me-1" />;
      case 'ppt':
      case 'pptx':
        return <FileEarmark className="me-1" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileEarmark className="me-1" />;
      default:
        return <FileEarmark className="me-1" />;
    }
  };

  return (
    <React.Fragment>
      <Head title={document.title} />

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
                    {document.title}
                  </li>
                </ol>
              </nav>
            </Col>
          </Row>

          <Row>
            <Col lg={8}>
              <Card className="mb-4">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h3>{document.title}</h3>
                    <div>
                      <Link
                        href={route('documents.edit', document.id)}
                        className="btn btn-sm btn-outline-primary me-2"
                        title="Düzenle"
                      >
                        <PencilSquare className="me-1" />
                        Düzenle
                      </Link>
                      <Button
                        variant="sm btn-outline-danger"
                        title="Sil"
                        onClick={handleDelete}
                      >
                        <Trash className="me-1" />
                        Sil
                      </Button>
                    </div>
                  </div>

                  <div className="d-flex gap-2 mb-4 align-items-center">
                    {document.category && (
                      <Badge bg="secondary" className="fs-6">{document.category}</Badge>
                    )}
                    {getAccessLevelBadge(document.access_level)}
                    {document.is_featured && (
                      <Badge bg="warning">Öne Çıkan</Badge>
                    )}
                  </div>

                  {document.description && (
                    <div className="mb-4">
                      <h5>Açıklama</h5>
                      <p>{document.description}</p>
                    </div>
                  )}

                  <div className="document-tags mb-4">
                    {document.tags && document.tags.length > 0 && (
                      <>
                        <h5>Etiketler</h5>
                        <div className="d-flex flex-wrap gap-2">
                          {document.tags.map((tag, index) => (
                            <Badge key={index} bg="light" text="dark">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="document-download mt-4">
                    <h5>Dosya</h5>
                    <Card className="shadow-sm">
                      <Card.Body className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          {getFileIcon()}
                          <span className="ms-2">
                            {document.title}.{getFileExtension(document.file_path)}
                          </span>
                          <span className="badge bg-secondary ms-2">v{document.version}</span>
                        </div>
                        <a
                          href={route('documents.download', document.id)}
                          className="btn btn-primary"
                          download
                        >
                          <Download className="me-2" />
                          İndir
                        </a>
                      </Card.Body>
                    </Card>
                  </div>
                </Card.Body>
                <Card.Footer className="text-muted">
                  <small>
                    Ekleyen: {document.user.first_name} {document.user.last_name} | {formatDate(document.created_at)}
                  </small>
                </Card.Footer>
              </Card>
            </Col>

            <Col lg={4}>
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">Doküman Bilgileri</h5>
                </Card.Header>
                <ListGroup variant="flush">
                  <ListGroup.Item>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Kategori:</span>
                      <span>{document.category || '-'}</span>
                    </div>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Erişim Seviyesi:</span>
                      <span>{getAccessLevelBadge(document.access_level)}</span>
                    </div>
                  </ListGroup.Item>
                  {document.department && (
                    <ListGroup.Item>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Departman:</span>
                        <span>{document.department.name}</span>
                      </div>
                    </ListGroup.Item>
                  )}
                  {document.location && (
                    <ListGroup.Item>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Lokasyon:</span>
                        <span>{document.location.name}</span>
                      </div>
                    </ListGroup.Item>
                  )}
                  <ListGroup.Item>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Versiyon:</span>
                      <span>{document.version}</span>
                    </div>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Durumu:</span>
                      <span>
                        {document.status === 'active' ? (
                          <Badge bg="success">Aktif</Badge>
                        ) : document.status === 'archived' ? (
                          <Badge bg="secondary">Arşivlenmiş</Badge>
                        ) : (
                          <Badge bg="secondary">{document.status}</Badge>
                        )}
                      </span>
                    </div>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Oluşturma Tarihi:</span>
                      <span>{formatDate(document.created_at)}</span>
                    </div>
                  </ListGroup.Item>
                  {document.updated_at && document.updated_at !== document.created_at && (
                    <ListGroup.Item>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Güncelleme Tarihi:</span>
                        <span>{formatDate(document.updated_at)}</span>
                      </div>
                    </ListGroup.Item>
                  )}
                  {document.expire_date && (
                    <ListGroup.Item>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Son Geçerlilik Tarihi:</span>
                        <span>{formatDate(document.expire_date)}</span>
                      </div>
                    </ListGroup.Item>
                  )}
                  <ListGroup.Item>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">İndirme Sayısı:</span>
                      <span>{document.download_count}</span>
                    </div>
                  </ListGroup.Item>
                </ListGroup>
              </Card>

              <Card className="mb-4">
                <Card.Header className="bg-light">
                  <div className="d-flex align-items-center">
                    <InfoCircle className="me-2" />
                    <h5 className="mb-0">Erişim Bilgisi</h5>
                  </div>
                </Card.Header>
                <Card.Body>
                  <Alert variant="info" className="mb-0">
                    <div className="d-flex">
                      <div className="me-2">
                        <InfoCircle size={20} />
                      </div>
                      <div>
                        <strong>Bu doküman {document.access_level} erişime sahiptir.</strong>
                        <p className="mb-0 mt-1">
                          {document.access_level === 'private' && 'Bu dokümanı sadece siz ve yöneticiler görebilir.'}
                          {document.access_level === 'department' && 'Bu dokümanı sadece departmanınızdaki kullanıcılar ve yöneticiler görebilir.'}
                          {document.access_level === 'location' && 'Bu dokümanı sadece lokasyonunuzdaki kullanıcılar ve yöneticiler görebilir.'}
                          {document.access_level === 'public' && 'Bu dokümanı tüm kullanıcılar görebilir.'}
                        </p>
                      </div>
                    </div>
                  </Alert>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </React.Fragment>
  );
}
Show.layout = (page:any) => <Layout children={page}/>
export default Show;
