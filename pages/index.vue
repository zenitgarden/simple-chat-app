<script setup lang="ts">
import type { AvatarProps, DropdownMenuItem } from '@nuxt/ui';
import { useConversationId } from '~/composables/useConversationId';
import type { ChatRow, LatestConversation, Message, ResponseSuccess, User } from '~/types/global';
import { useDebounceFn } from '@vueuse/core'
import { groupSchema as groupChatSchema, privateSchema as privateChatSchema } from '~/schemas/chat.schema';
import { useChatRows } from '~/composables/chat'

const { connect, messages, send, disconnect } = useWebSocket()
const { user, clear: clearSession } = useUserSession()
const conversationId = useConversationId()
const toast = useToast()
const config = useRuntimeConfig()
const chatRows = useChatRows()

const userData = user.value as User
const api = `${config.public.apiBase}`
const wsUrl = `${config.public.wsBase}/ws?token=` + userData.token

const modal = ref(false)
const options = ref<{ label: string, value: string, avatar: AvatarProps }[]>([])
const isLoading = ref(false)
const searchTerm = ref('')
const selectedUser = ref<{ label: string, value: string, avatar: AvatarProps } | null>(null)
const loading = ref(false)

const newConversation = reactive<{
    title: string | undefined,
    isGroup: boolean,
    userId: string | undefined,
    userName: string | undefined,
    selectedChat: string,
}>({
    title: undefined,
    isGroup: false,
    userId: undefined,
    userName: undefined,
    selectedChat: '',
})

const items = ref<DropdownMenuItem[]>([
    {
        label: 'Logout',
        icon: 'ion:log-out-outline',
        color: 'error',
        onClick: () => logout(),
    },
])

async function logout() {
    disconnect()
    await clearSession()
    await navigateTo('/login')
}


onMounted(async () => {
    connect(wsUrl)
    isLoading.value = true
    try {

        const [chats, conversationsLatest] = await Promise.all([
            fetch(api + '/api/conversations', {
                headers: {
                    'Authorization': `Bearer ${userData.token}`,
                    'Content-Type': 'application/json'
                }
            }),
            fetch(api + '/api/conversations/latest', {
                headers: {
                    'Authorization': `Bearer ${userData.token}`,
                    'Content-Type': 'application/json'
                }
            })
        ])

        if (!chats.ok || !conversationsLatest.ok) {
            throw new Error(`Fetch error: ${chats.status}`)
        }


        const [chatsJson, conversationsLatestJson]: [ResponseSuccess<ChatRow[]>, ResponseSuccess<LatestConversation>] = await Promise.all([
            chats.json(),
            conversationsLatest.json()
        ])

        if (!chatsJson || !conversationsLatestJson) {
            throw new Error('No data')
        }

        if (chatsJson.data.length) {
            chatRows.value = chatsJson.data
        }

        if (conversationsLatestJson.data !== null) {
            messages.value = conversationsLatestJson.data.messages.map((message) => ({
                content: message.content,
                userId: message.sender_id,
                userName: message.sender_name,
                time: message.sent_at
            }))
            conversationId.value = conversationsLatestJson.data.conversation_id
            conversationId.value = conversationsLatestJson.data.conversation_id
        }
    } catch {
        toast.add({ title: 'Something went wrong !', description: 'Please try again later.', color: 'error' })
        isLoading.value = false
    } finally {
        isLoading.value = false
    }
})

const fetchUsers = useDebounceFn(async (search: string = '') => {
    try {
        const users = await fetch(api + '/api/users?limit=20&name=' + (search.length > 0 ? search.toLowerCase() : ''), {
            headers: {
                'Authorization': `Bearer ${userData.token}`,
                'Content-Type': 'application/json'
            }
        })


        if (!users.ok) {
            throw new Error(`Fetch error: ${users.status}`)
        }

        const userJson = await users.json() as ResponseSuccess<{ id: string, name: string }[]>
        options.value = userJson.data.map((user) => ({
            label: user.name, value: user.id, avatar: {
                alt: user.name,
            }
        }))
    } catch {
        toast.add({ title: 'Something went wrong !', description: 'Please try again later.', color: 'error' })
    }
}, 500)

async function openChat(id: string) {
    try {
        const res: ResponseSuccess<{
            id: string;
            conversationId: string;
            senderId: string;
            senderName: string;
            content: string;
            sentAt: string
        }[]> = await $fetch(api + '/api/conversations/' + id + '/messages?limit=20', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${userData.token}`,
                'Content-Type': 'application/json'
            },
        })
        conversationId.value = id

        if (res.data.length > 0) {
            const msgs = res.data.map((message) => ({
                userId: message.senderId,
                userName: message.senderName,
                content: message.content,
                time: message.sentAt,
            }))
            messages.value = msgs
            return
        }

        messages.value = []
    } catch {
        toast.add({ title: 'Failed to open chat !', description: 'Please try again later.', color: 'error' })
    }
}


function addOldMessages(oldMessages: Message[]) {
    messages.value = [...messages.value, ...oldMessages]
}

function startNewChat() {
    modal.value = true
}

function onUserSelect(user: { label: string, value: string, avatar: AvatarProps }) {
    selectedUser.value = user
    newConversation.userName = user.label
    newConversation.userId = user.value
    newConversation.title = user.label
}

async function createNewConversation() {
    loading.value = true;
    try {
        const body = {
            title: newConversation.title,
            isGroup: newConversation.isGroup,
            userId: newConversation.userId
        }

        if (body.isGroup) {
            delete body.userId
        }

        const res: ResponseSuccess<{ id: string; title: string; isGroup: boolean}> = await $fetch(api + '/api/conversations', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${userData.token}`,
                'Content-Type': 'application/json'
            },
            body,
        })

        chatRows.value.unshift({
            id: res.data.id,
            isGroup: body.isGroup,
            lastMessage: '',
            sentAt: '',
            title: body.isGroup ? body.title || '' : (newConversation.userName || ''),
            createdBy: userData.id
        })
        conversationId.value = res.data.id
    } catch {
        toast.add({ title: 'Failed start new chat !', description: 'Please try again later.', color: 'error' })
    } finally {
        loading.value = false
        modal.value = false
    }
}

watch(searchTerm, async (term) => {
    if (!term) return
    fetchUsers(term)
})

watch(newConversation, () => {
    if (newConversation.selectedChat === 'private_chat') {
        fetchUsers()
    }
})

watch(modal, (open) => {
    if (!open) {
        selectedUser.value = null
        searchTerm.value = ''
        newConversation.selectedChat = ''
        newConversation.title = undefined
        newConversation.isGroup = false
        newConversation.userId = undefined
        newConversation.userName = undefined
    }
}, { immediate: true })
</script>

<template>
    <div class="h-screen flex relative">
        <UModal v-model:open="modal" :dismissible="false" title="Start a new chat" description=" ">
            <template #body>
                <UForm :state="newConversation"
                    :schema="newConversation.selectedChat === 'private_chat' ? privateChatSchema : groupChatSchema"
                    class="flex flex-col text-center gap-2" @submit="createNewConversation">
                    <div v-if="!newConversation.selectedChat" class="flex justify-between gap-4">
                        <button
                            class="px-4 w-full py-2 bg-teal-200 text-teal-700 font-semibold rounded-md hover:bg-teal-300 transition cursor-pointer shadow hover:scale-105 active:scale-95"
                            @click="() => newConversation.selectedChat = 'private_chat'">
                            Private Chat ?
                        </button>
                        <button
                            class="px-4  w-full py-2 bg-blue-200 text-blue-700 font-semibold rounded-md hover:bg-blue-300 transition cursor-pointer shadow hover:scale-105 active:scale-95"
                            @click="() => { newConversation.selectedChat = 'group_chat', newConversation.isGroup = true }">Group
                            Chat ?
                        </button>
                    </div>
                    <UFormField v-if="newConversation.selectedChat === 'private_chat'" name="userId">
                        <USelectMenu v-model:search-term="searchTerm" :items="options" icon="i-lucide-user"
                            placeholder="Select user" class="w-full" size="xl" name="userId"
                            @update:model-value="onUserSelect" />
                    </UFormField>

                    <UFormField v-if="newConversation.selectedChat === 'group_chat'" label="Group Name" name="title">
                        <UInput v-model="newConversation.title" placeholder="Group Name" class="w-full mt-2" size="xl"
                            variant="soft" />
                    </UFormField>
                    <UButton v-if="newConversation.selectedChat"
                        class="mt-4 px-4 py-2 bg-teal-200 text-teal-700 font-semibold rounded-md hover:bg-teal-300 transition cursor-pointer shadow hover:scale-105 active:scale-95 justify-center"
                        :label="newConversation.selectedChat === 'private_chat' ? 'Start Private Chat' : 'Start Group Chat'"
                        :disabled="loading" :loading="loading" type="submit" size="xl" />
                </UForm>
            </template>
        </UModal>

        <div class="flex justify-between flex-col pl-4 py-8">
            <UDropdownMenu :items="items" :content="{
                align: 'start',
                side: 'bottom',
                sideOffset: 8
            }" :ui="{
                content: 'w-36'
            }">
                <div class="pr-4 group">
                    <div
                        class="rounded-lg border border-gray-200 flex justify-center items-center p-2 hover:scale-105 active:scale-95 duration-300 transition-all ">
                        <Icon name="lucide:settings-2" size="30" style="color: oklch(60% 0.118 184.704)"
                            class="group-hover:rotate-90 transition-all duration-150" />
                    </div>
                </div>
            </UDropdownMenu>

            <div class="pr-4 border-r-3 border-teal-500">
                <div class="rounded-lg bg-teal-300 flex justify-center items-center p-2">
                    <Icon name="fluent:people-12-filled" size="30" style="color: white" />
                </div>
            </div>
            <div class="pr-4 ">
                <div class="flex justify-center items-center p-2">
                    <NuxtImg src="/message_7699178.png" alt="Chample" width="30" height="30" />
                </div>
            </div>
        </div>

        <div class="rounded-bl-4xl rounded-tl-4xl shadow-lg border border-gray-100 w-full flex">
            <div class="max-w-sm w-full mx-6 flex flex-col gap-6 h-full">
                <div class="py-8 border-b-2 border-gray-200">
                    <p class="text-3xl font-bold">Hello {{ userData.name }},</p>
                    <p class="text-sm">Welcome to Chample</p>
                </div>

                <!-- Search -->
                <div class="">
                    <UInput icon="i-lucide-search" class="w-full" size="xl" variant="soft" placeholder="Search"
                        :ui="{ base: 'rounded-lg bg-slate-100 w-full py-3' }" />
                </div>

                <!-- Last Message & Add Button -->
                <div class="flex justify-between items-center">
                    <p class="text-sm font-semibold">Last Message</p>
                    <UTooltip text="Add">
                        <div class="bg-teal-100 flex items-center justify-center w-8 h-8 rounded-md shadow-teal-500 shadow group hover:scale-105 hover:bg-teal-700 active:scale-95 transition-all duration-300"
                            @click="startNewChat">
                            <Icon name="lucide:plus" size="20"
                                class="group-hover:text-white group-hover:scale-110 text-teal-600 transition-all duration-150" />
                        </div>
                    </UTooltip>
                </div>

                <!-- Chats -->
                <div class="flex flex-col h-full overflow-y-auto">
                    <div v-if="chatRows.length === 0"
                        class="flex flex-col items-center justify-center h-full text-gray-500 text-center py-10 px-4 space-y-2">
                        <h3 class="text-lg font-semibold">No conversations yet</h3>
                        <p class="text-sm text-gray-400">Start a new chat to see it listed here.</p>
                        <button
                            class="mt-4 px-4 py-2 bg-teal-200 text-teal-700 font-semibold rounded-md hover:bg-teal-300 transition cursor-pointer shadow hover:scale-105 active:scale-95"
                            @click="startNewChat">
                            Start New Chat
                        </button>
                    </div>

                    <ChatRow v-for="chat in chatRows" :id="chat.id" :key="chat.id" :name="chat.title" :is-group="chat.isGroup" :created-by="chat.createdBy"
                        :conversation-id="conversationId" :last-message="chat.lastMessage" :time="chat.sentAt !== null ? chat.sentAt : ''"
                        @click="openChat(chat.id)" />
                </div>
            </div>

            <div class=" bg-gray-100 w-full my-4 rounded-xl">
                <ChatContainer :messages="messages" :user="userData" :send="send" @load-old="addOldMessages" />
            </div>

            <div class=" bg-amber-100 max-w-sm w-full my-4 rounded-xl">

            </div>
        </div>


    </div>
</template>
