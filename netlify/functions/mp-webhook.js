// Recebe as notificações do Mercado Pago quando o status de uma assinatura
// muda (autorizada, pausada, cancelada). Configure essa URL no painel do
// Mercado Pago: https://SEU-SITE.netlify.app/.netlify/functions/mp-webhook
//
// Importante: nunca confiamos direto no corpo da notificação — sempre
// buscamos os dados reais da assinatura na API do Mercado Pago usando o id
// recebido, pra evitar que alguém forje uma notificação falsa.
import { adminDb, jsonResponse } from './_lib/firebaseAdmin.js'

const MP_STATUS_TO_APP_STATUS = {
  authorized: 'authorized',
  paused: 'paused',
  cancelled: 'cancelled',
  pending: 'pending',
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Método não permitido' })
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!accessToken) {
    return jsonResponse(500, { error: 'MERCADOPAGO_ACCESS_TOKEN não configurado' })
  }

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return jsonResponse(400, { error: 'Corpo inválido' })
  }

  // O Mercado Pago manda notificações de vários tipos (payment, subscription
  // preapproval etc). Só nos interessa preapproval (assinatura).
  const preapprovalId = body?.data?.id || event.queryStringParameters?.id
  const topic = body?.type || body?.topic || event.queryStringParameters?.topic

  if (topic && topic !== 'preapproval' && topic !== 'subscription_preapproval') {
    return jsonResponse(200, { ignored: true })
  }

  if (!preapprovalId) {
    return jsonResponse(200, { ignored: true, reason: 'sem id de assinatura' })
  }

  try {
    const mpResponse = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const preapproval = await mpResponse.json()

    if (!mpResponse.ok) {
      console.error('Erro ao buscar assinatura no Mercado Pago:', preapproval)
      return jsonResponse(502, { error: 'Erro ao consultar assinatura' })
    }

    const uid = preapproval.external_reference
    if (!uid) {
      return jsonResponse(200, { ignored: true, reason: 'sem external_reference' })
    }

    const appStatus = MP_STATUS_TO_APP_STATUS[preapproval.status] || preapproval.status

    await adminDb.collection('users').doc(uid).set(
      {
        subscriptionStatus: appStatus,
        mpPreapprovalId: preapproval.id,
      },
      { merge: true }
    )

    return jsonResponse(200, { ok: true, uid, status: appStatus })
  } catch (err) {
    console.error('Erro ao processar webhook do Mercado Pago:', err)
    return jsonResponse(500, { error: 'Erro interno' })
  }
}
