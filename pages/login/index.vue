<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { FetchError } from 'ofetch'
import { loginSchema, type TypeLoginSchema } from '~/schemas/auth.schmas'

definePageMeta({
  middleware: []
})

const { fetch: refreshSession, loggedIn } = useUserSession()

if(loggedIn.value) {
    navigateTo('/')
}

const state = reactive<Partial<TypeLoginSchema>>({
    email: undefined,
    password: undefined
})

const toast = useToast()
const loading = ref(false)
const isLoginSuccess = ref(true)
const showPassword = ref(false)
const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

function toggleShowPassword() {
    showPassword.value = !showPassword.value
}

async function onSubmit(event: FormSubmitEvent<TypeLoginSchema>) {
    loading.value = true
    try {
        await $fetch('/api/login', {
            method: 'POST',
            body: JSON.stringify(event.data),
            'Content-Type': 'application/json'
        })

        // ✅ Refresh client-side session state
        await refreshSession()

        // ✅ Redirect or show success
        await navigateTo('/')
    } catch (error: unknown) {
        const fetchError = error as FetchError
        const statusCode = fetchError?.response?.status

        if (statusCode === 401) {
            isLoginSuccess.value = false
        } else {
            toast.add({ title: 'Login Failed !', description: 'Try again later.', color: 'error' })
        }
    } finally {
        loading.value = false
    }
    await delay(3000)
    loading.value = false
}
</script>

<template>
    <div class="flex items-center justify-center h-screen mx-4">
        <UForm :schema="loginSchema" :state="state"
            class="w-96 space-y-4 border border-gray-200 rounded-xl p-4 sm:p-8 shadow-lg relative" @submit="onSubmit">
            <NuxtImg src="/message_7699178.png" alt="Chample" width="60" height="60"
                class="absolute top-1 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            <div class="flex items-center">
                <div class="flex flex-col gap-2 mt-5 justify-center w-full items-center">
                    <p class="text-xl font-bold">Sign in with Email</p>
                    <p class="text-sm">Chat with friends and colleagues in real time.</p>
                    <p v-if="!isLoginSuccess" class="mt-2 text-red-500 font-semibold">Invalid email or password</p>
                </div>
            </div>
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
                <UButton label="Login" type="submit" class="bg-teal-600 w-full justify-center hover:bg-teal-500"
                    size="xl" :disabled="loading" :loading="loading" />
                <p class="text-sm text-center">Don't have an account?
                    <NuxtLink to="/signup" class="text-teal-600 hover:underline text-sm">
                        Sign Up
                    </NuxtLink>
                </p>
            </div>
        </UForm>
    </div>
</template>
