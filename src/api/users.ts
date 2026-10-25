import { api } from './client'
import type { PagedResult } from '../types/events'

// Mirrors Tandem.Core/DTOs/Users/UserDto. Admin only
export type User = {
  id: number
  fullName: string
  email: string
  address: string | null
  role: 'Admin' | 'Member'
  isActive: boolean
  createdAt: string
}

export async function getUsers(page: number, pageSize = 15): Promise<PagedResult<User>> {
  const { data } = await api.get<PagedResult<User>>('/api/users', { params: { page, pageSize } })
  return data
}

// false = block, true = release the block
export async function setUserActive(id: number, isActive: boolean): Promise<void> {
  await api.patch(`/api/users/${id}`, { isActive })
}
