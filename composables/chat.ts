import type { ChatRow } from '~/types/global';

export const useChatRows = () => useState<ChatRow[]>('chatRows', () => []);

export const addChatTypingMessage = (id: string, userName: string) => {
    const chatRows = useChatRows()
    chatRows.value = chatRows.value.map((row) => {
        if (row.id === id) {
            row.typingMessage = userName + ' is typing...'
        }
        return row
    })
}

export const resetChatTypingMessage = (id: string) => {
    const chatRows = useChatRows()
    chatRows.value = chatRows.value.map((row) => {
        if (row.id === id) {
            row.typingMessage = ''
        }
        return row
    })
}