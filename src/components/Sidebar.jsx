import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Home,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Settings,
  LogOut,
  Plus
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useAppStore } from '../store/appStore'

export const Sidebar = () => {
  const location = useLocation()
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useAppStore()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/incomes', label: 'Receitas', icon: TrendingUp },
    { path: '/expenses', label: 'Despesas', icon: TrendingDown },
    { path: '/reports', label: 'Relatórios', icon: BarChart3 },
    { path: '/settings', label: 'Configurações', icon: Settings },
  ]

  const handleLogout = async () => {
    try {
      await logout()
      setShowLogoutConfirm(false)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <>
      {/* Sidebar (desktop only — mobile uses BottomNav) */}
      <aside className="
        hidden md:block fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-gray-900 to-gray-800
        dark:from-gray-950 dark:to-gray-900 text-white z-40 overflow-y-auto scrollbar-hide
      ">
        {/* Logo */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-nubank-500 to-nubank-700 rounded-lg flex items-center justify-center font-bold text-lg">
              FF
            </div>
            <div>
              <h1 className="text-xl font-bold">FinanceFlow</h1>
              <p className="text-xs text-gray-400">Gestão Financeira</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="p-4 bg-gray-800/50 border-b border-gray-700">
            <p className="text-sm text-gray-300">Bem-vindo,</p>
            <p className="font-semibold text-white truncate">{user.displayName || user.email}</p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-6">
          <ul className="space-y-2 px-3">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                      ${isActive
                        ? 'bg-nubank-600 text-white shadow-lg'
                        : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                      }
                    `}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Quick Actions */}
        <div className="p-3 border-t border-gray-700">
          <Link
            to="/add-transaction"
            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-nubank-500 to-nubank-600 hover:from-nubank-600 hover:to-nubank-700 text-white py-3 rounded-lg font-semibold transition-all duration-200 mb-4"
          >
            <Plus size={20} />
            Nova Transação
          </Link>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-700 space-y-2">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-700/50 rounded-lg transition-colors"
          >
            <div className="w-4 h-4 rounded-full bg-gray-400"></div>
            <span className="text-sm">{theme === 'light' ? 'Tema Escuro' : 'Tema Claro'}</span>
          </button>
          
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span className="text-sm">Sair</span>
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-sm w-full p-6 animate-fade-in">
            <h2 className="text-xl font-bold mb-2">Confirmar saída</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Tem certeza de que deseja sair da sua conta?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
