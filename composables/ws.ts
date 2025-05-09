// composables/useWebSocket.ts
import { ref } from 'vue'
import type { Message, ResponseSuccess, User, WsMessage } from '~/types/global'
import { useConversationId } from './useConversationId'
import { useChatRows } from '~/composables/chat';

export const useWebSocket = () => {
  const socket = ref<WebSocket | null>(null)
  const messages = ref<Message[]>([])
  const conversationId = useConversationId()
  const chatRows = useChatRows()
  const { user } = useUserSession()
  const userData = user.value as User
  const config = useRuntimeConfig()
  const api = `${config.public.apiBase}`

  const connect = (url: string) => {
    socket.value = new WebSocket(url)

    socket.value.onopen = () => {
      console.log('WebSocket connected')
    }

    socket.value.onmessage = (event) => {
      const data = JSON.parse(event.data) as WsMessage
      if (!event.data) {
        return
      }


      if (data.type === 'typing' && data.userId !== userData.id && data.conversationId === conversationId.value) {
        addChatTypingMessage(data.conversationId, data.userName)
        return;
      }

      if (data.type === 'stop_typing' && data.userId !== userData.id && data.conversationId === conversationId.value) {
        resetChatTypingMessage(data.conversationId)
        return;
      }

      const isConversationExist = chatRows.value.find((row) => row.id === data.conversationId)

      if (data.conversationId === conversationId.value) {
        messages.value.unshift({
          content: data.content,
          time: data.time,
          userId: data.userId,
          userName: data.userName,
        })
      }

      if (userData.id != data.userId && data.type === 'message' && !isConversationExist) {
        $fetch<ResponseSuccess<{ title: string; isGroup: boolean }>>(api + '/api/conversations/' + data.conversationId, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${userData.token}`,
            'Content-Type': 'application/json'
          },
        }).then((res) => {
          const { title, isGroup } = res.data;
          chatRows.value.unshift({
            id: data.conversationId,
            title: title,
            isGroup: isGroup,
            lastMessage: data.content,
            sentAt: data.time,
            createdBy: data.userId,
            typingMessage: ''
          })
        }).catch(() => {
          chatRows.value.unshift({
            id: data.conversationId,
            title: data.userName,
            isGroup: false,
            lastMessage: data.content,
            sentAt: data.time,
            createdBy: data.userId,
            typingMessage: ''
          })
        })
      }

      if (data.type === 'typing' || data.type === 'stop_typing' && data.conversationId !== conversationId.value) {
        if (data.type === 'stop_typing') {
          resetChatTypingMessage(data.conversationId)
        }

        if (data.type === 'typing') {
          addChatTypingMessage(data.conversationId, data.userName)
        }

        return
      }


      chatRows.value = chatRows.value
      .map((row) => {
        if (row.id === data.conversationId) {
          return {
            ...row,
            lastMessage: data.content,
            sentAt: data.time,
          }
        }
        return row
      })
      .sort((a, b) => (b.sentAt ?? '').localeCompare(a.sentAt ?? ''))
    }

    socket.value.onclose = () => {
      console.log('WebSocket disconnected')
    }

    socket.value.onerror = (err) => {
      console.error('WebSocket error', err)
    }
  }

  const send = (msgFormat: { content: string; type: string; conversationId?: string }) => {
    if (conversationId.value === '') {
      return
    }

    msgFormat.conversationId = conversationId.value
    socket.value?.send(JSON.stringify(msgFormat))
  }

  const getSocket = () => {
    return socket.value
  }

  const disconnect = () => {
    socket.value?.close()
  }

  return { connect, send, disconnect, messages, socket, getSocket }
}
