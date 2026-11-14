'use client'

import { Check, Loader2, AlertCircle } from 'lucide-react'
import { useAdmin } from '@/context/AdminContext'

/** Floating save status for quick admin edits made straight from the storefront. */
export default function AdminToast() {
  const { isAdmin, saveState, lastError } = useAdmin()
  if (!isAdmin) return null
  const visible = saveState !== 'idle'

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 transition-all duration-500 ease-lux ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      <div className={`flex items-center gap-2.5 rounded-full px-5 py-3 text-[12px] shadow-[0_12px_40px_-12px_rgba(23,18,15,0.5)] ${
        saveState === 'error' ? 'bg-rose text-paper' : 'bg-ink text-ivory'
      }`}>
        {saveState === 'saving' && <><Loader2 size={14} className="animate-spin" /> Guardando…</>}
        {saveState === 'saved' && <><Check size={14} /> Cambios guardados</>}
        {saveState === 'error' && <><AlertCircle size={14} /> {lastError ?? 'No se pudo guardar'}</>}
      </div>
    </div>
  )
}
