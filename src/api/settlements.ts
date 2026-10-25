import axios from 'axios'
import { api } from './client'
import type {
  Bank, BankAccount, EventSummary, MySettlement, SaveBankAccountRequest, Settlement, SettlementPreview,
} from '../types/settlements'

// ---------- Settlements ----------
export async function getPreview(eventId: number): Promise<SettlementPreview> {
  const { data } = await api.get<SettlementPreview>(`/api/events/${eventId}/settlement-preview`)
  return data
}

export async function getSummary(eventId: number): Promise<EventSummary> {
  const { data } = await api.get<EventSummary>(`/api/events/${eventId}/summary`)
  return data
}

export async function closeAccount(eventId: number): Promise<Settlement[]> {
  const { data } = await api.post<Settlement[]>(`/api/events/${eventId}/settlements`)
  return data
}

export async function getMySettlements(): Promise<MySettlement[]> {
  const { data } = await api.get<MySettlement[]>('/api/me/settlements')
  return data
}

export async function setPaid(id: number, isPaid: boolean): Promise<void> {
  await api.patch(`/api/settlements/${id}`, { isPaid })
}

// ---------- Banks ----------
export async function getBanks(): Promise<Bank[]> {
  const { data } = await api.get<Bank[]>('/api/banks')
  return data
}

// 404 here is not an error: it means "no account entered yet", so we return null
export async function getMyBankAccount(): Promise<BankAccount | null> {
  try {
    const { data } = await api.get<BankAccount>('/api/me/bank-account')
    return data
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return null
    throw err
  }
}

export async function saveMyBankAccount(request: SaveBankAccountRequest): Promise<void> {
  await api.put('/api/me/bank-account', request)
}
