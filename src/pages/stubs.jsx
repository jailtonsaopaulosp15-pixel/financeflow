import { useAuth } from '../hooks/useAuth'

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
