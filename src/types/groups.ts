// Mirrors Tandem.Core/DTOs/Groups and Invitations

export type Group = {
  id: number
  name: string
  managerId: number
  managerName: string
  memberCount: number
  createdAt: string
}

export type GroupMember = {
  userId: number
  fullName: string
  email: string
  joinedAt: string
}

export type GroupDetails = {
  id: number
  name: string
  managerId: number
  managerName: string
  createdAt: string
  members: GroupMember[]
}

export type InvitationStatus = 'Pending' | 'Accepted' | 'Declined' | 'Cancelled'

export type Invitation = {
  id: number
  groupId: number
  groupName: string
  email: string
  invitedByName: string
  status: InvitationStatus
  isExpired: boolean
  createdAt: string
  expiresAt: string
  respondedAt: string | null
}

export type CreateInvitationsResponse = {
  invited: Invitation[]
  skipped: { email: string; reason: string }[]
}
