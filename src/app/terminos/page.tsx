import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { POLICY, WHATSAPP_DISPLAY, formatPrice, waLink } from '@/lib/brand'

export const metadata: Metadata = {
  title: 'Términos y condiciones · Velvet Perfumes',
  description: 'Condiciones de compra, anticipo y cancelación de pedidos en Velvet Perfumes.',
}

const UPDATED = '15 de noviembre de 2026'
const EXAMPLE = 1000 // price used in the cancellation example

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 border-t border-line py-10 sm:grid-cols-[120px_1fr] sm:gap-10">
      <span className="display text-3xl italic text-rose">{n}</span>
      <div>
        <h2 className="display text-3xl sm:text-4xl">{title}</h2>
        <div className="mt-5 space-y-4 text-[15px] leading-[1.8] text-ink-soft">{children}</div>
      </div>
    </section>
  )
}

export default function TermsPage() {
  const { depositPct, depositFrom, cancelFeePct } = POLICY
  return (
    <>
      <Header />
      <main className="bg-ivory">
        <div className="mx-auto max-w-4xl px-5 pb-24 pt-16 sm:px-8 sm:pt-24">
          <p className="eyebrow text-rose">Velvet Perfumes</p>
          <h1 className="display mt-5 text-5xl sm:text-7xl">Términos y <em className="text-rose">condiciones</em></h1>
          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-muted">
            Estas condiciones aplican a todos los pedidos hechos a través de nuestro catálogo en línea y de WhatsApp.
            Al enviar un pedido, confirmas que las leíste y las aceptas.
          </p>

          {/* Key terms at a glance */}
          <dl className="mt-12 grid gap-px overflow-hidden rounded-sm bg-line sm:grid-cols-3">
            {[
              { k: 'Anticipo', v: `${depositPct}%`, d: `en fragancias de más de ${formatPrice(depositFrom)}` },
              { k: 'Cancelación', v: `${cancelFeePct}%`, d: 'del precio, retenido del anticipo' },
              { k: 'Productos', v: '100%', d: 'originales y sellados' },
            ].map(x => (
              <div key={x.k} className="bg-paper p-6">
                <dt className="eyebrow text-[9px] text-muted">{x.k}</dt>
                <dd className="display mt-3 text-5xl">{x.v}</dd>
                <dd className="mt-2 text-[13px] text-muted">{x.d}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-16">
            <Section n="01" title="Productos">
              <p>Todas nuestras fragancias son 100% originales. Las fotografías del catálogo son ilustrativas; la presentación del empaque puede variar según el lote del fabricante.</p>
            </Section>

            <Section n="02" title="Precios y disponibilidad">
              <p>Los precios están en pesos mexicanos (MXN) y pueden cambiar sin previo aviso. El precio válido para tu compra es el que te confirmamos por WhatsApp al aceptar tu pedido.</p>
              <p>Las ofertas son por tiempo limitado o hasta agotar existencias. Las fragancias marcadas como <strong className="font-medium text-ink">“Sobre pedido”</strong> están sujetas a confirmación de precio y tiempo de entrega antes de cualquier pago.</p>
            </Section>

            <Section n="03" title="Pedidos y confirmación">
              <p>Los pedidos se envían por WhatsApp desde el catálogo. Recibirlo no garantiza la disponibilidad: te respondemos para confirmar existencias, precio final y entrega.</p>
              <p>Un pedido se considera <strong className="font-medium text-ink">confirmado</strong> cuando te confirmamos la disponibilidad y, en su caso, recibimos el anticipo.</p>
            </Section>

            <Section n="04" title="Anticipo">
              <p>
                Las fragancias con precio mayor a {formatPrice(depositFrom)}
                {POLICY.depositScope === 'sobre-pedido' ? ' que se piden sobre pedido' : ''} requieren un anticipo del{' '}
                <strong className="font-medium text-ink">{depositPct}% de su precio</strong> para confirmar el pedido.
                {POLICY.depositScope === 'todas' && ' Aplica principalmente a los productos sobre pedido, que conseguimos especialmente para ti.'}
              </p>
              <p>El resto se paga al momento de la entrega.</p>
            </Section>

            <Section n="05" title="Cancelaciones">
              <p>
                Puedes cancelar tu pedido avisándonos por WhatsApp. Si cancelas <strong className="font-medium text-ink">después de haber pagado el anticipo</strong>,
                se retiene el <strong className="font-medium text-ink">{cancelFeePct}% del precio del perfume</strong> por concepto de gastos logísticos,
                y se te reembolsa el resto de tu anticipo.
              </p>
              <div className="rounded-sm border border-line bg-paper p-5 text-[14px]">
                <p className="eyebrow mb-3 text-[9px] text-muted">Ejemplo con un perfume de {formatPrice(EXAMPLE)}</p>
                <ul className="space-y-1.5">
                  <li className="flex justify-between gap-4"><span>Anticipo pagado ({depositPct}%)</span><span className="text-ink">{formatPrice(EXAMPLE * depositPct / 100)}</span></li>
                  <li className="flex justify-between gap-4"><span>Retención por cancelación ({cancelFeePct}%)</span><span className="text-ink">− {formatPrice(EXAMPLE * cancelFeePct / 100)}</span></li>
                  <li className="flex justify-between gap-4 border-t border-line pt-2 font-medium text-ink"><span>Se te reembolsa</span><span>{formatPrice(EXAMPLE * (depositPct - cancelFeePct) / 100)}</span></li>
                </ul>
              </div>
              <p>Si cancelas antes de pagar el anticipo, no hay ningún cargo. Si somos nosotros quienes no podemos surtir tu pedido (por ejemplo, porque el proveedor no lo tiene), te reembolsamos el 100% de lo pagado.</p>
            </Section>

            <Section n="06" title="Contacto">
              <p>
                Para pedidos, dudas o cancelaciones escríbenos por WhatsApp al{' '}
                <a href={waLink()} target="_blank" rel="noopener noreferrer" className="text-ink underline underline-offset-4 hover:text-rose">{WHATSAPP_DISPLAY}</a>.
              </p>
            </Section>

            <Section n="07" title="Cambios a estos términos">
              <p>Podemos actualizar estas condiciones. Aplican las vigentes en la fecha en que haces tu pedido.</p>
              <p className="text-[13px] text-muted">Última actualización: {UPDATED}.</p>
            </Section>
          </div>

          <div className="mt-10 flex flex-wrap gap-3 border-t border-line pt-10">
            <Link href="/#coleccion" className="btn btn-ink">Ver colección</Link>
            <a href={waLink('¡Hola! Tengo una duda sobre los términos y condiciones.')} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
              Preguntar por WhatsApp
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
