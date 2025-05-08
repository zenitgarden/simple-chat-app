<script setup lang="ts">
import type { User } from '~/types/global'
import { useDebounceFn } from '@vueuse/core'

const page = ref(1)
const title = ref('')
const debouncedTitle = ref('')

const { user } = useUserSession()
const config = useRuntimeConfig()
const api = `${config.public.apiBase}`

const userData = user.value as User

const query = computed(() => ({
    page: page.value,
    title: debouncedTitle.value
}))


watch(
    title,
    useDebounceFn((val: string) => {
        debouncedTitle.value = val
    }, 500) // debounce delay in ms
)

const { data: conversations } = await useFetch<{ data: { id: string; title: string; total_people: number }[] }>(api + '/api/conversations/groups', {
    headers: {
        'Authorization': `Bearer ${userData.token}`
    },
    query,
    watch: [query],
})

console.log(conversations.value?.data.length);
</script>


<template>
    <div class="flex flex-col gap-6 border border-gray-200 px-6 h-full shadow-lg rounded-xl py-8">
        <div class="flex gap-3">
            <Icon name="lucide:users" size="30" style="color: oklch(60% 0.118 184.704)"
                class="group-hover:rotate-90 transition-all duration-150" />
            <h2 class="font-bold text-xl">Group Chat</h2>
        </div>
        <UInput v-model="title" icon="i-lucide-search" class="w-full" size="xl" variant="soft"
            placeholder="Find group chat.." :ui="{ base: 'rounded-lg bg-slate-100 w-full py-3' }" />
        <div v-if="conversations?.data?.length ?? 0 > 0" class="flex flex-col gap-2 mt-4">
            <div v-for="conversation in conversations?.data" :key="conversation.id" class="flex gap-2">
                <div class="relative">
                    <UAvatar :alt="conversation.title" size="xl" class="bg-teal-100 border border-teal-300 w-12 h-12" />
                    <div
                        class="rounded-full flex justify-center bg-white items-center shadow-xl border border-gray-200 p-1 hover:scale-105 active:scale-95 duration-300 transition-all absolute -left-2 -top-1">
                        <Icon name="lucide:users" size="14" style="color: oklch(60% 0.118 184.704)"
                            class="group-hover:rotate-90 transition-all duration-150" />
                    </div>
                </div>
                <div class="flex flex-col">
                    <p class="font-semibold">{{ conversation.title }}</p>
                    <p class="text-sm text-gray-400">{{ conversation.total_people }} people</p>
                </div>
            </div>
        </div>
        <div v-else>
            <p class="text-sm text-gray-400">No group chat found</p>
        </div>
    </div>
</template>
