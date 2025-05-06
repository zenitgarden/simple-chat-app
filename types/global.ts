export interface User {
    id: string;
    name: string;
    token: string;
}

export interface ResponseSuccess<T> {
    statusCode: number
    message: string
    data: T
    totalData: number,
    pagination?: {
        page: number
        limit: number
    }
}

export interface Message {
    userId: string;
    userName: string;
    content: string,
    time: string
}

export interface ChatRow {
    id: string;
    title: string;
    isGroup: boolean;
    lastMessage: string;
    sentAt: string | null;
    createdBy: string;
}

export interface LatestConversation {
    conversation_id: string;
    title: string;
    is_group: string;
    messages: {
        content: string;
        sent_at: string;
        sender_id: string;
        sender_name: string;
    }[]
    participants: {
        user_id: string;
        user_name: string;  
    }[]
}

export interface WsMessage {
    userId: string;
    userName: string;
    time: string;
    conversationId: string;
    content: string,
    type: string
}