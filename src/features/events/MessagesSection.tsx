import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as messagesApi from '../../api/messages'
import { getErrorMessage } from '../../api/errors'
import { queryKeys } from '../../api/queryClient'
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

// The event's message board. Not a live chat: React Query asks the server for the latest page
// every 5 seconds (refetchInterval = "polling"), so new messages appear almost immediately.
export default function MessagesSection({ eventId, userId }: Props) {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  // Older pages the user asked for with "earlier messages"
  const [older, setOlder] = useState<Message[]>([])
  const [olderPage, setOlderPage] = useState(2)
  const [noMoreOlder, setNoMoreOlder] = useState(false)
  const [text, setText] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const stickToBottom = useRef(true)

  // The newest page. Polling stops by itself when this tab is closed (the component unmounts)
  const latestQuery = useQuery({
    queryKey: queryKeys.messages(eventId),
    queryFn: () => messagesApi.getMessages(eventId),
    refetchInterval: REFRESH_MS,
  })

  // Older + newest, merged by id (no duplicates), shown oldest -> newest
  const messages = useMemo(() => {
    if (!latestQuery.data) return null
    const byId = new Map<number, Message>()
    for (const m of [...older, ...latestQuery.data.items]) byId.set(m.id, m)
    return [...byId.values()].sort((a, b) => a.id - b.id)
  }, [older, latestQuery.data])
  const hasOlder = !noMoreOlder && (latestQuery.data?.totalPages ?? 0) >= olderPage

  const sendMutation = useMutation({
    mutationFn: (clean: string) => messagesApi.sendMessage(eventId, clean),
    onSuccess: () => {
      stickToBottom.current = true
      setText('')
      // Load the newest page now, without waiting for the next poll
      queryClient.invalidateQueries({ queryKey: queryKeys.messages(eventId) })
    },
    onError: err => showToast(getErrorMessage(err), 'error'),
  })

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
      setOlder(prev => [...prev, ...page.items])
      setOlderPage(p => p + 1)
      if (olderPage >= page.totalPages) setNoMoreOlder(true)
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    }
  }

  function send(e?: FormEvent) {
    e?.preventDefault()
    const clean = text.trim()
    if (clean && !sendMutation.isPending) sendMutation.mutate(clean)
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
        {latestQuery.isPending && <div className="skeleton chat-skeleton" />}
        {latestQuery.isError && <div className="alert alert-conflict" role="alert"><p>{getErrorMessage(latestQuery.error)}</p></div>}

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
        <button className="chat-send" disabled={!text.trim() || sendMutation.isPending} aria-label="שליחה">
          {sendMutation.isPending ? <span className="spinner" /> : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 3 10 14M21 3l-7 18-4-7-7-4z" transform="scale(-1,1) translate(-24,0)" />
            </svg>
          )}
        </button>
      </form>
    </section>
  )
}
