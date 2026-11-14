import Header from '@/components/Header'

export default function Loading() {
  return (
    <>
      <Header overlay />
      <section className="relative grain flex min-h-[100svh] items-center bg-velvet">
        <div
          className="pointer-events-none absolute -top-1/3 right-[-10%] h-[90vh] w-[90vh] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(closest-side, rgba(122,38,48,0.6), transparent)' }}
        />
        <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="h-3 w-40 rounded-full bg-white/10" />
          <div className="mt-8 space-y-4">
            <div className="h-20 w-3/4 max-w-xl rounded bg-white/[0.06] animate-pulse" />
            <div className="h-20 w-2/3 max-w-lg rounded bg-white/[0.06] animate-pulse" />
            <div className="h-20 w-1/3 max-w-xs rounded bg-white/[0.06] animate-pulse" />
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <div className="grid grid-cols-2 gap-x-3 gap-y-12 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <div className="skeleton aspect-[4/5]" />
              <div className="skeleton mt-4 h-2.5 w-16 rounded-full" />
              <div className="skeleton mt-3 h-5 w-3/4 rounded-full" />
              <div className="skeleton mt-3 h-3 w-1/3 rounded-full" />
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
