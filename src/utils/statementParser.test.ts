import { describe, it, expect } from 'vitest'
import { guessCategory, parseStatementLines } from './statementParser'

describe('guessCategory', () => {
  it('reconhece despesas de alimentação por palavra-chave', () => {
    expect(guessCategory('Compra no Supermercado Extra', 'expense')).toBe('Alimentação')
  })

  it('reconhece receitas de salário por palavra-chave', () => {
    expect(guessCategory('Folha de Pagamento Empresa XYZ', 'income')).toBe('Salário')
  })

  it('reconhece transferências enviadas via pix', () => {
    expect(guessCategory('Pix enviado João Silva', 'expense')).toBe('Transferência')
  })

  it('reconhece transferências recebidas via pix', () => {
    expect(guessCategory('Pix recebido Maria Souza', 'income')).toBe('Transferência')
  })

  it('cai no fallback de despesa quando nenhuma palavra-chave casa', () => {
    expect(guessCategory('Lançamento desconhecido XYZ123', 'expense')).toBe('Outros (Despesa)')
  })

  it('cai no fallback de receita quando nenhuma palavra-chave casa', () => {
    expect(guessCategory('Lançamento desconhecido XYZ123', 'income')).toBe('Outros (Receita)')
  })

  it('não diferencia maiúsculas/minúsculas', () => {
    expect(guessCategory('UBER VIAGEM CENTRO', 'expense')).toBe('Transporte')
  })
})

describe('parseStatementLines - formato tabela (Neon/Nubank com saldo)', () => {
  it('extrai data, valor, saldo e tipo de uma linha de despesa', () => {
    const lines = [
      'Pix enviado João Silva 10/01/2026 14:30 R$ 150,00 R$ 850,00 ****1234',
    ]
    const result = parseStatementLines(lines, 2026)
    expect(result).toHaveLength(1)
    expect(result[0].amount).toBe(150)
    expect(result[0].type).toBe('expense')
    expect(result[0].description).toBe('Pix enviado João Silva')
    expect(result[0].date.getDate()).toBe(10)
    expect(result[0].date.getMonth()).toBe(0)
    expect(result[0].date.getFullYear()).toBe(2026)
  })

  it('infere o tipo pela variação de saldo quando não há palavra-chave', () => {
    const lines = [
      // primeira linha: sem saldo anterior conhecido, cai no default 'expense'
      'Lançamento ABC 01/02/2026 09:00 R$ 100,00 R$ 1.100,00 ****1234',
      // saldo subiu exatamente o valor da transação -> receita
      'Lançamento DEF 02/02/2026 09:00 R$ 50,00 R$ 1.150,00 ****1234',
      // saldo caiu exatamente o valor da transação -> despesa
      'Lançamento GHI 03/02/2026 09:00 R$ 50,00 R$ 1.100,00 ****1234',
    ]
    const result = parseStatementLines(lines, 2026)
    expect(result).toHaveLength(3)
    expect(result[1].type).toBe('income')
    expect(result[2].type).toBe('expense')
  })

  it('ignora linhas com valor zero ou inválido', () => {
    const lines = ['Lançamento vazio 10/01/2026 14:30 R$ 0,00 R$ 850,00 ****1234']
    const result = parseStatementLines(lines, 2026)
    expect(result).toHaveLength(0)
  })

  it('atribui categoria automaticamente à transação extraída', () => {
    const lines = ['Pagamento fatura cartão 05/03/2026 10:00 R$ 300,00 R$ 700,00 ****1234']
    const result = parseStatementLines(lines, 2026)
    expect(result[0].category).toBe('Cartão de Crédito')
  })
})

describe('parseStatementLines - formato simples (data ... descrição ... valor)', () => {
  it('extrai transação de despesa com sufixo D', () => {
    const lines = ['10/01 Compra no mercado 45,90 D']
    const result = parseStatementLines(lines, 2026)
    expect(result).toHaveLength(1)
    expect(result[0].amount).toBe(45.9)
    expect(result[0].type).toBe('expense')
  })

  it('extrai transação de receita com sufixo C', () => {
    const lines = ['15/01 Pix recebido de cliente 200,00 C']
    const result = parseStatementLines(lines, 2026)
    expect(result).toHaveLength(1)
    expect(result[0].amount).toBe(200)
    expect(result[0].type).toBe('income')
  })

  it('detecta despesa por sinal negativo quando não há sufixo D/C', () => {
    const lines = ['20/01 Assinatura streaming -39,90']
    const result = parseStatementLines(lines, 2026)
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('expense')
    expect(result[0].amount).toBe(39.9)
  })

  it('ignora linhas sem data ou sem valor reconhecível', () => {
    const lines = ['Esta linha não tem nem data nem valor']
    const result = parseStatementLines(lines, 2026)
    expect(result).toHaveLength(0)
  })

  it('usa a descrição padrão quando o texto entre data e valor fica vazio', () => {
    const lines = ['10/01 45,90 D']
    const result = parseStatementLines(lines, 2026)
    expect(result[0].description).toBe('Lançamento importado')
  })
})
