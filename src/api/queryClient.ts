import { QueryClient } from '@tanstack/react-query'

// One cache for the whole app. Data counts as "fresh" for 30 seconds:
// moving between screens shows it at once, and it is re-checked in the background.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
})

// Every cache key in one place, so a screen and the code that invalidates it always match
export const queryKeys = {
  groups: ['groups'] as const,
  group: (id: number) => ['groups', id] as const,
  groupInvitations: (id: number) => ['groups', id, 'invitations'] as const,
  myInvitations: ['invitations', 'mine'] as const,
  events: (filters: object) => ['events', filters] as const,
  event: (id: number) => ['event', id] as const,
  items: (eventId: number) => ['event', eventId, 'items'] as const,
  summary: (eventId: number) => ['event', eventId, 'summary'] as const,
  messages: (eventId: number) => ['event', eventId, 'messages'] as const,
  mySettlements: ['settlements', 'mine'] as const,
  bankAccount: ['bank-account'] as const,
  banks: ['banks'] as const,
  users: (page: number) => ['users', page] as const,
}
