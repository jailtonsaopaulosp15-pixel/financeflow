import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'

export const FloatingActionButton = () => {
  return (
    <Link
      to="/add-transaction"
      className="fixed bottom-20 right-4 sm:right-[max(1rem,calc(50%-21rem))] z-40 w-14 h-14 rounded-full bg-gradient-to-br from-nubank-500 to-purple-700 text-white shadow-xl flex items-center justify-center hover:shadow-2xl active:scale-95 transition-all"
      aria-label="Nova transação"
    >
      <Plus size={26} />
    </Link>
  )
}
