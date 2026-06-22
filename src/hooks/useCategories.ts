import { useCallback, useEffect, useState } from 'react'
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  Timestamp
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { Category } from '../types'

export const useCategories = (userId: string | null) => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Real-time listener for categories
  useEffect(() => {
    if (!userId) {
      setCategories([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'users', userId, 'categories'),
      orderBy('name', 'asc')
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
              createdAt: docData.createdAt?.toDate ? docData.createdAt.toDate() : new Date(),
            } as Category
          })
          setCategories(data)
          setError(null)
        } catch (err) {
          console.error('Error loading categories:', err)
          setError('Erro ao carregar categorias')
        } finally {
          setLoading(false)
        }
      },
      (err) => {
        console.error('Snapshot listener error:', err)
        setError('Erro ao sincronizar categorias')
        setLoading(false)
      }
    )

    return unsubscribe
  }, [userId])

  const addCategory = useCallback(async (
    name: string,
    type: 'income' | 'expense',
    icon: string,
    color: string
  ) => {
    if (!userId) throw new Error('Usuário não autenticado')

    try {
      setError(null)
      const docRef = await addDoc(collection(db, 'users', userId, 'categories'), {
        name,
        type,
        icon,
        color,
        createdAt: Timestamp.now()
      })

      return docRef.id
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar categoria'
      setError(errorMessage)
      throw err
    }
  }, [userId])

  const updateCategory = useCallback(async (
    categoryId: string,
    updates: Partial<Category>
  ) => {
    if (!userId) throw new Error('Usuário não autenticado')

    try {
      setError(null)
      const updateData = { ...updates }
      
      // Remove createdAt to prevent overwriting
      delete updateData.createdAt
      delete updateData.id

      await updateDoc(
        doc(db, 'users', userId, 'categories', categoryId),
        updateData
      )
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar categoria'
      setError(errorMessage)
      throw err
    }
  }, [userId])

  const deleteCategory = useCallback(async (categoryId: string) => {
    if (!userId) throw new Error('Usuário não autenticado')

    try {
      setError(null)
      await deleteDoc(doc(db, 'users', userId, 'categories', categoryId))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar categoria'
      setError(errorMessage)
      throw err
    }
  }, [userId])

  const getCategoryById = useCallback((categoryId: string): Category | null => {
    return categories.find(cat => cat.id === categoryId) || null
  }, [categories])

  const getCategoriesByType = useCallback((type: 'income' | 'expense'): Category[] => {
    return categories.filter(cat => cat.type === type)
  }, [categories])

  return {
    categories,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    getCategoriesByType
  }
}
