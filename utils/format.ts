// ZAR currency formatting
export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount)

// Date formatting
export const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions): string =>
  new Intl.DateTimeFormat('en-ZA', options ?? { day: 'numeric', month: 'short', year: 'numeric' })
    .format(new Date(date))

export const formatTime = (date: string | Date): string =>
  new Intl.DateTimeFormat('en-ZA', { hour: '2-digit', minute: '2-digit' })
    .format(new Date(date))

export const formatRelativeTime = (date: string | Date): string => {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7)  return `${days}d ago`
  return formatDate(date)
}

// Name helpers
export const getInitials = (firstName: string, lastName: string): string =>
  `${firstName[0]}${lastName[0]}`.toUpperCase()

export const getFullName = (firstName: string, lastName: string): string =>
  `${firstName} ${lastName}`

// Mood helpers
export const moodLabel = (score: number): string => {
  const labels: Record<number, string> = {
    1: 'Very Low', 2: 'Low', 3: 'Neutral', 4: 'Good', 5: 'Great'
  }
  return labels[score] ?? 'Unknown'
}

export const moodEmoji = (score: number): string => {
  const emojis: Record<number, string> = {
    1: '😔', 2: '😕', 3: '😐', 4: '🙂', 5: '😊'
  }
  return emojis[score] ?? '😐'
}

