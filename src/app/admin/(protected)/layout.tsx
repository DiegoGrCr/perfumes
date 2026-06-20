import { RequireAuth } from '@/components/admin/RequireAuth'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>
}
