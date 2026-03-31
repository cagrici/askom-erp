import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { messageService } from '@/services/messageService';

interface User {
    id: number;
    name: string;
    email: string;
}

interface MessageAttachment {
    id: number;
    filename: string;
    original_name: string;
    mime_type: string;
    size: number;
    path: string;
}

interface Message {
    id: number;
    message_group_id: number;
    user_id: number;
    user: User;
    content: string;
    type: 'text' | 'file' | 'image' | 'task';
    metadata?: any;
    parent_id?: number;
    parent?: Message;
    task_id?: number;
    is_edited: boolean;
    edited_at?: string;
    created_at: string;
    attachments: MessageAttachment[];
}

interface MessageGroup {
    id: number;
    name: string;
    type: 'department' | 'private' | 'project';
    department?: any;
    unread_count: number;
    latest_message?: Message;
}

interface MessageState {
    groups: MessageGroup[];
    activeGroupId: number | null;
    messages: Record<number, Message[]>;
    loading: boolean;
    sendingMessage: boolean;
    error: string | null;
}

const initialState: MessageState = {
    groups: [],
    activeGroupId: null,
    messages: {},
    loading: false,
    sendingMessage: false,
    error: null,
};

export const fetchMessageGroups = createAsyncThunk(
    'messages/fetchGroups',
    async () => {
        const response = await messageService.getGroups();
        return response.data.groups;
    }
);

export const fetchGroupMessages = createAsyncThunk(
    'messages/fetchGroupMessages',
    async (groupId: number) => {
        const response = await messageService.getGroupMessages(groupId);
        return { groupId, messages: response.data.data };
    }
);

export const sendMessage = createAsyncThunk(
    'messages/sendMessage',
    async (data: { groupId: number; content: string; parentId?: number; attachments?: File[] }) => {
        const response = await messageService.sendMessage(data);
        return response.data;
    }
);

export const createMessageGroup = createAsyncThunk(
    'messages/createGroup',
    async (data: {
        name: string;
        type: 'department' | 'private' | 'project';
        description?: string;
        department_id?: number;
        participant_ids?: number[];
    }) => {
        const response = await messageService.createGroup(data);
        return response.data;
    }
);

const messageSlice = createSlice({
    name: 'messages',
    initialState,
    reducers: {
        setActiveGroup: (state, action: PayloadAction<number | null>) => {
            state.activeGroupId = action.payload;
        },
        addMessage: (state, action: PayloadAction<Message>) => {
            const groupId = action.payload.message_group_id;
            if (!state.messages[groupId]) {
                state.messages[groupId] = [];
            }
            state.messages[groupId].unshift(action.payload);
            
            // Update latest message in groups
            const groupIndex = state.groups.findIndex(g => g.id === groupId);
            if (groupIndex !== -1) {
                state.groups[groupIndex].latest_message = action.payload;
            }
        },
        updateMessage: (state, action: PayloadAction<Message>) => {
            const groupId = action.payload.message_group_id;
            if (state.messages[groupId]) {
                const messageIndex = state.messages[groupId].findIndex(m => m.id === action.payload.id);
                if (messageIndex !== -1) {
                    state.messages[groupId][messageIndex] = action.payload;
                }
            }
        },
        deleteMessage: (state, action: PayloadAction<{ groupId: number; messageId: number }>) => {
            const { groupId, messageId } = action.payload;
            if (state.messages[groupId]) {
                state.messages[groupId] = state.messages[groupId].filter(m => m.id !== messageId);
            }
        },
        incrementUnreadCount: (state, action: PayloadAction<number>) => {
            const groupIndex = state.groups.findIndex(g => g.id === action.payload);
            if (groupIndex !== -1) {
                state.groups[groupIndex].unread_count++;
            }
        },
        resetUnreadCount: (state, action: PayloadAction<number>) => {
            const groupIndex = state.groups.findIndex(g => g.id === action.payload);
            if (groupIndex !== -1) {
                state.groups[groupIndex].unread_count = 0;
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchMessageGroups.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMessageGroups.fulfilled, (state, action) => {
                state.loading = false;
                state.groups = action.payload;
            })
            .addCase(fetchMessageGroups.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch groups';
            })
            .addCase(fetchGroupMessages.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchGroupMessages.fulfilled, (state, action) => {
                state.loading = false;
                state.messages[action.payload.groupId] = action.payload.messages;
                state.resetUnreadCount(action.payload.groupId);
            })
            .addCase(sendMessage.pending, (state) => {
                state.sendingMessage = true;
            })
            .addCase(sendMessage.fulfilled, (state, action) => {
                state.sendingMessage = false;
                state.addMessage(action.payload);
            })
            .addCase(sendMessage.rejected, (state) => {
                state.sendingMessage = false;
            })
            .addCase(createMessageGroup.fulfilled, (state, action) => {
                state.groups.unshift(action.payload);
            });
    },
});

export const {
    setActiveGroup,
    addMessage,
    updateMessage,
    deleteMessage,
    incrementUnreadCount,
    resetUnreadCount,
} = messageSlice.actions;

export default messageSlice.reducer;