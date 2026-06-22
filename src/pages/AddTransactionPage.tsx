import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, DollarSign, FileUp, Plus } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useTransactions } from '../hooks/useTransactions'
import { useCategories } from '../hooks/useCategories'
import { useAppStore } from '../store/appStore'

export const AddTransactionPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addTransaction } = useTransactions(user?.uid || null)
  const { categories } = useCategories(user?.uid || null)
  const { addNotification } = useAppStore()

  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const filteredCategories = categories.filter((cat) => cat.type === formData.type)

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Valor deve ser maior que 0'
    }

    if (!formData.category) {
      newErrors.category = 'Selecione uma categoria'
    }

    if (!formData.date) {
      newErrors.date = 'Informe a data'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      const date = new Date(formData.date)
      await addTransaction(
        formData.type,
        parseFloat(formData.amount),
        formData.category,
        date,
        formData.description,
        formData.notes
      )

      addNotification('success', `Transação de ${formData.type === 'income' ? 'receita' : 'despesa'} adicionada com sucesso!`)
      
      // Reset form
      setFormData({
        type: 'expense',
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        notes: '',
      })

      // Navigate back
      setTimeout(() => {
        navigate(-1)
      }, 1500)
    } catch (error) {
      addNotification('error', 'Erro ao adicionar transação')
    } finally {
      setLoading(false)
    }
  }

  const expenseCategories = categories.filter((cat) => cat.type === 'expense')
  const incomeCategories = categories.filter((cat) => cat.type === 'income')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="page-header bg-gradient-to-r from-nubank-600 to-nubank-800 text-white rounded-b-3xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white hover:text-nubank-100 mb-4 transition-colors"
        >
          <ArrowLeft size={20} />
          Voltar
        </button>
        <h1 className="text-3xl font-bold">Nova Transação</h1>
      </div>

      <div className="page-content max-w-2xl">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 space-y-6">
          {/* Type Selection */}
          <div>
            <label className="form-label">Tipo de Transação</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'income', category: '' })}
                className={`p-4 rounded-xl border-2 transition-all ${
                  formData.type === 'income'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <DollarSign className={`mx-auto mb-2 ${
                  formData.type === 'income' ? 'text-green-600' : 'text-gray-600 dark:text-gray-400'
                }`} size={24} />
                <span className={`font-semibold block ${
                  formData.type === 'income' ? 'text-green-600' : 'text-gray-900 dark:text-white'
                }`}>
                  Receita
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'expense', category: '' })}
                className={`p-4 rounded-xl border-2 transition-all ${
                  formData.type === 'expense'
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <DollarSign className={`mx-auto mb-2 ${
                  formData.type === 'expense' ? 'text-red-600' : 'text-gray-600 dark:text-gray-400'
                }`} size={24} />
                <span className={`font-semibold block ${
                  formData.type === 'expense' ? 'text-red-600' : 'text-gray-900 dark:text-white'
                }`}>
                  Despesa
                </span>
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="form-label">Valor</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => {
                  setFormData({ ...formData, amount: e.target.value })
                  if (errors.amount) setErrors({ ...errors, amount: '' })
                }}
                placeholder="0,00"
                className={`form-input pl-12 ${errors.amount ? 'ring-2 ring-red-500' : ''}`}
              />
            </div>
            {errors.amount && <p className="text-red-600 dark:text-red-400 text-sm mt-2">{errors.amount}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="form-label">Categoria</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {filteredCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, category: cat.name })
                    if (errors.category) setErrors({ ...errors, category: '' })
                  }}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${
                    formData.category === cat.name
                      ? 'border-nubank-500 bg-nubank-50 dark:bg-nubank-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <span className="text-2xl mb-2 block">{cat.icon}</span>
                  <span className="text-xs font-semibold line-clamp-2">{cat.name}</span>
                </button>
              ))}
            </div>
            {errors.category && <p className="text-red-600 dark:text-red-400 text-sm mt-2">{errors.category}</p>}
          </div>

          {/* Date */}
          <div>
            <label className="form-label">Data</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => {
                setFormData({ ...formData, date: e.target.value })
                if (errors.date) setErrors({ ...errors, date: '' })
              }}
              className={`form-input ${errors.date ? 'ring-2 ring-red-500' : ''}`}
            />
            {errors.date && <p className="text-red-600 dark:text-red-400 text-sm mt-2">{errors.date}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="form-label">Descrição</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value })
                if (errors.description) setErrors({ ...errors, description: '' })
              }}
              placeholder="Ex: Compra no supermercado"
              className={`form-input ${errors.description ? 'ring-2 ring-red-500' : ''}`}
            />
            {errors.description && <p className="text-red-600 dark:text-red-400 text-sm mt-2">{errors.description}</p>}
          </div>

          {/* Notes */}
          <div>
            <label className="form-label">Observações (opcional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Detalhes adicionais..."
              rows={4}
              className="form-input resize-none"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              {loading ? 'Salvando...' : 'Adicionar Transação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
