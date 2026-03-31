import React, { useState, useRef, KeyboardEvent } from 'react';
import { Form, Button, InputGroup } from 'react-bootstrap';

interface MessageInputProps {
    onSendMessage: (content: string, attachments?: File[]) => void;
    disabled?: boolean;
    replyTo?: any;
    onCancelReply?: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
    onSendMessage,
    disabled = false,
    replyTo,
    onCancelReply,
}) => {
    const [message, setMessage] = useState('');
    const [attachments, setAttachments] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim() || attachments.length > 0) {
            onSendMessage(message, attachments);
            setMessage('');
            setAttachments([]);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachments(Array.from(e.target.files));
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    return (
        <div className="message-input-container border-top p-3">
            {replyTo && (
                <div className="reply-indicator bg-light p-2 rounded mb-2 d-flex justify-content-between align-items-center">
                    <div>
                        <small className="text-muted">
                            <i className="bi bi-reply me-1"></i>
                            Yanıtlanıyor: <strong>{replyTo.user.name}</strong>
                        </small>
                        <div className="text-truncate small">{replyTo.content}</div>
                    </div>
                    <Button
                        variant="link"
                        size="sm"
                        className="p-0 text-muted"
                        onClick={onCancelReply}
                    >
                        <i className="bi bi-x-lg"></i>
                    </Button>
                </div>
            )}

            {attachments.length > 0 && (
                <div className="attachments-preview mb-2">
                    {attachments.map((file, index) => (
                        <div key={index} className="d-inline-block me-2 mb-2">
                            <div className="attachment-preview bg-light p-2 rounded d-flex align-items-center">
                                <i className="ri ri-attachment-line me-1"></i>
                                <span className="small">{file.name}</span>
                                <Button
                                    variant="link"
                                    size="sm"
                                    className="p-0 ms-2 text-danger"
                                    onClick={() => removeAttachment(index)}
                                >
                                    <i className="bi bi-x"></i>
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Form onSubmit={handleSubmit}>
                <InputGroup>
                    <Button
                        variant="outline-secondary"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={disabled}
                    >
                        <i className="ri ri-attachment-line"></i>
                    </Button>
                    <Form.Control
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                    />
                    <Form.Control
                        as="textarea"
                        rows={1}
                        placeholder="Mesajınızı yazın..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={disabled}
                        style={{ resize: 'none' }}
                    />
                    <Button
                        variant="primary"
                        type="submit"
                        disabled={disabled || (!message.trim() && attachments.length === 0)}
                    >
                        <i className="ri send-plane-2-fill"></i>
                    </Button>
                </InputGroup>
            </Form>
        </div>
    );
};

export default MessageInput;
