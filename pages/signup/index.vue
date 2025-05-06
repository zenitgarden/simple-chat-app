<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { FetchError } from 'ofetch'
import { registerSchema, type TypeRegisterSchema } from '~/schemas/auth.schmas'

definePageMeta({
    middleware: []
})

const { loggedIn } = useUserSession()
const config = useRuntimeConfig()
const api = `${config.public.apiBase}`

if (loggedIn.value) {
    navigateTo('/')
}

const state = reactive<Partial<TypeRegisterSchema>>({
    name: undefined,
    email: undefined,
    password: undefined
})

const toast = useToast()
const loading = ref(false)
const isLoginSuccess = ref(true)
const showPassword = ref(false)
const modal = ref(false)

function toggleShowPassword() {
    showPassword.value = !showPassword.value
}


async function onSubmit(event: FormSubmitEvent<TypeRegisterSchema>) {
    loading.value = true
    try {
        const res = await fetch(api + '/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(event.data),
            headers: {
                'Content-Type': 'application/json'
            }
        })

        if(!res.ok) {
            throw new Error(`Fetch error: ${res.status}`)
        }

        state.name = undefined
        state.email = undefined
        state.password = undefined
        modal.value = true
    } catch (error: unknown) {
        const fetchError = error as FetchError
        const statusCode = fetchError?.response?.status

        if (statusCode === 401) {
            isLoginSuccess.value = false
        } else {
            toast.add({ title: 'Register Failed !', description: 'Try again later.', color: 'error' })
        }
    } finally {
        loading.value = false
    }
    loading.value = false
}
</script>

<template>
    <div class="flex items-center justify-center h-screen mx-4">
        <UModal v-model:open="modal" :dismissible="false" title="Success" description=" ">
            <template #body>
                <div class="flex flex-col text-center py-6 gap-2">
                    <p>Account created, please log in</p>
                    <NuxtLink to="/login" class="text-teal-600 hover:underline text-sm">
                        Go to login
                    </NuxtLink>
                </div>
            </template>
        </UModal>

        <UForm :schema="registerSchema" :state="state"
            class="w-96 space-y-4 border border-gray-200 rounded-xl p-4 sm:p-8 shadow-lg relative" @submit="onSubmit">
            <NuxtImg src="/message_7699178.png" alt="Chample" width="60" height="60"
                class="absolute top-1 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            <div class="flex items-center">
                <div class="flex flex-col gap-2 mt-5 justify-center w-full items-center">
                    <p class="text-xl font-bold">Sign Up with Email</p>
                    <p class="text-sm">Create a new account.</p>
                    <p v-if="!isLoginSuccess" class="mt-2 text-red-500 font-semibold">Invalid email or password</p>
                </div>
            </div>
            <UFormField label="Name" name="name">
                <UInput v-model="state.name" class="w-full" size="xl" />
            </UFormField>

            <UFormField label="Email" name="email">
                <UInput v-model="state.email" class="w-full" size="xl" />
            </UFormField>

            <UFormField label="Password" name="password">
                <div class="relative">
                    <UInput v-model="state.password" :type="showPassword ? 'text' : 'password'" class="w-full"
                        size="xl" />
                    <Icon :name="showPassword ? 'lucide:eye' : 'lucide:eye-off'" size="20" style="color: black"
                        class="absolute top-1/2 right-3 transform -translate-y-1/2" @click="toggleShowPassword" />
                </div>
            </UFormField>

            <div class="flex flex-col gap-3 mt-6">
                <UButton label="Sign Up" type="submit" class="bg-teal-600 w-full justify-center hover:bg-teal-500"
                    size="xl" :disabled="loading" :loading="loading" />
                <p class="text-sm text-center">Already have an account?
                    <NuxtLink to="/login" class="text-teal-600 hover:underline text-sm">
                        Login
                    </NuxtLink>
                </p>
            </div>
        </UForm>
    </div>
</template>
