// Inicializa o Firebase Admin SDK uma única vez por instância da function.
// Usa a service account configurada na variável de ambiente
// FIREBASE_SERVICE_ACCOUNT_BASE64 (JSON da service account, em base64) —
// nunca o .env do front-end, e nunca exposta ao cliente.
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

function loadServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
  if (!raw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 não configurada nas variáveis de ambiente do Netlify')
  }
  const json = Buffer.from(raw, 'base64').toString('utf-8')
  return JSON.parse(json)
}

function getAdminApp() {
  const existing = getApps()
  if (existing.length > 0) return existing[0]
  return initializeApp({ credential: cert(loadServiceAccount()) })
}

export const adminDb = getFirestore(getAdminApp())
export const adminAuth = getAuth(getAdminApp())

// Extrai e valida o ID token do Firebase enviado no header Authorization.
// Toda function que toca dados de um usuário deve usar isso em vez de
// confiar em um uid mandado livremente no corpo da requisição.
export async function requireAuth(event) {
  const header = event.headers.authorization || event.headers.Authorization || ''
  const match = header.match(/^Bearer (.+)$/)
  if (!match) {
    throw Object.assign(new Error('Token de autenticação ausente'), { statusCode: 401 })
  }
  try {
    return await adminAuth.verifyIdToken(match[1])
  } catch (err) {
    throw Object.assign(new Error('Token de autenticação inválido'), { statusCode: 401 })
  }
}

export function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}
