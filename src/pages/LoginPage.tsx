import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Loader } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useAppStore } from '../store/appStore'

export const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const { user, error: authError, login } = useAuth()
  const { addNotification } = useAppStore()

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setLocalError(null)

    try {
      if (!email || !password) {
        setLocalError('Por favor, preencha todos os campos')
        return
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setLocalError('E-mail inválido')
        return
      }

      await login(email, password)
      addNotification('success', 'Login realizado com sucesso!')
    } catch (err) {
      const errorMessage = authError || 'Erro ao fazer login'
      setLocalError(errorMessage)
      addNotification('error', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = () => {
    // Redirect to password recovery
    window.location.href = '/recover-password'
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
            FinanceFlow
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Controle suas finanças de forma inteligente
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 space-y-6">
          {/* Email Input */}
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

          {/* Password Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setLocalError(null)
                }}
                placeholder="••••••••"
                className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-nubank-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {localError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-800 dark:text-red-200">
              {localError}
            </div>
          )}

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-nubank-600 focus:ring-nubank-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">Lembrar-me</span>
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm text-nubank-600 hover:text-nubank-700 dark:text-nubank-400 dark:hover:text-nubank-300 font-medium transition-colors"
            >
              Esqueceu a senha?
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`
              w-full py-3 bg-gradient-to-r from-nubank-500 to-nubank-700 text-white font-semibold rounded-lg
              transition-all duration-200 flex items-center justify-center gap-2
              ${loading
                ? 'opacity-70 cursor-not-allowed'
                : 'hover:shadow-lg transform hover:scale-105'
              }
            `}
          >
            {loading && <Loader size={20} className="animate-spin" />}
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Novo por aqui?</span>
            <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
          </div>

          {/* Sign Up Link */}
          <Link
            to="/signup"
            className="w-full py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-center"
          >
            Criar conta
          </Link>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
          Ao entrar, você concorda com nossos{' '}
          <a href="#" className="text-nubank-600 hover:underline">
            Termos de Serviço
          </a>
        </p>
      </div>
    </div>
  )
}
