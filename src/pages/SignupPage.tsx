import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff, Loader } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useAppStore } from '../store/appStore'

export const SignupPage = () => {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const { user, error: authError, signup, loginWithGoogle } = useAuth()
  const { addNotification } = useAppStore()

  // O cadastro com Google via redirect volta para esta página depois que o
  // usuário autentica no Google. Se algo falhar nesse retorno (ex.: domínio
  // não autorizado no Firebase), o erro fica só no estado `authError` do
  // useAuth — sem isso, a tela ficava "presa" sem nenhuma mensagem.
  useEffect(() => {
    if (authError) {
      setGoogleLoading(false)
      setLocalError(authError)
      addNotification('error', authError)
    }
  }, [authError])

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const validateForm = (): boolean => {
    if (!displayName.trim()) {
      setLocalError('Por favor, informe seu nome')
      return false
    }

    if (displayName.length < 3) {
      setLocalError('Nome deve ter no mínimo 3 caracteres')
      return false
    }

    if (!email) {
      setLocalError('Por favor, informe seu e-mail')
      return false
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLocalError('E-mail inválido')
      return false
    }

    if (!password) {
      setLocalError('Por favor, informe sua senha')
      return false
    }

    if (password.length < 6) {
      setLocalError('Senha deve ter no mínimo 6 caracteres')
      return false
    }

    if (password !== confirmPassword) {
      setLocalError('Senhas não correspondem')
      return false
    }

    if (!agreedToTerms) {
      setLocalError('Você deve concordar com os Termos de Serviço')
      return false
    }

    return true
  }

  const handleGoogleSignup = async () => {
    setGoogleLoading(true)
    setLocalError(null)
    try {
      // signInWithRedirect navega para fora do app; a tela só volta a executar
      // código aqui se o redirect falhar antes de sair (ex.: rede offline).
      await loginWithGoogle()
    } catch (err) {
      const errorMessage = authError || 'Erro ao entrar com Google'
      setLocalError(errorMessage)
      addNotification('error', errorMessage)
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setLocalError(null)

    try {
      if (!validateForm()) {
        return
      }

      await signup(email, password, displayName)
      addNotification('success', 'Conta criada com sucesso!')
    } catch (err) {
      const errorMessage = authError || 'Erro ao criar conta'
      setLocalError(errorMessage)
      addNotification('error', errorMessage)
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
            FinanceFlow
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Crie sua conta e comece a controlar suas finanças
          </p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 space-y-5">
          {/* Name Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Nome Completo
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value)
                  setLocalError(null)
                }}
                placeholder="João Silva"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-nubank-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
              />
            </div>
          </div>

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

          {/* Confirm Password Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Confirmar Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  setLocalError(null)
                }}
                placeholder="••••••••"
                className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-nubank-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {localError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-800 dark:text-red-200">
              {localError}
            </div>
          )}

          {/* Terms Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-nubank-600 focus:ring-nubank-500 mt-1"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Concordo com os{' '}
              <a href="#" className="text-nubank-600 hover:underline">
                Termos de Serviço
              </a>{' '}
              e a{' '}
              <a href="#" className="text-nubank-600 hover:underline">
                Política de Privacidade
              </a>
            </span>
          </label>

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
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">ou</span>
            <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
          </div>

          {/* Google Sign-Up */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={googleLoading}
            className="w-full py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-3 disabled:opacity-60"
          >
            {googleLoading ? (
              <Loader size={20} className="animate-spin" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20.5h-1.9V20.5H24v7.5h11.3c-1.6 4.5-5.9 7.5-11.3 7.5-6.9 0-12.5-5.6-12.5-12.5S17.1 10.5 24 10.5c3.2 0 6.1 1.2 8.3 3.2l5.3-5.3C34.4 5.4 29.5 3.5 24 3.5 12.7 3.5 3.5 12.7 3.5 24S12.7 44.5 24 44.5 44.5 35.3 44.5 24c0-1.2-.1-2.4-.3-3.5z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.2 4.5C14 15.1 18.6 12.5 24 12.5c3.2 0 6.1 1.2 8.3 3.2l5.3-5.3C34.4 7.4 29.5 5.5 24 5.5c-7.6 0-14.1 4.3-17.7 10.6z"/>
                <path fill="#4CAF50" d="M24 44.5c5.4 0 10.2-1.8 13.9-4.9l-6.4-5.4c-2 1.4-4.6 2.3-7.5 2.3-5.4 0-9.7-3-11.3-7.5l-6.4 4.9C9.9 40.2 16.4 44.5 24 44.5z"/>
                <path fill="#1976D2" d="M43.6 20.5H24v7.5h11.3c-.8 2.2-2.2 4.1-4.1 5.4l6.4 5.4C41.4 35.6 44.5 30.3 44.5 24c0-1.2-.1-2.4-.9-3.5z"/>
              </svg>
            )}
            {googleLoading ? 'Criando conta...' : 'Continuar com Google'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Já tem conta?</span>
            <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
          </div>

          {/* Login Link */}
          <Link
            to="/login"
            className="w-full py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-center"
          >
            Fazer login
          </Link>
        </form>
      </div>
    </div>
  )
}
