import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { authClient } from '@/lib/auth-client'
import { toast } from 'sonner'

// Types
export interface User {
  id: string
  email?: string
  phone?: string
  role: 'individual' | 'organization'
  isVerified: boolean
  profile?: UserProfile | OrganizationProfile
  managedEmployers: EmployerProfile[]
  selectedEmployerId?: string
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
  name: string
  address: string
  gstNumber: string
  logo?: string
  contactPersonName: string
  contactEmail: string
  contactPhone: string
  website?: string
  description: string
}

export interface EmployerProfile {
  id: string
  name: string
  address: string
  gstNumber: string
  logo?: string
  contactPersonName: string
  contactEmail: string
  contactPhone: string
  website?: string
  description: string
  createdAt: string
  isActive: boolean
  isDefault?: boolean
}

interface AuthState {
  // State
  user: User | null
  isLoading: boolean
  pendingVerificationEmail?: string
  
  // Actions
  checkSession: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (data: { 
    email?: string
    phone?: string
    password?: string
    role: 'individual' | 'organization'
    firstName?: string
    lastName?: string 
  }) => Promise<{ needsVerification: boolean }>
  logout: () => Promise<void>
  checkEmailVerification: () => Promise<boolean>
  resendVerificationEmail: () => Promise<void>
  updateProfile: (profile: UserProfile | OrganizationProfile) => void
  addEmployer: (employer: Omit<EmployerProfile, 'id' | 'createdAt'>) => void
  updateEmployer: (employerId: string, employer: Partial<EmployerProfile>) => void
  deleteEmployer: (employerId: string) => void
  selectEmployer: (employerId: string) => void
  getSelectedEmployer: () => EmployerProfile | null
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        isLoading: false,
        pendingVerificationEmail: undefined,

        // Actions
        checkSession: async () => {
          try {
            const session = await authClient.getSession()
            if (session.data?.user) {
              const betterAuthUser = session.data.user
              const mappedUser: User = {
                id: betterAuthUser.id,
                email: betterAuthUser.email,
                role: 'organization', // default for now
                isVerified: betterAuthUser.emailVerified || false,
                profile: undefined, // will be loaded separately if needed
                managedEmployers: [],
                selectedEmployerId: undefined
              }
              set({ user: mappedUser })
            }
          } catch (error) {
            console.error('Session check failed:', error)
          }
        },

        login: async (email: string, password: string) => {
          set({ isLoading: true })
          try {
            const loginRequest = await authClient.signIn.email({ email, password })
            
            if (loginRequest.data?.user) {
              const betterAuthUser = loginRequest.data.user
              const mappedUser: User = {
                id: betterAuthUser.id,
                email: betterAuthUser.email,
                role: 'organization',
                isVerified: betterAuthUser.emailVerified || false,
                profile: undefined,
                managedEmployers: [],
                selectedEmployerId: undefined
              }
              set({ user: mappedUser })
            } else if (loginRequest.error) {
              throw new Error(loginRequest.error.message)
            }
          } finally {
            set({ isLoading: false })
          }
        },

        register: async (data) => {
          set({ isLoading: true })
          try {
            const name = data.firstName && data.lastName 
              ? `${data.firstName} ${data.lastName}`
              : data.email?.split('@')[0] || 'User'

            const signUpRequest = await authClient.signUp.email({ 
              name,
              email: data.email!,
              password: data.password || 'TempPass123!',
              callbackURL: `${window.location.origin}/dashboard`
            })
            
            if (signUpRequest.data?.user) {
              const betterAuthUser = signUpRequest.data.user
              const mappedUser: User = {
                id: betterAuthUser.id,
                email: betterAuthUser.email,
                role: data.role,
                isVerified: betterAuthUser.emailVerified || false,
                profile: undefined,
                managedEmployers: [],
                selectedEmployerId: undefined
              }
              set({ 
                user: mappedUser,
                pendingVerificationEmail: data.email
              })
              
              return { needsVerification: !betterAuthUser.emailVerified }
            } else if (signUpRequest.error) {
              throw new Error(signUpRequest.error.message)
            }
            
            return { needsVerification: true }
          } finally {
            set({ isLoading: false })
          }
        },

        logout: async () => {
          try {
            await authClient.signOut()
          } catch (error) {
            console.error('Logout error:', error)
          } finally {
            set({ 
              user: null, 
              pendingVerificationEmail: undefined 
            })
          }
        },

        checkEmailVerification: async () => {
          try {
            const session = await authClient.getSession()
            if (session.data?.user) {
              const isVerified = session.data.user.emailVerified || false
              const currentUser = get().user
              
              // Only update user state if verification status has changed
              if (currentUser && currentUser.isVerified !== isVerified) {
                set({ 
                  user: { ...currentUser, isVerified },
                  pendingVerificationEmail: isVerified ? undefined : get().pendingVerificationEmail
                })
              }
              
              return isVerified
            }
            return false
          } catch (error) {
            console.error('Verification check failed:', error)
            return false
          }
        },

        resendVerificationEmail: async () => {
          const pendingEmail = get().pendingVerificationEmail
          if (!pendingEmail) {
            throw new Error('No email pending verification')
          }
          
          try {
            // For better-auth, you may need to implement a resend endpoint
            // This is a placeholder - you'll need to check better-auth documentation
            console.log('Resending verification email to:', pendingEmail)
            // TODO: Implement actual resend functionality with better-auth
          } catch (error) {
            console.error('Failed to resend verification email:', error)
            throw new Error('Failed to resend verification email')
          }
        },

        updateProfile: (profile) => {
          const user = get().user
          if (user) {
            // If this is an organization profile and no employers exist, create a default employer
            if (user.role === 'organization' && user.managedEmployers.length === 0) {
              const orgProfile = profile as OrganizationProfile
              const defaultEmployer: EmployerProfile = {
                id: 'default-employer',
                name: orgProfile.name,
                address: orgProfile.address,
                gstNumber: orgProfile.gstNumber,
                logo: orgProfile.logo,
                contactPersonName: orgProfile.contactPersonName,
                contactEmail: orgProfile.contactEmail,
                contactPhone: orgProfile.contactPhone,
                website: orgProfile.website,
                description: orgProfile.description,
                createdAt: new Date().toISOString(),
                isActive: true,
                isDefault: true
              }
              
              set({ 
                user: { 
                  ...user, 
                  profile,
                  managedEmployers: [defaultEmployer],
                  selectedEmployerId: defaultEmployer.id
                }
              })
            } else {
              set({ user: { ...user, profile } })
            }
            // In a real app, you'd also save this to your backend
          }
        },

        addEmployer: (employer) => {
          const user = get().user
          if (user) {
            const isFirstEmployer = user.managedEmployers.length === 0
            const newEmployer: EmployerProfile = {
              ...employer,
              id: Date.now().toString(),
              createdAt: new Date().toISOString(),
              isActive: true,
              isDefault: isFirstEmployer
            }
            
            set({
              user: {
                ...user,
                managedEmployers: [...user.managedEmployers, newEmployer],
                selectedEmployerId: user.selectedEmployerId || newEmployer.id
              }
            })
            // In a real app, you'd also save this to your backend
          }
        },

        updateEmployer: (employerId, employerUpdate) => {
          const user = get().user
          if (user) {
            const updatedEmployers = user.managedEmployers.map(emp => 
              emp.id === employerId ? { ...emp, ...employerUpdate } : emp
            )
            
            set({ 
              user: { ...user, managedEmployers: updatedEmployers }
            })
            // In a real app, you'd also save this to your backend
          }
        },

        deleteEmployer: (employerId) => {
          const user = get().user
          if (user) {
            const updatedEmployers = user.managedEmployers.filter(emp => emp.id !== employerId)
            set({
              user: {
                ...user,
                managedEmployers: updatedEmployers,
                selectedEmployerId: user.selectedEmployerId === employerId 
                  ? (updatedEmployers.length > 0 ? updatedEmployers[0].id : undefined)
                  : user.selectedEmployerId
              }
            })
            // In a real app, you'd also save this to your backend
          }
        },

        selectEmployer: (employerId) => {
          const user = get().user
          if (user) {
            set({ 
              user: { ...user, selectedEmployerId: employerId }
            })
            // In a real app, you'd also save this to your backend
          }
        },

        getSelectedEmployer: () => {
          const user = get().user
          if (user && user.selectedEmployerId) {
            return user.managedEmployers.find(emp => emp.id === user.selectedEmployerId) || null
          }
          return null
        }
      }),
      {
        name: 'auth-storage', // unique name for localStorage
        partialize: (state) => ({ 
          user: state.user,
          pendingVerificationEmail: state.pendingVerificationEmail 
        }), // only persist user and pendingVerificationEmail
      }
    ),
    { name: 'auth-store' } // devtools name
  )
) 