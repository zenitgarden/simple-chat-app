import type { ResponseSuccess } from '~/types/global'

interface LoginResponse {
    userId: string
    userName: string
    accessToken: string
}

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const config = useRuntimeConfig()
    try {
        const res = await $fetch<ResponseSuccess<LoginResponse>>(`${config.public.apiBase}/api/auth/login`, {
            method: 'POST',
            body,
        })
        const token = res.data.accessToken
        if (!token) {
            throw createError({
                statusCode: 401,
                statusMessage: 'Token is missing',
            })
        }

        await setUserSession(event, {
            user: {
              id: res.data.userId,
              name: res.data.userName,
              token: token
            },
          })

        return { statusCode: 200, message: 'Login successful', data: null }

    } catch (error: unknown) {
        if (error instanceof Error) {
            const statusCode = (error as { response?: { status?: number } })?.response?.status || 500
            interface ErrorResponse {
                response?: {
                    status?: number;
                    _data?: {
                        message?: string;
                    };
                };
            }
            const statusMessage = (error as ErrorResponse)?.response?._data?.message || (error as Error).message || 'Login failed'

            throw createError({
                message: statusMessage,
                status: statusCode,
                statusCode: statusCode,
                statusMessage: 'Uanthorized',
            })
        }
    }
})
