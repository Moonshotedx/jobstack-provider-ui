import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

export default function LayoutAddition() {
  // Only show devtools in development
  if (!import.meta.env.DEV) {
    return null;
  }
  
  return <ReactQueryDevtools buttonPosition="bottom-right" />
}
