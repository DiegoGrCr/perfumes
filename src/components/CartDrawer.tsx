'use client'
import { useEffect } from 'react'
import { X, Minus, Plus, Trash2, ShoppingBag, MessageCircle } from 'lucide-react'
import { useCart, CartItem } from '@/context/CartContext'

const WA = '527296769572'

function buildMsg(items: CartItem[]): string {
  const lines = items.map(({ perfume, quantity, volume }) =>
    `• ${perfume.name} (${perfume.brand}) – ${volume}ml × ${quantity}  $${(perfume.price * quantity).toFixed(2)}`
  )
  const total = items.reduce((s, i) => s + i.perfume.price * i.quantity, 0)
  return encodeURIComponent(
    `¡Hola! Me gustaría realizar el siguiente pedido:\n\n` +
    lines.join('\n') +
    `\n\nTotal estimado: $${total.toFixed(2)}\n\n¡Gracias! 🙏`
  )
}

export default function CartDrawer() {
  const { items, drawerOpen, closeDrawer, removeItem, updateQty, clearCart, totalItems } = useCart()
  const total = items.reduce((s, i) => s + i.perfume.price * i.quantity, 0)

  // Bloquea scroll del body mientras el drawer está abierto
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{
          background: 'rgba(0,0,0,0.45)',
          opacity: drawerOpen ? 1 : 0,
          pointerEvents: drawerOpen ? 'all' : 'none',
        }}
        onClick={closeDrawer}
      />

      {/* Panel */}
      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col"
        style={{
          width: 'min(420px, 100vw)',
          background: '#fff',
          boxShadow: '-4px 0 32px rgba(0,0,0,0.12)',
          transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid #F0F0F0' }}>
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} style={{ color: '#C9A84C' }} />
            <span className="text-sm font-medium tracking-widest uppercase" style={{ color: '#1a1a1a' }}>
              Mi pedido
            </span>
            {totalItems > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: '#C9A84C', color: '#fff' }}>
                {totalItems}
              </span>
            )}
          </div>
          <button onClick={closeDrawer} style={{ color: '#aaa' }}>
            <X size={20} />
          </button>
        </div>

        {/* Lista de items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-20">
              <ShoppingBag size={44} style={{ color: '#E8E8E8' }} />
              <p className="text-sm" style={{ color: '#bbb' }}>Tu pedido está vacío</p>
              <p className="text-[11px] text-center" style={{ color: '#ddd' }}>
                Agrega fragancias desde el catálogo
              </p>
            </div>
          ) : (
            items.map(({ perfume, quantity, volume }) => (
              <div key={`${perfume.id}-${volume}`}
                className="flex gap-3 pb-4"
                style={{ borderBottom: '1px solid #F8F8F8' }}>

                {/* Miniatura */}
                <div className="w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center"
                  style={{ background: '#F8F4EE' }}>
                  {perfume.images?.[0]?.url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={perfume.images[0].url} alt={perfume.name}
                        className="w-full h-full object-contain p-1" />
                    : <ShoppingBag size={20} style={{ color: '#C9A84C', opacity: 0.35 }} />
                  }
                </div>

                {/* Info + controles */}
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] uppercase tracking-widest" style={{ color: '#ccc' }}>
                    {perfume.brand}
                  </p>
                  <p className="text-sm font-medium leading-snug truncate" style={{ color: '#1a1a1a' }}>
                    {perfume.name}
                  </p>
                  <p className="text-[10px]" style={{ color: '#ccc' }}>{volume} ml</p>

                  <div className="flex items-center justify-between mt-2">
                    {/* +/- cantidad */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQty(perfume.id, volume, quantity - 1)}
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: '#F5F5F5' }}>
                        <Minus size={10} style={{ color: '#666' }} />
                      </button>
                      <span className="text-sm w-4 text-center font-medium" style={{ color: '#1a1a1a' }}>
                        {quantity}
                      </span>
                      <button
                        onClick={() => updateQty(perfume.id, volume, quantity + 1)}
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: '#F5F5F5' }}>
                        <Plus size={10} style={{ color: '#666' }} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold" style={{ color: '#C9A84C' }}>
                        ${(perfume.price * quantity).toFixed(2)}
                      </span>
                      <button onClick={() => removeItem(perfume.id, volume)}
                        style={{ color: '#ddd' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer con total y WhatsApp */}
        {items.length > 0 && (
          <div className="px-6 py-5 space-y-3" style={{ borderTop: '1px solid #F0F0F0' }}>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: '#999' }}>Total estimado</span>
              <span className="text-xl font-semibold" style={{ color: '#1a1a1a' }}>
                ${total.toFixed(2)}
              </span>
            </div>

            <a
              href={`https://wa.me/${WA}?text=${buildMsg(items)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-medium tracking-widest uppercase"
              style={{ background: '#25D366', color: '#fff' }}
            >
              <MessageCircle size={16} />
              Enviar pedido por WhatsApp
            </a>

            <button
              onClick={clearCart}
              className="w-full text-center text-[10px] py-1 tracking-widest uppercase"
              style={{ color: '#ddd' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#bbb' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#ddd' }}
            >
              Vaciar pedido
            </button>
          </div>
        )}
      </div>
    </>
  )
}
