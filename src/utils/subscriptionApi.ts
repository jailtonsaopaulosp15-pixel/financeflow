import { auth } from '../config/firebase'
import { User } from '../types'

// Decide se o usuário pode acessar as funcionalidades do app: trial ainda
// válido (dentro dos 7 dias) ou assinatura autorizada no Mercado Pago.
export const isSubscriptionActive = (user: User | null | undefined): boolean => {
  if (!user) return false
  if (user.subscriptionStatus === 'authorized') return true
  if (user.subscriptionStatus === 'trial' && user.trialEndsAt) {
    return new Date(user.trialEndsAt).getTime() > Date.now()
  }
  return false
}

const callFunction = async (path: string): Promise<any> => {
  if (!auth.currentUser) {
    throw new Error('Usuário não autenticado')
  }
  const idToken = await auth.currentUser.getIdToken()
  const response = await fetch(`/.netlify/functions/${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${idToken}` },
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data?.error || 'Erro ao processar requisição')
  }
  return data
}

// Cria a assinatura no Mercado Pago e devolve o link de checkout (init_point)
// pra onde o usuário deve ser redirecionado pra autorizar o pagamento.
export const createSubscription = async (): Promise<string> => {
  const data = await callFunction('create-subscription')
  if (data.alreadyExists) {
    throw new Error('Você já tem uma assinatura em andamento. Atualize a página em alguns instantes.')
  }
  if (!data.initPoint) {
    throw new Error('Não foi possível gerar o link de pagamento')
  }
  return data.initPoint
}

// Cancela a assinatura ativa do usuário no Mercado Pago.
export const cancelSubscription = async (): Promise<void> => {
  await callFunction('cancel-subscription')
}
