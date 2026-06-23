import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Lock, Moon, Sun, LogOut, Loader, Check, CreditCard } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useAppStore } from '../store/appStore'
import { cancelSubscription } from '../utils/subscriptionApi'

const daysLeft = (date?: Date) => {
  if (!date) return 0
  const diff = new Date(date).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

const statusLabel = (status?: string, trialEndsAt?: Date) => {
  switch (status) {
    case 'trial':
      return daysLeft(trialEndsAt) > 0
        ? `Período de teste — ${daysLeft(trialEndsAt)} dia(s) restante(s)`
        : 'Período de teste encerrado'
    case 'authorized':
      return 'Assinatura ativa'
    case 'pending':
      return 'Pagamento pendente de confirmação'
    case 'paused':
      return 'Assinatura pausada'
    case 'cancelled':
      return 'Assinatura cancelada'
    default:
      return 'Sem assinatura'
  }
}

export const SettingsPage = () => {
  const { user, logout, resetPassword, updateUserName } = useAuth()
  const { theme, toggleTheme, addNotification } = useAppStore()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [savingName, setSavingName] = useState(false)
  const [sendingReset, setSendingReset] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName.trim()) {
      addNotification('error', 'O nome não pode ficar em branco')
      return
    }

    setSavingName(true)
    try {
      await updateUserName(displayName.trim())
      addNotification('success', 'Nome atualizado com sucesso!')
    } catch (err) {
      addNotification('error', 'Erro ao atualizar o nome')
    } finally {
      setSavingName(false)
    }
  }

  const handleResetPassword = async () => {
    if (!user?.email) return
    setSendingReset(true)
    try {
      await resetPassword(user.email)
      addNotification('success', `E-mail de redefinição enviado para ${user.email}`)
    } catch (err) {
      addNotification('error', 'Erro ao enviar e-mail de redefinição')
    } finally {
      setSendingReset(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!window.confirm('Tem certeza que deseja cancelar sua assinatura?')) return
    setCancelling(true)
    try {
      await cancelSubscription()
      addNotification('success', 'Assinatura cancelada com sucesso')
    } catch (err) {
      addNotification('error', err instanceof Error ? err.message : 'Erro ao cancelar assinatura')
    } finally {
      setCancelling(false)
    }
  }

  const hasActiveOrPending = user?.subscriptionStatus === 'authorized' || user?.subscriptionStatus === 'pending'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="page-header bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-b-3xl">
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-purple-100">Gerencie sua conta</p>
      </div>

      <div className="page-content space-y-6">
        {/* Profile */}
        <div className="card p-6 max-w-xl">
          <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
            <User size={20} />
            Perfil
          </h2>

          <form onSubmit={handleSaveName} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Nome de exibição
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-nubank-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                <Mail size={14} className="inline mr-1" />
                E-mail
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              disabled={savingName}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-nubank-500 to-nubank-700 text-white font-semibold py-3 px-6 rounded-lg hover:shadow-lg transition-all disabled:opacity-70"
            >
              {savingName ? <Loader size={18} className="animate-spin" /> : <Check size={18} />}
              Salvar nome
            </button>
          </form>
        </div>

        {/* Subscription */}
        <div className="card p-6 max-w-xl">
          <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
            <CreditCard size={20} />
            Assinatura
          </h2>
          <p className="text-sm text-secondary mb-4">
            {statusLabel(user?.subscriptionStatus, user?.trialEndsAt)}
          </p>

          {hasActiveOrPending ? (
            <button
              onClick={handleCancelSubscription}
              disabled={cancelling}
              className="flex items-center justify-center gap-2 border-2 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 font-semibold py-3 px-6 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-70"
            >
              {cancelling && <Loader size={18} className="animate-spin" />}
              Cancelar assinatura
            </button>
          ) : (
            <button
              onClick={() => navigate('/assinatura')}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-nubank-500 to-nubank-700 text-white font-semibold py-3 px-6 rounded-lg hover:shadow-lg transition-all"
            >
              Assinar agora — R$ 9,90/mês
            </button>
          )}
        </div>

        {/* Security */}
        <div className="card p-6 max-w-xl">
          <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
            <Lock size={20} />
            Segurança
          </h2>
          <p className="text-sm text-secondary mb-4">
            Enviaremos um e-mail para você redefinir sua senha.
          </p>
          <button
            onClick={handleResetPassword}
            disabled={sendingReset}
            className="flex items-center justify-center gap-2 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-70"
          >
            {sendingReset && <Loader size={18} className="animate-spin" />}
            Enviar e-mail de redefinição de senha
          </button>
        </div>

        {/* Preferences */}
        <div className="card p-6 max-w-xl">
          <h2 className="text-lg font-bold text-primary mb-4">Preferências</h2>
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="flex items-center gap-2 text-gray-900 dark:text-white font-medium">
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              {theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}
            </span>
          </button>
        </div>

        {/* Account */}
        <div className="card p-6 max-w-xl">
          <h2 className="text-lg font-bold text-primary mb-4">Conta</h2>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold py-3 px-6 rounded-lg border-2 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={18} />
            Sair da conta
          </button>
        </div>
      </div>
    </div>
  )
}
