import React, { useState, useEffect, useRef } from 'react';
import { Card, ListGroup, Form, Button, Badge, Dropdown, Modal } from 'react-bootstrap';
// import { useDispatch, useSelector } from 'react-redux';
import { Link } from '@inertiajs/react';
// import { RootState, AppDispatch } from '../../store';
// import {
//     fetchMessageGroups,
//     fetchGroupMessages,
//     sendMessage,
//     setActiveGroup,
// } from '../../slices/messageSlice';
// import MessageList from './MessageList';
// import MessageInput from './MessageInput';
// import NewGroupModal from './NewGroupModal';

interface MessageWidgetProps {
    expanded?: boolean;
}

const MessageWidget: React.FC<MessageWidgetProps> = ({ expanded = false }) => {
    // const dispatch = useDispatch<AppDispatch>();
    // const { groups, activeGroupId, messages, loading, sendingMessage } = useSelector(
    //     (state: RootState) => state.messages
    // );
    const [showFullChat, setShowFullChat] = useState(expanded);
    const [showNewGroupModal, setShowNewGroupModal] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Geçici test verileri
    const groups: any[] = [];
    const activeGroupId = null;
    const messages: any = {};
    const loading = false;
    const sendingMessage = false;

    // useEffect(() => {
    //     dispatch(fetchMessageGroups());
    // }, [dispatch]);

    // useEffect(() => {
    //     if (activeGroupId) {
    //         dispatch(fetchGroupMessages(activeGroupId));
    //     }
    // }, [activeGroupId, dispatch]);

    // useEffect(() => {
    //     scrollToBottom();
    // }, [messages[activeGroupId || 0]]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async (content: string, attachments?: File[]) => {
        // if (!activeGroupId) return;

        // await dispatch(sendMessage({
        //     groupId: activeGroupId,
        //     content,
        //     attachments,
        // }));
    };

    const handleGroupSelect = (groupId: number) => {
        // dispatch(setActiveGroup(groupId));
    };

    const activeGroup = groups.find(g => g.id === activeGroupId);
    const activeMessages = messages[activeGroupId || 0] || [];

    if (!showFullChat) {
        return (
            <Card className="message-widget-compact mb-4">
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                        <i className="bi bi-chat-dots me-2"></i>Mesajlar
                    </h5>
                    <div>
                        <Button
                            variant="link"
                            size="sm"
                            onClick={() => setShowNewGroupModal(true)}
                            className="p-0 me-2"
                        >
                            <i className="bi bi-plus-circle"></i>
                        </Button>
                        <Button
                            variant="link"
                            size="sm"
                            onClick={() => setShowFullChat(true)}
                            className="p-0"
                        >
                            <i className="bi bi-arrows-angle-expand"></i>
                        </Button>
                    </div>
                </Card.Header>
                <ListGroup variant="flush" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {groups.map((group) => (
                        <ListGroup.Item
                            key={group.id}
                            action
                            active={group.id === activeGroupId}
                            onClick={() => handleGroupSelect(group.id)}
                            className="d-flex justify-content-between align-items-start"
                        >
                            <div className="ms-2 me-auto bg-gray-100">
                                <div className="fw-bold">
                                    {group.name}
                                    {group.unread_count > 0 && (
                                        <Badge bg="danger" className="ms-2">
                                            {group.unread_count}
                                        </Badge>
                                    )}
                                </div>
                                {group.latest_message && (
                                    <small className="text-muted text-truncate d-block" style={{ maxWidth: '200px' }}>
                                        <strong>{group.latest_message.user.name}:</strong> {group.latest_message.content}
                                    </small>
                                )}
                            </div>
                            <small className="text-muted">
                                {group.type === 'department' && <i className="bi bi-building"></i>}
                                {group.type === 'private' && <i className="bi bi-people"></i>}
                                {group.type === 'project' && <i className="bi bi-briefcase"></i>}
                            </small>
                        </ListGroup.Item>
                    ))}
                    {groups.length === 0 && (
                        <ListGroup.Item className="text-center text-muted py-4">
                            <i className="bi bi-chat-square-dots fs-1 mb-3 d-block"></i>
                            <p className="mb-3">Henüz mesaj grubunuz yok</p>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                    console.log('Button clicked');
                                    setShowNewGroupModal(true);
                                }}
                            >
                                <i className="bi bi-plus-circle me-2"></i>
                                İlk Mesajınızı Gönderin
                            </Button>
                        </ListGroup.Item>
                    )}
                </ListGroup>
            </Card>
        );
    }

    return (
        <>
            <Modal
                show={showFullChat}
                onHide={() => setShowFullChat(false)}
                size="lg"
                className="message-modal"
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                        {activeGroup ? (
                            <>
                                <i className="ri ri-chat-3-line me-2"></i>
                                {activeGroup.name}
                                {activeGroup.type === 'department' && activeGroup.department && (
                                    <small className="text-muted ms-2">
                                        ({activeGroup.department.name})
                                    </small>
                                )}
                            </>
                        ) : (
                            'Mesajlar'
                        )}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-0" style={{ height: '70vh' }}>
                    <div className="d-flex h-100">
                        <div className="message-groups-list border-end" style={{ width: '250px', overflowY: 'auto' }}>
                            <div className="p-2 border-bottom">
                                <Button
                                    variant="primary"
                                    size="sm"
                                    className="w-100"
                                    onClick={() => setShowNewGroupModal(true)}
                                >
                                    <i className="bi bi-plus-circle me-2"></i>
                                    Yeni Grup
                                </Button>
                            </div>
                            <ListGroup variant="flush">
                                {groups.map((group) => (
                                    <ListGroup.Item
                                        key={group.id}
                                        action
                                        active={group.id === activeGroupId}
                                        onClick={() => handleGroupSelect(group.id)}
                                    >
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div className="text-truncate">
                                                <div className="fw-bold">{group.name}</div>
                                                <small className="text-muted">
                                                    {group.type === 'department' && 'Departman'}
                                                    {group.type === 'private' && 'Özel'}
                                                    {group.type === 'project' && 'Proje'}
                                                </small>
                                            </div>
                                            {group.unread_count > 0 && (
                                                <Badge bg="danger" pill>
                                                    {group.unread_count}
                                                </Badge>
                                            )}
                                        </div>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </div>
                        <div className="flex-grow-1 d-flex flex-column">
                            {activeGroupId ? (
                                <>
                                    <MessageList
                                        messages={activeMessages}
                                        loading={loading}
                                        messagesEndRef={messagesEndRef}
                                    />
                                    <MessageInput
                                        onSendMessage={handleSendMessage}
                                        disabled={sendingMessage}
                                    />
                                </>
                            ) : (
                                <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                                    <div className="text-center">
                                        <i className="bi bi-chat-dots fs-1 mb-3 d-block"></i>
                                        <p>Bir grup seçerek mesajlaşmaya başlayın</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </Modal.Body>
            </Modal>

            {/* Test Modal */}
            <Modal show={showNewGroupModal} onHide={() => setShowNewGroupModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Test Modal</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Modal çalışıyor!
                </Modal.Body>
            </Modal>

            {/* <NewGroupModal
                show={showNewGroupModal}
                onHide={() => {
                    console.log('Modal closing');
                    setShowNewGroupModal(false);
                }}
            /> */}
        </>
    );
};

export default MessageWidget;
