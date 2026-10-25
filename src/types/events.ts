// Mirrors Tandem.Core/DTOs/Events and Items. Enums arrive as strings (JsonStringEnumConverter)

export type EventStatus = 'Draft' | 'Organizing' | 'Organized' | 'Settled' | 'Cancelled'
export type OrganizationMode = 'Solo' | 'Open'
export type SplitMethod = 'Equal' | 'OrganizerPays' | 'SelectedMembers'
export type MealType = 'Shared' | 'Catering' | 'SelfMade'
export type ItemType = 'Food' | 'Equipment'
export type Area = 'venue' | 'gift' | 'meal'

export type EventListItem = {
  id: number
  groupId: number
  groupName: string
  title: string
  eventDate: string
  status: EventStatus
  organizerName: string | null
  hasGift: boolean
}

export type PagedResult<T> = {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export type Venue = { responsibleId: number | null; responsibleName: string | null; address: string | null; price: number | null }
export type Gift = { responsibleId: number | null; responsibleName: string | null; description: string | null; price: number | null }
export type Meal = {
  responsibleId: number | null
  responsibleName: string | null
  mealType: MealType | null
  cateringName: string | null
  cateringIncludesTableware: boolean
  price: number | null
}

export type EventDetails = {
  id: number
  groupId: number
  groupName: string
  title: string
  eventDate: string
  createdById: number
  createdByName: string
  organizerId: number | null
  organizerName: string | null
  organizationMode: OrganizationMode
  hasGift: boolean
  splitMethod: SplitMethod
  status: EventStatus
  venue: Venue
  gift: Gift | null
  meal: Meal
  participants: { userId: number; fullName: string }[]
}

export type Item = {
  id: number
  eventId: number
  type: ItemType
  name: string
  isPrivate: boolean
  addedById: number
  addedByName: string
  assigneeId: number | null
  assigneeName: string | null
}

export type EventFilters = {
  groupId?: number
  status?: EventStatus
  search?: string
  from?: string
  to?: string
  sortBy?: 'date' | 'title' | 'status'
  sortDir?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export type UpdateEventRequest = {
  title: string
  eventDate: string
  organizationMode: OrganizationMode
  hasGift: boolean
  splitMethod: SplitMethod
}
