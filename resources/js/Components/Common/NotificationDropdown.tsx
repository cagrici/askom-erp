import React, { useState } from 'react';
import { Button, Col, Dropdown, Nav, Row, Tab } from 'react-bootstrap';

//import images
import avatar2 from "../../../images/users/avatar-2.jpg";
import avatar8 from "../../../images/users/avatar-8.jpg";
import avatar3 from "../../../images/users/avatar-3.jpg";
import avatar6 from "../../../images/users/avatar-6.jpg";
import bell from "../../../images/svg/bell.svg";

//SimpleBar
import SimpleBar from "simplebar-react";

const NotificationDropdown = () => {
    //Dropdown Toggle
    const [isNotificationDropdown, setIsNotificationDropdown] = useState<boolean>(false);
    const toggleNotificationDropdown = () => {
        setIsNotificationDropdown(!isNotificationDropdown);
    };

    return (
        <React.Fragment>
            <Dropdown show={isNotificationDropdown} onClick={toggleNotificationDropdown} className="topbar-head-dropdown ms-1 header-item">
                <Dropdown.Toggle type="button" as="button" className="arrow-none btn btn-icon btn-topbar btn-ghost-secondary rounded-circle">
                    <i className='bx bx-bell fs-22'></i>
                    <span
                        className="position-absolute topbar-badge fs-10 translate-middle badge rounded-pill bg-danger">0<span
                            className="visually-hidden">unread messages</span></span>
                </Dropdown.Toggle>
                <Dropdown.Menu className="dropdown-menu-lg dropdown-menu-end p-0">
                    {/* <div className="dropdown-head bg-primary bg-pattern rounded-top"> */}
                    <div className="p-3 bg-primary bg-pattern rounded-top">
                        <Row className="align-items-center">
                            <Col>
                                <h6 className="m-0 fs-16 fw-semibold text-white"> Bildirim </h6>
                            </Col>
                            <div className="col-auto dropdown-tabs">
                                <span className="badge bg-light-subtle fs-13 text-body"> 0 Yeni</span>
                            </div>
                        </Row>
                    </div>

                    <Tab.Container defaultActiveKey="all">
                    <div className="px-2 pt-2 bg-primary bg-pattern ">
                        <Nav className="nav-tabs nav-tabs-custom" role='tablist'>
                            <Nav.Item>
                                <Nav.Link eventKey="all" as="a"> Tümü (0) </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="messages" as="a"> Mesajlar </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="alerts" as="a"> Bildirimler </Nav.Link>
                            </Nav.Item>
                        </Nav>
                        </div>

                        {/* </div> */}

                        <Tab.Content>
                            <Tab.Pane id="all" eventKey="all" className="py-2 ps-2">
                                <SimpleBar style={{ maxHeight: "300px" }} className="pe-2">


                                    <div className="my-3 text-center">
                                        <button type="button" className="btn btn-soft-success waves-effect waves-light">Tüm Bildirimleri Görüntüle <i className="ri-arrow-right-line align-middle"></i></button>
                                    </div>
                                </SimpleBar>

                            </Tab.Pane>

                            <Tab.Pane id="messages" eventKey="messages" className="py-2 ps-2">
                                <SimpleBar style={{ maxHeight: "300px" }} className="pe-2">

                                    <div className="my-3 text-center">
                                        <button type="button" className="btn btn-soft-success waves-effect waves-light">
                                            Tüm Mesajlar <i className="ri-arrow-right-line align-middle"></i></button>
                                    </div>
                                </SimpleBar>
                            </Tab.Pane>

                            <Tab.Pane id='alerts' eventKey="alerts" className="p-4">
                                <div className="w-25 w-sm-50 pt-3 mx-auto">
                                    <img src={bell} className="img-fluid" alt="user-pic" />
                                </div>
                                <div className="text-center pb-5 mt-2">
                                    <h6 className="fs-18 fw-semibold lh-base">Henüz bildirim yok </h6>
                                </div>
                            </Tab.Pane>

                        </Tab.Content>
                    </Tab.Container>
                </Dropdown.Menu>
            </Dropdown>
        </React.Fragment >
    );
};

export default NotificationDropdown;
