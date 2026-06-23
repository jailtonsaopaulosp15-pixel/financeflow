import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useAppStore } from '../store/appStore'
import { createSubscription } from '../utils/subscriptionApi'

const formatDate = (date?: Date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('pt-BR')
}

const daysLeft = (date?: Date) => {
  if (!date) return 0
  const diff = new Date(date).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export const AssinaturaPage = () => {
  const { user, logout } = useAuth()
  const { addNotification } = useAppStore()
  const [loading, setLoading] = useState(false)

  const status = user?.subscriptionStatus
  const trialActive = status === 'trial' && daysLeft(user?.trialEndsAt) > 0

  const handleSubscribe = async () => {
    try {
      setLoading(true)
      const initPoint = await createSubscription()
      window.location.href = initPoint
    } catch (err) {
      addNotification('error', err instanceof Error ? err.message : 'Erro ao iniciar assinatura')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="card p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-4">💳</div>

        {trialActive ? (
          <>
            <h1 className="text-xl font-bold mb-2">Seu período de teste está ativo</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Restam {daysLeft(user?.trialEndsAt)} dia(s) de teste grátis. Assine agora para continuar
              usando o FinanceFlow sem interrupção quando o trial acabar.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold mb-2">Assinatura necessária</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {status === 'cancelled' || status === 'paused'
                ? 'Sua assinatura está inativa. Assine novamente para continuar usando o FinanceFlow.'
                : 'Seu período de teste grátis terminou. Assine para continuar usando o FinanceFlow.'}
            </p>
          </>
        )}

        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6">
          <p className="text-3xl font-bold text-nubank-600">R$ 9,90</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">por mês, cancele quando quiser</p>
        </div>

        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="btn-primary w-full py-3 mb-3 disabled:opacity-60"
        >
          {loading ? 'Redirecionando...' : 'Assinar agora — R$ 9,90/mês'}
        </button>

        {trialActive && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Seu teste grátis vai até {formatDate(user?.trialEndsAt)}.
          </p>
        )}

        <button onClick={() => logout()} className="text-sm text-gray-500 dark:text-gray-400 underline">
          Sair da conta
        </button>
      </div>
    </div>
  )
}
