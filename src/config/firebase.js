import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, initializeFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "financeflow-971f1.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "financeflow-971f1",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "financeflow-971f1.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "399681786034",
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Services
export const auth = getAuth(app)
export const db = initializeFirestore(app, { experimentalForceLongPolling: true })
export const storage = getStorage(app)

export default app
