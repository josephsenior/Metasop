export function appendQueryParams(base: string, params?: Record<string, string | undefined | null>) {
  if (!params) return base
  const urlHasQuestion = base.includes('?')
  const parts: string[] = []
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
  }
  if (parts.length === 0) return base
  return `${base}${urlHasQuestion ? '&' : '?'}${parts.join('&')}`
}

export function appendGuestSession(base?: string) {
  if (typeof document === 'undefined') return base || ''
  const guestSessionId = document.cookie
    .split('; ')
    .find(row => row.startsWith('guest_session_id='))
    ?.split('=')[1]
  if (!guestSessionId) return base || ''
  if (!base) return `?guestSessionId=${guestSessionId}`
  return `${base}${base.includes('?') ? '&' : '?'}guestSessionId=${encodeURIComponent(guestSessionId)}`
}

export default { appendQueryParams, appendGuestSession }
