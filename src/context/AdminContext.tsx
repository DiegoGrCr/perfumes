'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import { createClient } from '@/utils/supabase/client'
import { savePerfume, PerfumePatch } from '@/app/actions/perfume'
import { Perfume } from '@/types/perfume'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

interface AdminContextType {
  isAdmin: boolean
  /** Local, optimistic edits keyed by perfume id — layered over server data. */
  patches: Record<string, PerfumePatch>
  save: (perfume: Perfume, patch: PerfumePatch) => Promise<boolean>
  saveState: SaveState
  lastError: string | null
  editing: Perfume | null
  openEditor: (p: Perfume) => void
  closeEditor: () => void
  signOut: () => Promise<void>
}

// Singleton on globalThis — see CartContext for why.
const g = globalThis as typeof globalThis & { __velvetAdminCtx?: React.Context<AdminContextType | null> }
const AdminContext = (g.__velvetAdminCtx ??= createContext<AdminContextType | null>(null))

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [patches, setPatches] = useState<Record<string, PerfumePatch>>({})
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [lastError, setLastError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Perfume | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => setIsAdmin(!!data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setIsAdmin(!!session))
    return () => sub.subscription.unsubscribe()
  }, [])

  const save = useCallback(async (perfume: Perfume, patch: PerfumePatch) => {
    const previous = patches[perfume.id]
    setPatches(p => ({ ...p, [perfume.id]: { ...p[perfume.id], ...patch } }))
    setSaveState('saving')
    setLastError(null)
    const res = await savePerfume(perfume.id, patch)
    if (!res.ok) {
      // roll back the optimistic edit
      setPatches(p => {
        const next = { ...p }
        if (previous) next[perfume.id] = previous
        else delete next[perfume.id]
        return next
      })
      setLastError(res.error)
      setSaveState('error')
      return false
    }
    setSaveState('saved')
    setTimeout(() => setSaveState(s => (s === 'saved' ? 'idle' : s)), 1800)
    return true
  }, [patches])

  const signOut = useCallback(async () => {
    await createClient().auth.signOut()
    setIsAdmin(false)
    setEditing(null)
  }, [])

  const value = useMemo<AdminContextType>(() => ({
    isAdmin, patches, save, saveState, lastError, editing,
    openEditor: p => setEditing(p),
    closeEditor: () => setEditing(null),
    signOut,
  }), [isAdmin, patches, save, saveState, lastError, editing, signOut])

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin debe usarse dentro de AdminProvider')
  return ctx
}

/** The perfume with any unsaved/optimistic admin edits applied. */
export function useLivePerfume(p: Perfume): Perfume {
  const { patches } = useAdmin()
  const patch = patches[p.id]
  return useMemo(() => (patch ? { ...p, ...patch } : p), [p, patch])
}

export function useLivePerfumes(list: Perfume[]): Perfume[] {
  const { patches } = useAdmin()
  return useMemo(
    () => (Object.keys(patches).length ? list.map(p => (patches[p.id] ? { ...p, ...patches[p.id] } : p)) : list),
    [list, patches],
  )
}
