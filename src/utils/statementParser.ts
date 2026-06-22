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
  { category: 'Alimentação', type: 'expense', keywords: ['ifood', 'restaurante', 'lanchonete', 'padaria', 'supermercado', 'mercado', 'acougue', 'hortifruti', 'pizza', 'burguer', 'burger', 'feira'] },
  { category: 'Transporte', type: 'expense', keywords: ['uber', '99app', '99 ', 'taxi', 'combustivel', 'combustível', 'posto ', 'estacionamento', 'pedagio', 'pedágio', 'metro', 'metrô', 'onibus', 'ônibus', 'gasolina'] },
  { category: 'Saúde', type: 'expense', keywords: ['farmacia', 'farmácia', 'drogaria', 'hospital', 'clinica', 'clínica', 'laboratorio', 'laboratório', 'plano de saude', 'unimed', 'amil', 'odonto'] },
  { category: 'Educação', type: 'expense', keywords: ['escola', 'faculdade', 'curso', 'udemy', 'livraria', 'mensalidade'] },
  { category: 'Diversão', type: 'expense', keywords: ['cinema', 'netflix', 'spotify', 'steam', 'ingresso', 'show ', 'amazon prime', 'disney', 'hbo'] },
  { category: 'Moradia', type: 'expense', keywords: ['aluguel', 'condominio', 'condomínio', 'imobiliaria', 'imobiliária'] },
  { category: 'Utilities', type: 'expense', keywords: ['energia', 'eletropaulo', 'enel', 'cemig', 'agua', 'água', 'sabesp', 'internet', 'telefone', 'claro', 'vivo', 'tim ', 'oi telecom', 'net '] },
  { category: 'Salário', type: 'income', keywords: ['salario', 'salário', 'folha de pagamento', 'pagamento salarial', 'provento'] },
  { category: 'Freelance', type: 'income', keywords: ['freelance', 'servico prestado', 'serviço prestado', 'nota fiscal', 'honorario', 'honorário'] },
  { category: 'Investimentos', type: 'income', keywords: ['rendimento', 'dividendo', 'juros', 'resgate', 'cdb', 'tesouro'] },
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

const DATE_RE = /(\d{2}\/\d{2}(?:\/\d{2,4})?)/
const VALUE_RE = /(-?\s?R?\$?\s?-?\d{1,3}(?:\.\d{3})*,\d{2})\s*([DC])?\s*$/i

export function parseStatementLines(lines: string[], referenceYear: number): ParsedTransaction[] {
  const results: ParsedTransaction[] = []

  for (const line of lines) {
    const dateMatch = line.match(DATE_RE)
    const valueMatch = line.match(VALUE_RE)
    if (!dateMatch || !valueMatch) continue

    const dateStr = dateMatch[1]
    const valueStr = valueMatch[1]
    const suffix = valueMatch[2]?.toUpperCase()

    let amount = parseAmount(valueStr)
    if (isNaN(amount) || amount === 0) continue

    // Descrição = tudo entre a data e o valor
    const dateIdx = line.indexOf(dateMatch[0])
    const valueIdx = line.lastIndexOf(valueMatch[0])
    let description = line.slice(dateIdx + dateMatch[0].length, valueIdx).trim()
    description = description.replace(/^[-–:\s]+/, '').replace(/[-–:\s]+$/, '')
    if (!description) description = 'Lançamento importado'

    // Determina tipo: sufixo D/C explícito, sinal negativo, ou heurística por palavra-chave
    let type: 'income' | 'expense'
    if (suffix === 'D') type = 'expense'
    else if (suffix === 'C') type = 'income'
    else if (valueStr.includes('-')) type = 'expense'
    else type = 'income'

    amount = Math.abs(amount)

    // Monta a data
    const parts = dateStr.split('/').map((p) => parseInt(p, 10))
    let [day, month, year] = parts
    if (!year) year = referenceYear
    else if (year < 100) year += 2000
    const date = new Date(year, month - 1, day)
    if (isNaN(date.getTime())) continue

    const category = guessCategory(description, type)

    results.push({
      date,
      description,
      amount,
      type,
      category,
      rawLine: line,
      include: true,
    })
  }

  return results
}
