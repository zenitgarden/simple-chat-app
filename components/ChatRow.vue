<script setup lang="ts">
import { useDate } from '~/composables/date';

defineProps<{
    id: string
    name: string
    lastMessage: string
    time: string
    conversationId: string
}>()

const { formatDate } = useDate()
</script>


<template>
    <div :class="['flex items-center gap-3 p-4 hover:bg-gray-100 rounded-xl cursor-pointer transition', conversationId === id ? 'bg-gray-100' : '']">
        <!-- Avatar -->
        <UAvatar :alt="name" size="xl" class="bg-teal-100 border border-teal-300" />

        <!-- Message Preview -->
        <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
                <p class="font-medium text-gray-900 truncate">{{ name }}</p>
                <span class="text-xs text-gray-400 whitespace-nowrap">
            {{ time.length > 0 ? formatDate(time) : '' }}
        </span>
            </div>
            <p :class="['text-sm truncate', lastMessage.length === 0 ? 'text-gray-400 italic' : 'text-gray-500']">{{ lastMessage.length === 0 ? 'Lets start a conversation' : lastMessage }}</p>
        </div>
    </div>
</template>
