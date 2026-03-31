import React from 'react';
import { Spinner, Dropdown } from 'react-bootstrap';

interface Message {
    id: number;
    user: {
        id: number;
        name: string;
    };
    content: string;
    type: string;
    created_at: string;
    is_edited: boolean;
    edited_at?: string;
    attachments: any[];
    parent?: Message;
}

interface MessageListProps {
    messages: Message[];
    loading: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement>;
}

const MessageList: React.FC<MessageListProps> = ({ messages, loading, messagesEndRef }) => {
    const currentUserId = (window as any).auth?.user?.id;

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'şimdi';
        if (diffMins < 60) return `${diffMins}dk önce`;
        if (diffHours < 24) return `${diffHours}sa önce`;
        if (diffDays < 7) return `${diffDays}g önce`;

        return date.toLocaleDateString('tr-TR');
    };

    if (loading && messages.length === 0) {
        return (
            <div className="d-flex align-items-center justify-content-center h-100">
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <div className="messages-container flex-grow-1 p-3" style={{ overflowY: 'auto' }}>
            {messages.length === 0 ? (
                <div className="text-center text-muted">
                    <i className="bi bi-chat-square-dots fs-1 mb-3 d-block"></i>
                    <p>Henüz mesaj yok. İlk mesajı siz gönderin!</p>
                </div>
            ) : (
                [...messages].reverse().map((message) => {
                    const isOwnMessage = message.user.id === currentUserId;

                    return (
                        <div
                            key={message.id}
                            className={`message-item mb-3 ${isOwnMessage ? 'text-end' : ''}`}
                        >
                            {message.parent && (
                                <div className={`reply-preview mb-1 ${isOwnMessage ? 'ms-auto' : ''}`} style={{ maxWidth: '70%' }}>
                                    <small className="text-muted">
                                        <i className="bi bi-reply me-1"></i>
                                        {message.parent.user.name}: {message.parent.content.substring(0, 50)}...
                                    </small>
                                </div>
                            )}
                            <div className={`d-inline-block ${isOwnMessage ? 'text-start' : ''}`} style={{ maxWidth: '70%' }}>
                                <div className={`message-bubble p-3 rounded-3 ${isOwnMessage ? 'bg-primary text-white' : 'bg-light'}`}>
                                    <div className="d-flex justify-content-between align-items-start mb-1">
                                        <strong className={`${isOwnMessage ? 'text-white' : 'text-dark'}`}>
                                            {message.user.name}
                                        </strong>
                                        <Dropdown align="end" className="ms-2">
                                            <Dropdown.Toggle
                                                variant="link"
                                                className={`p-0 border-0 ${isOwnMessage ? 'text-white' : 'text-muted'}`}
                                                size="sm"
                                            >
                                                <i className="bi bi-three-dots-vertical"></i>
                                            </Dropdown.Toggle>
                                            <Dropdown.Menu>
                                                <Dropdown.Item>
                                                    <i className="bi bi-reply me-2"></i>
                                                    Yanıtla
                                                </Dropdown.Item>
                                                {isOwnMessage && (
                                                    <>
                                                        <Dropdown.Item>
                                                            <i className="bi bi-pencil me-2"></i>
                                                            Düzenle
                                                        </Dropdown.Item>
                                                        <Dropdown.Divider />
                                                        <Dropdown.Item className="text-danger">
                                                            <i className="bi bi-trash me-2"></i>
                                                            Sil
                                                        </Dropdown.Item>
                                                    </>
                                                )}
                                            </Dropdown.Menu>
                                        </Dropdown>
                                    </div>
                                    <div className="message-content">
                                        {message.content}
                                    </div>
                                    {message.attachments.length > 0 && (
                                        <div className="attachments mt-2">
                                            {message.attachments.map((attachment) => (
                                                <div key={attachment.id} className="attachment-item">
                                                    {attachment.mime_type.startsWith('image/') ? (
                                                        <img
                                                            src={`/storage/${attachment.path}`}
                                                            alt={attachment.original_name}
                                                            className="img-fluid rounded mb-2"
                                                            style={{ maxHeight: '200px' }}
                                                        />
                                                    ) : (
                                                        <a
                                                            href={`/storage/${attachment.path}`}
                                                            download={attachment.original_name}
                                                            className={`btn btn-sm ${isOwnMessage ? 'btn-light' : 'btn-outline-primary'}`}
                                                        >
                                                            <i className="ri ri-attachment-line me-1"></i>
                                                            {attachment.original_name}
                                                        </a>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className={`message-time mt-1 ${isOwnMessage ? 'text-white-50' : 'text-muted'}`}>
                                        <small>
                                            {formatTime(message.created_at)}
                                            {message.is_edited && ' (düzenlendi)'}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default MessageList;
