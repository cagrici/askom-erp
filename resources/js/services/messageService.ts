import axios from 'axios';

export const messageService = {
    getGroups: () => {
        return axios.get('/api/messages/groups');
    },

    getGroupMessages: (groupId: number) => {
        return axios.get(`/api/messages/groups/${groupId}/messages`);
    },

    sendMessage: (data: {
        groupId: number;
        content: string;
        parentId?: number;
        attachments?: File[];
    }) => {
        const formData = new FormData();
        formData.append('message_group_id', data.groupId.toString());
        formData.append('content', data.content);
        
        if (data.parentId) {
            formData.append('parent_id', data.parentId.toString());
        }
        
        if (data.attachments) {
            data.attachments.forEach((file, index) => {
                formData.append(`attachments[${index}]`, file);
            });
        }

        return axios.post('/api/messages', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    updateMessage: (messageId: number, content: string) => {
        return axios.put(`/api/messages/${messageId}`, { content });
    },

    deleteMessage: (messageId: number) => {
        return axios.delete(`/api/messages/${messageId}`);
    },

    createGroup: (data: {
        name: string;
        type: 'department' | 'private' | 'project';
        description?: string;
        department_id?: number;
        participant_ids?: number[];
    }) => {
        return axios.post('/api/messages/groups', data);
    },

    markAsRead: (groupId: number) => {
        return axios.post(`/api/messages/groups/${groupId}/read`);
    },
};