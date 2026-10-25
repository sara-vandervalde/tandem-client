// Mirrors Tandem.Core/DTOs/Settlements and Banks
import type { EventDetails, Item } from './events'

export type Transfer = {
  fromUserId: number
  fromUserName: string
  toUserId: number
  toUserName: string
  amount: number
}

export type SettlementPreview = {
  total: number
  sharerCount: number
  transfers: Transfer[]
}

export type Settlement = Transfer & {
  id: number
  eventId: number
  isPaid: boolean
  paidAt: string | null
}

export type BankAccount = {
  bankId: number
  bankName: string
  branchNumber: string
  accountNumber: string
  accountHolderName: string
}

export type MySettlement = Settlement & {
  eventTitle: string
  eventDate: string
  iOwe: boolean
  // Only when I pay, and only if the recipient entered an account
  recipientBankAccount: BankAccount | null
}

export type EventSummary = {
  event: EventDetails
  items: Item[]
  isFinal: boolean
  preview: SettlementPreview | null
  settlements: Settlement[]
}

export type Bank = { id: number; name: string }

export type SaveBankAccountRequest = {
  bankId: number
  branchNumber: string
  accountNumber: string
  accountHolderName: string
}
