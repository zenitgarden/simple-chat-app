<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
    conversation: {
        id: string
        title: string
    }
    onJoin: (conversationId: string) => Promise<void>
}>()


const join = async (conversationId: string) => {
    open.value = false
    await props.onJoin(conversationId)
}


const open = ref(false)
</script>

<template>
    <UPopover v-model:open="open" :content="{ side: 'left', align: 'start' }">
        <UTooltip text="Join">
            <UButton class="rounded-md bg-teal-500 hover:bg-teal-600">
                <Icon name="mdi:login" size="20" />
            </UButton>
        </UTooltip>
        <template #content>
            <div class="py-6 px-6 flex flex-col gap-4 justify-center items-center">
                <p>Do you want to join <strong>{{ conversation.title }}</strong> ?</p>
                <div class="flex gap-2">
                    <UButton class="bg-teal-500 hover:bg-teal-600" loading-auto @click="join(conversation.id)">Join</UButton>
                    <UButton class="bg-gray-500 hover:bg-gray-600" @click="open = false">Cancel</UButton>
                </div>
            </div>
        </template>
    </UPopover>
</template>