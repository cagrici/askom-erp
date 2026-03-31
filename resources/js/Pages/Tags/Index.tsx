import React from "react";
import { Head, Link } from "@inertiajs/react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button
} from "react-bootstrap";
import Layout from "../../Layouts";
import BreadCrumb from "../../Components/Common/BreadCrumb";

interface Tag {
  id: number;
  name: string;
  type: string;
  created_at: string;
  updated_at: string;
}

interface TagsIndexProps {
  tags: {
    data: Tag[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

const TagsIndex: React.FC<TagsIndexProps> = ({ tags }) => {
  return (
    <>
      <Head title="Etiketler | Portal" />
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Etiketler" pageTitle="Etiket Yönetimi" />
          
          <Row>
            <Col lg={12}>
              <Card>
                <Card.Header className="d-flex align-items-center">
                  <h5 className="card-title mb-0 flex-grow-1">Etiketler</h5>
                  <div className="d-flex gap-2">
                    <Link href={route('tags.create')} className="btn btn-primary">
                      <i className="ri-add-line align-bottom me-1"></i> Yeni Etiket Ekle
                    </Link>
                  </div>
                </Card.Header>
                
                <Card.Body>
                  <div className="table-responsive">
                    <Table className="table-striped table-nowrap align-middle mb-0">
                      <thead>
                        <tr>
                          <th scope="col">ID</th>
                          <th scope="col">Etiket Adı</th>
                          <th scope="col">Tür</th>
                          <th scope="col">Oluşturulma Tarihi</th>
                          <th scope="col">İşlemler</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tags.data && tags.data.length > 0 ? (
                          tags.data.map((tag) => (
                            <tr key={tag.id}>
                              <td>{tag.id}</td>
                              <td>{tag.name}</td>
                              <td>{tag.type}</td>
                              <td>{new Date(tag.created_at).toLocaleDateString()}</td>
                              <td>
                                <div className="d-flex gap-2">
                                  <Link 
                                    href={route('tags.edit', tag.id)} 
                                    className="btn btn-sm btn-soft-success"
                                  >
                                    <i className="ri-pencil-fill"></i>
                                  </Link>
                                  <Link 
                                    href={route('tags.show', tag.id)} 
                                    className="btn btn-sm btn-soft-primary"
                                  >
                                    <i className="ri-eye-fill"></i>
                                  </Link>
                                  <Link 
                                    href={route('tags.destroy', tag.id)} 
                                    method="delete" 
                                    as="button" 
                                    type="button"
                                    className="btn btn-sm btn-soft-danger"
                                    data={{ _token: document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '' }}
                                  >
                                    <i className="ri-delete-bin-fill"></i>
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="text-center">
                              Hiç etiket bulunamadı
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                  
                  {/* Pagination can be added here if needed */}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
}

TagsIndex.layout = (page: any) => <Layout children={page} />;
export default TagsIndex;