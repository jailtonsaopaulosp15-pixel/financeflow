export type SubscriptionStatus = 'trial' | 'pending' | 'authorized' | 'paused' | 'cancelled'

export interface User {
  uid: string
  email: string
  displayName?: string
  photoURL?: string
  createdAt: Date
  subscriptionStatus?: SubscriptionStatus
  trialEndsAt?: Date
  mpPreapprovalId?: string
}

export interface Category {
  id: string
  name: string
  type: 'income' | 'expense'
  icon: string
  color: string
  createdAt: Date
}

export interface Transaction {
  id: string
  userId: string
  type: 'income' | 'expense'
  amount: number
  category: string
  categoryName?: string
  date: Date
  description: string
  notes?: string
  attachments: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Attachment {
  id: string
  name: string
  url: string
  type: string
  size: number
  uploadedAt: Date
}

export interface Balance {
  income: number
  expense: number
  balance: number
  lastUpdated: Date
}

export interface MonthlyReport {
  month: string
  year: number
  income: number
  expense: number
  balance: number
  transactions: Transaction[]
}

export interface DashboardStats {
  totalIncome: number
  totalExpense: number
  currentBalance: number
  monthlyIncome: number
  monthlyExpense: number
  monthlyBalance: number
  transactionCount: number
}

export interface AppState {
  user: User | null
  isLoading: boolean
  error: string | null
}

export interface PaginationParams {
  page: number
  limit: number
  sortBy: 'date' | 'amount'
  sortOrder: 'asc' | 'desc'
}

export interface FilterParams {
  startDate?: Date
  endDate?: Date
  category?: string
  type?: 'income' | 'expense' | 'all'
  searchText?: string
}
