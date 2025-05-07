// composables/useWebSocket.ts
import { ref } from 'vue'
import type { Message, User, WsMessage } from '~/types/global'
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
        addTypingMessage(data.conversationId, data.userName)
        addChatTypingMessage(data.conversationId)
        return;
      }

      if (data.type === 'stop_typing' && data.userId !== userData.id && data.conversationId === conversationId.value) {
        resetTypingMessage()
        resetChatTypingMessage(data.conversationId)
        return;
      }

      const isConversationExist = chatRows.value.find((row) => row.id === data.conversationId)

      if (data.conversationId === conversationId.value) {
        resetTypingMessage()
        messages.value.unshift({
          content: data.content,
          time: data.time,
          userId: data.userId,
          userName: data.userName,
        })
      }

      if (userData.id != data.userId && data.type === 'message' && !isConversationExist) {
        $fetch<{ title: string; isGroup: boolean }>(api + '/api/conversation/' + data.conversationId, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${userData.token}`,
            'Content-Type': 'application/json'
          },
        }).then((res) => {
          chatRows.value.unshift({
            id: data.conversationId,
            title: res.title,
            isGroup: res.isGroup,
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
          resetTypingMessage()
          resetChatTypingMessage(data.conversationId)
        }

        if (data.type === 'typing') {
          addTypingMessage(data.conversationId, data.userName)
          addChatTypingMessage(data.conversationId)
        }

        return
      }


      chatRows.value.forEach((row) => {
        if (row.id === data.conversationId) {
          row.lastMessage = data.content
          return
        }
      })
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
