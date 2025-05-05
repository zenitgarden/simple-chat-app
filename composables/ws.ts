// composables/useWebSocket.ts
import { ref } from 'vue'
import type { Message, WsMessage } from '~/types/global'
import { useConversationId } from './useConversationId'
import { useChatRows } from '~/composables/chat';

export const useWebSocket = () => {
  const socket = ref<WebSocket | null>(null)
  const messages = ref<Message[]>([])
  const conversationId = useConversationId()
  const chatRows = useChatRows()

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

      if (data.conversationId === conversationId.value) {
        messages.value.unshift({
          content: data.content,
          time: data.time,
          userId: data.userId,
          userName: data.userName,
        })
      }

      chatRows.value.forEach((row) => {
        if (row.id === conversationId.value) {
          row.lastMessage = data.content
          return
        }
      })

      console.log('Received:', event.data)
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
