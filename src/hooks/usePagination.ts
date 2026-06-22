import { useEffect, useMemo, useState } from 'react'

// Paginação simples no cliente: mantém a lista completa sincronizada em tempo
// real (onSnapshot) como já funciona hoje, mas só renderiza uma página por vez.
// Isso evita o custo de renderizar centenas/milhares de linhas de uma vez,
// sem alterar a forma como os dados são buscados no Firestore.
export function usePagination<T>(items: T[], pageSize = 20, resetKey?: unknown) {
  const [page, setPage] = useState(1)

  // Sempre que o filtro (mês, categoria, etc.) muda, volta para a primeira página.
  useEffect(() => {
    setPage(1)
  }, [resetKey])

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const currentPage = Math.min(page, totalPages)

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, currentPage, pageSize])

  return {
    page: currentPage,
    totalPages,
    pageItems,
    totalItems: items.length,
    pageSize,
    hasPrev: currentPage > 1,
    hasNext: currentPage < totalPages,
    goToPage: (p: number) => setPage(Math.min(Math.max(1, p), totalPages)),
    nextPage: () => setPage((p) => Math.min(p + 1, totalPages)),
    prevPage: () => setPage((p) => Math.max(p - 1, 1)),
  }
}
