import { api } from './client'
import type { PagedResult } from '../types/events'

// Mirrors Tandem.Core/DTOs/Messages/MessageDto
export type Message = {
  id: number
  eventId: number
  userId: number
  userName: string
  text: string
  createdAt: string
}

// Newest first, one page
export async function getMessages(eventId: number, page = 1, pageSize = 30): Promise<PagedResult<Message>> {
  const { data } = await api.get<PagedResult<Message>>(`/api/events/${eventId}/messages`, { params: { page, pageSize } })
  return data
}

export async function sendMessage(eventId: number, text: string): Promise<Message> {
  const { data } = await api.post<Message>(`/api/events/${eventId}/messages`, { text })
  return data
}
