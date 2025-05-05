import { z } from 'zod'

export type TypeLoginSchema = z.output<typeof loginSchema>
export type TypeRegisterSchema = z.output<typeof registerSchema>

export const loginSchema = z.object({
    email: z.string({ required_error: 'Email is required', invalid_type_error: 'Email must be a string' }).email({ message: 'Invalid email' }),
    password: z.string({ required_error: 'Password is required' }).min(6, 'Must be at least 6 characters')
})

export const registerSchema = z.object({
    name: z.string({ required_error: 'Name is required', invalid_type_error: 'Name must be a string' }),
    email: z.string({ required_error: 'Email is required', invalid_type_error: 'Email must be a string' }).email({ message: 'Invalid email' }),
    password: z.string({ required_error: 'Password is required' }).min(6, 'Must be at least 6 characters')
})