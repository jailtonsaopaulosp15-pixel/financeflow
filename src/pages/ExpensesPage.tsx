import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Check, X, Loader } from 'lucide-react'
import { useTransactions, useCategories } from '../contexts/DataProvider'
import { useAppStore } from '../store/appStore'
import { usePagination } from '../hooks/usePagination'
import { Pagination } from '../components/Pagination'
import { Transaction } from '../types'

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const monthOptions = () => {
  const now = new Date()
  const options: { value: string; label: string }[] = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) })
  }
  return options
}

export const ExpensesPage = () => {
  const navigate = useNavigate()
  const { transactions, loading, updateTransaction, deleteTransaction } = useTransactions()
  const { categories } = useCategories()
  const { addNotification } = useAppStore()

  const months = useMemo(monthOptions, [])
  const [selectedMonth, setSelectedMonth] = useState(months[0].value)
  const [selectedCategory, setSelectedCategory] = useState('all')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ amount: '', category: '', description: '', date: '' })
  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const expenseCategories = categories.filter((cat) => cat.type === 'expense')

  const filtered = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'expense')
      .filter((t) => {
        const d = new Date(t.date)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        return key === selectedMonth
      })
      .filter((t) => selectedCategory === 'all' || t.category === selectedCategory)
  }, [transactions, selectedMonth, selectedCategory])

  const total = filtered.reduce((sum, t) => sum + t.amount, 0)

  const {
    pageItems, page, totalPages, totalItems, pageSize, hasPrev, hasNext, prevPage, nextPage,
  } = usePagination(filtered, 20, `${selectedMonth}-${selectedCategory}`)

  const startEdit = (t: Transaction) => {
    setEditingId(t.id)
    setEditForm({
      amount: String(t.amount),
      category: t.category,
      description: t.description,
      date: new Date(t.date).toISOString().split('T')[0],
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const saveEdit = async () => {
    if (!editingId) return

    const amount = parseFloat(editForm.amount)
    if (!amount || amount <= 0) {
      addNotification('error', 'Valor inválido')
      return
    }
    if (!editForm.description.trim()) {
      addNotification('error', 'Descrição é obrigatória')
      return
    }

    setSavingEdit(true)
    try {
      await updateTransaction(editingId, {
        amount,
        category: editForm.category,
        description: editForm.description.trim(),
        date: new Date(editForm.date),
      })
      addNotification('success', 'Despesa atualizada com sucesso!')
      setEditingId(null)
    } catch (err) {
      addNotification('error', 'Erro ao atualizar despesa')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta despesa?')) return

    setDeletingId(id)
    try {
      await deleteTransaction(id)
      addNotification('success', 'Despesa excluída')
    } catch (err) {
      addNotification('error', 'Erro ao excluir despesa')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="page-header bg-gradient-to-r from-red-600 to-red-800 text-white rounded-b-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Despesas</h1>
            <p className="text-red-100">Acompanhe suas despesas</p>
          </div>
          <button
            onClick={() => navigate('/add-transaction')}
            className="flex items-center gap-2 bg-white text-red-700 font-semibold py-2 px-4 rounded-lg hover:shadow-lg transition-all"
          >
            <Plus size={18} />
            Nova despesa
          </button>
        </div>
      </div>

      <div className="page-content space-y-6">
        {/* Filters */}
        <div className="card p-4 flex flex-wrap gap-4 items-center">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="form-input max-w-xs"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="form-input max-w-xs"
          >
            <option value="all">Todas as categorias</option>
            {expenseCategories.map((cat) => (
              <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>
            ))}
          </select>

          <div className="ml-auto text-right">
            <p className="text-sm text-secondary">Total no período</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(total)}</p>
          </div>
        </div>

        {/* List */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-600 dark:text-gray-400">
              Nenhuma despesa encontrada para este período.
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {pageItems.map((t) => (
                <div key={t.id} className="p-4">
                  {editingId === t.id ? (
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.amount}
                        onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                        className="form-input"
                        placeholder="Valor"
                      />
                      <select
                        value={editForm.category}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        className="form-input"
                      >
                        {expenseCategories.map((cat) => (
                          <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="form-input"
                        placeholder="Descrição"
                      />
                      <input
                        type="date"
                        value={editForm.date}
                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                        className="form-input"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={saveEdit}
                          disabled={savingEdit}
                          className="flex-1 flex items-center justify-center gap-1 bg-red-600 text-white rounded-lg py-2 hover:bg-red-700 transition-colors disabled:opacity-70"
                        >
                          {savingEdit ? <Loader size={16} className="animate-spin" /> : <Check size={16} />}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex-1 flex items-center justify-center gap-1 border border-gray-300 dark:border-gray-600 rounded-lg py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-11 h-11 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-xl shrink-0">
                          {expenseCategories.find((c) => c.name === t.category)?.icon || '💸'}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white truncate">{t.description}</p>
                          <p className="text-sm text-secondary">
                            {t.category} • {new Date(t.date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="font-bold text-red-600">{formatCurrency(t.amount)}</span>
                        <button
                          onClick={() => startEdit(t)}
                          className="text-gray-500 hover:text-nubank-600 transition-colors"
                          aria-label="Editar"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          disabled={deletingId === t.id}
                          className="text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
                          aria-label="Excluir"
                        >
                          {deletingId === t.id ? <Loader size={18} className="animate-spin" /> : <Trash2 size={18} />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            hasPrev={hasPrev}
            hasNext={hasNext}
            onPrev={prevPage}
            onNext={nextPage}
          />
        </div>
      </div>
    </div>
  )
}
