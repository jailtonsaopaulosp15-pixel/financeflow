// Cancela a assinatura do usuário autenticado no Mercado Pago e atualiza o
// Firestore. Chamada pelo botão "Cancelar assinatura" em Configurações.
import { adminDb, requireAuth, jsonResponse } from './_lib/firebaseAdmin.js'

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Método não permitido' })
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!accessToken) {
    return jsonResponse(500, { error: 'MERCADOPAGO_ACCESS_TOKEN não configurado' })
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
    const data = snap.data() || {}

    if (!data.mpPreapprovalId) {
      return jsonResponse(400, { error: 'Nenhuma assinatura encontrada para cancelar' })
    }

    const mpResponse = await fetch(`https://api.mercadopago.com/preapproval/${data.mpPreapprovalId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ status: 'cancelled' }),
    })

    const mpData = await mpResponse.json()

    if (!mpResponse.ok) {
      console.error('Erro ao cancelar assinatura no Mercado Pago:', mpData)
      return jsonResponse(502, { error: 'Erro ao cancelar assinatura no Mercado Pago', details: mpData })
    }

    await userRef.set({ subscriptionStatus: 'cancelled' }, { merge: true })

    return jsonResponse(200, { ok: true })
  } catch (err) {
    console.error('Erro ao cancelar assinatura:', err)
    return jsonResponse(500, { error: 'Erro interno ao cancelar assinatura' })
  }
}
