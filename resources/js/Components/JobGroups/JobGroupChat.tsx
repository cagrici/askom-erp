import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Button, InputGroup, Spinner, Alert, Badge } from 'react-bootstrap';
import axios from 'axios';
import { Send, Paperclip, User, Calendar, ArrowLeft, Users, Settings, Search } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Message {
    id: number;
    content: string;
    type: 'text' | 'file' | 'audio';
    created_at: string;
    user: {
        id: number;
        name: string;
        last_name: string;
    };
    attachments: Array<{
        id: number;
        filename: string;
        original_name: string;
        mime_type: string;
        size: number;
        url: string;
    }>;
}

interface JobGroup {
    id: number;
    name: string;
    description: string | null;
    members_count: number;
}

interface JobGroupChatProps {
    group: JobGroup | null;
    currentUserId: number;
    onBack: () => void;
}

export default function JobGroupChat({ group, currentUserId, onBack }: JobGroupChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [messageText, setMessageText] = useState('');
    const [error, setError] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pollingInterval = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (group) {
            fetchMessages();
            startPolling();
        }

        return () => {
            if (pollingInterval.current) {
                clearInterval(pollingInterval.current);
            }
        };
    }, [group]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const startPolling = () => {
        pollingInterval.current = setInterval(() => {
            fetchNewMessages();
        }, 3000); // Poll every 3 seconds
    };

    const fetchMessages = async () => {
        if (!group) return;
        setLoading(true);
        try {
            const response = await axios.get(`/job-groups/${group.id}/messages`);
            setMessages(response.data.data);
        } catch (error) {
            console.error('Error fetching messages:', error);
            setError('Mesajlar yüklenirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const fetchNewMessages = async () => {
        if (!group || messages.length === 0) {
            return;
        }
        try {
            const lastMessageId = messages[messages.length - 1]?.id;
            if (!lastMessageId) return;
            
            const response = await axios.get(`/job-groups/${group.id}/messages`, {
                params: { after_id: lastMessageId }
            });
            
            const newMessages = response.data.data || [];
            
            if (newMessages.length > 0) {
                setMessages(prev => {
                    const existingIds = prev.map(msg => msg.id);
                    // Sadece henüz yoksa ekle (duplicate prevention)
                    const uniqueNewMessages = newMessages.filter(msg => !existingIds.includes(msg.id));
                    return [...prev, ...uniqueNewMessages];
                });
            }
        } catch (error) {
            console.error('Error fetching new messages:', error);
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageText.trim() || !group) return;

        setSending(true);
        setError('');

        try {
            const response = await axios.post(`/job-groups/${group.id}/messages`, {
                content: messageText,
                type: 'text'
            });
            
            // Mesajı hemen ekle (mesaj gönderen için)
            const newMessage = {
                id: Date.now(), // Temporary ID
                content: messageText,
                type: 'text',
                created_at: new Date().toISOString(),
                user: {
                    id: currentUserId,
                    name: 'Sen', // Göndereğin mesajı için
                    last_name: ''
                },
                attachments: []
            };
            setMessages(prev => [...prev, newMessage]);
            setMessageText('');
            
            // fetchNewMessages'ı çağırmayalım - polling zaten çalışıyor
        } catch (error: any) {
            setError(error.response?.data?.message || 'Mesaj gönderilemedi.');
        } finally {
            setSending(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !group) return;

        const formData = new FormData();
        formData.append('type', 'file');
        formData.append('content', 'Dosya');

        for (let i = 0; i < files.length; i++) {
            formData.append('attachments[]', files[i]);
        }

        setSending(true);
        setError('');

        try {
            await axios.post(`/job-groups/${group.id}/messages`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            // Dosya yükleme sonrası mesajları yenile (attachments için)
            setTimeout(() => {
                fetchMessages(); // Tam refresh gerekli dosya attachments için
            }, 1000);
        } catch (error: any) {
            setError(error.response?.data?.message || 'Dosya yüklenemedi.');
        } finally {
            setSending(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const formatMessageDate = (date: string) => {
        return format(new Date(date), 'dd MMM HH:mm', { locale: tr });
    };

    if (!group) {
        return (
            <Card className="h-100">
                <Card.Body className="d-flex align-items-center justify-content-center">
                    <div className="text-center text-muted">
                        <Users size={64} className="mb-3" />
                        <p>Mesajlaşmak için bir grup seçin</p>
                    </div>
                </Card.Body>
            </Card>
        );
    }

    return (
        <Card className="h-100 d-flex flex-column">
            {/* Header */}
            <Card.Header className="d-flex align-items-center justify-content-between">
                <div>
                    <h5 className="mb-0">{group.name}</h5>
                    <small className="text-muted">{group.members_count} üye</small>
                </div>
                <div className="d-flex gap-2">
                    <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => {
                            // TODO: Arama modalını aç
                            console.log('JobGroup arama açılacak');
                        }}
                    >
                        <Search size={16} />
                    </Button>
                    <Button variant="outline-secondary" size="sm">
                        <Settings size={16} />
                    </Button>
                </div>
            </Card.Header>

            {/* Messages Area */}
            <Card.Body className="flex-grow-1" style={{ overflowY: 'auto' }}>
                {loading ? (
                    <div className="text-center py-4">
                        <Spinner animation="border" />
                    </div>
                ) : error ? (
                    <Alert variant="danger">{error}</Alert>
                ) : messages.length === 0 ? (
                    <div className="text-center text-muted py-4">
                        <p>Henüz mesaj yok. İlk mesajı gönderin!</p>
                    </div>
                ) : (
                    <div className="d-flex flex-column gap-3">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`d-flex ${message.user.id === currentUserId ? 'justify-content-end' : 'justify-content-start'}`}
                            >
                                <div
                                    className={`message-bubble p-3 rounded ${
                                        message.user.id === currentUserId
                                            ? 'bg-primary text-white'
                                            : 'bg-light'
                                    }`}
                                    style={{ maxWidth: '70%' }}
                                >
                                    <div className="d-flex align-items-center mb-1">
                                        <strong className="me-2">
                                            {message.user.name} {message.user.last_name}
                                        </strong>
                                        <small className={message.user.id === currentUserId ? 'text-white-50' : 'text-muted'}>
                                            {formatMessageDate(message.created_at)}
                                        </small>
                                    </div>
                                    <div>{message.content}</div>
                                    {message.attachments.length > 0 && (
                                        <div className="mt-2">
                                            {message.attachments.map((attachment) => (
                                                <a
                                                    key={attachment.id}
                                                    href={attachment.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`d-block ${
                                                        message.user.id === currentUserId
                                                            ? 'text-white'
                                                            : 'text-primary'
                                                    }`}
                                                >
                                                    <Paperclip size={14} className="me-1" />
                                                    {attachment.original_name}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </Card.Body>

            {/* Message Input */}
            <Card.Footer>
                <Form onSubmit={sendMessage}>
                    <InputGroup>
                        <Button
                            variant="outline-secondary"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={sending}
                        >
                            <Paperclip size={20} />
                        </Button>
                        <Form.Control
                            type="text"
                            placeholder="Mesajınızı yazın..."
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            disabled={sending}
                        />
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={!messageText.trim() || sending}
                        >
                            {sending ? (
                                <Spinner animation="border" size="sm" />
                            ) : (
                                <Send size={20} />
                            )}
                        </Button>
                    </InputGroup>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="d-none"
                        onChange={handleFileUpload}
                    />
                </Form>
            </Card.Footer>
        </Card>
    );
}
