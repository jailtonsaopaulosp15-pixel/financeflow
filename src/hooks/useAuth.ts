import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '../config/firebase'
import { User } from '../types'

// Garante que o resultado do redirect do Google só seja processado uma vez,
// mesmo que vários componentes chamem useAuth() ao mesmo tempo após o
// redirect de volta (App.jsx, LoginPage, SignupPage, etc. todos montam
// useAuth() simultaneamente quando a página carrega).
let redirectResultProcessed = false

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  // Monitor auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userData = await getDoc(doc(db, 'users', firebaseUser.uid))
          if (userData.exists()) {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
              photoURL: firebaseUser.photoURL || '',
              createdAt: new Date(firebaseUser.metadata.creationTime || Date.now())
            })
          }
        } else {
          setUser(null)
        }
      } catch (err) {
        console.error('Error loading user:', err)
        setError(err instanceof Error ? err.message : 'Erro ao carregar usuário')
      } finally {
        setLoading(false)
      }
    })

    return unsubscribe
  }, [])

  // Processa o retorno do login com Google via redirect (ver loginWithGoogle).
  // signInWithPopup não funciona de forma confiável no Safari/iOS quando o
  // app está instalado como PWA (tela inicial) — o popup é bloqueado ou não
  // retorna o foco para o app, resultando em "Erro ao entrar com Google".
  // signInWithRedirect navega a própria página para o Google e volta, o que
  // funciona em qualquer navegador, inclusive PWA standalone no iOS.
  useEffect(() => {
    if (redirectResultProcessed) return
    redirectResultProcessed = true

    getRedirectResult(auth)
      .then(async (result) => {
        if (!result) return

        const userRef = doc(db, 'users', result.user.uid)
        const userData = await getDoc(userRef)

        if (!userData.exists()) {
          await setDoc(userRef, {
            email: result.user.email,
            displayName: result.user.displayName || '',
            photoURL: result.user.photoURL || null,
            createdAt: new Date(),
            lastLogin: new Date()
          })
          await createDefaultCategories(result.user.uid)
        } else {
          await setDoc(userRef, { lastLogin: new Date() }, { merge: true })
        }

        navigate('/dashboard')
      })
      .catch((err) => {
        console.error('Erro ao processar retorno do login com Google:', err)
        setError(getAuthErrorMessage(err))
      })
  }, [])

  const signup = async (email: string, password: string, displayName: string) => {
    try {
      setError(null)
      const result = await createUserWithEmailAndPassword(auth, email, password)
      
      // Update profile
      await updateProfile(result.user, { displayName })
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', result.user.uid), {
        email: result.user.email,
        displayName,
        photoURL: null,
        createdAt: new Date(),
        lastLogin: new Date()
      })

      // Create default categories
      await createDefaultCategories(result.user.uid)

      setUser({
        uid: result.user.uid,
        email: result.user.email || '',
        displayName,
        createdAt: new Date()
      })

      navigate('/dashboard')
      return result.user
    } catch (err) {
      const errorMessage = getAuthErrorMessage(err)
      setError(errorMessage)
      throw err
    }
  }

  const login = async (email: string, password: string) => {
    try {
      setError(null)
      const result = await signInWithEmailAndPassword(auth, email, password)
      
      // Update last login
      await setDoc(doc(db, 'users', result.user.uid), {
        lastLogin: new Date()
      }, { merge: true })

      navigate('/dashboard')
      return result.user
    } catch (err) {
      const errorMessage = getAuthErrorMessage(err)
      setError(errorMessage)
      throw err
    }
  }

  const loginWithGoogle = async () => {
    try {
      setError(null)
      const provider = new GoogleAuthProvider()
      // Redireciona a página inteira para o Google e volta (em vez de popup).
      // O resultado é tratado no efeito de getRedirectResult acima.
      await signInWithRedirect(auth, provider)
    } catch (err: any) {
      const errorMessage = getAuthErrorMessage(err)
      setError(errorMessage)
      throw err
    }
  }

  const logout = async () => {
    try {
      setError(null)
      await signOut(auth)
      setUser(null)
      navigate('/login')
    } catch (err) {
      const errorMessage = getAuthErrorMessage(err)
      setError(errorMessage)
      throw err
    }
  }

  const resetPassword = async (email: string) => {
    try {
      setError(null)
      await sendPasswordResetEmail(auth, email)
      return true
    } catch (err) {
      const errorMessage = getAuthErrorMessage(err)
      setError(errorMessage)
      throw err
    }
  }

  const updateUserName = async (displayName: string) => {
    try {
      setError(null)
      if (!auth.currentUser) throw new Error('Usuário não autenticado')

      await updateProfile(auth.currentUser, { displayName })
      await setDoc(doc(db, 'users', auth.currentUser.uid), { displayName }, { merge: true })

      setUser((prev) => (prev ? { ...prev, displayName } : prev))
    } catch (err) {
      const errorMessage = getAuthErrorMessage(err)
      setError(errorMessage)
      throw err
    }
  }

  return {
    user,
    loading,
    error,
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    updateUserName,
    isAuthenticated: !!user
  }
}

// Helper function to get error messages
const getAuthErrorMessage = (error: any): string => {
  const errorCode = error.code || ''
  
  const errorMessages: Record<string, string> = {
    'auth/email-already-in-use': 'Este e-mail já está registrado',
    'auth/invalid-email': 'E-mail inválido',
    'auth/operation-not-allowed': 'Operação não permitida',
    'auth/weak-password': 'Senha fraca. Use no mínimo 6 caracteres',
    'auth/user-disabled': 'Usuário desabilitado',
    'auth/user-not-found': 'Usuário não encontrado',
    'auth/wrong-password': 'Senha incorreta',
    'auth/invalid-credential': 'Credenciais inválidas',
    'auth/too-many-requests': 'Muitas tentativas de login. Tente novamente mais tarde',
    'auth/popup-blocked': 'O popup de login foi bloqueado pelo navegador. Permita popups e tente novamente',
    'auth/account-exists-with-different-credential': 'Já existe uma conta com este e-mail usando outro método de login',
    'auth/unauthorized-domain': 'Este domínio não está autorizado a fazer login com Google. Adicione-o em Firebase Console > Authentication > Settings > Authorized domains.',
  }

  return errorMessages[errorCode] || 'Erro ao processar requisição'
}

// Create default categories for new users
const createDefaultCategories = async (userId: string) => {
  const defaultCategories = [
    { name: 'Salário', type: 'income', icon: '💰', color: '#22c55e' },
    { name: 'Freelance', type: 'income', icon: '💻', color: '#3b82f6' },
    { name: 'Investimentos', type: 'income', icon: '📈', color: '#10b981' },
    { name: 'Alimentação', type: 'expense', icon: '🍔', color: '#f59e0b' },
    { name: 'Transporte', type: 'expense', icon: '🚗', color: '#6366f1' },
    { name: 'Saúde', type: 'expense', icon: '🏥', color: '#ef4444' },
    { name: 'Educação', type: 'expense', icon: '📚', color: '#8b5cf6' },
    { name: 'Diversão', type: 'expense', icon: '🎬', color: '#ec4899' },
    { name: 'Moradia', type: 'expense', icon: '🏠', color: '#14b8a6' },
    { name: 'Utilities', type: 'expense', icon: '💡', color: '#f97316' },
  ]

  try {
    for (const category of defaultCategories) {
      await setDoc(doc(db, 'users', userId, 'categories', category.name), {
        ...category,
        createdAt: new Date()
      })
    }
  } catch (err) {
    console.error('Error creating default categories:', err)
  }
}
