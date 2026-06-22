import { useCallback, useEffect, useState } from 'react'
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
  Timestamp
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { Transaction, FilterParams, PaginationParams } from '../types'

export const useTransactions = (userId: string | null) => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Real-time listener for transactions
  useEffect(() => {
    if (!userId) {
      setTransactions([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'users', userId, 'lancamentos'),
      orderBy('date', 'desc')
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const data = snapshot.docs.map((doc) => {
            const docData = doc.data()
            return {
              id: doc.id,
              ...docData,
              date: docData.date?.toDate ? docData.date.toDate() : new Date(docData.date),
              createdAt: docData.createdAt?.toDate ? docData.createdAt.toDate() : new Date(),
              updatedAt: docData.updatedAt?.toDate ? docData.updatedAt.toDate() : new Date(),
            } as Transaction
          })
          setTransactions(data)
          setError(null)
        } catch (err) {
          console.error('Error loading transactions:', err)
          setError('Erro ao carregar transações')
        } finally {
          setLoading(false)
        }
      },
      (err) => {
        console.error('Snapshot listener error:', err)
        setError('Erro ao sincronizar transações')
        setLoading(false)
      }
    )

    return unsubscribe
  }, [userId])

  const addTransaction = useCallback(async (
    type: 'income' | 'expense',
    amount: number,
    category: string,
    date: Date,
    description: string,
    notes?: string,
    attachments?: string[]
  ) => {
    if (!userId) throw new Error('Usuário não autenticado')

    try {
      setError(null)
      const docRef = await addDoc(collection(db, 'users', userId, 'lancamentos'), {
        userId,
        type,
        amount,
        category,
        date: Timestamp.fromDate(date),
        description,
        notes: notes || '',
        attachments: attachments || [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      })

      return docRef.id
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar transação'
      setError(errorMessage)
      throw err
    }
  }, [userId])

  const updateTransaction = useCallback(async (
    transactionId: string,
    updates: Partial<Transaction>
  ) => {
    if (!userId) throw new Error('Usuário não autenticado')

    try {
      setError(null)
      const updateData = {
        ...updates,
        updatedAt: Timestamp.now(),
        date: updates.date ? Timestamp.fromDate(updates.date) : undefined
      }

      // Remove undefined values
      Object.keys(updateData).forEach(key => 
        updateData[key as keyof typeof updateData] === undefined && 
        delete updateData[key as keyof typeof updateData]
      )

      await updateDoc(
        doc(db, 'users', userId, 'lancamentos', transactionId),
        updateData
      )
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar transação'
      setError(errorMessage)
      throw err
    }
  }, [userId])

  const deleteTransaction = useCallback(async (transactionId: string) => {
    if (!userId) throw new Error('Usuário não autenticado')

    try {
      setError(null)
      await deleteDoc(doc(db, 'users', userId, 'lancamentos', transactionId))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar transação'
      setError(errorMessage)
      throw err
    }
  }, [userId])

  const getTransactionsByDateRange = useCallback(async (
    startDate: Date,
    endDate: Date
  ): Promise<Transaction[]> => {
    if (!userId) return []

    try {
      const q = query(
        collection(db, 'users', userId, 'lancamentos'),
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate)),
        orderBy('date', 'desc')
      )

      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate?.() || new Date(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      } as Transaction))
    } catch (err) {
      console.error('Error fetching transactions:', err)
      return []
    }
  }, [userId])

  const getTransactionsByCategory = useCallback(async (
    category: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Transaction[]> => {
    if (!userId) return []

    try {
      let q
      if (startDate && endDate) {
        q = query(
          collection(db, 'users', userId, 'lancamentos'),
          where('category', '==', category),
          where('date', '>=', Timestamp.fromDate(startDate)),
          where('date', '<=', Timestamp.fromDate(endDate)),
          orderBy('date', 'desc')
        )
      } else {
        q = query(
          collection(db, 'users', userId, 'lancamentos'),
          where('category', '==', category),
          orderBy('date', 'desc')
        )
      }

      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate?.() || new Date(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      } as Transaction))
    } catch (err) {
      console.error('Error fetching transactions by category:', err)
      return []
    }
  }, [userId])

  return {
    transactions,
    loading,
    error,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionsByDateRange,
    getTransactionsByCategory
  }
}
