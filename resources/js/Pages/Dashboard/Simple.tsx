import React from 'react';
import { Head } from '@inertiajs/react';
import { Card, Col, Row, Alert } from 'react-bootstrap';
import Layout from '../../Layouts';

export default function SimpleDashboard() {
  return (
    <>
      <Head title="Dashboard" />

      <div className="page-content">
        <Row>
          <Col lg={12}>
            <Card className="mb-4">
              <Card.Body>
                <h2 className="card-title mb-4">Hoş Geldiniz!</h2>
                <Alert variant="info">
                  <h5>İntranet Portalına Hoş Geldiniz</h5>
                  <p>Bu portal ile kurumsal bilgilere erişebilir, iş taleplerini yönetebilir ve şirket içi iletişimi güçlendirebilirsiniz.</p>
                </Alert>
                
                <Row className="mt-4">
                  <Col md={4}>
                    <Card className="text-center">
                      <Card.Body>
                        <i className="bi bi-megaphone fs-1 text-primary mb-3 d-block"></i>
                        <h5>Duyurular</h5>
                        <p>Şirket duyurularını takip edin</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4}>
                    <Card className="text-center">
                      <Card.Body>
                        <i className="bi bi-file-earmark-text fs-1 text-success mb-3 d-block"></i>
                        <h5>Dokümanlar</h5>
                        <p>Kurumsal dokümanlara erişin</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4}>
                    <Card className="text-center">
                      <Card.Body>
                        <i className="bi bi-list-task fs-1 text-warning mb-3 d-block"></i>
                        <h5>İş Talepleri</h5>
                        <p>İş taleplerini yönetin</p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
}

// Add the layout property
SimpleDashboard.layout = (page: any) => <Layout children={page} />;