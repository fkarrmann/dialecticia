'use client'

import AuthGuard from '@/components/auth/AuthGuard'

interface ProtectedLayoutProps {
  children: React.ReactNode
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  )
} 