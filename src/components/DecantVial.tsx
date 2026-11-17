import { forwardRef, useMemo } from 'react'
import { decantSvg, type DecantArt } from '@/lib/decant-svg'

/** Velvet decant atomizer drawn live with the perfume's own label. */
const DecantVial = forwardRef<HTMLDivElement, { art: DecantArt; className?: string; title?: string }>(
  function DecantVial({ art, className = '', title }, ref) {
    const svg = useMemo(() => decantSvg(art), [art.label, art.brand, art.concentration, art.juice.h, art.juice.s, art.size]) // eslint-disable-line react-hooks/exhaustive-deps
    return <div ref={ref} role="img" aria-label={title ?? `Decant ${art.label}`} className={className} dangerouslySetInnerHTML={{ __html: svg }} />
  },
)

export default DecantVial
