import Reveal from '@/components/ui/Reveal'

const ITEMS = [
  { n: '01', t: 'Originales, siempre', d: 'Cada botella es 100% auténtica. Sin imitaciones, sin réplicas, sin excepciones.' },
  { n: '02', t: 'Asesoría olfativa', d: 'Cuéntanos qué te gusta y te recomendamos la fragancia ideal para ti o para regalar.' },
  { n: '03', t: 'Pide en un mensaje', d: 'Arma tu pedido aquí y envíalo por WhatsApp. Sin registros ni formularios.' },
  { n: '04', t: 'Trato directo', d: 'Hablas con una persona real que te acompaña desde la consulta hasta la entrega.' },
]

export default function BrandPromise() {
  return (
    <section id="promesa" className="bg-paper border-t border-line">
      <div className="mx-auto grid max-w-7xl gap-16 px-5 py-24 sm:px-8 sm:py-32 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <p className="eyebrow mb-5 text-rose">Nuestra promesa</p>
          <h2 className="display text-5xl sm:text-6xl lg:text-7xl">
            Una fragancia es <em className="text-rose">lo primero</em> que dicen de ti.
          </h2>
          <p className="mt-8 max-w-sm text-sm leading-relaxed text-muted">
            Por eso cuidamos cada detalle: desde la selección de cada pieza
            hasta el momento en que llega a tus manos.
          </p>
        </Reveal>

        <div className="lg:col-span-6 lg:col-start-7">
          {ITEMS.map((it, i) => (
            <Reveal key={it.n} delay={i * 100}>
              <div className="group grid grid-cols-[auto_1fr] gap-6 border-t border-line py-8 last:border-b sm:gap-10">
                <span className="display pt-1 text-xl italic text-rose transition-transform duration-500 ease-lux group-hover:-translate-y-1">
                  {it.n}
                </span>
                <div>
                  <h3 className="display text-3xl">{it.t}</h3>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">{it.d}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
