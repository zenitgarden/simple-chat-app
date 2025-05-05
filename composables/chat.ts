import type { ChatRow } from '~/types/global';

export const useChatRows = () => useState<ChatRow[]>('chatRows', () => []);