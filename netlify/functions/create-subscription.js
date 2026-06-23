// Cria uma assinatura recorrente no Mercado Pago (R$ 9,90/mês) para o
// usuário autenticado e devolve o link de checkout (init_point) para o
// front-end redirecionar o usuário e ele autorizar o pagamento (cartão).
//
// Documentação: https://www.mercadopago.com.br/developers/pt/docs/subscriptions/overview
import { adminDb, requireAuth, jsonResponse } from './_lib/firebaseAdmin.js'

const MP_API_URL = 'https://api.mercadopago.com/preapproval'
const PLAN_AMOUNT = 9.9
const PLAN_REASON = 'FinanceFlow - Assinatura mensal'

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
  const email = decoded.email

  if (!email) {
    return jsonResponse(400, { error: 'Conta sem e-mail associado, não é possível criar assinatura' })
  }

  const siteUrl = process.env.URL || 'https://financeflow4.netlify.app'

  try {
    const userRef = adminDb.collection('users').doc(uid)
    const snap = await userRef.get()
    const existing = snap.data() || {}

    // Já existe uma assinatura ativa/pendente — não criar outra.
    if (existing.mpPreapprovalId && ['authorized', 'pending'].includes(existing.subscriptionStatus)) {
      return jsonResponse(200, { alreadyExists: true, subscriptionStatus: existing.subscriptionStatus })
    }

    const payload = {
      reason: PLAN_REASON,
      external_reference: uid,
      payer_email: email,
      back_url: `${siteUrl}/settings`,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: PLAN_AMOUNT,
        currency_id: 'BRL',
      },
      status: 'pending',
    }

    const mpResponse = await fetch(MP_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    })

    const mpData = await mpResponse.json()

    if (!mpResponse.ok) {
      console.error('Erro do Mercado Pago ao criar assinatura:', mpData)
      return jsonResponse(502, { error: 'Erro ao criar assinatura no Mercado Pago', details: mpData })
    }

    await userRef.set(
      {
        mpPreapprovalId: mpData.id,
        subscriptionStatus: 'pending',
      },
      { merge: true }
    )

    return jsonResponse(200, { initPoint: mpData.init_point, preapprovalId: mpData.id })
  } catch (err) {
    console.error('Erro ao criar assinatura:', err)
    return jsonResponse(500, { error: 'Erro interno ao criar assinatura' })
  }
}
