// Inicia o período de teste grátis (7 dias) para o usuário autenticado.
// É chamada pelo front-end logo depois de criar a conta (email/senha ou
// Google). É idempotente: se o usuário já tem subscriptionStatus definido,
// não faz nada — evita que alguém chame de novo pra "resetar" o trial.
//
// O trialEndsAt é decidido aqui, no servidor, e não pelo cliente, porque as
// regras do Firestore (firestore.rules) bloqueiam o cliente de escrever
// esses campos depois da criação da conta.
import { adminDb, requireAuth, jsonResponse } from './_lib/firebaseAdmin.js'

const TRIAL_DAYS = 7

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Método não permitido' })
  }

  let decoded
  try {
    decoded = await requireAuth(event)
  } catch (err) {
    return jsonResponse(err.statusCode || 401, { error: err.message })
  }

  const uid = decoded.uid
  const userRef = adminDb.collection('users').doc(uid)

  try {
    const snap = await userRef.get()
    if (!snap.exists) {
      return jsonResponse(404, { error: 'Usuário não encontrado' })
    }

    const data = snap.data()
    if (data.subscriptionStatus) {
      // Trial (ou assinatura) já foi iniciado antes — não reiniciar.
      return jsonResponse(200, {
        subscriptionStatus: data.subscriptionStatus,
        trialEndsAt: data.trialEndsAt || null,
      })
    }

    const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000)
    await userRef.set(
      {
        subscriptionStatus: 'trial',
        trialEndsAt,
      },
      { merge: true }
    )

    return jsonResponse(200, { subscriptionStatus: 'trial', trialEndsAt: trialEndsAt.toISOString() })
  } catch (err) {
    console.error('Erro ao iniciar trial:', err)
    return jsonResponse(500, { error: 'Erro ao iniciar período de teste' })
  }
}
