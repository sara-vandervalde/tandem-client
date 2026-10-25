import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import * as messagesApi from '../../api/messages'
import { getErrorMessage } from '../../api/errors'
import { useToast } from '../../components/ToastContext'
import Avatar from '../../components/Avatar'
import type { Message } from '../../api/messages'

const REFRESH_MS = 5000
const MAX_LENGTH = 500

type Props = { eventId: number; userId: number | undefined }

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
}

function dayOf(iso: string) {
  return new Date(iso).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })
}

// The event's message board. Not a live chat: every 5 seconds we ask the server
// for the latest page ("polling"), so new messages appear almost immediately.
export default function MessagesSection({ eventId, userId }: Props) {
  const { showToast } = useToast()
  // Kept oldest -> newest, the order they are shown in
  const [messages, setMessages] = useState<Message[] | null>(null)
  const [hasOlder, setHasOlder] = useState(false)
  const [olderPage, setOlderPage] = useState(2)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const stickToBottom = useRef(true)

  // Merge by id, so polling never duplicates a message we already have
  const merge = useCallback((incoming: Message[]) => {
    setMessages(prev => {
      const byId = new Map((prev ?? []).map(m => [m.id, m]))
      for (const m of incoming) byId.set(m.id, m)
      return [...byId.values()].sort((a, b) => a.id - b.id)
    })
  }, [])

  const refresh = useCallback(async () => {
    try {
      const page = await messagesApi.getMessages(eventId)
      merge(page.items)
      setHasOlder(prev => prev || page.totalPages > 1)
    } catch {
      // A failed poll is silent; the next one in 5 seconds will try again
    }
  }, [eventId, merge])

  useEffect(() => {
    refresh()
    const timer = setInterval(refresh, REFRESH_MS)
    // Leaving the tab stops the polling
    return () => clearInterval(timer)
  }, [refresh])

  // Scroll to the newest message - unless the user scrolled up to read older ones
  useEffect(() => {
    const list = listRef.current
    if (list && stickToBottom.current) list.scrollTop = list.scrollHeight
  }, [messages])

  function onScroll() {
    const list = listRef.current
    if (list) stickToBottom.current = list.scrollHeight - list.scrollTop - list.clientHeight < 60
  }

  async function loadOlder() {
    try {
      const page = await messagesApi.getMessages(eventId, olderPage)
      stickToBottom.current = false
      merge(page.items)
      setOlderPage(p => p + 1)
      setHasOlder(olderPage < page.totalPages)
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    }
  }

  async function send(e?: FormEvent) {
    e?.preventDefault()
    const clean = text.trim()
    if (!clean || sending) return
    setSending(true)
    try {
      const saved = await messagesApi.sendMessage(eventId, clean)
      stickToBottom.current = true
      merge([saved])
      setText('')
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setSending(false)
    }
  }

  // Enter sends, Shift+Enter adds a new line
  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <section className="card chat">
      <div className="chat-list" ref={listRef} onScroll={onScroll}>
        {messages === null && <div className="skeleton chat-skeleton" />}

        {hasOlder && <button className="btn btn-ghost btn-sm chat-older" onClick={loadOlder}>הודעות קודמות</button>}

        {messages?.length === 0 && (
          <div className="chat-empty">
            <span>💬</span>
            <b>עדיין אין הודעות</b>
            <p className="muted">"מישהי יכולה להביא כיסאות?" – כתבי כאן, וכל הקבוצה תראה.</p>
          </div>
        )}

        {messages?.map((m, i) => {
          const prev = messages[i - 1]
          const isMine = m.userId === userId
          const newDay = !prev || dayOf(prev.createdAt) !== dayOf(m.createdAt)
          // Consecutive messages from the same person are grouped: name and avatar only once
          const firstInGroup = newDay || !prev || prev.userId !== m.userId
          return (
            <div key={m.id}>
              {newDay && <div className="chat-day"><span>{dayOf(m.createdAt)}</span></div>}
              <div className={`chat-row ${isMine ? 'is-mine' : ''} ${firstInGroup ? 'is-first' : ''}`}>
                {!isMine && (firstInGroup ? <Avatar name={m.userName} size={30} /> : <span className="chat-avatar-space" />)}
                <div className="chat-bubble">
                  {!isMine && firstInGroup && <b className="chat-name">{m.userName}</b>}
                  <p>{m.text}</p>
                  <time dateTime={m.createdAt}>{timeOf(m.createdAt)}</time>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <form className="chat-compose" onSubmit={send}>
        <textarea
          className="input"
          rows={1}
          value={text}
          maxLength={MAX_LENGTH}
          placeholder="כתבי הודעה לקבוצה…"
          onChange={e => setText(e.target.value)}
          onKeyDown={onKeyDown}
        />
        {text.length > MAX_LENGTH - 80 && <span className="chat-count">{MAX_LENGTH - text.length}</span>}
        <button className="chat-send" disabled={!text.trim() || sending} aria-label="שליחה">
          {sending ? <span className="spinner" /> : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 3 10 14M21 3l-7 18-4-7-7-4z" transform="scale(-1,1) translate(-24,0)" />
            </svg>
          )}
        </button>
      </form>
    </section>
  )
}
