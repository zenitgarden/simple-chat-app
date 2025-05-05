<script setup lang="ts">
import type { Message, ResponseSuccess } from '~/types/global';
import type { User } from '../types/global';
import { useDate } from '~/composables/date';
import { useChatRows } from '~/composables/chat';

const props = defineProps<{
    send: (msg: { content: string, type: string }) => void
    user: User
    messages: Message[]
}>()

const emit = defineEmits(['load-old'])
const conversationId = useConversationId()
const chatRows = useChatRows()

const config = useRuntimeConfig()
const api = `${config.public.apiBase}`
const toast = useToast()


const message = ref('')
const textarea = ref(null)
const { formatDate, formatSentAt } = useDate()
const page = ref(1)
const reachedEnd = ref(false)

function handleSubmit() {
    if (!message.value.trim()) return
    const content = message.value
    props.send({
        content,
        type: 'message',
    })
    chatRows.value.forEach((row) => {
        if (row.id === conversationId.value) {
            row.lastMessage = content
            return
        }
    })

    message.value = ''
    resizeTextarea()
}

// Auto-resize logic
const resizeTextarea = () => {
    const el = textarea.value as unknown as HTMLTextAreaElement
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
}

const reversedMessages = computed(() => {
    const reveresed = props.messages.slice().reverse()

    const groups: Record<string, Message[]> = {}

    for (const message of reveresed) {
        const label = formatSentAt(message.time)
        if (!groups[label]) groups[label] = []
        groups[label].push(message)
    }

    return Object.entries(groups)
})

const chatContainer = ref<HTMLElement | null>(null)
const isLoading = ref(false)

async function fetchOlderMessages() {
    try {
        const queryParams = new URLSearchParams({
            page: (page.value + 1).toString(),
            limit: '20'
        }).toString();

        const res = await fetch(`${api}/api/conversations/${conversationId.value}/messages?${queryParams}`, {
            headers: {
                'Authorization': `Bearer ${props.user.token}`,
                'Content-Type': 'application/json'
            }
        })

        if (!res.ok) {
            throw new Error(`Fetch error: ${res.status}`)
        }
        const resJson = await res.json() as ResponseSuccess<{
            id: string;
            conversationId: string;
            senderId: string;
            senderName: string;
            content: string;
            sentAt: string
        }[]>
        const oldMessages = resJson.data.map((message) => ({
            userId: message.senderId,
            userName: message.senderName,
            content: message.content,
            time: message.sentAt,
        }))
        emit('load-old', oldMessages)
        page.value++
        if (resJson.data.length < 20) {
            reachedEnd.value = true
        }
    } catch {
        toast.add({ title: 'Failed to getting messages !', description: 'Please try again later.', color: 'error' })
    }

}

const handleScroll = async () => {
    if (!chatContainer.value || isLoading.value) return
    if (page.value === 1 && props.messages.length < 20) return
    if (reachedEnd.value) return

    if (chatContainer.value.scrollTop === 0) {
        isLoading.value = true

        const previousHeight = chatContainer.value.scrollHeight

        await fetchOlderMessages()
        await nextTick()

        const newHeight = chatContainer.value.scrollHeight
        chatContainer.value.scrollTop = newHeight - previousHeight

        isLoading.value = false
    }
}

watch(
    () => props.messages.length,
    async () => {
        await nextTick()
        chatContainer.value?.scrollTo({
            top: chatContainer.value.scrollHeight,
            behavior: 'auto',
        })
    },
    { immediate: true }
)

onMounted(() => {
    resizeTextarea()
})

</script>

<template>
    <div class="flex flex-col h-full w-full rounded-lg shadow bg-slate-100 justify-between">
        <!-- Chat Messages -->

        <div v-if="messages.length === 0" class="flex h-full justify-center items-center py-2">
                <div class="flex flex-col items-center justify-center text-center text-gray-500 py-16 space-y-4">
                    <div class="bg-blue-100 text-blue-500 rounded-full p-4">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8-1.657 0-3.204-.402-4.5-1.086L3 20l1.308-3.924C3.478 15.083 3 13.578 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold">Start chatting</h3>
                    <p class="text-sm text-gray-400">
                        Your messages will appear here.
                    </p>
                </div>
            </div>
        <div ref="chatContainer" class="flex flex-col p-6 overflow-y-auto space-y-6" @scroll="handleScroll">
            <div v-if="isLoading" class="flex justify-center items-center py-2">
                <svg class="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none"
                    viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                </svg>
            </div>


            <div v-for="([label, group]) in reversedMessages" :key="label" class="flex flex-col space-y-3">

                <!-- Group label -->
                <div class="text-center text-xs text-gray-500 font-medium my-2">
                    <p class="bg-white  inline-block px-4 py-2 rounded-full shadow">{{ label }}</p>
                </div>

                <!-- Messages in this group -->
                <div v-for="(m, index) in group" :key="index"
                    :class="['flex flex-col w-auto', m.userId === user.id ? 'items-end' : 'items-start']">

                    <div class="flex items-center gap-1 mb-2">
                        <p class="text-sm font-semibold">{{ m.userId === user.id ? 'You' : m.userName }},</p>
                        <p class="text-xs text-gray-400 whitespace-nowrap">
                            {{ formatDate(m.time) }}
                        </p>
                    </div>

                    <div :class="[
                        'relative inline-block px-4 py-3 rounded-xl text-sm max-w-[60%]',
                        m.userId === user.id ? 'bg-slate-200 text-black' : 'bg-white text-gray-800'
                    ]">
                        {{ m.content }}
                        <div v-if="m.userId !== user.id"
                            class="absolute -left-2 top-3 w-0 h-0 border-t-[10px] border-t-transparent border-r-[12px] border-r-white border-b-[10px] border-b-transparent"/>
                        <div v-else
                            class="absolute -right-2 top-3 w-0 h-0 border-t-[10px] border-t-transparent border-l-[12px] border-l-slate-200 border-b-[10px] border-b-transparent"/>
                    </div>

                </div>
            </div>
        </div>


        <div class="flex items-center bg-white p-2 rounded-lg shadow-md mx-6 my-6">

            <textarea ref="textarea" v-model="message" rows="1"
                class="w-full resize-none max-h-40 overflow-auto border-none focus:ring-0 rounded-lg px-4 text-sm leading-tight outline-none"
                placeholder="Write your message..." @input="resizeTextarea" />


            <UButton type="button" variant="solid" size="md" class="rounded-md p-3 ml-2 bg-teal-400 hover:bg-teal-500"
                icon="i-heroicons-paper-airplane-20-solid" @click="handleSubmit" />
        </div>

    </div>
</template>