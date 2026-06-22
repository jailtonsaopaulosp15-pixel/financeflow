import { Link } from 'react-router-dom'
import { Moon, Sun, Upload } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useAppStore } from '../store/appStore'

export const Header = () => {
  const { user } = useAuth()
  const { theme, toggleTheme } = useAppStore()

  const initial = (user?.displayName || user?.email || '?').charAt(0).toUpperCase()

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-nubank-500 to-purple-700 flex items-center justify-center text-white font-bold text-sm">
            FF
          </div>
          <span className="font-bold text-gray-900 dark:text-white">FinanceFlow</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to="/import"
            className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            aria-label="Importar extrato"
            title="Importar extrato"
          >
            <Upload size={16} />
          </Link>
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            aria-label="Alternar tema"
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <Link
            to="/settings"
            className="w-9 h-9 rounded-full bg-nubank-100 dark:bg-nubank-900/40 flex items-center justify-center text-nubank-700 dark:text-nubank-300 font-bold text-sm"
            aria-label="Configurações"
          >
            {initial}
          </Link>
        </div>
      </div>
    </header>
  )
}
