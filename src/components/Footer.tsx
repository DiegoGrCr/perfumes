import Link from 'next/link'
import { ArrowUpRight, MessageCircle } from 'lucide-react'
import { waLink } from '@/lib/brand'

export default function Footer() {
  return (
    <footer className="relative grain overflow-hidden bg-velvet text-ivory">
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, #4A1A1F, transparent)' }}
      />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 pt-20 pb-10">
        {/* Big CTA */}
        <div className="flex flex-col items-start gap-8 border-b border-white/10 pb-16 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow text-rose-light mb-5">Asesoría personalizada</p>
            <h2 className="display text-5xl sm:text-6xl lg:text-7xl max-w-2xl">
              ¿No sabes cuál elegir?{' '}
              <em className="whitespace-nowrap text-rose-light">Te guiamos.</em>
            </h2>
          </div>
          <a
            href={waLink('¡Hola! Me gustaría asesoría para elegir una fragancia.')}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-rose shrink-0"
          >
            <MessageCircle size={15} /> Escríbenos
          </a>
        </div>

        <div className="grid gap-12 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-light.png" alt="Velvet Perfumes" className="h-12 w-auto" />
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-ivory/55">
              Fragancias árabes y de diseñador. Seleccionadas una a una,
              100% originales.
            </p>
          </div>

          <div>
            <p className="eyebrow text-ivory/40 mb-5">Explorar</p>
            <ul className="space-y-3 text-sm text-ivory/75">
              <li><Link href="/#coleccion" className="link-underline">Toda la colección</Link></li>
              <li><Link href="/ofertas" className="link-underline">Ofertas activas</Link></li>
              <li><Link href="/#familias" className="link-underline">Familias olfativas</Link></li>
              <li><Link href="/#promesa" className="link-underline">Nuestra promesa</Link></li>
            </ul>
          </div>

          <div>
            <p className="eyebrow text-ivory/40 mb-5">Contacto</p>
            <a
              href={waLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 text-sm text-ivory/75 hover:text-rose-light transition-colors"
            >
              WhatsApp
              <ArrowUpRight size={14} className="transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 pt-8 text-[10px] uppercase tracking-[0.3em] text-ivory/35 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} Velvet Perfumes</span>
          <span>Fragancias auténticas</span>
        </div>
      </div>
    </footer>
  )
}
