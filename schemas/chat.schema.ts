import { z } from 'zod'

export type TypeGroupSchema = z.output<typeof groupSchema>
export type TypePrivateSchema = z.output<typeof privateSchema>

export const groupSchema = z.object({
    title: z.string({ required_error: 'Group name is required', invalid_type_error: 'Group name is required' }),

})

export const privateSchema = z.object({
    userId: z.string({ required_error: 'Please select a user', invalid_type_error: 'Please select a user' }),
})