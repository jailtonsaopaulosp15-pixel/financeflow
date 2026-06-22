import { Link, useLocation } from 'react-router-dom'
import { Home, TrendingUp, TrendingDown, BarChart3, Settings } from 'lucide-react'

const navItems = [
  { path: '/dashboard', label: 'Início', icon: Home },
  { path: '/incomes', label: 'Receitas', icon: TrendingUp },
  { path: '/expenses', label: 'Despesas', icon: TrendingDown },
  { path: '/reports', label: 'Análise', icon: BarChart3 },
  { path: '/settings', label: 'Config.', icon: Settings },
]

export const BottomNav = () => {
  const location = useLocation()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 pb-[env(safe-area-inset-bottom)]">
      <ul className="flex items-stretch justify-around">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path

          return (
            <li key={item.path} className="flex-1">
              <Link
                to={item.path}
                className={`flex flex-col items-center justify-center gap-1 py-2 transition-colors ${
                  isActive ? 'text-nubank-600 dark:text-nubank-400' : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                <Icon size={22} />
                <span className="text-[11px] font-medium">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
