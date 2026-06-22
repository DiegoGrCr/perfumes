import Header from '@/components/Header'

function CardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse" style={{ background: '#fff', border: '1px solid #EBEBEB' }}>
      <div style={{ height: 180, background: '#F0F0F0' }} />
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <div className="h-4 w-14 rounded-full" style={{ background: '#EBEBEB' }} />
          <div className="h-4 w-12 rounded-full" style={{ background: '#EBEBEB' }} />
        </div>
        <div className="h-3 w-20 rounded" style={{ background: '#EBEBEB' }} />
        <div className="h-4 w-36 rounded" style={{ background: '#EBEBEB' }} />
        <div className="h-3 w-full rounded" style={{ background: '#EBEBEB' }} />
        <div className="flex justify-between items-center mt-4 pt-3" style={{ borderTop: '1px solid #F5F5F5' }}>
          <div className="h-6 w-16 rounded" style={{ background: '#EBEBEB' }} />
          <div className="h-8 w-16 rounded-full" style={{ background: '#EBEBEB' }} />
        </div>
      </div>
    </div>
  )
}

export default function Loading() {
  return (
    <div style={{ background: '#F8F7F4', minHeight: '100vh' }}>
      <Header />

      {/* Hero skeleton */}
      <section className="animate-pulse" style={{ background: '#fff', borderBottom: '1px solid #EBEBEB' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 flex flex-col items-center gap-4">
          <div className="h-3 w-28 rounded" style={{ background: '#F0F0F0' }} />
          <div className="h-8 w-56 rounded" style={{ background: '#F0F0F0' }} />
          <div className="h-4 w-72 rounded" style={{ background: '#F0F0F0' }} />
          <div className="flex gap-10 mt-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="h-6 w-12 rounded" style={{ background: '#F0F0F0' }} />
                <div className="h-3 w-16 rounded" style={{ background: '#F0F0F0' }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Catalog skeleton */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        <div className="flex gap-0">
          {/* Sidebar skeleton */}
          <aside className="hidden lg:block w-64 xl:w-72 shrink-0 pr-8 pt-8 animate-pulse" style={{ borderRight: '1px solid #EBEBEB' }}>
            {[80, 60, 72, 48].map((w, i) => (
              <div key={i} className="mb-4 h-4 rounded" style={{ width: w, background: '#F0F0F0' }} />
            ))}
          </aside>
          {/* Grid skeleton */}
          <main className="flex-1 min-w-0 pt-8 lg:pl-8">
            <div className="h-7 w-48 rounded mb-2 animate-pulse" style={{ background: '#F0F0F0' }} />
            <div className="h-3 w-32 rounded mb-8 animate-pulse" style={{ background: '#F0F0F0' }} />
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {Array.from({ length: 10 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          </main>
        </div>
      </section>
    </div>
  )
}
