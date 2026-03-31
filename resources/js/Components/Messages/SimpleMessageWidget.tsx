import React, { useState, useEffect, useRef } from 'react';
import { Card, ListGroup, Button, Modal, Form, Alert } from 'react-bootstrap';
import axios from 'axios';

const SimpleMessageWidget: React.FC = () => {
    const [showModal, setShowModal] = useState(false);
    const [groups, setGroups] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [selectedDepartments, setSelectedDepartments] = useState<number[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [groupName, setGroupName] = useState('');
    const [firstMessage, setFirstMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [messageText, setMessageText] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const [attachments, setAttachments] = useState<File[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string>('');
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
    const [recordingTime, setRecordingTime] = useState(0);
    const [playingAudio, setPlayingAudio] = useState<string | null>(null);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchFilters, setSearchFilters] = useState({
        dateFrom: '',
        dateTo: '',
        fileType: 'all',
        groupId: ''
    });
    const [isSearching, setIsSearching] = useState(false);
    const [editingMessage, setEditingMessage] = useState<any>(null);
    const [editText, setEditText] = useState('');
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [completionNote, setCompletionNote] = useState('');
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [selectedPriority, setSelectedPriority] = useState('medium');
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [filters, setFilters] = useState({
        status: '',
        priority: '',
        assignedTo: '',
        category: '',
        overdue: false,
        myTasks: false
    });
    const [filteredGroups, setFilteredGroups] = useState<any[]>([]);

    useEffect(() => {
        fetchGroups();
        fetchCategories();
        fetchUsers(); // Initial load
    }, []);

    useEffect(() => {
        if (showModal) {
            fetchUsers();
            fetchDepartments();
        }
    }, [showModal]);

    useEffect(() => {
        if (showAssignModal) {
            fetchUsers();
        }
    }, [showAssignModal]);

    useEffect(() => {
        if (activeGroupId) {
            fetchMessages(activeGroupId);
            startPolling();
        } else {
            stopPolling();
        }
        return () => stopPolling();
    }, [activeGroupId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRecording) {
            interval = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    useEffect(() => {
        applyFilters();
    }, [groups, filters]);

    const fetchGroups = async () => {
        try {
            const response = await axios.get('/api/messages/groups');
            const groupsData = response.data.groups || [];
            setGroups(groupsData);
            // İlk yüklemede filteredGroups'u da doldur
            if (filteredGroups.length === 0) {
                setFilteredGroups(groupsData);
            }
        } catch (error) {
            console.error('Failed to fetch groups:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await axios.get('/api/users');
            console.log('Users API success:', response.data.length);
            setUsers(response.data);
        } catch (error) {
            console.error('Users API failed:', error);
            
            // Fallback: Extract unique users from existing groups
            const uniqueUsers = new Map();
            groups.forEach(group => {
                if (group.assignedUser) {
                    uniqueUsers.set(group.assignedUser.id, group.assignedUser);
                }
            });
            
            // Also try to get users from page props if available
            if ((window as any).pageProps?.users) {
                console.log('Using page props users:', (window as any).pageProps.users.length);
                setUsers((window as any).pageProps.users);
            } else if (uniqueUsers.size > 0) {
                console.log('Using fallback from groups:', uniqueUsers.size);
                setUsers(Array.from(uniqueUsers.values()));
            } else {
                console.log('No users found anywhere');
            }
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await axios.get('/api/departments');
            setDepartments(response.data);
        } catch (error) {
            console.error('Failed to fetch departments:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await axios.get('/api/messages/categories');
            console.log('Categories fetched successfully:', response.data.length);
            setCategories(response.data);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const applyFilters = () => {
        let filtered = [...groups];
        const currentUserId = (window as any).auth?.user?.id;

        // Status filter
        if (filters.status) {
            filtered = filtered.filter(g => g.status === filters.status);
        }

        // Priority filter
        if (filters.priority) {
            filtered = filtered.filter(g => g.priority === filters.priority);
        }

        // Assigned to filter
        if (filters.assignedTo) {
            filtered = filtered.filter(g => g.assigned_to === parseInt(filters.assignedTo));
        }

        // Category filter
        if (filters.category) {
            filtered = filtered.filter(g => g.category?.id === parseInt(filters.category));
        }

        // Overdue filter
        if (filters.overdue) {
            filtered = filtered.filter(g => g.is_overdue);
        }

        // My tasks filter
        if (filters.myTasks && currentUserId) {
            filtered = filtered.filter(g => g.assigned_to === currentUserId);
        }

        setFilteredGroups(filtered);
    };

    const resetFilters = () => {
        setFilters({
            status: '',
            priority: '',
            assignedTo: '',
            category: '',
            overdue: false,
            myTasks: false
        });
    };

    const fetchMessages = async (groupId: number, silent: boolean = false) => {
        try {
            const response = await axios.get(`/api/messages/groups/${groupId}/messages`);
            const newMessages = response.data.data || [];

            if (silent) {
                // Polling için: yeni mesajları ekle ve mevcut mesajları güncelle
                setMessages(prevMessages => {
                    const existingIds = prevMessages.map(msg => msg.id);
                    const freshMessages = newMessages.filter((msg: any) => !existingIds.includes(msg.id));

                    // Mevcut mesajların status güncellemelerini kontrol et
                    const updatedMessages = prevMessages.map(prevMsg => {
                        const updatedMsg = newMessages.find((msg: any) => msg.id === prevMsg.id);
                        return updatedMsg ? { ...prevMsg, ...updatedMsg } : prevMsg;
                    });

                    if (freshMessages.length > 0) {
                        return [...updatedMessages, ...freshMessages];
                    }
                    return updatedMessages;
                });
            } else {
                // Tüm mesajları yenile (ilk yükleme için)
                setMessages(newMessages);
            }
        } catch (error) {
            if (!silent) {
                console.error('Failed to fetch messages:', error);
            }
        }
    };

    const startPolling = () => {
        stopPolling();
        intervalRef.current = setInterval(() => {
            if (activeGroupId) {
                fetchMessages(activeGroupId, true);
            }
        }, 3000); // Her 3 saniyede bir kontrol et
    };

    const stopPolling = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleGroupSelect = (groupId: number) => {
        setActiveGroupId(groupId);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if ((!messageText.trim() && attachments.length === 0) || !activeGroupId) return;

        setSendingMessage(true);

        try {
            const formData = new FormData();
            formData.append('message_group_id', activeGroupId.toString());
            formData.append('content', messageText);

            attachments.forEach((file, index) => {
                formData.append(`attachments[${index}]`, file);
            });

            const response = await axios.post('/api/messages', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            // Mesajı önce "sending" durumu ile ekle
            const tempMessage = {
                ...response.data,
                status: 'sending'
            };
            setMessages([...messages, tempMessage]);

            // Kısa bir gecikme sonrası "sent" olarak güncelle
            setTimeout(() => {
                setMessages(prevMessages =>
                    prevMessages.map(msg =>
                        msg.id === response.data.id
                            ? { ...msg, status: 'sent' }
                            : msg
                    )
                );
            }, 500);
            setMessageText('');
            setAttachments([]);

            // Update latest message in groups
            const updatedGroups = groups.map(g => {
                if (g.id === activeGroupId) {
                    return { ...g, latest_message: response.data };
                }
                return g;
            });
            setGroups(updatedGroups);
        } catch (error: any) {
            console.error('Failed to send message:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            setError(error.response?.data?.message || 'Mesaj gönderilemedi');
        } finally {
            setSendingMessage(false);
        }
    };

    const resizeAndCompressImage = async (file: File): Promise<File> => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // Calculate new dimensions
                const maxWidth = 1000;
                let { width, height } = img;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                // Draw and compress
                ctx?.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            });
                            resolve(compressedFile);
                        } else {
                            resolve(file);
                        }
                    },
                    'image/jpeg',
                    0.8 // 80% quality
                );
            };

            img.src = URL.createObjectURL(file);
        });
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const processedFiles: File[] = [];

            for (const file of files) {
                if (file.type.startsWith('image/')) {
                    // Resize and compress images
                    const processedFile = await resizeAndCompressImage(file);
                    processedFiles.push(processedFile);
                } else {
                    // Keep non-image files as is
                    processedFiles.push(file);
                }
            }

            setAttachments([...attachments, ...processedFiles]);
        }

        // Reset input value to allow selecting the same file again
        e.target.value = '';
    };

    const removeAttachment = (index: number) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const handleImageClick = (imageUrl: string) => {
        setSelectedImage(imageUrl);
        setShowImageModal(true);
    };

    const handleCloseImageModal = () => {
        setShowImageModal(false);
        setSelectedImage('');
    };

    const getMessageStatusIcon = (message: any) => {
        // Sadece kendi mesajlarında durum göster
        if (message.user_id !== (window as any).auth?.user?.id) {
            return null;
        }

        switch (message.status) {
            case 'sending':
                return <i className="ri ri-time-line text-muted ms-1" title="Gönderiliyor..."></i>;
            case 'sent':
                return <i className="ri ri-check-line text-muted ms-1" title="Gönderildi"></i>;
            case 'delivered':
                return <i className="ri ri-check-double-line text-muted ms-1" title="İletildi"></i>;
            case 'read':
                return <i className="ri ri-check-double-line text-primary ms-1" title="Okundu"></i>;
            default:
                return <i className="ri ri-check-line text-muted ms-1" title="Gönderildi"></i>;
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    setAudioChunks(prev => [...prev, event.data]);
                }
            };

            recorder.onstop = () => {
                stream.getTracks().forEach(track => track.stop());
            };

            setMediaRecorder(recorder);
            setAudioChunks([]);
            setRecordingTime(0);
            setIsRecording(true);
            recorder.start();
        } catch (error) {
            console.error('Mikrofon erişimi başarısız:', error);
            alert('Mikrofon erişimi için izin gereklidir.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            setIsRecording(false);
        }
    };

    const sendAudioMessage = async () => {
        if (audioChunks.length === 0) return;

        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `audio_${Date.now()}.webm`, { type: 'audio/webm' });

        if (!activeGroupId) return;

        setSendingMessage(true);

        try {
            const formData = new FormData();
            formData.append('message_group_id', activeGroupId.toString());
            formData.append('attachments[0]', audioFile);
            formData.append('is_audio', '1');
            formData.append('audio_duration', recordingTime.toString());

            const response = await axios.post('/api/messages', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const tempMessage = {
                ...response.data,
                status: 'sending'
            };
            setMessages([...messages, tempMessage]);

            setTimeout(() => {
                setMessages(prevMessages =>
                    prevMessages.map(msg =>
                        msg.id === response.data.id
                            ? { ...msg, status: 'sent' }
                            : msg
                    )
                );
            }, 500);

            // Reset audio recording state
            setAudioChunks([]);
            setRecordingTime(0);
            setMediaRecorder(null);

            // Update latest message in groups
            const updatedGroups = groups.map(g => {
                if (g.id === activeGroupId) {
                    return { ...g, latest_message: response.data };
                }
                return g;
            });
            setGroups(updatedGroups);
        } catch (error: any) {
            console.error('Sesli mesaj gönderilemedi:', error);
            setError(error.response?.data?.message || 'Sesli mesaj gönderilemedi');
        } finally {
            setSendingMessage(false);
        }
    };

    const cancelRecording = () => {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
        }
        setIsRecording(false);
        setAudioChunks([]);
        setRecordingTime(0);
        setMediaRecorder(null);
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    const playAudio = (audioUrl: string, audioId: string) => {
        if (playingAudio === audioId) {
            setPlayingAudio(null);
            const audio = document.getElementById(`audio-${audioId}`) as HTMLAudioElement;
            if (audio) audio.pause();
        } else {
            setPlayingAudio(audioId);
            const audio = document.getElementById(`audio-${audioId}`) as HTMLAudioElement;
            if (audio) {
                audio.play();
                audio.onended = () => setPlayingAudio(null);
            }
        }
    };

    const performSearch = async () => {
        if (!searchQuery.trim() && !searchFilters.dateFrom && !searchFilters.dateTo && searchFilters.fileType === 'all') {
            setError('Lütfen en az bir arama kriteri girin');
            return;
        }

        setIsSearching(true);
        setError('');

        try {
            const params = new URLSearchParams();
            if (searchQuery.trim()) params.append('query', searchQuery.trim());
            if (searchFilters.dateFrom) params.append('date_from', searchFilters.dateFrom);
            if (searchFilters.dateTo) params.append('date_to', searchFilters.dateTo);
            if (searchFilters.fileType !== 'all') params.append('file_type', searchFilters.fileType);
            if (searchFilters.groupId) params.append('group_id', searchFilters.groupId);

            const response = await axios.get(`/api/messages/search?${params.toString()}`);
            setSearchResults(response.data.messages || []);
        } catch (error: any) {
            console.error('Arama hatası:', error);
            setError(error.response?.data?.message || 'Arama sırasında bir hata oluştu');
        } finally {
            setIsSearching(false);
        }
    };

    const clearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
        setSearchFilters({
            dateFrom: '',
            dateTo: '',
            fileType: 'all',
            groupId: ''
        });
    };

    const handleSearchModalClose = () => {
        setShowSearchModal(false);
        clearSearch();
    };

    const handleEditMessage = (message: any) => {
        setEditingMessage(message);
        setEditText(message.content);
    };

    const handleCancelEdit = () => {
        setEditingMessage(null);
        setEditText('');
    };

    const handleSaveEdit = async () => {
        if (!editText.trim()) {
            setError('Mesaj içeriği boş olamaz.');
            return;
        }

        try {
            await axios.put(`/api/messages/${editingMessage.id}`, {
                content: editText.trim()
            });

            // Refresh messages
            fetchMessages(activeGroupId);
            handleCancelEdit();
        } catch (error: any) {
            setError('Mesaj düzenlenemedi: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDeleteMessage = async (messageId: number) => {
        if (!confirm('Bu mesajı silmek istediğinizden emin misiniz?')) {
            return;
        }

        try {
            await axios.delete(`/api/messages/${messageId}`);

            // Refresh messages
            fetchMessages(activeGroupId);
        } catch (error: any) {
            setError('Mesaj silinemedi: ' + (error.response?.data?.message || error.message));
        }
    };

    const canEditMessage = (message: any) => {
        const currentUser = (window as any).auth?.user;
        if (!currentUser || message.user_id !== currentUser.id) return false;

        const messageDate = new Date(message.created_at);
        const now = new Date();
        const hoursDiff = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60));

        return hoursDiff < 24;
    };

    const canDeleteMessage = (message: any) => {
        const currentUser = (window as any).auth?.user;
        if (!currentUser) return false;

        return message.user_id === currentUser.id || currentUser.is_admin;
    };

    const handleButtonClick = () => {
        setShowModal(true);
    };

    const handleStatusChange = () => {
        const currentGroup = groups.find(g => g.id === activeGroupId);
        if (currentGroup) {
            setSelectedStatus(currentGroup.status);
            setCompletionNote('');
            setShowStatusModal(true);
        }
    };

    const handleAssign = () => {
        const currentGroup = groups.find(g => g.id === activeGroupId);
        if (currentGroup) {
            setSelectedUserId(currentGroup.assigned_to);
            setShowAssignModal(true);
        }
    };

    const submitStatusChange = async () => {
        if (!activeGroupId || !selectedStatus) return;

        try {
            const data: any = { status: selectedStatus };
            if (selectedStatus === 'completed' && completionNote) {
                data.completion_note = completionNote;
            }

            await axios.put(`/api/messages/groups/${activeGroupId}/status`, data);
            
            // Refresh groups
            fetchGroups();
            setShowStatusModal(false);
            setCompletionNote('');
        } catch (error: any) {
            setError('Durum güncellenemedi: ' + (error.response?.data?.message || error.message));
        }
    };

    const submitAssign = async () => {
        if (!activeGroupId || !selectedUserId) return;

        try {
            await axios.put(`/api/messages/groups/${activeGroupId}/assign`, {
                assigned_to: selectedUserId
            });
            
            // Refresh groups
            fetchGroups();
            setShowAssignModal(false);
        } catch (error: any) {
            setError('Atama yapılamadı: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedUsers([]);
        setSelectedDepartments([]);
        setGroupName('');
        setFirstMessage('');
        setError('');
        setSuccess('');
        setSelectedCategory(null);
        setSelectedPriority('medium');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!groupName.trim()) {
            setError('Lütfen grup adı girin.');
            return;
        }

        if (selectedUsers.length === 0 && selectedDepartments.length === 0) {
            setError('Lütfen en az bir kişi veya departman seçin.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Grup oluştur
            const response = await axios.post('/api/messages/groups', {
                name: groupName.trim(),
                type: 'private',
                participant_ids: selectedUsers,
                department_ids: selectedDepartments,
                category_id: selectedCategory,
                priority: selectedPriority,
            });

            const newGroup = response.data;

            // İlk mesajı gönder (eğer varsa)
            if (firstMessage.trim()) {
                try {
                    await axios.post('/api/messages', {
                        message_group_id: newGroup.id,
                        content: firstMessage.trim(),
                    });
                } catch (messageError) {
                    console.error('İlk mesaj gönderilemedi:', messageError);
                    // Grup oluşturuldu ama mesaj gönderilemedi - grup silmeyelim
                }
            }

            setSuccess('Grup başarıyla oluşturuldu!');
            setTimeout(() => {
                handleCloseModal();
                fetchGroups();
                // Yeni oluşturulan grubu aktif yap
                setActiveGroupId(newGroup.id);
            }, 1000);
        } catch (error: any) {
            setError(error.response?.data?.message || 'Bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Card className="message-widget-compact mb-4">
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                        <i className="ri ri-chat-3-line me-2"></i>Mesajlar
                    </h5>
                    <div>
                        <Button
                            variant="link"
                            size="sm"
                            onClick={() => setShowFilterPanel(!showFilterPanel)}
                            className={`p-0 me-2 ${showFilterPanel ? 'text-primary' : ''}`}
                            title="Filtrele"
                        >
                            <i className="ri ri-filter-line fs-5"></i>
                            {Object.values(filters).some(v => v) && (
                                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem' }}>
                                    •
                                </span>
                            )}
                        </Button>
                        <Button
                            variant="link"
                            size="sm"
                            onClick={() => setShowSearchModal(true)}
                            className="p-0 me-2"
                            title="Mesajlarda Ara"
                        >
                            <i className="ri ri-search-line fs-5"></i>
                        </Button>
                        <Button
                            variant="link"
                            size="sm"
                            onClick={handleButtonClick}
                            className="p-0"
                            title="Yeni Sohbet"
                        >
                            <i className="ri ri-add-circle-line fs-5"></i>
                        </Button>
                    </div>
                </Card.Header>
                
                {/* Hızlı Filtreler */}
                <div className="border-bottom px-3 py-2 bg-white">
                    <div className="d-flex flex-wrap gap-1">
                        <Button 
                            variant={filters.myTasks ? "primary" : "outline-primary"} 
                            size="sm"
                            onClick={() => setFilters({...filters, myTasks: !filters.myTasks})}
                        >
                            <i className="ri ri-user-line me-1"></i>
                            Benim İşlerim
                        </Button>
                        <Button 
                            variant={filters.status === 'open' ? "warning" : "outline-warning"} 
                            size="sm"
                            onClick={() => setFilters({...filters, status: filters.status === 'open' ? '' : 'open'})}
                        >
                            <i className="ri ri-time-line me-1"></i>
                            Açık İşler
                        </Button>
                        <Button 
                            variant={filters.overdue ? "danger" : "outline-danger"} 
                            size="sm"
                            onClick={() => setFilters({...filters, overdue: !filters.overdue})}
                        >
                            <i className="ri ri-alarm-warning-line me-1"></i>
                            Gecikmiş
                        </Button>
                        <Button 
                            variant={filters.priority === 'urgent' ? "danger" : "outline-secondary"} 
                            size="sm"
                            onClick={() => setFilters({...filters, priority: filters.priority === 'urgent' ? '' : 'urgent'})}
                        >
                            🔥 Acil
                        </Button>
                        <Button 
                            variant={filters.status === 'completed' ? "success" : "outline-success"} 
                            size="sm"
                            onClick={() => setFilters({...filters, status: filters.status === 'completed' ? '' : 'completed'})}
                        >
                            <i className="ri ri-check-line me-1"></i>
                            Tamamlanan
                        </Button>
                    </div>
                </div>

                {/* Filtreleme Paneli */}
                {showFilterPanel && (
                    <Card.Body className="border-bottom bg-light py-2">
                        <div className="row g-2">
                            <div className="col-md-4">
                                <Form.Select 
                                    size="sm" 
                                    value={filters.status}
                                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                                >
                                    <option value="">Tüm Durumlar</option>
                                    <option value="open">Açık</option>
                                    <option value="in_progress">Devam Ediyor</option>
                                    <option value="completed">Tamamlandı</option>
                                    <option value="cancelled">İptal</option>
                                </Form.Select>
                            </div>
                            <div className="col-md-4">
                                <Form.Select 
                                    size="sm"
                                    value={filters.priority}
                                    onChange={(e) => setFilters({...filters, priority: e.target.value})}
                                >
                                    <option value="">Tüm Öncelikler</option>
                                    <option value="urgent">🔥 Acil</option>
                                    <option value="high">⚡ Yüksek</option>
                                    <option value="medium">➖ Orta</option>
                                    <option value="low">🔻 Düşük</option>
                                </Form.Select>
                            </div>
                            <div className="col-md-4">
                                <Form.Select 
                                    size="sm"
                                    value={filters.category}
                                    onChange={(e) => setFilters({...filters, category: e.target.value})}
                                >
                                    <option value="">Tüm Kategoriler</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </div>
                            <div className="col-md-4">
                                <Form.Select 
                                    size="sm"
                                    value={filters.assignedTo}
                                    onChange={(e) => setFilters({...filters, assignedTo: e.target.value})}
                                >
                                    <option value="">Tüm Kullanıcılar</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>
                                            {user.name || `${user.first_name} ${user.last_name}`.trim()}
                                        </option>
                                    ))}
                                </Form.Select>
                            </div>
                            <div className="col-md-4 d-flex align-items-center">
                                <Form.Check
                                    type="checkbox"
                                    id="myTasks"
                                    label="Bana Atananlar"
                                    checked={filters.myTasks}
                                    onChange={(e) => setFilters({...filters, myTasks: e.target.checked})}
                                    className="me-3"
                                />
                                <Form.Check
                                    type="checkbox"
                                    id="overdue"
                                    label="Gecikmiş"
                                    checked={filters.overdue}
                                    onChange={(e) => setFilters({...filters, overdue: e.target.checked})}
                                />
                            </div>
                            <div className="col-md-4 text-end">
                                <Button 
                                    variant="link" 
                                    size="sm" 
                                    onClick={resetFilters}
                                    className="text-decoration-none"
                                >
                                    <i className="ri ri-refresh-line me-1"></i>
                                    Temizle
                                </Button>
                            </div>
                        </div>
                        {filteredGroups.length !== groups.length && (
                            <div className="text-muted small mt-2">
                                {filteredGroups.length} / {groups.length} sonuç gösteriliyor
                            </div>
                        )}
                    </Card.Body>
                )}
                
                <ListGroup variant="flush" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {filteredGroups.length === 0 ? (
                        <ListGroup.Item className="text-center text-muted py-4">
                            <i className="ri ri-chat-3-line fs-1 mb-3 d-block"></i>
                            <p className="mb-3">Henüz mesaj grubunuz yok</p>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleButtonClick}
                            >
                                <i className="ri ri-add-circle-line me-2"></i>
                                İlk Mesajınızı Gönderin
                            </Button>
                        </ListGroup.Item>
                    ) : (
                        filteredGroups.map((group) => (
                            <ListGroup.Item
                                key={group.id}
                                className={`d-flex justify-content-between align-items-start ${activeGroupId === group.id ? 'active' : ''}`}
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleGroupSelect(group.id)}
                            >
                                <div className="ms-2 me-auto flex-grow-1">
                                    <div className="d-flex align-items-center mb-1">
                                        <div className="fw-bold text-dark me-2">
                                            {group.name}
                                        </div>
                                        {/* Status Badge */}
                                        <span className={`badge bg-${group.status_color || 'secondary'} me-1`} style={{ fontSize: '0.7rem' }}>
                                            {group.status === 'open' && 'Açık'}
                                            {group.status === 'in_progress' && 'Devam Ediyor'}
                                            {group.status === 'completed' && 'Tamamlandı'}
                                            {group.status === 'cancelled' && 'İptal'}
                                        </span>
                                        {/* Priority Badge */}
                                        <span className={`badge bg-${group.priority_color || 'secondary'} me-1`} style={{ fontSize: '0.7rem' }}>
                                            {group.priority === 'urgent' && '🔥 Acil'}
                                            {group.priority === 'high' && '⚡ Yüksek'}
                                            {group.priority === 'medium' && '➖ Orta'}
                                            {group.priority === 'low' && '🔻 Düşük'}
                                        </span>
                                        {/* Unread Count */}
                                        {group.unread_count > 0 && (
                                            <span className="badge bg-danger">
                                                {group.unread_count}
                                            </span>
                                        )}
                                    </div>
                                    
                                    {/* Assigned User & Due Date */}
                                    <div className="d-flex align-items-center text-muted small mb-1">
                                        {group.assigned_user && (
                                            <span className="me-2">
                                                <i className="ri ri-user-line me-1"></i>
                                                {group.assigned_user.name}
                                            </span>
                                        )}
                                        {group.due_date && (
                                            <span className={group.is_overdue ? 'text-danger' : ''}>
                                                <i className="ri ri-calendar-line me-1"></i>
                                                {new Date(group.due_date).toLocaleDateString('tr-TR')}
                                                {group.is_overdue && ' (Gecikmiş)'}
                                            </span>
                                        )}
                                    </div>
                                    
                                    {/* Latest Message */}
                                    {group.latest_message && (
                                        <small className="text-muted text-truncate d-block" style={{ maxWidth: '250px' }}>
                                            <strong>{group.latest_message.user.name}:</strong> {group.latest_message.content}
                                        </small>
                                    )}
                                </div>
                                
                                {/* Category Icon */}
                                <div className="text-end">
                                    {group.category && (
                                        <div className="mb-1">
                                            <i className={`${group.category.icon} text-muted`} title={group.category.name}></i>
                                        </div>
                                    )}
                                    <small className="text-muted">
                                        {group.type === 'department' && <i className="ri ri-building-line"></i>}
                                        {group.type === 'private' && <i className="ri ri-group-line"></i>}
                                        {group.type === 'project' && <i className="ri ri-briefcase-line"></i>}
                                    </small>
                                </div>
                            </ListGroup.Item>
                        ))
                    )}
                </ListGroup>

                {/* Mesaj Alanı */}
                {activeGroupId && (
                    <>
                        {/* Grup Başlığı ve Kontrolleri */}
                        <div className="border-top p-2 bg-light d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center">
                                <h6 className="mb-0 me-3">{groups.find(g => g.id === activeGroupId)?.name}</h6>
                                {/* Status Badge */}
                                <span className={`badge bg-${groups.find(g => g.id === activeGroupId)?.status_color || 'secondary'} me-2`}>
                                    {groups.find(g => g.id === activeGroupId)?.status === 'open' && 'Açık'}
                                    {groups.find(g => g.id === activeGroupId)?.status === 'in_progress' && 'Devam Ediyor'}
                                    {groups.find(g => g.id === activeGroupId)?.status === 'completed' && 'Tamamlandı'}
                                    {groups.find(g => g.id === activeGroupId)?.status === 'cancelled' && 'İptal'}
                                </span>
                                {/* Priority Badge */}
                                <span className={`badge bg-${groups.find(g => g.id === activeGroupId)?.priority_color || 'secondary'}`}>
                                    {groups.find(g => g.id === activeGroupId)?.priority === 'urgent' && '🔥 Acil'}
                                    {groups.find(g => g.id === activeGroupId)?.priority === 'high' && '⚡ Yüksek'}
                                    {groups.find(g => g.id === activeGroupId)?.priority === 'medium' && '➖ Orta'}
                                    {groups.find(g => g.id === activeGroupId)?.priority === 'low' && '🔻 Düşük'}
                                </span>
                            </div>
                            <div className="d-flex align-items-center">
                                {/* Assigned User */}
                                {groups.find(g => g.id === activeGroupId)?.assigned_user && (
                                    <span className="text-muted small me-3">
                                        <i className="ri ri-user-line me-1"></i>
                                        {groups.find(g => g.id === activeGroupId)?.assigned_user.name}
                                    </span>
                                )}
                                {/* Due Date */}
                                {groups.find(g => g.id === activeGroupId)?.due_date && (
                                    <span className={`small me-3 ${groups.find(g => g.id === activeGroupId)?.is_overdue ? 'text-danger' : 'text-muted'}`}>
                                        <i className="ri ri-calendar-line me-1"></i>
                                        {new Date(groups.find(g => g.id === activeGroupId)?.due_date).toLocaleDateString('tr-TR')}
                                    </span>
                                )}
                                {/* Action Buttons */}
                                <Button variant="outline-secondary" size="sm" className="me-1" onClick={() => handleStatusChange()}>
                                    <i className="ri ri-refresh-line me-1"></i>
                                    Durum
                                </Button>
                                <Button variant="outline-secondary" size="sm" onClick={() => handleAssign()}>
                                    <i className="ri ri-user-add-line me-1"></i>
                                    Ata
                                </Button>
                            </div>
                        </div>
                        
                        <div className="border-top p-3" style={{ backgroundColor: '#f8f9fa', maxHeight: '300px', overflowY: 'auto' }}>
                            {messages.length === 0 ? (
                                <p className="text-center text-muted">Henüz mesaj yok. İlk mesajı gönderin!</p>
                            ) : (
                                <div>
                                    {messages.map((message) => (
                                        <div key={message.id} className="mb-3">
                                            <div className={`d-flex ${message.user_id === (window as any).auth?.user?.id ? 'justify-content-end' : 'justify-content-start'}`}>
                                                {/* Avatar - sol tarafta göster (diğer kullanıcılar için) */}
                                                {message.user_id !== (window as any).auth?.user?.id && (
                                                    <div className="me-2 flex-shrink-0">
                                                        <img
                                                            src={message.user.avatar ? `/storage/${message.user.avatar}` : '/images/default-avatar.png'}
                                                            alt={message.user.name}
                                                            className="rounded-circle"
                                                            style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = '/images/default-avatar.png';
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                                
                                                <div className={`d-inline-block`} style={{ maxWidth: '70%' }}>
                                                    <div className={`p-2 rounded ${message.user_id === (window as any).auth?.user?.id ? 'bg-primary text-white' : 'bg-light'}`}>
                                                        <div className="d-flex justify-content-between align-items-start">
                                                            <strong className="small">{message.user.name}</strong>
                                                            {(canEditMessage(message) || canDeleteMessage(message)) && (
                                                            <div className="position-relative">
                                                                <Button
                                                                    variant="link"
                                                                    size="sm"
                                                                    className={`p-1 ${message.user_id === (window as any).auth?.user?.id ? 'text-white' : 'text-dark'}`}
                                                                    onClick={() => {
                                                                        const dropdown = document.getElementById(`dropdown-${message.id}`);
                                                                        if (dropdown) {
                                                                            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
                                                                        }
                                                                    }}
                                                                >
                                                               <i className="ri ri-more-2-fill fs-6"></i>
                                                                </Button>
                                                                <div
                                                                    id={`dropdown-${message.id}`}
                                                                    className="position-absolute bg-white border rounded shadow-sm"
                                                                    style={{
                                                                        display: 'none',
                                                                        right: '0px',
                                                                        top: '25px',
                                                                        minWidth: '120px',
                                                                        zIndex: 1000
                                                                    }}
                                                                >
                                                                    {canEditMessage(message) && (
                                                                        <button
                                                                            className="btn btn-link text-start w-100 text-decoration-none text-dark p-2 border-0"
                                                                            onClick={() => {
                                                                                handleEditMessage(message);
                                                                                document.getElementById(`dropdown-${message.id}`)!.style.display = 'none';
                                                                            }}
                                                                        >
                                                                            <i className="ri ri-edit-line me-2"></i>
                                                                            Düzenle
                                                                        </button>
                                                                    )}
                                                                    {canDeleteMessage(message) && (
                                                                        <button
                                                                            className="btn btn-link text-start w-100 text-decoration-none text-danger p-2 border-0"
                                                                            onClick={() => {
                                                                                handleDeleteMessage(message.id);
                                                                                document.getElementById(`dropdown-${message.id}`)!.style.display = 'none';
                                                                            }}
                                                                        >
                                                                            <i className="ri ri-delete-bin-line me-2"></i>
                                                                            Sil
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                        </div>
                                                    {editingMessage?.id === message.id ? (
                                                        <div className="mt-2">
                                                            <Form.Control
                                                                as="textarea"
                                                                rows={2}
                                                                value={editText}
                                                                onChange={(e) => setEditText(e.target.value)}
                                                                className="mb-2"
                                                            />
                                                            <div className="d-flex gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="success"
                                                                    onClick={handleSaveEdit}
                                                                >
                                                                    <i className="ri ri-check-line me-1"></i>
                                                                    Kaydet
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="secondary"
                                                                    onClick={handleCancelEdit}
                                                                >
                                                                    <i className="ri ri-close-line me-1"></i>
                                                                    İptal
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {message.content && (
                                                                <div className="mb-1">
                                                                    {message.content}
                                                                    {message.is_edited && (
                                                                        <small className={`ms-2 ${message.user_id === (window as any).auth?.user?.id ? 'text-white-50' : 'text-muted'}`}>
                                                                            (düzenlendi)
                                                                        </small>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </>
                                                    )}

                                                    {/* Dosya Ekleri */}
                                                    {message.attachments && message.attachments.length > 0 && (
                                                        <div className="attachments mt-2">
                                                            {(() => {
                                                                const images = message.attachments.filter((att: any) => att.mime_type.startsWith('image/'));
                                                                const otherFiles = message.attachments.filter((att: any) => !att.mime_type.startsWith('image/'));

                                                                return (
                                                                    <>
                                                                        {/* Resim Galerisi */}
                                                                        {images.length > 0 && (
                                                                            <div className={`image-gallery mb-2 ${images.length === 1 ? '' : 'row g-2'}`}>
                                                                                {images.map((attachment: any, index: number) => (
                                                                                    <div
                                                                                        key={attachment.id}
                                                                                        className={images.length === 1 ? '' :
                                                                                            images.length === 2 ? 'col-6' :
                                                                                            images.length === 3 && index === 0 ? 'col-12' :
                                                                                            images.length === 3 ? 'col-6' :
                                                                                            'col-6'}
                                                                                    >
                                                                                        <div className="position-relative">
                                                                                            <img
                                                                                                src={attachment.url}
                                                                                                alt={attachment.original_name}
                                                                                                className="img-fluid rounded cursor-pointer"
                                                                                                style={{
                                                                                                    width: '100%',
                                                                                                    height: images.length === 1 ? 'auto' : '120px',
                                                                                                    maxHeight: images.length === 1 ? '300px' : '120px',
                                                                                                    objectFit: 'cover',
                                                                                                    cursor: 'pointer'
                                                                                                }}
                                                                                                onClick={() => handleImageClick(attachment.url)}
                                                                                                onError={(e) => {
                                                                                                    console.error('Image load error:', attachment);
                                                                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                                                                }}
                                                                                            />
                                                                                            {images.length > 4 && index === 3 && (
                                                                                                <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-75 rounded text-white">
                                                                                                    <span className="fw-bold">+{images.length - 4}</span>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}

                                                                        {/* Diğer dosyalar */}
                                                                        {otherFiles.map((attachment: any) => (
                                                                            <div key={attachment.id} className="attachment-item mb-1">
                                                                                {(message.type === 'audio' || attachment.mime_type.startsWith('audio/') || attachment.original_name?.includes('audio_') || attachment.original_name?.endsWith('.webm')) ? (
                                                                        <div className={`audio-message p-2 rounded d-flex align-items-center ${message.user_id === (window as any).auth?.user?.id ? 'bg-primary-subtle' : 'bg-light'}`} style={{ minWidth: '200px' }}>
                                                                            <Button
                                                                                variant="link"
                                                                                className="p-0 me-2"
                                                                                onClick={() => playAudio(attachment.url, attachment.id)}
                                                                                disabled={sendingMessage}
                                                                            >
                                                                                <i className={`ri ${playingAudio === attachment.id ? 'ri-pause-circle-fill' : 'ri-play-circle-fill'} fs-4 ${message.user_id === (window as any).auth?.user?.id ? 'text-primary' : 'text-dark'}`}></i>
                                                                            </Button>
                                                                            <div className="flex-grow-1">
                                                                                <div className={`audio-waveform ${message.user_id === (window as any).auth?.user?.id ? 'text-primary' : 'text-dark'}`}>
                                                                                    <i className="ri ri-sound-module-line me-1"></i>
                                                                                    Sesli mesaj
                                                                                </div>
                                                                                <small className={`${message.user_id === (window as any).auth?.user?.id ? 'text-primary-emphasis' : 'text-muted'}`}>
                                                                                    {attachment.duration ? formatTime(attachment.duration) : '0:00'}
                                                                                </small>
                                                                            </div>
                                                                            <audio
                                                                                id={`audio-${attachment.id}`}
                                                                                src={attachment.url}
                                                                                style={{ display: 'none' }}
                                                                            />
                                                                        </div>
                                                                    ) : (
                                                                        <a
                                                                            href={attachment.url}
                                                                            download={attachment.original_name}
                                                                            className={`btn btn-sm ${message.user_id === (window as any).auth?.user?.id ? 'btn-light' : 'btn-outline-primary'}`}
                                                                        >
                                                                            <i className="ri ri-attachment-line me-1"></i>
                                                                            {attachment.original_name}
                                                                        </a>
                                                                    )}
                                                                            </div>
                                                                        ))}
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                    )}

                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <small className={`${message.user_id === (window as any).auth?.user?.id ? 'text-white-50' : 'text-muted'}`}>
                                                            {new Date(message.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                        </small>
                                                        {getMessageStatusIcon(message)}
                                                    </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Kendi mesajımız için avatar - sağ tarafta */}
                                                {message.user_id === (window as any).auth?.user?.id && (
                                                    <div className="ms-2 flex-shrink-0">
                                                        <img
                                                            src={message.user.avatar ? `/storage/${message.user.avatar}` : '/images/default-avatar.png'}
                                                            alt={message.user.name}
                                                            className="rounded-circle"
                                                            style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = '/images/default-avatar.png';
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>

                        {/* Mesaj Gönderme Alanı */}
                        <Form onSubmit={handleSendMessage} className="border-top p-2">
                            {error && (
                                <Alert variant="danger" className="mb-2" dismissible onClose={() => setError('')}>
                                    {error}
                                </Alert>
                            )}
                            {/* Dosya Önizleme */}
                            {attachments.length > 0 && (
                                <div className="mb-2">
                                    <div className="row g-2">
                                        {attachments.map((file, index) => (
                                            <div key={index} className="col-auto">
                                                <div className="attachment-preview bg-light border rounded p-2 position-relative">
                                                    {file.type.startsWith('image/') ? (
                                                        <div className="image-preview">
                                                            <img
                                                                src={URL.createObjectURL(file)}
                                                                alt={file.name}
                                                                className="rounded"
                                                                style={{
                                                                    width: '80px',
                                                                    height: '80px',
                                                                    objectFit: 'cover'
                                                                }}
                                                            />
                                                            <div className="image-overlay position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50 rounded opacity-0 hover-opacity-100" style={{ transition: 'opacity 0.2s' }}>
                                                                <small className="text-white text-center">
                                                                    {file.name.length > 15 ? file.name.substring(0, 12) + '...' : file.name}
                                                                </small>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="d-flex align-items-center" style={{ width: '80px' }}>
                                                            <i className="ri ri-attachment-line me-1"></i>
                                                            <span className="small text-truncate">
                                                                {file.name.length > 10 ? file.name.substring(0, 8) + '...' : file.name}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        className="position-absolute top-0 end-0 p-1 lh-1"
                                                        style={{
                                                            width: '20px',
                                                            height: '20px',
                                                            transform: 'translate(50%, -50%)',
                                                            fontSize: '10px'
                                                        }}
                                                        onClick={() => removeAttachment(index)}
                                                    >
                                                        <i className="ri ri-close-line"></i>
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <small className="text-muted d-block mt-1">
                                        {attachments.length} dosya seçildi
                                        {attachments.some(f => f.type.startsWith('image/')) && ' (Resimler otomatik olarak optimize edildi)'}
                                    </small>
                                </div>
                            )}

                            {/* Ses Kaydı Kontrolleri */}
                            {isRecording && (
                                <div className="recording-controls mb-2 p-3 bg-danger-subtle rounded">
                                    <div className="d-flex align-items-center justify-content-between">
                                        <div className="d-flex align-items-center">
                                            <div className="recording-indicator me-2">
                                                <div className="pulse-dot bg-danger"></div>
                                            </div>
                                            <div>
                                                <div className="fw-semibold text-danger">Kayıt yapılıyor...</div>
                                                <small className="text-muted">{formatTime(recordingTime)}</small>
                                            </div>
                                        </div>
                                        <div>
                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                className="me-2"
                                                onClick={cancelRecording}
                                            >
                                                <i className="ri ri-close-line"></i> İptal
                                            </Button>
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={stopRecording}
                                            >
                                                <i className="ri ri-stop-fill"></i> Durdur
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Kayıt Tamamlama Kontrolleri */}
                            {!isRecording && audioChunks.length > 0 && (
                                <div className="audio-preview mb-2 p-3 bg-success-subtle rounded">
                                    <div className="d-flex align-items-center justify-content-between">
                                        <div className="d-flex align-items-center">
                                            <i className="ri ri-mic-fill text-success me-2"></i>
                                            <div>
                                                <div className="fw-semibold text-success">Ses kaydı hazır</div>
                                                <small className="text-muted">Süre: {formatTime(recordingTime)}</small>
                                            </div>
                                        </div>
                                        <div>
                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                className="me-2"
                                                onClick={cancelRecording}
                                            >
                                                <i className="ri ri-delete-bin-line"></i> Sil
                                            </Button>
                                            <Button
                                                variant="success"
                                                size="sm"
                                                onClick={sendAudioMessage}
                                                disabled={sendingMessage}
                                            >
                                                <i className="ri ri-send-plane-2-fill"></i> Gönder
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="input-group">
                                <input
                                    type="file"
                                    id="file-input"
                                    multiple
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                                />
                                <Button
                                    variant="outline-secondary"
                                    onClick={() => document.getElementById('file-input')?.click()}
                                    disabled={sendingMessage || isRecording}
                                >
                                    <i className="ri ri-attachment-line"></i>
                                </Button>

                                {/* Mikrofon Butonu */}
                                <Button
                                    variant={isRecording ? "danger" : "outline-secondary"}
                                    onClick={isRecording ? stopRecording : startRecording}
                                    disabled={sendingMessage || audioChunks.length > 0}
                                >
                                    <i className={`ri ${isRecording ? 'ri-stop-fill' : 'ri-mic-line'}`}></i>
                                </Button>

                                <Form.Control
                                    type="text"
                                    placeholder={isRecording ? "Ses kaydediliyor..." : "Mesajınızı yazın..."}
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    disabled={sendingMessage || isRecording}
                                />
                                <Button
                                    variant="primary"
                                    type="submit"
                                    disabled={sendingMessage || isRecording || (!messageText.trim() && attachments.length === 0)}
                                >
                                    <i className="ri ri-send-plane-2-fill"></i>
                                </Button>
                            </div>
                        </Form>
                    </>
                )}
            </Card>

            <Modal show={showModal} onHide={handleCloseModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Yeni Sohbet Başlat</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        {error && <Alert variant="danger">{error}</Alert>}
                        {success && <Alert variant="success">{success}</Alert>}

                        <Form.Group className="mb-3">
                            <Form.Label>Grup Adı / Konu <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="text"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                placeholder="Sohbetin konusunu belirtin (örn: Pazarlama Projesi, Müşteri Toplantısı)"
                                required
                            />
                            <Form.Text className="text-muted">
                                Sohbet grubunun amacını ve konusunu açıklayın
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Departmanlar</Form.Label>
                            <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '0.375rem', padding: '0.5rem' }}>
                                {departments.length === 0 ? (
                                    <p className="text-muted text-center">Yükleniyor...</p>
                                ) : (
                                    departments.map((department) => (
                                        <Form.Check
                                            key={department.id}
                                            type="checkbox"
                                            id={`dept-${department.id}`}
                                            label={`🏢 ${department.name}`}
                                            checked={selectedDepartments.includes(department.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedDepartments([...selectedDepartments, department.id]);
                                                } else {
                                                    setSelectedDepartments(selectedDepartments.filter(id => id !== department.id));
                                                }
                                            }}
                                        />
                                    ))
                                )}
                            </div>
                            <Form.Text className="text-muted">
                                Seçilen departmanların tüm çalışanları otomatik olarak gruba dahil edilir
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Bireysel Kişiler</Form.Label>
                            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '0.375rem', padding: '0.5rem' }}>
                                {users.length === 0 ? (
                                    <p className="text-muted text-center">Yükleniyor...</p>
                                ) : (
                                    users.map((user) => (
                                        <Form.Check
                                            key={user.id}
                                            type="checkbox"
                                            id={`user-${user.id}`}
                                            label={`👤 ${user.first_name} ${user.last_name} (${user.email})`}
                                            checked={selectedUsers.includes(user.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedUsers([...selectedUsers, user.id]);
                                                } else {
                                                    setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                                                }
                                            }}
                                        />
                                    ))
                                )}
                            </div>
                            <Form.Text className="text-muted">
                                Departman seçimi dışında ek olarak bireysel kişileri de ekleyebilirsiniz
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>İlk Mesaj (İsteğe bağlı)</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={firstMessage}
                                onChange={(e) => setFirstMessage(e.target.value)}
                                placeholder="Sohbeti başlatmak için bir mesaj yazın..."
                            />
                            <Form.Text className="text-muted">
                                Grup oluşturulduğunda otomatik olarak gönderilecek ilk mesaj
                            </Form.Text>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseModal}>
                            İptal
                        </Button>
                        <Button variant="primary" type="submit" disabled={loading}>
                            {loading ? 'Oluşturuluyor...' : 'Oluştur'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* CSS Styles */}
            <style jsx>{`
                .pulse-dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    animation: pulse 1.5s infinite;
                }

                @keyframes pulse {
                    0% {
                        transform: scale(0.95);
                        box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7);
                    }

                    70% {
                        transform: scale(1);
                        box-shadow: 0 0 0 10px rgba(220, 53, 69, 0);
                    }

                    100% {
                        transform: scale(0.95);
                        box-shadow: 0 0 0 0 rgba(220, 53, 69, 0);
                    }
                }

                .recording-indicator {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .image-preview:hover .image-overlay {
                    opacity: 1 !important;
                }

                .hover-opacity-100:hover {
                    opacity: 1 !important;
                }
            `}</style>

            {/* Arama Modal */}
            <Modal show={showSearchModal} onHide={handleSearchModalClose} size="xl">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="ri ri-search-line me-2"></i>
                        Mesajlarda Ara
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={(e) => { e.preventDefault(); performSearch(); }}>
                        <div className="row g-3">
                            {/* Arama Metni */}
                            <div className="col-md-12">
                                <Form.Group>
                                    <Form.Label>Mesaj İçeriği</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Aramak istediğiniz kelime veya cümle..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </Form.Group>
                            </div>

                            {/* Tarih Filtreleri */}
                            <div className="col-md-6">
                                <Form.Group>
                                    <Form.Label>Başlangıç Tarihi</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={searchFilters.dateFrom}
                                        onChange={(e) => setSearchFilters({...searchFilters, dateFrom: e.target.value})}
                                    />
                                </Form.Group>
                            </div>
                            <div className="col-md-6">
                                <Form.Group>
                                    <Form.Label>Bitiş Tarihi</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={searchFilters.dateTo}
                                        onChange={(e) => setSearchFilters({...searchFilters, dateTo: e.target.value})}
                                    />
                                </Form.Group>
                            </div>

                            {/* Dosya Türü ve Grup Filtreleri */}
                            <div className="col-md-6">
                                <Form.Group>
                                    <Form.Label>Dosya Türü</Form.Label>
                                    <Form.Select
                                        value={searchFilters.fileType}
                                        onChange={(e) => setSearchFilters({...searchFilters, fileType: e.target.value})}
                                    >
                                        <option value="all">Tümü</option>
                                        <option value="image">🖼️ Resimler</option>
                                        <option value="audio">🎵 Sesli Mesajlar</option>
                                        <option value="document">📄 Dokümanlar</option>
                                    </Form.Select>
                                </Form.Group>
                            </div>
                            <div className="col-md-6">
                                <Form.Group>
                                    <Form.Label>Grup</Form.Label>
                                    <Form.Select
                                        value={searchFilters.groupId}
                                        onChange={(e) => setSearchFilters({...searchFilters, groupId: e.target.value})}
                                    >
                                        <option value="">Tüm Gruplar</option>
                                        {groups.map((group) => (
                                            <option key={group.id} value={group.id}>
                                                {group.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </div>
                        </div>

                        {error && (
                            <Alert variant="danger" className="mt-3">
                                {error}
                            </Alert>
                        )}

                        <div className="d-flex gap-2 mt-4">
                            <Button
                                variant="primary"
                                type="submit"
                                disabled={isSearching}
                            >
                                {isSearching ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                        Aranıyor...
                                    </>
                                ) : (
                                    <>
                                        <i className="ri ri-search-line me-2"></i>
                                        Ara
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline-secondary"
                                onClick={clearSearch}
                                disabled={isSearching}
                            >
                                <i className="ri ri-refresh-line me-2"></i>
                                Temizle
                            </Button>
                        </div>
                    </Form>

                    {/* Arama Sonuçları */}
                    {searchResults.length > 0 && (
                        <div className="mt-4">
                            <h6 className="border-bottom pb-2">
                                <i className="ri ri-file-list-line me-2"></i>
                                Arama Sonuçları ({searchResults.length})
                            </h6>
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {searchResults.map((message) => (
                                    <div key={message.id} className="border rounded p-3 mb-2 bg-light">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <div>
                                                <strong className="text-primary">{message.user.name}</strong>
                                                <small className="text-muted ms-2">
                                                    {new Date(message.created_at).toLocaleString('tr-TR')}
                                                </small>
                                            </div>
                                            <span className="badge bg-secondary">
                                                {message.type === 'audio' ? '🎵 Ses' :
                                                 message.type === 'file' ? '📎 Dosya' :
                                                 '💬 Metin'}
                                            </span>
                                        </div>

                                        {message.content && (
                                            <div className="mb-2">
                                                {message.content}
                                            </div>
                                        )}

                                        {message.attachments && message.attachments.length > 0 && (
                                            <div className="attachments">
                                                {message.attachments.map((attachment: any) => (
                                                    <div key={attachment.id} className="d-inline-block me-2">
                                                        {attachment.mime_type.startsWith('image/') ? (
                                                            <img
                                                                src={attachment.url}
                                                                alt={attachment.original_name}
                                                                className="img-thumbnail"
                                                                style={{ maxHeight: '60px', cursor: 'pointer' }}
                                                                onClick={() => handleImageClick(attachment.url)}
                                                            />
                                                        ) : (
                                                            <a
                                                                href={attachment.url}
                                                                download={attachment.original_name}
                                                                className="btn btn-sm btn-outline-primary"
                                                            >
                                                                <i className="ri ri-attachment-line me-1"></i>
                                                                {attachment.original_name}
                                                            </a>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {searchResults.length === 0 && searchQuery && !isSearching && (
                        <div className="text-center mt-4 text-muted">
                            <i className="ri ri-search-2-line fs-1 mb-3 d-block"></i>
                            <p>Arama kriterlerinize uygun mesaj bulunamadı.</p>
                        </div>
                    )}
                </Modal.Body>
            </Modal>

            {/* Durum Değiştirme Modal */}
            <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Durum Değiştir</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Yeni Durum</Form.Label>
                            <Form.Select 
                                value={selectedStatus} 
                                onChange={(e) => setSelectedStatus(e.target.value)}
                            >
                                <option value="open">Açık</option>
                                <option value="in_progress">Devam Ediyor</option>
                                <option value="completed">Tamamlandı</option>
                                <option value="cancelled">İptal</option>
                            </Form.Select>
                        </Form.Group>
                        
                        {selectedStatus === 'completed' && (
                            <Form.Group className="mb-3">
                                <Form.Label>Tamamlanma Notu</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={completionNote}
                                    onChange={(e) => setCompletionNote(e.target.value)}
                                    placeholder="İş tamamlama detayları..."
                                />
                            </Form.Group>
                        )}
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
                        İptal
                    </Button>
                    <Button variant="primary" onClick={submitStatusChange}>
                        Güncelle
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Atama Modal */}
            <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Kullanıcıya Ata</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Kullanıcı Seç</Form.Label>
                            <Form.Select 
                                value={selectedUserId || ''} 
                                onChange={(e) => setSelectedUserId(Number(e.target.value))}
                            >
                                <option value="">Seçiniz...</option>
                                {users.length === 0 ? (
                                    <option value="" disabled>Kullanıcılar yükleniyor...</option>
                                ) : (
                                    users.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.name || `${user.first_name} ${user.last_name}`.trim()}
                                        </option>
                                    ))
                                )}
                            </Form.Select>
                            <small className="text-muted">
                                Toplam {users.length} kullanıcı bulundu.
                                {users.length === 0 && " Kullanıcılar yükleniyor..."}
                            </small>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAssignModal(false)}>
                        İptal
                    </Button>
                    <Button variant="primary" onClick={submitAssign} disabled={!selectedUserId}>
                        Ata
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Resim Büyütme Modal */}
            <Modal show={showImageModal} onHide={handleCloseImageModal} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Resim Görüntüleyici</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center p-0">
                    <img
                        src={selectedImage}
                        alt="Büyütülmüş resim"
                        className="img-fluid"
                        style={{ width: '100%', height: 'auto', maxHeight: '80vh', objectFit: 'contain' }}
                    />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseImageModal}>
                        Kapat
                    </Button>
                    <Button
                        variant="primary"
                        as="a"
                        href={selectedImage}
                        download
                        target="_blank"
                    >
                        <i className="ri ri-download-line me-2"></i>
                        İndir
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default SimpleMessageWidget;
