<script setup lang="ts">
const typingState = useUserTyping()
const conversationId = useConversationId()

</script>

<template>
  <div v-if="typingState.id === conversationId" class="flex items-center space-x-1 absolute -top-6 left-2">
    <span class="text-gray-500 text-sm">{{ typingState.name }} is typing</span>
    <div class="flex space-x-1">
      <span v-for="n in 3" :key="n" :class="['dot', { [`dot-${n}`]: true }]" />
    </div>
  </div>
</template>


<style scoped>
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #a1a1aa;
  /* Tailwind gray-400 */
  animation: blink 1.4s infinite both;
}

.dot-1 {
  animation-delay: 0s;
}

.dot-2 {
  animation-delay: 0.2s;
}

.dot-3 {
  animation-delay: 0.4s;
}

@keyframes blink {

  0%,
  80%,
  100% {
    opacity: 0;
  }

  40% {
    opacity: 1;
  }
}
</style>