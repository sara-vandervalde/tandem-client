import { api } from './client'
import type { CreateInvitationsResponse, Group, GroupDetails, Invitation } from '../types/groups'

// ----- Groups -----
export async function getGroups(): Promise<Group[]> {
  const { data } = await api.get<Group[]>('/api/groups')
  return data
}

export async function getGroup(id: number): Promise<GroupDetails> {
  const { data } = await api.get<GroupDetails>(`/api/groups/${id}`)
  return data
}

export async function createGroup(name: string): Promise<GroupDetails> {
  const { data } = await api.post<GroupDetails>('/api/groups', { name })
  return data
}

export async function renameGroup(id: number, name: string): Promise<void> {
  await api.put(`/api/groups/${id}`, { name })
}

export async function deleteGroup(id: number): Promise<void> {
  await api.delete(`/api/groups/${id}`)
}

export async function transferManager(id: number, userId: number): Promise<void> {
  await api.put(`/api/groups/${id}/manager`, { userId })
}

// Removing someone else (manager) or leaving (yourself) – same endpoint
export async function removeMember(id: number, userId: number): Promise<void> {
  await api.delete(`/api/groups/${id}/members/${userId}`)
}

// ----- Invitations -----
export async function inviteToGroup(groupId: number, emails: string[]): Promise<CreateInvitationsResponse> {
  const { data } = await api.post<CreateInvitationsResponse>(`/api/groups/${groupId}/invitations`, { emails })
  return data
}

export async function getGroupInvitations(groupId: number): Promise<Invitation[]> {
  const { data } = await api.get<Invitation[]>(`/api/groups/${groupId}/invitations`)
  return data
}

export async function cancelInvitation(id: number): Promise<void> {
  await api.delete(`/api/invitations/${id}`)
}

export async function getMyInvitations(): Promise<Invitation[]> {
  const { data } = await api.get<Invitation[]>('/api/me/invitations')
  return data
}

export async function respondToInvitation(id: number, accept: boolean): Promise<void> {
  await api.patch(`/api/invitations/${id}`, { accept })
}
