// Parser genérico de extratos bancários em PDF (PT-BR).
// Extrai texto do PDF reconstruindo linhas por posição, depois usa regex
// para encontrar padrões de "data ... descrição ... valor" comuns em
// extratos de bancos brasileiros (Itaú, Nubank, Bradesco, Banco do Brasil, etc).

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf'

// Worker servido via CDN para evitar problemas de bundling com Vite.
pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'

export interface ParsedTransaction {
  date: Date
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
  rawLine: string
  include: boolean
}

const CATEGORY_RULES: { category: string; type: 'income' | 'expense'; keywords: string[] }[] = [
  // Padrões de bancos digitais (Neon, Nubank, Inter, C6, PicPay, etc) — checados primeiro
  // pois são mais específicos que as categorias genéricas de consumo abaixo.
  { category: 'Investimentos', type: 'expense', keywords: ['aplicação em', 'aplicacao em', 'aplicação rdb', 'aplicacao rdb'] },
  { category: 'Investimentos', type: 'income', keywords: ['resgate em', 'resgate de', 'rendimento'] },
  { category: 'Cartão de Crédito', type: 'expense', keywords: ['pagamento fatura', 'pagamento de fatura'] },
  { category: 'Transferência', type: 'expense', keywords: ['pix enviado', 'ted enviad', 'doc enviad', 'open banking para', 'transferência enviada', 'transferencia enviada'] },
  { category: 'Transferência', type: 'income', keywords: ['pix recebido', 'ted recebid', 'doc recebid', 'transferência recebida', 'transferencia recebida'] },

  { category: 'Alimentação', type: 'expense', keywords: ['ifood', 'restaurante', 'lanchonete', 'padaria', 'supermercado', 'mercado', 'acougue', 'hortifruti', 'pizza', 'burguer', 'burger', 'feira', 'carnes'] },
  { category: 'Transporte', type: 'expense', keywords: ['uber', '99app', '99 ', 'taxi', 'combustivel', 'combustível', 'posto ', 'estacionamento', 'pedagio', 'pedágio', 'metro', 'metrô', 'onibus', 'ônibus', 'gasolina'] },
  { category: 'Saúde', type: 'expense', keywords: ['farmacia', 'farmácia', 'drogaria', 'hospital', 'clinica', 'clínica', 'laboratorio', 'laboratório', 'plano de saude', 'unimed', 'amil', 'odonto'] },
  { category: 'Educação', type: 'expense', keywords: ['escola', 'faculdade', 'curso', 'udemy', 'livraria', 'mensalidade'] },
  { category: 'Diversão', type: 'expense', keywords: ['cinema', 'netflix', 'spotify', 'steam', 'ingresso', 'show ', 'amazon prime', 'disney', 'hbo', 'bolao', 'bolão'] },
  { category: 'Moradia', type: 'expense', keywords: ['aluguel', 'condominio', 'condomínio', 'imobiliaria', 'imobiliária'] },
  { category: 'Utilities', type: 'expense', keywords: ['energia', 'eletropaulo', 'enel', 'cemig', 'forca e luz', 'força e luz', 'agua', 'água', 'sabesp', 'internet', 'telefone', 'claro', 'vivo', 'tim ', 'oi telecom', 'net '] },
  { category: 'Salário', type: 'income', keywords: ['salario', 'salário', 'folha de pagamento', 'pagamento salarial', 'provento'] },
  { category: 'Freelance', type: 'income', keywords: ['freelance', 'servico prestado', 'serviço prestado', 'nota fiscal', 'honorario', 'honorário'] },
]

export function guessCategory(description: string, fallbackType: 'income' | 'expense'): string {
  const desc = description.toLowerCase()
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((kw) => desc.includes(kw))) {
      return rule.category
    }
  }
  return fallbackType === 'income' ? 'Outros (Receita)' : 'Outros (Despesa)'
}

// Extrai o texto do PDF, reconstruindo linhas a partir da posição (x, y)
// de cada item de texto — necessário porque pdf.js não preserva quebras
// de linha originais do documento.
export async function extractPdfLines(file: File): Promise<string[]> {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise

  const allLines: string[] = []

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const content = await page.getTextContent()

    type Item = { str: string; x: number; y: number }
    const items: Item[] = (content.items as any[])
      .filter((it) => typeof it.str === 'string' && it.str.trim() !== '')
      .map((it) => ({ str: it.str, x: it.transform[4], y: it.transform[5] }))

    // Agrupa itens cuja posição Y é próxima (mesma linha visual)
    const lineMap = new Map<number, Item[]>()
    for (const item of items) {
      const key = Math.round(item.y / 2) * 2
      if (!lineMap.has(key)) lineMap.set(key, [])
      lineMap.get(key)!.push(item)
    }

    const sortedKeys = Array.from(lineMap.keys()).sort((a, b) => b - a)
    for (const key of sortedKeys) {
      const lineItems = lineMap.get(key)!.sort((a, b) => a.x - b.x)
      const text = lineItems.map((i) => i.str).join(' ').replace(/\s+/g, ' ').trim()
      if (text) allLines.push(text)
    }
  }

  return allLines
}

// Converte "1.234,56" ou "-350,00" em número.
function parseAmount(raw: string): number {
  const cleaned = raw.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '')
  return parseFloat(cleaned)
}

function buildDate(dateStr: string, referenceYear: number): Date | null {
  const parts = dateStr.split('/').map((p) => parseInt(p, 10))
  let [day, month, year] = parts
  if (!year) year = referenceYear
  else if (year < 100) year += 2000
  const date = new Date(year, month - 1, day)
  return isNaN(date.getTime()) ? null : date
}

// Determina o tipo (receita/despesa) usando, em ordem de confiança:
// 1) palavras-chave conhecidas na descrição (mais confiável)
// 2) a variação do saldo em relação à linha anterior (extratos com coluna "Saldo")
function detectType(description: string, amount: number, saldo: number | null, prevSaldo: number | null): 'income' | 'expense' {
  const desc = description.toLowerCase()

  const incomeHints = ['recebido', 'resgate', 'rendimento', 'salario', 'salário', 'deposito', 'depósito', 'credito', 'crédito']
  const expenseHints = ['enviado', 'pagamento', 'aplicação em', 'aplicacao em', 'open banking para', 'compra', 'debito', 'débito', 'saque']

  if (incomeHints.some((h) => desc.includes(h))) return 'income'
  if (expenseHints.some((h) => desc.includes(h))) return 'expense'

  if (saldo !== null && prevSaldo !== null) {
    const delta = saldo - prevSaldo
    if (Math.abs(delta - amount) < 0.01) return 'income'
    if (Math.abs(delta + amount) < 0.01) return 'expense'
    return delta >= 0 ? 'income' : 'expense'
  }

  return 'expense'
}

// Formato em TABELA: Descrição | Data | Hora | Valor | Saldo | Cartão
// (usado por bancos digitais como Neon, Nubank, Inter — "extrato por período")
const TABLE_RE = /^(.+?)\s+(\d{2}\/\d{2}\/\d{4})\s+(\d{1,2}\s*:?\s*\d{2})\s+(-?R\$\s?\d{1,3}(?:\.\d{3})*,\d{2})\s+(-?R\$\s?\d{1,3}(?:\.\d{3})*,\d{2})\s+(.*)$/

// Formato SIMPLES: Data ... Descrição ... Valor (com sufixo D/C ou sinal opcional)
const DATE_RE = /(\d{2}\/\d{2}(?:\/\d{2,4})?)/
const VALUE_RE = /(-?\s?R?\$?\s?-?\d{1,3}(?:\.\d{3})*,\d{2})\s*([DC])?\s*$/i

export function parseStatementLines(lines: string[], referenceYear: number): ParsedTransaction[] {
  const results: ParsedTransaction[] = []
  let prevSaldo: number | null = null

  for (const line of lines) {
    const tableMatch = line.match(TABLE_RE)

    if (tableMatch) {
      const [, descRaw, dateStr, , valorStr, saldoStr] = tableMatch
      const amount = Math.abs(parseAmount(valorStr))
      const saldo = parseAmount(saldoStr)
      if (isNaN(amount) || amount === 0 || isNaN(saldo)) continue

      const date = buildDate(dateStr, referenceYear)
      if (!date) continue

      const description = descRaw.trim() || 'Lançamento importado'
      const type = detectType(description, amount, saldo, prevSaldo)
      prevSaldo = saldo

      const category = guessCategory(description, type)

      results.push({ date, description, amount, type, category, rawLine: line, include: true })
      continue
    }

    // Fallback: formato simples sem coluna de saldo
    const dateMatch = line.match(DATE_RE)
    const valueMatch = line.match(VALUE_RE)
    if (!dateMatch || !valueMatch) continue

    const dateStr = dateMatch[1]
    const valueStr = valueMatch[1]
    const suffix = valueMatch[2]?.toUpperCase()

    let amount = parseAmount(valueStr)
    if (isNaN(amount) || amount === 0) continue

    const dateIdx = line.indexOf(dateMatch[0])
    const valueIdx = line.lastIndexOf(valueMatch[0])
    let description = line.slice(dateIdx + dateMatch[0].length, valueIdx).trim()
    description = description.replace(/^[-–:\s]+/, '').replace(/[-–:\s]+$/, '')
    if (!description) description = 'Lançamento importado'

    let type: 'income' | 'expense'
    if (suffix === 'D') type = 'expense'
    else if (suffix === 'C') type = 'income'
    else if (valueStr.includes('-')) type = 'expense'
    else type = detectType(description, Math.abs(amount), null, null)

    amount = Math.abs(amount)

    const date = buildDate(dateStr, referenceYear)
    if (!date) continue

    const category = guessCategory(description, type)

    results.push({ date, description, amount, type, category, rawLine: line, include: true })
  }

  return results
}
