export default function BrandMarquee({ brands }: { brands: string[] }) {
  if (brands.length === 0) return null
  // Repeat until the row is long enough, then duplicate for a seamless loop
  const base = brands.length < 8 ? [...brands, ...brands, ...brands] : brands
  const row = [...base, ...base]

  return (
    <div className="marquee relative overflow-hidden border-y border-line bg-paper py-7" aria-label="Casas disponibles">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-paper to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-paper to-transparent" />
      <div className="marquee-track items-center">
        {row.map((b, i) => (
          <span key={i} className="flex items-center" aria-hidden={i >= base.length}>
            <span className="display whitespace-nowrap px-8 text-3xl italic text-ink/70 transition-colors duration-500 hover:text-rose sm:text-4xl">
              {b}
            </span>
            <span className="text-[8px] text-rose">✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}
