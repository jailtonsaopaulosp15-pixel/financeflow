import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Mail, Loader, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useAppStore } from '../store/appStore'

export const RecoverPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const { user, error: authError, resetPassword } = useAuth()
  const { addNotification } = useAppStore()

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (!email) {
      setLocalError('Por favor, informe seu e-mail')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLocalError('E-mail inválido')
      return
    }

    setLoading(true)
    try {
      await resetPassword(email)
      setSent(true)
    } catch (err) {
      // Por segurança, não revelamos se o e-mail existe ou não na base.
      // Tratamos como sucesso visualmente, exceto em erros genuínos de formato/limite.
      const errorMessage = authError || ''
      if (errorMessage.includes('Muitas tentativas')) {
        setLocalError(errorMessage)
        addNotification('error', errorMessage)
      } else {
        setSent(true)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-nubank-500 to-nubank-700 rounded-xl mb-4">
            <span className="text-white font-bold text-xl">FF</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Recuperar senha
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Vamos te ajudar a voltar a acessar sua conta
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full">
                <CheckCircle2 className="text-green-600" size={28} />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Verifique seu e-mail
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Se houver uma conta cadastrada com <strong>{email}</strong>, enviamos um link para redefinir sua senha. Confira também a caixa de spam.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-nubank-600 hover:text-nubank-700 dark:text-nubank-400 dark:hover:text-nubank-300 font-medium transition-colors mt-2"
              >
                <ArrowLeft size={16} />
                Voltar para o login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setLocalError(null)
                    }}
                    placeholder="seu@email.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-nubank-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                  />
                </div>
              </div>

              {localError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-800 dark:text-red-200">
                  {localError}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`
                  w-full py-3 bg-gradient-to-r from-nubank-500 to-nubank-700 text-white font-semibold rounded-lg
                  transition-all duration-200 flex items-center justify-center gap-2
                  ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-lg transform hover:scale-105'}
                `}
              >
                {loading && <Loader size={20} className="animate-spin" />}
                {loading ? 'Enviando...' : 'Enviar link de recuperação'}
              </button>

              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white font-medium transition-colors"
              >
                <ArrowLeft size={16} />
                Voltar para o login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
