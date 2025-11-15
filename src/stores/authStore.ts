import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

// Types
export interface User {
  id: string
  email?: string
  phone?: string
  role: 'individual' | 'organization'
  isVerified: boolean
  profile?: UserProfile | OrganizationProfile
}

export interface UserProfile {
  name: string
  age?: number
  isNameVerified: boolean
  isAgeVerified: boolean
  currentLocation: string
  desiredLocation: string
  experience: Experience[]
  skills: string[]
  certificates: Certificate[]
}

export interface Experience {
  id: string
  designation: string
  company: string
  location: string
  duration: string
  workType: 'full-time' | 'part-time' | 'contract' | 'internship'
  description: string
}

export interface Certificate {
  id: string
  name: string
  issuer: string
  issueDate: string
  isVerified: boolean
  documentUrl?: string
}

export interface OrganizationProfile {
  id?: string
  name: string
  slug?: string
  address: string
  gstNumber?: string // Made optional since it's removed from UI
  logo?: string
  contactPersonName: string
  contactEmail: string
  contactPhone: string
  website?: string
  description: string
  createdAt?: string
  isActive?: boolean
  isDefault?: boolean
  type?: string // Organization type (e.g., "association")
}

interface UserState {
  // State
  user: User | null
  isLoading: boolean
  currentOrganizationId: string | null
  
  // Actions
  setUser: (user: User | null) => void
  updateUser: (updates: Partial<User>) => void
  updateProfile: (profile: UserProfile | OrganizationProfile) => void
  clearUser: () => void
  setLoading: (loading: boolean) => void
  setCurrentOrganizationId: (orgId: string | null) => void
}

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        isLoading: false,
        currentOrganizationId: null,

        // Actions
        setUser: (user) => {
          set({ user })
        },

        updateUser: (updates) => {
          const currentUser = get().user
          if (currentUser) {
            set({ user: { ...currentUser, ...updates } })
          }
        },

        updateProfile: (profile) => {
          const user = get().user
          if (user) {
            set({ user: { ...user, profile } })
          }
        },

        clearUser: () => {
          set({ user: null, currentOrganizationId: null })
        },

        setLoading: (loading) => {
          set({ isLoading: loading })
        },

        setCurrentOrganizationId: (orgId) => {
          set({ currentOrganizationId: orgId })
        }
      }),
      {
        name: 'user-storage',
        partialize: (state) => ({ 
          user: state.user, 
          currentOrganizationId: state.currentOrganizationId 
        }),
      }
    ),
    { 
      name: 'user-store',
      enabled: import.meta.env.DEV // Only enable devtools in development
    }
  )
) 