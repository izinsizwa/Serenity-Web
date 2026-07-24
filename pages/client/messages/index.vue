<script setup lang="ts">
definePageMeta({ layout: 'client', middleware: 'auth' })
const messagesApi = useMessages()
const auth = useAuthStore()
const route = useRoute()

const conversations  = ref<any[]>([])
const messages       = ref<any[]>([])
const activeConvo    = ref<any>(null)
const loading        = ref(true)
const loadingMsgs    = ref(false)
const sending        = ref(false)
const newMessage     = ref('')
const messagesEnd    = ref<HTMLElement | null>(null)
const page           = ref(1)
const totalPages     = ref(1)

async function loadConversations() {
  loading.value = true
  try {
    const res = await messagesApi.getConversations()
    conversations.value = res.data ?? []
    const toUserId = route.query.to as string
    if (toUserId) {
      const found = conversations.value.find(c => c.otherUserId === toUserId)
      if (found) openConversation(found)
      else openConversation({ otherUserId: toUserId, otherUserName: 'Therapist', unreadCount: 0, isOtherUserOnline: false })
    } else if (conversations.value.length) {
      openConversation(conversations.value[0])
    }
  } finally { loading.value = false }
}

async function openConversation(convo: any) {
  activeConvo.value = convo
  loadingMsgs.value = true
  messages.value = []
  try {
    const res = await messagesApi.getConversation(convo.otherUserId, 1, 50)
    messages.value = (res.data?.items ?? []).reverse()
    totalPages.value = res.data?.totalPages ?? 1
    await messagesApi.markAsRead(convo.otherUserId)
    convo.unreadCount = 0
    nextTick(() => scrollToBottom())
  } finally { loadingMsgs.value = false }
}

async function sendMessage() {
  if (!newMessage.value.trim() || !activeConvo.value) return
  sending.value = true
  const content = newMessage.value.trim()
  newMessage.value = ''
  try {
    const res = await messagesApi.sendMessage({
      receiverId: activeConvo.value.otherUserId,
      content,
      replyToMessageId: null,
      appointmentId: null,
    })
    messages.value.push(res.data)
    nextTick(() => scrollToBottom())
  } finally { sending.value = false }
}

function scrollToBottom() {
  messagesEnd.value?.scrollIntoView({ behavior: 'smooth' })
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
}

onMounted(loadConversations)
</script>

<template>
  <div class="flex h-full overflow-hidden">
    <!-- Conversations sidebar -->
    <div :class="['flex flex-col w-full lg:w-80 border-r border-[var(--color-border)] bg-[var(--color-surface)] shrink-0',
      activeConvo ? 'hidden lg:flex' : 'flex']">
      <div class="px-4 py-4 border-b border-[var(--color-border)]">
        <h2 class="font-display text-xl text-[var(--color-text)]">Messages</h2>
      </div>
      <SLoader v-if="loading" label="Loading conversations..." />
      <SEmpty v-else-if="!conversations.length"
        icon="heroicons:chat-bubble-left-right"
        title="No conversations yet"
        subtitle="Book a session to message a therapist" />
      <div v-else class="flex-1 overflow-y-auto">
        <button v-for="convo in conversations" :key="convo.otherUserId"
          @click="openConversation(convo)"
          :class="['w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-surface-2)] transition-colors text-left border-b border-[var(--color-border)]',
            activeConvo?.otherUserId === convo.otherUserId ? 'bg-[var(--color-surface-2)]' : '']">
          <div class="relative shrink-0">
            <SAvatar :src="null" :name="convo.otherUserName" size="md" color="bg-clay-500" />
            <span :class="['absolute bottom-0 right-0', convo.isOtherUserOnline ? 'status-online' : 'status-offline']" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <p class="font-body font-medium text-sm text-[var(--color-text)] truncate">{{ convo.otherUserName }}</p>
              <p class="font-body text-xs text-[var(--color-text-muted)] shrink-0 ml-2">
                {{ formatRelativeTime(convo.lastMessageAt) }}
              </p>
            </div>
            <p class="font-body text-xs text-[var(--color-text-muted)] truncate">{{ convo.lastMessage }}</p>
          </div>
          <span v-if="convo.unreadCount > 0"
            class="w-5 h-5 rounded-full bg-forest-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
            {{ convo.unreadCount > 9 ? '9+' : convo.unreadCount }}
          </span>
        </button>
      </div>
    </div>

    <!-- Chat area -->
    <div v-if="activeConvo" class="flex-1 flex flex-col min-w-0">
      <!-- Header -->
      <div class="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <button class="lg:hidden text-[var(--color-text-muted)] mr-1" @click="activeConvo = null">
          <Icon name="heroicons:arrow-left" class="w-5 h-5" />
        </button>
        <div class="relative">
          <SAvatar :src="null" :name="activeConvo.otherUserName" size="md" color="bg-clay-500" />
          <span :class="['absolute bottom-0 right-0', activeConvo.isOtherUserOnline ? 'status-online' : 'status-offline']" />
        </div>
        <div>
          <p class="font-body font-semibold text-sm text-[var(--color-text)]">{{ activeConvo.otherUserName }}</p>
          <p class="font-body text-xs text-[var(--color-text-muted)]">
            {{ activeConvo.isOtherUserOnline ? 'Online' : 'Offline' }}
          </p>
        </div>
      </div>

      <!-- Messages -->
      <div class="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <SLoader v-if="loadingMsgs" label="Loading messages..." />
        <SEmpty v-else-if="!messages.length"
          icon="heroicons:chat-bubble-left"
          title="No messages yet"
          subtitle="Send a message to start the conversation" />
        <div v-else>
          <div v-for="msg in messages" :key="msg.messageId"
            :class="['flex', msg.senderId === auth.user?.userId ? 'justify-end' : 'justify-start']">
            <div :class="['max-w-[75%] px-4 py-2.5 rounded-2xl',
              msg.senderId === auth.user?.userId
                ? 'bg-forest-500 text-white rounded-br-sm'
                : 'bg-[var(--color-surface-2)] text-[var(--color-text)] rounded-bl-sm']">
              <p class="font-body text-sm leading-relaxed">{{ msg.content }}</p>
              <p :class="['font-body text-[10px] mt-1',
                msg.senderId === auth.user?.userId ? 'text-white/60' : 'text-[var(--color-text-muted)]']">
                {{ formatTime(msg.sentAt) }}
                <Icon v-if="msg.senderId === auth.user?.userId"
                  :name="msg.isRead ? 'heroicons:check' : 'heroicons:check'"
                  class="w-3 h-3 inline ml-1" />
              </p>
            </div>
          </div>
          <div ref="messagesEnd" />
        </div>
      </div>

      <!-- Input -->
      <div class="px-4 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <div class="flex items-end gap-2">
          <textarea v-model="newMessage" @keydown="handleKeydown"
            class="input resize-none flex-1 min-h-[44px] max-h-32 py-3"
            placeholder="Type a message... (Enter to send)"
            rows="1" />
          <button @click="sendMessage" :disabled="sending || !newMessage.trim()"
            class="btn-primary px-4 py-3 shrink-0 disabled:opacity-50">
            <Icon v-if="sending" name="heroicons:arrow-path" class="w-5 h-5 animate-spin" />
            <Icon v-else name="heroicons:paper-airplane" class="w-5 h-5" />
          </button>
        </div>
        <p class="font-body text-[10px] text-[var(--color-text-muted)] mt-1 text-center">
          Messages are encrypted and confidential
        </p>
      </div>
    </div>

    <!-- Empty state when no conversation selected on desktop -->
    <div v-else class="hidden lg:flex flex-1 items-center justify-center">
      <SEmpty icon="heroicons:chat-bubble-left-right"
        title="Select a conversation"
        subtitle="Choose a conversation from the left to start messaging" />
    </div>
  </div>
</template>
