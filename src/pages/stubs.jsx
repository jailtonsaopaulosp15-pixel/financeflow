import { useAuth } from '../hooks/useAuth'

// Incomes Page
export const IncomesPage = () => {
  const { user } = useAuth()
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="page-header bg-gradient-to-r from-green-600 to-green-800 text-white rounded-b-3xl">
        <h1 className="text-3xl font-bold">Receitas</h1>
        <p className="text-green-100">Gerencie suas receitas</p>
      </div>
      <div className="page-content">
        <div className="card p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">Página de Receitas - Em desenvolvimento</p>
        </div>
      </div>
    </div>
  )
}

// Expenses Page  
export const ExpensesPage = () => {
  const { user } = useAuth()
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="page-header bg-gradient-to-r from-red-600 to-red-800 text-white rounded-b-3xl">
        <h1 className="text-3xl font-bold">Despesas</h1>
        <p className="text-red-100">Acompanhe suas despesas</p>
      </div>
      <div className="page-content">
        <div className="card p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">Página de Despesas - Em desenvolvimento</p>
        </div>
      </div>
    </div>
  )
}

// Reports Page
export const ReportsPage = () => {
  const { user } = useAuth()
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="page-header bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-b-3xl">
        <h1 className="text-3xl font-bold">Relatórios</h1>
        <p className="text-blue-100">Análise detalhada de suas finanças</p>
      </div>
      <div className="page-content">
        <div className="card p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">Página de Relatórios - Em desenvolvimento</p>
        </div>
      </div>
    </div>
  )
}
