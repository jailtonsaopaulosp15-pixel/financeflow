import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { isSubscriptionActive } from '../utils/subscriptionApi'

interface ProtectedRouteProps {
  children: React.ReactNode
  // Algumas telas (Configurações, a própria tela de assinatura) precisam
  // ficar acessíveis mesmo sem assinatura ativa, para o usuário poder
  // gerenciar/assinar. Passe requireSubscription={false} nessas rotas.
  requireSubscription?: boolean
}

export const ProtectedRoute = ({ children, requireSubscription = true }: ProtectedRouteProps) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nubank-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requireSubscription && !isSubscriptionActive(user) && location.pathname !== '/assinatura') {
    return <Navigate to="/assinatura" replace />
  }

  return <>{children}</>
}
