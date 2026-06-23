import { createContext, useContext, ReactNode } from 'react'
import { useTransactions as useTransactionsRaw } from '../hooks/useTransactions'
import { useCategories as useCategoriesRaw } from '../hooks/useCategories'

// Antes, cada página chamava useTransactions/useCategories por conta própria.
// Como as páginas são carregadas via lazy-loading, cada troca de aba
// desmontava a página anterior e montava uma nova do zero — isso reiniciava
// o estado (transactions = [], loading = true) e criava uma NOVA assinatura
// onSnapshot no Firestore. Em conexões mais lentas/instáveis (comum no
// iPhone, principalmente saindo do background), a tela mostrava valores
// zerados até a nova assinatura terminar de buscar os dados.
//
// Este provider sobe os dados para um nível acima das rotas, então a
// assinatura é criada uma única vez (por usuário logado) e compartilhada
// entre todas as páginas — trocar de aba não reseta nada.

type TransactionsValue = ReturnType<typeof useTransactionsRaw>
type CategoriesValue = ReturnType<typeof useCategoriesRaw>

const TransactionsContext = createContext<TransactionsValue | null>(null)
const CategoriesContext = createContext<CategoriesValue | null>(null)

interface DataProviderProps {
  userId: string | null
  children: ReactNode
}

export const DataProvider = ({ userId, children }: DataProviderProps) => {
  const transactionsValue = useTransactionsRaw(userId)
  const categoriesValue = useCategoriesRaw(userId)

  return (
    <TransactionsContext.Provider value={transactionsValue}>
      <CategoriesContext.Provider value={categoriesValue}>
        {children}
      </CategoriesContext.Provider>
    </TransactionsContext.Provider>
  )
}

export const useTransactions = (): TransactionsValue => {
  const ctx = useContext(TransactionsContext)
  if (!ctx) throw new Error('useTransactions deve ser usado dentro de DataProvider')
  return ctx
}

export const useCategories = (): CategoriesValue => {
  const ctx = useContext(CategoriesContext)
  if (!ctx) throw new Error('useCategories deve ser usado dentro de DataProvider')
  return ctx
}
