export const useUserTyping = () => useState('user:who-is-typing', () => ({ id: '', name: '', isTyping: false }))

export const resetTypingMessage = () => {
    const typingState = useUserTyping()
    typingState.value.isTyping = false
    typingState.value.name = ''
    typingState.value.id = ''
}

export const addTypingMessage = (id: string, name: string) => {
    const typingState = useUserTyping()
    typingState.value.isTyping = true
    typingState.value.id = id
    typingState.value.name = name
}