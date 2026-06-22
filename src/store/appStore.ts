import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppContextState {
  theme: 'light' | 'dark'
  sidebarOpen: boolean
  notifications: Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
    duration?: number
  }>
  
  // Actions
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  addNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string, duration?: number) => void
  removeNotification: (id: string) => void
}

export const useAppStore = create<AppContextState>()(
  persist(
    (set) => ({
      theme: 'light',
      sidebarOpen: true,
      notifications: [],
      
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({
        theme: state.theme === 'light' ? 'dark' : 'light'
      })),
      
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({
        sidebarOpen: !state.sidebarOpen
      })),
      
      addNotification: (type, message, duration) => {
        const id = `${Date.now()}-${Math.random()}`
        set((state) => ({
          notifications: [...state.notifications, { id, type, message, duration }]
        }))
        
        if (duration !== 0) {
          setTimeout(() => {
            set((state) => ({
              notifications: state.notifications.filter(n => n.id !== id)
            }))
          }, duration || 3000)
        }
        
        return id
      },
      
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      }))
    }),
    {
      name: 'app-store',
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen
      })
    }
  )
)
