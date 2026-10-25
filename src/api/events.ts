import { api } from './client'
import type {
  Area, EventDetails, EventFilters, EventListItem, Item, ItemType, MealType, PagedResult, UpdateEventRequest,
} from '../types/events'

// ---------- Events ----------
export async function getEvents(filters: EventFilters): Promise<PagedResult<EventListItem>> {
  // axios turns the object into a query string and skips undefined values
  const { data } = await api.get<PagedResult<EventListItem>>('/api/events', { params: filters })
  return data
}

export async function getEvent(id: number): Promise<EventDetails> {
  const { data } = await api.get<EventDetails>(`/api/events/${id}`)
  return data
}

export async function createEvent(groupId: number, title: string, eventDate: string, isOrganizer: boolean): Promise<EventDetails> {
  const { data } = await api.post<EventDetails>('/api/events', { groupId, title, eventDate, isOrganizer })
  return data
}

export async function updateEvent(id: number, request: UpdateEventRequest): Promise<void> {
  await api.put(`/api/events/${id}`, request)
}

export async function cancelEvent(id: number): Promise<void> {
  await api.patch(`/api/events/${id}`, { status: 'Cancelled' })
}

export async function deleteEvent(id: number): Promise<void> {
  await api.delete(`/api/events/${id}`)
}

export async function claimOrganizer(id: number): Promise<EventDetails> {
  const { data } = await api.put<EventDetails>(`/api/events/${id}/organizer`)
  return data
}

// ---------- Areas: venue / gift / meal ----------
export async function claimArea(id: number, area: Area): Promise<EventDetails> {
  const { data } = await api.put<EventDetails>(`/api/events/${id}/${area}/responsible`)
  return data
}

export async function releaseArea(id: number, area: Area): Promise<void> {
  await api.delete(`/api/events/${id}/${area}/responsible`)
}

export async function updateVenue(id: number, address: string | null, price: number | null): Promise<void> {
  await api.put(`/api/events/${id}/venue`, { address, price })
}

export async function updateGift(id: number, description: string | null, price: number | null): Promise<void> {
  await api.put(`/api/events/${id}/gift`, { description, price })
}

export async function updateMeal(id: number, meal: {
  mealType: MealType | null; cateringName: string | null; cateringIncludesTableware: boolean; price: number | null
}): Promise<void> {
  await api.put(`/api/events/${id}/meal`, meal)
}

export async function setParticipants(id: number, userIds: number[]): Promise<void> {
  await api.put(`/api/events/${id}/participants`, { userIds })
}

// ---------- "What to bring" items ----------
export async function getItems(eventId: number): Promise<Item[]> {
  const { data } = await api.get<Item[]>(`/api/events/${eventId}/items`)
  return data
}

export async function addItem(eventId: number, type: ItemType, name: string): Promise<Item> {
  const { data } = await api.post<Item>(`/api/events/${eventId}/items`, { type, name })
  return data
}

export async function deleteItem(id: number): Promise<void> {
  await api.delete(`/api/items/${id}`)
}

export async function claimItem(id: number): Promise<void> {
  await api.put(`/api/items/${id}/assignee`)
}

export async function releaseItem(id: number): Promise<void> {
  await api.delete(`/api/items/${id}/assignee`)
}
