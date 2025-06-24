import { StrictMode, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import * as TanStackQueryProvider from './integrations/tanstack-query/root-provider.tsx'
import { Toaster } from "@/components/ui/sonner"
import { useAuth } from '@/hooks/useAuth'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

import './styles.css'

// Session Check Component
function SessionInitializer() {
  const { checkSession } = useAuth();
  
  useEffect(() => {
    checkSession();
  }, [checkSession]);
  
  return null;
}

// App wrapper component
function App() {
  return (
    <div className='w-dvw h-dvh bg-background'>
      <TanStackQueryProvider.Provider>
        <SessionInitializer />
        <Toaster position='top-center' richColors theme='light' />
        <RouterProvider router={router} />
      </TanStackQueryProvider.Provider>
    </div>
  );
}

// Create a new router instance
const router = createRouter({
  routeTree,
  context: {
    ...TanStackQueryProvider.getContext(),
  },
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Render the app
const rootElement = document.getElementById('app')
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
