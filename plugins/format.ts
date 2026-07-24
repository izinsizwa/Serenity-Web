import { formatCurrency, formatDate, formatTime, formatRelativeTime, getInitials, moodEmoji, moodLabel } from '~/utils/format'
export default defineNuxtPlugin(() => {
  return {
    provide: { formatCurrency, formatDate, formatTime, formatRelativeTime, getInitials, moodEmoji, moodLabel }
  }
})
