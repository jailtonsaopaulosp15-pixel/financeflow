import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, Loader, Check, X, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useTransactions } from '../hooks/useTransactions'
import { useAppStore } from '../store/appStore'
import { extractPdfLines, parseStatementLines, ParsedTransaction } from '../utils/statementParser'

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const ImportStatementPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addTransaction } = useTransactions(user?.uid || null)
  const { addNotification } = useAppStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [fileName, setFileName] = useState<string | null>(null)
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [rows, setRows] = useState<ParsedTransaction[]>([])
  const [importing, setImporting] = useState(false)

  const handleFile = async (file: File) => {
    setFileName(file.name)
    setParsing(true)
    setParseError(null)
    setRows([])

    try {
      const lines = await extractPdfLines(file)
      const parsed = parseStatementLines(lines, new Date().getFullYear())

      if (parsed.length === 0) {
        setParseError(
          'Não consegui identificar lançamentos automaticamente neste PDF. O formato do extrato pode ser diferente do esperado — você pode tentar outro arquivo ou cadastrar manualmente.'
        )
      }

      setRows(parsed)
    } catch (err) {
      console.error(err)
      setParseError('Erro ao ler o PDF. Verifique se o arquivo não está protegido por senha.')
    } finally {
      setParsing(false)
    }
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const updateRow = (index: number, updates: Partial<ParsedTransaction>) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...updates } : r)))
  }

  const toggleAll = (include: boolean) => {
    setRows((prev) => prev.map((r) => ({ ...r, include })))
  }

  const selectedRows = rows.filter((r) => r.include)
  const totalIncome = selectedRows.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0)
  const totalExpense = selectedRows.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0)

  const handleImport = async () => {
    if (selectedRows.length === 0) {
      addNotification('error', 'Selecione ao menos uma transação para importar')
      return
    }

    setImporting(true)
    let success = 0
    let failed = 0

    for (const row of selectedRows) {
      try {
        await addTransaction(row.type, row.amount, row.category, row.date, row.description)
        success++
      } catch (err) {
        failed++
      }
    }

    setImporting(false)

    if (success > 0) {
      addNotification('success', `${success} transação(ões) importada(s) com sucesso!`)
    }
    if (failed > 0) {
      addNotification('error', `${failed} transação(ões) falharam ao importar`)
    }
    if (success > 0) {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="page-header bg-gradient-to-r from-indigo-600 to-blue-700 text-white rounded-b-3xl">
        <h1 className="text-3xl font-bold">Importar Extrato</h1>
        <p className="text-indigo-100">Envie o PDF do seu extrato bancário e preenchemos as transações automaticamente</p>
      </div>

      <div className="page-content space-y-6">
        {/* Upload area */}
        <div className="card p-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={onFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={parsing}
            className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl py-10 flex flex-col items-center gap-3 hover:border-nubank-500 hover:bg-nubank-50 dark:hover:bg-nubank-900/10 transition-colors disabled:opacity-60"
          >
            {parsing ? (
              <Loader size={32} className="animate-spin text-nubank-600" />
            ) : (
              <Upload size={32} className="text-gray-400" />
            )}
            <div className="text-center">
              <p className="font-semibold text-gray-900 dark:text-white">
                {parsing ? 'Lendo o PDF...' : fileName || 'Clique para escolher o PDF do extrato'}
              </p>
              <p className="text-sm text-secondary mt-1">Apenas arquivos .pdf</p>
            </div>
          </button>

          {parseError && (
            <div className="mt-4 flex items-start gap-2 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-sm">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <p>{parseError}</p>
            </div>
          )}
        </div>

        {/* Preview / review table */}
        {rows.length > 0 && (
          <>
            <div className="card p-4 flex flex-wrap items-center gap-4">
              <div>
                <p className="text-sm text-secondary">Detectadas</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{rows.length} transações</p>
              </div>
              <div>
                <p className="text-sm text-secondary">Receitas selecionadas</p>
                <p className="text-lg font-bold text-success-600">{formatCurrency(totalIncome)}</p>
              </div>
              <div>
                <p className="text-sm text-secondary">Despesas selecionadas</p>
                <p className="text-lg font-bold text-danger-600">{formatCurrency(totalExpense)}</p>
              </div>
              <div className="ml-auto flex gap-2">
                <button onClick={() => toggleAll(true)} className="text-sm text-nubank-600 hover:underline">Marcar todas</button>
                <button onClick={() => toggleAll(false)} className="text-sm text-gray-500 hover:underline">Desmarcar todas</button>
              </div>
            </div>

            <div className="card overflow-hidden">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {rows.map((row, idx) => (
                  <div key={idx} className={`p-4 flex flex-wrap items-center gap-3 ${!row.include ? 'opacity-40' : ''}`}>
                    <input
                      type="checkbox"
                      checked={row.include}
                      onChange={(e) => updateRow(idx, { include: e.target.checked })}
                      className="w-5 h-5 accent-nubank-600 shrink-0"
                    />

                    <button
                      onClick={() => updateRow(idx, { type: row.type === 'income' ? 'expense' : 'income' })}
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        row.type === 'income'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}
                      title="Alternar tipo"
                    >
                      {row.type === 'income' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                    </button>

                    <input
                      type="text"
                      value={row.description}
                      onChange={(e) => updateRow(idx, { description: e.target.value })}
                      className="form-input flex-1 min-w-[140px]"
                    />

                    <input
                      type="text"
                      value={row.category}
                      onChange={(e) => updateRow(idx, { category: e.target.value })}
                      className="form-input w-40"
                    />

                    <input
                      type="date"
                      value={row.date.toISOString().split('T')[0]}
                      onChange={(e) => updateRow(idx, { date: new Date(e.target.value) })}
                      className="form-input w-36"
                    />

                    <input
                      type="number"
                      step="0.01"
                      value={row.amount}
                      onChange={(e) => updateRow(idx, { amount: parseFloat(e.target.value) || 0 })}
                      className={`form-input w-28 font-semibold ${row.type === 'income' ? 'text-success-600' : 'text-danger-600'}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleImport}
                disabled={importing || selectedRows.length === 0}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {importing ? <Loader size={18} className="animate-spin" /> : <Check size={18} />}
                Importar {selectedRows.length} transação(ões)
              </button>
              <button
                onClick={() => { setRows([]); setFileName(null) }}
                className="btn-secondary flex items-center gap-2"
              >
                <X size={18} />
                Cancelar
              </button>
            </div>
          </>
        )}

        {rows.length === 0 && !parsing && (
          <div className="card p-6 flex items-start gap-3 text-secondary text-sm">
            <FileText size={20} className="shrink-0 mt-0.5" />
            <p>
              Funciona melhor com extratos em PDF gerados diretamente pelo banco (não fotos/scans).
              Após enviar, revise as categorias e valores detectados antes de confirmar a importação —
              a categorização automática é uma estimativa baseada na descrição do lançamento.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
