<script setup lang="ts">
import { useDate } from '~/composables/date';
import type { User } from '~/types/global';

const props = defineProps<{
    id: string
    name: string
    lastMessage: string
    time: string
    conversationId: string
    isGroup: boolean
    createdBy: string
    typingMessage: string
}>()

const { formatChatRow } = useDate()
const { user } = useUserSession()
const userData = user.value as User

const lastMessage = () => {
    if (props.lastMessage.length === 0 && !props.isGroup) {
        if (props.createdBy === userData.id) {
            return 'Lets start a conversation'
        } else {
            return props.name + ' is trying to reach you'
        }
    }

    if (props.lastMessage.length === 0 && props.isGroup) {
         return 'Lets start a conversation'
    }

    return props.lastMessage
}

</script>


<template>
    <div
        :class="['flex items-center gap-3 p-4 hover:bg-gray-100 rounded-xl cursor-pointer transition', conversationId === id ? 'bg-gray-100' : '']">
        <!-- Avatar -->
        <UAvatar :alt="name" size="xl" class="bg-teal-100 border border-teal-300" />

        <!-- Message Preview -->
        <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
                <p class="font-medium text-gray-900 truncate">{{ name }}</p>
                <span class="text-xs text-gray-400 whitespace-nowrap">
                    {{ time.length > 0 ? formatChatRow(time) : '' }}
                </span>
            </div>
            <p :class="['text-sm truncate text-gray-500', typingMessage.length > 0 ? 'font-semibold text-teal-500' : '']">{{ typingMessage.length > 0 ? typingMessage : lastMessage() }}</p>
        </div>
    </div>
</template>
