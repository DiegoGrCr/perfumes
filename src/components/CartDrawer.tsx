'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X, Minus, Plus, MessageCircle, Info } from 'lucide-react'
import { useCart, CartItem } from '@/context/CartContext'
import { POLICY, formatPrice, needsDeposit, primaryImage, stockLabel, waLink } from '@/lib/brand'
import BottleSilhouette from '@/components/ui/BottleSilhouette'

/** Anticipo: POLICY.depositPct of each fragrance that requires it (see needsDeposit). */
function depositOf(items: CartItem[]) {
  const base = items
    .filter(i => needsDeposit(i.perfume))
    .reduce((s, i) => s + i.perfume.price * i.quantity, 0)
  return Math.round((base * POLICY.depositPct) / 100)
}

function buildMsg(items: CartItem[]): string {
  const lines = items.map(({ perfume, quantity, volume }) =>
    `• ${perfume.name} (${perfume.brand}) – ${volume}ml × ${quantity}  ${formatPrice(perfume.price * quantity)}${perfume.in_stock ? '' : ' (sobre pedido)'}`
  )
  const total = items.reduce((s, i) => s + i.perfume.price * i.quantity, 0)
  const deposit = depositOf(items)
  return (
    `¡Hola! Me gustaría realizar el siguiente pedido:\n\n` +
    lines.join('\n') +
    `\n\nTotal estimado: ${formatPrice(total)}` +
    (deposit ? `\nAnticipo (${POLICY.depositPct}%): ${formatPrice(deposit)}` : '') +
    `\n\nHe leído y acepto los términos y condiciones (si cancelo con anticipo pagado, se retiene el ${POLICY.cancelFeePct}% del precio del perfume).` +
    `\n\n¡Gracias! 🙏`
  )
}

export default function CartDrawer() {
  const { items, drawerOpen, closeDrawer, removeItem, updateQty, clearCart, totalItems } = useCart()
  const [accepted, setAccepted] = useState(false)
  const total   = items.reduce((s, i) => s + i.perfume.price * i.quantity, 0)
  const deposit = depositOf(items)

  useEffect(() => {
    if (!drawerOpen) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDrawer() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey) }
    // closeDrawer only flips state; re-subscribing on every render is unnecessary
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerOpen])

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-velvet/45 backdrop-blur-[2px] transition-opacity duration-500 ${
          drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={closeDrawer}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Tu pedido"
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[440px] flex-col bg-paper transition-[transform,visibility] duration-700 ease-lux ${
          drawerOpen ? 'translate-x-0 visible shadow-[-20px_0_60px_-20px_rgba(23,18,15,0.3)]' : 'translate-x-full invisible'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-6 py-6 sm:px-8">
          <h2 className="display text-3xl">
            Tu pedido {totalItems > 0 && <sup className="ml-1 font-sans text-[11px] text-muted">{totalItems}</sup>}
          </h2>
          <button onClick={closeDrawer} className="-mr-2 p-2 text-muted transition-transform duration-500 hover:rotate-90 hover:text-ink" aria-label="Cerrar">
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-6 py-20 text-center">
              <BottleSilhouette className="h-28 w-auto opacity-60" />
              <div>
                <p className="display text-3xl">Aún está vacío</p>
                <p className="mt-2 text-sm text-muted">Tu próxima fragancia favorita te espera.</p>
              </div>
              <Link href="/#coleccion" onClick={closeDrawer} className="btn btn-ink">
                Explorar colección
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {items.map(({ perfume, quantity, volume }, i) => {
                const img = primaryImage(perfume)
                return (
                  <li
                    key={`${perfume.id}-${volume}`}
                    className="flex gap-4 py-6 transition-all duration-700 ease-lux"
                    style={{
                      opacity: drawerOpen ? 1 : 0,
                      transform: drawerOpen ? 'none' : 'translateX(24px)',
                      transitionDelay: drawerOpen ? `${150 + i * 60}ms` : '0ms',
                    }}
                  >
                    <Link
                      href={`/perfume/${perfume.id}`}
                      onClick={closeDrawer}
                      className="flex h-28 w-24 shrink-0 items-center justify-center bg-sand"
                    >
                      {img
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={img} alt={perfume.name} className="h-full w-full object-contain p-2.5" />
                        : <BottleSilhouette className="h-16 w-auto" />}
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <p className="eyebrow text-[8px] text-muted">{perfume.brand}</p>
                      <p className="display mt-1 line-clamp-2 text-xl leading-tight">{perfume.name}</p>
                      <p className="mt-1 text-[11px] text-faint">{volume} ml · {stockLabel(perfume)}</p>

                      <div className="mt-auto flex items-center justify-between pt-3">
                        <div className="flex items-center rounded-full border border-line">
                          <button
                            onClick={() => updateQty(perfume.id, volume, quantity - 1)}
                            className="flex h-8 w-8 items-center justify-center text-muted hover:text-ink"
                            aria-label="Quitar uno"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-5 text-center text-[13px]">{quantity}</span>
                          <button
                            onClick={() => updateQty(perfume.id, volume, quantity + 1)}
                            className="flex h-8 w-8 items-center justify-center text-muted hover:text-ink"
                            aria-label="Agregar uno"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <span className="text-[14px] font-medium">{formatPrice(perfume.price * quantity)}</span>
                      </div>
                      <button
                        onClick={() => removeItem(perfume.id, volume)}
                        className="link-underline mt-2 self-start text-[10px] uppercase tracking-[0.2em] text-faint hover:text-ink"
                      >
                        Eliminar
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="space-y-4 border-t border-line bg-ivory px-6 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-8">
            <div className="flex items-baseline justify-between">
              <span className="eyebrow text-[9px] text-muted">Total estimado</span>
              <span className="display text-4xl">{formatPrice(total)}</span>
            </div>

            {deposit > 0 && (
              <div className="flex items-start gap-2.5 rounded-sm bg-rose-soft px-4 py-3 text-[12px] leading-relaxed text-ink-soft">
                <Info size={14} className="mt-0.5 shrink-0 text-rose" />
                <span>
                  Anticipo del <strong className="font-medium">{POLICY.depositPct}%</strong> en fragancias de más de {formatPrice(POLICY.depositFrom)}
                  {POLICY.depositScope === 'sobre-pedido' ? ' sobre pedido' : ''}:{' '}
                  <strong className="font-medium">{formatPrice(deposit)}</strong>. El resto, al entregar.
                </span>
              </div>
            )}

            {/* The customer must see and accept the cancellation policy before ordering */}
            <label className="flex cursor-pointer items-start gap-3 text-[12px] leading-relaxed text-muted">
              <input
                type="checkbox"
                checked={accepted}
                onChange={e => setAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0"
              />
              <span>
                Acepto los{' '}
                <Link href="/terminos" onClick={closeDrawer} className="text-ink underline underline-offset-2 hover:text-rose">
                  términos y condiciones
                </Link>
                . Si cancelo después de pagar el anticipo, se retiene el {POLICY.cancelFeePct}% del precio del perfume por gastos logísticos y se me reembolsa el resto.
              </span>
            </label>

            <a
              href={accepted ? waLink(buildMsg(items)) : undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!accepted}
              onClick={e => { if (!accepted) e.preventDefault() }}
              className={`btn btn-ink w-full ${accepted ? '' : 'pointer-events-none opacity-40'}`}
            >
              <MessageCircle size={15} /> Enviar pedido por WhatsApp
            </a>
            <p className="text-center text-[11px] text-faint">
              Te confirmamos disponibilidad y entrega por mensaje.
            </p>
            <button
              onClick={clearCart}
              className="link-underline mx-auto block text-[10px] uppercase tracking-[0.2em] text-faint hover:text-ink"
            >
              Vaciar pedido
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
