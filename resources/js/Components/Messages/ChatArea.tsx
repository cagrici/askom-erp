import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Button, Modal, Alert, Badge } from 'react-bootstrap';
import { usePage } from '@inertiajs/react';
import axios from 'axios';

interface ChatAreaProps {
    activeGroupId: number | null;
    chatMode?: 'work-request' | 'job-group';
    onBack?: () => void;
    onGroupUpdate?: () => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({ activeGroupId, chatMode = 'job-group', onBack, onGroupUpdate }) => {
    const { props } = usePage();
    const currentUser = (props.auth as any)?.user;
    const [messages, setMessages] = useState<any[]>([]);
    const [messageText, setMessageText] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [groupInfo, setGroupInfo] = useState<any>(null);
    const [error, setError] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
    const [recordingTime, setRecordingTime] = useState(0);
    const [editingMessage, setEditingMessage] = useState<any>(null);
    const [editText, setEditText] = useState('');
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string>('');
    const [hasNewMessages, setHasNewMessages] = useState(false);
    const [recordedAudioUrl, setRecordedAudioUrl] = useState<string>('');
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [completionNote, setCompletionNote] = useState('');
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [groupMembers, setGroupMembers] = useState<any[]>([]);
    const [searchUserQuery, setSearchUserQuery] = useState('');
    const [searchUserResults, setSearchUserResults] = useState<any[]>([]);
    const [isSearchingUsers, setIsSearchingUsers] = useState(false);
    const [mentionSuggestions, setMentionSuggestions] = useState<any[]>([]);
    const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [cursorPosition, setCursorPosition] = useState(0);
    const [unreadMentions, setUnreadMentions] = useState(0);
    const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchFilters, setSearchFilters] = useState({
        userId: '',
        hasMentions: false,
        hasAttachments: false
    });

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (activeGroupId) {
            fetchMessages();
            fetchGroupMembers(); // Grup üyeleri de yükle
            startPolling();
            setUnreadMentions(0); // Reset mention count when switching groups
        } else {
            stopPolling();
            setMessages([]);
            setGroupInfo(null);
            setGroupMembers([]); // Grup üyelerini temizle
        }
        return () => stopPolling();
    }, [activeGroupId]);

    // Request notification permission on component mount
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // Scroll sadece ilk yüklemede otomatik olsun
    useEffect(() => {
        if (!loading && messages.length > 0 && activeGroupId) {
            // İlk yüklemede scroll et
            setTimeout(scrollToBottom, 100);
        }
    }, [activeGroupId]); // Sadece activeGroupId değiştiğinde

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRecording) {
            interval = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const fetchMessages = async () => {
        if (!activeGroupId) return;

        try {
            setLoading(true);

            if (chatMode === 'work-request') {
                // İş Talepleri için
                const [messagesResponse, groupResponse] = await Promise.all([
                    axios.get(`/api/messages/groups/${activeGroupId}/messages`),
                    axios.get(`/api/messages/groups`)
                ]);

                setMessages(messagesResponse.data.data || []);

                // Find current group info from groups response
                const groups = groupResponse.data.groups || [];
                const currentGroup = groups.find((g: any) => g.id === activeGroupId);
                if (currentGroup) {
                    setGroupInfo(currentGroup);
                } else {
                    console.error('Work request group not found in groups list');
                }

                // Fallback: Get group info from first message if available
                if (!currentGroup && messagesResponse.data.data && messagesResponse.data.data.length > 0) {
                    const firstMessage = messagesResponse.data.data[0];
                    if (firstMessage.message_group) {
                        setGroupInfo(firstMessage.message_group);
                    }
                }

            } else {
                // İş Grupları için
                const [messagesResponse, groupResponse] = await Promise.all([
                    axios.get(`/job-groups/${activeGroupId}/messages`),
                    axios.get(`/job-groups/${activeGroupId}`)
                ]);

                setMessages(messagesResponse.data.data || []);
                setGroupInfo(groupResponse.data.group || null);
            }

        } catch (error) {
            console.error('Failed to fetch messages:', error);
            setError('Mesajlar yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const fetchNewMessages = async () => {
        if (!activeGroupId || messages.length === 0) {
            return;
        }

        try {
            // Son mesajın ID'sini al
            const lastMessageId = messages[messages.length - 1]?.id;
            if (!lastMessageId) return;

            // Sadece son mesajdan sonraki mesajları getir - Chat mode'a göre
            const response = chatMode === 'work-request'
                ? await axios.get(`/api/messages/groups/${activeGroupId}/messages?after=${lastMessageId}`)
                : await axios.get(`/job-groups/${activeGroupId}/messages?after_id=${lastMessageId}`);
            const newMessages = Array.isArray(response.data) ? response.data : response.data.data || [];

            // Eğer yeni mesaj varsa, mevcut mesajlara ekle
            if (newMessages.length > 0) {
                setMessages(prev => {
                    const existingIds = prev.map(msg => msg.id);
                    // Sadece henüz yoksa ekle (duplicate prevention)
                    const uniqueNewMessages = newMessages.filter(msg => !existingIds.includes(msg.id));

                    // Check for new mentions
                    let newMentionCount = 0;
                    uniqueNewMessages.forEach(message => {
                        if (message.mentions && message.mentions.length > 0 && message.user_id !== currentUser?.id) {
                            const isMentioned = message.mentions.some((mention: any) => mention.user_id === currentUser?.id);
                            if (isMentioned) {
                                newMentionCount++;
                            }
                        }
                    });

                    if (newMentionCount > 0) {
                        setUnreadMentions(prev => prev + newMentionCount);
                        // Show browser notification if supported
                        if ('Notification' in window && Notification.permission === 'granted') {
                            new Notification('Yeni Mention', {
                                body: `${newMentionCount} yeni mention alındı`,
                                icon: '/favicon.ico'
                            });
                        }
                    }

                    return [...prev, ...uniqueNewMessages];
                });
                setHasNewMessages(true);

                // Sadece yeni mesaj geldiğinde scroll et
                setTimeout(() => {
                    scrollToBottom();
                    // Biraz bekleyip new message indicator'ını kaldır
                    setTimeout(() => setHasNewMessages(false), 2000);
                }, 100);
            }
        } catch (error) {
            console.error('Failed to fetch new messages:', error);
            // Hata durumunda silent fail - kullanıcıyı rahatsız etme
        }
    };

    const startPolling = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        // Gerçek zamanlı deneyim için 3 saniye interval
        intervalRef.current = setInterval(fetchNewMessages, 3000);
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

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!activeGroupId || (!messageText.trim() && attachments.length === 0)) {
            return;
        }

        setSendingMessage(true);
        setError('');

        try {
            const formData = new FormData();

            if (messageText.trim()) {
                formData.append('content', messageText.trim());
            }

            attachments.forEach((file, index) => {
                formData.append(`attachments[${index}]`, file);
            });

            let response;
            if (chatMode === 'work-request') {
                // İş Talepleri için
                formData.append('message_group_id', activeGroupId.toString());
                response = await axios.post('/api/messages', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
            } else {
                // İş Grupları için
                formData.append('type', attachments.length > 0 ? 'file' : 'text');
                response = await axios.post(`/job-groups/${activeGroupId}/messages`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
            }

            // Add message to the list immediately (mesaj gönderen için)
            setMessages(prev => [...prev, response.data]);
            setMessageText('');
            setAttachments([]);

            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            // Mesaj gönderildikten sonra scroll et
            setTimeout(scrollToBottom, 100);

            // fetchNewMessages'ı çağırmayalım çünkü mesaj zaten eklendi
            // Sadece polling interval'ın devam etmesi yeterli

        } catch (error: any) {
            console.error('Failed to send message:', error);
            setError('Mesaj gönderilemedi: ' + (error.response?.data?.message || error.message));
        } finally {
            setSendingMessage(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setAttachments(prev => [...prev, ...files]);
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            // Try different MIME types for better compatibility
            let mimeType = 'audio/webm;codecs=opus';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'audio/webm';
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                    mimeType = 'audio/ogg';
                    if (!MediaRecorder.isTypeSupported(mimeType)) {
                        mimeType = ''; // Use default
                    }
                }
            }

            const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

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
            recorder.start(100); // Collect data every 100ms

            console.log('Recording started with mime type:', mimeType);
        } catch (error) {
            console.error('Mikrofon erişimi başarısız:', error);
            alert('Mikrofon erişimi için izin gereklidir.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            setIsRecording(false);

            // Ses dosyasını oluştur ve preview için URL'i hazırla
            setTimeout(() => {
                if (audioChunks.length > 0) {
                    // Use the same MIME type as the recorder
                    const mimeType = mediaRecorder.mimeType || 'audio/webm';
                    const audioBlob = new Blob(audioChunks, { type: mimeType });
                    const audioUrl = URL.createObjectURL(audioBlob);
                    setRecordedAudioUrl(audioUrl);
                    console.log('Audio blob created:', audioBlob.size, 'bytes', 'Type:', mimeType);
                }
            }, 200);
        }
    };

    const cancelAudioRecording = () => {
        // Kaydı iptal et ve state'leri temizle
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
        }

        setIsRecording(false);
        setAudioChunks([]);
        setRecordingTime(0);
        setMediaRecorder(null);

        // Oluşturulmuş audio URL'ini temizle
        if (recordedAudioUrl) {
            URL.revokeObjectURL(recordedAudioUrl);
            setRecordedAudioUrl('');
        }
    };

    const sendAudioMessage = async () => {
        if (audioChunks.length === 0) return;

        // Use the same MIME type as the recorder
        const mimeType = mediaRecorder?.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunks, { type: mimeType });
        const extension = mimeType.includes('webm') ? 'webm' : mimeType.includes('ogg') ? 'ogg' : 'webm';
        const audioFile = new File([audioBlob], `audio_${Date.now()}.${extension}`, { type: mimeType });

        if (!activeGroupId) return;

        setSendingMessage(true);
        setError('');

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

            // Add message to the list immediately
            setMessages(prev => [...prev, response.data]);

            // Reset audio recording state
            setAudioChunks([]);
            setRecordingTime(0);
            setMediaRecorder(null);

            // Clear recorded audio URL and revoke object URL
            if (recordedAudioUrl) {
                URL.revokeObjectURL(recordedAudioUrl);
                setRecordedAudioUrl('');
            }

            // Mesaj gönderildikten sonra scroll et
            setTimeout(scrollToBottom, 100);

        } catch (error: any) {
            console.error('Failed to send audio message:', error);
            setError('Ses mesajı gönderilemedi: ' + (error.response?.data?.message || error.message));
        } finally {
            setSendingMessage(false);
        }
    };

    const handleImageClick = (url: string) => {
        setSelectedImage(url);
        setShowImageModal(true);
    };

    const fetchUsers = async () => {
        try {
            const response = await axios.get('/api/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    const fetchGroupMembers = async () => {
        if (!activeGroupId) return;

        try {
            // Sadece İş Grupları için üye bilgilerini getir
            if (chatMode === 'job-group') {
                const response = await axios.get(`/job-groups/${activeGroupId}/members`);
                setGroupMembers(response.data.members || []);
            } else {
                // İş Talepleri için
                const response = await axios.get(`/api/messages/groups/${activeGroupId}/members`);
                setGroupMembers(response.data.members || []);
            }
        } catch (error) {
            console.error('Failed to fetch group members:', error);
            setGroupMembers([]);
        }
    };

    const handleShowMembers = () => {
        fetchGroupMembers();
        setShowMembersModal(true);
        setSearchUserQuery('');
        setSearchUserResults([]);
    };

    const handleShowAdvancedSearch = () => {
        setShowAdvancedSearch(true);
    };

    const searchUsers = async (query: string) => {
        if (query.length < 2) {
            setSearchUserResults([]);
            return;
        }

        setIsSearchingUsers(true);
        try {
            const response = await axios.get(`/job-groups/api/users?search=${encodeURIComponent(query)}&location_id=${groupInfo?.location_id || ''}`);
            const results = response.data || [];

            // Filter out users who are already members
            const memberIds = groupMembers.map(member => member.id);
            const filteredResults = results.filter((user: any) => !memberIds.includes(user.id));

            setSearchUserResults(filteredResults);
        } catch (error) {
            console.error('Failed to search users:', error);
            setSearchUserResults([]);
        } finally {
            setIsSearchingUsers(false);
        }
    };

    const addMemberToGroup = async (userId: number) => {
        if (!activeGroupId) return;

        try {
            await axios.post(`/job-groups/${activeGroupId}/members`, {
                user_id: userId
            });

            // Refresh group members list
            fetchGroupMembers();
            setSearchUserQuery('');
            setSearchUserResults([]);
        } catch (error: any) {
            console.error('Failed to add member:', error);
            setError('Üye eklenirken hata oluştu: ' + (error.response?.data?.message || error.message));
        }
    };

    const removeMemberFromGroup = async (userId: number) => {
        if (!activeGroupId) return;

        if (window.confirm('Bu üyeyi gruptan çıkarmak istediğinizden emin misiniz?')) {
            try {
                await axios.delete(`/job-groups/${activeGroupId}/members`, {
                    data: { user_id: userId }
                });

                // Refresh group members list
                fetchGroupMembers();
            } catch (error: any) {
                console.error('Failed to remove member:', error);
                setError('Üye çıkarılırken hata oluştu: ' + (error.response?.data?.message || error.message));
            }
        }
    };

    const toggleMemberAdmin = async (userId: number, currentIsAdmin: boolean) => {
        if (!activeGroupId) return;

        try {
            if (currentIsAdmin) {
                // If trying to remove admin, check if there are other admins
                const adminCount = groupMembers.filter(member => member.pivot?.is_admin).length;
                if (adminCount <= 1) {
                    setError('Son yönetici yetkisi kaldırılamaz. Önce başka bir üyeyi yönetici yapın.');
                    return;
                }
            }

            await axios.put(`/job-groups/${activeGroupId}/members/admin`, {
                user_id: userId
            });

            // Refresh group members list
            fetchGroupMembers();
        } catch (error: any) {
            console.error('Failed to toggle admin status:', error);
            setError('Yönetici yetkisi değiştirilirken hata oluştu: ' + (error.response?.data?.message || error.message));
        }
    };

    const searchMentionUsers = async (query: string) => {
        if (!query || query.length < 1) {
            setMentionSuggestions([]);
            return;
        }

        try {
            // Group members'dan arama yap
            const filteredMembers = groupMembers.filter(member => {
                const name = member.name || `${member.first_name || ''} ${member.last_name || ''}`.trim();
                return name.toLowerCase().includes(query.toLowerCase()) ||
                       member.email.toLowerCase().includes(query.toLowerCase());
            }).slice(0, 5); // Maksimum 5 öneri

            setMentionSuggestions(filteredMembers);
        } catch (error) {
            console.error('Failed to search mention users:', error);
        }
    };

    const handleMessageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const cursorPos = e.target.selectionStart || 0;

        setMessageText(value);
        setCursorPosition(cursorPos);

        // @ ile mention algılama
        const atIndex = value.lastIndexOf('@', cursorPos - 1);
        if (atIndex !== -1) {
            const spaceAfterAt = value.indexOf(' ', atIndex);
            const isAtEndOrSpace = spaceAfterAt === -1 || cursorPos <= spaceAfterAt;

            if (isAtEndOrSpace) {
                const mentionQuery = value.substring(atIndex + 1, cursorPos);

                // Sadece harfler, sayılar ve . _ - karakterlerine izin ver
                if (/^[a-zA-Z0-9._-]*$/.test(mentionQuery)) {
                    setMentionQuery(mentionQuery);
                    setShowMentionSuggestions(true);
                    searchMentionUsers(mentionQuery);
                    return;
                }
            }
        }

        // @ yoksa veya geçerli değilse suggestion'ları gizle
        setShowMentionSuggestions(false);
        setMentionSuggestions([]);
    };

    const insertMention = (user: any) => {
        const atIndex = messageText.lastIndexOf('@', cursorPosition - 1);
        if (atIndex === -1) return;

        const beforeMention = messageText.substring(0, atIndex);
        const afterCursor = messageText.substring(cursorPosition);
        const mentionText = `@${user.name}`;

        const newText = beforeMention + mentionText + ' ' + afterCursor;
        setMessageText(newText);
        setShowMentionSuggestions(false);
        setMentionSuggestions([]);

        // Focus'u geri input'a ver
        setTimeout(() => {
            const messageInput = document.querySelector('input[type="text"][placeholder*="Mesajınızı"]') as HTMLInputElement;
            if (messageInput) {
                const newCursorPos = atIndex + mentionText.length + 1;
                messageInput.focus();
                messageInput.setSelectionRange(newCursorPos, newCursorPos);
            }
        }, 10);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (showMentionSuggestions && mentionSuggestions.length > 0) {
            if (e.key === 'Escape') {
                setShowMentionSuggestions(false);
                return;
            }
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
                e.preventDefault();
                // Basit implementasyon için ilk önerilen kullanıcıyı seç
                if (e.key === 'Enter') {
                    insertMention(mentionSuggestions[0]);
                }
                return;
            }
        }
    };

    const performAdvancedSearch = async () => {
        if (!activeGroupId || (!searchQuery.trim() && !hasAnyFilter())) {
            return;
        }

        setIsSearching(true);
        try {
            const params = new URLSearchParams();

            if (searchQuery.trim()) {
                params.append('query', searchQuery.trim());
            }

            // Chat mode'a göre farklı parametreler
            if (chatMode === 'work-request') {
                // İş Talepleri için - group_id parametresi kullan
                params.append('group_id', activeGroupId.toString());

                // TODO: Diğer filtreler için de uyumlu parametreler eklenecek

            } else {
                // İş Grupları için - mevcut parametreler
                if (searchFilters.userId) {
                    params.append('user_id', searchFilters.userId);
                }

                if (searchFilters.hasMentions) {
                    params.append('has_mentions', '1');
                }

                if (searchFilters.hasAttachments) {
                    params.append('has_attachments', '1');
                }
            }

            // Chat mode'a göre farklı URL'ler
            const searchUrl = chatMode === 'work-request'
                ? `/api/messages/search?${params.toString()}`
                : `/job-groups/${activeGroupId}/search?${params.toString()}`;

            const response = await axios.get(searchUrl);

            setSearchResults(response.data.messages || []);

        } catch (error: any) {
            console.error('Search error:', error);
            setError('Arama yapılırken hata oluştu: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsSearching(false);
        }
    };

    const hasAnyFilter = () => {
        return searchFilters.userId ||
               searchFilters.hasMentions ||
               searchFilters.hasAttachments;
    };

    const clearAdvancedSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
        setSearchFilters({
            userId: '',
            hasMentions: false,
            hasAttachments: false
        });
    };

    const jumpToMessage = async (messageId: number) => {
        // Close search modal first
        setShowAdvancedSearch(false);

        // Scroll to message if it's already loaded
        const messageElement = document.getElementById(`message-${messageId}`);
        if (messageElement) {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Highlight the message temporarily
            messageElement.classList.add('highlight-message');
            setTimeout(() => {
                messageElement.classList.remove('highlight-message');
            }, 3000);
        } else {
            // If message is not loaded, we would need to load older messages
            // For now, just show a notification
            alert('Mesaj bulunamadı. Daha eski mesajları yüklemek için sayfayı yenileyin.');
        }
    };

    const handleStatusChange = () => {
        console.log('handleStatusChange called, groupInfo:', groupInfo);
        if (groupInfo) {
            setSelectedStatus(groupInfo.status);
            setCompletionNote('');
            setShowStatusModal(true);
        } else {
            console.error('groupInfo is null or undefined');
            setError('Grup bilgisi yüklenemedi. Lütfen sayfayı yenileyin.');
        }
    };

    const handleAssign = () => {
        console.log('handleAssign called, groupInfo:', groupInfo);
        if (groupInfo) {
            setSelectedUserId(groupInfo.assigned_to);
            setShowAssignModal(true);
            fetchUsers();
        } else {
            console.error('groupInfo is null or undefined');
            setError('Grup bilgisi yüklenemedi. Lütfen sayfayı yenileyin.');
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

            // Refresh group info
            fetchMessages();
            if (onGroupUpdate) onGroupUpdate();
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

            // Refresh group info
            fetchMessages();
            if (onGroupUpdate) onGroupUpdate();
            setShowAssignModal(false);
        } catch (error: any) {
            setError('Atama yapılamadı: ' + (error.response?.data?.message || error.message));
        }
    };

    const highlightMentions = (content: string, mentions: any[] = []) => {
        if (!content || !mentions || mentions.length === 0) {
            return content;
        }

        let highlightedContent = content;

        // Mention'ları vurgula
        mentions.forEach((mention) => {
            const mentionRegex = new RegExp(`@${mention.username}`, 'gi');
            const currentUserId = currentUser?.id;
            const isMentioningMe = mention.user_id === currentUserId;

            const mentionClass = isMentioningMe
                ? 'mention-me'
                : 'mention-other';

            highlightedContent = highlightedContent.replace(
                mentionRegex,
                `<span class="${mentionClass}" title="${mention.display_name}">@${mention.username}</span>`
            );
        });

        return highlightedContent;
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getStatusIcon = (message: any) => {
        if (message.user_id !== currentUser?.id) {
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

    if (!activeGroupId) {
        return (
            <Card className="h-100 d-flex align-items-center justify-content-center">
                <div className="text-center text-muted">
                    <i className="ri ri-message-3-line fs-1 mb-3 d-block opacity-25"></i>
                    <h5>Bir konuşma seçin</h5>
                    <p>Sol taraftan bir iş talebi seçerek konuşmaya başlayın</p>
                </div>
            </Card>
        );
    }

    return (
        <>
            <style>{`
                .recording-pulse {
                    animation: pulse 1.5s infinite;
                }

                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.7; }
                    100% { transform: scale(1); opacity: 1; }
                }

                .audio-player-container audio {
                    outline: none;
                }

                .audio-player-container audio::-webkit-media-controls-panel {
                    background-color: rgba(255, 255, 255, 0.8);
                }

                .audio-player-container audio::-webkit-media-controls-play-button {
                    background-color: #007bff;
                    border-radius: 50%;
                }

                .audio-player-container audio::-webkit-media-controls-current-time-display,
                .audio-player-container audio::-webkit-media-controls-time-remaining-display {
                    color: #333;
                    font-size: 12px;
                }

                .hover-bg-light:hover {
                    background-color: rgba(0, 123, 255, 0.1) !important;
                    transition: background-color 0.15s ease-in-out;
                }

                .cursor-pointer {
                    cursor: pointer;
                }

                .mention-me {
                    background-color: #007bff;
                    color: white;
                    padding: 2px 6px;
                    border-radius: 12px;
                    font-weight: 600;
                    font-size: 0.9em;
                    text-decoration: none;
                    display: inline-block;
                    animation: mentionPulse 0.3s ease-in-out;
                }

                .mention-other {
                    background-color: #e9ecef;
                    color: #007bff;
                    padding: 2px 6px;
                    border-radius: 12px;
                    font-weight: 600;
                    font-size: 0.9em;
                    text-decoration: none;
                    display: inline-block;
                    border: 1px solid #dee2e6;
                }

                .mention-me:hover, .mention-other:hover {
                    transform: scale(1.05);
                    transition: transform 0.1s ease;
                    cursor: pointer;
                }

                @keyframes mentionPulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }

                .highlight-message {
                    animation: highlightPulse 3s ease-in-out;
                    border: 2px solid #ffc107 !important;
                    border-radius: 8px !important;
                    background-color: rgba(255, 193, 7, 0.1) !important;
                }

                @keyframes highlightPulse {
                    0% {
                        border-color: #ffc107;
                        background-color: rgba(255, 193, 7, 0.2);
                    }
                    50% {
                        border-color: #ffcd39;
                        background-color: rgba(255, 193, 7, 0.3);
                    }
                    100% {
                        border-color: #ffc107;
                        background-color: rgba(255, 193, 7, 0.1);
                    }
                }
            `}</style>

            <Card className="h-100 d-flex flex-column">
                {/* Header */}
                <Card.Header className="d-flex justify-content-between align-items-center py-3">
                    <div className="d-flex align-items-center">
                        {onBack && (
                            <Button variant="ghost" size="sm" onClick={onBack} className="me-2 d-lg-none">
                                <i className="ri ri-arrow-left-line"></i>
                            </Button>
                        )}
                        <div>
                            <h6 className="mb-0 d-flex align-items-center">
                                {groupInfo?.name || 'Konuşma'}
                                {hasNewMessages && (
                                    <span className="badge bg-success ms-2 animate__animated animate__pulse">
                                        Yeni
                                    </span>
                                )}
                                {unreadMentions > 0 && (
                                    <span
                                        className="badge bg-danger ms-2 animate__animated animate__bounce"
                                        title={`${unreadMentions} okunmamış mention`}
                                        onClick={() => setUnreadMentions(0)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <i className="ri ri-at-line me-1"></i>
                                        {unreadMentions}
                                    </span>
                                )}
                            </h6>
                            {groupInfo && (
                                <div className="d-flex gap-1 mt-1">
                                    <Badge bg={groupInfo.status === 'open' ? 'info' :
                                             groupInfo.status === 'in_progress' ? 'warning' :
                                             groupInfo.status === 'completed' ? 'success' : 'secondary'}
                                           size="sm">
                                        {groupInfo.status === 'open' ? 'Açık' :
                                         groupInfo.status === 'in_progress' ? 'Devam Ediyor' :
                                         groupInfo.status === 'completed' ? 'Tamamlandı' :
                                         groupInfo.status === 'cancelled' ? 'İptal' : groupInfo.status}
                                    </Badge>
                                    <Badge bg={groupInfo.priority === 'urgent' ? 'danger' :
                                             groupInfo.priority === 'high' ? 'warning' :
                                             groupInfo.priority === 'medium' ? 'primary' : 'secondary'}
                                           size="sm">
                                        {groupInfo.priority === 'urgent' ? '🔥 Acil' :
                                         groupInfo.priority === 'high' ? '⚡ Yüksek' :
                                         groupInfo.priority === 'medium' ? '➖ Orta' :
                                         groupInfo.priority === 'low' ? '🔻 Düşük' : groupInfo.priority}
                                    </Badge>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            className="me-2"
                            onClick={handleShowAdvancedSearch}
                            title="Gelişmiş Arama"
                        >
                            <i className="ri ri-search-line"></i>
                        </Button>

                        {/* Sadece İş Talepleri için durum, ata ve üyeler butonları */}
                        {chatMode === 'work-request' && (
                            <>
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    className="me-2"
                                    onClick={() => {
                                        handleStatusChange();
                                    }}
                                    disabled={!groupInfo}
                                    title={!groupInfo ? "Grup bilgisi yükleniyor..." : "Durumu Değiştir"}
                                >
                                    <i className="ri ri-refresh-line me-1"></i>
                                    Durum
                                </Button>
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    className="me-2"
                                    onClick={() => {
                                        handleAssign();
                                    }}
                                    disabled={!groupInfo}
                                    title={!groupInfo ? "Grup bilgisi yükleniyor..." : "Kullanıcıya Ata"}
                                >
                                    <i className="ri ri-user-add-line me-1"></i>
                                    Ata
                                </Button>
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={handleShowMembers}
                                    disabled={!groupInfo}
                                    title={!groupInfo ? "Grup bilgisi yükleniyor..." : "Grup Üyeleri"}
                                >
                                    <i className="ri ri-team-line me-1"></i>
                                    Üyeler
                                </Button>
                            </>
                        )}
                    </div>
                </Card.Header>

                {/* Messages Area */}
                <div className="flex-grow-1 overflow-auto p-3" style={{ maxHeight: 'calc(100vh - 400px)' }}>
                    {loading ? (
                        <div className="text-center py-4">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Yükleniyor...</span>
                            </div>
                        </div>
                    ) : messages.length > 0 ? (
                        messages.map((message) => {
                            const currentUserId = currentUser?.id;
                            const isOwnMessage = message.user_id === currentUserId;

                            return (
                            <div
                                key={message.id}
                                id={`message-${message.id}`}
                                className={`d-flex mb-3 align-items-end ${
                                    isOwnMessage ? 'justify-content-end flex-row-reverse' : 'justify-content-start'
                                }`}
                            >
                                {/* Avatar */}
                                {!isOwnMessage ? (
                                    <div className="me-2 mb-1">
                                        {message.user?.avatar ? (
                                            <img
                                                src={`/storage/${message.user.avatar}`}
                                                alt={message.user?.name || 'User'}
                                                className="rounded-circle"
                                                style={{ width: '32px', height: '32px' }}
                                            />
                                        ) : (
                                            <div className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white small fw-bold"
                                                 style={{ width: '32px', height: '32px' }}>
                                                {(message.user?.name || 'U').charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="me-2 mb-1">
                                        {currentUser?.avatar ? (
                                            <img
                                                src={`/storage/${currentUser.avatar}`}
                                                alt={currentUser?.name || 'User'}
                                                className="rounded-circle"
                                                style={{ width: '32px', height: '32px' }}
                                            />
                                        ) : (
                                            <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white small fw-bold"
                                                 style={{ width: '32px', height: '32px' }}>
                                                {(currentUser?.name || 'U').charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className={`message-bubble p-3 position-relative ${
                                    isOwnMessage
                                        ? 'text-dark ms-auto rounded-start-3 rounded-end-1 rounded-bottom-3'
                                        : 'text-dark me-auto border rounded-end-3 rounded-start-1 rounded-bottom-3 shadow-sm'
                                }`} style={{
                                    maxWidth: '70%',
                                    backgroundColor: isOwnMessage ? '#e3f2fd' : '#f8f9fa',
                                    borderColor: isOwnMessage ? '#bbdefb' : '#dee2e6'
                                }}>

                                    {/* User info for received messages */}
                                    {!isOwnMessage && (
                                        <div className="small fw-bold mb-1 text-primary">
                                            {message.user?.name}
                                        </div>
                                    )}

                                    {/* Message content */}
                                    {message.content && (
                                        <div className="mb-1">
                                            <span
                                                dangerouslySetInnerHTML={{
                                                    __html: highlightMentions(message.content, message.mentions)
                                                }}
                                            />
                                            {message.is_edited && (
                                                <small className={`ms-2 ${
                                                    isOwnMessage ? 'text-muted' : 'text-muted'
                                                }`}>
                                                    (düzenlendi)
                                                </small>
                                            )}
                                        </div>
                                    )}

                                    {/* Attachments */}
                                    {message.attachments && message.attachments.length > 0 && (
                                        <div className="attachments mt-2">
                                            {message.attachments.map((attachment: any) => (
                                                <div key={attachment.id} className="mb-2">
                                                    {attachment.mime_type.startsWith('image/') ? (
                                                        <img
                                                            src={attachment.url}
                                                            alt={attachment.original_name}
                                                            className="img-fluid rounded cursor-pointer"
                                                            style={{ maxHeight: '200px', cursor: 'pointer' }}
                                                            onClick={() => handleImageClick(attachment.url)}
                                                        />
                                                    ) : attachment.mime_type.startsWith('audio/') || attachment.original_name.includes('.webm') || attachment.original_name.includes('.ogg') || attachment.original_name.includes('.mp3') || attachment.original_name.includes('.wav') ? (
                                                        <div className="bg-white bg-opacity-25 p-3 rounded">
                                                            <div className="d-flex align-items-center mb-2">
                                                                <i className="ri ri-volume-up-line me-2 text-primary fs-5"></i>
                                                                <div className="flex-grow-1">
                                                                    <div className="small fw-bold text-primary">🎵 Ses Mesajı</div>
                                                                    <div className="small opacity-75">
                                                                        {attachment.duration ? `${Math.floor(attachment.duration / 60)}:${(attachment.duration % 60).toString().padStart(2, '0')}` : 'Ses dosyası'} • {formatFileSize(attachment.size)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="audio-player-container mb-2">
                                                                <audio
                                                                    controls
                                                                    preload="auto"
                                                                    className="w-100"
                                                                    style={{
                                                                        height: '50px',
                                                                        minHeight: '50px',
                                                                        backgroundColor: 'rgba(255,255,255,0.2)',
                                                                        borderRadius: '8px',
                                                                        border: '1px solid rgba(255,255,255,0.3)'
                                                                    }}
                                                                    controlsList="nodownload"
                                                                    onError={(e) => {
                                                                        console.error('Audio load error:', e);
                                                                        console.error('Failed URL:', attachment.url);
                                                                        console.error('MIME type:', attachment.mime_type);
                                                                    }}
                                                                    onLoadStart={() => console.log('Audio loading started:', attachment.url)}
                                                                    onCanPlay={() => console.log('Audio can play:', attachment.url)}
                                                                    onLoadedData={() => console.log('Audio loaded successfully:', attachment.url)}
                                                                    onLoadedMetadata={() => console.log('Audio metadata loaded:', attachment.url)}
                                                                    crossOrigin="anonymous"
                                                                >
                                                                    <source src={attachment.url} type="audio/webm" />
                                                                    <source src={attachment.url} type="audio/ogg" />
                                                                    <source src={attachment.url} type="audio/mpeg" />
                                                                    <source src={attachment.url} type="audio/mp3" />
                                                                    <source src={attachment.url} type="audio/wav" />
                                                                    <source src={attachment.url} type={attachment.mime_type} />
                                                                    <source src={attachment.url} />
                                                                    Tarayıcınız ses dosyasını desteklemiyor.
                                                                </audio>
                                                            </div>
                                                            {/* Manual play button as fallback */}
                                                            <div className="d-flex justify-content-center gap-2">
                                                                <button
                                                                    className="btn btn-sm btn-primary"
                                                                    onClick={(e) => {
                                                                        const audioContainer = e.currentTarget.closest('.audio-player-container');
                                                                        const audioElement = audioContainer?.querySelector('audio') as HTMLAudioElement;
                                                                        if (audioElement) {
                                                                            console.log('Manual play attempt for:', attachment.url);
                                                                            audioElement.load(); // Force reload
                                                                            audioElement.play()
                                                                                .then(() => console.log('Manual play successful'))
                                                                                .catch(e => {
                                                                                    console.error('Manual play failed:', e);
                                                                                    // Try opening in new window as fallback
                                                                                    window.open(attachment.url, '_blank');
                                                                                });
                                                                        }
                                                                    }}
                                                                >
                                                                    <i className="ri ri-play-fill me-1"></i>
                                                                    Oynat
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-outline-info"
                                                                    onClick={() => {
                                                                        // Open audio file in new tab for direct access
                                                                        window.open(attachment.url, '_blank');
                                                                    }}
                                                                >
                                                                    <i className="ri ri-external-link-line me-1"></i>
                                                                    Aç
                                                                </button>
                                                                <a
                                                                    href={attachment.url}
                                                                    download={attachment.original_name}
                                                                    className="btn btn-sm btn-outline-secondary"
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    <i className="ri ri-download-line me-1"></i>
                                                                    İndir
                                                                </a>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="bg-white bg-opacity-25 p-2 rounded">
                                                            <div className="d-flex align-items-center">
                                                                <i className="ri ri-file-line me-2"></i>
                                                                <div className="flex-grow-1">
                                                                    <div className="small fw-bold">{attachment.original_name}</div>
                                                                    <div className="small opacity-75">{formatFileSize(attachment.size)}</div>
                                                                </div>
                                                                <a
                                                                    href={attachment.url}
                                                                    download={attachment.original_name}
                                                                    className="btn btn-sm btn-light ms-2"
                                                                >
                                                                    <i className="ri ri-download-line"></i>
                                                                </a>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Message time and status */}
                                    <div className={`small d-flex justify-content-between align-items-center mt-1 ${
                                        isOwnMessage ? 'text-muted' : 'text-muted'
                                    }`}>
                                        <span>{formatTime(message.created_at)}</span>
                                        {getStatusIcon(message)}
                                    </div>
                                </div>
                            </div>
                            );
                        })
                    ) : (
                        <div className="text-center text-muted py-4">
                            <i className="ri ri-message-3-line fs-1 mb-3 d-block opacity-25"></i>
                            <p>Henüz mesaj bulunmuyor. İlk mesajı gönderin!</p>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <Card.Footer className="border-top-0 bg-light">
                    {error && (
                        <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-2">
                            {error}
                        </Alert>
                    )}

                    {/* Attachments Preview */}
                    {attachments.length > 0 && (
                        <div className="mb-2">
                            {attachments.map((file, index) => (
                                <div key={index} className="d-flex align-items-center justify-content-between bg-white p-2 rounded mb-1">
                                    <div className="d-flex align-items-center">
                                        <i className="ri ri-attachment-line me-2"></i>
                                        <span className="small">{file.name}</span>
                                    </div>
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => removeAttachment(index)}
                                    >
                                        <i className="ri ri-close-line"></i>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Ses Kayıt Modu */}
                    {isRecording ? (
                        <div className="bg-danger bg-opacity-10 p-3 rounded">
                            <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center">
                                    <div className="recording-pulse me-3">
                                        <i className="ri ri-mic-fill text-danger fs-4"></i>
                                    </div>
                                    <div>
                                        <div className="fw-bold text-danger">Ses kaydediliyor...</div>
                                        <div className="small text-muted">
                                            {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                                        </div>
                                    </div>
                                </div>
                                <div className="d-flex gap-2">
                                    <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        onClick={cancelAudioRecording}
                                        disabled={sendingMessage}
                                    >
                                        <i className="ri ri-close-line me-1"></i>
                                        İptal
                                    </Button>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={stopRecording}
                                        disabled={sendingMessage || recordingTime < 1}
                                    >
                                        <i className="ri ri-stop-circle-line me-1"></i>
                                        Durdur
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : recordedAudioUrl ? (
                        <div className="bg-primary bg-opacity-10 p-3 rounded">
                            <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center">
                                    <i className="ri ri-volume-up-line text-primary fs-4 me-3"></i>
                                    <div>
                                        <div className="fw-bold text-primary">Ses kaydı hazır</div>
                                        <div className="small text-muted">
                                            {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                                        </div>
                                    </div>
                                </div>
                                <div className="d-flex gap-2">
                                    <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        onClick={cancelAudioRecording}
                                        disabled={sendingMessage}
                                    >
                                        <i className="ri ri-close-line me-1"></i>
                                        İptal
                                    </Button>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={sendAudioMessage}
                                        disabled={sendingMessage}
                                    >
                                        <i className="ri ri-send-plane-line me-1"></i>
                                        Gönder
                                    </Button>
                                </div>
                            </div>
                            <div className="mt-2">
                                <audio
                                    controls
                                    preload="auto"
                                    className="w-100"
                                    style={{ height: '35px' }}
                                >
                                    <source src={recordedAudioUrl} type="audio/webm" />
                                    <source src={recordedAudioUrl} type="audio/ogg" />
                                    <source src={recordedAudioUrl} type="audio/mpeg" />
                                    Tarayıcınız ses dosyasını desteklemiyor.
                                </audio>
                            </div>
                        </div>
                    ) : (
                        <Form onSubmit={handleSendMessage}>
                            <div className="d-flex gap-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    multiple
                                    className="d-none"
                                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                                />

                                <Button
                                    type="button"
                                    variant="outline-secondary"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={sendingMessage}
                                    title="Dosya Ekle"
                                >
                                    <i className="ri ri-attachment-line"></i>
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline-secondary"
                                    onClick={startRecording}
                                    disabled={sendingMessage}
                                    title="Ses Kaydı"
                                >
                                    <i className="ri ri-mic-line"></i>
                                </Button>

                                <div className="flex-grow-1 position-relative">
                                    <Form.Control
                                        type="text"
                                        placeholder="Mesajınızı yazın... (@kullanıcıadı ile etiketle)"
                                        value={messageText}
                                        onChange={handleMessageInputChange}
                                        onKeyDown={handleKeyDown}
                                        disabled={sendingMessage}
                                        className="w-100"
                                    />

                                    {/* Mention Suggestions Dropdown */}
                                    {showMentionSuggestions && mentionSuggestions.length > 0 && (
                                        <div
                                            className="position-absolute bg-white border rounded shadow-sm"
                                            style={{
                                                bottom: '100%',
                                                left: '0',
                                                right: '0',
                                                zIndex: 1050,
                                                marginBottom: '5px',
                                                maxHeight: '200px',
                                                overflowY: 'auto'
                                            }}
                                        >
                                            <div className="p-2 border-bottom bg-light">
                                                <small className="text-muted">
                                                    <i className="ri ri-at-line me-1"></i>
                                                    Kullanıcı etiketle
                                                </small>
                                            </div>
                                            {mentionSuggestions.map((user, index) => (
                                                <div
                                                    key={user.id}
                                                    className="d-flex align-items-center p-2 hover-bg-light cursor-pointer border-bottom"
                                                    onClick={() => insertMention(user)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <div className="me-2">
                                                        {user.avatar ? (
                                                            <img
                                                                src={`/storage/${user.avatar}`}
                                                                alt={user.name}
                                                                className="rounded-circle"
                                                                style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                                                            />
                                                        ) : (
                                                            <div
                                                                className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white small fw-bold"
                                                                style={{ width: '32px', height: '32px' }}
                                                            >
                                                                {(user.name || 'U').charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        <div className="fw-bold small">
                                                            @{user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim()}
                                                        </div>
                                                        <div className="text-muted small">{user.email}</div>
                                                    </div>
                                                    {index === 0 && (
                                                        <div className="text-muted small">
                                                            <kbd>Enter</kbd>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={sendingMessage || (!messageText.trim() && attachments.length === 0)}
                                    title="Mesaj Gönder"
                                >
                                    {sendingMessage ? (
                                        <div className="spinner-border spinner-border-sm" role="status">
                                            <span className="visually-hidden">Gönderiliyor...</span>
                                        </div>
                                    ) : (
                                        <i className="ri ri-send-plane-line"></i>
                                    )}
                                </Button>
                            </div>
                        </Form>
                    )}
                </Card.Footer>
            </Card>

            {/* Image Modal */}
            <Modal show={showImageModal} onHide={() => setShowImageModal(false)} size="lg" centered>
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
                    <Button variant="secondary" onClick={() => setShowImageModal(false)}>
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

            {/* Üyeler Modal */}
            <Modal show={showMembersModal} onHide={() => setShowMembersModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="ri ri-team-line me-2"></i>
                        Grup Üyeleri
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {/* Add Member Section */}
                    <div className="mb-4 p-3 bg-light rounded">
                        <h6 className="mb-3">
                            <i className="ri ri-user-add-line me-2"></i>
                            Yeni Üye Ekle
                        </h6>
                        <div className="position-relative">
                            <Form.Control
                                type="text"
                                placeholder="Kullanıcı adı, email veya isim ile ara..."
                                value={searchUserQuery}
                                onChange={(e) => {
                                    const query = e.target.value;
                                    setSearchUserQuery(query);
                                    if (query.length >= 2) {
                                        searchUsers(query);
                                    } else {
                                        setSearchUserResults([]);
                                        setIsSearchingUsers(false);
                                    }
                                }}
                            />
                            {isSearchingUsers && (
                                <div className="position-absolute top-50 end-0 translate-middle-y me-3">
                                    <div className="spinner-border spinner-border-sm" role="status">
                                        <span className="visually-hidden">Aranıyor...</span>
                                    </div>
                                </div>
                            )}

                            {/* Search Results */}
                            {searchUserResults.length > 0 && (
                                <div className="position-absolute w-100 bg-white border rounded shadow-sm mt-1" style={{ zIndex: 1050 }}>
                                    <div className="p-2 border-bottom bg-light">
                                        <small className="text-muted">
                                            {searchUserResults.length} kullanıcı bulundu
                                        </small>
                                    </div>
                                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                        {searchUserResults.map((user) => (
                                            <div
                                                key={user.id}
                                                className="d-flex align-items-center p-2 hover-bg-light cursor-pointer border-bottom"
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => addMemberToGroup(user.id)}
                                            >
                                                <div className="me-2">
                                                    {user.avatar ? (
                                                        <img
                                                            src={`/storage/${user.avatar}`}
                                                            alt={user.name}
                                                            className="rounded-circle"
                                                            style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                                                        />
                                                    ) : (
                                                        <div
                                                            className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white small fw-bold"
                                                            style={{ width: '32px', height: '32px' }}
                                                        >
                                                            {(user.name || 'U').charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-grow-1">
                                                    <div className="fw-bold small">
                                                        {user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim()}
                                                    </div>
                                                    <div className="text-muted small">{user.email}</div>
                                                </div>
                                                <div className="text-primary">
                                                    <i className="ri ri-add-line"></i>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {searchUserQuery.length > 0 && searchUserResults.length === 0 && !isSearchingUsers && (
                            <div className="text-muted text-center mt-2 small">
                                <i className="ri ri-search-2-line me-1"></i>
                                Kullanıcı bulunamadı veya tüm kullanıcılar zaten üye
                            </div>
                        )}
                    </div>

                    {/* Current Members */}
                    <h6 className="mb-3">
                        <i className="ri ri-team-line me-2"></i>
                        Mevcut Üyeler ({groupMembers.length})
                    </h6>

                    {groupMembers.length > 0 ? (
                        <div className="row g-2">
                            {groupMembers.map((member) => {
                                const isCurrentUser = member.id === currentUser?.id;
                                const isAdmin = member.pivot?.is_admin;

                                return (
                                    <div key={member.id} className="col-12">
                                        <div className="d-flex align-items-center p-3 border rounded">
                                            <div className="me-3">
                                                {member.avatar ? (
                                                    <img
                                                        src={`/storage/${member.avatar}`}
                                                        alt={member.name}
                                                        className="rounded-circle"
                                                        style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    <div
                                                        className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white fw-bold"
                                                        style={{ width: '48px', height: '48px' }}
                                                    >
                                                        {(member.name || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-grow-1">
                                                <div className="fw-bold">
                                                    {member.name || `${member.first_name || ''} ${member.last_name || ''}`.trim()}
                                                    {isCurrentUser && (
                                                        <Badge bg="info" className="ms-2 small">
                                                            Ben
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="text-muted small">{member.email}</div>
                                                <div className="d-flex gap-2 mt-1">
                                                    {isAdmin && (
                                                        <Badge bg="warning" className="small">
                                                            <i className="ri ri-vip-crown-line me-1"></i>
                                                            Yönetici
                                                        </Badge>
                                                    )}
                                                    {member.pivot?.created_at && (
                                                        <small className="text-muted">
                                                            {new Date(member.pivot.created_at).toLocaleDateString('tr-TR')} tarihinde katıldı
                                                        </small>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="d-flex gap-1">
                                                {!isCurrentUser && (
                                                    <>
                                                        <Button
                                                            variant={isAdmin ? "warning" : "outline-warning"}
                                                            size="sm"
                                                            onClick={() => toggleMemberAdmin(member.id, isAdmin)}
                                                            title={isAdmin ? "Yönetici yetkisini kaldır" : "Yönetici yap"}
                                                        >
                                                            <i className="ri ri-vip-crown-line"></i>
                                                        </Button>
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={() => removeMemberFromGroup(member.id)}
                                                            title="Gruptan çıkar"
                                                        >
                                                            <i className="ri ri-user-unfollow-line"></i>
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-4 text-muted">
                            <i className="ri ri-team-line fs-1 mb-3 d-block opacity-25"></i>
                            <p>Üye bilgileri yüklenemedi.</p>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <div className="d-flex justify-content-between align-items-center w-100">
                        <small className="text-muted">
                            Toplam {groupMembers.length} üye
                        </small>
                        <Button variant="secondary" onClick={() => setShowMembersModal(false)}>
                            Kapat
                        </Button>
                    </div>
                </Modal.Footer>
            </Modal>

            {/* Bu Sohbette Ara Modal */}
            <Modal show={showAdvancedSearch} onHide={() => setShowAdvancedSearch(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="ri ri-search-line me-2"></i>
                        Bu Sohbette Ara
                        {groupInfo && (
                            <div className="small text-muted mt-1">
                                📋 {groupInfo.name}
                                <span className="badge bg-info ms-2">
                                    {chatMode === 'work-request' ? 'İş Talebi' : 'İş Grubu'}
                                </span>
                            </div>
                        )}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={(e) => { e.preventDefault(); performAdvancedSearch(); }}>
                        {/* Ana Arama */}
                        <Form.Group className="mb-3">
                            <Form.Control
                                type="text"
                                placeholder="Bu sohbette aramak istediğiniz kelime veya cümle..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                size="lg"
                            />
                        </Form.Group>

                        {/* Hızlı Filtreler */}
                        <div className="d-flex flex-wrap gap-2 mb-3">
                            <Form.Select
                                size="sm"
                                value={searchFilters.userId}
                                onChange={(e) => setSearchFilters({...searchFilters, userId: e.target.value})}
                                style={{ width: 'auto' }}
                            >
                                <option value="">👥 Tüm Üyeler</option>
                                {groupMembers.map((member) => (
                                    <option key={member.id} value={member.id}>
                                        {member.name || `${member.first_name || ''} ${member.last_name || ''}`.trim()}
                                    </option>
                                ))}
                            </Form.Select>

                            <Form.Check
                                type="switch"
                                id="quickMentions"
                                label="💬 Mention'lar"
                                checked={searchFilters.hasMentions}
                                onChange={(e) => setSearchFilters({...searchFilters, hasMentions: e.target.checked})}
                                className="me-3"
                            />

                            <Form.Check
                                type="switch"
                                id="quickAttachments"
                                label="📎 Dosyalar"
                                checked={searchFilters.hasAttachments}
                                onChange={(e) => setSearchFilters({...searchFilters, hasAttachments: e.target.checked})}
                            />
                        </div>

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
                                onClick={clearAdvancedSearch}
                                disabled={isSearching}
                            >
                                <i className="ri ri-refresh-line me-2"></i>
                                Temizle
                            </Button>
                        </div>
                    </Form>

                    {/* Arama Sonuçları */}
                    {searchResults.length > 0 && (
                        <div className="mt-3">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <small className="text-muted">
                                    <i className="ri ri-search-2-line me-1"></i>
                                    {searchResults.length} mesaj bulundu
                                </small>
                            </div>
                            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                {searchResults.map((message) => (
                                    <div
                                        key={message.id}
                                        className="d-flex align-items-start p-2 border-bottom hover-bg-light cursor-pointer"
                                        onClick={() => jumpToMessage(message.id)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="me-2 flex-shrink-0">
                                            {message.user?.avatar ? (
                                                <img
                                                    src={`/storage/${message.user.avatar}`}
                                                    alt={message.user.name}
                                                    className="rounded-circle"
                                                    style={{ width: '24px', height: '24px', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div
                                                    className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white small fw-bold"
                                                    style={{ width: '24px', height: '24px', fontSize: '10px' }}
                                                >
                                                    {(message.user?.name || 'U').charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-grow-1 min-w-0">
                                            <div className="d-flex align-items-center gap-2 mb-1">
                                                <small className="fw-bold text-primary">{message.user?.name}</small>
                                                <small className="text-muted">
                                                    {new Date(message.created_at).toLocaleString('tr-TR', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </small>
                                                {message.mentions && message.mentions.length > 0 && (
                                                    <i className="ri ri-at-line text-info" title="Mention içeriyor"></i>
                                                )}
                                                {message.attachments && message.attachments.length > 0 && (
                                                    <i className="ri ri-attachment-line text-secondary" title="Dosya içeriyor"></i>
                                                )}
                                            </div>
                                            <div className="small text-truncate" style={{ maxWidth: '100%' }}>
                                                <span
                                                    dangerouslySetInnerHTML={{
                                                        __html: highlightMentions(message.content || '', message.mentions)
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="ms-2 flex-shrink-0">
                                            <i className="ri ri-arrow-right-s-line text-muted"></i>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {searchResults.length === 0 && (searchQuery || hasAnyFilter()) && !isSearching && (
                        <div className="text-center mt-4 text-muted">
                            <i className="ri ri-search-2-line fs-1 mb-3 d-block"></i>
                            <p>Arama kriterlerinize uygun mesaj bulunamadı.</p>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAdvancedSearch(false)}>
                        Kapat
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default ChatArea;
